# Module 4 — Networking from the Command Line

**Course:** Linux Fundamentals | **Path:** Linux (4 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 30 min | **Prerequisite:** Module 3 — Processes and Systemd

---

## What You'll Actually Do

Your app is deployed but users can't reach it. You need to figure out if the port is open, if the firewall is blocking traffic, if DNS resolves, and if packets are getting through. All from the command line. No GUI. No "click here" buttons.

---

## Your Network Interfaces

Every network connection on your server is an interface.

```bash
ip addr show
```

You'll see:
- `lo` — loopback. `127.0.0.1`. Your server talking to itself.
- `eth0` or `ens3` — your primary network interface. The one with your real IP.

Output:
```
2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP>
    inet 10.0.0.5/24 brd 10.0.0.255 scope global ens3
```

- `inet 10.0.0.5/24` — IP address and subnet mask. `/24` = `255.255.255.0`.
- `UP` — interface is active.

**Old school (still works):**
```bash
ifconfig ens3
```

**Check your default gateway:**
```bash
ip route show
# default via 10.0.0.1 dev ens3
```

The gateway is where traffic goes when the destination is not on your local network.

---

## DNS — How Names Become IPs

```bash
cat /etc/resolv.conf
# nameserver 8.8.8.8
# nameserver 8.8.4.4
```

These are your DNS servers. `8.8.8.8` is Google's. Your hosting provider usually gives you their own.

**Resolve a name:**
```bash
dig google.com
# ;; ANSWER SECTION:
# google.com.    300    IN    A    142.250.80.46
```

**Reverse lookup:**
```bash
dig -x 142.250.80.46
```

**Quick lookup:**
```bash
host google.com
# google.com has address 142.250.80.46
```

**Check /etc/hosts:**
```bash
cat /etc/hosts
# 127.0.0.1    localhost
# 10.0.0.5     myserver.internal
```

Local overrides. If you add `10.0.0.5 myapp.local` to `/etc/hosts`, your server will resolve `myapp.local` to `10.0.0.5` without asking DNS.

---

## Connectivity Testing

**Ping:**
```bash
ping -c 4 google.com
# PING google.com (142.250.80.46): 56 data bytes
# 64 bytes from 142.250.80.46: icmp_seq=0 ttl=116 time=12.3 ms
```
`-c 4` sends4 pings. Without it, ping runs forever. `Ctrl+C` to stop.

**Check if a port is open:**
```bash
nc -zv 10.0.0.5 80
# Connection to 10.0.0.5 80 port [tcp/http] succeeded!
```

**Or use ss:**
```bash
ss -tlnp | grep :80
# LISTEN  0  128  0.0.0.0:80  0.0.0.0:*  users:(("nginx",pid=842,fd=3))
```
`-t` TCP, `-l` listening, `-n` numeric (don't resolve names), `-p` show process.

**Check if something is listening on a port:**
```bash
ss -tlnp | grep :443
```

---

## Firewalls — iptables and ufw

Traffic enters your server. The firewall decides what to allow and what to drop.

**ufw (Uncomplicated Firewall):**
```bash
ufw status
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

**Allow a port:**
```bash
ufw allow 8080/tcp
ufw reload
```

**Allow from specific IP:**
```bash
ufw allow from 10.0.0.100 to any port 22
```

**Deny everything except SSH:**
```bash
ufw default deny incoming
ufw allow 22/tcp
ufw enable
```

**iptables (lower level):**
```bash
iptables -L -n
# Chain INPUT (policy ACCEPT)
# target   prot opt source      destination
# ACCEPT   tcp  --  0.0.0.0/0  0.0.0.0/0  tcp dpt:22
# DROP     all  --  0.0.0.0/0  0.0.0.0/0
```

The order matters. Rules are evaluated top to bottom. First match wins.

---

## Network Troubleshooting — The Real Debugging Flow

Users say "the app is down." You don't panic. You check in order:

**1. Is the server reachable?**
```bash
ping -c 3 server_ip
```
No ping? Problem is network-level. Check `ip addr`, gateway, or hosting provider.

**2. Is the port open?**
```bash
nc -zv server_ip 80
```
Ping works but port closed? Firewall or service not running. Check `ufw status` and `systemctl status nginx`.

**3. Is the service listening on the right interface?**
```bash
ss -tlnp | grep :80
# LISTEN  0  128  127.0.0.1:80  ...
```
If it says `127.0.0.1`, nginx is only listening on localhost. External traffic can't reach it. Fix: change `listen` directive to `0.0.0.0:80`.

**4. DNS resolving correctly?**
```bash
dig myapp.example.com
```
IP wrong? Check DNS records. IP right but still can't connect? Firewall.

**5. Packets getting through?**
```bash
tcpdump -i ens3 port 80 -n
```
You see SYN packets coming in but no response? Service is not accepting connections. SYN comes in, SYN-ACK goes out, then RST? Service is crashing.

---

## Real Task: Network Debugging

Your web app is on port8080. Users can't reach it from outside.

```bash
# Step 1: Is nginx running?
systemctl status nginx
# active (running) — yes

# Step 2: Is it listening on 8080?
ss -tlnp | grep :8080
# LISTEN  0  128  127.0.0.1:8080  ...
# Problem: listening on localhost only

# Step 3: Fix nginx config
sudo sed -i 's/listen 127.0.0.1:8080/listen 0.0.0.0:8080/' /etc/nginx/sites-available/myapp
sudo systemctl reload nginx

# Step 4: Check firewall
ufw status | grep 8080
# nothing — port8080 not allowed

# Step 5: Allow it
ufw allow 8080/tcp
ufw reload

# Step 6: Verify from outside
curl -I http://server_ip:8080
# HTTP/1.1 200 OK
```

That's the real flow. Check each layer until you find it.

---

## Failure Scenario: DNS Cache Poisoning

Your `/etc/resolv.conf` points to a DNS server that's been compromised. It resolves `myapp.example.com` to an attacker's IP. Users connecting to your app are actually connecting to the attacker.

**Detection:**
```bash
dig myapp.example.com
# ;; ANSWER SECTION:
# myapp.example.com.  300  IN  A  198.51.100.50  # wrong IP

# Compare with known good:
dig @8.8.8.8 myapp.example.com
# myapp.example.com.  300  IN  A  10.0.0.5  # correct
```

**Fix:** Update `/etc/resolv.conf` to use a trusted DNS server, or investigate why your DNS server is returning wrong answers.

---

## Assessment

**Lab task (25 min):**

1. Check your server's IP, gateway, and DNS
2. Ping an external host and verify connectivity
3. Check which services are listening on which ports
4. Configure ufw to allow only ports22, 80, 443
5. Start a simple HTTP server on port9090 and verify it's accessible from outside
6. Debug: a service is configured to listen on port3000 but can't be reached — find and fix the issue (hint: it's listening on 127.0.0.1)
7. Use `tcpdump` to capture 10 packets on port80

**Grading:**
- Network info correct: 10%
- Firewall configured correctly: 25%
- Service accessible: 20%
- Debug completed: 30%
- tcpdump used: 15%

---

## Evidence

- **OutcomeEvidence:** `LIN-LO4 — Network Fundamentals`
- **Mastery:** `UserSkill: linux-networking` — +0.5 clean, +0.3 with hints

---

## Unlock

Module5 — Text Processing and Pipelines. You can make services talk. Now you learn how to process the data they produce.

---

## Sources

- `man ip`, `man ss`, `man ufw`, `man iptables`
- `man dig`, `man host`, `man ping`
- `man tcpdump`
- `man netcat`

---

## AI Provenance

- **Draft:** LLM (2025-08-31) with practitioner review
- **Voice:** Network engineer debugging packet flow
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
