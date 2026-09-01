# Module 3 — Packet Analysis

You can scan networks and discover hosts. Now you need to understand what traffic crosses them. Packet analysis is how you answer questions like "What data did that malware exfiltrate?", "Is that employee SSH-ing to unauthorized servers?", or "Why is this application slow?"

This module teaches you to read, filter, and analyze packet captures. You'll build a packet sniffer from scratch using scapy and learn to extract useful intelligence from raw network traffic.

## Why Packet Analysis Matters

Every network communication leaves traces. When a user visits a website, their browser sends DNS queries, establishes TCP connections, and exchanges HTTP requests. When malware communicates with its command server, it creates network connections that reveal its behavior. When an employee exfiltrates data, the data crosses the network in packets that can be captured and analyzed.

Packet analysis is the microscope of network security. It lets you see exactly what happened on the wire, byte by byte. Other security tools make inferences — port scanners guess at services based on response behavior, IDS systems match patterns against known signatures. Packet analysis gives you ground truth. You see the actual data, the actual timing, the actual sequence of events.

The challenge is volume. A single pcap file from a busy network can contain millions of packets and gigabytes of data. You can't read every packet manually. You need tools that filter, aggregate, and highlight interesting patterns. Python excels at this because you can write custom logic that understands your specific investigation needs. Commercial tools give you generic dashboards. Python scripts give you exactly the analysis you need.

Real investigations follow a pattern: capture traffic, load the pcap, filter to the interesting subset, extract statistics, identify anomalies, and reconstruct conversations. Each step produces smaller, more focused datasets. By the end, you've found the needle in the haystack — the DNS tunnel, the data exfiltration, the credential theft. This module teaches you each step of that process.

## Reading pcap Files

A pcap file is a recording of network traffic. Every packet, every byte, in chronological order. Wireshark reads them graphically. Python reads them programmatically. For automated analysis at scale, Python wins.

```python
from scapy.all import rdpcap, TCP, UDP, IP, DNS

# Read a pcap file
packets = rdpcap("capture.pcap")

print(f"Total packets: {len(packets)}")
for i, packet in enumerate(packets[:10]):  # First 10 packets
    print(f"Packet {i}: {packet.summary()}")
```

`rdpcap` loads the entire file into memory. For small captures (under 100MB), this is fine. For large captures (gigabytes), use `PcapReader` for streaming:

```python
from scapy.all import PcapReader, TCP, IP

# Stream large pcap files
with PcapReader("large_capture.pcap") as reader:
    packet_count = 0
    for packet in reader:
        packet_count += 1
        if packet.haslayer(TCP):
            tcp = packet[TCP]
            print(f"TCP {packet[IP].src}:{tcp.sport} -> {packet[IP].dst}:{tcp.dport}")

        # Stop after 1000 packets (for testing)
        if packet_count >= 1000:
            break
```

Pcap files can come from Wireshark, tcpdump, tshark, or any tool that captures network traffic. The format is standardized — a pcap reader can parse captures from any source.

## Protocol Dissection

Every packet is a stack of protocol layers. Scapy represents this as nested objects. You access layers with bracket notation:

```python
from scapy.all import *

# Assuming 'packet' is a parsed packet
if packet.haslayer(Ethernet):
    eth = packet[Ethernet]
    print(f"Source MAC: {eth.src}")
    print(f"Dest MAC: {eth.dst}")
    print(f"EtherType: {eth.type}")

if packet.haslayer(IP):
    ip = packet[IP]
    print(f"Source IP: {ip.src}")
    print(f"Dest IP: {ip.dst}")
    print(f"Protocol: {ip.proto}")
    print(f"TTL: {ip.ttl}")
    print(f"Total length: {ip.len}")

if packet.haslayer(TCP):
    tcp = packet[TCP]
    print(f"Source port: {tcp.sport}")
    print(f"Dest port: {tcp.dport}")
    print(f"Flags: {tcp.flags}")
    print(f"Sequence: {tcp.seq}")
    print(f"Ack: {tcp.ack}")

if packet.haslayer(UDP):
    udp = packet[UDP]
    print(f"Source port: {udp.sport}")
    print(f"Dest port: {udp.dport}")

if packet.haslayer(DNS):
    dns = packet[DNS]
    if dns.qr == 0:  # Query
        print(f"DNS Query: {dns.qd.qname.decode()}")
    else:  # Response
        print(f"DNS Response: {dns.an.rdata}")
```

