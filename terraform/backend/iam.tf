############################################################
# IAM — who's allowed to do what
############################################################
# Two roles live here:
#   1. github_actions_deploy — assumed by the CI/CD pipeline to run
#      `terraform apply`. No long-lived AWS keys are stored in GitHub at
#      all; GitHub's own OIDC token is exchanged for short-lived AWS
#      credentials at deploy time.
#   2. lambda_exec — assumed by every Lambda function at runtime. One
#      shared role across all 12 functions keeps this file readable; the
#      trade-off is that every Lambda technically *could* touch every
#      permission below, even ones it doesn't use (e.g. the feedback
#      Lambda could technically call Bedrock, even though its code never
#      does). Splitting into a role per Lambda is the natural next step
#      once the team wants tighter blast-radius control — until then,
#      this role is still scoped to only the resources this application
#      owns (this DynamoDB table, this bucket, these Bedrock models, this
#      OpenSearch collection), not account-wide access.

# ---------------------------------------------------------------------------
# 1. GitHub Actions OIDC — lets CI/CD assume an AWS role with zero stored
#    credentials. GitHub proves "this run really is coming from
#    <org>/<repo>" via a signed token; AWS trusts that signature because of
#    the OIDC provider registered below.
# ---------------------------------------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"] # GitHub's OIDC TLS cert thumbprint — AWS requires this for provider setup
}

data "aws_iam_policy_document" "github_oidc_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    # "aud" (audience) must always be sts.amazonaws.com for this flow.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # "sub" (subject) restricts this to ONE specific repo and branch —
    # without this, any GitHub Actions workflow anywhere could assume this
    # role just by presenting a valid GitHub-issued token.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${var.project_name}-gha-deploy-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.github_oidc_trust.json
}

# PowerUserAccess is broad — reasonable for a student project standing up
# new infrastructure regularly (Lambda, API Gateway, DynamoDB, S3, Cognito,
# OpenSearch, IAM-adjacent resources for the roles in this file). Scope
# this down to an explicit allow-list of services once the infrastructure
# stabilizes and stops changing shape every sprint.
resource "aws_iam_role_policy_attachment" "github_actions_power_user" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

# ---------------------------------------------------------------------------
# 2. Lambda execution role — assumed by every one of our 12 Lambda
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
