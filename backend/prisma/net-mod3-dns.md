# Module 3 — DNS

DNS is the internet's phone book, but that analogy undersells its complexity. A phone book is static; DNS is a distributed, hierarchical, eventually-consistent database that handles trillions of queries per day with millisecond latency. When it works, nobody notices. When it breaks, everything stops — email, websites, APIs, authentication, certificate validation. DNS is the single point of failure that everyone takes for granted.

This module covers DNS resolution in depth, record types and their practical uses, DNS security mechanisms, common attacks, and the real-world process of migrating DNS for a large domain. You will learn to use dig and nslookup for diagnostics, understand how caching affects propagation, and recognize the telltale signs of DNS-based attacks.

## DNS Hierarchy

DNS is organized as a tree of name servers, each responsible for a portion of the namespace. At the top are the root name servers (13 logical servers, A through M, distributed globally using anycast). Below the roots are the TLD (Top-Level Domain) servers — the servers responsible for .com, .org, .net, .uk, .io, etc. Below the TLDs are the authoritative name servers for individual domains.

When you query for www.example.com, the resolution process is iterative:

1. Your resolver (typically provided by your ISP or a public service like 8.8.8.8) starts at the root.
2. The root server does not know the answer, but it knows who handles .com. It returns a referral to the .com TLD servers.
3. Your resolver queries a .com TLD server. It does not know www.example.com, but it knows who handles example.com. It returns a referral to example.com's authoritative name servers.
4. Your resolver queries the authoritative name server for example.com. It knows the answer and returns the A record for www.example.com.

In practice, most resolvers already have the root hints cached (or hardcoded), and TLD server addresses change rarely, so the first query for a domain might take 2-4 round trips, but subsequent queries are served from the resolver's cache.

### Resolver vs Authoritative

The distinction between recursive resolvers and authoritative servers is critical:

- **Recursive resolver**: The server your device queries. It does the work of walking the hierarchy, caching results, and returning the final answer. Examples: your ISP's resolver, 8.8.8.8 (Google), 1.1.1.1 (Cloudflare), 9.9.9.9 (Quad9).
- **Authoritative server**: The server that actually holds the DNS records for a domain. It does not query other servers — it either has the answer or returns NXDOMAIN (name does not exist). Examples: ns1.example.com, ns2.example.com.

When someone says "DNS propagation," they mean that resolvers worldwide have cached the old answer and need to wait for the TTL to expire before querying the authoritative server again. This is not propagation in the sense of pushing updates — it is cache expiration.

## Record Types

DNS carries many types of records. Each serves a specific purpose, and confusing them leads to broken services.

### A and AAAA Records

A records map a hostname to an IPv4 address. AAAA records (quad-A, because they are 4 times the size of an A record — 128 bits vs 32 bits) map to IPv6 addresses.

```
example.com.        IN  A       93.184.216.34
www.example.com.    IN  A       93.184.216.34
www.example.com.    IN  AAAA    2606:2800:220:1:248:1893:25c8:1946
```

A hostname can have multiple A records for load balancing. DNS returns all records, and the client typically tries the first one. Round-robin DNS rotates the order of records in responses, distributing traffic across multiple servers.

### MX Records

MX (Mail Exchange) records specify which servers handle email for a domain. They include a priority number (lower = preferred).

```
example.com.    IN  MX  10  mail1.example.com.
example.com.    IN  MX  20  mail2.example.com.
```

When sending mail, the sending server queries MX records, sorts by priority, and tries the lowest-priority server first. If mail1 is unreachable, it tries mail2.

Important: MX records must point to a hostname (A/AAAA record), not an IP address directly. This is a common mistake.

### CNAME Records

CNAME (Canonical Name) records create an alias from one hostname to another. When a resolver encounters a CNAME, it restarts the resolution process using the canonical name.

```
www.example.com.    IN  CNAME   example.com.
example.com.        IN  A       93.184.216.34
```

When you query www.example.com, the resolver gets the CNAME to example.com, then resolves example.com to get the IP address.

