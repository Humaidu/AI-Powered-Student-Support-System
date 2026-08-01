"""
GET /api/v1/documents

Available to any authenticated user, but students only ever see APPROVED
documents (they shouldn't see pending/rejected uploads still in review).
Admins can pass ?status=PENDING_REVIEW to see everything awaiting action.
"""
import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import get_role, AuthError
from db import list_documents
from responses import ok, unauthorized, server_error

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    try:
        role = get_role(event)
    except AuthError as exc:
        return unauthorized(exc.message)

    params = event.get("queryStringParameters") or {}
    status_filter = params.get("approvalStatus")

    try:
        documents = list_documents()
    except Exception as exc:
        logger.error("Failed to list documents: %s", exc)
        return server_error("Failed to list documents")

    if role != "ADMIN":
        # Students only ever see approved, active documents regardless of
        # what they pass in the query string.
        documents = [d for d in documents if d.get("approvalStatus") == "APPROVED" and d.get("status") == "ACTIVE"]
    elif status_filter:
        documents = [d for d in documents if d.get("approvalStatus") == status_filter]

    return ok({
        "documents": [_public_shape(d) for d in documents],
        "count": len(documents),
    })


def _public_shape(doc: dict) -> dict:
    return {
        "documentId": doc.get("documentId"),
        "title": doc.get("title"),
        "description": doc.get("description"),
        "documentType": doc.get("documentType"),
        "department": doc.get("department"),
        "academicYear": doc.get("academicYear"),
        "version": doc.get("version"),
        "tags": doc.get("tags"),
        "uploadedAt": doc.get("uploadedAt"),
        "processingStatus": doc.get("processingStatus"),
        "approvalStatus": doc.get("approvalStatus"),
    }