# Required Backend Fixes for RAG Retrieval

## Problem Summary

The AI assistant always returns "I could not find this information in the available institutional documents" regardless of what documents have been uploaded and approved. This is caused by several integration issues between the backend components.

---

## Critical Issues Identified

### 1. **OpenSearch Region Mismatch** ⚠️ CRITICAL

**Location:** `backend/src/shared/vector_store.py`, line 16

**Current Code:**

```python
region = os.environ.get("AWS_REGION", "eu-west-1")
```

**Problem:**

- Your infrastructure is deployed in `us-east-1` (verified via terraform output)
- The code defaults to `eu-west-1` when AWS_REGION is not set
- This causes SigV4 signing to use the wrong region, leading to authentication failures
- OpenSearch queries silently fail and return 0 results

**Required Fix:**

```python
def _region_from_endpoint(endpoint: str) -> str:
    """Extract region from OpenSearch Serverless endpoint format:
    collection-id.REGION.aoss.amazonaws.com"""
    host = endpoint.replace("https://", "").replace("http://", "").strip("/")
    parts = host.split(".")
    for i, part in enumerate(parts):
        if part == "aoss" and i > 0:
            return parts[i - 1]
    return "us-east-1"  # fallback

def _client() -> OpenSearch:
    endpoint = os.environ["OPENSEARCH_ENDPOINT"].replace("https://", "").strip("/")
    region = (
        os.environ.get("AWS_REGION")
        or os.environ.get("AWS_DEFAULT_REGION")
        or _region_from_endpoint(endpoint)
    )
    credentials = boto3.Session().get_credentials()
    auth = AWSV4SignerAuth(credentials, region, "aoss")

    return OpenSearch(
        hosts=[{"host": endpoint, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=10,
    )
```

---

### 2. **Silent Error Swallowing in Chat Handler** ⚠️ HIGH PRIORITY

**Location:** `backend/src/chat/send_message/handler.py`, lines 68-73

**Current Code:**

```python
try:
    chunks = search(query_embedding, top_k=_TOP_K)
except Exception:
    # Vector search failing shouldn't crash the whole request — fall
    # through with zero chunks, which forces the standard "I couldn't
    # find this" response rather than an unrelated 500.
    chunks = []
```

**Problem:**

- Infrastructure failures (wrong region, missing index, permission issues) are hidden
- They appear identical to "no matching documents found"
- Makes debugging impossible since real errors are masked as normal "no results"

**Required Fix:**

```python
# 2. Vector search for the top-K most relevant document chunks
try:
    chunks = search(query_embedding, top_k=_TOP_K)
except Exception as exc:
    # Log the actual error for debugging
    print(f"OpenSearch retrieval failed: {exc}")
    # Return a clear infrastructure error instead of fake "no results"
    return server_error(
        "Knowledge retrieval is temporarily unavailable. Please try again shortly."
    )
```

### 3. **Index Setup Script Region Default** ⚠️ MEDIUM PRIORITY

**Location:** `backend/scripts/setup_opensearch_index.py`, line 113

**Current Code:**

```python
parser.add_argument("--region", default="eu-west-1", help="AWS region the collection is in (default: eu-west-1)")
```

**Problem:**

- Hardcoded eu-west-1 default doesn't match your us-east-1 deployment
- Running the script without --region will create the index with wrong region signatures
- Index creation might succeed but queries will fail

**Required Fix:**

