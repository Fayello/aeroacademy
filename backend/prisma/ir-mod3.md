# Module 3: Containment

Containment is the phase where you stop the attacker from doing more damage. It involves difficult decisions made under time pressure with incomplete information. Get it right and you limit the blast radius. Get it wrong and you either let the attacker continue operating or you disrupt business operations unnecessarily. This module covers network isolation techniques, account lockdown, evidence preservation during containment, the tradeoffs between short-term and long-term containment, and how to make containment decisions when you do not have all the facts.

## Why Containment Is Hard

Containment is not a binary decision. You cannot simply "contain the incident": you need to decide what to contain, how aggressively to contain it, and when to contain it. Every containment action has a cost. Isolating a server stops the attacker but also stops legitimate users. Blocking an IP address prevents the attacker from communicating but might also block a partner or vendor. Forcing a password reset protects an account but disrupts the user.

The challenge is that you are making these decisions with incomplete information. You do not know exactly what the attacker has done, how many systems they control, or what their objectives are. You are making probabilistic decisions under uncertainty, and the stakes are high.

The general principle is this: when in doubt, contain. Disrupting business operations is always better than letting an attacker continue to operate. You can recover from business disruption. You cannot recover from data exfiltration or ransomware encryption.

## Network Isolation Techniques

Network isolation is the most common containment action. The goal is to cut the attacker's access to your network while preserving your ability to investigate and recover.

### Full System Isolation

Full system isolation disconnects a system from all networks. This is the most aggressive form of containment and is appropriate when you have high confidence that a system is compromised and you need to prevent any communication: inbound or outbound.

On Windows systems, you can disable the network adapter through Device Manager or via PowerShell. This is faster than physically disconnecting the network cable and can be done remotely. The command `Disable-NetAdapter -Name "Ethernet" -Confirm:$false` disables the primary network adapter immediately.

Physical disconnection is more reliable but requires physical access. Pull the network cable or power off the system. Physical disconnection ensures that no software-based persistence mechanism can reconnect the system. For critical systems or high-confidence compromises, physical disconnection is preferred.

Full isolation has a significant drawback: you lose access to the system for remote investigation. If you need to analyze the system, you either need physical access or you need to connect it to an isolated forensic network. Plan your investigation approach before you isolate.

### Network Segmentation Containment

Rather than isolating individual systems, you can isolate entire network segments. This is appropriate when the compromise has spread across multiple systems in a segment or when you need to contain a broader threat.

Firewall rules can block traffic between segments. If your network is segmented by VLAN, you can modify VLAN assignments to isolate a segment. If you use software-defined networking, you can push rules programmatically. The specific technique depends on your network architecture, but the principle is the same: cut off the segment from the rest of the network.

Segmentation containment preserves the ability to investigate within the isolated segment. Analysts can still access systems within the segment; they just cannot access the segment from outside. This is useful when you need to contain a threat while still investigating multiple systems within a segment.

### Selective Isolation

Selective isolation blocks specific traffic while allowing other traffic. This is useful when you need to contain a specific threat without disrupting all business operations on a system.

Firewall rules can block traffic to and from specific IP addresses, ports, or protocols. If the attacker is communicating with a known C2 server, you can block that specific IP address while allowing all other traffic. If the attacker is using a specific protocol for data exfiltration, you can block that protocol while allowing legitimate traffic.

Selective containment requires more knowledge about the attacker's infrastructure. You need to know the C2 addresses, the exfiltration methods, and the protocols in use. This knowledge typically comes from your investigation during the detection and triage phases.

### Network-Level Containment Tools

Your network infrastructure provides several containment mechanisms.

**Firewall rules** are the most common containment tool. You can add rules to block traffic between specific IPs, subnets, or ports. Most firewalls allow rule changes to be pushed immediately, making this a fast containment option.

