# Module 8: Security in Infrastructure as Code

When infrastructure lives in code, security becomes something you can test, scan, and enforce automatically. Instead of relying on manual reviews and periodic audits, you catch misconfigurations before they reach production. A security group that allows 0.0.0.0/0 on port 22 fails the pipeline before anyone can apply it. A public S3 bucket gets flagged during the plan phase. Secrets that accidentally get committed to Git get detected and blocked.

This module covers the tools and practices for securing IaC: static analysis with tfsec and checkov, policy-as-code frameworks, secret management, and a complete scenario of implementing security scanning in a Terraform workflow.

## Scanning Tools

Security scanning tools analyze your IaC templates for misconfigurations, compliance violations, and security risks. They run locally or in CI/CD pipelines and catch issues before deployment.

**tfsec** (now part of Trivy) scans Terraform code for security issues:

```bash
# Install
brew install tfsec
# or
go install github.com/aquasecurity/tfsec/cmd/tfsec@latest

# Run against a directory
tfsec .

# Run with specific output format
tfsec . --format json --out results.json

# Run and exclude specific checks
tfsec . --exclude aws-vpc-no-public-ingress-sgr

# Run with severity threshold
tfsec . --minimum-severity HIGH
```

**tfsec configuration file** (tfsec.yml):

```yaml
minimum_severity: MEDIUM
excludes:
  - aws-s3-enable-bucket-versioning
exclude_downloaded_modules: true
formatters:
  - stdout
  - json
  - sarif
```

**Common tfsec findings**:

| Check ID | Severity | Description |
|----------|----------|-------------|
| `aws-vpc-no-public-ingress-sgr` | CRITICAL | Security group allows ingress from 0.0.0.0/0 |
| `aws-s3-enable-bucket-encryption` | HIGH | S3 bucket missing encryption |
| `aws-rds-encrypt-storage` | HIGH | RDS instance missing storage encryption |
| `aws-ec2-enable-at-rest-encryption` | HIGH | EBS volume not encrypted |
| `aws-cloudwatch-enable-log-encryption` | MEDIUM | CloudWatch log group missing encryption |

**Checkov** scans Terraform, CloudFormation, Kubernetes, Docker, and other IaC formats:

```bash
# Install
pip install checkov

# Run against a directory
checkov -d .

# Run against specific file
checkov -f main.tf

# Run specific checks
checkov -d . --check CKV_AWS_18,CKV_AWS_19

# Skip specific checks
checkov -d . --skip-check CKV_AWS_18

# Output formats
checkov -d . --output json
checkov -d . --output junitxml
```

**Key checkov checks for Terraform**:

| Check ID | Description |
|----------|-------------|
| `CKV_AWS_18` | S3 bucket should have access logging enabled |
| `CKV_AWS_19` | S3 bucket should have server-side encryption enabled |
| `CKV_AWS_14` | RDS instances should have encryption enabled |
| `CKV_AWS_23` | Security groups should not allow 0.0.0.0/0 ingress |
| `CKV_AWS_16` | ALB listener should use HTTPS |
| `CKV_AWS_50` | Lambda functions should use latest runtime versions |

**Trivy** includes tfsec and scans for misconfigurations, secrets, and vulnerabilities:

```bash
# Install
brew install trivy

# Scan Terraform for misconfigurations
trivy config --security-checks misconfig .

# Scan for secrets
trivy fs --scans secret .

# Scan with severity filter
trivy config --severity HIGH,CRITICAL .
```

**Integrating into CI/CD** (GitHub Actions):

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [pull_request]

jobs:
  tfsec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/tfsec-action@v1.0.3
        with:
          working_directory: infrastructure/
          soft_fail: false

  checkov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bridgecrewio/checkov-action@v12
        with:
          directory: infrastructure/
          framework: terraform
          soft_fail: false

  trivy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: config
          scan-ref: infrastructure/
          severity: HIGH,CRITICAL
          exit-code: 1
```

## Policy as Code

Policy as Code (PaC) takes security scanning further by letting you define organizational policies as machine-readable rules that are automatically enforced on every infrastructure change.

**Sentinel** (HashiCorp's PaC framework for Terraform Cloud):

```python
import "tfplan/v2" as tfplan

