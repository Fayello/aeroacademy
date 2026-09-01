# Module 5: Switching and VLANs

Switches operate at Layer 2 of the OSI model, forwarding frames based on MAC addresses rather than IP addresses. In a flat network with a single broadcast domain, every device sees every broadcast frame ARP requests, DHCP discoveries, NetBIOS announcements. This creates security risks, performance degradation, and management headaches. VLANs solve this by logically segmenting a single physical switch into multiple logical networks, each with its own broadcast domain.

This module covers Layer 2 switching mechanics, VLAN configuration and trunking, inter-VLAN routing, Spanning Tree Protocol, link aggregation, and port security. By the end, you will be able to segment a flat network into properly isolated VLANs with inter-VLAN routing.

## Layer 2 Switching: MAC Addresses and CAM Tables

When an Ethernet frame arrives at a switch port, the switch examines the source MAC address and records which port it came from in its CAM (Content Addressable Memory) table. It then examines the destination MAC address and looks it up in the CAM table. If found, the frame is forwarded only out the matching port. If not found, the frame is flooded out all ports except the source port (unknown unicast flooding).

### CAM Table Operation

```
MAC Address          Port       VLAN    Type       Age
00:1a:2b:3c:4d:5e   Gi0/1      10      Dynamic    00:05
00:1c:0e:7f:8e:9a   Gi0/2      10      Dynamic    00:03
00:22:33:44:55:66   Gi0/3      20      Static     -
ff:ff:ff:ff:ff:ff   *          all     Static     -
```

The CAM table is a lookup table in switch memory (TCAM on managed switches) that maps MAC addresses to ports. On a managed switch, it also tracks the VLAN. The Age column shows how long since the MAC was last seen; entries expire after a configurable timeout (default 300 seconds on most switches).

When a frame arrives with destination MAC `00:1a:2b:3c:4d:5e`, the switch finds it on Gi0/1 and forwards the frame only to that port. When a frame arrives with destination MAC `aa:bb:cc:dd:ee:ff` (not in the table), the switch floods it to all ports in the same VLAN except the source port.

### Broadcast, Multicast, and Unknown Unicast

- **Broadcast** (destination ff:ff:ff:ff:ff:ff): Flooded to all ports in the VLAN.
- **Multicast** (destination 01:00:5e:xx:xx:xx): Flooded to all ports in the VLAN unless IGMP snooping is configured to prune multicast to only subscribed ports.
- **Unknown unicast**: Flooded to all ports in the VLAN (same as broadcast behavior, but only for the specific destination MAC).
- **Known unicast**: Forwarded to the specific port only.

The difference between a hub and a switch is fundamental. A hub repeats every frame out every port. A switch forwards frames intelligently based on the CAM table. This is why switches are called "multiport bridges": they perform the same function as a bridge but with many ports.

### CAM Table Attacks

**MAC flooding**: An attacker sends thousands of frames with spoofed source MAC addresses, filling the CAM table. When the table is full, the switch fails open and floods all frames like a hub, allowing the attacker to sniff traffic.

**CAM table overflow attack demonstration:**
```bash
# Using macof (from dsniff package) to flood the CAM table
macof -i eth0 -s 10.0.1.0/24 -d 10.0.1.1
```

**Mitigation**: Port security (covered at the end of this module) limits the number of MAC addresses per port.

## VLANs: Creation, Trunking, and Configuration

VLANs (Virtual Local Area Networks) partition a switch into multiple logical switches. Each VLAN is an independent broadcast domain. Frames from VLAN 10 never leak into VLAN 20 unless explicitly routed at Layer 3.

### VLAN Configuration

On a Cisco managed switch:
```
# Create VLANs
vlan 10
 name Sales
vlan 20
 name Engineering
vlan 30
 name Servers
vlan 99
 name Management

# Assign access ports to VLANs
interface GigabitEthernet0/1
 switchport mode access
 switchport access vlan 10
 description Sales-Workstation-01

interface GigabitEthernet0/2
 switchport mode access
 switchport access vlan 20
 description Engineering-Workstation-01
```

