# AI-Powered Student Support Platform

## Version

- 1.0
- Status: MVP Architecture Locked

## 1. Overview

The AI-Powered Student Support Platform is a serverless AI assistant designed to help students access accurate institutional information through natural-language conversations.

The platform uses Retrieval-Augmented Generation (RAG) so responses are grounded in approved institutional documents rather than general model knowledge. The system supports:

- Student questions about academic and administrative matters
- Retrieval of relevant institutional knowledge
- Document upload and lifecycle management by administrators
- AI-assisted document processing and metadata enrichment
- Secure document governance
- Conversation history tracking
- Feedback collection for continuous AI improvement

## 2. Goals and MVP Scope

### Included Features

#### Student Features

- Authentication
- AI chat assistant
- Conversation sessions
- Conversation history
- Source references
- Response feedback

#### Administrator Features

- Upload documents
- Manage document metadata
- Review AI-generated metadata
- Approve documents
- Delete documents
- Track processing status

#### AI Features

- Document ingestion pipeline
- Metadata extraction
- Semantic chunking
- Embedding generation
- Vector search
- Context-based answer generation
- Hallucination prevention

### Out of Scope for MVP

- Admin dashboard UI
- OCR processing
- Lecturer portal
- Staff portal
- Student financial information integration
- Real-time university ERP integration
- Automated document publishing

## 3. Technology Stack

### Cloud Platform

- Amazon Web Services (AWS)

### Backend Components

- API: Amazon API Gateway
- Compute: AWS Lambda
- Authentication: Amazon Cognito
- Database: Amazon DynamoDB
- File Storage: Amazon S3
- Vector Search: Amazon OpenSearch Serverless
- AI Platform: Amazon Bedrock
- Embeddings: Amazon Titan Text Embeddings V2
- Monitoring: Amazon CloudWatch
- Secrets: AWS Secrets Manager

## 4. High-Level Architecture

The platform follows a serverless event-driven architecture where client applications communicate through API Gateway and Lambda functions manage business logic.

![Architecture diagram](docs/ARCHITECTURE_DIAGRAM.png)

Interactive Source: [draw.io diagram](https://drive.google.com/file/d/1IOWVk5wiRwW7vo87qKzbIsLCoi3O_mrz/view?usp=sharing)

## 5. Backend Service Architecture

The backend is organized around domain-based Lambda services. Each Lambda function owns a specific business capability.

### 5.1 Auth Lambda

Responsibilities:

- Authentication validation
- User identity extraction
- Role authorization

Authentication is handled by Amazon Cognito.

### 5.2 Chat Lambda

Responsibilities:

- Creating chat sessions
- Receiving student questions
- Retrieving conversation context
- Performing RAG search
- Calling Bedrock
- Streaming responses
- Saving messages

### 5.3 Document Lambda

Responsibilities:

- Upload initiation
- Document metadata management
- Document listing
- Document deletion
- Version management

### 5.4 Admin Lambda

Responsibilities:

- Metadata approval
- Document activation
- Document rejection
- Administrative actions

### 5.5 Feedback Lambda

Responsibilities:

- Student ratings
- Feedback comments
- AI quality tracking

### 5.6 Ingestion Worker Lambda

Responsibilities:

- Processing uploaded documents
- Extracting text
- Generating metadata
- Chunking documents
- Creating embeddings
- Updating processing state

## 6. Authentication and Authorization

### Authentication Provider

- Amazon Cognito

### Supported Roles

#### MVP Roles

- STUDENT
- ADMIN

#### Future Roles

- LECTURER
- STAFF
- SUPER_ADMIN

### Authentication Flow

```text
User Login
    ▼
Amazon Cognito
    ▼
JWT Token
    ▼
API Gateway Authorizer
    ▼
Lambda
```

## 7. API Design

### Base URL

All APIs use:

- /api/v1

### Response Format

#### Success

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

#### Error

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document does not exist"
  }
}
```

## 8. API Endpoints

### Authentication

Authentication is handled by Cognito.

### Documents

- Upload document: POST /api/v1/documents
- List documents: GET /api/v1/documents
- Get document: GET /api/v1/documents/{documentId}
- Delete document: DELETE /api/v1/documents/{documentId}
- Approve document: POST /api/v1/documents/{documentId}/approve

### Chat

- Create session: POST /api/v1/chat/sessions
- Send message: POST /api/v1/chat
- Get sessions: GET /api/v1/chat/sessions
- Get messages: GET /api/v1/chat/sessions/{sessionId}/messages

### Feedback

- Submit feedback: POST /api/v1/messages/{messageId}/feedback

## 9. Document Ingestion Pipeline

The ingestion pipeline transforms uploaded files into searchable knowledge for RAG.

```text
Admin Upload
    ▼
