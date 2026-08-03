# Deployment and Operations Guide

This guide covers how to deploy the AI-Powered Student Support System, operate it in AWS, and recover from common issues.

## 1. Deployment Overview

The platform is deployed through Terraform and uses AWS services such as:

- API Gateway
- Lambda
- DynamoDB
- S3
- Cognito
- OpenSearch Serverless
- CloudWatch
- IAM

Terraform configuration lives in [terraform/backend](../terraform/backend).

## 2. Prerequisites for Deployment

Before deploying, confirm that:

- AWS CLI is configured and authenticated
- Terraform is installed
- The target AWS account has the required permissions
- The required S3 bucket and DynamoDB lock table for remote state exist if you plan to use remote state

## 3. Terraform Deployment

### 3.1 Initialize Terraform

```bash
cd terraform/backend
terraform init
```

### 3.2 Review the plan

```bash
terraform plan -var="environment=dev"
```

### 3.3 Apply the infrastructure

```bash
terraform apply -var="environment=dev"
```

### 3.4 Destroy resources when needed

```bash
terraform destroy -var="environment=dev"
```

> Destroying infrastructure should only be done in non-production environments or when you are sure the resources are no longer needed.

## 4. AWS Resources Managed by Terraform

The main Terraform module provisions the following resources:

- Lambda functions for auth, chat, documents, feedback, and ingestion
- API Gateway routes
- DynamoDB tables and indexes
- S3 buckets for document storage
- Cognito resources for authentication
- IAM roles and policies
- OpenSearch resources for vector search
- CloudWatch log groups and retention settings

## 5. Environment Variables and Secrets

The deployment uses configuration values that should be managed carefully.

### Required runtime environment variables

The deployed Lambda functions should receive values such as:

- TABLE_NAME
- BEDROCK_MODEL_ID
- BEDROCK_EMBEDDING_MODEL_ID
- OPENSEARCH_ENDPOINT
- AWS_DEFAULT_REGION

### Secrets and sensitive values

Sensitive values should not be hardcoded in Terraform or source control. Use AWS Secrets Manager or environment-based injection where appropriate.

Recommended practices:

- Store secrets in AWS Secrets Manager
- Restrict access with least-privilege IAM policies
- Rotate secrets regularly
- Avoid committing API keys or credentials to Git

## 6. CI/CD Flow

The project is intended to use GitHub-based automation for deployment.

### Expected flow

1. A contributor opens a pull request
2. Automated checks run for linting and tests
3. A maintainer reviews the PR
4. Changes are merged into the main branch
5. Infrastructure and application deployment proceed according to the configured pipeline

### Operational note

At the moment, the repository does not include a visible GitHub Actions workflow in the workspace, so this flow should be added or confirmed before relying on it for production deployments.

## 7. Rollback Strategy

If a deployment introduces issues:

1. Review the Terraform plan and recent changes
2. Revert the problematic commit or PR
3. Re-apply the previous known-good Terraform state
4. Check CloudWatch logs for Lambda failures
5. Validate API Gateway and authentication behavior

### Useful rollback checks

- Confirm the previous Terraform state is available
- Verify that the prior Lambda zip artifacts or code versions are still accessible
- Check whether the application is still reading the correct environment variables

## 8. Monitoring and Operations

### Logging

Use CloudWatch logs to inspect:

- Lambda execution failures
- API Gateway errors
- Authentication issues
- Document ingestion failures
- OpenSearch query or indexing errors

### Health checks

The frontend server includes a health endpoint at:

```text
/api/v1/health
```

This can be used as a quick operational sanity check during deployment.

## 9. Common Operational Issues

### Terraform apply fails

Common causes include:

- AWS permissions issues
- Missing provider plugins
- Resource naming conflicts
- State lock issues

### Lambda execution errors

Check:

- CloudWatch logs
- Missing environment variables
- IAM permission issues
- Invalid payload structure

### Document ingestion failures

Inspect:

- S3 object presence
- Lambda logs during ingestion
- OpenSearch connectivity
- Bedrock or embedding configuration

### Cognito login problems

Verify:

- User pool configuration
- App client settings
- Token issuer and audience settings
- Frontend environment variables

## 10. Recommended Operational Checklist

Before releasing a new deployment, verify:

- Terraform plan looks correct
- Tests pass locally
- Required secrets are present
- Logs are reachable in CloudWatch
- Core user flows still work in the app

## 11. Next Steps

After the initial deployment is stable, consider:

- adding automated deployment pipelines
- enabling monitoring alerts
- documenting environment-specific Terraform variables
- adding a formal incident response runbook
