# Module 10: Infrastructure as Code at Scale

A single engineer managing a single Terraform configuration is straightforward. Fifty engineers managing two hundred Terraform configurations across three cloud providers, with compliance requirements, cost controls, and shared modules: that is a different problem entirely. The patterns that work for one person break down when teams grow: naming conflicts, state file collisions, module version drift, and the inability to know who changed what and why.

This module covers the patterns and practices that make IaC work at enterprise scale: multi-cloud strategies, team workflows with shared modules, governance through policy enforcement, and a complete scenario of adopting IaC across an organization.

## Multi-Cloud Strategies

Most organizations do not go all-in on a single cloud. They use AWS for compute, Cloudflare for CDN, GitHub for source control, and maybe GCP for machine learning. IaC needs to manage resources across all of these from a single configuration or a coordinated set of configurations.

**Provider configuration for multi-cloud**:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  alias  = "primary"
}

provider "aws" {
  region = "eu-west-1"
  alias  = "secondary"
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "github" {
  owner = "my-org"
  token = var.github_token
}
```

**Cross-cloud resource references**: Use terraform_remote_state to reference resources across cloud providers:

```hcl
data "terraform_remote_state" "aws" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "aws/networking/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  type    = "A"
  value   = data.terraform_remote_state.aws.outputs.alb_ip
  proxied = true
}
```

**Multi-cloud module patterns**: Create provider-agnostic modules that abstract the underlying cloud:

```hcl
# modules/dns/main.tf
variable "records" {
  type = list(object({
    name  = string
    type  = string
    value = string
    ttl   = optional(number, 300)
  }))
}

resource "cloudflare_record" "main" {
  for_each = { for r in var.records : r.name => r if var.dns_provider == "cloudflare" }

  zone_id = var.cloudflare_zone_id
  name    = each.value.name
  type    = each.value.type
  value   = each.value.value
  ttl     = each.value.ttl
}

resource "aws_route53_record" "main" {
  for_each = { for r in var.records : r.name => r if var.dns_provider == "route53" }

  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = each.value.ttl
  records = [each.value.value]
}
```

**Directory structure for multi-cloud**:

```
infrastructure/
├── aws/
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars
├── gcp/
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars
├── cloudflare/
│   ├── main.tf
│   └── variables.tf
└── shared/
    └── modules/
        ├── dns/
        └── monitoring/
```

Each cloud provider directory has its own state file. This prevents a Terraform apply in AWS from accidentally destroying GCP resources.

## Team Workflows

When multiple engineers work on infrastructure, you need workflows that prevent conflicts and ensure quality.

**Branch strategy for IaC**:

```
main (production)
├── develop (staging)
│   ├── feature/add-monitoring
│   ├── feature/update-rds
│   └── feature/add-waf
└── hotfix/fix-security-group
```

Rules that work in practice:
- All changes go through pull requests
- develop merges to main after testing in staging
- Hotfixes can go directly to main with expedited review
- No direct commits to main or develop
- Each PR targets exactly one environment or one module

**CODEOWNERS** for required reviews:

```
# .github/CODEOWNERS
infrastructure/modules/vpc/    @platform-team
infrastructure/modules/ecs/    @platform-team
infrastructure/envs/production/ @platform-team-leads
infrastructure/policy/         @security-team
```

This ensures that platform team modules get platform team review, production changes get lead approval, and policy changes get security review.

**Pull request workflow** that shows the Terraform plan:

```yaml
# .github/workflows/pr.yml
name: Terraform PR
on: [pull_request]

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init -backend=false

      - name: Terraform Plan
        id: plan
        run: terraform plan -no-color
        continue-on-error: true

      - name: Comment Plan on PR
        uses: actions/github-script@v7
        with:
          script: |
            const plan = `${{ steps.plan.outputs.stdout }}`
            const body = `### Terraform Plan
            \`\`\`
            ${plan}
            \`\`\`
            Pushed by: @${{ github.actor }}`
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            })
```

**Module versioning strategy**: Use Git tags for module versions:

```bash
git tag modules/vpc/v1.2.0
git push origin modules/vpc/v1.2.0
```

Consume with version constraints:

```hcl
module "vpc" {
  source  = "git::ssh://git@github.com/company/terraform-modules.git//modules/vpc?ref=modules/vpc/v1.2.0"
  # ...
}
```

Or use a private module registry:

```hcl
module "vpc" {
  source  = "app.terraform.io/company/vpc/aws"
  version = "~> 1.2"
  # ...
}
```

**Shared module repository pattern**:

```
terraform-modules/
├── modules/
│   ├── vpc/
│   ├── ecs/
│   ├── rds/
│   ├── alb/
│   └── monitoring/
├── environments/
│   ├── dev/
│   │   └── main.tf
│   ├── staging/
│   │   └── main.tf
│   └── production/
│       └── main.tf
├── .github/
│   └── workflows/
│       └── test.yml
└── tests/
    ├── vpc_test.go
    ├── ecs_test.go
    └── rds_test.go
