-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete Container Runtime Security with Falco in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Container Runtime Security with Falco in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Falco Installer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Rule Writer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Breakout Detector", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Network Monitor", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Alert Integrator", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Falco Installer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Rule Writer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Breakout Detector\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Network Monitor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Alert Integrator\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Container Runtime Security with Falco';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: curl -fsSL https://falco.org/repo/falco.key | gpg --dearmor'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Runtime Security with Falco'
)
AND "title" = 'Falco Installer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: - rule: Detect Crypto Mining condition: spawned_process and proc.name in (xmrig, minerd)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Runtime Security with Falco'
)
AND "title" = 'Rule Writer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: - rule: Container Escape Attempt condition: evt.type=clone and evt.arg.flags contains CLONE_NEWUSER'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Runtime Security with Falco'
)
AND "title" = 'Breakout Detector';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: - rule: Unexpected Outbound Connection condition: outbound and not proc.name in (allowed_bins)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Runtime Security with Falco'
)
AND "title" = 'Network Monitor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: falcosidekick --slack.webhookurl https://hooks.slack.com/xxx'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Container Runtime Security with Falco'
)
AND "title" = 'Alert Integrator';

UPDATE "Lab"
SET
  "description" = 'Complete Artifact Signing & SBOM Generation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Artifact Signing & SBOM Generation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Key Generator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Image Signer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "SBOM Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Vuln Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Keyless Signer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Key Generator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Image Signer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"SBOM Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Vuln Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Keyless Signer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Artifact Signing & SBOM Generation';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: cosign generate-key-pair'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Artifact Signing & SBOM Generation'
)
AND "title" = 'Key Generator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: cosign sign --key cosign.key registry/image:tag'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Artifact Signing & SBOM Generation'
)
AND "title" = 'Image Signer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: syft packages docker:myimage:latest -o spdx-json > sbom.json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Artifact Signing & SBOM Generation'
)
AND "title" = 'SBOM Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: grype sbom:./sbom.json --fail-on high'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Artifact Signing & SBOM Generation'
)
AND "title" = 'Vuln Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: cosign sign --yes registry/image:tag'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Artifact Signing & SBOM Generation'
)
AND "title" = 'Keyless Signer';

UPDATE "Lab"
SET
  "description" = 'Complete Secrets Rotation & Credential Management in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Secrets Rotation & Credential Management in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "DB Rotator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Key Rotator", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Dynamic Creds", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Cert Renewer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Rotation Scheduler", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"DB Rotator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Key Rotator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Dynamic Creds\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Cert Renewer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Rotation Scheduler\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Secrets Rotation & Credential Management';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: ALTER USER app_user WITH PASSWORD ''new-secure-password'';'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Rotation & Credential Management'
)
AND "title" = 'DB Rotator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: aws iam create-access-key --user-name app-user && aws iam delete-access-key --user-name app-user --access-key-id OLD_KEY'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Rotation & Credential Management'
)
AND "title" = 'Key Rotator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: vault read database/creds/readonly-role'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Rotation & Credential Management'
)
AND "title" = 'Dynamic Creds';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: kubectl annotate certificate mycert cert-manager.io/renew-before=720h'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Rotation & Credential Management'
)
AND "title" = 'Cert Renewer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: echo ''0 0 1 * * /scripts/rotate-creds.sh'' | crontab -'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secrets Rotation & Credential Management'
)
AND "title" = 'Rotation Scheduler';

UPDATE "Lab"
SET
  "description" = 'Complete GitOps Security with ArgoCD in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete GitOps Security with ArgoCD in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "RBAC Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "SSO Integrator", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Sync Window Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Hook Validator", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Sig Verifier", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"RBAC Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"SSO Integrator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Sync Window Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Hook Validator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Sig Verifier\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'GitOps Security with ArgoCD';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: data.csv: p, role:developer, applications, get, myproject/*, allow'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GitOps Security with ArgoCD'
)
AND "title" = 'RBAC Configurer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: argocd account update-password --account admin'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GitOps Security with ArgoCD'
)
AND "title" = 'SSO Integrator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: argocd appset windows create --schedule ''0 2 * * *'' --duration 4h --kind allow'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GitOps Security with ArgoCD'
)
AND "title" = 'Sync Window Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: argocd app add-hook myapp pre-sync --kind Job --exec-container validator'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GitOps Security with ArgoCD'
)
AND "title" = 'Hook Validator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: argocd repo add --gpg-key-pattern ''*.gpg'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'GitOps Security with ArgoCD'
)
AND "title" = 'Sig Verifier';

UPDATE "Lab"
SET
  "description" = 'Complete Supply Chain Security (SLSA & In-Toto) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Supply Chain Security (SLSA & In-Toto) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Layout Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Provenance Generator", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Verifier", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "SLSA Verifier", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Link Creator", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Layout Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Provenance Generator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Verifier\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"SLSA Verifier\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Link Creator\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Supply Chain Security (SLSA & In-Toto)';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: in-toto-run --step-name build -- SLSA-provenance-gen'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Supply Chain Security (SLSA & In-Toto)'
)
AND "title" = 'Layout Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: slsa-github-generator provenance --subject myimage:latest'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Supply Chain Security (SLSA & In-Toto)'
)
AND "title" = 'Provenance Generator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: in-toto-verify --layout layout.root.layout --layout-key key.pub'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Supply Chain Security (SLSA & In-Toto)'
)
AND "title" = 'Verifier';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: slsa-verifier verify-image myimage:latest --provenance-path provenance.json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Supply Chain Security (SLSA & In-Toto)'
)
AND "title" = 'SLSA Verifier';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: in-toto-run --step-name test -- pytest tests/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Supply Chain Security (SLSA & In-Toto)'
)
AND "title" = 'Link Creator';
