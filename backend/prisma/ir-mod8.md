# Module 8: Disk Forensics

Disk forensics is the analysis of storage media to recover evidence of attacker activity. While memory forensics captures the live state of a system, disk forensics captures the persistent state: files, registry entries, logs, and metadata that survive reboots. Disk forensics is where you find deleted files, recover evidence of lateral movement, analyze persistence mechanisms, and build timelines of attacker activity. This module covers disk imaging tools, file recovery techniques, Windows registry analysis, and timeline construction.

## Disk Imaging Tools

Forensic disk imaging creates a bit-for-bit copy of storage media. The image preserves everything: including deleted files, file system metadata, and unallocated space. Several tools are available for creating forensic images.

### FTK Imager

FTK Imager is a free tool from AccessData that creates forensic images of disks, memory, and other media. It supports E01, DD, and SMART image formats and computes hash values automatically during imaging.

FTK Imager can image physical disks, logical drives, and specific partitions. It supports local and network-attached storage. The graphical interface makes it easy to select source and destination, configure options, and monitor imaging progress.

Key features:

- Supports E01, DD, and SMART formats
- Automatic hash computation during imaging
- Ability to mount and browse forensic images
- Support for physical and logical drives
- Free for non-commercial use

### dd and dc3dd

`dd` is a Unix utility that creates bit-for-bit copies of storage devices. It is the traditional tool for forensic imaging on Linux systems. The `dd` command reads from the source device and writes to the destination device, sector by sector.

The basic `dd` syntax:

```
dd if=/dev/sda of=/path/to/image.raw bs=4M
```

`dc3dd` is a modified version of `dd` developed by the Defense Cyber Crime Center. It adds features useful for forensic imaging:

- Hash computation during imaging
- Progress reporting
- Error handling and recovery
- Pattern matching and grep

```
dc3dd if=/dev/sda of=/path/to/image.raw hash=md5 hash=sha256 log=/path/to/log.txt
```

### Guymager

Guymager is a free, open-source forensic imaging tool with a graphical interface. It supports E01, DD, and AFF image formats and provides detailed logging.

Guymager is designed for ease of use. The graphical interface allows you to select the source device, choose the destination, configure imaging options, and monitor progress. It computes hashes automatically and provides a detailed log of the imaging process.

### EnCase Imager

EnCase Imager is a free tool from OpenText that creates forensic images in the E01 format. It is widely used in professional forensic environments and integrates with the EnCase forensic examination platform.

### Image Verification

After creating a forensic image, verify its integrity by computing and comparing hash values. The hash of the image should match the hash of the source media.

If the hashes do not match, the imaging process failed. This can happen due to bad sectors on the source media, write errors during imaging, or hardware problems. Reimage the media if the hashes do not match.

Document the hash values, the hashing algorithm used, and the date and time of hashing. This documentation is part of the chain of custody.

## File Recovery

File recovery is one of the most valuable capabilities of disk forensics. Deleted files, file system metadata, and unallocated space all contain evidence that is not visible through normal file system access.

### Understanding File Systems

File systems organize data on disk into files and directories. Understanding how file systems work is essential for file recovery.

**NTFS** is the standard file system for Windows. NTFS stores file data in clusters and maintains metadata in the Master File Table (MFT). Each file has an MFT entry that contains the file's name, timestamps, permissions, and cluster locations.

**FAT32** is an older file system still used on USB drives and removable media. FAT32 stores files in a linked list of clusters and maintains a directory table. FAT32 does not support file permissions or journaling.

**ext4** is the standard file system for Linux. ext4 stores file data in block groups and maintains inodes that contain file metadata. ext4 supports journaling, which records file system changes to aid recovery.

**APFS** is the standard file system for macOS. APFS uses a copy-on-write design and maintains multiple snapshots of the file system.

### Deleted File Recovery

When a file is deleted, the file system does not immediately erase the data. Instead, it marks the file's space as available for reuse and removes the file's directory entry. The actual data remains on disk until it is overwritten by new data.

