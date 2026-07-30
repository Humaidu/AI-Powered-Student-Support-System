# Backend Development Guide

## Version

- 1.0
- Status: Ready for Implementation

---

## 1. Purpose of This Document

This guide explains how to build the real AWS Lambda backend for the AI-Powered Student Support Platform.

The frontend application already has a complete mock backend that runs entirely inside the browser. It simulates authentication, AI chat, document management, and vector search using fake data stored in `localStorage`. The mock is fully functional and exists so that the frontend could be built and tested without needing any real infrastructure.

The real backend replaces the mock layer piece by piece. The frontend is already wired up to use real AWS services the moment the environment variable `VITE_APP_MODE` is changed from `mock` to `aws`. Every endpoint the Lambda functions must serve is already being called by real frontend service files that are sitting idle, waiting for a backend to answer them.

This document explains what each Lambda must do, why, what data it reads and writes, and how everything connects.

---

## 2. How the Frontend Selects Mock vs Real

The switch between mock and real is controlled by a single environment variable:

```
VITE_APP_MODE=mock   ← uses in-browser fake services (default)
VITE_APP_MODE=aws    ← uses real AWS Lambda services
```

This is read in `frontend/student-ai-support/src/config/environment.ts`:

```ts
export const config = {
  APP_MODE: (import.meta.env.VITE_APP_MODE as AppMode) || "mock",
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
};
```

Every service in the frontend checks `config.APP_MODE` in its constructor and picks either the mock provider or the real AWS provider. For example, the auth service:

```ts
// frontend/src/services/auth/authService.ts
constructor() {
  if (config.APP_MODE === 'aws') {
    this.provider = new CognitoAuthProvider();   // calls your Lambda
  } else {
    this.provider = new MockAuthProvider();       // uses localStorage
  }
}
```

The same pattern applies to the chat service, document service, vector search service, and AI service. The backend's only job is to answer the HTTP calls that the real providers already make.

---

## 3. The Response Contract

Every single Lambda response must follow this exact JSON shape. The frontend parses `json.data` everywhere and will break silently if the shape is wrong.

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document does not exist"
  }
}
```

Create a shared `response.ts` utility in the backend that every Lambda imports, so the shape is always consistent:

```ts
// backend/shared/response.ts

export const ok = (data: unknown, message = "Operation successful") => ({
  statusCode: 200,
  body: JSON.stringify({ success: true, message, data }),
});

export const err = (code: string, message: string, statusCode = 400) => ({
  statusCode,
  body: JSON.stringify({ success: false, error: { code, message } }),
});
```

---

## 4. Recommended Backend Folder Structure

The backend folder is currently empty. It should be structured as follows for AWS SAM deployment:

```
backend/
  template.yaml                ← SAM template defining all Lambdas, API Gateway, DynamoDB, S3
  package.json                 ← root dependencies (TypeScript, AWS SDK, pdf-parse, etc.)
  tsconfig.json

  functions/
    auth/
      handler.ts               ← login, logout, /me, switch-role
    chat/
      handler.ts               ← send message (RAG pipeline), sessions CRUD
    documents/
      handler.ts               ← upload initiation, list, get, delete, approve
    ingestion/
      handler.ts               ← S3-triggered, runs the full ingestion pipeline
    feedback/
      handler.ts               ← submit message rating and comment

  shared/
    dynamodb.ts                ← DynamoDB DocumentClient + table name helper
    opensearch.ts              ← OpenSearch client helper
    bedrock.ts                 ← Bedrock client (embedding + generation calls)
    auth.ts                    ← JWT verification middleware used by all Lambdas
    response.ts                ← Standard response formatter (described above)
