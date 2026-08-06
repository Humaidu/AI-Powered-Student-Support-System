import json
import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(__file__))
from _load import load_handler

os.environ.setdefault("TABLE_NAME", "test-table")
os.environ.setdefault("DOCUMENT_BUCKET", "test-bucket")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

handler = load_handler("documents", "upload")


def _event(body: dict, role="ADMIN", sub="admin-1"):
    return {
        "body": json.dumps(body),
        "requestContext": {"authorizer": {"jwt": {"claims": {"sub": sub, "custom:role": role}}}},
    }


@patch("handler_documents_upload.put_document_metadata")
@patch("handler_documents_upload._s3")
def test_upload_success(mock_s3, mock_put):
    mock_s3.generate_presigned_url.return_value = "https://example-bucket.s3.amazonaws.com/presigned"
    mock_put.side_effect = lambda item: item

    result = handler.lambda_handler(
        _event({"title": "Exam Policy", "mimeType": "application/pdf", "fileSize": 1024}), None
    )

    assert result["statusCode"] == 201
    body = json.loads(result["body"])
    assert body["success"] is True
    assert "uploadUrl" in body["data"]


def test_upload_requires_admin():
    result = handler.lambda_handler(
        _event({"title": "Exam Policy", "mimeType": "application/pdf", "fileSize": 1024}, role="STUDENT"), None
    )
    assert result["statusCode"] == 403


def test_upload_rejects_unsupported_mime_type():
    result = handler.lambda_handler(
        _event({"title": "Exam Policy", "mimeType": "image/png", "fileSize": 1024}), None
    )
    assert result["statusCode"] == 400


def test_upload_rejects_oversized_file():
    result = handler.lambda_handler(
        _event({"title": "Exam Policy", "mimeType": "application/pdf", "fileSize": 30 * 1024 * 1024}), None
    )
    assert result["statusCode"] == 400


def test_upload_requires_title():
    result = handler.lambda_handler(
        _event({"mimeType": "application/pdf", "fileSize": 1024}), None
    )
    assert result["statusCode"] == 400
