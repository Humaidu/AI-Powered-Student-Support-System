############################################################
# Provider configuration
############################################################
# This is the entry point Terraform reads first. It pins which providers
# (plugins that know how to talk to AWS, and how to zip files) this module
# needs, and configures the AWS provider with the region we're deploying to.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      # Used to zip up each Lambda's Python source before upload.
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # State is stored locally by default, which is fine solo but risky with a
  # team (two people applying at once can corrupt state, or silently
  # overwrite each other's changes). Uncomment once an S3 bucket + DynamoDB
  # lock table exist, so state is shared and locked properly.
  backend "s3" {
    bucket         = "student-support-system-be-tfstate"
    key            = "env/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "student-support-system-be-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# A handful of resources below (IAM policies, OpenSearch access policies)
# need to reference "this AWS account" explicitly — this data source looks
# up the account ID of whichever credentials Terraform is currently using.
data "aws_caller_identity" "current" {}
