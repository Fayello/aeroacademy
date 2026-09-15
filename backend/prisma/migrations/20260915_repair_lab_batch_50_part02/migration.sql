-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Practice Network Reconnaissance with Nmap by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Network Reconnaissance with Nmap by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Host Finder: Discover live hosts with ping sweep
2. Document a canonical solution for Port Scanner: Run TCP SYN scan
3. Document a canonical solution for Version Detective: Detect service versions
4. Document a canonical solution for OS Identifier: Detect operating system
5. Document a canonical solution for Script Runner: Run NSE vulnerability scripts

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Host Finder: Discover live hosts with ping sweep","Document a canonical solution for Port Scanner: Run TCP SYN scan","Document a canonical solution for Version Detective: Detect service versions","Document a canonical solution for OS Identifier: Detect operating system","Document a canonical solution for Script Runner: Run NSE vulnerability scripts"]'::jsonb
WHERE "title" = 'Network Reconnaissance with Nmap';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Discover live hosts with ping sweep. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: nmap -sn 192.168.1.0/24'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Reconnaissance with Nmap'
)
AND "title" = 'Host Finder';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Run TCP SYN scan. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: nmap -sS 192.168.1.0/24'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Reconnaissance with Nmap'
)
AND "title" = 'Port Scanner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Detect service versions. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: nmap -sV -p- 192.168.1.10'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Reconnaissance with Nmap'
)
AND "title" = 'Version Detective';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Detect operating system. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: nmap -O 192.168.1.10'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Reconnaissance with Nmap'
)
AND "title" = 'OS Identifier';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Run NSE vulnerability scripts. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: nmap --script vuln 192.168.1.10'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Reconnaissance with Nmap'
)
AND "title" = 'Script Runner';

UPDATE "Lab"
SET
  "description" = 'Practice DNS Security & Cache Poisoning Defense by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice DNS Security & Cache Poisoning Defense by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for DNS Installer: Install and start BIND9
2. Document a canonical solution for Zone Crafter: Create forward zone file
3. Document a canonical solution for DNSSEC Enabler: Enable DNSSEC signing
4. Document a canonical solution for RRL Configurator: Configure response rate limiting
5. Document a canonical solution for DNS Logger: Enable query logging

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for DNS Installer: Install and start BIND9","Document a canonical solution for Zone Crafter: Create forward zone file","Document a canonical solution for DNSSEC Enabler: Enable DNSSEC signing","Document a canonical solution for RRL Configurator: Configure response rate limiting","Document a canonical solution for DNS Logger: Enable query logging"]'::jsonb
WHERE "title" = 'DNS Security & Cache Poisoning Defense';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Install and start BIND9. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: apt-get install -y bind9 && systemctl start named'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DNS Security & Cache Poisoning Defense'
)
AND "title" = 'DNS Installer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create forward zone file. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: named.conf.local zone declaration'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DNS Security & Cache Poisoning Defense'
)
AND "title" = 'Zone Crafter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable DNSSEC signing. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: dnssec-signzone -A -3 $(head -c 1000 /dev/urandom | sha1sum | cut -b 1-16) -N INCREMENT -o lab.local -t lab.local.signed'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DNS Security & Cache Poisoning Defense'
)
AND "title" = 'DNSSEC Enabler';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure response rate limiting. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: rate-limit { responses-per-second 10; };'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DNS Security & Cache Poisoning Defense'
)
AND "title" = 'RRL Configurator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable query logging. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: logging { channel query_log { file ''/var/log/queries.log''; severity info; }; category queries query_log; };'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DNS Security & Cache Poisoning Defense'
)
AND "title" = 'DNS Logger';

UPDATE "Lab"
SET
  "description" = 'Practice TLS/SSL Certificate Management by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice TLS/SSL Certificate Management by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for CA Creator: Generate CA certificate