On a Linux bridge (for software-defined networking):
```bash
# Create a bridge and add VLANs
ip link add br0 type bridge vlan_filtering 1
ip link set br0 up

# Add VLAN 10 on bridge port eth0
bridge vlan add dev eth0 vid 10 pvid untagged

# Add VLAN 20 on bridge port eth1
bridge vlan add dev eth1 vid 20 pvid untagged
```

### Access Ports vs Trunk Ports

**Access port**: A port that belongs to a single VLAN. Frames on access ports are untagged (the VLAN is implicit based on the port configuration). Used for end devices (computers, printers, phones).

**Trunk port**: A port that carries traffic for multiple VLANs. Frames on trunk ports are tagged with 802.1Q VLAN tags so the receiving device knows which VLAN each frame belongs to. Used between switches, between switches and routers, and between switches and servers with VLAN-capable NICs.

### 802.1Q Tagging

The 802.1Q standard inserts a 4-byte tag into the Ethernet frame header:

```
| Dest MAC (6) | Src MAC (6) | 802.1Q Tag (4) | EtherType (2) | Payload (46-1500) | FCS (4) |
```

The 802.1Q tag contains:
- **TPID (Tag Protocol Identifier)**: 0x8100: identifies this as an 802.1Q tagged frame.
- **PCP (Priority Code Point)**: 3 bits: QoS priority (0-7).
- **DEI (Drop Eligible Indicator)**: 1 bit: marks frames eligible for dropping under congestion.
- **VID (VLAN Identifier)**: 12 bits: the VLAN ID (0-4095). VLAN 0 and 4095 are reserved.

The maximum number of usable VLANs is 4094 (1-4094). The standard MTU of 1500 bytes includes the 4-byte 802.1Q tag, so the maximum payload on a trunk is slightly reduced. This is why jumbo frames on trunks need to account for the tag overhead.

### Native VLAN

The native VLAN on a trunk port carries untagged traffic. By default, this is VLAN 1 on most switches. If both ends of a trunk have different native VLANs, a VLAN hopping attack is possible.

**Best practice**: Set the native VLAN to an unused VLAN and ensure it is not assigned to any access ports.

```
interface GigabitEthernet0/24
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30
```

The `allowed vlan` command restricts which VLANs can traverse the trunk, reducing broadcast traffic and improving security.

### VLAN Hopping

VLAN hopping is an attack where an attacker on one VLAN can send traffic to another VLAN without going through a router. Two methods:

**Switch spoofing**: The attacker negotiates a trunk link with the switch using DTP (Dynamic Trunking Protocol). If the switch has DTP enabled (it is by default on many switches), the attacker can become a trunk and access all VLANs.

**Double tagging**: The attacker sends a frame with two 802.1Q tags. The outer tag specifies the native VLAN (which is stripped by the first switch), and the inner tag specifies the target VLAN.

**Mitigations**:
- Disable DTP on all access ports: `switchport nonegotiate`
- Set native VLAN to an unused VLAN on all trunks
- Explicitly allow only needed VLANs on trunks
- Do not use VLAN 1 for anything

## Inter-VLAN Routing

VLANs isolate traffic by design. For devices in different VLANs to communicate, traffic must be routed. There are three methods for inter-VLAN routing:

### Router-on-a-Stick

A single router interface connects to the switch via a trunk port. The router has sub-interfaces for each VLAN:

```
interface GigabitEthernet0/0
 no ip address

interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0

interface GigabitEthernet0/0.20
 encapsulation dot1Q 20
 ip address 192.168.20.1 255.255.255.0
```

Traffic from VLAN 10 to VLAN 20 travels: host → switch (access port VLAN 10) → switch (trunk to router) → router (sub-interface .10) → routing decision → router (sub-interface .20) → switch (trunk) → switch (access port VLAN 20) → destination.

