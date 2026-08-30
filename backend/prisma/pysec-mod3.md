# Module 3 — Packet Analysis

## What You'll Actually Do

Parse pcap files with Scapy and Python. Extract specific protocols, filter traffic, reconstruct TCP streams, and identify anomalies. This is what you'll use during incident response and threat hunting.

## Reading pcap files

```python
from scapy.all import rdpcap, TCP, UDP, IP, DNS, Raw

def load_pcap(path):
    packets = rdpcap(path)
    print(f"Loaded {len(packets)} packets")
    return packets

def summary(packets):
    """Quick overview of what's in the capture."""
    protocols = {}
    for pkt in packets:
        if pkt.haslayer(TCP):
            proto = 'TCP'
        elif pkt.haslayer(UDP):
            proto = 'UDP'
        else:
            proto = type(pkt).__name__
        protocols[proto] = protocols.get(proto, 0) + 1

    for proto, count in sorted(protocols.items(), key=lambda x: -x[1]):
        print(f"  {proto}: {count}")

pcap = load_pcap('capture.pcap')
summary(pcap)
```

## Extracting specific traffic

```python
from scapy.all import rdpcap, TCP, IP, Raw

def extract_http_requests(packets):
    """Pull HTTP requests out of a pcap."""
    requests = []
    for pkt in packets:
        if pkt.haslayer(Raw) and pkt.haslayer(TCP):
            payload = pkt[Raw].load.decode(errors='ignore')
            if payload.startswith(('GET ', 'POST ', 'PUT ', 'DELETE ', 'HEAD ')):
                requests.append({
                    'src': pkt[IP].src,
                    'dst': pkt[IP].dst,
                    'dport': pkt[TCP].dport,
                    'request': payload.split('\r\n')[0]
                })
    return requests

def extract_dns_queries(packets):
    """Extract DNS queries from capture."""
    from scapy.all import DNS, DNSQR
    queries = []
    for pkt in packets:
        if pkt.haslayer(DNS) and pkt[DNS].qr == 0:  # qr=0 is query
            qname = pkt[DNSQR].qname.decode()
            queries.append({
                'src': pkt[IP].src,
                'query': qname,
                'type': pkt[DNSQR].qtype
            })
    return queries

def extract_credentials(packets):
    """Look for plaintext credentials in HTTP traffic."""
    creds = []
    for pkt in packets:
        if pkt.haslayer(Raw):
            payload = pkt[Raw].load.decode(errors='ignore')
            # Basic auth
            if 'Authorization: Basic' in payload:
                import base64
                encoded = payload.split('Basic ')[1].split('\r\n')[0]
                decoded = base64.b64decode(encoded).decode()
                creds.append({'type': 'basic_auth', 'data': decoded})
            # Form data with password fields
            if 'password=' in payload.lower():
                creds.append({'type': 'form_data', 'data': payload[:200]})
    return creds
```

## TCP stream reconstruction

```python
from scapy.all import rdpcap, TCP, IP, Raw
from collections import defaultdict

def reconstruct_streams(packets):
    """Reassemble TCP streams by conversation."""
    streams = defaultdict(list)

    for pkt in packets:
        if pkt.haslayer(TCP) and pkt.haslayer(Raw):
            key = tuple(sorted([
                (pkt[IP].src, pkt[TCP].sport),
                (pkt[IP].dst, pkt[TCP].dport)
            ]))
            streams[key].append({
                'seq': pkt[TCP].seq,
                'ack': pkt[TCP].ack,
                'data': pkt[Raw].load
            })

    # Sort by sequence number within each stream
    for key in streams:
        streams[key].sort(key=lambda x: x['seq'])

    return streams

def get_stream_content(stream):
    """Concatenate stream data in order."""
    return b''.join(seg['data'] for seg in stream)

pcap = rdpcap('capture.pcap')
streams = reconstruct_streams(pcap)
for key, stream in streams.items():
    content = get_stream_content(stream)
    print(f"\n{'='*60}")
    print(f"Stream: {key[0]}:{key[1]} <-> {key[2]}:{key[3]}")
    print(f"Length: {len(content)} bytes")
    print(content[:500].decode(errors='ignore'))
```

## Filtering and statistics