```

Module authors add new modules to the modules/ directory. Application teams consume them by calling the modules from their environment configurations.

## Governance

Governance ensures that infrastructure follows organizational standards. This includes naming conventions, tagging policies, cost controls, and compliance requirements.

**Naming conventions** enforced through modules:

```hcl
# modules/naming/variables.tf
variable "project" {
  type = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project))
    error_message = "Project name must be lowercase alphanumeric with hyphens."
  }
}

variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "component" {
  type = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.component))
    error_message = "Component must be lowercase alphanumeric with hyphens."
  }
}

# modules/naming/outputs.tf
locals {
  name_prefix = "${var.project}-${var.environment}-${var.component}"
}

output "name" {
  value = local.name_prefix
}

output "tags" {
  value = {
    Project     = var.project
    Environment = var.environment
    Component   = var.component
    ManagedBy   = "terraform"
  }
}
```

Every resource in the organization uses this module for naming. This prevents inconsistencies like some teams using camelCase and others using snake_case.

**Tagging policy enforcement** with OPA:

```rego
package terraform.tags

required_tags := {"Project", "Environment", "Component", "ManagedBy"}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type != "data"
    tags := resource.values.tags
    missing := required_tags - {key | tags[key]}
    count(missing) > 0
    msg := sprintf("Resource %s is missing required tags: %v", [resource.address, missing])
}
```

**Cost controls** with Infracost in CI/CD:

```yaml
# .github/workflows/cost.yml
name: Cost Check
on: [pull_request]

jobs:
  cost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: infracost/actions/setup@v2

      - name: Generate cost estimate
        run: |
          infracost breakdown --path . --format json > cost.json
          COST=$(jq '.totalMonthlyCost' cost.json)
          echo "Estimated monthly cost: \$${COST}"

          # Fail if cost increase exceeds threshold
          INCREASE=$(infracost diff --path . --compare-to main --format json | jq '.totalMonthlyCostDiff')
          if (( $(echo "$INCREASE > 1000" | bc -l) )); then
            echo "Cost increase exceeds \$1000/month threshold"
            exit 1
          fi
```

**AWS Service Control Policies (SCPs)** restrict what Terraform can do:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInstanceTypes",
      "Effect": "Deny",
      "Action": "ec2:RunInstances",
      "Resource": "*",
      "Condition": {
        "StringNotLike": {
          "ec2:InstanceType": ["t3.*", "m5.*", "c5.*"]
        }
      }
    },
    {
      "Sid": "DenyNonApprovedRegions",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["us-east-1", "us-west-2", "eu-west-1"]
        }
      }
    }
  ]
}
```

These policies apply at the AWS Organizations level and prevent Terraform from creating resources in unapproved regions or with unapproved instance types.

**AWS Config rules** for continuous compliance:

```yaml
Resources:
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: required-tags
      Source:
        Owner: CUSTOM_LAMBDA
        SourceIdentifier: !GetAtt CheckLambda.Arn

  EncryptionRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: encrypted-volumes
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES
```

## Real Scenario: Enterprise IaC Adoption

Let us walk through adopting IaC across an organization.

**Phase 1: Foundation (Weeks 1-4)**

Set up the core infrastructure for IaC:

