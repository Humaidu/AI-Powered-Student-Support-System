# AI-Powered Student Support Platform Architecture

## Version

- Version: 2.1
- Status: Updated for current implementation and deployment model

## 1. Purpose

The AI-Powered Student Support Platform is a digital student support system designed to give students and administrators fast, reliable access to institutional knowledge through a conversational AI assistant.

The platform is built to do three important things:

1. Help students ask questions in everyday language.
2. Provide answers that are grounded in approved institutional documents.
3. Allow administrators to upload, review, and manage the documents that power the AI.

The system combines a modern web interface, serverless cloud services, a document ingestion pipeline, and a search system that can understand meaning, not just keywords.

## 2. Who the System Serves

### Students

Students can:

- sign in securely
- ask academic or administrative questions
- continue conversations across sessions
- receive answers with document-backed references
- give feedback on response quality

### Administrators

Administrators can:

- upload institutional documents
- review document status and metadata
- approve or reject content for use in the AI
- manage the knowledge base behind the assistant

## 3. Core Design Principles

The system is designed around four principles:

- Accuracy: answers should come from institutional documents, not from generic model knowledge.
- Security: user access and content governance must be controlled.
- Scalability: the platform should continue to work as more users and documents are added.
- Simplicity: the user experience should feel easy even though the system is technically complex.

## 4. High-Level Architecture

The platform is built as a serverless, event-driven system on AWS.

At a high level, the architecture has five layers:

1. Frontend layer
2. API and authentication layer
3. Business logic layer
4. Data and document layer
5. AI and search layer

```text
Frontend Applications
    │
    ▼
API Gateway
    │
    ├── Auth Services
    ├── Chat Services
    ├── Document Services
    └── Admin Services
            │
            ▼
        AWS Lambda Functions
            │
            ├── Cognito / JWT validation
            ├── Chat processing
            ├── Document management
            ├── Ingestion processing
            └── Feedback handling
            │
            ├── DynamoDB
            ├── S3
            └── OpenSearch
                    │
                    ▼
                Gemini
```

## 5. Main Components

### 5.1 Frontend Applications

The user-facing frontend is a React and TypeScript web application.

It provides:

- a student-facing experience for login, chat, and viewing information
- an administrative experience for document upload and review
- a public-facing website experience for admissions and institutional information

The frontend sends requests to the backend through API Gateway and receives data in a structured response format.

### 5.9 Frontend Hosting and Deployment (Current)

The frontend is hosted on AWS Amplify and managed with a hybrid approach:

- infrastructure provisioning is managed in Terraform (Amplify app, branch, domain association, and rewrite rules)
- frontend releases are deployed as build artifacts through Amplify deployment APIs
- a one-command deployment script builds, packages, uploads, and starts deployment jobs

This approach allows fast deployments without requiring repository-connected builds while still keeping infrastructure as code.

### 5.2 API Gateway

API Gateway is the main entry point for all client requests.

It handles:

- routing requests to the right Lambda function
- request validation
- authentication integration
- API access control

### 5.3 Amazon Cognito

Cognito manages identity and access.

It provides:

- user sign-in and sign-out
- user registration
- role-based access control for students and administrators
- secure token issuance for API requests

### 5.4 AWS Lambda

The core business logic runs in Lambda functions. These functions are responsible for specific responsibilities such as:

- authentication and authorization
- chat session creation and message handling
- document upload and listing
- document approval and lifecycle actions
- ingestion processing and document transformation
- feedback collection and tracking

### 5.5 Amazon S3

S3 is the primary document storage layer.

It stores:

- original uploaded files
- versioned document content
- assets used by the public website and application UI

### 5.6 Amazon DynamoDB

DynamoDB stores structured application data such as:

- user profiles
- chat sessions
- chat messages
- document metadata
- processing status
- feedback records

### 5.7 OpenSearch

OpenSearch is the vector search engine used for the AI retrieval system.

It stores:

- document chunks
- embeddings
- metadata such as document source and version

This is the layer that lets the assistant find the most relevant information even when the user asks a question in a different way.

### 5.8 Google Gemini

Gemini provides the large language model capabilities used to generate responses.

The system uses Gemini in combination with retrieved document context so the final answer is more accurate and more grounded in approved institutional content.

## 6. System Roles and Responsibilities

| Layer             | Main Responsibility             | Key Services            |
| ----------------- | ------------------------------- | ----------------------- |
| Frontend          | User interaction and UI         | React, TypeScript, Vite |
| API Layer         | Secure request routing          | API Gateway             |
| Identity          | Authentication and access       | Cognito                 |
| Application Logic | Business rules and workflows    | Lambda                  |
| Storage           | Documents and operational data  | S3, DynamoDB            |
| Search and AI     | Retrieval and answer generation | OpenSearch, Gemini      |

## 7. End-to-End Student Chat Flow

This is the main flow for a student asking a question.

### Step 1: User enters a question

A student opens the chat interface and sends a question such as:

- “What are the entry requirements for the cloud computing programme?”
- “When does the admissions process open?”

### Step 2: Authentication and request validation

The frontend sends the request to API Gateway. If needed, the user is validated using Cognito-issued credentials.

### Step 3: Chat service receives the request

A chat Lambda function receives the request and prepares the conversation context.

It may:

- load the active chat session
- retrieve recent messages from DynamoDB
- identify the user and their role

### Step 4: The question is converted into a search query

