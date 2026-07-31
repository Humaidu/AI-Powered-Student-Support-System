import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import get_role, AuthError
from db import get_document
from responses import ok, unauthorized, not_found, server_error

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        role = get_role(event)
    except AuthError as exc:
        return unauthorized(exc.message)

    document_id = (event.get("pathParameters") or {}).get("documentId")
    if not document_id:
        return not_found("documentId is required")

    try:
        document = get_document(document_id)
    except Exception as exc:
        logger.error("Failed to fetch document %s: %s", document_id, exc)
        return server_error("Failed to fetch document")

    if not document:
        return not_found("Document does not exist", code="DOCUMENT_NOT_FOUND")

    # Students can't view documents still pending review or rejected.
    if role != "ADMIN" and document.get("approvalStatus") != "APPROVED":
        return not_found("Document does not exist", code="DOCUMENT_NOT_FOUND")

    return ok({k: v for k, v in document.items() if k not in ("PK", "SK", "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK")})