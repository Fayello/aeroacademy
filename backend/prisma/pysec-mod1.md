# Module 1 — Python for Security: Getting Started

## What You'll Actually Do

Set up a Python environment tuned for security work. By the end you'll have a working toolkit, know where things live, and understand why Python dominates security automation.

## Why Python for Security

Every major security tool is written in or heavily uses Python. Metasploit modules, Nmap scripts, Scapy, Burp extensions, Volatility plugins — all Python. The language's standard library covers networking, file I/O, cryptography, and process management out of the box. You don't need a CS degree to glue these pieces together.

Python reads like pseudocode. When you're under pressure during an incident or trying to reverse-engineer a protocol at 2 AM, that readability matters.

## Environment Setup

```bash
# Install Python 3.12+
sudo apt update && sudo apt install python3 python3-pip python3-venv -y

# Create an isolated environment for security work
mkdir ~/pysec && cd ~/pysec
python3 -m venv venv
source venv/bin/activate

# Core packages you'll actually use
pip install scapy requests beautifulsoup4 pycryptodome volatility3 yara-python pwntools
```

### Project structure

```
pysec/
├── venv/
├── modules/
│   ├── scanning/
│   ├── analysis/
│   ├── exploits/
│   └── forensics/
├── utils/
│   └── helpers.py
└── lab/
    └── targets/
```

Keep your tools organized from day one. Dumping scripts in one flat directory becomes unmanageable fast.

## Python Basics for Security

### Strings and bytes — the #1 gotcha

```python
# Network data comes in as bytes, not strings
raw = b'\x48\x54\x54\x50\x2f\x31\x2e\x31'  # "HTTP/1.1"
decoded = raw.decode('utf-8')
print(decoded)  # HTTP/1.1

# Encoding payloads
shellcode = b'\x90\x90\xcc\xint3'
encoded = shellcode.hex()
print(encoded)  # 9090cc int3

# Working with Base64 (common in malware analysis)
import base64
encoded = base64.b64decode('aGVsbG8gd29ybGQ=')
print(encoded)  # b'hello world'
```

### Working with files at scale

```python
import os

# Read a wordlist for brute-force testing
def load_wordlist(path):
    with open(path, 'r', errors='ignore') as f:
        return [line.strip() for line in f if line.strip()]

# Walk a directory tree looking for suspicious files
def find_executables(root):
    suspicious = []
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            if f.endswith(('.exe', '.dll', '.scr', '.bat', '.ps1')):
                suspicious.append(os.path.join(dirpath, f))
    return suspicious
```

### Subprocess — running system tools from Python

```python
import subprocess

# Run nmap and capture output
def quick_scan(target):
    result = subprocess.run(
        ['nmap', '-sn', target],
        capture_output=True, text=True
    )
    return result.stdout

# Run a command with error handling
def run_cmd(cmd):
    try:
        out = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return out.stdout, out.stderr
    except subprocess.TimeoutExpired:
        return '', 'Command timed out'
```

### Regex — your Swiss Army knife

```python
import re

# Extract IP addresses from a log
log = "Connection from 192.168.1.105 rejected by firewall at 10.0.0.1"
ips = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', log)
print(ips)  # ['192.168.1.105', '10.0.0.1']

# Parse Nmap output for open ports
nmap_output = "22/tcp open  ssh\n80/tcp open  http\n443/tcp open  https"
open_ports = re.findall(r'(\d+)/tcp\s+open', nmap_output)
print(open_ports)  # ['22', '80', '443']

# Extract email addresses from breach data
emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', data)
```

### Virtual environments — non-negotiable

Never install security tools system-wide. A broken pip dependency in a shared system Python can take down production tools. Always use venvs.

```bash
# Activate your environment before any work
source venv/bin/activate

# Freeze your environment so you can reproduce it
pip freeze > requirements.txt

# Reproduce on another machine
pip install -r requirements.txt
```

## Your First Security Script

```python
#!/usr/bin/env python3
"""Simple banner grabber — the hello world of network security."""
import socket

def grab_banner(host, port, timeout=2):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect((host, port))
        s.send(b'HEAD / HTTP/1.0\r\nHost: ' + host.encode() + b'\r\n\r\n')
        banner = s.recv(1024)
        s.close()
        return banner.decode(errors='ignore')
    except Exception as e:
        return f"Error: {e}"

if __name__ == '__main__':
    import sys
    host = sys.argv[1] if len(sys.argv) > 1 else 'scanme.nmap.org'
    print(grab_banner(host, 80))
```

## Assessment

**Lab Task — Build your environment and run your first tool (45 minutes)**

1. Set up a Python venv on your machine or in a Kali VM
2. Install the packages listed above
3. Write a script that takes a target IP/hostname and port from command-line arguments and attempts a banner grab
4. Test against `scanme.nmap.org` (authorized target)
5. Extend the script to scan ports 80, 443, 22, 21, and 25 and report which are open

**Grading:**
- Environment correctly set up with venv: 20 pts
- Script runs without errors: 30 pts
- Handles timeouts and connection refused gracefully: 20 pts
- Multi-port scan with clear output: 30 pts

## Evidence

Save the following in your lab directory:
- Screenshot of `pip freeze` showing installed packages
- The banner grabber script
- Terminal output showing results against `scanme.nmap.org`
- A brief note on any connection issues you hit and how you resolved them