Rules and pitfalls:
- A CNAME cannot coexist with any other record type for the same hostname. If www.example.com has a CNAME, it cannot also have an MX record.
- CNAME chains (CNAME pointing to another CNAME) are legal but discouraged. They add latency and can cause issues with some resolvers that limit chain depth.
- CNAME is often used for third-party services (e.g., pointing www to a CDN's hostname).

### NS Records

NS (Name Server) records delegate a subdomain to specific name servers.

```
example.com.        IN  NS  ns1.example.com.
example.com.        IN  NS  ns2.example.com.
ns1.example.com.    IN  A   192.0.2.1
ns2.example.com.    IN  A   192.0.2.2
```

NS records at the TLD level (e.g., in the .com zone) tell the world which servers are authoritative for your domain. The glue records (A records for ns1 and ns2 within the zone) ensure the resolver can reach the name servers.

### TXT Records

TXT records store arbitrary text. Originally designed for human-readable notes, they now carry machine-readable data for authentication and verification:

```
example.com.    IN  TXT "v=spf1 mx a ip4:192.0.2.0/24 -all"
example.com.    IN  TXT "google-site-verification=abcdef123456"
example.com.    IN  TXT "MS=ms12345678"
_dmarc.example.com.  IN  TXT "v=DMARC1; p=reject; rua=mailto:dmarc@example.com"
```

SPF (Sender Policy Framework) records list which servers are authorized to send email on behalf of the domain. DMARC (Domain-based Message Authentication, Reporting, and Conformance) tells receivers what to do with messages that fail SPF or DKIM checks.

### SRV Records

SRV records specify the host and port for specific services:

```
_sip._tcp.example.com.    IN  SRV  10 60 5060 sip1.example.com.
_sip._tcp.example.com.    IN  SRV  10 60 5060 sip2.example.com.
```

The format is: priority weight port target.

SRV records are used by SIP (VoIP), XMPP (chat), LDAP, and other protocols. They allow a service to advertise multiple servers with load balancing (via the weight field).

### PTR Records

PTR (Pointer) records provide reverse DNS — mapping an IP address to a hostname. They live in the in-addr.arpa (for IPv4) or ip6.arpa (for IPv6) zones.

```
34.216.184.93.in-addr.arpa.    IN  PTR www.example.com.
```

Reverse DNS is important for:
- Email delivery: Many mail servers reject email from IP addresses without valid reverse DNS.
- Logging and troubleshooting: Human-readable hostnames in logs.
- Some authentication mechanisms that verify IP-to-name mapping.

PTR records are managed by the IP address owner (typically the ISP or hosting provider), not the domain owner.

## DNS Resolution in Detail

Let us trace a complete DNS resolution for www.example.com from a Linux host.

First, check the local resolver configuration:
```bash
cat /etc/resolv.conf
```
Output:
```
nameserver 8.8.8.8
nameserver 8.8.4.4
search example.local
options timeout:2 attempts:3
```

The host sends queries to 8.8.8.8 (Google's public resolver). The search domain example.local is appended to unqualified names.

Now trace the resolution:
```bash
dig www.example.com
```
Output:
```
; <<>> DiG 9.18.18-0ubuntu0.22.04.2-Ubuntu <<>> www.example.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; QUESTION SECTION:
;www.example.com.              IN      A

;; ANSWER SECTION:
www.example.com.       86400   IN      CNAME   example.com.
example.com.           86400   IN      A       93.184.216.34

;; Query time: 23 msec
;; SERVER: 8.8.8.8#53(8.8.8.8)
;; WHEN: Mon Aug 31 10:30:00 UTC 2026
;; MSG SIZE  rcvd: 76
```

The response shows:
- status: NOERROR — the domain exists
- ANSWER: 2 records — a CNAME and an A record
- Query time: 23ms — this is the round-trip time to the resolver and back
- The CNAME chain: www.example.com → example.com → 93.184.216.34

The TTL (Time To Live) is 86400 seconds (24 hours). This means resolvers worldwide will cache this answer for up to 24 hours before re-querying.

### Querying Specific Record Types

```bash
# Mail exchange records
dig example.com MX

# Name servers
dig example.com NS

# TXT records (for SPF, DKIM, etc.)
dig example.com TXT

# All records
dig example.com ANY

# Trace the full resolution path from root
dig +trace www.example.com

# Query a specific name server
dig @ns1.example.com www.example.com

# Reverse DNS
dig -x 93.184.216.34
```

## DNS Caching and TTL

DNS caching is what makes DNS fast, but it also makes DNS changes slow to propagate. When a resolver caches a record, it serves that cached answer to all clients until the TTL expires. After expiration, the resolver re-queries the authoritative server.

TTL values represent a trade-off:
- Short TTL (60-300 seconds): Faster propagation of changes, but more load on authoritative servers and slightly higher latency for clients.
- Long TTL (3600-86400 seconds): Lower server load and faster client resolution (more cache hits), but changes take hours to propagate.

For most domains, a TTL of 3600 (1 hour) is reasonable. Before making a DNS change, lower the TTL to 300 (5 minutes) at least 24-48 hours in advance. This ensures that when you make the actual change, most resolvers have the short TTL cached and will re-query soon after the change.

### Cache Lifetime Calculation

The effective cache lifetime of a DNS record is determined by the minimum of:
1. The TTL in the authoritative response
2. The negative-cache TTL (how long NXDOMAIN responses are cached, typically 300-900 seconds)
3. The resolver's own maximum cache time (some resolvers cap TTL at 3600 or 86400 regardless of the authoritative TTL)

When troubleshooting DNS propagation issues, remember that different resolvers have different cache states. A resolver in Tokyo might have a different cached answer than one in New York. Tools like Google's DNS-over-HTTPS API (dns.google/resolve) can check what a specific resolver returns.

## DNS Security

### DNSSEC

DNSSEC (DNS Security Extensions) adds cryptographic signatures to DNS records, allowing resolvers to verify that the response came from the authoritative server and was not modified in transit.

DNSSEC works by:
1. Each zone has a Key Signing Key (KSK) and a Zone Signing Key (ZSK).
2. The ZSK signs all records in the zone, producing RRSIG (Resource Record Signature) records.
3. The KSK signs the ZSK, producing a DNSKEY record that can be used to verify the ZSK.
4. DS (Delegation Signer) records at the parent zone link the chain of trust from the root zone down to your zone.

When a resolver supports DNSSEC, it validates the chain of trust:
- Root zone → .com zone → example.com zone
- If any link in the chain is broken or invalid, the resolver returns SERVFAIL instead of the potentially spoofed answer.

DNSSEC does not encrypt DNS queries — it only provides authentication and integrity. Someone observing your queries can still see which domains you are resolving.

### DNS over HTTPS (DoH) and DNS over TLS (DoT)

DoH and DoT encrypt DNS queries, preventing eavesdropping and manipulation by network intermediaries (ISPs, firewalls, attackers on the same network).

**DoH** uses HTTPS (port 443) to encrypt DNS queries:
```bash
# Query via DoH using curl
curl -H 'accept: application/dns-json' \
  'https://dns.google/resolve?name=example.com&type=A'
```

**DoT** uses TLS (port 853) to encrypt DNS queries:
```bash
# Query via DoT using kdig
kdig +tls example.com
```

DoH has the advantage of being indistinguishable from regular HTTPS traffic, making it harder to block. DoT uses a dedicated port, making it easier to identify and potentially block.

## DNS Attacks

### Cache Poisoning (Kaminsky Attack)

Cache poisoning injects fraudulent DNS records into a resolver's cache. The classic Kaminsky attack (2008) exploits the fact that DNS queries use 16-bit transaction IDs:

1. Attacker sends a query for a non-existent subdomain (e.g., random123.example.com) to the target resolver.
2. The resolver queries the authoritative server and gets NXDOMAIN.
3. Before the response arrives, the attacker floods the resolver with spoofed responses containing a fake A record for, say, bank.com pointing to the attacker's IP.
4. If the attacker guesses the correct transaction ID and source port, the resolver accepts the spoofed response and caches it.
5. All users of that resolver are now directed to the attacker's server when they visit bank.com.

Mitigations:
- Randomize source ports and transaction IDs (all modern resolvers do this).
- Use DNSSEC to validate responses.
- Use 0x20 encoding (randomize case in query names and verify case in responses).

### DNS Amplification

DNS amplification is a DDoS technique:

1. Attacker sends DNS queries with a spoofed source IP (the victim's IP) to open resolvers.
2. The queries use ANY or TXT records on domains with large responses (e.g., dnssec-analyzer.tools.ietf.org).
3. The resolver sends the large response (amplification factor of 10-50x) to the victim.

The attacker sends small queries; the victim receives large responses. The amplification factor makes this devastating.

Mitigations:
- Deploy BCP38/BCP84 (ingress filtering) to prevent spoofed source IPs.
- Restrict open resolvers to only serve authorized clients.
- Rate-limit DNS responses.

### Zone Transfer Attacks

Zone transfer (AXFR) replicates the entire DNS zone to another name server. If an attacker can trigger a zone transfer, they get a complete map of your DNS zone — all hostnames, IPs, and record types — which is reconnaissance gold.

```bash
# Attempt zone transfer (this should fail if properly configured)
dig @ns1.example.com example.com AXFR
```

If the response contains actual records instead of a REFUSED or NOTAUTH error, your zone is exposed.

Mitigations:
- Restrict zone transfers to authorized secondary name servers only.
- Use TSIG (Transaction Signature) for zone transfer authentication.
- Monitor for unauthorized zone transfer attempts.

### DNS Tunneling

DNS tunneling encodes data in DNS queries and responses, using DNS as a covert channel. Tools like iodine and dnscat2 encapsulate arbitrary traffic in DNS queries (typically TXT or CNAME records).

The queries look like:
```
aGVsbG8gd29ybGQ.example.com  →  TXT  "SGVsbG8gV29ybGQ="
YmFzZTY0IGRhdGE.example.com  →  TXT  "QmFzZTY0IERhdGE="
```

Detection:
- High volume of DNS queries to a single domain
- Unusually long subdomain names (encoded data)
- TXT record queries from hosts that should not need them
- High entropy in queried subdomain names

## DNS Performance Optimization

DNS performance directly impacts user experience. A slow DNS resolver adds latency to every connection. Optimizing DNS involves caching, server placement, and protocol selection.

### Resolver Caching

Recursive resolvers cache responses based on the TTL. A well-configured resolver with a large cache serves most queries from memory, with latency under 1 millisecond.

```bash
# Check resolver cache size (Unbound)
unbound-control stats_noreset | grep num.msg.cache

# Check cache hit rate
# (cache hits / (cache hits + cache misses)) * 100 = hit rate
# A good resolver has a hit rate above 80%
```

### DNS Server Placement

Place authoritative DNS servers close to your users. Many DNS providers (Cloudflare, Route53, Google Cloud DNS) use anycast to automatically route queries to the nearest server.

For self-hosted DNS:
- Deploy at least two servers in different geographic locations
- Use BGP anycast if you have your own AS number
- Place resolvers close to clients (one per data center, or one per office for large organizations)

### DNS over TCP

Large DNS responses (DNSSEC, many records) may exceed the 512-byte UDP limit. EDNS0 extends this to 4096 bytes, but some networks fragment or drop large UDP packets. For reliability, always ensure your DNS infrastructure supports TCP on port 53.

```bash
# Test TCP DNS query
dig +tcp example.com

# Check if a name server supports TCP
dig +tcp +norecurse example.com @ns1.example.com
```

## Real Scenario: Migrating DNS for a Large Domain

You have been asked to migrate example.com's DNS from the old registrar's name servers to new infrastructure. The domain has 500+ records across multiple zones (example.com, api.example.com, mail.example.com, vpn.example.com).

### Pre-Migration Steps

**Step 1: Export the current zone.**
```bash
# Attempt zone transfer (if authorized)
dig @ns-old.example.com example.com AXFR > example.com.zone

# If zone transfer fails, reconstruct from dig queries
for type in A AAAA MX NS TXT CNAME SRV SOA; do
  dig example.com $type +noall +answer >> manual_export.txt
done
```

**Step 2: Audit existing records.**
Review every record. Remove stale entries, fix incorrect TTLs, verify MX records point to hostnames (not IPs), and ensure all CNAME targets exist. This is the perfect opportunity to clean up.

**Step 3: Set up new name servers.**
Deploy at least two authoritative name servers in different geographic locations and different network segments. Configure them with the exported zone data.

**Step 4: Verify new name servers respond correctly.**
```bash
# Test each new name server independently
dig @ns1-new.example.com example.com A
dig @ns2-new.example.com example.com MX
# Verify zone transfer is restricted
dig @ns1-new.example.com example.com AXFR  # Should be REFUSED
```

**Step 5: Lower TTLs at the old registrar.**
Reduce SOA and record TTLs to 300 seconds (5 minutes). Wait at least 48 hours for the old TTLs to expire from caches worldwide. This minimizes the propagation window during the switch.

### Migration Steps

**Step 6: Update NS records at the registrar.**
Log in to the registrar and change the NS records to point to your new name servers. The registrar propagates this change to the TLD servers (.com in this case).

**Step 7: Monitor propagation.**
```bash
# Check NS records from multiple resolvers
dig @8.8.8.8 example.com NS
dig @1.1.1.1 example.com NS
dig @9.9.9.9 example.com NS

# Use online propagation checkers to see global state
# (check multiple geographic locations)
```

**Step 8: Verify record resolution.**
Test all critical records from multiple resolvers:
```bash
# Verify A records
dig @8.8.8.8 www.example.com A
dig @1.1.1.1 api.example.com A

# Verify MX records
dig @8.8.8.8 example.com MX

# Verify SPF/DMARC
dig @8.8.8.8 example.com TXT
dig @8.8.8.8 _dmarc.example.com TXT
```

**Step 9: Monitor for 48-72 hours.**
Keep the old name servers running as secondary servers during the transition. Some resolvers may cache the old NS records for days. After 72 hours with no issues, you can decommission the old infrastructure.

### Rollback Plan

If something goes wrong during migration:
1. Revert the NS records at the registrar to the old name servers immediately.
2. Wait for propagation (use the lowered TTL of 300 seconds — worst case 5 minutes).
3. Investigate the issue with the new infrastructure.
4. Re-attempt the migration after fixing the problem.

### Post-Migration Verification

After the migration is complete:
```bash
# Verify all records resolve correctly
for host in www api mail vpn smtp imap; do
  echo "Testing ${host}.example.com"
  dig +short ${host}.example.com A
done

# Verify reverse DNS
dig -x $(dig +short mail.example.com A) +short

# Verify DNSSEC chain (if enabled)
dig example.com +dnssec
```

## DNS Logging and Monitoring

DNS logging is essential for security monitoring, troubleshooting, and compliance. Every DNS query and response should be logged.

### Authoritative Server Logging

```bash
# BIND logging configuration
logging {
    channel default_log {
        file "/var/log/named/default.log" versions 3 size 5m;
        severity info;
        print-time yes;
    };
    channel query_log {
        file "/var/log/named/queries.log" versions 5 size 10m;
        severity info;
        print-time yes;
    };
    category default { default_log; };
    category queries { query_log; };
};
```

### Resolver Logging

```bash
# Unbound resolver logging
# In /etc/unbound/unbound.conf
server:
    verbosity: 1
    log-queries: yes
    log-replies: yes
    log-servfail: yes
```

### DNS Query Analysis

```bash
# Count queries by domain
cat /var/log/named/queries.log | awk '{print $NF}' | sort | uniq -c | sort -rn | head -20

# Find queries to suspicious domains
grep "evil.com" /var/log/named/queries.log

# Find failed queries (NXDOMAIN)
grep "NXDOMAIN" /var/log/named/queries.log | awk '{print $NF}' | sort | uniq -c | sort -rn | head -10
```

## Assessment

**Lab Exercise: DNS Diagnostics and Migration (50 minutes)**

Task 1 (15 minutes): Using dig, perform the following lookups on example.com and document the results:
- A, AAAA, MX, NS, TXT, SOA records
- Trace the full resolution path using +trace
- Query each of the authoritative name servers individually
- Check for DNSSEC signatures (RRSIG records)

Task 2 (15 minutes): You discover that users in some locations can reach your website but users in others cannot. Walk through your troubleshooting steps, showing the dig commands you would use and what each result tells you. Include:
- How to determine if the issue is DNS-related
- How to check what different resolvers are returning
- How to identify cache poisoning
- How to verify zone transfer restrictions

Task 3 (20 minutes): Design a DNS migration plan for a domain with the following records:
- 3 A records (www, api, cdn)
- 2 MX records (priority 10 and 20)
- 1 SPF TXT record
- 1 DMARC TXT record
- 2 NS records

Include the step-by-step process, verification commands, and rollback plan. Identify the minimum time required for safe migration.

**Grading Criteria:**
- Correct use of dig and diagnostic commands: 25 points
- Thoroughness of troubleshooting methodology: 25 points
- Migration plan completeness and safety: 30 points
- Understanding of DNS propagation and caching: 20 points

## Evidence

Save the following to your portfolio:
1. Complete dig output for all record types on example.com
2. The full +trace output showing the resolution path from root to authoritative
3. Your DNS migration plan with timeline and rollback procedures
4. A written explanation (200-300 words) of why DNS propagation is not instantaneous and what TTLs do

DNS is the invisible infrastructure that makes the internet usable. Mastering DNS diagnostics is not optional for network engineers — it is a survival skill. When someone says "the internet is down," the first thing you should check is DNS.