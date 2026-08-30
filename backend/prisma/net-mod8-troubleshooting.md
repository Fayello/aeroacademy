# Module 8 — Network Troubleshooting

**Course:** Networking | **Path:** Networking (8 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 30 min | **Prerequisite:** Module 7 — VPN Technologies

---

## What You'll Actually Do

"The network is down." You need to systematically figure out where. You'll follow a troubleshooting methodology, use the right tools at each layer, and fix the problem — not just guess.

---

## The Methodology

Don't randomly run commands. Follow layers:

```
1. Physical — Is the cable plugged in? Link light on?
2. Data Link — ARP working? Switch learning MACs?
3. Network — IP correct? Routing correct? Firewall?
4. Transport — TCP/UDP ports open? Connection established?
5. Application — DNS resolving? Service responding? TLS valid?
```

---

## Layer1-2: Physical and Link

```bash
# Is the interface up?
ip link show ens3
# state UP

# Is there a link?
ethtool ens3
# Speed: 1000Mb/s
# Link detected: yes

# ARP working?
arp -a
# ? (10.0.0.1) at 00:1a:2b:3c:4d:5e on ens3

# MAC learning (on switch)
show mac address-table
```

---

## Layer3: Network

```bash
# IP correct?
ip addr show ens3
# inet 10.0.0.5/24

# Can I reach the gateway?
ping 10.0.0.1

# Routing correct?
ip route show
traceroute 10.0.1.5

# Firewall blocking?
iptables -L -n -v | grep DROP
ufw status
```

---

## Layer4: Transport

```bash
# Is the port open?
ss -tlnp | grep :80
nc -zv 10.0.0.5 80

# TCP connection established?
ss -tanp | grep ESTABLISHED

# Connection refused?
# → Service not listening or firewall blocking
```

---

## Layer7: Application

```bash
# DNS resolving?
dig example.com
nslookup example.com

# HTTP responding?
curl -I http://example.com
curl -vk https://example.com

# TLS valid?
openssl s_client -connect example.com:443
```

---

## Common Scenarios

**"Can't reach the server":**
```bash
ping server_ip        # Layer3 — is it reachable?
nc -zv server_ip 22   # Layer4 — is SSH port open?
ssh user@server       # Layer7 — can I authenticate?
```

**"Service is slow":**
```bash
time curl -I http://server  # How long?
traceroute server           # Where's the latency?
ss -s                       # Connection states
```

**"DNS not working":**
```bash
dig @8.8.8.8 example.com  # Is it DNS or the server?
cat /etc/resolv.conf       # What resolver am I using?
systemd-resolved --statistics  # Cache stats
```

---

## Real Task: Debug a Production Issue

```bash
# "The web app is returning502"
# Step1: Check if nginx is running
systemctl status nginx
# active (running) — yes

# Step2: Check if app is running
systemctl status myapp
# active (running) — yes

# Step3: Check nginx logs
tail -20 /var/log/nginx/error.log
# connect() failed (111: Connection refused) while connecting to upstream

# Step4: Check what port app is on
ss -tlnp | grep node
# LISTEN 0 128 127.0.0.1:3000 ...

# Step5: Check nginx upstream config
grep proxy_pass /etc/nginx/sites-available/myapp
# proxy_pass http://127.0.0.1:3000;

# Step6: Test from localhost
curl http://127.0.0.1:3000
# 200 OK

# Step7: Check if app is actually responding
curl http://127.0.0.1:3000/health
# {"status":"ok"}

# Diagnosis: nginx is proxying correctly, app is responding
# The502 might be intermittent — check if app crashes under load
```

---

## Assessment

**Lab task (25 min):**

1. Debug a server that can't be reached (physical issue)
2. Debug a service that returns502 (upstream issue)
3. Debug DNS resolution failure
4. Debug slow network performance
5. Debug a VPN tunnel that drops intermittently

**Grading:**
- Physical issue found: 15%
- 502 debugged: 25%
- DNS debugged: 20%
- Performance debugged: 20%
- VPN debugged: 20%

---

## Evidence

- **OutcomeEvidence:** `NET-LO8 — Network Troubleshooting`
- **Mastery:** `UserSkill: networking-troubleshooting`

---

## Unlock

Module9 — Packet Analysis. You can troubleshoot systematically. Now you learn how to see what's actually on the wire.

---

## Sources

- `man tcpdump`, `man ss`, `man ping`, `man traceroute`
- `man dig`, `man curl`, `man openssl`

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Network engineer who's debugged more outages than he can count
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