**DNS sinkholing** redirects the attacker's C2 domains to an IP you control. This prevents the malware from reaching its C2 server while allowing you to monitor for infected systems that attempt to connect. Sinkholing is particularly useful for detecting the full scope of an infection: every system that queries the sinkholed domain is likely compromised.

**BGP blackholing** drops all traffic to a specific IP prefix. This is a network-level containment option that is useful for containing distributed attacks or compromised systems that are generating large volumes of traffic. BGP blackholing affects all traffic to the destination, so it is a blunt instrument.

**VPN disconnection** terminates VPN sessions for compromised accounts. If an attacker is using VPN access to operate in your network, disconnecting their VPN session is an immediate containment action. Follow up with credential rotation and MFA enforcement.

## Account Lockdown

Account lockdown is containment for identity-based threats. If the attacker has compromised credentials, you need to lock down those accounts and prevent the attacker from using them.

### Password Resets

Forcing a password reset is the most basic account lockdown action. It invalidates the current password and forces the user to create a new one. For compromised accounts, this is a mandatory containment action.

Reset passwords through your identity provider or Active Directory, not through the compromised system. If the attacker has compromised a system, they may be logging the password reset process. Reset from a known-clean system.

Service accounts require special attention. Service account passwords are often stored in configuration files, scheduled tasks, or other automated systems. If you reset a service account password without updating all the places where it is stored, you will break services. Inventory all uses of a compromised service account before resetting the password.

### Account Disabling

Disabling an account completely prevents anyone: including the attacker: from using it. This is more aggressive than a password reset and is appropriate when you need to ensure the account cannot be used while you investigate.

Disable the account at the identity provider or Active Directory level. Check for any session tokens or cookies that might still be valid. Some systems honor session tokens even after the account is disabled, so you may need to explicitly revoke sessions.

### Session Token Revocation

Password resets and account disabling do not automatically invalidate session tokens. If the attacker has a valid session token, they may still be able to access systems even after the password is changed. Revoke all active sessions for compromised accounts.

Most identity providers have a mechanism to revoke all sessions for a user. In Active Directory, you can use the "Reset Password" function with the "User must change password at next logon" option, which invalidates existing Kerberos tickets. For web applications, invalidate the user's session on the application side.

### Privilege Escalation Containment

If the attacker has escalated privileges, you need to contain the privilege escalation. This means removing unauthorized admin accounts, revoking unauthorized group memberships, and restoring the principle of least privilege.

Check Active Directory for unauthorized domain administrator accounts, unauthorized group memberships, and unauthorized delegation configurations. The attacker may have created a new domain admin account or added their compromised account to the Domain Admins group. Remove any unauthorized changes.

Review Group Policy for unauthorized changes. Attackers sometimes modify Group Policy to deploy persistence mechanisms, disable security controls, or create scheduled tasks. Identify and revert any unauthorized Group Policy changes.

## Evidence Preservation During Containment

Containment and evidence preservation often conflict. The fastest containment action: pulling the plug: destroys volatile evidence. The best evidence preservation: leaving the system running: allows the attacker to continue operating. You need to balance these competing priorities.

### Volatile Data Collection

Before isolating a system, collect volatile data that will be lost when the system is powered off or disconnected. Volatile data includes:

**RAM contents** contain running processes, network connections, encryption keys, and other data that exists only in memory. RAM is lost when the system is powered off. Use a memory acquisition tool to capture RAM before taking containment actions. We will cover memory forensics in detail in Module 7.

**Network connections** show what the system is currently connected to. Run `netstat -ano` on Windows or `ss -tulnp` on Linux to capture current network connections. This data helps identify C2 servers and lateral movement targets.

**Running processes** show what is executing on the system. Use Task Manager, Process Explorer, or `ps` commands to capture the process list. This data helps identify malicious processes and their parent-child relationships.

**Logged-on users** show who is currently authenticated to the system. Use `query user` on Windows or `who` on Linux. This data helps identify whether the attacker is actively using the system.

