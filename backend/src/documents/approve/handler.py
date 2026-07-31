"""POST /api/v1/documents/{documentId}/approve  (ADMIN only)

Moves a document from PENDING_REVIEW to APPROVED, making it eligible for
RAG search. Requires processing to have COMPLETED first — approving a
document whose chunks/embeddings were never generated would make it
"approved" but invisible to search, which is a confusing state to allow.
"""
import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import require_admin, AuthError
from db import get_document, update_document, write_audit_log
from vector_store import update_chunks_approval_status
from responses import ok, bad_request, forbidden, not_found, server_error

logger = logging.getLogger()
logger.setLevel(logging.INFO)


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
    except Exception as exc:
        logger.error("Failed to approve documentId=%s: %s", document_id, exc)
        return server_error("Failed to approve document")

    # DynamoDB's approvalStatus is what the API reads back to the caller;
    # OpenSearch's own copy (in each chunk's metadata) is what search()
    # actually filters on. Both must change — updating only DynamoDB would
    # mean the document *looks* approved but stays permanently invisible
    # to RAG search, since nothing tells OpenSearch it changed.
    try:
        chunks_updated = update_chunks_approval_status(document_id, "APPROVED")
    except Exception as exc:
        logger.error("Approved documentId=%s in DynamoDB but failed to update its OpenSearch chunks: %s", document_id, exc)
        return server_error("Document approved but chunk indexing update failed — it may not be searchable yet")
        
    write_audit_log("DOCUMENT_APPROVED", admin_id, {"documentId": document_id, "chunksUpdated": chunks_updated})

    return ok({"documentId": document_id, "approvalStatus": updated["approvalStatus"]}, message="Document approved")