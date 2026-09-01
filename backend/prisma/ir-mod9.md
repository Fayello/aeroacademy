# Module 9: Network Forensics

Network forensics is the analysis of network traffic and logs to understand attacker activity. While memory and disk forensics focus on individual systems, network forensics provides a broader view of how attackers move through your network, communicate with external infrastructure, and exfiltrate data. Every network connection leaves traces: packet captures, NetFlow records, firewall logs, and proxy logs. This module covers how to capture and analyze network traffic, use NetFlow for traffic analysis, correlate logs across systems, detect command and control channels, and investigate network activity from compromised hosts.

## Packet Capture Analysis

Packet captures record raw network traffic, preserving every byte of every packet. Packet analysis reveals the content of network communications: the protocols used, the data transferred, and the endpoints involved.

### Capturing Packets

Before you can analyze packets, you need to capture them. Several tools are available for packet capture.

**Wireshark** is the most widely used packet capture and analysis tool. It captures packets from network interfaces, decodes protocol headers, and provides a graphical interface for analyzing captured traffic. Wireshark supports a wide range of protocols and has powerful filtering capabilities.

**tcpdump** is a command-line packet capture tool for Unix systems. It captures packets and can filter them using BPF (Berkeley Packet Filter) expressions. tcpdump is lightweight and can be run on systems with limited resources.

```
tcpdump -i eth0 -w capture.pcap host 203.0.113.50
```

**tshark** is the command-line version of Wireshark. It provides the same analysis capabilities as Wireshark but can be used in scripts and automated analysis workflows.

```
tshark -r capture.pcap -Y "http.request" -T fields -e http.host -e http.request.uri
```

**NetworkMiner** is a network forensic analysis tool that extracts files, images, and credentials from packet captures. It is particularly useful for analyzing HTTP traffic and extracting transferred files.

### Protocol Analysis

Network forensics requires understanding common network protocols and how they are used (and abused) by attackers.

**DNS** is often the first protocol to analyze because DNS queries reveal the domains that systems are communicating with. Attackers use DNS for C2 communication, data exfiltration, and tunneling.

DNS analysis looks for:

- Queries to newly registered or low-reputation domains
- High query volumes to single domains (tunneling)
- TXT record queries (often used for data exfiltration)
- Subdomain encoding (data hidden in subdomain names)
- Queries to IP addresses instead of domain names (DNS over HTTPS or direct IP connections)

**HTTP/HTTPS** is the most common protocol for web traffic. HTTP is unencrypted and can be analyzed directly. HTTPS is encrypted, but TLS metadata: certificates, SNI (Server Name Indication), and connection patterns: provides useful forensic information.

HTTP analysis looks for:

- Requests to known malicious URLs
- Unusual user agents
- POST requests with large payloads (data exfiltration)
- Downloads of executable files
- Web shells and command execution

**SMB/CIFS** is used for file sharing on Windows networks. SMB traffic reveals file access, file transfers, and lateral movement.

SMB analysis looks for:

- Access to sensitive file shares
- Large file transfers
- Brute-force authentication attempts
- Use of default or administrative shares (ADMIN$, C$)

**RDP** is used for remote desktop access. RDP traffic reveals lateral movement and unauthorized remote access.

RDP analysis looks for:

- Connections from unusual source IPs
- Connections outside of normal business hours
- Multiple failed authentication attempts followed by success
- Use of stolen credentials for remote access

**SSH** is used for secure shell access on Linux systems. SSH traffic reveals lateral movement and unauthorized access.

SSH analysis looks for:

- Connections from unusual source IPs
- Connections outside of normal business hours
- Port forwarding and tunneling
- SFTP file transfers

### Traffic Analysis Techniques

**Statistical analysis** examines traffic patterns to identify anomalies. Unusual traffic volumes, unusual protocol usage, and unusual connection patterns all indicate potential malicious activity.

**Protocol conformance analysis** checks whether traffic conforms to protocol specifications. Malware that implements protocols incorrectly may produce traffic that does not conform to the specification.

