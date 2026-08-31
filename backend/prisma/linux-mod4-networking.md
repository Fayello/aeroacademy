# Module 4 — Networking

## Why This Matters

A Linux server without networking is a very expensive paperweight. Whether you are troubleshooting why an application cannot reach a database, figuring out why SSH connections are timing out, or configuring a firewall to allow only necessary traffic, networking is the skill you will use most often in operations.

This module covers the tools you need to configure, inspect, and debug network connectivity on Linux. We will work through the iproute2 suite, diagnostic tools, DNS troubleshooting, and iptables fundamentals. Every section includes real command output so you know exactly what to expect.

## The ip Command: Interfaces and Addresses

The `ip` command is part of the iproute2 suite and replaces the older `ifconfig` and `route` commands. It is the standard tool on every modern Linux distribution. If you learn one networking tool, make it this one.

### ip addr — Show and Configure IP Addresses

```bash
ip addr show
```
```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff
    inet 10.0.0.5/24 brd 10.0.0.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:acff:fe11:2/64 scope link 
       valid_lft forever preferred_lft forever
3: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 02:42:ac:22:00:02 brd ff:ff:ff:ff:ff:ff
    inet 10.0.1.5/24 brd 10.0.1.255 scope global eth1
       valid_lft forever preferred_lft forever
    inet6 fe80::42:acff:fe22:2/64 scope link 
       valid_lft forever preferred_lft forever
```

Key information from this output:
- `lo` is the loopback interface (127.0.0.1). Every machine has this. It is used for internal communication.
- `eth0` has IP `10.0.0.5` with a `/24` subnet mask (255.255.255.0)
- `eth1` has IP `10.0.1.5` with a `/24` subnet mask
- Both interfaces show `UP` and `LOWER_UP`, meaning the interface is administratively up and the physical link is active
- `mtu 1500` is the Maximum Transmission Unit — the largest packet size in bytes
- `qdisc fq_codel` is the queuing discipline (flow queue controlled delay, good for preventing bufferbloat)

The shorter version:

```bash
ip -4 addr show
```
```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    inet 10.0.0.5/24 brd 10.0.0.255 scope global eth0
3: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    inet 10.0.1.5/24 brd 10.0.1.255 scope global eth1
```

### Configuring IP Addresses

```bash
# Add an IP address
sudo ip addr add 10.0.0.100/24 dev eth0

# Remove an IP address
sudo ip addr del 10.0.100/24 dev eth0

# Bring an interface up or down
sudo ip link set eth0 up
sudo ip link set eth0 down

# Change MTU (useful for jumbo frames on internal networks)
sudo ip link set eth0 mtu 9000

# Change interface name
sudo ip link set eth0 name wan0
```

These changes are temporary. They disappear on reboot. To make them persistent, use your distribution's network configuration:
- Ubuntu: Netplan (`/etc/netplan/*.yaml`)
- Debian: `/etc/network/interfaces`
- RHEL/CentOS: NetworkManager or `/etc/sysconfig/network-scripts/`

### ip link — Link Layer Information

```bash
ip link show
```
```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
3: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
```

This shows interface state, MTU, and MAC addresses (the `link/ether` lines from `ip addr`).

### ip route — Routing Table

```bash
ip route show
```
```
default via 10.0.0.1 dev eth0 proto dhcp metric 100
10.0.0.0/24 dev eth0 proto kernel scope link src 10.0.0.5 metric 100
10.0.1.0/24 dev eth1 proto kernel scope link src 10.0.1.5 metric 100
10.10.10.0/24 via 10.0.0.254 dev eth0 proto static metric 50
```

Reading this routing table line by line:

1. `default via 10.0.0.1 dev eth0` — traffic that does not match any other route goes to the default gateway 10.0.0.1 via eth0
2. `10.0.0.0/24 dev eth0` — traffic to the 10.0.0.0/24 subnet goes directly out eth0 (no gateway needed — it is on the local network)
3. `10.0.1.0/24 dev eth1` — traffic to the 10.0.1.0/24 subnet goes directly out eth1
4. `10.10.10.0/24 via 10.0.0.254 dev eth0` — traffic to 10.10.10.0/24 goes through gateway 10.0.0.254 via eth0

