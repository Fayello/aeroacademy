-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Practice Terraform Security & IaC Scanning by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Terraform Security & IaC Scanning by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for TFSec Scanner: Scan Terraform with tfsec
2. Document a canonical solution for Checkov Runner: Scan with Checkov
3. Document a canonical solution for S3 Fixer: Remediate public S3 bucket
4. Document a canonical solution for Sentinel Enforcer: Apply Sentinel policy
5. Document a canonical solution for Drift Detector: Detect infrastructure drift

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for TFSec Scanner: Scan Terraform with tfsec","Document a canonical solution for Checkov Runner: Scan with Checkov","Document a canonical solution for S3 Fixer: Remediate public S3 bucket","Document a canonical solution for Sentinel Enforcer: Apply Sentinel policy","Document a canonical solution for Drift Detector: Detect infrastructure drift"]'::jsonb
WHERE "title" = 'Terraform Security & IaC Scanning';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan Terraform with tfsec. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tfsec --format json .'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Terraform Security & IaC Scanning'
)
AND "title" = 'TFSec Scanner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan with Checkov. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: checkov -d . --framework terraform'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Terraform Security & IaC Scanning'
)
AND "title" = 'Checkov Runner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Remediate public S3 bucket. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: s3_bucket {acl = private}'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Terraform Security & IaC Scanning'
)
AND "title" = 'S3 Fixer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Apply Sentinel policy. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: sentinel apply -canvas policy.sentinel.hcl'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Terraform Security & IaC Scanning'
)
AND "title" = 'Sentinel Enforcer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Detect infrastructure drift. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: terraform plan -detailed-exitcode'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Terraform Security & IaC Scanning'
)
AND "title" = 'Drift Detector';

UPDATE "Lab"
SET
  "description" = 'Practice Kubernetes Security Hardening by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Kubernetes Security Hardening by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for RBAC Auditor: Identify permissive ClusterRoles
2. Document a canonical solution for Network Isolator: Create deny-all NetworkPolicy
3. Document a canonical solution for PSS Enforcer: Apply Pod Security Standards
4. Document a canonical solution for Secrets Encryptor: Enable etcd encryption
5. Document a canonical solution for CIS Benchmarker: Run kube-bench security audit

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for RBAC Auditor: Identify permissive ClusterRoles","Document a canonical solution for Network Isolator: Create deny-all NetworkPolicy","Document a canonical solution for PSS Enforcer: Apply Pod Security Standards","Document a canonical solution for Secrets Encryptor: Enable etcd encryption","Document a canonical solution for CIS Benchmarker: Run kube-bench security audit"]'::jsonb
WHERE "title" = 'Kubernetes Security Hardening';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Identify permissive ClusterRoles. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: kubectl get clusterrolebindings -o json | jq ''.items[] | select(.subjects==null)'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Security Hardening'
)
AND "title" = 'RBAC Auditor';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create deny-all NetworkPolicy. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: kubectl apply -f network-policy-deny-all.yaml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Security Hardening'
)
AND "title" = 'Network Isolator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Apply Pod Security Standards. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: kubectl label namespace default pod-security.kubernetes.io/enforce=restricted'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Security Hardening'
)
AND "title" = 'PSS Enforcer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable etcd encryption. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: EncryptionConfiguration with aescbc provider'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Security Hardening'
)
AND "title" = 'Secrets Encryptor';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Run kube-bench security audit. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: kube-bench run --targets master'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Kubernetes Security Hardening'
)
AND "title" = 'CIS Benchmarker';

UPDATE "Lab"
SET
  "description" = 'Practice Serverless Security Testing by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Serverless Security Testing by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Role Analyzer: Audit Lambda execution role
