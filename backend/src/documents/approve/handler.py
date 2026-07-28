"""POST /api/v1/documents/{documentId}/approve  (ADMIN only)

Moves a document from PENDING_REVIEW to APPROVED, making it eligible for
RAG search. Requires processing to have COMPLETED first — approving a
document whose chunks/embeddings were never generated would make it
"approved" but invisible to search, which is a confusing state to allow.
"""
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import require_admin, AuthError
from db import get_document, update_document, write_audit_log
from responses import ok, bad_request, forbidden, not_found, server_error


def lambda_handler(event, context):
    try:
        admin_id = require_admin(event)
    except AuthError as exc:
        return forbidden(exc.message)

    document_id = (event.get("pathParameters") or {}).get("documentId")
    if not document_id:
        return not_found("documentId is required")

    document = get_document(document_id)
    if not document:
        return not_found("Document does not exist", code="DOCUMENT_NOT_FOUND")

    if document.get("processingStatus") != "COMPLETED":
        return bad_request(
            f"Document processing is '{document.get('processingStatus')}', must be COMPLETED before approval",
            code="DOCUMENT_NOT_PROCESSED",
        )

    try:
        updated = update_document(document_id, {"approvalStatus": "APPROVED"})
    except Exception:
        return server_error("Failed to approve document")

    write_audit_log("DOCUMENT_APPROVED", admin_id, {"documentId": document_id})

    return ok({"documentId": document_id, "approvalStatus": updated["approvalStatus"]}, message="Document approved")