The `metric` value is the route cost. Lower metric means higher priority. If two routes match, the one with the lower metric wins.

**Adding and removing routes:**

```bash
# Add a static route
sudo ip route add 192.168.200.0/24 via 10.0.0.253

# Add a default route
sudo ip route add default via 10.0.0.1

# Remove a route
sudo ip route del 192.168.200.0/24

# Flush the entire routing table (careful!)
sudo ip route flush all
```

### ip neigh — ARP Table

```bash
ip neigh show
```
```
10.0.0.1 dev eth0 lladdr 00:11:22:33:44:55 REACHABLE
10.0.0.50 dev eth0 lladdr 00:aa:bb:cc:dd:ee STALE
10.0.1.10 dev eth1 lladdr 11:22:33:44:55:66 REACHABLE
```

This shows the neighbor (ARP) table — IP-to-MAC-address mappings for devices on the local network. The states mean:

- `REACHABLE` — the neighbor is confirmed to be reachable
- `STALE` — the neighbor was reachable but has not been confirmed recently
- `DELAY` — waiting to confirm reachability
- `FAILED` — reachability confirmation failed
- `INCOMPLETE` — address resolution is in progress (ARP request sent, no response yet)

## ss: Socket Statistics

`ss` replaces `netstat` and is faster, especially on systems with many connections. It reads directly from the kernel's netfilter subsystem instead of parsing `/proc/net/tcp`.

### Common Usage

```bash
ss -tlnp
```
```
State    Recv-Q   Send-Q   Local Address:Port   Peer Address:Port   Process
LISTEN   0        128      0.0.0.0:22           0.0.0.0:*           users:(("sshd",pid=342,fd=3))
LISTEN   0        511      0.0.0.0:80           0.0.0.0:*           users:(("nginx",pid=567,fd=6))
LISTEN   0        511      0.0.0.0:443          0.0.0.0:*           users:(("nginx",pid=567,fd=7))
LISTEN   0        5        127.0.0.1:5432        0.0.0.0:*           users:(("postgres",pid=789,fd=3))
LISTEN   0        128      0.0.0.0:8080         0.0.0.0:*           users:(("python3",pid=1567,fd=4))
```

The flags:
- `-t` — TCP sockets
- `-l` — listening sockets only
- `-n` — numeric (do not resolve hostnames — faster and avoids DNS lookups)
- `-p` — show the process using the socket

Key columns:
- `Recv-Q` — data waiting to be read by the application
- `Send-Q` — data waiting to be sent by the kernel
- `Local Address:Port` — what the socket is bound to
- `Peer Address:Port` — the remote end (empty for listening sockets)
- `Process` — the process and file descriptor

A high `Recv-Q` on a listening socket means the application is not accepting connections fast enough. A high `Send-Q` on an established connection means the remote end is not reading data fast enough.

### All Connections

```bash
ss -tanp
```
```
State      Recv-Q   Send-Q   Local Address:Port     Peer Address:Port   Process
LISTEN     0        128      0.0.0.0:22             0.0.0.0:*           users:(("sshd",pid=342,fd=3))
ESTAB      0        0        10.0.0.5:22            10.0.0.100:52341    users:(("sshd",pid=2456,fd=3))
ESTAB      0        0        10.0.0.5:8080          10.0.0.100:45678    users:(("python3",pid=1567,fd=5))
TIME-WAIT  0        0        10.0.0.5:80            10.0.0.100:45679    -
CLOSE-WAIT 1        0        10.0.0.5:80            10.0.0.200:12345    users:(("nginx",pid=568,fd=4))
FIN-WAIT-2 0        0        10.0.0.5:80            10.0.0.200:12346    users:(("nginx",pid=568,fd=5))
```

