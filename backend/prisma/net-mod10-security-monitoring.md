# Module 10: Network Security Monitoring

Network security monitoring (NSM) is the practice of collecting, analyzing, and acting on network data to detect and respond to threats. It is the eyes and ears of your security operations. Without NSM, you are flying blind: you will not know about an breach until someone tells you (usually the attacker or a third party). With NSM, you can detect anomalies, investigate incidents, and respond before damage spreads.

This module covers IDS/IPS systems (Snort, Suricata), network flow analysis (NetFlow, sFlow), anomaly detection, SIEM integration, threat hunting, and a real-world scenario of detecting data exfiltration via DNS.

## IDS/IPS: Snort and Suricata

An Intrusion Detection System (IDS) monitors network traffic and alerts on suspicious activity. An Intrusion Prevention System (IPS) can also block or modify traffic in real-time. IDS/IPS systems use signature-based detection (matching known attack patterns), statistical anomaly detection (deviations from baseline), and protocol analysis (checking for protocol violations).

### Snort Architecture

Snort is an open-source IDS/IPS developed by Cisco. It processes packets through a pipeline:

1. **Packet decoding**: Interprets the raw packet (Ethernet, IP, TCP, UDP, etc.)
2. **Preprocessor**: Normalizes and reassembles packets (fragments, streams)
3. **Detection engine**: Compares packets against rules
4. **Output/logging**: Generates alerts, logs, or blocks

### Snort Rules

Snort rules have two parts: the rule header (action, protocol, source/destination IPs and ports) and rule options (content matches, flow state, metadata).

```
# Rule format
action protocol source_ip source_port -> dest_ip dest_port (options;)

# Alert on any ICMP traffic
alert icmp any any -> any any (msg:"ICMP Traffic Detected"; sid:1000001; rev:1;)

# Alert on SSH from external to internal
alert tcp $EXTERNAL_NET any -> $HOME_NET 22 (msg:"SSH Connection from External"; flow:to_server,established; sid:1000002; rev:1;)

# Alert on SQL injection attempt in HTTP
alert tcp any any -> $HOME_NET 80 (msg:"SQL Injection Attempt"; flow:to_server,established; content:"UNION"; http_uri; content:"SELECT"; http_uri; sid:1000003; rev:1;)

# Alert on DNS zone transfer attempt
alert tcp any any -> $HOME_NET 53 (msg:"DNS Zone Transfer Attempt"; flow:to_server,established; content:"|00|"; offset:2; depth:2; content:"|FC|"; offset:10; depth:2; sid:1000004; rev:1;)
```

### Rule Options

```
# Content matching (byte pattern in payload)
content:"GET"; http_method;
content:"/etc/passwd"; nocase;

# Flow tracking
flow:to_server,established;
flow:to_client,established;

# HTTP-specific matching
http_uri;           # Match in URI
http_header;        # Match in header
http_client_body;   # Match in POST body
http_method;        # Match HTTP method
http_stat_code;     # Match response status code

# Byte testing
byte_test:10,>,100,20;  # At offset 20, test 10 bytes, result > 100

# Regex (Snort 3.0+)
pcre:"/UNION\s+SELECT/i";

# Metadata
msg:"Alert description";      # Human-readable message
sid:1000001;                  # Signature ID (unique rule ID)
rev:1;                        # Rule revision
classtype:web-application-attack;  # Classification
priority:1;                   # Severity (1=high, 2=medium, 3=low)
reference:cve,CVE-2024-1234;  # External reference
```

### Snort Configuration

Main configuration file (`/etc/snort/snort.conf`):

```bash
# Network variables
ipvar HOME_NET 10.0.0.0/8
ipvar EXTERNAL_NET any

# Path to rules
var RULE_PATH /etc/snort/rules
var SO_RULE_PATH /etc/snort/so_rules
var PREPROC_RULE_PATH /etc/snort/preproc_rules

# Include preprocessor rules
include $PREPROC_RULE_PATH/preprocessor.rules
include $PREPROC_RULE_PATH/decoder.rules

# Include detection rules
include $RULE_PATH/local.rules
include $RULE_PATH/emerging-*  # ET Open rules
```

