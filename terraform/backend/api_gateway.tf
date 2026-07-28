############################################################
# Amazon API Gateway — HTTP API, base path /api/v1
############################################################
# This wires every route the frontend team specified to its matching
# Lambda, and attaches a Cognito JWT authorizer so API Gateway rejects
# unauthenticated/invalid-token requests before they ever reach a Lambda.
# (Handlers still re-check the caller's role for admin-only actions — see
# backend/src/shared/auth.py — because "is this a valid token" and "is
# this specific action allowed for this role" are different questions.)

resource "aws_apigatewayv2_api" "this" {
  name          = "${var.project_name}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"] # tighten to the deployed frontend origin once known
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      integrationErr = "$context.integrationErrorMessage"
      responseLength = "$context.responseLength"
      requestTime    = "$context.requestTime"
    })
  }
}

# ---------------------------------------------------------------------------
# Cognito JWT authorizer — validates the Authorization: Bearer <token>
# header on every protected route against our user pool. This is what
# turns a Cognito login into "requestContext.authorizer.jwt.claims" being
# available inside each Lambda's event (see backend/src/shared/auth.py).
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project_name}-cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.app.id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
  }
}

# ---------------------------------------------------------------------------
# Route table — maps each frontend-specified path to its Lambda.
# Every route uses the /api/v1 prefix and the Cognito authorizer, so both
# only need to be typed once here instead of on every route block.
# ---------------------------------------------------------------------------

locals {
  routes = {
    # Documents (admin)
    documents_upload  = { key = "POST /api/v1/documents", fn = "documents_upload" }
    documents_list    = { key = "GET /api/v1/documents", fn = "documents_list" }
    documents_get     = { key = "GET /api/v1/documents/{documentId}", fn = "documents_get" }
    documents_delete  = { key = "DELETE /api/v1/documents/{documentId}", fn = "documents_delete" }
    documents_approve = { key = "POST /api/v1/documents/{documentId}/approve", fn = "documents_approve" }

    # Chat
    chat_create_session = { key = "POST /api/v1/chat/sessions", fn = "chat_create_session" }
    chat_send_message   = { key = "POST /api/v1/chat", fn = "chat_send_message" }
    chat_get_sessions   = { key = "GET /api/v1/chat/sessions", fn = "chat_get_sessions" }
    chat_get_messages   = { key = "GET /api/v1/chat/sessions/{sessionId}/messages", fn = "chat_get_messages" }
    chat_get_message    = { key = "GET /api/v1/messages/{messageId}", fn = "chat_get_message" }

    # Feedback
    feedback_submit = { key = "POST /api/v1/messages/{messageId}/feedback", fn = "feedback_submit" }
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  for_each = local.routes

  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api[each.value.fn].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "route" {
  for_each = local.routes

  api_id             = aws_apigatewayv2_api.this.id
  route_key          = each.value.key
  target             = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "allow_api_gw" {
  for_each = local.routes

  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api[each.value.fn].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