**Content analysis** examines the payload of network packets. This reveals the actual data being transferred: files, commands, credentials, and other sensitive information. Content analysis is only possible for unencrypted protocols or when you have the decryption keys.

**Behavioral analysis** examines patterns of network behavior over time. Regular, periodic connections to the same external IP may indicate a C2 beacon. Large data transfers during off-hours may indicate data exfiltration.

## NetFlow Analysis

NetFlow is a network protocol that collects metadata about network flows. A flow is defined as a unidirectional sequence of packets between a source and destination. NetFlow records include source IP, destination IP, source port, destination port, protocol, byte count, packet count, and timestamps.

### Why NetFlow Matters

Packet captures provide detailed content but are expensive to store and analyze. A full packet capture of a busy network requires enormous storage and processing power. NetFlow provides a middle ground: it captures enough metadata to understand network activity without the storage overhead of full packet captures.

NetFlow data is typically retained for weeks or months, while packet captures are usually retained for hours or days. This longer retention makes NetFlow invaluable for historical investigations: you can go back weeks or months to see what network activity occurred.

### NetFlow Data Structure

A NetFlow record contains:

- **Source IP address:** The IP address of the flow's source
- **Destination IP address:** The IP address of the flow's destination
- **Source port:** The source port (for TCP/UDP)
- **Destination port:** The destination port (for TCP/UDP)
- **Protocol:** The IP protocol number (6 for TCP, 17 for UDP)
- **Byte count:** The total number of bytes transferred
- **Packet count:** The total number of packets transferred
- **Start time:** When the flow started
- **End time:** When the flow ended
- **Input interface:** The router interface where the flow entered
- **Output interface:** The router interface where the flow exited
- **TCP flags:** TCP flags observed in the flow (SYN, ACK, FIN, RST)

### NetFlow Analysis Tools

**nfdump** is a command-line tool for analyzing NetFlow data. It can filter, aggregate, and display NetFlow records.

```
nfdump -r flows.nfs - "src ip 203.0.113.50"
```

**SiLK** (System for Internet-Level Knowledge) is a suite of tools for analyzing NetFlow data. It provides powerful filtering, aggregation, and visualization capabilities.

**Elastic Stack** (formerly ELK Stack) can index and analyze NetFlow data using Elasticsearch, Logstash, and Kibana. This provides a scalable platform for NetFlow analysis with search, aggregation, and visualization capabilities.

**Flowbat** is a Python-based tool for analyzing NetFlow data with scripting capabilities. It is useful for custom analysis workflows.

### NetFlow Analysis Techniques

**Top talkers analysis** identifies the systems generating the most traffic. This can reveal data exfiltration (unusually high outbound traffic) or C2 communication (consistent traffic to a single external IP).

**Beacon analysis** identifies periodic connections to external IPs. Malware often communicates with C2 servers at regular intervals (beacons). By analyzing the timing of connections, you can identify beaconing behavior.

**Connection mapping** identifies which internal systems are communicating with which external systems. This reveals the scope of a compromise: if multiple internal systems are communicating with the same external IP, they may all be compromised.

**Port analysis** examines which ports are being used. Unusual port usage: like HTTP traffic on port 4444 or DNS queries on port 8080: may indicate malware using non-standard ports to evade detection.

**Protocol anomaly analysis** identifies traffic that does not match expected protocol behavior. DNS traffic on non-standard ports, HTTP traffic with unusual methods, or ICMP traffic with unusual payloads all indicate potential malicious activity.

## Log Correlation

Log correlation connects dots across multiple log sources to build a complete picture of attacker activity. No single log source tells the whole story: you need to combine logs from firewalls, proxies, IDS, authentication systems, and applications.

### Log Sources for Correlation

**Firewall logs** show network connections allowed and blocked by the firewall. They reveal which systems communicated with which external IPs and which ports were used.

**Proxy logs** show web traffic including URLs, user agents, and response codes. They reveal web-based attacks, data exfiltration, and C2 communication.

**IDS/IPS logs** show detected attacks and suspicious traffic. They reveal attack attempts, known malicious patterns, and policy violations.

**Authentication logs** show login events including success and failure, source IP, and timestamp. They reveal brute-force attacks, credential theft, and unauthorized access.

