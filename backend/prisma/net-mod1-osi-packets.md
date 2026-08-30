# Module 1 — How Packets Actually Move


## What You'll Actually Do

A user says "the internet is slow." You need to figure out where — DNS? Latency? Packet loss? MTU? You'll trace a packet from the application layer down to the wire and back, and learn where things break.

## OSI Is a Model, Not a Rule

OSI has7 layers. TCP/IP has4. Nobody uses OSI exactly, but everyone uses the vocabulary.

| Layer | Name | What it does | Examples |
|-------|------|-------------|----------|
| 7 | Application | What the user sees | HTTP, DNS, SSH, SMTP |
| 6 | Presentation | Encoding, encryption | TLS, SSL, JPEG |
| 5 | Session | Connection management | NetBIOS, RPC |
| 4 | Transport | Reliable/unreliable delivery | TCP, UDP |
| 3 | Network | Routing between networks | IP, ICMP, ARP |
| 2 | Data Link | Local network delivery | Ethernet, Wi-Fi |
| 1 | Physical | Bits on the wire | Cables, switches, signals |

**When debugging:** Start at layer7 (application) and work down. "Can't reach website" → DNS? IP routing? Link down? Cable unplugged?

## TCP — The Reliable One

TCP establishes a connection before sending data. Three-way handshake:

```
Client → Server: SYN
Server → Client: SYN-ACK
Client → Server: ACK
```

Then data flows. Each segment is acknowledged. If lost, it's retransmitted.

**Key fields:**
- Source/Dest port — which application
- Sequence number — ordering
- ACK number — what was received
- Window size — flow control
- Flags — SYN, ACK, FIN, RST

**TCP states:**
```
LISTEN → SYN_SENT → ESTABLISHED → FIN_WAIT → TIME_WAIT → CLOSED
```

You'll see `TIME_WAIT` a lot. It's normal — TCP holds the socket for2×MSL after close to handle delayed packets.

## UDP — The Fast One

No handshake. No acknowledgment. Send and forget.

```
Client → Server: Data
```

Used for DNS queries, video streaming, gaming, VoIP. If a packet is lost, too bad — move on.

**When to use UDP:** When speed matters more than reliability. DNS, real-time video, SNMP.

## ARP — How IP Becomes MAC

IP addresses route between networks. MAC addresses deliver on the local network.

```bash
arp -a
# ? (10.0.0.1) at 00:1a:2b:3c:4d:5e on ens3
```

When your server sends a packet to `10.0.0.1`, it broadcasts: "Who has `10.0.0.1`? Tell `10.0.0.5`." The owner replies with its MAC address.

## MTU — The Maximum Size

Ethernet frames have a maximum size:1500 bytes (standard). If your packet is larger, it gets fragmented.

```bash
ping -M do -s 1472 10.0.0.1
# OK — 1472 + 28 headers = 1500 bytes

ping -M do -s 1500 10.0.0.1
# message too long
```

**Path MTU discovery:** TCP automatically discovers the smallest MTU along the path and adjusts. If broken, you get silent packet drops.

**VPN/SSH tunnels reduce MTU** because they add headers. If your VPN connection hangs, check MTU.

## Real Task: Trace a Packet

```bash
# Application layer: DNS query
dig google.com

# Transport layer: TCP connection to port53
tcpdump -i ens3 port 53 -n

# Network layer: routing
traceroute google.com

# Link layer: ARP
arp -a

# Physical: interface stats
ip -s link show ens3
```

You just traced a packet from application to wire. That's how you debug.

## Assessment

**Lab task (20 min):**

1. Use `dig` to resolve a domain and trace the DNS query
2. Use `tcpdump` to capture DNS traffic
3. Use `traceroute` to map the path to a remote host
4. Check ARP table and identify gateway MAC
5. Check MTU and test path MTU discovery
6. Identify TCP states with `ss -tanp`

**Grading:**
- DNS traced: 15%
- DNS captured: 15%
- Traceroute completed: 15%
- ARP checked: 15%
- MTU tested: 20%
- TCP states identified: 20%

## Evidence

- **OutcomeEvidence:** `NET-LO1 — Packet Flow & Protocol Layers`
- **Mastery:** `UserSkill: networking-foundations`

## Unlock

Module2 — Subnetting and IP Addressing. You know how packets move. Now you learn how to address them.

## Sources

- RFC793 (TCP), RFC768 (UDP), RFC826 (ARP)
- `man tcpdump`, `man dig`, `man traceroute`

