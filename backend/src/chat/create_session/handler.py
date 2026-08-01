import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import get_user_id, AuthError
from db import create_session
from responses import created, unauthorized, server_error

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        user_id = get_user_id(event)
    except AuthError as exc:
        return unauthorized(exc.message)

    try:
        session = create_session(user_id)
    except Exception as exc:
        logger.error("Failed to create chat session for user %s: %s", user_id, exc)
        return server_error("Failed to create chat session")

    return created({"sessionId": session["sessionId"], "createdAt": session["createdAt"]})