S3 Storage
    ▼
S3 Event Trigger
    ▼
Document Processor Lambda
    ├─ Validate File
    ├─ SHA256 Checksum
    ├─ Extract Text
    ├─ AI Metadata Extraction
    ├─ Save Metadata
    ├─ Semantic Chunking
    ├─ Generate Embeddings
    └─ Store Vectors
    ▼
Admin Review
    ▼
APPROVED
    ▼
Available for RAG Search
```

## 10. Supported Documents

### Supported Formats

- PDF
- DOCX
- TXT

### Upload Limits

- Maximum size: 25 MB
- Maximum pages: 500

### Rejected Files

- Password-protected PDFs
- Unsupported formats
- Files without extractable text

OCR processing is not included in the MVP.

## 11. Document Metadata Schema

```json
{
  "documentId": "",
  "title": "",
  "description": "",
  "documentType": "",
  "department": "",
  "academicYear": "",
  "version": 1,
  "tags": [],
  "uploadedBy": "",
  "uploadedAt": "",
  "status": "ACTIVE",
  "checksum": "",
  "s3Key": "",
  "fileSize": "",
  "mimeType": "",
  "processingStatus": "",
  "approvalStatus": ""
}
```

### Processing Status Values

- UPLOADED
- PROCESSING
- EMBEDDING
- COMPLETED
- FAILED

### Approval Status Values

- PENDING_REVIEW
- APPROVED
- REJECTED

## 12. RAG Query Pipeline

```text
Student Question
    ▼
Chat Lambda
    ▼
Generate Query Embedding
    ▼
OpenSearch Vector Search
    ▼
Retrieve Top 5 Chunks
    ▼
Bedrock Generation Model
    ▼
Stream Response
```

## 13. AI Rules

The assistant must:

- Answer only from institutional documents
- Refuse unsupported questions
- Include source references
- Never invent information

If confidence is low, the system should respond with:

> I could not find this information in the available institutional documents. Please contact the appropriate department.

## 14. Vector Database Design

OpenSearch stores:

- Document chunks
- Embeddings
- Search metadata

Example record:

```json
{
  "chunkId": "",
  "documentId": "",
  "content": "",
  "embedding": [],
  "metadata": {
    "pageNumber": 14,
    "documentVersion": 2
  }
}
```

## 15. DynamoDB Design

The system uses a single-table design for application state.

Example access patterns:

```text
PK                  SK
USER#123            PROFILE
USER#123            SESSION#001
SESSION#001         MESSAGE#001
DOCUMENT#001       METADATA
DOCUMENT#001       VERSION#002
MESSAGE#001        FEEDBACK
```

## 16. Storage Architecture

### Amazon S3

Stores documents in the following structure:

```text
documents/
  institution/
    documentId/
      version/
        original-file.pdf
```

### DynamoDB

Stores application state and operational metadata.

### OpenSearch

Stores vector embeddings and retrieval metadata only.

## 17. Security Architecture

### Encryption

- S3 SSE-KMS enabled
- DynamoDB encryption enabled
- OpenSearch encryption enabled

### Secrets Management

Secrets are stored in AWS Secrets Manager for:

- API secrets
- External integrations
- Configuration secrets

### File Upload Security

Documents are uploaded using pre-signed S3 URLs.

Flow:

```text
Frontend
    ▼
API Request Upload URL
    ▼
Lambda
    ▼
Signed S3 URL
    ▼
Direct Upload
```

Benefits:

- Lower cost
- Better scalability
- Reduced Lambda memory usage

## 18. Audit Logging

Administrative actions are tracked for governance and traceability, including events such as:

- DOCUMENT_UPLOADED
- DOCUMENT_APPROVED
- DOCUMENT_DELETED
- USER_LOGIN
- AI_RESPONSE_GENERATED

Audit logs are stored in DynamoDB.

## 19. Environment Variables

Example configuration:

```text
AWS_REGION=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
DOCUMENT_BUCKET=
DYNAMODB_TABLE=
OPENSEARCH_ENDPOINT=
BEDROCK_MODEL_ID=
BEDROCK_EMBEDDING_MODEL_ID=
```

## 20. Local Development

### Requirements

- Node.js 22+
- AWS CLI
- AWS SAM CLI
- Docker
- Git

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
sam local start-api
```

## 21. Deployment

The platform is designed for deployment to AWS using infrastructure-as-code and serverless deployment practices. Future deployment work should align with the same architecture and environment model described above.

## 22. Future Enhancements

Possible future roadmap items include:

- OCR support
- Admin dashboard
- Lecturer assistant
- Multi-tenant SaaS
- Analytics dashboard
- Voice assistant
- ERP integration
- Personalized student guidance
