-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Practice Wireless Network Security Assessment by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Wireless Network Security Assessment by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Monitor Mode: Enable monitor mode on interface
2. Document a canonical solution for Network Scanner: Scan for wireless networks
3. Document a canonical solution for Handshake Capture: Capture WPA2 handshake
4. Document a canonical solution for Deauth Attack: Force deauthentication
5. Document a canonical solution for WPA2 Cracker: Crack handshake with dictionary

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Monitor Mode: Enable monitor mode on interface","Document a canonical solution for Network Scanner: Scan for wireless networks","Document a canonical solution for Handshake Capture: Capture WPA2 handshake","Document a canonical solution for Deauth Attack: Force deauthentication","Document a canonical solution for WPA2 Cracker: Crack handshake with dictionary"]'::jsonb
WHERE "title" = 'Wireless Network Security Assessment';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable monitor mode on interface. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: airmon-ng start wlan0'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Wireless Network Security Assessment'
)
AND "title" = 'Monitor Mode';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Scan for wireless networks. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: airodump-ng wlan0mon'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Wireless Network Security Assessment'
)
AND "title" = 'Network Scanner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Capture WPA2 handshake. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: airodump-ng -c <channel> --bssid <AP> -w capture wlan0mon'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Wireless Network Security Assessment'
)
AND "title" = 'Handshake Capture';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Force deauthentication. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aireplay-ng --deauth 5 -a <AP> wlan0mon'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Wireless Network Security Assessment'
)
AND "title" = 'Deauth Attack';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Crack handshake with dictionary. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: aircrack-ng -w wordlist.txt capture-01.cap'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Wireless Network Security Assessment'
)
AND "title" = 'WPA2 Cracker';

UPDATE "Lab"
SET
  "description" = 'Practice DDoS Mitigation & Traffic Analysis by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice DDoS Mitigation & Traffic Analysis by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Traffic Capture: Capture attack traffic with tcpdump
2. Document a canonical solution for SYN Cookie: Enable SYN cookies
3. Document a canonical solution for Rate Limiter: Configure SYN rate limiting
4. Document a canonical solution for Nginx Limiter: Set nginx rate limiting
5. Document a canonical solution for Fail2Ban: Create fail2ban DDoS filter

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Traffic Capture: Capture attack traffic with tcpdump","Document a canonical solution for SYN Cookie: Enable SYN cookies","Document a canonical solution for Rate Limiter: Configure SYN rate limiting","Document a canonical solution for Nginx Limiter: Set nginx rate limiting","Document a canonical solution for Fail2Ban: Create fail2ban DDoS filter"]'::jsonb
WHERE "title" = 'DDoS Mitigation & Traffic Analysis';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Capture attack traffic with tcpdump. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tcpdump -i eth0 -w attack.pcap'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DDoS Mitigation & Traffic Analysis'
)
AND "title" = 'Traffic Capture';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Enable SYN cookies. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: sysctl -w net.ipv4.tcp_syncookies=1'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DDoS Mitigation & Traffic Analysis'
)
AND "title" = 'SYN Cookie';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure SYN rate limiting. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: iptables -A INPUT -p tcp --syn -m limit --limit 10/s --limit-burst 20 -j ACCEPT'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DDoS Mitigation & Traffic Analysis'
)
AND "title" = 'Rate Limiter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Set nginx rate limiting. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DDoS Mitigation & Traffic Analysis'
)
AND "title" = 'Nginx Limiter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create fail2ban DDoS filter. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: maxretry = 5 bantime = 3600'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'DDoS Mitigation & Traffic Analysis'
)
AND "title" = 'Fail2Ban';

UPDATE "Lab"
SET
  "description" = 'Practice Network Segmentation with VLANs by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Network Segmentation with VLANs by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for VLAN Creator: Create VLAN interfaces
2. Document a canonical solution for IP Assigner: Assign IPs to VLANs
3. Document a canonical solution for Bridge Builder: Create bridge for VLAN routing
4. Document a canonical solution for Firewall Segmenter: Block inter-VLAN traffic
5. Document a canonical solution for Traffic Monitor: Monitor VLAN traffic

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for VLAN Creator: Create VLAN interfaces","Document a canonical solution for IP Assigner: Assign IPs to VLANs","Document a canonical solution for Bridge Builder: Create bridge for VLAN routing","Document a canonical solution for Firewall Segmenter: Block inter-VLAN traffic","Document a canonical solution for Traffic Monitor: Monitor VLAN traffic"]'::jsonb
WHERE "title" = 'Network Segmentation with VLANs';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create VLAN interfaces. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ip link add link eth0 name eth0.10 type vlan id 10'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Segmentation with VLANs'
)
AND "title" = 'VLAN Creator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Assign IPs to VLANs. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: ip addr add 192.168.10.1/24 dev eth0.10'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Segmentation with VLANs'
)
AND "title" = 'IP Assigner';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create bridge for VLAN routing. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: brctl addbr br0 && brctl addif br0 eth0.10 eth0.20'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Segmentation with VLANs'
)
AND "title" = 'Bridge Builder';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Block inter-VLAN traffic. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: iptables -A FORWARD -i eth0.10 -o eth0.20 -j DROP'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Segmentation with VLANs'
)
AND "title" = 'Firewall Segmenter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Monitor VLAN traffic. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tcpdump -i eth0.10 -vv'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Network Segmentation with VLANs'
)
AND "title" = 'Traffic Monitor';

