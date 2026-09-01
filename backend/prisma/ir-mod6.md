# Module 6 — Digital Forensics Fundamentals

Digital forensics is the intersection of technology and law. Every forensic action you take must produce evidence that is legally admissible, scientifically sound, and forensically sound. A single misstep in evidence handling can invalidate an entire investigation and allow an attacker to walk free. This module covers evidence handling and chain of custody, forensic imaging, write blockers, legal admissibility requirements, and how to conduct a forensic investigation that holds up under scrutiny.

## Evidence Handling and Chain of Custody

Evidence handling is the foundation of digital forensics. If you cannot prove that the evidence you collected is the same evidence that is presented in court, your investigation is worthless. Chain of custody documentation tracks every person who has handled the evidence, every action taken on the evidence, and every transfer of the evidence from one party to another.

### Types of Digital Evidence

Digital evidence falls into several categories, each with different handling requirements.

**Volatile evidence** exists only while the system is running. RAM contents, running processes, network connections, logged-on users, and system time are all volatile. This evidence is lost when the system is powered off or disconnected. Collect volatile evidence first, before taking any containment actions that might disrupt the system.

**Persistent evidence** is stored on disk and survives reboots. Files, registry entries, log files, and configuration data are all persistent. This evidence can be collected at any time during the investigation, but it should be collected as soon as practical to prevent the attacker from modifying it.

**Network evidence** exists in network traffic and logs. Packet captures, NetFlow data, firewall logs, and proxy logs are all network evidence. Network evidence is distributed across multiple systems and may need to be collected from many sources simultaneously.

**Cloud evidence** is stored in cloud services and may not be accessible from the local network. Cloud evidence requires coordination with the cloud provider and may be subject to different legal requirements depending on the provider's jurisdiction.

### Evidence Collection Procedures

Every evidence collection action should follow a documented procedure. The procedure ensures consistency, completeness, and legal defensibility.

**Step 1: Identify the evidence.** Determine what evidence is relevant to the investigation. This requires understanding what the attacker did, what systems they accessed, and what data is at risk.

**Step 2: Prioritize the evidence.** Collect volatile evidence first, then persistent evidence. If evidence is at risk of being destroyed — by the attacker, by normal system operations, or by other investigators — prioritize it.

**Step 3: Use proper tools and techniques.** Use forensically sound tools and techniques that do not modify the evidence. Write blockers prevent write operations to evidence media. Forensic imaging tools create bit-for-bit copies. Hash functions verify evidence integrity.

**Step 4: Document everything.** Record who collected the evidence, when it was collected, where it was found, what tools were used, and what the evidence looks like. This documentation is part of the chain of custody.

**Step 5: Secure the evidence.** Store evidence in a secure location with controlled access. Evidence rooms should be locked, access-logged, and monitored. Digital evidence should be stored on encrypted media to prevent unauthorized access.

### Chain of Custody Documentation

Chain of custody documentation is the paper trail that proves the evidence has not been tampered with. Every transfer of evidence from one person to another must be documented. Every action taken on the evidence must be documented. Every change in evidence storage location must be documented.

A chain of custody form captures:

**Evidence identification:** A unique identifier for the evidence, a description of the evidence, and the location where it was found.

**Collection details:** The name of the person who collected the evidence, the date and time of collection, the tools and techniques used, and the hash values of the evidence at the time of collection.

**Transfer details:** The name of the person transferring the evidence, the name of the person receiving the evidence, the date and time of transfer, and the reason for the transfer.

**Storage details:** The location where the evidence is stored, the security measures in place, and the conditions of storage.

**Access log:** A record of everyone who has accessed the evidence, the date and time of access, and the purpose of the access.

### Evidence Integrity

Evidence integrity means that the evidence has not been modified since it was collected. Maintaining evidence integrity requires:

**Hash verification:** Compute a cryptographic hash of the evidence at the time of collection and verify the hash whenever the evidence is accessed. If the hash does not match, the evidence has been modified and is no longer reliable.

