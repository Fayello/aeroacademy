-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Complete advanced OWASP Juice Shop challenges involving cryptographic attacks and business logic.',
  "dockerImage" = 'bkimminich/juice-shop',
  "briefing" = '### Mission Objective
Solve advanced security challenges including JWT manipulation, cryptographic weaknesses, and business logic flaws.

### Environment
- Juice Shop application with all challenges enabled
- Burp Suite or equivalent interception proxy
- Credentials: admin@juice-sh.op / admin123

### Tasks
1. Perform JWT key cracking using available wordlists
2. Exploit a cryptographic weakness in the password hashing
3. Bypass paywall by manipulating the payment transaction
4. Perform a supply chain attack through a poisoned dependency
5. Find and exploit a vulnerability in the two-factor authentication
6. Chain multiple low-severity vulnerabilities for high impact
7. Abuse a CI/CD pipeline vulnerability through the application
8. Document the complete attack chain for each advanced challenge

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Perform JWT key cracking using available wordlists","Exploit a cryptographic weakness in the password hashing","Bypass paywall by manipulating the payment transaction","Perform a supply chain attack through a poisoned dependency","Find and exploit a vulnerability in the two-factor authentication","Chain multiple low-severity vulnerabilities for high impact","Abuse a CI/CD pipeline vulnerability through the application","Document the complete attack chain for each advanced challenge"]'::jsonb
WHERE "title" = 'Juice Shop: Advanced Challenges';

UPDATE "LabFlag"
SET "description" = 'Crack JWT secret key'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Juice Shop: Advanced Challenges'
)
AND "title" = 'JWT Cracker';

UPDATE "LabFlag"
SET "description" = 'Bypass payment with negative amount'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Juice Shop: Advanced Challenges'
)
AND "title" = 'Paywall Bypasser';

UPDATE "LabFlag"
SET "description" = 'Bypass 2FA verification'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Juice Shop: Advanced Challenges'
)
AND "title" = '2FA Bypasser';

UPDATE "LabFlag"
SET "description" = 'Chain 3+ vulnerabilities'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Juice Shop: Advanced Challenges'
)
AND "title" = 'Chain Master';

UPDATE "LabFlag"
SET "description" = 'Identify poisoned dependency'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Juice Shop: Advanced Challenges'
)
AND "title" = 'Dep Poisoner';

UPDATE "Lab"
SET
  "description" = 'Exploit security vulnerabilities specific to Node.js applications using NodeGoat.',
  "dockerImage" = '1njected/nodegoat',
  "briefing" = '### Mission Objective
Identify and exploit OWASP Top 10 vulnerabilities in a Node.js/MongoDB application environment.

### Environment
- NodeGoat application with MongoDB backend
- Browser for web-based testing
- Credentials: user / user123

### Tasks
1. Exploit NoSQL injection in the login form
2. Perform prototype pollution to modify application behavior
3. Chain stored XSS with session hijacking in the dashboard
4. Exploit insecure direct object reference in the profile API
5. Perform command injection through the backup utility
6. Abuse weak session generation for session fixation
7. Exploit MongoDB operator injection to bypass authentication
8. Remediate vulnerabilities using secure coding practices

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Exploit NoSQL injection in the login form","Perform prototype pollution to modify application behavior","Chain stored XSS with session hijacking in the dashboard","Exploit insecure direct object reference in the profile API","Perform command injection through the backup utility","Abuse weak session generation for session fixation","Exploit MongoDB operator injection to bypass authentication","Remediate vulnerabilities using secure coding practices"]'::jsonb
WHERE "title" = 'NodeGoat: Node.js Security Vulnerabilities';

UPDATE "LabFlag"
SET "description" = 'NoSQL injection in login'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NodeGoat: Node.js Security Vulnerabilities'
)
AND "title" = 'NoSQL Injector';

UPDATE "LabFlag"
SET "description" = 'Prototype pollution attack'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NodeGoat: Node.js Security Vulnerabilities'
)
AND "title" = 'Proto Polluter';

UPDATE "LabFlag"
SET "description" = 'XSS session hijacking'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NodeGoat: Node.js Security Vulnerabilities'
)
AND "title" = 'XSS Hijacker';

UPDATE "LabFlag"
SET "description" = 'Access other user profiles'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NodeGoat: Node.js Security Vulnerabilities'
)
AND "title" = 'IDOR Abuser';

UPDATE "LabFlag"
SET "description" = 'Command injection via backup'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NodeGoat: Node.js Security Vulnerabilities'
)
AND "title" = 'Cmd Injector';

UPDATE "Lab"
SET
  "description" = 'Perform penetration testing on intentionally vulnerable REST APIs using VAPI.',
  "dockerImage" = 'roottusk/vapi',
  "briefing" = '### Mission Objective
Test a vulnerable API for OWASP API Security Top 10 vulnerabilities including broken auth and excessive data exposure.

### Environment
- VAPI (Vulnerable API) running on port 3000
- Postman, curl, or Burp Suite for testing
- Credentials: admin / admin123

