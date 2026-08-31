# Module 1 — How Packets Actually Move

When you type a URL into a browser and hit Enter, something remarkable happens in milliseconds. Your keystrokes traverse copper, fiber, and radio waves, get chopped into tiny fragments, wrapped in multiple layers of addressing and control information, routed through dozens of intermediate devices, reassembled at the destination, and the response makes the entire journey back. Understanding exactly how this works — at the byte level — is the foundation of every networking skill you will ever need.

This module strips away the abstraction. We are going to look at what a packet actually looks like on the wire, byte by byte, field by field. We will follow a single HTTP request from your browser to a remote server and back, examining every transformation it undergoes at each layer of the networking stack. By the end, you will be able to read a hex dump of a packet capture and identify the protocol, source, destination, and payload without any tooling assistance.

## The OSI Model Through Real Traffic

The OSI model gets taught as seven neat layers with memorable mnemonics, but the real world does not care about perfect theoretical boundaries. In practice, we use the TCP/IP model's four layers — Link, Internet, Transport, and Application — mapped loosely onto OSI layers 1-2, 3, 4, and 5-7 respectively. The distinction matters less than understanding what each layer actually does to data.

At the bottom, Layer 1 (Physical) is the electrical signals on a wire, the light pulses in a fiber, or the radio waves in Wi-Fi. You cannot packet-capture Layer 1 in any meaningful way with software tools — you need an oscilloscope or spectrum analyzer. Layer 2 (Data Link) is where Ethernet lives. This is the frame level, where your network interface card (NIC) puts data onto the local network segment. Layer 3 (Internet) is IP — the protocol responsible for getting packets from source to destination across multiple networks. Layer 4 (Transport) is TCP or UDP, handling end-to-end communication between applications. Everything above Layer 4 is the Application layer in the TCP/IP model, though the OSI model splits it into Session, Presentation, and Application.

The critical insight is that each layer adds its own header (and sometimes trailer) to the data from the layer above. This is called encapsulation. When your browser sends an HTTP request, the HTTP message gets wrapped in a TCP segment, which gets wrapped in an IP packet, which gets wrapped in an Ethernet frame, which gets converted to electrical signals. At the destination, the process reverses: each layer strips its header and passes the payload up.

### Encapsulation in Practice

Here is what happens step by step when your browser sends a GET request to http://example.com/index.html:

1. The application layer creates an HTTP request:
```
GET /index.html HTTP/1.1\r\nHost: example.com\r\nConnection: keep-alive\r\nAccept: text/html\r\n\r\n
```

2. The transport layer (TCP) wraps this in a segment, adding source port (ephemeral, say 49152) and destination port (80), sequence number, acknowledgment number, flags (SYN, ACK, etc.), and a checksum.

