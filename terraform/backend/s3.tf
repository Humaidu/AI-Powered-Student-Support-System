############################################################
# Amazon S3 — document storage (ARCHITECTURE.md section 16 + 17)
############################################################
# Admins never send raw files through API Gateway/Lambda — they PUT
# directly to this bucket using a pre-signed URL that documents/upload/
# handler.py generates. That keeps large files (up to 25MB) off the
# Lambda invocation path entirely, which both avoids payload-size limits
# and keeps Lambda memory usage down (section 17's stated benefits).

resource "aws_s3_bucket" "documents" {
  bucket = "${var.project_name}-documents-${var.environment}-${data.aws_caller_identity.current.account_id}"
  # account id suffix guarantees global bucket-name uniqueness without
  # needing a random suffix resource
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning backs the "VERSION#<n>" pattern in the DynamoDB schema —
# re-uploading a document under a new version keeps the old S3 object
# retrievable rather than silently overwriting it.
resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

# SSE-KMS encryption at rest, per ARCHITECTURE.md section 17.
resource "aws_kms_key" "documents" {
  description             = "Encrypts the ${var.project_name} documents bucket"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.documents.arn
    }
    bucket_key_enabled = true
  }
}

# CORS is required because the browser uploads directly to S3 using the
# pre-signed URL — without this, the PUT request from the admin's browser
# would be blocked by the browser's same-origin policy.
resource "aws_s3_bucket_cors_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = ["*"] # tighten to the deployed frontend origin once known
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}

# S3 -> Lambda event notification: every time a file lands under
# documents/, the ingestion worker Lambda fires automatically. This is
# what turns "file uploaded" into "file processed and searchable" without
# any polling or manual trigger.
resource "aws_s3_bucket_notification" "documents" {
  bucket = aws_s3_bucket.documents.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.ingestion_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "documents/"
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke_ingestion]
}

# S3 needs explicit permission to invoke the Lambda — without this, the
# notification above would silently fail to trigger anything.
resource "aws_lambda_permission" "allow_s3_invoke_ingestion" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingestion_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.documents.arn
}
