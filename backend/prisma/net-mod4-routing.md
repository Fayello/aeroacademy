# Module 4 — Routing



## What You'll Actually Do

Traffic from your server goes to the wrong destination. You need to check routing tables, add static routes, configure policy-based routing, and understand how OSPF/BGP work at a high level.


## Routing Tables

```bash
ip route show
# default via 10.0.0.1 dev ens3
# 10.0.0.0/24 dev ens3 proto kernel scope link src 10.0.0.5
# 192.168.2.0/24 via 10.0.0.254 dev ens3
```

- `default via 10.0.0.1` — everything not on a known network goes to the gateway
- `10.0.0.0/24` — directly connected
- `192.168.2.0/24 via 10.0.0.254` — static route


## Static Routes

```bash
# Add route
ip route add 192.168.2.0/24 via 10.0.0.254

# Add route via specific interface
ip route add 192.168.2.0/24 via 10.0.0.254 dev ens3

# Add blackhole route (drop traffic)
ip route add blackhole 192.168.99.0/24

# Delete route
ip route del 192.168.2.0/24

# Make persistent (netplan)
routes:
  - to: 192.168.2.0/24
    via: 10.0.0.254
```


## Routing Metrics

```bash
# Lower metric = preferred
ip route add 192.168.2.0/24 via 10.0.0.254 metric 100
ip route add 192.168.2.0/24 via 10.0.1.254 metric 200
```

Traffic goes through `10.0.0.254` (metric100) unless it's down, then falls back to `10.0.1.254` (metric200).


## Policy-Based Routing

Route traffic based on source, port, or protocol — not just destination.

```bash
# Create routing table
echo "100 isp1" >> /etc/iproute2/rt_tables
echo "200 isp2" >> /etc/iproute2/rt_tables

# Add routes to each table
ip route add default via 10.0.0.1 table isp1
ip route add default via 10.1.0.1 table isp2

# Policy: route from port8080 through isp2
ip rule add fwmark 1 table isp2
iptables -t mangle -A PREROUTING -p tcp --dport 8080 -j MARK --set-mark 1
```


## Dynamic Routing — OSPF and BGP

**OSPF (Open Shortest Path First):**
- Interior gateway protocol (within an organization)
- Link-state routing
- Fast convergence
- Uses cost metric (bandwidth-based)

**BGP (Border Gateway Protocol):**
- Exterior gateway protocol (between organizations)
- Path-vector routing
- The internet runs on BGP
- Policy-based (not just shortest path)

**You don't configure BGP from scratch.** You configure it on routers. But you need to understand it to debug connectivity issues.


## traceroute — Path Discovery

```bash
traceroute google.com
# 1  10.0.0.1    1.234 ms
# 2  172.16.0.1  5.678 ms
# 3  72.14.236.1 12.345 ms
# ...
# 10  142.250.80.46 15.678 ms
```

Each hop is a router. If a hop shows `* * *`, it's either blocking ICMP or dropping packets.


## Real Task: Fix Routing

```bash
# Problem: Server can't reach 192.168.2.0/24
traceroute 192.168.2.1
# 1  10.0.0.1  1.234 ms
# 2  * * *     (timeout)

# Diagnosis: No route to 192.168.2.0/24
ip route show | grep 192.168
# (empty)

# Fix: Add static route
ip route add 192.168.2.0/24 via 10.0.0.254

# Verify
traceroute 192.168.2.1
# 1  10.0.0.254  1.234 ms
# 2  192.168.2.1  5.678 ms
```


## Assessment

**Lab task (25 min):**

1. Check routing tables on a server
2. Add a static route and verify connectivity
3. Set up policy-based routing for specific traffic
4. Use traceroute to map the path to a remote host
5. Diagnose a routing failure

**Grading:**
- Routing tables checked: 10%
- Static route working: 25%
- Policy routing configured: 25%
- Traceroute completed: 15%
- Diagnosis correct: 25%


## Evidence

- **OutcomeEvidence:** `NET-LO4 — Routing & Traffic Path`
- **Mastery:** `UserSkill: networking-routing`


## Unlock

Module5 — Switching and VLANs. You can route between networks. Now you learn how to segment them.


## Sources

- `man ip-route`, `man ip-rule`
- RFC2328 (OSPF), RFC4271 (BGP)


