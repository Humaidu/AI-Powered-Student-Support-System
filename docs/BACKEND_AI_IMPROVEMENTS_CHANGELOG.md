# Backend AI Improvements - Changelog

**Branch:** `backend-update`  
**Date:** 2026-08-01  
**Status:** ✅ Implemented & Committed

---

## 🎯 Overview

Improved the AI assistant to be more conversational and user-friendly while maintaining strict accuracy for institutional information. Added document titles to source references for better UX.

---

## ✨ Changes Made

### 1. **Conversational System Prompt** (`backend/src/shared/ai_client.py`)

**Before:**

```python
SYSTEM_PROMPT = (
    "You are an academic support assistant for a university. You must answer "
    "ONLY using the provided document excerpts below — never use outside "
    "knowledge, and never invent information not present in the excerpts..."
)
```

**After:**

```python
SYSTEM_PROMPT = (
    "You are a friendly and helpful academic support assistant for Hypervisor Educational Complex. "
    "Your primary role is to help students and faculty find information from our institutional documents.\n\n"

    "**Conversation Guidelines:**\n"
    "1. Be warm and conversational - greet users, acknowledge their questions...\n"
    "2. For greetings (hi, hello, hey), general questions, or small talk, respond naturally...\n"
    "3. For questions about institutional policies:\n"
    "   - ONLY use information from the provided document excerpts\n"
    ...
)
```

**Impact:**

- ✅ AI can now handle greetings naturally
- ✅ Responds to "thanks" appropriately
- ✅ Redirects off-topic questions politely
- ✅ Still maintains strict accuracy for institutional information

---

### 2. **Document Title Enrichment** (`backend/src/chat/send_message/handler.py`)

**New Function:**

```python
def _enrich_sources_with_metadata(chunks: list[dict]) -> list[dict]:
    """Add document titles to source references for better UX."""
    enriched = []
    doc_cache = {}  # Cache to avoid duplicate DB lookups

    for chunk in chunks:
        doc_id = chunk["documentId"]

        if doc_id not in doc_cache:
            doc = get_document(doc_id)
            doc_cache[doc_id] = doc.get("title", "Institutional Document") if doc else "Institutional Document"

        enriched.append({
            "documentId": doc_id,
            "documentTitle": doc_cache[doc_id],
            "chunkId": chunk["chunkId"],
            "pageNumber": chunk.get("pageNumber")
        })

    return enriched
```

**Before:**

```json
{
  "sources": [
    { "documentId": "80dba893...", "chunkId": "200c4df8...", "pageNumber": 1 }
  ]
}
```

**After:**

```json
{
  "sources": [
    {
      "documentId": "80dba893...",
      "documentTitle": "Student Handbook 2026",
      "chunkId": "200c4df8...",
      "pageNumber": 1
    }
  ]
}
```

**Impact:**

- ✅ Frontend displays "Student Handbook 2026" instead of UUID garbage
- ✅ Cached lookups prevent N+1 query problems
- ✅ Backward compatible (frontend already handles this)

---

### 3. **Enhanced Context Building** (`backend/src/shared/ai_client.py`)

**Before:**

```python
def _build_context_text(context_chunks: list[dict]) -> str:
    return "\n\n".join(
        f"[Excerpt {i + 1} — document {c['documentId']}, page {c.get('pageNumber', '?')}]\n{c['content']}"
        for i, c in enumerate(context_chunks)
    )
```

**After:**

```python
def _build_context_text(context_chunks: list[dict]) -> str:
    """Build context with document titles for more natural AI citations."""
    from db import get_document

    parts = []
    doc_cache = {}

    for i, chunk in enumerate(context_chunks):
        doc_id = chunk['documentId']

        if doc_id not in doc_cache:
            doc = get_document(doc_id)
            doc_cache[doc_id] = doc.get('title', 'Institutional Document') if doc else 'Institutional Document'

        doc_title = doc_cache[doc_id]
        page_info = f"page {chunk.get('pageNumber', '?')}"

        parts.append(
            f"[Excerpt {i + 1} from {doc_title}, {page_info}]\n{chunk['content']}"
        )

    return "\n\n".join(parts)
```

**Impact:**

- ✅ AI sees "Student Handbook" instead of UUID
- ✅ Can cite sources more naturally: "According to the Student Handbook..."
- ✅ Better context = better quality responses

---

### 4. **API Documentation Update** (`backend/docs/API_CONTRACT.md`)

Updated `/api/v1/chat` POST endpoint documentation to show new `documentTitle` field in response.

---

## 📊 Expected Behavior Changes

### Example 1: Greeting

**User Input:**

```
Hi there!
```

**Before:**

```
I could not find this information in the available institutional documents.
Please contact the appropriate department.
```

**After:**

```
Hello! I'm here to help you find information about Hypervisor Educational Complex.
What can I help you with today?
```

---

### Example 2: Institutional Question

**User Input:**

```
What's the library policy?
```

**Before (Response):**

```
According to excerpt 1, the library is open Monday-Friday from 8:00 AM to 10:00 PM...

Sources:
- description80dba893-29c0-4b50-a589-9c62be0aede2 (Page 12)
```

**After (Response):**