### Extracting Application Data

The raw payload lives at the bottom of the stack:

```python
from scapy.all import *

for packet in packets:
    if packet.haslayer(TCP) and packet.haslayer(Raw):
        payload = packet[Raw].load
        # Decode if it's text
        try:
            text = payload.decode("utf-8", errors="ignore")
            if text.strip():
                print(f"Payload: {text[:200]}")
        except Exception:
            print(f"Binary payload: {len(payload)} bytes")
```

For HTTP traffic, you can reconstruct conversations:

```python
from scapy.all import *
from collections import defaultdict

# Group packets by TCP stream
streams = defaultdict(list)

for packet in packets:
    if packet.haslayer(TCP) and packet.haslayer(IP):
        ip = packet[IP]
        tcp = packet[TCP]
        # Create a stream identifier (sorted so both directions map to same stream)
        stream_key = tuple(sorted([(ip.src, tcp.sport), (ip.dst, tcp.dport)]))
        streams[stream_key].append(packet)

# Reconstruct HTTP from streams
for stream_key, stream_packets in streams.items():
    for packet in stream_packets:
        if packet.haslayer(Raw):
            payload = packet[Raw].load
            if payload.startswith(b"GET ") or payload.startswith(b"POST "):
                # This is an HTTP request
                print(f"\nHTTP Request:")
                print(payload.decode(errors="ignore")[:500])
            elif payload.startswith(b"HTTP/"):
                # This is an HTTP response
                print(f"\nHTTP Response:")
                print(payload.decode(errors="ignore")[:500])
```

## Filtering and Statistics

Raw packet data is overwhelming. You need to filter it down to what matters.

### BPF Filters

Berkeley Packet Filter (BPF) syntax is supported by most capture tools and by scapy:

```python
from scapy.all import rdpcap, sniff

# Filter when reading
packets = rdpcap("capture.pcap")

# Or filter when sniffing
packets = sniff(filter="tcp port 443", count=100)
packets = sniff(filter="host 192.168.1.100", count=50)
packets = sniff(filter="net 192.168.1.0/24", count=200)
packets = sniff(filter="tcp and port 80", count=100)
```

Common BPF filters:
- `host 192.168.1.1` — traffic to/from this IP
- `net 192.168.1.0/24` — traffic to/from this subnet
- `port 80` — traffic on port 80
- `tcp` — TCP traffic only
- `udp` — UDP traffic only
- `icmp` — ICMP traffic only
- `tcp[tcpflags] & tcp-syn != 0` — TCP SYN packets

### Python Filtering

For complex filtering logic, filter in Python:

```python
from scapy.all import rdpcap, TCP, UDP, IP, DNS, ICMP

packets = rdpcap("capture.pcap")

# Filter: HTTP traffic
http_packets = [
    p for p in packets
    if p.haslayer(TCP) and p[TCP].dport in (80, 443)
]

# Filter: DNS queries
dns_queries = [
    p for p in packets
    if p.haslayer(DNS) and p[DNS].qr == 0
]

# Filter: traffic to/from specific IP
target_traffic = [
    p for p in packets
    if p.haslayer(IP) and p[IP].dst == "10.0.0.50"
]

# Filter: large packets (potential data exfiltration)
large_packets = [
    p for p in packets
    if p.haslayer(IP) and p[IP].len > 1000
]

# Complex filter: DNS over UDP port 53 with specific query
specific_dns = [
    p for p in packets
    if p.haslayer(DNS)
    and p.haslayer(UDP)
    and p[UDP].dport == 53
    and b"evil.com" in str(p[DNS].qd.qname).encode()
]
```

### Building Statistics

Packet captures tell stories through statistics:

```python
from scapy.all import rdpcap, IP, TCP, UDP, DNS
from collections import Counter, defaultdict
from datetime import datetime

def analyze_capture(pcap_file):
    packets = rdpcap(pcap_file)

    stats = {
        "total_packets": len(packets),
        "protocols": Counter(),
        "ip_sources": Counter(),
        "ip_destinations": Counter(),
        "tcp_ports": Counter(),
        "udp_ports": Counter(),
        "packet_sizes": [],
        "timestamps": [],
        "dns_queries": [],
        "tcp_flags": Counter(),
    }

    for packet in packets:
        stats["timestamps"].append(float(packet.time))

        if packet.haslayer(IP):
            ip = packet[IP]
            stats["ip_sources"][ip.src] += 1
            stats["ip_destinations"][ip.dst] += 1
            stats["packet_sizes"].append(ip.len)

            if packet.haslayer(TCP):
                stats["protocols"]["TCP"] += 1
                tcp = packet[TCP]
                stats["tcp_ports"][tcp.dport] += 1
                stats["tcp_ports"][tcp.sport] += 1
                stats["tcp_flags"][str(tcp.flags)] += 1
            elif packet.haslayer(UDP):
                stats["protocols"]["UDP"] += 1
                udp = packet[UDP]
                stats["udp_ports"][udp.dport] += 1

                if packet.haslayer(DNS) and packet[DNS].qr == 0:
                    query = packet[DNS].qd.qname.decode().rstrip(".")
                    stats["dns_queries"].append(query)
            elif packet.haslayer(ICMP):
                stats["protocols"]["ICMP"] += 1
        else:
            stats["protocols"]["Other"] += 1

    return stats

def print_stats(stats):
    print(f"{'='*60}")
    print(f"Capture Statistics")
    print(f"{'='*60}")
    print(f"Total packets: {stats['total_packets']}")

    print(f"\nProtocol distribution:")
    for proto, count in stats["protocols"].most_common():
        pct = (count / stats["total_packets"]) * 100
        print(f"  {proto:8s}: {count:6d} ({pct:.1f}%)")

    print(f"\nTop source IPs:")
    for ip, count in stats["ip_sources"].most_common(10):
        print(f"  {ip:15s}: {count:6d}")

    print(f"\nTop destination IPs:")
    for ip, count in stats["ip_destinations"].most_common(10):
        print(f"  {ip:15s}: {count:6d}")

    print(f"\nTop TCP destination ports:")
    for port, count in stats["tcp_ports"].most_common(15):
        print(f"  {port:5d}: {count:6d}")

    if stats["dns_queries"]:
        print(f"\nDNS queries ({len(stats['dns_queries'])} total):")
        for query in set(stats["dns_queries"]):
            count = stats["dns_queries"].count(query)
            print(f"  {query}: {count}")

    if stats["packet_sizes"]:
        sizes = stats["packet_sizes"]
        print(f"\nPacket sizes:")
        print(f"  Min: {min(sizes)} bytes")
        print(f"  Max: {max(sizes)} bytes")
        print(f"  Avg: {sum(sizes)/len(sizes):.0f} bytes")

# Usage
stats = analyze_capture("capture.pcap")
print_stats(stats)
```

## Building a Packet Sniffer

A sniffer captures live traffic. Scapy's `sniff` function does this, but let's build something more useful — a sniffer that logs, filters, and displays traffic in real time.

