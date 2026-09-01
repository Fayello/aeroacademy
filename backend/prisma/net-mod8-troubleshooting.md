# Module 8: Network Troubleshooting

Network troubleshooting is the process of systematically identifying and resolving connectivity issues. The difference between a competent network engineer and a novice is not knowledge of protocols: it is the ability to follow a methodical process that eliminates variables efficiently. Guessing wastes time. Systematic elimination finds the answer.

This module covers a structured troubleshooting methodology, the diagnostic tools every network engineer needs (ping, traceroute, netstat, tcpdump, dig), and a real-world exercise where you debug a connectivity issue in 15 minutes under pressure.

## The Methodical Approach

When something breaks, resist the urge to start changing things. Follow this process:

**Step 1: Define the problem.**
- What is not working?
- When did it start?
- Is it affecting one user, one subnet, or the entire network?
- Can you reproduce the issue?
- What changed recently? (New equipment, configuration changes, software updates)

**Step 2: Gather information.**
- Run basic diagnostic commands on the affected host
- Check logs on routers, switches, and firewalls
- Verify the physical layer (cables, link lights)
- Check recent configuration changes

**Step 3: Form a hypothesis.**
- Based on the symptoms, what is the most likely cause?
- Prioritize hypotheses by likelihood (most common causes first)

**Step 4: Test the hypothesis.**
- Run specific tests that will confirm or eliminate the hypothesis
- Change one thing at a time
- Document the results

**Step 5: Implement the fix.**
- Apply the solution
- Verify the fix resolves the issue
- Check for side effects

**Step 6: Document the resolution.**
- Record what happened, what caused it, and how you fixed it
- Update monitoring or alerting if needed
- Consider preventive measures

### Common Causes (Ordered by Frequency)

1. **DNS issues**: The most common cause of "it's down" reports. DNS failure makes everything look broken.
2. **Firewall rules**: A new rule blocking traffic, or an existing rule that should not be there.
3. **IP configuration**: Wrong IP, wrong subnet mask, wrong gateway, duplicate IP.
4. **Physical layer**: Bad cable, unplugged cable, failed switch port, wrong VLAN.
5. **Routing issues**: Missing route, asymmetric routing, black hole.
6. **MTU issues**: Fragmented packets, PMTUD failure.
7. **Authentication/authorization**: Expired certificates, failed RADIUS, ACL denied.

## ping: The First Tool

ping sends ICMP Echo Request packets and expects ICMP Echo Reply responses. It tests basic IP connectivity and measures round-trip time.

```bash
# Basic ping
ping 8.8.8.8

# Ping with specific count
ping -c 5 8.8.8.8

# Ping with specific source interface
ping -I eth1 8.8.8.8

# Ping with specific packet size
ping -s 1472 -M do 8.8.8.8
# -s 1472 sets payload to 1472 bytes (1472 + 28 IP/ICMP headers = 1500 = MTU)
# -M do sets Don't Fragment bit (for PMTUD testing)

# Ping with specific TTL
ping -m 10 8.8.8.8

# Continuous ping (Windows)
ping -t 8.8.8.8

# Ping with deadline (Linux, stop after 10 seconds)
ping -w 10 8.8.8.8
```

### Interpreting ping Results

```
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=12.3 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=11.8 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=118 time=12.1 ms
64 bytes from 8.8.8.8: icmp_seq=4 ttl=118 time=12.0 ms

--- 8.8.8.8 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 11.8/12.0/12.3/0.2 ms
```

- **0% packet loss**: Good connectivity.
- **Non-zero loss**: Packet drops. Could be congestion, firewall, or link issues.
- **High variance (mdev)**: Jitter: inconsistent latency, possibly congestion or path changes.
- **TTL**: Time To Live. If the TTL is much lower than expected (e.g., 64 for Linux default), the packet traversed many hops.
- **time**: Round-trip time in milliseconds.

### What ping Does NOT Tell You

- Port-level connectivity (ping uses ICMP, not TCP/UDP)
- Whether a specific service is running
- Whether the firewall allows the traffic
- DNS resolution (you must use an IP, not a hostname, unless you test DNS separately)