# All S3 buckets must have encryption enabled
s3_buckets_with_encryption = filter tfplan.resource_changes as _, rc {
    rc.type is "aws_s3_bucket" and
    rc.mode is "managed" and
    (rc.change.actions contains "create" or rc.change.actions contains "update") and
    rc.change.after.server_side_encryption_configuration is not null
}

s3_buckets_without_encryption = filter tfplan.resource_changes as _, rc {
    rc.type is "aws_s3_bucket" and
    rc.mode is "managed" and
    (rc.change.actions contains "create" or rc.change.actions contains "update") and
    rc.change.after.server_side_encryption_configuration is null
}

main = rule {
    length(s3_buckets_without_encryption) is 0
}
```

**Open Policy Agent (OPA)** with Terraform:

```rego
package terraform.analysis

default allow = false

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_s3_bucket"
    resource.values.acl == "public-read"
    msg := sprintf("S3 bucket %s has public ACL", [resource.address])
}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_security_group_rule"
    resource.values.type == "ingress"
    resource.values.cidr_blocks[_] == "0.0.0.0/0"
    resource.values.from_port == 22
    msg := sprintf("Security group rule %s allows SSH from 0.0.0.0/0", [resource.address])
}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type != "data"
    not resource.values.tags
    msg := sprintf("Resource %s is missing required tags", [resource.address])
}
```

Run with:

```bash
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json
opa eval --data policy/ --input tfplan.json 'data.terraform.analysis.deny'
```

**Conftest** simplifies OPA policy testing:

```bash
brew install conftest
conftest test tfplan.json --policy policy/
```

## Secret Management

Secrets in IaC are a common source of security incidents. Hardcoded passwords, API keys, and certificates in Terraform files can leak into version control, state files, and logs.

**What not to do**:

```hcl
# NEVER do this
resource "aws_db_instance" "postgres" {
  password = "supersecret123"
}

variable "api_key" {
  default = "ak_1234567890"
}
```

**HashiCorp Vault integration**:

```hcl
provider "vault" {
  address = "https://vault.example.com:8200"
  token   = var.vault_token
}

data "vault_generic_secret" "db_credentials" {
  path = "secret/data/production/database"
}