**Limitation**: All inter-VLAN traffic shares the bandwidth of a single physical link. If the link is 1 Gbps, the maximum aggregate throughput between VLANs is 1 Gbps.

### Layer 3 Switch

A Layer 3 switch (e.g., Cisco Catalyst 3560, 3850) performs routing in hardware at wire speed. This is the preferred approach for production networks:

```
ip routing

interface Vlan10
 ip address 192.168.10.1 255.255.255.0
 no shutdown

interface Vlan20
 ip address 192.168.20.1 255.255.255.0
 no shutdown
```

The `ip routing` command enables Layer 3 routing on the switch. Each VLAN interface (SVI: Switch Virtual Interface) acts as the default gateway for that VLAN. Inter-VLAN routing happens at wire speed within the switch fabric: no external router needed.

### Layer 3 Switch with OSPF

For larger networks, the Layer 3 switch can run OSPF to exchange routes with other routers:

```
router ospf 1
 network 192.168.10.0 0.0.0.255 area 0
 network 192.168.20.0 0.0.0.255 area 0
 network 10.0.0.0 0.0.0.255 area 0
```

This allows the switch to participate in the broader routing architecture and make intelligent forwarding decisions.

## Spanning Tree Protocol (STP)

Without STP, a loop in a Layer 2 network causes a broadcast storm: broadcast frames are forwarded endlessly, consuming all bandwidth and crashing switches. STP prevents loops by logically blocking redundant links.

### How STP Works

1. All switches exchange BPDU (Bridge Protocol Data Unit) frames to discover the topology.
2. One switch is elected as the Root Bridge (lowest bridge ID = priority + MAC address).
3. Each non-root switch selects a Root Port (the port with the shortest path to the root).
4. On each network segment, one switch is elected as the Designated Forwarder (the switch that forwards traffic for that segment).
5. All other ports are placed in Blocking state: they do not forward traffic but continue listening for BPDUs.

If a link fails, STP reconverges by unblocking the appropriate ports. Standard STP (IEEE 802.1D) takes 30-50 seconds to reconverge, which is unacceptable for many applications.

### RSTP (Rapid Spanning Tree)

RSTP (IEEE 802.1w) dramatically reduces reconvergence time to 1-6 seconds. Key improvements:

- **Proposal/Agreement mechanism**: New links can be rapidly placed in forwarding state without waiting for the full forward delay.
- **Alternate and Backup ports**: RSTP pre-calculates backup paths so that when a link fails, the alternate port can transition to forwarding immediately.
- **Edge ports**: Ports connected to end devices (not other switches) can skip the listening/learning states and go directly to forwarding.

Configuration on Cisco IOS:
```
spanning-tree mode rapid-pvst
spanning-tree vlan 10 priority 4096
spanning-tree vlan 20 priority 8192

interface GigabitEthernet0/1
 spanning-tree portfast
 spanning-tree bpduguard enable
```

**PortFast** enables edge port behavior: the port goes straight to forwarding without listening/learning. **BPDU Guard** shuts down the port if it receives a BPDU (indicating a switch was connected where a host should be, possibly an attack).

### STP Best Practices

