"""
Ingestion Worker Lambda — triggered by S3 ObjectCreated events (wired up in
terraform/backend/s3.tf). Implements the pipeline from ARCHITECTURE.md
section 9:

  Validate File -> SHA256 Checksum -> Extract Text -> AI Metadata Extraction
  -> Save Metadata -> Semantic Chunking -> Generate Embeddings -> Store Vectors

This runs asynchronously after documents/upload/handler.py has already
created the DynamoDB metadata record with processingStatus=UPLOADED — this
worker's job is to move that status through PROCESSING -> EMBEDDING ->
COMPLETED (or FAILED), and populate the OpenSearch index along the way.
"""
import hashlib
import io
import os
import re
import sys
import urllib.parse

import boto3

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from db import get_document, update_document, new_id
from ai_client import embed_text, AIServiceError
from vector_store import index_chunk

_s3 = boto3.client("s3")

_CHUNK_SIZE_CHARS = 1500
_CHUNK_OVERLAP_CHARS = 200


def lambda_handler(event, context):
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        _process_one_file(bucket, key)


def _process_one_file(bucket: str, key: str) -> None:
    # s3Key format: documents/institution/<documentId>/<version>/original-file.ext
    match = re.match(r"documents/institution/([^/]+)/", key)
    if not match:
        print(f"Skipping key that doesn't match expected layout: {key}")
        return

    document_id = match.group(1)
    document = get_document(document_id)
    if not document:
        print(f"No metadata record found for documentId={document_id}, skipping")
        return

    try:
        update_document(document_id, {"processingStatus": "PROCESSING"})

        obj = _s3.get_object(Bucket=bucket, Key=key)
        file_bytes = obj["Body"].read()

        checksum = hashlib.sha256(file_bytes).hexdigest()
        text = _extract_text(file_bytes, document["mimeType"])

        if not text.strip():
            update_document(document_id, {"processingStatus": "FAILED", "checksum": checksum})
            print(f"No extractable text for documentId={document_id} — likely scanned/image-only (OCR is out of MVP scope)")
            return

        update_document(document_id, {"checksum": checksum, "processingStatus": "EMBEDDING"})

        chunks = _chunk_text(text)
        indexed_count = 0
        for i, chunk_text in enumerate(chunks):
            try:
                embedding = embed_text(chunk_text)
            except AIServiceError as exc:
                print(f"Embedding failed for chunk {i} of documentId={document_id}: {exc}")
                continue

            index_chunk(
                chunk_id=new_id(),
                document_id=document_id,
                content=chunk_text,
                embedding=embedding,
                metadata={"pageNumber": None, "documentVersion": document.get("version", 1), "chunkIndex": i},
            )
            indexed_count += 1
        

        # A document with 0 chunks actually indexed is NOT complete, even
        # if every embedding call merely raised (rather than crashing the
        # whole Lambda)
        if indexed_count == 0:
            update_document(document_id, {"processingStatus": "FAILED"})
            print(f"Ingestion FAILED for documentId={document_id}: 0 of {len  (chunks)} chunks were indexed (every embedding call failed — check Bedrock access/model availability)")
            return

        update_document(document_id, {"processingStatus": "COMPLETED"})
        print(f"Ingestion completed for documentId={document_id}: {len(chunks)} chunks indexed")
        update_document(document_id, {"processingStatus": "COMPLETED"})
        if indexed_count < len(chunks):
            print(f"Ingestion completed for documentId={document_id} with PARTIAL coverage: {indexed_count}/{len(chunks)} chunks indexed")
        else:
            print(f"Ingestion completed for documentId={document_id}: {indexed_count}/{len(chunks)} chunks indexed")

    except Exception as exc:
        print(f"Ingestion failed for documentId={document_id}: {exc}")
        try:
            update_document(document_id, {"processingStatus": "FAILED"})
        except Exception:
            pass
        raise  # re-raise so CloudWatch/Lambda records this as an error invocation


def _extract_text(file_bytes: bytes, mime_type: str) -> str:
    if mime_type == "text/plain":
        return file_bytes.decode("utf-8", errors="ignore")

    if mime_type == "application/pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        import docx
        document = docx.Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in document.paragraphs)

    raise ValueError(f"Unsupported mime type for text extraction: {mime_type}")


def _chunk_text(text: str) -> list[str]:
    """Simple fixed-size chunking with overlap. 'Semantic chunking' in the
    architecture doc implies splitting on natural boundaries (paragraphs,
    sections) rather than a raw character count — this is a pragmatic MVP
    version; swapping in sentence/paragraph-aware splitting later doesn't
    change anything downstream (embeddings + indexing stay the same)."""
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= _CHUNK_SIZE_CHARS:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + _CHUNK_SIZE_CHARS
        chunks.append(text[start:end])
        start = end - _CHUNK_OVERLAP_CHARS
    return chunks