Recovering deleted files requires understanding how the file system marks files as deleted.

**NTFS recovery:** In NTFS, deleting a file removes the MFT entry's directory information but does not immediately overwrite the MFT entry or the file's data clusters. Forensic tools can scan the MFT for deleted entries and recover the file data from the referenced clusters.

**FAT32 recovery:** In FAT32, deleting a file marks the first character of the filename as a special value and marks the file's clusters as available. Forensic tools can scan the directory table for deleted entries and recover the file data from the referenced clusters.

**ext4 recovery:** In ext4, deleting a file removes the inode's directory link count but does not immediately erase the inode or the file's data blocks. Forensic tools can scan for inodes with zero link count and recover the file data from the referenced blocks.

### File Carving

File carving recovers files based on their content rather than file system metadata. This is useful when file system metadata has been damaged or overwritten.

File carving works by scanning the disk for file headers and footers. For example, JPEG files start with the bytes `FF D8 FF` and end with `FF D9`. A file carver scans the disk for these patterns and extracts the data between them.

File carving tools:

**Foremost** is a file carving tool that extracts files based on headers, footers, and data structures. It supports many file types and can recover files from damaged file systems.

```
foremost -i /path/to/image.raw -o /path/to/output/
```

**Scalpel** is a file carving tool similar to foremost but with additional features like multi-pass carving and configurable carving rules.

**PhotoRec** is a file carving tool designed for recovering lost files from digital cameras, hard disks, and other storage media. It works at the block level and can recover files even when the file system is severely damaged.

File carving has limitations. It cannot recover file metadata: names, paths, and timestamps are lost. Fragmented files may not be recovered completely because the carver cannot guarantee that the fragments are contiguous on disk. Despite these limitations, file carving is an essential technique for recovering evidence that file system analysis alone cannot find.

### Slack Space Analysis

Slack space is the unused space between the end of a file and the end of the cluster allocated to that file. If a file is 5,000 bytes and the cluster size is 4,096 bytes, the file occupies two clusters (8,192 bytes) with 3,192 bytes of slack space.

Slack space can contain remnants of previously deleted files. If a previous file occupied the same clusters, its data may still exist in the slack space. Forensic tools can extract and analyze slack space to recover evidence.

### Unallocated Space Analysis

Unallocated space is disk space that is not currently allocated to any file. This space may contain remnants of deleted files, deleted file system metadata, or other evidence.

Forensic tools can scan unallocated space for file signatures, text strings, and other patterns. This scanning can recover deleted files that are no longer referenced by the file system metadata.

Unallocated space analysis is particularly valuable because it captures evidence across the entire history of the disk. A file that was created, modified, and deleted months ago may still have remnants in unallocated space if the clusters have not been reused. This makes unallocated space analysis essential for recovering evidence of historical attacker activity.

The challenge with unallocated space analysis is volume. Unallocated space on a modern hard drive can be hundreds of gigabytes. Scanning this volume requires significant processing time and produces large amounts of output. Effective analysis requires filtering and prioritization: focusing on known file types, specific time periods, or particular patterns of interest.

## Registry Analysis (Windows)

The Windows registry is a hierarchical database that stores configuration settings for the operating system, applications, and users. Registry analysis reveals installed software, user activity, network configuration, persistence mechanisms, and other evidence of attacker activity.

### Registry Hive Structure

The registry is organized into hives, each stored as a separate file:

- **SAM (Security Account Manager):** Contains user account information, including password hashes
- **SECURITY:** Contains security policies, including user rights and audit settings
- **SOFTWARE:** Contains installed software configuration
- **SYSTEM:** Contains hardware and system configuration, including boot settings
- **NTUSER.DAT:** Per-user configuration stored in each user's profile
- **UsrClass.dat:** Per-user configuration for shell and Explorer settings

### Key Registry Locations for Forensics

**Persistence locations:**

