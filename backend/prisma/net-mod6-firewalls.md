# Module 6: Firewalls

Firewalls are the gatekeepers of network security. They examine traffic flowing between network segments and make allow/deny decisions based on rules. But a firewall is only as good as the rules you write: overly permissive rules leave you exposed, overly restrictive rules break legitimate services, and poorly organized rulesets become unmaintainable as they grow.

This module covers packet filtering with iptables/nftables, stateful vs stateless firewalls, next-generation firewalls, web application firewalls, rule optimization, and the practical process of building a firewall ruleset for a web server. You will learn to write rules that are both secure and maintainable.

## iptables: The Linux Packet Filter

iptables is the traditional Linux firewall, built into the kernel's netfilter framework. It processes packets through a series of chains and tables, applying rules in order.

### Tables and Chains

The main tables are:
- **filter**: The default table. Controls whether packets are accepted, rejected, or dropped.
- **nat**: Network Address Translation. Handles SNAT, DNAT, and MASQUERADE.
- **mangle**: Packet manipulation (TOS, TTL, MARK).
- **raw**: Connection tracking exemption.

The main chains (in the filter table):
- **INPUT**: Packets destined for the local machine.
- **OUTPUT**: Packets originating from the local machine.
- **FORWARD**: Packets passing through the machine (routing between interfaces).

The packet flow through chains:
```
Incoming packet → PREROUTING (nat/raw) → routing decision → INPUT (filter) → local process
                                                              → FORWARD (filter) → POSTROUTING (nat) → outgoing interface
Outgoing packet → OUTPUT (filter/raw) → routing decision → POSTROUTING (nat) → outgoing interface
```

### Basic iptables Commands

```bash
# View current rules
iptables -L -v -n

# View rules with line numbers
iptables -L -v -n --line-numbers

# View rules in the nat table
iptables -t nat -L -v -n

# Flush all rules (caution: this removes all firewall protection)
iptables -F
iptables -t nat -F

# Set default policy to DROP
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
```

### Writing iptables Rules

```bash
# Allow loopback traffic
iptables -A INPUT -i lo -j ACCEPT

# Allow established and related connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH from specific subnet
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -j ACCEPT

# Allow HTTP and HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow ICMP (ping)
iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Drop everything else
iptables -A INPUT -j DROP
```

The order of rules matters: iptables evaluates rules top to bottom and applies the first match. The `-A` flag appends the rule to the end of the chain.

### Rule Elements

```bash
# Source IP
iptables -A INPUT -s 192.168.1.0/24 -j ACCEPT

# Destination IP
iptables -A INPUT -d 10.0.0.1 -j ACCEPT

# Protocol
iptables -A INPUT -p tcp -j ACCEPT
iptables -A INPUT -p udp -j ACCEPT
iptables -A INPUT -p icmp -j ACCEPT

# Source/Destination port
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --sport 1024:65535 -j ACCEPT

# Interface
iptables -A INPUT -i eth0 -j ACCEPT
iptables -A OUTPUT -o eth1 -j ACCEPT

# Connection state
iptables -A INPUT -m conntrack --ctstate NEW -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP

# Rate limiting (anti-DoS)
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --set
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --update --seconds 60 --hitcount 5 -j DROP
```

### Logging

```bash
# Log dropped packets (with limit to prevent log flooding)
iptables -A INPUT -j LOG --log-prefix "IPTables-Dropped: " --log-level 4
iptables -A INPUT -j DROP

# Log only specific traffic
iptables -A INPUT -p tcp --dport 22 -j LOG --log-prefix "SSH-Attempt: "
```

Check logs with:
```bash
grep "IPTables-Dropped" /var/log/syslog
grep "IPTables-Dropped" /var/log/kern.log
```

### Saving and Restoring Rules

```bash
# Save rules (Debian/Ubuntu)
iptables-save > /etc/iptables/rules.v4
ip6tables-save > /etc/iptables/rules.v6

# Restore rules
iptables-restore < /etc/iptables/rules.v4

# Using iptables-persistent (auto-restore on boot)
apt install iptables-persistent
netfilter-persistent save
netfilter-persistent reload
```

## nftables: The Modern Replacement

nftables is the successor to iptables. It provides a cleaner syntax, better performance, and atomic rule replacements (no race conditions when updating rulesets).

### nftables Basics