Connection states:
- `ESTAB` — established connection, data is flowing
- `TIME-WAIT` — connection is closing but waiting for any delayed packets. This is normal and temporary.
- `CLOSE-WAIT` — the remote end closed the connection but the local end has not yet closed its side. This often indicates a bug in the application (it is not calling close() on the socket).
- `FIN-WAIT-2` — the local end sent a FIN and is waiting for the remote end's FIN. Also normal and temporary.

### Filtering

```bash
ss -tlnp | grep :22                # Find who is listening on port 22
ss -tanp state established         # All established connections
ss -tanp dst 10.0.0.200           # Connections to a specific destination
ss -tanp dport = :80              # Connections to port 80
ss -tanp sport = :80              # Connections from port 80
ss -tanp dst 10.0.0.200 dport = :80  # Connections to 10.0.0.200 on port 80
```

## Diagnostic Tools

### ping — Basic Connectivity

```bash
ping -c 4 10.0.0.1
```
```
PING 10.0.0.1 (10.0.0.1) 56(84) bytes of data.
64 bytes from 10.0.0.1: icmp_seq=1 ttl=64 time=0.432 ms
64 bytes from 10.0.0.1: icmp_seq=2 ttl=64 time=0.387 ms
64 bytes from 10.0.0.1: icmp_seq=3 ttl=64 time=0.412 ms
64 bytes from 10.0.0.1: icmp_seq=4 ttl=64 time=0.398 ms

--- 10.0.0.1 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 0.387/0.407/0.432/0.017 ms
```

`-c 4` sends exactly 4 packets. Without it, ping runs indefinitely until you press `Ctrl+C`.

Key metrics:
- `ttl=64` — time to live (number of hops remaining). Linux defaults to 64, Windows to 128.
- `time` — round-trip time in milliseconds. Under 1ms is typical for local network, 10-50ms for cross-country, 100-300ms for transcontinental.
- `packet loss` — any non-zero value indicates a problem.
- `mdev` — standard deviation of round-trip times. High mdev indicates inconsistent latency.

```bash
ping -c 4 -i 0.2 10.0.0.1        # Send packets every 200ms
ping -s 1400 -M do 10.0.0.1      # Test path MTU (1400 bytes, don't fragment)
ping -f 10.0.0.1                  # Flood ping (requires root, use carefully)
```

### traceroute — Path Discovery

```bash
traceroute 8.8.8.8
```
```
traceroute to 8.8.8.8 (8.8.8.8), 30 hops max, 60 byte packets
 1  gateway (10.0.0.1)  0.432 ms  0.387 ms  0.412 ms
 2  isp-router.example.com (203.0.113.1)  5.123 ms  5.087 ms  5.234 ms
 3  core-router.example.com (198.51.100.1)  10.234 ms  10.198 ms  10.345 ms
 4  8.8.8.8 (8.8.8.8)  15.456 ms  15.412 ms  15.567 ms
```

`traceroute` shows each hop along the path to a destination. It works by sending packets with increasing TTL values. Each router along the path decrements the TTL and sends back an ICMP "time exceeded" message when the TTL reaches 0.

If you see timeouts (asterisks) at a particular hop, that hop is either dropping ICMP packets or the path beyond it is broken.

Some hosts block ICMP, so `traceroute` may show timeouts that are not actual problems. Use it alongside other tools.

### mtr — Continuous Path Analysis

`mtr` combines ping and traceroute into a continuous display:

```bash
mtr 8.8.8.8
```
```
                       Loss%  Snt   Last   Avg  Best  Wrst StDev
 1. gateway            0.0%    50    0.4   0.4   0.3   0.5   0.1
 2. isp-router         0.0%    50    5.1   5.2   4.8   6.1   0.3
 3. core-router        4.0%    50   10.2  10.5   9.8  12.3   0.6
 4. 8.8.8.8            0.0%    50   15.4  15.5  14.9  16.8   0.4
```

The `Loss%` column is the key metric. If hop 3 shows 4% loss but hops 1, 2, and 4 show 0%, the loss at hop 3 is likely ICMP rate limiting, not an actual problem. If hops after a certain point all show loss, that is where the problem is.

