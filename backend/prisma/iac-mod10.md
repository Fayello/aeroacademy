# Module 10 — IaC at Scale

## What You'll Actually Do

You'll design a multi-environment Terraform setup with remote state, state locking, and team workflows. You'll write a module that works across AWS, Azure, and GCP. You'll set up a basic governance pipeline that enforces policy checks before any infrastructure change goes live.

## Multi-Cloud with Terraform

When you need resources across multiple providers, Terraform handles it natively.

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

provider "azurerm" {
  features {}
}

provider "google" {
  project = "my-project"
  region  = "us-central1"
}
```

```hcl
# DNS in AWS
resource "aws_route53_zone" "main" {
  name = "example.com"
}

# App in Azure
resource "azurerm_linux_web_app" "main" {
  name                = "myapp"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
}

# Database in GCP
resource "google_sql_database_instance" "main" {
  name             = "mydb"
  database_version = "POSTGRES_14"
  region           = "us-central1"
}
```

The practical approach: most teams use one primary cloud for compute and pick best-of-breed services from others (like Cloudflare for CDN, Datadog for monitoring). Terraform manages all of it.

## Remote State and Locking

Local state files don't work for teams. Two people editing the same state file causes corruption. Remote backends solve this.

```hcl
# S3 backend for AWS
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/vpc/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

```hcl
# Azure Blob backend
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state"
    storage_account_name = "tfstate"
    container_name       = "tfstate"
    key                  = "production/vpc.tfstate"
  }
}
```

```hcl
# GCS backend
terraform {
  backend "gcs" {
    bucket = "my-terraform-state"
    prefix = "production/vpc"
  }
}
```

State locking happens automatically with these backends. When someone runs `terraform apply`, the backend locks the state file. Others see:

```
Error: Error acquiring the state lock

Error message: ConditionalCheckFailedException
```

Wait for the lock to release, or check who's currently applying.

## Directory Structure for Teams

Scale your Terraform with a clear directory structure:

```
infrastructure/
├── modules/
│   ├── vpc/
│   ├── ecs-cluster/
│   ├── rds/
│   └── monitoring/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── backend.tf
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── backend.tf
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── backend.tf
└── shared/
    ├── modules/
    └── policies/
```

Each environment has its own state file. Changes to dev don't affect production.

```hcl
# environments/production/main.tf
module "vpc" {
  source = "../../modules/vpc"

  cidr_block = "10.0.0.0/16"
  env        = "production"
}

module "compute" {
  source = "../../modules/ecs-cluster"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
}
```

## Team Workflows

**Branch per change**: Every infrastructure change goes through a pull request.

1. Create a branch: `git checkout -b add-monitoring`
2. Modify Terraform files
3. Run `terraform plan` and paste output in PR description
4. Team reviews the plan
5. Merge triggers CI/CD pipeline
6. Pipeline runs `terraform apply`

**Plan on PR, apply on merge**:

```yaml
name: Infrastructure
on:
  pull_request:
    paths: ['infrastructure/**']
  push:
    branches: [main]
    paths: ['infrastructure/**']

jobs:
  plan:
    if: github.event_name == 'pull_request'
    steps:
      - run: terraform plan -no-color
        # Post plan output as PR comment

  apply:
    if: github.event_name == 'push'
    steps:
      - run: terraform apply -auto-approve
```

## Governance

Governance means ensuring every infrastructure change follows your organization's rules.

**Required checks**: No merge without passing `terraform validate`, `terraform fmt`, security scans, and policy checks.

```yaml
# Branch protection rules
# Require status checks before merging
# Require PR review from infrastructure team
# Require up-to-date branches before merging
```

**Cost controls**: Use Terraform's `prevent_destroy` lifecycle for expensive resources.

```hcl
resource "aws_db_instance" "main" {
  # ...

  lifecycle {
    prevent_destroy = true
  }
}
```

**Tagging enforcement**: Require all resources to have specific tags.

```hcl
# Use in CI to verify tags
- name: Check tags
  run: |
    MISSING=$(terraform plan -json | jq -r '
      .resource_changes[] | 
      select(.change.actions[] != "read") |
      select(.change.after.tags == null or 
             .change.after.tags.Environment == null or
             .change.after.tags.Owner == null) |
      .address
    ')
    if [ -n "$MISSING" ]; then
      echo "FAIL: Missing required tags on: $MISSING"
      exit 1
    fi
```

**Change approval**: For production, require manual approval in the CI/CD pipeline.

```yaml
# GitHub Actions environment protection
environment:
  name: production
  # Requires manual approval from designated reviewers
```

## When IaC Gets Hard

Be honest about the pain points:

- **State conflicts**: Two people changing the same module. Remote state with locking helps, but coordination is still needed.
- **Secret rotation**: Secrets in state files go stale. Automate rotation and update state.
- **Importing existing resources**: `terraform import` works but is tedious for large estates.
- **Module versioning**: Breaking changes in shared modules ripple across environments. Version carefully.
- **Terraform version upgrades**: Major versions can change behavior. Test upgrades in dev first.

None of these are showstoppers. They're the cost of managing infrastructure at scale, and the tools exist to handle them.

## Assessment

**Lab Task**: Design a multi-environment Terraform setup with: (1) a shared module that creates a file-based "network" (directory with config files), (2) three environment directories (dev, staging, prod) that call the module with different settings, (3) a governance script that validates formatting, checks for required fields in all `.tf` files, and runs a plan in each environment directory. Simulate a team workflow by making a change in a "branch" (separate directory), running the governance checks, and then "merging" the change.

**Time**: 45 minutes

**Grading**:
- Shared module works correctly with different inputs (20 points)
- Three environment directories with proper structure (20 points)
- Governance script validates format and required fields (25 points)
- Workflow simulation demonstrates the full PR-like process (35 points)

## Evidence

- Directory structure showing modules and environments
- Governance script output passing in all environments
- Before/after of the simulated PR change
- All files committed with clear commit history
