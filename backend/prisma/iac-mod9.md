# Module 9 — Testing IaC

## What You'll Actually Do

You'll write unit tests for Terraform modules using `terraform validate` and custom validation scripts. You'll create an integration test that deploys resources, verifies them, and tears them down. You'll run a drift detection check and understand why testing infrastructure is different from testing application code.

## Why Test Infrastructure

Infrastructure bugs are expensive. A misconfigured security group exposes your database to the internet. A missing backup policy means data loss. Unlike application bugs, you can't just hotfix and redeploy in five minutes — infrastructure changes often require careful sequencing.

Testing IaC catches issues before they hit production. It's not optional.

## Validation Tests

The simplest test: does the configuration parse and validate?

```bash
# Terraform syntax check
terraform fmt -check
terraform validate
```

Add this to a CI pipeline. It catches syntax errors, type mismatches, and missing required variables.

```yaml
# CI step
- name: Validate Terraform
  run: |
    terraform fmt -check -diff
    terraform init -backend=false
    terraform validate
```

## Custom Validation Scripts

Write scripts that check your Terraform output against expected values.

```bash
#!/bin/bash
# tests/validate-vpc.sh

set -e

# Run plan and capture output
terraform plan -out=tfplan > /dev/null 2>&1
terraform show -json tfplan > tfplan.json

# Check VPC CIDR is not 0.0.0.0/0
VPC_CIDR=$(jq -r '.planned_values.root_module.resources[] | 
  select(.type == "aws_vpc") | 
  .values.cidr_block' tfplan.json)

if [ "$VPC_CIDR" = "0.0.0.0/0" ]; then
  echo "FAIL: VPC CIDR is 0.0.0.0/0 — too permissive"
  exit 1
fi

echo "PASS: VPC CIDR is $VPC_CIDR"

# Check all instances have tags
UNTAGGED=$(jq -r '.planned_values.root_module.resources[] | 
  select(.type == "aws_instance") | 
  select(.values.tags == null) | 
  .address' tfplan.json)

if [ -n "$UNTAGGED" ]; then
  echo "FAIL: Untagged instances: $UNTAGGED"
  exit 1
fi

echo "PASS: All instances are tagged"
```

## Integration Tests with Terratest

Terratest is a Go library for testing infrastructure. It deploys real resources, verifies them, and tears them down.

```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestTerraformModule(t *testing.T) {
    t.Parallel()

    terraformOptions := &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "cidr_block": "10.0.0.0/16",
            "env":        "test",
        },
    }

    // Destroy resources at the end
    defer terraform.Destroy(t, terraformOptions)

    // Deploy
    terraform.InitAndApply(t, terraformOptions)

    // Verify outputs
    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcId)
    assert.Contains(t, vpcId, "vpc-")

    subnetIds := terraform.OutputList(t, terraformOptions, "subnet_ids")
    assert.Equal(t, 2, len(subnetIds))
}
```

Run it:

```bash
cd tests/
go test -v -timeout 30m
```

Terratest deploys real infrastructure, so it takes time and costs money. Use it sparingly — for critical modules and major changes.

## Plan-Based Testing

For faster feedback, test the plan without applying.

```bash
# Generate plan
terraform plan -out=tfplan

# Check resource counts
RESOURCE_COUNT=$(terraform show -json tfplan | jq '.planned_values.root_module.resources | length')
echo "Resources to be created: $RESOURCE_COUNT"

if [ "$RESOURCE_COUNT" -gt 20 ]; then
  echo "FAIL: Too many resources. Check for accidental mass creation."
  exit 1
fi

# Check no resources are being destroyed
DESTROYS=$(terraform show -json tfplan | jq '[.resource_changes[] | select(.change.actions[] == "destroy")] | length')
if [ "$DESTROYS" -gt 0 ]; then
  echo "WARNING: $DESTROYS resources will be destroyed"
  exit 1
fi
```

## Drift Detection

Drift is when reality diverges from your configuration. Someone manually changes a security group in the console. Your Terraform code still says the old state, but the real infrastructure is different.

```bash
# Detect drift
terraform plan -detailed-exitcode

# Exit codes:
# 0 = no changes
# 1 = error
# 2 = changes detected
```

For continuous drift detection, run `terraform plan` on a schedule and alert on non-zero exit codes.

```yaml
# Scheduled drift check
name: Drift Detection
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: terraform init
      - run: terraform plan -detailed-exitcode -no-color
        continue-on-error: true
```

## What to Test

| Test Type | What to Check | Speed | Cost |
|-----------|---------------|-------|------|
| Validation | Syntax, types, required vars | Seconds | Free |
| Plan-based | Resource counts, no destroys, CIDR ranges | Seconds | Free |
| Policy | Security compliance, tagging | Seconds | Free |
| Integration | Actual resource creation and attributes | Minutes | Real money |
| Drift | Reality matches configuration | Seconds | Free |

Start with validation and plan-based tests. Add integration tests for critical modules. Run drift detection on a schedule.

## Assessment

**Lab Task**: Write a Terraform configuration for a local file-based infrastructure (at least 5 resources). Create: (1) a validation script that runs `terraform fmt -check` and `terraform validate`, (2) a plan-based test script that checks resource count and verifies no resources are being destroyed, (3) a shell-based test that verifies all expected files exist after apply. Run all three test stages against your configuration.

**Time**: 35 minutes

**Grading**:
- Terraform configuration creates 5+ resources (15 points)
- Validation script catches intentional syntax errors (25 points)
- Plan-based test correctly counts resources and catches destroys (30 points)
- Post-apply verification script confirms all files exist (30 points)

## Evidence

- Validation script output (pass and intentional fail)
- Plan-based test output
- Post-apply verification output
- All test scripts and Terraform files committed