2. Document a canonical solution for Server Cert: Create server certificate
3. Document a canonical solution for HTTPS Config: Configure nginx for HTTPS
4. Document a canonical solution for OCSP Stapler: Enable OCSP stapling
5. Document a canonical solution for HSTS Header: Set HSTS header

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for CA Creator: Generate CA certificate","Document a canonical solution for Server Cert: Create server certificate","Document a canonical solution for HTTPS Config: Configure nginx for HTTPS","Document a canonical solution for OCSP Stapler: Enable OCSP stapling","Document a canonical solution for HSTS Header: Set HSTS header"]'::jsonb
WHERE "title" = 'TLS/SSL Certificate Management';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Generate CA certificate. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: openssl req -x509 -newkey rsa:4096 -keyout ca.key -out ca.crt -days 365 -nodes'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS/SSL Certificate Management'
)
AND "title" = 'CA Creator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create server certificate. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: openssl req -new -newkey rsa:2048 -keyout server.key -out server.csr'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS/SSL Certificate Management'
)
AND "title" = 'Server Cert';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure nginx for HTTPS. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ssl_certificate /etc/ssl/server.crt; ssl_certificate_key /etc/ssl/server.key;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS/SSL Certificate Management'
)
AND "title" = 'HTTPS Config';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable OCSP stapling. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ssl_stapling on; ssl_stapling_verify on;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS/SSL Certificate Management'
)
AND "title" = 'OCSP Stapler';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Set HSTS header. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: add_header Strict-Transport-Security max-age=31536000; includeSubDomains always;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'TLS/SSL Certificate Management'
)
AND "title" = 'HSTS Header';

UPDATE "Lab"
SET
  "description" = 'Practice VPN Configuration with WireGuard by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice VPN Configuration with WireGuard by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Key Generator: Generate WireGuard key pair
2. Document a canonical solution for Interface Config: Configure wg0 interface
3. Document a canonical solution for IP Forwarder: Enable IP forwarding
4. Document a canonical solution for NAT Rule: Configure NAT for VPN
5. Document a canonical solution for Tunnel Tester: Verify tunnel connectivity

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Key Generator: Generate WireGuard key pair","Document a canonical solution for Interface Config: Configure wg0 interface","Document a canonical solution for IP Forwarder: Enable IP forwarding","Document a canonical solution for NAT Rule: Configure NAT for VPN","Document a canonical solution for Tunnel Tester: Verify tunnel connectivity"]'::jsonb
WHERE "title" = 'VPN Configuration with WireGuard';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Generate WireGuard key pair. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: wg genkey | tee privatekey | wg pubkey > publickey'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VPN Configuration with WireGuard'
)
AND "title" = 'Key Generator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure wg0 interface. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ip link add wg0 type wireguard && ip addr add 10.0.0.1/24 dev wg0'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VPN Configuration with WireGuard'
)
AND "title" = 'Interface Config';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable IP forwarding. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: sysctl -w net.ipv4.ip_forward=1'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VPN Configuration with WireGuard'
)
AND "title" = 'IP Forwarder';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure NAT for VPN. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VPN Configuration with WireGuard'
)
AND "title" = 'NAT Rule';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Verify tunnel connectivity. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ping -c 3 10.0.0.2'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'VPN Configuration with WireGuard'
)
AND "title" = 'Tunnel Tester';

UPDATE "Lab"
SET
  "description" = 'Practice Intrusion Detection with Suricata by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Intrusion Detection with Suricata by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for IDS Installer: Install and update Suricata
2. Document a canonical solution for SSH Rule: Create SSH brute-force rule
3. Document a canonical solution for SQLi Rule: Detect SQL injection in HTTP
4. Document a canonical solution for EVE Logger: Configure eve.json logging
5. Document a canonical solution for IPS Mode: Configure IPS with NFQUEUE

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for IDS Installer: Install and update Suricata","Document a canonical solution for SSH Rule: Create SSH brute-force rule","Document a canonical solution for SQLi Rule: Detect SQL injection in HTTP","Document a canonical solution for EVE Logger: Configure eve.json logging","Document a canonical solution for IPS Mode: Configure IPS with NFQUEUE"]'::jsonb
WHERE "title" = 'Intrusion Detection with Suricata';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Install and update Suricata. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: apt-get install -y suricata && suricata-update'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Intrusion Detection with Suricata'
)
AND "title" = 'IDS Installer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create SSH brute-force rule. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: alert ssh any any -> $HOME_NET 22 (msg:''SSH Brute Force''; flow:to_server; threshold: type both, track by_src, count 5, seconds 60; sid:1000001; rev:1;)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Intrusion Detection with Suricata'
)
AND "title" = 'SSH Rule';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Detect SQL injection in HTTP. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: alert http any any -> $HOME_NET any (msg:''SQL Injection Attempt''; flow:to_server,established; content:''SELECT''; http_uri; sid:1000002; rev:1;)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Intrusion Detection with Suricata'
)
AND "title" = 'SQLi Rule';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure eve.json logging. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: outputs: - eve-log: enabled: yes filetype: regular filename: eve.json'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Intrusion Detection with Suricata'
)
AND "title" = 'EVE Logger';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure IPS with NFQUEUE. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: af-packet: - interface: eth0 cluster-id: 99 defrag: yes'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Intrusion Detection with Suricata'
)
AND "title" = 'IPS Mode';
