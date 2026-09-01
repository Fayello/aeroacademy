# Module 5: Recovery

Recovery is the phase where you bring systems back online and return to normal operations. It sounds simple: just restore from backups and move on. In practice, recovery is one of the most dangerous phases of incident response because it is when you are most vulnerable to reinfection. The attacker may still have footholds you have not discovered. Backups may contain malicious content. The rush to restore services can lead to shortcuts that create new vulnerabilities. This module covers how to recover safely, validate that your systems are clean, monitor for reinfection, and communicate throughout the process.

## The Recovery Paradox

The recovery phase creates a paradox: you need to restore services quickly because the business needs them, but you need to be thorough because a hasty recovery can lead to reinfection. The pressure from leadership to restore services is intense, especially when the outage has been public or has affected customers.

Resist the pressure to rush. A recovery that results in reinfection is worse than a slow recovery. Every hour of additional downtime is preferable to restoring a compromised system that gives the attacker another chance.

The key to resolving this paradox is planning. If you planned during the preparation phase, you have documented recovery procedures, identified clean backups, and established recovery timelines. Execute the plan. Do not ad-lib under pressure.

## Identifying Clean Backups

The foundation of recovery is clean backups. If your backups are compromised, restoring from them reintroduces the attacker into your environment.

### Backup Assessment

Before restoring from any backup, assess whether it is clean. This requires understanding when the attacker gained access and ensuring your backup was made before that time.

Your forensic timeline from the investigation phase is critical here. You need to know the earliest point of compromise. If the attacker gained access on March 1st and you have a backup from March 5th, that backup may contain malicious files or attacker-controlled data. You need a backup from before March 1st.

Not all backups are created equal. Full backups contain everything on the system. Incremental backups contain only changes since the last backup. Differential backups contain changes since the last full backup. The type of backup affects what you need to restore and how clean it is likely to be.

Database backups require special consideration. If the attacker modified data in a database, those modifications are captured in backups made after the modification. You need to identify the last backup made before the attacker's data modifications and restore from that point. This may mean using point-in-time recovery to restore the database to a specific moment before the attacker's changes.

### Backup Integrity Verification

Even backups made before the compromise may have integrity issues. Backups can fail silently: a backup that appears to be complete may be missing files or contain corrupted data.

Verify backup integrity before you need it. This means regularly testing your backups by performing test restores and verifying that the restored data is complete and correct. If you discover backup integrity issues during a recovery, you have a serious problem.

Checksums and hashes can verify backup integrity. If you have hashes of your backup files computed at the time of backup, you can verify that the backup has not been modified. This does not guarantee the backup is clean: the backup could have been made from a compromised system: but it verifies that the backup file itself has not been tampered with.

### Backup Location

Ensure your backups are stored in a location that the attacker cannot access. If the attacker can modify your backups, they can compromise your recovery. Backups should be stored offline, in a separate network segment, or in a cloud storage account with separate credentials.

The 3-2-1 backup rule is a good baseline: three copies of your data, on two different media types, with one copy offsite. This provides redundancy against hardware failure, data corruption, and attacker access.

## System Restoration

System restoration is the process of rebuilding compromised systems from clean backups or clean images.

### Restoration Approach

The restoration approach depends on the type of system and the nature of the compromise.

**Full rebuild from image** is the most thorough approach. You wipe the compromised system completely and install a fresh operating system image. This eliminates all persistence mechanisms and malware. The downside is that it takes the longest and requires you to restore data separately.

**Restore from backup** is faster but carries more risk. If the backup contains any malicious content, you reintroduce it into your environment. Use this approach only when you have verified that the backup is clean and was made before the compromise.

**In-place restoration** is the riskiest approach. You restore specific files or data without rebuilding the entire system. This may leave persistence mechanisms or malware that was not part of the restored data. Avoid in-place restoration for systems that were directly compromised.

### Restoration Sequence

The order in which you restore systems matters. Restore systems in dependency order: restore the systems that other systems depend on first.

For most environments, the restoration sequence is:

1. **Identity systems.** Restore Active Directory, DNS, and authentication systems first. Without identity, nothing else works.

2. **Infrastructure systems.** Restore network infrastructure, storage, and other foundational systems.

3. **Database servers.** Restore databases from clean backups, applying transaction logs as needed to reach the desired point in time.

4. **Application servers.** Restore application servers that depend on the databases and identity systems.

5. **Client systems.** Restore workstations and endpoints last, after all server-side systems are verified.

This sequence ensures that each layer of the stack is verified before the systems that depend on it are restored.