**System time** is critical for correlating evidence across multiple systems. Record the system time and the time offset from UTC before making any changes.

### Forensic Imaging

For systems that need to be fully preserved, create a forensic image before containment. A forensic image is a bit-for-bit copy of the storage media that preserves all data, including deleted files and unallocated space. We will cover forensic imaging in detail in Module 6.

The challenge is that imaging takes time. A full disk image of a modern server can take hours. If the attacker is actively exfiltrating data, you may not have hours to wait. In these situations, prioritize volatile data collection and image the disk after containment.

### Chain of Custody

Every piece of evidence collected during containment needs to be tracked with chain of custody documentation. This documentation records who collected the evidence, when it was collected, where it was stored, and who has accessed it. Chain of custody is critical for legal admissibility of evidence.

Label evidence with a unique identifier, the date and time of collection, the collector's name, and a description of the evidence. Store evidence in a secure location with controlled access. Maintain a log of everyone who accesses the evidence.

## Short-Term vs Long-Term Containment

Containment happens in two stages: short-term containment to stop the immediate bleeding, and long-term containment to address the root cause.

### Short-Term Containment

Short-term containment is your immediate response to stop the attack. The goal is to prevent further damage while you investigate and develop a longer-term strategy. Short-term containment actions should be fast, reversible, and focused on stopping the most critical threats first.

Common short-term containment actions:

**Isolate compromised endpoints.** Disconnect the system from the network. This stops the attacker from using that system for lateral movement or data exfiltration.

**Block malicious IPs and domains.** Add firewall rules to block known attacker infrastructure. This prevents the malware from communicating with its C2 server.

**Disable compromised accounts.** Lock the accounts the attacker is using. This prevents the attacker from authenticating to other systems.

**Implement emergency access controls.** Tighten firewall rules, enable additional logging, and restrict access to critical systems. This limits the attacker's ability to move laterally.

**Deploy additional monitoring.** Add detection rules specifically for the attacker's known indicators. This helps you detect if the attacker is still operating in your network.

Short-term containment should happen within hours of incident confirmation. The longer you wait, the more damage the attacker can do.

### Long-Term Containment

Long-term containment addresses the root cause of the compromise and implements measures to prevent the attacker from regaining access. Long-term containment is more thorough but also more disruptive, so it is implemented after the immediate threat is contained.

Common long-term containment actions:

**Patch vulnerabilities.** If the attacker exploited a vulnerability, patch it across your environment. Do not just patch the exploited system: patch every system that is vulnerable.

**Rotate credentials.** Change every password the attacker may have accessed. This includes user accounts, service accounts, and administrative credentials. If you are not sure whether the attacker accessed a credential, rotate it anyway.

**Implement additional controls.** If the attacker bypassed a security control, strengthen or replace it. If the attacker used lateral movement, implement additional segmentation. If the attacker used credential theft, implement additional authentication controls.

**Rebuild compromised systems.** Rather than trying to clean a compromised system, rebuild it from known-good media. This eliminates any persistence mechanisms the attacker may have established.

**Implement enhanced monitoring.** Add detection rules and monitoring for the attacker's known tactics, techniques, and procedures. This helps you detect if the attacker attempts to regain access.

Long-term containment may take days or weeks to fully implement. The key is to address the most critical gaps immediately and schedule the rest for completion as soon as possible.

## Real Scenario: Containing a Compromised Server

On a Wednesday afternoon, the EDR agent on a production web server alerted on a suspicious process. The alert indicated that the Apache web server process had spawned a Bash shell, which then executed a download command. This was a clear indicator of compromise: the web server should never spawn shell processes.

The SOC analyst triaged the alert within 10 minutes and classified it as Critical severity. The web server was a customer-facing application that processed payment transactions. The analyst immediately escalated to the IR team.

