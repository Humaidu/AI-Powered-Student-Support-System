# AI Conversational & UX Improvements

## 🎯 Goal

Make the AI assistant more natural and conversational while maintaining accuracy and grounding in institutional documents.

---

## ✅ Current Status

### What's Working:

- ✅ **Page numbers are tracked!** Sources now show "Page 1", "Page 94", etc.
- ✅ AI retrieves relevant chunks from documents
- ✅ AI provides grounded answers from institutional content
- ✅ Source verification works

### What Needs Improvement:

- ❌ **No conversational ability** - Can't handle greetings, small talk, or basic questions
- ❌ **Source display shows document IDs** instead of readable document titles
- ❌ **Rigid responses** - Feels robotic, not like a helpful assistant

---

## 🔧 Backend Improvements Needed

### 1. **Make AI More Conversational** 🗣️ HIGH PRIORITY

**Current Problem:**
The system prompt is too restrictive. The AI refuses to engage in basic conversation.

**Current System Prompt** (`backend/src/shared/ai_client.py`):

```python
SYSTEM_PROMPT = (
    "You are an academic support assistant for a university. You must answer "
    "ONLY using the provided document excerpts below — never use outside "
    "knowledge, and never invent information not present in the excerpts. "
    "If the excerpts don't contain enough information to answer confidently, "
    f'respond with exactly: "{NO_ANSWER_MESSAGE}" '
    "When you do answer, be concise and cite which excerpt(s) you used."
)
```

**Recommended New System Prompt:**

```python
SYSTEM_PROMPT = (
    "You are a friendly and helpful academic support assistant for Hypervisor Educational Complex. "
    "Your primary role is to help students and faculty find information from our institutional documents.\n\n"

    "**Conversation Guidelines:**\n"
    "1. Be warm and conversational - greet users, acknowledge their questions, and provide helpful context\n"
    "2. For greetings, general questions, or small talk, respond naturally and helpfully\n"
    "3. For questions about institutional policies, procedures, or information:\n"
    "   - ONLY use information from the provided document excerpts\n"
    "   - Never invent or assume institutional information\n"
    "   - If the excerpts don't contain the answer, say: "
    f'"{NO_ANSWER_MESSAGE}"\n\n'

    "**Response Style:**\n"
    "- Be concise but friendly\n"
    "- Use natural language, not robotic phrases\n"
    "- When citing documents, integrate references naturally into your response\n"
    "- Offer to help with follow-up questions\n\n"

    "**Examples:**\n"
    "- User: 'Hi' → 'Hello! I'm here to help you find information about Hypervisor Educational Complex. What can I help you with today?'\n"
    "- User: 'What's the library hours?' → [Check excerpts, provide answer with source]\n"
    "- User: 'Thanks!' → 'You're welcome! Let me know if you need anything else.'\n"
    "- User: 'What's your favorite color?' → 'I don't have personal preferences, but I'm here to help you with information about our institution! What can I assist you with?'\n"
)
```

**Why This Works:**

- ✅ Maintains accuracy for institutional information (still grounded in documents)
- ✅ Allows natural conversation for greetings/general questions
- ✅ Feels more like a helpful assistant than a rigid search tool
- ✅ Improves user experience without compromising data integrity

---

### 2. **Include Document Titles in Sources** 📄 MEDIUM PRIORITY

**Current Problem:**
Backend returns only `documentId` in sources. Frontend displays UUIDs like:

```
description80dba893-29c0-4b50-a589-9c62be0aede2
```

**Current Backend Response** (`backend/src/chat/send_message/handler.py`):

```python
sources = [
    {"documentId": c["documentId"], "chunkId": c["chunkId"], "pageNumber": c.get("pageNumber")}
    for c in chunks
]
```

**Recommended Fix:**

Update `backend/src/chat/send_message/handler.py`:

```python
# After retrieving chunks, enrich them with document metadata
from db import get_document  # Add this import

def _enrich_sources_with_metadata(chunks: list[dict]) -> list[dict]:
    """Add document titles to source references"""
    enriched = []
    doc_cache = {}  # Cache to avoid duplicate DB lookups

    for chunk in chunks:
        doc_id = chunk["documentId"]

        # Get document metadata (cached)
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

# In lambda_handler, replace the sources line:
sources = _enrich_sources_with_metadata(chunks)
```

**Update API Response:**

```json
{
  "sources": [
    {
      "documentId": "80dba893-29c0-4b50-a589-9c62be0aede2",
      "documentTitle": "Student Handbook 2026",
      "chunkId": "200c4df8-8cf8-4bc6-9e91-d8a5bb012e65",
      "pageNumber": 1
    }
  ]
}
```

**Frontend Update Needed:**

Update `frontend/src/services/chat/lambdaChatService.ts`:

```typescript
const mappedSources = (message.sources || []).map((source) => ({
  document:
    source.documentTitle || source.documentId || "Institutional Document",
  documentId: source.documentId,
  page: source.pageNumber || "-",
  section: source.chunkId ? `Chunk ${source.chunkId}` : "Referenced section",
  confidence: 0.9,
}));
```

