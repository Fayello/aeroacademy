# Module 1: Incident Response Process

Incident response is not a theoretical exercise. When a SOC analyst pings you at 2 AM saying "we have ransomware spreading across the network," what happens next determines whether your organization recovers in hours or days, whether you face regulatory fines, and whether customer data ends up on paste sites. This module covers the six phases of incident response, the team structures that make it work, and the communication and legal frameworks you need to understand before the first alert fires.

## The Six Phases

Every mature IR program follows a structured process. The specifics vary by organization, but the core phases remain consistent. Understanding them is not about passing an exam: it is about knowing what to do when everything is on fire.

### Phase 1: Preparation

Preparation is the phase most organizations skip or underfund, and it is the phase that determines how well everything else goes. You cannot prepare during an incident. The time to build your IR playbook is before you need it.

Preparation starts with asset inventory. You need to know what you have before you can protect it. This means maintaining an up-to-date inventory of all systems, applications, network segments, and data stores. It sounds basic, but most organizations cannot answer the question "how many Windows servers do we run and where are they?" within an hour. If you cannot answer that question, you cannot contain an incident effectively.

The next piece is establishing your detection infrastructure. This includes SIEM deployment and tuning, IDS/IPS rules, EDR agents on endpoints, and log collection from critical systems. None of these tools are useful if they are not configured and monitored. A SIEM that nobody reviews is just an expensive log aggregator.

You also need documented procedures. Your IR playbook should cover the most common incident types your organization faces: malware infections, phishing campaigns, unauthorized access, data exfiltration, and denial-of-service attacks. Each playbook should specify who to contact, what evidence to collect, what systems to isolate, and what communication to send. The playbook does not need to be perfect: a one-page checklist you actually follow is better than a fifty-page document that sits on aSharePoint site nobody opens.

Legal preparation matters too. Before an incident, you need to know your legal obligations. This means understanding breach notification requirements in every jurisdiction where you operate, knowing whether you have cyber insurance and what it covers, and establishing relationships with outside counsel who specialize in incident response. The time to figure out whether you need to notify 500 customers or 500,000 customers is not when you are already behind on the notification deadline.

Finally, you need to train your team. Tabletop exercises are the most cost-effective way to test your IR plan. You gather your team, present a realistic scenario, and walk through the response. You will find gaps in your plan, gaps in your communication, and gaps in your team's knowledge: all without any actual damage. Run these exercises at least twice a year, and involve not just the technical team but also legal, communications, and executive leadership.

### Phase 2: Detection and Analysis

Detection is where most incidents begin: or where they should begin. The worst incidents are the ones that have been ongoing for months before anyone notices. Detection can come from automated alerts, user reports, or external notification (like law enforcement telling you that your data is for sale).

The first step when an alert fires is validation. Not every alert is a real incident. Your SOC team needs to quickly determine whether the alert represents a true positive, a false positive, or something that requires further investigation. This is where triage skills matter. We will cover triage in detail in Module 2, but the key point is that you need a systematic process for evaluating alerts.

Once you have validated that an incident is real, you need to scope it. How many systems are affected? What data is at risk? Is the attacker still in the network? Is the attacker still active? Answering these questions quickly is critical because it determines your containment strategy. If you only have one compromised endpoint, you isolate that endpoint. If you have a compromised domain controller, you have a much bigger problem.

Analysis during the detection phase is focused on understanding what happened, not on completing a forensic investigation. You are trying to determine the scope and severity so you can make containment decisions. This means pulling logs from affected systems, checking EDR telemetry, reviewing network traffic, and correlating indicators across your environment. The goal is a clear picture of what you are dealing with, not a complete forensic analysis.

Documentation starts the moment you detect an incident. Every action taken, every decision made, and every piece of evidence collected needs to be logged with timestamps. This documentation serves two purposes: it helps you track the incident in real time, and it creates a record that can be used in legal proceedings or regulatory inquiries later. Use a dedicated incident ticket or case management system, not email threads or Slack messages.

### Phase 3: Containment

