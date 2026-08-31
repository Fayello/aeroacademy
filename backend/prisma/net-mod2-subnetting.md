# Module 2 — Subnetting and IP Addressing

Every device on an IP network needs a unique address. How those addresses are assigned, divided, and managed determines whether your network scales gracefully or collapses under its own weight. This module covers IPv4 subnetting from first principles, VLSM for efficient allocation, IPv6 basics, NAT/PAT for address conservation, and the practical decisions you face when designing addressing for a real network.

You will learn to subnet by hand — no calculators. The goal is not to memorize binary arithmetic but to understand it deeply enough that you can reason about addressing problems intuitively. When you are staring at a routing table at 2 AM and something does not add up, you need to be able to mentally verify that 10.0.48.0/22 actually covers the range you think it does.

## IPv4 Address Structure

An IPv4 address is a 32-bit number, typically written as four decimal octets separated by dots: 192.168.1.100. Each octet represents 8 bits, so the full range is 0.0.0.0 to 255.255.255.255 — about 4.3 billion addresses.

In binary, 192.168.1.100 looks like this:

```
11000000.10101000.00000001.01100100
```

The first 24 bits (11000000.10101000.00000001) represent the network portion, and the last 8 bits (01100100 = 100) represent the host portion. This is determined by the subnet mask.

## Subnet Masks and CIDR Notation

A subnet mask is a 32-bit number where the network bits are set to 1 and the host bits are set to 0. The traditional notation for 192.168.1.100 with a /24 mask is:

```
IP:        192.168.1.100    = 11000000.10101000.00000001.01100100
Mask:      255.255.255.0    = 11111111.11111111.11111111.00000000
Network:   192.168.1.0      = 11000000.10101000.00000001.00000000
Broadcast: 192.168.1.255    = 11000000.10101000.00000001.11111111
```

CIDR (Classless Inter-Domain Routing) notation uses a slash followed by the number of network bits. /24 means 24 network bits, which equals 255.255.255.0. The CIDR prefix determines everything:
- Network address: all host bits set to 0
- Broadcast address: all host bits set to 1
- Usable host range: network + 1 through broadcast - 1
- Number of hosts: 2^(32 - prefix) - 2 (subtract network and broadcast)

### Common Subnet Masks

| CIDR | Dotted Decimal   | Wildcard Mask   | Host Count |
|------|------------------|-----------------|------------|
| /8   | 255.0.0.0        | 0.255.255.255   | 16,777,214 |
| /16  | 255.255.0.0      | 0.0.255.255     | 65,534     |
| /20  | 255.255.240.0    | 0.0.15.255      | 4,094      |
| /22  | 255.255.252.0    | 0.0.3.255       | 1,022      |
| /24  | 255.255.255.0    | 0.0.0.255       | 254        |
| /25  | 255.255.255.128  | 0.0.0.127       | 126        |
| /26  | 255.255.255.192  | 0.0.0.63        | 62         |
| /27  | 255.255.255.224  | 0.0.0.31        | 30         |
| /28  | 255.255.255.240  | 0.0.0.15        | 14         |
| /29  | 255.255.255.248  | 0.0.0.7         | 6          |
| /30  | 255.255.255.252  | 0.0.0.3         | 2          |
| /31  | 255.255.255.254  | 0.0.0.1         | 2 (PtP)   |
| /32  | 255.255.255.255  | 0.0.0.0         | 1 (host)   |

The wildcard mask is the inverse of the subnet mask and is used in access control lists and OSPF configuration. For /24, the wildcard mask is 0.0.0.255.

## Subnetting by Hand

The key to fast subnetting is understanding that subnet boundaries always fall on powers of 2. A /24 network (192.168.1.0/24) has 256 addresses. If you want to split it into two /25 subnets, each gets 128 addresses. If you split into four /26 subnets, each gets 64 addresses. And so on.

### Worked Example: Subnetting 10.0.0.0/24 into 4 Subnets

Starting network: 10.0.0.0/24 (256 addresses)
Goal: 4 subnets

Step 1: How many bits do we need to borrow? 2^2 = 4, so we borrow 2 bits from the host portion.
New prefix: /24 + 2 = /26

Step 2: What is the new subnet mask? /26 = 255.255.255.192

Step 3: What is the block size (increment)? 256 - 192 = 64. Each subnet spans 64 addresses.