```python
def infer_region_from_endpoint(endpoint: str) -> str:
    """Extract AWS region from OpenSearch Serverless endpoint"""
    host = endpoint.replace("https://", "").replace("http://", "").strip("/")
    parts = host.split(".")
    for i, part in enumerate(parts):
        if part == "aoss" and i > 0:
            return parts[i - 1]
    return "us-east-1"

def main():
    parser = argparse.ArgumentParser(...)
    parser.add_argument("--endpoint", help="...")
    parser.add_argument("--auto", action="store_true", help="...")
    parser.add_argument("--region", help="AWS region (auto-detected from endpoint if omitted)")
    parser.add_argument("--dimensions", type=int, default=1024, help="...")
    parser.add_argument("--force", action="store_true", help="...")
    args = parser.parse_args()

    if not args.endpoint and not args.auto:
        parser.error("Pass either --endpoint <url> or --auto")

    endpoint = args.endpoint or get_endpoint_from_terraform()
    region = args.region or infer_region_from_endpoint(endpoint)

    print(f"Target collection endpoint: {endpoint}")
    print(f"Region: {region}")

    client = build_client(endpoint, region)
    create_index(client, args.dimensions, args.force)
```

---

### 4. **Configurable Index Name** 🔧 OPTIONAL BUT RECOMMENDED

**Location:** `backend/src/shared/vector_store.py`

**Current Code:**

```python
_INDEX_NAME = "document-chunks"
```

**Problem:**

- Index name is hardcoded
- Can't easily test with different indices or support multiple environments

**Suggested Improvement:**

```python
def index_chunk(...):
    index_name = os.environ.get("OPENSEARCH_INDEX_NAME", "document-chunks")
    _client().index(index=index_name, ...)

def search(...):
    index_name = os.environ.get("OPENSEARCH_INDEX_NAME", "document-chunks")
    response = _client().search(index=index_name, ...)
```

---

## Frontend Integration Status ✅

The frontend has been updated and is working correctly:

1. ✅ **Authentication** - Cognito integration working
2. ✅ **API Client** - All requests use authenticated apiClient with Bearer tokens
3. ✅ **Response Mapping** - Backend chat response shapes are normalized to frontend models
4. ✅ **Error Handling** - Non-2xx responses are properly surfaced
5. ✅ **UI Guards** - Safe string handling prevents crashes on unexpected data types

**Frontend files updated:**

- `src/api/client.ts` - Enhanced auth and error handling
- `src/services/chat/lambdaChatService.ts` - Response normalization
- `src/services/auth/cognitoAuthProvider.ts` - Access token for API Gateway JWT
- `src/services/documents/s3DocumentService.ts` - Uses authenticated client
- `src/services/ai/bedrockProvider.ts` - Uses authenticated client
- `src/services/vector/openSearchProvider.ts` - Uses authenticated client
- `src/pages/AIAssistantPage.tsx` - Safe string handling

---

## Deployment Checklist

### Step 1: Create/Verify OpenSearch Index (ONE-TIME SETUP)

**From:** `backend/scripts/`

```bash
# Install dependencies if not already installed
pip install boto3 opensearch-py requests-aws4auth

# Run with auto-detection (recommended after fixes)
python3 setup_opensearch_index.py --auto

# Or specify endpoint explicitly
python3 setup_opensearch_index.py \
  --endpoint https://1y1gozu9l47ub9xkumi4.us-east-1.aoss.amazonaws.com

# Verify index was created
# (add --force flag to recreate if needed, but this destroys existing chunks)
```

**Expected Output:**

```
Target collection endpoint: https://1y1gozu9l47ub9xkumi4.us-east-1.aoss.amazonaws.com
Region: us-east-1
Creating index 'document-chunks' with 1024-dimension vectors...
Index 'document-chunks' created successfully.
```

### Step 2: Deploy Backend Code Changes

After applying the fixes above:

```bash
cd backend
# Package Lambdas (builds all functions into backend/build/)
./scripts/package_lambdas.sh

cd ../terraform/backend
# Deploy updated Lambda code
terraform apply
```

### Step 3: Verify Document Pipeline

1. **Upload a test document** via Admin Dashboard
2. **Check processing status:**

   ```bash
   aws dynamodb scan \
     --table-name hypervisor-student-support-app-dev \
     --filter-expression "begins_with(PK, :pk)" \
     --expression-attribute-values '{":pk":{"S":"DOCUMENT#"}}' \
     --query 'Items[*].[documentId.S, processingStatus.S, approvalStatus.S]'
   ```

   Expected: `["doc-id", "COMPLETED", "PENDING_REVIEW"]`

