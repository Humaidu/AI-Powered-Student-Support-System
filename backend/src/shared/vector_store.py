"""
Amazon OpenSearch Serverless (vector search collection) stores document
chunks + their embeddings (ARCHITECTURE.md section 14). We talk to it over
its HTTPS data-plane endpoint, signed with SigV4 using the Lambda's own
execution-role credentials — no separate username/password to manage.
"""
import os
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

_INDEX_NAME = "document-chunks"


def _client() -> OpenSearch:
    endpoint = os.environ["OPENSEARCH_ENDPOINT"].replace("https://", "")
    region = os.environ.get("AWS_REGION", "us-east-1")
    credentials = boto3.Session().get_credentials()
    auth = AWSV4SignerAuth(credentials, region, "aoss")  # "aoss" = OpenSearch Serverless service code

    return OpenSearch(
        hosts=[{"host": endpoint, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=10,
        timeout=30
    )

 
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
    client.bulk(body=bulk_body)
 
    return len(hits)

def index_chunk(chunk_id: str, document_id: str, content: str, embedding: list, metadata: dict) -> None:
    """Called by the ingestion worker for every chunk of a processed document."""
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


def search(query_embedding: list, top_k: int = 5) -> list[dict]:
    """k-NN search for the most relevant chunks to a question's embedding.
    Called by chat/send_message/handler.py on every student question."""
    response = _client().search(
        index=_INDEX_NAME,
        body={
            "size": top_k,
            "query": {
                "knn": {
                    "embedding": {
                        "vector": query_embedding,
                        "k": top_k,
                    }
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
