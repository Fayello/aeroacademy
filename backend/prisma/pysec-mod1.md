# Module 1 — Python for Security: Getting Started

You already know Python. You've written scripts, maybe automated some tasks, maybe even built a web app or two. Now you want to use it for security work. This module gets you from "I know Python" to "I can build security tools with Python" without wasting your time on basics you already understand.

The security world runs on Python. Nmap has Python bindings. Scapy is Python. Metasploit modules are Ruby, but half the ecosystem around them is Python. Vulnerability scanners, packet analyzers, exploit frameworks, automation scripts — Python is the lingua franca of offensive and defensive security tooling. Not because it's the fastest language, but because it's the fastest language to prototype in, and in security you almost always need to prototype fast.

## Setting Up Your Environment

Stop using your system Python. Right now. If you're running `sudo pip install` on your main Python installation, you're one dependency conflict away from breaking your system. Virtual environments exist for a reason.

```bash
# Create a project directory
mkdir security-tools && cd security-tools

# Create a virtual environment
python3 -m venv venv

# Activate it (Linux/Mac)
source venv/bin/activate

# Activate it (Windows)
venv\Scripts\activate

# Upgrade pip inside the venv
pip install --upgrade pip
```

Once activated, your shell prompt changes. Every `pip install` now goes into this isolated environment. Your system Python stays clean. If you mess up the venv, delete it and create a new one. No harm done.

For managing multiple Python versions, pyenv is your friend. Security tools sometimes need specific Python versions — Python 3.8 for legacy tools, Python 3.11+ for modern features. pyenv lets you install multiple versions side by side without touching your system Python.

```bash
# Install pyenv (Linux)
curl https://pyenv.run | bash

# Install a specific Python version
pyenv install 3.11.4

# Set it as local version for your project
pyenv local 3.11.4
```

Windows users: the Python installer from python.org handles multiple versions fine. Just pay attention to the PATH options during installation.

## Package Management That Won't Betray You

`pip install` is simple. `pip install -r requirements.txt` is better. But pin your versions. Unpinned dependencies are how you get "it worked on my machine" and also how supply chain attacks happen.

```bash
# Generate pinned requirements
pip freeze > requirements.txt

# Install from pinned requirements
pip install -r requirements.txt
```

For new projects, consider using `pip-tools` to separate your direct dependencies from your transitive ones:

```bash
pip install pip-tools

# Create a requirements.in with your direct dependencies
echo "requests>=2.31.0" > requirements.in
echo "scapy>=2.5.0" >> requirements.in

# Compile to a pinned requirements.txt
pip-compile requirements.in
```

This gives you a `requirements.txt` with every transitive dependency pinned to exact versions, while your `requirements.in` stays readable with version ranges.

Poetry is another option if you want a more integrated workflow. It handles virtual environments, dependency resolution, and packaging in one tool. For security tool development where you might eventually want to distribute your tool, Poetry is worth the learning curve.

```bash
# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Create a new project
poetry new network-scanner

# Add dependencies
poetry add requests scapy
```

## Essential Libraries for Security Work

You don't need to memorize every security library. You need maybe fifteen libraries that cover 90% of security work. Here are the ones that matter.

### requests — HTTP Made Bearable

The `requests` library is how you talk to web servers. Every web vulnerability scanner, every API testing tool, every web automation script uses it. It handles sessions, cookies, headers, authentication, redirects — everything the `urllib` module makes you fight for.

```python
import requests

# Basic GET request
response = requests.get("https://example.com")
print(response.status_code)
print(response.headers)
print(response.text)

# POST with data
response = requests.post(
    "https://example.com/login",
    data={"username": "admin", "password": "password123"},
    allow_redirects=False  # Don't follow redirects — useful for testing
)

# Custom headers
headers = {
    "User-Agent": "Mozilla/5.0 (Security Testing)",
    "X-Custom-Header": "test"
}
response = requests.get("https://example.com", headers=headers)

# Handle SSL verification (for testing only — never disable in production)
response = requests.get("https://self-signed.example.com", verify=False)

# Timeouts — always set them
response = requests.get("https://example.com", timeout=5)
```

The `verify=False` option disables SSL certificate verification. You'll use it constantly during testing when targets have self-signed or expired certificates. But never leave it in production code. Set up a warning suppressor for it:

```python
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
```

### scapy — Packet Crafting and Analysis

