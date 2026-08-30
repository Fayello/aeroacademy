# Module 2 — Subnetting and IP Addressing

**Course:** Networking | **Path:** Networking (2 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 30 min | **Prerequisite:** Module 1 — How Packets Move

---

## What You'll Actually Do

You're designing a network for3 departments: Engineering (50 hosts), Finance (20 hosts), IT (10 hosts). You need to subnet a `10.0.0.0/24` network so each department gets its own subnet, with room to grow.

---

## IP Addressing — The Basics

```bash
ip addr show
# 10.0.0.5/24
```

- `10.0.0.5` — host address
- `/24` — subnet mask (255.255.255.0)
- Network: `10.0.0.0`
- Broadcast: `10.0.0.255`
- Usable hosts: `10.0.0.1` — `10.0.0.254` (254 hosts)

**Private ranges (RFC1918):**
```
10.0.0.0/8        (10.0.0.0 — 10.255.255.255)
172.16.0.0/12     (172.16.0.0 — 172.31.255.255)
192.168.0.0/16    (192.168.0.0 — 192.168.255.255)
```

---

## CIDR — Classless Inter-Domain Routing

Forget classful (A, B, C). Use CIDR.

| CIDR | Mask | Hosts | Useful for |
|------|------|-------|-----------|
| /32 | 255.255.255.255 | 1 | Single host (loopback) |
| /30 | 255.255.255.252 | 2 | Point-to-point links |
| /29 | 255.255.255.248 | 6 | Small network |
| /28 | 255.255.255.240 | 14 | Small office |
| /27 | 255.255.255.224 | 30 | Department |
| /26 | 255.255.255.192 | 62 | Department |
| /25 | 255.255.255.128 | 126 | Medium network |
| /24 | 255.255.255.0 | 254 | Standard network |
| /16 | 255.255.0.0 | 65534 | Large network |

**Formula:** Usable hosts = 2^(32-CIDR) - 2

---

## Subnetting Practice

**Problem:** Subnet `10.0.0.0/24` for3 departments.

**Engineering (50 hosts):** Needs 2^6 = 64 addresses → /26
```
10.0.0.0/26     (10.0.0.1 — 10.0.0.62, broadcast .63)
```

**Finance (20 hosts):** Needs 2^5 = 32 addresses → /27
```
10.0.0.64/27    (10.0.0.65 — 10.0.0.94, broadcast .95)
```

**IT (10 hosts):** Needs 2^4 = 16 addresses → /28
```
10.0.0.96/28    (10.0.0.97 — 10.0.0.110, broadcast .111)
```

**Remaining:** `10.0.0.112/28` through `10.0.0.240/28` — room for growth.

```bash
# Calculate with ipcalc
ipcalc 10.0.0.0/26
# Address:   10.0.0.0
# Netmask:   255.255.255.192 = /26
# Broadcast: 10.0.0.63
# HostMin:   10.0.0.1
# HostMax:   10.0.0.62
# Hosts/Net: 62
```

---

## VLSM — Variable Length Subnet Masking

Different subnets, different sizes. That's VLSM. The example above uses VLSM — /26, /27, /28 in the same network.

**Without VLSM (wasteful):**
All subnets /24 → 3 × 254 = 762 addresses, only90 needed.

**With VLSM (efficient):**
62 + 30 + 14 = 106 addresses, much less waste.

---

## Supernetting — Route Aggregation

Combine multiple small networks into one larger one for routing:

```bash
# Instead of advertising:
10.0.0.0/24
10.0.1.0/24
10.0.2.0/24
10.0.3.0/24

# Advertise one route:
10.0.0.0/22
```

This reduces routing table size. ISPs and large networks do this constantly.

---

## IPv6 — The Future (That's Already Here)

```bash
ip -6 addr show
# inet6 2001:db8::1/64 scope global
```

- 128-bit address (vs 32-bit IPv4)
- No NAT (every device gets a public address)
- Simplified header
- Auto-configuration (SLAAC)

**IPv6 subnetting:**
```
2001:db8:abcd:1234::/64   (standard /64 for a LAN)
2001:db8:abcd:1234::1      (router)
2001:db8:abcd:1234::100    (first host)
```

**Dual stack:** Most networks run IPv4 and IPv6 simultaneously.

---

## Real Task: Design a Network

```bash
# 1. Plan subnets
# Office: 10.0.0.0/24
# Engineering: 10.0.0.0/26 (62 hosts)
# Finance: 10.0.0.64/27 (30 hosts)
# IT: 10.0.0.96/28 (14 hosts)
# Servers: 10.0.0.112/28 (14 hosts)
# Guest: 10.0.0.128/25 (126 hosts)

# 2. Configure on router/server
ip addr add 10.0.0.1/26 dev ens3    # Engineering gateway
ip addr add 10.0.0.65/27 dev ens3.10  # Finance VLAN
ip addr add 10.0.0.97/28 dev ens3.20  # IT VLAN

# 3. Verify
ip addr show
ipcalc 10.0.0.0/26
```

---

## Assessment

**Lab task (25 min):**

1. Given `192.168.1.0/24`, subnet for4 departments (30, 15, 10, 5 hosts)
2. Calculate network, broadcast, and host range for each subnet
3. Use `ipcalc` to verify
4. Configure subnets on a router/server
5. Test connectivity between subnets
6. Document the network design

**Grading:**
- Subnets calculated correctly: 30%
- No overlaps: 20%
- ipcalc verified: 15%
- Subnets configured: 20%
- Connectivity tested: 15%

---

## Evidence

- **OutcomeEvidence:** `NET-LO2 — Subnetting & IP Addressing`
- **Mastery:** `UserSkill: networking-subnetting`

---

## Unlock

Module3 — DNS. You can address networks. Now you learn how names resolve.

---

## Sources

- RFC1918, RFC4632 (CIDR)
- `man ipcalc`

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Network engineer who's subnetted more networks than he can count
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
