"""DELETE /api/v1/documents/{documentId}  (ADMIN only)

Deletes the metadata record and the underlying S3 object. Vector chunks in
OpenSearch for this document are intentionally left as a documented gap —
see the note below — rather than silently deleting them, since a bulk
delete-by-documentId query against OpenSearch needs its own handler and
isn't in MVP scope per ARCHITECTURE.md.
"""
import os
import sys
import boto3

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import require_admin, AuthError
from db import get_document, delete_document, write_audit_log
from responses import ok, forbidden, not_found, server_error

_s3 = boto3.client("s3")
_BUCKET = os.environ["DOCUMENT_BUCKET"]


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

    try:
        _s3.delete_object(Bucket=_BUCKET, Key=document["s3Key"])
    except Exception:
        # Continue even if the S3 object is already gone — don't block
        # metadata cleanup on a storage-layer inconsistency.
        pass

    try:
        delete_document(document_id)
    except Exception:
        return server_error("Failed to delete document")

    # TODO (future enhancement): also purge this document's chunks from
    # OpenSearch (delete_by_query on documentId) so stale content can't
    # still surface in RAG search results.

    write_audit_log("DOCUMENT_DELETED", admin_id, {"documentId": document_id})

    return ok({"documentId": document_id}, message="Document deleted")
