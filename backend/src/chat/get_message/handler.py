"""
GET /api/v1/messages/{messageId}

Fetches a single message directly by id (via GSI2 — see shared/db.py),
without the caller needing to already know which session it belongs to.
Still enforces that the message's session belongs to the requesting user.
"""
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import get_user_id, AuthError
from db import get_message_by_id, get_session_owner
from responses import ok, unauthorized, forbidden, not_found, server_error


def lambda_handler(event, context):
    try:
        user_id = get_user_id(event)
    except AuthError as exc:
        return unauthorized(exc.message)

    message_id = (event.get("pathParameters") or {}).get("messageId")
    if not message_id:
        return not_found("messageId is required")

    try:
        message = get_message_by_id(message_id)
    except Exception:
        return server_error("Failed to fetch message")

    if not message:
        return not_found("Message does not exist", code="MESSAGE_NOT_FOUND")

    owner_id = get_session_owner(message["sessionId"])
    if owner_id != user_id:
        return forbidden("This message belongs to a different user's session")

    return ok({
        "messageId": message["messageId"],
        "sessionId": message["sessionId"],
        "role": message["role"],
        "content": message["content"],
        "sources": message.get("sources", []),
        "createdAt": message["createdAt"],
    })
