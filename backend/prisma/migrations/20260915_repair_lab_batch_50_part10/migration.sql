-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Practice Cloud Network Security (VPC/Firewall Rules) by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Cloud Network Security (VPC/Firewall Rules) by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for VPC Designer: Create VPC with subnets
2. Document a canonical solution for SG Hardener: Configure restrictive security group
3. Document a canonical solution for NACL Creator: Create network ACL
4. Document a canonical solution for Flow Logger: Enable VPC Flow Logs
5. Document a canonical solution for Peering Connector: Create VPC peering connection

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for VPC Designer: Create VPC with subnets","Document a canonical solution for SG Hardener: Configure restrictive security group","Document a canonical solution for NACL Creator: Create network ACL","Document a canonical solution for Flow Logger: Enable VPC Flow Logs","Document a canonical solution for Peering Connector: Create VPC peering connection"]'::jsonb
WHERE "title" = 'Cloud Network Security (VPC/Firewall Rules)';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create VPC with subnets. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws ec2 create-vpc --cidr-block 10.0.0.0/16'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Network Security (VPC/Firewall Rules)'
)
AND "title" = 'VPC Designer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure restrictive security group. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 443'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Network Security (VPC/Firewall Rules)'
)
AND "title" = 'SG Hardener';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create network ACL. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws ec2 create-network-acl --vpc-id vpc-xxx'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Network Security (VPC/Firewall Rules)'
)
AND "title" = 'NACL Creator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable VPC Flow Logs. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws ec2 create-flow-logs --resource-type VPC --resource-ids vpc-xxx --traffic-type ALL'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Network Security (VPC/Firewall Rules)'
)
AND "title" = 'Flow Logger';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create VPC peering connection. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws ec2 create-vpc-peering-connection --vpc-id vpc-xxx --peer-vpc-id vpc-yyy'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Network Security (VPC/Firewall Rules)'
)
AND "title" = 'Peering Connector';

UPDATE "Lab"
SET
  "description" = 'Practice Multi-Cloud Identity Federation by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Multi-Cloud Identity Federation by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for IdP Configurer: Set up SAML identity provider
2. Document a canonical solution for Role Mapper: Map Azure AD group to IAM role
3. Document a canonical solution for Workload Identity: Configure GCP Workload Identity
4. Document a canonical solution for MFA Enforcer: Enforce MFA for federation
5. Document a canonical solution for SSO Tester: Test federated SSO login

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for IdP Configurer: Set up SAML identity provider","Document a canonical solution for Role Mapper: Map Azure AD group to IAM role","Document a canonical solution for Workload Identity: Configure GCP Workload Identity","Document a canonical solution for MFA Enforcer: Enforce MFA for federation","Document a canonical solution for SSO Tester: Test federated SSO login"]'::jsonb
WHERE "title" = 'Multi-Cloud Identity Federation';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Set up SAML identity provider. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws iam create-saml-provider --name MyIdP --saml-metadata-document file://metadata.xml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Cloud Identity Federation'
)
AND "title" = 'IdP Configurer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Map Azure AD group to IAM role. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws iam create-role --role-name FederatedRole --assume-role-policy-document ''{Statement:[{Effect:Allow,Principal:{Federated:arn:aws:iam::ACCOUNT:saml-provider/MyIdP},Action:sts:AssumeRoleWithSAML}]}'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Cloud Identity Federation'
)
AND "title" = 'Role Mapper';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure GCP Workload Identity. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: gcloud iam workload-identity-pools create my-pool --location global'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Cloud Identity Federation'
)
AND "title" = 'Workload Identity';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enforce MFA for federation. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws iam put-user-policy --user-name federated-user --policy-name RequireMFA'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Cloud Identity Federation'
)
AND "title" = 'MFA Enforcer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Test federated SSO login. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws sts assume-role-with-saml --role-arn arn:aws:iam::ACCOUNT:role/FederatedRole'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Cloud Identity Federation'
)
AND "title" = 'SSO Tester';

UPDATE "Lab"
SET
  "description" = 'Practice Git Repository Security & Secret Scanning by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Git Repository Security & Secret Scanning by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for TruffleHog Scanner: Scan repo for secrets