```bash
# View current ruleset
nft list ruleset

# Create a table
nft add table inet filter

# Create chains
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }
nft add chain inet filter forward { type filter hook forward priority 0 \; policy drop \; }
nft add chain inet filter output { type filter hook output priority 0 \; policy accept \; }

# Add rules
nft add rule inet filter input iif lo accept
nft add rule inet filter input ct state established,related accept
nft add rule inet filter input tcp dport {22,80,443} accept
nft add rule inet filter input icmp type echo-request accept
```

### nftables with Sets

One of nftables' advantages is native set support:

```bash
# Define a set of allowed ports
nft add set inet filter allowed_tcp_ports { type inet_service \; }

# Add ports to the set
nft add element inet filter allowed_tcp_ports { 22, 80, 443, 8080 }

# Use the set in a rule
nft add rule inet filter input tcp dport @allowed_tcp_ports accept
```

Updating the set automatically updates all rules that reference it: no need to modify individual rules.

### nftables Complete Web Server Ruleset

```bash
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    set blackhole {
        type ipv4_addr
        flags timeout
        timeout 1h
    }

    chain input {
        type filter hook input priority 0; policy drop;

        # Allow loopback
        iif lo accept

        # Drop blacklisted IPs
        ip saddr @blackhole drop

        # Allow established/related
        ct state established,related accept

        # Drop invalid
        ct state invalid drop

        # ICMP
        ip protocol icmp icmp type echo-request limit rate 10/second accept

        # SSH with rate limit
        tcp dport 22 ct state new meter ssh_meter { ip saddr limit rate 3/minute } accept
        tcp dport 22 ct state new add @blackhole { ip saddr timeout 1h }

        # HTTP/HTTPS
        tcp dport { 80, 443 } accept

        # Logging
        limit rate 5/minute log prefix "nft-drop: " level warn

        # Counter for dropped packets
        counter drop
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}
```

## Stateful vs Stateless Firewalls

**Stateless firewalls** examine each packet independently. A packet is allowed or dropped based solely on its header (source IP, destination IP, port, protocol). The firewall has no memory of previous packets.

Example stateless rule:
```bash
# Allow incoming TCP to port 80
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

Problem: This allows any packet with destination port 80, including packets that are part of an established connection initiated from inside the network, or spoofed packets.

**Stateful firewalls** track connection state using a connection tracking table (conntrack in Linux). They understand the TCP state machine and can make decisions based on whether a packet is part of a new, established, or invalid connection.

```bash
# Stateful approach: only allow new connections to port 80, but allow all established traffic
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -m conntrack --ctstate NEW -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP
```

The connection tracking table entries look like:
```bash
conntrack -L
```
Output:
```
tcp  6 431999 ESTABLISHED src=192.168.1.100 dst=93.184.216.34 sport=49152 dport=80 src=93.184.216.34 dst=192.168.1.100 sport=80 dport=49152 [ASSURED] mark=0 use=1
udp  17 29 src=192.168.1.100 dst=8.8.8.8 sport=54321 dport=53 src=8.8.8.8 dst=192.168.1.100 sport=53 dport=54321 [ASSURED] mark=0 use=1
```

Each entry tracks the original and reply directions of the connection, including NAT translations.

### Connection Tracking Limits

The conntrack table has a maximum size (configurable via `/proc/sys/net/netfilter/nf_conntrack_max`). When the table is full, new connections are dropped. Monitor with:

```bash
cat /proc/sys/net/netfilter/nf_conntrack_count
cat /proc/sys/net/netfilter/nf_conntrack_max
```

For high-traffic servers, increase the limit:
```bash
echo 262144 > /proc/sys/net/netfilter/nf_conntrack_max
echo 65536 > /proc/sys/net/netfilter/nf_conntrack_buckets
```

## Next-Generation Firewalls (NGFW)

Traditional firewalls filter based on IP addresses, ports, and protocols. Next-generation firewalls add:

**Application-layer inspection**: Identifies applications regardless of port (e.g., detecting BitTorrent on port 80, identifying Skype traffic, blocking specific web applications).

**User-based policies**: Allows rules based on user identity (integrated with Active Directory) rather than just IP address.

**SSL/TLS inspection**: Decrypts HTTPS traffic, inspects it, and re-encrypts it. This allows the firewall to detect threats hidden in encrypted traffic.

**Integrated IPS**: Combines firewall and intrusion prevention in a single device.

**Threat intelligence feeds**: Automatically updated signatures and reputation databases.

Products in this category include Palo Alto Networks, Fortinet FortiGate, Cisco Firepower, and Check Point. They are expensive but necessary for organizations that need to inspect application-layer traffic.

### When to Use NGFW vs Traditional Firewall

Use NGFW when:
- You need to control which applications users can access
- You need SSL inspection (and can handle the legal/privacy implications)
- You need integrated IPS functionality
- You have the budget and expertise to manage a complex appliance

Use traditional firewall (iptables/nftables) when:
- You need high performance at low cost
- You are filtering between network segments (not application-layer inspection)
- You need fine-grained control over packet processing
- You are building cloud infrastructure where virtual appliances are more practical

## Web Application Firewalls (WAF)

WAFs operate at Layer 7 (HTTP/HTTPS) and protect web applications from attacks like SQL injection, cross-site scripting (XSS), file inclusion, and other OWASP Top 10 vulnerabilities.

### WAF Deployment Modes

**Reverse proxy**: All traffic to the web server goes through the WAF. The WAF terminates the client connection, inspects the request, and creates a new connection to the backend server. This is the most secure deployment but introduces a single point of failure.

**Transparent bridge**: The WAF sits between the client and server without modifying IP routing. It inspects traffic inline and can drop malicious requests. Less common than reverse proxy mode.

**Out-of-band**: The WAF receives a copy of traffic (via SPAN/TAP) and analyzes it asynchronously. It cannot block attacks in real-time but can alert on detected threats.

### Popular WAF Solutions

**ModSecurity** (open-source, runs as an Apache/Nginx module):
```apache
# ModSecurity configuration
<IfModule mod_security2.c>
    SecRuleEngine On
    SecRule REQUEST_URI-DEPTH "@gt 20" "id:1001,phase:1,deny,status:403,msg:'URI depth exceeded'"
    SecRule REQUEST_BODY "@detectSQLi" "id:1002,phase:2,deny,status:403,msg:'SQL injection detected'"
