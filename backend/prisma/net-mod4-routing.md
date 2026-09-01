# Module 4: Routing

Routing is the process of forwarding packets from one network to another based on destination IP addresses. Every router maintains a routing table: a map of known networks and how to reach them. When a packet arrives, the router looks up the destination IP in its routing table, finds the best match, and forwards the packet to the next hop toward the destination.

This module covers static routing, dynamic routing protocols (OSPF and BGP), route table mechanics, policy-based routing, and the practical reality of connecting two data centers over BGP. You will learn to read routing tables, troubleshoot routing loops, and design routing architectures that scale.

## How Routers Make Decisions

A router's job is simple in concept: receive a packet, look up the destination, forward it out the correct interface. The complexity lies in how the routing table gets built and how the router picks the best path when multiple routes exist.

When a router receives a packet, it performs a longest-prefix match. This means the route with the most specific (longest) prefix that matches the destination IP wins. If the routing table contains both 10.0.0.0/8 and 10.0.1.0/24, a packet destined for 10.0.1.50 matches both, but /24 is more specific, so the /24 route wins.

The routing table on a Linux system:
```bash
ip route show
```
Output:
```
default via 192.168.1.1 dev eth0 proto dhcp metric 100
10.0.0.0/8 via 10.1.1.1 dev eth1 proto static
10.1.1.0/24 dev eth1 proto kernel scope link src 10.1.1.2
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100
172.16.0.0/12 via 10.1.1.1 dev eth1 proto static metric 50
```