Scapy is the Swiss Army knife of network security. It can craft packets, send them, capture responses, and dissect what comes back. It operates at every layer of the network stack — Ethernet, IP, TCP, UDP, HTTP, DNS, whatever you need.

```python
from scapy.all import *

# Craft a simple TCP SYN packet
packet = IP(dst="192.168.1.1") / TCP(dport=80, flags="S")
print(packet.show())

# Send and capture response
answer = sr1(packet, timeout=2, verbose=0)
if answer:
    print(f"Port 80 state: {answer[TCP].flags}")

# Sniff packets
packets = sniff(filter="tcp port 443", count=10)
for pkt in packets:
    pkt.show()
```

Scapy's power is in its layer model. You stack protocol layers with the `/` operator. Want an IP packet with a TCP segment carrying an HTTP request? Just stack them:

```python
from scapy.all import *

packet = (
    IP(dst="10.0.0.1") /
    TCP(dport=80, flags="PA") /
    "GET / HTTP/1.1\r\nHost: example.com\r\n\r\n"
)
```

The learning curve is real. Scapy's documentation is dense and examples are scattered. But once it clicks, you'll wonder how you ever worked without it.

### socket — Raw Network Programming

The `socket` module is built into Python. No installation needed. It gives you low-level access to network connections — TCP, UDP, raw sockets. When you need to talk to a server at a protocol level that `requests` can't handle, you reach for sockets.

```python
import socket

# TCP connection
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(3)
try:
    sock.connect(("192.168.1.1", 22))
    banner = sock.recv(1024)
    print(f"Banner: {banner.decode().strip()}")
except socket.timeout:
    print("Connection timed out")
finally:
    sock.close()

# UDP
udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp_sock.settimeout(2)
udp_sock.sendto(b"test", ("192.168.1.1", 53))
try:
    data, addr = udp_sock.recvfrom(1024)
    print(f"Response from {addr}: {data}")
except socket.timeout:
    print("No response")
finally:
    udp_sock.close()
```

### Additional Libraries Worth Installing

```bash
pip install requests scapy python-nmap beautifulsoup4 paramiko pwntools lxml ipwhois
```

- **python-nmap**: Python bindings for nmap. Parse nmap XML output, run scans programmatically.
- **beautifulsoup4**: HTML parsing. When you need to scrape web pages and extract specific elements.
- **paramiko**: SSH client library. Automate SSH sessions, run remote commands, transfer files.
- **pwntools**: CTF and exploit development toolkit. Buffer overflows, format string bugs, ROP chains.
- **lxml**: Fast XML/HTML parser. BeautifulSoup uses it as a backend.
- **ipwhois**: WHOIS lookups. Get registration info for IP addresses.

## Understanding the Security Python Ecosystem

Before building tools, understand what's available. The security Python ecosystem is vast, and knowing which libraries exist saves you from reimplementing what's already been built.

Network security tools include scapy for packet crafting, python-nmap for nmap integration, and impacket for protocol implementations. Web security tools include requests for HTTP, beautifulsoup4 for HTML parsing, and selenium for browser automation. Forensic tools include pytsk for disk imaging and volatility3 for memory analysis. Exploit development uses pwntools for exploit crafting and capstone for disassembly.

The key insight is that these libraries are building blocks, not finished tools. You combine them to create tools specific to your needs. Nmap scans ports, but maybe you need a scanner that integrates with your ticketing system. Scapy captures packets, but maybe you need a tool that correlates packets with user identities. The library gives you the capability; you provide the integration.

When choosing libraries, prefer well-maintained projects with active communities. Check the GitHub repository for recent commits, open issues, and version releases. Abandoned libraries accumulate security vulnerabilities. The `cryptography` library is actively maintained by the Python Cryptographic Authority. Scapy has a dedicated community. Requests is one of the most downloaded Python packages. These are safe choices.

For package management, pin your dependencies. A `requirements.txt` without version numbers means `pip install` might pull a different version tomorrow than it does today. Use `pip freeze > requirements.txt` to capture exact versions. For new projects, consider `pip-tools` or Poetry for more sophisticated dependency management. The extra complexity pays off when you're debugging a mysterious import error three months from now.

## Your First Security Tool: A Port Scanner

Theory is nice. Let's build something. A port scanner is the canonical first security tool because it teaches you sockets, threading, error handling, and output formatting — all in one project.

### The Naive Approach

