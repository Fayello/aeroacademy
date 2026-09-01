# Module 4 — Eradication

Eradication is the phase where you remove the attacker from your environment entirely. Containment stops the bleeding; eradication removes the threat. This means eliminating every persistence mechanism, removing every piece of malware, revoking every compromised credential, and patching every vulnerability that the attacker exploited. Missing even one persistence mechanism means the attacker can regain access. This module covers how to systematically eradicate an attacker from your network.

## The Completeness Problem

The biggest challenge in eradication is completeness. You need to find and remove every trace of the attacker's presence. This is harder than it sounds because sophisticated attackers establish multiple persistence mechanisms, some of which are designed to survive reboots and system reimaging.

A common scenario: you rebuild a compromised workstation from a clean image, patch the vulnerability the attacker exploited, and rotate all credentials. Two weeks later, the attacker is back. What happened? The attacker had a secondary persistence mechanism that you missed — perhaps a scheduled task that downloads a payload from an external server, or a DLL search order hijack that loads malicious code into a legitimate process, or a compromised browser extension that re-establishes a connection to the attacker's infrastructure.

Eradication requires a systematic approach. You need to inventory every system the attacker touched, identify every persistence mechanism on each system, and remove every mechanism completely. There are no shortcuts.

## Removing Persistence Mechanisms

Persistence mechanisms allow the attacker to maintain access across reboots, credential changes, and other system modifications. They are the attacker's insurance policy against containment.

### Windows Persistence Mechanisms

Windows provides numerous persistence mechanisms, and attackers use all of them. Understanding these mechanisms is critical for eradication.

**Scheduled Tasks** are one of the most common persistence mechanisms. Attackers create scheduled tasks that execute malicious payloads at system startup, user logon, or on a recurring schedule. Check for suspicious scheduled tasks using `schtasks /query /fo LIST /v` or the Task Scheduler GUI. Look for tasks that run unusual executables, execute commands via cmd.exe or powershell.exe, or have recently been created or modified.

**Services** provide persistence by running executables at system startup. Attackers create new services or modify existing ones to execute malicious code. Check for suspicious services using `sc query` or the Services MMC snap-in. Look for services that point to unusual executable paths, have recently been created, or have unusual service accounts.

**Registry Run Keys** execute programs when a user logs in. The most common locations are `HKLM\Software\Microsoft\Windows\CurrentVersion\Run`, `HKLM\Software\Microsoft\Windows\CurrentVersion\RunOnce`, and their `Wow6432Node` counterparts. Check these keys for entries pointing to unusual executables. Also check `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` for user-specific persistence.

**WMI Event Subscriptions** can execute code in response to system events. Attackers create WMI event subscriptions that trigger when specific conditions are met — like a system boot or a specific time of day. Check for WMI subscriptions using `Get-WMIObject -Namespace root\Subscription -Class __EventFilter` and related classes.

**Startup Folders** contain shortcuts to programs that execute when a user logs in. There are startup folders for each user and a common startup folder. Check these folders for suspicious shortcuts. The paths are typically `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` and `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup`.

**DLL Search Order Hijacking** exploits the way Windows loads DLLs. By placing a malicious DLL in a directory that is searched before the legitimate DLL's location, the attacker can force their code to be loaded by legitimate processes. This is harder to detect because the malicious code runs within a legitimate process. Check for recently modified DLLs in application directories and compare hashes against known-good versions.

**COM Object Hijacking** modifies Component Object Model registrations to execute malicious code when a COM object is instantiated. This is a sophisticated persistence mechanism that can be difficult to detect. Check for recently modified COM registrations in the registry.

**Boot Configuration** modifications can execute code before the operating system loads. Bootkits modify the Master Boot Record or Volume Boot Record to load malicious code during the boot process. These are rare but extremely persistent. Check the MBR and VBR for modifications using forensic tools.

### Linux Persistence Mechanisms

Linux provides different but equally diverse persistence mechanisms.

**Crontabs** schedule tasks to run at specific times or intervals. Check system crontabs (`/etc/crontab`, `/etc/cron.d/`), user crontabs (`/var/spool/cron/crontabs/`), and cron directories (`/etc/cron.daily/`, `/etc/cron.hourly/`, etc.). Look for entries that execute unusual commands or download and execute scripts.

