-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Identify and exploit NoSQL injection vulnerabilities in MongoDB-backed applications.',
  "dockerImage" = 'mongo:4.4',
  "briefing" = '### Mission Objective
Exploit MongoDB operator injection, field injection, and prototype pollution in NoSQL applications.

### Environment
- MongoDB 4.4 with a vulnerable Node.js application
- mongo shell for direct queries
- Credentials: admin / mongo-inj-2024!

### Tasks
1. Perform MongoDB operator injection ($gt, $ne, $regex) to bypass authentication
2. Exploit field injection to modify query conditions
3. Use $where operator injection for JavaScript execution
4. Extract data through regex-based blind NoSQL injection
5. Chain prototype pollution with NoSQL injection
6. Exploit aggregation pipeline injection
7. Test for MongoDB authentication bypass vulnerabilities
8. Implement parameterized queries to prevent NoSQL injection

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Perform MongoDB operator injection ($gt, $ne, $regex) to bypass authentication","Exploit field injection to modify query conditions","Use $where operator injection for JavaScript execution","Extract data through regex-based blind NoSQL injection","Chain prototype pollution with NoSQL injection","Exploit aggregation pipeline injection","Test for MongoDB authentication bypass vulnerabilities","Implement parameterized queries to prevent NoSQL injection"]'::jsonb
WHERE "title" = 'MongoDB NoSQL Injection & Security';

UPDATE "LabFlag"
SET "description" = 'Bypass auth with $gt operator'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MongoDB NoSQL Injection & Security'
)
AND "title" = 'Operator Injector';

UPDATE "LabFlag"
SET "description" = 'Blind injection with regex'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MongoDB NoSQL Injection & Security'
)
AND "title" = 'Regex Extractor';

UPDATE "LabFlag"
SET "description" = 'JavaScript injection via $where'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MongoDB NoSQL Injection & Security'
)
AND "title" = 'Where Injector';

UPDATE "LabFlag"
SET "description" = 'Inject additional query fields'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MongoDB NoSQL Injection & Security'
)
AND "title" = 'Field Modifier';

UPDATE "LabFlag"
SET "description" = 'Aggregation pipeline injection'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'MongoDB NoSQL Injection & Security'
)
AND "title" = 'Pipeline Injector';

UPDATE "Lab"
SET
  "description" = 'Exploit misconfigured Redis instances and implement security hardening.',
  "dockerImage" = 'redis:7-alpine',
  "briefing" = '### Mission Objective
Exploit Redis commands for unauthorized access, data extraction, and remote code execution.

### Environment
- Redis 7 Alpine container
- redis-cli for testing
- Credentials: redis / redis-exploit-2024!

### Tasks
1. Connect to Redis without authentication and enumerate keys
2. Exploit Redis to write SSH keys to authorized_keys
3. Use Redis CONFIG SET to write a webshell to disk
4. Extract sensitive data from Redis databases
5. Exploit Lua scripting engine for command execution
6. Configure Redis authentication with requirepass
7. Set up Redis ACLs for least-privilege access
8. Enable TLS for Redis client connections

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Connect to Redis without authentication and enumerate keys","Exploit Redis to write SSH keys to authorized_keys","Use Redis CONFIG SET to write a webshell to disk","Extract sensitive data from Redis databases","Exploit Lua scripting engine for command execution","Configure Redis authentication with requirepass","Set up Redis ACLs for least-privilege access","Enable TLS for Redis client connections"]'::jsonb
WHERE "title" = 'Redis Exploitation & Hardening';

UPDATE "LabFlag"
SET "description" = 'Enumerate all Redis keys'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Redis Exploitation & Hardening'
)
AND "title" = 'Key Enumerator';

UPDATE "LabFlag"
SET "description" = 'Write SSH key via Redis'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Redis Exploitation & Hardening'
)
AND "title" = 'SSH Writer';

UPDATE "LabFlag"
SET "description" = 'Write webshell via Redis'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Redis Exploitation & Hardening'
)
AND "title" = 'Shell Dropper';

UPDATE "LabFlag"
SET "description" = 'Extract sensitive Redis data'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Redis Exploitation & Hardening'
)
AND "title" = 'Data Extractor';

UPDATE "LabFlag"
SET "description" = 'Execute commands via Lua'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Redis Exploitation & Hardening'
)
AND "title" = 'Lua Exploiter';

UPDATE "Lab"
SET
  "description" = 'Secure database backup processes and test recovery procedures for data integrity.',
  "dockerImage" = 'postgres:15-alpine',
  "briefing" = '### Mission Objective
Implement encrypted database backups, verify integrity, and test disaster recovery procedures.

### Environment
- PostgreSQL 15 with sample data
- Backup utilities: pg_dump, pg_basebackup
- Credentials: postgres / backup-sec-2024!

### Tasks
1. Perform encrypted pg_dump with GPG encryption
2. Create incremental backups using WAL archiving
3. Verify backup integrity with checksums
4. Test point-in-time recovery (PITR) from WAL files
5. Implement automated backup rotation and retention policies
6. Secure backup storage with proper file permissions and encryption
7. Test recovery to a different server to verify portability
8. Audit backup logs for completeness and tampering

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Perform encrypted pg_dump with GPG encryption","Create incremental backups using WAL archiving","Verify backup integrity with checksums","Test point-in-time recovery (PITR) from WAL files","Implement automated backup rotation and retention policies","Secure backup storage with proper file permissions and encryption","Test recovery to a different server to verify portability","Audit backup logs for completeness and tampering"]'::jsonb
WHERE "title" = 'Database Backup & Recovery Security';

