# OpenSearch Serverless Index Setup

Terraform can create the OpenSearch Serverless **collection**
(`terraform/backend/opensearch.tf`), but it cannot create the **index**
inside it — specifically the k-NN vector field mapping that
`backend/src/shared/vector_store.py` depends on. That has to be done once,
after the collection exists, via the OpenSearch REST API.

## When to run this

Once, after the first `terraform apply` creates the collection — before
any document upload happens (the ingestion worker will fail to index
chunks against a collection with no index).

## How

```bash
cd backend/scripts
pip install boto3 opensearch-py requests-aws4auth --break-system-packages

# Option A: reads the endpoint straight from terraform output
python3 setup_opensearch_index.py --auto

# Option B: pass the endpoint explicitly
python3 setup_opensearch_index.py --endpoint https://xxxxxx.eu-west-1.aoss.amazonaws.com
```

Run this using credentials for a principal with `aoss:*` permission on the
collection — the same principal listed in the data access policy
(`aws_opensearchserverless_access_policy.data` in `opensearch.tf`), which
by default includes whoever runs `terraform apply`.

The script is safe to re-run: if the index already exists, it does nothing
unless you pass `--force` (which deletes and recreates it — **this
permanently discards every chunk indexed so far**, meaning every approved
document would need to go through re-ingestion to be searchable again).

## If you change the embedding model

`--dimensions` defaults to 1024 (Titan Text Embeddings V2). If you ever
change `bedrock_embedding_model_id` in `terraform/backend/variables.tf` to
a different model, three things need to stay in sync or search will
silently return nothing:

1. `terraform/backend/variables.tf` -> `embedding_dimensions`
2. This script's `--dimensions` flag (or its default)
3. The actual vector size the new model produces

Run the script with `--force --dimensions <new_size>` after changing the
model, and re-approve documents so they get re-ingested with the new
embedding size.

## Why this isn't automated in Terraform

As of this writing, the AWS provider's OpenSearch Serverless resources
cover the collection and its policies, but not index/mapping management —
that's a data-plane operation, not a control-plane one, and needs the
OpenSearch client libraries rather than the AWS API. A future improvement
would be wrapping this script in a Lambda-backed custom resource or a
`null_resource` with `local-exec`, so `terraform apply` alone is
sufficient end to end.