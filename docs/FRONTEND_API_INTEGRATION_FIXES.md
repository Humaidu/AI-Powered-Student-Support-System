# Frontend API Integration Fixes

## Overview

The backend is working correctly. These are the frontend changes needed to match the actual backend API contract.

---

## ✅ Already Correct (No Changes Needed)

### 1. **API Base URL** - CORRECT ✅

**File:** `frontend/student-ai-support/.env`

```env
VITE_API_BASE_URL="https://dz8ce1v7da.execute-api.us-east-1.amazonaws.com/api/v1"
```

✅ This matches the backend exactly.

### 2. **Authentication Token** - CORRECT ✅

**File:** `frontend/student-ai-support/src/services/auth/cognitoAuthProvider.ts`

Current code uses **access token**:

```typescript
token: accessToken.getJwtToken(),
```

✅ This is correct. Despite the API contract documentation saying "id_token", the working curl example from the backend developer uses the access token, and this is what API Gateway JWT authorizers typically expect.

### 3. **Authorization Header** - CORRECT ✅

**File:** `frontend/student-ai-support/src/api/client.ts`

```typescript
if (token) {
  defaultHeaders.Authorization = `Bearer ${token}`;
}
```

✅ Correctly formats the Bearer token header.

### 4. **Chat Send Message** - CORRECT ✅

**File:** `frontend/student-ai-support/src/services/chat/lambdaChatService.ts`

Request to `POST /chat`:

```typescript
body: JSON.stringify({ sessionId, message: content });
```

✅ Matches backend contract exactly (sessionId + message fields).

### 5. **Response Envelope Handling** - CORRECT ✅

**File:** `frontend/student-ai-support/src/api/client.ts`

Handles both `{success, data}` and `{success, error}` response formats.
✅ Matches backend envelope structure.

---

## 🔧 Changes Required

### 1. **Document Upload Flow** ⚠️ CRITICAL CHANGE

**Problem:**
Current code tries to upload via FormData directly to the API endpoint. The backend actually uses a two-step process:

1. POST metadata → get presigned S3 URL
2. PUT file directly to S3

**File:** `frontend/student-ai-support/src/services/documents/s3DocumentService.ts`

**Current Code (WRONG):**

```typescript
async uploadDocument(file: File, metadata?: Partial<Document['metadata']>): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const res = await apiClient<Document>('/documents', {
    method: 'POST',
    body: formData
  });
  if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to upload document');
  return res.data;
}
```

**Required Fix:**

```typescript
async uploadDocument(file: File, metadata?: Partial<Document['metadata']>): Promise<Document> {
  // Step 1: Get presigned upload URL from backend
  const uploadMetadata = {
    title: metadata?.title || file.name,
    description: metadata?.description || '',
    documentType: metadata?.documentType || 'general',
    department: metadata?.department || '',
    academicYear: metadata?.academicYear || '',
    tags: metadata?.tags || [],
    mimeType: file.type,
    fileSize: file.size
  };

  const metadataRes = await apiClient<{
    documentId: string;
    uploadUrl: string;
    s3Key: string;
    expiresIn: number;
    processingStatus: string;
  }>('/documents', {
    method: 'POST',
    body: JSON.stringify(uploadMetadata)
  });

  if (!metadataRes.success || !metadataRes.data) {
    throw new Error(metadataRes.error?.message || 'Failed to get upload URL');
  }

  const { uploadUrl, documentId } = metadataRes.data;

  // Step 2: Upload file directly to S3 using presigned URL
  const s3Response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!s3Response.ok) {
    throw new Error(`S3 upload failed: ${s3Response.statusText}`);
  }

  // Step 3: Return document metadata (fetch it to get current status)
  const docRes = await apiClient<Document>(`/documents/${documentId}`);
  if (!docRes.success || !docRes.data) {
    throw new Error('Upload succeeded but failed to fetch document metadata');
  }

  return docRes.data;
}
```

**Why This Matters:**

- The backend expects JSON metadata, not FormData
- Direct S3 upload is faster and doesn't route large files through Lambda (25MB limit)
- The presigned URL expires in 300 seconds (5 minutes)

---

### 2. **Document List Response Format** ⚠️ MEDIUM PRIORITY

**Problem:**
Backend returns `{success: true, data: {documents: [...], count: 1}}` but frontend expects `{success: true, data: [...]}`.

**File:** `frontend/student-ai-support/src/services/documents/s3DocumentService.ts`

**Current Code:**

```typescript
async getDocuments(): Promise<Document[]> {
  const res = await apiClient<Document[]>('/documents');
  if (!res.success) throw new Error(res.error?.message || 'Failed to load documents');
  return res.data || [];
}
```

**Required Fix:**

```typescript
async getDocuments(): Promise<Document[]> {
  const res = await apiClient<{ documents: Document[]; count: number }>('/documents');
  if (!res.success) throw new Error(res.error?.message || 'Failed to load documents');

  // Backend returns {documents: [...], count: N}
  const documents = res.data?.documents || [];
  return documents;
}
```

**Alternative (More Defensive):**

