############################################################
# AWS Secrets Manager — external API credentials
############################################################
# Terraform creates the secret's empty shell, but deliberately does NOT
# set its value here — the key itself is not something that should live
# in a .tf file or get committed to git. Set it manually after apply:
#
#   aws secretsmanager put-secret-value \
#     --secret-id <output: gemini_api_key_secret_arn> \
#     --secret-string "<your Gemini API key from https://aistudio.google.com>"

resource "aws_secretsmanager_secret" "gemini_api_key" {
  name        = "${var.project_name}-gemini-api-key-${var.environment}"
  description = "TEMPORARY: Gemini API key, used only while Bedrock access is pending. Set via CLI, never via Terraform. Safe to delete this whole secret once ai_provider is permanently back to \"bedrock\"."
}