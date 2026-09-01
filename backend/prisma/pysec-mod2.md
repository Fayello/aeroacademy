# Module 2: Network Scanning

Module 1 got you a basic port scanner. It works, but it's naive. It tells you which ports are open and grabs banners. A real network scanner does more: it fingerprints services, detects OS types, identifies network topology, and handles the complexities of scanning networks that don't want to be scanned.

This module takes you from port scanning to network scanning. You'll learn different scanning techniques, understand why they exist, and build a tool that actually discovers what's on a network.

## Understanding Network Protocols for Scanning

Effective network scanning requires understanding how protocols work at the packet level. TCP provides reliable, ordered delivery through a three-way handshake. UDP provides fast, connectionless delivery without guarantees. ICMP handles error reporting and diagnostics. Each protocol behaves differently when scanned, and understanding these differences is what separates a script kiddie from a security professional.

TCP scanning is straightforward because TCP is connection-oriented. You either complete the handshake (connect scan) or partially complete it (SYN scan). The server responds predictably because the protocol mandates it. UDP scanning is harder because UDP is connectionless. You send a packet and either get a response or you don't. Firewalls silently drop UDP packets, ICMP rate limiting hides responses, and services might not respond to empty UDP packets. This makes UDP scanning slow and unreliable, but many critical services run on UDP: DNS, SNMP, DHCP, TFTP, NTP.

Understanding why certain scan types exist requires thinking about what defenders see. A connect scan completes the full TCP handshake. The server allocates resources, logs the connection, and might trigger intrusion detection systems. A SYN scan never completes the handshake, so the server doesn't allocate resources and many logging systems ignore half-open connections. A FIN scan exploits how some operating systems handle unexpected FIN packets: they respond with RST on closed ports but silently drop FIN packets on open ports. These scan types evolved because defenders adapted to simpler scanning techniques.

The practical implication is that no single scan type works everywhere. Firewalls block SYN packets but allow established connections. Intrusion detection systems flag multiple connection attempts but ignore single packets. Some services respond only to specific probes. Effective scanning combines multiple techniques and interprets the results holistically. A port that appears closed in a SYN scan might appear open in a connect scan because a firewall is dropping SYN packets but allowing TCP connections.

## Socket Programming Deep Dive

You used `socket.connect_ex` in Module 1. That's a TCP connect scan: the most basic scan type. There are others, and understanding them requires understanding what happens at the socket level.

### TCP Socket States

When you create a TCP connection, both sides go through a state machine. The three-way handshake is:

1. Client sends SYN
2. Server responds with SYN-ACK
3. Client sends ACK

A TCP connect scan completes all three steps. The server logs the connection because it was fully established. A SYN scan (half-open scan) stops after step 2: the client never completes the handshake. This is stealthier because many servers don't log half-open connections.

```python
import socket

# Full connect scan (what you built in Module 1)
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(2)
sock.connect((target, port))
# Connection fully established: server logs this
sock.close()
```

For SYN scanning, you need raw sockets or scapy. Python's standard library doesn't support raw sockets on Windows. On Linux:

```python
import socket
import struct

# Raw socket (requires root on Linux)
sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)

# You now craft IP and TCP headers manually
# This is where scapy becomes essential
```

Scapy handles the raw socket complexity for you:

```python
from scapy.all import *

# SYN scan
syn_packet = IP(dst="192.168.1.1") / TCP(dport=80, flags="S")
answer = sr1(syn_packet, timeout=2, verbose=0)

if answer and answer[TCP].flags == 0x12:  # SYN-ACK
    print("Port 80 is OPEN")
    # Send RST to close connection (don't complete handshake)
    rst_packet = IP(dst="192.168.1.1") / TCP(dport=80, flags="R")
    send(rst_packet, verbose=0)
elif answer and answer[TCP].flags == 0x14:  # RST-ACK
    print("Port 80 is CLOSED")
else:
    print("Port 80 is FILTERED or no response")
```

### UDP Scanning

UDP is connectionless. There's no handshake. You send a packet and either get a response or you don't. This makes UDP scanning slow and unreliable: you need timeouts to determine if a port is closed or just didn't respond.