If ping works but a service does not work, the problem is at Layer 4 (port/firewall) or Layer 7 (application), not Layer 3 (IP connectivity).

## traceroute/pathping: Mapping the Path

traceroute (Linux/Mac) or tracert (Windows) reveals the path packets take to reach a destination by sending packets with incrementing TTL values.

```bash
# Linux/Mac
traceroute 8.8.8.8

# Windows
tracert 8.8.8.8

# traceroute with TCP (bypasses ICMP filtering)
traceroute -T -p 80 8.8.8.8

# traceroute with UDP (default on Linux)
traceroute 8.8.8.8

# pathping (Windows, combines ping and traceroute)
pathping 8.8.8.8
```

### Interpreting traceroute Output

```
traceroute to 8.8.8.8 (8.8.8.8), 30 hops max, 60 byte packets
 1  192.168.1.1 (192.168.1.1)  1.234 ms  1.123 ms  1.089 ms
 2  10.0.0.1 (10.0.0.1)  5.678 ms  5.543 ms  5.432 ms
 3  * *
 4  72.14.215.85 (72.14.215.85)  12.345 ms  12.234 ms  12.123 ms
 5  8.8.8.8 (8.8.8.8)  12.456 ms  12.345 ms  12.234 ms
```

- **Hop 1 (192.168.1.1)**: Your default gateway. 1 ms is expected for a LAN device.
- **Hop 2 (10.0.0.1)**: ISP router. 5 ms is reasonable.
- **Hop 3 (*)**: This hop does not respond to ICMP TTL exceeded messages. This is common: many ISPs filter ICMP. It does not mean the hop is broken.
- **Hop 4 (72.14.215.85)**: A Google router (owns 72.14.0.0/16). 12 ms is expected.
- **Hop 5 (8.8.8.8)**: The destination. 12 ms confirms end-to-end connectivity.

### Common traceroute Patterns

**Timeout at a hop, then resume**: That hop filters ICMP but forwards traffic. The path continues.

**All * after a certain hop**: The path is broken at that hop, or all subsequent hops filter ICMP. If you get responses at the destination, the path is working despite the * hops.

**Increased latency at a hop**: That hop is congested or processing slowly. If the latency is consistently high at one hop and all subsequent hops, the issue is at that hop.

**Routing loop**: If you see the same hop repeated multiple times, there may be a routing loop. The TTL eventually expires and the loop is broken.

## netstat and ss: Connection Analysis

netstat and ss display active network connections, listening ports, and socket statistics.

```bash
# Show all listening ports
ss -tlnp

# Show all established connections
ss -tunap | grep ESTAB

# Show connection statistics
ss -s

# Show socket memory usage
ss -tm

# Show connections to a specific port
ss -tn dst :80

# Show connections from a specific source
ss -tn src :22
```

### Interpreting ss Output

```
State      Recv-Q Send-Q   Local Address:Port    Peer Address:Port
LISTEN     0      128      0.0.0.0:22            0.0.0.0:*
LISTEN     0      511      0.0.0.0:80            0.0.0.0:*
LISTEN     0      128      0.0.0.0:443           0.0.0.0:*
ESTAB      0      0        10.0.1.50:49152       93.184.216.34:80
ESTAB      0      0        10.0.1.50:22          10.0.0.100:52341
```

- **LISTEN**: The service is accepting connections on this port.
- **ESTAB**: An active, established connection.
- **Recv-Q**: Data received but not yet read by the application. High values indicate the application is slow or hung.
- **Send-Q**: Data sent but not yet acknowledged by the peer. High values indicate the peer is slow or the network is congested.

### Finding the Process Using a Port

```bash
# Using ss
ss -tlnp | grep :80

# Using lsof
lsof -i :80

# Using fuser
fuser 80/tcp

# Kill a process holding a port
fuser -k 80/tcp
```

## tcpdump: Packet Capture

tcpdump is the command-line packet analyzer. It captures packets on a network interface and can filter them using BPF (Berkeley Packet Filter) expressions.

### Basic Capture

