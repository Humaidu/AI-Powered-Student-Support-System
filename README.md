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
|      | DevOps / Backend / IaC |
|      | Backend |
|      | QA |

---
## License

Internal Azubi Africa project — for educational use.