Use `mtr -r -c 100 8.8.8.8` for a report mode that sends 100 packets and then exits.

### dig — DNS Queries

`dig` is the standard tool for DNS troubleshooting. It is more powerful and detailed than `nslookup`.

```bash
dig example.com
```
```
; <<>> DiG 9.18.18-0ubuntu0.22.04.2-Ubuntu <<>> example.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;example.com.                   IN      A

;; ANSWER SECTION:
example.com.            3600    IN      A       93.184.216.34

;; Query time: 12 msec
;; SERVER: 127.0.0.53#53(127.0.0.53)
;; WHEN: Mon Jan 15 10:30:00 UTC 2024
;; MSG SIZE  rcvd: 56
```

The `ANSWER SECTION` shows the IP address for `example.com`. The `status: NOERROR` indicates a successful query. The `Query time: 12 msec` shows how long the DNS resolution took.

**Query specific record types:**

```bash
dig example.com A                  # IPv4 address
dig example.com AAAA               # IPv6 address
dig example.com MX                 # Mail servers
dig example.com NS                 # Name servers
dig example.com TXT                # TXT records (SPF, DKIM, etc.)
dig example.com CNAME              # Canonical name
dig example.com SOA                # Start of Authority
```

**Short output:**

```bash
dig +short example.com
```
```
93.184.216.34
```

**Query a specific DNS server:**

```bash
dig @8.8.8.8 example.com
```

This queries Google's DNS server directly instead of your system's configured resolver. Useful for comparing results or troubleshooting DNS resolution issues.

**Trace the delegation path:**

```bash
dig +trace example.com
```

This shows the full DNS resolution path from root servers down to the authoritative server. It is like traceroute for DNS.

### nslookup — Quick DNS Lookups

```bash
nslookup example.com
```
```
Server:         127.0.0.53
Address:        127.0.0.53#53

Non-authoritative answer:
Name:   example.com
Address: 93.184.216.34
```

`nslookup` is simpler than `dig` but less powerful. For quick checks, it is fine. For serious DNS debugging, use `dig`.

### host — Simple DNS Lookups

```bash
host example.com
```
```
example.com has address 93.184.216.34
example.com mail is handled by 10 mail.example.com.
```

### DNS Configuration

The system's DNS resolver configuration is in `/etc/resolv.conf`:

```bash
cat /etc/resolv.conf
```
```
nameserver 127.0.0.53
nameserver 8.8.8.8
search internal.example.com example.com
options timeout:2 attempts:3
```

- `nameserver` — DNS servers to query (in order of preference). The system tries the first one and falls back to the second.
- `search` — domains to append when resolving short names. Typing `db01` resolves to `db01.internal.example.com`.
- `options` — timeout in seconds, number of attempts.

On systems using `systemd-resolved`, `/etc/resolv.conf` may point to `127.0.0.53` (the local stub resolver). Check with:

```bash
resolvectl status
```

The `/etc/hosts` file provides static hostname-to-IP mappings:

```bash
cat /etc/hosts
```
```
127.0.0.1   localhost
10.0.0.5    web-prod-01.internal web-prod-01
10.0.0.10   db-prod-01.internal db-prod-01
10.0.0.20   cache-prod-01.internal cache-prod-01
```

Entries in `/etc/hosts` are checked before DNS. This is useful for overriding DNS or providing local name resolution for services that are not yet in DNS.

## iptables: Firewall Basics

`iptables` configures the Linux kernel's netfilter firewall. It filters packets, performs NAT, and modifies packet headers. Understanding iptables is essential for securing any Linux server.

### Understanding Chains and Tables

The key concepts:
- **Tables** — categories of rules (filter, nat, mangle, raw). The `filter` table is the default and most commonly used.
- **Chains** — points in the packet flow where rules are applied:
  - `INPUT` — packets destined for this machine
  - `OUTPUT` — packets originating from this machine
  - `FORWARD` — packets passing through this machine (routing between interfaces)