Step 4: List the subnets:
```
Subnet 1: 10.0.0.0/26    → 10.0.0.0   - 10.0.0.63   (usable: 10.0.0.1  - 10.0.0.62)
Subnet 2: 10.0.0.64/26   → 10.0.0.64  - 10.0.0.127  (usable: 10.0.0.65  - 10.0.0.126)
Subnet 3: 10.0.0.128/26  → 10.0.0.128 - 10.0.0.191  (usable: 10.0.0.129 - 10.0.0.190)
Subnet 4: 10.0.0.192/26  → 10.0.0.192 - 10.0.0.255  (usable: 10.0.0.193 - 10.0.0.254)
```

Each subnet has 62 usable host addresses (64 - 2 for network and broadcast).

### Worked Example: Finding the Subnet of a Given IP

IP: 172.16.45.130/26

Step 1: /26 means the mask is 255.255.255.192.
Step 2: The block size is 256 - 192 = 64.
Step 3: The fourth octet is 130. 130 / 64 = 2 remainder 2. So the subnet boundary is at 2 × 64 = 128.
Step 4: Network address: 172.16.45.128/26
Step 5: Broadcast: 172.16.45.191
Step 6: Usable range: 172.16.45.129 - 172.16.45.190

### Quick Method: The Magic Number

For subnets that do not cross the third octet boundary (most common cases), you can use the "magic number" method:

1. Look at the interesting octet (the last octet where the mask is not 0 or 255).
2. Subtract the mask value from 256. This gives the magic number.
3. Count up by the magic number to find subnet boundaries.
4. The network address is the boundary at or below the given IP.

Example: 192.168.10.77/28
Mask in fourth octet: 240. Magic number: 256 - 240 = 16.
Subnets: 0, 16, 32, 48, 64, 80, ...
77 falls between 64 and 80, so the subnet is 192.168.10.64/28.
Broadcast: 192.168.10.79 (next subnet minus 1).
Usable: 192.168.10.65 - 192.168.10.78.

## VLSM: Variable Length Subnet Masking

Fixed-length subnetting wastes addresses. If you have a point-to-point link between two routers, it only needs 2 usable addresses (/30 or /31), but a fixed /24 subnet wastes 252 addresses on that link. VLSM lets you use different subnet sizes within the same major network.

### Designing with VLSM

Suppose you have the network 10.0.0.0/16 and need to allocate subnets for:

- 3 departments with 200 hosts each
- 20 point-to-point router links
- 100 servers in a DMZ
- 500 IoT devices

Step 1: Sort requirements from largest to smallest.
1. 500 IoT devices → need /23 (512 addresses, 510 usable)
2. 200 hosts × 3 departments → need /24 each (256 addresses, 254 usable)
3. 100 servers → need /25 (128 addresses, 126 usable)
4. Point-to-point links × 20 → need /30 each (4 addresses, 2 usable)

Step 2: Allocate from the top of the address space down.

```
10.0.0.0/23     → IoT devices (10.0.0.1 - 10.0.1.254)
10.0.2.0/24     → Department A (10.0.2.1 - 10.0.2.254)
10.0.3.0/24     → Department B (10.0.3.1 - 10.0.3.254)
10.0.4.0/24     → Department C (10.0.4.1 - 10.0.4.254)
10.0.5.0/25     → DMZ servers (10.0.5.1 - 10.0.5.126)
10.0.5.128/30   → Link 1 (10.0.5.129 - 10.0.5.130)
10.0.5.132/30   → Link 2 (10.0.5.133 - 10.0.5.134)
...
10.0.5.200/30   → Link 20 (10.0.5.201 - 10.0.5.202)
```

Step 3: Verify no overlaps. Each allocation starts where the previous one ended.

VLSM requires classless routing protocols (OSPF, EIGRP, BGP) that advertise the subnet mask with each route. Classful protocols (RIPv1, IGRP) cannot handle VLSM because they assume fixed mask lengths based on the address class.

## Private vs Public IP Address Spaces

RFC 1918 defines three private IP address ranges that are not routable on the public internet:

```
10.0.0.0/8       (10.0.0.0 - 10.255.255.255)      — 16,777,216 addresses
172.16.0.0/12    (172.16.0.0 - 172.31.255.255)     — 1,048,576 addresses
192.168.0.0/16   (192.168.0.0 - 192.168.255.255)   — 65,536 addresses
```

These addresses can be used freely within private networks but must not be routed on the public internet. When a private-addressed host needs to communicate with the internet, its traffic passes through a NAT device that translates private addresses to public ones.