```bash
# Capture all traffic on eth0
tcpdump -i eth0

# Capture on all interfaces
tcpdump -i any

# Capture and write to file
tcpdump -i eth0 -w capture.pcap

# Read from file
tcpdump -r capture.pcap

# Capture with verbose output (show packet details)
tcpdump -i eth0 -vv

# Capture with hex and ASCII dump
tcpdump -i eth0 -X

# Capture with packet count limit
tcpdump -i eth0 -c 100

# Capture without DNS resolution
tcpdump -i eth0 -nn
```

### Filter Expressions

```bash
# Filter by host
tcpdump -i eth0 host 10.0.1.50

# Filter by source host
tcpdump -i eth0 src host 10.0.1.50

# Filter by destination host
tcpdump -i eth0 dst host 10.0.1.50

# Filter by port
tcpdump -i eth0 port 80

# Filter by source port
tcpdump -i eth0 src port 49152

# Filter by destination port
tcpdump -i eth0 dst port 443

# Filter by protocol
tcpdump -i eth0 tcp
tcpdump -i eth0 udp
tcpdump -i eth0 icmp

# Filter by TCP flags
tcpdump -i eth0 'tcp[tcpflags] & (tcp-syn) != 0'
tcpdump -i eth0 'tcp[tcpflags] & (tcp-rst) != 0'

# Combine filters with AND/OR
tcpdump -i eth0 'host 10.0.1.50 and port 80'
tcpdump -i eth0 'src 10.0.1.50 or dst 10.0.1.50'
tcpdump -i eth0 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'

# Capture DNS traffic
tcpdump -i eth0 port 53

# Capture only SYN packets (new connections)
tcpdump -i eth0 'tcp[tcpflags] == tcp-syn'

# Capture packets with specific size
tcpdump -i eth0 greater 1000
tcpdump -i eth0 less 100
```

### Reading tcpdump Output

```
10:30:15.123456 IP 10.0.1.100.49152 > 93.184.216.34.80: Flags [S], seq 1234567890, win 65535, options [mss 1460,sackOK,TS val 1234567 ecr 0,nop,wscale 7], length 0
10:30:15.145678 IP 93.184.216.34.80 > 10.0.1.100.49152: Flags [S.], seq 987654321, ack 1234567891, win 65535, options [mss 1460,sackOK,TS val 7654321 ecr 1234567,nop,wscale 7], length 0
10:30:15.145890 IP 10.0.1.100.49152 > 93.184.216.34.80: Flags [.], ack 1, win 512, length 0
10:30:15.146012 IP 10.0.1.100.49152 > 93.184.216.34.80: Flags [P.], seq 1:200, ack 1, win 512, length 199
```

- **Flags [S]**: SYN: new connection request.
- **Flags [S.]**: SYN-ACK: server acknowledges.
- **Flags [.]**: ACK: connection established.
- **Flags [P.]**: PSH-ACK: push data to application.
- **Flags [F.]**: FIN-ACK: closing connection.
- **Flags [R.]**: RST-ACK: connection reset.

### Practical tcpdump Examples

```bash
# Debug a web request
tcpdump -i eth0 -nn 'host 10.0.1.50 and (port 80 or port 443)' -c 50 -w debug.pcap

# Detect SYN floods
tcpdump -i eth0 'tcp[tcpflags] == tcp-syn' -nn | awk '{print $3}' | cut -d. -f1-4 | sort | uniq -c | sort -rn | head -10

# Capture DNS queries
tcpdump -i eth0 -nn port 53 -l | grep -E "A\?|AAAA\?"

# Find traffic to a specific port (e.g., SSH brute force)
tcpdump -i eth0 'dst port 22 and tcp[tcpflags] == tcp-syn' -nn | awk '{print $3}' | cut -d. -f1-4 | sort | uniq -c | sort -rn
```

## nslookup and dig: DNS Diagnostics