Packets flow through the chain from top to bottom. Each rule is evaluated in order. If a packet matches a rule, the action (target) is applied. If no rule matches, the default policy is applied.

### Viewing Rules

```bash
sudo iptables -L -v -n
```
```
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
  150 12000 ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            state RELATED,ESTABLISHED
    5   400 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:22
    2   168 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:80
    1    84 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:443
  450 36000 DROP       all  --  *      *       0.0.0.0/0            0.0.0.0/0           

Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         

Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
```

The flags:
- `-L` — list rules
- `-v` — verbose (show packet and byte counters)
- `-n` — numeric output (do not resolve hostnames or port names)

This output shows:
- 150 packets (12KB) matched the ESTABLISHED,RELATED rule
- 5 packets matched the SSH rule (port 22)
- 2 packets matched the HTTP rule (port 80)
- 1 packet matched the HTTPS rule (port 443)
- 450 packets (36KB) hit the DROP rule (all other traffic)
- The FORWARD and OUTPUT chains have default ACCEPT policies

### Adding Rules

```bash
# Allow established connections
sudo iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT

# Allow SSH from a specific subnet
sudo iptables -A INPUT -s 10.0.0.0/24 -p tcp --dport 22 -j ACCEPT

# Allow HTTP and HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow DNS responses
sudo iptables -A INPUT -p udp --sport 53 -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 53 -j ACCEPT

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Allow ICMP (ping)
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Drop everything else
sudo iptables -A INPUT -j DROP
```

The `-A` flag appends a rule to the end of the chain. Rules are evaluated in order, so the ESTABLISHED,RELATED rule should come first for performance (most packets are part of established connections).

### Inserting Rules

```bash
# Insert a rule at position 3 (before the current rule 3)
sudo iptables -I INPUT 3 -p tcp --dport 8080 -j ACCEPT

# Insert a rule at the beginning of the chain
sudo iptables -I INPUT 1 -p tcp --dport 2222 -j ACCEPT
```

Use `-I` (insert) instead of `-A` (append) when you need a rule to be evaluated before other rules.

### Deleting Rules

```bash
# Delete by rule number (list with --line-numbers)
sudo iptables -L INPUT --line-numbers -n
```
```
Chain INPUT (policy ACCEPT)
num  pkts bytes target     prot opt in     out     source               destination         
1    150 12000 ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            state RELATED,ESTABLISHED
2      5   400 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:22
3      2   168 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:80
4      1    84 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:443
5    450 36000 DROP       all  --  *      *       0.0.0.0/0            0.0.0.0/0
```

```bash
sudo iptables -D INPUT 3        # Delete rule number 3
```

### Setting Default Policy

```bash
# Set default DROP policy on INPUT (blocks everything not explicitly allowed)
sudo iptables -P INPUT DROP

# Set default ACCEPT policy on OUTPUT (allows all outbound traffic)
sudo iptables -P OUTPUT ACCEPT

# Set default DROP policy on FORWARD (blocks routing unless explicitly allowed)
sudo iptables -P FORWARD DROP
```

**Warning:** Setting `INPUT` policy to `DROP` without first adding ACCEPT rules for SSH will lock you out. Always add your SSH rule first, verify you can connect, then change the policy.

### Saving Rules

```bash
# Debian/Ubuntu (with iptables-persistent)
sudo iptables-save > /etc/iptables/rules.v4
sudo ip6tables-save > /etc/iptables/rules.v6
sudo apt install iptables-persistent

# RHEL/CentOS
sudo service iptables save
```

Rules are not persistent by default. If you add rules but do not save them, they disappear on reboot.

## Real Scenario: Troubleshooting a Network Issue

Here is a realistic scenario: a user reports that they cannot access the web application at `web-prod-01` (10.0.0.5) on port 8080 from `10.0.0.100`.

**Step 1: Can we reach the host?**

```bash
ping -c 3 10.0.0.5
```
```
PING 10.0.0.5 (10.0.0.5) 56(84) bytes of data.
64 bytes from 10.0.0.5: icmp_seq=1 ttl=64 time=0.345 ms
64 bytes from 10.0.0.5: icmp_seq=2 ttl=64 time=0.312 ms
64 bytes from 10.0.0.5: icmp_seq=3 ttl=64 time=0.298 ms
```