Additional special-purpose address ranges:
- 127.0.0.0/8: Loopback (127.0.0.1 is localhost)
- 169.254.0.0/16: Link-local (APIPA — used when DHCP fails)
- 224.0.0.0/4: Multicast
- 240.0.0.0/4: Reserved for future use
- 0.0.0.0/8: "This" network (used in bootstrapping)

IPv4 address exhaustion drove the need for NAT. In the early 1990s, it was clear that 4.3 billion addresses would not be enough. Classless addressing (CIDR) extended the lifespan, and NAT made it possible for millions of devices to share a single public IP. But NAT breaks the end-to-end principle — hosts behind NAT cannot be directly reached from the internet without port forwarding.

## NAT, PAT, and Port Forwarding

### Static NAT (One-to-One)

Static NAT maps one private IP to one public IP permanently. This is used when you need a server behind NAT to be reachable from the internet on a consistent address.

On a Linux router with iptables:
```bash
# Static NAT: map 10.0.1.10 to public IP 203.0.113.10
iptables -t nat -A POSTROUTING -s 10.0.1.10 -o eth0 -j SNAT --to-source 203.0.113.10
iptables -t nat -A PREROUTING -i eth0 -d 203.0.113.10 -j DNAT --to-destination 10.0.1.10
```

### Dynamic NAT

Dynamic NAT maps private IPs to a pool of public IPs on a first-come, first-served basis. When the pool is exhausted, additional hosts must wait.

```bash
# Dynamic NAT: map 10.0.1.0/24 to a pool of 5 public IPs
iptables -t nat -A POSTROUTING -s 10.0.1.0/24 -o eth0 -j SNAT --to-source 203.0.113.1-203.0.113.5
```

### PAT (Port Address Translation)

PAT (also called NAT Overload) maps multiple private IPs to a single public IP by differentiating sessions with port numbers. This is what your home router does. Thousands of internal devices share one public IP, and the router tracks each session by source IP + source port.

```bash
# PAT: map entire 10.0.1.0/24 to the router's public IP on eth0
iptables -t nat -A POSTROUTING -s 10.0.1.0/24 -o eth0 -j MASQUERADE
```

MASQUERADE is iptables' shorthand for SNAT with the outgoing interface's current IP. It handles dynamic WAN IPs (like DHCP or PPPoE) gracefully.

When the router receives a response from the internet, it looks up the destination port in its NAT translation table, finds the matching internal host, rewrites the destination IP and port, and forwards the packet.

### Port Forwarding

Port forwarding makes an internal service reachable from the internet. You map a specific port on your public IP to a specific internal IP and port.

```bash
# Forward external port 8080 to internal web server at 10.0.1.20:80
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 8080 -j DNAT --to-destination 10.0.1.20:80
iptables -A FORWARD -i eth0 -p tcp -d 10.0.1.20 --dport 80 -j ACCEPT
```