### Data Restoration

Restoring data from backups requires care. Data integrity is critical, and you need to verify that restored data is accurate and complete.

For file servers, verify restored files by checking file hashes against known-good values. For databases, run integrity checks and verify data consistency. For application systems, verify that application data is in the expected state.

Consider data loss when restoring. If your last clean backup is a week old, you lose a week of data. Communicate the expected data loss to stakeholders and determine whether additional recovery measures are needed: like replaying transaction logs or recovering data from other sources.

## Validation and Verification

Before you reconnect a restored system to the network, validate that it is clean and functioning correctly.

### System Integrity Validation

Run comprehensive scans on restored systems before connecting them to the network. Use multiple antivirus engines to scan for malware. Check for unauthorized accounts, unauthorized software, and configuration deviations from your standard build.

Compare the restored system against your gold image or standard build. Any deviations should be investigated and resolved before the system is connected to the network.

Verify that all patches are current. A restored system that is missing security patches creates a new vulnerability. Apply all current patches before connecting the system to the network.

### Application Validation

Verify that applications are functioning correctly after restoration. This means testing the application's core functionality, verifying database connectivity, checking API integrations, and confirming that the application can serve user requests.

Application validation should include both automated testing (if you have automated test suites) and manual testing by someone who understands the application's expected behavior. Automated tests catch functional issues; manual testing catches behavioral issues.

### Security Validation

Before connecting a restored system to the network, verify that security controls are functioning. This includes:

**Firewall rules:** Verify that the system's firewall is configured correctly and blocking unauthorized traffic.

**Antivirus/EDR:** Verify that security agents are installed, running, and communicating with their management servers.

**Logging:** Verify that the system is sending logs to your SIEM and that the logs are being parsed correctly.

**Access controls:** Verify that the system's access controls are configured according to your security policy.

## Monitoring for Reinfection

Recovery is the phase when you are most vulnerable to reinfection. The attacker knows they have been detected and may be actively watching for you to restore systems. If they still have a foothold: even a small one: they will attempt to use it.

### Enhanced Monitoring

During recovery, implement monitoring that is more aggressive than your normal monitoring. This means lower thresholds for alerts, additional log sources, and more frequent reviews.

Create detection rules specifically for the attacker's known tactics, techniques, and procedures. If the attacker used a specific malware sample, create a detection rule for that sample's network signatures. If the attacker used a specific persistence mechanism, create a detection rule for that mechanism. If the attacker accessed specific systems, monitor those systems more closely.

Review all logs from restored systems within the first 24 hours. Look for any suspicious activity: unexpected logins, unusual process executions, unauthorized network connections. The first 24 hours after restoration are the highest-risk period.

### Monitoring Duration

Enhanced monitoring should continue for at least 30 days after recovery. This is not arbitrary: it is based on the observation that attackers who have been detected often attempt to regain access within the first few weeks.

During this 30-day period, gradually reduce the monitoring intensity as your confidence in the recovery increases. If no signs of reinfection are detected after two weeks, you can relax monitoring slightly. If no signs are detected after 30 days, you can return to normal monitoring levels.

If signs of reinfection are detected at any point during the monitoring period, immediately re-enter the incident response process. This means containment, investigation, and eradication: the full cycle. Do not assume that enhanced monitoring will catch everything.

### Deception Technology

Consider deploying deception technology during recovery. Honeypots, honey tokens, and honey accounts can detect attacker activity that your monitoring might miss. A honey account that nobody should be using will immediately reveal an attacker who discovers and uses it.

Deploy honeypots on network segments where you expect the attacker to attempt lateral movement. A honeypot that mimics a production server can detect an attacker scanning your network. Honey tokens: unique files or credentials that have no legitimate use: can detect data exfiltration or credential theft.

## Communication During Recovery

Communication during recovery is as important as communication during the incident itself. Your stakeholders need to know when systems are coming back online, what the expected impact is, and whether any additional precautions are needed.

### Internal Communication

Keep leadership informed about recovery progress. Provide regular updates: at least daily during active recovery: on what has been restored, what is still being restored, and what the expected completion timeline is.

Communicate with technical teams about what has been verified and what still needs verification. Ensure that teams that depend on restored systems know when those systems are back online and what level of functionality to expect.

### External Communication

If the incident was customer-facing, communicate with customers about the recovery. Tell them what has been restored, what has changed, and what they should do: like resetting passwords or monitoring their accounts.

If the incident affected partners or vendors, communicate with them about the recovery and any changes to your systems that may affect integration.