UPDATE "Lab"
SET
  "description" = 'Practice Packet Analysis with Wireshark/tshark by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice Packet Analysis with Wireshark/tshark by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for Capture Starter: Start packet capture
2. Document a canonical solution for HTTP Filter: Filter HTTP traffic
3. Document a canonical solution for Stream Reassembler: Reconstruct TCP stream
4. Document a canonical solution for DNS Analyzer: Identify suspicious DNS
5. Document a canonical solution for File Extractor: Extract files from capture

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for Capture Starter: Start packet capture","Document a canonical solution for HTTP Filter: Filter HTTP traffic","Document a canonical solution for Stream Reassembler: Reconstruct TCP stream","Document a canonical solution for DNS Analyzer: Identify suspicious DNS","Document a canonical solution for File Extractor: Extract files from capture"]'::jsonb
WHERE "title" = 'Packet Analysis with Wireshark/tshark';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Start packet capture. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tshark -i eth0 -w /tmp/capture.pcap'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Packet Analysis with Wireshark/tshark'
)
AND "title" = 'Capture Starter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Filter HTTP traffic. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tshark -r capture.pcap -Y http.request'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Packet Analysis with Wireshark/tshark'
)
AND "title" = 'HTTP Filter';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Reconstruct TCP stream. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tshark -r capture.pcap -z conv,tcp'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Packet Analysis with Wireshark/tshark'
)
AND "title" = 'Stream Reassembler';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Identify suspicious DNS. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tshark -r capture.pcap -Y dns.qry.name -T fields -e dns.qry.name'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Packet Analysis with Wireshark/tshark'
)
AND "title" = 'DNS Analyzer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Extract files from capture. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: tshark -r capture.pcap --export-objects http,/tmp/extracted'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Packet Analysis with Wireshark/tshark'
)
AND "title" = 'File Extractor';

UPDATE "Lab"
SET
  "description" = 'Practice BGP Security & Route Hijacking Defense by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Practice BGP Security & Route Hijacking Defense by producing and reviewing portable evidence without requiring unavailable host, cloud, hardware, or multi-node access.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Document a canonical solution for BGP Peering: Configure BGP session
2. Document a canonical solution for Prefix Announcer: Announce a BGP prefix
3. Document a canonical solution for Hijack Simulator: Simulate route hijack
4. Document a canonical solution for RPKI Deployer: Deploy RPKI validator
5. Document a canonical solution for ROA Creator: Create ROA record

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Document a canonical solution for BGP Peering: Configure BGP session","Document a canonical solution for Prefix Announcer: Announce a BGP prefix","Document a canonical solution for Hijack Simulator: Simulate route hijack","Document a canonical solution for RPKI Deployer: Deploy RPKI validator","Document a canonical solution for ROA Creator: Create ROA record"]'::jsonb
WHERE "title" = 'BGP Security & Route Hijacking Defense';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Configure BGP session. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: protocol bgp { neighbor 192.168.1.2 as 65001; }'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'BGP Security & Route Hijacking Defense'
)
AND "title" = 'BGP Peering';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Announce a BGP prefix. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: bgp communities add NO_EXPORT'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'BGP Security & Route Hijacking Defense'
)
AND "title" = 'Prefix Announcer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Simulate route hijack. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: birdc configure /etc/bird/hijack.conf'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'BGP Security & Route Hijacking Defense'
)
AND "title" = 'Hijack Simulator';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Deploy RPKI validator. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: apt-get install -y routinator'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'BGP Security & Route Hijacking Defense'
)
AND "title" = 'RPKI Deployer';

UPDATE "LabFlag"
SET "description" = 'Create a matching section in solution.md for this checkpoint: Create ROA record. Do not execute host-level or external-target commands. Submit the canonical command or configuration you documented. Required result: rpki-client -e /var/lib/rpki-client/ -V 192.168.0.0/16 as 65000'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'BGP Security & Route Hijacking Defense'
)
AND "title" = 'ROA Creator';