**Result:**
Instead of seeing:

```
description80dba893-29c0-4b50-a589-9c62be0aede2
```

Users will see:

```
Student Handbook 2026
```

---

### 3. **Improve Answer Generation Context** 🤖 LOW PRIORITY

**Current Issue:**
Claude gets just the raw chunks without context about what they're from.

**Enhancement:**

Update `backend/src/shared/ai_client.py` `generate_answer()` function:

```python
def generate_answer(question: str, chunks: list[dict]) -> str:
    if not chunks:
        return NO_ANSWER_MESSAGE

    # Build a richer context with document metadata
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        # Fetch document metadata for better context
        doc = get_document(chunk["documentId"])
        doc_title = doc.get("title", "Institutional Document") if doc else "Institutional Document"
        page_info = f" (Page {chunk['pageNumber']})" if chunk.get('pageNumber') else ""

        context_parts.append(
            f"[Excerpt {i} from {doc_title}{page_info}]\n{chunk['content']}\n"
        )

    context = "\n".join(context_parts)

    user_prompt = (
        f"Question: {question}\n\n"
        f"Relevant institutional documents:\n{context}\n\n"
        "Provide a helpful answer based on the excerpts above. "
        "Naturally reference which document(s) you're citing."
    )

    # ... rest of the function
```

**Result:**

- AI knows which document each excerpt is from
- Can cite sources more naturally: "According to the Student Handbook..."
- Better context leads to better answers

---

## 🎨 Example Interactions (After Improvements)

### Greeting

**User:** `Hi there!`

**AI:**

```
Hello! Welcome to the Hypervisor Educational Complex support assistant.
I'm here to help you find information about our policies, procedures, and services.
What can I help you with today?
```

### Institutional Question

**User:** `What's the library policy?`

**AI:**

```
According to the Library Services Handbook (Page 12), the library is open
Monday-Friday from 8:00 AM to 10:00 PM, and weekends from 10:00 AM to 6:00 PM.
Students can check out up to 10 books at a time for a 3-week period, with
one renewal allowed if there are no holds on the item.

Would you like to know more about any specific library services?
```

**Sources:**

- ✅ Library Services Handbook (Page 12)
- ✅ Student Guide to Campus Resources (Page 45)

### Small Talk

**User:** `Thanks so much!`

**AI:**

```
You're very welcome! If you have any other questions about Hypervisor
Educational Complex, feel free to ask. I'm here to help!
```

### Out-of-Scope Question

**User:** `Who won the World Cup?`

**AI:**

```
I'm specifically designed to help with information about Hypervisor Educational
Complex and our institutional policies. I don't have information about sports
results, but I'd be happy to help you find information about our athletics
programs or other campus resources. What would you like to know?
```

---

## 📊 Implementation Priority

| Priority      | Feature                      | Impact                   | Effort                          |
| ------------- | ---------------------------- | ------------------------ | ------------------------------- |
| 🔴 **HIGH**   | Conversational System Prompt | Huge UX improvement      | Low (just update prompt)        |
| 🟡 **MEDIUM** | Document Titles in Sources   | Better source visibility | Medium (DB lookup + API change) |
| 🔵 **LOW**    | Enriched Context for Claude  | Slightly better answers  | Medium (refactor generation)    |

---

## ✅ Testing Checklist (After Implementation)

### Conversational Ability

- [ ] Greetings are handled naturally ("Hi", "Hello", "Hey there")
- [ ] Thank yous get friendly responses
- [ ] Small talk is redirected politely to institutional topics
- [ ] Follow-up questions feel natural

### Institutional Accuracy

- [ ] Policy questions are answered only from documents
- [ ] Sources are cited naturally
- [ ] "I could not find this information" appears when appropriate
- [ ] No hallucination of institutional facts

### Source Display

- [ ] Document titles show instead of UUIDs
- [ ] Page numbers are accurate
- [ ] Chunk IDs are still available for debugging

---

## 🚀 Quick Win Implementation

**Start with Priority 1** (5 minutes of work):

1. Open `backend/src/shared/ai_client.py`
2. Replace the `SYSTEM_PROMPT` with the conversational version above
3. Deploy the Lambda
4. Test immediately - huge UX improvement!

**Then do Priority 2** (30 minutes):

1. Add document title enrichment to send_message handler
2. Update API response to include documentTitle
3. Update frontend to display documentTitle
4. Deploy both frontend and backend

---

## 💡 Additional Suggestions

### 1. **Add Suggested Follow-ups**

After each answer, suggest related questions:

```
"Would you also like to know about:
- How to request a transcript
- Academic calendar deadlines
- Registration procedures"
```

### 2. **Context Awareness**

Track conversation history to provide context-aware responses:

```
User: "What's the library policy?"
AI: [Answers]
User: "What about renewals?"
AI: [Knows user is still talking about library, provides renewal info]
```

### 3. **Clarification Questions**

When a question is ambiguous, ask for clarification:

```
User: "How do I register?"
AI: "I can help with that! Are you asking about:
- Course registration for classes
- New student registration
- Event registration"
```

These are advanced features for future sprints but would significantly enhance the experience.