```

---

## 5. DynamoDB Table Design

The system uses a **single-table design**. One DynamoDB table holds all application state. Records are separated by their partition key (`PK`) and sort key (`SK`) pattern.

### Table Name

```
hypervisor-support-platform
```

### Key Patterns

| Entity            | PK                      | SK                    | What It Stores                                                  |
| ----------------- | ----------------------- | --------------------- | --------------------------------------------------------------- |
| User profile      | `USER#<userId>`         | `PROFILE`             | name, email, role, title, department, avatar                    |
| Chat session      | `USER#<userId>`         | `SESSION#<sessionId>` | title, category, lastMessage, updatedAt, messageCount, isPinned |
| Message           | `SESSION#<sessionId>`   | `MESSAGE#<timestamp>` | sender, content, timestamp, sources, suggestedFollowups         |
| Document metadata | `DOCUMENT#<documentId>` | `METADATA`            | title, fileName, s3Key, status, approvalStatus, metadata object |
| Document version  | `DOCUMENT#<documentId>` | `VERSION#<number>`    | version-specific metadata snapshot                              |
| Message feedback  | `MESSAGE#<messageId>`   | `FEEDBACK`            | rating, comment, submittedBy, submittedAt                       |
| Audit log         | `AUDIT#<date>`          | `EVENT#<timestamp>`   | eventType, actorId, resourceId, detail                          |

### Example Records

**User Profile:**

```json
{
  "PK": "USER#student001",
  "SK": "PROFILE",
  "name": "James Wilson",
  "email": "j.wilson@hypervisor.edu",
  "role": "STUDENT",
  "title": "Undergraduate",
  "department": "Computer Science & Artificial Intelligence",
  "avatar": "https://..."
}
```

**Chat Session:**

```json
{
  "PK": "USER#student001",
  "SK": "SESSION#chat-1722300000000",
  "sessionId": "chat-1722300000000",
  "title": "Library Fine Inquiry",
  "category": "Academic",
  "lastMessage": "How much is the library fine?",
  "updatedAt": "2024-10-14T10:30:00Z",
  "messageCount": 4,
  "isPinned": false,
  "isArchived": false
}
```

**Message:**

```json
{
  "PK": "SESSION#chat-1722300000000",
  "SK": "MESSAGE#1722300001000",
  "messageId": "msg-1722300001000",
  "sender": "assistant",
  "content": "According to the 2024 Student Handbook...",
  "timestamp": "10:30 AM",
  "ragVerification": {
    "sourceCount": 2,
    "sources": [
      {
        "document": "2024_Student_Handbook.pdf",
        "page": 88,
        "section": "Section 7.3: Library Rules and Fines",
        "confidence": 0.97,
        "snippet": "Overdue loans incur a late fee of $1.50 per day..."
      }
    ]
  },
  "suggestedFollowups": ["What happens if I lose a library book?"]
}
```

**Document Metadata:**

```json
{
  "PK": "DOCUMENT#doc-1722300000000",
  "SK": "METADATA",
  "documentId": "doc-1722300000000",
  "title": "2024 Student Handbook",
  "fileName": "Student_Handbook_2024.pdf",
  "s3Key": "documents/institution/doc-1722300000000/v1/Student_Handbook_2024.pdf",
  "status": "COMPLETED",
  "approvalStatus": "PENDING_REVIEW",
  "checksum": "sha256:abc123...",
  "metadata": {
    "category": "Academic Affairs",
    "department": "Academic Registry",
    "author": "Prof. Adrian Voss",
    "version": "v2.4",
    "pageCount": 142,
    "fileSize": "4.2 MB",
    "uploadedAt": "2024-10-14T09:00:00Z"
  },
  "uploadedBy": "USER#admin001"
}
```

---

## 6. S3 Bucket Structure

Documents are stored with the following key pattern:

```
documents/
  institution/
    <documentId>/
      v1/
        original-filename.pdf
      v2/
        updated-filename.pdf
```

The `documentId` is generated by the Document Lambda before the pre-signed URL is issued. The frontend then uploads directly to S3 using that URL — the Lambda never handles the file bytes.

---

## 7. OpenSearch Index Design

The OpenSearch Serverless index stores document chunks and their vector embeddings for RAG search.

### Index Name

```
hypervisor-document-chunks
```

### Document Schema

```json
{
  "chunkId": "doc-001-chunk-003",
  "documentId": "doc-001",
  "documentTitle": "2024 Student Handbook",
  "content": "Library Regulations & Late Overdue Fines: Standard book loan duration is 14 days...",
  "embedding": [0.023, -0.441, 0.892, 0.105, ...],
  "metadata": {
    "pageNumber": 88,
    "section": "Section 7.3: Library Rules and Fines",
    "documentVersion": "v2.4",
    "approvalStatus": "APPROVED"
  }
}
```

### Index Mapping (knn vector field)

