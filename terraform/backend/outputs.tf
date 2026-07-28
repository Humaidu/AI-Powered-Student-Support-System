############################################################
# Outputs — values the CI/CD pipeline, frontend team, and docs all need
############################################################

output "api_endpoint" {
  description = "Base URL of the deployed API (frontend calls <this>/api/v1/...)"
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "github_actions_role_arn" {
  description = "Set this as the AWS_DEPLOY_ROLE_ARN GitHub secret so CI/CD can deploy via OIDC"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.app.name
}

output "document_bucket_name" {
  value = aws_s3_bucket.documents.id
}

output "opensearch_endpoint" {
  description = "Needed for the one-time index setup — see docs/opensearch-index-setup.md"
  value       = aws_opensearchserverless_collection.vectors.collection_endpoint
}

output "cognito_user_pool_id" {
  description = "Needed by the frontend to configure its Cognito auth SDK (e.g. Amplify)"
  value       = aws_cognito_user_pool.this.id
}

output "cognito_app_client_id" {
  description = "Needed by the frontend to configure its Cognito auth SDK"
  value       = aws_cognito_user_pool_client.app.id
}