### Regulatory Communication

If the incident triggered regulatory notification requirements, ensure that your recovery communications are consistent with your regulatory filings. Do not make public statements that contradict what you have reported to regulators.

## Real Scenario: Recovering from a Destructive Attack

In June 2024, a logistics company experienced a destructive attack that wiped data from 200 workstations and 15 servers. The attacker gained access through a compromised VPN account, moved laterally through the network, and deployed a destructive payload that overwrote the Master Boot Record on workstations and deleted data on servers.

The attack was detected when users reported that their workstations would not boot. The SOC initially thought it was a hardware failure, but when the same issue affected hundreds of workstations simultaneously, they recognized it as a deliberate attack.

The IR team was assembled and began containment. They isolated the affected network segment, disabled the compromised VPN account, and blocked the attacker's known infrastructure. The forensic investigation revealed that the attacker had been in the network for five days before deploying the destructive payload.

Recovery was a massive undertaking. The company needed to restore 200 workstations and 15 servers from backups. The challenge was that the attacker had modified some backups before deploying the destructive payload. The team needed to identify which backups were clean and which were compromised.

The team started by identifying the timeline of compromise. The forensic analysis showed that the attacker had gained access on June 1st and deployed the destructive payload on June 6th. Any backup made between June 1st and June 6th might be compromised. The team used backups from May 30th: the last full backup before the compromise: as their baseline.

Restoring 200 workstations required a staged approach. The team prioritized workstations based on business criticality. Finance and operations workstations were restored first, followed by engineering and sales, followed by all other workstations. Each workstation was rebuilt from a clean image, patched, and verified before being returned to the user.

The 15 servers required more careful restoration. Each server had different data and configuration requirements. The team worked with each server's owner to verify data integrity and application functionality after restoration.

The restoration took 12 days. During that time, the company operated with reduced capability. Some processes were handled manually, some were delayed, and some were suspended entirely. The financial impact was significant: approximately $3 million in lost revenue and recovery costs.

After restoration, the team implemented enhanced monitoring on all restored systems. They deployed additional EDR agents, enabled PowerShell logging, configured file integrity monitoring, and created detection rules specifically for the attacker's known tactics. The enhanced monitoring continued for 60 days.

During the monitoring period, the team detected and blocked two attempts by the attacker to regain access. The attacker tried to use the same VPN account: which had been reset but not fully revoked: to connect to the network. The enhanced monitoring detected the connection attempt and blocked it immediately. This validated the decision to maintain enhanced monitoring.

Key lessons from this recovery:

**Backup integrity verification is critical.** The attacker's modification of some backups complicated recovery. Regular backup integrity verification would have caught this earlier.

**Staged restoration is necessary.** You cannot restore everything at once. Prioritization based on business criticality ensures that the most important systems are restored first.

**Enhanced monitoring after recovery saved the company.** The two reinfection attempts during the monitoring period would have succeeded without enhanced monitoring. The monitoring investment paid for itself.

**Communication throughout the process was essential.** The company communicated with employees, customers, and partners throughout the recovery, setting expectations and providing updates. This maintained trust and reduced confusion.

## Recovery Metrics

Track these metrics during recovery to measure effectiveness and identify areas for improvement.

**Recovery Time Objective (RTO):** The maximum acceptable time from incident detection to full system restoration. Measure your actual recovery time against your target RTO. If you exceeded your target, identify why and address the gap.

**Recovery Point Objective (RPO):** The maximum acceptable data loss measured in time. If your RPO is 24 hours, you should not lose more than 24 hours of data. Measure your actual data loss against your target RPO.

**Mean Time to Recover (MTTR):** The average time to restore each system. Track this metric across different system types to identify which systems take the longest to restore and why.

**Systems Restored per Day:** The rate at which systems are being restored. Track this metric to ensure that recovery is progressing at the expected rate.

**Verification Pass Rate:** The percentage of restored systems that pass verification on the first attempt. A low pass rate indicates problems with the restoration process or the backup quality.

## Assessment

### Lab Exercise 1: Backup Assessment (30 minutes)

You are given information about a set of backups and a compromise timeline. Your task is to determine which backups are safe to use for recovery.

**Scenario:** A server was compromised on March 15th. The attacker was in the network from March 10th to March 20th. You have the following backups:

- Full backup: March 1st
- Incremental backup: March 8th
- Incremental backup: March 15th
- Full backup: March 22nd
- Incremental backup: March 25th

**Lab Tasks:**

