# Module 8 — Cloud Compliance: CIS Benchmarks and Audit

## What You'll Actually Do

You'll run the CIS AWS Foundations Benchmark against a real AWS account, interpret the results, and fix the failing checks. Compliance isn't about checking boxes — it's about making sure your security baseline is actually in place and staying there.

## What Are CIS Benchmarks?

CIS (Center for Internet Security) benchmarks are consensus-based configuration guidelines. They tell you exactly how to configure cloud services securely. AWS, Azure, and GCP all have CIS benchmarks. The AWS one covers:

- IAM
- Storage
- Logging
- Monitoring
- Networking
- Databases

The benchmark is specific. It tells you things like "MFA should be enabled for root" and "CloudTrail should be enabled in all regions." It's not theoretical — it's a checklist of things to verify.

## Running the CIS Benchmark

The easiest way is with AWS Security Hub, which includes CIS compliance checks.

```bash
# Enable Security Hub with CIS benchmark
aws securityhub enable-security-hub

# Enable the CIS AWS Foundations Benchmark standard
aws securityhub batch-enable-standards \
  --standards-subscription-requests '[
    {
      "StandardsArn": "arn:aws:securityhub:::standards/cis-aws-foundations-benchmark/v/1.4.0"
    }
  ]'

# Check compliance status
aws securityhub get-compliance-summary-by-standards-subscription

# Get failed controls
aws securityhub get-findings \
  --filters '{
    "RecordState": [{"Value": "ACTIVE", "Comparison": "EQUALS"}],
    "ComplianceStatus": [{"Value": "FAILED", "Comparison": "EQUALS"}],
    "GeneratorId": [{"Value": "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.4.0", "Comparison": "PREFIX"}]
  }'
```

### Using Prowler (Open Source Alternative)

```bash
# Install Prowler
pip install prowler

# Run CIS benchmark check
prowler aws --compliance cis_2.0_aws --region us-east-1

# Generate report
prowler aws --compliance cis_2.0_aws --output-format csv --output reports/
```

## Common CIS Findings and Fixes

### 1. Root Account Not Using MFA

```bash
# Check if root has MFA
aws iam get-account-summary | grep AccountMFAEnabled
# 0 = no MFA, 1 = MFA enabled

# This is a manual fix — root MFA must be set up in the console
# After enabling, delete root access keys
aws iam delete-access-key --access-key-id AKIAIOSFODNN7EXAMPLE --user-name root
```

### 2. CloudTrail Not Enabled in All Regions

```bash
# Fix: Create a multi-region trail
aws cloudtrail create-trail \
  --name cis-compliant-trail \
  --s3-bucket-name my-cis-logs \
  --is-multi-region-trail \
  --enable-log-file-validation \
  --kms-key-id alias/cis-cloudtrail-key

aws cloudtrail start-logging --name cis-compliant-trail
```

### 3. Security Groups Allow Unrestricted SSH

```bash
# Find security groups with SSH open to the world
aws ec2 describe-security-groups \
  --filters "Name=ip-permission.cidr,Values=0.0.0.0/0" \
  --query "SecurityGroups[?IpPermissions[?FromPort==`22` && ToPort==`22`]].GroupId"

# Fix: Remove the 0.0.0.0/0 rule
aws ec2 revoke-security-group-ingress \
  --group-id sg-0123456789abcdef0 \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0
```

### 4. S3 Buckets Publicly Accessible

```bash
# Find public buckets
aws s3api list-buckets --query 'Buckets[].Name' --output text | \
while read bucket; do
  public=$(aws s3api get-bucket-acl --bucket "$bucket" --query "Grants[?Grantee.URI=='http://acs.amazonaws.com/groups/global/AllUsers']" --output text)
  if [ -n "$public" ]; then
    echo "PUBLIC: $bucket"
  fi
done

# Fix: Block public access
aws s3api put-public-access-block \
  --bucket my-sensitive-bucket \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

## Continuous Compliance

Don't just run checks once. Automate them.

```bash
# Schedule Prowler with EventBridge
aws events put-rule \
  --name daily-cis-check \
  --schedule-expression "cron(0 2 * * ? *)"

# Send findings to Security Hub automatically
aws securityhub batch-import-findings --findings '[
  {
    "SchemaVersion": "2018-10-08",
    "Id": "cis-check-1.5",
    "ProductArn": "arn:aws:securityhub:us-east-1::product/custom/cis-benchmark",
    "GeneratorId": "cis-aws-foundations-benchmark",
    "AwsAccountId": "123456789012",
    "Types": ["Software and Configuration Checks/Industry and Regulatory Standards/CIS AWS Foundations Benchmark"],
    "CreatedAt": "2024-01-15T00:00:00Z",
    "UpdatedAt": "2024-01-15T00:00:00Z",
    "Severity": {"Label": "HIGH", "Normalized": 70},
    "Title": "Root account not using MFA",
    "Description": "Root account does not have MFA enabled"
  }
]'
```

## Lab Task — CIS Audit and Remediation

1. **Run the Audit** — Using Security Hub or Prowler, run the CIS AWS Foundations Benchmark against your AWS account. Export the results.

2. **Categorize** — Sort findings into:
   - Quick fixes (can be done in < 5 minutes each)
   - Medium effort (requires changes but straightforward)
   - Complex (requires architecture changes or manual steps)

3. **Remediate** — Fix all quick fixes and at least 2 medium-effort findings. Document what you changed.

4. **Re-audit** — Run the benchmark again. Document the improvement.

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: CIS benchmark run successfully with results exported
- 3 points: Findings categorized correctly
- 3 points: Remediation steps taken and documented
- 2 points: Re-audit shows improvement

**Evidence:** CIS benchmark reports (before and after), remediation documentation with CLI commands used, and summary of improvements.