```python
import socket

def udp_scan(target, port, timeout=2):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    try:
        # Send empty UDP packet
        sock.sendto(b"", (target, port))
        data, addr = sock.recvfrom(1024)
        return port, True, data.decode(errors="ignore")
    except socket.timeout:
        # No response: port might be open or filtered
        return port, False, "No response (open|filtered)"
    except ConnectionRefusedError:
        # ICMP port unreachable: port is closed
        return port, False, "Closed"
    finally:
        sock.close()
```

UDP scanning is inherently unreliable. ICMP rate limiting means you might miss responses. Firewall rules might drop ICMP. A "no response" result doesn't conclusively mean the port is open: it means we don't know.

### Socket Options That Matter

Several socket options affect scanning behavior:

```python
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Timeout: critical for scanning
sock.settimeout(3)

# SO_REUSEADDR: lets you reuse sockets in TIME_WAIT state
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# SO_LINGER: control behavior on close
# Linger on close, sending remaining data for up to 10 seconds
sock.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER,
                struct.pack('ii', 1, 10))

# TCP_NODELAY: disable Nagle's algorithm for low latency
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
```

## Port Scanning Techniques

There are six common scan types. Each has tradeoffs between stealth, speed, and reliability.

### TCP Connect Scan

The basic scan from Module 1. Completes the full three-way handshake.

**Pros:** Reliable, works without root privileges, gets full banners.
**Cons:** Noisy: servers log completed connections.

### SYN Scan (Half-Open)

Sends SYN, reads SYN-ACK, sends RST instead of ACK. Never completes the handshake.