**System Services** (systemd units) run executables at system startup or in response to events. Check for suspicious service units in `/etc/systemd/system/`, `/usr/lib/systemd/system/`, and `~/.config/systemd/user/`. Look for services that execute unusual commands or are recently created.

**Shell Profiles** execute commands when a user opens a shell. Check `.bashrc`, `.bash_profile`, `.profile`, `.zshrc`, and other shell configuration files for suspicious entries. Look for commands that download and execute scripts, establish reverse shells, or modify system configuration.

**Authorized Keys** allow SSH key-based authentication. Check `~/.ssh/authorized_keys` on all user accounts for unauthorized public keys. An attacker who adds their public key to authorized_keys can authenticate without a password.

**PAM Modules** (Pluggable Authentication Modules) can be modified to execute code during authentication. Check for unauthorized PAM modules or modifications to existing PAM configuration. This is a sophisticated persistence mechanism that can be very difficult to detect.

**Kernel Modules** provide persistence at the kernel level. Rootkits use kernel modules to hide their presence and maintain access. Check for recently loaded kernel modules using `lsmod` and compare against the expected module list.

**Systemd Timers** are an alternative to cron for scheduling tasks. Check for suspicious timer units that execute commands at intervals.

### Cross-Platform Persistence

Some persistence mechanisms work across platforms.

**Browser Extensions** can establish persistence through the user's web browser. Check all installed browser extensions on all browsers and verify that they are legitimate. Remove any extensions that you did not install or that have suspicious permissions.

**Scheduled Jobs via External Services** use cloud services to schedule task execution. An attacker might use a cloud-based CI/CD service to periodically execute a script on the compromised system. This persistence mechanism survives system reimaging because the scheduled job is external to the system.

**Firmware Persistence** modifies firmware to survive operating system reinstallation. This is extremely rare and sophisticated but has been observed in advanced persistent threat operations. Detecting firmware persistence requires specialized tools and expertise.

## Malware Removal

Malware removal is straightforward in theory — identify the malicious file and delete it. In practice, malware removal is complex because malware often protects itself, hides from detection, and establishes multiple components.

### Identifying Malware

The first step in malware removal is identifying what you need to remove. This requires forensic analysis to identify all malicious files, processes, and artifacts.

EDR telemetry is the primary source for malware identification. Your EDR agent has been monitoring process executions, file creations, and network connections. Review the EDR data to identify all files created by the malicious process and all processes spawned by the malware.

Forensic analysis of disk images can identify malware that is not currently running. Scan the disk image with multiple antivirus engines, analyze suspicious files with sandboxing tools, and manually inspect files that automated tools cannot identify.

Threat intelligence can help identify known malware samples. Submit file hashes to threat intelligence platforms to determine whether the malware is a known sample. Known malware may have published analysis that helps you understand its behavior and persistence mechanisms.

### Removing Malware

For known malware samples, removal is typically straightforward. Delete the malicious files, remove any persistence mechanisms, and verify removal with a clean antivirus scan.

For unknown or custom malware, removal is more complex. You need to identify all components of the malware — the initial payload, any secondary payloads, persistence mechanisms, and any modifications the malware made to the system. Missing any component means the malware can regenerate.

The safest approach during eradication is to rebuild compromised systems from known-good media rather than attempting to clean them. This eliminates the risk of missed malware artifacts and ensures that the system starts from a known-clean state. Rebuilding is slower but more reliable.

If rebuilding is not possible — for example, if the system contains critical data that cannot be restored from backups — thorough malware removal requires:

1. Identify all malicious files and processes
2. Terminate all malicious processes
3. Remove all persistence mechanisms
4. Delete all malicious files
5. Repair any system modifications made by the malware
6. Verify removal with multiple detection tools
7. Monitor the system closely for signs of reinfection

### Anti-Forensics Techniques

Sophisticated malware uses anti-forensics techniques to make removal difficult.

**Fileless malware** operates entirely in memory and does not write files to disk. It cannot be removed by deleting files — you need to terminate the process and remove the persistence mechanism that loads it into memory.

