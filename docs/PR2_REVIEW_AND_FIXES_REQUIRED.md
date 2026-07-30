# PR #2 Review — Backend Fixes Required

**PR:** Backend IAC and Backend APIs created  
**Reviewed by:** richardvidvidzrakou98  
**Date:** 2026-07-30  
**Status:** Changes requested before next merge

---

## Overview

The infrastructure layer (DynamoDB design, S3 security, KMS encryption, CloudWatch alarms, IAM scoping) and the shared Python modules are production-quality and well-structured. The Terraform `for_each` pattern for Lambdas is clean and the inline comments throughout are excellent.

The fixes below are grouped by severity. The seven critical issues will prevent the frontend from working end-to-end in `VITE_APP_MODE=aws`. All fixes are contained to the Python handlers, one IAM typo, and the API Gateway route table — no architectural changes are needed.

---

## Critical — Blockers

### 1. Field name mismatch: `send_message` reads `message`, frontend sends `content`

**File:** `backend/src/chat/send_message/handler.py`

```python
# Current — WRONG
question = (body.get("message") or "").strip()
```

`lambdaChatService.ts` sends `{ sessionId, content }`. The handler reads `"message"`, which is always `None`, so every request returns `"message is required"`. No chat message will ever succeed.

**Fix:**
```python
question = (body.get("content") or "").strip()
```

---

### 2. Missing `approvalStatus` filter in OpenSearch vector search

**File:** `backend/src/shared/vector_store.py`

The `search()` function runs a bare knn query with no filter. Chunks from `PENDING_REVIEW` and `REJECTED` documents will surface in student answers — documents that have not been approved by an admin are searchable the moment ingestion completes.

**Fix:** Replace the bare knn query with a filtered bool query:

```python
body={
    "size": top_k,
    "query": {
        "bool": {
            "must": {
                "knn": {
                    "embedding": {
                        "vector": query_embedding,
                        "k": top_k,
                    }
                }
            },
            "filter": {
                "term": {"metadata.approvalStatus": "APPROVED"}
            },
        }
    },
},
```

---

### 3. `approvalStatus` not written to OpenSearch chunks at ingestion time

**File:** `backend/src/ingestion/processor/handler.py`

The `index_chunk()` call stores `metadata` without `approvalStatus`:

```python
# Current — missing field
metadata={"pageNumber": None, "documentVersion": ..., "chunkIndex": i}
```

Even after fixing issue #2, the filter `metadata.approvalStatus = "APPROVED"` will never match because the field does not exist on any indexed chunk.

**Fix:** Add `approvalStatus` to the metadata dict:

```python
metadata={
    "pageNumber": None,
    "documentVersion": document.get("version", 1),
    "chunkIndex": i,
    "approvalStatus": "PENDING_REVIEW",   # ← add this
}
```

---

### 4. Document approval does not update OpenSearch chunks

**File:** `backend/src/documents/approve/handler.py`

The handler sets `approvalStatus: APPROVED` in DynamoDB but never updates the corresponding chunks in OpenSearch. Even with fixes #2 and #3 in place, approving a document in the admin dashboard will not make its content searchable — the chunks stay as `PENDING_REVIEW` in the index forever.

**Fix:** After the DynamoDB update, issue an OpenSearch `update_by_query` for the document's chunks:

```python
# After update_document(document_id, {"approvalStatus": "APPROVED"})
from vector_store import update_chunks_approval_status
update_chunks_approval_status(document_id, "APPROVED")
```

Add to `backend/src/shared/vector_store.py`:

```python
def update_chunks_approval_status(document_id: str, approval_status: str) -> None:
    """Updates metadata.approvalStatus on all chunks belonging to a document.
    Called by the approve and reject handlers to make chunks searchable (APPROVED)
    or hide them (REJECTED/PENDING_REVIEW) from the RAG pipeline."""
    _client().update_by_query(
        index=_INDEX_NAME,
        body={
            "query": {"term": {"documentId": document_id}},
            "script": {
                "source": "ctx._source.metadata.approvalStatus = params.status",
                "params": {"status": approval_status},
            },
        },
    )
```

