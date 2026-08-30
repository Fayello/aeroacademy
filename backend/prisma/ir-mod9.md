# Module 9 — Network Forensics

## What You'll Actually Do

Network traffic tells the story of what an attacker did after getting in — what they connected to, what data they stole, and how they communicated with their infrastructure. You'll analyze packet captures, review network logs, and reconstruct attacker activity from network evidence.

## Capturing Network Evidence

```bash
# Capture traffic on the compromised segment
tcpdump -i ens3 -w /evidence/traffic.pcap -G 3600
# Rotate every hour to prevent huge files

# Capture only relevant traffic
tcpdump -i ens3 host 10.0.1.25 -w /evidence/target_traffic.pcap

# Capture with packet count limit
tcpdump -i ens3 -c 100000 -w /evidence/capture.pcap

# Capture with timestamp precision
tcpdump -i ens3 -tttt -w /evidence/precise.pcap

# Capture specific protocols
tcpdump -i ens3 port 443 -w /evidence/https_traffic.pcap
tcpdump -i ens3 port 53 -w /evidence/dns_traffic.pcap
```

## Packet Analysis with tcpdump

```bash
# Find all unique destination IPs
tcpdump -r traffic.pcap -n | awk '{print $5}' | cut -d. -f1-4 | sort -u

# Find DNS queries
tcpdump -r traffic.pcap -n port 53 | grep -v "A?"

# Find HTTP requests
tcpdump -r traffic.pcap -A port 80 | grep -E "^(GET|POST|PUT|DELETE)"

# Find large data transfers (possible exfiltration)
tcpdump -r traffic.pcap -n | awk '{print $5}' | sort | uniq -c | sort -rn

# Find connections to known bad IPs
tcpdump -r traffic.pcap -n host 198.51.100.77

# Look for unusual ports
tcpdump -r traffic.pcap -n | awk '{print $5}' | grep -E "\.(443|80|22|53)$" -v
```

## Analyzing with Wireshark Filters

```text
Wireshark display filters:

# Follow a TCP stream
tcp.stream eq 5

# DNS queries
dns.qry.name contains "suspicious-domain.com"

# HTTP traffic
http.request.method == "POST"

# Large packets (data exfiltration)
frame.len > 1000

# TLS traffic
tls.handshake.type == 1

# Connections to specific IP
ip.addr == 198.51.100.77

# Unusual ports
tcp.dstport != 80 && tcp.dstport != 443 && tcp.dstport != 22
```

## Log Analysis for Network Forensics

```bash
# Web server logs — find anomalous requests
cat /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head
# Top IPs by request count

# Find SQL injection attempts
grep -i "union\|select\|insert\|drop\|--" /var/log/nginx/access.log

# Find directory traversal
grep -E "\.\./|\.\.\\\\|%2e%2e" /var/log/nginx/access.log

# Find unusual user agents
awk -F'"' '{print $6}' /var/log/nginx/access.log | sort -u

# Firewall logs — find blocked connections
grep "DROP" /var/log/ufw.log | awk '{print $NF}' | sort | uniq -c | sort -rn

# DNS logs — find suspicious queries
cat /var/log/dnsmasq.log | awk '{print $NF}' | sort | uniq -c | sort -rn | head
```

## Reconstructing Data Exfiltration

```bash
# Look for large outbound transfers
tcpdump -r traffic.pcap -n 'tcp[tcpflags] & (tcp-syn|tcp-fin) != 0' | \
  awk '{print $5, $10}' | sort | uniq -c | sort -rn

# Extract files from HTTP traffic
tcpflow -r traffic.pcap
# Creates files organized by TCP stream

# Find potential data exfil via DNS
tcpdump -r traffic.pcap -n port 53 | \
  awk '/query/ {print $NF}' | sort -u

# Look for encrypted tunnel traffic (long connections on unusual ports)
tcpdump -r traffic.pcap -nn | \
  awk '{print $5}' | sort | uniq -c | sort -rn
```

## Real Task: Investigate Network Traffic

```text
You're given:
- A packet capture from a corporate network segment
- The capture spans 2 hours of traffic
- An alert indicated potential data exfiltration

Your analysis:
1. Identify all unique hosts in the capture
2. Find DNS queries to suspicious domains
3. Identify large outbound data transfers
4. Reconstruct HTTP requests and responses
5. Find evidence of data exfiltration
6. Determine which internal host was compromised
```

## Assessment

**Lab task (30 min):**

1. Capture network traffic on a test network
2. Analyze the capture with tcpdump filters
3. Identify all unique destination hosts
4. Find DNS queries to suspicious domains
5. Detect potential data exfiltration
6. Reconstruct attacker activity timeline from network evidence

**Grading:**
- Traffic captured correctly: 10%
- tcpdump filters appropriate: 15%
- Hosts identified: 15%
- DNS analysis thorough: 15%
- Exfiltration detected: 20%
- Timeline reconstructed: 25%

## Evidence

- **OutcomeEvidence:** `IR-LO9 — Network Forensics`