**Polymorphic malware** changes its file signature each time it executes. Signature-based detection may not detect all variants. Use behavioral detection instead of signature-based detection.

**Encrypted payloads** hide the malware's code inside encrypted files. The malware decrypts itself at runtime, making static analysis difficult. Dynamic analysis and memory forensics can reveal the decrypted payload.

**Rootkits** modify the operating system to hide their presence. They can hide files, processes, and network connections from the tools you use to inspect the system. Detecting rootkits requires specialized tools that inspect the system at a lower level than the rootkit operates.

## Vulnerability Patching

Eradication is not complete without patching the vulnerabilities that allowed the initial compromise. If the attacker exploited a vulnerability to gain access, and you do not patch that vulnerability, the attacker (or another attacker) will use it again.

### Patch Identification

The forensic investigation should identify the vulnerability that the attacker exploited. This information comes from analyzing the initial access vector — the phishing email, the exploited service, the compromised credential. Once you know the vulnerability, identify the patch that addresses it.

Check whether the patch is available for all affected systems. Some vulnerabilities affect specific versions of software, and the patch may not be available for all versions. In these cases, you may need to implement compensating controls — like additional monitoring or access restrictions — until a patch is available.

### Patch Deployment

Deploy patches across your environment, not just to the exploited system. If the vulnerability exists on other systems, those systems are at risk of exploitation.

Patching during an active incident is risky. A bad patch can break systems and create additional problems. Test patches in a staging environment before deploying to production if time permits. If time does not permit testing, deploy patches to production with a rollback plan.

Prioritize patching based on exposure. Internet-facing systems should be patched first, followed by systems on the same network segment as the compromised system, followed by all other systems.

### Vulnerability Management Integration

The incident should feed back into your vulnerability management program. If a vulnerability was exploited because it was not patched in time, review your patching timeline. If a vulnerability was exploited because it was not on your patching list, review your asset inventory and vulnerability scanning coverage.

Consider whether additional controls are needed to prevent similar exploitation. This might include network segmentation, application whitelisting, enhanced logging, or additional access controls.

## System Restoration

System restoration is the process of returning compromised systems to a known-good state. The preferred approach is rebuilding from scratch rather than cleaning in place.

### Rebuilding from Scratch

Rebuilding a system from scratch eliminates all doubt about the system's integrity. When you rebuild, you start with a known-good operating system image, apply all current patches, install only necessary software, and restore data from backups made before the compromise.

The rebuild process:

1. **Identify the last known clean backup.** Determine when the system was last in a known-good state. Use your forensic timeline to identify this point.

2. **Prepare a clean image.** Create or obtain an operating system image that you know is clean. This image should include all current patches and necessary software.

3. **Rebuild the system.** Wipe the compromised system and install the clean image. Configure the system according to your standard build specifications.

4. **Apply patches.** Ensure the rebuilt system has all current security patches applied before connecting it to the network.

5. **Restore data.** Restore data from the last known clean backup. Verify the integrity of restored data.

6. **Verify the rebuild.** Before connecting the rebuilt system to the network, verify that it is clean. Run antivirus scans, check for unauthorized accounts, verify configurations, and review recent changes.

7. **Monitor closely.** After reconnecting the rebuilt system, monitor it closely for signs of reinfection. The attacker may have persistence mechanisms that survive system reimaging — like compromised firmware, external persistence mechanisms, or compromised credentials.

### Data Restoration

Restoring data from backups requires careful consideration. If the backup was made after the attacker gained access, the backup may contain malicious files or attacker-controlled data. You need to identify the last backup made before the compromise.

Verify the integrity of restored data. Check file hashes against known-good values if available. Scan restored files with antivirus tools. Review restored files for embedded malware or malicious macros.

Consider the data restoration timeline. Restoring from a backup that is a week old means you lose a week of data. Communicate the data loss to stakeholders and determine whether additional recovery measures are needed — like transaction logs or database point-in-time recovery.

## Real Scenario: Removing a Backdoor

On a Monday morning, the security operations center detected a suspicious outbound connection from a production server. The connection was to an IP address that matched a known threat actor's infrastructure. The EDR agent on the server had been disabled three days earlier — a critical detection gap.

