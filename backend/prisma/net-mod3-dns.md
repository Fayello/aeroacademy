# Module 3 — DNS

**Course:** Networking | **Path:** Networking (3 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 25 min | **Prerequisite:** Module 2 — Subnetting

---

## What You'll Actually Do

"Can't reach the website." Is it DNS? You'll trace a DNS query from your machine to the root servers, set up authoritative DNS, configure split-horizon DNS, and debug DNS failures.

---

## How DNS Works

```
Your machine → Recursive resolver → Root server → TLD server → Authoritative server
```

1. You type `www.example.com`
2. Resolver checks cache. If miss, asks root server.
3. Root says: "Ask `.com` TLD server"
4. TLD says: "Ask `example.com` authoritative server"
5. Authoritative says: "It's `93.184.216.34`"
6. Resolver caches it and returns the answer

---

## Record Types

| Type | What it points to | Example |
|------|------------------|---------|
| A | IPv4 address | `example.com → 93.184.216.34` |
| AAAA | IPv6 address | `example.com → 2606:2800:220:1::248` |
| CNAME | Another domain | `www.example.com → example.com` |
| MX | Mail server | `example.com → mail.example.com` |
| NS | Nameserver | `example.com → ns1.example.com` |
| TXT | Text (SPF, DKIM) | `example.com → "v=spf1 include:_spf.google.com ~all"` |
| PTR | Reverse lookup | `34.216.184.93 → example.com` |
| SOA | Zone authority | Start of authority record |

---

## DNS Queries

```bash
# Basic lookup
dig example.com

# Specific record type
dig example.com MX
dig example.com NS
dig example.com TXT

# Trace the full path
dig +trace example.com

# Short answer
dig +short example.com
# 93.184.216.34

# Reverse lookup
dig -x 93.184.216.34

# Query specific DNS server
dig @8.8.8.8 example.com
```

---

## Setting Up Authoritative DNS

**Zone file:**
```bash
$TTL 3600
@       IN  SOA  ns1.example.com. admin.example.com. (
            2025011501  ; Serial
            3600        ; Refresh
            900         ; Retry
            604800      ; Expire
            86400       ; Minimum TTL
        )

        IN  NS   ns1.example.com.
        IN  NS   ns2.example.com.
        IN  A    93.184.216.34
        IN  MX   10 mail.example.com.

ns1     IN  A    93.184.216.10
ns2     IN  A    93.184.216.11
www     IN  A    93.184.216.34
mail    IN  A    93.184.216.20
```

**DNS server (BIND):**
```bash
apt install bind9
# Place zone in /etc/bind/db.example.com
# Configure in /etc/bind/named.conf.local
systemctl restart named
```

---

## Split-Horizon DNS

Same domain, different answers depending on who asks.

Internal DNS returns `10.0.0.5` for `app.example.com`. External DNS returns `93.184.216.34`.

```bash
# Internal zone
app.example.com.  A  10.0.0.5

# External zone
app.example.com.  A  93.184.216.34
```

Useful for exposing web services externally while keeping internal IPs private.

---

## DNS Caching and TTL

```bash
# Check cached entries
systemd-resolved --statistics

# Flush cache
resolvectl flush-caches

# TTL (time to live) — how long to cache
# Set low (300) for fast changes, high (86400) for stable records
```

---

## DNS Failures

```bash
# Can't resolve
dig example.com
# ;; connection timed out; no servers could be reached

# Check /etc/resolv.conf
cat /etc/resolv.conf

# Test with different resolver
dig @8.8.8.8 example.com

# Check if port53 is open
ss -ulnp | grep :53
```

---

## Assessment

**Lab task (20 min):**

1. Use `dig` to trace DNS resolution for a domain
2. Check all record types (A, AAAA, MX, NS, TXT, SOA)
3. Set up a local DNS zone with BIND
4. Configure split-horizon DNS
5. Debug a DNS failure scenario

**Grading:**
- dig traced: 15%
- Record types checked: 15%
- BIND configured: 25%
- Split-horizon working: 25%
- Debug completed: 20%

---

## Evidence

- **OutcomeEvidence:** `NET-LO3 — DNS Resolution & Management`
- **Mastery:** `UserSkill: networking-dns`

---

## Unlock

Module4 — Routing. You can resolve names. Now you learn how packets find their way.

---

## Sources

- RFC1034, RFC1035 (DNS)
- `man dig`, `man host`, `man named`

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Network engineer who's debugged DNS at2 AM
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
