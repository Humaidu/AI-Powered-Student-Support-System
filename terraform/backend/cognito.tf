############################################################
# Amazon Cognito — authentication (ARCHITECTURE.md section 6)
############################################################
# Cognito issues the JWTs that API Gateway validates on every request (see
# the aws_apigatewayv2_authorizer in api_gateway.tf). This is what the
# architecture doc's "Auth Lambda" responsibilities map onto in practice:
# API Gateway's built-in JWT authorizer handles signature verification, and
# our Lambda handlers just read the already-verified claims off the event
# (see backend/src/shared/auth.py) — no separate authorizer Lambda needed.

resource "aws_cognito_user_pool" "this" {
  name = "${var.project_name}-users-${var.environment}"

  # Students/admins sign in with their email, not a separate username.
  username_attributes = ["email"]

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 10
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  # Custom attribute carrying the app-level role (STUDENT/ADMIN). This is
  # what backend/src/shared/auth.py reads out of the JWT as "custom:role".
  # mutable=true so an existing admin can promote/demote a user later
  # without them having to re-register.
  schema {
    name                = "role"
    attribute_data_type = "String"
    mutable             = true
    required            = false
    string_attribute_constraints {
      min_length = 1
      max_length = 20
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = false # students self-register
  }
}

resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.project_name}-app-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.this.id

  # No client secret: this token exchange happens directly from the
  # frontend (a public SPA client), which can't safely keep a secret.
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH"
  ]

  access_token_validity  = 60 # minutes
  id_token_validity      = 60 # minutes
  refresh_token_validity = 30 # days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}