```
According to the Library Services Handbook, the library is open Monday-Friday
from 8:00 AM to 10:00 PM...

Sources:
- Library Services Handbook (Page 12)
```

---

### Example 3: Thank You

**User Input:**

```
Thanks so much!
```

**Before:**

```
I could not find this information in the available institutional documents.
```

**After:**

```
You're very welcome! Let me know if you need anything else.
```

---

### Example 4: Off-Topic Question

**User Input:**

```
What's your favorite color?
```

**Before:**

```
I could not find this information in the available institutional documents.
```

**After:**

```
I don't have personal preferences, but I'm here to help you with information
about our institution! What would you like to know?
```

---

## 🔄 Frontend Compatibility

The frontend was already updated in the previous commit to handle `documentTitle`:

**File:** `frontend/src/services/chat/lambdaChatService.ts`

```typescript
type BackendSource = {
  documentId?: string;
  documentTitle?: string; // ✅ Already supported
  chunkId?: string;
  pageNumber?: number;
};

const mappedSources = (message.sources || []).map((source) => ({
  document:
    source.documentTitle || source.documentId || "Institutional Document",
  // ↑ Falls back to documentId if title not present (backward compatible)
  documentId: source.documentId,
  page: source.pageNumber || "-",
  section: source.chunkId ? `Chunk ${source.chunkId}` : "Referenced section",
  confidence: 0.9,
}));
```

**Status:** ✅ No frontend changes needed - already compatible!

---

## ✅ Testing Checklist

Before deploying to production, test these scenarios:

### Conversational Ability

- [ ] User says "hi" → AI greets warmly
- [ ] User says "hello" → AI greets warmly
- [ ] User says "thanks" → AI acknowledges politely
- [ ] User says "what's your name?" → AI redirects to institutional topics
- [ ] User asks off-topic question → AI redirects politely

### Institutional Accuracy

- [ ] User asks about library hours → AI answers from documents only
- [ ] User asks about exam policy → AI cites correct sources
- [ ] User asks unsupported question → AI says "I could not find..."
- [ ] No hallucination of institutional facts

### Source Display

- [ ] Sources show document titles not UUIDs
- [ ] Page numbers are accurate
- [ ] Multiple sources display correctly

### Performance

- [ ] Document title lookups don't cause noticeable latency
- [ ] Caching prevents redundant DB queries
- [ ] Response times remain acceptable (<5 seconds)

---

## 🚀 Deployment Instructions

### 1. Review Changes

```bash
git log --oneline backend-update
git diff main backend-update
```

### 2. Test Locally (if possible)

```bash
cd backend
python3 -m pytest tests/
```

### 3. Deploy Backend

```bash
cd terraform/backend
terraform plan
terraform apply
```

### 4. Smoke Test in Dev/Staging

- Send "hi" message - should get friendly greeting
- Ask institutional question - should show document titles in sources
- Verify response times are acceptable

### 5. Monitor in Production

- Check CloudWatch logs for errors
- Verify DynamoDB read patterns (should see get_document calls)
- Monitor Lambda execution time

---

## 📈 Metrics to Watch

### Before/After Comparison

| Metric                           | Before  | Expected After              |
| -------------------------------- | ------- | --------------------------- |
| User greetings handled naturally | 0%      | 100%                        |
| Source display UX                | UUIDs   | Readable titles             |
| AI citation quality              | Generic | Natural ("According to...") |
| Response time                    | ~2-4s   | ~2-5s (slight increase OK)  |
| User satisfaction                | Low     | Higher                      |

---

## 🐛 Known Limitations

1. **No Conversation History:** AI doesn't remember previous messages in the session. Each question is independent.
   - Future enhancement: Pass recent message history to AI for context

2. **English Only:** System prompt and responses are English-only.
   - Future enhancement: Multi-language support

3. **No Follow-up Suggestions:** AI doesn't proactively suggest related topics.
   - Future enhancement: Add "You might also be interested in..." suggestions

4. **Cache per Request:** Document title cache is per Lambda invocation, not global.
   - Impact: First few requests in a cold Lambda may be slightly slower
   - Mitigation: Lambda warm-up keeps cache hot

---

## 🔗 Related Documentation

- [AI_CONVERSATIONAL_IMPROVEMENTS.md](./AI_CONVERSATIONAL_IMPROVEMENTS.md) - Original improvement recommendations
- [API_CONTRACT.md](../backend/docs/API_CONTRACT.md) - Updated API documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [FRONTEND_BACKEND_INTEGRATION_STATUS.md](./FRONTEND_BACKEND_INTEGRATION_STATUS.md) - Integration status

---

## 📝 Notes for Backend Team

### Database Impact

- Added `get_document()` calls in hot path (message send)
- Mitigated with in-request caching
- Consider adding read capacity if DynamoDB throttling occurs

### AI Provider Support

- Changes work with both Bedrock and Gemini providers
- System prompt is provider-agnostic
- Document title enrichment happens before AI call

### Future Improvements

1. Add conversation history context (session memory)
2. Implement follow-up question suggestions
3. Add sentiment analysis for user satisfaction tracking
4. Optimize with global document title cache (ElastiCache?)

---

**Implemented by:** GitHub Copilot  
**Reviewed by:** [Pending]  
**Deployed by:** [Pending]  
**Deploy Date:** [Pending]
