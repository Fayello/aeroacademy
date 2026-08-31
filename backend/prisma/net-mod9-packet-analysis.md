# Module 9 — Packet Analysis

Packet analysis is the practice of capturing and examining network traffic to understand what is happening on the wire. It is the definitive diagnostic tool — when logs contradict each other and symptoms are ambiguous, the packet capture tells you exactly what happened. Learning to analyze packets effectively separates senior engineers from junior ones.

This module covers Wireshark's filtering and display capabilities, TCP behavior analysis (retransmissions, out-of-order packets), HTTP analysis, attack detection in captures, and tshark for command-line analysis. By the end, you will be able to open a PCAP file and systematically extract the information you need.

## Wireshark Filters and Display

Wireshark has two types of filters that serve different purposes. Confusing them is the most common source of frustration for new users.

### Capture Filters (BPF syntax)

Capture filters determine what traffic Wireshark captures from the network interface. They are applied before the capture and reduce the size of the PCAP file. BPF syntax is used by tcpdump as well.

```
# Capture only traffic to/from a specific host
host 10.0.1.50

# Capture only traffic on a specific port
port 80

# Capture only TCP traffic
tcp

# Capture only traffic from a specific subnet
net 10.0.1.0/24

# Capture only HTTP traffic
tcp port 80

# Capture only DNS traffic
udp port 53

# Exclude SSH traffic
not port 22

# Combine filters
host 10.0.1.50 and port 80
```

Apply capture filters in Wireshark's capture options or on the command line:
```bash
# Using tshark with capture filter
tshark -i eth0 -f "host 10.0.1.50 and port 80" -w capture.pcap

# Using tcpdump with filter
tcpdump -i eth0 -w capture.pcap host 10.0.1.50 and port 80
```

### Display Filters (Wireshark-specific)

Display filters determine what captured traffic Wireshark shows. They do not affect the capture itself — all traffic is captured, but only matching packets are displayed. Display filters are more powerful and use Wireshark's own syntax.

```
# Basic protocol filter
http
tcp
dns
icmp

# Filter by IP address
ip.addr == 10.0.1.50
ip.src == 10.0.1.50
ip.dst == 10.0.1.50

# Filter by port
tcp.port == 80
tcp.dstport == 443
udp.srcport == 53

# Filter by TCP flags
tcp.flags.syn == 1
tcp.flags.rst == 1
tcp.flags.fin == 1

# Filter by HTTP methods
http.request.method == "GET"
http.request.method == "POST"

# Filter by HTTP response code
http.response.code == 200
http.response.code >= 400

# Filter by DNS query
dns.qry.name == "example.com"
dns.qry.type == 1  # A record

# Filter by string in packet
frame contains "password"

# Filter by packet size
frame.len > 1000
frame.len < 100

# Filter by time
frame.time >= "2026-08-31 10:00:00"

# Combine filters with AND/OR
ip.src == 10.0.1.50 and tcp.port == 80
http or dns
tcp.flags.syn == 1 and tcp.flags.ack == 0  # SYN only (new connections)
```

### Useful Display Filter Expressions

```
# Find TCP retransmissions
tcp.analysis.retransmission

# Find TCP duplicate ACKs
tcp.analysis.duplicate_ack

# Find TCP out-of-order segments
tcp.analysis.out_of_order

# Find TCP zero window (receiver buffer full)
tcp.analysis.zero_window

# Find HTTP 404 errors
http.response.code == 404

# Find DNS failures
dns.flags.rcode != 0

# Find ICMP errors
icmp.type == 3  # Destination unreachable
icmp.type == 11  # Time exceeded

# Find packets with specific flags set
tcp.flags.reset == 1

# Conversation filter (right-click -> Conversation Filter -> TCP)
# Shows only packets belonging to a specific TCP stream
```

### Column Customization

Right-click on a column header to add, remove, or reorder columns. Useful columns for analysis:

- **No.**: Packet number
- **Time**: Relative time from first packet
- **Source**: Source address
- **Destination**: Destination address
- **Protocol**: Decoded protocol
- **Length**: Packet length in bytes
- **Info**: Protocol-specific summary

