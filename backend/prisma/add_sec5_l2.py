#!/usr/bin/env python3
"""Add nftables Modern Firewall lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# nftables Modern Firewall

### Learning Objectives
- Understand nftables as the successor to iptables
- Write nftables rulesets with tables, chains, and rules
- Migrate from iptables to nftables
- Use nftables for packet filtering and NAT

### Section 1: nftables vs iptables

| Feature | iptables | nftables |
|---------|----------|----------|
| Performance | Slower (per-rule evaluation) | Faster (rule concatenation) |
| Syntax | Verbose | Cleaner, more consistent |
| Sets | Limited | Built-in, efficient |
| IPv4/IPv6 | Separate tools | Unified |
| Atomic ruleset | No | Yes |

### Section 2: Basic nftables Rules

```bash
# List all rules
sudo nft list ruleset

# Create a table and chain
sudo nft add table inet filter
sudo nft add chain inet filter input '{ type filter hook input priority 0; policy drop; }'

# Allow established connections
sudo nft add rule inet filter input ct state established,related accept

# Allow loopback
sudo nft add rule inet filter input iif lo accept

# Allow SSH
sudo nft add rule inet filter input tcp dport 22 accept

# Allow HTTP/HTTPS
sudo nft add rule inet filter input tcp dport { 80, 443 } accept

# Allow ICMP
sudo nft add rule inet filter input ip protocol icmp accept
```

### Section 3: Complete Ruleset File

```nft
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    set blacklist {
        type ipv4_addr
        flags timeout
        timeout 1h
    }

    chain input {
        type filter hook input priority 0; policy drop;

        # Allow established
        ct state established,related accept

        # Drop invalid
        ct state invalid drop

        # Loopback
        iif lo accept

        # Anti-spoofing
        iif != lo ip saddr 127.0.0.0/8 drop

        # Rate limit ICMP
        ip protocol icmp limit rate 10/second accept

        # Drop blacklisted IPs
        ip saddr @blacklist drop

        # SSH with rate limit
        tcp dport 22 ct state new limit rate 3/minute accept

        # HTTP/HTTPS
        tcp dport { 80, 443 } accept

        # Log and drop everything else
        limit rate 5/minute log prefix "DROPPED: " counter drop
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

### Section 4: NAT with nftables

```nft
table ip nat {
    chain prerouting {
        type nat hook prerouting priority -100;
        tcp dport 8080 dnat to 192.168.1.10:80
    }

    chain postrouting {
        type nat hook postrouting priority 100;
        oif eth0 masquerade
    }
}
```

### Section 5: Management Commands

```bash
# Load ruleset
sudo nft -f /etc/nftables.conf

# Add rule interactively
sudo nft add rule inet filter input tcp dport 8443 accept

# Delete rule by handle
sudo nft -a list chain inet filter input  # Show handles
sudo nft delete rule inet filter input handle 5

# Monitor changes
nft monitor
```

### Key Takeaways
- nftables is the modern replacement for iptables
- Unified handling of IPv4 and IPv6 with cleaner syntax
- Sets provide efficient IP matching for blacklists and whitelists
- Atomic ruleset replacement ensures consistent configuration
- Built-in rate limiting and logging capabilities

### References
1. [nftables Wiki](https://wiki.nftables.org/)
2. [nftables man page](https://man7.org/linux/man-pages/man8/nft.8.html)
3. [How to migrate from iptables to nftables](https://wiki.nftables.org/wiki-nftables/index.php/Migrating_rules_from_iptables_to_nftables)"""

questions = [
    {"text": "What is the primary advantage of nftables over iptables?", "answers": [
        {"text": "More tables", "isCorrect": False},
        {"text": "Faster performance and cleaner syntax", "isCorrect": True},
        {"text": "Better Windows support", "isCorrect": False},
        {"text": "More chain types", "isCorrect": False}
    ]},
    {"text": "What command flushes all nftables rules?", "answers": [
        {"text": "nft flush", "isCorrect": False},
        {"text": "nft flush ruleset", "isCorrect": True},
        {"text": "nft -F", "isCorrect": False},
        {"text": "nft delete all", "isCorrect": False}
    ]},
    {"text": "How do you define a drop chain in nftables?", "answers": [
        {"text": "nft add chain inet filter input '{ type filter hook input priority 0; policy drop; }'", "isCorrect": True},
        {"text": "nft create chain inet filter input DROP", "isCorrect": False},
        {"text": "nft set policy drop input", "isCorrect": False},
        {"text": "nft chain input policy drop", "isCorrect": False}
    ]},
    {"text": "What does the 'ct state established,related accept' rule do?", "answers": [
        {"text": "Blocks all traffic", "isCorrect": False},
        {"text": "Allows packets belonging to existing connections", "isCorrect": True},
        {"text": "Accepts only new connections", "isCorrect": False},
        {"text": "Logs all connection states", "isCorrect": False}
    ]},
    {"text": "What nftables feature provides efficient IP blacklisting?", "answers": [
        {"text": "Lists", "isCorrect": False},
        {"text": "Sets", "isCorrect": True},
        {"text": "Maps", "isCorrect": False},
        {"text": "Queues", "isCorrect": False}
    ]},
    {"text": "What does 'nft monitor' do?", "answers": [
        {"text": "Monitors CPU usage", "isCorrect": False},
        {"text": "Shows real-time rule changes", "isCorrect": True},
        {"text": "Lists all tables", "isCorrect": False},
        {"text": "Checks ruleset syntax", "isCorrect": False}
    ]}
]

lesson = {
    "title": "nftables Modern Firewall", "order": 2, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][1]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added nftables Modern Firewall lesson")