2. Document a canonical solution for Env Injector: Exploit environment variable injection
3. Document a canonical solution for SSRF Exploiter: SSRF through Lambda
4. Document a canonical solution for Event Poisoner: Inject malicious event payload
5. Document a canonical solution for Layer Auditor: Scan Lambda layers for risks

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Role Analyzer: Audit Lambda execution role","Document a canonical solution for Env Injector: Exploit environment variable injection","Document a canonical solution for SSRF Exploiter: SSRF through Lambda","Document a canonical solution for Event Poisoner: Inject malicious event payload","Document a canonical solution for Layer Auditor: Scan Lambda layers for risks"]'::jsonb
WHERE "title" = 'Serverless Security Testing';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Audit Lambda execution role. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws iam get-role --role-name lambda-execution-role --query ''Role.AssumeRolePolicyDocument'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Serverless Security Testing'
)
AND "title" = 'Role Analyzer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Exploit environment variable injection. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws lambda update-function-configuration --function-name vuln-func --environment Variables={MALICIOUS=true}'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Serverless Security Testing'
)
AND "title" = 'Env Injector';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: SSRF through Lambda. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: curl -X POST https://api.example.com/proxy --data-urlencode ''url=http://169.254.169.254/latest/meta-data/'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Serverless Security Testing'
)
AND "title" = 'SSRF Exploiter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Inject malicious event payload. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: {source: malicious, detail: {command: ''cat /etc/passwd''}}'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Serverless Security Testing'
)
AND "title" = 'Event Poisoner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan Lambda layers for risks. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws lambda get-layer-version-by-arn --arn arn:aws:lambda:REGION:ACCOUNT:layer:my-layer:1'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Serverless Security Testing'
)
AND "title" = 'Layer Auditor';

UPDATE "Lab"
SET
  "description" = 'Practice Cloud Storage Security Audit by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Cloud Storage Security Audit by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Bucket Lister: List all S3 buckets
2. Document a canonical solution for Public Checker: Check public access settings
3. Document a canonical solution for Policy Analyzer: Analyze bucket policy
4. Document a canonical solution for Encryptor: Enable default encryption
5. Document a canonical solution for Macie Scanner: Scan for sensitive data

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Bucket Lister: List all S3 buckets","Document a canonical solution for Public Checker: Check public access settings","Document a canonical solution for Policy Analyzer: Analyze bucket policy","Document a canonical solution for Encryptor: Enable default encryption","Document a canonical solution for Macie Scanner: Scan for sensitive data"]'::jsonb
WHERE "title" = 'Cloud Storage Security Audit';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: List all S3 buckets. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws s3api list-buckets --query ''Buckets[].Name'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Storage Security Audit'
)
AND "title" = 'Bucket Lister';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Check public access settings. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws s3api get-public-access-block --bucket target-bucket'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Storage Security Audit'
)
AND "title" = 'Public Checker';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Analyze bucket policy. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws s3api get-bucket-policy --bucket target-bucket --output text | jq ''.Policy'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Storage Security Audit'
)
AND "title" = 'Policy Analyzer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable default encryption. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws s3api put-bucket-encryption --bucket target-bucket --server-side-encryption-configuration ''{Rules:[{ApplyServerSideEncryptionByDefault:{SSEAlgorithm:aws:kms}}]}'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Storage Security Audit'
)
AND "title" = 'Encryptor';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan for sensitive data. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws macie2 create-classification-job --job-type ONE_TIME'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cloud Storage Security Audit'
)
AND "title" = 'Macie Scanner';

UPDATE "Lab"
SET
  "description" = 'Practice Secrets Management with HashiCorp Vault by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Secrets Management with HashiCorp Vault by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Vault Initializer: Initialize Vault server
2. Document a canonical solution for Policy Creator: Create access policy
3. Document a canonical solution for Dynamic Secrets: Enable database secrets engine
4. Document a canonical solution for Transit Encryptor: Encrypt data with transit engine
5. Document a canonical solution for AppRole Configurer: Configure AppRole auth

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Vault Initializer: Initialize Vault server","Document a canonical solution for Policy Creator: Create access policy","Document a canonical solution for Dynamic Secrets: Enable database secrets engine","Document a canonical solution for Transit Encryptor: Encrypt data with transit engine","Document a canonical solution for AppRole Configurer: Configure AppRole auth"]'::jsonb
WHERE "title" = 'Secrets Management with HashiCorp Vault';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Initialize Vault server. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: vault operator init -key-shares=1 -key-threshold=1'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Management with HashiCorp Vault'
)
AND "title" = 'Vault Initializer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create access policy. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: vault policy write app-read'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Management with HashiCorp Vault'
)
AND "title" = 'Policy Creator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable database secrets engine. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: vault secrets enable database'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Management with HashiCorp Vault'
)
AND "title" = 'Dynamic Secrets';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Encrypt data with transit engine. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: vault write transit/encrypt/my-key plaintext=$(echo -n ''secret'' | base64)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Management with HashiCorp Vault'
)
AND "title" = 'Transit Encryptor';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure AppRole auth. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: vault auth enable approle && vault write auth/approle/role/my-role token_policies=app-read'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Management with HashiCorp Vault'
)
AND "title" = 'AppRole Configurer';