### Snort Modes

```bash
# IDS mode (passive monitoring)
snort -c /etc/snort/snort.conf -i eth0 -A alert_fast

# IPS mode (inline, can block traffic)
snort -c /etc/snort/snort.conf -i eth0 -Q --daq afpacket -A alert_fast

# Packet logging mode
snort -dev -l /var/log/snort -i eth0

# Read from pcap file
snort -c /etc/snort/snort.conf -r capture.pcap -A alert_fast
```

### Suricata Overview

Suricata is an open-source IDS/IPS/NSM engine with multi-threaded processing, native protocol parsing, and integrated file extraction and Lua scripting.

Key differences from Snort:
- Multi-threaded by default (better performance on multi-core systems)
- Built-in HTTP, TLS, DNS, and SSH parsers
- File extraction from HTTP, SMTP, SMB, NFS, and FTP
- Lua scripting for custom detection logic
- EVE JSON output for SIEM integration

### Suricata Rules

Suricata supports Snort 2.x rules and adds its own extensions:

```
# Alert on suspicious DNS query
alert dns any any -> any any (msg:"Suspicious DNS Query Length"; dns.query; pcre:"/^[a-zA-Z0-9]{40,}\./"; sid:2000001; rev:1;)

# Alert on TLS certificate from known malicious CA
alert tls any any -> any any (msg:"Malicious TLS Certificate"; tls.cert_subject; content:"CN=evil"; sid:2000002; rev:1;)

# File extraction
filestore:scope,stream; file-store:path,/var/log/suricata/filestore;

# Protocol detection
alert http any any -> any any (msg:"HTTP Protocol Mismatch"; app-layer-protocol:http; flow:to_server; sid:2000003; rev:1;)
```

### Suricata Configuration

Main configuration file (`/etc/suricata/suricata.yaml`):

```yaml
vars:
  address-groups:
    HOME_NET: "[10.0.0.0/8]"
    EXTERNAL_NET: "!$HOME_NET"

default-log-dir: /var/log/suricata/

outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      types:
        - alert
        - http
        - dns
        - tls
        - files
        - flow
        - netflow

  - fast:
      enabled: yes
      filename: fast.log

af-packet:
  - interface: eth0
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
```

### Running Suricata

```bash
# IDS mode (passive)
suricata -c /etc/suricata/suricata.yaml -i eth0

# IPS mode (inline)
suricata -c /etc/suricata/suricata.yaml -i eth0 --netmap

# Test configuration
suricata -c /etc/suricata/suricata.yaml -T

# Update rules
suricata-update
```

### Tuning IDS/IPS Rules

Default rule sets generate many false positives. Tuning is essential:

```bash
# In suricata.yaml, suppress specific rules
suppress:
  - gen_id: 1, sig_id: 2000001, track by_src, ip: 10.0.1.100

# In snort.conf, use thresholding
threshold gen_id 1, sig_id 1000001, type limit, track by_src, count 1, seconds 60
```

**Thresholding**: Limit the number of alerts per time window.
- `type limit`: Only alert once per tracking period.
- `type threshold`: Alert only after a count is reached.
- `type both`: Limit AND threshold.

**Suppression**: Disable specific rules for specific hosts or networks.

**Flowbits**: Use flowbits to correlate related events across multiple packets (e.g., alert only if a specific HTTP request is followed by a specific response).

## Network Flow Analysis

Flow data is metadata about network conversations: who talked to whom, how much data was transferred, and for how long. Unlike packet captures, flow data is lightweight and can be retained for long periods.

### NetFlow

NetFlow is a Cisco protocol that exports flow records from routers and switches. The standard versions:

- **NetFlow v5**: The most widely supported version. Fixed format, supports IPv4 only.
- **NetFlow v9**: Flexible format, supports IPv4, IPv6, MPLS, and custom fields.
- **IPFIX**: IETF standard based on NetFlow v9. The modern standard.

A NetFlow record contains:
- Source and destination IP addresses
- Source and destination ports
- Protocol (TCP, UDP, ICMP)
- IP ToS (Type of Service)
- Input and output interfaces
- Packet and byte counts
- Flow start and end timestamps
- AS (Autonomous System) numbers
- TCP flags

### Configuring NetFlow Export

On a Cisco router:
```
! Configure NetFlow on an interface
interface GigabitEthernet0/0
 ip flow ingress
 ip flow egress

! Configure the NetFlow exporter
flow exporter EXPORTER-1
 destination 10.0.2.100
 transport udp 9996
 source GigabitEthernet0/0

! Configure the flow monitor
flow monitor MONITOR-1
 exporter EXPORTER-1
 record netflow ipv4 original-input

! Apply to interface
interface GigabitEthernet0/0
 ip flow monitor MONITOR-1 input
```

On Linux (using softflowd):
```bash
# Install softflowd
apt install softflowd

# Start exporting flows from eth0 to collector at 10.0.2.100:9996
softflowd -i eth0 -n 10.0.2.100:9996 -v 5
```

### sFlow

sFlow (Sampled Flow) samples packets at a defined rate rather than tracking every flow. It is lighter on the device but less accurate for low-volume flows. sFlow is common on high-speed switches where full flow tracking would be too resource-intensive.

### Flow Analysis Tools

**ntopng**: Real-time flow analysis with a web interface.
```bash
# Install ntopng
apt install ntopng

# Start on port 3001
ntopng -i eth0 -w 3001
```

**pmacct**: Flow collection and aggregation.
```bash
# Collect NetFlow data
pmacctd -f ip -i eth0 -P csv -p 9996 -O /var/log/flows/

# Aggregate by source IP
pmacct -s -S src_host -r 300 -f ip -p 9996
```

**nfdump/nfsen**: NetFlow data storage and visualization.
```bash
# Collect flows
nfsen -d /data/nfsen

# Query stored flows
nfdump -r /data/nfsen/profiles/data/default -M 10.0.0.0/8 -T ip dst 10.0.50.100

# Top talkers
nfdump -r /data/nfsen/profiles/data/default -s srcip/bytes -n 20
```

### Using Flow Data for Security

Flow data reveals patterns that packet captures cannot easily show:

**Data exfiltration detection**:
```bash
# Find hosts with unusually large outbound transfers
nfdump -r flows -s dstip/bytes -n 20

# Find unusual port usage
nfdump -r flows -s dstport/count -n 20

# Find beaconing (regular periodic connections)
nfdump -r flows -e 'src 10.0.1.100 and dst not net 10.0.0.0/8' -t 60
```

**Lateral movement detection**:
```bash
# Find hosts connecting to many internal destinations
nfdump -r flows -e 'src 10.0.1.0/24 and dst net 10.0.0.0/8' -s srcip/dstips -n 20

# Find unusual SMB or RDP traffic
nfdump -r flows -e 'srcport eq 445 or dstport eq 445 or srcport eq 3389 or dstport eq 3389' -n 50
```

**Command and control detection**:
```bash
# Find periodic connections to external IPs (beaconing)
nfdump -r flows -e 'src net 10.0.0.0/8 and dst not net 10.0.0.0/8' -s srcip/dstip -n 50

# Find connections to high-risk ports
nfdump -r flows -e 'dstport eq 4444 or dstport eq 5555 or dstport eq 6666 or dstport eq 8888'
```

## Anomaly Detection

Anomaly detection establishes a baseline of normal network behavior and alerts when activity deviates significantly from the baseline.

### Types of Anomalies

**Volume anomalies**: Unexpected spikes or drops in traffic volume.
- Sudden increase in outbound traffic (possible exfiltration)
- Sudden increase in DNS queries (DNS tunneling)
- Unusual traffic patterns at odd hours

