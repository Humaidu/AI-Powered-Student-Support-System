# AI-Powered Student Support Platform

A serverless RAG (Retrieval-Augmented Generation) platform that lets
students ask natural-language questions and get answers grounded in
approved institutional documents — not the model's general knowledge.
Admins upload and govern the documents that power search; every AI answer
includes source references and refuses to answer when nothing relevant is
found. Full design in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Project Structure

```
.
├── README.md
├── ARCHITECTURE.md
├── backend/
│   ├── src/
│   │   ├── documents/      # upload, list, get, delete, approve
│   │   ├── chat/           # create_session, send_message, get_sessions, get_messages, get_message
│   │   ├── feedback/       # submit
│   │   ├── ingestion/      # processor (S3-triggered document pipeline)
│   │   └── shared/         # db.py, auth.py, ai_client.py, vector_store.py, responses.py
│   ├── tests/
│   └── requirements.txt
├── docs/
│   └── opensearch-index-setup.md   # one-time manual step Terraform can't do
├── frontend/                # not yet updated to the new API — see Status
└── terraform/
    ├── backend/             # Cognito, S3, DynamoDB, OpenSearch, IAM/OIDC, Lambda, API Gateway, CloudWatch
    └── frontend/            # parked — not yet applied
```

## Architecture

```
Client
  │
  ▼
API Gateway (JWT auth via Cognito)
  │
  ├── Documents Lambdas (upload/list/get/delete/approve)
  ├── Chat Lambdas (sessions/messages)
  └── Feedback Lambda
        │
        ▼
    DynamoDB (single table)
        │
  ┌─────┴─────┐
  ▼           ▼
 S3      OpenSearch Serverless (vectors)
  │           │
  ▼           ▼
S3 event   Amazon Bedrock
  │        (Claude + Titan Embeddings)
  ▼
Ingestion Worker Lambda
(extract → chunk → embed → index)
```

**Core AWS services:** API Gateway, Lambda, Cognito, DynamoDB, S3, OpenSearch Serverless, Bedrock, CloudWatch, KMS.

## API Endpoints

All routes are under `/api/v1` and require a Cognito JWT (`Authorization: Bearer <token>`); document write actions additionally require the `ADMIN` role.

**Full request/response schemas, error codes, and frontend integration notes: [`docs/API_CONTRACT.md`](./backend/API_CONTRACT.md)**

**Documents (admin)**
| Method | Path | Description |
|--------|------|--------------|
| POST | `/api/v1/documents` | Create metadata + get a pre-signed S3 upload URL |
| GET | `/api/v1/documents` | List documents (students see only APPROVED) |
| GET | `/api/v1/documents/{documentId}` | Get one document |
| DELETE | `/api/v1/documents/{documentId}` | Delete a document |
| POST | `/api/v1/documents/{documentId}/approve` | Approve a processed document for RAG search |

**Chat**
| Method | Path | Description |
|--------|------|--------------|
| POST | `/api/v1/chat/sessions` | Start a new chat session |
| POST | `/api/v1/chat` | Send a message, get a RAG-grounded answer |
| GET | `/api/v1/chat/sessions` | List the caller's sessions |
| GET | `/api/v1/chat/sessions/{sessionId}/messages` | List messages in a session |
| GET | `/api/v1/messages/{messageId}` | Get a single message |

**Feedback**
| Method | Path | Description |
|--------|------|--------------|
| POST | `/api/v1/messages/{messageId}/feedback` | Rate a message (`up`/`down` + optional comment) |

Response envelope on every route:
```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "error": { "code": "DOCUMENT_NOT_FOUND", "message": "..." } }
```

## How Document Upload Works

Files never pass through Lambda directly (they'd hit payload-size limits
long before the 25MB max). Instead:
1. `POST /api/v1/documents` creates a metadata record and returns a
   **pre-signed S3 PUT URL**.
2. The admin's browser uploads the file straight to S3.
3. An S3 event triggers the ingestion worker, which extracts text,
   chunks it, generates embeddings (Bedrock Titan), and indexes the
   chunks into OpenSearch — updating `processingStatus` along the way
   (`UPLOADED → PROCESSING → EMBEDDING → COMPLETED`/`FAILED`).
4. An admin calls `POST /api/v1/documents/{id}/approve` once processing
   has completed, making it searchable to students.

## How Chat (RAG) Works

`POST /api/v1/chat` — the question is embedded (Titan), the embedding is
used to search OpenSearch for the top 5 most relevant document chunks,
and those chunks (not general model knowledge) are what Bedrock's Claude
model is asked to answer from. If nothing relevant is retrieved, the
handler skips the model call entirely and returns the standard "I could
not find this information..." message — a stronger hallucination guard
than trusting the model to refuse on its own.

## Getting Started — Backend

### Prerequisites
- AWS account with permission to create Lambda, API Gateway, DynamoDB, S3,
  Cognito, OpenSearch Serverless, IAM roles
- Bedrock model access enabled in-region for both the generation and
  embedding models (one-time console step, not automatable via Terraform)
- Terraform >= 1.5, Python 3.12

### Local Setup
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

### Run Tests
```bash
cd backend
pytest tests/ -v
```

### Deploy Infrastructure
```bash
cd terraform/backend
terraform init
terraform apply \
  -var="github_org=<your-github-org>" \
  -var="github_repo=<your-repo-name>"
```

First apply must be run locally (or via a bootstrap workflow), since the
GitHub Actions OIDC role doesn't exist yet for the pipeline to assume.
After that, set the `github_actions_role_arn` output as the
`AWS_DEPLOY_ROLE_ARN` GitHub secret, and subsequent deploys run through
CI/CD.

**After the first apply**, complete the one manual step Terraform can't
do: run `backend/scripts/setup_opensearch_index.py` (see
[`docs/opensearch-index-setup.md`](./docs/opensearch-index-setup.md)) to
create the k-NN index mapping in the OpenSearch collection. Skipping this
means the ingestion worker will fail to index chunks.

## CI/CD Pipeline

- **On pull request:** lint → unit tests (`.github/workflows/ci.yml`)
- **On merge to `main`** (backend paths only): package all 12 Lambdas →
  `terraform apply` → smoke test (`.github/workflows/deploy.yml`)

Auth is via GitHub OIDC federation to an AWS IAM role scoped to this repo
and the `main` branch — no long-lived access keys stored in secrets.

## Monitoring

- CloudWatch Log Groups per Lambda (12 API/ingestion functions + API
  Gateway access logs)
- Error-rate alarms per Lambda, plus an API Gateway p99 latency alarm
- All alarms publish to one SNS topic (subscribe your own
  email/Slack integration — not automated, since notification
  preferences are a team decision)

## Status

- [x] Backend: Cognito, S3 presigned uploads, DynamoDB single-table
      schema, ingestion pipeline, OpenSearch RAG search, Bedrock chat
- [x] Backend: IAM/OIDC, CI/CD pipeline, CloudWatch alarms
- [x] Backend: unit tests (9 passing, covering upload + RAG chat paths)
- [ ] OpenSearch index creation is a manual one-time step (see docs/)
- [ ] Frontend: needs a full rebuild against the new `/api/v1/*` contract
      and Cognito auth (the previous frontend targeted the old `/ask`,
      `/faq` endpoints, which no longer exist)
- [ ] Terraform: frontend hosting (`terraform/frontend/`) parked, not
      yet wired into the deploy pipeline
- [ ] Documentation: presentation deck

## Team

| Name | Role |
|------|------|
|      | DevOps / Backend / IaC |
|      | Frontend |
|      | QA |

## License

Internal Azubi Africa project — for educational use.