The Incident Commander assessed the situation. The web server was on a network segment with access to the payment processing database. If the attacker had compromised the web server, they might be able to access payment data. The decision was made to contain immediately.

The first containment action was to isolate the web server from the network. The team disabled the network adapter on the server using a remote management console. This immediately stopped the attacker from using the web server for lateral movement or data exfiltration. However, it also took the payment processing application offline, which affected customers.

Before isolating the server, the forensic analyst collected volatile data. They captured a memory dump, recorded running processes, captured network connections, and documented logged-on users. The memory dump revealed that the attacker had a reverse shell running from the web server to an external IP address. The network connections showed that the attacker had connected to the payment processing database server.

The team expanded containment to the database server. They isolated the database server from the network and collected volatile data from it. The forensic analysis of the database server revealed that the attacker had queried the customer payment table and downloaded approximately 50,000 records.

The team then implemented broader containment. They blocked the attacker's external IP addresses at the perimeter firewall, disabled all service accounts that had access to the payment processing segment, and implemented emergency firewall rules to restrict traffic to the payment processing segment.

Long-term containment took three days. The team rebuilt the web server from a clean image, patched the vulnerability that allowed the initial compromise (an unpatched Apache Struts vulnerability), rotated all service account credentials, implemented additional network segmentation around the payment processing segment, and deployed additional monitoring on all systems in the segment.

The total containment time was 4 hours from initial detection to full short-term containment. The long-term containment took 3 days. The attacker had access to the web server for approximately 6 hours before detection: they had gained access through the vulnerability the previous night.

Key lessons from this containment:

**Speed was critical.** The SOC analyst triaged within 10 minutes and escalated immediately. The IR team contained within 4 hours. That speed limited the damage.

**Evidence preservation was balanced with containment.** The team collected volatile data before isolating the systems, which preserved evidence for the forensic investigation.

**Scope expansion was handled.** When the forensic analysis revealed that the attacker had moved to the database server, the team expanded containment to include that system. Containment scope should be driven by evidence, not assumptions.

**Business impact was accepted.** Taking the payment processing application offline cost the company revenue. But the alternative: leaving the attacker in the network with access to payment data: was worse.

## Containment Decision Framework

When you are in the middle of an incident and need to make containment decisions, use this framework:

1. **What is the attacker doing right now?** Determine the attacker's current activity. Are they still in the network? Are they actively exfiltrating data? Are they moving laterally? The answers to these questions determine the urgency of containment.

2. **What systems are affected?** Map every system the attacker has accessed or may have accessed. This determines the scope of containment.

3. **What is the business impact of containment?** Estimate the business cost of each containment action. Isolating a production server costs more than isolating a development workstation. Understanding the business impact helps you prioritize.

4. **What evidence do I need to preserve?** Identify the evidence you need before taking containment actions. Collect volatile data first, then contain.

5. **What is the containment escalation path?** Start with the least disruptive containment action that addresses the threat. If that is not sufficient, escalate to more aggressive measures.

6. **Who needs to be notified?** Containment actions that affect business operations need to be communicated to stakeholders. Have a communication plan before you contain, not after.

## Assessment

### Lab Exercise 1: Containment Strategy Development (45 minutes)

You are given a scenario involving a compromised server with access to sensitive data. Your task is to develop a containment strategy.

**Scenario:** A database server containing customer PII has been compromised. The attacker has been in the network for an unknown period. The server is on the same network segment as three other critical application servers.

**Lab Tasks:**

1. Identify all containment options available to you (10 minutes)
2. Develop a short-term containment plan with specific actions and timelines (15 minutes)
3. Develop a long-term containment plan (10 minutes)
4. Document the evidence preservation steps you would take before containment (10 minutes)

**Grading Criteria:**

- Comprehensive containment options: 20 points
- Appropriate short-term containment plan: 30 points
- Thorough long-term containment plan: 25 points
- Evidence preservation completeness: 25 points