```bash
# Basic lookup
nslookup example.com

# Query specific DNS server
nslookup example.com 8.8.8.8

# Reverse lookup
nslookup 93.184.216.34

# dig basic query
dig example.com

# dig specific record type
dig example.com MX
dig example.com TXT
dig example.com NS

# dig with trace (full resolution path)
dig +trace www.example.com

# dig short output
dig +short example.com

# dig with specific DNS server
dig @8.8.8.8 example.com

# Check if DNSSEC is enabled
dig example.com +dnssec

# Check TTL
dig example.com | grep -E "^[^;].*IN"
```

### Diagnosing DNS Issues

```bash
# Step 1: Check if DNS resolution works
dig +short google.com

# Step 2: Check what the local resolver returns
cat /etc/resolv.conf
dig @$(grep nameserver /etc/resolv.conf | head -1 | awk '{print $2}') google.com

# Step 3: Check if the issue is with a specific DNS server
dig @8.8.8.8 google.com
dig @1.1.1.1 google.com
dig @9.9.9.9 google.com

# Step 4: Check DNSSEC
dig google.com +dnssec +multi

# Step 5: Check for DNS cache poisoning
# Compare results from multiple resolvers: they should all return the same answer
```

## MTU Troubleshooting

MTU (Maximum Transmission Unit) issues are among the most confusing connectivity problems because they affect some traffic but not others. A host might ping successfully but fail to load web pages, or SSH might work but SCP (file transfer) might fail.

### Symptoms of MTU Problems

- Connections hang during data transfer (not during handshake)
- Large packets fail but small packets succeed
- ping works with small packets but fails with larger ones
- SSH works for interactive use but SCP hangs on large files
- VPN tunnels establish but cannot transfer data

### Diagnosing MTU Issues

```bash
# Test with specific packet sizes to find the MTU
# Start with 1472 (1500 - 20 IP - 8 ICMP = 1472)
ping -M do -s 1472 10.0.1.50

# If that fails, try smaller sizes
ping -M do -s 1400 10.0.1.50
ping -M do -s 1000 10.0.1.50
ping -M do -s 500 10.0.1.50

# The largest successful size + 28 = your path MTU
# If 1400 works but 1472 fails, your MTU is 1428

# Trace the path and check each hop's MTU
traceroute -M do -s 1472 10.0.1.50
```

### Common MTU Causes

1. **VPN overhead**: VPN tunnels add headers (IPSec adds 50-70 bytes, WireGuard adds 60 bytes). The effective MTU inside the tunnel is lower than the physical interface MTU.

2. **PPPoE**: PPPoE adds 8 bytes of overhead, reducing the effective MTU from 1500 to 1492.

3. **VLAN tagging**: 802.1Q adds 4 bytes, reducing the effective MTU from 1500 to 1496.

4. **Path MTU discovery blocked**: ICMP "Fragmentation Needed" messages are blocked by a firewall, preventing PMTUD from working.

### Fixing MTU Issues

```bash
# Set interface MTU (Linux)
ip link set eth0 mtu 1400

# Set interface MTU (Cisco)
interface GigabitEthernet0/0
 mtu 1400

# For WireGuard, set the MTU in the config
# /etc/wireguard/wg0.conf
[Interface]
MTU = 1420

# For OpenVPN, add to config
tun-mtu 1400
mssfix 1360
```

## ARP Troubleshooting

ARP (Address Resolution Protocol) translates IP addresses to MAC addresses on the local network. ARP problems can cause connectivity failures that appear to be routing or firewall issues.

### Common ARP Problems

**ARP cache poisoning**: An attacker sends fake ARP replies, associating their MAC with another host's IP. This allows man-in-the-middle attacks.

```bash
# Check the ARP table
arp -a
ip neigh show

# Look for duplicate MAC addresses (same MAC for different IPs)
arp -a | awk '{print $4}' | sort | uniq -c | sort -rn | head -5

# Check for ARP spoofing with arping
arping -I eth0 10.0.1.1
# If you get replies from multiple MAC addresses, ARP is poisoned
```

**Static ARP entries**: Sometimes static ARP entries are configured incorrectly or persist after network changes.

```bash
# View static ARP entries
arp -s
ip neigh show nud permanent

# Remove a static ARP entry
ip neigh del 10.0.1.1 dev eth0

# Add a static ARP entry (for critical servers)
arp -s 10.0.1.1 00:1a:2b:3c:4d:5e
```