**Behavioral anomalies**: New or unusual communication patterns.
- Host communicating with a new external IP for the first time
- Internal host scanning other internal hosts
- Server initiating outbound connections (should be destination only)

**Protocol anomalies**: Violations of protocol standards.
- HTTP traffic on non-standard ports
- DNS queries with unusually long names
- TLS connections to IPs without matching certificates

### Implementing Anomaly Detection

```bash
# UsingSuricata's anomaly detection
alert http any any -> any any (msg:"Unusual HTTP User-Agent"; http.user_agent; pcre:"/^[a-zA-Z0-9]{50,}$/"; sid:3000001; rev:1;)

# Using Zeek (formerly Bro) for behavioral analysis
@load frameworks/notice/detect-MAC-addresses
@load policy/misc/known-hosts
@load policy/misc/known-services
```

### Baselining with ntopng

ntopng can establish traffic baselines and alert on deviations:

```bash
# Configure ntopng alerts
--ntopng-digest=/etc/ntopng/ntopng.conf

# In the web interface, configure:
# - Host activity alerts (new hosts, new services)
# - Volume alerts (traffic spikes)
# - Flow alerts (unusual ports, protocols)
```

## SIEM Integration

A SIEM (Security Information and Event Management) system aggregates data from multiple sources (IDS/IPS logs, flow data, firewall logs, server logs, application logs) and correlates events to detect complex attacks.

### Common SIEM Solutions

- **Elastic SIEM (ELK Stack)**: Open-source, widely deployed. Uses Elasticsearch for storage and Kibana for visualization.
- **Splunk**: Commercial, powerful search and analytics.
- **QRadar (IBM)**: Enterprise SIEM with built-in threat intelligence.
- **Wazuh**: Open-source XDR platform with SIEM capabilities.
- **Microsoft Sentinel**: Cloud-native SIEM for Azure environments.

### Data Sources for SIEM

| Source | Data Type | Value |
|--------|-----------|-------|
| IDS/IPS (Snort/Suricata) | Alerts, signatures | Known attack detection |
| NetFlow/sFlow | Flow metadata | Traffic patterns, anomalies |
| Firewall logs | Connection decisions | Allowed/blocked traffic |
| DNS logs | Queries, responses | Domain reputation, tunneling |
| HTTP proxy logs | Requests, responses | Web activity, C2 detection |
| Authentication logs | Login events | Brute force, credential stuffing |
| Endpoint logs | Process, file, registry | Malware, lateral movement |

### Elasticsearch Configuration for SIEM

```bash
# Install Elasticsearch
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.x.x-linux-x86_64.tar.gz
tar -xzf elasticsearch-8.x.x-linux-x86_64.tar.gz

# Configure for security data
cat >> /etc/elasticsearch/elasticsearch.yml << EOF
xpack.security.enabled: true
xpack.security.audit.enabled: true
EOF

# Index Suricata EVE logs
filebeat modules enable suricata
filebeat setup --index-management
```

### Kibana Dashboards for Network Security

Create dashboards that visualize:
- Top talkers (most active internal/external IPs)
- Protocol distribution over time
- Alert volume by severity
- DNS query patterns
- HTTP response code distribution
- Connection duration distribution
- Failed authentication attempts

## Threat Hunting on the Network

Threat hunting is proactive: you assume a breach has occurred and search for evidence. It differs from reactive incident response (responding to an alert) because there may be no initial indicator of compromise.

### Hunting Hypotheses

Start with a hypothesis based on known attack patterns:

1. **DNS tunneling**: "An internal host is exfiltrating data via DNS queries with encoded subdomain names."
2. **Lateral movement**: "A compromised host is scanning internal networks for other vulnerable systems."
3. **Command and control**: "An internal host is beaconing to an external C2 server at regular intervals."
4. **Data staging**: "An internal host is aggregating data before exfiltration."
5. **Credential harvesting**: "An attacker is capturing credentials via ARP spoofing or port mirroring."