Containment is about stopping the bleeding. The attacker is in your network, data is at risk, and you need to limit the damage. Containment decisions involve tradeoffs. The most aggressive containment: pulling everything offline: stops the attack but also disrupts your business. The most conservative containment: doing nothing while you investigate: lets the attacker continue accessing your systems.

Short-term containment is your immediate response. This typically involves isolating affected systems from the network, blocking known malicious IPs at the firewall, disabling compromised accounts, and implementing emergency access controls. The goal is to prevent further damage while you develop a longer-term containment strategy.

Long-term containment addresses the root cause of the compromise. If the attacker got in through a phishing email, you need to block the sender, scan all mailboxes for similar messages, and potentially implement additional email filtering. If they exploited a vulnerability, you need to patch it across your environment. If they compromised credentials, you need to force password resets for affected accounts.

Evidence preservation during containment is critical. Before you wipe a compromised system, you need to image it. Before you reset a password, you need to capture the current password hash. Before you block an IP, you need to pull the logs showing what traffic came from that IP. Containment without evidence preservation makes forensic investigation impossible.

The decision to contain or not to contain is one of the hardest calls in incident response. If you isolate a server that turns out to be clean, you have disrupted business operations for no reason. If you leave a server online that turns out to be compromised, the attacker continues to have access. When in doubt, contain first and investigate second. Disrupting business is always better than letting an attacker roam free.

### Phase 4: Eradication

Eradication is removing the attacker from your environment. This is different from containment: containment stops the bleeding, eradication removes the threat entirely. Eradication means removing malware, closing backdoors, revoking compromised credentials, and patching the vulnerabilities that allowed the initial compromise.

The key principle in eradication is completeness. If you miss one backdoor, one persistence mechanism, or one compromised account, the attacker can regain access. This requires thorough investigation. You need to identify every system the attacker touched, every credential they used, and every persistence mechanism they established. This is where forensic analysis pays off.

Common persistence mechanisms include scheduled tasks, services, registry run keys, WMI subscriptions, startup folders, and DLL search order hijacking. On Linux systems, look at crontabs, system services, shell profiles, and authorized_keys files. The attacker will hide persistence in places that survive reboots and are not typically monitored.

Malware removal during eradication is straightforward in theory but complex in practice. You can remove a known malware sample from a system, but you cannot always be certain you have found all instances. The safest approach during eradication is to rebuild compromised systems from known-good media rather than attempting to clean them. This takes longer but eliminates the risk of missed artifacts.

Credential rotation is a critical eradication step. Every password the attacker may have accessed needs to be changed. This includes service accounts, local administrator passwords, domain administrator credentials, API keys, and any certificates that may have been compromised. If you do not rotate credentials, the attacker can use them to regain access even after you have removed all malware.

Vulnerability remediation closes the door the attacker used to get in. This means patching software, fixing misconfigurations, implementing additional access controls, and addressing any other weaknesses that the attacker exploited. Patching during an active incident is risky: you might break something: but leaving vulnerabilities open invites a repeat attack.

### Phase 5: Recovery

Recovery is returning your systems to normal operation. This means restoring from clean backups, rebuilding compromised systems, and verifying that everything is working correctly before you bring it back online.

The restoration process starts with identifying clean backups. If your backups were made after the attacker gained access, they may contain malicious files or attacker-controlled data. You need to identify the last known clean backup: this is where your forensic timeline analysis helps. In some cases, you may need to go back weeks or months to find a clean backup.

When restoring from backups, do not just restore and hope for the best. Verify the restored systems before reconnecting them to the network. Run antivirus scans, check for unauthorized accounts, verify configurations, and review recent changes. A restored system that still has the vulnerability the attacker exploited will be compromised again.

Gradual recovery is safer than a big-bang approach. Restore systems in stages, starting with the most critical ones and monitoring each stage closely. If something goes wrong during recovery, you want to catch it before it spreads. This staged approach also helps you verify that your containment measures are working.

Monitoring during recovery should be intense. Watch for any signs of reinfection: unexpected network connections, unauthorized access attempts, unusual process activity, or any indicators that match the attacker's known tactics. Set up temporary detection rules specifically for the indicators you identified during the investigation. This is not the time to relax your monitoring: it is the time to be most vigilant.

