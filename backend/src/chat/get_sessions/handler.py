import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import get_user_id, AuthError
from db import list_sessions
from responses import ok, unauthorized, server_error

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        user_id = get_user_id(event)
    except AuthError as exc:
        return unauthorized(exc.message)

    try:
        sessions = list_sessions(user_id)
    except Exception as exc:
        logger.error("Failed to list chat sessions for user %s: %s", user_id, exc)
        return server_error("Failed to list chat sessions")

    return ok({
        "sessions": [
            {"sessionId": s["sessionId"], "createdAt": s["createdAt"]}
            for s in sessions
        ]
    })