### Hunting Workflow

1. **Hypothesis formation**: Based on threat intelligence, attack frameworks (MITRE ATT&CK), or anomaly observations.
2. **Data collection**: Gather relevant logs, flow data, and packet captures.
3. **Analysis**: Apply filters and correlations to test the hypothesis.
4. **Investigation**: If indicators are found, dig deeper.
5. **Documentation**: Record findings, whether positive or negative.

### Hunting for DNS Tunneling

```bash
# Query 1: Find DNS queries with long subdomain names
dns.qry.name.len > 50

# Query 2: Find high query volume to single domains
# (use Statistics → DNS → flatten to see query counts per domain)

# Query 3: Find TXT record queries (common exfiltration vector)
dns.qry.type == 16

# Query 4: Find queries to recently registered domains
# (correlate DNS logs with threat intelligence feeds)

# Query 5: Find queries with high entropy (base64/hex encoded)
# Use Suricata rule:
alert dns any any -> any any (msg:"High Entropy DNS Query"; dns.query; pcre:"/^[a-z0-9]{30,}\.[a-z]+\.[a-z]+$/"; sid:4000001; rev:1;)
```

### Hunting for Lateral Movement

```bash
# Query 1: Find hosts connecting to many internal IPs
nfdump -r flows -e 'src net 10.0.0.0/8 and dst net 10.0.0.0/8' -s srcip/dstips -n 20

# Query 2: Find unusual SMB traffic (port 445)
nfdump -r flows -e '(srcport eq 445 or dstport eq 445)' -n 50

# Query 3: Find RDP connections (port 3389)
nfdump -r flows -e '(srcport eq 3389 or dstport eq 3389)' -n 50

# Query 4: Find hosts with many failed connections
nfdump -r flows -e 'flags eq 0x04' -s srcip -n 20  # RST flags
```

### Hunting for C2 Beaconing

```bash
# Query 1: Find regular periodic connections to external IPs
# Export connection timestamps and analyze for periodicity
nfdump -r flows -e 'src net 10.0.0.0/8 and dst not net 10.0.0.0/8' \
  -T srcip,dstip,dstport -o extended | \
  awk '{print $1, $2, $3}' | sort | uniq -c | sort -rn

# Query 2: Find connections to known C2 infrastructure
# Correlate with threat intelligence feeds (AlienVault OTX, Abuse.ch, etc.)

# Query 3: Find connections with unusual regularity
# Statistical analysis of connection intervals
tshark -r capture.pcap -Y "ip.src == 10.0.1.100 and ip.dst not net 10.0.0.0/8" \
  -T fields -e frame.time_epoch -e ip.dst | \
  awk '{diff = $1 - prev[$2]; if (prev[$2] > 0) print $2, diff; prev[$2] = $1}'
```

## Network Security Monitoring Best Practices

### Data Retention

Balance storage costs against investigation needs:
- Full packet captures: 24-72 hours (huge storage requirements)
- Flow data: 30-90 days (moderate storage)
- IDS/IPS alerts: 90-365 days (small storage)
- Aggregated flow data: 1 year (minimal storage)

### Monitoring Coverage

Ensure you have visibility into:
- All ingress/egress points (internet connections)
- All internal VLAN boundaries (inter-VLAN routing)
- VPN endpoints (both site-to-site and remote access)
- DMZ segments (web servers, mail servers)
- Cloud VPCs (if using hybrid cloud)

### Alert Tuning

Most default IDS/IPS rule sets generate too many false positives. Tune your alerts:
1. Start with high-confidence rules (high priority, low false-positive rate)
2. Monitor for one week and collect baseline alert data
3. Identify and suppress rules that generate more than 100 alerts/day with zero true positives
4. Create custom rules for your specific environment
5. Review and re-tune quarterly

### Threat Intelligence Integration

