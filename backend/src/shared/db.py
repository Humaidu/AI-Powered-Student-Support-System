"""
Single-table DynamoDB design (ARCHITECTURE.md section 15):

  PK                    SK                  Purpose
  USER#<userId>         PROFILE             user profile / role
  USER#<userId>         SESSION#<sessionId> chat sessions owned by a user
  SESSION#<sessionId>   MESSAGE#<messageId> messages within a session
  DOCUMENT#<id>         METADATA            current document metadata
  DOCUMENT#<id>         VERSION#<n>         version history
  MESSAGE#<id>          FEEDBACK            feedback attached to a message

Two GSIs cover the access patterns the raw PK/SK scheme can't:

  GSI1 (listing):   GSI1PK="DOCUMENT", GSI1SK=<uploadedAt> — lets admins
                     list all documents newest-first without a table scan.

  GSI2 (id lookup):  GSI2PK=<entityId>, GSI2SK=<entityType> — lets us fetch
                     a MESSAGE (or any entity) directly by its own id,
                     without already knowing its parent SESSION#id.
"""
import os
import time
import uuid
import boto3
from boto3.dynamodb.conditions import Key

_dynamodb = boto3.resource("dynamodb")
_table = _dynamodb.Table(os.environ["TABLE_NAME"])


def _now() -> int:
    return int(time.time())


def new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

def put_document_metadata(item: dict) -> dict:
    """item must already contain documentId, uploadedAt, etc.
    (see documents/upload/handler.py for the full shape)."""
    item["PK"] = f"DOCUMENT#{item['documentId']}"
    item["SK"] = "METADATA"
    item["GSI1PK"] = "DOCUMENT"
    item["GSI1SK"] = item["uploadedAt"]
    item["GSI2PK"] = item["documentId"]
    item["GSI2SK"] = "DOCUMENT"
    _table.put_item(Item=item)
    return item


def get_document(document_id: str) -> dict | None:
    response = _table.get_item(Key={"PK": f"DOCUMENT#{document_id}", "SK": "METADATA"})
    return response.get("Item")


def list_documents(limit: int = 50) -> list:
    response = _table.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq("DOCUMENT"),
        ScanIndexForward=False,  # most recently uploaded first
        Limit=limit,
    )
    return response.get("Items", [])


def update_document(document_id: str, updates: dict) -> dict:
    expr_names = {f"#{k}": k for k in updates}
    expr_values = {f":{k}": v for k, v in updates.items()}
    response = _table.update_item(
        Key={"PK": f"DOCUMENT#{document_id}", "SK": "METADATA"},
        UpdateExpression="SET " + ", ".join(f"#{k} = :{k}" for k in updates),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return response["Attributes"]


def delete_document(document_id: str) -> None:
    _table.delete_item(Key={"PK": f"DOCUMENT#{document_id}", "SK": "METADATA"})


# ---------------------------------------------------------------------------
# Chat sessions + messages
# ---------------------------------------------------------------------------

def create_session(user_id: str) -> dict:
    session_id = new_id()
    timestamp = _now()
    item = {
        "PK": f"USER#{user_id}",
        "SK": f"SESSION#{session_id}",
        "sessionId": session_id,
        "userId": user_id,
        "createdAt": timestamp,
        "GSI2PK": session_id,
        "GSI2SK": "SESSION",
    }
    _table.put_item(Item=item)
    return item


def list_sessions(user_id: str, limit: int = 20) -> list:
    response = _table.query(
        KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("SESSION#"),
        ScanIndexForward=False,
        Limit=limit,
    )
    return response.get("Items", [])


def get_session_owner(session_id: str) -> str | None:
    """Looks up which user owns a session, via GSI2, so handlers can
    verify a caller owns the session before reading/writing to it."""
    response = _table.query(
        IndexName="GSI2",
        KeyConditionExpression=Key("GSI2PK").eq(session_id) & Key("GSI2SK").eq("SESSION"),
    )
    items = response.get("Items", [])
    return items[0]["userId"] if items else None


def put_message(session_id: str, role: str, content: str, sources: list = None) -> dict:
    message_id = new_id()
    timestamp = _now()
    item = {
        "PK": f"SESSION#{session_id}",
        "SK": f"MESSAGE#{timestamp}#{message_id}",
        "messageId": message_id,
        "sessionId": session_id,
        "role": role,  # "user" | "assistant"
        "content": content,
        "sources": sources or [],
        "createdAt": timestamp,
        "GSI2PK": message_id,
        "GSI2SK": "MESSAGE",
    }
    _table.put_item(Item=item)
    return item


def list_messages(session_id: str, limit: int = 50) -> list:
    response = _table.query(
        KeyConditionExpression=Key("PK").eq(f"SESSION#{session_id}") & Key("SK").begins_with("MESSAGE#"),
        ScanIndexForward=True,  # oldest first, chronological chat order
        Limit=limit,
    )
    return response.get("Items", [])


def get_message_by_id(message_id: str) -> dict | None:
    """Uses GSI2 to find a message directly by id, then re-fetches the
    full item by its real PK/SK (GSI2 is a sparse projection, not ALL)."""
    response = _table.query(
        IndexName="GSI2",
        KeyConditionExpression=Key("GSI2PK").eq(message_id) & Key("GSI2SK").eq("MESSAGE"),
    )
    items = response.get("Items", [])
    if not items:
        return None
    ref = items[0]
    full = _table.get_item(Key={"PK": ref["PK"], "SK": ref["SK"]})
    return full.get("Item")


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

def put_feedback(message_id: str, user_id: str, rating: str, comment: str = "") -> dict:
    item = {
        "PK": f"MESSAGE#{message_id}",
        "SK": "FEEDBACK",
        "messageId": message_id,
        "userId": user_id,
        "rating": rating,  # e.g. "up" | "down"
        "comment": comment,
        "createdAt": _now(),
    }
    _table.put_item(Item=item)
    return item


# ---------------------------------------------------------------------------
# Audit log (ARCHITECTURE.md section 18)
# ---------------------------------------------------------------------------

def write_audit_log(event_type: str, actor_id: str, details: dict = None) -> None:
    timestamp = _now()
    _table.put_item(Item={
        "PK": f"AUDIT#{time.strftime('%Y-%m-%d', time.gmtime(timestamp))}",
        "SK": f"{timestamp}#{new_id()}",
        "eventType": event_type,
        "actorId": actor_id,
        "details": details or {},
        "createdAt": timestamp,
    })
