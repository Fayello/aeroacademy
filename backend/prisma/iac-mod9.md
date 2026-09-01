# Module 9: Testing Infrastructure as Code

You have written Terraform modules, set up workspaces, and added security scanning. But how do you know your infrastructure actually works? A Terraform apply might succeed with all resources created, but the VPC does not route traffic correctly, the database is not accessible from the application servers, or the load balancer health checks fail. The resources exist, but the system does not function.

Testing IaC means verifying that your infrastructure does what it is supposed to do, not just that it creates resources without errors. This module covers Terratest for integration testing, validation and linting, drift detection, and a complete scenario of testing a Terraform module end-to-end.

## Terratest

Terratest is a Go library developed by Gruntwork that lets you write automated tests for Terraform, Pulumi, Kubernetes, Docker, and other infrastructure tools. It spins up real infrastructure, verifies it works, then tears it down. This is the difference between testing that your Terraform syntax is valid and testing that the infrastructure actually functions.

**Why Terratest**: Unit tests check individual pieces in isolation. Infrastructure needs integration tests that provision real resources, verify they work together, and clean up afterward. Terratest does exactly this.

**Setup**:

```bash
mkdir tests && cd tests
go mod init github.com/company/infrastructure-tests
go get github.com/gruntwork-io/terratest/modules/terraform
go get github.com/gruntwork-io/terratest/modules/aws
go get github.com/gruntwork-io/terratest/modules/random
go get github.com/stretchr/testify/assert
```

**Basic test structure**:

```go
// tests/vpc_test.go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/stretchr/testify/assert"
)

func TestVpcModule(t *testing.T) {
    t.Parallel()

    // Arrange
    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "name":               "test-vpc",
            "cidr_block":         "10.99.0.0/16",
            "availability_zones": []string{"us-east-1a", "us-east-1b"},
            "public_subnet_cidrs":  []string{"10.99.1.0/24", "10.99.2.0/24"},
            "private_subnet_cidrs": []string{"10.99.11.0/24", "10.99.12.0/24"},
        },
    })

    // Destroy at the end
    defer terraform.Destroy(t, terraformOptions)

    // Act
    terraform.InitAndApply(t, terraformOptions)

    // Assert
    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcId)

    publicSubnetIds := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
    assert.Equal(t, 2, len(publicSubnetIds))

    privateSubnetIds := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
    assert.Equal(t, 2, len(privateSubnetIds))

    // Verify VPC exists in AWS
    vpc := aws.GetVpcById(t, vpcId, "us-east-1")
    assert.Equal(t, "10.99.0.0/16", vpc.CidrBlock)

    // Verify subnets are in correct AZs
    for i, subnetId := range publicSubnetIds {
        subnet := aws.GetSubnetById(t, subnetId, "us-east-1")
        assert.Equal(t, vpcId, subnet.VpcId)
        assert.Contains(t, []string{"us-east-1a", "us-east-1b"}, subnet.AvailabilityZone)
    }
}
```

**Running tests**:

```bash
# Run all tests
go test -v ./tests/...

# Run a specific test
go test -v -run TestVpcModule ./tests/...

# Run with parallelism
go test -v -parallel 4 ./tests/...

# Run with timeout (infrastructure tests take time)
go test -v -timeout 30m ./tests/...
```

**Testing with random names** to avoid conflicts when running parallel tests:

```go
func TestWithRandomSuffix(t *testing.T) {
    t.Parallel()

    uniqueId := random.UniqueId()

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "name": fmt.Sprintf("test-%s", uniqueId),
            "cidr_block": "10.99.0.0/16",
        },
    })

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcId)
}
```

The random.UniqueId() generates a short random string. This prevents naming conflicts when multiple test runs happen simultaneously or when tests do not clean up properly.

**Testing AWS resources directly**:

```go
func TestSecurityGroupRules(t *testing.T) {
    t.Parallel()

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/security",
        Vars: map[string]interface{}{
            "environment": "test",
        },
    })

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    sgId := terraform.Output(t, terraformOptions, "web_security_group_id")
    sg := aws.GetSecurityGroupById(t, sgId, "us-east-1")

    // Verify no SSH from 0.0.0.0/0
    for _, rule := range sg.Ipv4IngressRules {
        if rule.CidrIp == "0.0.0.0/0" && rule.FromPort == 22 {
            t.Errorf("SSH should not be allowed from 0.0.0.0/0")
        }
    }

    // Verify HTTPS is allowed from anywhere
    httpsAllowed := false
    for _, rule := range sg.Ipv4IngressRules {
        if rule.CidrIp == "0.0.0.0/0" && rule.FromPort == 443 {
            httpsAllowed = true
            break
        }
    }
    assert.True(t, httpsAllowed, "HTTPS should be allowed from 0.0.0.0/0")
}
```