The IR team was assembled and began investigating. The server was a Linux system running a customer-facing web application. The forensic analysis of the server revealed that the attacker had gained access through a compromised SSH key. The attacker had added their public key to the authorized_keys file for the root account, giving them persistent SSH access.

The attacker had used this access to install a backdoor. The backdoor consisted of three components: a modified SSH daemon that listened on a non-standard port, a cron job that periodically downloaded a configuration update from an external server, and a kernel module that hid the backdoor from standard system tools.

The eradication process was systematic:

**Step 1: Isolate the server.** The team isolated the server from the network to prevent the attacker from accessing it during eradication.

**Step 2: Collect evidence.** The team created a forensic image of the server's disk and captured a memory dump before making any changes.

**Step 3: Identify all persistence mechanisms.** The forensic analysis identified three persistence mechanisms: the SSH authorized_keys entry, the cron job, and the kernel module.

**Step 4: Remove persistence mechanisms.** The team removed the attacker's public key from authorized_keys, deleted the cron job, and unloaded the kernel module.

**Step 5: Remove the backdoor.** The team identified and deleted the modified SSH daemon binary. They verified that the standard SSH daemon was intact and unmodified.

**Step 6: Patch the vulnerability.** The team implemented SSH key management controls to prevent unauthorized key additions. They also deployed an EDR agent to the server to prevent the detection gap from recurring.

**Step 7: Rotate credentials.** The team rotated the root password and all service account passwords. They also rotated SSH keys for all accounts that had SSH access to the server.

**Step 8: Verify eradication.** The team ran a full antivirus scan, verified all system file integrity, and checked for any additional persistence mechanisms. They also compared the system against a known-good baseline to identify any other modifications.

**Step 9: Monitor.** After reconnecting the server, the team implemented enhanced monitoring for the server, including network traffic analysis, process monitoring, and file integrity monitoring.

The entire eradication process took 12 hours. The team was thorough and methodical, and they did not restore the server to production until they were confident that the attacker was completely removed.

Key lessons from this eradication:

**Detection gaps enable persistence.** The attacker disabled the EDR agent three days before detection. Without EDR, the attacker had free rein to install persistence mechanisms. Ensuring continuous EDR coverage is a critical preventive control.

**Multiple persistence mechanisms are common.** The attacker did not rely on a single persistence mechanism — they used three. This redundancy makes eradication more difficult and increases the risk of missing something.

**Forensic analysis before eradication is critical.** The team imaged the server before making changes, which preserved evidence and allowed thorough analysis of the attacker's activities.

**Verification after eradication is essential.** The team did not just remove the known persistence mechanisms — they verified the entire system against a known-good baseline. This verification caught any additional modifications the attacker had made.

## Eradication Verification

Verification is the process of confirming that eradication is complete. Without verification, you cannot be confident that the attacker has been fully removed.

### System Integrity Verification

Compare the compromised system against a known-good baseline. This comparison should cover:

**System files:** Verify that all system files match their expected hashes. Any modifications to system files indicate potential malware activity or attacker modifications.

**Configuration files:** Verify that all configuration files are in their expected state. Attackers often modify configuration files to establish persistence or weaken security controls.

**User accounts:** Verify that all user accounts are expected. Remove any unauthorized accounts that the attacker may have created.

**Group memberships:** Verify that all group memberships are expected. Remove any unauthorized privilege escalation.

**Scheduled tasks and services:** Verify that all scheduled tasks and services are expected. Remove any unauthorized entries.

**Network configuration:** Verify that all network configurations are expected. Check for unauthorized port forwards, proxy configurations, or DNS settings.

### Monitoring Verification

After eradication, implement enhanced monitoring to detect any signs of reinfection. This monitoring should be more aggressive than your normal monitoring because you are specifically looking for the attacker attempting to regain access.

Create detection rules for the attacker's known indicators — IP addresses, domains, file hashes, and behavioral patterns. Monitor these indicators closely for any matches. If you see any of these indicators, you may not have completely eradicated the attacker.