Start simple. One connection at a time:

```python
import socket

def scan_port(target, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex((target, port))
    sock.close()
    return result == 0

target = "192.168.1.1"
for port in range(1, 1025):
    if scan_port(target, port):
        print(f"Port {port}: OPEN")
```

`connect_ex` returns 0 on success, an error code on failure. It's cleaner than `connect` which raises exceptions. This works. It's also painfully slow. Scanning 1024 ports at one second timeout each = 17 minutes. That's unacceptable.

### Adding Threading

The fix is threading. Python's GIL limits CPU parallelism, but I/O-bound operations like network connections benefit enormously from threading:

```python
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

def scan_port(target, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex((target, port))
    sock.close()
    return port, result == 0

def scan_ports(target, ports, max_threads=100):
    open_ports = []
    with ThreadPoolExecutor(max_workers=max_threads) as executor:
        futures = {
            executor.submit(scan_port, target, port): port
            for port in ports
        }
        for future in as_completed(futures):
            port, is_open = future.result()
            if is_open:
                open_ports.append(port)
                print(f"Port {port}: OPEN")
    return sorted(open_ports)

target = "scanme.nmap.org"  # Nmap's official test target
ports = range(1, 1025)
open_ports = scan_ports(target, ports)
print(f"\nOpen ports: {open_ports}")
```

100 threads scanning 1024 ports completes in about 10 seconds instead of 17 minutes. That's the difference between a useful tool and a toy.

### Adding Service Detection

Knowing a port is open is only half the battle. What's running on it? Service detection grabs banners — the text a service sends when you connect:

```python
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

COMMON_SERVICES = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
    53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
    443: "HTTPS", 993: "IMAPS", 995: "POP3S",
    3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
    6379: "Redis", 8080: "HTTP-Alt", 8443: "HTTPS-Alt"
}

def scan_and_grab_banner(target, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)
    result = sock.connect_ex((target, port))

    if result != 0:
        sock.close()
        return port, False, None, None

    banner = None
    service = COMMON_SERVICES.get(port, "Unknown")

    try:
        # For HTTP, send a request to trigger a response
        if port in (80, 443, 8080, 8443):
            sock.send(b"HEAD / HTTP/1.1\r\nHost: " + target.encode() + b"\r\n\r\n")
        # For other services, just wait for a banner
        banner = sock.recv(1024).decode().strip()
    except socket.timeout:
        pass
    except Exception:
        pass
    finally:
        sock.close()

    return port, True, service, banner

def full_scan(target, ports, max_threads=100):
    results = []
    with ThreadPoolExecutor(max_workers=max_threads) as executor:
        futures = {
            executor.submit(scan_and_grab_banner, target, port): port
            for port in ports
        }
        for future in as_completed(futures):
            port, is_open, service, banner = future.result()
            if is_open:
                results.append((port, service, banner))
                print(f"Port {port}: OPEN | {service} | {banner or 'No banner'}")
    return sorted(results, key=lambda x: x[0])

target = "scanme.nmap.org"
ports = range(1, 1025)
results = full_scan(target, ports)

print(f"\n{'='*60}")
print(f"Scan Results for {target}")
print(f"{'='*60}")
for port, service, banner in results:
    print(f"Port {port:5d} | {service:12s} | {banner or 'No banner'}")
```

### Making It a Real Tool

A real tool needs command-line arguments, output formats, and error handling. Here's a more complete version:

```python
import socket
import argparse
import csv
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

COMMON_SERVICES = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
    53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
    443: "HTTPS", 993: "IMAPS", 995: "POP3S",
    3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
    6379: "Redis", 8080: "HTTP-Alt", 8443: "HTTPS-Alt"
}

def scan_and_grab_banner(target, port, timeout=2):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((target, port))

    if result != 0:
        sock.close()
        return port, False, None, None

    banner = None
    service = COMMON_SERVICES.get(port, "Unknown")

    try:
        if port in (80, 443, 8080, 8443):
            sock.send(b"HEAD / HTTP/1.1\r\nHost: " + target.encode() + b"\r\n\r\n")
        banner = sock.recv(1024).decode(errors="ignore").strip()
    except socket.timeout:
        pass
    except Exception:
        pass
    finally:
        sock.close()

    return port, True, service, banner

def parse_ports(port_spec):
    ports = set()
    for part in port_spec.split(","):
        if "-" in part:
            start, end = part.split("-", 1)
            ports.update(range(int(start), int(end) + 1))
        else:
            ports.add(int(part))
    return sorted(ports)

def main():
    parser = argparse.ArgumentParser(description="Port Scanner")
    parser.add_argument("target", help="Target IP or hostname")
    parser.add_argument("-p", "--ports", default="1-1024",
                       help="Ports to scan (e.g., 22,80,443 or 1-1024)")
    parser.add_argument("-t", "--threads", type=int, default=100,
                       help="Number of threads")
    parser.add_argument("-o", "--output", help="Output file")
    parser.add_argument("-f", "--format", choices=["text", "csv", "json"],
                       default="text", help="Output format")
    args = parser.parse_args()

    ports = parse_ports(args.ports)
    print(f"Scanning {args.target} ({len(ports)} ports)...")

    start_time = datetime.now()
    results = []

    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        futures = {
            executor.submit(scan_and_grab_banner, args.target, port): port
            for port in ports
        }
        for future in as_completed(futures):
            port, is_open, service, banner = future.result()
            if is_open:
                results.append({
                    "port": port,
                    "service": service,
                    "banner": banner
                })

    elapsed = (datetime.now() - start_time).total_seconds()
    results.sort(key=lambda x: x["port"])

    if args.output:
        if args.format == "json":
            with open(args.output, "w") as f:
                json.dump(results, f, indent=2)
        elif args.format == "csv":
            with open(args.output, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["port", "service", "banner"])
                writer.writeheader()
                writer.writerows(results)
        else:
            with open(args.output, "w") as f:
                for r in results:
                    f.write(f"Port {r['port']:5d} | {r['service']:12s} | {r['banner'] or 'No banner'}\n")
        print(f"Results saved to {args.output}")
    else:
        print(f"\n{'='*60}")
        print(f"Open ports on {args.target}: {len(results)}")
        print(f"{'='*60}")
        for r in results:
            print(f"Port {r['port']:5d} | {r['service']:12s} | {r['banner'] or 'No banner'}")

    print(f"\nScan completed in {elapsed:.2f} seconds")

if __name__ == "__main__":
    main()
```

Run it:

```bash
python scanner.py scanme.nmap.org -p 22,80,443,8080
python scanner.py 192.168.1.1 -p 1-65535 -t 500 -o results.json -f json
```

## Python Version Considerations

Security tools often need to support multiple Python versions. Some legacy tools require Python 3.6 or 3.7. Modern tools use 3.10+ features like match/case and type unions. Know what you're targeting.

```python
import sys

# Check Python version at runtime
if sys.version_info < (3, 8):
    print("This tool requires Python 3.8 or higher")
    sys.exit(1)

# Version-specific features
if sys.version_info >= (3, 10):
    # Match/case syntax (Python 3.10+)
    match command:
        case "scan":
            do_scan()
        case "analyze":
            do_analyze()
else:
    # Fallback for older versions
    if command == "scan":
        do_scan()
    elif command == "analyze":
        do_analyze()
```

For cross-version compatibility, avoid f-strings before 3.6, walrus operator before 3.8, and match/case before 3.10. When writing tools for distribution, target 3.8+ — it's the oldest version still receiving security updates.

## Debugging Security Tools

Security tools fail in specific ways. Connections timeout, packets get dropped, responses are malformed. You need debugging techniques that work in these conditions.

### Logging Instead of Printing

```python
import logging

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("scanner_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Use throughout your code
logger.debug(f"Connecting to {target}:{port}")
logger.info(f"Port {port} is open")
logger.warning(f"Connection to {port} timed out")
logger.error(f"Failed to resolve {target}")
```

Logging is better than print statements because you can control verbosity, redirect to files, and filter by severity. When your tool breaks at 3 AM during an automated scan, the log file tells you exactly what happened.

### Testing with Known Targets

Before scanning unknown networks, test against known targets:

```python
# Test your scanner against yourself
import subprocess
import socket

# Start a simple server
server = subprocess.Popen(
    ["python", "-m", "http.server", "8888"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

# Test your scanner against it
time.sleep(1)  # Wait for server to start
scanner = PortScanner()
results = scanner.scan("127.0.0.1", ports="8888")
assert len(results) == 1, f"Expected 1 open port, got {len(results)}"
print("Self-test passed")

# Clean up
server.terminate()
```

### Remote Debugging