Ping works. The host is reachable at the network layer.

**Step 2: Is the port open?**

```bash
ss -tlnp | grep 8080
```
```
LISTEN  0  128  0.0.0.0:8080  0.0.0.0:*  users:(("python3",pid=1567,fd=4))
```

The application is listening on port 8080 on all interfaces. Good.

**Step 3: Can we connect from the client?**

```bash
telnet 10.0.0.5 8080
```
```
Trying 10.0.0.5...
telnet: Unable to connect to remote host: Connection refused
```

Connection refused means either the port is not open or something is blocking it. Since `ss` shows it is open, it must be a firewall.

**Step 4: Check the firewall on the server.**

```bash
sudo iptables -L INPUT -v -n | head -20
```
```
Chain INPUT (policy ACCEPT)
 pkts bytes target     prot opt in     out     source               destination         
    3   252 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:22
    1    84 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:80
    2   168 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:443
  120  9600 DROP       all  --  *      *       0.0.0.0/0            0.0.0.0/0
```

Port 8080 is not in the allowed list. The DROP rule at the end is catching it. This is the root cause.

**Step 5: Add a rule to allow port 8080.**

```bash
sudo iptables -I INPUT 4 -p tcp --dport 8080 -j ACCEPT
```

Using `-I` (insert) rather than `-A` (append) puts the rule before the DROP rule.

**Step 6: Test again.**

```bash
curl -s http://10.0.0.5:8080/health
```
```json
{"status": "ok", "uptime": "3d 12h 45m"}
```

The application is now accessible.

**Step 7: Save the rule.**

```bash
sudo iptables-save > /etc/iptables/rules.v4
```

**Step 8: Document the issue and fix.**

Create a brief incident report noting the symptom (connection refused on port 8080), root cause (iptables rule missing for port 8080), and resolution (rule added and saved).

## Assessment

**Lab: Network Configuration and Troubleshooting (40 minutes)**

Scenario: You have a server with two network interfaces. You need to configure networking, set up a basic firewall, and troubleshoot connectivity issues.

**Tasks:**

1. Display all IP addresses on the server and save the output to `/tmp/ip_addresses.txt`.
2. Display the routing table and save it to `/tmp/routes.txt`.
3. Add a secondary IP address `10.0.0.100/24` to `eth0`. Verify it works by pinging it from another machine (or from the server itself).
4. Add a static route to `192.168.200.0/24` via gateway `10.0.0.254`.
5. Display all listening TCP ports and save the output to `/tmp/listening_ports.txt`.
6. Use `ss` to find all established connections to port 22.
7. Set up an iptables firewall with the following rules:
   - Allow established connections
   - Allow loopback
   - Allow SSH (port 22)
   - Allow HTTP (port 80) and HTTPS (port 443)
   - Allow DNS (port 53 UDP and TCP)
   - Allow ICMP echo requests
   - Drop all other incoming traffic
8. Save the iptables rules to `/tmp/iptables_rules.txt`.
9. Use `dig` to resolve `google.com` and `cloudflare.com`. Save the output of both to `/tmp/dns_results.txt`.
10. Use `traceroute` (or `mtr`) to trace the path to `8.8.8.8`. Save the output to `/tmp/traceroute.txt`.

**Grading Criteria:**

- IP addresses displayed correctly: 5 points
- Routing table saved: 5 points
- Secondary IP added and verified: 15 points
- Static route added: 10 points
- Listening ports listed: 5 points
- Established SSH connections found: 5 points
- iptables rules correct (all 7 rules): 30 points
- iptables rules saved: 5 points
- DNS queries completed: 10 points
- Traceroute completed: 10 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- Complete network configuration displayed and saved.
- A functional iptables firewall with appropriate rules.
- DNS resolution results for two domains.
- A traceroute showing the path to an external destination.
- All output files saved in `/tmp/`.