```json
{
  "mappings": {
    "properties": {
      "embedding": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {
          "name": "hnsw",
          "engine": "nmslib"
        }
      },
      "content": { "type": "text" },
      "documentId": { "type": "keyword" },
      "metadata.approvalStatus": { "type": "keyword" }
    }
  }
}
```

The `approvalStatus` field in the metadata is critical. The Chat Lambda's vector search query must filter to only `APPROVED` chunks — documents that have been processed but not yet approved by an admin must never appear in student answers.

---

## 8. Lambda 1 — Auth Lambda

### What the Mock Does

The `MockAuthProvider` stores a user in `localStorage`. Any email is accepted. If the email is unrecognised, a new user is invented on the spot. There is no real password check.

### What This Lambda Must Do

This Lambda is called by `CognitoAuthProvider` in the frontend. It is the gatekeeper — it validates Cognito credentials and returns the user profile.

### Endpoints

```
POST /api/v1/auth/cognito/login    ← takes { email, password }
POST /api/v1/auth/cognito/logout   ← invalidates the session
GET  /api/v1/auth/me               ← returns current user from JWT claims
POST /api/v1/auth/switch-role      ← updates role (admin utility for dev/testing)
```

### Login Flow

1. Receive `{ email, password }` from the frontend.
2. Call Cognito `InitiateAuth` with `USER_PASSWORD_AUTH` flow.
3. Cognito validates credentials and returns an `AccessToken` and `IdToken`.
4. Decode the `IdToken` to get `sub` (the Cognito user ID).
5. Fetch the user profile from DynamoDB using `PK: USER#<sub>, SK: PROFILE`.
6. Return the profile with the token attached:

```json
{
  "success": true,
  "data": {
    "id": "student001",
    "name": "James Wilson",
    "email": "j.wilson@hypervisor.edu",
    "role": "STUDENT",
    "title": "Undergraduate",
    "department": "Computer Science & Artificial Intelligence",
    "avatar": "https://...",
    "token": "<CognitoAccessToken>"
  }
}
```

### /auth/me Flow

1. Read the `Authorization: Bearer <token>` header.
2. Verify the JWT signature against the Cognito JWKS endpoint.
3. Extract user identity from the token claims.
4. Fetch profile from DynamoDB and return it.

No Cognito API call is needed for `/auth/me` — JWT verification is local using the public keys.

### Shared JWT Verification

Every other Lambda must also verify the JWT before processing any request. Put this in `shared/auth.ts` and import it at the top of every handler:

```ts
// backend/shared/auth.ts
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`,
});

export async function verifyToken(
  token: string,
): Promise<{ userId: string; role: string }> {
  // Verify signature, expiry, and extract claims
  // Throw if invalid — the handler catches it and returns 401
}
```

---

## 9. Lambda 2 — Chat Lambda

### What the Mock Does

The `MockChatService.sendMessage()` runs the full RAG pipeline in the browser:

1. Keyword-scores 10 pre-written chunks from `mock/embeddings.json`
2. Passes top chunks to `GeminiProvider` which calls a template synthesizer
3. Returns a structured answer with fake source citations

### What This Lambda Must Do

This Lambda runs the same pipeline with real AWS services.

### Endpoints

```
POST /api/v1/chat                                   ← send message, run RAG pipeline
GET  /api/v1/chat/sessions                          ← list all sessions for current user
POST /api/v1/chat/sessions                          ← create a new session
GET  /api/v1/chat/sessions/{sessionId}/messages     ← get all messages in a session
DELETE /api/v1/chat/sessions/{sessionId}            ← delete session
POST /api/v1/chat/sessions/{sessionId}/pin          ← pin or unpin a session
```

### Send Message — The RAG Pipeline

This is the core of the entire platform. When the frontend posts `{ sessionId, content }`:

**Step 1 — Authenticate**

Verify the JWT from the request header using `shared/auth.ts`. Extract `userId`. Reject with 401 if invalid.

**Step 2 — Save the student message**

Write to DynamoDB immediately so the message is never lost, even if the AI step fails:

```
PK: SESSION#<sessionId>    SK: MESSAGE#<Date.now()>
{ messageId, sender: "student", content, timestamp }
```

**Step 3 — Embed the question**

Call Bedrock Titan Embeddings to convert the student's question into a 1536-dimension vector:

```ts
// backend/shared/bedrock.ts
const response = await bedrockRuntime.invokeModel({
  modelId: "amazon.titan-embed-text-v2:0",
  body: JSON.stringify({ inputText: content }),
});
const { embedding } = JSON.parse(response.body.toString());
// embedding is number[1536]
```

**Step 4 — Search OpenSearch**

Use the embedding to find the most semantically similar document chunks. The query filters to only `APPROVED` documents:

```json
{
  "size": 5,
  "query": {
    "bool": {
      "must": {
        "knn": {
          "embedding": {
            "vector": [ ...queryEmbedding ],
            "k": 5
          }
        }
      },
      "filter": {
        "term": { "metadata.approvalStatus": "APPROVED" }
      }
    }
  }
}
```

OpenSearch returns the top 5 chunks with their content, document title, page number, and section.

**Step 5 — Build the prompt and call Bedrock**

Assemble the context and call the generation model. The system instruction keeps the assistant grounded in the retrieved documents only:

```ts
const systemInstruction = `You are the official AI Academic Assistant for Hypervisor Educational Complex.
Answer student questions using ONLY the provided institutional context chunks.
Keep your response concise, well-structured, professional, and clear.
Use bullet points for lists and bold text for key criteria.
If the context does not contain the answer, respond with:
"I could not find this information in the available institutional documents. Please contact the appropriate department."`;

