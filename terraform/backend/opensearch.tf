############################################################
# Amazon OpenSearch Serverless — vector search (ARCHITECTURE.md section 14)
############################################################
# Serverless (rather than a provisioned OpenSearch domain) means no cluster
# sizing decisions and no idle-capacity cost — it scales with query volume,
# which fits a project without a track record of production traffic yet.
#
# OpenSearch Serverless requires three separate policies before a
# collection will even come up: encryption, network, and data access. All
# three are created here, scoped as tightly as this MVP allows.

resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "${var.project_name}-encryption-${var.environment}"
  type = "encryption"

  policy = jsonencode({
    Rules = [
      {
        ResourceType = "collection"
        Resource     = ["collection/${var.project_name}-vectors-${var.environment}"]
      }
    ]
    AWSOwnedKey = true
  })
}

resource "aws_opensearchserverless_security_policy" "network" {
  name = "${var.project_name}-network-${var.environment}"
  type = "network"

  # AllowFromPublic=true keeps this simple for the MVP (Lambda calls the
  # public data-plane endpoint over HTTPS, authenticated via SigV4 — see
  # backend/src/shared/vector_store.py). Locking this to a VPC endpoint is
  # a natural next step once the platform needs stricter network isolation,
  # at the cost of adding a NAT/VPC endpoint to the Lambda's networking.
  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "collection"
          Resource     = ["collection/${var.project_name}-vectors-${var.environment}"]
        }
      ]
      AllowFromPublic = true
    }
  ])
}

# Controls *who* (which IAM principal) can read/write data in the
# collection — this is what actually grants the Lambda execution role
# permission to index and search vectors, separate from network reachability.
resource "aws_opensearchserverless_access_policy" "data" {
  name = "${var.project_name}-data-access-${var.environment}"
  type = "data"

  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "index"
          Resource     = ["index/${var.project_name}-vectors-${var.environment}/*"]
          Permission   = ["aoss:*"]
        },
        {
          ResourceType = "collection"
          Resource     = ["collection/${var.project_name}-vectors-${var.environment}"]
          Permission   = ["aoss:*"]
        }
      ]
      Principal = [
        aws_iam_role.lambda_exec.arn,
        data.aws_caller_identity.current.arn, # lets the applying user/role manage the index too (e.g. to create it initially)
      ]
    }
  ])
}

resource "aws_opensearchserverless_collection" "vectors" {
  name = "${var.project_name}-vectors-${var.environment}"
  type = "VECTORSEARCH"

  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network,
  ]
}

# Note: OpenSearch Serverless doesn't let Terraform create the actual
# k-NN index (with its vector field mapping/dimensions) via a native
# resource — that has to be done once via the OpenSearch REST API after
# the collection exists (e.g. a one-time script, or a local-exec
# provisioner). See docs/opensearch-index-setup.md (to be added) for the
# index mapping that matches backend/src/shared/vector_store.py's
# expected field names (embedding, content, documentId, chunkId, metadata).
