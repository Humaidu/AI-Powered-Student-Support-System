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

variable "bedrock_generation_model_id" {
  description = "Bedrock model ID used to generate chat answers"
  type        = string
  default     = "anthropic.claude-3-sonnet-20240229-v1:0"
}

variable "bedrock_embedding_model_id" {
  description = "Bedrock model ID used to generate text embeddings for RAG search"
  type        = string
  default     = "amazon.titan-embed-text-v2:0"
}

variable "embedding_dimensions" {
  description = "Vector size produced by the embedding model — must match the model exactly, or OpenSearch k-NN search will silently return nothing. Titan Text Embeddings V2 defaults to 1024. NOTE: if ai_provider=\"gemini\", this should be 768 instead (see ai_provider description) — this variable is NOT automatically synced with that switch, since it also drives the OpenSearch index setup script run separately."
  type        = number
  default     = 1024
}

variable "ai_provider" {
  description = "TEMPORARY. \"bedrock\" (the locked architecture's actual provider) or \"gemini\" "
  type        = string
  default     = "bedrock"
  validation {
    condition     = contains(["bedrock", "gemini"], var.ai_provider)
    error_message = "ai_provider must be either \"bedrock\" or \"gemini\"."
  }
}

variable "log_retention_days" {
  description = "How long CloudWatch keeps Lambda/API Gateway logs before auto-deleting them (cost control)"
  type        = number
  default     = 14
}