3. The network layer (IP) wraps the TCP segment in a packet, adding source IP (your IP, say 192.168.1.100) and destination IP (example.com's IP, say 93.184.216.34), TTL, protocol field (6 for TCP), and a header checksum.

4. The data link layer (Ethernet) wraps the IP packet in a frame, adding source MAC address (your NIC's hardware address), destination MAC address (your default gateway's MAC), and an EtherType field (0x0800 for IPv4), plus a Frame Check Sequence (FCS) at the end.

5. The physical layer converts the frame to electrical signals (on copper), light pulses (on fiber), or radio waves (on Wi-Fi).

## Ethernet Frames: The Link Layer

Ethernet frames are the containers that carry data on local network segments. The standard Ethernet II frame format looks like this:

```
| Preamble (7 bytes) | SFD (1 byte) | Dest MAC (6 bytes) | Src MAC (6 bytes) | EtherType (2 bytes) | Payload (46-1500 bytes) | FCS (4 bytes) |
```

The preamble (0xAA repeated 7 times) and Start Frame Delimiter (0xAB) are technically Layer 1 synchronization bits. Most packet capture tools exclude them because they are stripped by the NIC before the OS sees the frame. The FCS is a CRC-32 checksum that the NIC uses to detect corruption; it is also usually stripped before the OS sees the frame, though some NICs can be configured to pass it through.

The real meat of the frame starts with the destination MAC address. This is a 48-bit hardware identifier burned into every NIC. The first three octets identify the manufacturer (the OUI, or Organizationally Unique Identifier), and the last three are assigned by the manufacturer. For example, if your NIC's MAC is `00:1A:2B:3C:4D:5E`, the `00:1A:2B` portion identifies the manufacturer.

Here is a real Ethernet frame captured from a network:

```
Frame 1: 74 bytes on wire (592 bits), 74 bytes captured (592 bits)
Ethernet II, Src: IntelCor_3c:4d:5e (00:1a:2b:3c:4d:5e), Dst: Cisco_7f:8e:9a (00:1c:0e:7f:8e:9a)
    Destination: 00:1c:0e:7f:8e:9a
    Source: 00:1a:2b:3c:4d:5e
    Type: IPv4 (0x0800)
```

The destination MAC `00:1c:0e:7f:8e:9a` belongs to a Cisco device — this is the default gateway. Your NIC determined this through ARP (Address Resolution Protocol), which we will cover shortly. The source MAC is your NIC's address. The EtherType `0x0800` tells the receiving NIC that the payload is an IPv4 packet.

If the frame carried an IPv6 packet instead, the EtherType would be `0x86DD`. If it carried an ARP request, it would be `0x0806`. This two-byte field is how the receiving device knows how to interpret the payload.

### Maximum Transmission Unit (MTU)

The standard Ethernet MTU is 1500 bytes. This means the largest Ethernet frame payload is 1500 bytes of Layer 3 and above data. Adding the 14-byte Ethernet header (6 + 6 + 2) and the 4-byte FCS gives a maximum frame size of 1518 bytes. Jumbo frames extend this to 9000 bytes, but they require all devices on the path to support them.

When an IP packet exceeds the MTU of a link, it must be fragmented. IPv4 allows fragmentation at the sender and at intermediate routers. IPv6 only allows fragmentation at the sender. In practice, path MTU discovery (PMTUD) is used to determine the smallest MTU along the path, and the sender adjusts its packet size accordingly. TCP connections negotiate MSS (Maximum Segment Size) during the three-way handshake to avoid fragmentation entirely.

## IP Packets: The Network Layer

The IPv4 header is where routing decisions happen. Here is the structure of an IPv4 header:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version|  IHL  |    DSCP   |ECN|         Total Length          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Identification        |Flags|      Fragment Offset     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |    Protocol   |         Header Checksum        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source Address                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Destination Address                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options (if IHL > 5)        |    Padding    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Let us walk through a real IP header. Here is a hex dump of the first 20 bytes (no options) of an IP packet:

```
45 00 00 3c 1c 46 40 00 40 06 a5 2e c0 a8 01 64 5d b8 d8 22
```

Parsing byte by byte:

- `45` — Version (4) and IHL (5). Version 4 = IPv4. IHL = 5 means 5 × 4 = 20 bytes header (no options).
- `00` — DSCP (Differentiated Services Code Point) and ECN. `00` = best effort, no congestion notification.
- `00 3c` — Total Length = 60 bytes. This includes the 20-byte header and 40 bytes of payload.
- `1c 46` — Identification = 0x1C46 = 7238. Used for reassembly of fragmented packets.
- `40` — Flags and Fragment Offset. `0x40` = Don't Fragment bit set.
- `00` — Fragment Offset (high bits combined with previous byte). No fragmentation.
- `40` — TTL = 64. This packet has traversed zero routers (assuming it started at 64). Each router decrements this by 1; when it hits 0, the packet is discarded and an ICMP Time Exceeded message is sent back.
- `06` — Protocol = 6 = TCP. This tells the receiving host to pass the payload to the TCP processing module.
- `a5 2e` — Header Checksum = 0xA52E. Calculated over the header only; recalculated at every hop because TTL changes.
- `c0 a8 01 64` — Source IP = 192.168.1.100.
- `5d b8 d8 22` — Destination IP = 93.184.216.34 (example.com).

The Protocol field is crucial. It tells the receiving host what protocol the payload uses. Common values: 1 = ICMP, 6 = TCP, 17 = UDP, 47 = GRE, 50 = ESP (IPSec).

### IP Checksum Calculation

The IP header checksum is a ones' complement of the ones' complement sum of all 16-bit words in the header. Here is the algorithm:

1. Treat the header as a sequence of 16-bit words.
2. Add them all together using ones' complement arithmetic (carry bits wrap around to the least significant bit).
3. Take the ones' complement of the result (flip all bits).

This is computed in software for IPv4 (the hardware does it for outgoing packets). IPv6 eliminated the header checksum entirely, relying on the link-layer FCS and upper-layer checksums instead. The reasoning was that reliable links make link-layer corruption rare, and TCP/UDP already have their own checksums.

## TCP Segments: The Transport Layer

TCP is the workhorse of the internet. It provides reliable, ordered, byte-stream delivery between two endpoints. The TCP header is more complex than IP because it has to track connection state, manage flow control, and handle reliability.

Here is the TCP header structure:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Acknowledgment Number                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Data |           |U|A|P|R|S|F|                               |
| Offset| Reserved  |R|C|S|S|Y|I|            Window             |
|       |           |G|K|H|T|N|N|                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           Checksum            |         Urgent Pointer        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options (variable)                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Let us trace a real TCP three-way handshake. This is from a packet capture of a client connecting to a web server:

**Packet 1 — SYN (Client → Server)**
```
Source Port: 49152
Destination Port: 80
Sequence Number: 0 (relative)
Flags: 0x002 (SYN)
Window: 65535
Options:
    MSS: 1460
    Window Scale: 7
    SACK Permitted
```

The client picks an ephemeral port (49152) and sends a SYN to port 80 on the server. The sequence number is the client's initial sequence number (ISN). Wireshark shows this as 0 for readability, but the real value is a random 32-bit number like 0x7F3A2B1C. The SYN flag tells the server "I want to establish a connection." The MSS option of 1460 bytes tells the server the largest segment the client can receive without fragmentation (1500 MTU - 20 IP header - 20 TCP header = 1460). Window Scale of 7 means the 16-bit window field should be left-shifted by 7 bits, allowing a receive window of up to 65535 × 128 = 8,388,480 bytes. SACK Permitted means the client supports Selective Acknowledgment, which improves recovery from packet loss.

**Packet 2 — SYN-ACK (Server → Client)**
```
Source Port: 80
Destination Port: 49152
Sequence Number: 0 (relative)
Acknowledgment Number: 1 (relative)
Flags: 0x012 (SYN, ACK)
Window: 65535
Options:
    MSS: 1460
    Window Scale: 7
    SACK Permitted
```

The server responds with its own SYN and acknowledges the client's SYN. The acknowledgment number is 1 — one more than the client's sequence number — meaning "I received your sequence number 0 and am expecting byte 1 next." The server also advertises its own MSS and window scale parameters.

**Packet 3 — ACK (Client → Server)**
```
Source Port: 49152
Destination Port: 80
Sequence Number: 1 (relative)
Acknowledgment Number: 1 (relative)
Flags: 0x010 (ACK)
Window: 512 (after scaling: 512 × 128 = 65536)
```

The client acknowledges the server's SYN. The connection is now established. Both sides have agreed on initial sequence numbers, MSS, and window sizes. This third packet can carry the first application data (like the HTTP GET request), but in this capture it is a pure ACK — the HTTP request follows immediately after.

### TCP Sequence and Acknowledgment Numbers

TCP uses sequence numbers to track every byte of data sent. If a TCP segment contains 1460 bytes of data starting at sequence number 1, the next segment will start at sequence number 1461. The acknowledgment number from the receiver tells the sender "I have received all bytes up to this number minus one; send me the next byte starting at this number."

This is cumulative acknowledgment. If the receiver gets bytes 1-1460 and 1461-2920, it acknowledges 2921. If byte 1461 is lost but 2921-4380 arrives, the receiver still acknowledges 1461 because it cannot acknowledge 2921 until it has all bytes up to that point (unless SACK is used, which allows the receiver to report out-of-order ranges).

Retransmission happens when the sender does not receive an acknowledgment within the retransmission timeout (RTO). The RTO is dynamically calculated based on the round-trip time (RTT) measurements. If the RTO expires, the sender retransmits the oldest unacknowledged segment. With SACK, the receiver can tell the sender exactly which segments were received, allowing selective retransmission of only the missing segments.

## UDP: Lightweight Transport

UDP is TCP's minimalist counterpart. It provides connectionless, unreliable, message-oriented delivery. There is no handshake, no sequence numbers, no retransmission, no flow control. You send a datagram, and it either arrives or it does not.

The UDP header is just 8 bytes:

```
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Length             |           Checksum            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

- Source Port (2 bytes): The sending port. Optional in UDP (can be 0).
- Destination Port (2 bytes): The receiving port.
- Length (2 bytes): Total length of UDP header + data in bytes. Minimum is 8 (header only).
- Checksum (2 bytes): Optional in IPv4 (required in IPv6). Covers a pseudo-header (source IP, destination IP, protocol, UDP length) plus the UDP header and data.

UDP is used for DNS queries, DHCP, SNMP, VoIP, video streaming, and gaming — anything where low latency matters more than guaranteed delivery. A lost DNS packet is simply retried; waiting for TCP retransmission would add unacceptable delay.

The lack of a handshake means UDP has no concept of connection state. A server can respond to a UDP datagram from any client without prior communication. This makes UDP servers simpler but also more susceptible to amplification attacks, where an attacker spoofs the source IP and the server sends large responses to the victim.

## ICMP: The Control Plane

ICMP (Internet Control Protocol) is not a transport protocol — it is a network-layer control protocol used for diagnostics and error reporting. The most familiar ICMP-based tools are ping and traceroute.

ICMP messages have a simple structure: Type (1 byte), Code (1 byte), Checksum (2 bytes), and then type-specific data.

Common ICMP types:
- Type 8, Code 0: Echo Request (ping request)
- Type 0, Code 0: Echo Reply (ping reply)
- Type 11, Code 0: Time Exceeded in Transit (TTL expired)
- Type 3, Code 3: Destination Port Unreachable
- Type 3, Code 0: Destination Network Unreachable
- Type 5: Redirect (router telling you to use a different gateway)

When you run `ping 8.8.8.8`, your system sends ICMP Echo Request (Type 8) packets and expects ICMP Echo Reply (Type 0) responses. The round-trip time gives you the latency. The ICMP checksum is computed over the entire ICMP message (header + data).

When you run `traceroute 8.8.8.8`, your system sends packets with TTL=1, TTL=2, TTL=3, and so on. The first router (TTL=1) decrements TTL to 0, discards the packet, and sends back an ICMP Time Exceeded (Type 11) message. This reveals the first hop. The packet with TTL=2 reaches the second router, which sends back ICMP Time Exceeded. This continues until the destination is reached, which responds with ICMP Echo Reply or ICMP Port Unreachable (for UDP-based traceroute on Windows).

## ARP: Linking IP to MAC

IP addresses are logical; Ethernet frames need physical MAC addresses. ARP (Address Resolution Protocol) bridges this gap. When your host wants to send a packet to 192.168.1.1 on the local network but does not know the MAC address, it broadcasts an ARP request:

```
Who has 192.168.1.1? Tell 192.168.1.100
```

This is an Ethernet broadcast (destination MAC ff:ff:ff:ff:ff:ff) so every device on the local segment receives it. The device with IP 192.168.1.1 responds with an ARP reply:

```
192.168.1.1 is at 00:1c:0e:7f:8e:9a
```

This is a unicast response — only the original requester receives it. The ARP entry is then cached for a timeout period (typically 15-20 minutes on Linux, 2 minutes on Windows, though this varies).

ARP cache poisoning (ARP spoofing) is an attack where the attacker sends fake ARP replies, associating their MAC address with another host's IP. This allows the attacker to intercept traffic (man-in-the-middle). Tools like arpswatch or Dynamic ARP Inspection (DAI) on switches can detect and prevent this.

Let us look at real ARP traffic from a packet capture:

```
Frame 3: 42 bytes on wire (336 bits)
Ethernet II, Src: IntelCor_3c:4d:5e (00:1a:2b:3c:4d:5e), Dst: Broadcast (ff:ff:ff:ff:ff:ff)
    Type: ARP (0x0806)
Address Resolution Protocol (request)
    Hardware type: Ethernet (1)
    Protocol type: IPv4 (0x0800)
    Hardware size: 6
    Protocol size: 4
    Opcode: request (1)
    Sender MAC address: 00:1a:2b:3c:4d:5e
    Sender IP address: 192.168.1.100
    Target MAC address: 00:00:00:00:00:00
    Target IP address: 192.168.1.1
```

Notice the Target MAC address is `00:00:00:00:00:00` — this is a placeholder because the sender does not know the target's MAC. The broadcast destination ensures every host on the segment processes the request, but only the host with the matching IP responds.

## Following a Packet: Browser to Server

Let us trace the complete journey of an HTTP GET request from your browser to a web server and the response back. We will use a real scenario: a client at 192.168.1.100 requesting http://webserver.example.com/page.html (IP: 10.0.0.50) through a default gateway at 192.168.1.1.

### Step 1: DNS Resolution

Before the browser can connect, it needs to resolve the hostname to an IP address. The OS DNS resolver checks the local cache, then the hosts file, then queries the configured DNS server (say, 8.8.8.8).

The DNS query is a UDP packet:
- Source IP: 192.168.1.100, Source Port: 54321
- Destination IP: 8.8.8.8, Destination Port: 53
- Payload: DNS query for webserver.example.com, Type A

The DNS server responds with the IP address 10.0.0.50. This exchange might look like two simple packets, but it involves a full UDP datagram with DNS header, question section, and answer section.

### Step 2: ARP for Default Gateway

Now the OS knows the destination IP (10.0.0.50) is on a different network (compare the subnet masks: 192.168.1.100/24 is on 192.168.1.0/24, while 10.0.0.50 is on 10.0.0.0/8). The packet must go through the default gateway (192.168.1.1). The OS checks its ARP cache for the gateway's MAC address. If not present, an ARP request is broadcast.

### Step 3: TCP Three-Way Handshake

The OS creates a TCP SYN segment:
- Source IP: 192.168.1.100, Source Port: 49152
- Destination IP: 10.0.0.50, Destination Port: 80
- TCP Flags: SYN
- MSS: 1460

This TCP segment is encapsulated in an IP packet, which is encapsulated in an Ethernet frame:
- Source MAC: Your NIC (00:1a:2b:3c:4d:5e)
- Destination MAC: Default gateway (00:1c:0e:7f:8e:9a)
- EtherType: 0x0800 (IPv4)

The frame goes out on the wire, the gateway receives it, strips the Ethernet header, examines the destination IP (10.0.0.50), looks up its routing table, and forwards it out the appropriate interface with a new Ethernet header (its own source MAC and the next-hop device's destination MAC).

### Step 4: HTTP Request and Response

After the handshake, the client sends the HTTP GET request inside a TCP segment. The server processes it and sends the HTML content back in one or more TCP segments. Each TCP segment is wrapped in IP packets, which are wrapped in Ethernet frames at each hop.

The response follows the reverse path: server → server's gateway → internet → your gateway → your NIC → your OS → TCP processing → HTTP processing → browser.

### Step 5: Connection Teardown

After the response is complete, the connection is closed with a four-way FIN handshake:
1. Client sends FIN
2. Server sends ACK
3. Server sends FIN
4. Client sends ACK

Each side can close independently, which is why it is four steps rather than two.

## Reading Hex Dumps

Here is a complete hex dump of an Ethernet frame carrying an IPv4/TCP packet:

```
0000   00 1c 0e 7f 8e 9a 00 1a 2b 3c 4d 5e 08 00 45 00
0010   00 3c 1c 46 40 00 40 06 a5 2e c0 a8 01 64 5d b8
0020   d8 22 c3 50 00 50 7f 3a 2b 1c 00 00 00 00 a0 02
0030   fa f0 3e 12 00 00 02 04 05 b4 04 02 08 0a 00 00
0040   00 00 00 00 00 00 01 03 03 07
```

Let us parse this field by field:

**Ethernet Header (14 bytes):**
- `00 1c 0e 7f 8e 9a` — Destination MAC: Cisco gateway
- `00 1a 2b 3c 4d 5e` — Source MAC: Your NIC
- `08 00` — EtherType: IPv4

**IP Header (20 bytes, starting at offset 14):**
- `45` — Version 4, IHL 5 (20 bytes)
- `00` — DSCP/ECN: 0
- `00 3c` — Total Length: 60 bytes
- `1c 46` — Identification: 0x1C46
- `40 00` — Flags: Don't Fragment, Offset: 0
- `40` — TTL: 64
- `06` — Protocol: TCP
- `a5 2e` — Header Checksum
- `c0 a8 01 64` — Source IP: 192.168.1.100
- `5d b8 d8 22` — Destination IP: 93.184.216.34

**TCP Header (20 bytes, starting at offset 34):**
- `c3 50` — Source Port: 49998
- `00 50` — Destination Port: 80
- `7f 3a 2b 1c` — Sequence Number: 0x7F3A2B1C
- `00 00 00 00` — Acknowledgment Number: 0 (SYN packet, no data yet)
- `a0 2` — Data Offset: 10 (40 bytes — includes options), Flags: SYN
- `fa f0` — Window: 64240
- `3e 12` — Checksum
- `00 00` — Urgent Pointer: 0

**TCP Options (20 bytes, starting at offset 54):**
- `02 04 05 b4` — MSS: 1460
- `04 02` — SACK Permitted
- `08 0a 00 00 00 00 00 00 00 00` — Timestamps: 0, 0
- `01` — NOP
- `03 03 07` — Window Scale: 7

Practice reading hex dumps like this regularly. Over time, you will recognize common patterns instantly: `45 00` at the start of an IP header, `c0 a8` for 192.168.x.x private addresses, `00 50` for port 80, `01 01` for NOP padding in TCP options.

## TCP Flags in Detail

The TCP flags field is 9 bits (6 standard flags + 3 reserved/NS flags). Each flag serves a specific purpose:

- **SYN (0x02)**: Synchronize sequence numbers. Used to initiate a connection.
- **ACK (0x10)**: Acknowledgment field is valid. Set in all packets after the initial SYN.
- **FIN (0x01)**: No more data from sender. Used to initiate connection close.
- **RST (0x04)**: Reset the connection. Used to abort a connection immediately (e.g., no service on the port).
- **PSH (0x08)**: Push function. Tells the receiving TCP stack to pass data to the application immediately rather than buffering.
- **URG (0x20)**: Urgent pointer field is valid. Rarely used in modern traffic.

Analyzing flags helps identify network behavior. A SYN flood attack sends many SYN packets without completing the handshake. A Christmas tree scan sets FIN, PSH, and URG flags simultaneously. RST floods indicate someone is actively tearing down connections.

## Common Protocol Numbers and Ports

Knowing these by heart saves time during packet analysis:

| Protocol | IP Number | Typical Ports |
|----------|-----------|---------------|
| ICMP     | 1         | N/A           |
| TCP      | 6         | varies        |
| UDP      | 17        | varies        |
| OSPF     | 89        | 89            |
| GRE      | 47        | N/A           |
| ESP      | 50        | N/A           |
| AH       | 51        | N/A           |

Common TCP/UDP port assignments:
- 20/21: FTP (data/control)
- 22: SSH
- 23: Telnet
- 25: SMTP
- 53: DNS
- 80: HTTP
- 110: POP3
- 143: IMAP
- 443: HTTPS
- 993: IMAPS
- 995: POP3S
- 3389: RDP

## Assessment

**Lab Exercise: Packet Dissection (45 minutes)**

Task 1 (15 minutes): Download the sample PCAP file provided in the course materials. Open it in Wireshark. Identify and list:
- Total number of packets captured
- Number of TCP streams
- The IP addresses involved
- The protocols represented
- Any DNS queries and their responses

Task 2 (15 minutes): From the same PCAP, find the TCP three-way handshake for the first HTTP connection. Write out:
- The sequence numbers (real values, not relative) for each leg
- The MSS values negotiated
- Whether SACK was enabled
- The window scale factors

Task 3 (15 minutes): Export the first 10 packets as a hex dump (File → Export Packet Dissections → Plain Text). For each packet, identify:
- Whether it is Ethernet, ARP, IP, TCP, UDP, or DNS
- Source and destination addresses (MAC, IP, and port as applicable)
- Any flags or control fields
- The approximate payload size

**Grading Criteria:**
- Correct protocol identification: 25 points
- Accurate hex parsing: 25 points
- TCP state machine understanding: 25 points
- Completeness and organization: 25 points

## Evidence

Save the following to your portfolio:
1. A screenshot of the Wireshark protocol hierarchy for the sample PCAP
2. Your written dissection of the TCP three-way handshake with real sequence numbers
3. The hex dump analysis of at least 5 packets, showing you can parse headers without Wireshark's protocol decode
4. A brief description (3-5 sentences) of how encapsulation works, in your own words, referencing specific byte offsets from the hex dump

These skills form the foundation for every subsequent module. If you cannot read a packet capture at the byte level, the rest of the troubleshooting and security work becomes guesswork. Practice this until it is automatic.