When your tool runs on a remote server and breaks, you need remote debugging:

```python
# Add a debug mode that outputs verbose information
def scan_with_debug(target, port, timeout=2):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)

    debug_info = {
        "target": target,
        "port": port,
        "timeout": timeout,
    }

    try:
        sock.connect((target, port))
        debug_info["result"] = "connected"
        debug_info["local_addr"] = sock.getsockname()
        debug_info["remote_addr"] = sock.getpeername()
    except socket.timeout:
        debug_info["result"] = "timeout"
    except ConnectionRefusedError:
        debug_info["result"] = "refused"
    except Exception as e:
        debug_info["result"] = f"error: {e}"
    finally:
        sock.close()

    return debug_info
```

## Putting It All Together

You now have the foundation. Python environment set up with virtual environments. Core libraries installed. Understanding of sockets, requests, and scapy. A working port scanner that you built from scratch.

The pattern repeats: import a library, understand its API, prototype a small script, harden it with error handling and threading, wrap it in a CLI with argparse. Every security tool follows this pattern.

## Security Tool Development Best Practices

Building security tools requires discipline that general software development doesn't demand. Your tools run in hostile environments. They interact with potentially malicious systems. They handle sensitive data like credentials and network topology. These conditions demand specific practices.

First, never hardcode credentials. Security tools often need authentication — API keys, passwords, tokens. Hardcoding them in source code means they end up in version control, where anyone with repository access can see them. Use environment variables or configuration files outside the repository. The `python-dotenv` library loads variables from a `.env` file that you keep out of version control with `.gitignore`.

Second, always set timeouts. A security tool without timeouts is a denial-of-service tool against your own system. Every network operation — socket connection, HTTP request, DNS lookup — needs a timeout. The timeout should be configurable because different environments have different latency characteristics. A tool that works fine on a local network might hang indefinitely when scanning a remote network over a satellite link.

Third, handle interrupts gracefully. Security tools run for minutes or hours. Users will hit Ctrl+C. If your tool doesn't handle the interrupt signal, it leaves orphaned processes, partially written files, and inconsistent state. Catch `KeyboardInterrupt`, clean up resources, and exit cleanly. Print a summary of what was completed before exiting.

Fourth, log everything. When your tool breaks at 3 AM during an automated scan, the log file is your only clue about what happened. Use Python's `logging` module, not `print` statements. Configure log levels so you can adjust verbosity without changing code. Write logs to files, not just stdout, because automated tools don't have terminals.

Fifth, test against known targets before scanning unknown ones. Start your port scanner against localhost to verify it works. Scan `scanme.nmap.org` to validate your implementation against a known-good target. Only then scan production networks. This practice catches bugs before they cause problems on real targets.

For the next module, we'll use these foundations to build more sophisticated network scanning tools with service fingerprinting and OS detection.

## Assessment

### Lab Task: Custom Port Scanner

Build a port scanner with the following requirements. Time limit: 90 minutes.

**Requirements:**
1. Accept target hostname or IP via command line
2. Accept port range (single port, comma-separated, or range)
3. Support at least 50 concurrent threads
4. Grab banners from open ports
5. Identify service names for at least 15 common ports
6. Output results in text and JSON format
7. Handle Ctrl+C gracefully
8. Set timeouts on all socket operations

**Deliverables:**
- Source code file (`scanner.py`)
- Screenshot of scan against `scanme.nmap.org`
- JSON output file with results

**Grading Criteria:**
- Correct port detection (30 points)
- Banner grabbing works (20 points)
- Threading doesn't crash (20 points)
- CLI arguments work (15 points)
- Output formatting (15 points)

### Bonus Challenges

- Add UDP scanning support
- Implement SYN scan using scapy (requires root)
- Add host discovery (ping sweep) before port scanning
- Write unit tests for your port parsing function

## Evidence

Port scanning is the reconnaissance phase of any security engagement. You map the attack surface before you attack it. The tools you build here will be extended throughout this course — the port scanner becomes a network mapper, the banner grabber becomes a service fingerprinter, and the threading model carries over to every concurrent tool you build.

Keep your `scanner.py` file. You'll iterate on it in Module 2 and Module 3.

**Libraries covered:** socket, requests, scapy, concurrent.futures, argparse, csv, json

**Concepts covered:** TCP connections, socket timeouts, banner grabbing, threaded scanning, CLI argument parsing, error handling for network operations