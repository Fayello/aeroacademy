-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Exploit authentication and authorization flaws in the Webgoat learning platform.',
  "dockerImage" = 'webgoat/webgoat',
  "briefing" = '### Mission Objective
Bypass authentication mechanisms, exploit access control flaws, and escalate privileges in web applications.

### Environment
- Webgoat application running on port 8080
- Burp Suite or equivalent proxy
- Credentials: guest / guest

### Tasks
1. Bypass login using SQL injection in the authentication form
2. Exploit a broken access control to access admin functions
3. Perform session fixation attack by setting a known session ID
4. Bypass password reset using insecure direct object reference
5. Escalate privileges by manipulating JWT claims
6. Exploit Insecure Direct Object Reference (IDOR) to access other users data
7. Perform horizontal privilege escalation through parameter manipulation
8. Implement secure session management to prevent these attacks

### Permissions & Access
- Container runs as root — maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c ''%U:%G %a'' [path]',
  "tasks" = '["Bypass login using SQL injection in the authentication form","Exploit a broken access control to access admin functions","Perform session fixation attack by setting a known session ID","Bypass password reset using insecure direct object reference","Escalate privileges by manipulating JWT claims","Exploit Insecure Direct Object Reference (IDOR) to access other users data","Perform horizontal privilege escalation through parameter manipulation","Implement secure session management to prevent these attacks"]'::jsonb
WHERE "title" = 'Webgoat: Authentication & Access Control';

UPDATE "LabFlag"
SET "description" = 'SQL injection in login'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Webgoat: Authentication & Access Control'
)
AND "title" = 'Login Bypass';

UPDATE "LabFlag"
SET "description" = 'Access admin via broken ACL'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Webgoat: Authentication & Access Control'
)
AND "title" = 'Access Hijacker';

UPDATE "LabFlag"
SET "description" = 'Perform session fixation'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Webgoat: Authentication & Access Control'
)
AND "title" = 'Session Fixer';

UPDATE "LabFlag"
SET "description" = 'Access other user data via IDOR'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Webgoat: Authentication & Access Control'
)
AND "title" = 'IDOR Explorer';

UPDATE "LabFlag"
SET "description" = 'Forge JWT claims for escalation'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Webgoat: Authentication & Access Control'
)
AND "title" = 'JWT Forger';

UPDATE "Lab"
SET
  "description" = 'Practice File Upload Vulnerabilities by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice File Upload Vulnerabilities by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for MIME Bypasser: Bypass MIME type check
2. Document a canonical solution for Extension Mixer: Use alternative PHP extension
3. Document a canonical solution for EXIF Injector: Embed code in image EXIF
4. Document a canonical solution for Double Ext: Use double extension
5. Document a canonical solution for SVG XSSer: Upload malicious SVG

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for MIME Bypasser: Bypass MIME type check","Document a canonical solution for Extension Mixer: Use alternative PHP extension","Document a canonical solution for EXIF Injector: Embed code in image EXIF","Document a canonical solution for Double Ext: Use double extension","Document a canonical solution for SVG XSSer: Upload malicious SVG"]'::jsonb
WHERE "title" = 'File Upload Vulnerabilities';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Bypass MIME type check. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: Content-Type: image/jpeg with PHP content'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'File Upload Vulnerabilities'
)
AND "title" = 'MIME Bypasser';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Use alternative PHP extension. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: shell.phtml'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'File Upload Vulnerabilities'
)
AND "title" = 'Extension Mixer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Embed code in image EXIF. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: exiftool -Comment=''<?php system($_GET[cmd]); ?>'' image.jpg'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'File Upload Vulnerabilities'
)
AND "title" = 'EXIF Injector';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Use double extension. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: shell.php.jpg'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'File Upload Vulnerabilities'
)
AND "title" = 'Double Ext';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Upload malicious SVG. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: <svg onload=''alert(document.cookie)''/>'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'File Upload Vulnerabilities'
)
AND "title" = 'SVG XSSer';

UPDATE "Lab"
SET
  "description" = 'Practice Server-Side Request Forgery (SSRF) by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Server-Side Request Forgery (SSRF) by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Metadata Accessor: Access cloud metadata via SSRF