For TCP analysis, add:
- **TCP Stream**: The TCP stream index (useful for following conversations)
- **TCP Seq**: Sequence number
- **TCP Ack**: Acknowledgment number
- **TCP Flags**: Raw flags value

## TCP Analysis in Wireshark

TCP is the most common protocol to analyze, and Wireshark provides extensive built-in analysis.

### TCP Stream Following

Right-click on any TCP packet -> Follow -> TCP Stream. This shows the entire TCP conversation in a separate window, with client data in red and server data in blue. For HTTP, this shows the complete request and response.

### TCP Retransmissions

Wireshark flags retransmissions with `[TCP Retransmission]` in the Info column. A retransmission occurs when the sender does not receive an acknowledgment within the RTO (Retransmission Timeout).

Retransmissions indicate:
- Packet loss on the network
- Congestion causing drops
- Receiver not acknowledging (receiver issue)
- Firewall or middlebox dropping packets

To analyze retransmissions:
```
# Filter for retransmissions
tcp.analysis.retransmission

# See retransmission statistics
Statistics -> TCP Stream Graphs -> Round Trip Time
Statistics -> TCP Stream Graphs -> Throughput
```

### Out-of-Order Packets

Wireshark flags out-of-order packets with `[TCP Out-Of-Order]`. This happens when packets arrive at the receiver in a different order than they were sent. This is normal in networks with multiple paths (ECMP), but excessive out-of-order packets indicate:

- Load balancing across multiple links with different latencies
- Route flapping
- Network congestion

```
# Filter for out-of-order packets
tcp.analysis.out_of_order
```

### TCP Window Analysis

The TCP window size controls flow control — the receiver tells the sender how much data it can buffer. Wireshark tracks window changes:

- **Window full**: The receiver's window has reached zero. The sender must stop until the receiver acknowledges data and opens the window.
- **Zero window**: The receiver has advertised a window of 0. The sender is blocked.
- **Zero window probe**: The sender probes to check if the receiver has opened its window.

```
# Filter for zero window events
tcp.analysis.zero_window

# Filter for window updates
tcp.analysis.window_update
```

### TCP Handshake Analysis

Wireshark identifies the three-way handshake and flags issues:

- **Retransmitted SYN**: The server did not respond to the initial SYN. Either the server is down, the SYN was lost, or a firewall is blocking it.
- **SYN-ACK retransmission**: The client did not acknowledge the SYN-ACK.
- **Connection reset (RST)**: One side forcefully closed the connection.

## HTTP Analysis in Wireshark

HTTP is one of the easiest protocols to analyze because it is text-based.

### Viewing HTTP Requests and Responses

```
# Filter HTTP traffic
http

# Filter specific methods
http.request.method == "GET"
http.request.method == "POST"
http.request.method == "PUT"

# Filter by host
http.host == "example.com"

# Filter by URL
http.request.uri contains "login"
http.request.uri contains "api"

# Filter by response code
http.response.code == 200
http.response.code == 301  # Redirect
http.response.code == 403  # Forbidden
http.response.code == 500  # Internal Server Error

# Filter by content type
http.content_type contains "text/html"
http.content_type contains "application/json"

# Filter by user agent
http.user_agent contains "Mozilla"
http.user_agent contains "curl"
```

### HTTP Request and Response Details

Follow the TCP stream to see the complete HTTP exchange:

```
GET /login HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: text/html,application/xhtml+xml
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: session_id=abc123

HTTP/1.1 200 OK
Server: nginx/1.24.0
Content-Type: text/html; charset=UTF-8
Content-Length: 5432
Set-Cookie: session_id=def456; HttpOnly; Secure
X-Frame-Options: DENY

<!DOCTYPE html>
<html>
...
```

### Detecting HTTP Issues

- **Slow responses**: Check the time between the request and the first response byte (Time to First Byte, TTFB). High TTFB indicates server-side processing delay.
- **Large payloads**: Check Content-Length. Large responses may indicate a misconfigured API or uncompressed content.
- **Redirects**: Follow 3xx responses to see the redirect chain.
- **Authentication failures**: 401 or 403 responses indicate authentication or authorization issues.

