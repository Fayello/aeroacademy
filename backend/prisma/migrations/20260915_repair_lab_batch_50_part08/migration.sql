-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Secure Elasticsearch clusters with authentication, authorization, and encryption.',
  "dockerImage" = 'elasticsearch:7.17.17',
  "briefing" = '### Mission Objective
Configure Elasticsearch security features including X-Pack, TLS, and role-based access control.

### Environment
- Elasticsearch 7.17 with X-Pack security
- Kibana for management UI
- Credentials: elastic / es-sec-2024!

### Tasks
1. Enable X-Pack security and set up built-in users
2. Configure TLS for inter-node communication (transport layer)
3. Create custom roles with specific index permissions
4. Set up API keys for application-level access
5. Configure audit logging for all cluster events
6. Implement field and document level security
7. Set up SAML/OIDC authentication for Kibana
8. Test that unauthorized access is properly blocked

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Enable X-Pack security and set up built-in users","Configure TLS for inter-node communication (transport layer)","Create custom roles with specific index permissions","Set up API keys for application-level access","Configure audit logging for all cluster events","Implement field and document level security","Set up SAML/OIDC authentication for Kibana","Test that unauthorized access is properly blocked"]'::jsonb
WHERE "title" = 'Elasticsearch Security Configuration';

UPDATE "LabFlag"
SET "description" = 'Enable X-Pack security'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Elasticsearch Security Configuration'
)
AND "title" = 'XPack Enabler';

UPDATE "LabFlag"
SET "description" = 'Create custom role'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Elasticsearch Security Configuration'
)
AND "title" = 'Role Creator';

UPDATE "LabFlag"
SET "description" = 'Create API key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Elasticsearch Security Configuration'
)
AND "title" = 'API Key Generator';

UPDATE "LabFlag"
SET "description" = 'Enable audit logging'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Elasticsearch Security Configuration'
)
AND "title" = 'Audit Logger';

UPDATE "LabFlag"
SET "description" = 'Configure transport TLS'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Elasticsearch Security Configuration'
)
AND "title" = 'TLS Configurator';

UPDATE "Lab"
SET
  "description" = 'Practice AWS IAM Security & Policy Analysis by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice AWS IAM Security & Policy Analysis by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for IAM Enumerator: List all IAM entities
2. Document a canonical solution for Policy Analyzer: Find overly permissive policies
3. Document a canonical solution for Role Assumer: Assume cross-account role
4. Document a canonical solution for PassRole Exploiter: Escalate via iam:PassRole
5. Document a canonical solution for Key Auditor: Find unused access keys

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for IAM Enumerator: List all IAM entities","Document a canonical solution for Policy Analyzer: Find overly permissive policies","Document a canonical solution for Role Assumer: Assume cross-account role","Document a canonical solution for PassRole Exploiter: Escalate via iam:PassRole","Document a canonical solution for Key Auditor: Find unused access keys"]'::jsonb
WHERE "title" = 'AWS IAM Security & Policy Analysis';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: List all IAM entities. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws iam list-users --output table'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'AWS IAM Security & Policy Analysis'
)
AND "title" = 'IAM Enumerator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Find overly permissive policies. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws iam get-policies --query ''Policies[?PolicyName==AdminAccess]'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'AWS IAM Security & Policy Analysis'
)
AND "title" = 'Policy Analyzer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Assume cross-account role. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws sts assume-role --role-arn arn:aws:iam::ACCOUNT:role/CrossAccount --role-session-name exploit'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'AWS IAM Security & Policy Analysis'
)
AND "title" = 'Role Assumer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Escalate via iam:PassRole. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws iam create-access-key --user-name target-user'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'AWS IAM Security & Policy Analysis'
)
AND "title" = 'PassRole Exploiter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Find unused access keys. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aws iam generate-credential-report && aws iam get-credential-report'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'AWS IAM Security & Policy Analysis'
)
AND "title" = 'Key Auditor';

UPDATE "Lab"
SET
  "description" = 'Practice Azure Security Center & Defender by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Azure Security Center & Defender by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Defender Enabler: Enable Microsoft Defender