**Write protection:** Use write blockers or other mechanisms to prevent any modification to the evidence media. A single write operation — even an accidental one — can invalidate the evidence.

**Access control:** Restrict access to the evidence to authorized personnel only. Every access should be logged and justified.

**Storage conditions:** Store evidence in conditions that prevent degradation. Temperature, humidity, and electromagnetic exposure can all affect digital media.

## Forensic Imaging

Forensic imaging is the process of creating a bit-for-bit copy of digital media. Unlike a regular copy, a forensic image captures everything — including deleted files, unallocated space, and file system metadata. This completeness is critical for forensic investigation.

### Why Forensic Imaging Matters

A regular file copy captures only the files that the operating system presents. It does not capture deleted files that have not been overwritten, unallocated space that may contain remnants of previous files, file system metadata like timestamps and permissions, or slack space within files.

A forensic image captures the entire storage media — every sector, every byte. This means the forensic examiner can recover deleted files, analyze unallocated space, examine file system metadata, and perform timeline analysis across the entire history of the media.

### Imaging Tools

Several tools are commonly used for forensic imaging.

**FTK Imager** is a free tool from AccessData that creates forensic images of disks, memory, and other media. It supports multiple image formats — E01, DD, and SMART — and computes hash values automatically during imaging.

**dd** is a Unix utility that creates bit-for-bit copies of storage devices. It is the traditional tool for forensic imaging on Linux systems. The `dd` command is powerful but unforgiving — a typo in the source or destination device can destroy evidence. Use `dc3dd` or `Guymager` as more user-friendly alternatives.

**Guymager** is a free, open-source forensic imaging tool with a graphical interface. It supports multiple image formats, computes hashes, and provides detailed logging. It is a good alternative to `dd` for Linux-based forensic workstations.

**EnCase Imager** is a free tool from OpenText that creates forensic images in the E01 format. It is widely used in professional forensic environments.

### Image Formats

Forensic images can be stored in several formats.

**Raw (DD)** is a bit-for-bit copy of the source media stored as a single file. It is the simplest format and is compatible with virtually all forensic tools. The downside is that raw images do not include built-in hash verification or compression.

**E01 (Expert Witness Format)** is a compressed format that includes built-in hash verification, case metadata, and password protection. E01 is the most common format in professional forensic environments. The compression reduces storage requirements, and the built-in hash verification ensures evidence integrity.

**SMART** is a format used by some forensic tools that includes compression and metadata. It is less common than E01 but serves similar purposes.

### Imaging Process

The forensic imaging process follows these steps:

**Step 1: Prepare the forensic workstation.** Ensure the workstation has sufficient storage for the image, is free of malware, and has the imaging software installed and verified.

**Step 2: Connect the source media.** Connect the source media to the forensic workstation using a write blocker. The write blocker prevents any write operations to the source media, ensuring that the evidence is not modified during imaging.

**Step 3: Select the destination.** Choose a destination for the forensic image. The destination must have sufficient storage space and should be on a separate, clean device.

**Step 4: Configure imaging options.** Select the image format (E01 or DD), enable hash verification, and configure any compression options.

**Step 5: Create the image.** Start the imaging process and monitor it for errors. Imaging can take hours for large media, so plan accordingly.

**Step 6: Verify the image.** After imaging completes, verify the hash values. The hash of the image should match the hash of the source media. If they do not match, the imaging process failed and must be repeated.

**Step 7: Document the process.** Record the date, time, operator, tools used, source media details, destination media details, hash values, and any errors encountered.

### Memory Forensics Imaging

Memory imaging is different from disk imaging because memory is volatile and must be captured while the system is running.

**WinPmem** is a Windows memory acquisition tool that captures the contents of physical memory. It creates a raw memory image that can be analyzed with Volatility or other memory forensics tools.

**LiME** (Linux Memory Extractor) is a Linux kernel module that captures the contents of physical memory. It is designed for forensic use and supports both live and post-mortem acquisition.

**DumpIt** is a Windows memory acquisition tool that creates a raw memory image with minimal system impact. It is designed for use during incident response when you need to capture memory quickly.