**DNS logs** show DNS queries and responses. They reveal domain generation algorithms (DGAs), DNS tunneling, and C2 communication.

**Application logs** show application-specific events. Web server access logs reveal web attacks, database logs reveal SQL injection attempts, and email logs reveal phishing campaigns.

**EDR logs** show endpoint-level activity including process execution, file creation, and network connections from individual systems.

### Correlation Techniques

**Time-based correlation** aligns events from different log sources by timestamp. If a firewall log shows a connection to a suspicious IP at the same time that an authentication log shows a successful login from that IP, the events are correlated.

**IP-based correlation** connects events that involve the same IP address. If the same external IP appears in firewall logs, proxy logs, and DNS logs, it is likely a key indicator of compromise.

**User-based correlation** connects events that involve the same user account. If the same user account appears in authentication logs, EDR logs, and application logs, you can reconstruct that user's activity across the entire environment.

**Hash-based correlation** connects events that involve the same file hash. If the same file hash appears in EDR logs, email gateway logs, and proxy logs, you can trace the file's movement through your environment.

**Session-based correlation** connects events that are part of the same network session. By correlating firewall connections, proxy requests, and application logs for the same session, you can reconstruct the full sequence of events.

### Correlation Tools

**SIEM** is the primary tool for log correlation. A well-configured SIEM ingests logs from all sources, applies correlation rules, and generates alerts when correlated events indicate suspicious activity.

**SOAR** (Security Orchestration, Automation, and Response) platforms automate correlation workflows. They can pull data from multiple sources, apply correlation logic, and present correlated findings to analysts.

**Scripts and queries** can perform custom correlation. SQL queries against log databases, Python scripts that process multiple log files, and Splunk/KQL queries can all perform correlation analysis.

## C2 Detection

Command and Control (C2) communication is how attackers maintain control over compromised systems. Detecting C2 channels is critical for identifying the full scope of a compromise and disrupting the attacker's operations.

### C2 Communication Patterns

**Beaconing** is the most common C2 pattern. Malware periodically connects to the C2 server to receive commands and exfiltrate data. Beaconing produces regular, periodic network connections that can be detected through timing analysis.

Beacon detection looks for:

- Regular connection intervals (every 5 minutes, every 30 minutes, etc.)
- Consistent packet sizes
- Consistent connection durations
- Connections to the same external IP or domain

**Domain fronting** disguises C2 traffic as legitimate HTTPS traffic by using a CDN. The TLS SNI field shows a legitimate domain, but the HTTP Host header shows the C2 domain. This technique bypasses domain-based filtering.

Domain fronting detection looks for:

- Connections to CDN domains with unusual HTTP Host headers
- Connections to CDN domains from processes that do not normally use the internet
- Connections to CDN domains with unusually large data transfers

**DNS tunneling** encodes C2 data in DNS queries and responses. DNS queries can carry up to 255 bytes of data in subdomain labels, and DNS responses can carry data in TXT records.

DNS tunneling detection looks for:

- High volumes of DNS queries to a single domain
- Unusually long subdomain names
- TXT record queries with large responses
- DNS queries on non-standard ports
- Unusual character patterns in subdomain names (Base64, hex encoding)

**Protocol manipulation** uses legitimate protocols for C2 by embedding commands in protocol-specific fields. HTTP cookies, ICMP payloads, and HTTP headers can all carry C2 data.

Protocol manipulation detection looks for:

- Unusually large cookies or HTTP headers
- ICMP packets with unusual payloads
- HTTP requests with unusual methods or parameters
- DNS queries with unusual record types

### C2 Detection Tools

**Zeek** (formerly Bro) is a network security monitor that produces detailed logs of network activity. Zeek's C2 detection capabilities include identifying beaconing behavior, analyzing DNS traffic, and detecting protocol anomalies.

**Suricata** is an IDS/IPS that detects C2 traffic using signature-based and anomaly-based detection. Suricata rules can detect known C2 protocols, known C2 infrastructure, and suspicious network patterns.