2. Document a canonical solution for Port Scanner: Internal port scan via SSRF
3. Document a canonical solution for Filter Bypasser: Bypass SSRF filter with encoding
4. Document a canonical solution for File Reader: Read local files via SSRF
5. Document a canonical solution for Protocol Changer: Use gopher for internal exploitation

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Metadata Accessor: Access cloud metadata via SSRF","Document a canonical solution for Port Scanner: Internal port scan via SSRF","Document a canonical solution for Filter Bypasser: Bypass SSRF filter with encoding","Document a canonical solution for File Reader: Read local files via SSRF","Document a canonical solution for Protocol Changer: Use gopher for internal exploitation"]'::jsonb
WHERE "title" = 'Server-Side Request Forgery (SSRF)';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Access cloud metadata via SSRF. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: http://169.254.169.254/latest/meta-data/'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Server-Side Request Forgery (SSRF)'
)
AND "title" = 'Metadata Accessor';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Internal port scan via SSRF. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: http://localhost:22'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Server-Side Request Forgery (SSRF)'
)
AND "title" = 'Port Scanner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Bypass SSRF filter with encoding. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: http://127.0.0.1'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Server-Side Request Forgery (SSRF)'
)
AND "title" = 'Filter Bypasser';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Read local files via SSRF. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: file:///etc/passwd'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Server-Side Request Forgery (SSRF)'
)
AND "title" = 'File Reader';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Use gopher for internal exploitation. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: gopher://localhost:3306/_QUIT'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Server-Side Request Forgery (SSRF)'
)
AND "title" = 'Protocol Changer';

UPDATE "Lab"
SET
  "description" = 'Practice Insecure Deserialization Attacks by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Insecure Deserialization Attacks by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for PHP Injector: Craft PHP object injection
2. Document a canonical solution for Java Gadget: Use ysoserial gadget chain
3. Document a canonical solution for Node Polluter: Prototype pollution payload
4. Document a canonical solution for Cookie Modifier: Modify serialized session
5. Document a canonical solution for Integrity Checker: Bypass HMAC on serialized data

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for PHP Injector: Craft PHP object injection","Document a canonical solution for Java Gadget: Use ysoserial gadget chain","Document a canonical solution for Node Polluter: Prototype pollution payload","Document a canonical solution for Cookie Modifier: Modify serialized session","Document a canonical solution for Integrity Checker: Bypass HMAC on serialized data"]'::jsonb
WHERE "title" = 'Insecure Deserialization Attacks';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Craft PHP object injection. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: O:8:UserData:1:{s:4:name;s:6:system;}'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Insecure Deserialization Attacks'
)
AND "title" = 'PHP Injector';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Use ysoserial gadget chain. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: java -jar ysoserial.jar CommonsCollections1 ''id'' | base64'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Insecure Deserialization Attacks'
)
AND "title" = 'Java Gadget';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Prototype pollution payload. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: {__proto__:{shell:child_process}}'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Insecure Deserialization Attacks'
)
AND "title" = 'Node Polluter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Modify serialized session. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: O:4:Admin:1:{s:4:role;s:5:admin;}'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Insecure Deserialization Attacks'
)
AND "title" = 'Cookie Modifier';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Bypass HMAC on serialized data. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: padding oracle on MAC verification'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Insecure Deserialization Attacks'
)
AND "title" = 'Integrity Checker';

UPDATE "Lab"
SET
  "description" = 'Practice Web Application Firewall Bypass by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Web Application Firewall Bypass by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for WAF Finger: Identify WAF type
2. Document a canonical solution for Encoding Bypasser: Bypass with URL encoding
3. Document a canonical solution for HPP Exploiter: HTTP parameter pollution
4. Document a canonical solution for Chunked Splitter: Use chunked encoding
5. Document a canonical solution for Unicode Mixer: Bypass with Unicode

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for WAF Finger: Identify WAF type","Document a canonical solution for Encoding Bypasser: Bypass with URL encoding","Document a canonical solution for HPP Exploiter: HTTP parameter pollution","Document a canonical solution for Chunked Splitter: Use chunked encoding","Document a canonical solution for Unicode Mixer: Bypass with Unicode"]'::jsonb
WHERE "title" = 'Web Application Firewall Bypass';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Identify WAF type. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: wafw00f http://target'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Application Firewall Bypass'
)
AND "title" = 'WAF Finger';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Bypass with URL encoding. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: %27%20OR%201%3D1--'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Application Firewall Bypass'
)
AND "title" = 'Encoding Bypasser';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: HTTP parameter pollution. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ?id=1&id='' OR 1=1--'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Application Firewall Bypass'
)
AND "title" = 'HPP Exploiter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Use chunked encoding. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: Transfer-Encoding: chunked'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Application Firewall Bypass'
)
AND "title" = 'Chunked Splitter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Bypass with Unicode. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: %u0027 OR %u0031=%u0031--'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Web Application Firewall Bypass'
)
AND "title" = 'Unicode Mixer';