### Lab Exercise 2: Network Isolation Implementation (30 minutes)

In a lab environment, implement network isolation for a compromised system using multiple techniques.

**Lab Tasks:**

1. Implement host-based firewall rules to block the attacker's C2 IP (10 minutes)
2. Disable the network adapter on the compromised system (5 minutes)
3. Implement DNS sinkholing for the attacker's C2 domain (10 minutes)
4. Verify that isolation is effective: the system cannot reach the C2 server (5 minutes)

**Grading Criteria:**

- Correct implementation of host-based firewall rules: 30 points
- Successful network adapter isolation: 20 points
- Correct DNS sinkhole configuration: 30 points
- Verification of isolation effectiveness: 20 points

### Lab Exercise 3: Account Lockdown Procedure (45 minutes)

You are given a scenario involving compromised credentials. Your task is to implement account lockdown.

**Scenario:** A domain administrator account has been compromised. The attacker is using the account to access file servers and enumerate network shares.

**Lab Tasks:**

1. Disable the compromised domain administrator account (5 minutes)
2. Identify all systems where the account has been used in the last 24 hours (10 minutes)
3. Force password resets for all accounts that may have been exposed to the compromised account (15 minutes)
4. Review and remove any unauthorized group memberships or privilege escalation (10 minutes)
5. Document all actions taken (5 minutes)

**Grading Criteria:**

- Correct account disablement: 15 points
- Comprehensive system identification: 25 points
- Thorough credential rotation: 25 points
- Privilege escalation remediation: 20 points
- Documentation completeness: 15 points

## Evidence

### Key Concepts

- **Full System Isolation:** Disconnects a system from all networks: most aggressive containment
- **Segmentation Containment:** Isolates entire network segments while preserving intra-segment access
- **Selective Isolation:** Blocks specific traffic while allowing legitimate traffic
- **Account Lockdown:** Password resets, account disabling, session revocation, privilege escalation containment
- **Volatile Data Collection:** RAM, network connections, running processes, logged-on users: collected before containment
- **Chain of Custody:** Documentation of evidence collection, handling, and storage
- **Short-Term Containment:** Immediate actions to stop the attack: within hours
- **Long-Term Containment:** Root cause remediation: days to weeks

### Containment Decision Matrix

| Factor | Low Impact | Medium Impact | High Impact |
|--------|-----------|---------------|-------------|
| **Attacker Active** | Monitor | Selective Isolation | Full Isolation |
| **Data at Risk** | Monitor | Selective Isolation | Full Isolation + Segment Isolation |
| **Lateral Movement** | Block IP | Disable Account + Block IP | Full Isolation + Account Lockdown |
| **Persistence Confirmed** | Monitor | Rebuild | Full Rebuild + Credential Rotation |

### Network Isolation Commands

**Windows:**
```powershell
# Disable network adapter
Disable-NetAdapter -Name "Ethernet" -Confirm:$false

# Block IP via Windows Firewall
New-NetFirewallRule -DisplayName "Block C2" -Direction Outbound -RemoteAddress 203.0.113.50 -Action Block

# Block domain via hosts file
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 malicious-domain.com"
```

**Linux:**
```bash
# Disable network interface
sudo ip link set eth0 down

# Block IP via iptables
sudo iptables -A OUTPUT -d 203.0.113.50 -j DROP

# Block domain via hosts file
echo "127.0.0.1 malicious-domain.com" | sudo tee -a /etc/hosts
```

### Containment Checklist

- [ ] Identify all compromised systems
- [ ] Collect volatile data from all compromised systems
- [ ] Isolate compromised systems from network
- [ ] Disable compromised accounts
- [ ] Block attacker infrastructure (IPs, domains)
- [ ] Implement emergency access controls
- [ ] Deploy additional monitoring
- [ ] Notify stakeholders
- [ ] Document all actions with timestamps
- [ ] Begin forensic investigation
