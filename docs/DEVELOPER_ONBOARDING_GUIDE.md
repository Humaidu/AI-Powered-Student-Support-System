# Developer Onboarding Guide

This guide helps a new contributor get the AI-Powered Student Support System running locally and understand the main development workflow.

## 1. Prerequisites

Install the following before you start:

- Git
- Python 3.11 or 3.12
- Node.js 20+ and npm
- Terraform 1.5+
- AWS CLI v2
- An AWS account with permission to create and manage:
  - Lambda
  - API Gateway
  - DynamoDB
  - S3
  - Cognito
  - OpenSearch Serverless
  - IAM

## 2. Repository Overview

The repository is split into three main areas:

- Frontend: [frontend/student-ai-support](../frontend/student-ai-support)
- Backend logic and Lambda handlers: [backend](../backend)
- Infrastructure as Code: [terraform/backend](../terraform/backend)

## 3. Clone and Setup

```bash
git clone https://github.com/Humaidu/AI-Powered-Student-Support-System.git
cd AI-Powered-Student-Support-System
```

### 3.1 Python environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-lambda.txt
```

### 3.2 Frontend environment

```bash
cd ../frontend/student-ai-support
npm install
```

## 4. Local Development Workflow

### 4.1 Run the frontend

From [frontend/student-ai-support](../frontend/student-ai-support):

```bash
npm run dev
```

This starts a local development server and serves the app.

### 4.2 Run the app in mock mode

The frontend supports a mock mode by default. This is useful when you want to work on UI flows without a live backend.

Set:

```bash
export VITE_APP_MODE=mock
```

If you want to point the frontend at the real backend later, switch to:

```bash
export VITE_APP_MODE=aws
export VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 4.3 Run the backend tests

The backend includes Python tests for Lambda handlers.

```bash
cd ../../backend
pytest tests -v
```

## 5. Environment Variables

### Frontend

The frontend reads the following values from environment variables:

- VITE_APP_MODE: set to mock or aws
- VITE_API_BASE_URL: base URL for API requests
- VITE_COGNITO_USER_POOL_ID: Cognito user pool id
- VITE_COGNITO_APP_CLIENT_ID: Cognito app client id
- GEMINI_API_KEY: optional, used by the local server-side RAG endpoint

### Backend

The Lambda handlers expect values such as:

- TABLE_NAME
- BEDROCK_MODEL_ID
- BEDROCK_EMBEDDING_MODEL_ID
- OPENSEARCH_ENDPOINT
- AWS_DEFAULT_REGION

## 6. Typical Local Tasks

### Start the frontend only

```bash
cd frontend/student-ai-support
npm run dev
```

### Run backend unit tests

```bash
cd backend
pytest tests -v
```

### Inspect infrastructure changes

```bash
cd terraform/backend
terraform init
terraform plan
```

## 7. Recommended Development Practices

- Keep frontend and backend changes separate when possible.
- Prefer small pull requests with clear descriptions.
- Run tests before opening a PR.
- If you change API behavior, update the API contract documentation in [backend/docs/API_CONTRACT.md](../backend/docs/API_CONTRACT.md).
- If you change infrastructure, review the Terraform plan carefully before applying it.

## 8. Common Setup Issues

### Python package errors

If dependency installation fails, ensure your Python version is compatible and that you are using a fresh virtual environment.

### Frontend startup errors

If the frontend fails to start, confirm that dependencies were installed successfully and that Node.js is at version 20 or newer.

### AWS authentication issues

If Terraform or AWS CLI commands fail, run:

```bash
aws configure
```

or verify your active profile:

```bash
aws sts get-caller-identity
```

## 9. Next Steps

Once your local environment is working, the next best steps are:

1. Review the architecture in [ARCHITECTURE.md](../ARCHITECTURE.md)
2. Review the backend design in [docs/BACKEND_DEVELOPMENT_GUIDE.md](BACKEND_DEVELOPMENT_GUIDE.md)
3. Review the API contract in [backend/docs/API_CONTRACT.md](../backend/docs/API_CONTRACT.md)
4. Start with a small backend or frontend task and test it locally before deployment