This test goes beyond checking that resources exist. It verifies the security group rules are configured correctly by querying AWS directly.

**Testing outputs and dependencies**:

```go
func TestModuleOutputs(t *testing.T) {
    t.Parallel()

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/platform",
        Vars: map[string]interface{}{
            "environment": "test",
        },
    })

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    // Verify all outputs exist and are non-empty
    outputs := []string{"vpc_id", "public_subnet_ids", "private_subnet_ids", "nat_gateway_ips"}
    for _, output := range outputs {
        value := terraform.Output(t, terraformOptions, output)
        assert.NotEmpty(t, value, "Output %s should not be empty", output)
    }

    // Verify outputs reference valid AWS resources
    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    vpc := aws.GetVpcById(t, vpcId, "us-east-1")
    assert.NotNil(t, vpc)
}
```

## Validation

Before running Terratest, which takes time and costs money, validate your Terraform code locally.

**terraform validate** checks syntax and internal consistency:

```bash
terraform init
terraform validate
```

This catches syntax errors, type mismatches, and missing required arguments. It does not contact the cloud provider, so it is fast.

**terraform fmt** ensures consistent formatting:

```bash
terraform fmt -check     # Check without fixing
terraform fmt -recursive  # Fix all files recursively
```

Consistent formatting makes code reviews easier and reduces noise in diffs.

**TFLint** catches issues that validate misses:

```bash
brew install tflint
tflint --init
tflint
```

TFLint configuration (.tflint.hcl):

```hcl
plugin "aws" {
  enabled = true
  version = "0.28.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "terraform_naming_convention" {
  enabled = true
  format  = "snake_case"
}

rule "terraform_documented_variables" {
  enabled = true
}

rule "terraform_documented_outputs" {
  enabled = true
}
```

TFLint catches things like using deprecated AWS resource attributes, missing required arguments, and naming convention violations. It also checks for resource-specific best practices like using the latest AMI patterns or correct IAM policy syntax.

**Infracost** estimates costs before deployment:

```bash
brew install infracost
infracost breakdown --path .
infracost diff --path . --compare-to main
```

This shows you the monthly cost estimate for your infrastructure and the cost difference between your branch and main. If your change adds an expensive resource, you see it before merging.

**Custom validation scripts** for organization-specific rules:

```bash
#!/bin/bash
# scripts/validate-tags.sh

# Check that all resources have required tags
REQUIRED_TAGS=("Environment" "Project" "ManagedBy")

for tf_file in $(find . -name "*.tf"); do
    for tag in "${REQUIRED_TAGS[@]}"; do
        if ! grep -q "$tag" "$tf_file"; then
            echo "WARNING: $tf_file may be missing tag: $tag"
        fi
    done
done
```

**Compliance checking with checkov custom policies**:

```python
# custom_policies/require_encryption.py
from checkov.common.checks.base_check import BaseCheck
from checkov.common.models.enums import CheckCategories, CheckResult

class RequireEncryptionCheck(BaseCheck):
    def __init__(self):
        name = "Ensure all storage resources are encrypted"
        id = "CUSTOM_REQUIRE_ENCRYPTION"
        supported_resources = ["aws_s3_bucket", "aws_ebs_volume", "aws_db_instance"]
        categories = [CheckCategories.ENCRYPTION]
        super().__init__(name, id, categories)

    def scan_resource_conf(self, conf):
        if "server_side_encryption_configuration" in conf:
            return CheckResult.PASSED
        if "encrypted" in conf and conf["encrypted"]:
            return CheckResult.PASSED
        if "storage_encrypted" in conf and conf["storage_encrypted"]:
            return CheckResult.PASSED
        return CheckResult.FAILED
```

**Test organization** best practices:

```
tests/
├── unit/                    # Fast, local tests
│   ├── naming_test.go
│   └── variables_test.go
├── integration/             # Tests that create real resources
│   ├── vpc_test.go
│   ├── ecs_test.go
│   └── rds_test.go
├── e2e/                     # Full stack tests
│   └── full_stack_test.go
└── helpers/                 # Shared test utilities
    └── test_utils.go
```

**Test naming conventions** in Terratest:

```go
// Good: descriptive test names
func TestVpcCreatesWithCorrectCidr(t *testing.T) { ... }
func TestVpcCreatesPublicSubnetsInCorrectAzs(t *testing.T) { ... }
func TestVpcNatGatewayProvidesInternetForPrivateSubnets(t *testing.T) { ... }

// Bad: generic test names
func TestVpc(t *testing.T) { ... }
func TestCreate(t *testing.T) { ... }
```

**Pre-commit hooks** for automated validation:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.5
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
      - id: terraform_docs
      - id: terraform_tfsec
        args:
          - --args=--severity=HIGH,CRITICAL
```

**CI/CD validation pipeline**:

```yaml
# .github/workflows/validate.yml
name: Validate Terraform
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.6.0"

      - name: Format Check
        run: terraform fmt -check -recursive

      - name: Init
        run: terraform init -backend=false

      - name: Validate
        run: terraform validate

      - name: TFLint
        uses: terraform-linters/setup-tflint@v4
      - run: tflint --init
      - run: tflint

      - name: TFSec
        uses: aquasecurity/tfsec-action@v1.0.3
        with:
          soft_fail: false

      - name: Cost Estimate
        uses: infracost/actions/setup@v2
      - run: infracost breakdown --path . --format json > infracost.json
```

## Drift Detection

Drift happens when the actual infrastructure diverges from what Terraform expects. Someone modifies a security group through the console, changes an instance type, or adds a tag. Terraform does not know about these changes until you run terraform plan.

**terraform plan** detects drift:

```bash
terraform plan
# "No changes" means infrastructure matches the configuration.
# Any output means something has drifted.
```

**Automated drift detection** with a scheduled CI/CD job:

```yaml
# .github/workflows/drift-detection.yml
name: Drift Detection
on:
  schedule:
    - cron: '0 8 * * *'

jobs:
  detect-drift:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, production]
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init
        working-directory: environments/${{ matrix.environment }}

      - name: Detect Drift
        run: |
          terraform plan -detailed-exitcode -no-color > plan.txt
          EXIT_CODE=$?
          if [ $EXIT_CODE -eq 2 ]; then
            echo "DRIFT DETECTED in ${{ matrix.environment }}"
            cat plan.txt
          fi
        working-directory: environments/${{ matrix.environment }}
        continue-on-error: true
```

The -detailed-exitcode flag returns exit code 2 when there are changes (drift), which the workflow captures and reports.

**Drift remediation** options:

1. **Ignore drift**: If the change was intentional, add lifecycle ignore_changes:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  lifecycle {
    ignore_changes = [tags, user_data]
  }
}
```

2. **Revert drift**: Run terraform apply to restore the configuration:

```bash
terraform plan -out=plan.txt
terraform apply plan.txt
```

3. **Update configuration**: If the drift was intentional, update your Terraform files:

```bash
terraform import aws_instance.web i-0123456789abcdef0
# Edit the configuration to match reality
terraform apply
```

**Terraform Cloud drift detection**: Terraform Cloud can run scheduled plans and alert on drift automatically.

## Real Scenario: Testing a Terraform Module

Let us write a complete test suite for a VPC module.

**Test file** (tests/vpc_test.go):