2. Document a canonical solution for GitLeaks Runner: Detect hardcoded secrets
3. Document a canonical solution for Pre-commit Installer: Install git-secrets hook
4. Document a canonical solution for History Cleaner: Remove secrets from history
5. Document a canonical solution for Branch Protector: Enable branch protection rules

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for TruffleHog Scanner: Scan repo for secrets","Document a canonical solution for GitLeaks Runner: Detect hardcoded secrets","Document a canonical solution for Pre-commit Installer: Install git-secrets hook","Document a canonical solution for History Cleaner: Remove secrets from history","Document a canonical solution for Branch Protector: Enable branch protection rules"]'::jsonb
WHERE "title" = 'Git Repository Security & Secret Scanning';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan repo for secrets. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: trufflehog git file://./repo --only-verified'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Git Repository Security & Secret Scanning'
)
AND "title" = 'TruffleHog Scanner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Detect hardcoded secrets. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: gitleaks detect --source . --verbose'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Git Repository Security & Secret Scanning'
)
AND "title" = 'GitLeaks Runner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Install git-secrets hook. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: git secrets --install && git secrets --register-aws'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Git Repository Security & Secret Scanning'
)
AND "title" = 'Pre-commit Installer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Remove secrets from history. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: bfg --replace-text passwords.txt repo.git'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Git Repository Security & Secret Scanning'
)
AND "title" = 'History Cleaner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable branch protection rules. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: gh api repos/OWNER/REPO/branches/main/protection -X PUT'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Git Repository Security & Secret Scanning'
)
AND "title" = 'Branch Protector';

UPDATE "Lab"
SET
  "description" = 'Practice CI/CD Pipeline Security by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice CI/CD Pipeline Security by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Workflow Auditor: Audit Actions for injection
2. Document a canonical solution for SHA Pinner: Pin actions to SHA
3. Document a canonical solution for OIDC Configurer: Configure OIDC for cloud deploy
4. Document a canonical solution for Image Scanner: Scan container in CI
5. Document a canonical solution for Attestation Creator: Create SLSA attestation

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Workflow Auditor: Audit Actions for injection","Document a canonical solution for SHA Pinner: Pin actions to SHA","Document a canonical solution for OIDC Configurer: Configure OIDC for cloud deploy","Document a canonical solution for Image Scanner: Scan container in CI","Document a canonical solution for Attestation Creator: Create SLSA attestation"]'::jsonb
WHERE "title" = 'CI/CD Pipeline Security';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Audit Actions for injection. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: grep -r ''${{'' .github/workflows/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'CI/CD Pipeline Security'
)
AND "title" = 'Workflow Auditor';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Pin actions to SHA. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'CI/CD Pipeline Security'
)
AND "title" = 'SHA Pinner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure OIDC for cloud deploy. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: permissions: id-token: write'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'CI/CD Pipeline Security'
)
AND "title" = 'OIDC Configurer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan container in CI. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'CI/CD Pipeline Security'
)
AND "title" = 'Image Scanner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create SLSA attestation. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: slsa-github-generator provenance --subject myapp:latest'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'CI/CD Pipeline Security'
)
AND "title" = 'Attestation Creator';

UPDATE "Lab"
SET
  "description" = 'Practice Infrastructure as Code Security Scanning by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Infrastructure as Code Security Scanning by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for CFN Nag Runner: Scan CloudFormation with cfn-nag
2. Document a canonical solution for TFSec Scanner: Scan Terraform with tfsec
3. Document a canonical solution for Ansible Linter: Lint Ansible playbooks
4. Document a canonical solution for Custom Policy Writer: Create checkov custom policy
5. Document a canonical solution for Compliance Reporter: Generate compliance report

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for CFN Nag Runner: Scan CloudFormation with cfn-nag","Document a canonical solution for TFSec Scanner: Scan Terraform with tfsec","Document a canonical solution for Ansible Linter: Lint Ansible playbooks","Document a canonical solution for Custom Policy Writer: Create checkov custom policy","Document a canonical solution for Compliance Reporter: Generate compliance report"]'::jsonb
WHERE "title" = 'Infrastructure as Code Security Scanning';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan CloudFormation with cfn-nag. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: cfn_nag_scan --input-path templates/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Infrastructure as Code Security Scanning'
)
AND "title" = 'CFN Nag Runner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan Terraform with tfsec. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tfsec terraform/ --format json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Infrastructure as Code Security Scanning'
)
AND "title" = 'TFSec Scanner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Lint Ansible playbooks. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ansible-lint playbooks/ --strict'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Infrastructure as Code Security Scanning'
)
AND "title" = 'Ansible Linter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create checkov custom policy. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: checkov -d . --custom-check-file custom_policy.py'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Infrastructure as Code Security Scanning'
)
AND "title" = 'Custom Policy Writer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Generate compliance report. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tfsec terraform/ --format json --out report.json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Infrastructure as Code Security Scanning'
)
AND "title" = 'Compliance Reporter';
