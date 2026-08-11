#!/usr/bin/env python3
"""Add TCP/IP Fundamentals lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# TCP/IP Fundamentals

### Learning Objectives
- Understand the TCP/IP model and its four layers
- Know the differences between TCP and UDP
- Identify common port numbers and their services
- Use netstat and ss to inspect network connections

### Section 1: The TCP/IP Model

| Layer | Name | Protocols | Description |
|-------|------|-----------|-------------|
| 4 | Application | HTTP, DNS, SSH, FTP, SMTP | User-facing services |
| 3 | Transport | TCP, UDP | End-to-end communication |
| 2 | Internet | IP, ICMP, ARP | Routing and addressing |
| 1 | Network Access | Ethernet, Wi-Fi | Physical transmission |

### Section 2: TCP vs UDP

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented | Connectionless |
| Reliability | Guaranteed delivery | Best-effort delivery |
| Ordering | Ordered | No ordering |
| Speed | Slower (overhead) | Faster (minimal overhead) |
| Use Cases | Web, email, file transfer | DNS, video streaming, gaming |

### Section 3: Common Ports

```bash
# Well-known ports
22   - SSH
25   - SMTP
53   - DNS
80   - HTTP
443  - HTTPS
3306 - MySQL
5432 - PostgreSQL
6379 - Redis
8080 - HTTP Alt
```

### Section 4: Inspecting Connections

```bash
# Show all listening ports
ss -tlnp

# Show established connections
ss -tnp state established

# Using netstat
netstat -tlnp
netstat -anp | grep ESTABLISHED

# Check specific port
ss -tlnp | grep :443
```

### Section 5: Network Interfaces

```bash
# Show interfaces
ip addr show

# Bring interface up/down
sudo ip link set eth0 up
sudo ip link set eth0 down

# Set IP address
sudo ip addr add 192.168.1.100/24 dev eth0

# Show routing table
ip route show

# Add static route
sudo ip route add 10.0.0.0/8 via 192.168.1.1
```

### Key Takeaways
- TCP/IP has four layers: Application, Transport, Internet, Network Access
- TCP provides reliable, ordered delivery; UDP is faster but unreliable
- Common ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL)
- Use ss and ip commands for modern network inspection

### References
1. "TCP/IP Illustrated" by W. Richard Stevens
2. [Linux ip command documentation](https://man7.org/linux/man-pages/man8/ip.8.html)
3. [ss command documentation](https://man7.org/linux/man-pages/man8/ss.8.html)"""

questions = [
    {"text": "Which TCP/IP layer handles HTTP, DNS, and SSH?", "answers": [
        {"text": "Transport", "isCorrect": False},
        {"text": "Internet", "isCorrect": False},
        {"text": "Application", "isCorrect": True},
        {"text": "Network Access", "isCorrect": False}
    ]},
    {"text": "What is the main difference between TCP and UDP?", "answers": [
        {"text": "TCP is faster", "isCorrect": False},
        {"text": "TCP provides reliable delivery, UDP is best-effort", "isCorrect": True},
        {"text": "UDP supports encryption", "isCorrect": False},
        {"text": "TCP is connectionless", "isCorrect": False}
    ]},
    {"text": "Which port is used by HTTPS?", "answers": [
        {"text": "80", "isCorrect": False},
        {"text": "443", "isCorrect": True},
        {"text": "8080", "isCorrect": False},
        {"text": "8443", "isCorrect": False}
    ]},
    {"text": "Which command shows listening TCP ports on modern Linux?", "answers": [
        {"text": "netstat -tlnp", "isCorrect": False},
        {"text": "ss -tlnp", "isCorrect": True},
        {"text": "ip ports", "isCorrect": False},
        {"text": "tcpdump ports", "isCorrect": False}
    ]},
    {"text": "What command shows the routing table?", "answers": [
        {"text": "ip route show", "isCorrect": True},
        {"text": "route list", "isCorrect": False},
        {"text": "ip addr show", "isCorrect": False},
        {"text": "netstat -r", "isCorrect": False}
    ]},
    {"text": "Which port does DNS typically use?", "answers": [
        {"text": "53", "isCorrect": True},
        {"text": "80", "isCorrect": False},
        {"text": "25", "isCorrect": False},
        {"text": "110", "isCorrect": False}
    ]}
]

lesson = {
    "title": "TCP/IP Fundamentals", "order": 1, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][0]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added TCP/IP Fundamentals lesson")