Enhance your monitoring with threat intelligence:
- Block known malicious IPs at the firewall
- Correlate DNS queries against threat intelligence feeds
- Match TLS certificate subjects against known C2 infrastructure
- Use STIX/TAXII feeds for automated indicator ingestion

## Real Scenario: Detecting Data Exfiltration via DNS

Your monitoring systems have flagged an increase in DNS query volume from the server subnet (10.0.2.0/24). You need to investigate whether this represents data exfiltration.

### Step 1: Initial Observation

Check DNS query volume from the subnet:
```bash
# Using Suricata's EVE log
cat /var/log/suricata/eve.json | jq 'select(.event_type=="dns") | select(.src_ip | startswith("10.0.2."))' | \
  jq -r '.dns.rrname' | sort | uniq -c | sort -rn | head -20
```

Output:
```
5000 aGVsbG8gd29ybGQ.badsite.com
3000 c2VjcmV0IGRhdGE.badsite.com
2000 ZXhmaWx0cmF0aW9u.badsite.com
1000 dGhpcyBpcyBzZWNyZXQ.badsite.com
...
```

All queries go to `badsite.com`. The subdomains are base64-encoded strings.

### Step 2: Identify the Source Host

```bash
# Which host is sending these queries?
cat /var/log/suricata/eve.json | jq 'select(.event_type=="dns") | select(.dns.rrname | contains("badsite.com"))' | \
  jq -r '.src_ip' | sort | uniq -c | sort -rn
```

Output:
```
11000 10.0.2.50
```

Source: 10.0.2.50: a database server that should not be making outbound DNS queries.

### Step 3: Decode the Exfiltrated Data

```bash
# Extract the subdomain names
cat /var/log/suricata/eve.json | jq 'select(.event_type=="dns") | select(.dns.rrname | contains("badsite.com"))' | \
  jq -r '.dns.rrname' | sed 's/.badsite.com//' | base64 -d > exfiltrated.bin

# Check the size
ls -la exfiltrated.bin
# 45KB of data exfiltrated

# Check file type
file exfiltrated.bin
# ASCII text
```

### Step 4: Analyze the Content

```bash
# View the decoded content
cat exfiltrated.bin | head -20
```

Output:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy5AH...
-----END RSA PRIVATE KEY-----
SELECT * FROM customers WHERE 1=1;
user_id | email | password_hash | credit_card
1 | john@example.com | $2b$12$... | 4111-1111-1111-1111
...
```

The attacker exfiltrated SSH private keys, database credentials, and customer data (including credit card numbers) via DNS tunneling.

### Step 5: Determine the Attack Vector

```bash
# Check when the DNS queries started
cat /var/log/suricata/eve.json | jq 'select(.event_type=="dns") | select(.dns.rrname | contains("badsite.com"))' | \
  jq -r '.timestamp' | head -1

# Check for other suspicious activity from this host
cat /var/log/suricata/eve.json | jq 'select(.src_ip=="10.0.2.50")' | \
  jq -r '.event_type' | sort | uniq -c

# Check SSH connections to this host
cat /var/log/suricata/eve.json | jq 'select(.event_type=="alert") | select(.src_ip=="10.0.2.50" or .dest_ip=="10.0.2.50")' | \
  jq -r '.alert.signature'
```

### Step 6: Containment

1. **Block the domain**: Add `badsite.com` to your DNS blackhole.
```bash
# Using Pi-hole or similar
echo "127.0.0.1 badsite.com" >> /etc/dns.blacklist
```

2. **Isolate the host**: Disconnect 10.0.2.50 from the network.
```bash
# On the switch
interface GigabitEthernet0/50
 shutdown
