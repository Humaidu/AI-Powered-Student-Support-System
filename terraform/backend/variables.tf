############################################################
# Input variables — the knobs this module exposes
############################################################
# None of these have hardcoded values baked into resource blocks below;
# every environment-specific value flows through here, so the same
# Terraform code can stand up a "dev" and a "prod" copy of the platform
# just by passing different variable values.

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used when naming every resource, so they're all identifiable at a glance in the AWS console"
  type        = string
  default     = "hypervisor-student-support"
}

variable "environment" {
  description = "Deployment environment name (dev/staging/prod) — appended to resource names"
  type        = string
  default     = "dev"
}

variable "github_org" {
  description = "GitHub org or username that owns this repo — used to restrict which repo can assume the CI/CD deploy role"
  type        = string
  default = "Humaidu"
}

variable "github_repo" {
  description = "GitHub repo name — used together with github_org to scope the OIDC trust policy"
  type        = string
  default = "AI-Powered-Student-Support-System"
}

variable "bedrock_generation_model_id" {
  description = "Bedrock model ID used to generate chat answers"
  type        = string
  default     = "anthropic.claude-3-5-sonnet-20240620-v1:0"
}

variable "bedrock_embedding_model_id" {
  description = "Bedrock model ID used to generate text embeddings for RAG search"
  type        = string
  default     = "amazon.titan-embed-text-v2:0"
}

variable "embedding_dimensions" {
  description = "Vector size produced by the embedding model — must match the model exactly, or OpenSearch k-NN search will silently return nothing. Titan Text Embeddings V2 defaults to 1024."
  type        = number
  default     = 1024
}

variable "log_retention_days" {
  description = "How long CloudWatch keeps Lambda/API Gateway logs before auto-deleting them (cost control)"
  type        = number
  default     = 14
}
