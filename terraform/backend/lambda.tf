############################################################
# AWS Lambda — one function per API endpoint, plus the S3-triggered
# ingestion worker (ARCHITECTURE.md section 5)
############################################################
# Every Lambda shares the same runtime/timeout/environment-variable shape,
# so this file uses a `for_each` over a map instead of repeating a near-
# identical resource block 12 times. The map's keys become both the
# Terraform resource key and the Lambda function name suffix; the values
# point at where that function's source lives under backend/src/.

locals {
  lambda_runtime = "python3.12"
  lambda_timeout = 60
  lambda_memory  = 256

  # Common env vars every function gets, regardless of what it does —
  # simpler than only injecting what each one strictly needs, and none of
  # these are secret (they're resource identifiers, not credentials).
  common_env = {
    TABLE_NAME                 = aws_dynamodb_table.app.name
    DOCUMENT_BUCKET            = aws_s3_bucket.documents.id
    OPENSEARCH_ENDPOINT        = aws_opensearchserverless_collection.vectors.collection_endpoint
    BEDROCK_MODEL_ID           = var.bedrock_generation_model_id
    BEDROCK_EMBEDDING_MODEL_ID = var.bedrock_embedding_model_id
    AI_PROVIDER                 = var.ai_provider
    GEMINI_API_KEY_SECRET_ARN   = aws_secretsmanager_secret.gemini_api_key.arn
  }

  # source_dir must match the backend/src/ folder path for each function.
  # This map is also the single source of truth that api_gateway.tf reads
  # from to know which Lambda backs which route.
  lambda_functions = {
    documents_upload  = { source_dir = "documents/upload" }
    documents_list    = { source_dir = "documents/list" }
    documents_get     = { source_dir = "documents/get" }
    documents_delete  = { source_dir = "documents/delete" }
    documents_approve = { source_dir = "documents/approve" }

    chat_create_session = { source_dir = "chat/create_session" }
    chat_send_message   = { source_dir = "chat/send_message" }
    chat_get_sessions   = { source_dir = "chat/get_sessions" }
    chat_get_messages   = { source_dir = "chat/get_messages" }
    chat_get_message    = { source_dir = "chat/get_message" }

    feedback_submit = { source_dir = "feedback/submit" }
  }
}

# Packaging: the CI/CD pipeline (.github/workflows/deploy.yml) copies each
# function's handler.py + the shared/ modules it needs into
# backend/build/<function>/ before `terraform apply` runs. These
# archive_file data sources just zip whatever's sitting in that directory.
data "archive_file" "api_lambda" {
  for_each = local.lambda_functions

  type        = "zip"
  source_dir  = "${path.module}/../../backend/build/${each.key}"
  output_path = "${path.module}/../../backend/build/${each.key}.zip"
}

resource "aws_lambda_function" "api" {
  for_each = local.lambda_functions

  function_name    = "${var.project_name}-${replace(each.key, "_", "-")}-${var.environment}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = local.lambda_runtime
  timeout          = local.lambda_timeout
  memory_size      = local.lambda_memory
  filename         = data.archive_file.api_lambda[each.key].output_path
  source_code_hash = data.archive_file.api_lambda[each.key].output_base64sha256

  environment {
    variables = local.common_env
  }
}

# ---------------------------------------------------------------------------
# Ingestion worker — separate from the map above because it's triggered by
# an S3 event, not an API Gateway route, and needs extra packaged
# dependencies (pypdf, python-docx) that the lightweight API handlers don't.
# ---------------------------------------------------------------------------

data "archive_file" "ingestion_processor" {
  type        = "zip"
  source_dir  = "${path.module}/../../backend/build/ingestion_processor"
  output_path = "${path.module}/../../backend/build/ingestion_processor.zip"
}

resource "aws_lambda_function" "ingestion_processor" {
  function_name    = "${var.project_name}-ingestion-processor-${var.environment}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = local.lambda_runtime
  timeout          = 60  # PDF text extraction + embedding many chunks takes longer than a simple CRUD call
  memory_size      = 512 # PDF parsing libraries need more headroom than the API handlers
  filename         = data.archive_file.ingestion_processor.output_path
  source_code_hash = data.archive_file.ingestion_processor.output_base64sha256

  environment {
    variables = local.common_env
  }
}