1. Determine which backups are potentially compromised (10 minutes)
2. Identify the best backup to use for recovery (10 minutes)
3. Document your reasoning and the data loss implications (10 minutes)

**Grading Criteria:**

- Correct identification of compromised backups: 30 points
- Appropriate backup selection: 30 points
- Clear reasoning and data loss assessment: 40 points

### Lab Exercise 2: Recovery Plan Development (45 minutes)

You are given a scenario involving a large-scale recovery. Your task is to develop a comprehensive recovery plan.

**Scenario:** A ransomware attack has encrypted files on 50 workstations and 5 servers. The workstations include finance, operations, and engineering departments. The servers include a database server, an application server, a file server, a web server, and a domain controller. The attack occurred on April 1st. You have clean backups from March 28th.

**Lab Tasks:**

1. Develop a restoration priority sequence (10 minutes)
2. Create a detailed restoration plan for each system type (15 minutes)
3. Define verification steps for each restored system (10 minutes)
4. Develop a monitoring plan for reinfection detection (10 minutes)

**Grading Criteria:**

- Appropriate priority sequence: 20 points
- Thorough restoration plan: 30 points
- Comprehensive verification steps: 25 points
- Effective monitoring plan: 25 points

### Lab Exercise 3: Recovery Communication Plan (30 minutes)

You are given a scenario and must develop communication plans for different audiences during recovery.

**Scenario:** A data breach has been discovered affecting customer PII. The breach was contained two days ago, and you are beginning recovery. You need to communicate with employees, customers, regulators, and the media.

**Lab Tasks:**

1. Draft an internal communication for employees (10 minutes)
2. Draft a customer notification (10 minutes)
3. Draft a regulatory notification summary (10 minutes)

**Grading Criteria:**

- Appropriate internal communication: 30 points
- Compliant customer notification: 30 points
- Accurate regulatory notification: 40 points

## Evidence

### Key Concepts

- **Clean Backups:** Backups made before the compromise that have not been accessed or modified by the attacker
- **Backup Integrity Verification:** Regular testing of backups to ensure they can be restored and contain complete, accurate data
- **System Rebuilding:** Restoring from clean images rather than cleaning compromised systems
- **Validation:** Verifying system integrity, application functionality, and security controls before reconnecting to the network
- **Enhanced Monitoring:** Increased monitoring intensity after recovery to detect reinfection attempts
- **Recovery Metrics:** RTO, RPO, MTTR, and other metrics that measure recovery effectiveness

### Recovery Checklist

- [ ] Identify clean backups
- [ ] Verify backup integrity
- [ ] Determine restoration priority sequence
- [ ] Restore identity systems
- [ ] Restore infrastructure systems
- [ ] Restore database servers
- [ ] Restore application servers
- [ ] Restore client systems
- [ ] Verify system integrity
- [ ] Verify application functionality
- [ ] Verify security controls
- [ ] Implement enhanced monitoring
- [ ] Document all actions
- [ ] Communicate with stakeholders
- [ ] Track recovery metrics

### Recovery Decision Matrix

| Scenario | Preferred Approach | Backup Source | Monitoring |
|----------|-------------------|---------------|------------|
| Single workstation | Full rebuild from image | Gold image + data backup | 30 days enhanced |
| Single server | Full rebuild from clean image | Clean backup | 30 days enhanced |
| Multiple workstations | Staged rebuild from images | Gold images + data backups | 30 days enhanced |
| Multiple servers | Staged rebuild from clean images | Clean backups + point-in-time recovery | 45 days enhanced |
| Database server | Restore from clean backup + transaction logs | Clean backup | 60 days enhanced |

### Recovery Communication Templates

**Internal (employees):** Status update, expected timeline, what employees should do, who to contact with questions. Employees need to know whether their systems are affected, whether they need to take any action like resetting passwords, and when they can expect normal operations to resume.

**Customer (notification):** What happened, what data was affected, what you are doing about it, what customers should do, contact information. Customer notifications should be clear, factual, and avoid legal jargon. Customers need to understand the practical impact on them and what steps they should take to protect themselves.

**Regulatory (filing):** Incident summary, scope of impact, response actions, remediation steps, compliance status. Regulatory filings must meet specific format and timeline requirements depending on the applicable regulation. Work with legal counsel to ensure that filings are accurate and complete.

**Media (statement):** Brief factual statement, what happened, what you are doing, commitment to security. Media statements should be approved by legal counsel and communications leadership before release. The statement should demonstrate that the organization is taking the incident seriously and has taken concrete steps to address it.