**RITA** (Real Intelligence Threat Analytics) is a tool specifically designed for C2 detection. It analyzes network traffic for beaconing behavior, DNS tunneling, and long connections.

**JARM** is a TLS fingerprinting tool that can identify C2 frameworks by their TLS handshake characteristics. Many C2 frameworks use default TLS configurations that produce distinctive fingerprints.

## Real Scenario: Analyzing Network Traffic from a Compromised Host

On a Wednesday evening, the IDS detected a suspicious outbound connection from a workstation in the IT department. The connection was to an IP address associated with a known threat actor's infrastructure. The analyst triaged the alert and classified it as Critical severity.

The IR team was assembled and began analyzing the network traffic from the compromised workstation. The investigation used multiple network forensic techniques:

**Packet capture analysis:** The team pulled packet captures from the network tap monitoring the IT department segment. The captures showed that the workstation had established a persistent TCP connection to the external IP address on port 443. The connection had been active for approximately 6 hours.

Analyzing the TLS handshake revealed that the connection was using TLS 1.2, but the certificate was self-signed and expired. This was unusual for legitimate HTTPS traffic and strongly suggested C2 communication.

Further analysis of the packet capture revealed that the connection was sending approximately 10 KB of data every 5 minutes in both directions. This regular, periodic pattern was consistent with C2 beaconing.

**NetFlow analysis:** The team pulled NetFlow data from the router monitoring the IT department segment. NetFlow analysis revealed:

- The workstation had made 72 connections to the external IP address over the past 24 hours
- The connections occurred at approximately 5-minute intervals (consistent with beaconing)
- The total data transferred was approximately 15 MB outbound and 5 MB inbound
- The connections occurred primarily during business hours but also included several connections during off-hours

The NetFlow data also revealed that two other workstations in the IT department had made connections to the same external IP address within the past week. This expanded the scope of the compromise from one system to three.

**DNS analysis:** The team pulled DNS query logs from the internal DNS server. The DNS analysis revealed:

- The compromised workstation had queried for the domain associated with the external IP address 47 times in the past 24 hours
- The DNS queries occurred at regular intervals (consistent with C2 beaconing)
- The DNS responses returned the same IP address each time (the C2 server was not using round-robin DNS)
- The domain was registered 3 months ago and had a low reputation score

**Proxy analysis:** The team pulled proxy logs from the web proxy. The proxy analysis revealed:

- The workstation had made 156 HTTPS requests to the C2 domain over the past 24 hours
- The requests were all to the same URL path with different parameters
- The User-Agent string was a legitimate Chrome User-Agent (the attacker was mimicking normal browser traffic)
- The responses were approximately 10 KB each (consistent with the packet capture findings)

**Correlated findings:** The team correlated findings across all network forensic sources:

- **Timeline:** The first connection to the C2 server occurred 72 hours before detection. The connection frequency increased over time, suggesting the attacker was escalating their activity.
- **Scope:** Three workstations in the IT department were compromised. All three connected to the same C2 server.
- **Data volume:** The total outbound data transfer across all three workstations was approximately 45 MB over 72 hours. This volume was consistent with data exfiltration rather than just C2 communication.
- **Attack pattern:** The attacker used DNS for initial C2 resolution, HTTPS for command execution, and the C2 domain was registered through a privacy-protected registrar.

The network forensic analysis revealed:

- **Initial compromise:** Unknown (likely phishing or exploit): the initial infection vector was not determined from network analysis alone
- **C2 infrastructure:** A self-signed TLS server on port 443 with a recently registered domain
- **Lateral movement:** None detected in network traffic: the attacker may have used other methods
- **Data exfiltration:** Approximately 45 MB of data transferred over 72 hours
- **Scope:** Three compromised workstations in the IT department

The findings were used to:

- Block the C2 IP address and domain at the perimeter firewall
- Identify and isolate all three compromised workstations
- Expand the investigation to determine how the attacker gained initial access
- Implement additional monitoring for the attacker's known indicators
- Notify affected parties about the potential data exfiltration

Key lessons from this investigation:

**Multiple network forensic sources provided a complete picture.** No single source: packet captures, NetFlow, DNS logs, or proxy logs: told the whole story. Correlating across sources revealed the full scope and timeline.

