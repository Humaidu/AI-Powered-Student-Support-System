#!/usr/bin/env python3
"""
Creates the k-NN vector index in the OpenSearch Serverless collection.

Terraform can create the *collection* (terraform/backend/opensearch.tf) but
not the *index* inside it — that's a data-plane operation, not something
the AWS provider's control-plane resources cover. Run this once, after
`terraform apply` has created the collection and before the first document
is uploaded (the ingestion worker will fail to index chunks against a
collection with no index).

Usage:
    python3 setup_opensearch_index.py --endpoint <collection_endpoint>
    python3 setup_opensearch_index.py --auto   # reads the endpoint from terraform output

Requires AWS credentials with aoss:* permission on the collection (the
same principal listed in the data access policy — see
terraform/backend/opensearch.tf's aws_opensearchserverless_access_policy).
"""
import argparse
import subprocess
import sys

try:
    import boto3
    from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install boto3 opensearch-py requests-aws4auth")
    sys.exit(1)

INDEX_NAME = "document-chunks"


def get_endpoint_from_terraform() -> str:
    """Reads the opensearch_endpoint output from terraform/backend, so you
    don't have to copy/paste it by hand."""
    try:
        result = subprocess.run(
            ["terraform", "-chdir=../../terraform/backend", "output", "-raw", "opensearch_endpoint"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as exc:
        print("Could not read opensearch_endpoint from terraform output.")
        print("Run this script from backend/scripts/, or pass --endpoint explicitly.")
        print(exc.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print("terraform CLI not found. Pass --endpoint explicitly instead of --auto.")
        sys.exit(1)


def build_client(endpoint: str, region: str) -> OpenSearch:
    host = endpoint.replace("https://", "").replace("http://", "")
    credentials = boto3.Session().get_credentials()
    if credentials is None:
        print("No AWS credentials found. Configure them (aws configure / env vars / SSO) and try again.")
        sys.exit(1)

    auth = AWSV4SignerAuth(credentials, region, "aoss")  # "aoss" = OpenSearch Serverless service code
    return OpenSearch(
        hosts=[{"host": host, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
    )


def create_index(client: OpenSearch, dimensions: int, force: bool) -> None:
    if client.indices.exists(index=INDEX_NAME):
        if not force:
            print(f"Index '{INDEX_NAME}' already exists. Nothing to do.")
            print("Pass --force to delete and recreate it (this permanently discards all indexed chunks).")
            return
        print(f"--force given: deleting existing index '{INDEX_NAME}'...")
        client.indices.delete(index=INDEX_NAME)

    print(f"Creating index '{INDEX_NAME}' with {dimensions}-dimension vectors...")
    client.indices.create(
        index=INDEX_NAME,
        body={
            "settings": {"index.knn": True},
            "mappings": {
                "properties": {
                    "chunkId": {"type": "keyword"},
                    "documentId": {"type": "keyword"},
                    "content": {"type": "text"},
                    "embedding": {
                        "type": "knn_vector",
                        "dimension": dimensions,
                        "method": {
                            "name": "hnsw",
                            "engine": "nmslib",
                            "space_type": "cosinesimil",
                        },
                    },
                    "metadata": {"type": "object"},
                }
            },
        },
    )
    print(f"Index '{INDEX_NAME}' created successfully.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--endpoint", help="OpenSearch Serverless collection endpoint (with or without https://)")
    parser.add_argument("--auto", action="store_true", help="Read the endpoint from `terraform output` instead of passing it manually")
    parser.add_argument("--region", default="us-east-1", help="AWS region the collection is in (default: us-east-1)")
    parser.add_argument("--dimensions", type=int, default=1024, help="Embedding vector size — must match embedding_dimensions in terraform/backend/variables.tf (default: 1024, for Titan Text Embeddings V2)")
    parser.add_argument("--force", action="store_true", help="Delete and recreate the index if it already exists (DESTROYS existing indexed chunks)")
    args = parser.parse_args()

    if not args.endpoint and not args.auto:
        parser.error("Pass either --endpoint <url> or --auto")

    endpoint = args.endpoint or get_endpoint_from_terraform()
    print(f"Target collection endpoint: {endpoint}")
    print(f"Region: {args.region}")

    client = build_client(endpoint, args.region)
    create_index(client, args.dimensions, args.force)


if __name__ == "__main__":
    main()