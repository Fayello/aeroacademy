#!/usr/bin/env python3
"""Add Snort IDS lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Snort Intrusion Detection

### Learning Objectives
- Install and configure Snort as an IDS/IPS
- Write custom Snort rules for network monitoring
- Analyze Snort alerts and logs
- Integrate Snort with logging infrastructure

### Section 1: Snort Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Sniffer | Reads packets and displays them | Real-time debugging |
| Packet Logger | Logs packets to disk | Forensics |
| NIDS | Network intrusion detection | Production monitoring |
| NIPS | Network intrusion prevention | Inline blocking |

### Section 2: Installation and Basic Configuration

```bash
# Install Snort
sudo apt install snort

# Verify installation
snort --version

# Test in sniffer mode
sudo snort -v -i eth0

# Test in packet logger mode
sudo snort -dev -l /var/log/snort
```

### Section 3: NIDS Configuration

```bash
# /etc/snort/snort.conf
# Set network variables
var HOME_NET 192.168.1.0/24
var EXTERNAL_NET !$HOME_NET

# Configure rules
include /etc/snort/rules/local.rules
include /etc/snort/rules/community.rules

# Output plugins
output unified2: filename snort.log, limit 128
```

### Section 4: Writing Custom Rules

```bash
# /etc/snort/rules/local.rules

# Detect SSH brute force
alert tcp any any -> $HOME_NET 22 (msg:"SSH Brute Force Attempt"; \
    flags:S; threshold:type threshold, track by_src, count 5, seconds 60; \
    sid:1000001; rev:1;)

# Detect SQL injection attempts
alert http any any -> $HOME_NET 80 (msg:"SQL Injection Attempt"; \
    content:"SELECT"; nocase; content:"FROM"; nocase; \
    content:"UNION"; nocase; \
    sid:1000002; rev:1;)

# Detect port scanning
alert tcp any any -> $HOME_NET any (msg:"Port Scan Detected"; \
    flags:S; threshold:type threshold, track by_src, count 20, seconds 10; \
    sid:1000003; rev:1;)

# Detect DNS tunneling
alert udp any any -> any 53 (msg:"Possible DNS Tunneling"; \
    content:"|01 00|"; depth:2; byte_test:1,>,12,2; \
    sid:1000004; rev:1;)
```

### Section 5: Running Snort as NIDS

```bash
# Run Snort with specific configuration
sudo snort -c /etc/snort/snort.conf -i eth0 -A fast

# Daemon mode
sudo snort -c /etc/snort/snort.conf -i eth0 -D

# Check Snort status
sudo systemctl status snort
```

### Section 6: Analyzing Alerts

```bash
# View alert log
tail -f /var/log/snort/alert

# Parse unified2 logs
sudo snort -r /var/log/snort/snort.log.1234567890 -c /etc/snort/snort.conf

# Use Barnyard2 for log processing
sudo barnyard2 -c /etc/snort/barnyard2.conf -d /var/log/snort -w /var/log/snort/barnyard2
```

### Key Takeaways
- Snort can operate in sniffer, logger, IDS, or IPS mode
- Custom rules enable detection of specific attack patterns
- Threshold-based rules prevent alert flooding
- Unified2 format provides detailed packet logging
- Regular rule updates are essential for effective detection

### References
1. [Snort Documentation](https://www.snort.org/documents)
2. [Snort Rules Tutorial](https://www.snort.org/documents#11)
3. [Oinkmaster for rule updates](https://oisf.net/idspup/)"""

questions = [
    {"text": "What Snort mode runs inline and can block packets?", "answers": [
        {"text": "NIDS", "isCorrect": False},
        {"text": "Sniffer", "isCorrect": False},
        {"text": "NIPS", "isCorrect": True},
        {"text": "Packet Logger", "isCorrect": False}
    ]},
    {"text": "What does the threshold directive in Snort rules do?", "answers": [
        {"text": "Limits alert frequency", "isCorrect": True},
        {"text": "Sets packet capture size", "isCorrect": False},
        {"text": "Defines rule priority", "isCorrect": False},
        {"text": "Configures log rotation", "isCorrect": False}
    ]},
    {"text": "What format does Snort use for detailed packet logging?", "answers": [
        {"text": "syslog", "isCorrect": False},
        {"text": "unified2", "isCorrect": True},
        {"text": "CSV", "isCorrect": False},
        {"text": "JSON", "isCorrect": False}
    ]},
    {"text": "What does var HOME_NET define in snort.conf?", "answers": [
        {"text": "The external network to monitor", "isCorrect": False},
        {"text": "The internal network being protected", "isCorrect": True},
        {"text": "The Snort server IP", "isCorrect": False},
        {"text": "The log directory path", "isCorrect": False}
    ]},
    {"text": "Which flag in a Snort rule specifies the rule identifier?", "answers": [
        {"text": "rev:", "isCorrect": False},
        {"text": "msg:", "isCorrect": False},
        {"text": "sid:", "isCorrect": True},
        {"text": "class:", "isCorrect": False}
    ]},
    {"text": "What tool processes unified2 logs for database storage?", "answers": [
        {"text": "snort-log", "isCorrect": False},
        {"text": "Barnyard2", "isCorrect": True},
        {"text": "logparser", "isCorrect": False},
        {"text": "snortdb", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Snort Intrusion Detection", "order": 1, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][2]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Snort Intrusion Detection lesson")