resource "aws_db_instance" "postgres" {
  password = data.vault_generic_secret.db_credentials.data["password"]
}
```

**AWS Secrets Manager**:

```hcl
resource "aws_secretsmanager_secret" "db_password" {
  name = "production/database/password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_db_instance" "postgres" {
  password = aws_secretsmanager_secret_version.db_password.secret_string
}
```

**SSM Parameter Store**:

```hcl
resource "aws_ssm_parameter" "db_password" {
  name  = "/production/database/password"
  type  = "SecureString"
  value = var.db_password
}

resource "aws_db_instance" "postgres" {
  password = aws_ssm_parameter.db_password.value
}
```

**Environment variables** for CI/CD:

```bash
export TF_VAR_db_password="supersecret123"
export TF_VAR_api_key="ak_1234567890"
terraform apply
```

**SOPS** (Secrets OPerationS) for encrypted files:

```bash
brew install sops
sops --encrypt --in-place secrets.yml
sops --decrypt secrets.yml
```

```hcl
provider "sops" {}

data "sops_file" "secrets" {
  source_file = "secrets.enc.yml"
}

resource "aws_db_instance" "postgres" {
  password = data.sops_file.secrets.data["db_password"]
}
```

**Detecting secrets in Git**:

```bash
brew install gitleaks

# Scan current state of the repository
gitleaks detect --source . --verbose

# Scan full Git history including deleted files
gitleaks detect --source . --log-opts="--all"

# Scan specific paths
gitleaks detect --source infrastructure/ --verbose

# Generate SARIF output for GitHub Security tab
gitleaks detect --source . --report-format sarif --report-path results.sarif

# Create a baseline to ignore known secrets
gitleaks detect --source . --report-path .gitleaks.baseline
```

**Gitleaks configuration** (.gitleaks.toml):

```toml
title = "gitleaks config"

[[rules]]
id = "aws-access-key"
description = "AWS Access Key"
regex = '''(AKIA[0-9A-Z]{16})'''
tags = ["key", "AWS"]

[[rules]]
id = "aws-secret-key"
description = "AWS Secret Key"
regex = '''(?i)aws_secret_access_key\s*[:=]\s*['\"]?([A-Za-z0-9/+=]{40})['\"]?'''
tags = ["key", "AWS"]

[[rules]]
id = "private-key"
description = "Private Key"
regex = '''-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----'''
tags = ["key", "private"]

[[rules]]
id = "password-in-code"
description = "Password assigned in code"
regex = '''(?i)(password|passwd|pwd)\s*[:=]\s*['\"]([^'\"]{8,})['\"]'''
tags = ["password"]

[[allowlist]]
description = "Allow test credentials"
paths = [
  '''test/''',
  '''tests/''',
  '''.*_test\.go''',
  '''\.test\.ts$'''
]
```

**Preventive measures** beyond scanning:

1. **Git hooks**: Install pre-commit hooks that run gitleaks before every commit. This catches secrets before they enter the repository, not after.

2. **Repository rules**: Use GitHub branch protection rules to require status checks to pass before merging. If the secret scan fails, the PR cannot be merged.

3. **Credential rotation**: When a secret is detected in Git history, rotate it immediately. The secret is compromised even if you remove it from the latest commit because it exists in previous commits.

4. **Secret scanning alerts**: Enable GitHub's built-in secret scanning feature which partners with service providers to detect known token formats.

5. **Audit logging**: Track who accesses sensitive repositories and when. Use GitHub audit log or AWS CloudTrail for this.

## Network Security in IaC

Network security is one of the most critical aspects of infrastructure security. Misconfigured security groups and network ACLs are the leading cause of cloud breaches.

**Security group best practices**:

```hcl
# BAD: Allows all traffic from anywhere
resource "aws_security_group" "bad" {
  name   = "bad-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# GOOD: Restricts access to specific ports and sources
resource "aws_security_group" "web" {
  name_prefix = "web-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web servers"

  tags = {
    Name        = "web-sg"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group_rule" "https_inbound" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
  description       = "HTTPS from anywhere"
}

resource "aws_security_group_rule" "http_inbound" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
  description       = "HTTP redirect"
}

resource "aws_security_group_rule" "ssh_from_bastion" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  source_security_group_id = aws_security_group.bastion.id
  security_group_id = aws_security_group.web.id
  description       = "SSH from bastion only"
}

resource "aws_security_group_rule" "outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
  description       = "Allow all outbound"
}
```

**VPC flow logs** for network monitoring:

```hcl
resource "aws_flow_log" "main" {
  vpc_id               = aws_vpc.main.id
  traffic_type         = "ALL"
  log_destination      = aws_cloudwatch_log_group.flow_log.arn
  log_destination_type = "cloud-watch-logs"
  iam_role_arn         = aws_iam_role.flow_log.arn

  tags = {
    Name = "vpc-flow-log"
  }
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/flow-log"
  retention_in_days = 90
}
```

**Network ACLs** as an additional defense layer:

```hcl
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Allow inbound ephemeral ports for return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "private-nacl"
  }
}
```

## Encryption at Rest and in Transit

Every resource that stores or transmits sensitive data should be encrypted. This is not optional in production environments.

**S3 bucket encryption**:

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "my-encrypted-bucket"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "data" {
  bucket        = aws_s3_bucket.data.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access/"
}
```

**EBS volume encryption**:

```hcl
resource "aws_ebs_encryption_by_default" "main" {
  enabled = true
}

resource "aws_ebs_volume" "data" {
  availability_zone = "us-east-1a"
  size              = 100
  type              = "gp3"
  encrypted         = true
  kms_key_id        = aws_kms_key.ebs.arn

  tags = {
    Name = "encrypted-data-volume"
  }
}
```

**RDS encryption**:

```hcl
resource "aws_db_instance" "postgres" {
  identifier     = "production-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r5.large"

  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn
  allocated_storage = 100

  # ...
}
```

**KMS key management**:

```hcl
resource "aws_kms_key" "general" {
  description             = "General purpose KMS key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "general-kms-key"
    Environment = "production"
  }
}

resource "aws_kms_alias" "general" {
  name          = "alias/general"
  target_key_id = aws_kms_key.general.key_id
}
```

Enable key rotation to automatically rotate keys annually. This is a compliance requirement for many standards including PCI DSS and SOC 2.

