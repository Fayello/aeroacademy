# Module 2 — Network Scanning with Python

## What You'll Actually Do

Build port scanners from scratch using raw sockets and Scapy. You'll understand the TCP three-way handshake at the packet level and write tools that actually work in the field.

## Raw Sockets — the hard way first

```python
import socket
import sys
from datetime import datetime

def tcp_scan_raw(host, port, timeout=1):
    """SYN scan using raw socket. Sends SYN, checks for SYN-ACK."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        result = s.connect_ex((host, port))
        s.close()
        return result == 0
    except socket.timeout:
        return False

def port_scanner(target, port_range=(1, 1024)):
    open_ports = []
    start_time = datetime.now()

    print(f"Scanning {target} ports {port_range[0]}-{port_range[1]}")
    for port in range(port_range[0], port_range[1] + 1):
        if tcp_scan_raw(target, port):
            open_ports.append(port)
            print(f"  Port {port}: OPEN")

    elapsed = datetime.now() - start_time
    print(f"\nScan complete. {len(open_ports)} open ports found in {elapsed}")
    return open_ports

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'scanme.nmap.org'
    port_scanner(target, (1, 100))
```

This is a basic connect scanner. It completes a full TCP handshake, which is noisy and easily logged. For stealthier scanning, you need Scapy.

## Scapy — packet-level control

```python
from scapy.all import IP, TCP, sr1, sniff, UDP, DNS, DNSQR
import sys

def syn_scan(target, port, timeout=1):
    """Half-open SYN scan. Sends SYN, reads SYN-ACK or RST."""
    packet = IP(dst=target) / TCP(dport=port, flags='S')
    response = sr1(packet, timeout=timeout, verbose=0)

    if response is None:
        return 'filtered'
    elif response[TCP].flags == 0x12:  # SYN-ACK
        # Send RST to close handshake without completing it
        rst = IP(dst=target) / TCP(dport=port, flags='R')
        sr1(rst, timeout=timeout, verbose=0)
        return 'open'
    elif response[TCP].flags == 0x14:  # RST
        return 'closed'
    return 'unknown'

def scan_common_ports(target):
    ports = [21, 22, 25, 53, 80, 110, 143, 443, 993, 995, 3306, 3389, 8080]
    results = {}
    print(f"SYN scanning {target}...")
    for port in ports:
        status = syn_scan(target, port)
        results[port] = status
        if status == 'open':
            print(f"  {port}/tcp  OPEN")
        elif status == 'filtered':
            print(f"  {port}/tcp  FILTERED")
    return results

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'scanme.nmap.org'
    scan_common_ports(target)
```

### SYN scan explained

1. You send a packet with only the SYN flag set
2. If the port is open, the target replies with SYN-ACK
3. You immediately send RST instead of ACK — the connection never completes
4. Most IDS/IPS don't log half-open connections the same way they log full connections

## Scanning with custom flags

```python
from scapy.all import IP, TCP, sr1, RandShort

def ack_scan(target, port, timeout=1):
    """ACK scan — maps firewall rules, not service state."""
    packet = IP(dst=target) / TCP(dport=port, flags='A', sport=RandShort())
    response = sr1(packet, timeout=timeout, verbose=0)

    if response is None:
        return 'filtered'  # No response — likely firewalled
    elif response[TCP].flags == 0x04:  # RST
        return 'unfiltered'  # Port reachable, not filtered by firewall
    return 'unknown'

def fin_scan(target, port, timeout=1):
    """FIN scan — works on some Unix stacks, bypasses stateless firewalls."""
    packet = IP(dst=target) / TCP(dport=port, flags='F', sport=RandShort())
    response = sr1(packet, timeout=timeout, verbose=0)

    if response is None:
        return 'open'
    elif response[TCP].flags == 0x04:
        return 'closed'
    return 'unknown'
```

## UDP scanning