</IfModule>
```

**NAXSI** (Nginx, open-source):
```nginx
# NAXSI configuration
SecRulesEnabled;
DeniedUrl "/RequestDenied";
CheckRule "$SQL >= 8" BLOCK;
CheckRule "$RFI >= 8" BLOCK;
CheckRule "$TRAVERSAL >= 4" BLOCK;
CheckRule "$EVADE >= 4" BLOCK;
CheckRule "$XSS >= 8" BLOCK;
```

**Cloud WAFs**: Cloudflare, AWS WAF, Azure WAF. These are deployed as a reverse proxy in the cloud, filtering traffic before it reaches your origin server.

### WAF Rule Tuning

WAFs produce false positives: legitimate requests flagged as attacks. Tuning is the process of adjusting rules to reduce false positives without creating false negatives.

```bash
# Example: Whitelist a specific IP range for a SQL injection rule
SecRule REMOTE_ADDR "@ipMatch 10.0.0.0/8" "id:1010,phase:1,pass,nolog,ctl:ruleRemoveById=942100"

# Example: Allow a specific parameter value that triggers a false positive
SecRule ARGS:search "@rx ^[a-zA-Z0-9 ]+$" "id:1011,phase:2,pass,nolog,ctl:ruleRemoveById=942200"
```

## Firewall Rule Optimization

As rulesets grow, optimization becomes critical for both performance and maintainability.

### Rule Ordering

Place the most frequently matched rules first. A packet is compared against rules sequentially; the first match wins. If 90% of your traffic is established connections, the ESTABLISHED,RELATED rule should be near the top.

```bash
# Good ordering
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT  # Matches 90% of traffic
iptables -A INPUT -p tcp --dport 22 -j ACCEPT                           # Matches 1% of traffic
iptables -A INPUT -p tcp --dport 80 -j ACCEPT                           # Matches 5% of traffic
iptables -A INPUT -j DROP                                                # Catches everything else
```

### Consolidate Rules

Instead of multiple rules for different ports, use port lists or multiport:

```bash
# Instead of:
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Use:
iptables -A INPUT -p tcp -m multiport --dports 22,80,443 -j ACCEPT
```

### Use ipsets for Large IP Lists

When blocking or allowing many IP addresses, individual iptables rules are slow. ipsets use hash tables for O(1) lookup:

```bash
# Create an ipset
ipset create blacklist hash:ip timeout 1h

# Add IPs to the set
ipset add blacklist 10.0.0.100 timeout 300
ipset add blacklist 10.0.0.101 timeout 300

# Use the set in iptables
iptables -A INPUT -m set --match-set blacklist src -j DROP