```python
from scapy.all import sniff, IP, TCP, UDP, DNS, Raw
from collections import defaultdict
from datetime import datetime
import sys
import json

class PacketSniffer:
    def __init__(self, interface=None, filter_expr=None):
        self.interface = interface
        self.filter_expr = filter_expr
        self.packets = []
        self.stats = defaultdict(int)
        self.dns_log = []
        self.http_log = []
        self.connections = defaultdict(lambda: {"packets": 0, "bytes": 0, "start": None})

    def packet_callback(self, packet):
        timestamp = datetime.fromtimestamp(float(packet.time)).isoformat()
        self.packets.append(packet)

        if packet.haslayer(IP):
            ip = packet[IP]
            src = ip.src
            dst = ip.dst

            # Track connections
            conn_key = f"{src}:{dst}"
            self.connections[conn_key]["packets"] += 1
            self.connections[conn_key]["bytes"] += ip.len
            if self.connections[conn_key]["start"] is None:
                self.connections[conn_key]["start"] = timestamp

            if packet.haslayer(TCP):
                self.stats["TCP"] += 1
                tcp = packet[TCP]
                port_info = f"TCP {src}:{tcp.sport} -> {dst}:{tcp.dport}"

                # Log HTTP
                if tcp.dport in (80, 443, 8080) and packet.haslayer(Raw):
                    try:
                        payload = packet[Raw].load.decode(errors="ignore")
                        if "HTTP" in payload or "GET" in payload or "POST" in payload:
                            self.http_log.append({
                                "timestamp": timestamp,
                                "src": src,
                                "dst": dst,
                                "port": tcp.dport,
                                "data": payload[:500]
                            })
                    except Exception:
                        pass

                # Print SYN packets (new connections)
                if tcp.flags == "S":
                    print(f"[{timestamp}] NEW CONNECTION: {port_info}")

            elif packet.haslayer(UDP):
                self.stats["UDP"] += 1
                udp = packet[UDP]

                # Log DNS
                if packet.haslayer(DNS) and packet[DNS].qr == 0:
                    query = packet[DNS].qd.qname.decode().rstrip(".")
                    self.dns_log.append({
                        "timestamp": timestamp,
                        "src": src,
                        "query": query
                    })
                    print(f"[{timestamp}] DNS QUERY: {src} -> {query}")

            elif packet.haslayer(ICMP):
                self.stats["ICMP"] += 1
        else:
            self.stats["Other"] += 1

    def start(self, count=0):
        print(f"Starting packet capture...")
        if self.filter_expr:
            print(f"Filter: {self.filter_expr}")
        print(f"Press Ctrl+C to stop\n")

        try:
            sniff(
                iface=self.interface,
                filter=self.filter_expr,
                prn=self.packet_callback,
                count=count,
                store=0
            )
        except KeyboardInterrupt:
            pass

        self.print_summary()

    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"Capture Summary")
        print(f"{'='*60}")
        print(f"Total packets captured: {len(self.packets)}")

        print(f"\nProtocol breakdown:")
        for proto, count in sorted(self.stats.items(), key=lambda x: x[1], reverse=True):
            print(f"  {proto}: {count}")

        if self.dns_log:
            print(f"\nDNS queries ({len(self.dns_log)}):")
            unique_queries = set(q["query"] for q in self.dns_log)
            for query in sorted(unique_queries):
                count = sum(1 for q in self.dns_log if q["query"] == query)
                print(f"  {query}: {count}")

        if self.http_log:
            print(f"\nHTTP traffic ({len(self.http_log)} entries):")
            for entry in self.http_log[:10]:
                print(f"  {entry['timestamp']} {entry['src']} -> {entry['dst']}:{entry['port']}")

        # Top talkers
        if self.connections:
            print(f"\nTop connections by packet count:")
            sorted_conns = sorted(
                self.connections.items(),
                key=lambda x: x[1]["packets"],
                reverse=True
            )[:10]
            for conn, info in sorted_conns:
                print(f"  {conn}: {info['packets']} packets, {info['bytes']} bytes")

    def export_json(self, filename):
        export = {
            "packets": len(self.packets),
            "dns_log": self.dns_log,
            "http_log": self.http_log,
            "connections": dict(self.connections),
            "stats": dict(self.stats)
        }
        with open(filename, "w") as f:
            json.dump(export, f, indent=2, default=str)
        print(f"Exported to {filename}")

# Usage
sniffer = PacketSniffer(filter_expr="tcp or udp")
sniffer.start()
```

Run it:

```bash
# Capture all traffic (requires root on Linux)
sudo python sniffer.py

# Capture only DNS traffic
sudo python sniffer.py  # then set filter_expr="udp port 53"

# Capture traffic to/from specific host
sudo python sniffer.py  # then set filter_expr="host 192.168.1.100"
```