Monitor for new persistence mechanisms. The attacker may attempt to re-establish persistence using different techniques than those you removed. Watch for new scheduled tasks, new services, new authorized keys, and other changes to the system.

## Assessment

### Lab Exercise 1: Persistence Mechanism Identification (60 minutes)

You are given a compromised Windows system image. Your task is to identify all persistence mechanisms.

**Lab Tasks:**

1. Examine the registry for unauthorized run keys and services (15 minutes)
2. Check for unauthorized scheduled tasks (10 minutes)
3. Examine startup folders for suspicious entries (5 minutes)
4. Check WMI event subscriptions (10 minutes)
5. Look for unauthorized COM object registrations (10 minutes)
6. Document all persistence mechanisms found with evidence (10 minutes)

**Grading Criteria:**

- Correct identification of persistence mechanisms: 60 points
- Evidence quality for each finding: 20 points
- Documentation completeness: 20 points

### Lab Exercise 2: Malware Removal Procedure (45 minutes)

You are given a scenario involving a multi-component malware infection. Your task is to develop and document a removal procedure.

**Scenario:** A workstation is infected with a malware sample that consists of a DLL injection payload, a scheduled task for persistence, a registry modification for DLL hijacking, and a connection to a known C2 server.

**Lab Tasks:**

1. Document all malware components identified (10 minutes)
2. Develop a step-by-step removal procedure for each component (15 minutes)
3. Define verification steps to confirm removal (10 minutes)
4. Document the monitoring plan for reinfection detection (10 minutes)

**Grading Criteria:**

- Complete identification of malware components: 20 points
- Thorough removal procedure: 30 points
- Effective verification steps: 25 points
- Monitoring plan quality: 25 points

### Lab Exercise 3: Vulnerability Patching Plan (30 minutes)

You are given a scenario where the attacker exploited a known vulnerability. Your task is to develop a patching plan.

**Lab Tasks:**

1. Identify the exploited vulnerability and affected systems (10 minutes)
2. Develop a patching priority list based on system exposure (10 minutes)
3. Document the patch deployment and verification process (10 minutes)

**Grading Criteria:**

- Accurate vulnerability identification: 25 points
- Appropriate prioritization: 35 points
- Thorough deployment and verification plan: 40 points

## Evidence

### Key Concepts

- **Persistence Mechanisms:** Techniques attackers use to maintain access across reboots — scheduled tasks, services, registry keys, crontabs, authorized keys, WMI subscriptions
- **Malware Removal:** Identify all components, terminate processes, remove persistence, delete files, verify removal
- **Anti-Forensics:** Techniques that make malware detection and removal harder — fileless operation, polymorphism, encryption, rootkits
- **Vulnerability Patching:** Address the root cause of the compromise across all affected systems
- **System Rebuilding:** Preferred approach — rebuild from clean media rather than cleaning in place
- **Eradication Verification:** Confirm completeness through system integrity checks and enhanced monitoring

### Windows Persistence Checklist

- [ ] Registry Run Keys (HKLM and HKCU)
- [ ] Scheduled Tasks
- [ ] Services
- [ ] Startup Folders
- [ ] WMI Event Subscriptions
- [ ] DLL Search Order Hijacking
- [ ] COM Object Hijacking
- [ ] Boot Configuration (MBR/VBR)
- [ ] Browser Extensions
- [ ] PowerShell Profiles

### Linux Persistence Checklist

- [ ] System Crontabs
- [ ] User Crontabs
- [ ] Systemd Services
- [ ] Systemd Timers
- [ ] Shell Profiles (.bashrc, .profile, etc.)
- [ ] Authorized Keys
- [ ] PAM Modules
- [ ] Kernel Modules
- [ ] /etc/passwd and /etc/shadow
- [ ] SUID/SGID Binaries

### Eradication Verification Checklist

- [ ] System file integrity verified
- [ ] Configuration files verified
- [ ] User accounts verified
- [ ] Group memberships verified
- [ ] Scheduled tasks/services verified
- [ ] Network configuration verified
- [ ] Enhanced monitoring implemented
- [ ] Detection rules for attacker indicators deployed
- [ ] All persistence mechanisms removed
- [ ] System compared against known-good baseline