# Load a list of IPs from a file
ipset restore < /etc/ipset/blacklist.txt
```

### Rule Documentation

Document every rule with a comment:

```bash
iptables -A INPUT -p tcp --dport 22 -m comment --comment "SSH for admin subnet" -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -m comment --comment "HTTP for web traffic" -j ACCEPT
```

View comments:
```bash
iptables -L -v -n --line-numbers | grep comment
```

## Firewall Rule Auditing

Firewall rulesets grow organically over time, accumulating rules that are no longer needed, contradict each other, or are overly permissive. Regular auditing is essential.

### Finding Shadowed Rules

A shadowed rule is one that is never evaluated because a previous rule matches the same traffic first. These are dead weight that adds complexity without value.

```bash
# In iptables, rule order matters. If you have:
iptables -A INPUT -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -s 10.0.1.0/24 -j DROP  # This rule is never reached

# Find redundant rules by checking for overlapping match conditions
iptables -L -v -n | grep -E "^Chain|^ACCEPT|^DROP"
```

### Removing Stale Rules

```bash
# Find rules with zero packet/byte counters (never matched)
iptables -L -v -n | awk '$1 == 0 && $2 == 0 {print NR": "$0}'

# Remove rules that haven't matched traffic in 30 days
# (requires logging rule counters to a database)
```

### Rule Documentation

Every rule should have a comment explaining its purpose, who requested it, and when it was added:

```bash
iptables -A INPUT -p tcp --dport 8080 -m comment \
  --comment "Legacy app - remove after migration 2026-12-01" -j ACCEPT
```

## Real Scenario: Building a Firewall Ruleset for a Web Server

You are deploying a web server (10.0.1.50) that hosts a public-facing website. The server runs Nginx on ports 80 and 443, SSH on port 22 (restricted to admin subnet), and needs to connect to a database server (10.0.2.10) on port 5432.

### Step 1: Define the Policy

```bash
# Default policy: deny everything
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
```

### Step 2: Allow Loopback and Established Connections

```bash
# Loopback
iptables -A INPUT -i lo -j ACCEPT

# Established and related connections (performance optimization)
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Drop invalid packets
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP
```

### Step 3: Allow Required Services

```bash
# HTTP and HTTPS (public)
iptables -A INPUT -p tcp -m multiport --dports 80,443 -m conntrack --ctstate NEW -j ACCEPT

# SSH (admin subnet only)
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/24 -m conntrack --ctstate NEW -j ACCEPT

# ICMP echo request (rate limited)
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 10/second --limit-burst 20 -j ACCEPT
```

### Step 4: Restrict Database Access

```bash
# PostgreSQL (only from web server to database server)
iptables -A INPUT -p tcp --dport 5432 -s 10.0.1.50 -d 10.0.2.10 -j ACCEPT
```

This rule goes on the database server, not the web server. It ensures only the web server can connect to PostgreSQL.

### Step 5: Protection Against Common Attacks

```bash
# SYN flood protection
iptables -A INPUT -p tcp --syn -m limit --limit 100/second --limit-burst 150 -j ACCEPT
iptables -A INPUT -p tcp --syn -j DROP

# Port scan protection
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL FIN,URG,PSH -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL SYN,RST,ACK,FIN,URG -j DROP
iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST -j DROP
iptables -A INPUT -p tcp --tcp-flags SYN,FIN SYN,FIN -j DROP

# Drop XMAS packets
iptables -A INPUT -p tcp --tcp-flags SYN,RST,ACK,FIN,URG FIN,URG,PSH -j DROP
```

### Step 6: Logging

```bash
# Log dropped packets (limited rate to prevent log flooding)
iptables -A INPUT -m limit --limit 5/minute --limit-burst 10 -j LOG --log-prefix "FW-DROP: " --log-level 4

# Final drop (with counter)
iptables -A INPUT -j DROP
```

### Step 7: Anti-Brute-Force for SSH

```bash
# Track SSH connection attempts
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --set --name SSH

# Block if more than 3 attempts in 60 seconds
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --update --seconds 60 --hitcount 4 --name SSH -j DROP
```

### Step 8: Save and Verify

```bash
# Save rules
iptables-save > /etc/iptables/rules.v4

# Verify
iptables -L -v -n --line-numbers