**NetFlow revealed scope expansion.** The initial alert was about one workstation, but NetFlow analysis revealed two additional compromised systems. Without NetFlow analysis, those systems would have been missed.

**Timing analysis detected beaconing.** The regular, periodic connection pattern was the key indicator of C2 communication. Statistical analysis of connection timing is one of the most effective C2 detection techniques.

**TLS metadata provided evidence even without decryption.** The self-signed certificate, expired certificate, and unusual TLS configuration all pointed to C2 communication even though the traffic was encrypted.

## Assessment

### Lab Exercise 1: Packet Capture Analysis (60 minutes)

You are given a packet capture file containing network traffic from a compromised network. Your task is to analyze the capture and identify malicious activity.

**Lab Tasks:**

1. Open the capture in Wireshark and identify the primary protocols (10 minutes)
2. Filter for suspicious traffic patterns (15 minutes)
3. Identify potential C2 communication (15 minutes)
4. Extract any files transferred over the network (10 minutes)
5. Document your findings (10 minutes)

**Grading Criteria:**

- Correct protocol identification: 10 points
- Effective traffic filtering: 25 points
- Accurate C2 identification: 30 points
- Successful file extraction: 20 points
- Complete documentation: 15 points

### Lab Exercise 2: NetFlow Analysis (45 minutes)

You are given NetFlow data from a network segment. Your task is to analyze the data and identify suspicious network activity.

**Lab Tasks:**

1. Identify top talkers by volume and connection count (10 minutes)
2. Identify potential beaconing behavior (15 minutes)
3. Identify connections to suspicious external IPs (10 minutes)
4. Map the network activity to identify the scope of compromise (10 minutes)

**Grading Criteria:**

- Accurate top talker identification: 20 points
- Correct beacon detection: 30 points
- Accurate suspicious IP identification: 30 points
- Complete scope mapping: 20 points

### Lab Exercise 3: Log Correlation Exercise (60 minutes)

You are given logs from multiple sources: firewall, proxy, DNS, and authentication. Your task is to correlate the logs and build a timeline of attacker activity.

**Lab Tasks:**

1. Parse and normalize the logs from all sources (15 minutes)
2. Correlate events by timestamp, IP address, and user (20 minutes)
3. Build a timeline of attacker activity (15 minutes)
4. Document the timeline with annotations (10 minutes)

**Grading Criteria:**

- Correct log parsing and normalization: 20 points
- Effective correlation across sources: 30 points
- Accurate timeline construction: 30 points
- Complete documentation: 20 points

## Evidence

### Key Concepts

- **Packet Capture:** Raw network traffic recording: captures every byte of every packet
- **NetFlow:** Network flow metadata: captures connection metadata without full packet content
- **Log Correlation:** Connecting events across multiple log sources to build a complete picture
- **C2 Detection:** Identifying command and control channels through beaconing analysis, DNS analysis, and protocol analysis
- **Protocol Analysis:** Understanding how network protocols are used and abused by attackers

### C2 Detection Indicators

| Indicator | Description | Detection Method |
|-----------|-------------|------------------|
| Regular beacons | Periodic connections to C2 | Timing analysis, RITA |
| DNS tunneling | Data encoded in DNS queries | DNS volume analysis, subdomain analysis |
| Domain fronting | C2 disguised as CDN traffic | TLS SNI vs HTTP Host comparison |
| Protocol manipulation | C2 data in protocol fields | Protocol conformance analysis |
| Encrypted C2 | C2 over HTTPS | TLS metadata analysis, JARM fingerprinting |

### Network Forensics Checklist

- [ ] Capture packets from the network segment
- [ ] Analyze NetFlow data for traffic patterns
- [ ] Correlate firewall, proxy, DNS, and auth logs
- [ ] Identify C2 communication patterns
- [ ] Detect beaconing behavior
- [ ] Analyze DNS queries for anomalies
- [ ] Examine proxy logs for suspicious URLs
- [ ] Extract files transferred over the network
- [ ] Map the scope of compromise
- [ ] Document all findings with evidence
