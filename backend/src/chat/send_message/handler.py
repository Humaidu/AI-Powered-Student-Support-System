"""
POST /api/v1/chat

This is the RAG query pipeline from ARCHITECTURE.md section 12:
  Student Question -> Chat Lambda -> Generate Query Embedding
    -> OpenSearch Vector Search -> Retrieve Top 5 Chunks
    -> Bedrock Generation Model -> Response

Note on "streaming": the architecture doc lists streaming as a Chat Lambda
responsibility. A plain Lambda behind an HTTP API can't stream a response
body incrementally the way a container/server can — that needs Lambda
response streaming via a Function URL, which is a different invoke path
than API Gateway proxy integration. This handler returns the complete
answer in one response, which is simpler and fits the MVP; switching to
true token-by-token streaming later is a Lambda invocation-model change,
not a RAG-logic change.
"""
import json
import os
import logging
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../shared"))

from auth import get_user_id, AuthError
from db import get_session_owner, put_message
from ai_client import embed_text, generate_answer, AIServiceError
from vector_store import search
from responses import created, bad_request, unauthorized, forbidden, not_found, server_error

logger = logging.getLogger()
logger.setLevel(logging.INFO)

_TOP_K = 5
_MAX_QUESTION_LENGTH = 1000


def lambda_handler(event, context):
    try:
        user_id = get_user_id(event)
    except AuthError as exc:
        return unauthorized(exc.message)

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return bad_request("Request body must be valid JSON")

    session_id = body.get("sessionId")
    question = (body.get("content") or body.get("message") or "").strip()

    if not session_id:
        return bad_request("sessionId is required")
    if not question:
        return bad_request("message is required")
    if len(question) > _MAX_QUESTION_LENGTH:
        return bad_request(f"message must be under {_MAX_QUESTION_LENGTH} characters")

    owner_id = get_session_owner(session_id)
    if owner_id is None:
        return not_found("Chat session does not exist", code="SESSION_NOT_FOUND")
    if owner_id != user_id:
        return forbidden("This session belongs to a different user")

    # Save the user's message BEFORE calling the AI service, not after. 
    # Embedding/generation can legitimately fail (Bedrock/Gemini outage,
    # rate limit, etc.) and return a 500
    try:
        put_message(session_id, role="user", content=question)
    except Exception as exc:
        logger.error("Failed to save user message for session %s: %s", session_id, exc)
        return server_error("Failed to save message")
    
    # 1. Embed the question
    try:
        query_embedding = embed_text(question)
    except AIServiceError as exc:
        logger.error("Embedding failed for question in session %s: %s", session_id, exc)
        return server_error("The AI service is temporarily unavailable. Please try again shortly.")

    # 2. Vector search for the top-K most relevant document chunks
    try:
        chunks = search(query_embedding, top_k=_TOP_K)
    except Exception as exc:
        # Vector search failing shouldn't crash the whole request — fall
        # through with zero chunks, which forces the standard "I couldn't
        # find this" response rather than an unrelated 500. Still logged.
        logger.error("Vector search failed for session %s, falling back to 0 chunks: %s", session_id, exc)
        chunks = []

    # 3. Generate a grounded answer (or the no-answer message if nothing
    #    relevant was retrieved — see ai_client.generate_answer)
    try:
        answer = generate_answer(question, chunks)
    except AIServiceError as exc:
        logger.error("Answer generation failed for session %s: %s", session_id, exc)
        return server_error("The AI service is temporarily unavailable. Please try again shortly.")

    sources = [
        {"documentId": c["documentId"], "chunkId": c["chunkId"], "pageNumber": c.get("pageNumber")}
        for c in chunks
    ]

    try:
        assistant_message = put_message(session_id, role="assistant", content=answer, sources=sources)
    except Exception as exc:
        logger.error("Failed to save conversation for session %s: %s", session_id, exc)
        return server_error("Failed to save the conversation")

    return created({
        "messageId": assistant_message["messageId"],
        "sessionId": session_id,
        "answer": answer,
        "sources": sources,
        "createdAt": assistant_message["createdAt"],
    }, message="Response generated")
