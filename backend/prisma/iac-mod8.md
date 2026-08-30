# Module 8 — Security in IaC

## What You'll Actually Do

You'll run security scans against Terraform and Ansible code. You'll write a simple OPA/Rego policy that blocks insecure configurations. You'll learn to catch secrets, overly permissive IAM policies, and unencrypted resources before they reach production.

## The Problem

Infrastructure code has the same security concerns as application code, but the stakes are higher. A SQL injection in an app might expose one database. An open S3 bucket in your Terraform code exposes everything that bucket holds.

And because IaC is often deployed with elevated privileges (it needs permission to create IAM roles, network configs, etc.), a compromised pipeline can do serious damage.

## Scanning Terraform Code

**Checkov** scans Terraform files for security misconfigurations.

```bash
# Install
pip install checkov

# Scan a Terraform directory
checkov -d .

# Scan a specific file
checkov -f main.tf

# Output as JSON
checkov -d . --output json
```

Example findings:

```
Check: CKV_AWS_18: "Ensure the S3 bucket has access logging enabled"
FAILED: main.tf:1-10

Check: CKV_AWS_145: "Ensure that S3 buckets are encrypted with KMS keys"
FAILED: main.tf:1-10
```

**tfsec** is another scanner, focused specifically on Terraform.

```bash
# Install
go install github.com/aquasecurity/tfsec/cmd/tfsec@latest

# Scan
tfsec .

# Scan with SARIF output (for CI integration)
tfsec . --format sarif --out results.sarif
```

## Scanning Ansible Code

**ansible-lint** catches common mistakes and security issues.

```bash
# Install
pip install ansible-lint

# Lint a playbook
ansible-lint playbook.yml

# Lint an entire role
ansible-lint roles/nginx/
```

Common findings: tasks without `name`, using `shell` when `command` suffices, hardcoded passwords.

## Secrets in Infrastructure Code

Never hardcode secrets in `.tf` or `.yaml` files. Use environment variables, secret managers, or encrypted values.

```hcl
# BAD — secret in code
resource "aws_db_instance" "main" {
  password = "supersecret123"
}

# GOOD — secret from variable (loaded from env or secret manager)
variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_db_instance" "main" {
  password = var.db_password
}
```

```bash
# Set the secret via environment variable
export TF_VAR_db_password="$(aws secretsmanager get-secret-value \
  --secret-id prod/db/password \
  --query SecretString --output text)"
```

Use `git-secrets` or `trufflehog` to scan for secrets before committing.

```bash
# Scan for secrets in git history
trufflehog git file://. --only-verified
```

## Policy as Code with OPA

Open Policy Agent (OPA) lets you write security policies as code. You define rules, and a tool evaluates your infrastructure against them.

```rego
# policies/s3.rego
package terraform.s3

deny[msg] {
  resource := input.planned_values.root_module.resources[_]
  resource.type == "aws_s3_bucket"
  not resource.values.versioning_enabled
  msg := "S3 bucket must have versioning enabled"
}

deny[msg] {
  resource := input.planned_values.root_module.resources[_]
  resource.type == "aws_s3_bucket"
  resource.values.acl == "public-read"
  msg := "S3 bucket must not be public-read"
}

deny[msg] {
  resource := input.planned_values.root_module.resources[_]
  resource.type == "aws_s3_bucket"
  not resource.values.server_side_encryption_configuration
  msg := "S3 bucket must have encryption configured"
}
```

Evaluate with `conftest`:

```bash
# Install conftest
go install github.com/open-policy-agent/conftest@latest

# Generate a plan file
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json

# Test against policy
conftest test tfplan.json --policy policies/
```

## CI/CD Integration

Run these checks in your pipeline. Block merges that fail security scans.

```yaml
# GitHub Actions example
name: Security Scan
on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkov scan
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: terraform/
          soft_fail: false

      - name: tfsec
        uses: aquasecurity/tfsec-action@v1.0.3
        with:
          working_directory: terraform/

      - name: Conftest policies
        run: |
          terraform -chdir=terraform/ plan -out=tfplan
          terraform -chdir=terraform/ show -json tfplan > tfplan.json
          conftest test tfplan.json --policy policies/
```

## Assessment

**Lab Task**: Write a Terraform configuration with at least 3 security issues: an unencrypted S3 bucket, an overly permissive security group (0.0.0.0/0 on port 22), and a hardcoded password in a resource. Install and run `checkov` or `tfsec` against it. Then fix all findings so the scan passes clean. Write an OPA/Rego policy that denies S3 buckets without versioning.

**Time**: 40 minutes

**Grading**:
- Initial scan identifies at least 3 security issues (25 points)
- OPA policy correctly denies non-versioned S3 buckets (25 points)
- All security issues fixed in the final configuration (25 points)
- Final scan passes with no high/critical findings (25 points)

## Evidence

- Initial scan output showing security findings
- The OPA/Rego policy file
- Final scan output showing clean results
- The fixed Terraform configuration committed