Communication during recovery is just as important as communication during the incident itself. Your stakeholders need to know when systems are coming back online, what the expected impact is, and whether any additional precautions are needed. Set clear expectations about recovery timelines and update them frequently.

### Phase 6: Lessons Learned

Lessons learned is the most undervalued phase of incident response, and it is the phase that makes you better at responding to future incidents. Without a structured post-incident review, you will make the same mistakes again.

The lessons learned meeting should happen within one to two weeks of incident resolution. It should involve everyone who participated in the response, from the SOC analysts who detected the incident to the executives who made containment decisions. The goal is not to assign blame: it is to identify what went well, what did not go well, and what needs to change.

Structure the review around the incident timeline. Walk through the detection, analysis, containment, eradication, and recovery phases. For each phase, ask: what worked, what did not work, and what would we do differently? Be specific. "We need better logging" is not actionable. "We need to enable PowerShell module logging on all endpoints because we could not reconstruct the attacker's commands" is actionable.

The output of the lessons learned meeting should be a set of concrete action items with owners and deadlines. These are not suggestions: they are commitments. Track them to completion. If you identify a gap that needs to be fixed, assign it to someone, give them a deadline, and follow up. Action items that sit in a backlog never get done.

Metrics from the incident should be captured and compared against your baselines. How long did it take to detect the incident? How long from detection to containment? How long from containment to eradication? How long from eradication to recovery? These metrics help you identify where your process is strong and where it needs improvement.

Update your IR playbooks based on what you learned. If a playbook was incomplete, update it. If a playbook was not followed, figure out why and either update the playbook or retrain the team. If you identified new detection opportunities, implement them. If you identified new tools or capabilities you need, add them to your budget requests.

## IR Team Structure and Roles

A functional IR team needs clear roles and responsibilities. When an incident fires, everyone needs to know what they are responsible for so there is no confusion about who does what.

The Incident Commander leads the response. This person makes final decisions about containment, eradication, and recovery. They coordinate between technical teams, management, legal, and communications. The Incident Commander does not need to be the most technical person on the team: they need to be the best decision-maker and communicator. During a crisis, technical expertise is distributed across the team, but decision-making authority needs to be centralized.

The Technical Lead owns the technical investigation and response. This person directs the forensic analysis, coordinates with the SOC on detection, and oversees the technical implementation of containment and eradication measures. The Technical Lead works closely with the Incident Commander to translate technical findings into business decisions.

The Forensic Analyst is responsible for evidence collection and analysis. This person creates forensic images, analyzes logs, extracts malware samples, and builds the timeline of the incident. Forensic Analysts need to be methodical and detail-oriented: a missed piece of evidence can invalidate an entire investigation.

The Communications Lead manages all internal and external communications. This person drafts notifications to customers, coordinates with the media if necessary, and keeps executive leadership informed. The Communications Lead needs to understand legal requirements for disclosure and work closely with legal counsel.

Legal Counsel advises on legal obligations, regulatory requirements, and potential liability. They determine whether an incident triggers notification requirements, advise on evidence preservation for potential litigation, and review all external communications. Legal should be involved from the moment an incident is confirmed, not after the technical response is complete.

Not every organization needs a full-time IR team. Many organizations handle IR with a combination of internal staff and external IR retainer services. The key is having a defined team with clear roles, whether those roles are filled by full-time employees, contractors, or a combination of both.

## Communication Plans

Communication during an incident follows three tracks: internal communication, external communication, and regulatory communication.

Internal communication keeps your team and leadership informed. The Incident Commander should provide regular updates to executive leadership at agreed-upon intervals. These updates should include what happened, what is being done, what the impact is, and when the next update will come. Avoid technical jargon in executive communications: leadership needs to understand the business impact, not the technical details.

External communication is directed at customers, partners, and the public. This communication must be reviewed by legal counsel before it goes out. The goal is transparency without creating unnecessary panic or legal liability. Be factual, be specific about what happened, be clear about what you are doing about it, and be honest about what you do not yet know.