const contextText = chunks
  .map(
    (c) =>
      `Document: ${c.documentTitle} (Page ${c.pageNumber}, ${c.section})\nContent: ${c.content}`,
  )
  .join("\n\n");

const userContent = `Context Chunks:\n${contextText}\n\nStudent Question: ${content}`;
```

Call `amazon.nova-lite-v1:0` (or the model configured in environment variables) with `temperature: 0.2` to keep answers factual and consistent.

**Step 6 — Build and save the assistant message**

```ts
const assistantMsg = {
  messageId: `msg-${Date.now()}`,
  sender: "assistant",
  content: bedrockAnswer,
  timestamp: new Date().toISOString(),
  ragVerification: {
    sourceCount: chunks.length,
    sources: chunks.map((chunk, idx) => ({
      document: `${chunk.documentTitle.replace(/\s+/g, "_")}.pdf`,
      page: chunk.pageNumber,
      section: chunk.section,
      confidence: Math.round((0.98 - idx * 0.05) * 100) / 100,
      snippet: chunk.content.slice(0, 120) + "...",
    })),
  },
  suggestedFollowups: [
    /* derive from topic or let Bedrock suggest */
  ],
};
```

Write it to DynamoDB under `PK: SESSION#<sessionId>, SK: MESSAGE#<timestamp>` and return it to the frontend.

**Step 7 — Update the session record**

Update the `lastMessage` and `updatedAt` fields on the session record so the conversations list stays current.

### Session CRUD

These endpoints are straightforward DynamoDB operations:

- **List sessions**: Query `PK = USER#<userId>` with SK beginning with `SESSION#`. Sort by `updatedAt` descending.
- **Create session**: `PutItem` with a new session record under `USER#<userId>`.
- **Get messages**: Query `PK = SESSION#<sessionId>` with SK beginning with `MESSAGE#`. Sort by timestamp ascending.
- **Delete session**: `DeleteItem` for the session, then batch-delete all messages under it.
- **Pin session**: `UpdateItem` to set `isPinned = true/false`.

---

## 10. Lambda 3 — Document Lambda

### What the Mock Does

The `MockDocumentService.uploadDocument()` creates a fake document record in `localStorage`, uses `URL.createObjectURL()` to fake a download URL, and runs `setTimeout` chains to simulate status changes (`PROCESSING → EMBEDDING → COMPLETED`).

### What This Lambda Must Do

The real document upload is a two-step process. The Lambda never handles the actual file bytes — this is intentional to keep Lambda fast and cheap.

### Endpoints

```
POST   /api/v1/documents                        ← initiate upload, get pre-signed URL
GET    /api/v1/documents                        ← list all documents
GET    /api/v1/documents/{documentId}           ← get single document
DELETE /api/v1/documents/{documentId}           ← delete document and all its chunks
POST   /api/v1/documents/{documentId}/approve   ← approve or reject document
```

