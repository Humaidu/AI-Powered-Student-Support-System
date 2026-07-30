"""
POST /api/v1/documents  (ADMIN only)

Per ARCHITECTURE.md section 17, files are NOT sent through API Gateway/Lambda
directly (that would hit Lambda payload limits well before the 25MB max).
Instead this endpoint creates the metadata record and hands back a
pre-signed S3 PUT URL; the admin's browser uploads the file straight to S3.
The S3 event trigger then kicks off the ingestion pipeline (see
ingestion/processor/handler.py).
"""
import json
import os
import sys
import boto3
from botocore.client import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import require_admin, AuthError
from db import put_document_metadata, new_id
from responses import created, bad_request, unauthorized, forbidden, server_error

# signature_version="s3v4" is required here, not optional: the document
# bucket enforces SSE-KMS encryption (see s3.tf), and S3 rejects
# SigV2-signed requests against a KMS-encrypted bucket with
# "Requests specifying Server Side Encryption with AWS KMS managed keys
# require AWS Signature Version 4. every other region defaults to SigV4.
# Without this Config, presigned URLs generated in us-east-1 fail with
# exactly that S3 error the moment the browser tries to PUT the file.
_s3 = boto3.client("s3", config=Config(signature_version="s3v4"))
_BUCKET = os.environ["DOCUMENT_BUCKET"]
_ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}
_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB, per section 10
_UPLOAD_URL_EXPIRY_SECONDS = 300


def lambda_handler(event, context):
    try:
        admin_id = require_admin(event)
    except AuthError as exc:
        return forbidden(exc.message)

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return bad_request("Request body must be valid JSON")

    title = (body.get("title") or "").strip()
    mime_type = body.get("mimeType")
    file_size = body.get("fileSize")
    department = body.get("department", "")
    academic_year = body.get("academicYear", "")
    document_type = body.get("documentType", "")
    tags = body.get("tags", [])

    if not title:
        return bad_request("title is required")
    if mime_type not in _ALLOWED_MIME_TYPES:
        return bad_request(f"mimeType must be one of {list(_ALLOWED_MIME_TYPES)}", code="UNSUPPORTED_FORMAT")
    if not isinstance(file_size, int) or file_size <= 0:
        return bad_request("fileSize (bytes, integer) is required")
    if file_size > _MAX_FILE_SIZE_BYTES:
        return bad_request("File exceeds the 25MB upload limit", code="FILE_TOO_LARGE")

    document_id = new_id()
    extension = _ALLOWED_MIME_TYPES[mime_type]
    version = 1
    # S3 key layout matches ARCHITECTURE.md section 16:
    # documents/institution/documentId/version/original-file.ext
    s3_key = f"documents/institution/{document_id}/{version}/original-file.{extension}"

    try:
        presigned_url = _s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": _BUCKET, "Key": s3_key, "ContentType": mime_type},
            ExpiresIn=_UPLOAD_URL_EXPIRY_SECONDS,
        )
    except Exception:
        return server_error("Failed to generate upload URL")

    item = {
        "documentId": document_id,
        "title": title,
        "description": body.get("description", ""),
        "documentType": document_type,
        "department": department,
        "academicYear": academic_year,
        "version": version,
        "tags": tags,
        "uploadedBy": admin_id,
        "uploadedAt": _iso_now(),
        "status": "ACTIVE",
        "checksum": "",  # filled in by the ingestion worker after SHA256 validation
        "s3Key": s3_key,
        "fileSize": file_size,
        "mimeType": mime_type,
        "processingStatus": "UPLOADED",
        "approvalStatus": "PENDING_REVIEW",
    }

    try:
        put_document_metadata(item)
    except Exception:
        return server_error("Failed to save document metadata")

    return created({
        "documentId": document_id,
        "uploadUrl": presigned_url,
        "s3Key": s3_key,
        "expiresIn": _UPLOAD_URL_EXPIRY_SECONDS,
        "processingStatus": "UPLOADED",
    }, message="Upload URL generated. PUT the file to uploadUrl to complete the upload.")


def _iso_now() -> str:
    import datetime
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
