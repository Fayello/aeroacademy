# Module 9 — Packet Analysis



## What You'll Actually Do

Something weird is happening on the network. You need to capture packets, analyze them, and figure out what's going on. You'll use tcpdump to capture,Wireshark to analyze, and understand what you're looking at.


## tcpdump — Capture on the Command Line

```bash
# Capture on interface
tcpdump -i ens3

# Capture specific port
tcpdump -i ens3 port 80

# Capture specific host
tcpdump -i ens3 host 10.0.0.100

# Capture traffic to/from a subnet
tcpdump -i ens3 net 10.0.10.0/24

# Write to file
tcpdump -i ens3 -w capture.pcap

# Read from file
tcpdump -r capture.pcap

# Limit capture
tcpdump -i ens3 -c 100     # first100 packets
tcpdump -i ens3 -G 3600 -w trace_%Y%m%d_%H%M%S.pcap  # rotate hourly

# Verbose (show packet contents)
tcpdump -i ens3 -X port 80

# Show packet details
tcpdump -i ens3 -vvv port 53
```


## Reading tcpdump Output

```bash
tcpdump -i ens3 -n port 80
# 10:30:00.123456 IP 10.0.0.5.43210 > 93.184.216.34.80: Flags [S], seq 123456, win 65535, options [mss 1460,sackOK,TS val 12345 ecr 0,nop,wscale 7], length 0
# 10:30:00.125678 IP 93.184.216.34.80 > 10.0.0.5.43210: Flags [S.], seq 789012, ack 123457, win 65535, options [mss 1460,sackOK,TS val 78901 ecr 12345,nop,wscale 7], length 0
# 10:30:00.126789 IP 10.0.0.5.43210 > 93.184.216.34.80: Flags [.], ack 789013, win 512, length 0
```

- `[S]` — SYN (connection start)
- `[S.]` — SYN-ACK (connection accepted)
- `[.]` — ACK (connection established)
- `[P]` — PSH (data pushed)
- `[F]` — FIN (connection closing)
- `[R]` — RST (connection reset)


## Analyzing Common Issues

**Retransmissions (packet loss):**
```bash
tcpdump -i ens3 'tcp[tcpflags] & (tcp-syn|tcp-fin) != 0' | grep -c "retransmit"
```

**DNS failures:**
```bash
tcpdump -i ens3 port 53 -n
# Look for queries with no response
```

**TCP resets (connection refused):**
```bash
tcpdump -i ens3 'tcp[tcpflags] & (tcp-rst) != 0'
```

**Slow TLS handshake:**
```bash
tcpdump -i ens3 port 443 -tttt
# Measure time between ClientHello and ServerHello
```


## Packet Dissection

```bash
# Show HTTP traffic
tcpdump -i ens3 -A port 80 | grep -E "^(GET|POST|HTTP)"

# Show DNS queries
tcpdump -i ens3 -n port 53 -vv

# Show TCP flags
tcpdump -i ens3 'tcp[tcpflags] & tcp-syn != 0'

# Filter by packet size
tcpdump -i ens3 'greater 1000'   # packets >1000 bytes
tcpdump -i ens3 'less 100'       # packets <100 bytes
```


## Real Task: Debug with Packet Capture

```bash
# Problem: Client reports "connection reset"
tcpdump -i ens3 host 10.0.0.100 -w debug.pcap &
CLIENT_PID=$!

# Reproduce the issue
# ... client connects and gets reset ...

# Stop capture
kill $CLIENT_PID

# Analyze
tcpdump -r debug.pcap -n | grep RST
# 10:30:05.123456 IP 10.0.0.5.80 > 10.0.0.100.43210: Flags [R], ...

# Check what happened before the RST
tcpdump -r debug.pcap -n | head -20
# Client sent SYN, server sent SYN-ACK, client sent ACK
# Then client sent a request, server sent RST
# → Server application is crashing on that request
```


## Assessment

**Lab task (25 min):**

1. Capture DNS traffic and analyze queries/responses
2. Capture HTTP traffic and identify request/response pairs
3. Identify TCP retransmissions in a capture
4. Find TCP RST packets and diagnose the cause
5. Capture and analyze a TLS handshake
6. Write a tcpdump filter for a specific scenario

**Grading:**
- DNS captured: 15%
- HTTP analyzed: 20%
- Retransmissions found: 20%
- RST diagnosed: 20%
- TLS handshake analyzed: 15%
- Filter written: 10%


## Evidence

- **OutcomeEvidence:** `NET-LO9 — Packet Analysis`
- **Mastery:** `UserSkill: networking-packet-analysis`


## Unlock

Module10 — Network Security Monitoring. You can analyze packets. Now you learn how to detect threats.


## Sources

- `man tcpdump`
- Wireshark documentation
- RFC793 (TCP)


