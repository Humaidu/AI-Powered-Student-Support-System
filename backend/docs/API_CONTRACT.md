# API Contract — AI-Powered Student Support Platform

Base URL: `https://dz8ce1v7da.execute-api.us-east-1.amazonaws.com`

All routes are prefixed with `/api/v1`.

## Authentication

Every route requires a Cognito JWT in the `Authorization` header:

```
Authorization: Bearer <id_token>
```

The token is issued by Cognito on login (see `cognito_user_pool_id` /
`cognito_app_client_id` in Terraform outputs — the frontend's Cognito SDK
config, e.g. Amplify, needs both). API Gateway validates the token's
signature and expiry before the request ever reaches a Lambda; a
missing/invalid/expired token gets a `401` before any handler code runs.

Two roles exist, carried in the token as a custom claim:

- `STUDENT` (default)
- `ADMIN` — required for all document write actions (upload, delete, approve)

A request from a STUDENT token to an ADMIN-only route returns `403`.

## Response Envelope

Every response, success or failure, follows the same shape.

**Success:**

```json
{
  "success": true,
  "message": "Human-readable summary",
  "data": {}
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document does not exist"
  }
}
```

## Common Error Codes

| HTTP Status | Code                     | When                                                     |
| ----------- | ------------------------ | -------------------------------------------------------- |
| 400         | `BAD_REQUEST`            | Missing/invalid field in the request body                |
| 400         | `UNSUPPORTED_FORMAT`     | Document upload with a disallowed mimeType               |
| 400         | `FILE_TOO_LARGE`         | Document upload exceeding 25MB                           |
| 400         | `DOCUMENT_NOT_PROCESSED` | Approving a document before ingestion completed          |
| 401         | `UNAUTHORIZED`           | Missing/invalid/expired token                            |
| 403         | `FORBIDDEN`              | Valid token, but wrong role or wrong resource owner      |
| 404         | `DOCUMENT_NOT_FOUND`     | documentId doesn't exist (or isn't visible to this role) |
| 404         | `SESSION_NOT_FOUND`      | sessionId doesn't exist                                  |
| 404         | `MESSAGE_NOT_FOUND`      | messageId doesn't exist                                  |
| 500         | `INTERNAL_ERROR`         | Unhandled server-side failure (DynamoDB, S3, etc.)       |

---

## Documents (Admin)

### `POST /api/v1/documents`

**Role:** ADMIN only

