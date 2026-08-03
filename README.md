# AI-Powered Student Support System

A serverless AWS application that lets students submit academic questions and receive AI-generated responses in real time, with all interactions durably stored for FAQ tracking and analytics.

---
## Problem

Educational institutions are overwhelmed by high volumes of repetitive academic queries, leading to slow response times and strained manual support teams. This system automates first-line responses using AI, while giving staff a searchable record of what students are asking.

---
## Architecture

```
Student → API Gateway (REST) → Lambda (per-route handler)
                                   │
                    ┌──────────────┼───────────────┐
                    ▼                              ▼
              DynamoDB (questions/answers)   AI Service (OpenAI or Bedrock)
                                                     │
                                              response written back
                                                     ▼
                                              DynamoDB (store Q&A pair)

```


**Core AWS services:** API Gateway, Lambda, DynamoDB, CloudWatch, IAM (OIDC federation from GitHub Actions), Bedrock (or OpenAI API for AI responses).

---
## API Endpoints

| Method | Path              | Description                        |
|--------|-------------------|-------------------------------------|
| POST   | `/ask`            | Submit a question, get an AI answer |
| GET    | `/question`       | View previous questions             |
| GET    | `/faq`             | View commonly asked questions       |
| DELETE | `/question/{id}`   | Delete a question record            |

---
## Tech Stack

- **Backend:** Python (AWS Lambda)
- **Infra as Code:** Terraform
- **CI/CD:** GitHub Actions (OIDC-based AWS auth, no static credentials)
- **Data store:** Amazon DynamoDB (single-table design)
- **AI layer:** Amazon Bedrock Agent (RAG) or OpenAI API
- **Observability:** Amazon CloudWatch (logs, alarms)

---

## Project Structure

```text
AI-Powered-Student-Support-System/
├── backend/                  # Lambda handlers, shared utilities, and backend tests
│   ├── src/                  # Feature-based backend modules
│   ├── tests/                # Python tests for backend handlers
│   └── docs/                 # API contract and backend docs
├── frontend/                 # Frontend application
│   └── student-ai-support/   # Vite + React + TypeScript app
├── terraform/                # Infrastructure as Code for AWS resources
│   └── backend/              # Terraform configuration for backend services
├── docs/                     # Project documentation and guides
└── README.md                 # Project overview and entry point
```

---

## Documentation

Useful references for contributors and operators:

- [Developer Onboarding Guide](docs/DEVELOPER_ONBOARDING_GUIDE.md)
- [Deployment and Operations Guide](docs/DEPLOYMENT_AND_OPERATIONS_GUIDE.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Backend Development Guide](docs/BACKEND_DEVELOPMENT_GUIDE.md)
- [API Contract](backend/docs/API_CONTRACT.md)

---

## Getting Started

### Prerequisites
- AWS account with IAM permissions to create Lambda, API Gateway, DynamoDB, IAM roles
- Terraform >= 1.5
- Python 3.12
- GitHub repo with OIDC trust configured to your AWS account

### Local Setup
```bash
git clone https://github.com/Humaidu/AI-Powered-Student-Support-System.git
cd AI-Powered-Student-Support-System
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

### Deploy Infrastructure
```bash
cd infra
terraform init
terraform plan
terraform apply
```

### Run Tests
```bash
pytest tests/ -v
```
---
## CI/CD Pipeline

- **On pull request:** lint → unit tests
- **On merge to `main`:** package Lambda functions → `terraform apply` → smoke test live endpoint

Credentials are handled via GitHub OIDC federation to an AWS IAM role — no long-lived access keys are stored in secrets.

---
## Monitoring

- CloudWatch Log Groups per Lambda function
- Alarms on Lambda error rate and API Gateway p99 latency
- IAM roles scoped to least privilege per function

---
## Roadmap / Status

- [ ] Phase 1: Project setup & planning
- [ ] Phase 2: API development (4 endpoints)
- [ ] Phase 3: AI integration
- [ ] Phase 4: CI/CD pipeline
- [ ] Phase 5: Logging, monitoring & optimization

---
## Team

| Name | Role |
|------|------|
| Richard Vidzrakou | Team Leader |
| William Mukoyani | Mentor |
| Freda Kemphrey | Member |
| Hassanatu Ahmed | Member |
| Humaidu Ali Mohammed | Member |
| Joel Addition | Member |
| Frank Amoako Boafo| Member |


---
## License

Internal Azubi Africa project — for educational use.