### Upload Flow — Step 1: Frontend Requests a Pre-Signed URL

The frontend sends:

```json
{
  "fileName": "Admissions_Policy_2024.pdf",
  "metadata": {
    "category": "Academic Affairs",
    "department": "Admissions Office",
    "author": "Dean of Admissions"
  }
}
```

The Lambda:

1. Generates a `documentId` (e.g. `doc-${Date.now()}`).
2. Writes a DynamoDB record with `status: UPLOADED, approvalStatus: PENDING_REVIEW`.
3. Generates a pre-signed S3 URL valid for 10 minutes using `PutObject` for key `documents/institution/<documentId>/v1/<fileName>`.
4. Returns both to the frontend:

```json
{
  "success": true,
  "data": {
    "documentId": "doc-1722300000000",
    "uploadUrl": "https://s3.amazonaws.com/...?X-Amz-Signature=..."
  }
}
```

### Upload Flow — Step 2: Frontend Uploads Directly to S3

The frontend uses the `uploadUrl` to PUT the file directly to S3. The Lambda is not involved. When S3 receives the file, it fires an S3 Event that triggers the Ingestion Worker Lambda automatically.

### Approve / Reject Document

```json
POST /api/v1/documents/{documentId}/approve
Body: { "status": "APPROVED" }
```

The Lambda:

1. Updates `approvalStatus` in DynamoDB to `APPROVED` or `REJECTED`.
2. Updates `metadata.approvalStatus` on all OpenSearch chunks for this `documentId` to `APPROVED` or `REJECTED`.

Step 2 is critical — without it, the Chat Lambda's filtered OpenSearch search will never return the document's chunks to students, even though processing is complete.

### Delete Document

1. Delete the DynamoDB metadata record.
2. Delete the S3 object at the document's `s3Key`.
3. Delete all OpenSearch chunks where `documentId` matches.

---

## 11. Lambda 4 — Ingestion Worker Lambda

### What the Mock Does

Three `setTimeout` chains in `MockDocumentService` fake the pipeline stages. After the final timeout, `vectorSearchService.addChunk()` pushes a single hardcoded chunk into an in-memory array with a trivial 10-dimension embedding.

### What This Lambda Must Do

This Lambda is triggered **automatically by S3** when a document is uploaded. It is not called by the frontend directly. It does the real work the mock only pretends to do.

This is the most complex Lambda. It runs a multi-stage pipeline.

### Trigger

Configure this in `template.yaml`:

```yaml
IngestionWorkerFunction:
  Type: AWS::Serverless::Function
  Properties:
    Events:
      S3Upload:
        Type: S3
        Properties:
          Bucket: !Ref DocumentBucket
          Events: s3:ObjectCreated:*
          Filter:
            S3Key:
              Rules:
                - Name: prefix
                  Value: documents/institution/
```

### Pipeline Stages

**Stage 1 — Validate the file**

Update DynamoDB `status: PROCESSING`.

- Check the file's MIME type and extension (accept: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`).
- Reject password-protected PDFs.
- Compute a SHA-256 checksum of the file bytes. Store it in DynamoDB. If the checksum already exists for another document, flag as duplicate.

**Stage 2 — Extract text**

Parse the document to get raw text:

- **PDF**: Use `pdf-parse` npm package. Extract text page by page, preserving page numbers.
- **DOCX**: Use `mammoth` npm package. Convert to plain text.
- **TXT**: Read directly from S3 stream.

Store the extracted text in memory — it will be used in the next two stages.

**Stage 3 — AI Metadata Extraction**

Send the first 2000 characters to Bedrock and ask it to extract structured metadata:

```ts
const metadataPrompt = `Extract the following fields from this institutional document text.
Return only valid JSON with these exact keys:
{ "title": "", "description": "", "documentType": "", "department": "", "academicYear": "", "tags": [] }

Document text:
${extractedText.slice(0, 2000)}`;
```

Update the DynamoDB record with the extracted metadata. The admin will see this pre-filled metadata when they review the document for approval.

**Stage 4 — Semantic Chunking**

Update DynamoDB `status: EMBEDDING`.

Split the extracted text into chunks. Each chunk should be:

- Around 400–600 tokens (roughly 300–450 words)
- With a 100-token overlap between consecutive chunks (so context at chunk boundaries is not lost)
- Tagged with its page number and an inferred section heading

Each chunk gets a unique ID: `<documentId>-chunk-<sequenceNumber>`.

**Stage 5 — Generate Embeddings**

For each chunk, call Bedrock Titan Embeddings V2:

```ts
const response = await bedrockRuntime.invokeModel({
  modelId: process.env.BEDROCK_EMBEDDING_MODEL_ID, // amazon.titan-embed-text-v2:0
  body: JSON.stringify({ inputText: chunk.content }),
});
const { embedding } = JSON.parse(response.body.toString());
// embedding is number[1536]
```

This is the most expensive part of the pipeline. A 50-page document might produce 30–40 chunks, which means 30–40 Bedrock API calls. Batch them with a small delay between calls to avoid throttling.

**Stage 6 — Store in OpenSearch**

Write each chunk to the OpenSearch index:

```json
{
  "chunkId": "doc-001-chunk-003",
  "documentId": "doc-001",
  "documentTitle": "2024 Student Handbook",
  "content": "Library Regulations & Late Overdue Fines...",
  "embedding": [ 0.023, -0.441, 0.892, ... ],
  "metadata": {
    "pageNumber": 88,
    "section": "Section 7.3: Library Rules and Fines",
    "documentVersion": "v2.4",
    "approvalStatus": "PENDING_REVIEW"
  }
}
```

Note `approvalStatus` is `PENDING_REVIEW` here — not `APPROVED`. The document is fully processed but not yet searchable by students. An admin must approve it first through the Document Lambda.

**Stage 7 — Complete**

Update DynamoDB `status: COMPLETED`.

Write an audit log entry: `DOCUMENT_PROCESSED`.

If any stage fails, update DynamoDB `status: FAILED` with an error message so the admin can see what went wrong.

---

## 12. Lambda 5 — Feedback Lambda

### What the Mock Does

The frontend has a `feedbackApi.ts` and a `Feedback` type, but in mock mode the submissions go nowhere.

### What This Lambda Must Do

```
POST /api/v1/messages/{messageId}/feedback
Body: { "rating": 4, "comment": "Very helpful, found the exact policy." }
```

The Lambda:

1. Verifies the JWT and extracts `userId`.
2. Writes to DynamoDB:

```
PK: MESSAGE#<messageId>    SK: FEEDBACK
{ rating, comment, submittedBy: userId, submittedAt }
```

3. Publishes a CloudWatch metric `FeedbackRating` for monitoring average response quality over time.

---

## 13. The Full Journey — Document Upload to Student Answer

This section traces the complete lifecycle from an admin uploading a document to a student receiving an answer sourced from it.

```
1. Admin uploads "Library_Rules_2024.pdf"
        │
        ▼
2. POST /api/v1/documents → Document Lambda
   ├── Creates DynamoDB record (status: UPLOADED, approvalStatus: PENDING_REVIEW)
   └── Returns { documentId, uploadUrl }
        │
        ▼
3. Frontend PUTs file bytes directly to S3 pre-signed URL
        │
        ▼
4. S3 ObjectCreated event fires automatically
        │
        ▼
5. Ingestion Worker Lambda triggered
   ├── Validates PDF → status: PROCESSING
   ├── Extracts text (pdf-parse)
   ├── Bedrock extracts metadata (title, department, tags)
   ├── Splits into ~30 chunks → status: EMBEDDING
   ├── Bedrock Titan generates 1536-dim embedding per chunk
   ├── Writes 30 records to OpenSearch (approvalStatus: PENDING_REVIEW)
   └── Updates DynamoDB → status: COMPLETED
        │
        ▼
6. Admin sees document in dashboard with status COMPLETED
   Admin clicks Approve
        │
        ▼
7. POST /api/v1/documents/doc-001/approve → Document Lambda
   ├── Updates DynamoDB approvalStatus: APPROVED
   └── Updates all 30 OpenSearch chunks → approvalStatus: APPROVED
        │
        ▼
8. Student asks "What is the library fine for overdue books?"
        │
        ▼
9. POST /api/v1/chat → Chat Lambda
   ├── Verifies JWT
   ├── Saves student message to DynamoDB
   ├── Bedrock Titan embeds the question → vector[1536]
   ├── OpenSearch knn query (filter: approvalStatus = APPROVED)
   │   └── Returns top 5 chunks from Library_Rules_2024.pdf
   ├── Calls Bedrock Nova with question + 5 chunks as context
   ├── Bedrock returns: "Overdue loans incur a late fee of $1.50 per day..."
   ├── Saves assistant message + source citations to DynamoDB
   └── Returns response to frontend
        │
        ▼
10. Frontend renders answer with source panel showing:
    "2024_Student_Handbook.pdf — Page 88, Section 7.3 — Confidence: 97%"
```