**Pros:** Stealthier, faster (doesn't need to establish full connection).
**Cons:** Requires root/admin privileges (raw sockets).

### FIN Scan

Sends a FIN packet to the target. Closed ports respond with RST. Open ports silently drop the packet.

**Pros:** Can bypass some stateless firewalls.
**Cons:** Unreliable on Windows (Windows always sends RST).

### XMAS Scan

Sets the FIN, PSH, and URG flags simultaneously. Like FIN scan, closed ports respond with RST.

**Pros:** Bypasses some simple packet filters.
**Cons:** Same Windows issue as FIN scan.

### NULL Scan

Sends a packet with no flags set. Like FIN scan, closed ports respond with RST.

**Pros:** Bypasses some filters.
**Cons:** Same Windows issue.

### ACK Scan

Sends ACK packets. The response tells you about firewall rules, not port state. RST response means the port is unfiltered.

**Pros:** Maps firewall rules.
**Cons:** Doesn't determine port state directly.

Here's a comprehensive scanner implementing multiple techniques:

```python
from scapy.all import *
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

class SynScanner:
    def __init__(self, target, timeout=2):
        self.target = target
        self.timeout = timeout

    def syn_scan(self, port):
        packet = IP(dst=self.target) / TCP(dport=port, flags="S")
        answer = sr1(packet, timeout=self.timeout, verbose=0)

        if answer is None:
            return port, "filtered", None
        elif answer.haslayer(TCP):
            flags = answer[TCP].flags
            if flags == 0x12:  # SYN-ACK
                # Send RST to close
                rst = IP(dst=self.target) / TCP(dport=port, flags="R")
                send(rst, verbose=0)
                return port, "open", None
            elif flags == 0x14:  # RST-ACK
                return port, "closed", None
        return port, "unknown", None

    def fin_scan(self, port):
        packet = IP(dst=self.target) / TCP(dport=port, flags="F")
        answer = sr1(packet, timeout=self.timeout, verbose=0)

        if answer is None:
            return port, "open|filtered", None
        elif answer.haslayer(TCP) and answer[TCP].flags == 0x14:
            return port, "closed", None
        return port, "unknown", None

    def null_scan(self, port):
        packet = IP(dst=self.target) / TCP(dport=port, flags="")
        answer = sr1(packet, timeout=self.timeout, verbose=0)

        if answer is None:
            return port, "open|filtered", None
        elif answer.haslayer(TCP) and answer[TCP].flags == 0x14:
            return port, "closed", None
        return port, "unknown", None

    def xmas_scan(self, port):
        packet = IP(dst=self.target) / TCP(dport=port, flags="FPU")
        answer = sr1(packet, timeout=self.timeout, verbose=0)

        if answer is None:
            return port, "open|filtered", None
        elif answer.haslayer(TCP) and answer[TCP].flags == 0x14:
            return port, "closed", None
        return port, "unknown", None

    def ack_scan(self, port):
        packet = IP(dst=self.target) / TCP(dport=port, flags="A")
        answer = sr1(packet, timeout=self.timeout, verbose=0)

        if answer is None:
            return port, "filtered", None
        elif answer.haslayer(TCP) and answer[TCP].flags == 0x04:  # RST
            return port, "unfiltered", None
        return port, "unknown", None

def scan_range(scanner, ports, scan_type="syn", threads=50):
    scan_method = getattr(scanner, f"{scan_type}_scan")
    results = []

    with ThreadPoolExecutor(max_workers=threads) as executor:
        futures = {
            executor.submit(scan_method, port): port
            for port in ports
        }
        for future in as_completed(futures):
            port, state, banner = future.result()
            results.append((port, state, banner))
            if state == "open":
                print(f"  Port {port}: {state}")

    return sorted(results, key=lambda x: x[0])

# Usage
scanner = SynScanner("192.168.1.1")
ports = range(1, 1025)
results = scan_range(scanner, ports, scan_type="syn")

open_ports = [r for r in results if r[1] == "open"]
print(f"\nFound {len(open_ports)} open ports")
```

## Service Detection and Fingerprinting

Knowing a port is open is step one. Knowing what's running on it is step two. Service detection goes beyond banner grabbing: it sends specific probes and analyzes responses to identify services.

### Banner Grabbing Techniques

Different services respond differently to connection attempts:

```python
import socket

def grab_banner(target, port, timeout=3):
    """Grab service banner using multiple techniques"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    banner = None

    try:
        sock.connect((target, port))

        # Technique 1: Wait for server banner
        try:
            banner = sock.recv(1024)
        except socket.timeout:
            pass

        if banner:
            return banner.decode(errors="ignore").strip()

        # Technique 2: Send a trigger
        triggers = {
            21: b"USER anonymous\r\n",
            22: b"SSH-2.0-OpenSSH_8.9\r\n",
            25: b"EHLO test\r\n",
            80: b"GET / HTTP/1.1\r\nHost: " + target.encode() + b"\r\n\r\n",
            110: b"USER test\r\n",
            143: b"a001 CAPABILITY\r\n",
            443: b"HEAD / HTTP/1.1\r\nHost: " + target.encode() + b"\r\n\r\n",
        }

        if port in triggers:
            sock.send(triggers[port])
            try:
                banner = sock.recv(1024)
                return banner.decode(errors="ignore").strip()
            except socket.timeout:
                pass

    except Exception as e:
        return f"Error: {e}"
    finally:
        sock.close()

    return "No banner"
```

### Service Probes

More sophisticated fingerprinting sends specific probes and matches responses against known patterns:

```python
SERVICE_PROBES = {
    "HTTP": [
        b"HEAD / HTTP/1.0\r\n\r\n",
        b"GET / HTTP/1.1\r\nHost: localhost\r\n\r\n",
    ],
    "SSH": [
        b"SSH-2.0-OpenSSH_8.9\r\n",
    ],
    "FTP": [
        b"HEAD / HTTP/1.1\r\n\r\n",
    ],
    "SMTP": [
        b"EHLO localhost\r\n",
    ],
    "MySQL": [
        b"\x00\x00\x00\x00\x01\x85\xa6\x03\x00",
    ],
}

KNOWN_SIGNATURES = {
    "SSH-2.0-OpenSSH": "OpenSSH",
    "SSH-2.0-libssh": "libssh",
    "220 ProFTPD": "ProFTPD",
    "220 vsFTPd": "vsFTPd",
    "HTTP/1.1 200": "Web Server",
    "HTTP/1.1 401": "Web Server (Auth Required)",
    "550 ": "SMTP Server",
    "+OK": "POP3 Server",
}

def fingerprint_service(target, port, timeout=3):
    """Fingerprint service using probes and signature matching"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)

    try:
        sock.connect((target, port))

        # Try each probe
        for service, probes in SERVICE_PROBES.items():
            for probe in probes:
                try:
                    sock.send(probe)
                    response = sock.recv(4096)
                    response_str = response.decode(errors="ignore")

                    # Check against known signatures
                    for signature, name in KNOWN_SIGNATURES.items():
                        if signature in response_str:
                            return name, response_str.strip()

                    return service, response_str.strip()
                except socket.timeout:
                    continue
                except Exception:
                    continue

    except Exception:
        pass
    finally:
        sock.close()

    return "Unknown", "No response"
```

## Building a Network Discovery Tool

Let's build something that discovers what's on a network: not just which ports are open, but what devices exist, what services they run, and how they're configured.

### Host Discovery

Before scanning ports, discover which hosts are alive:

```python
import socket
import subprocess
import ipaddress
from concurrent.futures import ThreadPoolExecutor, as_completed

def ping_host(ip, timeout=2):
    """Check if host responds to ping"""
    param = "-n" if subprocess.os.name == "nt" else "-c"
    try:
        result = subprocess.run(
            ["ping", param, "1", "-W", str(timeout), str(ip)],
            capture_output=True,
            timeout=timeout + 1
        )
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        return False

def tcp_ping(ip, port, timeout=1):
    """Check if host has a listening port"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((str(ip), port))
        sock.close()
        return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

def discover_hosts(network, timeout=2):
    """Discover live hosts on a network"""
    net = ipaddress.ip_network(network, strict=False)
    hosts = []

    # Common ports for host discovery
    discovery_ports = [22, 80, 443, 445, 3389, 8080]

    print(f"Scanning network {network}...")

    # Try ping sweep first (fast, but often blocked)
    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = {
            executor.submit(ping_host, str(ip), timeout): str(ip)
            for ip in net.hosts()
        }
        for future in as_completed(futures):
            ip = futures[future]
            if future.result():
                hosts.append(ip)
                print(f"  Host {ip} responded to ping")

    # For hosts that don't respond to ping, try TCP
    remaining = [str(ip) for ip in net.hosts() if str(ip) not in hosts]

    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = {}
        for ip in remaining:
            for port in discovery_ports:
                futures[executor.submit(tcp_ping, ip, port)] = (ip, port)

        found = set()
        for future in as_completed(futures):
            ip, port = futures[future]
            if future.result() and ip not in found:
                found.add(ip)
                hosts.append(ip)
                print(f"  Host {ip} has port {port} open")

    return sorted(hosts, key=lambda x: list(map(int, x.split('.'))))

# Usage
live_hosts = discover_hosts("192.168.1.0/24")
print(f"\nDiscovered {len(live_hosts)} live hosts")
for host in live_hosts:
    print(f"  {host}")
```

### Network Mapping

Combine host discovery with port scanning to build a network map:

```python
import socket
import ipaddress
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import List, Dict, Optional

COMMON_SERVICES = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
    53: "DNS", 80: "HTTP", 110: "POP3", 135: "MSRPC",
    139: "NetBIOS", 143: "IMAP", 443: "HTTPS",
    445: "SMB", 993: "IMAPS", 995: "POP3S",
    1433: "MSSQL", 3306: "MySQL", 3389: "RDP",
    5432: "PostgreSQL", 5900: "VNC", 6379: "Redis",
    8080: "HTTP-Alt", 8443: "HTTPS-Alt"
}

@dataclass
class HostInfo:
    ip: str
    hostname: Optional[str]
    mac: Optional[str]
    os_guess: Optional[str]
    ports: Dict[int, Dict]

def resolve_hostname(ip):
    try:
        return socket.gethostbyaddr(ip)[0]
    except socket.herror:
        return None

def scan_host(ip, ports, timeout=2):
    """Scan all ports on a single host"""
    open_ports = {}

    def scan_port(port):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((str(ip), port))

        if result == 0:
            banner = None
            try:
                sock.settimeout(1)
                if port in (80, 443, 8080, 8443):
                    sock.send(b"HEAD / HTTP/1.1\r\nHost: " + str(ip).encode() + b"\r\n\r\n")
                banner = sock.recv(1024).decode(errors="ignore").strip()
            except Exception:
                pass
            return port, banner

        sock.close()
        return port, None

    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {
            executor.submit(scan_port, port): port
            for port in ports
        }
        for future in as_completed(futures):
            port, banner = future.result()
            if banner is not None:
                service = COMMON_SERVICES.get(port, "Unknown")
                open_ports[port] = {
                    "service": service,
                    "banner": banner
                }

    return open_ports

def os_fingerprint(ip, timeout=2):
    """Simple OS fingerprinting based on TTL and port behavior"""
    # Check TTL from ping
    import subprocess
    param = "-n" if subprocess.os.name == "nt" else "-c"
    try:
        result = subprocess.run(
            ["ping", param, "1", "-W", str(timeout), str(ip)],
            capture_output=True, text=True, timeout=timeout + 1
        )
        # Parse TTL from output
        for line in result.stdout.split("\n"):
            if "ttl=" in line:
                ttl = int(line.split("ttl=")[1].split()[0])
                if ttl <= 64:
                    return "Linux/Unix"
                elif ttl <= 128:
                    return "Windows"
                else:
                    return "Network Device"
    except Exception:
        pass
    return "Unknown"

def build_network_map(network, top_ports=100):
    """Build a complete map of the network"""
    net = ipaddress.ip_network(network, strict=False)
    hosts = []

    # Top N most common ports
    common_ports = sorted(COMMON_SERVICES.keys())[:top_ports]

    # Host discovery
    print(f"Discovering hosts on {network}...")
    live_hosts = []

    with ThreadPoolExecutor(max_workers=200) as executor:
        futures = {}
        for ip in net.hosts():
            for port in [22, 80, 443, 445]:
                futures[executor.submit(tcp_ping, str(ip), port)] = str(ip)

        found = set()
        for future in as_completed(futures):
            ip = futures[future]
            if future.result() and ip not in found:
                found.add(ip)
                live_hosts.append(ip)

    print(f"Found {len(live_hosts)} live hosts")

    # Scan each host
    for ip in sorted(live_hosts):
        print(f"\nScanning {ip}...")
        hostname = resolve_hostname(ip)
        os_guess = os_fingerprint(ip)
        open_ports = scan_host(ip, common_ports)

        host_info = HostInfo(
            ip=ip,
            hostname=hostname,
            mac=None,
            os_guess=os_guess,
            ports=open_ports
        )
        hosts.append(host_info)

        if hostname:
            print(f"  Hostname: {hostname}")
        if os_guess:
            print(f"  OS: {os_guess}")
        for port, info in sorted(open_ports.items()):
            print(f"  Port {port}: {info['service']}")

    return hosts

# Usage
network_map = build_network_map("192.168.1.0/24", top_ports=20)
```

## Scan Optimization

Scanning a /24 network (256 hosts) across 1024 ports means 262,144 connection attempts. At 1 second timeout each, that's over 72 hours. Real scanners optimize.

### Timing Options

```python
class ScanTiming:
    """Timing templates similar to nmap"""
    TEMPLATES = {
        "aggressive": {"timeout": 0.5, "threads": 500, "retries": 0},
        "normal":     {"timeout": 2,   "threads": 100, "retries": 1},
        "polite":     {"timeout": 5,   "threads": 20,  "retries": 2},
        "sneaky":     {"timeout": 10,  "threads": 10,  "retries": 3},
    }

    def __init__(self, template="normal"):
        config = self.TEMPLATES.get(template, self.TEMPLATES["normal"])
        self.timeout = config["timeout"]
        self.threads = config["threads"]
        self.retries = config["retries"]
```

### Port Selection

Don't scan all 65,535 ports. Scan the top 100 or 1000 most common ports first:

```python
TOP_100_PORTS = [
    7, 9, 13, 21, 22, 23, 25, 26, 37, 53, 79, 80, 81, 88, 106,
    110, 111, 113, 119, 135, 139, 143, 144, 179, 199, 254, 255,
    280, 311, 389, 427, 443, 444, 445, 465, 500, 512, 513, 514,
    515, 524, 541, 548, 554, 563, 587, 593, 625, 631, 636, 646,
    787, 808, 873, 902, 990, 993, 995, 1000, 1022, 1025, 1026,
    1027, 1028, 1029, 1030, 1080, 1099, 1110, 1433, 1434, 1521,
    1720, 1723, 1755, 1900, 2000, 2001, 2049, 2100, 2103, 2121,
    2199, 2717, 2869, 2967, 3000, 3001, 3128, 3268, 3306, 3389,
    3986, 4000, 4001, 4443, 4444, 4899, 5000, 5001, 5003, 5009,
    5051, 5060, 5101, 5190, 5357, 5432, 5555, 5631, 5666, 5800,
]
```

### Batch Scanning

Instead of scanning one port at a time, batch ports and send multiple probes:

```python
def batch_scan(target, ports, batch_size=50, timeout=2):
    """Scan ports in batches for efficiency"""
    results = []

    for i in range(0, len(ports), batch_size):
        batch = ports[i:i + batch_size]
        with ThreadPoolExecutor(max_workers=len(batch)) as executor:
            futures = {
                executor.submit(scan_port, target, port, timeout): port
                for port in batch
            }
            for future in as_completed(futures):
                port, is_open = future.result()
                if is_open:
                    results.append(port)

    return results
```

## Assessment

### Lab Task: Network Mapper

Build a network discovery and mapping tool. Time limit: 120 minutes.

**Requirements:**
1. Accept a CIDR network range via command line (e.g., `192.168.1.0/24`)
2. Perform host discovery (ping sweep + TCP probe fallback)
3. Scan discovered hosts for top 100 ports
4. Grab banners and identify services
5. Attempt OS fingerprint based on TTL
6. Generate a report showing all discovered hosts, open ports, and services
7. Support timing templates (aggressive, normal, polite)
8. Output in JSON and human-readable format

**Deliverables:**
- Source code (`netmap.py`)
- Scan results from your local network (or test network)
- JSON output file

**Grading Criteria:**
- Host discovery works (25 points)
- Port scanning is threaded and reasonably fast (25 points)
- Service identification works (20 points)
- OS fingerprinting attempts work (15 points)
- Output formatting is clean (15 points)

### Bonus Challenges

- Implement UDP port scanning for top 20 UDP ports
- Add MAC address resolution via ARP
- Detect virtual machines based on MAC address prefixes
- Implement scan evasion techniques (fragmented packets, source port decoys)

## Common Scanning Pitfalls

Network scanning looks simple but has subtle pitfalls that produce incorrect results. Understanding these pitfalls prevents wasted time and false conclusions.

The most common mistake is scanning through a VPN or proxy. When you scan through a VPN, all traffic goes through the VPN tunnel. The target sees the VPN's IP address, not yours. Firewall rules might block the VPN's IP range but allow yours. The VPN might compress or encrypt packets, breaking banner grabbing. Always scan from the same network context you'll use in production.

The second mistake is ignoring firewalls and intrusion detection systems. A SYN scan that works on your local network might produce completely different results through a corporate firewall. The firewall might drop SYN packets but allow established connections. It might rate-limit connections, causing your fast scan to miss open ports. It might inject RST packets, making closed ports appear open. Understanding the network path between you and the target is essential for interpreting results correctly.

The third mistake is assuming all ports behave the same way. Port 80 (HTTP) responds differently than port 22 (SSH). Port 53 (DNS) uses UDP, not TCP. Port 443 (HTTPS) might require specific TLS ClientHello messages. Some services only respond to specific probes: MySQL responds to a login attempt, not a blank connection. Effective scanning requires protocol-specific logic for different port ranges.

The fourth mistake is scanning too fast. Aggressive scanning triggers intrusion detection systems, overwhelms target services, and produces unreliable results. Network devices have有限 bandwidth and processing capacity. Scanning a /24 network at maximum speed sends thousands of packets per second. This triggers rate limiting, packet loss, and false negatives. The solution is rate limiting your scanner and adjusting speed based on target response.

## Evidence

Network scanning is the foundation of penetration testing and network defense. You can't secure what you don't know exists. The tools you built here: host discovery, port scanning, service fingerprinting: are the same tools commercial scanners use, just less polished.

The key insight is that scanning is a series of tradeoffs: speed vs. stealth, thoroughness vs. reliability, accuracy vs. noise. Understanding these tradeoffs matters more than memorizing commands.

**Libraries covered:** socket, scapy, subprocess, ipaddress, concurrent.futures, dataclasses

**Concepts covered:** TCP/UDP scanning, SYN/FIN/XMAS/NULL scans, banner grabbing, service fingerprinting, OS detection, host discovery, network mapping, scan timing