```
terraform-platform/
├── modules/
│   ├── vpc/
│   ├── ecs-cluster/
│   ├── rds-postgres/
│   ├── alb/
│   ├── monitoring/
│   └── dns/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── production/
├── policy/
│   └── terraform.rego
├── tests/
├── .github/
│   └── workflows/
│       ├── validate.yml
│       ├── test.yml
│       ├── deploy.yml
│       └── drift-detection.yml
└── docs/
    ├── getting-started.md
    ├── module-catalog.md
    └── contributing.md
```

**CI/CD pipeline for module testing**:

```yaml
# .github/workflows/test-modules.yml
name: Test Modules
on:
  push:
    paths:
      - 'modules/**'
  pull_request:
    paths:
      - 'modules/**'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        module: [vpc, ecs-cluster, rds-postgres]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'
      - uses: hashicorp/setup-terraform@v3

      - name: Test ${{ matrix.module }}
        run: |
          cd tests/${{ matrix.module }}
          go test -v -timeout 30m ./...
```

**Phase 2: Migration (Weeks 5-12)**

Migrate existing infrastructure from manual provisioning to Terraform:

```
Week 5-6:  Inventory existing resources
Week 7-8:  Write Terraform for networking
Week 9-10: Import existing resources into Terraform state
Week 11-12: Validate and test
```

**Migration checklist**:

```
□ Inventory all existing AWS resources
□ Write Terraform configuration for each resource type
□ Import existing resources using terraform import
□ Verify terraform plan shows zero changes
□ Set up remote state with locking
□ Configure CI/CD pipeline
□ Run security scans and fix findings
□ Document module usage and runbooks
□ Train team on Terraform workflow
□ Deploy to staging and verify
□ Deploy to production
□ Enable drift detection
```

**Phase 3: Scaling (Weeks 13-24)**

Expand IaC across teams and projects:
- Create self-service modules that teams can consume
- Set up cost monitoring and alerts
- Implement policy-as-code for compliance
- Establish module contribution process
- Create internal documentation and runbooks

**Phase 4: Optimization (Ongoing)**

Continuous improvement:
- Refactor modules based on feedback
- Update provider and Terraform versions
- Improve test coverage
- Optimize CI/CD pipeline performance
- Add new modules for emerging needs

**Team structure for IaC at scale**:

```
Platform Team (owns modules and tooling)
├── Module Authors (write and maintain shared modules)
├── CI/CD Engineers (maintain pipelines and tooling)
└── Security Engineers (write and maintain policies)

Application Teams (consume modules)
├── Backend Engineers (use ECS/RDS modules)
├── Frontend Engineers (use S3/CloudFront modules)
└── SRE Engineers (use monitoring/alerting modules)
```

**Governance model**:

| Aspect | Who Owns | How Enforced |
|--------|----------|--------------|
| Module quality | Platform team | Tests, code review, CI/CD |
| Security policies | Security team | OPA policies in CI/CD |
| Cost controls | Finance + Platform | Infracost in PR workflow |
| Naming conventions | Platform team | Module variables, linting |
| Tagging requirements | Platform team | OPA policies, AWS Config |
| Provider versions | Platform team | Required providers, version constraints |
| State management | Platform team | Terraform Cloud, remote backends |

**Module contribution process**:

When a team needs infrastructure that is not covered by existing modules, they follow the contribution process:

1. Open an issue describing the need and proposed module interface
2. Platform team reviews and approves the design
3. The team or platform engineers implement the module
4. Module goes through code review, security scan, and testing
5. Module is published to the shared repository with documentation
6. Module is added to the internal module catalog

This prevents teams from creating one-off modules that nobody else can use, while still allowing them to get the infrastructure they need.

**Module documentation requirements**:

Every module in the shared repository must include:
- README.md with usage examples
- variables.tf with descriptions and validation rules
- outputs.tf with descriptions
- CHANGELOG.md tracking version history
- tests/ directory with Terratest tests
- examples/ directory with complete working examples

**Cost allocation through tagging**:

```hcl
module "naming" {
  source      = "../modules/naming"
  project     = var.project
  environment = var.environment
  component   = "vpc"
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags       = module.naming.tags
}
```

Every resource gets tagged with Project, Environment, and Component. This lets the finance team generate cost reports by project, by environment, or by component. They can see exactly how much each team spends on infrastructure and where the money goes.