2. Document a canonical solution for Alert Investigator: Investigate security alert
3. Document a canonical solution for JIT Configurer: Configure JIT VM access
4. Document a canonical solution for Policy Assigner: Assign compliance policy
5. Document a canonical solution for Score Improver: Implement Secure Score recommendation

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Defender Enabler: Enable Microsoft Defender","Document a canonical solution for Alert Investigator: Investigate security alert","Document a canonical solution for JIT Configurer: Configure JIT VM access","Document a canonical solution for Policy Assigner: Assign compliance policy","Document a canonical solution for Score Improver: Implement Secure Score recommendation"]'::jsonb
WHERE "title" = 'Azure Security Center & Defender';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable Microsoft Defender. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: az security pricing create -n Default --tier Standard'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Azure Security Center & Defender'
)
AND "title" = 'Defender Enabler';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Investigate security alert. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: az security alerts list --resource-group myRG'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Azure Security Center & Defender'
)
AND "title" = 'Alert Investigator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure JIT VM access. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: az security sub-task-configuration list --location westus2'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Azure Security Center & Defender'
)
AND "title" = 'JIT Configurer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Assign compliance policy. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: az policy assignment create --policy /providers/Microsoft.Authorization/policyDefinitions/ComputeAuditVMDiskEncryption --name audit-vm-disk'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Azure Security Center & Defender'
)
AND "title" = 'Policy Assigner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Implement Secure Score recommendation. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: az security secure-scores list --query ''value[?percentage<50]'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Azure Security Center & Defender'
)
AND "title" = 'Score Improver';

UPDATE "Lab"
SET
  "description" = 'Practice GCP Security Command Center by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice GCP Security Command Center by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for SCC Enabler: Enable Security Command Center
2. Document a canonical solution for Threat Detector: Configure event threat detection
3. Document a canonical solution for Finding Triage: Review SCC findings
4. Document a canonical solution for Notifier Creator: Create SCC notification config
5. Document a canonical solution for Web Scanner: Run Web Security Scanner

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for SCC Enabler: Enable Security Command Center","Document a canonical solution for Threat Detector: Configure event threat detection","Document a canonical solution for Finding Triage: Review SCC findings","Document a canonical solution for Notifier Creator: Create SCC notification config","Document a canonical solution for Web Scanner: Run Web Security Scanner"]'::jsonb
WHERE "title" = 'GCP Security Command Center';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable Security Command Center. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: gcloud scc settings update organizations/ORG_ID --enable-asset-discovery'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GCP Security Command Center'
)
AND "title" = 'SCC Enabler';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure event threat detection. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: gcloud scc settings update --enable-ctd'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GCP Security Command Center'
)
AND "title" = 'Threat Detector';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Review SCC findings. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: gcloud scc findings list organizations/ORG --filter=''state=OPEN AND severity=HIGH'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GCP Security Command Center'
)
AND "title" = 'Finding Triage';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create SCC notification config. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: gcloud scc notifications create --pubsub-topic projects/PROJECT/topics/scc-alerts'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GCP Security Command Center'
)
AND "title" = 'Notifier Creator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Run Web Security Scanner. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: gcloud app web-scanner scan --urls=https://myapp.appspot.com'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GCP Security Command Center'
)
AND "title" = 'Web Scanner';

UPDATE "Lab"
SET
  "description" = 'Practice Container Image Scanning & Registry Security by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Container Image Scanning & Registry Security by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Trivy Scanner: Scan image for CVEs
2. Document a canonical solution for Image Signer: Sign image with Cosign
3. Document a canonical solution for Sig Verifier: Verify image signature
4. Document a canonical solution for Registry Hardener: Configure registry TLS
5. Document a canonical solution for Policy Enforcer: Block unsigned images in K8s

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Trivy Scanner: Scan image for CVEs","Document a canonical solution for Image Signer: Sign image with Cosign","Document a canonical solution for Sig Verifier: Verify image signature","Document a canonical solution for Registry Hardener: Configure registry TLS","Document a canonical solution for Policy Enforcer: Block unsigned images in K8s"]'::jsonb
WHERE "title" = 'Container Image Scanning & Registry Security';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan image for CVEs. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: trivy image --severity HIGH,CRITICAL nginx:latest'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Image Scanning & Registry Security'
)
AND "title" = 'Trivy Scanner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Sign image with Cosign. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: cosign sign --key cosign.key registry/image:tag'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Image Scanning & Registry Security'
)
AND "title" = 'Image Signer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Verify image signature. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: cosign verify --key cosign.pub registry/image:tag'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Image Scanning & Registry Security'
)
AND "title" = 'Sig Verifier';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure registry TLS. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: docker run -d -p 5000:5000 --name registry -v /certs:/certs registry:2'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Image Scanning & Registry Security'
)
AND "title" = 'Registry Hardener';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Block unsigned images in K8s. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: kubectl apply -f admission-policy.yaml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Image Scanning & Registry Security'
)
AND "title" = 'Policy Enforcer';
