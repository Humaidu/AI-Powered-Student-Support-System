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
    region = os.environ.get("AWS_REGION", "eu-west-1")
    credentials = boto3.Session().get_credentials()
    auth = AWSV4SignerAuth(credentials, region, "aoss")  # "aoss" = OpenSearch Serverless service code

    return OpenSearch(
        hosts=[{"host": endpoint, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=10,
    )


def index_chunk(chunk_id: str, document_id: str, content: str, embedding: list, metadata: dict) -> None:
    """Called by the ingestion worker for every chunk of a processed document."""
    _client().index(
        index=_INDEX_NAME,
        id=chunk_id,
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