## Detecting Attacks in Packet Captures

Packet captures provide definitive evidence of attacks. Here are the telltale signs.

### SYN Flood Attack

Large numbers of SYN packets from many different source IPs targeting a single destination port, with no completing handshake:

```
# Filter for SYN-only packets (SYN set, ACK not set)
tcp.flags.syn == 1 and tcp.flags.ack == 0

# If you see hundreds of these from different sources to the same port,
# it is a SYN flood
```

### Port Scanning

Sequential connections to many different ports from the same source:

```
# Filter for SYN packets from a single source
ip.src == 10.0.1.100 and tcp.flags.syn == 1 and tcp.flags.ack == 0

# Look for patterns:
# - SYN to port 22, then 23, then 25, then 80, then 443...
# - Many RST responses (port closed)
# - Few SYN-ACK responses (port open)
```

Types of port scans visible in captures:
- **TCP Connect scan**: Full three-way handshake attempted. Many SYN packets followed by RST (closed) or SYN-ACK (open).
- **SYN scan (half-open)**: SYN sent, RST sent immediately after receiving SYN-ACK. Never completes the handshake.
- **FIN scan**: FIN sent without prior handshake. Abnormal behavior.
- **XMAS scan**: FIN, PSH, URG flags all set. Abnormal behavior.

### DNS Exfiltration

Unusually long subdomain names (encoded data) and high query volume to a single domain:

```
# Filter DNS queries
dns

# Look for queries with long names (encoded exfiltration data)
dns.qry.name.len > 50

# Look for TXT record queries (common exfiltration vector)
dns.qry.type == 16  # TXT

# Look for high query volume to a single domain
# (use Statistics -> DNS for summary)
```

### ARP Spoofing

Gratuitous ARP replies from the same source MAC claiming different IP addresses:

```
# Filter ARP
arp

# Look for ARP replies where the sender IP is not the expected IP
# or where many different IPs are claimed by the same MAC
```

### Brute Force Attacks

Many failed authentication attempts from the same source:

```
# For HTTP basic auth (401 responses)
http.response.code == 401 and ip.src == 10.0.1.100

# For SSH (TCP connections to port 22 with many resets)
tcp.dstport == 22 and tcp.flags.rst == 1 and ip.src == 10.0.1.100

# Count connections per source
# Use Statistics -> Conversations -> TCP -> sort by packets
```

### Data Exfiltration via HTTPS

Encrypted exfiltration is hard to detect in packet captures, but patterns can reveal it:

- Large outbound data transfers to unusual destinations
- Regular, periodic connections to a specific IP (beaconing)
- Data transfers at unusual times (e.g., 3 AM)
- Unusual packet size distributions (constant-size packets indicate encoded data)

## tshark: Command-Line Analysis

tshark is Wireshark's command-line equivalent. It is essential for automated analysis, remote servers without GUI, and processing large PCAP files.

### Basic tshark Usage

```bash
# Capture on interface
tshark -i eth0

# Capture to file
tshark -i eth0 -w capture.pcap

# Read from file
tshark -r capture.pcap

# Apply display filter
tshark -r capture.pcap -Y "http"

# Show specific fields
tshark -r capture.pcap -T fields -e frame.number -e ip.src -e ip.dst -e tcp.dstport

# Show packet summary
tshark -r capture.pcap -q -z io,phs
```

### Statistical Analysis

```bash
# Protocol hierarchy
tshark -r capture.pcap -q -z io,phs

# Conversations
tshark -r capture.pcap -q -z conv,tcp

# Endpoints
tshark -r capture.pcap -q -z endpoints,ip

# HTTP statistics
tshark -r capture.pcap -q -z http,tree

# DNS statistics
tshark -r capture.pcap -q -z dns,tree

# I/O statistics (packets per second)
tshark -r capture.pcap -q -z io,stat,1

# Round-trip time analysis
tshark -r capture.pcap -q -z rtp,streams
```

### Extracting Specific Data