Regulatory communication covers notifications to regulators, law enforcement, and other required parties. Breach notification laws vary by jurisdiction and industry. Some require notification within 72 hours, some within 30 days, and some have different requirements depending on the type of data involved. Know your requirements before an incident occurs.

The communication plan should include a contact list with backup contacts for every role. People go on vacation, change jobs, and become unavailable. If your only contact for legal counsel is a single lawyer and that lawyer is on a cruise when your incident happens, you have a problem. Always have backups.

## Legal Considerations

Incident response intersects with the law in ways that many technical practitioners do not anticipate. Understanding these legal considerations is not optional.

Evidence preservation is a legal requirement in many situations. If you know or reasonably anticipate that litigation will result from an incident, you have a duty to preserve relevant evidence. This includes logs, forensic images, communications, and any other data that may be relevant. Destroying evidence after you know it may be needed for litigation can result in severe sanctions.

Privilege considerations affect how you communicate about the incident. Communications with legal counsel about the incident are generally privileged, meaning they cannot be compelled in litigation. Communications about the incident with anyone else may not be privileged. If you want to protect your communications, route them through legal counsel.

Law enforcement notification is sometimes required and sometimes optional. If you are the victim of a crime: and most security incidents are crimes: you may want to involve law enforcement. This has benefits (they may be able to help investigate and prosecute the attacker) and drawbacks (law enforcement investigations are slow and may result in your data being seized as evidence). Consult with legal counsel before involving law enforcement.

Insurance claims require careful handling. If you have cyber insurance, your policy may cover incident response costs, business interruption losses, and regulatory fines. However, insurance companies have their own requirements for what constitutes a covered incident and how you must respond. Review your policy before an incident and understand what is covered and what is not.

Regulatory compliance affects nearly every aspect of incident response. Industry-specific regulations like HIPAA, PCI DSS, and GLBA have specific requirements for incident response, including notification timelines, reporting requirements, and documentation standards. If you operate in multiple jurisdictions, you may need to comply with multiple overlapping regulations.

## Real Story: Responding to a Ransomware Attack

In March 2024, a mid-sized manufacturing company with 400 employees and $80 million in annual revenue discovered ransomware encrypting files across their network. The attack began with a phishing email sent to the accounting department. An employee clicked a link in what appeared to be an invoice from a known vendor. The link downloaded a payload that established persistence, escalated privileges, and began encrypting files six hours later.

The initial detection came from the EDR agent on a workstation in the accounting department, which flagged suspicious file encryption activity. The SOC analyst on duty validated the alert within 15 minutes and escalated it to the IR team. By the time the IR team assembled, the ransomware had encrypted files on 47 workstations and three file servers.

The Incident Commander made the decision to immediately isolate all affected systems and disconnect the file servers from the network. This was painful: the company's ERP system ran on one of the affected file servers, and production scheduling stopped. But leaving the file servers online risked the ransomware spreading to the backup server, which would have been catastrophic.

The forensic investigation revealed that the attacker had been in the network for six hours before deploying the ransomware. During that time, they had accessed the Active Directory, created a service account with domain administrator privileges, and staged data for exfiltration. The attacker exfiltrated approximately 15 GB of financial records and employee PII before deploying the ransomware.

Eradication took three days. The team rebuilt 47 workstations from known-good images, restored the three file servers from backups made two days before the attack, rotated all domain administrator credentials, and removed the attacker's service account. The vulnerability that allowed the initial compromise: a missing patch on the email gateway: was patched during the eradication phase.

Recovery took another two days. The team restored data from backups, verified system integrity, and gradually brought systems back online. They implemented additional monitoring on all file servers and domain controllers to detect any signs of reinfection.

Total downtime was five days. The company lost approximately $2 million in revenue due to production scheduling delays. The cost of the incident response: including external IR consultants, forensic analysis, and additional monitoring: was approximately $500,000. The company had cyber insurance that covered most of these costs, but their deductible was $250,000.

The lessons learned were significant. The company had not been training employees on phishing recognition. The email gateway was missing a critical patch. The backup server was on the same network segment as the file servers. The IR playbook did not include a ransomware-specific response procedure. All of these gaps were addressed in the post-incident review.

