-- Generated from prisma/lab-repair-batch-02.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete Secure Python Development in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Secure Python Development in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Bandit Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "SQLi Fixer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "XSS Preventer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "CSRF Protector", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Path Traversal Fixer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Bandit Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"SQLi Fixer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"XSS Preventer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"CSRF Protector\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Path Traversal Fixer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Secure Python Development';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: bandit -r src/ -f json -o bandit-report.json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Python Development'
)
AND "title" = 'Bandit Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: cursor.execute(''SELECT * FROM users WHERE id = ?'', (user_id,))'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Python Development'
)
AND "title" = 'SQLi Fixer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: from markupsafe import escape; return escape(user_input)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Python Development'
)
AND "title" = 'XSS Preventer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: from flask_wtf.csrf import CSRFProtect; csrf = CSRFProtect(app)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Python Development'
)
AND "title" = 'CSRF Protector';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: os.path.realpath(os.path.join(base_dir, user_path))'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Python Development'
)
AND "title" = 'Path Traversal Fixer';

UPDATE "Lab"
SET
  "description" = 'Complete Secure Node.js Development in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Secure Node.js Development in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "NPM Auditor", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Helmet Installer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Pollution Fixer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "NoSQL Fixer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Rate Limiter", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"NPM Auditor\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Helmet Installer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Pollution Fixer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"NoSQL Fixer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Rate Limiter\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Secure Node.js Development';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: npm audit --json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Node.js Development'
)
AND "title" = 'NPM Auditor';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: app.use(helmet())'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Node.js Development'
)
AND "title" = 'Helmet Installer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Object.create(null) instead of {} for user input handling'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Node.js Development'
)
AND "title" = 'Pollution Fixer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: const sanitized = { $where: { $ne: null } }'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Node.js Development'
)
AND "title" = 'NoSQL Fixer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: const rateLimit = require(''express-rate-limit''); app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }))'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Secure Node.js Development'
)
AND "title" = 'Rate Limiter';

UPDATE "Lab"
SET
  "description" = 'Complete OWASP Top 10 Prevention Workshop in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete OWASP Top 10 Prevention Workshop in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Injection Fixer", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Auth Fixer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "XSS Preventer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Access Controller", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "SSRF Preventer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Injection Fixer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Auth Fixer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"XSS Preventer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Access Controller\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"SSRF Preventer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'OWASP Top 10 Prevention Workshop';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Use parameterized queries: db.query(''SELECT * FROM users WHERE id = $1'', [id])'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Top 10 Prevention Workshop'
)
AND "title" = 'Injection Fixer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Implement account lockout after 5 failed attempts and require MFA'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Top 10 Prevention Workshop'
)
AND "title" = 'Auth Fixer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Content-Security-Policy: default-src ''self''; script-src ''self'''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Top 10 Prevention Workshop'
)
AND "title" = 'XSS Preventer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: if (!user.hasPermission(''resource:read'')) { return 403; }'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Top 10 Prevention Workshop'
)
AND "title" = 'Access Controller';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: validateUrl(url) && !isPrivateIP(new URL(url).hostname)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Top 10 Prevention Workshop'
)
AND "title" = 'SSRF Preventer';

UPDATE "Lab"
SET
  "description" = 'Complete API Security Best Practices in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete API Security Best Practices in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "Key Rotator", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "JWT Configurer", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "Rate Limiter", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Schema Validator", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Mass Assignment Fixer", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"Key Rotator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"JWT Configurer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"Rate Limiter\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Schema Validator\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Mass Assignment Fixer\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'API Security Best Practices';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: Generate new key, set 90-day expiry, deprecate old key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Best Practices'
)
AND "title" = 'Key Rotator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: const jwt = require(''jsonwebtoken''); app.use((req, res, next) => { const token = req.headers.authorization?.split('' '')[1]; })'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Best Practices'
)
AND "title" = 'JWT Configurer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: const limiter = rateLimit({ windowMs: 15*60*1000, max: 100, keyGenerator: (req) => req.headers[''x-api-key''] })'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Best Practices'
)
AND "title" = 'Rate Limiter';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: const schema = Joi.object({ name: Joi.string().required().max(50) })'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Best Practices'
)
AND "title" = 'Schema Validator';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: const { name, email } = req.body; // Only destructure allowed fields'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Best Practices'
)
AND "title" = 'Mass Assignment Fixer';

UPDATE "Lab"
SET
  "description" = 'Complete Static Application Security Testing (SAST) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Complete Static Application Security Testing (SAST) in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside `/home/student/lab-work`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
1. Add checkpoint 1, "SonarQube Scanner", to solution.md and build any supporting local artifact needed to explain or validate it.
2. Add checkpoint 2, "Semgrep Runner", to solution.md and build any supporting local artifact needed to explain or validate it.
3. Add checkpoint 3, "CodeQL Analyzer", to solution.md and build any supporting local artifact needed to explain or validate it.
4. Add checkpoint 4, "Custom Rule Writer", to solution.md and build any supporting local artifact needed to explain or validate it.
5. Add checkpoint 5, "Pipeline Integrator", to solution.md and build any supporting local artifact needed to explain or validate it.

Create a `solution.md` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.',
  "tasks" = '["Add checkpoint 1, \"SonarQube Scanner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 2, \"Semgrep Runner\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 3, \"CodeQL Analyzer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 4, \"Custom Rule Writer\", to solution.md and build any supporting local artifact needed to explain or validate it.","Add checkpoint 5, \"Pipeline Integrator\", to solution.md and build any supporting local artifact needed to explain or validate it."]'::jsonb
WHERE "title" = 'Static Application Security Testing (SAST)';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: sonar-scanner -Dsonar.projectKey=myproject -Dsonar.sources=src/ -Dsonar.host.url=http://sonarqube:9000'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Static Application Security Testing (SAST)'
)
AND "title" = 'SonarQube Scanner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: semgrep --config=auto --json src/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Static Application Security Testing (SAST)'
)
AND "title" = 'Semgrep Runner';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: codeql database create --language=javascript --source-root=src/ ql-db'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Static Application Security Testing (SAST)'
)
AND "title" = 'CodeQL Analyzer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: pattern: eval(...) message: Use of eval is a security risk'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Static Application Security Testing (SAST)'
)
AND "title" = 'Custom Rule Writer';

UPDATE "LabFlag"
SET "description" = 'Document the canonical result for this checkpoint in solution.md. Required result: if semgrep --error --config=auto src/; then echo ''SAST passed''; else exit 1; fi'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Static Application Security Testing (SAST)'
)
AND "title" = 'Pipeline Integrator';
