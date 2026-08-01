"""
Amazon OpenSearch Serverless (vector search collection) stores document
chunks + their embeddings (ARCHITECTURE.md section 14). We talk to it over
its HTTPS data-plane endpoint, signed with SigV4 using the Lambda's own
execution-role credentials — no separate username/password to manage.
"""
import logging
import os
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

logger = logging.getLogger()
logger.setLevel(logging.INFO)

_INDEX_NAME = "document-chunks"


def _log_bulk_errors(response: dict, context: str) -> None:
    """A bulk response's top-level HTTP status can be 200 even when
    individual items inside it failed — bulk operations are
    all-attempted, not all-or-nothing. Without checking response["errors"]
    explicitly, a partial failure here is completely silent: no exception,
    no log, just some chunks quietly not actually updated/deleted while
    the caller believes the whole batch succeeded."""
    if response.get("errors"):
        failed_items = [
            item for action in response.get("items", [])
            for item in action.values()
            if item.get("error")
        ]
        logger.error("Bulk operation had %d failed item(s) in %s: %s", len(failed_items), context, failed_items[:3])

# Module-level singleton — built once per Lambda execution environment,
# reused across every warm invocation. Building a fresh OpenSearch client
# per call (the previous behavior) re-does connection pool setup and SigV4
# credential resolution on every single request, which is wasted work
# Lambda's warm-start reuse model is specifically meant to let us skip.
_os_client: OpenSearch | None = None


def _client() -> OpenSearch:
    global _os_client
    if _os_client is not None:
        return _os_client

    endpoint = os.environ["OPENSEARCH_ENDPOINT"].replace("https://", "")
    region = os.environ.get("AWS_REGION", "us-east-1")
    credentials = boto3.Session().get_credentials()
    auth = AWSV4SignerAuth(credentials, region, "aoss")  # "aoss" = OpenSearch Serverless service code

    _os_client = OpenSearch(
        hosts=[{"host": endpoint, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=10,
        timeout=30,
    )
    return _os_client


def delete_chunks_for_document(document_id: str) -> int:
    """Deletes every previously-indexed chunk for a document. Called by the
    ingestion worker at the START of processing (see
    ingestion/processor/handler.py), so re-ingesting the same document
    (e.g. after a retry, or a future re-upload flow) doesn't accumulate
    duplicate chunks alongside the old ones.

    Returns the number of chunks deleted.

    """
    client = _client()

    response = client.search(
        index=_INDEX_NAME,
        body={
            "size": 1000,  # generous — a single small document won't have anywhere near this many chunks
            "query": {"term": {"documentId": document_id}},
            "_source": False,  # only need the _id, not the full document body
        },
    )
    hits = response.get("hits", {}).get("hits", [])
    if not hits:
        return 0

    bulk_body = []
    for hit in hits:
        bulk_body.append({"delete": {"_index": _INDEX_NAME, "_id": hit["_id"]}})
    response = client.bulk(body=bulk_body)
    _log_bulk_errors(response, f"delete_chunks_for_document(documentId={document_id})")

    return len(hits)


def index_chunk(chunk_id: str, document_id: str, content: str, embedding: list, metadata: dict) -> None:
    """Called by the ingestion worker for every chunk of a processed document.
    """
    _client().index(
        index=_INDEX_NAME,
        body={
            "chunkId": chunk_id,
            "documentId": document_id,
            "content": content,
            "embedding": embedding,
            "metadata": metadata,
        },
    )


def update_chunks_approval_status(document_id: str, approval_status: str) -> int:
    """Updates metadata.approvalStatus on every chunk belonging to a
    document. Called by documents/approve/handler.py after updating
    DynamoDB — the DynamoDB record and the OpenSearch chunks each track
    approval status independently (DynamoDB for the API to read back,
    OpenSearch's copy is what search() actually filters on), and both need
    updating for approval to actually take effect end-to-end. Returns the
    number of chunks updated.
    """
    client = _client()

    response = client.search(
        index=_INDEX_NAME,
        body={
            "size": 1000,
            "query": {"term": {"documentId": document_id}},
            "_source": False,
        },
    )
    hits = response.get("hits", {}).get("hits", [])
    if not hits:
        return 0

    bulk_body = []
    for hit in hits:
        bulk_body.append({"update": {"_index": _INDEX_NAME, "_id": hit["_id"]}})
        bulk_body.append({"doc": {"metadata": {"approvalStatus": approval_status}}})
    response = client.bulk(body=bulk_body)
    _log_bulk_errors(response, f"update_chunks_approval_status(documentId={document_id}, status={approval_status})")

    return len(hits)


def search(query_embedding: list, top_k: int = 5) -> list[dict]:
    """k-NN search for the most relevant chunks to a question's embedding.
    Called by chat/send_message/handler.py on every student question.

    Filtered to only APPROVED chunks — without this filter, a document
    still sitting in PENDING_REVIEW (or a REJECTED one) would already be
    searchable and answerable the moment ingestion completes, entirely
    bypassing the admin approval step that's supposed to gate what
    students can be told."""
    response = _client().search(
        index=_INDEX_NAME,
        body={
            "size": top_k,
            "query": {
                "bool": {
                    "must": {
                        "knn": {
                            "embedding": {
                                "vector": query_embedding,
                                "k": top_k,
                            }
                        }
                    },
                    "filter": {
                        "term": {"metadata.approvalStatus.keyword": "APPROVED"}
                    },
                }
            },
        },
    )
    hits = response.get("hits", {}).get("hits", [])
    return [
        {
            "chunkId": hit["_source"]["chunkId"],
            "documentId": hit["_source"]["documentId"],
            "content": hit["_source"]["content"],
            "pageNumber": hit["_source"].get("metadata", {}).get("pageNumber"),
            "score": hit["_score"],
        }
        for hit in hits
    ]