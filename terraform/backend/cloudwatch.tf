############################################################
# Amazon CloudWatch — logs + alarms
############################################################
# Every Lambda gets its own log group (so log retention/cost is
# controllable per-function), and an error-rate alarm that fires into a
# shared SNS topic. Subscribe your email/Slack webhook to that topic
# separately (not automated here, since notification preferences are a
# team decision, not an infrastructure one).

resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "lambda_api" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${aws_lambda_function.api[each.key].function_name}"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "lambda_ingestion" {
  name              = "/aws/lambda/${aws_lambda_function.ingestion_processor.function_name}"
  retention_in_days = var.log_retention_days
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"
}

# One alarm per API Lambda: fires if a function errors more than 3 times
# in a 5-minute window. Threshold is deliberately loose — a single
# transient Bedrock throttle shouldn't page anyone, but a function that's
# consistently failing should.
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = local.lambda_functions

  alarm_name          = "${var.project_name}-${replace(each.key, "_", "-")}-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Triggers when ${each.key} errors more than 3 times in 5 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.api[each.key].function_name
  }
}

# The ingestion worker gets a lower threshold (1, not 3) since it processes
# one document at a time — a single failure usually means one specific
# document is genuinely broken (corrupt PDF, password-protected file) and
# is worth an admin's attention sooner rather than waiting for 3 failures.
resource "aws_cloudwatch_metric_alarm" "ingestion_errors" {
  alarm_name          = "${var.project_name}-ingestion-processor-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Triggers on any ingestion failure — usually means one document needs admin attention"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.ingestion_processor.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-api-p99-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "IntegrationLatency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p99"
  threshold           = 8000 # ms — generous, since RAG chat calls (embed + search + generate) are inherently slower than simple CRUD
  alarm_description   = "Triggers when p99 integration latency exceeds 8s"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiId = aws_apigatewayv2_api.this.id
  }
}
