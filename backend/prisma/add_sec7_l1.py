#!/usr/bin/env python3
"""Add Network Diagnostic Tools lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Network Diagnostic Tools

### Learning Objectives
- Master ping, traceroute, and mtr for connectivity testing
- Use curl and wget for HTTP debugging
- Debug DNS issues with dig and host
- Diagnose connection problems systematically

### Section 1: Connectivity Testing

```bash
# Basic ping
ping -c 4 8.8.8.8

# Ping with specific packet size
ping -s 1472 -M do 8.8.8.8  # Test MTU

# Traceroute
traceroute example.com
traceroute -T example.com  # Use TCP

# Real-time route analysis
mtr example.com
mtr -r -c 100 example.com  # Report mode
```

### Section 2: HTTP Debugging

```bash
# Verbose HTTP request
curl -v https://example.com

# Show response headers
curl -I https://example.com

# Follow redirects
curl -L https://example.com

# Custom headers
curl -H "Authorization: Bearer token" https://api.example.com

# POST with data
curl -X POST -d '{"key":"value"}' -H "Content-Type: application/json" https://api.example.com

# Download with wget
wget --no-check-certificate https://example.com/file.zip
wget -r -l 1 https://example.com/  # Recursive download
```

### Section 3: DNS Debugging

```bash
# Query specific DNS server
dig @8.8.8.8 example.com

# Check specific record type
dig example.com MX
dig example.com TXT

# Trace full resolution path
dig +trace example.com

# Reverse DNS lookup
dig -x 93.184.216.34

# Quick lookup
host example.com
```

### Section 4: Port and Connection Testing

```bash
# Test port connectivity
nc -zv 192.168.1.1 80
nc -zv 192.168.1.1 22

# Telnet to port
telnet 192.168.1.1 443

# Test SSL certificate
openssl s_client -connect example.com:443 -servername example.com

# Check what's listening
ss -tlnp | grep :80
lsof -i :80
```

### Section 5: Systematic Troubleshooting

```
Step 1: Verify physical/data link
  ip link show eth0

Step 2: Verify IP configuration
  ip addr show eth0

Step 3: Verify default gateway
  ip route show

Step 4: Test gateway connectivity
  ping <gateway-ip>

Step 5: Test DNS resolution
  dig example.com

Step 6: Test remote host connectivity
  ping <remote-ip>

Step 7: Test specific service
  curl -v https://example.com
  nc -zv example.com 443
```

### Key Takeaways
- mtr combines ping and traceroute for comprehensive path analysis
- curl -v provides detailed HTTP request/response debugging
- dig +trace shows the complete DNS resolution path
- Always test from physical layer up to application layer
- nc and openssl are invaluable for testing specific services

### References
1. [curl Documentation](https://curl.se/docs/)
2. [dig man page](https://man7.org/linux/man-pages/man1/dig.1.html)
3. [mtr documentation](https://www.bitwizard.nl/mtr/)"""

questions = [
    {"text": "What does mtr combine into a single tool?", "answers": [
        {"text": "ping and curl", "isCorrect": False},
        {"text": "ping and traceroute", "isCorrect": True},
        {"text": "dig and host", "isCorrect": False},
        {"text": "ss and netstat", "isCorrect": False}
    ]},
    {"text": "What curl flag follows HTTP redirects?", "answers": [
        {"text": "-v", "isCorrect": False},
        {"text": "-I", "isCorrect": False},
        {"text": "-L", "isCorrect": True},
        {"text": "-k", "isCorrect": False}
    ]},
    {"text": "What does dig +trace show?", "answers": [
        {"text": "Only the final answer", "isCorrect": False},
        {"text": "The complete DNS resolution path from root servers", "isCorrect": True},
        {"text": "DNS server configuration", "isCorrect": False},
        {"text": "Network latency to DNS servers", "isCorrect": False}
    ]},
    {"text": "What is the correct order for systematic network troubleshooting?", "answers": [
        {"text": "Application -> Transport -> Network -> Link", "isCorrect": False},
        {"text": "Physical -> Link -> Network -> Transport -> Application", "isCorrect": True},
        {"text": "DNS -> Gateway -> Host -> Service", "isCorrect": False},
        {"text": "Service -> Protocol -> Network -> Physical", "isCorrect": False}
    ]},
    {"text": "What command tests SSL certificate validity?", "answers": [
        {"text": "curl -I", "isCorrect": False},
        {"text": "openssl s_client -connect host:443", "isCorrect": True},
        {"text": "dig +short host", "isCorrect": False},
        {"text": "nc -zv host 443", "isCorrect": False}
    ]},
    {"text": "What curl flag shows verbose request/response headers?", "answers": [
        {"text": "-d", "isCorrect": False},
        {"text": "-H", "isCorrect": False},
        {"text": "-v", "isCorrect": True},
        {"text": "-x", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Network Diagnostic Tools", "order": 1, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][3]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Network Diagnostic Tools lesson")