```

3. **Block the IP at the firewall**:
```bash
iptables -A OUTPUT -d $(dig +short badsite.com) -j DROP
```

4. **Notify stakeholders**: Contact the security team, database administrators, and legal/compliance.

### Step 7: Lessons Learned

- **Detection gap**: The DNS exfiltration ran for 4 hours before detection. Reduce the monitoring interval for DNS anomalies.
- **Missing controls**: A database server should not have outbound DNS access. Implement network segmentation.
- **Credential exposure**: SSH keys and database credentials were compromised. Rotate all credentials.
- **Data protection**: Customer PII (including credit card numbers) was exfiltrated. This triggers breach notification requirements.

## Incident Response Integration

Network security monitoring is only valuable if it feeds into an effective incident response process.

### Alert Triage

Not all alerts require immediate attention. Triage alerts based on:
- **Critical**: Active data exfiltration, ransomware, APT indicators
- **High**: Brute force attacks, port scans, suspicious DNS patterns
- **Medium**: Policy violations, unusual traffic patterns
- **Low**: Informational, informational, informational

### Investigation Workflow

1. **Alert triggers investigation**: analyst receives alert from SIEM/IDS
2. **Initial triage**: determine if alert is true positive or false positive
3. **Scope assessment**: identify all affected systems and users
4. **Evidence collection**: capture packet captures, flow data, logs
5. **Root cause analysis**: determine how the attacker gained access
6. **Containment**: isolate affected systems, block attack vectors
7. **Eradication**: remove malware, close vulnerabilities
8. **Recovery**: restore systems from clean backups
9. **Post-incident review**: document lessons learned, update monitoring

### Playbook Examples

**DNS Exfiltration Playbook:**
1. Alert: High DNS query volume to single domain
2. Verify: Check DNS logs for base64-encoded subdomains
3. Identify source: Determine which host is generating queries
4. Contain: Block domain at DNS, isolate host
5. Investigate: Check host for malware, review access logs
6. Remediate: Remove malware, rotate credentials, block IoCs

**Lateral Movement Playbook:**
1. Alert: Host connecting to many internal destinations
2. Verify: Check flow data for connection patterns
3. Identify source: Determine if scanning or legitimate
4. Contain: Isolate host if malicious
5. Investigate: Check for exploitation evidence, review authentication logs
6. Remediate: Patch vulnerability, reset credentials, update IDS rules

## Assessment

**Lab Exercise: Network Security Monitoring (55 minutes)**

Task 1 (20 minutes): Write Snort/Suricata rules to detect:
- DNS queries to domains with subdomains longer than 50 characters
- HTTP traffic to IP addresses (bypassing DNS)
- Multiple failed SSH login attempts from the same source (5+ in 60 seconds)
- TLS connections to self-signed certificates

Task 2 (20 minutes): Design a NetFlow monitoring strategy for a /16 network. Include:
- What data to export (which fields)
- How to store flow data (retention policy)
- What queries to run daily for security monitoring
- Alert thresholds for anomaly detection

Task 3 (15 minutes): Write a threat hunting hypothesis for detecting command and control (C2) beaconing. Describe:
- The hypothesis
- The data sources needed
- The specific queries or filters to test the hypothesis
- How to distinguish C2 traffic from legitimate traffic

**Grading Criteria:**
- Rule correctness and effectiveness: 25 points
- Monitoring strategy completeness: 25 points
- Threat hunting methodology: 25 points
- Incident response understanding: 25 points

## Evidence

Save the following to your portfolio:
1. IDS/IPS rules for Task 1 with explanations of what each rule detects
2. NetFlow monitoring strategy for Task 2 with configuration examples
3. Threat hunting hypothesis and methodology for Task 3
4. A written incident report (300-500 words) summarizing the DNS exfiltration scenario, including timeline, impact, containment actions, and lessons learned

Network security monitoring is not a product you buy: it is a process you build. The tools (Snort, Suricata, NetFlow, SIEM) are commodities. The value comes from your ability to configure them correctly, interpret the data they produce, and respond to what they reveal. This requires continuous learning, as the threat landscape evolves constantly. Start with the basics (DNS monitoring, flow analysis, IDS rules) and build complexity over time.