**ARP table overflow**: Too many ARP entries exhaust the cache, causing new ARP requests to fail.

```bash
# Check ARP cache size
cat /proc/sys/net/ipv4/neigh/default/gc_thresh1
cat /proc/sys/net/ipv4/neigh/default/gc_thresh2
cat /proc/sys/net/ipv4/neigh/default/gc_thresh3

# Increase ARP cache limits
echo 512 > /proc/sys/net/ipv4/neigh/default/gc_thresh1
echo 1024 > /proc/sys/net/ipv4/neigh/default/gc_thresh2
echo 2048 > /proc/sys/net/ipv4/neigh/default/gc_thresh3
```

## Real Scenario: Debugging a Connectivity Issue in 15 Minutes

You receive a ticket: "Users in the Sales VLAN (10.0.10.0/24) cannot access the internal application at 10.0.50.100. Users in other VLANs can access it fine."

### Minute 0-2: Gather Information

From a Sales VLAN workstation (10.0.10.50):

```bash
# Can we ping the application server?
ping -c 3 10.0.50.100
```

Result: 100% packet loss. The issue is Layer 3: no IP connectivity.

### Minute 2-4: Check Local Network

```bash
# Can we ping the default gateway?
ping -c 3 10.0.10.1

# Check IP configuration
ip addr show eth0
ip route show
```

Result: Gateway responds. IP configuration is correct (10.0.10.50/24, gateway 10.0.10.1).

### Minute 4-6: Check Routing

```bash
# Trace the path to the server
traceroute 10.0.50.100
```

Result:
```
 1  10.0.10.1  1.2 ms
 2  * *
 3  * *
```

The path dies at hop 2. The default gateway (10.0.10.1) receives the packet but the next hop is not responding or not reachable.

### Minute 6-8: Check the Core Switch/Router

From the core switch (10.0.10.1):

```bash
# Check routing table
show ip route | include 10.0.50

# Check VLAN interfaces
show ip interface brief | include Vlan

# Check ACLs
show access-lists
show ip access-lists
```

Result: Route to 10.0.50.0/24 exists. VLAN 50 interface is up. But there is an ACL on VLAN 10:

```
ip access-list extended VLAN10-IN
  deny ip 10.0.10.0 0.0.0.255 10.0.50.0 0.0.0.255
  permit ip any any
```

This ACL explicitly denies traffic from VLAN 10 to VLAN 50.

### Minute 8-10: Identify the Cause

The ACL was added last week during a security audit to "isolate" Sales from the application server. But the change was not communicated, and the ticket was filed without knowing about it.

### Minute 10-12: Verify and Fix

```bash
# Check if removing the deny rule is safe
show access-lists VLAN10-IN detail

# Remove the deny rule (keep the permit)
conf t
ip access-list extended VLAN10-IN
 no deny ip 10.0.10.0 0.0.0.255 10.0.50.0 0.0.0.255
end

# Save
write
```

### Minute 12-14: Verify the Fix

```bash
# From the Sales workstation
ping -c 3 10.0.50.100
traceroute 10.0.50.100
```

Result: Ping succeeds. Traceroute shows two hops (workstation → gateway → server).

### Minute 14-15: Document

Update the ticket:
- **Root cause**: ACL on VLAN 10 interface blocked traffic to VLAN 50 subnet.
- **Fix**: Removed the deny rule from VLAN10-IN ACL.
- **Prevention**: Added this change to the configuration change management process. VLAN-to-VLAN access changes require approval from the application team.
- **Affected users**: All Sales VLAN users.
- **Downtime**: Approximately 2 hours.

### Lessons Learned

1. The first two minutes of information gathering saved 13 minutes of targeted investigation.
2. Following the OSI model bottom-up (physical → data link → network → transport → application) prevented wasted time on application-layer debugging when the issue was network-layer.
3. The ACL was not visible from the workstation: you had to check the network infrastructure.
4. Documenting the root cause prevents the same issue from recurring.

