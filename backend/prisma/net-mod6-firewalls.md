# Module 6 — Firewalls

**Course:** Networking | **Path:** Networking (6 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 30 min | **Prerequisite:** Module 5 — Switching and VLANs

---

## What You'll Actually Do

You need to filter traffic — allow HTTP, block SSH from the internet, rate-limit connections, and prevent SYN floods. You'll configure iptables/nftables, set up stateful filtering, and create firewall rules that actually protect.

---

## iptables — The Classic

```bash
# Show rules
iptables -L -n -v
iptables -L -n --line-numbers

# Default policy
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Drop everything else (policy or explicit)
iptables -A INPUT -j DROP
```

**Order matters.** Rules are evaluated top to bottom. First match wins.

---

## Stateful Filtering

```bash
# Track connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP
```

`ESTABLISHED` = already connected. `RELATED` = related to existing connection (like FTP data). `INVALID` = malformed packet.

This is the most important iptables concept. Without stateful filtering, you'd have to allow every possible response port.

---

## Rate Limiting

```bash
# Limit SSH to5 connections per minute
iptables -A INPUT -p tcp --dport 22 -m connlimit --connlimit-above 5 -j DROP

# Limit new connections per IP
iptables -A INPUT -p tcp --dport 80 -m conntrack --ctstate NEW -m limit --limit 100/second --limit-burst 200 -j ACCEPT

# SYN flood protection
iptables -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j ACCEPT
iptables -A INPUT -p tcp --syn -j DROP
```

---

## nftables — The Successor

```bash
# List ruleset
nft list ruleset

# Create table and chain
nft add table inet filter
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }

# Add rules
nft add rule inet filter input ct state established,related accept
nft add rule inet filter input iif lo accept
nft add rule inet filter input tcp dport { 22, 80, 443 } accept
```

**nftables is simpler** than iptables. Same concepts, cleaner syntax. Ubuntu22.04+ uses nftables by default.

---

## Logging

```bash
# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "IPT-DROP: " --log-level 4

# Log with limit (don't fill logs)
iptables -A INPUT -m limit --limit 5/minute -j LOG --log-prefix "IPT-DROP: "
```

---

## Real Task: Lock Down a Server

```bash
# 1. Set default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# 2. Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# 3. Allow established
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# 4. Allow SSH (rate limited)
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m limit --limit 3/minute --limit-burst 5 -j ACCEPT

# 5. Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 6. Drop invalid
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP

# 7. Log and drop everything else
iptables -A INPUT -j LOG --log-prefix "IPT-DROP: "
iptables -A INPUT -j DROP

# 8. Save
iptables-save > /etc/iptables/rules.v4
```

---

## Assessment

**Lab task (25 min):**

1. Configure iptables with default deny policy
2. Allow SSH, HTTP, HTTPS with rate limiting
3. Set up stateful filtering
4. Configure logging for dropped packets
5. Test the rules (try to connect from blocked IP)
6. Migrate rules to nftables

**Grading:**
- Default deny: 15%
- Rules correct: 25%
- Rate limiting working: 20%
- Stateful filtering: 15%
- Logging working: 15%
- nftables migrated: 10%

---

## Evidence

- **OutcomeEvidence:** `NET-LO6 — Firewall Configuration`
- **Mastery:** `UserSkill: networking-firewalls`

---

## Unlock

Module7 — VPN Technologies. You can filter traffic. Now you learn how to tunnel it.

---

## Sources

- `man iptables`, `man nft`, `man conntrack`
- netfilter documentation

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Network security engineer who's written thousands of firewall rules
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