The first rule rewrites the destination address. The second rule allows the forwarded traffic through the firewall (iptables' default FORWARD chain policy is often DROP).

### NAT Traversal Challenges

NAT complicates several protocols:
- **FTP**: The PORT command embeds IP addresses in the payload. FTP helper modules in NAT devices rewrite these.
- **SIP/RTP (VoIP)**: SIP embeds IP addresses in the body. NAT breaks this without STUN, TURN, or ICE.
- **IPSec**: ESP (Encapsulating Security Payload) does not contain port numbers, making PAT difficult. NAT-Traversal (NAT-T) encapsulates ESP in UDP port 4500 to solve this.
- **P2P applications**: Direct connections between two NAT'd hosts require hole punching (STUN) or a relay server (TURN).

## IPv6 Fundamentals

IPv6 uses 128-bit addresses, written as eight groups of four hexadecimal digits separated by colons:

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
```

Leading zeros within a group can be omitted, and one consecutive group of all zeros can be replaced with `::`:

```
2001:db8:85a3::8a2e:370:7334
```

### IPv6 Address Types

- **Global Unicast (2000::/3)**: Public internet-routable addresses. Equivalent to IPv4 public addresses.
- **Link-Local (fe80::/10)**: Automatically assigned to every interface. Used for neighbor discovery, routing protocol peering, and as next-hop addresses. Not routable beyond the local link.
- **Unique Local (fc00::/7)**: Private addresses, equivalent to RFC 1918. Not routable on the public internet.
- **Multicast (ff00::/8)**: Group communication. Replaces IPv4 broadcast.
- **Loopback (::1/128)**: Equivalent to 127.0.0.1.

### IPv6 Address Assignment

SLAAC (Stateless Address Autoconfiguration) allows hosts to generate their own addresses without DHCP. The process:

1. Host generates a link-local address using its MAC address (EUI-64) or a random identifier (privacy extensions).
2. Host sends a Router Solicitation (ICMPv6 Type 133) to the multicast address ff02::2.
3. Router responds with a Router Advertisement (ICMPv6 Type 134) containing the prefix (e.g., 2001:db8:1::/64) and other parameters.
4. Host combines the prefix with its interface identifier to form a global unicast address.

DHCPv6 is the stateful alternative, providing addresses and other configuration (DNS servers, domain name) from a server.

### IPv6 and NAT

IPv6's massive address space eliminates the need for NAT. Every device can have a public address. This restores end-to-end connectivity and simplifies many protocols. However, some organizations still use NAT66 for policy reasons or to hide their addressing scheme.

### Dual-Stack and Tunneling

During the transition from IPv4 to IPv6, many networks run dual-stack (both IPv4 and IPv6 on the same interface). Tunneling mechanisms encapsulate IPv6 in IPv4 (6to4, Teredo, ISATAP) or IPv4 in IPv6 (464XLAT). In practice, most modern networks use native dual-stack or NAT64/DNS64 for IPv6-only networks that need to reach IPv4-only destinations.

## IPv6 Address Planning

While IPv6 eliminates the need for NAT and subnetting in the traditional sense, address planning is still important for security, routing, and management.

### IPv6 Subnetting

IPv6 uses /64 subnets by default for host networks. This is because SLAAC (Stateless Address Autoconfiguration) requires a /64 prefix. You do not subnet /64s into smaller pieces — instead, you allocate /64s from your allocated prefix.

If you have a /48 allocation from your ISP, you have:
- 2^(48-64) = 2^-16 ... wait, that's wrong.
- Actually, a /48 gives you 2^(64-48) = 2^16 = 65,536 /64 subnets.

### IPv6 Address Planning Strategy

For a campus network with 200 buildings:
- Each building gets a /56 (256 /64 subnets)
- Within each building:
  - VLAN 10 (data): 2001:db8:0001::/64
  - VLAN 20 (VoIP): 2001:db8:0002::/64
  - VLAN 30 (management): 2001:db8:0003::/64
  - etc.

The addressing plan should be hierarchical and readable. A common approach is to use the fourth hextet for site/building and the fifth hextet for VLAN or function.

## Real Scenario: Designing a Network for 500 Hosts

Your company is moving into a new office building. You have been allocated 192.168.0.0/22 (1,024 addresses) from your ISP. The building has three floors, and you need to design the addressing scheme.

### Requirements Gathering

Floor 1 (Ground Floor): 150 employees, 50 VoIP phones, 30 printers, 20 security cameras
Floor 2 (Second Floor): 120 employees, 40 VoIP phones, 15 printers
Floor 3 (Third Floor): 100 employees, 35 VoIP phones, 10 printers, a server room with 25 servers

Shared infrastructure: 2 core routers, 8 access switches, 2 WAN links, 4 access points

### Design Decisions

1. Separate VLANs for data, VoIP, and printers on each floor. This gives you security isolation, QoS control, and broadcast domain management.
2. Use VLSM to allocate addresses efficiently.
3. Reserve space for growth (at least 30% per VLAN).

### Allocation Plan

```
VLAN 10 - Floor 1 Data:      192.168.0.0/24    (254 hosts, need 150+30% = 195)
VLAN 11 - Floor 1 VoIP:      192.168.1.0/26    (62 hosts, need 50+30% = 65, but 62 is tight — see below)
VLAN 12 - Floor 1 Printers:  192.168.1.64/27   (30 hosts, need 30)
VLAN 13 - Floor 1 Cameras:   192.168.1.96/27   (30 hosts, need 20)

VLAN 20 - Floor 2 Data:      192.168.2.0/25    (126 hosts, need 120+30% = 156 — not enough)
```

Wait — 120 employees + 30% growth = 156 hosts, but /25 only gives 126. We need to adjust:

```
VLAN 20 - Floor 2 Data:      192.168.2.0/24    (254 hosts, need 156)
VLAN 21 - Floor 2 VoIP:      192.168.3.0/26    (62 hosts, need 40+30% = 52)
VLAN 22 - Floor 2 Printers:  192.168.3.64/27   (30 hosts, need 15)

VLAN 30 - Floor 3 Data:      192.168.4.0/25    (126 hosts, need 100+30% = 130 — too small)
```

Adjust again:

```
VLAN 30 - Floor 3 Data:      192.168.4.0/24    (254 hosts)
VLAN 31 - Floor 3 VoIP:      192.168.5.0/26    (62 hosts)
VLAN 32 - Floor 3 Printers:  192.168.5.64/27   (30 hosts)
VLAN 33 - Server Room:       192.168.5.96/27   (30 hosts, need 25)

VLAN 99 - Management:        192.168.6.0/24    (for switch/router management)
VLAN 90 - DMZ:               192.168.7.0/25    (126 addresses for future DMZ)

WAN Links:
  Link 1 (ISP):             192.168.0.252/30  (192.168.0.253 usable)
  Link 2 (Backup ISP):      192.168.0.248/30  (192.168.0.249 usable)
```

Wait — we used /22 (192.168.0.0 to 192.168.3.255). But our allocation spans into 192.168.4.x, 192.168.5.x, 192.168.6.x, 192.168.7.x. That does not fit in /22. We need to re-examine the available space.

A /22 gives us 192.168.0.0 through 192.168.3.255 (1,024 addresses). We have allocated well beyond that. The correct approach is to work within the actual allocation:

```
192.168.0.0/22 = 192.168.0.0 - 192.168.3.255 (1024 addresses)

VLAN 10 - Floor 1 Data:      192.168.0.0/24    (254 hosts)
VLAN 11 - Floor 1 VoIP:      192.168.1.0/26    (62 hosts)
VLAN 12 - Floor 1 Printers:  192.168.1.64/27   (30 hosts)
VLAN 13 - Floor 1 Cameras:   192.168.1.96/27   (30 hosts)
VLAN 20 - Floor 2 Data:      192.168.1.128/25  (126 hosts — tight but acceptable with /25)
VLAN 21 - Floor 2 VoIP:      192.168.2.0/26    (62 hosts)
VLAN 22 - Floor 2 Printers:  192.168.2.64/27   (30 hosts)
VLAN 30 - Floor 3 Data:      192.168.2.128/25  (126 hosts)
VLAN 31 - Floor 3 VoIP:      192.168.3.0/26    (62 hosts)
VLAN 32 - Floor 3 Printers:  192.168.3.64/27   (30 hosts)
VLAN 33 - Server Room:       192.168.3.96/27   (30 hosts)
VLAN 99 - Management:        192.168.3.128/26  (62 hosts for management)
WAN Link 1:                  192.168.3.192/30  (192.168.3.193)
WAN Link 2:                  192.168.3.196/30  (192.168.3.197)
```

This fits within the /22 allocation. Floor 2 and Floor 3 data VLANs are tight at /25 (126 hosts), but with only 120 and 100 employees respectively, there is room for some growth. If the company expects rapid expansion, you would request a larger allocation from the ISP.

### Router Configuration Snippet

On a Cisco router for inter-VLAN routing:

```
interface GigabitEthernet0/0.10
 description Floor1-Data
 encapsulation dot1Q 10
 ip address 192.168.0.1 255.255.255.0
 ip helper-address 192.168.5.100

interface GigabitEthernet0/0.11
 description Floor1-VoIP
 encapsulation dot1Q 11
 ip address 192.168.1.1 255.255.255.192
```

The `ip helper-address` forwards DHCP requests to the DHCP server on the server VLAN.

### Documentation

Every network design needs documentation. Record:
- VLAN ID, name, subnet, gateway, DHCP scope, and purpose
- Which switch ports belong to which VLANs
- Which router interfaces serve as gateways
- DHCP scope ranges and exclusions
- DNS servers assigned to each VLAN
- Any ACLs or firewall rules between VLANs

This documentation should be maintained in a version-controlled system and updated whenever changes are made. A spreadsheet is acceptable for small networks; for larger deployments, consider IPAM (IP Address Management) tools like NetBox, phpIPAM, or commercial solutions.

## Subnetting Verification Tools

While you should learn to subnet by hand, verification tools are essential for checking your work and for production environments.

### Online Calculators

- **ipcalc**: Command-line tool for IP address calculations
- **subnet-calculator.com**: Web-based calculator
- **Cisco Subnet Calculator**: Comprehensive tool with wildcard masks

### ipcalc Usage

```bash
# Install ipcalc
apt install ipcalc

# Calculate network info
ipcalc 192.168.1.77/26
# Output:
# Address:   192.168.1.77
# Netmask:   255.255.255.192 = 26
# Wildcard:  0.0.0.63
# Network:   192.168.1.64/26
# HostMin:   192.168.1.65
# HostMax:   192.168.1.126
# Broadcast: 192.168.1.127
# Hosts/Net: 62

# Check for overlap between subnets
ipcalc 10.0.1.0/24 10.0.2.0/24
# ipcalc will indicate if the subnets overlap
```

### Python Subnet Calculator

```python
import ipaddress

# Calculate network info
network = ipaddress.ip_network('192.168.1.77/26')
print(f"Network: {network.network_address}")
print(f"Broadcast: {network.broadcast_address}")
print(f"Hosts: {network.num_addresses - 2}")
print(f"Host range: {list(network.hosts())[:3]}...")

# Check overlap
net1 = ipaddress.ip_network('10.0.1.0/24')
net2 = ipaddress.ip_network('10.0.2.0/24')
print(f"Overlap: {net1.overlaps(net2)}")
```

## IP Address Management (IPAM)

As networks grow, tracking IP address assignments manually becomes impossible. IPAM tools provide centralized management of IP address space, DNS, and DHCP.

### IPAM Solutions

- **NetBox**: Open-source, excellent for documentation and automation
- **phpIPAM**: Open-source, web-based IPAM
- **Infoblox**: Commercial, enterprise-grade
- **BlueCat**: Commercial, DNS/DHCP/IPAM integrated

### IPAM Best Practices

1. **Document everything**: Every IP assignment, DHCP reservation, DNS record
2. **Use VLANs and subnets logically**: Group by function, not location
3. **Reserve ranges**: DHCP scopes, static assignments, infrastructure, guests
4. **Monitor utilization**: Set alerts when subnets reach 80% capacity
5. **Automate**: Use APIs to sync IPAM with DNS, DHCP, and provisioning systems

### NetBox Quick Start

```bash
# Install NetBox (Docker)
git clone https://github.com/netbox-community/netbox-docker.git
cd netbox-docker
docker-compose up -d

# Access at http://localhost:8000
# Default credentials: admin / admin
```

Document your IP space, VLANs, devices, and connections. NetBox generates prefixes, IP addresses, and VLANs that can be queried via API for automation.

## Assessment

**Lab Exercise: Subnetting Problem Set (60 minutes)**

Task 1 (20 minutes): Given the network 172.16.0.0/16, design a VLSM scheme that accommodates:
- 5 departments with 100 hosts each
- 3 point-to-point WAN links
- A DMZ with 50 servers
- A management network for 30 network devices

Write out all subnet IDs, ranges, broadcasts, and masks.

Task 2 (20 minutes): You discover the following IP configuration on a host: IP 10.45.78.130/27. Determine:
- The network address
- The broadcast address
- The usable host range
- The number of usable hosts
- Whether 10.45.78.160 is in the same subnet

Task 3 (20 minutes): Convert the following IPv6 addresses to their shortest canonical form:
- 2001:0db8:0000:0000:0000:0000:0000:0001
- fe80:0000:0000:0000:0202:b3ff:fe1e:8329
- 0000:0000:0000:0000:0000:0000:0000:0001
- 2001:0db8:0001:0000:0000:0000:0000:0001

Then determine the link-local address that would be auto-generated for a host with MAC address 00:1A:2B:3C:4D:5E (using EUI-64).

**Grading Criteria:**
- VLSM design correctness and efficiency: 30 points
- Subnet calculations accuracy: 30 points
- IPv6 formatting: 20 points
- Documentation quality and completeness: 20 points

## Evidence

Save the following to your portfolio:
1. Your complete VLSM design for Task 1, showing all subnets with no overlaps
2. The subnet calculations for Task 2, showing your work (not just the answer)
3. The canonical IPv6 addresses and EUI-64 derivation for Task 3
4. A network diagram (even a rough sketch) showing the VLAN layout from the real scenario section, with subnets labeled

Subnetting is a skill that improves with practice. Work through the exercises without a calculator until the process becomes automatic. The ability to quickly verify subnet boundaries, identify overlaps, and design efficient addressing schemes separates competent network engineers from everyone else.