## Performance Troubleshooting

Network performance issues are harder to diagnose than connectivity issues because the network "works": it's just slow.

### Latency Analysis

```bash
# Measure baseline latency
ping -c 100 -i 0.1 10.0.1.50 | tail -1

# Check for asymmetric routing (different paths for forward/reverse)
traceroute 10.0.1.50
# Then check the reverse path from the destination

# Use pathping for per-hop latency statistics
pathping 10.0.1.50
```

### Bandwidth Analysis

```bash
# Measure throughput with iperf3
# Server side:
iperf3 -s

# Client side:
iperf3 -c 10.0.1.50 -t 30 -P 4

# Check for duplex mismatches
ethtool eth0 | grep -i speed
ethtool eth0 | grep -i duplex
# Both sides should match (full-duplex on both)
```

### Packet Loss Analysis

```bash
# Detect packet loss with extended ping
ping -c 1000 -i 0.01 10.0.1.50 | tail -3

# Capture and analyze loss with tcpdump
tcpdump -i eth0 -nn 'host 10.0.1.50' -c 10000 -w perf.pcap
# Then analyze retransmissions in Wireshark
```

## Wireless Troubleshooting

Wireless networks introduce unique challenges that wired troubleshooting tools cannot address.

### Common Wireless Issues

**Interference**: Other 2.4 GHz devices (microwaves, Bluetooth, baby monitors) cause intermittent connectivity.

```bash
# Scan for nearby access points
iwlist wlan0 scan | grep -E "Cell|ESSID|Channel|Signal"

# Check for channel congestion
# If many APs are on the same channel, switch to a less congested one
```

**Rogue access points**: Unauthorized APs on your network can intercept traffic.

```bash
# Detect rogue APs
# Look for DHCP offers from unexpected sources
tcpdump -i eth0 -nn 'udp port 67 or udp port 68' | grep -v "your-dhcp-server"

# Monitor for deauthentication frames (attack indicator)
tcpdump -i mon0 -nn 'type 0 subtype 12'
```

**Client roaming issues**: Devices stick to distant APs instead of roaming to closer ones.

```bash
# Check client signal strength
iwconfig wlan0 | grep "Signal level"

# Check AP signal strength from client perspective
iwlist wlan0 scan | grep -E "Cell|Signal"
```

## Assessment

**Lab Exercise: Troubleshooting Scenarios (50 minutes)**

Scenario 1 (15 minutes): A user reports they can ping 8.8.8.8 but cannot access https://google.com. Walk through your troubleshooting steps, showing the commands you would use at each step and what each result tells you.

Scenario 2 (15 minutes): You capture the following tcpdump output from a client trying to connect to a web server. Identify the issue:

```
14:30:01.001 IP 10.0.1.100.49152 > 10.0.50.100.80: Flags [S], seq 1, win 65535, length 0
14:30:01.002 IP 10.0.50.100.49152 > 10.0.1.100.80: Flags [R.], ack 1, win 0, length 0
```

Scenario 3 (20 minutes): A web server at 10.0.1.50 is experiencing intermittent connectivity. Users can ping it, but SSH connections time out half the time. You run:

```bash
ss -tlnp | grep :22
```

Output shows sshd is listening on port 22. But:

```bash
ss -tn | grep :22
```

Shows many connections in SYN-RECV state. What is happening, and how do you fix it?

**Grading Criteria:**
- Correct diagnostic commands at each step: 25 points
- Accurate interpretation of results: 25 points
- Root cause identification: 25 points
- Documentation quality: 25 points

## Evidence

Save the following to your portfolio:
1. Complete troubleshooting walkthrough for Scenario 1 with command outputs
2. tcpdump analysis for Scenario 2 showing the issue and resolution
3. SYN-RECV analysis and fix for Scenario 3
4. A one-page troubleshooting checklist you can use as a reference for future issues

Network troubleshooting is a perishable skill: it atrophies without practice. Set up a lab environment (even a simple one with two VMs and a virtual switch) and practice breaking and fixing things. The more scenarios you work through, the faster you will diagnose real issues under pressure.