# Check rule counters
iptables -L -v -n
```

### Expected Output

```
Chain INPUT (policy DROP 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 ACCEPT     all  --  lo     *       0.0.0.0/0            0.0.0.0/0
  15K  12M ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
    0     0 DROP       all  --  *      *       0.0.0.0/0            0.0.0.0/0            ctstate INVALID
  850  51K ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            multipt dpts:80,443 ctstate NEW
   12   720 ACCEPT     tcp  --  *      *       10.0.0.0/24          0.0.0.0/0            tcp dpt:22 ctstate NEW
   45  3780 ACCEPT     icmp --  *      *       0.0.0.0/0            0.0.0.0/0            icmptype 8 limit: up to 10/sec burst 20
    0     0 DROP       tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp flags:0x16/0x02 limit: up to 100/sec burst 150
    0     0 DROP       tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp flags:0x16/0x02
    0     0 DROP       tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp flags:0x3f/0x00
    0     0 DROP       tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp flags:0x3f/0x3f
    0     0 LOG        all  --  *      *       0.0.0.0/0            0.0.0.0/0            limit: avg 5/min burst 10 LOG flags 0 level 4 prefix "FW-DROP: "
   50  3000 DROP       all  --  *      *       0.0.0.0/0            0.0.0.0/0
```

The counters show how many packets and bytes each rule has matched. This is invaluable for verifying that rules are working as expected and identifying which rules are actually matching traffic.

## Firewall Monitoring and Logging

Firewall logs are essential for security monitoring, incident response, and compliance. Without logging, you cannot know what traffic is being allowed or blocked.

### iptables Logging

```bash
# Log dropped packets with rate limiting
iptables -A INPUT -m limit --limit 5/min --limit-burst 10 -j LOG \
  --log-prefix "FW-DROP: " --log-level 4

# Log specific traffic
iptables -A INPUT -p tcp --dport 22 -j LOG \
  --log-prefix "SSH-Attempt: "

# View firewall logs
grep "FW-DROP" /var/log/syslog
grep "FW-DROP" /var/log/kern.log
```

### Log Analysis

```bash
# Count drops per source IP
grep "FW-DROP" /var/log/kern.log | awk '{print $NF}' | sort | uniq -c | sort -rn | head -10

# Find dropped traffic patterns
grep "FW-DROP" /var/log/kern.log | awk -F'SRC=' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -rn

# Alert on high drop rates
tail -f /var/log/kern.log | grep "FW-DROP" | \
  awk '{count[$NF]++} END {for (ip in count) if (count[ip] > 100) print count[ip], ip}'
```

### Centralized Logging

For production environments, send firewall logs to a centralized SIEM:

```bash
# Send logs to remote syslog server
iptables -A INPUT -j LOG --log-prefix "FW: "
# Then configure rsyslog to forward to SIEM

# Using rsyslog
# In /etc/rsyslog.d/firewall.conf
:msg, contains, "FW" @@10.0.2.100:514
```

## Assessment

**Lab Exercise: Firewall Ruleset Design (55 minutes)**

Task 1 (20 minutes): Write a complete iptables ruleset for a server that:
- Hosts a web application on ports 80, 443, and 8080
- Requires SSH access from a single admin IP (10.0.0.50)
- Connects to a MySQL database on port 3306 (internal network only)
- Sends logs to a syslog server on 10.0.1.100
- Blocks all other inbound traffic

Include rate limiting for SSH, SYN flood protection, and port scan detection.

Task 2 (20 minutes): You discover that your web server is experiencing connection tracking table overflows (`nf_conntrack: table full, dropping packet`). Walk through:
- How to diagnose the issue
- Three ways to resolve it (with trade-offs)
- How to verify the fix

Task 3 (15 minutes): Compare iptables and nftables for a production environment. When would you choose one over the other? What migration steps would you follow?

**Grading Criteria:**
- Ruleset correctness and completeness: 30 points
- Security best practices (rate limiting, stateful filtering): 25 points
- Troubleshooting methodology: 25 points
- Tool selection rationale: 20 points

## Evidence

Save the following to your portfolio:
1. Complete iptables ruleset for Task 1 with comments explaining each rule
2. Connection tracking troubleshooting walkthrough for Task 2
3. iptables vs nftables comparison for Task 3
4. A rule ordering analysis showing why the established-connections rule should come first (with packet counter evidence from a real or simulated capture)

Firewalls are not set-and-forget devices. They require ongoing maintenance: updating rules as services change, monitoring logs for suspicious activity, tuning rate limits based on traffic patterns, and auditing rulesets periodically to remove stale entries. A well-maintained firewall is your first and last line of defense.