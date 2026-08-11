#!/usr/bin/env python3
"""Add Suricata IDS lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Suricata Intrusion Detection

### Learning Objectives
- Understand Suricata as a multi-threaded IDS/IPS
- Configure Suricata rules and detection engine
- Use EVE JSON logging for SIEM integration
- Compare Suricata vs Snort

### Section 1: Suricata vs Snort

| Feature | Suricata | Snort |
|---------|----------|-------|
| Threading | Multi-threaded | Single-threaded |
| Performance | Better on multi-core | Good on single core |
| Protocol Analysis | HTTP, TLS, DNS, SMB | Basic |
| Lua Scripting | Yes | No |
| Rule Compatibility | Snort rules | Native |

### Section 2: Installation

```bash
# Install Suricata
sudo apt install suricata

# Update rules
sudo suricata-update

# Verify installation
suricata --build-info
```

### Section 3: Configuration

```yaml
# /etc/suricata/suricata.yaml
stats:
  enabled: yes
  interval: 30

outputs:
  - fast:
      enabled: yes
      filename: fast.log
  - eve-log:
      enabled: yes
      filename: eve.json
      types:
        - alert
        - http
        - dns
        - tls
        - files
  - unified2:
      enabled: no

af-packet:
  - interface: eth0
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes

detect:
  profile: medium
  sgh-mpm-context: auto

mpm-algo: auto
spm-algo: auto
```

### Section 4: Rule Writing

```bash
# /etc/suricata/rules/local.rules

# Detect malicious User-Agent
alert http any any -> any any (msg:"Malicious User-Agent"; \
    http.header; content:"curl"; nocase; \
    sid:2000001; rev:1;)

# Detect SMB exploits
alert smb any any -> any any (msg:"SMB Vulnerability Exploit"; \
    flow:to_server; content:"|FF|SMB"; depth:4; \
    byte_test:1,&,0x80,4; \
    sid:2000002; rev:1;)

# Detect DNS exfiltration
alert dns any any -> any any (msg:"Possible DNS Exfiltration"; \
    dns.query; pcre:"/^[a-z0-9]{30,}\.[a-z]+$/"; \
    sid:2000003; rev:1;)
```

### Section 5: EVE JSON for SIEM Integration

```bash
# Query EVE JSON with jq
cat /var/log/suricata/eve.json | jq 'select(.event_type=="alert")'
cat /var/log/suricata/eve.json | jq 'select(.event_type=="http")'

# Filter by alert severity
cat /var/log/suricata/eve.json | jq 'select(.alert.severity <= 2)'
```

### Section 6: Running Suricata

```bash
# Test configuration
sudo suricata -T -c /etc/suricata/suricata.yaml

# Run in IDS mode
sudo suricata -c /etc/suricata/suricata.yaml -i eth0

# Run as service
sudo systemctl start suricata
sudo systemctl enable suricata

# Update rules
sudo suricata-update
sudo systemctl restart suricata
```

### Key Takeaways
- Suricata offers multi-threaded performance advantages over Snort
- EVE JSON provides structured logging ideal for SIEM integration
- af-packet provides zero-copy packet capture for high performance
- Suricata is compatible with Snort rules
- Regular rule updates via suricata-update are essential

### References
1. [Suricata Documentation](https://suricata.readthedocs.io/)
2. [Suricata Rule Writing](https://suricata.readthedocs.io/en/latest/rules/)
3. [EVE JSON Format](https://suricata.readthedocs.io/en/latest/output/eve/eve-json-format.html)"""

questions = [
    {"text": "What is Suricata's main advantage over Snort?", "answers": [
        {"text": "Better rule syntax", "isCorrect": False},
        {"text": "Multi-threaded performance", "isCorrect": True},
        {"text": "Smaller binary size", "isCorrect": False},
        {"text": "More output formats", "isCorrect": False}
    ]},
    {"text": "What does suricata-update do?", "answers": [
        {"text": "Updates the Suricata binary", "isCorrect": False},
        {"text": "Downloads and installs latest detection rules", "isCorrect": True},
        {"text": "Updates the configuration file", "isCorrect": False},
        {"text": "Patches the kernel", "isCorrect": False}
    ]},
    {"text": "What logging format is recommended for SIEM integration?", "answers": [
        {"text": "fast.log", "isCorrect": False},
        {"text": "unified2", "isCorrect": False},
        {"text": "EVE JSON", "isCorrect": True},
        {"text": "syslog", "isCorrect": False}
    ]},
    {"text": "What does af-packet provide in Suricata?", "answers": [
        {"text": "Application filtering", "isCorrect": False},
        {"text": "Zero-copy packet capture", "isCorrect": True},
        {"text": "Auto-filter packets", "isCorrect": False},
        {"text": "Application firewall", "isCorrect": False}
    ]},
    {"text": "How do you test Suricata configuration syntax?", "answers": [
        {"text": "suricata --test", "isCorrect": False},
        {"text": "suricata -T -c config.yaml", "isCorrect": True},
        {"text": "suricata --validate", "isCorrect": False},
        {"text": "suricata -C config.yaml", "isCorrect": False}
    ]},
    {"text": "Can Suricata use Snort rules?", "answers": [
        {"text": "No, they are incompatible", "isCorrect": False},
        {"text": "Yes, Suricata is compatible with Snort rules", "isCorrect": True},
        {"text": "Only with a conversion tool", "isCorrect": False},
        {"text": "Only for basic rules", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Suricata Intrusion Detection", "order": 2, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][2]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Suricata Intrusion Detection lesson")
