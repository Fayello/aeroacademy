#!/usr/bin/env python3
"""Add iptables Fundamentals lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# iptables Fundamentals

### Learning Objectives
- Understand iptables chains and tables
- Create rules for input filtering and port blocking
- Configure NAT for port forwarding and masquerading
- Save and restore iptables rules

### Section 1: Tables and Chains

| Table | Purpose | Chains |
|-------|---------|--------|
| filter | Packet filtering (default) | INPUT, OUTPUT, FORWARD |
| nat | Network address translation | PREROUTING, OUTPUT, POSTROUTING |
| mangle | Packet modification | All chains |
| raw | Connection tracking bypass | PREROUTING, OUTPUT |

**Packet Flow:** PREROUTING -> ROUTING -> FORWARD/INPUT -> LOCAL PROCESS -> OUTPUT -> POSTROUTING

### Section 2: Basic Rules

```bash
# Show current rules
sudo iptables -L -n -v

# Allow all traffic (default policy)
sudo iptables -P INPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo iptables -P OUTPUT ACCEPT

# Drop all incoming traffic (lockdown mode)
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP

# Allow established connections
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow ICMP (ping)
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT
```

### Section 3: Rate Limiting and Anti-Brute-Force

```bash
# Rate limit SSH connections
sudo iptables -A INPUT -p tcp --dport 22 \\
    -m conntrack --ctstate NEW \\
    -m recent --set --name SSH

sudo iptables -A INPUT -p tcp --dport 22 \\
    -m conntrack --ctstate NEW \\
    -m recent --update --seconds 60 --hitcount 4 --name SSH -j DROP

# Limit new connections per IP
sudo iptables -A INPUT -p tcp --dport 443 \\
    -m connlimit --connlimit-above 50 --connlimit-mask 32 -j DROP
```

### Section 4: NAT Configuration

```bash
# Enable IP forwarding
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward

# Masquerade (hide internal network)
sudo iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE

# Port forwarding (8080 -> internal:80)
sudo iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 192.168.1.10:80
sudo iptables -A FORWARD -p tcp -d 192.168.1.10 --dport 80 -j ACCEPT
```

### Section 5: Save and Restore

```bash
# Save rules (Debian/Ubuntu)
sudo iptables-save > /etc/iptables/rules.v4
sudo ip6tables-save > /etc/iptables/rules.v6

# Restore rules
sudo iptables-restore < /etc/iptables/rules.v4

# Install persistence package
sudo apt install iptables-persistent
```

### Key Takeaways
- iptables uses tables (filter, nat, mangle) and chains (INPUT, OUTPUT, FORWARD)
- Default policies determine what happens to unmatched traffic
- Rate limiting protects against brute-force attacks
- NAT enables masquerading and port forwarding
- Always save rules for persistence across reboots

### References
1. [iptables man page](https://man7.org/linux/man-pages/man8/iptables.8.html)
2. [Linux Firewalls by Steve Suehring](https://www.netfilter.org/)
3. [iptables Tutorial](https://www.frozentux.net/iptables-tutorial/)"""

questions = [
    {"text": "Which iptables table handles packet filtering?", "answers": [
        {"text": "nat", "isCorrect": False},
        {"text": "mangle", "isCorrect": False},
        {"text": "filter", "isCorrect": True},
        {"text": "raw", "isCorrect": False}
    ]},
    {"text": "What does the -A flag do in iptables?", "answers": [
        {"text": "Append a rule", "isCorrect": True},
        {"text": "Delete a rule", "isCorrect": False},
        {"text": "List all rules", "isCorrect": False},
        {"text": "Apply a rule", "isCorrect": False}
    ]},
    {"text": "Which chain handles incoming packets destined for the local system?", "answers": [
        {"text": "FORWARD", "isCorrect": False},
        {"text": "OUTPUT", "isCorrect": False},
        {"text": "INPUT", "isCorrect": True},
        {"text": "PREROUTING", "isCorrect": False}
    ]},
    {"text": "What does iptables MASQUERADE do?", "answers": [
        {"text": "Blocks all traffic", "isCorrect": False},
        {"text": "Hides internal IP addresses behind the router", "isCorrect": True},
        {"text": "Encrypts network traffic", "isCorrect": False},
        {"text": "Logs all connections", "isCorrect": False}
    ]},
    {"text": "Which command saves iptables rules?", "answers": [
        {"text": "iptables save", "isCorrect": False},
        {"text": "iptables-save > file", "isCorrect": True},
        {"text": "iptables -save", "isCorrect": False},
        {"text": "iptables store", "isCorrect": False}
    ]},
    {"text": "What does -m conntrack --ctstate ESTABLISHED,RELATED match?", "answers": [
        {"text": "New connections only", "isCorrect": False},
        {"text": "Packets belonging to existing or related connections", "isCorrect": True},
        {"text": "All packets", "isCorrect": False},
        {"text": "Invalid packets", "isCorrect": False}
    ]}
]

lesson = {
    "title": "iptables Fundamentals", "order": 1, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][1]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added iptables Fundamentals lesson")