The same function should also be called from the `reject` flow (if one is added) and the `delete` handler (passing `"DELETED"` or deleting the chunks outright with `delete_by_query`).

---

### 5. IAM typo — Bedrock embedding model ARN malformed

**File:** `terraform/backend/iam.tf`

```hcl
# Current — WRONG
"arn:aw:bedrock:${var.aws_region}::foundation-model/${var.bedrock_embedding_model_id}",
```

`arn:aw:` is not a valid ARN partition. The IAM policy will either be rejected at apply time or silently fail to grant the permission. Every ingestion run will return `AccessDenied` when calling Titan Embeddings.

**Fix:**
```hcl
"arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_embedding_model_id}",
```

---

### 6. Auth routes missing — frontend cannot authenticate in AWS mode

**File:** `terraform/backend/api_gateway.tf`, `backend/src/` (no auth directory)

`cognitoAuthProvider.ts` calls these four endpoints:

| Method | Path |
|--------|------|
| `POST` | `/api/v1/auth/cognito/login` |
| `POST` | `/api/v1/auth/cognito/logout` |
| `GET`  | `/api/v1/auth/me` |
| `POST` | `/api/v1/auth/switch-role` |

None of these routes exist in the API Gateway route table and no handler files exist for them. With `VITE_APP_MODE=aws` the login page will fail immediately.

**Required additions:**

- `backend/src/auth/login/handler.py` — calls Cognito `InitiateAuth` with `USER_PASSWORD_AUTH`, decodes the `IdToken`, fetches the DynamoDB `USER#<sub> / PROFILE` record, returns `{ ...profile, token: AccessToken }`.
- `backend/src/auth/logout/handler.py` — calls Cognito `GlobalSignOut` to invalidate the refresh token.
- `backend/src/auth/me/handler.py` — reads claims from the already-verified JWT event context (same pattern as other handlers), fetches the DynamoDB profile, returns it.
- `backend/src/auth/switch_role/handler.py` — updates `custom:role` on the Cognito user via `AdminUpdateUserAttributes`; also updates the DynamoDB profile record.

Add these four routes to `locals.routes` in `api_gateway.tf`:

```hcl
auth_login       = { key = "POST /api/v1/auth/cognito/login",  fn = "auth_login" }
auth_logout      = { key = "POST /api/v1/auth/cognito/logout", fn = "auth_logout" }
auth_me          = { key = "GET  /api/v1/auth/me",             fn = "auth_me" }
auth_switch_role = { key = "POST /api/v1/auth/switch-role",    fn = "auth_switch_role" }
```

> **Note:** The login and logout routes must be excluded from the Cognito JWT authorizer (a user cannot present a valid JWT to obtain a JWT). Set `authorization_type = "NONE"` on those two routes specifically.

---

### 7. Session management routes missing

**File:** `terraform/backend/api_gateway.tf`, `backend/src/chat/` (no delete or pin directory)

`lambdaChatService.ts` calls:

| Method | Path |
|--------|------|
| `DELETE` | `/api/v1/chat/sessions/{sessionId}` |
| `POST`   | `/api/v1/chat/sessions/{sessionId}/pin` |

Neither route nor handler exists. The Conversations page will error when a user tries to delete or pin a session.

**Required additions:**

- `backend/src/chat/delete_session/handler.py` — verifies session ownership, batch-deletes all `MESSAGE#*` items under `SESSION#<sessionId>`, then deletes the session record itself.
- `backend/src/chat/pin_session/handler.py` — verifies session ownership, calls `update_document` (or a new `update_session` helper in `db.py`) to set `isPinned = true/false`.

Add routes to `api_gateway.tf`:

```hcl
chat_delete_session = { key = "DELETE /api/v1/chat/sessions/{sessionId}", fn = "chat_delete_session" }
chat_pin_session    = { key = "POST /api/v1/chat/sessions/{sessionId}/pin", fn = "chat_pin_session" }
```

---

## Moderate — Correctness Issues

### 8. User message not saved before AI call

