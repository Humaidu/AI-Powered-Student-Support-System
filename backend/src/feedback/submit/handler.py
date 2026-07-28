import json
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import get_user_id, AuthError
from db import get_message_by_id, put_feedback
from responses import created, bad_request, unauthorized, not_found, server_error

_VALID_RATINGS = {"up", "down"}


def lambda_handler(event, context):
    try:
        user_id = get_user_id(event)
    except AuthError as exc:
        return unauthorized(exc.message)

    message_id = (event.get("pathParameters") or {}).get("messageId")
    if not message_id:
        return not_found("messageId is required")

    if not get_message_by_id(message_id):
        return not_found("Message does not exist", code="MESSAGE_NOT_FOUND")

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return bad_request("Request body must be valid JSON")

    rating = body.get("rating")
    comment = body.get("comment", "")

    if rating not in _VALID_RATINGS:
        return bad_request(f"rating must be one of {sorted(_VALID_RATINGS)}")

    try:
        feedback = put_feedback(message_id, user_id, rating, comment)
    except Exception:
        return server_error("Failed to save feedback")

    return created({
        "messageId": message_id,
        "rating": feedback["rating"],
        "comment": feedback["comment"],
    }, message="Feedback submitted")