## Real Scenario: Implementing Security Scanning

Let us set up a complete security scanning pipeline for a Terraform project.

**Pre-commit hooks** (.pre-commit-config.yaml):

```yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.5
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
      - id: terraform_tfsec
        args:
          - --args=--severity=HIGH,CRITICAL

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

**OPA policy** (policy/terraform.rego):

```rego
package terraform.analysis

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_s3_bucket"
    resource.values.acl == "public-read"
    msg := sprintf("S3 bucket %s must not have public ACL", [resource.address])
}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_s3_bucket"
    not resource.values.server_side_encryption_configuration
    msg := sprintf("S3 bucket %s must have server-side encryption", [resource.address])
}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_security_group_rule"
    resource.values.type == "ingress"
    resource.values.cidr_blocks[_] == "0.0.0.0/0"
    resource.values.from_port == 22
    msg := sprintf("Security group rule %s must not allow SSH from 0.0.0.0/0", [resource.address])
}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_db_instance"
    not resource.values.storage_encrypted
    msg := sprintf("RDS instance %s must have storage encryption enabled", [resource.address])
}
```

**Compliant Terraform**:

```hcl
resource "aws_s3_bucket" "data" {
  bucket = "my-secure-bucket"
  tags = {
    Name        = "data-bucket"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_security_group" "web" {
  name_prefix = "web-"
  vpc_id      = aws_vpc.main.id
  tags = {
    Name        = "web-sg"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group_rule" "https_inbound" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
}

resource "aws_security_group_rule" "outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
}
```

**CI/CD security pipeline** (.github/workflows/security.yml):

```yaml
name: Infrastructure Security
on:
  pull_request:
    paths:
      - 'infrastructure/**'

jobs:
  tfsec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/tfsec-action@v1.0.3
        with:
          working_directory: infrastructure/
          soft_fail: false
          additional_args: --severity HIGH,CRITICAL

  checkov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bridgecrewio/checkov-action@v12
        with:
          directory: infrastructure/
          framework: terraform
          soft_fail: false

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  policy-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: |
          curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
          chmod +x opa && sudo mv opa /usr/local/bin/
      - run: terraform init -backend=false
        working-directory: infrastructure/
      - run: terraform plan -no-color -out=tfplan
        working-directory: infrastructure/
      - run: terraform show -json tfplan > tfplan.json
        working-directory: infrastructure/
      - run: opa eval --data policy/ --input infrastructure/tfplan.json 'data.terraform.analysis.deny'
```

## Assessment

**Lab Task 1** (30 minutes): Run tfsec and checkov against an existing Terraform project. Identify at least five security findings. Fix each finding and verify the scan passes cleanly.

**Lab Task 2** (35 minutes): Write three OPA/Rego policies that enforce: (1) no public S3 buckets, (2) SSH restricted from 0.0.0.0/0 in security groups, and (3) all resources must have tags. Create a Terraform plan, convert it to JSON, and verify the policies pass.

**Lab Task 3** (30 minutes): Set up a pre-commit hook configuration that runs terraform fmt, terraform validate, tfsec, and gitleaks. Verify the hooks run correctly on a test commit. Add a GitHub Actions workflow that runs the same checks on pull requests.

**Grading Criteria**:
- Security scans identify real findings and all are remediated (25 points)
- OPA policies correctly deny non-compliant resources (25 points)
- Pre-commit hooks and CI/CD pipeline run all security checks (25 points)
- Secrets are managed through environment variables or parameter store (15 points)
- All security-related resources are properly configured (10 points)

**Time Limit**: 95 minutes total

## Evidence

After completing this module, you should be able to:

- Run tfsec, checkov, and Trivy to scan Terraform for security issues
- Write OPA/Rego policies that enforce organizational security standards
- Set up pre-commit hooks for local security scanning
- Integrate security scanning into GitHub Actions CI/CD pipelines
- Manage secrets using environment variables, SSM Parameter Store, or Vault
- Configure gitleaks to detect secrets in Git history
- Remediate common IaC security findings

**Artifact**: A Terraform project with security scanning configured through pre-commit hooks and GitHub Actions, OPA policies enforcing organizational standards, and all resources configured to pass security scans.