UPDATE "LabFlag"
SET "description" = 'Create encrypted backup'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Backup & Recovery Security'
)
AND "title" = 'Encrypted Dumper';

UPDATE "LabFlag"
SET "description" = 'Enable WAL archiving'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Backup & Recovery Security'
)
AND "title" = 'WAL Archiver';

UPDATE "LabFlag"
SET "description" = 'Verify backup integrity'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Backup & Recovery Security'
)
AND "title" = 'Checksum Verifier';

UPDATE "LabFlag"
SET "description" = 'Perform point-in-time recovery'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Backup & Recovery Security'
)
AND "title" = 'PITR Restorer';

UPDATE "LabFlag"
SET "description" = 'Secure backup file permissions'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Backup & Recovery Security'
)
AND "title" = 'Permission Securer';

UPDATE "Lab"
SET
  "description" = 'Practice SQL Server Authentication Bypass by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice SQL Server Authentication Bypass by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Mode Finder: Check authentication mode
2. Document a canonical solution for SA Bruter: Brute-force SA password
3. Document a canonical solution for Shell Executer: Enable and use xp_cmdshell
4. Document a canonical solution for Link Explorer: Discover linked servers
5. Document a canonical solution for Credential Extractor: Extract login hashes

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Mode Finder: Check authentication mode","Document a canonical solution for SA Bruter: Brute-force SA password","Document a canonical solution for Shell Executer: Enable and use xp_cmdshell","Document a canonical solution for Link Explorer: Discover linked servers","Document a canonical solution for Credential Extractor: Extract login hashes"]'::jsonb
WHERE "title" = 'SQL Server Authentication Bypass';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Check authentication mode. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: SELECT SERVERPROPERTY(''IsIntegratedSecurityOnly'');'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Server Authentication Bypass'
)
AND "title" = 'Mode Finder';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Brute-force SA password. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: hydra -l sa -P passwords.txt mssql://target'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Server Authentication Bypass'
)
AND "title" = 'SA Bruter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable and use xp_cmdshell. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: EXEC sp_configure ''xp_cmdshell'', 1; RECONFIGURE; EXEC xp_cmdshell ''whoami'';'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Server Authentication Bypass'
)
AND "title" = 'Shell Executer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Discover linked servers. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: SELECT * FROM sys.servers;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Server Authentication Bypass'
)
AND "title" = 'Link Explorer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Extract login hashes. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: SELECT name, password_hash FROM sys.sql_logins;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Server Authentication Bypass'
)
AND "title" = 'Credential Extractor';

UPDATE "Lab"
SET
  "description" = 'Implement transparent data encryption, column-level encryption, and TLS for database connections.',
  "dockerImage" = 'postgres:15-alpine',
  "briefing" = '### Mission Objective
Deploy encryption solutions for PostgreSQL including pgcrypto, SSL/TLS, and encrypted backups.

### Environment
- PostgreSQL 15 with pgcrypto extension
- SSL certificate infrastructure
- Credentials: postgres / dbenc-2024!

### Tasks
1. Enable pgcrypto extension for column-level encryption
2. Encrypt sensitive columns (SSN, credit card) using pgp_sym_encrypt
3. Configure SSL/TLS certificates for client-server connections
4. Implement Transparent Data Encryption (TDE) concepts
5. Create encrypted database views for authorized users only
6. Set up key management procedures for encryption keys
7. Verify encryption is active using pg_stat_ssl
8. Test that encrypted data is unreadable without proper keys

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Enable pgcrypto extension for column-level encryption","Encrypt sensitive columns (SSN, credit card) using pgp_sym_encrypt","Configure SSL/TLS certificates for client-server connections","Implement Transparent Data Encryption (TDE) concepts","Create encrypted database views for authorized users only","Set up key management procedures for encryption keys","Verify encryption is active using pg_stat_ssl","Test that encrypted data is unreadable without proper keys"]'::jsonb
WHERE "title" = 'Database Encryption at Rest & in Transit';

UPDATE "LabFlag"
SET "description" = 'Enable pgcrypto extension'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Encryption at Rest & in Transit'
)
AND "title" = 'Crypto Enabler';

UPDATE "LabFlag"
SET "description" = 'Encrypt sensitive column data'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Encryption at Rest & in Transit'
)
AND "title" = 'Column Encryptor';

UPDATE "LabFlag"
SET "description" = 'Decrypt column data'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Encryption at Rest & in Transit'
)
AND "title" = 'Column Decryptor';

UPDATE "LabFlag"
SET "description" = 'Configure SSL connections'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Encryption at Rest & in Transit'
)
AND "title" = 'SSL Configurator';

UPDATE "LabFlag"
SET "description" = 'Verify active SSL connections'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Database Encryption at Rest & in Transit'
)
AND "title" = 'SSL Verifier';