- `HKLM\Software\Microsoft\Windows\CurrentVersion\Run`: Programs that run at logon
- `HKLM\Software\Microsoft\Windows\CurrentVersion\RunOnce`: Programs that run once at logon
- `HKLM\Software\Microsoft\Windows\CurrentVersion\RunServices`: Services that run at startup
- `HKLM\SYSTEM\CurrentControlSet\Services`: Installed services
- `HKLM\Software\Microsoft\Windows NT\CurrentVersion\Winlogon`: Logon settings, including `Shell` and `Userinit`

**User activity locations:**

- `NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs`: Recently opened documents
- `NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\TypedPaths`: URLs typed in Explorer
- `NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU`: Run dialog history
- `NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\TypedCommands`: Command history

**Network configuration locations:**

- `HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces`: Network interface configuration
- `HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters`: DNS configuration
- `HKLM\Software\Microsoft\Windows NT\CurrentVersion\NetworkList\Signatures`: Known networks

**USB device history:**

- `HKLM\SYSTEM\CurrentControlSet\Enum\USB`: USB device enumeration
- `HKLM\SYSTEM\CurrentControlSet\Enum\USBSTOR`: USB storage device enumeration
- `NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\MountPoints2`: Mounted USB devices

### Registry Analysis Tools

**Registry Explorer** is a forensic tool that provides a graphical interface for examining registry hives. It can parse all registry hives, display values in human-readable format, and export data for analysis.

**RegRipper** is a command-line tool that extracts forensic artifacts from registry hives. It uses plugins to parse specific registry locations and produce reports.

**Registry Explorer** and **RegRipper** can process registry hives from live systems or from forensic images. They do not require the registry to be loaded in the running system.

### Registry Timeline Analysis

Registry keys have timestamps that can be used to build a timeline of attacker activity. The `CreateTime`, `LastWriteTime`, and `AccessTime` of registry keys tell you when the key was created, when it was last modified, and when it was last accessed.

By collecting registry timestamps across the system, you can build a timeline of:

- When persistence mechanisms were created
- When the attacker accessed specific configuration settings
- When the attacker installed tools or modified system settings
- When the attacker connected USB devices

## Timeline Analysis

Timeline analysis is the process of correlating timestamps from multiple sources to reconstruct the sequence of events during an incident. Timelines are one of the most powerful tools in digital forensics because they reveal patterns and relationships that are not visible when examining individual artifacts in isolation.

### Timestamp Sources

Every file system, registry, and log file contains timestamps. Collecting and correlating these timestamps creates a comprehensive timeline of activity.

**File system timestamps:**

- **MACB times:** Modified, Accessed, Changed, Born (created) times. These times tell you when a file was created, last accessed, last modified, and last metadata change.

**Registry timestamps:**

- **Create time:** When the registry key was created
- **Last write time:** When the registry key was last modified
- **Access time:** When the registry key was last accessed

**Log timestamps:**

- **Event log timestamps:** Windows Event Logs, syslog, application logs
- **Web server timestamps:** Access logs with request timestamps
- **Authentication timestamps:** Login and logout events

**Log2Timeline/Plaso** is a tool that collects timestamps from multiple sources and creates a unified timeline. Plaso processes forensic images, extracts timestamps from files, registry, logs, and other artifacts, and produces a timeline that can be analyzed with tools like Timesketch.

### Building a Timeline

The timeline building process:

1. **Collect timestamps.** Extract timestamps from all relevant sources: file system, registry, logs, and other artifacts.

2. **Normalize timestamps.** Convert all timestamps to a common format and timezone. UTC is the standard for forensic timelines.

3. **Correlate timestamps.** Align timestamps from different sources to reveal relationships. A file creation timestamp that aligns with a log entry timestamp suggests that the log entry is related to the file creation.

4. **Analyze the timeline.** Look for patterns, anomalies, and sequences of events. Identify the attacker's entry point, lateral movement, data access, and persistence establishment.

5. **Document findings.** Record the timeline with annotations explaining what each entry means in the context of the investigation.

### Timeline Analysis Techniques

**Forward analysis** starts at a known point in time and follows the sequence of events forward. Start at the time of initial compromise and follow the attacker's actions forward through the timeline.