**Magnet RAM Capture** is a Windows memory acquisition tool that captures physical memory to a raw image file.

The memory imaging process:

1. Prepare a USB drive with the memory acquisition tool
2. Insert the USB drive into the target system
3. Run the acquisition tool from the USB drive
4. Save the memory image to the USB drive
5. Remove the USB drive
6. Document the acquisition

## Write Blockers

Write blockers are hardware or software devices that prevent write operations to evidence media. They are essential for maintaining evidence integrity during forensic examination.

### Hardware Write Blockers

Hardware write blockers are physical devices that sit between the evidence media and the forensic workstation. They intercept all write commands and prevent them from reaching the evidence media while allowing read commands to pass through.

Hardware write blockers are the gold standard for write protection because they are independent of the operating system. Even if the operating system attempts to write to the evidence media, the hardware write blocker prevents the write.

Popular hardware write blockers include Tableau T35u (USB 3.0), Tableau T8-R2 (SATA), and WiebeTech UltraDock. These devices support multiple interface types and provide reliable write protection.

### Software Write Blockers

Software write blockers are operating system features or third-party software that prevent write operations to evidence media. They are less reliable than hardware write blockers because they depend on the operating system functioning correctly.

Windows provides a built-in write protection feature through the registry key `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\StorageDevicePolicies\WriteProtect`. Setting this value to 1 enables write protection for all USB devices.

Linux provides write protection through mount options. Mounting a device with the `ro` (read-only) option prevents write operations. However, this relies on the operating system honoring the mount option, which is not always guaranteed.

### When to Use Write Blockers

Use a write blocker whenever you are examining evidence media that may be needed for legal proceedings. This includes:

- Forensic imaging of suspect media
- Examination of evidence on a forensic workstation
- Any operation that reads from evidence media in a legal context

Do not use a write blocker when you are creating a forensic image of your own systems for internal investigation. In these cases, you are imaging your own systems and the evidence is not at risk of tampering allegations.

## Legal Admissibility

Forensic evidence must meet specific legal standards to be admissible in court. Understanding these standards is critical for ensuring that your investigation produces usable evidence.

### Relevance

The evidence must be relevant to the case. This means it must tend to prove or disprove a fact that is at issue in the proceedings. Evidence of a malware infection on a system that was not involved in the incident is not relevant, even if it is interesting from a technical perspective.

### Authenticity

The evidence must be authentic — it must be what you claim it is. This is where chain of custody becomes critical. You must be able to prove that the evidence you collected at the scene is the same evidence that is being presented in court. Hash verification, chain of custody documentation, and proper evidence handling all support authenticity.

### Reliability

The evidence must be reliable — it must have been collected and analyzed using sound scientific methods. This means using validated tools, following documented procedures, and maintaining evidence integrity. If your tools or methods are unreliable, your evidence will be challenged.

### Completeness

The evidence must be complete — you must not have selectively collected evidence to support a particular narrative. If you collected evidence from one system but ignored evidence from another system that contradicts your theory, your evidence will be challenged.

### Legal Standards

Different legal systems have different standards for evidence admissibility.

**Federal Rules of Evidence (US):** Rule 901 requires authentication and identification of evidence. Rule 702 requires that expert testimony be based on sufficient facts, reliable principles, and reliable application of those principles to the facts.

**Daubert Standard (US):** Courts use the Daubert standard to evaluate the reliability of scientific evidence. The standard considers whether the technique can be tested, has been subjected to peer review, has a known error rate, and is generally accepted in the relevant scientific community.

**ISO 17025:** This international standard specifies general requirements for the competence of testing and calibration laboratories. Forensic laboratories that are ISO 17025 accredited have demonstrated their technical competence to perform forensic examinations.

### Common Challenges to Forensic Evidence

Forensic evidence is frequently challenged in court. Common challenges include:

**Chain of custody gaps:** If there is a gap in the chain of custody, the opposing party will argue that the evidence may have been tampered with.

**Tool reliability:** If the forensic tool used to analyze the evidence is not well-established or has known bugs, the results will be challenged.