```python
from scapy.all import rdpcap, IP, TCP, UDP
from collections import Counter

def traffic_stats(packets):
    """Generate traffic statistics."""
    src_ips = Counter()
    dst_ips = Counter()
    ports = Counter()
    sizes = []

    for pkt in packets:
        if pkt.haslayer(IP):
            src_ips[pkt[IP].src] += 1
            dst_ips[pkt[IP].dst] += 1
            sizes.append(len(pkt))

        if pkt.haslayer(TCP):
            ports[pkt[TCP].dport] += 1
        elif pkt.haslayer(UDP):
            ports[pkt[UDP].dport] += 1

    print("Top source IPs:")
    for ip, count in src_ips.most_common(10):
        print(f"  {ip}: {count}")

    print("\nTop destination IPs:")
    for ip, count in dst_ips.most_common(10):
        print(f"  {ip}: {count}")

    print("\nTop destination ports:")
    for port, count in ports.most_common(10):
        print(f"  {port}: {count}")

    if sizes:
        print(f"\nPacket sizes: min={min(sizes)}, max={max(sizes)}, avg={sum(sizes)//len(sizes)}")

def filter_by_time(packets, start秒, end秒):
    """Filter packets within a time window."""
    start_time = packets[0].time
    return [p for p in packets if start_time <= p.time <= start_time + end秒]

def detect_port_scanning(packets, threshold=50):
    """Identify potential port scanners."""
    syn_counts = Counter()
    for pkt in packets:
        if pkt.haslayer(TCP) and pkt[TCP].flags == 0x02:  # SYN only
            syn_counts[pkt[IP].src] += 1

    scanners = {ip: count for ip, count in syn_counts.items() if count >= threshold}
    for ip, count in scanners.items():
        print(f"  [!] {ip} sent {count} SYN packets — possible scan")
    return scanners
```

## Protocol dissection

```python
from scapy.all import rdpcap, DNS, DHCP, ICMP, ARP
from collections import Counter

def analyze_arp(packets):
    """Detect ARP anomalies (potential spoofing)."""
    arp_table = {}
    for pkt in packets:
        if pkt.haslayer(ARP):
            if pkt[ARP].op == 2:  # ARP reply
                ip = pkt[ARP].psrc
                mac = pkt[ARP].hwsrc
                if ip in arp_table and arp_table[ip] != mac:
                    print(f"  [!] ARP spoofing detected: {ip} was {arp_table[ip]}, now {mac}")
                arp_table[ip] = mac
    return arp_table

def analyze_dhcp(packets):
    """Extract DHCP leases."""
    leases = []
    for pkt in packets:
        if pkt.haslayer(DHCP):
            options = dict(pkt[DHCP].options)
            if options.get('message-type') == 5:  # DHCPACK
                leases.append({
                    'mac': pkt[Ether].src,
                    'ip': options.get('requested_addr', 'unknown'),
                    'hostname': options.get('hostname', 'unknown').decode() if isinstance(options.get('hostname'), bytes) else options.get('hostname', 'unknown')
                })
    return leases

def analyze_icmp(packets):
    """Look for ICMP tunneling or unusual patterns."""
    icmp_data = []
    for pkt in packets:
        if pkt.haslayer(ICMP):
            icmp_type = pkt[ICMP].type
            if pkt.haslayer(Raw):
                data_len = len(pkt[Raw].load)
                if data_len > 64:
                    print(f"  [!] Large ICMP payload ({data_len} bytes) — possible tunneling")
                    icmp_data.append({
                        'src': pkt[IP].src,
                        'dst': pkt[IP].dst,
                        'type': icmp_type,
                        'size': data_len
                    })
    return icmp_data
```

## Writing pcap files

```python
from scapy.all import wrpcap, rdpcap

def save_filtered(packets, output_path, filter_func):
    """Apply a filter function and save matching packets."""
    filtered = [p for p in packets if filter_func(p)]
    wrpcap(output_path, filtered)
    print(f"Saved {len(filtered)} packets to {output_path}")

# Save only DNS traffic
pcap = rdpcap('capture.pcap')
save_filtered(pcap, 'dns_only.pcap', lambda p: p.haslayer(DNS))

# Save only traffic to/from a specific host
save_filtered(pcap, 'suspicious_host.pcap', lambda p: p.haslayer(IP) and p[IP].dst == '10.0.0.50')
```

## Assessment

**Lab Task — Analyze a pcap and write a report (60 minutes)**

1. Download a sample pcap from a public source (e.g., Malware Traffic Analysis exercises, or capture your own with tcpdump)
2. Write a script that produces a full traffic summary: protocol breakdown, top IPs, top ports
3. Extract all HTTP requests and DNS queries
4. Reconstruct the first TCP stream and dump its contents
5. Check for any ARP anomalies

**Grading:**
- Correctly loads and parses pcap: 15 pts
- Traffic summary with protocol/IP/port breakdown: 20 pts
- HTTP request extraction works: 15 pts
- DNS query extraction works: 15 pts
- TCP stream reconstruction produces coherent output: 20 pts
- ARP analysis included: 15 pts

## Evidence

- Your analysis script
- Full terminal output of the traffic summary
- List of extracted HTTP requests
- DNS queries found
- Notes on anything suspicious you identified in the capture
