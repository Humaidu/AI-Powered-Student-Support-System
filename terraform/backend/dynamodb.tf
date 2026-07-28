############################################################
# Amazon DynamoDB — application state (ARCHITECTURE.md section 15)
############################################################
# Single-table design: every entity type (user, session, message, document,
# feedback, audit log) lives in one table, distinguished by the PK/SK
# prefix pattern. This trades "one obvious table per entity" for far fewer
# round trips on the access patterns that matter (e.g. "all messages in a
# session" is one Query, not a join). See backend/src/shared/db.py for the
# exact key shapes each function reads/writes.
#
# Two GSIs cover the two access patterns the base table can't:
#   GSI1 — list all documents, newest first, without a full table scan
#   GSI2 — fetch any entity (message, session, document) directly by its
#          own id, without already knowing its parent partition key

resource "aws_dynamodb_table" "app" {
  name         = "${var.project_name}-app-${var.environment}"
  billing_mode = "PAY_PER_REQUEST" # usage is spiky (class schedules, exam periods) — on-demand avoids paying for idle capacity
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }

  # Lets us recover from an accidental delete/overwrite within the last 35
  # days without needing a separate backup job — cheap insurance for an
  # admin-facing "delete document" action that has real consequences.
  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}
