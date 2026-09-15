-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete Dynamic Application Security Testing (DAST) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Dynamic Application Security Testing (DAST) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "ZAP Baseline", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Nikto Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Nuclei Runner", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Custom ZAP Script", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "False Positive Tuner", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"ZAP Baseline\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Nikto Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Nuclei Runner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Custom ZAP Script\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"False Positive Tuner\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Dynamic Application Security Testing (DAST)';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: zap-full-scan.py -t https://target.example.com -r report.html'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Dynamic Application Security Testing (DAST)'
)
AND "title" = 'ZAP Baseline';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: nikto -h https://target.example.com -o nikto-report.txt'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Dynamic Application Security Testing (DAST)'
)
AND "title" = 'Nikto Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: nuclei -u https://target.example.com -t nuclei-templates/ -json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Dynamic Application Security Testing (DAST)'
)
AND "title" = 'Nuclei Runner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: org.zapv2.model.HttpMessage msg = new HttpMessage(); msg.setRequestHeader(''GET /api/v1/users HTTP/1.1'');'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Dynamic Application Security Testing (DAST)'
)
AND "title" = 'Custom ZAP Script';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Exclude /static/ paths, set context for authenticated areas'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Dynamic Application Security Testing (DAST)'
)
AND "title" = 'False Positive Tuner';

UPDATE "Lab"
SET
  "description" = 'Complete Software Composition Analysis (SCA) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Software Composition Analysis (SCA) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Snyk Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "DepCheck Runner", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "OSV Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "License Checker", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "SBOM Creator", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Snyk Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"DepCheck Runner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"OSV Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"License Checker\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"SBOM Creator\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Software Composition Analysis (SCA)';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: snyk test --all-projects --severity-threshold=high'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Software Composition Analysis (SCA)'
)
AND "title" = 'Snyk Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: dependency-check --project MyProject --scan ./src --out .'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Software Composition Analysis (SCA)'
)
AND "title" = 'DepCheck Runner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: osv-scanner --lockfile package-lock.json --json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Software Composition Analysis (SCA)'
)
AND "title" = 'OSV Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: license-checker --production --csv --out licenses.csv'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Software Composition Analysis (SCA)'
)
AND "title" = 'License Checker';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: syft packages . -o spdx-json > dependency-sbom.json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Software Composition Analysis (SCA)'
)
AND "title" = 'SBOM Creator';

UPDATE "Lab"
SET
  "description" = 'Complete Secure CI/CD with GitHub Actions in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Secure CI/CD with GitHub Actions in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Injection Auditor", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "SHA Pinner", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "OIDC Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Secret Scouter", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Dependabot Enabler", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Injection Auditor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"SHA Pinner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"OIDC Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Secret Scouter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Dependabot Enabler\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Secure CI/CD with GitHub Actions';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: grep -r ''${{'' .github/workflows/ | grep -v ''github.event'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure CI/CD with GitHub Actions'
)
AND "title" = 'Injection Auditor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure CI/CD with GitHub Actions'
)
AND "title" = 'SHA Pinner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: permissions: id-token: write contents: read'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure CI/CD with GitHub Actions'
)
AND "title" = 'OIDC Configurer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: gh api repos/{owner}/{repo}/vulnerability-alerts -X PUT'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure CI/CD with GitHub Actions'
)
AND "title" = 'Secret Scouter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: version: 2 updates: - package-ecosystem: npm schedule: interval: daily'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure CI/CD with GitHub Actions'
)
AND "title" = 'Dependabot Enabler';

UPDATE "Lab"
SET
  "description" = 'Complete Threat Modeling for Development Teams in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Threat Modeling for Development Teams in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "DFD Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "STRIDE Applicator", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Attack Tree Builder", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Trust Boundary Mapper", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Mitigation Designer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"DFD Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"STRIDE Applicator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Attack Tree Builder\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Trust Boundary Mapper\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Mitigation Designer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Threat Modeling for Development Teams';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Map: User -> Web Server -> Database -> External API with trust boundaries'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Threat Modeling for Development Teams'
)
AND "title" = 'DFD Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: For each component: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Threat Modeling for Development Teams'
)
AND "title" = 'STRIDE Applicator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Goal: Steal user data -> Method 1: SQL injection -> Method 2: Session hijacking'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Threat Modeling for Development Teams'
)
AND "title" = 'Attack Tree Builder';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Identify: Client/Server boundary, Server/DB boundary, Internal/External boundary'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Threat Modeling for Development Teams'
)
AND "title" = 'Trust Boundary Mapper';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: For XSS: Implement CSP headers + output encoding + input validation'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Threat Modeling for Development Teams'
)
AND "title" = 'Mitigation Designer';

UPDATE "Lab"
SET
  "description" = 'Complete Memory Safety & Buffer Overflow Exploitation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Memory Safety & Buffer Overflow Exploitation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Buffer Overflower", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "ASLR Bypasser", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Format String Attacker", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "ROP Chain Builder", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Canary Protector", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Buffer Overflower\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"ASLR Bypasser\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Format String Attacker\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"ROP Chain Builder\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Canary Protector\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Memory Safety & Buffer Overflow Exploitation';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: python -c ''print A*264 + \x40\x11\x40'' | ./vulnerable'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Memory Safety & Buffer Overflow Exploitation'
)
AND "title" = 'Buffer Overflower';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Leak libc base address via format string, calculate system() address'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Memory Safety & Buffer Overflow Exploitation'
)
AND "title" = 'ASLR Bypasser';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: printf ''%08x.%08x.%08x.%08x.%08x'' to leak stack values'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Memory Safety & Buffer Overflow Exploitation'
)
AND "title" = 'Format String Attacker';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Chain pop rdi; ret gadget -> bin/sh address -> system()'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Memory Safety & Buffer Overflow Exploitation'
)
AND "title" = 'ROP Chain Builder';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: gcc -fstack-protector-all -o protected vulnerable.c'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Memory Safety & Buffer Overflow Exploitation'
)
AND "title" = 'Canary Protector';
