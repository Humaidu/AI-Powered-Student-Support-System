"""
Two AI calls happen in the RAG pipeline, regardless of provider:
  1. Embed the student's question, to search OpenSearch.
  2. Generate the answer, grounded in the retrieved chunks.

"""
import json
import os
import urllib.request
import urllib.error
import boto3

_PROVIDER = os.environ.get("AI_PROVIDER", "bedrock")

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
    "When you do answer, be concise and cite which excerpt(s) you used. Finish complete thoughts, cover the excerpts thoroughly, and avoid unnecessary padding."
)


class AIServiceError(Exception):
    pass


# ---------------------------------------------------------------------------
# Public API — used by chat/send_message and ingestion/processor. Neither
# handler branches on provider; all of that lives below this line.
# ---------------------------------------------------------------------------

def embed_text(text: str) -> list[float]:
    if _PROVIDER == "gemini":
        return _gemini_embed(text)
    return _bedrock_embed(text)


def generate_answer(question: str, context_chunks: list[dict]) -> str:
    if not context_chunks:
        return NO_ANSWER_MESSAGE

    if _PROVIDER == "gemini":
        return _gemini_generate(question, context_chunks)
    return _bedrock_generate(question, context_chunks)


def _build_context_text(context_chunks: list[dict]) -> str:
    return "\n\n".join(
        f"[Excerpt {i + 1} — document {c['documentId']}, page {c.get('pageNumber', '?')}]\n{c['content']}"
        for i, c in enumerate(context_chunks)
    )


# ---------------------------------------------------------------------------
# Bedrock (the locked-architecture provider)
# ---------------------------------------------------------------------------

_bedrock = boto3.client("bedrock-runtime") if _PROVIDER == "bedrock" else None

_BEDROCK_GENERATION_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")
_BEDROCK_EMBEDDING_MODEL_ID = os.environ.get("BEDROCK_EMBEDDING_MODEL_ID", "amazon.titan-embed-text-v2:0")


def _bedrock_embed(text: str) -> list[float]:
    try:
        response = _bedrock.invoke_model(
            modelId=_BEDROCK_EMBEDDING_MODEL_ID,
            body=json.dumps({"inputText": text}),
            contentType="application/json",
            accept="application/json",
        )
        payload = json.loads(response["body"].read())
        return payload["embedding"]
    except Exception as exc:
        raise AIServiceError(f"Bedrock embedding generation failed: {exc}") from exc


def _bedrock_generate(question: str, context_chunks: list[dict]) -> str:
    context_text = _build_context_text(context_chunks)
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": f"Document excerpts:\n\n{context_text}\n\nStudent question: {question}"}
        ],
    }
    try:
        response = _bedrock.invoke_model(
            modelId=_BEDROCK_GENERATION_MODEL_ID,
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


# ---------------------------------------------------------------------------
# Gemini 
# ---------------------------------------------------------------------------

_GEMINI_GENERATION_MODEL = os.environ.get("GEMINI_GENERATION_MODEL", "gemini-3.6-flash")
_GEMINI_EMBEDDING_MODEL = os.environ.get("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
# 768 keeps the vector small and matches --dimensions 768 on
# setup_opensearch_index.py — Gemini's embedding model supports scaling
# output size down from its 3072 default via this parameter.
_GEMINI_EMBEDDING_DIMENSIONS = int(os.environ.get("GEMINI_EMBEDDING_DIMENSIONS", "768"))

_secrets_client = boto3.client("secretsmanager") if _PROVIDER == "gemini" else None
_cached_gemini_api_key = None


def _get_gemini_api_key() -> str:
    """Fetched from Secrets Manager at runtime (once, then cached for the
    life of the Lambda execution environment) rather than sitting in a
    plaintext Lambda environment variable — see terraform/backend/secrets.tf."""
    global _cached_gemini_api_key
    if _cached_gemini_api_key is None:
        secret_arn = os.environ["GEMINI_API_KEY_SECRET_ARN"]
        response = _secrets_client.get_secret_value(SecretId=secret_arn)
        _cached_gemini_api_key = response["SecretString"]
    return _cached_gemini_api_key


def _gemini_request(url: str, body: dict) -> dict:
    api_key = _get_gemini_api_key()
    req = urllib.request.Request(
        f"{url}?key={api_key}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="ignore")
        raise AIServiceError(f"Gemini API error ({exc.code}): {error_body}") from exc
    except Exception as exc:
        raise AIServiceError(f"Gemini request failed: {exc}") from exc


def _gemini_embed(text: str) -> list[float]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{_GEMINI_EMBEDDING_MODEL}:embedContent"
    body = {
        "content": {"parts": [{"text": text}]},
        "outputDimensionality": _GEMINI_EMBEDDING_DIMENSIONS,
    }
    payload = _gemini_request(url, body)
    try:
        return payload["embedding"]["values"]
    except KeyError as exc:
        raise AIServiceError(f"Unexpected Gemini embedding response shape: {payload}") from exc


def _gemini_generate(question: str, context_chunks: list[dict]) -> str:
    context_text = _build_context_text(context_chunks)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{_GEMINI_GENERATION_MODEL}:generateContent"
    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [
            {"role": "user", "parts": [{"text": f"Document excerpts:\n\n{context_text}\n\nStudent question: {question}"}]}
        ],
        "generationConfig": {"maxOutputTokens": 2048},
    }
    payload = _gemini_request(url, body)
    try:
        return payload["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise AIServiceError(f"Unexpected Gemini generation response shape: {payload}") from exc