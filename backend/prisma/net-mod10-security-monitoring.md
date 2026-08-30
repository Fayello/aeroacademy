# Module 10 — Network Security Monitoring


## What You'll Actually Do

Something malicious is happening on your network. You need to detect it. You'll set up intrusion detection with Snort/Suricata, configure network-based monitoring, and respond to threats.

## IDS/IPS — Intrusion Detection/Prevention

**Snort/Suricata** inspect network traffic for known attack patterns.

**Install Suricata:**
```bash
apt install suricata
suricata-update
```

**Configure rules:**
```bash
# /etc/suricata/suricata.yaml
default-log-dir: /var/log/suricata/

af-packet:
  - interface: ens3
    cluster-id: 98
    cluster-type: cluster_flow
    defrag: yes

rule-files:
  - suricata.rules
```

**Custom rule:**
```bash
# Alert on SSH brute force
alert tcp any any -> $HOME_NET 22 (msg:"SSH brute force attempt"; \
  flow:to_server,established; \
  threshold:type both, track by_src, count 5, seconds 60; \
  sid:1000001; rev:1;)
```

## Network Flow Analysis

**NetFlow/sFlow** exports metadata about connections (who talked to whom, when, how much).

```bash
# nfdump — analyze NetFlow data
nfdump -R /var/log/nfsen/2025/01/15 -s srcip/bytes -n 20
# Top20 source IPs by bytes

# Find longest connections
nfdump -R /var/log/nfsen/2025/01/15 -s duration -n 10
```

## Zeek (formerly Bro)

Zeek analyzes network traffic and generates logs.

```bash
apt install zeek
# Logs go to /var/log/zeek/
# conn.log — all connections
# dns.log — DNS queries
# http.log — HTTP requests
# ssl.log — TLS handshakes
```

**Analyze conn.log:**
```bash
# Unique IPs communicating
awk '{print $3}' /var/log/zeek/conn.log | cut -d: -f1 | sort -u | wc -l

# Long connections (potential data exfiltration)
awk '$9 > 3600' /var/log/zeek/conn.log | head -20
```

## Alert Response

**When an alert fires:**

```bash
# 1. Check the alert
cat /var/log/suricata/fast.log | tail -20

# 2. Get details
cat /var/log/suricata/eve.json | jq 'select(.alert)' | tail -5

# 3. Find the source
# Extract source IP from alert
SRC_IP=$(cat /var/log/suricata/fast.log | grep "SSH brute" | awk '{print $12}' | cut -d: -f1)

# 4. Check if it's a known IP
whois $SRC_IP

# 5. Block if malicious
ufw deny from $SRC_IP

# 6. Investigate
tcpdump -i ens3 host $SRC_IP -w /tmp/investigate.pcap
```

## Network Monitoring Stack

```
Suricata (IDS) → EVE JSON → Logstash → Elasticsearch → Kibana
Zeek (analysis) → conn.log → Filebeat → Elasticsearch → Kibana
NetFlow → nfdump / Elastic SIEM
```

## Real Task: Detect and Respond

```bash
# 1. Deploy Suricata with custom rules
suricata-update
# Add custom rules to /var/lib/suricata/rules/custom.rules
suricata-update load-custom /var/lib/suricata/rules/custom.rules

# 2. Monitor alerts
tail -f /var/log/suricata/fast.log

# 3. Alert fires: "SSH brute force from 198.51.100.50"
# 4. Investigate
grep "198.51.100.50" /var/log/suricata/eve.json | jq '.src_ip, .dest_port, .alert.signature'
# Count attempts
grep "198.51.100.50" /var/log/auth.log | grep "Failed password" | wc -l
# 47 attempts in5 minutes

# 5. Block
ufw deny from 198.51.100.50

# 6. Check if any succeeded
grep "198.51.100.50" /var/log/auth.log | grep "Accepted"
# (none — good)

# 7. Report
echo "SSH brute force blocked: 47 attempts from 198.51.100.50" > /var/log/incident-$(date +%Y%m%d).log
```

## Assessment

**Lab task (25 min):**

1. Install and configure Suricata
2. Create custom detection rules
3. Deploy Zeek for traffic analysis
4. Analyze conn.log for suspicious connections
5. Simulate an attack and detect it
6. Respond to the alert (investigate, block, document)

**Grading:**
- Suricata configured: 20%
- Custom rules working: 20%
- Zeek deployed: 15%
- Analysis completed: 15%
- Attack detected: 15%
- Response documented: 15%

## Evidence

- **OutcomeEvidence:** `NET-LO10 — Network Security Monitoring`
- **Mastery:** `UserSkill: networking-security-monitoring` — final competency for Networking

## Course Complete

You can now:
- Understand packet flow across all layers
- Subnet and address networks
- Configure and debug DNS
- Route traffic and troubleshoot routing
- Segment networks with VLANs
- Configure firewalls (iptables/nftables)
- Set up VPNs (WireGuard/OpenVPN)
- Troubleshoot systematically
- Analyze packets with tcpdump
- Detect threats with IDS/IPS

**Next course:** Linux Internals or Security Engineering.

## Sources

- Suricata documentation
- Zeek documentation
- `man tcpdump`, `man nfdump`