## Real Scenario: Analyzing Suspicious Traffic

Let's analyze a real scenario. You've been given a pcap file from a corporate network. An employee reports suspicious activity. Your job: find out what happened.

```python
from scapy.all import rdpcap, IP, TCP, UDP, DNS, Raw, ICMP
from collections import Counter, defaultdict
from datetime import datetime
import re

class IncidentAnalyzer:
    def __init__(self, pcap_file):
        self.packets = rdpcap(pcap_file)
        self.findings = []
        self.suspicious_dns = []
        self.suspicious_connections = []
        self.data_transfers = []

    def detect_dns_tunneling(self):
        """Detect DNS tunneling by looking for unusually long queries"""
        dns_queries = []
        for packet in self.packets:
            if packet.haslayer(DNS) and packet[DNS].qr == 0:
                query = packet[DNS].qd.qname.decode().rstrip(".")
                dns_queries.append({
                    "src": packet[IP].src,
                    "query": query,
                    "length": len(query),
                    "time": datetime.fromtimestamp(float(packet.time))
                })

        # Flag queries longer than 50 characters (normal queries are short)
        suspicious = [q for q in dns_queries if q["length"] > 50]

        if suspicious:
            self.findings.append({
                "type": "DNS Tunneling",
                "severity": "HIGH",
                "details": f"Found {len(suspicious)} unusually long DNS queries"
            })
            for s in suspicious:
                print(f"  SUSPICIOUS DNS: {s['src']} -> {s['query'][:80]}...")

        self.suspicious_dns = suspicious
        return suspicious

    def detect_data_exfiltration(self):
        """Detect large outbound data transfers"""
        outbound = defaultdict(int)

        for packet in self.packets:
            if packet.haslayer(IP) and packet.haslayer(TCP):
                ip = packet[IP]
                # Assume internal network is 10.0.0.0/8 and 192.168.0.0/16
                if ip.src.startswith("10.") or ip.src.startswith("192.168."):
                    outbound[ip.src] += ip.len

        # Flag hosts sending more than 100MB
        for host, bytes_sent in outbound.items():
            if bytes_sent > 100_000_000:
                self.findings.append({
                    "type": "Data Exfiltration",
                    "severity": "CRITICAL",
                    "details": f"{host} sent {bytes_sent / 1_000_000:.1f} MB"
                })
                print(f"  EXFILTRATION: {host} sent {bytes_sent / 1_000_000:.1f} MB")

        self.data_transfers = dict(outbound)
        return outbound

    def detect_scanning(self):
        """Detect port scanning behavior"""
        syn_packets = defaultdict(set)

        for packet in self.packets:
            if packet.haslayer(TCP) and packet.haslayer(IP):
                tcp = packet[TCP]
                if tcp.flags == "S":  # SYN packet
                    syn_packets[packet[IP].src].add(tcp.dport)

        # Flag hosts scanning more than 20 unique ports
        for host, ports in syn_packets.items():
            if len(ports) > 20:
                self.findings.append({
                    "type": "Port Scanning",
                    "severity": "MEDIUM",
                    "details": f"{host} scanned {len(ports)} unique ports"
                })
                print(f"  SCANNING: {host} probed {len(ports)} ports")

        return syn_packets

    def detect_c2_communication(self):
        """Detect potential command and control channels"""
        # Look for periodic connections to the same destination
        connections = defaultdict(list)

        for packet in self.packets:
            if packet.haslayer(TCP) and packet.haslayer(IP):
                ip = packet[IP]
                tcp = packet[TCP]
                if tcp.flags == "S":  # New connection
                    key = f"{ip.src}:{ip.dst}:{tcp.dport}"
                    connections[key].append(float(packet.time))

        # Flag connections that happen at regular intervals (beaconing)
        for key, times in connections.items():
            if len(times) >= 5:
                intervals = [times[i+1] - times[i] for i in range(len(times)-1)]
                avg_interval = sum(intervals) / len(intervals)
                variance = sum((x - avg_interval) ** 2 for x in intervals) / len(intervals)

                # Low variance = regular intervals = potential beaconing
                if variance < 1.0 and avg_interval < 300:  # Within 5 minutes
                    self.findings.append({
                        "type": "Potential C2 Beaconing",
                        "severity": "HIGH",
                        "details": f"{key} - avg interval: {avg_interval:.1f}s (variance: {variance:.2f})"
                    })
                    print(f"  C2 BEACON: {key} every {avg_interval:.1f}s")

        return connections

    def extract_credentials(self):
        """Extract potential credentials from traffic"""
        credentials = []

        for packet in self.packets:
            if packet.haslayer(Raw):
                payload = packet[Raw].load.decode(errors="ignore")

                # Look for common credential patterns
                patterns = [
                    r"password[=:]\s*(\S+)",
                    r"passwd[=:]\s*(\S+)",
                    r"Authorization:\s*Basic\s+(\S+)",
                    r"Authorization:\s*Bearer\s+(\S+)",
                    r"api[_-]?key[=:]\s*(\S+)",
                ]

                for pattern in patterns:
                    matches = re.findall(pattern, payload, re.IGNORECASE)
                    for match in matches:
                        credentials.append({
                            "src": packet[IP].src if packet.haslayer(IP) else "unknown",
                            "pattern": pattern,
                            "match": match[:50]
                        })
                        print(f"  CREDENTIAL: {packet[IP].src} - {match[:30]}...")

        return credentials

    def generate_report(self):
        """Generate incident report"""
        self.detect_dns_tunneling()
        self.detect_data_exfiltration()
        self.detect_scanning()
        self.detect_c2_communication()
        self.extract_credentials()

        print(f"\n{'='*60}")
        print(f"INCIDENT ANALYSIS REPORT")
        print(f"{'='*60}")
        print(f"Packets analyzed: {len(self.packets)}")

        if self.findings:
            print(f"\nFINDINGS ({len(self.findings)}):")
            for i, finding in enumerate(self.findings, 1):
                print(f"\n  {i}. [{finding['severity']}] {finding['type']}")
                print(f"     {finding['details']}")
        else:
            print("\nNo suspicious activity detected.")

        return self.findings

# Usage
analyzer = IncidentAnalyzer("suspicious_capture.pcap")
findings = analyzer.generate_report()
```