**Analyst competence:** If the forensic analyst is not properly trained or certified, their analysis will be challenged.

**Evidence contamination:** If the evidence may have been contaminated — by the analyst, by other evidence, or by the environment — its integrity will be challenged.

**Selective collection:** If the prosecution only collected evidence that supports their case and ignored evidence that might exonerate the defendant, the collection will be challenged.

## Real Scenario: Forensic Investigation of a Data Breach

In September 2024, a healthcare organization discovered that an unauthorized party had accessed their electronic health records system. The breach affected 12,000 patients and included names, dates of birth, medical record numbers, and diagnosis codes. The organization needed to conduct a forensic investigation to determine how the breach occurred, what data was accessed, and who was responsible.

The forensic investigation began with evidence preservation. The team collected network logs from the firewall, proxy, and IDS for the past 90 days. They collected application logs from the EHR system, authentication logs from Active Directory, and EDR telemetry from all servers in the EHR environment. They also created forensic images of three servers that the attacker had accessed.

Memory imaging was performed on one server that was still running and showing signs of active compromise. The memory dump revealed a web shell running in the Apache Tomcat process, which was the attacker's persistence mechanism.

The forensic analysis of the disk images revealed that the attacker had exploited a vulnerability in the EHR application to gain access. The attacker had used SQL injection to extract patient data and had exfiltrated the data through an encrypted channel to an external server.

The chain of custody was documented meticulously. Every piece of evidence was collected by a named analyst, at a specific time, using specific tools. Hash values were computed at the time of collection and verified at each subsequent access. The evidence was stored in a locked evidence room with access logging.

The forensic analysis was performed by a certified forensic examiner using industry-standard tools. The analysis methodology was documented, including the tools used, the procedures followed, and the reasoning behind each analytical decision.

The investigation results were presented to law enforcement and were used to support criminal charges against the attacker. The forensic evidence was challenged by the defense, who argued that the chain of custody had gaps and that the tools used were unreliable. The forensic team was able to rebut these challenges by presenting detailed chain of custody documentation and demonstrating the reliability of their tools and methods.

Key lessons from this investigation:

**Evidence preservation must happen immediately.** The forensic team collected evidence within hours of discovering the breach. Delayed evidence collection risks evidence loss or modification.

**Chain of custody is not optional.** The defense specifically challenged the chain of custody. The team's meticulous documentation defeated this challenge.

**Tool validation matters.** The defense challenged the reliability of the forensic tools. The team was able to demonstrate that their tools were industry-standard, widely accepted, and had been validated.

**Certification matters.** The forensic examiner's certifications (EnCE, CFCE) were presented as evidence of their competence and were not challenged by the defense.

**Documentation is everything.** The entire investigation was documented in detail, from evidence collection through analysis to reporting. This documentation was critical for both the legal proceedings and the organization's internal remediation efforts.

## Forensic Examination Methodology

A forensic examination follows a structured methodology to ensure completeness and consistency.

### Preparation

Before examining evidence, prepare your forensic workstation. Ensure you have sufficient storage, your tools are up to date, and your workstation is clean. Document the state of your workstation before beginning examination.

### Examination

The examination phase involves inspecting the evidence using forensic tools. This includes mounting the forensic image, running automated analysis tools, and manually inspecting items of interest. The examination should be systematic — work through the evidence methodically rather than jumping around based on hunches.

### Analysis

The analysis phase interprets the findings from the examination. This is where you connect the dots — correlating timestamps across systems, reconstructing attacker actions, and building a timeline. Analysis requires both technical skill and critical thinking.

### Reporting

The reporting phase documents your findings in a clear, concise report. The report should include a summary of findings, a detailed methodology, supporting evidence, and your conclusions. The report should be written for a non-technical audience — lawyers, judges, and jurors need to understand your findings.

## Assessment

### Lab Exercise 1: Evidence Collection and Chain of Custody (60 minutes)

You are given a scenario involving a compromised workstation. Your task is to collect evidence and document the chain of custody.

