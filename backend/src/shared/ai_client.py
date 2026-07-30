"""
Two separate Bedrock calls happen in the RAG pipeline:
  1. Embed the student's question (Titan Text Embeddings V2) to search OpenSearch.
  2. Generate the answer (Claude via Bedrock), grounded in the retrieved chunks.

ARCHITECTURE.md section 13 sets hard rules for the assistant: answer only
from institutional documents, refuse unsupported questions, include source
references, never invent information. Those rules live in SYSTEM_PROMPT
below and are enforced by not calling the model at all if nothing relevant
was retrieved (see chat/send_message/handler.py).
"""
import json
import os
import boto3

_bedrock = boto3.client("bedrock-runtime")

_GENERATION_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
_EMBEDDING_MODEL_ID = os.environ.get("BEDROCK_EMBEDDING_MODEL_ID", "amazon.titan-embed-text-v2:0")

NO_ANSWER_MESSAGE = (
    "I could not find this information in the available institutional "
    "documents. Please contact the appropriate department."
)

SYSTEM_PROMPT = (
    "You are an academic support assistant for a university. You must answer "
    "ONLY using the provided document excerpts below — never use outside "
    "knowledge, and never invent information not present in the excerpts. "
    "If the excerpts don't contain enough information to answer confidently, "
    f'respond with exactly: "{NO_ANSWER_MESSAGE}" '
    "When you do answer, be concise and cite which excerpt(s) you used."
)


class AIServiceError(Exception):
    pass


def embed_text(text: str) -> list[float]:
    """Generates a vector embedding for a piece of text (question or chunk)
    using Titan Text Embeddings V2. Used both at ingestion time (embedding
    document chunks) and at query time (embedding the student's question)."""
    try:
        response = _bedrock.invoke_model(
            modelId=_EMBEDDING_MODEL_ID,
            body=json.dumps({"inputText": text}),
            contentType="application/json",
            accept="application/json",
        )
        payload = json.loads(response["body"].read())
        return payload["embedding"]
    except Exception as exc:
        raise AIServiceError(f"Embedding generation failed: {exc}") from exc


def generate_answer(question: str, context_chunks: list[dict]) -> str:
    """context_chunks: list of {"content": str, "documentId": str, "pageNumber": int}
    retrieved from OpenSearch (see shared/vector_store.py). If the list is
    empty, we skip the model call entirely and return the standard
    no-answer message — that's a stronger hallucination guard than trusting
    the model to refuse on its own."""
    if not context_chunks:
        return NO_ANSWER_MESSAGE

    context_text = "\n\n".join(
        f"[Excerpt {i + 1} — document {c['documentId']}, page {c.get('pageNumber', '?')}]\n{c['content']}"
        for i, c in enumerate(context_chunks)
    )

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 600,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": f"Document excerpts:\n\n{context_text}\n\nStudent question: {question}"}
        ],
    }

    try:
        response = _bedrock.invoke_model(
            modelId=_GENERATION_MODEL_ID,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )
    except Exception as exc:
        raise AIServiceError(f"Bedrock invocation failed: {exc}") from exc

    payload = json.loads(response["body"].read())
    try:
        return payload["content"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise AIServiceError(f"Unexpected Bedrock response shape: {payload}") from exc
