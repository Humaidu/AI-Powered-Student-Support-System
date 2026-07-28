import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import get_user_id, AuthError
from db import get_session_owner, list_messages
from responses import ok, unauthorized, forbidden, not_found, server_error


def lambda_handler(event, context):
    try:
        user_id = get_user_id(event)
    except AuthError as exc:
        return unauthorized(exc.message)

    session_id = (event.get("pathParameters") or {}).get("sessionId")
    if not session_id:
        return not_found("sessionId is required")

    owner_id = get_session_owner(session_id)
    if owner_id is None:
        return not_found("Chat session does not exist", code="SESSION_NOT_FOUND")
    if owner_id != user_id:
        return forbidden("This session belongs to a different user")

    try:
        messages = list_messages(session_id)
    except Exception:
        return server_error("Failed to fetch messages")

    return ok({
        "messages": [
            {
                "messageId": m["messageId"],
                "role": m["role"],
                "content": m["content"],
                "sources": m.get("sources", []),
                "createdAt": m["createdAt"],
            }
            for m in messages
        ]
    })