3. **Approve the document** via Admin Dashboard

4. **Verify chunks are indexed:**

   ```bash
   # From backend/scripts/
   python3 -c "
   import boto3
   from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

   endpoint = '1y1gozu9l47ub9xkumi4.us-east-1.aoss.amazonaws.com'
   credentials = boto3.Session().get_credentials()
   auth = AWSV4SignerAuth(credentials, 'us-east-1', 'aoss')

   client = OpenSearch(
       hosts=[{'host': endpoint, 'port': 443}],
       http_auth=auth,
       use_ssl=True,
       verify_certs=True,
       connection_class=RequestsHttpConnection
   )

   result = client.count(index='document-chunks')
   print(f\"Indexed chunks: {result['count']}\")
   "
   ```

   Expected: `Indexed chunks: <non-zero number>`

### Step 4: Test Chat Retrieval

1. **Open AI Assistant** in frontend
2. **Ask a question** related to uploaded documents
3. **Expected behavior:**
   - If retrieval works: Answer with sources shown
   - If infrastructure broken: "Knowledge retrieval is temporarily unavailable"
   - If no relevant docs: "I could not find this information..."

---

## Root Cause Analysis

### Why It Was Always Returning the Fallback

1. **OpenSearch region mismatch** → SigV4 signature invalid → queries fail with auth error
2. **Error swallowing in chat handler** → treats infrastructure failure as "no results"
3. **Empty chunks list** → `generate_answer()` returns `NO_ANSWER_MESSAGE` immediately
4. **Frontend sees normal response** → displays fallback text

### Why It Was Hard to Debug

- No error logs in CloudWatch (exception caught and hidden)
- No HTTP error to frontend (200 OK with fallback message)
- Indistinguishable from legitimate "no matching documents"

---

## Testing After Deployment

### Test 1: Index Health

```bash
cd backend/scripts
python3 setup_opensearch_index.py --auto
# Should show "already exists" if healthy
```

### Test 2: Document Pipeline

1. Upload PDF via Admin Dashboard
2. Wait for processing (check DynamoDB `processingStatus`)
3. Approve document
4. Verify chunk count increased

### Test 3: Chat Retrieval

1. Ask question matching document content
2. Verify sources are shown in response
3. Check CloudWatch logs for any errors

### Test 4: Error Handling

Temporarily break something (wrong index name) and verify you get:

- "Knowledge retrieval is temporarily unavailable" (not fallback)
- Error logged in CloudWatch

---

## Additional Notes

### Current Infrastructure (Verified)

- **Region:** us-east-1
- **API Endpoint:** https://dz8ce1v7da.execute-api.us-east-1.amazonaws.com
- **OpenSearch Endpoint:** https://1y1gozu9l47ub9xkumi4.us-east-1.aoss.amazonaws.com
- **DynamoDB Table:** hypervisor-student-support-app-dev
- **S3 Bucket:** hypervisor-student-support-documents-dev-317492541528

### Documents Must Be

1. **Uploaded** via Admin Dashboard
2. **Processing Status:** `COMPLETED` (ingestion worker finished)
3. **Approval Status:** `APPROVED` (admin approved)
4. **Indexed in OpenSearch** (chunks created with embeddings)

Only then will they be retrievable by chat queries.

---

## Summary

**High Priority Fixes (Required):**

1. ✅ Fix OpenSearch region detection in `vector_store.py`
2. ✅ Stop swallowing errors in `send_message/handler.py`
3. ✅ Fix region default in `setup_opensearch_index.py`

**After Deployment:**

1. Run index setup script
2. Upload and approve test document
3. Verify chat can retrieve content

**Expected Outcome:**

- Infrastructure errors are visible (not hidden as "no info found")
- Region is correctly auto-detected from endpoint
- Chat returns document content when available
- Clear error messages when retrieval is broken