Creates the document's metadata record and returns a **pre-signed S3
upload URL**. The actual file is uploaded directly to S3 by the client, not
sent through this endpoint — see [Upload Flow](#document-upload-flow) below.

**Request body:**

```json
{
  "title": "Exam Regulations 2026",
  "description": "Official exam conduct policy",
  "documentType": "policy",
  "department": "Registrar",
  "academicYear": "2025/2026",
  "tags": ["exams", "policy"],
  "mimeType": "application/pdf",
  "fileSize": 2457600
}
```

| Field          | Type     | Required | Notes                                                                                                                    |
| -------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `title`        | string   | yes      |                                                                                                                          |
| `description`  | string   | no       |                                                                                                                          |
| `documentType` | string   | no       | free-form, e.g. "policy", "handbook"                                                                                     |
| `department`   | string   | no       |                                                                                                                          |
| `academicYear` | string   | no       |                                                                                                                          |
| `tags`         | string[] | no       |                                                                                                                          |
| `mimeType`     | string   | yes      | one of `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx), `text/plain` |
| `fileSize`     | integer  | yes      | bytes; max 25MB (26214400)                                                                                               |

**Response `201`:**

```json
{
  "success": true,
  "message": "Upload URL generated. PUT the file to uploadUrl to complete the upload.",
  "data": {
    "documentId": "a1b2c3d4-...",
    "uploadUrl": "https://bucket.s3.amazonaws.com/...(presigned)...",
    "s3Key": "documents/institution/a1b2c3d4-.../1/original-file.pdf",
    "expiresIn": 300,
    "processingStatus": "UPLOADED"
  }
}
```

<a id="document-upload-flow"></a>
**Full upload flow (frontend implementation notes):**

1. Call `POST /api/v1/documents` with metadata → get back `uploadUrl`
2. `PUT` the raw file bytes directly to `uploadUrl`, with `Content-Type` header matching the `mimeType` you sent in step 1. The URL expires in 300 seconds — start the upload immediately.
3. The file lands in S3, which triggers backend ingestion automatically (text extraction → chunking → embedding). No further frontend action needed.
4. Poll `GET /api/v1/documents/{documentId}` to watch `processingStatus` move through `UPLOADED → PROCESSING → EMBEDDING → COMPLETED` (or `FAILED`).
5. Once `COMPLETED`, call `POST /api/v1/documents/{documentId}/approve` to make it searchable to students.

---

### `GET /api/v1/documents`

**Role:** any authenticated user (STUDENT sees only approved documents; ADMIN sees everything and can filter)

**Query params (ADMIN only):**
| Param | Notes |
|---|---|
| `approvalStatus` | filter by `PENDING_REVIEW` \| `APPROVED` \| `REJECTED`. Ignored for STUDENT callers, who always only see `APPROVED` + `ACTIVE`. |

**Response `200`:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "documents": [
      {
        "documentId": "a1b2c3d4-...",
        "title": "Exam Regulations 2026",
        "description": "Official exam conduct policy",
        "documentType": "policy",
        "department": "Registrar",
        "academicYear": "2025/2026",
        "version": 1,
        "tags": ["exams", "policy"],
        "uploadedAt": "2026-07-28T10:15:00+00:00",
        "processingStatus": "COMPLETED",
        "approvalStatus": "APPROVED"
      }
    ],
    "count": 1
  }
}
```

---

### `GET /api/v1/documents/{documentId}`

**Role:** any authenticated user (STUDENT gets `404` for non-approved documents, same as if they didn't exist — this is intentional, not a bug: it avoids leaking the existence of unapproved content)

**Response `200`:** full document metadata object (all fields from the schema in `ARCHITECTURE.md` section 11, except internal DynamoDB keys).

---

### `DELETE /api/v1/documents/{documentId}`

**Role:** ADMIN only

Deletes the metadata record and the S3 object. Does **not** currently purge
already-indexed chunks from OpenSearch (documented gap — see `delete/handler.py`
comments) — a deleted document's old chunks could theoretically still
surface in search results until that's addressed.

**Response `200`:**

```json
{
  "success": true,
  "message": "Document deleted",
  "data": { "documentId": "a1b2c3d4-..." }
}
```

---

### `POST /api/v1/documents/{documentId}/approve`

**Role:** ADMIN only

Requires `processingStatus == "COMPLETED"` first — returns `400
DOCUMENT_NOT_PROCESSED` otherwise.

**Response `200`:**

```json
{
  "success": true,
  "message": "Document approved",
  "data": { "documentId": "a1b2c3d4-...", "approvalStatus": "APPROVED" }
}
```

---

## Chat

### `POST /api/v1/chat/sessions`

**Role:** any authenticated user

Creates a new chat session, scoped to the caller.

**Request body:** none

**Response `201`:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { "sessionId": "sess-uuid", "createdAt": 1721990400 }
}
```

---

### `POST /api/v1/chat`

**Role:** any authenticated user (must own the `sessionId` used)

The core RAG endpoint. Embeds the question, searches indexed document
chunks, and generates an answer grounded only in what's retrieved — see
`ARCHITECTURE.md` section 13 for the hallucination-prevention rules. If
nothing relevant is found, `answer` will be the standard "I could not find
this information..." message rather than a guess.

**Request body:**

```json
{
  "sessionId": "sess-uuid",
  "message": "When is the deadline to appeal an exam grade?"
}
```

| Field       | Type   | Required | Notes                     |
| ----------- | ------ | -------- | ------------------------- |
| `sessionId` | string | yes      | must belong to the caller |
| `message`   | string | yes      | max 1000 characters       |

**Response `201`:**

```json
{
  "success": true,
  "message": "Response generated",
  "data": {
    "messageId": "msg-uuid",
    "sessionId": "sess-uuid",
    "answer": "According to the Exam Regulations, appeals must be filed within 14 days of grade release.",
    "sources": [
      {
        "documentId": "a1b2c3d4-...",
        "documentTitle": "Student Handbook 2026",
        "chunkId": "chunk-uuid",
        "pageNumber": 4
      }
    ],
    "createdAt": 1721990460
  }
}
```

**Note on latency:** this endpoint does an embedding call + vector search

- generation call sequentially — expect this to be noticeably slower
  (seconds, not milliseconds) than the other endpoints. Design loading
  states in the frontend accordingly.

**Note on streaming:** this endpoint returns the complete answer in one
response, not a token-by-token stream, despite "streaming" being listed as
a Chat Lambda responsibility in the architecture doc — see
`send_message/handler.py` for why (API Gateway proxy integration doesn't
support true response streaming; that needs a different invocation model).

---

### `GET /api/v1/chat/sessions`

**Role:** any authenticated user

Lists the caller's own sessions, most recent first.

**Response `200`:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "sessions": [{ "sessionId": "sess-uuid", "createdAt": 1721990400 }]
  }
}
```

---

### `GET /api/v1/chat/sessions/{sessionId}/messages`

**Role:** any authenticated user (must own the session — `403` otherwise)

Returns all messages in a session, oldest first (chronological chat order).

**Response `200`:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "messages": [
      {
        "messageId": "msg-1",
        "role": "user",
        "content": "When is the deadline to appeal an exam grade?",
        "sources": [],
        "createdAt": 1721990450
      },
      {
        "messageId": "msg-2",
        "role": "assistant",
        "content": "According to the Exam Regulations...",
        "sources": [
          {
            "documentId": "a1b2c3d4-...",
            "chunkId": "chunk-uuid",
            "pageNumber": 4
          }
        ],
        "createdAt": 1721990460
      }
    ]
  }
}
```

Note: `role` is `"user"` or `"assistant"` — the frontend should render
these as the two sides of the conversation. Every `POST /api/v1/chat` call
writes both a user message and an assistant message, so this list grows
by 2 each turn.

---

### `GET /api/v1/messages/{messageId}`

**Role:** any authenticated user (must own the parent session — `403` otherwise)

Fetches a single message directly by id, without needing to already know
its session. Useful for deep-linking to a specific message (e.g. from a
feedback confirmation).

**Response `200`:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "messageId": "msg-2",
    "sessionId": "sess-uuid",
    "role": "assistant",
    "content": "According to the Exam Regulations...",
    "sources": [
      { "documentId": "a1b2c3d4-...", "chunkId": "chunk-uuid", "pageNumber": 4 }
    ],
    "createdAt": 1721990460
  }
}
```