**Backward analysis** starts at a known point and works backward. Start at the time of detection and work backward to identify how the attacker gained access.

**Pattern analysis** looks for recurring patterns in the timeline. Multiple file creations at regular intervals may indicate a scheduled task. Multiple authentication failures followed by a success may indicate brute force.

**Gap analysis** looks for gaps in the timeline. A gap in file system activity during a period when the attacker was supposedly active may indicate that the attacker covered their tracks or that evidence was destroyed.

## Real Scenario: Investigating a Compromised Workstation

On a Monday morning, the security operations center received an alert from the EDR agent on a workstation in the marketing department. The alert indicated that a suspicious PowerShell script had been executed. The analyst triaged the alert and classified it as High severity because the script had downloaded additional files from an external URL.

The IR team decided to conduct a forensic investigation of the workstation. The forensic analyst collected volatile data first: RAM dump, running processes, and network connections. Then the analyst created a forensic image of the workstation's hard drive.

The disk forensic analysis revealed:

**Deleted files:** The analyst used foremost to carve deleted files from unallocated space. Several deleted files were recovered, including a PowerShell script that contained Base64-encoded commands, a batch file that established persistence through a scheduled task, and a text file containing what appeared to be a list of network hosts.

**Registry analysis:** The analyst used Registry Explorer to examine the workstation's registry hives. The `Run` key contained an entry pointing to a batch file in the `AppData\Temp` directory: a persistence mechanism. The `RecentDocs` key showed that the attacker had accessed files related to the company's financial data. The USB device history showed that a USB drive had been connected to the workstation two days before the alert: this was likely the initial infection vector.

**Timeline analysis:** The analyst used Log2Timeline/Plaso to build a timeline of the attacker's activity. The timeline showed:

- **Thursday 3:15 PM:** USB device connected
- **Thursday 3:17 PM:** PowerShell script executed from USB
- **Thursday 3:18 PM:** Batch file created in AppData\Temp
- **Thursday 3:18 PM:** Scheduled task created
- **Thursday 3:20 PM:** External network connections established
- **Friday 9:00 AM - 5:00 PM:** Multiple files accessed in the financial data share
- **Monday 8:30 AM:** EDR alert fired on the PowerShell script

The timeline revealed that the attacker had been in the workstation for four days before detection. The USB device was the initial infection vector, and the attacker had established persistence through a scheduled task. The attacker had been exfiltrating financial data during business hours to blend in with normal network traffic.

**File analysis:** The recovered PowerShell script decoded to a command that downloaded a payload from an external URL. The payload was a Python-based tool that established a reverse shell to the attacker's C2 server. The C2 server IP address was identified in the network connections and in the PowerShell script.

The investigation identified:

- **Initial infection vector:** USB drive containing malicious PowerShell script
- **Persistence mechanism:** Scheduled task pointing to batch file in AppData\Temp
- **Lateral movement:** None: attacker stayed on the single workstation
- **Data access:** Financial data files accessed over four days
- **Data exfiltration:** Approximately 50 MB of data transferred to external server
- **Attacker tools:** Python-based reverse shell, custom PowerShell scripts

The forensic evidence was used to:

- Identify the attacker's infrastructure and block it at the firewall
- Search the network for other systems with the same persistence mechanism
- Notify affected parties about the data access
- Support law enforcement investigation

Key lessons from this investigation:

**Deleted file recovery was critical.** The PowerShell script and batch file were deleted by the attacker to cover their tracks. File carving recovered these critical evidence artifacts.

**Registry analysis revealed persistence and user activity.** The registry showed both the persistence mechanism and the files the attacker accessed.

**Timeline analysis reconstructed the attack.** The timeline revealed the four-day dwell time, the attack sequence, and the data exfiltration pattern.

**USB history was key to identifying the initial vector.** Without USB history analysis, the initial infection vector would have remained unknown.

**Timeline analysis was essential for understanding the attack sequence.** The timeline showed the four-day dwell time and the progression from initial infection to data exfiltration. Without timeline analysis, the attacker's activities would have appeared as isolated events rather than a coordinated campaign.