**Scenario:** A user reports that their workstation has been behaving strangely — unusual processes, slow performance, and unexpected network connections. The user suspects malware. The workstation is a Windows 11 system with BitLocker encryption.

**Lab Tasks:**

1. Document the evidence collection plan — what evidence to collect and in what order (10 minutes)
2. Create chain of custody forms for each piece of evidence (15 minutes)
3. Perform volatile data collection (RAM, processes, network connections) (15 minutes)
4. Create a forensic image of the workstation's disk (15 minutes)
5. Verify the forensic image integrity (5 minutes)

**Grading Criteria:**

- Comprehensive evidence collection plan: 20 points
- Proper chain of custody documentation: 25 points
- Correct volatile data collection: 25 points
- Proper forensic imaging: 20 points
- Image integrity verification: 10 points

### Lab Exercise 2: Forensic Imaging Practice (45 minutes)

In a lab environment, practice creating forensic images using different tools and formats.

**Lab Tasks:**

1. Create a forensic image of a USB drive using FTK Imager in E01 format (15 minutes)
2. Create a forensic image of a USB drive using dd in raw format (15 minutes)
3. Verify the integrity of both images using hash comparison (10 minutes)
4. Compare the two image formats and document the differences (5 minutes)

**Grading Criteria:**

- Correct E01 image creation: 25 points
- Correct raw image creation: 25 points
- Successful integrity verification: 25 points
- Accurate format comparison: 25 points

### Lab Exercise 3: Write Blocker Verification (30 minutes)

Practice using hardware and software write blockers and verify their effectiveness.

**Lab Tasks:**

1. Connect a USB drive through a hardware write blocker (5 minutes)
2. Verify write protection by attempting to write to the drive (5 minutes)
3. Enable software write protection on a USB drive (5 minutes)
4. Verify software write protection by attempting to write to the drive (5 minutes)
5. Document the results and compare hardware vs software write blockers (10 minutes)

**Grading Criteria:**

- Correct hardware write blocker usage: 25 points
- Successful write protection verification: 25 points
- Correct software write blocker usage: 25 points
- Accurate comparison and documentation: 25 points

## Evidence

### Key Concepts

- **Chain of Custody:** Documentation tracking every person who handles evidence, every action taken, and every transfer
- **Evidence Integrity:** Ensuring evidence has not been modified since collection through hashing, write protection, and access control
- **Forensic Imaging:** Bit-for-bit copy of storage media capturing all data including deleted files and unallocated space
- **Write Blockers:** Hardware or software devices that prevent write operations to evidence media
- **Legal Admissibility:** Evidence must be relevant, authentic, reliable, and complete to be admissible in court
- **Examination Methodology:** Structured process — preparation, examination, analysis, reporting

### Forensic Tools Reference

| Tool | Purpose | Platform |
|------|---------|----------|
| FTK Imager | Forensic imaging | Windows |
| dd / dc3dd | Forensic imaging | Linux |
| Guymager | Forensic imaging | Linux |
| EnCase Imager | Forensic imaging | Windows |
| Tableau Write Blockers | Hardware write protection | Cross-platform |
| WinPmem | Memory acquisition | Windows |
| LiME | Memory acquisition | Linux |
| Volatility | Memory analysis | Cross-platform |

### Evidence Collection Priority

1. **Volatile evidence** (RAM, processes, network connections) — collect first, before containment
2. **Log evidence** (SIEM, firewall, proxy, application logs) — collect before logs rotate
3. **Disk evidence** (forensic images) — collect after volatile evidence, before system changes
4. **Network evidence** (packet captures, NetFlow) — collect as soon as possible, before data ages out
5. **Cloud evidence** (cloud service logs, data exports) — coordinate with provider, may require legal process

### Legal Standards Summary

- **Relevance:** Evidence must relate to a fact at issue
- **Authenticity:** Evidence must be proven to be what you claim it is
- **Reliability:** Evidence must be collected and analyzed using sound scientific methods
- **Completeness:** Evidence must not be selectively collected to support a narrative
- **Chain of Custody:** Documentation must be unbroken from collection to presentation