```python
from scapy.all import IP, UDP, sr1, DNS, DNSQR

def udp_scan(target, port, timeout=2):
    """UDP scan — slow because most firewalls drop rather than reject."""
    if port == 53:
        # DNS gets special treatment
        packet = IP(dst=target) / UDP(dport=port) / DNS(rd=1, qd=DNSQR(qname="example.com"))
    else:
        packet = IP(dst=target) / UDP(dport=port) / b'\x00'

    response = sr1(packet, timeout=timeout, verbose=0)

    if response is None:
        return 'open|filtered'  # No response could mean open or firewalled
    elif response.haslayer(ICMP):
        # ICMP type 3 code 3 = port unreachable = closed
        return 'closed'
    return 'open'
```

## OS Detection with TTL analysis

```python
from scapy.all import IP, TCP, sr1

def detect_os(target, port=80):
    """Rough OS detection based on initial TTL and window size."""
    packet = IP(dst=target) / TCP(dport=port, flags='S')
    response = sr1(packet, timeout=2, verbose=0)

    if response is None:
        return 'No response'

    ttl = response[IP].ttl
    window = response[TCP].window

    if ttl <= 64:
        os_guess = 'Linux/Unix'
    elif ttl <= 128:
        os_guess = 'Windows'
    else:
        os_guess = 'Solaris/Network device'

    print(f"TTL: {ttl}, Window: {window}")
    print(f"Likely OS: {os_guess}")
    return os_guess
```

## Putting it together — a real scanner

```python
#!/usr/bin/env python3
"""Combined scanner: SYN scan + service detection."""
import sys
from scapy.all import IP, TCP, sr1, conf

conf.verb = 0  # Suppress Scapy output

SERVICE_NAMES = {
    21: 'FTP', 22: 'SSH', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS',
    993: 'IMAPS', 995: 'POP3S', 3306: 'MySQL', 3389: 'RDP',
    8080: 'HTTP-Alt', 8443: 'HTTPS-Alt'
}

def syn_scan(target, port):
    pkt = IP(dst=target) / TCP(dport=port, flags='S')
    resp = sr1(pkt, timeout=1, verbose=0)
    if resp is None:
        return 'filtered'
    if resp[TCP].flags == 0x12:
        rst = IP(dst=target) / TCP(dport=port, flags='R')
        sr1(rst, timeout=1, verbose=0)
        return 'open'
    return 'closed'

def full_scan(target, port_range=(1, 1024)):
    print(f"[*] Scanning {target} ports {port_range[0]}-{port_range[1]}")
    open_ports = []
    for port in range(port_range[0], port_range[1] + 1):
        status = syn_scan(target, port)
        if status == 'open':
            service = SERVICE_NAMES.get(port, 'unknown')
            print(f"  [+] {port}/tcp  OPEN  ({service})")
            open_ports.append((port, service))
    print(f"\n[*] {len(open_ports)} open ports found")
    return open_ports

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'scanme.nmap.org'
    full_scan(target, (1, 200))
```

## Assessment

**Lab Task — Build and run a SYN scanner (60 minutes)**

1. Write a SYN scanner that scans the top 100 ports
2. Add a `-p` flag to allow custom port ranges from the command line
3. Add service name resolution for known ports
4. Write a function that does a quick scan (top 20 ports) and a full scan (1-1024)
5. Test against `scanme.nmap.org` and compare your results with `nmap -sS scanme.nmap.org`

**Grading:**
- SYN scanner sends correct packets: 25 pts
- Command-line arguments work: 15 pts
- Service name mapping: 10 pts
- Results match nmap output (within expected variance): 30 pts
- Script handles unreachable targets gracefully: 20 pts

## Evidence

- Your scanner script (final version)
- Side-by-side comparison of your scanner output vs nmap output
- Packet capture screenshot showing the SYN/SYN-ACK/RST exchange
- Notes on what happened when you scanned a filtered port vs an open port
