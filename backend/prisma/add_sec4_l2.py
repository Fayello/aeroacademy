#!/usr/bin/env python3
"""Add DNS and Name Resolution lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# DNS and Name Resolution

### Learning Objectives
- Understand DNS hierarchy and resolution process
- Configure local DNS resolution with /etc/hosts and /etc/resolv.conf
- Use dig, nslookup, and host to query DNS
- Set up a local DNS cache with systemd-resolved

### Section 1: DNS Hierarchy

```
Root (.)
  -> TLD (.com, .org, .net)
    -> Authoritative (example.com)
      -> Specific (www.example.com)
```

### Section 2: DNS Resolution Process

1. Browser checks browser cache
2. OS checks /etc/hosts
3. OS queries configured DNS server (from /etc/resolv.conf)
4. DNS server checks cache, then recurses up the hierarchy
5. IP address returned to browser

### Section 3: Configuration Files

```bash
# /etc/resolv.conf - DNS servers
nameserver 8.8.8.8
nameserver 1.1.1.1
search example.com

# /etc/hosts - Local resolution
127.0.0.1   localhost
192.168.1.10 myserver.local myserver
192.168.1.20 db.local db
```

### Section 4: DNS Lookup Tools

```bash
# dig - most comprehensive
dig example.com
dig +short example.com
dig @8.8.8.8 example.com
dig example.com MX
dig -x 93.184.216.34  # Reverse lookup

# nslookup
nslookup example.com
nslookup -type=MX example.com

# host
host example.com
host -t MX example.com
```

### Section 5: Local DNS Cache

```bash
# Check systemd-resolved status
resolvectl status

# Flush DNS cache
resolvectl flush-caches

# Test with specific server
resolvectl query example.com
```

### Section 6: DNS Record Types

| Record | Purpose | Example |
|--------|---------|---------|
| A | Maps domain to IPv4 | example.com -> 93.184.216.34 |
| AAAA | Maps domain to IPv6 | example.com -> 2606:2800:220:1:... |
| CNAME | Alias to another domain | www.example.com -> example.com |
| MX | Mail server | example.com -> mail.example.com |
| TXT | Text data (SPF, DKIM) | example.com -> "v=spf1 ..." |
| NS | Nameserver | example.com -> ns1.example.com |

### Key Takeaways
- DNS resolves domain names to IP addresses through a hierarchical system
- /etc/resolv.conf configures DNS servers; /etc/hosts provides local overrides
- dig is the most powerful DNS lookup tool
- systemd-resolved provides local DNS caching
- Common record types: A, AAAA, CNAME, MX, TXT, NS

### References
1. "DNS and BIND" by Paul Albitz
2. [dig man page](https://man7.org/linux/man-pages/man1/dig.1.html)
3. [Linux DNS How-To](https://tldp.org/HOWTO/DNS-HOWTO/)"""

questions = [
    {"text": "Which file configures which DNS servers to use?", "answers": [
        {"text": "/etc/hosts", "isCorrect": False},
        {"text": "/etc/resolv.conf", "isCorrect": True},
        {"text": "/etc/dns.conf", "isCorrect": False},
        {"text": "/etc/nameserver", "isCorrect": False}
    ]},
    {"text": "What DNS record type maps a domain to an IPv4 address?", "answers": [
        {"text": "AAAA", "isCorrect": False},
        {"text": "CNAME", "isCorrect": False},
        {"text": "A", "isCorrect": True},
        {"text": "MX", "isCorrect": False}
    ]},
    {"text": "Which command performs a DNS reverse lookup?", "answers": [
        {"text": "dig -x IP", "isCorrect": True},
        {"text": "dig reverse IP", "isCorrect": False},
        {"text": "nslookup -reverse IP", "isCorrect": False},
        {"text": "host -r IP", "isCorrect": False}
    ]},
    {"text": "What does the /etc/hosts file do?", "answers": [
        {"text": "Configures DNS servers", "isCorrect": False},
        {"text": "Provides local hostname-to-IP mappings", "isCorrect": True},
        {"text": "Stores DNS cache", "isCorrect": False},
        {"text": "Lists remote DNS zones", "isCorrect": False}
    ]},
    {"text": "Which tool flushes the systemd-resolved DNS cache?", "answers": [
        {"text": "resolvectl flush-caches", "isCorrect": True},
        {"text": "systemd-resolve --flush", "isCorrect": False},
        {"text": "dns-flush", "isCorrect": False},
        {"text": "resolvectl clear-cache", "isCorrect": False}
    ]},
    {"text": "What MX record specifies for a domain?", "answers": [
        {"text": "The mail server address", "isCorrect": True},
        {"text": "The web server address", "isCorrect": False},
        {"text": "The nameserver", "isCorrect": False},
        {"text": "The IPv6 address", "isCorrect": False}
    ]}
]

lesson = {
    "title": "DNS and Name Resolution", "order": 2, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][0]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added DNS and Name Resolution lesson")
