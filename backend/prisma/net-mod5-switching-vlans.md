# Module 5 — Switching and VLANs

**Course:** Networking | **Path:** Networking (5 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 25 min | **Prerequisite:** Module 4 — Routing

---

## What You'll Actually Do

Your network is flat — everything on the same broadcast domain. Engineering can see Finance traffic. You'll segment with VLANs, configure trunk ports, and set up inter-VLAN routing.

---

## How Switches Work

Switches operate at layer2. They forward frames based on MAC addresses.

```bash
# Check MAC address table (on a managed switch)
show mac address-table

# On Linux (ARP table = what the host knows)
arp -a
```

When a switch receives a frame, it learns the source MAC and maps it to a port. Future frames to that MAC go directly to that port.

---

## VLANs — Virtual LANs

VLANs segment a physical network into logical networks. Different VLANs can't communicate without a router.

```
Port 1-10: VLAN 10 (Engineering)
Port 11-20: VLAN 20 (Finance)
Port 21-24: VLAN 30 (IT)
```

Traffic on VLAN10 never reaches VLAN20 unless explicitly routed.

---

## Configuring VLANs on Linux

```bash
# Create VLAN interface
ip link add link ens3 name ens3.10 type vlan id 10
ip link set ens3.10 up
ip addr add 10.0.10.1/24 dev ens3.10

# Create another VLAN
ip link add link ens3 name ens3.20 type vlan id 20
ip link set ens3.20 up
ip addr add 10.0.20.1/24 dev ens3.20
```

Now your server has interfaces on two VLANs.

---

## Trunk Ports

A trunk port carries traffic for multiple VLANs. Tags each frame with its VLAN ID (802.1Q).

```
Switch Port 1 (trunk): carries VLAN10 and VLAN20
  → tagged frame: 802.1Q header with VLAN ID10
  → tagged frame: 802.1Q header with VLAN ID20
```

**On Linux (trunk to a switch):**
```bash
ip link add link ens3 name ens3.10 type vlan id 10
ip link add link ens3 name ens3.20 type vlan id 20
```

---

## Inter-VLAN Routing

VLANs need a router (or layer3 switch) to communicate.

**Router-on-a-stick:**
```
Switch → Router (single cable, trunk)
Router routes between VLANs
```

**On Linux:**
```bash
# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1

# Add NAT for internet access
iptables -t nat -A POSTROUTING -s 10.0.10.0/24 -o ens0 -j MASQUERADE
iptables -t nat -A POSTROUTING -s 10.0.20.0/24 -o ens0 -j MASQUERADE
```

Now VLAN10 and VLAN20 can reach the internet through the Linux router.

---

## Port Security

```bash
# Limit MAC addresses per port (on managed switch)
switchport port-security
switchport port-security maximum 2
switchport port-security violation shutdown

# On Linux (bridge)
bridge fdb add 00:1a:2b:3c:4d:5e dev ens3 master
```

---

## Real Task: Segment a Flat Network

```bash
# 1. Create VLANs on the server
ip link add link ens3 name ens3.10 type vlan id 10
ip link add link ens3 name ens3.20 type vlan id 20
ip link set ens3.10 up
ip link set ens3.20 up
ip addr add 10.0.10.1/24 dev ens3.10
ip addr add 10.0.20.1/24 dev ens3.20

# 2. Enable routing between VLANs
sysctl -w net.ipv4.ip_forward=1
iptables -t nat -A POSTROUTING -s 10.0.10.0/24 -o ens0 -j MASQUERADE
iptables -t nat -A POSTROUTING -s 10.0.20.0/24 -o ens0 -j MASQUERADE

# 3. Test
# From VLAN10 host: ping 10.0.20.1 → should work
# From VLAN10 host: ping internet → should work
```

---

## Assessment

**Lab task (20 min):**

1. Create VLAN interfaces on a server
2. Configure trunk ports
3. Set up inter-VLAN routing
4. Test connectivity between VLANs
5. Verify isolation (VLAN10 can't see VLAN20 broadcast traffic)

**Grading:**
- VLANs created: 20%
- Trunk configured: 20%
- Routing working: 25%
- Connectivity tested: 20%
- Isolation verified: 15%

---

## Evidence

- **OutcomeEvidence:** `NET-LO5 — Switching & VLAN Segmentation`
- **Mastery:** `UserSkill: networking-switching-vlans`

---

## Unlock

Module6 — Firewalls. You can segment networks. Now you learn how to filter traffic.

---

## Sources

- IEEE802.1Q
- `man ip-link`, `man bridge`

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Network engineer who's segmented production networks
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