**Cross-referencing artifacts strengthened the investigation.** The recovered files, registry entries, and timeline data all corroborated each other. The PowerShell script found through file carving matched the persistence mechanism found in the registry, and both aligned with the timestamps in the timeline. This cross-correlation provides confidence in the findings and makes the evidence more persuasive in legal proceedings.

## Assessment

### Lab Exercise 1: Disk Imaging Practice (45 minutes)

In a lab environment, practice creating forensic images using multiple tools.

**Lab Tasks:**

1. Create a forensic image of a USB drive using FTK Imager (15 minutes)
2. Create a forensic image of the same USB drive using dc3dd (15 minutes)
3. Verify both images using hash comparison (10 minutes)
4. Compare the image formats and document differences (5 minutes)

**Grading Criteria:**

- Correct FTK Imager image creation: 25 points
- Correct dc3dd image creation: 25 points
- Successful hash verification: 25 points
- Accurate format comparison: 25 points

### Lab Exercise 2: File Recovery (60 minutes)

You are given a forensic image of a hard drive. Your task is to recover deleted files.

**Lab Tasks:**

1. Examine the file system and identify deleted files (15 minutes)
2. Recover deleted files using file carving (15 minutes)
3. Analyze recovered files for evidence of attacker activity (20 minutes)
4. Document all recovered files and their significance (10 minutes)

**Grading Criteria:**

- Correct identification of deleted files: 20 points
- Successful file recovery: 30 points
- Thorough file analysis: 30 points
- Complete documentation: 20 points

### Lab Exercise 3: Registry Analysis (45 minutes)

You are given a forensic image of a Windows system. Your task is to analyze the registry for evidence of attacker activity.

**Lab Tasks:**

1. Examine persistence locations in the registry (15 minutes)
2. Analyze user activity artifacts (15 minutes)
3. Examine USB device history (10 minutes)
4. Document all findings with evidence (5 minutes)

**Grading Criteria:**

- Correct persistence identification: 30 points
- Thorough user activity analysis: 30 points
- Accurate USB history analysis: 20 points
- Complete documentation: 20 points

## Evidence

### Key Concepts

- **Disk Forensics:** Analysis of storage media to recover evidence: deleted files, file system metadata, and unallocated space
- **File Recovery:** Recovering deleted files through file system analysis (MFT, inode analysis) or file carving (header/footer scanning)
- **Slack Space:** Unused space between file end and cluster end: may contain remnants of deleted files
- **Registry Analysis:** Examining Windows registry for persistence mechanisms, user activity, network configuration, and device history
- **Timeline Analysis:** Correlating timestamps from multiple sources to reconstruct the sequence of events

### File Recovery Commands

**Foremost (file carving):**
```
foremost -i image.raw -o output/ -t pdf,jpg,doc,zip
```

**Scalpel (file carving):**
```
scalpel -o output/ image.raw
```

**Photorec (file carving):**
```
photorec /cmd image.raw
```

### Registry Analysis Quick Reference

| Registry Location | Evidence Type |
|-------------------|---------------|
| `Run` and `RunOnce` keys | Persistence mechanisms |
| `Services` key | Installed services, persistence |
| `RecentDocs` | Recently accessed files |
| `TypedPaths` | Explorer path history |
| `RunMRU` | Run dialog history |
| `USB` and `USBSTOR` | USB device history |
| `MountPoints2` | Mounted USB devices |
| `NetworkList\Signatures` | Known networks |

### Timeline Sources

| Source | Timestamp Type | Evidence |
|--------|---------------|----------|
| File system (NTFS) | MACB times | File creation, modification, access |
| File system (ext4) | inode timestamps | File creation, modification, access |
| Registry keys | Create, write, access times | Configuration changes, persistence |
| Windows Event Logs | Event timestamps | Authentication, process creation |
| Web server logs | Request timestamps | Web activity, file access |
| Application logs | Event timestamps | Application-specific activity |