Breaking this down:
- `default via 192.168.1.1`: Packets with no more specific match go to 192.168.1.1 (the default gateway).
- `10.0.0.0/8 via 10.1.1.1`: All 10.x.x.x traffic goes through the next hop 10.1.1.1.
- `10.1.1.0/24 dev eth1`: This is a directly connected network. No next-hop needed: the router is on this subnet.
- `192.168.1.0/24 dev eth0`: Another directly connected network.
- `172.16.0.0/12 via 10.1.1.1`: Traffic for 172.16.x.x goes through the same next hop but with a higher metric (less preferred than the 10.0.0.0/8 route if they overlap: but they don't in this case).

### Administrative Distance and Metric

When multiple routing sources provide routes to the same destination, the router uses administrative distance (AD) to pick the best source. Lower AD = more trusted:

| Source              | AD  |
|---------------------|-----|
| Directly connected  | 0   |
| Static route        | 1   |
| EIGRP summary       | 5   |
| eBGP                | 20  |
| EIGRP               | 90  |
| OSPF                | 110 |
| IS-IS               | 115 |
| RIP                 | 120 |
| iBGP                | 200 |
| Unknown/unreachable | 255 |

Within a single routing protocol, routes are compared by metric. OSPF uses cost (based on link bandwidth). EIGRP uses a composite metric (bandwidth, delay, reliability, load). BGP uses a complex path selection algorithm (weight, local preference, AS path length, origin, MED, etc.).

### Route Types

There are three fundamental types of routes a router cares about:

**Connected routes**: Networks directly attached to the router's interfaces. These always have AD 0 and are always trusted. When you configure `ip address 10.1.1.2/24` on an interface and bring it up, the router automatically adds a connected route for 10.1.1.0/24.

**Static routes**: Manually configured paths to remote networks. You tell the router "to reach 172.16.0.0/12, send packets to 10.1.1.1." Static routes have AD 1 by default, making them very trustworthy.

**Dynamic routes**: Learned from routing protocols. The router exchanges information with neighbors and automatically builds routes. OSPF routes have AD 110, eBGP routes have AD 20.

When a router has a connected route and a static route to the same destination, the connected route wins because its AD is lower. This hierarchy prevents misconfigurations from overriding physical reality.

## Static Routes

Static routes are manually configured. They are appropriate for small, stable networks where the overhead of a routing protocol is not justified.

### Configuring Static Routes

On Linux:
```bash
# Add a static route to 172.16.0.0/16 via gateway 10.1.1.1
ip route add 172.16.0.0/16 via 10.1.1.1

# Add a default route
ip route add default via 192.168.1.1

# Remove a route
ip route del 172.16.0.0/16

# Add a route with a specific metric
ip route add 172.16.0.0/16 via 10.1.1.1 metric 100

# Add a blackhole route (silently drop traffic)
ip route add blackhole 10.99.0.0/16

# Add a unreachable route (send ICMP unreachable back)
ip route add unreachable 10.88.0.0/16

# Add a throw route (skip this route, continue looking)
ip route add throw 10.0.0.0/8
```

On Cisco IOS:
```
ip route 172.16.0.0 255.255.0.0 10.1.1.1
ip route 0.0.0.0 0.0.0.0 192.168.1.1
```

### Static Route Types

**Floating static routes**: Static routes with a higher-than-default AD. They serve as backups: the primary route is learned dynamically, and the floating static only activates if the dynamic route disappears.

```
# Primary route via OSPF (AD 110)
# Floating static backup via 10.1.1.1 (AD 200, higher than OSPF)
ip route 172.16.0.0 255.255.0.0 10.1.1.1 200
```

**Null routes (blackholes)**: Drop traffic silently. Used for:
- Mitigating DDoS: blackhole the destination IP
- Preventing routing loops: drop traffic that should not be forwarded
- Filtering: explicitly deny traffic without generating ICMP unreachable messages

**Host routes**: /32 routes that match a single IP address. Useful for:
- Management access through a specific path
- Overriding a longer prefix route for a specific host
- Traffic engineering

### When to Use Static Routes

- Stub networks (single exit point)
- Default routes to an ISP
- Null routes for blackholing traffic
- Host routes for specific destinations (e.g., management access)
- Backup routes with higher AD
- Small networks with fewer than 20 routers

### When NOT to Use Static Routes

- Large networks with many subnets (too much administrative overhead)
- Networks with multiple paths (static routes cannot adapt to link failures)
- Networks that change frequently (adding a new subnet requires updating every router)
- When convergence time matters (static routes do not detect failures: they stay in the table until manually removed)

## Dynamic Routing Protocols

Dynamic routing protocols allow routers to share reachability information and automatically adapt to network changes. When a link fails, routers running a dynamic protocol detect the failure and reroute traffic within seconds or minutes: without any manual intervention.

### Distance Vector vs Link State

**Distance vector protocols** (RIP, EIGRP) share their entire routing table with directly connected neighbors. Each router learns routes secondhand: "My neighbor tells me it can reach network X, so I can reach X through my neighbor." This is simple but converges slowly and is susceptible to routing loops.

Distance vector protocols use the Bellman-Ford algorithm. Each router maintains a table of (destination, cost, next-hop) tuples. Periodically (every 30 seconds for RIP), each router sends its entire table to neighbors. When a router receives an update, it adds 1 to the cost (each hop adds 1 for RIP) and compares it to its existing route. If the new route is better (lower cost), it updates its table.

Problems with distance vector:
- **Count to infinity**: If a link fails, routers may keep incrementing the cost, slowly converging to infinity (16 for RIP).
- **Routing loops**: Without mechanisms like split horizon, route poisoning, and hold-down timers, routing loops can form and persist.
- **Slow convergence**: The periodic update model means changes take 30-90 seconds to propagate.

**Link state protocols** (OSPF, IS-IS) share information about their directly connected links with all routers in the area. Each router builds a complete topology map and runs the SPF (Shortest Path First) algorithm to compute the best path to every destination. This converges faster and scales better.

## OSPF Fundamentals

OSPF (Open Shortest Path First) is the most widely deployed interior gateway protocol (IGP). It is a link-state protocol that uses Dijkstra's algorithm to compute shortest paths.

### OSPF Areas

OSPF divides a network into areas to limit the scope of link-state advertisements (LSAs) and reduce the size of the link-state database (LSDB). The hierarchy:

- **Area 0 (Backbone area)**: All other areas must connect to Area 0. Inter-area traffic passes through Area 0.
- **Non-backbone areas**: Areas 1, 2, etc. Connect to Area 0 through area border routers (ABRs).
- **Stub areas**: Do not receive external routes (routes redistributed from other protocols).
- **Totally stubby areas**: Only receive a default route from the ABR.
- **NSSA (Not-So-Stubby Area)**: Can import external routes but does not receive routes from other areas' external imports.

### OSPF Configuration

On a Cisco router:
```
router ospf 1
 router-id 1.1.1.1
 network 10.0.0.0 0.0.0.255 area 0
 network 10.0.1.0 0.0.0.255 area 1
 passive-interface GigabitEthernet0/2
```

On a Linux router (using FRRouting):
```bash
# Enable OSPF in FRR
vtysh
conf t
router ospf
 ospf router-id 1.1.1.1
 network 10.0.0.0/24 area 0
 network 10.0.1.0/24 area 1
 passive-interface eth2
exit
write
```

The `passive-interface` command prevents OSPF from sending hello packets on an interface (e.g., an interface connected to end hosts that do not need to participate in routing).

### OSPF Neighbor Formation

OSPF routers become neighbors by exchanging hello packets on a link. For a neighbor relationship to form, the following must match:
- Hello and dead intervals (default: 10s hello, 40s dead)
- Area ID
- Authentication credentials (if configured)
- Stub area flags
- Network type (broadcast, point-to-point, etc.)

OSPF neighbor states progress through:
1. **Down**: No hellos received.
2. **Init**: Hello received, but bidirectional communication not yet established.
3. **2-Way**: Bidirectional communication established. On broadcast networks, DR/BDR election happens here.
4. **ExStart**: routers determine who initiates the database exchange.
5. **Exchange**: routers exchange database descriptions (DBD packets).
6. **Loading**: routers request full LSAs from each other using LS Request packets.
7. **Full**: Neighbors are fully adjacent. The LSDB is synchronized.

If a neighbor gets stuck in a state (e.g., 2-Way or ExStart), there is a configuration mismatch or connectivity issue. Common causes: MTU mismatch, authentication failure, area ID mismatch, duplicate router ID.

### OSPF Cost

OSPF calculates cost as: Cost = Reference Bandwidth / Interface Bandwidth

The default reference bandwidth is 100 Mbps. On a 100 Mbps link, the cost is 1. On a 1 Gbps link, the cost is also 1 (because 100M / 1G = 0.1, rounded up to 1). This is a problem: OSPF cannot distinguish between 100 Mbps and 10 Gbps links with default settings.

Fix this by adjusting the reference bandwidth:
```
router ospf 1
 auto-cost reference-bandwidth 10000
```

This sets the reference bandwidth to 10 Gbps, so:
- 10 Mbps link: cost = 1000
- 100 Mbps link: cost = 100
- 1 Gbps link: cost = 10
- 10 Gbps link: cost = 1

### OSPF Route Redistribution

Redistribution is the process of injecting routes from one routing protocol into another. For example, redistributing static routes into OSPF, or redistributing OSPF into BGP.

```
router ospf 1
 redistribute static subnets
 redistribute connected subnets
 default-metric 100
```

The `default-metric` assigns a cost to redistributed routes. Without it, redistributed routes may have infinite cost and not be advertised.

### OSPF Troubleshooting

```bash
# Check OSPF neighbors
show ip ospf neighbor

# Check OSPF interfaces
show ip ospf interface

# Check the LSDB
show ip ospf database

# Verify OSPF routes in the routing table
show ip route ospf

# Debug OSPF events (use cautiously in production)
debug ip ospf events
```

Common OSPF issues:
- **Neighbors stuck in Init**: Hello packets are one-way. Check for access lists blocking OSPF (protocol 89), unidirectional links, or MTU mismatch.
- **Neighbors stuck in 2-Way**: On broadcast networks, this is normal for DROTHER routers (they only form full adjacencies with DR and BDR). On point-to-point links, this indicates a problem.
- **Neighbors stuck in ExStart/Exchange**: MTU mismatch is the most common cause. The DBD packets exceed the interface MTU and get fragmented or dropped.
- **Routes not appearing**: Check that the network commands cover the correct interfaces, that areas match, and that the interface is not passive.
- **Routing loops**: OSPF is a loop-free protocol within a single area, but loops can occur during convergence or if redistribution is misconfigured.

## BGP for Internet Routing

BGP (Border Gateway Protocol) is the protocol that holds the internet together. While OSPF manages routing within an autonomous system (AS), BGP manages routing between autonomous systems. Every ISP, cloud provider, and large enterprise runs BGP.

### eBGP vs iBGP

**eBGP (External BGP)**: Between different autonomous systems. eBGP neighbors are typically directly connected. eBGP routes have an AD of 20.

**iBGP (Internal BGP)**: Within the same autonomous system. iBGP is used to distribute external routes learned via eBGP to all routers within the AS. iBGP requires a full mesh (every iBGP speaker must peer with every other iBGP speaker) or route reflectors / confederations to scale.

The iBGP split-horizon rule prevents loops: a router learned an iBGP route will not advertise it to other iBGP peers. This is why a full mesh is required: every router must learn routes directly from the originating router.

### BGP Path Selection

BGP selects the best path using a multi-step process. The key decision points (in order):

1. **Weight** (Cisco proprietary, local to router): highest wins
2. **Local Preference** (higher is better, shared within AS): indicates the preferred exit point from the AS
3. **Locally originated routes** (prefer routes you originated): routes you advertised are preferred over learned routes
4. **AS Path length** (shorter is better): the number of autonomous systems the route has traversed
5. **Origin type** (IGP > EGP > Incomplete): how the route was originally injected
6. **MED** (Multi-Exit Discriminator, lower is better): hints to neighboring ASes about preferred entry points
7. **eBGP over iBGP** (prefer eBGP-learned routes): eBGP routes are more trustworthy because they come directly from the source
8. **Lowest IGP metric to next hop**: prefer the route reachable with the lowest internal cost
9. **Oldest route** (prefer the route you have had longest): stability preference
10. **Lowest router ID** (tiebreaker): deterministic selection

### BGP Configuration

Basic eBGP peering between two routers in different ASes:

Router A (AS 65001):
```
router bgp 65001
 bgp router-id 1.1.1.1
 neighbor 10.0.0.2 remote-as 65002
 network 192.168.1.0 mask 255.255.255.0
```

Router B (AS 65002):
```
router bgp 65002
 bgp router-id 2.2.2.2
 neighbor 10.0.0.1 remote-as 65001
 network 10.10.0.0 mask 255.255.0.0
```

On Linux with FRRouting:
```bash
vtysh
conf t
router bgp 65001
 bgp router-id 1.1.1.1
 neighbor 10.0.0.2 remote-as 65002
 address-family ipv4 unicast
  network 192.168.1.0/24
  neighbor 10.0.0.2 activate
 exit-address-family
exit
write
```

### BGP Communities

BGP communities are tags that can be applied to routes to influence routing decisions. They are 32-bit values typically written as AS:VALUE (e.g., 65001:100). Communities are transitive: they can be passed between ASes, allowing upstream providers to honor community-based policies.

Common community values:
- NO_EXPORT (0xFFFFFF01): Do not advertise this route to eBGP peers.
- NO_ADVERTISE (0xFFFFFF02): Do not advertise this route to any peer.
- Local AS (0xFFFFFF03): Do not advertise this route outside the local AS.

ISPs often define custom communities for customers:
- 65001:100: Prefer this path (set local preference to 200)
- 65001:200: Blackhole this prefix (RTBH)
- 65001:300: prepend AS path 3 times (depref this path)

### BGP Troubleshooting

```bash
# Check BGP neighbors
show ip bgp summary

# Check specific neighbor
show ip bgp neighbors 10.0.0.2

# View BGP routing table
show ip bgp

# View BGP routes for a specific prefix
show ip bgp 192.168.1.0/24

# Check why a route was not selected
show ip bgp 192.168.1.0/24 bestpath

# Reset BGP session (use carefully)
clear ip bgp 10.0.0.2 soft
```

Common BGP issues:
- **Neighbors not establishing**: Check AS numbers, IP addresses, TCP connectivity (port 179), and access lists. BGP uses TCP port 179: if a firewall blocks this port, the peering will never form.
- **Routes not advertised**: Verify the network statement matches exactly (including mask), check if the route exists in the IGP, and verify neighbor policy.
- **Suboptimal routing**: Check local preference, AS path prepending, MED, and communities. The BGP best path selection is deterministic: you can trace through the algorithm to understand why a particular path was chosen.
- **Route flapping**: Check for link instability, MTU issues, or memory exhaustion. Flapping routes cause constant re-convergence and waste CPU on all BGP speakers.

## Policy-Based Routing

Policy-based routing (PBR) allows you to override the normal routing table based on packet characteristics (source IP, protocol, port, DSCP value, etc.) rather than just the destination IP.

Use cases:
- Force VoIP traffic out a low-latency link
- Route management traffic through a dedicated out-of-band network
- Blackhole traffic from specific source addresses
- Load balance traffic across multiple uplinks based on application

On Cisco IOS:
```
route-map POLICY-ROI permit 10
 match ip address prefix-list VOIP
 set ip next-hop 10.0.2.1
 set ip precedence 5

route-map POLICY-ROI permit 20
 match ip address prefix-list MANAGEMENT
 set ip next-hop 10.0.3.1
```

On Linux:
```bash
# Route traffic from 10.0.1.0/24 through a specific gateway
ip rule add from 10.0.1.0/24 lookup 100
ip route add default via 10.0.2.1 table 100

# Route traffic with DSCP EF (46) through a low-latency path
ip rule add fwmark 1 lookup 200
ip route add default via 10.0.3.1 table 200
iptables -t mangle -A OUTPUT -p udp --dport 5060 -j DSCP --set-dscp 46
iptables -t mangle -A OUTPUT -p udp --dport 5060 -j MARK --set-mark 1
```

The Linux approach uses policy routing tables (identified by number) and ip rules to determine which table to use for which traffic. Traffic is marked with iptables, and the routing decision is based on the mark.

## Real Scenario: Connecting Two Data Centers via BGP

Your company operates two data centers:
- DC-A in New York (AS 65001) with 10.0.0.0/8
- DC-B in London (AS 65002) with 10.1.0.0/16

Both data centers have dual ISP connections for redundancy. You need to establish BGP peering to exchange routes between the data centers.

### Network Topology

```
DC-A (New York):
  Router A1 (10.0.0.1): connects to ISP-A via 203.0.113.0/30
  Router A2 (10.0.0.2): connects to ISP-B via 198.51.100.0/30

DC-B (London):
  Router B1 (10.1.0.1): connects to ISP-C via 192.0.2.0/30
  Router B2 (10.1.0.2): connects to ISP-D via 198.18.0.0/30
```

### Configuration

**Router A1:**
```
router bgp 65001
 bgp router-id 10.0.0.1
 bgp log-neighbor-changes
 neighbor 203.0.113.2 remote-as 64500
 neighbor 203.0.113.2 description ISP-A
 address-family ipv4 unicast
  network 10.0.0.0 mask 255.0.0.0
  neighbor 203.0.113.2 activate
  neighbor 203.0.113.2 route-map ISP-A-IN in
  neighbor 203.0.113.2 route-map ISP-A-OUT out
 exit-address-family
```

**Route Map ISP-A-IN:**
```
route-map ISP-A-IN permit 10
 match ip address prefix-list ISP-A-ALLOWED
 set local-preference 100
 set community 64500:100

route-map ISP-A-IN deny 20
```

**Route Map ISP-A-OUT:**
```
route-map ISP-A-OUT permit 10
 match ip address prefix-list OUR-ROUTES
 set community 65001:no-export

route-map ISP-A-OUT deny 20
```

The same pattern applies to Router A2 with ISP-B, and to both routers in DC-B.

### Traffic Engineering

To prefer the DC-A to DC-B path via ISP-A for normal traffic and use ISP-B as backup:

On Router A1, set local preference for routes learned from ISP-A:
```
route-map ISP-A-IN permit 10
 set local-preference 150
```

On Router A2, set local preference for routes learned from ISP-B:
```
route-map ISP-B-IN permit 10
 set local-preference 100
```

Since BGP prefers higher local preference, traffic from DC-A to DC-B will use ISP-A (LP=150) and fail over to ISP-B (LP=100) if ISP-A fails.

To influence how DC-B sends traffic back to DC-A, use AS path prepending:
```
route-map ISP-A-OUT permit 10
 match ip address prefix-list OUR-ROUTES
 set as-path prepend 65001 65001
```

This makes the path through ISP-A appear longer from DC-B's perspective, causing DC-B to prefer the path through ISP-C (or ISP-D).

### Monitoring

Monitor BGP sessions continuously:
```bash
# Check neighbor status
show ip bgp summary

# Verify routes are being received
show ip bgp neighbors 203.0.113.2 received-routes

# Check for route flapping
show ip bgp neighbors 203.0.113.2 advertised-routes

# Monitor prefix counts
show ip bgp | include ^Network
```

Set up alerts for:
- BGP session down (neighbor state changes from Established to any other state)
- Prefix count changes (sudden increase or decrease in received prefixes)
- Route flapping (more than 10 state changes per hour)

### Failover Testing

After deployment, test failover by manually shutting down the primary ISP link:
```bash
# On Router A1
interface GigabitEthernet0/1
 shutdown

# Monitor BGP convergence
show ip bgp summary
show ip route 10.1.0.0/16

# Verify traffic shifts to ISP-B
traceroute 10.1.0.1

# Restore the primary link
interface GigabitEthernet0/1
 no shutdown
```

BGP reconvergence typically takes 30-90 seconds depending on keepalive and hold timers. The default timers are 60s keepalive and 180s hold. For faster failover, consider using BFD (Bidirectional Forwarding Detection) which can detect link failures in milliseconds.

## Assessment

**Lab Exercise: Routing Design and Troubleshooting (55 minutes)**

Task 1 (20 minutes): Design a routing topology for a network with three sites connected via redundant links. Include:
- OSPF configuration for internal routing
- Static route configuration for default gateway
- Route redistribution between OSPF and static routes
- Verification commands to confirm routes are correct

Task 2 (20 minutes): Given the following routing table, identify why traffic from Host A (192.168.1.10) to Server B (10.0.5.50) is taking a suboptimal path:
```
10.0.0.0/8 via 192.168.1.1 metric 20
10.0.0.0/16 via 192.168.2.1 metric 10
10.0.5.0/24 via 192.168.1.1 metric 30
```

Explain what the correct path should be and how to fix the routing.

Task 3 (15 minutes): Describe the BGP path selection process. If a router receives the same prefix via two eBGP peers with the following attributes, which path would be selected and why?
- Path A: AS path [65001, 65002], local preference 100, MED 200
- Path B: AS path [65003, 65004, 65001], local preference 200, MED 100

**Grading Criteria:**
- Routing table interpretation: 25 points
- OSPF configuration correctness: 25 points
- BGP path selection understanding: 25 points
- Troubleshooting methodology: 25 points

## Evidence

Save the following to your portfolio:
1. Complete routing table analysis for Task 2 with explanation
2. OSPF configuration for Task 1 with verification output
3. BGP path selection analysis for Task 3
4. A diagram showing the data center interconnection topology from the real scenario, with BGP AS numbers and link addresses labeled

Routing is where networking becomes architectural. Every routing decision has trade-offs between cost, performance, redundancy, and complexity. The goal is not to memorize commands but to understand the decision-making process so you can design networks that behave predictably under both normal and failure conditions.