---

## Feedback

### `POST /api/v1/messages/{messageId}/feedback`

**Role:** any authenticated user

Rates an assistant message. Typically called on `assistant`-role messages,
though the API doesn't currently block feedback on a `user`-role message —
worth a frontend-side guard (only show the feedback UI on assistant bubbles).

**Request body:**

```json
{
  "rating": "up",
  "comment": "Exactly what I needed, thanks!"
}
```

| Field     | Type   | Required | Notes                   |
| --------- | ------ | -------- | ----------------------- |
| `rating`  | string | yes      | `"up"` or `"down"` only |
| `comment` | string | no       |                         |

**Response `201`:**

```json
{
  "success": true,
  "message": "Feedback submitted",
  "data": {
    "messageId": "msg-2",
    "rating": "up",
    "comment": "Exactly what I needed, thanks!"
  }
}
```

---

## Frontend Integration Checklist

- [ ] Configure Cognito SDK (e.g. Amplify) with `cognito_user_pool_id` + `cognito_app_client_id` from Terraform outputs
- [ ] Attach the Cognito `id_token` as `Authorization: Bearer <token>` on every request
- [ ] Handle `401` globally (token expired) → redirect to login / refresh
- [ ] Handle `403` distinctly from `404` — a student hitting an admin-only route should see a clear "not permitted" state, not a generic error
- [ ] Implement the two-step upload flow (metadata POST → direct S3 PUT) for admin document upload — do not attempt to send file bytes to `POST /api/v1/documents` itself
- [ ] Poll or otherwise surface `processingStatus` after upload, since ingestion is asynchronous
- [ ] Design `POST /api/v1/chat` as a "slower" call in the UI (spinner/skeleton state) — it's not comparable in latency to the CRUD endpoints
- [ ] Render `sources` alongside each assistant message — the architecture doc requires this (section 2, "Source references" is an MVP feature, not optional)
