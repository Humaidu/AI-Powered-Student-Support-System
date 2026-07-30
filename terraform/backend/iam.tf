############################################################
# IAM — who's allowed to do what
############################################################
#   lambda_exec — assumed by every Lambda function at runtime. One
#      shared role across all 12 functions keeps this file readable; the
#      trade-off is that every Lambda technically *could* touch every
#      permission below, even ones it doesn't use (e.g. the feedback
#      Lambda could technically call Bedrock, even though its code never
#      does). Splitting into a role per Lambda is the natural next step
#      once the team wants tighter blast-radius control — until then,
#      this role is still scoped to only the resources this application
#      owns (this DynamoDB table, this bucket, these Bedrock models, this
#      OpenSearch collection), not account-wide access.

#-------------------------------------------------------------------------
# Lambda execution role — assumed by every one of our 12 Lambda
#    functions at invocation time.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "${var.project_name}-lambda-exec-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_permissions" {
  # Full read/write on our one DynamoDB table (+ both its GSIs) — every
  # handler reads/writes some part of the single-table schema.
  statement {
    sid    = "DynamoDBAccess"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
    ]
    resources = [
      aws_dynamodb_table.app.arn,
      "${aws_dynamodb_table.app.arn}/index/*",
    ]
  }

  # S3: generate pre-signed upload URLs, read files for text extraction,
  # delete on document removal. Scoped to only the documents/ prefix in
  # our bucket, not the whole account's S3.
  statement {
    sid    = "S3DocumentAccess"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.documents.arn}/documents/*"]
  }

  # KMS: needed alongside S3 access above, since the bucket enforces
  # SSE-KMS encryption — without this, S3 reads/writes would fail even
  # with the S3 permissions granted above.
  statement {
    sid    = "KMSForDocumentEncryption"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
    ]
    resources = [aws_kms_key.documents.arn]
  }

  # Bedrock: only the two specific models this app uses (generation +
  # embeddings) — not "any model in the account", which would let a bug or
  # a compromised function rack up cost calling arbitrary models.
  statement {
    sid     = "BedrockInvoke"
    effect  = "Allow"
    actions = ["bedrock:InvokeModel"]
    resources = [
      "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_generation_model_id}",
      "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_embedding_model_id}",
    ]
  }

  # OpenSearch Serverless data-plane access (index + search vectors).
  # Scoped to just our one collection via the ARN pattern.
  statement {
    sid       = "OpenSearchServerlessAccess"
    effect    = "Allow"
    actions   = ["aoss:APIAccessAll"]
    resources = [aws_opensearchserverless_collection.vectors.arn]
  }

  # CloudWatch Logs — every Lambda needs this to write its own log
  # stream; without it, invocations still run but nothing is recorded.
  statement {
    sid    = "Logging"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"]
  }
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name   = "${var.project_name}-lambda-permissions-${var.environment}"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_permissions.json
}
