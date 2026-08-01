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
from vector_store import index_chunk, delete_chunks_for_document

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
        pages = _extract_pages(file_bytes, document["mimeType"])
        full_text = "".join(page_text for _, page_text in pages)

        if not full_text.strip():
            update_document(document_id, {"processingStatus": "FAILED", "checksum": checksum})
            print(f"No extractable text for documentId={document_id} — likely scanned/image-only (OCR is out of MVP scope)")
            return

        update_document(document_id, {"checksum": checksum, "processingStatus": "EMBEDDING"})

        # Clear any chunks from a previous attempt at this same document
        # BEFORE indexing new ones. Without this, a retried ingestion
        # (Lambda's own automatic retry on a timeout, or a future
        # re-upload flow) accumulates duplicate chunks alongside the old
        # ones rather than replacing them
        deleted_count = delete_chunks_for_document(document_id)
        if deleted_count:
            print(f"Cleared {deleted_count} chunk(s) from a previous ingestion attempt for documentId={document_id}")

        # Chunk PER PAGE (not across the whole concatenated document) so
        # each chunk can carry a real page number — a chunk never spans
        # two pages. This is also what makes source citations like
        # "Page 4" meaningful instead of always null.
        chunks = []  # list of (pageNumber, chunkText)
        for page_number, page_text in pages:
            for chunk_text in _chunk_text(page_text):
                if chunk_text.strip():
                    chunks.append((page_number, chunk_text))

        indexed_count = 0
        for i, (page_number, chunk_text) in enumerate(chunks):
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
                metadata={
                    "pageNumber": page_number,
                    "documentVersion": document.get("version", 1),
                    "chunkIndex": i,
                    # Starts PENDING_REVIEW (matches the document's own
                    # initial approvalStatus in DynamoDB) — this is what
                    # search() filters on, so a chunk is invisible to RAG
                    # search until an admin explicitly approves the
                    # document (see documents/approve/handler.py, which
                    # updates this field via update_chunks_approval_status).
                    "approvalStatus": "PENDING_REVIEW",
                },
            )
            indexed_count += 1

        # A document with 0 chunks actually indexed is NOT complete, even
        # if every embedding call merely raised (rather than crashing the
        # whole Lambda) — without this check, a document could reach
        # COMPLETED status (and later be approved) while being completely
        # invisible to RAG search, since nothing about its content ever
        # made it into OpenSearch. Only a partial failure (some chunks
        # indexed, some not) still counts as COMPLETED — the document is
        # searchable, just not with full coverage; that's logged so it's
        # visible, but doesn't block approval.
        if indexed_count == 0:
            update_document(document_id, {"processingStatus": "FAILED"})
            print(f"Ingestion FAILED for documentId={document_id}: 0 of {len(chunks)} chunks were indexed (every embedding call failed — check Bedrock access/model availability)")
            return

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


def _extract_pages(file_bytes: bytes, mime_type: str) -> list[tuple[int, str]]:
    """Returns [(pageNumber, pageText), ...], 1-indexed.

    For formats without a real page concept (TXT, DOCX), the whole
    document is treated as a single page — that's an honest limitation of
    those formats, not a bug to fix: DOCX in particular has no fixed
    pagination without actually rendering it (real page breaks depend on
    font, margins, and the renderer — Word/LibreOffice/etc. can each
    paginate the same .docx differently). PDF is the one format with a
    genuine, renderer-independent page concept, so it's the one format
    that gets real per-page numbers."""
    if mime_type == "text/plain":
        return [(1, file_bytes.decode("utf-8", errors="ignore"))]

    if mime_type == "application/pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        return [(i + 1, page.extract_text() or "") for i, page in enumerate(reader.pages)]

    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        import docx
        document = docx.Document(io.BytesIO(file_bytes))
        return [(1, "\n".join(p.text for p in document.paragraphs))]

    raise ValueError(f"Unsupported mime type for text extraction: {mime_type}")


def _chunk_text(text: str) -> list[str]:
    """Simple fixed-size chunking with overlap, applied within a single
    page's text (see _process_one_file, which calls this per-page rather
    than on the whole document). 'Semantic chunking' in the architecture
    doc implies splitting on natural boundaries (paragraphs, sections)
    rather than a raw character count."""
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    if len(text) <= _CHUNK_SIZE_CHARS:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + _CHUNK_SIZE_CHARS
        chunks.append(text[start:end])
        start = end - _CHUNK_OVERLAP_CHARS
    return chunks