## Protocol-Specific Analysis

### DNS Analysis

DNS is often the first protocol to examine in an investigation:

```python
from scapy.all import rdpcap, DNS, DNSQR, IP
from collections import Counter

def analyze_dns(pcap_file):
    packets = rdpcap(pcap_file)
    queries = Counter()
    responses = Counter()
    query_types = Counter()

    for packet in packets:
        if packet.haslayer(DNS):
            dns = packet[DNS]

            if dns.qr == 0:  # Query
                query = dns.qd.qname.decode().rstrip(".")
                queries[query] += 1
                query_types[dns.qd.qtype] += 1
            else:  # Response
                if dns.an:
                    response = dns.an.rdata
                    responses[response] += 1

    print("Top DNS Queries:")
    for query, count in queries.most_common(20):
        print(f"  {query}: {count}")

    print("\nTop DNS Responses:")
    for response, count in responses.most_common(20):
        print(f"  {response}: {count}")

    return queries, responses

queries, responses = analyze_dns("capture.pcap")
```

### HTTP Analysis

```python
from scapy.all import rdpcap, TCP, Raw, IP
import re

def analyze_http(pcap_file):
    packets = rdpcap(pcap_file)
    http_requests = []
    http_responses = []
    cookies = []
    user_agents = []

    for packet in packets:
        if packet.haslayer(TCP) and packet.haslayer(Raw):
            payload = packet[Raw].load.decode(errors="ignore")

            # HTTP Request
            if payload.startswith(("GET ", "POST ", "PUT ", "DELETE ", "HEAD ")):
                lines = payload.split("\r\n")
                method, path, _ = lines[0].split(" ", 2)
                headers = {}
                for line in lines[1:]:
                    if ": " in line:
                        key, value = line.split(": ", 1)
                        headers[key] = value

                http_requests.append({
                    "src": packet[IP].src,
                    "method": method,
                    "path": path,
                    "headers": headers
                })

                if "User-Agent" in headers:
                    user_agents.append(headers["User-Agent"])

                if "Cookie" in headers:
                    cookies.append({
                        "src": packet[IP].src,
                        "cookie": headers["Cookie"]
                    })

            # HTTP Response
            elif payload.startswith("HTTP/"):
                lines = payload.split("\r\n")
                status = lines[0]
                http_responses.append({
                    "dst": packet[IP].dst,
                    "status": status
                })

    print("HTTP Requests:")
    for req in http_requests[:20]:
        print(f"  {req['src']} {req['method']} {req['path']}")

    print(f"\nUnique User-Agents:")
    for ua in set(user_agents):
        count = user_agents.count(ua)
        print(f"  [{count}] {ua[:100]}")

    return http_requests, http_responses

requests, responses = analyze_http("capture.pcap")
```

