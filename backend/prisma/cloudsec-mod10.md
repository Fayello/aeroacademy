# Module 10 — Multi-Cloud Security: Hybrid and Multi-Cloud

## What You'll Actually Do

You'll set up a VPC peering connection, configure identity federation across accounts, and build a security architecture that works across multiple cloud providers. Most organizations don't live in one cloud. Your security has to work across boundaries.

## Why Multi-Cloud Matters

Nobody starts multi-cloud on purpose. It happens because:
- Acquisitions bring different cloud providers
- Different teams choose different clouds
- Some services are better on one provider
- Compliance requires geographic diversity

The security challenge: every cloud has different IAM models, different logging, different encryption defaults. You need a unified view.

## Identity Federation Across Clouds

### AWS cross-account access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT-B-root:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "unique-external-id-here"
        }
      }
    }
  ]
}
```

### Azure AD integration with AWS

```bash
# Install Azure CLI and AWS CLI
# Configure Azure AD as identity provider for AWS
aws iam create-saml-provider \
  --name AzureAD \
  --saml-metadata-document file://azure-metadata.xml

# Create a role that trusts Azure AD
aws iam create-role \
  --role-name AzureFederatedRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Federated": "arn:aws:iam::123456789012:saml-provider/AzureAD"
        },
        "Action": "sts:AssumeRoleWithSAML",
        "Condition": {
          "StringEquals": {
            "SAML:aud": "https://signin.aws.amazon.com/saml"
          }
        }
      }
    ]
  }'
```

## Unified Logging Across Clouds

### Cloud Logging Architecture

```
AWS CloudTrail  ──┐
Azure Activity Log ──┼──→  Central SIEM (Splunk/Elastic/CloudWatch)
GCP Audit Logs  ──┘
```

```bash
# CloudWatch Logs cross-account subscription
aws logs put-subscription-filter \
  --log-group-name "/aws/cloudtrail/security-audit" \
  --filter-name "cross-account-delivery" \
  --filter-pattern "" \
  --destination-arn "arn:aws:logs:us-east-1:ACCOUNT-B:destination:central-logs"

# Azure Log Analytics workspace export
az monitor diagnostic-settings create \
  --resource /subscriptions/SUB-ID/resourceGroups/RG/providers/Microsoft.Compute/virtualMachines/VM \
  --name "to-central" \
  --workspace-id /subscriptions/SUB-ID/resourceGroups/RG/providers/Microsoft.OperationalInsights/workspaces/central-logs \
  --logs '[{"category": "AuditEvent", "enabled": true}]'
```

## Network Security Across Clouds

### VPC Peering (AWS to AWS)

```bash
# Create peering connection
aws ec2 create-vpc-peering-connection \
  --vpc-id vpc-account-a \
  --peer-vpc-id vpc-account-b \
  --peer-owner-id ACCOUNT-B-ID

# Accept in account B
aws ec2 accept-vpc-peering-connection \
  --vpc-peering-connection-id pcx-0123456789abcdef0

# Add routes
aws ec2 create-route \
  --route-table-id rtb-account-a \
  --destination-cidr-block 10.1.0.0/16 \
  --vpc-peering-connection-id pcx-0123456789abcdef0
```

### VPN Between Clouds

```bash
# AWS side - create customer gateway
aws ec2 create-customer-gateway \
  --type ipsec.1 \
  --public-ip 203.0.113.1 \
  --bgp-asn 65000

# Create VPN connection
aws ec2 create-vpn-connection \
  --type ipsec.1 \
  --customer-gateway-id cgw-0123456789abcdef0 \
  --vpn-gateway-id vgw-0123456789abcdef0

# Download the configuration for your on-prem or other cloud
aws ec2 describe-vpn-connections \
  --vpn-connection-ids vpn-0123456789abcdef0 \
  --query "VpnConnections[].CustomerGatewayConfiguration"
```

## Security Policy as Code

Use the same tool across clouds.

```hcl
# Terraform - consistent IAM across AWS and GCP
resource "aws_iam_policy" "data_access" {
  name        = "data-access-policy"
  description = "Data access policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject"
      ]
      Resource = "arn:aws:s3:::data-bucket/*"
    }]
  })
}

resource "google_project_iam_member" "data_access" {
  project = "my-gcp-project"
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:data-service@my-gcp-project.iam.gserviceaccount.com"
}
```

## Cost and Security Visibility

```bash
# AWS Cost Explorer - track security spending
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter '{
    "Dimensions": {
      "Key": "SERVICE",
      "Values": ["AWS Identity and Access Management", "Amazon CloudWatch", "AWS CloudTrail"]
    }
  }'
```

## Lab Task — Multi-Cloud Security Architecture

1. **Cross-Account Access** — Set up a single sign-on identity that can access two AWS accounts:
   - Account A: Development
   - Account B: Production
   - Dev role can read from prod but not write
   - Create the IAM roles and trust policies

2. **Unified Logging** — Configure CloudTrail in both accounts to send logs to a central S3 bucket in Account B. Verify logs from both accounts appear.

3. **Network Connectivity** — If two accounts are available:
   - Set up VPC peering between them
   - Configure security groups to allow traffic only on specific ports
   - Test connectivity and verify isolation

4. **Policy as Code** — Write a Terraform configuration (or CloudFormation) that deploys the same security baseline to both accounts:
   - Enable CloudTrail
   - Enable GuardDuty
   - Enforce MFA
   - Block public S3 buckets

**Time:** 60 minutes

**Grading (10 points):**
- 3 points: Cross-account access working with proper restrictions
- 3 points: Centralized logging from both accounts
- 2 points: Network connectivity with proper isolation
- 2 points: Policy as code deploys consistently to both accounts

**Evidence:** IAM role configurations, CloudTrail setup screenshots, VPC peering test results, and Terraform/CloudFormation templates.