The system creates an embedding for the student’s question.

This embedding is a numerical representation of the meaning of the question so the system can search semantically rather than relying only on exact word matching.

### Step 5: Relevant content is retrieved

The embedding is sent to OpenSearch, which compares it against stored embeddings from approved document chunks.

OpenSearch returns the most relevant passages or chunks.

### Step 6: The AI generates a grounded answer

The retrieved document chunks are passed to the language model through Gemini along with the user’s question.

The model is instructed to answer using only the retrieved context and to avoid unsupported claims.

### Step 7: The response is returned to the user

The answer is sent back through the API layer to the frontend and shown to the student.

The response may include:

- the answer itself
- source references to the relevant document chunks
- optional follow-up suggestions

### Step 8: Conversation state is saved

The message, session context, and feedback information are stored in DynamoDB so future interactions remain consistent.

### Student Flow Summary

```text
Student asks question
    ▼
Frontend sends request
    ▼
API Gateway routes request
    ▼
Lambda loads chat context
    ▼
Question embedding created
    ▼
OpenSearch finds relevant chunks
    ▼
Gemini generates grounded response
    ▼
Frontend displays answer
    ▼
Conversation data saved in DynamoDB
```

## 8. End-to-End Admin Document Flow

This is the flow for administrators uploading and preparing documents for the AI.

### Step 1: Admin uploads a document

An administrator uses the document management interface to upload a file such as a PDF or document.

### Step 2: The file is stored in S3

The file is received by the backend and stored in S3.

This preserves the original document in a secure and scalable storage layer.

### Step 3: Metadata is recorded

The system records important metadata such as:

- document title
- upload date
- uploader identity
- document type
- approval status
- processing state

This information is stored in DynamoDB.

### Step 4: The ingestion worker processes the file

A background ingestion process reads the file from S3 and performs the following actions:

- validates the file
- extracts text from the content
- creates document metadata
- splits the document into manageable chunks
- generates embeddings for each chunk
- stores the chunks and embeddings in OpenSearch

### Step 5: The document is reviewed

The administrator can review the document before it becomes active for AI use.

Approval states may include:

- pending review
- approved
- rejected

### Step 6: The document becomes part of the AI knowledge base

Once approved, the document can be retrieved during student questions and used to generate grounded answers.

### Admin Flow Summary

```text
Admin uploads document
    ▼
File stored in S3
    ▼
Metadata saved in DynamoDB
    ▼
Ingestion worker extracts text
    ▼
Document is chunked and embedded
    ▼
Embeddings stored in OpenSearch
    ▼
Admin reviews and approves document
    ▼
Document becomes available to the AI
```

## 9. How Document Embedding Works

Document embedding is the process of turning document content into vector representations that capture meaning.

### Why it is needed

Traditional keyword search can miss relevant material if the wording is different. Embeddings allow the system to find content that is conceptually similar, even when the exact words differ.

### Process

1. A document is uploaded and stored.
2. The ingestion pipeline extracts the text.
3. The text is divided into smaller chunks.
4. Each chunk is converted into an embedding using an embedding model.
5. The embedding is stored in OpenSearch together with the chunk content and metadata.

### Example

If a student asks, “What are the requirements to join the programme?” and the document says “Admission criteria,” the embedding-based search can still find the relevant section because the meaning is similar.

## 10. Why OpenSearch Is Important

OpenSearch is the retrieval engine for the AI assistant.

It helps the system:

- search through many document chunks quickly
- rank the most relevant content
- return context that is useful for answer generation
- support semantic rather than literal matching

In short, OpenSearch makes the AI more useful because it can locate the right information from a large pool of documents.

## 11. Data Storage Design

The platform uses different storage layers for different purposes.

### DynamoDB

Used for operational and application data such as:

- chat sessions
- messages
- user state
- document status
- feedback

### S3

Used for durable document storage such as:

- original uploaded files
- document archives
- frontend assets

### OpenSearch

Used for retrieval data such as:

- chunk content
- vector embeddings
- search metadata

## 12. Security and Governance

Security is a central part of the design.

### Authentication and access control

- user access is managed through Cognito
- permissions are role-based
- student and administrator actions are separated

### Document governance

- documents must be reviewed before they become active for AI use
- admin actions are tracked for accountability
- the system is designed to prevent unsupported or unauthorized content from being used in responses

### Data protection

- cloud resources are protected through standard AWS security practices
- secrets and configuration values are managed separately from application code

## 13. Operational Flow in Simple Terms

A simple way to describe the system is:

- Students ask questions.
- The system finds the most relevant approved documents.
- The system uses those documents to generate an answer.
- Administrators keep the document library accurate and approved.

That means the AI is not acting from memory alone. It is acting from a controlled set of institutional knowledge.

## 14. Repository Structure Reference

The implementation is organized around a few clear areas:

- frontend: user-facing web application
- backend/src/chat: chat sessions and message handling
- backend/src/documents: document upload, listing, approval, and deletion
- backend/src/ingestion: document processing and embedding workflows
- backend/src/shared: shared utilities and common logic
- terraform: infrastructure and cloud resource definitions

## 15. Summary

The platform combines a user-friendly frontend, secure authentication, serverless application logic, document storage, semantic search, and language model generation into one integrated system.

In practical terms:

- students get faster and more reliable answers
- administrators control the knowledge base
- the AI remains grounded in approved institutional documents
- the system can grow as more courses, policies, and documents are added
