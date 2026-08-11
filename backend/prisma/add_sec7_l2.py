#!/usr/bin/env python3
"""Add Common Network Issues lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Common Network Issues

### Learning Objectives
- Diagnose DNS resolution failures
- Troubleshoot firewall-related connectivity issues
- Resolve SSL/TLS certificate problems
- Fix common routing and MTU issues

### Section 1: DNS Issues

```bash
# Symptoms: Cannot resolve hostnames
# Check DNS configuration
cat /etc/resolv.conf
resolvectl status

# Test DNS resolution
dig example.com
nslookup example.com

# Fix: Update DNS servers
sudo bash -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'

# Flush DNS cache
resolvectl flush-caches

# Check /etc/hosts entries
grep example.com /etc/hosts
```

### Section 2: Firewall Blocking

```bash
# Symptoms: Connection refused or timeout
# Check if port is listening
ss -tlnp | grep :443

# Check iptables rules
sudo iptables -L -n | grep 443
sudo nft list ruleset | grep 443

# Test if firewall is blocking
sudo iptables -I INPUT -s <client-ip> -j ACCEPT  # Temporarily allow

# Check cloud provider firewall (AWS SG, GCP FW)
```

### Section 3: SSL/TLS Certificate Issues

```bash
# Check certificate validity
openssl s_client -connect example.com:443 </dev/null 2>/dev/null | \\
    openssl x509 -noout -dates

# Check certificate chain
openssl s_client -connect example.com:443 -showcerts

# Verify certificate matches domain
openssl s_client -connect example.com:443 -servername example.com

# Common issues:
# 1. Expired certificate
# 2. Wrong certificate for domain
# 3. Missing intermediate certificate
# 4. Self-signed certificate
```

### Section 4: Connection Timeouts

```bash
# Symptoms: Slow connections or timeouts
# Check TCP connection state
ss -tnp | awk '{print $1}' | sort | uniq -c | sort -rn

# High SYN_RECV = possible SYN flood
# High TIME_WAIT = too many short-lived connections

# Fix: Increase connection tracking
sudo sysctl -w net.netfilter.nf_conntrack_max=262144
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=65536

# Check connection limits
ulimit -n
cat /proc/sys/net/core/somaxconn
```

### Section 5: MTU Issues

```bash
# Symptoms: Connections hang or fail for large transfers
# Test MTU
ping -M do -s 1472 8.8.8.8

# If fails, reduce MTU
sudo ip link set eth0 mtu 1400

# Common MTU values:
# Ethernet: 1500
# PPPoE: 1492
# VPN: varies (often 1400)
# Cloud VPC: 9001 (Jumbo frames)
```

### Section 6: Service-Specific Issues

```bash
# Nginx 502 Bad Gateway
# Backend not running or not responding
sudo systemctl status my-backend
curl -v http://localhost:3000/health

# Nginx 504 Gateway Timeout
# Backend too slow
# Increase proxy_read_timeout in nginx.conf

# Connection refused
# Service not listening
ss -tlnp | grep :80
sudo systemctl start nginx
```

### Key Takeaways
- DNS issues are the most common cause of "cannot connect" errors
- Always check firewall rules before assuming network issues
- SSL certificate problems often stem from missing intermediaries
- High TIME_WAIT counts indicate connection recycling issues
- MTU problems manifest as hanging transfers, not outright failures

### References
1. [Linux Network Troubleshooting Guide](https://www.tecmint.com/linux-network-configuration-and-troubleshooting-commands/)
2. [SSL/TLS Debugging with OpenSSL](https://www.openssl.org/docs/manmaster/man1/openssl-s_client.html)
3. [conntrack tuning](https://www.nixcraft.com/t/linux-tuning-nf-conntrack-max/3778)"""

questions = [
    {"text": "What is the most common cause of 'cannot resolve hostname' errors?", "answers": [
        {"text": "Wrong IP address", "isCorrect": False},
        {"text": "DNS configuration issues", "isCorrect": True},
        {"text": "Firewall blocking", "isCorrect": False},
        {"text": "MTU mismatch", "isCorrect": False}
    ]},
    {"text": "What does a high TIME_WAIT count indicate?", "answers": [
        {"text": "DDoS attack", "isCorrect": False},
        {"text": "Too many short-lived connections", "isCorrect": True},
        {"text": "DNS failure", "isCorrect": False},
        {"text": "Firewall blocking", "isCorrect": False}
    ]},
    {"text": "What command tests if a specific port is listening?", "answers": [
        {"text": "ping host", "isCorrect": False},
        {"text": "curl host", "isCorrect": False},
        {"text": "ss -tlnp | grep :port", "isCorrect": True},
        {"text": "dig host", "isCorrect": False}
    ]},
    {"text": "What does Nginx 502 Bad Gateway usually mean?", "answers": [
        {"text": "Nginx is not running", "isCorrect": False},
        {"text": "The backend application is not responding", "isCorrect": True},
        {"text": "The client sent a bad request", "isCorrect": False},
        {"text": "SSL certificate is invalid", "isCorrect": False}
    ]},
    {"text": "What MTU test command detects MTU mismatches?", "answers": [
        {"text": "ping -c 4 host", "isCorrect": False},
        {"text": "traceroute host", "isCorrect": False},
        {"text": "ping -M do -s 1472 host", "isCorrect": True},
        {"text": "mtr host", "isCorrect": False}
    ]},
    {"text": "What system call limit affects maximum connections?", "answers": [
        {"text": "ulimit -n", "isCorrect": True},
        {"text": "ulimit -u", "isCorrect": False},
        {"text": "ulimit -s", "isCorrect": False},
        {"text": "ulimit -f", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Common Network Issues", "order": 2, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][3]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Common Network Issues lesson")