- Use RSTP (rapid-pvst) instead of classic STP.
- Set the root bridge explicitly with priority values (don't let the lowest MAC address win by accident).
- Enable PortFast and BPDU Guard on all access ports.
- Do not enable PortFast on trunk ports or ports connected to other switches.
- Monitor for topology changes with `show spanning-tree detail`.

## Link Aggregation (LACP)

Link aggregation combines multiple physical links into a single logical link, increasing bandwidth and providing redundancy. LACP (Link Aggregation Control Protocol, IEEE 802.3ad) dynamically negotiates link aggregation between switches.

### LACP Configuration

On Cisco IOS:
```
interface Port-channel1
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30

interface GigabitEthernet0/1
 channel-group 1 mode active
interface GigabitEthernet0/2
 channel-group 1 mode active
```

On Linux:
```bash
# Create a bond interface with LACP
ip link add bond0 type bond mode 802.3ad
ip link set eth0 down
ip link set eth1 down
ip link set eth0 master bond0
ip link set eth1 master bond0
ip link set bond0 up
ip addr add 10.0.1.1/24 dev bond0

# Verify LACP status
cat /proc/net/bonding/bond0
```

### LACP Modes

- **Active**: The port actively initiates LACP negotiation.
- **Passive**: The port responds to LACP negotiation but does not initiate.

For a link to come up, at least one side must be in active mode. Both sides passive = no negotiation.

### Hash Algorithms

Link aggregation uses a hash algorithm to determine which physical link carries which traffic. Common hash inputs:
- Source MAC
- Destination MAC
- Source + Destination MAC
- Source IP
- Destination IP
- Source + Destination IP
- Source + Destination IP + Port

The hash algorithm determines load distribution. If all traffic is between two hosts (same src/dst MAC), only one link in the bundle will be used. Using source + destination IP + port provides the best distribution for most traffic patterns.

## Port Security

Port security limits which MAC addresses can access a port, preventing unauthorized devices and MAC flooding attacks.

### Sticky MAC Address Learning

```
interface GigabitEthernet0/1
 switchport mode access
 switchport port-security
 switchport port-security maximum 2
 switchport port-security mac-address sticky
 switchport port-security violation restrict
```

This configuration:
- Enables port security on the port.
- Allows a maximum of 2 MAC addresses.
- "Sticky" learning automatically saves learned MAC addresses to the running configuration.
- On violation (unauthorized MAC detected), the port restricts (drops frames from the unauthorized MAC but does not shut down) and generates a log entry.

### Violation Modes

- **Protect**: Drops frames from unauthorized MACs. No log entry.
- **Restrict**: Drops frames from unauthorized MACs. Generates a log entry and SNMP trap.
- **Shutdown**: Disables the port (err-disabled state). Requires manual re-enable or automatic recovery with `errdisable recovery cause psecure-violation`.

### Static MAC Configuration

For critical devices (servers, printers), you can pre-configure the allowed MAC addresses:

```
interface GigabitEthernet0/1
 switchport mode access
 switchport port-security
 switchport port-security maximum 1
 switchport port-security mac-address 001a.2b3c.4d5e
 switchport port-security violation shutdown
```

## VLAN Trunk Configuration

Trunk ports carry traffic for multiple VLANs between switches. Proper trunk configuration is essential for VLANs to work across your infrastructure.

### 802.1Q Trunk Negotiation

DTP (Dynamic Trunking Protocol) automatically negotiates trunk formation between Cisco switches. However, DTP is a security risk: an attacker can use it to negotiate a trunk and access all VLANs.

```bash
# Disable DTP on access ports (security best practice)
interface GigabitEthernet0/1
 switchport mode access
 switchport nonegotiate

# Configure a trunk explicitly (no DTP)
interface GigabitEthernet0/24
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,99
 switchport nonegotiate
```

### Trunk Verification

```bash
# Show trunk status
show interface trunk

# Show VLANs on a trunk
show interfaces gi0/24 switchport

# Show DTP status
show dtp interface gi0/24

# Test trunk connectivity
# From Switch 1, ping across the trunk to Switch 2's VLAN interface
ping 192.168.10.2
```

### Native VLAN Security

The native VLAN on a trunk carries untagged traffic. If both ends of a trunk have different native VLANs, a VLAN hopping attack is possible. The attacker sends a frame tagged with the native VLAN on one side, which arrives untagged on the other side, bypassing VLAN isolation.

```bash
# Set native VLAN to an unused VLAN on all trunks
interface GigabitEthernet0/24
 switchport trunk native vlan 999

# Ensure no access ports use the native VLAN
interface GigabitEthernet0/1
 switchport mode access
 switchport access vlan 10
# NOT vlan 999
```

## Real Scenario: Segmenting a Flat Network into VLANs

Your company has a flat network: 200 devices on a single VLAN, all on the same broadcast domain. Performance is degrading, there is no traffic isolation, and anyone can access any device. You need to segment the network into VLANs.

### Current State
- 1 core switch (Cisco Catalyst 3850)
- 8 access switches (Cisco Catalyst 2960)
- 200 devices: 120 workstations, 30 printers, 20 VoIP phones, 30 servers
- All on VLAN 1, subnet 192.168.1.0/24

### Target Design

```
VLAN 10 - Workstations: 192.168.10.0/24 (120 hosts)
VLAN 20 - Printers:     192.168.20.0/24 (30 hosts)
VLAN 30 - VoIP:         192.168.30.0/24 (20 hosts)
VLAN 40 - Servers:      192.168.40.0/24 (30 hosts)
VLAN 99 - Management:   192.168.99.0/24 (switch management)
```

### Implementation Steps

**Step 1: Create VLANs on all switches.**
```
vlan 10
 name Workstations
vlan 20
 name Printers
vlan 30
 name VoIP
vlan 40
 name Servers
vlan 99
 name Management
```

**Step 2: Configure trunk ports between switches.**
```
# Core switch to access switch trunks
interface GigabitEthernet1/0/1
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,40,99
 switchport trunk native vlan 999
```

**Step 3: Assign access ports to VLANs.**

For workstations:
```
interface GigabitEthernet1/0/10
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
 spanning-tree bpduguard enable
```

For VoIP phones (with PC behind phone):
```
interface GigabitEthernet1/0/20
 switchport mode access
 switchport access vlan 10
 switchport voice vlan 30
 spanning-tree portfast
```

The `voice vlan` command tells the phone to use VLAN 30 for voice traffic and the PC connected to the phone's switch port to use VLAN 10.

**Step 4: Configure Layer 3 switch for inter-VLAN routing.**
```
ip routing

interface Vlan10
 ip address 192.168.10.1 255.255.255.0
 no shutdown

interface Vlan20
 ip address 192.168.20.1 255.255.255.0
 no shutdown

interface Vlan30
 ip address 192.168.30.1 255.255.255.0
 no shutdown

interface Vlan40
 ip address 192.168.40.1 255.255.255.0
 no shutdown

interface Vlan99
 ip address 192.168.99.1 255.255.255.0
 no shutdown
```

**Step 5: Configure DHCP.**
```
ip dhcp pool WORKSTATIONS
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.1
 dns-server 8.8.8.8 8.8.4.4

ip dhcp pool PRINTERS
 network 192.168.20.0 255.255.255.0
 default-router 192.168.20.1
 dns-server 8.8.8.8

ip dhcp excluded-address 192.168.10.1 192.168.10.10
ip dhcp excluded-address 192.168.20.1 192.168.20.10
```

**Step 6: Configure port security on access ports.**
```
interface range GigabitEthernet1/0/1 - 24
 switchport port-security
 switchport port-security maximum 3
 switchport port-security mac-address sticky
 switchport port-security violation restrict
```

**Step 7: Disable unused ports.**
```
interface GigabitEthernet1/0/23
 switchport mode access
 switchport access vlan 999
 shutdown

interface GigabitEthernet1/0/24
 switchport mode access
 switchport access vlan 999
 shutdown
```

Put unused ports in a "parking" VLAN that does not route anywhere and shut them down. This prevents unauthorized access through physically available ports.

### Verification

```bash
# Verify VLANs
show vlan brief

# Verify trunk status
show interface trunk

# Verify MAC address table
show mac address-table

# Verify inter-VLAN routing
ping 192.168.20.1 from 192.168.10.10
ping 192.168.40.10 from 192.168.10.10

# Verify port security
show port-security interface Gi0/1
show port-security address
```

## VLAN Troubleshooting

When VLANs are not working as expected, the issue is almost always a misconfiguration on a trunk, access port, or VLAN database.

### Common VLAN Issues

**VLAN not reachable:**
```bash
# Verify VLAN exists on all switches
show vlan brief

# Verify trunk allows the VLAN
show interface trunk | grep VLAN

# Check for pruned VLANs
show interface gi0/24 switchport | grep "Tringing VLANs"
```

**Inter-VLAN routing not working:**
```bash
# Verify SVI (Switch Virtual Interface) is up
show ip interface brief | grep Vlan

# Verify IP address on SVI
show running-config interface Vlan10

# Check for ACLs blocking traffic
show ip access-lists
```

**DHCP not working on new VLAN:**
```bash
# Verify DHCP pool exists
show ip dhcp pool

# Verify DHCP helper address is configured on SVI
show running-config interface Vlan10 | grep helper

# Check DHCP binding table
show ip dhcp binding
```

### VLAN Hopping Detection

```bash
# Monitor for unexpected VLAN tags
tcpdump -i eth0 -nn -e vlan

# Check for double-tagged frames (attack indicator)
tcpdump -i eth0 -nn -e 'vlan and vlan'
```

## Private VLANs (PVLAN)

Private VLANs provide additional isolation within a single VLAN. Even devices in the same subnet cannot communicate directly: all traffic must pass through a Layer 3 gateway.

### PVLAN Types

- **Promiscuous**: Can communicate with all other ports (typically the gateway)
- **Isolated**: Can only communicate with promiscuous ports (not with other isolated ports)
- **Community**: Can communicate with other community ports in the same community and with promiscuous ports

### PVLAN Configuration

```
# Create primary VLAN
vlan 100
 private-vlan primary

# Create secondary VLANs
vlan 101
 private-vlan isolated
vlan 102
 private-vlan community

# Associate secondary with primary
vlan 100
 private-vlan association 101,102

# Configure host ports
interface GigabitEthernet0/1
 switchport mode private-vlan host
 switchport private-vlan host-association 100 101

# Configure promiscuous port (gateway)
interface GigabitEthernet0/24
 switchport mode private-vlan promiscuous
 switchport private-vlan mapping 100 101,102
```

PVLANs are useful for:
- Multi-tenant hosting environments
- PCI DSS compliance (isolating cardholder data)
- Guest networks (isolate guests from each other)

## Assessment

**Lab Exercise: VLAN Design and Configuration (60 minutes)**

Task 1 (20 minutes): Design a VLAN scheme for a two-floor office with:
- 80 workstations (Floor 1: 45, Floor 2: 35)
- 15 printers (Floor 1: 8, Floor 2: 7)
- 10 VoIP phones
- 5 servers
- 2 network printers

Include VLAN IDs, subnets, and which ports on which switches should be in which VLANs.

Task 2 (20 minutes): Write the complete switch configuration for:
- Creating all VLANs
- Configuring trunk ports between switches
- Assigning access ports to VLANs
- Enabling inter-VLAN routing on a Layer 3 switch
- Configuring port security

Task 3 (20 minutes): A user reports they cannot reach the server at 192.168.40.10 from their workstation at 192.168.10.50. Walk through your troubleshooting steps, including specific show commands and what each result tells you. Cover VLAN mismatch, trunk misconfiguration, STP blocking, and IP configuration issues.

**Grading Criteria:**
- VLAN design completeness: 25 points
- Configuration correctness and completeness: 30 points
- Troubleshooting methodology: 25 points
- Port security and STP best practices: 20 points

## Evidence

Save the following to your portfolio:
1. Complete VLAN design diagram showing all VLANs, subnets, and port assignments
2. Full switch configuration for the scenario
3. Troubleshooting walkthrough for Task 3 with show command outputs
4. A written comparison (200-300 words) of router-on-a-stick vs Layer 3 switch for inter-VLAN routing, including when each is appropriate

VLAN segmentation is the foundation of network security and performance. A well-designed VLAN architecture prevents lateral movement, contains broadcast storms, and provides the logical structure that makes a network manageable at scale.