## Assessment

### Lab Task: Traffic Analysis Investigation

You are given a pcap file containing suspicious network traffic. Analyze it and produce a report. Time limit: 90 minutes.

**Requirements:**
1. Load and parse the pcap file
2. Calculate basic statistics (protocol distribution, top IPs, top ports)
3. Identify DNS queries and flag suspicious ones
4. Detect potential data exfiltration (large outbound transfers)
5. Extract any credentials found in cleartext
6. Reconstruct any HTTP conversations found
7. Generate a findings report with severity ratings

**Deliverables:**
- Analysis script (`analyze.py`)
- Written report with at least 3 findings
- Statistics summary

**Grading Criteria:**
- Correctly loads and parses pcap (15 points)
- Protocol statistics are accurate (20 points)
- DNS analysis identifies queries (15 points)
- Detects at least one suspicious pattern (20 points)
- Extracts credentials or sensitive data (15 points)
- Report is clear and actionable (15 points)

### Bonus Challenges

- Rebuild TCP streams and extract transferred files
- Detect DNS tunneling by analyzing query lengths
- Identify potential C2 beaconing patterns
- Create a timeline of events from the capture

## Common Packet Analysis Challenges

Real-world packet analysis presents challenges that textbook examples don't cover. Encrypted traffic is the biggest one. TLS encrypts HTTP traffic, SSH encrypts terminal sessions, VPNs encrypt everything. You can see the connections but not the content. Analysis shifts from examining payloads to analyzing metadata — connection timing, packet sizes, destination IPs, and DNS queries.

Fragmented and segmented packets complicate analysis. TCP segmentation splits large packets into smaller segments. IP fragmentation splits packets that exceed the network MTU. Reassembling these fragments requires tracking sequence numbers and reassembling the original data. Scapy handles basic reassembly, but complex scenarios require custom logic.

Capture gaps are another challenge. If the packet capture starts after an incident begins, you miss the initial compromise. If the capture buffer fills up, older packets are lost. If the capture interface drops packets under load, you get incomplete data. Always note the capture start time, end time, and any known gaps when analyzing a pcap.

Timestamp analysis requires careful attention. Packet timestamps are in UTC by default. Converting to local time requires knowing the timezone of the capture system. Clock skew between capture points can make correlated events appear out of order. NTP synchronization is essential for accurate timeline reconstruction.

## Evidence

Packet analysis is the forensic backbone of network security. When something goes wrong on a network, the pcap file is the black box recorder. You can see every connection, every byte transferred, every DNS query. The skill is finding the needle in the haystack.

The tools you built here — packet sniffer, traffic analyzer, incident reporter — are directly applicable to security operations. Security analysts spend their days staring at packet captures, looking for signs of compromise. Now you can automate that process.

**Libraries covered:** scapy (rdpcap, sniff, PcapReader), collections, re, json, datetime

**Concepts covered:** pcap parsing, protocol dissection, packet filtering, BPF filters, protocol statistics, DNS analysis, HTTP reconstruction, credential extraction, incident analysis