```typescript
async getDocuments(): Promise<Document[]> {
  const res = await apiClient<{ documents?: Document[]; count?: number } | Document[]>('/documents');
  if (!res.success) throw new Error(res.error?.message || 'Failed to load documents');

  // Handle both {documents: [...]} and [...] formats for backward compatibility
  if (Array.isArray(res.data)) {
    return res.data;
  }
  return res.data?.documents || [];
}
```

---

### 3. **Create Chat Session Request Body** ℹ️ LOW PRIORITY (WORKS BUT INEFFICIENT)

**Problem:**
Frontend sends `title` and `category` but backend ignores them (accepts empty body).

**File:** `frontend/student-ai-support/src/services/chat/lambdaChatService.ts`

**Current Code:**

```typescript
async createSession(title?: string, category?: string): Promise<ChatSession> {
  const res = await apiClient<BackendChatSession>('/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ title, category })  // Backend ignores these
  });
  // ...
}
```

**Suggested Fix (Optional):**

```typescript
async createSession(title?: string, category?: string): Promise<ChatSession> {
  // Backend doesn't accept title/category in request body, but we keep
  // the signature for frontend compatibility
  const res = await apiClient<BackendChatSession>('/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({})  // Or just omit body entirely
  });
  if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to create session');
  return mapSession(res.data);
}
```

**Impact:** This still works (backend ignores extra fields), so it's not critical to fix.

---

### 4. **Document Approval Endpoint** ⚠️ VERIFY

**Current Implementation:**

```typescript
async approveDocument(documentId: string, status: ApprovalStatus): Promise<Document> {
  const res = await apiClient<Document>(`/documents/${documentId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
  // ...
}
```

**Backend Contract:**

- Endpoint: `POST /api/v1/documents/{documentId}/approve`
- Request body: **NONE** (the contract doesn't mention a body)
- Response: `{ documentId, approvalStatus: "APPROVED" }`

**Potential Issue:**
The backend might not accept a `status` field. The approve endpoint likely just sets status to "APPROVED" without accepting input.

**Check with backend team:** Does `/approve` endpoint accept a status field, or does it just set to APPROVED?

**If no body accepted, fix:**

```typescript
async approveDocument(documentId: string, status: ApprovalStatus = 'APPROVED'): Promise<Document> {
  const res = await apiClient<{ documentId: string; approvalStatus: string }>(`/documents/${documentId}/approve`, {
    method: 'POST',
    // No body - backend just approves
  });
  if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to approve document');

  // Fetch full document to return
  const docRes = await apiClient<Document>(`/documents/${documentId}`);
  return docRes.data!;
}
```

---

## 📝 Summary of Changes

| Priority    | Component        | File                   | Issue                                         | Status                   |
| ----------- | ---------------- | ---------------------- | --------------------------------------------- | ------------------------ |
| 🔴 CRITICAL | Document Upload  | `s3DocumentService.ts` | Wrong upload flow (FormData vs presigned URL) | **Must Fix**             |
| 🟡 MEDIUM   | Document List    | `s3DocumentService.ts` | Response format mismatch `{documents:[]}`     | **Should Fix**           |
| 🔵 LOW      | Create Session   | `lambdaChatService.ts` | Sends ignored fields                          | Works but wasteful       |
| ❓ VERIFY   | Document Approve | `s3DocumentService.ts` | Body may not be accepted                      | **Confirm with backend** |

---

## 🧪 Testing Checklist

After making the fixes:

### Document Upload Flow

1. ✅ Admin logs in
2. ✅ Upload a PDF via Admin Dashboard
3. ✅ Verify file appears in S3 bucket (check AWS console)
4. ✅ Wait for processingStatus to become "COMPLETED"
5. ✅ Approve the document
6. ✅ Verify approvalStatus becomes "APPROVED"

### Document List

1. ✅ Student logs in
2. ✅ Navigate to AI Assistant
3. ✅ Verify approved documents are used in responses

### Chat Flow

1. ✅ Student creates new chat session
2. ✅ Send message: "What time does the library close?"
3. ✅ Verify response includes sources from approved documents
4. ✅ Check that sources display documentId and pageNumber

---

## 🔍 How to Verify Backend Responses

Use browser DevTools Network tab to inspect actual responses:

### Check Document List Response:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "documents": [...],  // Array is nested under "documents" key
    "count": 5
  }
}
```

### Check Upload Response:

```json
{
  "success": true,
  "message": "Upload URL generated...",
  "data": {
    "documentId": "uuid",
    "uploadUrl": "https://bucket.s3.amazonaws.com/...",
    "expiresIn": 300,
    "processingStatus": "UPLOADED"
  }
}
```

### Check Chat Response:

```json
{
  "success": true,
  "message": "Response generated",
  "data": {
    "messageId": "uuid",
    "sessionId": "uuid",
    "answer": "According to...",
    "sources": [{ "documentId": "uuid", "chunkId": "uuid", "pageNumber": 4 }],
    "createdAt": 1721990460
  }
}
```

---

## 📞 Questions for Backend Team

1. **Document Approval:** Does `POST /documents/{id}/approve` accept a request body with status field, or does it just set to APPROVED automatically?

2. **Token Type:** The API contract doc says "id_token" but the working curl uses access token. Which is correct? (Frontend currently uses access token and it works)

3. **Response Format:** Are all list endpoints going to return `{items: [...], count: N}` format, or will some return flat arrays?