```bash
# Extract all HTTP requests with timestamps
tshark -r capture.pcap -Y "http.request" -T fields -e frame.time -e ip.src -e http.host -e http.request.uri

# Extract DNS queries
tshark -r capture.pcap -Y "dns.flags.response == 0" -T fields -e frame.time -e ip.src -e dns.qry.name

# Extract TLS server names (SNI)
tshark -r capture.pcap -Y "tls.handshake.extensions_server_name" -T fields -e ip.src -e ip.dst -e tls.handshake.extensions_server_name

# Extract credentials (if unencrypted)
tshark -r capture.pcap -Y "http.authorization" -T fields -e frame.time -e ip.src -e http.authorization

# Count packets per source IP
tshark -r capture.pcap -T fields -e ip.src | sort | uniq -c | sort -rn | head -20
```

### Real-Time Analysis

```bash
# Capture and analyze in real-time
tshark -i eth0 -Y "tcp.flags.rst == 1" -T fields -e frame.time -e ip.src -e ip.dst -e tcp.srcport -e tcp.dstport

# Capture HTTP errors in real-time
tshark -i eth0 -Y "http.response.code >= 400" -T fields -e frame.time -e http.response.code -e http.host -e http.request.uri

# Capture DNS failures in real-time
tshark -i eth0 -Y "dns.flags.rcode != 0" -T fields -e frame.time -e ip.src -e dns.qry.name -e dns.flags.rcode
```

### Batch Processing

```bash
# Process multiple PCAP files
for file in /path/to/pcaps/*.pcap; do
    echo "=== $file ==="
    tshark -r "$file" -q -z io,phs
done

# Extract HTTP requests from all captures
for file in *.pcap; do
    tshark -r "$file" -Y "http.request" -T fields -e frame.time -e ip.src -e http.host -e http.request.uri >> all_requests.txt
done

# Generate a summary report
tshark -r capture.pcap -q -z conv,tcp > tcp_conversations.txt
tshark -r capture.pcap -q -z io,phs > protocol_hierarchy.txt
tshark -r capture.pcap -q -z endpoints,ip > ip_endpoints.txt
```

## Protocol-Specific Analysis Techniques

### DNS Analysis Patterns

DNS traffic reveals more than just name resolution. Analyzing DNS patterns can detect malware, data exfiltration, and reconnaissance.

```bash
# Find DNS queries to recently registered domains
# (domains registered in the last 30 days are suspicious)
tshark -r capture.pcap -Y "dns.qry.name" -T fields -e dns.qry.name | \
  sort -u | while read domain; do
    whois "$domain" 2>/dev/null | grep -i "creation date"
  done

# Find high-entropy subdomain names (base64/hex encoded data)
tshark -r capture.pcap -Y "dns.qry.name" -T fields -e dns.qry.name | \
  awk '{if(length($1) > 30) print $1}'

# Find DNS queries to IP addresses (no domain name)
tshark -r capture.pcap -Y "dns.qry.name" -T fields -e dns.qry.name | \
  grep -E "^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$"

# Find reverse DNS lookups (reconnaissance indicator)
tshark -r capture.pcap -Y "dns.qry.name contains \"in-addr.arpa\"" | \
  wc -l
```

### TLS/SSL Analysis

Encrypted traffic still reveals information through metadata:

```bash
# Extract all TLS Server Name Indications (SNI)
tshark -r capture.pcap -Y "tls.handshake.extensions_server_name" \
  -T fields -e tls.handshake.extensions_server_name | sort -u

# Find connections to IP addresses without matching certificates
tshark -r capture.pcap -Y "tls.handshake.type == 11" \
  -T fields -e ip.dst -e tls.handshake.extensions_server_name

# Find self-signed or suspicious certificates
tshark -r capture.pcap -Y "x509sat.utf8String" \
  -T fields -e x509sat.utf8String

# Detect TLS version downgrades (security concern)
tshark -r capture.pcap -Y "tls.handshake.version < 0x0303" \
  -T fields -e ip.src -e ip.dst -e tls.handshake.version
```

### ICMP Analysis

ICMP traffic is often overlooked but reveals useful information:

```bash
# Find ICMP redirect messages (routing manipulation)
tshark -r capture.pcap -Y "icmp.type == 5"

# Find ICMP unreachable messages (firewall drops)
tshark -r capture.pcap -Y "icmp.type == 3"

# Find ICMP time exceeded (traceroute activity)
tshark -r capture.pcap -Y "icmp.type == 11"

# Find ICMP tunneling (data hidden in ICMP payloads)
tshark -r capture.pcap -Y "icmp.type == 8 and data.len > 48" \
  -T fields -e ip.src -e data.len
```

## Real Scenario: Analyzing a Suspicious PCAP

You have been given a PCAP file captured from a network tap. The security team suspects data exfiltration. Your job is to analyze the capture and determine what happened.

### Step 1: Get an Overview

```bash
# Protocol hierarchy
tshark -r suspicious.pcap -q -z io,phs
```

Output:
```
===================================================================
                        Protocol Hierarchy
===================================================================
Frame          Frames: 15234  Bytes: 23456789  Duration: 3600.123456
  Ethernet     Frames: 15234  Bytes: 23456789
    IPv4       Frames: 14987  Bytes: 23123456
      TCP      Frames: 13456  Bytes: 21234567
        HTTP   Frames: 890    Bytes: 2345678
        TLS    Frames: 12000  Bytes: 18000000
        DNS    Frames: 120    Bytes: 12345
        Other  Frames: 446    Bytes: 876543
      UDP      Frames: 1200   Bytes: 1890000
        DNS    Frames: 1100   Bytes: 1780000
        Other  Frames: 100    Bytes: 110000
      ICMP     Frames: 331    Bytes: 340000
    IPv6       Frames: 247    Bytes: 333333
```

Key observations:
- Most traffic is TLS (encrypted)
- DNS is present (1100 UDP DNS queries — unusually high for a 1-hour capture)
- HTTP traffic exists (could be unencrypted exfiltration)

### Step 2: Investigate DNS

```bash
# Look at DNS query patterns
tshark -r suspicious.pcap -Y "dns.flags.response == 0" -T fields -e ip.src -e dns.qry.name | sort | uniq -c | sort -rn | head -20
```

Output:
```
500 10.0.1.100 aGVsbG8gd29ybGQ.evil.com
200 10.0.1.100 c2VjcmV0IGRhdGE.evil.com
150 10.0.1.100 ZXhmaWx0cmF0aW9u.evil.com
...
```

The DNS queries have base64-encoded subdomain names going to evil.com. This is DNS tunneling — encoding data in DNS queries to exfiltrate it.

### Step 3: Quantify the Exfiltration

```bash
# Count total DNS queries to evil.com
tshark -r suspicious.pcap -Y "dns.qry.name contains \"evil.com\"" | wc -l

# Extract and decode the base64 data
tshark -r suspicious.pcap -Y "dns.flags.response == 0 and dns.qry.name contains \"evil.com\"" -T fields -e dns.qry.name | sed 's/.evil.com//' | base64 -d > exfiltrated_data.bin

# Check the size of exfiltrated data
ls -la exfiltrated_data.bin
```

### Step 4: Identify the Source

```bash
# Which host is sending the DNS queries?
tshark -r suspicious.pcap -Y "dns.qry.name contains \"evil.com\"" -T fields -e ip.src | sort | uniq -c
```

Output:
```
850 10.0.1.100
```

Source: 10.0.1.100 — a workstation in the finance department.

### Step 5: Check for Other Indicators

```bash
# Check for unusual TLS connections
tshark -r suspicious.pcap -Y "tls.handshake.extensions_server_name" -T fields -e ip.src -e ip.dst -e tls.handshake.extensions_server_name | sort | uniq -c | sort -rn | head -10
```

Output:
```
500 10.0.1.100 203.0.113.100 evil.com
200 10.0.2.10 93.184.216.34 www.example.com
...
```

The same host (10.0.1.100) is also making TLS connections to evil.com. The attacker may have exfiltrated data via both DNS tunneling and encrypted HTTPS.

### Step 6: Timeline