**Service Control Policies** for organizational guardrails:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInstanceTypes",
      "Effect": "Deny",
      "Action": "ec2:RunInstances",
      "Resource": "arn:aws:ec2:*:*:instance/*",
      "Condition": {
        "StringNotLike": {
          "ec2:InstanceType": ["t3.*", "m5.*", "c5.*", "r5.*"]
        }
      }
    },
    {
      "Sid": "DenyNonApprovedRegions",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["us-east-1", "us-west-2", "eu-west-1"]
        }
      }
    },
    {
      "Sid": "DenyPublicS3Buckets",
      "Effect": "Deny",
      "Action": "s3:PutBucketPublicAccessBlock",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "s3:PublicAccessBlockConfiguration/BlockPublicAcls": "true"
        }
      }
    }
  ]
}
```

These SCPs apply at the AWS Organizations level and cannot be overridden by IAM policies. They prevent Terraform from creating resources in unapproved regions, with unapproved instance types, or with public access enabled.

**AWS Config rules** for continuous compliance monitoring:

```yaml
Resources:
  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: encrypted-volumes
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES

  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: required-tags
      Source:
        Owner: CUSTOM_LAMBDA
        SourceIdentifier: !GetAtt CheckLambda.Arn

  RestrictedSSHRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: restricted-ssh
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED
```

**Remediation actions** for non-compliant resources:

```yaml
Resources:
  EncryptedVolumesRemediation:
    Type: AWS::Config::RemediationConfiguration
    Properties:
      ConfigRuleName: encrypted-volumes
      TargetId: !GetAtt RemediationLambda.Arn
      ResourceType: AWS::EC2::Volume
      Automatic: true
      MaximumAutomaticAttempts: 3
```

When Config detects a non-compliant resource, it can automatically remediate it. For example, if an EBS volume is created without encryption, the remediation action can encrypt it.

**Incident response for IaC failures**:

1. **Module breaks in production**: Roll back using Git revert. The CI/CD pipeline should automatically apply the reverted version.

2. **State file corruption**: Restore from backup. Terraform Cloud keeps state history. For S3 backends, enable versioning on the state bucket.

3. **Provider breaking change**: Pin provider versions. When updating, test in staging first.

4. **Security scan blocks deployment**: Fix the finding, do not disable the scan. If it is a false positive, add an exception with justification.

5. **Cost overrun detected**: Review recent changes in the cost estimation pipeline. Revert the change if unexpected.

## Assessment

**Lab Task 1** (35 minutes): Set up a multi-environment Terraform project with directories for dev, staging, and production. Each directory calls shared modules. Create a CODEOWNERS file that requires platform team review for module changes and team lead review for production changes.

**Lab Task 2** (30 minutes): Write OPA policies that enforce: (1) all resources must have required tags, (2) EC2 instances must use approved instance types, and (3) S3 buckets must have encryption and public access blocked. Integrate the policies into a GitHub Actions workflow.

**Lab Task 3** (30 minutes): Create a drift detection workflow that runs daily for all three environments. Simulate drift by changing a resource through the AWS Console. Verify the detection workflow identifies the drift.

**Grading Criteria**:
- Multi-environment project uses shared modules correctly (20 points)
- CODEOWNERS file is properly configured (15 points)
- OPA policies correctly enforce tagging, instance type, and encryption rules (25 points)
- Drift detection identifies manual changes (20 points)
- CI/CD pipeline integrates all validation, policy, and drift checks (20 points)

**Time Limit**: 95 minutes total

## Evidence

After completing this module, you should be able to:

- Design multi-cloud IaC architectures using provider configuration and module abstraction
- Implement team workflows with branch strategies, CODEOWNERS, and pull request reviews
- Version modules using Git tags and a private registry
- Enforce governance through OPA policies, tagging requirements, and cost controls
- Plan and execute an enterprise IaC adoption across multiple teams
- Implement drift detection for continuous compliance monitoring
- Set up incident response procedures for IaC failures

**Artifact**: A complete IaC platform repository with shared modules, environment configurations, CODEOWNERS, OPA policies, CI/CD pipelines for validation and drift detection, and documentation for team onboarding.