---

## 14. Environment Variables

Every Lambda needs the following environment variables. Store sensitive values in AWS Secrets Manager and reference them in `template.yaml`.

```
AWS_REGION=eu-west-1
COGNITO_USER_POOL_ID=eu-west-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
DOCUMENT_BUCKET=hypervisor-documents-bucket
DYNAMODB_TABLE=hypervisor-support-platform
OPENSEARCH_ENDPOINT=https://xxxxxxxxxx.eu-west-1.aoss.amazonaws.com
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
BEDROCK_EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
```

---

## 15. Audit Logging

All significant actions must write an audit record to DynamoDB. This is required for governance, troubleshooting, and compliance.

| Event                   | Triggered By                          |
| ----------------------- | ------------------------------------- |
| `DOCUMENT_UPLOADED`     | Document Lambda — upload initiated    |
| `DOCUMENT_PROCESSED`    | Ingestion Worker — pipeline completed |
| `DOCUMENT_APPROVED`     | Document Lambda — admin approved      |
| `DOCUMENT_REJECTED`     | Document Lambda — admin rejected      |
| `DOCUMENT_DELETED`      | Document Lambda — admin deleted       |
| `USER_LOGIN`            | Auth Lambda — successful login        |
| `AI_RESPONSE_GENERATED` | Chat Lambda — assistant message saved |

Audit record format:

```
PK: AUDIT#<YYYY-MM-DD>    SK: EVENT#<timestamp>-<eventType>
{ eventType, actorId, resourceId, resourceType, detail, timestamp }
```

---

## 16. Local Development

AWS SAM CLI is used to run Lambda functions locally before deploying to AWS.

### Requirements

- Node.js 22+
- AWS CLI configured with credentials
- AWS SAM CLI installed
- Docker (required by SAM for local Lambda execution)

### Run All Lambdas Locally

```bash
cd backend
sam build
sam local start-api --env-vars env.json
```

Create `env.json` with local values for all environment variables listed in Section 14.

### Test the Ingestion Worker Locally

```bash
sam local invoke IngestionWorkerFunction --event events/s3-upload.json
```

Create `events/s3-upload.json` with a sample S3 event pointing to a test file.

---

## 17. What the Frontend Is Already Waiting For

The following files exist in the frontend right now and make the exact HTTP calls listed. The backend must serve these calls for `VITE_APP_MODE=aws` to work:

| Frontend File                                 | Calls                                                                                                                                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/auth/cognitoAuthProvider.ts`    | `POST /api/v1/auth/cognito/login`, `POST /api/v1/auth/cognito/logout`, `GET /api/v1/auth/me`, `POST /api/v1/auth/switch-role`                                                                         |
| `src/services/chat/lambdaChatService.ts`      | `POST /api/v1/chat`, `GET /api/v1/chat/sessions`, `POST /api/v1/chat/sessions`, `GET /api/v1/chat/sessions/{id}/messages`, `DELETE /api/v1/chat/sessions/{id}`, `POST /api/v1/chat/sessions/{id}/pin` |
| `src/services/documents/s3DocumentService.ts` | `POST /api/v1/documents`, `GET /api/v1/documents`, `GET /api/v1/documents/{id}`, `DELETE /api/v1/documents/{id}`, `POST /api/v1/documents/{id}/approve`                                               |
| `src/services/vector/openSearchProvider.ts`   | Calls OpenSearch directly (used internally by Chat Lambda, not from the browser)                                                                                                                      |
| `src/api/feedbackApi.ts`                      | `POST /api/v1/messages/{messageId}/feedback`                                                                                                                                                          |

No changes are needed in the frontend. The entire backend is a new project that answers these existing calls.