The most important lesson: the company's decision to immediately isolate affected systems saved them. If the ransomware had reached the backup server, they would have faced a choice between paying the ransom and losing months of data. By containing quickly, they preserved their ability to recover without paying.

## Assessment

### Lab Exercise 1: Incident Response Plan Review (45 minutes)

You are given a sample incident response plan document. Your task is to review it and identify gaps.

**Lab Tasks:**

1. Read the provided IR plan document (15 minutes)
2. Identify at least 5 gaps in the plan related to the six phases of IR (15 minutes)
3. Write a brief remediation plan for each gap identified (15 minutes)

**Grading Criteria:**

- Correctly identified gaps: 40 points (8 points per gap)
- Quality of remediation recommendations: 40 points
- Proper documentation and clarity: 20 points

### Lab Exercise 2: Tabletop Exercise: Ransomware Scenario (60 minutes)

Work in a team of 3-4 people. The facilitator will present a ransomware scenario. Your team must walk through the six phases of incident response and make decisions at each phase.

**Scenario:** A ransomware variant has been detected on a workstation in the finance department. The ransomware has not yet spread beyond the initial workstation, but the attacker has been in the network for an unknown period. The finance department handles sensitive customer financial data.

**Lab Tasks:**

1. Define your IR team roles for this scenario (10 minutes)
2. Walk through detection and analysis: what do you investigate first? (15 minutes)
3. Make containment decisions: what do you isolate and when? (15 minutes)
4. Define your eradication and recovery approach (15 minutes)
5. Document your communication plan (5 minutes)
6. Write a lessons learned summary (5 minutes)

**Grading Criteria:**

- Appropriate team role assignments: 15 points
- Detection and analysis thoroughness: 20 points
- Containment decisions: 25 points
- Eradication and recovery approach: 20 points
- Communication plan quality: 10 points
- Lessons learned quality: 10 points

### Lab Exercise 3: Incident Documentation Exercise (30 minutes)

You are given a raw timeline of events from a security incident. Your task is to create a structured incident report.

**Lab Tasks:**

1. Review the raw event timeline (10 minutes)
2. Create a structured incident report with sections for timeline, impact, actions taken, and recommendations (15 minutes)
3. Ensure all timestamps are in a consistent format and all actions are attributed (5 minutes)

**Grading Criteria:**

- Complete and accurate timeline: 30 points
- Proper incident report structure: 30 points
- Accurate impact assessment: 20 points
- Actionable recommendations: 20 points

## Evidence

### Key Concepts

- **Six Phases:** Preparation, Detection and Analysis, Containment, Eradication, Recovery, Lessons Learned
- **Preparation:** Asset inventory, detection infrastructure, documented procedures, legal preparation, training
- **Detection:** Alert validation, scoping, initial analysis, documentation
- **Containment:** Short-term (isolate, block), long-term (root cause), evidence preservation tradeoffs
- **Eradication:** Persistence removal, malware removal, credential rotation, vulnerability remediation
- **Recovery:** Clean backup identification, system verification, gradual restoration, monitoring
- **Lessons Learned:** Structured review, timeline walkthrough, action items with owners, playbook updates

### Tools Referenced

- SIEM for alert aggregation and log correlation
- IDS/IPS for network-based detection
- EDR for endpoint detection and response
- Forensic imaging tools (introduced in Module 6)
- Case management systems for incident tracking

### Standards and Frameworks

- NIST SP 800-61 (Computer Security Incident Handling Guide)
- ISO 27035 (Information Security Incident Management)
- SIRTF (Security Incident Response Team Framework)
- Industry-specific requirements (HIPAA, PCI DSS, GLBA)

### Decision Framework

The decision to contain or continue monitoring is the most critical call in incident response. Use the following framework:

1. **Is the attacker currently active?** If yes, contain immediately.
2. **Is data at risk of exfiltration?** If yes, contain immediately.
3. **Is the attacker's persistence stable?** If you can monitor without detection, monitor briefly to scope the incident.
4. **Can you scope the incident without containment?** If not, contain and scope.
5. **When in doubt, contain.** Disrupting business is always better than letting an attacker roam free.