**File:** `backend/src/chat/send_message/handler.py`

Both the user and assistant messages are written at the very end of the handler, after embedding, search, and generation. If Bedrock is unavailable (which returns a `500`), the user's question is silently lost and never stored.

**Fix:** Write the user message to DynamoDB immediately after session ownership is verified, before the `embed_text()` call:

```python
# After ownership check, before embed_text
try:
    put_message(session_id, role="user", content=question)
except Exception:
    return server_error("Failed to save message")

# 1. Embed the question
query_embedding = embed_text(question)
# ...
# 3. Write only the assistant message at the end
assistant_message = put_message(session_id, role="assistant", content=answer, sources=sources)
```

---

### 9. Duplicate `update_document(COMPLETED)` in ingestion worker

**File:** `backend/src/ingestion/processor/handler.py`

After the embedding loop there are two consecutive unconditional calls to `update_document(document_id, {"processingStatus": "COMPLETED"})`. The first one runs even if `indexed_count == 0`, before the check that would set status to `FAILED`. Remove the first (duplicate) call.

---

### 10. OpenSearch client rebuilt on every Lambda invocation

**File:** `backend/src/shared/vector_store.py`

`_client()` creates a new `OpenSearch` instance (including connection pool setup and SigV4 credential resolution) every time `index_chunk()` or `search()` is called. Lambda reuses the execution environment between warm invocations — the client should be a module-level singleton:

```python
# Build once at module load; reused across warm invocations
_os_client: OpenSearch | None = None

def _get_client() -> OpenSearch:
    global _os_client
    if _os_client is None:
        _os_client = _build_client()
    return _os_client
```

---

### 11. Page numbers not extracted — all chunks stored with `pageNumber: None`

**File:** `backend/src/ingestion/processor/handler.py`

The `pypdf` `PdfReader` exposes pages via `reader.pages[i]` — the page index is available during text extraction but is not threaded through to the chunk metadata. Source citations displayed in the frontend ("Page 88, Section 7.3") will all show `null`.

**Fix:** Refactor `_extract_text` to return `list[tuple[int, str]]` (page number, page text), then use the page number when chunking and indexing.

---

## Minor — Pre-Production Housekeeping

### 12. Wildcard CORS origins

Both `api_gateway.tf` (`allow_origins = ["*"]`) and `s3.tf` (`allowed_origins = ["*"]`) acknowledge this with "tighten once known" comments. This needs to be resolved before the environment goes live — create a `var.frontend_origin` variable and substitute it in both places as part of the production deployment step.

### 13. OpenSearch data access policy uses `aoss:*`

**File:** `terraform/backend/opensearch.tf`

The Lambda execution role needs `aoss:WriteDocument`, `aoss:ReadDocument`, `aoss:CreateIndex`, and `aoss:DescribeIndex`. Granting `aoss:*` at collection scope includes administrative operations (delete collection, manage access policies) the Lambda should never exercise.

### 14. `ALLOW_ADMIN_USER_PASSWORD_AUTH` on the public app client

**File:** `terraform/backend/cognito.tf`

This flow is designed for server-side callers holding admin credentials. A public SPA with no client secret does not need it. `ALLOW_USER_PASSWORD_AUTH` and `ALLOW_USER_SRP_AUTH` are sufficient.

---

## Fix Priority Order

For the backend to be end-to-end functional, address in this order:

1. **#5** — IAM typo (one character, fix immediately)
2. **#1** — `content` vs `message` field name (one line)
3. **#3** — Add `approvalStatus` to chunk metadata at ingestion
4. **#2** — Add `approvalStatus` filter to OpenSearch search
5. **#4** — Update OpenSearch chunks on approval (`update_chunks_approval_status`)
6. **#6** — Auth Lambda + routes (largest piece of new work)
7. **#7** — Delete session + pin session handlers and routes
8. **#8** — Save user message before AI call
9. **#9** — Remove duplicate COMPLETED status write
10. **#10** — OpenSearch client singleton
11. **#11** — Extract real page numbers from PDF

Items #12–#14 can be addressed in a follow-up PR.
