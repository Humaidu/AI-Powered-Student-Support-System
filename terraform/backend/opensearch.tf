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

locals {
  # OpenSearch Serverless collection/policy names are capped at 32
  # characters — unlike almost every other resource in this project, we
  # can't just use "${var.project_name}-something-${var.environment}"
  # directly, since a longer project_name (e.g. "hypervisor-student-
  # support") blows past that limit immediately. This truncates
  # project_name to at most 15 characters before appending a short
  # suffix, keeping every name comfortably under 32 regardless of how
  # long project_name or environment are.
  #
  # Also computed once here (rather than repeating the interpolation in
  # every policy's Resource field) so the collection name can never drift
  # between the policies and the collection resource itself.
  aoss_prefix     = length(var.project_name) > 15 ? substr(var.project_name, 0, 15) : var.project_name
  collection_name = "${local.aoss_prefix}-vec-${var.environment}"
}

resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "${local.aoss_prefix}-enc-${var.environment}"
  type = "encryption"

  policy = jsonencode({
    Rules = [
      {
        ResourceType = "collection"
        Resource     = ["collection/${local.collection_name}"]
      }
    ]
    AWSOwnedKey = true
  })
}

resource "aws_opensearchserverless_security_policy" "network" {
  name = "${local.aoss_prefix}-net-${var.environment}"
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
          Resource     = ["collection/${local.collection_name}"]
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
  name = "${local.aoss_prefix}-data-${var.environment}"
  type = "data"

  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "index"
          Resource     = ["index/${local.collection_name}/*"]
          Permission   = ["aoss:*"]
        },
        {
          ResourceType = "collection"
          Resource     = ["collection/${local.collection_name}"]
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
  name = local.collection_name
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