### Tasks
1. Enumerate API endpoints through documentation endpoints
2. Exploit broken authentication to access other accounts
3. Perform mass assignment to escalate privileges
4. Exploit BOLA/IDOR to access unauthorized resources
5. Test for excessive data exposure in API responses
6. Bypass rate limiting using API versioning endpoints
7. Exploit function level access control bypass
8. Document all vulnerabilities following OWASP API Top 10

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Enumerate API endpoints through documentation endpoints","Exploit broken authentication to access other accounts","Perform mass assignment to escalate privileges","Exploit BOLA/IDOR to access unauthorized resources","Test for excessive data exposure in API responses","Bypass rate limiting using API versioning endpoints","Exploit function level access control bypass","Document all vulnerabilities following OWASP API Top 10"]'::jsonb
WHERE "title" = 'VAPI: Vulnerable API Penetration Testing';

UPDATE "LabFlag"
SET "description" = 'Discover all API endpoints'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VAPI: Vulnerable API Penetration Testing'
)
AND "title" = 'API Enumeratior';

UPDATE "LabFlag"
SET "description" = 'Bypass authentication'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VAPI: Vulnerable API Penetration Testing'
)
AND "title" = 'Auth Bypasser';

UPDATE "LabFlag"
SET "description" = 'Escalate via mass assignment'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VAPI: Vulnerable API Penetration Testing'
)
AND "title" = 'Mass Assigner';

UPDATE "LabFlag"
SET "description" = 'Access unauthorized resources'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VAPI: Vulnerable API Penetration Testing'
)
AND "title" = 'BOLA Finder';

UPDATE "LabFlag"
SET "description" = 'Bypass rate limiting'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VAPI: Vulnerable API Penetration Testing'
)
AND "title" = 'Rate Limiter';

UPDATE "Lab"
SET
  "description" = 'Harden PostgreSQL database instances against common attack vectors.',
  "dockerImage" = 'postgres:15-alpine',
  "briefing" = '### Mission Objective
Secure PostgreSQL by implementing authentication controls, encryption, and access restrictions.

### Environment
- PostgreSQL 15 Alpine container
- pg_hba.conf, postgresql.conf
- Credentials: postgres / pg-harden-2024!

### Tasks
1. Configure pg_hba.conf to restrict authentication methods
2. Enable SSL/TLS for client connections
3. Create roles with least-privilege permissions
4. Set up row-level security policies
5. Enable audit logging for all DDL and DML operations
6. Configure connection limits per user and database
7. Harden shared_buffers and memory settings
8. Test that unauthorized access is properly denied

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Configure pg_hba.conf to restrict authentication methods","Enable SSL/TLS for client connections","Create roles with least-privilege permissions","Set up row-level security policies","Enable audit logging for all DDL and DML operations","Configure connection limits per user and database","Harden shared_buffers and memory settings","Test that unauthorized access is properly denied"]'::jsonb
WHERE "title" = 'PostgreSQL Security Hardening';

UPDATE "LabFlag"
SET "description" = 'Configure pg_hba.conf restrictions'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'PostgreSQL Security Hardening'
)
AND "title" = 'HBA Hardener';

UPDATE "LabFlag"
SET "description" = 'Enable SSL connections'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'PostgreSQL Security Hardening'
)
AND "title" = 'SSL Enabler';

UPDATE "LabFlag"
SET "description" = 'Create restricted role'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'PostgreSQL Security Hardening'
)
AND "title" = 'Role Creator';

UPDATE "LabFlag"
SET "description" = 'Set up row-level security'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'PostgreSQL Security Hardening'
)
AND "title" = 'RLS Policy';

UPDATE "LabFlag"
SET "description" = 'Enable pgAudit logging'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'PostgreSQL Security Hardening'
)
AND "title" = 'Audit Logger';

UPDATE "Lab"
SET
  "description" = 'Practice MySQL Injection & Privilege Escalation by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice MySQL Injection & Privilege Escalation by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for DB Enumerator: Enumerate databases via injection
2. Document a canonical solution for File Reader: Read files with LOAD_FILE
3. Document a canonical solution for Shell Writer: Write webshell via INTO OUTFILE
4. Document a canonical solution for Privilege Escalator: Escalate to DBA privileges
5. Document a canonical solution for Hash Extractor: Extract password hashes

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for DB Enumerator: Enumerate databases via injection","Document a canonical solution for File Reader: Read files with LOAD_FILE","Document a canonical solution for Shell Writer: Write webshell via INTO OUTFILE","Document a canonical solution for Privilege Escalator: Escalate to DBA privileges","Document a canonical solution for Hash Extractor: Extract password hashes"]'::jsonb
WHERE "title" = 'MySQL Injection & Privilege Escalation';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enumerate databases via injection. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: '' UNION SELECT schema_name FROM information_schema.schemata--'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MySQL Injection & Privilege Escalation'
)
AND "title" = 'DB Enumerator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Read files with LOAD_FILE. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: '' UNION SELECT LOAD_FILE(''/etc/passwd'')--'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MySQL Injection & Privilege Escalation'
)
AND "title" = 'File Reader';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Write webshell via INTO OUTFILE. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: '' UNION SELECT ''<php system($_GET[cmd]); ?>'' INTO OUTFILE ''/var/www/html/shell.php''--'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MySQL Injection & Privilege Escalation'
)
AND "title" = 'Shell Writer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Escalate to DBA privileges. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: GRANT ALL PRIVILEGES ON *.* TO ''lowuser''@''%'' WITH GRANT OPTION;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MySQL Injection & Privilege Escalation'
)
AND "title" = 'Privilege Escalator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Extract password hashes. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: '' UNION SELECT user, authentication_string FROM mysql.user--'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MySQL Injection & Privilege Escalation'
)
AND "title" = 'Hash Extractor';