```go
package test

import (
    "fmt"
    "testing"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/gruntwork-io/terratest/modules/random"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestVpcCreatesCorrectly(t *testing.T) {
    t.Parallel()

    uniqueId := random.UniqueId()
    environment := fmt.Sprintf("test-%s", uniqueId)

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "name":               environment,
            "cidr_block":         "10.99.0.0/16",
            "availability_zones": []string{"us-east-1a", "us-east-1b"},
            "public_subnet_cidrs":  []string{"10.99.1.0/24", "10.99.2.0/24"},
            "private_subnet_cidrs": []string{"10.99.11.0/24", "10.99.12.0/24"},
            "enable_nat_gateway": true,
            "tags": map[string]string{
                "Environment": environment,
                "ManagedBy":   "terratest",
            },
        },
    })

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    require.NotEmpty(t, vpcId)

    vpc := aws.GetVpcById(t, vpcId, "us-east-1")
    assert.Equal(t, "10.99.0.0/16", vpc.CidrBlock)

    publicSubnetIds := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
    assert.Equal(t, 2, len(publicSubnetIds))

    for i, subnetId := range publicSubnetIds {
        subnet := aws.GetSubnetById(t, subnetId, "us-east-1")
        assert.Equal(t, vpcId, subnet.VpcId)
        assert.Equal(t, []string{"us-east-1a", "us-east-1b"}[i], subnet.AvailabilityZone)
    }

    privateSubnetIds := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
    assert.Equal(t, 2, len(privateSubnetIds))

    for _, subnetId := range privateSubnetIds {
        subnet := aws.GetSubnetById(t, subnetId, "us-east-1")
        assert.Equal(t, vpcId, subnet.VpcId)
    }

    igwId := terraform.Output(t, terraformOptions, "internet_gateway_id")
    require.NotEmpty(t, igwId)

    natGatewayIps := terraform.OutputList(t, terraformOptions, "nat_gateway_ips")
    assert.Equal(t, 2, len(natGatewayIps))
}

func TestVpcWithoutNatGateway(t *testing.T) {
    t.Parallel()

    uniqueId := random.UniqueId()

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "name":       fmt.Sprintf("test-%s", uniqueId),
            "cidr_block": "10.98.0.0/16",
            "availability_zones": []string{"us-east-1a"},
            "public_subnet_cidrs":  []string{"10.98.1.0/24"},
            "private_subnet_cidrs": []string{"10.98.11.0/24"},
            "enable_nat_gateway": false,
        },
    })

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    natGatewayIps := terraform.OutputList(t, terraformOptions, "nat_gateway_ips")
    assert.Equal(t, 0, len(natGatewayIps))
}

func TestVpcOutputsAreValid(t *testing.T) {
    t.Parallel()

    uniqueId := random.UniqueId()

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "name":       fmt.Sprintf("test-%s", uniqueId),
            "cidr_block": "10.97.0.0/16",
            "availability_zones": []string{"us-east-1a", "us-east-1b"},
            "public_subnet_cidrs":  []string{"10.97.1.0/24", "10.97.2.0/24"},
            "private_subnet_cidrs": []string{"10.97.11.0/24", "10.97.12.0/24"},
        },
    })

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    outputs := []string{
        "vpc_id",
        "vpc_cidr_block",
        "public_subnet_ids",
        "private_subnet_ids",
        "internet_gateway_id",
        "nat_gateway_ips",
        "public_route_table_id",
        "private_route_table_ids",
    }

    for _, output := range outputs {
        value := terraform.Output(t, terraformOptions, output)
        assert.NotEmpty(t, value, "Output %s should not be empty", output)
    }

    vpcCidr := terraform.Output(t, terraformOptions, "vpc_cidr_block")
    assert.Equal(t, "10.97.0.0/16", vpcCidr)
}
```

**Run the tests**:

```bash
cd tests
go mod tidy
go test -v -timeout 45m ./...
```

**CI/CD integration**:

```yaml
# .github/workflows/test.yml
name: Terraform Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'
      - uses: hashicorp/setup-terraform@v3

      - name: Run Tests
        run: go test -v -timeout 45m ./tests/...
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1
```

## Assessment

**Lab Task 1** (40 minutes): Write a Terratest test suite for a VPC module. The tests should verify: (1) VPC is created with the correct CIDR, (2) correct number of public and private subnets, (3) subnets are in expected AZs, (4) internet gateway is attached, and (5) NAT gateways are created when enabled. Run the tests and verify they pass.

**Lab Task 2** (30 minutes): Set up a pre-commit configuration that runs terraform fmt, terraform validate, tflint, and tfsec. Verify all checks pass on a clean project. Introduce a formatting error and verify the pre-commit hook catches it.

**Lab Task 3** (25 minutes): Create a drift detection workflow that runs terraform plan daily and reports any drift. Simulate drift by manually changing a tag through the AWS Console. Run the plan and verify it detects the change.

**Grading Criteria**:
- Terratest tests verify VPC creation, subnet count, AZ distribution, and gateways (30 points)
- Tests use random names and clean up after themselves (15 points)
- Pre-commit hooks catch formatting, validation, and security issues (20 points)
- Drift detection workflow correctly identifies manual changes (20 points)
- All tests pass in CI/CD and produce clear output (15 points)

**Time Limit**: 95 minutes total

## Evidence

After completing this module, you should be able to:

- Write Terratest tests that provision real infrastructure and verify it works
- Use random names and deferred destruction to keep test environments clean
- Validate Terraform code with terraform validate, tflint, and checkov
- Detect infrastructure drift using terraform plan and scheduled CI/CD jobs
- Set up pre-commit hooks for local validation before pushing
- Integrate infrastructure tests into GitHub Actions workflows
- Estimate infrastructure costs with Infracost before deployment

**Artifact**: A test suite using Terratest that validates a VPC module, a pre-commit configuration for local validation, and a CI/CD pipeline that runs tests and drift detection automatically.