```bash
# When did the exfiltration start and stop?
tshark -r suspicious.pcap -Y "dns.qry.name contains \"evil.com\"" -T fields -e frame.time | head -1
tshark -r suspicious.pcap -Y "dns.qry.name contains \"evil.com\"" -T fields -e frame.time | tail -1
```

Output:
```
Aug 31, 2026 02:15:23.456
Aug 31, 2026 03:45:12.789
```

The exfiltration ran from 2:15 AM to 3:45 AM — outside business hours, when monitoring is less likely to detect it.

### Step 7: Document Findings

Report summary:
- **Incident type**: Data exfiltration via DNS tunneling and HTTPS
- **Source**: 10.0.1.100 (finance workstation)
- **Destination**: evil.com (203.0.113.100)
- **Duration**: 02:15 - 03:45 UTC (1.5 hours)
- **Data exfiltrated**: Approximately X bytes (from base64 decoded output)
- **Indicators of compromise**: DNS queries with base64-encoded subdomains, TLS connections to evil.com
- **Recommended actions**: Isolate 10.0.1.100, block evil.com at DNS and firewall, investigate the host for malware, review access logs for the user

## Wireshark Profiling and Statistics

Wireshark's built-in statistics tools provide high-level views of capture data that are essential for rapid analysis.

### IO Graphs

IO graphs visualize traffic patterns over time, making it easy to identify spikes, dips, and anomalies.

1. Go to Statistics → IO Graphs
2. Set the time interval (e.g., 1 second)
3. Apply display filters to overlay different protocols
4. Look for unusual patterns (traffic spikes at 3 AM, periodic beaconing)

### Conversation Statistics

Conversations show which hosts are communicating and how much data they exchange:

1. Go to Statistics → Conversations
2. Select TCP tab
3. Sort by Bytes or Packets to find the most active conversations
4. Look for unexpected large transfers

### Endpoint Statistics

Endpoints show all unique IP addresses, MAC addresses, and other identifiers in the capture:

1. Go to Statistics → Endpoints
2. Sort by packets or bytes
3. Identify the top talkers
4. Look for unusual endpoints

### Expert Information

Wireshark's Expert Information dialog (Analyze → Expert Information) provides a quick summary of potential issues:

- **Errors**: Malformed packets, checksum failures
- **Warnings**: Retransmissions, out-of-order packets, zero windows
- **Notes**: TCP window updates, duplicate ACKs
- **Chats**: Normal protocol behavior (handshakes, keepalives)

## Assessment

**Lab Exercise: Packet Analysis Investigation (55 minutes)**

Task 1 (20 minutes): Using the provided PCAP file, identify:
- Total number of TCP streams
- The three most active conversations (by packet count)
- Any TCP retransmissions and their percentage of total traffic
- Any DNS queries to suspicious domains

Task 2 (20 minutes): Analyze the HTTP traffic in the PCAP:
- How many unique HTTP hosts were contacted?
- Are there any HTTP POST requests? If so, what data was being sent?
- Are there any HTTP error responses (4xx, 5xx)?
- Is there any evidence of credential transmission over HTTP (not HTTPS)?

Task 3 (15 minutes): Write a tshark command that:
- Captures only HTTP POST requests
- Extracts the timestamp, source IP, host, URI, and content type
- Outputs the results to a CSV file

**Grading Criteria:**
- Wireshark filter proficiency: 25 points
- TCP analysis accuracy: 25 points
- HTTP analysis completeness: 25 points
- tshark command correctness: 25 points

## Evidence

Save the following to your portfolio:
1. Protocol hierarchy analysis from Task 1
2. HTTP analysis results from Task 2
3. Working tshark command and CSV output from Task 3
4. A written summary (300-400 words) of what you found in the PCAP and how it would inform your response

Packet analysis is the closest thing network engineering has to forensics. A packet capture is an objective record of what happened — it does not lie, it does not forget, and it does not get confused. Learning to read it fluently is one of the most valuable skills you can develop. The investment in mastering Wireshark and tshark pays dividends throughout your career, from debugging the occasional connectivity issue to investigating complex security incidents. Start with the basics — protocol hierarchy, conversation statistics, and simple display filters — and build complexity over time as your skills develop.