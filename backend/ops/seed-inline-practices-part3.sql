-- ============================================================
-- INLINE PRACTICE SEED: Part 3
-- Courses 6-20 (remaining 15 courses)
-- Each lesson gets 1-2 exercises testing actual lesson content
-- ============================================================

-- ============================================================
-- 6. INCIDENT RESPONSE & DIGITAL FORENSICS
-- ============================================================

-- Lesson: Incident Response Process
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Incident Response Process';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Identify the IR Phase', 'FLAG_CAPTURE', 'A SOC analyst receives an alert that a workstation is communicating with a known C2 server. The analyst disconnects the workstation from the network and begins collecting a memory dump. Which phase of the incident response process is the analyst performing? Return the phase name.', 'Identify the IR phase from the scenario.', 'Containment', 'EXACT', ARRAY['The analyst has already detected the incident.', 'Disconnecting the network is an isolation action.', 'Collecting evidence during isolation is part of containment.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Preparation Checklist Item', 'FLAG_CAPTURE', 'Your organization is building an IR playbook. Which of these is a PREPARATION activity: (A) isolating a compromised server, (B) maintaining an up-to-date asset inventory, (C) restoring from backups, (D) notifying law enforcement? Return the letter.', 'Distinguish preparation from response activities.', 'B', 'EXACT', ARRAY['Preparation happens before an incident occurs.', 'Asset inventory helps you know what to protect.', 'Isolating, restoring, and notifying are all response activities.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Detection and Triage
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Detection and Triage';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'True Positive vs False Positive', 'FLAG_CAPTURE', 'An IDS alerts on a TCP connection from internal host 10.0.0.50 to an external IP on port 443. Investigation reveals this is a legitimate HTTPS connection to a SaaS application. What is this alert classified as? Return the classification.', 'Classify the alert type.', 'False positive', 'EXACT', ARRAY['The alert was triggered but the activity is legitimate.', 'True positive means the alert correctly identifies malicious activity.', 'False positive means the alert fired on benign traffic.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'SIEM Correlation Rule', 'SHORT_RESPONSE', 'Write a SIEM detection rule that identifies brute-force SSH attacks. Describe the correlation logic in one sentence: what events, what time window, what threshold?', 'Design a SIEM detection rule.', 'Correlate multiple failed SSH authentication events from the same source IP within a 5-minute window, triggering an alert when the count exceeds 10 failed attempts.', 'CONTAINS', ARRAY['Brute force involves repeated failed logins.', 'The source IP identifies the attacker.', 'A time window prevents matching historical events.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Containment
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Containment';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Short-Term vs Long-Term Containment', 'FLAG_CAPTURE', 'During a ransomware incident, you place network-level blocks to prevent C2 communication. This is a temporary measure while you prepare to rebuild. Is this short-term or long-term containment? Return the type.', 'Classify the containment strategy.', 'Short-term', 'EXACT', ARRAY['Short-term containment stops immediate damage quickly.', 'Long-term containment involves more permanent fixes.', 'Network blocks are quick to implement but not a complete solution.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Evidence Preservation', 'SHORT_RESPONSE', 'Before reimaging a compromised workstation, what forensic evidence should be collected first and why? Answer in one sentence.', 'Explain evidence collection priority.', 'A memory dump and disk image should be collected first because volatile evidence like memory contents, running processes, and network connections will be lost when the system is powered off.', 'CONTAINS', ARRAY['Memory is volatile and lost on power off.', 'Disk images preserve persistent artifacts.', 'Collecting evidence before remediation maintains chain of custody.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Eradication
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Eradication';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Persistence Mechanism Identification', 'FLAG_CAPTURE', 'During eradication, you find: a scheduled task running PowerShell every 15 minutes, a registry Run key pointing to a malicious exe, and a new local admin account. Which are persistence mechanisms? Return all three separated by commas.', 'Identify all persistence mechanisms.', 'Scheduled task, registry Run key, new local admin account', 'CONTAINS', ARRAY['Persistence mechanisms survive reboots.', 'Scheduled tasks execute on a schedule.', 'Registry Run keys execute at startup.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Credential Reset Scope', 'SHORT_RESPONSE', 'After a domain controller compromise, what credentials must be reset? Answer in one sentence.', 'Define credential reset scope.', 'All domain user passwords, service account passwords, Kerberos krbtgt account twice with a 10-hour wait, machine account passwords, and all certificates and API keys.', 'CONTAINS', ARRAY['Domain controller compromise exposes all AD credentials.', 'krbtgt must be reset twice to invalidate all Kerberos tickets.', 'Service accounts are often overlooked.'], 3, 35, true, 2, now(), now());
END $$;

-- Lesson: Recovery
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Recovery';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Recovery Validation', 'FLAG_CAPTURE', 'After restoring a web server from backup post-ransomware, what critical validation must you perform before reconnecting it? Return the action.', 'Identify pre-recovery validation.', 'Verify backup integrity and scan for malware', 'CONTAINS', ARRAY['Backups may contain the same malware.', 'Verify file hashes against known-good baselines.', 'Scan restored files with updated antivirus.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Post-Recovery Monitoring', 'SHORT_RESPONSE', 'After recovery, what monitoring should be implemented in the first 72 hours? Answer in one sentence.', 'Describe post-recovery monitoring.', 'Deploy network traffic analysis for known C2 IPs from the incident, file integrity monitoring on critical directories, enhanced logging, and alerting on connections to IOCs identified during investigation.', 'CONTAINS', ARRAY['Monitor for known IOCs from the original incident.', 'File integrity monitoring detects unauthorized changes.', 'Enhanced logging provides visibility.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Digital Forensics Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Digital Forensics Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Chain of Custody Purpose', 'FLAG_CAPTURE', 'Why must every person who handles forensic evidence document their access? Return the legal concept this protects.', 'Identify the forensic principle.', 'Evidence admissibility', 'CONTAINS', ARRAY['Chain of custody proves evidence was not tampered with.', 'Gaps can lead to evidence being thrown out in court.', 'Every transfer must be logged.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Write Blocker Purpose', 'FLAG_CAPTURE', 'When performing a forensic disk image, why must a write blocker be used? Return the reason.', 'Explain write blocker necessity.', 'To prevent any modification to the original evidence', 'CONTAINS', ARRAY['Any write to the original disk alters evidence.', 'Write blockers intercept all write commands.', 'Even mounting a filesystem can update timestamps.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Memory Forensics
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Memory Forensics';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Volatility Process Plugin', 'FLAG_CAPTURE', 'In Volatility, which plugin lists all running processes from a memory dump? Return the plugin name.', 'Identify the Volatility process plugin.', 'pslist', 'EXACT', ARRAY['pslist enumerates processes from the EPROCESS list.', 'psscan finds unlinked processes.', 'pstree shows parent-child relationships.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Extract Network Connections', 'COMMAND_ANSWER', 'Write the Volatility command that extracts active network connections from a Windows memory dump called memdump.raw using the Win10x64 profile.', 'Extract network connections with Volatility.', 'volatility -f memdump.raw --profile=Win10x64 netscan', 'CONTAINS', ARRAY['volatility is the command-line tool.', '-f specifies the memory dump file.', '--profile specifies the OS version.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Disk Forensics
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Disk Forensics';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'File Carving Technique', 'FLAG_CAPTURE', 'When filesystem metadata is destroyed, recovering files by scanning for file headers like JPEG magic bytes is called what? Return the technique name.', 'Identify the recovery technique.', 'File carving', 'EXACT', ARRAY['File carving scans raw disk data for signatures.', 'It works even when metadata is deleted.', 'Tools like Scalpel and Foremost perform file carving.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Registry Hive Purpose', 'FLAG_CAPTURE', 'Which Windows Registry hive contains boot and driver configuration critical for forensic timeline analysis? Return the hive name.', 'Identify the key Registry hive.', 'SYSTEM', 'CONTAINS', ARRAY['SYSTEM hive contains boot and driver configuration.', 'SOFTWARE hive contains installed program info.', 'NTUSER.DAT contains per-user settings.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Network Forensics
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Network Forensics';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'C2 Beaconing Detection', 'FLAG_CAPTURE', 'A host makes DNS queries to random subdomains of evil.com every 60 seconds with Base64-encoded data. What C2 technique is this? Return the technique name.', 'Identify the C2 method.', 'DNS tunneling', 'CONTAINS', ARRAY['DNS tunneling encodes data in DNS queries.', 'Regular periodic communication is beaconing.', 'Base64 subdomains are a DNS tunneling indicator.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Data Exfiltration Indicators', 'FLAG_CAPTURE', 'During network forensics you observe: large HTTPS transfers to an unknown cloud provider, occurring between 2-4 AM daily. What three indicators suggest exfiltration? Return comma-separated.', 'Identify exfiltration indicators.', 'Unusual destination, off-hours timing, large data volume', 'CONTAINS', ARRAY['Data exfiltration uses uncommon destinations.', 'Off-hours transfers avoid detection.', 'Large outbound data volumes are suspicious.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Post-Incident Review
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Incident Response & Digital Forensics' AND l.title = 'Post-Incident Review';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Blameless Post-Mortem Goal', 'FLAG_CAPTURE', 'In a blameless post-mortem, the focus is on systemic factors rather than individuals. What is the primary reason for this approach? Return the concept.', 'Identify the blameless goal.', 'Learning and improvement', 'CONTAINS', ARRAY['Blameless reviews encourage honest reporting.', 'Fear of blame causes people to hide mistakes.', 'The goal is systemic improvement, not punishment.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Root Cause Analysis Technique', 'FLAG_CAPTURE', 'Which technique involves repeatedly asking "why" to drill from symptoms to underlying cause? Return the technique name.', 'Identify the RCA technique.', '5 Whys', 'EXACT', ARRAY['The 5 Whys iteratively asks why.', 'Each answer forms the basis of the next question.', 'It typically takes 5 iterations to reach root cause.'], 3, 20, true, 2, now(), now());
END $$;


-- ============================================================
-- 7. CLOUD SECURITY & HARDENING
-- ============================================================

-- Lesson: Shared Responsibility
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'Who Secures What? The Cloud Responsibility Model';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'IaaS Responsibility Boundary', 'FLAG_CAPTURE', 'In AWS EC2 (IaaS), the customer patches the guest OS. Who patches the hypervisor? Return the party.', 'Identify hypervisor patching responsibility.', 'AWS (the cloud provider)', 'EXACT', ARRAY['In IaaS, the provider manages the hypervisor and below.', 'The customer manages the guest OS and above.', 'The shared responsibility line is at the hypervisor boundary.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'PaaS Vulnerability Ownership', 'SHORT_RESPONSE', 'Your team runs Node.js on Elastic Beanstalk (PaaS). A vulnerable npm package is found. Who fixes it and why? Answer in one sentence.', 'Apply shared responsibility to PaaS.', 'The customer is responsible because application dependencies are above the platform layer that AWS manages.', 'CONTAINS', ARRAY['PaaS shifts OS patching to the provider.', 'Application code and dependencies remain customer responsibility.', 'AWS manages the runtime but not your package.json.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: IAM & Least Privilege
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'IAM and Least Privilege';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'IAM Policy Evaluation', 'FLAG_CAPTURE', 'An IAM user has an explicit DENY on s3:GetObject for a bucket but an explicit ALLOW from another policy. Which wins? Return the result.', 'Understand IAM policy evaluation.', 'DENY always wins', 'CONTAINS', ARRAY['AWS IAM evaluates all applicable policies.', 'An explicit DENY always overrides any ALLOW.', 'If no explicit deny exists, an explicit ALLOW grants access.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Least Privilege Policy', 'COMMAND_ANSWER', 'Write an IAM policy JSON that allows a Lambda function to read objects from S3 bucket "app-data-bucket" only. Allow s3:GetObject and s3:ListBucket. Return the full JSON.', 'Write a least-privilege IAM policy.', '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:GetObject","s3:ListBucket"],"Resource":["arn:aws:s3:::app-data-bucket","arn:aws:s3:::app-data-bucket/*"]}]}}', 'CONTAINS', ARRAY['Restrict actions to only what is needed.', 'Use specific resource ARNs, not wildcards.', 'Include both bucket and object resource ARNs.'], 3, 35, true, 2, now(), now());
END $$;

-- Lesson: Network Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'Network Security in the Cloud';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Security Group vs NACL', 'FLAG_CAPTURE', 'Which AWS firewall operates at instance level and is stateful? Return the firewall type.', 'Distinguish Security Groups from NACLs.', 'Security Group', 'EXACT', ARRAY['Security Groups are stateful and instance-level.', 'NACLs are stateless and subnet-level.', 'Security Groups allow only ALLOW rules.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Private Subnet Purpose', 'SHORT_RESPONSE', 'Why should databases be in a private subnet with no internet gateway? Answer in one sentence.', 'Explain VPC segmentation.', 'Private subnets prevent direct internet access to databases, reducing attack surface by ensuring only internal VPC services can reach them.', 'CONTAINS', ARRAY['Private subnets have no internet gateway route.', 'Only VPC-internal resources can reach private subnets.', 'NAT gateways allow outbound-only internet from private subnets.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Data Protection
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'Data Protection in the Cloud';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'S3 Encryption Option', 'FLAG_CAPTURE', 'Which S3 encryption uses AWS-managed keys and encrypts each object with a unique key? Return the encryption type.', 'Identify S3 encryption option.', 'SSE-S3', 'EXACT', ARRAY['SSE-S3 uses AES-256 with AWS-managed keys.', 'SSE-KMS uses AWS KMS keys.', 'SSE-C uses customer-provided keys.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'KMS Key Rotation', 'SHORT_RESPONSE', 'Why enable automatic annual key rotation for KMS keys? Answer in one sentence.', 'Explain key rotation benefit.', 'Automatic rotation limits data encrypted under any single key version, reducing impact if a key is compromised and ensuring cryptographic best practices.', 'CONTAINS', ARRAY['Key rotation limits exposure window.', 'Old key versions are retained for decryption.', 'Rotation does not re-encrypt existing data.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Logging & Monitoring
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'Logging and Monitoring';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'CloudTrail Purpose', 'FLAG_CAPTURE', 'Which AWS service records all API calls including who, when, and from where? Return the service name.', 'Identify the audit logging service.', 'AWS CloudTrail', 'EXACT', ARRAY['CloudTrail logs management plane API calls.', 'VPC Flow Logs capture network traffic.', 'AWS Config tracks resource configuration changes.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'GuardDuty Detection Type', 'SHORT_RESPONSE', 'What detection does GuardDuty perform? Give two examples. Answer in one sentence.', 'Explain GuardDuty capabilities.', 'GuardDuty performs anomaly-based and threat-intelligence detection, identifying threats like cryptocurrency mining, credential exfiltration through unusual API calls, and unauthorized access patterns.', 'CONTAINS', ARRAY['GuardDuty uses ML for anomaly detection.', 'It integrates threat intelligence feeds.', 'It monitors CloudTrail, VPC Flow Logs, and DNS logs.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Container Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'Module 6 -- Container Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Image Scanning Purpose', 'FLAG_CAPTURE', 'What is the primary security benefit of scanning container images in CI/CD before production? Return the concept.', 'Identify image scanning purpose.', 'Shift-left security / early vulnerability detection', 'CONTAINS', ARRAY['Scanning in CI/CD catches vulnerabilities before deployment.', 'Known CVEs in base images are a major attack vector.', 'Shift-left addresses security earlier in development.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Pod Security Admission', 'SHORT_RESPONSE', 'What is the difference between Pod Security Standards (PSS) and Pod Security Admission (PSA) in EKS? Answer in one sentence.', 'Compare PSS and PSA.', 'PSS defines three policy levels (Privileged, Baseline, Restricted) describing requirements, while PSA enforces these at admission time by rejecting violating pods.', 'CONTAINS', ARRAY['PSS defines security requirements.', 'PSA enforces requirements at admission.', 'PSA replaced PodSecurityPolicy.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Serverless Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'Module 7 -- Serverless Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Lambda IAM Requirement', 'FLAG_CAPTURE', 'A Lambda reads from S3 and writes to DynamoDB. What minimum IAM config does it need? Return the entity type.', 'Identify Lambda IAM requirements.', 'An IAM execution role with S3 read and DynamoDB write permissions', 'CONTAINS', ARRAY['Lambda functions assume an IAM role at execution.', 'The role should follow least privilege.', 'Execution role also controls CloudWatch Logs access.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Serverless Attack Surface', 'SHORT_RESPONSE', 'How does serverless attack surface differ from traditional applications? Answer in one sentence.', 'Compare serverless attack surfaces.', 'Serverless eliminates infrastructure risks but introduces function-level access control, event injection, insecure dependencies, and over-permissive IAM roles as new attack vectors.', 'CONTAINS', ARRAY['Serverless shifts some responsibilities to the provider.', 'Function-level permissions replace network controls.', 'Event injection is a serverless-specific attack.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Compliance
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'Module 8 -- Cloud Compliance';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'AWS Compliance Dashboard', 'FLAG_CAPTURE', 'Which AWS service provides a centralized compliance dashboard for PCI DSS, HIPAA, and SOC 2? Return the service name.', 'Identify the compliance service.', 'AWS Security Hub', 'EXACT', ARRAY['Security Hub aggregates findings from AWS services.', 'It maps findings to compliance controls.', 'AWS Artifact provides AWS compliance reports.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Config Rules Purpose', 'SHORT_RESPONSE', 'How do AWS Config rules help maintain compliance? Answer in one sentence.', 'Explain Config compliance automation.', 'Config rules continuously evaluate resource configurations against desired states, automatically detecting non-compliant resources for real-time compliance monitoring.', 'CONTAINS', ARRAY['Config rules run on resource changes.', 'Managed rules cover common requirements.', 'Custom rules use Lambda for complex evaluations.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Incident Response (Cloud)
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'Module 9 -- Incident Response in the Cloud';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Cloud Isolation Method', 'FLAG_CAPTURE', 'A compromised EC2 instance is communicating with C2. What is the fastest way to isolate it while preserving forensic evidence? Return the AWS action.', 'Identify cloud isolation technique.', 'Move the instance to an isolation security group with no inbound/outbound rules', 'CONTAINS', ARRAY['Security groups can be changed without stopping the instance.', 'Do not terminate the instance as it destroys evidence.', 'An isolation SG blocks all traffic.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Forensic Readiness Services', 'SHORT_RESPONSE', 'What three AWS services should be enabled BEFORE an incident for forensic readiness? Answer in one sentence.', 'Identify forensic readiness requirements.', 'CloudTrail for API audit logs, VPC Flow Logs for network traffic, and GuardDuty for threat detection should all be enabled before an incident.', 'CONTAINS', ARRAY['CloudTrail logs all API activity.', 'VPC Flow Logs capture network data.', 'GuardDuty provides threat intelligence.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Multi-Cloud Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Cloud Security & Hardening' AND l.title = 'Module 10 -- Multi-Cloud Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Multi-Cloud IAM Challenge', 'FLAG_CAPTURE', 'What is the primary security challenge of managing identities across AWS, Azure, and GCP? Return the challenge name.', 'Identify multi-cloud IAM challenge.', 'Identity federation and consistent policy enforcement', 'CONTAINS', ARRAY['Each cloud has its own IAM system.', 'Federation requires trust relationships.', 'Consistent policies prevent security gaps.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Multi-Cloud Logging Strategy', 'SHORT_RESPONSE', 'Why aggregate logs from all cloud providers into a single SIEM? Answer in one sentence.', 'Explain centralized multi-cloud logging.', 'A single SIEM provides cross-cloud correlation for detecting attacks spanning multiple providers and unified reporting for incident response and compliance.', 'CONTAINS', ARRAY['Native logging tools are provider-specific.', 'Cross-cloud correlation requires unified data.', 'A single pane of glass simplifies monitoring.'], 3, 30, true, 2, now(), now());
END $$;


-- ============================================================
-- 8. KUBERNETES ADMINISTRATION & SECURITY
-- ============================================================

-- Lesson: Architecture
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'Kubernetes Architecture';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'etcd Role', 'FLAG_CAPTURE', 'Which component stores all cluster state and is the single source of truth? No other component talks to it directly. Return the name.', 'Identify the etcd store.', 'etcd', 'EXACT', ARRAY['etcd is a distributed key-value store.', 'Only the API server communicates with etcd.', 'All cluster state including secrets is stored in etcd.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'kubectl Apply Flow', 'SHORT_RESPONSE', 'Describe the flow when you run kubectl apply -f deployment.yaml. Answer in 2-3 sentences.', 'Trace the kubectl apply flow.', 'kubectl sends YAML to the API server, which authenticates, authorizes via RBAC, validates schema, runs admission controllers, and stores in etcd. The deployment controller then creates a ReplicaSet which creates Pods.', 'CONTAINS', ARRAY['The API server is the entry point for all operations.', 'Authentication, authorization, and admission happen in sequence.', 'Controllers watch the API server for changes.'], 3, 35, true, 2, now(), now());
END $$;

-- Lesson: Pod Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'Pod Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SecurityContext Config', 'COMMAND_ANSWER', 'Write a Pod securityContext that runs as non-root UID 1000, sets fsGroup to 2000, and drops ALL capabilities. Return the YAML snippet.', 'Configure Pod security context.', 'securityContext:\n  runAsUser: 1000\n  fsGroup: 2000\n  runAsNonRoot: true\ncapabilities:\n  drop:\n    - ALL', 'CONTAINS', ARRAY['runAsUser sets the container UID.', 'fsGroup sets filesystem GID ownership.', 'runAsNonRoot prevents root execution.', 'Dropping ALL removes unnecessary kernel privileges.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'HostPath Risk', 'SHORT_RESPONSE', 'Why are hostPath volumes a security risk? Answer in one sentence.', 'Explain hostPath security risk.', 'hostPath mounts the node filesystem into the container, allowing access to sensitive host files like /etc/shadow or /var/run/docker.sock, potentially leading to node compromise.', 'CONTAINS', ARRAY['hostPath gives containers access to the node filesystem.', 'Sensitive files can be read or modified.', 'Use PersistentVolumes or emptyDir instead.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: RBAC
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'RBAC';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'RoleBinding vs ClusterRoleBinding', 'FLAG_CAPTURE', 'To grant a user read-only access to Pods only in the "development" namespace, which binding type should you use? Return the type.', 'Choose correct RBAC binding scope.', 'RoleBinding', 'EXACT', ARRAY['RoleBinding is namespace-scoped.', 'ClusterRoleBinding is cluster-scoped.', 'Use the narrowest scope for least privilege.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Minimal Deployment Role', 'COMMAND_ANSWER', 'Write a Role YAML allowing service account "deployer" to create, list, and get Deployments in "staging" namespace. Return the complete Role.', 'Write a minimal RBAC Role.', 'apiVersion: rbac.authorization.k8s.io/v1\nkind: Role\nmetadata:\n  name: deployment-role\n  namespace: staging\nrules:\n- apiGroups: ["apps"]\n  resources: ["deployments"]\n  verbs: ["create", "list", "get"]', 'CONTAINS', ARRAY['Use the apps API group for Deployments.', 'Only grant verbs actually needed.', 'Namespace the Role to the target namespace.'], 3, 35, true, 2, now(), now());
END $$;

-- Lesson: Network Policies
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'Network Policies';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Default Deny Policy', 'COMMAND_ANSWER', 'Write a NetworkPolicy that denies all ingress and egress to all pods in the "production" namespace. Return the complete resource.', 'Create default deny NetworkPolicy.', 'apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: default-deny-all\n  namespace: production\nspec:\n  podSelector: {}\n  policyTypes:\n  - Ingress\n  - Egress', 'CONTAINS', ARRAY['podSelector: {} selects all pods.', 'Specifying both Ingress and Egress blocks both directions.', 'Empty policyTypes means no traffic allowed.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Allow Specific Traffic', 'SHORT_RESPONSE', 'After default-deny, how do you allow API pods to connect to database pods on port 5432? Answer in one sentence.', 'Describe NetworkPolicy allow rule.', 'Create a NetworkPolicy targeting database pods that allows ingress from pods labeled as API on port 5432 TCP, with Ingress as the policyType.', 'CONTAINS', ARRAY['NetworkPolicy rules are additive.', 'Use podSelector to target protected pods.', 'Use ingress.from to specify allowed sources.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Secrets Management
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'Secrets Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Secret Encryption at Rest', 'FLAG_CAPTURE', 'K8s Secrets are base64-encoded but not encrypted by default. What must you enable for encryption at rest in etcd? Return the feature name.', 'Identify Secret encryption.', 'EncryptionConfiguration / KMS provider', 'CONTAINS', ARRAY['Kubernetes supports encryption at rest for Secrets.', 'KMS provider uses external key management.', 'Enable EncryptionConfiguration on the API server.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'External Secrets Advantage', 'SHORT_RESPONSE', 'Why use external secrets managers instead of native K8s Secrets? Answer in one sentence.', 'Compare external vs native secrets.', 'External managers provide encryption at rest, automatic rotation, access auditing, and fine-grained control that native Secrets do not offer, as K8s Secrets are only base64-encoded.', 'CONTAINS', ARRAY['Native K8s Secrets are base64-encoded, not encrypted.', 'External managers handle rotation and auditing.', 'Secrets Store CSI Driver mounts external secrets as volumes.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Image Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'Container Image Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Image Policy Webhook', 'FLAG_CAPTURE', 'Which admission controller enforces image signing and verification, rejecting pods with unsigned images? Return the name.', 'Identify image verification controller.', 'ImagePolicyWebhook', 'EXACT', ARRAY['ImagePolicyWebhook validates images at admission.', 'It checks image signatures against a trust policy.', 'It replaced PodSecurityPolicy image checks.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Image Registry Restriction', 'COMMAND_ANSWER', 'Write a container spec that only pulls images from registry.mycompany.com with imagePullPolicy Always. Return the container spec snippet.', 'Restrict image pull source.', 'containers:\n- name: app\n  image: registry.mycompany.com/myapp:v1.2.3\n  imagePullPolicy: Always', 'CONTAINS', ARRAY['Use fully qualified image references.', 'imagePullPolicy Always ensures latest image.', 'Combine with ImagePolicyWebhook for enforcement.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Cluster Hardening
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'Cluster Hardening';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'CIS Benchmark Tool', 'FLAG_CAPTURE', 'Which tool runs the CIS Kubernetes Benchmark and reports misconfigurations? Return the tool name.', 'Identify the K8s benchmark tool.', 'kube-bench', 'EXACT', ARRAY['kube-bench checks clusters against CIS benchmarks.', 'It runs as a Pod and tests configurations.', 'Fix critical and high findings first.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Audit Logging Policy', 'COMMAND_ANSWER', 'Write an audit policy that logs secrets at RequestResponse level and all other resources at Metadata level. Return the complete policy.', 'Configure API server audit logging.', 'apiVersion: audit.k8s.io/v1\nkind: Policy\nrules:\n- level: RequestResponse\n  resources:\n  - group: ""\n    resources: ["secrets"]\n- level: Metadata\n  resources:\n  - group: ""\n    resources: ["*"]', 'CONTAINS', ARRAY['Audit levels: None, Metadata, Request, RequestResponse.', 'RequestResponse logs headers, body, and response.', 'Secrets should always be logged at RequestResponse.'], 3, 35, true, 2, now(), now());
END $$;

-- Lesson: Monitoring
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'Monitoring and Logging';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Prometheus Gauge Metric', 'FLAG_CAPTURE', 'Which Prometheus metric type tracks values that go up and down, like CPU usage? Return the type.', 'Identify the correct metric type.', 'Gauge', 'EXACT', ARRAY['Counter only increases.', 'Gauge can increase or decrease.', 'Histogram and Summary track distributions.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Liveness vs Readiness', 'SHORT_RESPONSE', 'What happens when a liveness probe fails versus a readiness probe failure? Answer in one sentence.', 'Compare probe failures.', 'Liveness failure restarts the container; readiness failure removes the Pod from Service endpoints without restarting it.', 'CONTAINS', ARRAY['Liveness probe failure triggers restart.', 'Readiness failure removes Pod from endpoints.', 'Readiness recovery adds Pod back to endpoints.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Disaster Recovery
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'Disaster Recovery';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'etcd Backup Command', 'COMMAND_ANSWER', 'Write the etcdctl command to snapshot backup etcd to /backups/etcd-snapshot.db with TLS certificates. Return the full command.', 'Back up etcd with etcdctl.', 'etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /backups/etcd-snapshot.db', 'CONTAINS', ARRAY['etcdctl is the etcd command-line client.', 'TLS certificates are required for secure access.', 'Snapshot save creates a point-in-time backup.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Recovery Order', 'SHORT_RESPONSE', 'After complete cluster failure, what is the correct restoration sequence? Answer in one sentence.', 'Describe cluster recovery sequence.', 'Restore etcd from backup first, then restart API server, controller manager, scheduler, and finally redeploy application workloads from stored manifests.', 'CONTAINS', ARRAY['etcd is the foundation of cluster state.', 'Control plane must start before workloads.', 'Application workloads depend on healthy control plane.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Advanced Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Kubernetes Administration & Security' AND l.title = 'Advanced Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'OPA Gatekeeper Purpose', 'FLAG_CAPTURE', 'What is the purpose of OPA Gatekeeper in K8s? Return its function.', 'Identify OPA Gatekeeper role.', 'Policy-as-code admission control for Kubernetes', 'CONTAINS', ARRAY['Gatekeeper enforces custom policies at admission.', 'Policies are written in Rego.', 'It can enforce image registries, label requirements, and more.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Falco Runtime Security', 'FLAG_CAPTURE', 'Which tool monitors K8s runtime for suspicious activity like shell spawning and unexpected network connections? Return the tool name.', 'Identify runtime security tool.', 'Falco', 'EXACT', ARRAY['Falco is a cloud-native runtime security tool.', 'It uses system calls to detect anomalies.', 'It can alert or block suspicious behavior.'], 3, 25, true, 2, now(), now());
END $$;


-- ============================================================
-- 9. API DESIGN & SECURITY
-- ============================================================

-- Lesson: API Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'API Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'POST Success Code', 'FLAG_CAPTURE', 'After successfully creating a resource via POST, which HTTP status code should the API return? Return the code and name.', 'Identify the correct POST response code.', '201 Created', 'EXACT', ARRAY['200 is OK for retrieval.', '201 indicates a resource was created.', '202 is Accepted for async operations.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Stateless API Design', 'SHORT_RESPONSE', 'Why should REST APIs be stateless? Answer in one sentence.', 'Explain stateless API design.', 'Stateless APIs store no client state on the server, enabling any server instance to handle any request, which enables horizontal scaling, load balancing, and fault tolerance.', 'CONTAINS', ARRAY['Stateless means no server-side session state.', 'Each request must contain all needed information.', 'Statelessness enables horizontal scaling.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: RESTful Design
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'RESTful Design';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'RESTful URL Pattern', 'FLAG_CAPTURE', 'Which URL pattern is RESTful for deleting user 123: (A) POST /api/deleteUser/123, (B) DELETE /api/users/123, (C) POST /api/users/123/remove? Return the letter.', 'Identify RESTful URL pattern.', 'B', 'EXACT', ARRAY['REST uses HTTP methods for operations.', 'DELETE on a resource URL is correct.', 'URLs should be nouns, not verbs.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'HATEOAS Purpose', 'SHORT_RESPONSE', 'What is HATEOAS and why does it matter? Answer in one sentence.', 'Explain HATEOAS.', 'HATEOAS adds hypermedia links to API responses, allowing clients to navigate dynamically without hardcoded URLs, making the API discoverable and resilient to URL changes.', 'CONTAINS', ARRAY['HATEOAS adds hypermedia links to responses.', 'Clients follow links instead of constructing URLs.', 'It is the highest REST maturity level.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Authentication
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'Authentication';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'JWT Token Structure', 'FLAG_CAPTURE', 'A JWT has three Base64URL parts separated by dots. What are they in order? Return space-separated.', 'Identify JWT components.', 'Header Payload Signature', 'EXACT', ARRAY['Header specifies algorithm and token type.', 'Payload contains the claims.', 'Signature verifies token integrity.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'OAuth2 Recommended Flow', 'FLAG_CAPTURE', 'Which OAuth2 flow is recommended for server-side web apps that can store secrets? Return the flow name.', 'Identify the correct OAuth2 flow.', 'Authorization Code with PKCE', 'EXACT', ARRAY['Authorization Code is for server-side apps.', 'PKCE adds security against code interception.', 'Implicit flow is deprecated for most use cases.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Authorization
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'Authorization';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'RBAC vs ABAC', 'FLAG_CAPTURE', 'Which model grants permissions based on user attributes like department and time of day? Return the acronym.', 'Identify the attribute-based model.', 'ABAC', 'EXACT', ARRAY['RBAC assigns permissions through roles.', 'ABAC uses policies based on attributes.', 'ABAC provides more granular control.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Object-Level Authorization', 'SHORT_RESPONSE', 'A user is authenticated. How do you prevent them from accessing another user''s order by changing the order ID? Answer in one sentence.', 'Explain object-level authorization.', 'Implement checks verifying the authenticated user owns the specific resource before returning it, checking ownership in the database query or application logic.', 'CONTAINS', ARRAY['This prevents BOLA/IDOR vulnerabilities.', 'Check resource ownership against the authenticated user.', 'Never rely solely on authentication for access control.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Input Validation
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'Input Validation';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Validation Strategy', 'FLAG_CAPTURE', 'Should input validation happen client-side, server-side, or both? Which is the security boundary? Return the approach.', 'Identify where validation must occur.', 'Both, but server side is the security boundary', 'CONTAINS', ARRAY['Client-side validation is for UX, not security.', 'Server-side validation is the security boundary.', 'Attackers can bypass client-side validation entirely.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'SQL Injection Prevention', 'SHORT_RESPONSE', 'An API receives a user ID and queries the database. What is the primary defense against SQL injection? Answer in one sentence.', 'Identify SQL injection defense.', 'Use parameterized queries or prepared statements that separate SQL logic from user input, ensuring the database treats user data as values, not executable SQL.', 'CONTAINS', ARRAY['Parameterized queries prevent SQL injection.', 'Never concatenate user input into SQL strings.', 'ORMs typically use parameterized queries.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Error Handling
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'Error Handling';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Error Information Leak', 'FLAG_CAPTURE', 'An API error includes "SQLSTATE[42S02]: Table users does not exist in /app/db.php on line 42". What is leaked? Return the category.', 'Identify information leaks in errors.', 'Internal implementation details (file paths, database structure)', 'CONTAINS', ARRAY['Stack traces reveal internal file paths.', 'Database errors reveal table and schema names.', 'Production errors should return generic messages.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'RFC 7807 Error Format', 'FLAG_CAPTURE', 'Which RFC defines the Problem Details standard for API error responses? Return the number.', 'Identify the error format standard.', 'RFC 7807', 'EXACT', ARRAY['RFC 7807 defines a standard error response format.', 'It includes type, title, status, detail, and instance fields.', 'It provides consistent error handling across APIs.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: API Versioning
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'API Versioning';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Versioning Strategy', 'FLAG_CAPTURE', 'Which approach embeds the version in the URL path like /api/v2/users? Return the strategy name.', 'Identify URL versioning.', 'URL path versioning', 'EXACT', ARRAY['URL path versioning puts version in the URL.', 'Header versioning uses Accept headers.', 'Query parameter versioning uses ?version=2.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Backward Compatibility', 'SHORT_RESPONSE', 'You need to rename a field from "userName" to "name". How do you maintain backward compatibility? Answer in one sentence.', 'Maintain API compatibility.', 'Support both field names during a deprecation period, document the change, set a sunset date, and provide migration guides for consumers.', 'CONTAINS', ARRAY['Deprecation periods give clients time to migrate.', 'Returning both fields prevents breakage.', 'Sunset headers communicate deprecation timelines.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: GraphQL Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'GraphQL Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'GraphQL Depth Attack', 'FLAG_CAPTURE', 'An attacker crafts deeply nested queries: user { friends { friends { friends { ... } } } } to overwhelm the server. What is this attack? Return the name.', 'Identify the GraphQL attack.', 'Query depth attack / nested query attack', 'CONTAINS', ARRAY['GraphQL allows arbitrary query nesting.', 'Deep nesting can cause exponential processing.', 'Limit query depth to prevent this.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'GraphQL Security Measures', 'SHORT_RESPONSE', 'What are the three most important GraphQL security measures? List them in one sentence.', 'List GraphQL security measures.', 'Implement query depth limiting to prevent nested attacks, use persisted queries to reject arbitrary queries, and apply field-level authorization for granular access control.', 'CONTAINS', ARRAY['Query depth limiting prevents DoS.', 'Persisted queries only allow pre-approved documents.', 'Field-level authorization enforces granular access.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: API Testing
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'API Testing';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Contract Testing Purpose', 'FLAG_CAPTURE', 'What is the primary purpose of contract testing between frontend and backend? Return the concept.', 'Identify contract testing purpose.', 'Verify that API provider and consumer agree on data format and behavior', 'CONTAINS', ARRAY['Contract testing ensures API compatibility.', 'It prevents integration failures from API changes.', 'Pact is a popular contract testing tool.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'API Security Testing Tool', 'FLAG_CAPTURE', 'Which tool is commonly used for automated API security testing including OWASP Top 10? Return the tool name.', 'Identify API security testing tool.', 'OWASP ZAP or Burp Suite', 'CONTAINS', ARRAY['ZAP is an open-source API security scanner.', 'Burp Suite is a commercial penetration tool.', 'Both can test REST and GraphQL APIs.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: API Gateway
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'API Design & Security' AND l.title = 'API Gateway';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'API Gateway Function', 'FLAG_CAPTURE', 'What is the primary function of an API Gateway in microservices? Return its core purpose.', 'Identify API gateway role.', 'Single entry point handling authentication, rate limiting, and routing', 'CONTAINS', ARRAY['API Gateway is the front door to all services.', 'It offloads cross-cutting concerns.', 'It routes requests to appropriate backends.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Rate Limiting Design', 'SHORT_RESPONSE', 'How should an API Gateway implement rate limiting? Describe in one sentence.', 'Design API rate limiting.', 'Use a sliding window algorithm counting requests per API key within a time window, returning 429 Too Many Requests when exceeded, with configurable limits per tier.', 'CONTAINS', ARRAY['Rate limiting prevents abuse and DDoS.', 'Sliding window is more accurate than fixed windows.', 'Per-client limits prevent resource exhaustion.'], 3, 30, true, 2, now(), now());
END $$;


-- ============================================================
-- 10. AI ENGINEERING & MLOPS
-- ============================================================

-- Lesson: ML Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'ML Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Overfitting Identification', 'FLAG_CAPTURE', 'A model gets 99% training accuracy but 60% test accuracy. Is this overfitting or underfitting? Return the term.', 'Identify the model problem.', 'Overfitting', 'EXACT', ARRAY['Overfitting means the model memorizes training data.', 'Underfitting means the model is too simple.', 'High training with low test accuracy is overfitting.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Train/Test Split Purpose', 'SHORT_RESPONSE', 'Why split data into training and test sets? Answer in one sentence.', 'Explain train/test split.', 'A test set provides unbiased evaluation on unseen data, simulating real-world deployment where the model must generalize to new inputs.', 'CONTAINS', ARRAY['Testing on training data gives misleading accuracy.', 'The test set simulates unseen production data.', 'Cross-validation provides more robust evaluation.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: MLOps Pipeline
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'MLOps Pipeline';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Pipeline Stages', 'FLAG_CAPTURE', 'What are the five core MLOps pipeline stages in order? Return comma-separated.', 'Identify pipeline stages.', 'Data collection, model training, evaluation, deployment, monitoring', 'CONTAINS', ARRAY['Data collection and preprocessing come first.', 'Training follows data preparation.', 'Evaluation validates before deployment.', 'Monitoring ensures continued performance.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Feature Store Purpose', 'SHORT_RESPONSE', 'What problem does a feature store solve? Answer in one sentence.', 'Explain feature store purpose.', 'A feature store provides centralized computing, storing, and serving of ML features, ensuring consistency between training and serving and enabling feature reuse across teams.', 'CONTAINS', ARRAY['Feature stores prevent training-serving skew.', 'They enable feature sharing across teams.', 'Feast and Tecton are popular tools.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Model Training
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'Model Training';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Hyperparameter vs Parameter', 'FLAG_CAPTURE', 'What is the difference between model parameters (weights) and hyperparameters (learning rate)? Return the distinction.', 'Distinguish parameters from hyperparameters.', 'Parameters are learned from data during training, while hyperparameters are set before training and control the learning process.', 'CONTAINS', ARRAY['Parameters are optimized by the training algorithm.', 'Hyperparameters are configured by the engineer.', 'Grid search or Bayesian optimization tunes hyperparameters.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Cross-Validation', 'FLAG_CAPTURE', 'Which technique splits data into K folds, trains on K-1, validates on the remaining fold, rotating through all? Return the name.', 'Identify cross-validation method.', 'K-Fold Cross-Validation', 'EXACT', ARRAY['K-Fold splits data into K equal parts.', 'Each fold serves as validation once.', 'It provides more robust evaluation than a single split.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Model Deployment
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'Model Deployment';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Model Serving Framework', 'FLAG_CAPTURE', 'Which Facebook framework deploys ML models as REST/gRPC endpoints with versioning? Return the name.', 'Identify model serving framework.', 'TorchServe', 'EXACT', ARRAY['TorchServe is for PyTorch models.', 'TensorFlow Serving is for TensorFlow.', 'Both provide versioning and scaling.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Canary Model Deployment', 'SHORT_RESPONSE', 'How do you safely roll out a new ML model? Describe in one sentence.', 'Describe ML rollout strategy.', 'Use canary deployment to route a small percentage of traffic to the new model while monitoring key metrics, gradually increasing if healthy, rolling back immediately on degradation.', 'CONTAINS', ARRAY['Canary deployments limit blast radius.', 'Monitor prediction quality metrics, not just system metrics.', 'A/B testing compares model versions.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Model Monitoring
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'Model Monitoring';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Data Drift Definition', 'FLAG_CAPTURE', 'What is data drift? Return the definition.', 'Define data drift.', 'When statistical properties of production input data change compared to training data, causing model performance degradation.', 'CONTAINS', ARRAY['Data drift means input distributions shift.', 'It causes predictions to become less accurate.', 'Monitor feature distributions to detect drift.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Imbalanced Classification Metric', 'FLAG_CAPTURE', 'For fraud detection (100 frauds in 10,000 transactions), which metric matters most: accuracy, precision, or recall? Return the metric.', 'Select the right ML metric.', 'Recall', 'EXACT', ARRAY['Accuracy is misleading with imbalanced classes.', 'Recall measures how many actual frauds were caught.', 'Precision measures flagged-are-actually-fraud.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: ML Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'ML Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Adversarial Example Attack', 'FLAG_CAPTURE', 'Adding imperceptible noise to an image that causes misclassification is called what? Return the attack name.', 'Identify adversarial attack.', 'Adversarial example attack', 'CONTAINS', ARRAY['Adversarial examples are crafted inputs to fool models.', 'Perturbation is designed to be imperceptible.', 'FGSM and PGD are common attack methods.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Model Poisoning vs Adversarial', 'SHORT_RESPONSE', 'How does model poisoning differ from adversarial examples? Answer in one sentence.', 'Explain model poisoning.', 'Poisoning injects malicious data into training to manipulate learned behavior, while adversarial examples attack at inference time without changing the model.', 'CONTAINS', ARRAY['Poisoning targets the training phase.', 'Adversarial examples target inference.', 'Data validation helps prevent poisoning.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: ML Ethics
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'ML Ethics';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Bias Detection Technique', 'FLAG_CAPTURE', 'Which technique compares model performance across demographic groups to detect unfair bias? Return the analysis type.', 'Identify bias detection method.', 'Disparate impact analysis', 'CONTAINS', ARRAY['Disparate impact compares outcomes across groups.', 'Equal opportunity measures true positive rates per group.', 'Protected attributes are used for comparison.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Demographic Parity Metric', 'SHORT_RESPONSE', 'What does demographic parity require? Answer in one sentence.', 'Explain demographic parity.', 'Demographic parity requires equal positive prediction rates across all demographic groups, meaning the model recommends, approves, or flags at the same rate regardless of group.', 'CONTAINS', ARRAY['Demographic parity does not consider actual outcomes.', 'Equalized odds considers true and false positive rates.', 'Different fairness metrics can be mathematically incompatible.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: ML Infrastructure
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'ML Infrastructure';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'GPU Advantage for ML', 'FLAG_CAPTURE', 'Why are GPUs preferred over CPUs for training deep learning models? Return the hardware advantage.', 'Identify GPU advantage.', 'Massive parallel processing with thousands of cores for matrix operations', 'CONTAINS', ARRAY['GPUs have thousands of cores for parallel computation.', 'ML training involves large matrix multiplications.', 'CPUs are better for sequential preprocessing.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Experiment Tracking Tool', 'FLAG_CAPTURE', 'Which tool provides experiment tracking, model registry, and artifact logging for ML pipelines? Return the name.', 'Identify ML experiment tool.', 'MLflow', 'EXACT', ARRAY['MLflow tracks experiments, parameters, metrics, artifacts.', 'Weights & Biases is a commercial alternative.', 'DVC is a Git-based data versioning tool.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: ML Governance
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'ML Governance';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Model Registry Purpose', 'FLAG_CAPTURE', 'What is the primary purpose of a model registry? Return its function.', 'Identify model registry purpose.', 'Centralized versioning, metadata storage, and lifecycle management for trained models', 'CONTAINS', ARRAY['Model registry tracks model versions and metadata.', 'It manages development-to-production transitions.', 'It stores training data, hyperparameters, and metrics.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Model Card Contents', 'SHORT_RESPONSE', 'What information does a Model Card document? Answer in one sentence.', 'Explain model card contents.', 'A Model Card documents intended use, training data characteristics, performance across demographics, limitations, ethical considerations, and fairness evaluations for responsible deployment.', 'CONTAINS', ARRAY['Model Cards provide transparency about model behavior.', 'They document limitations and bias evaluations.', 'Google introduced the Model Card framework.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Production ML
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'AI Engineering & MLOps' AND l.title = 'Production ML';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'A/B Testing Purpose', 'FLAG_CAPTURE', 'What is the purpose of A/B testing when deploying a new ML model? Return the goal.', 'Identify A/B testing goal.', 'Statistically compare the new model''s performance against the current model with real user traffic', 'CONTAINS', ARRAY['A/B testing provides evidence-based comparison.', 'Random assignment prevents selection bias.', 'Statistical significance determines which model is better.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Rollback Triggers', 'SHORT_RESPONSE', 'What three metrics should trigger automatic model rollback in production? Answer in one sentence.', 'Identify rollback triggers.', 'Significant latency increase, error rate spike or prediction quality degradation, and data drift exceeding thresholds should all trigger automatic rollback.', 'CONTAINS', ARRAY['Latency increases indicate resource or model issues.', 'Error spikes indicate model failure.', 'Data drift means the model is outside its training distribution.'], 3, 30, true, 2, now(), now());
END $$;


-- ============================================================
-- 11. BLOCKCHAIN SECURITY & SMART CONTRACTS
-- ============================================================

-- Lesson: Blockchain Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'Blockchain Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Consensus Mechanism', 'FLAG_CAPTURE', 'In this mechanism, validators stake cryptocurrency and are chosen based on stake size. Which mechanism? Return the name.', 'Identify consensus mechanism.', 'Proof of Stake (PoS)', 'EXACT', ARRAY['Proof of Work uses computational power.', 'Proof of Stake uses staked cryptocurrency.', 'Delegated PoS involves voting for validators.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Immutability Mechanism', 'SHORT_RESPONSE', 'Why is blockchain immutable? Answer in one sentence.', 'Explain blockchain immutability.', 'Each block contains a cryptographic hash of the previous block, so altering any block changes its hash and breaks the chain, requiring recalculation of all subsequent blocks.', 'CONTAINS', ARRAY['Blocks are linked by cryptographic hashes.', 'Changing one block breaks all subsequent links.', 'Consensus mechanisms prevent unauthorized modifications.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Ethereum and Smart Contracts
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'Ethereum and Smart Contracts';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Gas Fee Purpose', 'FLAG_CAPTURE', 'Why does Ethereum charge gas fees? Return the primary purpose.', 'Explain gas fee purpose.', 'Prevent infinite loops and allocate computational resources fairly', 'CONTAINS', ARRAY['Gas limits prevent denial-of-service via infinite loops.', 'Gas fees compensate validators for computation.', 'Higher gas fees prioritize transaction inclusion.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Solidity Optimization Flag', 'FLAG_CAPTURE', 'Which Solidity compiler flag enables optimizations reducing runtime gas costs? Return the flag.', 'Identify optimization flag.', '--optimize', 'EXACT', ARRAY['--optimize enables the Yul optimizer.', 'It reduces runtime gas costs.', 'It may increase deployment gas costs.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Smart Contract Vulnerabilities
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'Smart Contract Vulnerabilities';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Reentrancy Attack', 'FLAG_CAPTURE', 'A contract sends ETH before updating its balance. The attacker''s fallback re-enters the withdrawal before the update. What vulnerability is this? Return the name.', 'Identify reentrancy vulnerability.', 'Reentrancy', 'EXACT', ARRAY['Reentrancy occurs when external calls execute before state updates.', 'The Checks-Effects-Interactions pattern prevents this.', 'The DAO hack was caused by reentrancy.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Integer Overflow', 'FLAG_CAPTURE', 'In Solidity 0.7.x, a uint8 with value 255 incremented by 1 produces what result? Return the value and vulnerability type.', 'Identify integer overflow.', 'Wraps to 0 (Integer Overflow)', 'CONTAINS', ARRAY['uint8 can hold values 0-255.', 'Incrementing past max wraps to 0.', 'Solidity 0.8+ has built-in overflow checks.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Contract Testing
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'Contract Testing';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Hardhat Framework', 'FLAG_CAPTURE', 'Which framework provides a local blockchain for testing smart contracts with time manipulation? Return the name.', 'Identify testing framework.', 'Hardhat', 'EXACT', ARRAY['Hardhat provides a local Ethereum network.', 'Truffle is an older alternative.', 'Foundry uses Solidity-native testing.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Formal Verification', 'SHORT_RESPONSE', 'What is formal verification for smart contracts? Answer in one sentence.', 'Explain formal verification.', 'Formal verification uses mathematical proofs to verify that a contract''s code behaves exactly according to its specification, providing certainty that properties hold for all possible inputs.', 'CONTAINS', ARRAY['Formal verification proves correctness mathematically.', 'It goes beyond testing specific inputs.', 'Tools like Certora and KEVM perform formal verification.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: DeFi Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'DeFi Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Flash Loan Attack', 'FLAG_CAPTURE', 'An attacker borrows millions in one transaction, manipulates a DEX price oracle, profits, and repays the loan atomically. What attack is this? Return the name.', 'Identify flash loan attack.', 'Flash loan attack', 'CONTAINS', ARRAY['Flash loans allow borrowing without collateral in one transaction.', 'Atomic means the entire transaction succeeds or fails together.', 'Price oracle manipulation is a common vector.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Oracle Manipulation Risk', 'SHORT_RESPONSE', 'Why are DeFi protocols relying on a single oracle vulnerable? Answer in one sentence.', 'Explain oracle manipulation risk.', 'A single oracle can be manipulated through flash loans or front-running, causing incorrect prices for liquidations or trades, leading to massive financial losses.', 'CONTAINS', ARRAY['Single oracle points of failure are dangerous.', 'Decentralized oracles like Chainlink reduce risk.', 'TWAP resists short-term manipulation.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Wallet Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'Wallet Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Seed Phrase Storage', 'FLAG_CAPTURE', 'A user stores their seed phrase in a password manager, a phone note, and cloud photo. How many methods are secure? Return the number.', 'Evaluate seed phrase storage.', 'Zero', 'EXACT', ARRAY['Seed phrases should never be stored digitally.', 'Use metal backup plates for physical storage.', 'Never photograph your seed phrase.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Hardware Wallet Security', 'SHORT_RESPONSE', 'How does a hardware wallet protect private keys? Answer in one sentence.', 'Explain hardware wallet security.', 'A hardware wallet stores keys in a secure enclave that never exposes them to the internet, signing transactions internally so the private key never leaves the device.', 'CONTAINS', ARRAY['Hardware wallets keep keys offline.', 'Transactions are signed on the device.', 'The private key never touches the internet.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Exchange Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'Exchange Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Hot vs Cold Storage', 'FLAG_CAPTURE', 'An exchange keeps 95% of funds in wallets never connected to the internet. What storage type is this? Return the type.', 'Identify wallet storage type.', 'Cold storage', 'EXACT', ARRAY['Hot wallets are connected to the internet.', 'Cold wallets are air-gapped.', 'Multi-sig cold storage requires multiple signatures.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Exchange Security Practice', 'SHORT_RESPONSE', 'What is the most critical practice to prevent a Mt. Gox-style loss? Answer in one sentence.', 'Identify critical exchange security.', 'Implement proof-of-reserves audits verifying customer deposits are fully backed and segregated, combined with multi-signature cold storage requiring multiple key holders for withdrawals.', 'CONTAINS', ARRAY['Proof-of-reserves proves funds are held.', 'Multi-sig prevents single points of failure.', 'Segregation prevents commingling.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Token Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'Token Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'ERC-20 Approval Risk', 'FLAG_CAPTURE', 'A user approves a DEX to spend 1000 USDC. The DEX is exploited. What risk does the approval create? Return the risk.', 'Identify token approval risk.', 'The attacker can drain all approved tokens via the allowance', 'CONTAINS', ARRAY['Token approvals grant spending permission.', 'Unlimited approvals expose all tokens.', 'Revoke unused approvals to minimize exposure.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'NFT Token Standard', 'FLAG_CAPTURE', 'Which standard is used for non-fungible tokens on Ethereum? Return the standard name.', 'Identify NFT standard.', 'ERC-721', 'EXACT', ARRAY['ERC-20 is for fungible tokens.', 'ERC-721 is for unique non-fungible tokens.', 'ERC-1155 supports both fungible and non-fungible.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: Governance Attacks
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'Governance Attacks';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Flash Loan Governance Attack', 'FLAG_CAPTURE', 'An attacker borrows governance tokens via flash loan, votes to drain the treasury, and returns tokens in one transaction. What attack is this? Return the name.', 'Identify the governance attack.', 'Flash loan governance attack', 'CONTAINS', ARRAY['Flash loans provide temporary voting power.', 'Governance systems counting snapshot votes are vulnerable.', 'Time-locked voting prevents flash loan governance attacks.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Governance Attack Prevention', 'SHORT_RESPONSE', 'How can a DAO prevent flash loan governance attacks? Answer in one or two sentences.', 'Explain governance attack prevention.', 'Implement time-lock mechanisms requiring tokens to be staked before voting, use snapshot-based voting with historical balances, and set quorum requirements making manipulation expensive.', 'CONTAINS', ARRAY['Time-locks require staked tokens for a period.', 'Snapshot voting uses historical balances.', 'Quorum requirements make attacks more expensive.'], 3, 30, true, 2, now(), now());
END $$;


-- ============================================================
-- 12. FULL-STACK JAVASCRIPT DEVELOPMENT
-- ============================================================

-- Lesson: JavaScript Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'JavaScript Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Closure Behavior', 'FLAG_CAPTURE', 'function outer() { let count = 0; return function inner() { count++; return count; }; } const c = outer(); console.log(c()); console.log(c()); What outputs? Return both numbers comma-separated.', 'Predict closure behavior.', '1, 2', 'EXACT', ARRAY['Closures capture variables from enclosing scope.', 'The inner function maintains access to count.', 'Each call increments the captured variable.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Promise vs Callback', 'SHORT_RESPONSE', 'What is the main advantage of Promises over callbacks? Answer in one sentence.', 'Compare Promises and callbacks.', 'Promises provide chaining via .then() and built-in error handling via .catch(), avoiding callback hell and making async code more readable.', 'CONTAINS', ARRAY['Promises support chaining.', 'Callbacks lead to deeply nested code.', 'async/await builds on Promises.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Node.js and Express
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'Node.js and Express';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Express Middleware Order', 'FLAG_CAPTURE', 'Why must body parsing middleware be registered BEFORE route handlers needing req.body? Return the reason.', 'Explain middleware execution order.', 'Express middleware executes in registration order, so body parsing must run before routes to populate req.body', 'CONTAINS', ARRAY['Express processes middleware in order.', 'Middleware modifies req before routes handle it.', 'If body parser runs after the route, req.body is undefined.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Express Route Parameters', 'COMMAND_ANSWER', 'Write an Express route for GET /api/users/:id that returns the ID as JSON with 200 status. Return the complete route handler.', 'Write an Express route with parameters.', 'app.get("/api/users/:id", (req, res) => { res.status(200).json({ id: req.params.id }); });', 'CONTAINS', ARRAY['Route parameters use colon prefix.', 'req.params contains route parameters.', 'res.json() sends a JSON response.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: React Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'React Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'useState Batching', 'FLAG_CAPTURE', 'What happens when you call setState multiple times in the same React function? Return the rendering behavior.', 'Predict React state batching.', 'React batches multiple setState calls into a single re-render', 'CONTAINS', ARRAY['React batches state updates for performance.', 'Multiple setState calls in the same handler produce one re-render.', 'useReducer is preferred for complex state.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'useEffect Cleanup', 'COMMAND_ANSWER', 'Write a useEffect that subscribes to WebSocket ws://localhost:3001 on mount and cleans up on unmount. Return the complete useEffect.', 'Write useEffect with cleanup.', 'useEffect(() => {\n  const ws = new WebSocket("ws://localhost:3001");\n  return () => ws.close();\n}, []);', 'CONTAINS', ARRAY['Empty dependency array [] runs once on mount.', 'The cleanup function runs on unmount.', 'Returning a function from useEffect defines cleanup.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Database Integration
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'Database Integration';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'N+1 Query Problem', 'FLAG_CAPTURE', 'Querying 100 posts and fetching each author separately results in 101 queries. What is this called? Return the name.', 'Identify the N+1 problem.', 'N+1 query problem', 'EXACT', ARRAY['N+1 queries happen when related data is fetched individually.', 'Use eager loading or joins to prevent this.', 'ORMs provide include/join methods to fix N+1.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Connection Pool Purpose', 'SHORT_RESPONSE', 'Why use a connection pool instead of new connections per request? Answer in one sentence.', 'Explain connection pooling.', 'Connection pooling reuses existing connections, reducing overhead, limiting total connections to prevent database overload, and improving performance.', 'CONTAINS', ARRAY['Creating connections is expensive.', 'Pools limit total concurrent connections.', 'pg-pool manages pools in Node.js.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Authentication
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'Authentication';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'JWT Token Lifetime', 'SHORT_RESPONSE', 'Why should JWT access tokens be short-lived while refresh tokens are long-lived? Answer in one sentence.', 'Explain token lifetime strategy.', 'Short-lived access tokens limit exposure if compromised, while long-lived refresh tokens allow obtaining new access tokens without re-authenticating.', 'CONTAINS', ARRAY['Access tokens are used for API authorization.', 'Refresh tokens obtain new access tokens.', 'Refresh tokens should be stored in httpOnly cookies.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Password Hashing Library', 'FLAG_CAPTURE', 'Which Node.js library is the recommended standard for password hashing with built-in salting? Return the name.', 'Identify hashing library.', 'bcrypt', 'EXACT', ARRAY['bcrypt is the standard for password hashing.', 'It includes automatic salting.', 'argon2 is a newer alternative.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: API Design
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'API Design';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'RESTful Endpoint', 'FLAG_CAPTURE', 'Which is correct for fetching comments on post 5: (A) GET /getComments?postId=5, (B) GET /api/posts/5/comments, (C) POST /api/comments/read? Return the letter.', 'Identify RESTful endpoint.', 'B', 'EXACT', ARRAY['REST uses resource-based URLs.', 'Nested resources show relationships.', 'GET method for retrieval, not POST.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Cursor Pagination', 'COMMAND_ANSWER', 'Write an Express route for GET /api/products with cursor-based pagination using a "cursor" query parameter and Prisma. Return the route handler.', 'Implement cursor-based pagination.', 'app.get("/api/products", async (req, res) => {\n  const { cursor } = req.query;\n  const products = await prisma.product.findMany({\n    take: 20,\n    skip: cursor ? 1 : 0,\n    cursor: cursor ? { id: cursor } : undefined,\n    orderBy: { id: "asc" }\n  });\n  res.json(products);\n});', 'CONTAINS', ARRAY['Cursor-based pagination uses a pointer to the last item.', 'skip: 1 skips the cursor item itself.', 'take limits the number of results.'], 3, 35, true, 2, now(), now());
END $$;

-- Lesson: Testing
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'Testing';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Test Pyramid Base', 'FLAG_CAPTURE', 'In the testing pyramid, which tests should be most numerous? Return the type.', 'Identify the test pyramid base.', 'Unit tests', 'EXACT', ARRAY['Unit tests are fast and cheap to write.', 'Integration tests verify component interactions.', 'E2E tests are slow and expensive.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Jest Mock Test', 'COMMAND_ANSWER', 'Write a Jest test that mocks fetch to return { name: "Alice" } and verifies a getUser function calls fetch with "/api/user/1". Return the complete test.', 'Write a Jest mock test.', 'test("getUser calls fetch correctly", async () => {\n  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ name: "Alice" }) }));\n  await getUser(1);\n  expect(fetch).toHaveBeenCalledWith("/api/user/1");\n});', 'CONTAINS', ARRAY['jest.fn() creates a mock function.', 'expect().toHaveBeenCalledWith() verifies the call.', 'Always clean up mocks in afterEach.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Deployment
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'Deployment';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Build-Time Env Prefix', 'FLAG_CAPTURE', 'In React, which env variable prefix is embedded at build time? Return the prefix.', 'Identify build-time env prefix.', 'REACT_APP_', 'EXACT', ARRAY['REACT_APP_ variables are embedded during build.', 'NEXT_PUBLIC_ is the prefix for Next.js.', 'Runtime variables require server-side rendering.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'SPA Fallback Routing', 'SHORT_RESPONSE', 'How should Express handle non-API routes for a React SPA? Answer in one sentence.', 'Configure SPA fallback routing.', 'Serve index.html for all non-API routes so React Router can handle client-side routing, using a catch-all route after API routes.', 'CONTAINS', ARRAY['SPA routing requires server-side fallback.', 'express.static serves the build directory.', 'The catch-all must come after API routes.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'CORS Purpose', 'FLAG_CAPTURE', 'What does CORS protect against? Return the security concept.', 'Explain CORS purpose.', 'Prevents unauthorized cross-origin HTTP requests from malicious websites accessing your API', 'CONTAINS', ARRAY['CORS restricts which origins can access your API.', 'Browsers enforce CORS on the client side.', 'The server sets Access-Control-Allow-Origin headers.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Helmet.js Middleware', 'FLAG_CAPTURE', 'Which Express middleware sets multiple HTTP security headers in a single config? Return the name.', 'Identify security header middleware.', 'Helmet', 'EXACT', ARRAY['Helmet sets security-related HTTP headers.', 'It configures CSP, HSTS, X-Frame-Options, etc.', 'It is a collection of security middleware.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: Performance
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Full-Stack JavaScript Development' AND l.title = 'Performance';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'React Memoization', 'FLAG_CAPTURE', 'Which React hook prevents unnecessary re-renders by memoizing component output? Return the hook name.', 'Identify memoization hook.', 'React.memo', 'EXACT', ARRAY['React.memo wraps a component for memoization.', 'useMemo memoizes values.', 'useCallback memoizes functions.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Redis Caching Benefit', 'SHORT_RESPONSE', 'How does Redis caching improve API performance? Answer in one sentence.', 'Explain Redis caching.', 'Redis stores frequently accessed data in memory, returning cached responses in microseconds instead of querying the database in milliseconds, reducing load and improving response times.', 'CONTAINS', ARRAY['Redis is an in-memory data store.', 'Cache hit avoids database queries entirely.', 'Set TTL to prevent serving stale data.'], 3, 25, true, 2, now(), now());
END $$;


-- ============================================================
-- 13. INFRASTRUCTURE AS CODE
-- ============================================================

-- Lesson: Infrastructure as Code Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'Infrastructure as Code Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Declarative vs Imperative', 'FLAG_CAPTURE', 'Which IaC approach describes the desired end state without specifying steps? Return the approach name.', 'Identify declarative IaC.', 'Declarative', 'EXACT', ARRAY['Declarative describes WHAT, not HOW.', 'Imperative describes exact steps.', 'Terraform and CloudFormation are declarative.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'State File Purpose', 'SHORT_RESPONSE', 'Why does Terraform need a state file? Answer in one sentence.', 'Explain Terraform state.', 'The state file maps real-world resources to configuration, tracking metadata like resource IDs and dependencies so Terraform knows what it manages and what changes to apply.', 'CONTAINS', ARRAY['State tracks the mapping between config and real resources.', 'It enables Terraform to plan changes.', 'Remote state enables team collaboration.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Terraform Basics
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'Terraform Basics';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Terraform Init Purpose', 'FLAG_CAPTURE', 'What does terraform init do? Return the primary purpose.', 'Identify terraform init.', 'Initializes the working directory by downloading providers and setting up the backend', 'CONTAINS', ARRAY['terraform init downloads provider plugins.', 'It configures the remote backend for state storage.', 'It must be run before plan or apply.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Terraform Plan Purpose', 'FLAG_CAPTURE', 'What does terraform plan show? Return its function.', 'Identify terraform plan.', 'Shows the execution plan: what will be created, modified, or destroyed without making any changes', 'CONTAINS', ARRAY['Plan is a dry-run of the apply.', 'It shows the diff between current state and desired state.', 'Review plan carefully before applying.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: Terraform Modules
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'Terraform Modules';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Module Purpose', 'FLAG_CAPTURE', 'What is the primary benefit of Terraform modules? Return the concept.', 'Identify module benefit.', 'Reusable, composable infrastructure components that encapsulate related resources', 'CONTAINS', ARRAY['Modules encapsulate related resources.', 'They enable reuse across environments.', 'They promote consistent infrastructure patterns.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Module Input Variables', 'SHORT_RESPONSE', 'How do Terraform modules receive configuration inputs? Answer in one sentence.', 'Explain module input variables.', 'Modules receive inputs through variable blocks defined in variables.tf, which are passed when calling the module and validated against types and constraints.', 'CONTAINS', ARRAY['Variables define module inputs.', 'Variable types enforce data format.', 'Default values make variables optional.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Terraform Workspaces
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'Terraform Workspaces';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Workspace Purpose', 'FLAG_CAPTURE', 'What is the purpose of Terraform workspaces? Return the concept.', 'Identify workspace purpose.', 'Managing multiple state files for the same configuration to support different environments', 'CONTAINS', ARRAY['Workspaces isolate state for different environments.', 'Each workspace has its own state file.', 'They use the same configuration with different variables.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Workspace vs Directory', 'SHORT_RESPONSE', 'What is the difference between using Terraform workspaces and separate directories for environments? Answer in one sentence.', 'Compare workspaces and directories.', 'Workspaces share the same configuration and differ only in state, while separate directories allow different configurations per environment but require code duplication or symlinks.', 'CONTAINS', ARRAY['Workspaces share configuration code.', 'Separate directories allow configuration differences.', 'Directories are often preferred for production isolation.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Pulumi
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'Pulumi';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Pulumi vs Terraform', 'FLAG_CAPTURE', 'What is the primary difference between Pulumi and Terraform? Return the key distinction.', 'Distinguish Pulumi from Terraform.', 'Pulumi uses general-purpose programming languages (TypeScript, Python, Go) instead of HCL for infrastructure definitions', 'CONTAINS', ARRAY['Pulumi uses real programming languages.', 'Terraform uses HCL (HashiCorp Configuration Language).', 'Pulumi enables loops, conditionals, and functions natively.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Pulumi State Management', 'SHORT_RESPONSE', 'How does Pulumi handle state management by default? Answer in one sentence.', 'Explain Pulumi state management.', 'Pulumi manages state in Pulumi Cloud by default, which provides encryption, access control, and team collaboration without requiring manual state file configuration.', 'CONTAINS', ARRAY['Pulumi Cloud is the default state backend.', 'Self-managed backends are also supported.', 'State is encrypted at rest.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Ansible
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'Ansible';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Agentless Architecture', 'FLAG_CAPTURE', 'What makes Ansible agentless? Return the mechanism.', 'Identify Ansible agentless design.', 'Ansible connects via SSH and executes modules on target hosts without requiring pre-installed agents', 'CONTAINS', ARRAY['Ansible uses SSH for connections.', 'No agent is installed on managed nodes.', 'PowerShell remoting is used for Windows targets.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Idempotency Concept', 'SHORT_RESPONSE', 'What does idempotency mean in Ansible and why is it important? Answer in one sentence.', 'Explain Ansible idempotency.', 'Idempotency means running the same playbook multiple times produces the same result, ensuring configurations are consistent and safe to re-run without side effects.', 'CONTAINS', ARRAY['Idempotent tasks can be run multiple times safely.', 'Ansible checks current state before making changes.', 'This prevents configuration drift.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: CloudFormation
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'CloudFormation';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Template Format', 'FLAG_CAPTURE', 'What format are CloudFormation templates written in? Return the format name.', 'Identify CloudFormation format.', 'YAML or JSON', 'EXACT', ARRAY['CloudFormation supports YAML and JSON.', 'YAML is more human-readable.', 'JSON is more compact.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Change Set Purpose', 'SHORT_RESPONSE', 'What is a CloudFormation change set? Answer in one sentence.', 'Explain change sets.', 'A change set shows what resources will be created, modified, or deleted before executing the update, allowing you to review changes before they are applied.', 'CONTAINS', ARRAY['Change sets are a preview of the update.', 'They do not make any changes until executed.', 'They help prevent accidental resource destruction.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Security in IaC
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'Security in Infrastructure as Code';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Secret Management in Terraform', 'FLAG_CAPTURE', 'How should you manage secrets in Terraform configuration? Return the recommended approach.', 'Identify secret management approach.', 'Use external secret managers (Vault, AWS Secrets Manager) with data sources, never hardcode secrets in .tf files', 'CONTAINS', ARRAY['Never commit secrets to version control.', 'Use data sources to fetch secrets at runtime.', 'Terraform Cloud has built-in secret management.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'IaC Security Scanning Tool', 'FLAG_CAPTURE', 'Which tool scans Terraform templates for security misconfigurations before deployment? Return the tool name.', 'Identify the IaC security scanner.', 'Checkov or tfsec', 'CONTAINS', ARRAY['Checkov scans IaC for compliance violations.', 'tfsec is a Terraform-specific security scanner.', 'Both integrate into CI/CD pipelines.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Testing IaC
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'Testing Infrastructure as Code';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Terratest Purpose', 'FLAG_CAPTURE', 'What is Terratest? Return its function.', 'Identify Terratest purpose.', 'A Go library for automated testing of Terraform infrastructure by deploying real resources and verifying they work correctly', 'CONTAINS', ARRAY['Terratest deploys real infrastructure for testing.', 'It verifies actual resource properties.', 'It cleans up resources after testing.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Plan Validation Test', 'SHORT_RESPONSE', 'Why should you run terraform plan as part of CI/CD before apply? Answer in one sentence.', 'Explain plan validation.', 'Running plan in CI/CD verifies that the configuration is syntactically valid, detects drift from expected state, and allows code review of infrastructure changes before they are applied to production.', 'CONTAINS', ARRAY['Plan catches syntax errors before apply.', 'It detects configuration drift.', 'Code review of plan output prevents mistakes.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: IaC at Scale
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Infrastructure as Code' AND l.title = 'Infrastructure as Code at Scale';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Terraform Cloud Purpose', 'FLAG_CAPTURE', 'What is the primary purpose of Terraform Cloud for teams? Return the function.', 'Identify Terraform Cloud purpose.', 'Centralized state management, collaboration, and workflow automation for team-based Terraform usage', 'CONTAINS', ARRAY['Terraform Cloud manages state centrally.', 'It provides run triggers and policy-as-code.', 'It enables team collaboration with locking.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Monorepo vs Polyrepo', 'SHORT_RESPONSE', 'What is the tradeoff between monorepo and polyrepo for managing multiple Terraform configurations? Answer in one sentence.', 'Compare monorepo and polyrepo.', 'Monorepos enable shared modules and consistent patterns across projects but increase coupling, while polyrepos provide isolation and independent deployment but risk code duplication.', 'CONTAINS', ARRAY['Monorepos simplify module sharing.', 'Polyrepos reduce blast radius.', 'Most teams use a hybrid approach.'], 3, 30, true, 2, now(), now());
END $$;


-- ============================================================
-- 14. LINUX KERNEL & SYSTEM INTERNALS
-- ============================================================

-- Lesson: How the Kernel Boots
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'How the Kernel Boots';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Boot Sequence Order', 'FLAG_CAPTURE', 'What is the correct order of the Linux boot process: (A) kernel init, (B) BIOS/UEFI, (C) init/systemd, (D) bootloader (GRUB)? Return the letters in order.', 'Identify the boot sequence.', 'B, D, A, C', 'EXACT', ARRAY['BIOS/UEFI runs first.', 'GRUB loads the kernel.', 'Kernel initializes hardware.', 'Init/systemd starts user space.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'GRUB Purpose', 'FLAG_CAPTURE', 'What is the primary function of GRUB in the boot process? Return its role.', 'Identify GRUB purpose.', 'Loads the Linux kernel into memory and passes boot parameters', 'CONTAINS', ARRAY['GRUB is the bootloader.', 'It presents a menu for kernel selection.', 'It loads the kernel and initramfs into memory.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: Process Management
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Process Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Process State Codes', 'FLAG_CAPTURE', 'In Linux process states, what does the "Z" state indicate and how is it different from "T"? Return both states.', 'Identify process states.', 'Z = zombie (terminated but not reaped), T = stopped (suspended by signal)', 'CONTAINS', ARRAY['Zombie processes have terminated but have an entry in the process table.', 'Stopped processes are suspended and can be resumed.', 'Only the parent can reap a zombie with wait().'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Fork vs Clone', 'SHORT_RESPONSE', 'What is the difference between fork() and clone() system calls? Answer in one sentence.', 'Compare fork and clone.', 'fork() creates a new process as a copy of the parent with a new PID, while clone() creates a new process that can share resources like memory, filesystem, and signals with the parent.', 'CONTAINS', ARRAY['fork() creates an independent copy.', 'clone() supports resource sharing flags.', 'clone() is used to implement threads.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Memory Management
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Memory Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Virtual Memory Purpose', 'FLAG_CAPTURE', 'What does virtual memory provide to each process? Return the concept.', 'Identify virtual memory purpose.', 'An isolated, contiguous address space that is mapped to physical memory on demand', 'CONTAINS', ARRAY['Virtual memory isolates processes from each other.', 'It provides the illusion of contiguous memory.', 'The MMU handles page table translations.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'OOM Killer Trigger', 'FLAG_CAPTURE', 'When does the Linux OOM killer activate? Return the specific condition.', 'Identify OOM killer trigger.', 'When the system exhausts physical memory and swap, and cannot allocate memory for a new process', 'CONTAINS', ARRAY['OOM killer is a last-resort mechanism.', 'It terminates processes to free memory.', 'dmesg shows which process was killed.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Filesystems
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Filesystems';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'VFS Layer Purpose', 'FLAG_CAPTURE', 'What is the role of the Virtual Filesystem (VFS) layer in the Linux kernel? Return its function.', 'Identify VFS purpose.', 'Provides a common interface that abstracts different filesystem implementations so all filesystems appear the same to user applications', 'CONTAINS', ARRAY['VFS is an abstraction layer between user space and filesystems.', 'It allows multiple filesystem types to coexist.', 'Ext4, XFS, Btrfs all go through VFS.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'ext4 vs XFS Comparison', 'SHORT_RESPONSE', 'What is the primary difference between ext4 and XFS filesystems? Answer in one sentence.', 'Compare ext4 and XFS.', 'ext4 is a general-purpose journaling filesystem optimized for small to medium files with flexible inode allocation, while XFS is optimized for large files and high-throughput I/O with a allocation group architecture.', 'CONTAINS', ARRAY['ext4 supports flexible inode counts.', 'XFS uses allocation groups for parallelism.', 'XFS performs better with large files.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: System Calls and the Kernel Interface
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'System Calls and the Kernel Interface';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'System Call Mechanism', 'FLAG_CAPTURE', 'What mechanism does a user-space program use to request kernel services? Return the mechanism name.', 'Identify the system call mechanism.', 'Software interrupt / syscall instruction', 'CONTAINS', ARRAY['System calls cross the user/kernel boundary.', 'The syscall instruction transfers control to the kernel.', 'The kernel validates parameters before executing.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'strace Purpose', 'FLAG_CAPTURE', 'What does the strace command do? Return its function.', 'Identify strace purpose.', 'Traces system calls made by a program, showing each call, its arguments, and return value', 'CONTAINS', ARRAY['strace intercepts system calls.', 'It helps diagnose program behavior.', 'ltrace traces library calls instead.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: Kernel Modules and eBPF
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Kernel Modules and eBPF';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Kernel Module Loading', 'COMMAND_ANSWER', 'Write the command to load the br_netfilter kernel module and verify it loaded. Return both commands.', 'Load and verify a kernel module.', 'modprobe br_netfilter && lsmod | grep br_netfilter', 'CONTAINS', ARRAY['modprobe loads a module and its dependencies.', 'lsmod lists loaded modules.', 'grep verifies the module is listed.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'eBPF Purpose', 'SHORT_RESPONSE', 'What is eBPF and why is it significant for Linux kernel observability? Answer in one sentence.', 'Explain eBPF significance.', 'eBPF allows running sandboxed programs in the kernel without modifying kernel source, enabling safe, high-performance observability, networking, and security tooling.', 'CONTAINS', ARRAY['eBPF runs verified programs in kernel space.', 'It is safer than kernel modules.', 'Tools like Cilium and Falco use eBPF.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Namespaces and Containers
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Namespaces and Containers';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Namespace Types', 'FLAG_CAPTURE', 'Which Linux namespace isolates the network stack (interfaces, routes, iptables)? Return the namespace type.', 'Identify the network namespace.', 'Network namespace (net)', 'EXACT', ARRAY['Each namespace type isolates a different resource.', 'PID namespace isolates process IDs.', 'Mount namespace isolates filesystem mounts.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Container vs VM', 'SHORT_RESPONSE', 'How do containers differ from virtual machines at the kernel level? Answer in one sentence.', 'Compare containers and VMs.', 'Containers share the host kernel and use namespaces and cgroups for isolation, while VMs run their own kernel on a hypervisor, providing stronger isolation but more overhead.', 'CONTAINS', ARRAY['Containers are kernel-level isolation.', 'VMs are hardware-level isolation.', 'Containers are lighter weight than VMs.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Device Drivers and Hardware
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Device Drivers and Hardware';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Device File Purpose', 'FLAG_CAPTURE', 'What is /dev/sda in Linux? Return the concept.', 'Identify device files.', 'A block device file that represents a physical disk, providing a file-based interface to access raw disk storage', 'CONTAINS', ARRAY['Device files are interfaces to hardware.', 'Block devices (/dev/sd*) are for disks.', 'Character devices (/dev/tty*) are for serial I/O.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'LSPCI Purpose', 'FLAG_CAPTURE', 'What does the lspci command show? Return its function.', 'Identify lspci purpose.', 'Lists all PCI devices connected to the system, showing device types, manufacturers, and driver information', 'CONTAINS', ARRAY['lspci shows PCI hardware devices.', 'lspci -v provides verbose details.', 'lspci -k shows kernel drivers in use.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: Performance Profiling and Tracing
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Performance Profiling and Tracing';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Flame Graph Purpose', 'FLAG_CAPTURE', 'What does a flame graph visualize in performance profiling? Return the concept.', 'Identify flame graph purpose.', 'CPU time distribution across the call stack, where wider bars indicate more time spent in a function and its callees', 'CONTAINS', ARRAY['Flame graphs visualize call stack profiles.', 'The x-axis is percentage of samples.', 'The y-axis is call stack depth.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Perf Command', 'COMMAND_ANSWER', 'Write the perf command to record CPU profiling data for 10 seconds on a running process with PID 1234. Return the command.', 'Record perf profiling data.', 'perf record -p 1234 -g -- sleep 10', 'CONTAINS', ARRAY['perf record captures profiling data.', '-p specifies the target PID.', '-g enables call graph recording.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Kernel Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Kernel Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SELinux Purpose', 'FLAG_CAPTURE', 'What is SELinux and what security model does it implement? Return the model name.', 'Identify SELinux security model.', 'Mandatory Access Control (MAC)', 'EXACT', ARRAY['SELinux implements MAC, not DAC.', 'MAC restricts access based on security labels.', 'DAC uses traditional Unix permissions.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'ASLR Purpose', 'SHORT_RESPONSE', 'What does Address Space Layout Randomization (ASLR) protect against? Answer in one sentence.', 'Explain ASLR purpose.', 'ASLR randomizes the memory addresses of key data areas (stack, heap, libraries) to prevent attackers from reliably predicting where to inject code or jump to exploit vulnerabilities.', 'CONTAINS', ARRAY['ASLR makes memory layout unpredictable.', 'It prevents return-to-libc and ROP attacks.', 'kernel.randomize_va_space controls ASLR.'], 3, 25, true, 2, now(), now());
END $$;


-- ============================================================
-- 15. MALWARE ANALYSIS & REVERSE ENGINEERING
-- ============================================================

-- Lesson: Malware Taxonomy
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'Malware Taxonomy';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Malware Type Identification', 'FLAG_CAPTURE', 'A piece of malware encrypts all user files and demands payment for the decryption key. What type of malware is this? Return the type name.', 'Identify the malware type.', 'Ransomware', 'EXACT', ARRAY['Ransomware encrypts files for ransom.', 'Trojans disguise as legitimate software.', 'Worms self-replicate across networks.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Malware Distribution Vector', 'FLAG_CAPTURE', 'An attacker sends emails with malicious Word documents that use macros to download additional payloads. What is the initial infection vector? Return the vector name.', 'Identify the infection vector.', 'Spear phishing with macro-enabled documents', 'CONTAINS', ARRAY['Phishing emails are a common delivery mechanism.', 'Macro documents use VBA to execute code.', 'The macro downloads the actual malware payload.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Safe Analysis Environment
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'Safe Analysis Environment';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Sandbox Isolation', 'FLAG_CAPTURE', 'What is the primary purpose of using a sandboxed virtual machine for malware analysis? Return the concept.', 'Identify sandbox purpose.', 'Isolate malware execution from the production network and host system', 'CONTAINS', ARRAY['Sandboxes prevent malware from spreading.', 'They allow safe observation of malware behavior.', 'Snapshots enable easy reset between analyses.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Anti-VM Detection', 'SHORT_RESPONSE', 'Why do some malware samples detect and evade virtual machines? Answer in one sentence.', 'Explain anti-VM detection.', 'Malware checks for VM-specific artifacts (VMware tools, virtual hardware, registry keys) to avoid analysis, since analysts typically use VMs for safe malware detonation.', 'CONTAINS', ARRAY['Malware checks for VM indicators.', 'Hardware differences can reveal VMs.', 'Anti-VM evasion is an anti-analysis technique.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Static Analysis
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'Static Analysis';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'PE File Header', 'FLAG_CAPTURE', 'In a Windows Portable Executable (PE) file, which header contains the magic number "MZ" that identifies it as a valid executable? Return the header name.', 'Identify the PE header.', 'DOS Header', 'EXACT', ARRAY['The DOS header is the first structure in a PE file.', 'It starts with the "MZ" magic bytes.', 'The PE header contains the actual PE signature.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'String Extraction Purpose', 'SHORT_RESPONSE', 'Why is extracting strings from a malware binary the first step in static analysis? Answer in one sentence.', 'Explain string extraction.', 'Strings reveal human-readable artifacts like file paths, URLs, registry keys, and error messages that provide immediate insight into malware functionality without running the code.', 'CONTAINS', ARRAY['Strings can reveal C2 URLs and IPs.', 'File paths indicate what the malware targets.', 'Error messages reveal developer intent.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Dynamic Analysis
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'Dynamic Analysis';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Process Monitor Purpose', 'FLAG_CAPTURE', 'Which tool captures real-time file system, registry, and process activity on Windows? Return the tool name.', 'Identify the monitoring tool.', 'Process Monitor (ProcMon)', 'EXACT', ARRAY['ProcMon monitors file, registry, and process activity.', 'It shows real-time system calls.', 'Wireshark monitors network activity instead.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Network IOC Extraction', 'SHORT_RESPONSE', 'During dynamic analysis, what network indicators should you extract from malware? Answer in one sentence.', 'Extract network IOCs.', 'Extract C2 server IP addresses and domains, DNS query patterns, HTTP User-Agent strings, and any data exfiltration protocols to build detection signatures.', 'CONTAINS', ARRAY['C2 infrastructure is a key IOC.', 'DNS patterns reveal beaconing behavior.', 'User-Agent strings can be used for detection.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: x86 Assembly
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'x86 Assembly';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Register Purpose', 'FLAG_CAPTURE', 'In x86 assembly, what is the primary purpose of the EAX register? Return its common role.', 'Identify the EAX register role.', 'Accumulator register used for function return values and arithmetic operations', 'CONTAINS', ARRAY['EAX holds function return values.', 'It is used for arithmetic operations.', 'ESP is the stack pointer.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Assembly Instruction', 'FLAG_CAPTURE', 'In x86 assembly, what does the "call" instruction do? Return the action.', 'Identify the call instruction.', 'Pushes the return address onto the stack and jumps to the target function address', 'CONTAINS', ARRAY['call pushes the return address.', 'ret pops the return address and jumps back.', 'jmp jumps without saving a return address.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Debugging
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'Debugging';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Breakpoint Purpose', 'FLAG_CAPTURE', 'What is the purpose of setting a breakpoint in a debugger? Return the function.', 'Identify breakpoint purpose.', 'Pause program execution at a specific instruction to inspect registers, memory, and call stack', 'CONTAINS', ARRAY['Breakpoints pause execution at a specific address.', 'They allow inspection of program state.', 'Hardware breakpoints use CPU debug registers.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Debugging Anti-Debug', 'SHORT_RESPONSE', 'How does malware detect it is being debugged? Give one example. Answer in one sentence.', 'Explain anti-debugging techniques.', 'Malware checks for debugger presence using techniques like IsDebuggerPresent(), timing checks (rdtsc), or breakpoint detection (int 3 scanning).', 'CONTAINS', ARRAY['IsDebuggerPresent() checks for a debugger.', 'Timing checks detect single-stepping.', 'Anti-debugging is an anti-analysis technique.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Reverse Engineering
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'Reverse Engineering';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'IDA Pro Purpose', 'FLAG_CAPTURE', 'What is IDA Pro and what is its primary function? Return its purpose.', 'Identify IDA Pro purpose.', 'A disassembler and debugger that converts binary code into assembly and decompiled C-like pseudocode for analysis', 'CONTAINS', ARRAY['IDA Pro is the industry-standard disassembler.', 'It provides both disassembly and decompilation.', 'Ghidra is a free alternative from the NSA.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Decompilation vs Disassembly', 'SHORT_RESPONSE', 'What is the difference between disassembly and decompilation? Answer in one sentence.', 'Compare disassembly and decompilation.', 'Disassembly converts machine code to assembly language, while decompilation attempts to reconstruct higher-level C-like pseudocode from the assembly or binary.', 'CONTAINS', ARRAY['Disassembly outputs assembly mnemonics.', 'Decompilation outputs C-like pseudocode.', 'Decompilation is lossy and not always accurate.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Anti-Analysis Techniques
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'Anti-Analysis Techniques';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Packer Identification', 'FLAG_CAPTURE', 'A malware binary is very small but downloads a large payload when executed. The binary has high entropy and few readable strings. What technique is being used? Return the technique name.', 'Identify the packing technique.', 'Packing / payload encryption', 'CONTAINS', ARRAY['Packers compress and encrypt the real payload.', 'High entropy indicates packed or encrypted data.', 'UPX is a common packer.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Code Obfuscation', 'SHORT_RESPONSE', 'What is control flow obfuscation in malware? Answer in one sentence.', 'Explain code obfuscation.', 'Control flow obfuscation modifies the program''s execution paths by adding fake branches, opaque predicates, and indirect jumps to make static analysis and reverse engineering more difficult.', 'CONTAINS', ARRAY['Obfuscation makes code harder to understand.', 'Opaque predicates always evaluate to true or false.', 'Deobfuscation tools can help还原 the original logic.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Malware Classification
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'Malware Classification';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'YARA Rule Purpose', 'FLAG_CAPTURE', 'What is the purpose of YARA rules in malware analysis? Return the concept.', 'Identify YARA rule purpose.', 'Pattern-matching rules that identify malware based on textual or binary patterns in files', 'CONTAINS', ARRAY['YARA rules match patterns in files.', 'They are used for malware classification.', 'They can match strings, hex patterns, and regular expressions.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Malware Hash Comparison', 'FLAG_CAPTURE', 'Why should you use fuzzy hashing (ssdeep) instead of MD5 when comparing malware samples? Return the reason.', 'Compare hashing methods.', 'Fuzzy hashing detects partial similarities between files, while MD5 only matches exact copies', 'CONTAINS', ARRAY['Fuzzy hashing detects similar variants.', 'MD5 produces different hashes for modified files.', 'ssdeep is designed for malware similarity detection.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Incident Response - Malware Extraction
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Malware Analysis & Reverse Engineering' AND l.title = 'Incident Response: Malware Extraction';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Evidence Collection Order', 'FLAG_CAPTURE', 'During malware incident response, what should you collect first: disk image, memory dump, or network capture? Return the collection order as a comma-separated list.', 'Identify evidence collection priority.', 'Memory dump, disk image, network capture', 'CONTAINS', ARRAY['Memory is volatile and lost on power off.', 'Disk image is less urgent than memory.', 'Network capture can be taken at any time during analysis.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Malware IOC Sharing Format', 'FLAG_CAPTURE', 'Which standard format is used for sharing threat intelligence indicators of compromise across organizations? Return the format name.', 'Identify IOC sharing format.', 'STIX (Structured Threat Information eXpression)', 'CONTAINS', ARRAY['STIX is an OASIS standard for threat intelligence.', 'TAXII is the transport protocol for STIX.', 'OpenIOC is another indicator format.'], 3, 25, true, 2, now(), now());
END $$;


-- ============================================================
-- 16. PRODUCT SECURITY ARCHITECTURE & SDL
-- ============================================================

-- Lesson: Security Engineering What It Is
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Security Engineering: What It Actually Is';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Security vs Functionality', 'FLAG_CAPTURE', 'What is the fundamental difference between a security engineer and a traditional software developer? Return the key distinction.', 'Identify the security engineering focus.', 'Security engineers design systems to withstand adversarial attacks, while developers focus on functionality and user experience', 'CONTAINS', ARRAY['Security engineers think like attackers.', 'They model threats and design defenses.', 'Security is a property of the system, not a feature.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'SDL Integration Point', 'SHORT_RESPONSE', 'When should security activities be integrated into the Software Development Lifecycle? Answer in one sentence.', 'Explain SDL timing.', 'Security must be integrated from the earliest design phase through deployment and maintenance, not as a final gate before release, to catch vulnerabilities when they are cheapest to fix.', 'CONTAINS', ARRAY['Shift-left security catches issues early.', 'Late-stage security reviews are expensive.', 'Security should be continuous throughout the SDLC.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Threat Modeling
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Threat Modeling';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'STRIDE Model Categories', 'FLAG_CAPTURE', 'What do the letters in STRIDE stand for in threat modeling? Return all six categories.', 'Identify STRIDE categories.', 'Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege', 'CONTAINS', ARRAY['STRIDE covers six threat categories.', 'Each maps to a security property.', 'Microsoft developed the STRIDE model.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Data Flow Diagram Purpose', 'SHORT_RESPONSE', 'What is the purpose of a Data Flow Diagram (DFD) in threat modeling? Answer in one sentence.', 'Explain DFD purpose.', 'A DFD maps how data moves through the system, identifying trust boundaries, data stores, and processes where threats can be systematically identified using STRIDE or other frameworks.', 'CONTAINS', ARRAY['DFDs visualize data flow and trust boundaries.', 'Trust boundaries are where privilege levels change.', 'Every data flow and store is a potential attack surface.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Secure Design Principles
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Secure Design Principles';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Least Privilege Principle', 'FLAG_CAPTURE', 'What does the principle of least privilege require for system design? Return the concept.', 'Identify least privilege.', 'Each component should have only the minimum permissions necessary to perform its function, nothing more', 'CONTAINS', ARRAY['Least privilege limits the blast radius of compromise.', 'It applies to users, processes, and services.', 'Default should be deny-all, then grant specific permissions.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Defense in Depth', 'SHORT_RESPONSE', 'What is defense in depth and how does it differ from relying on a single security control? Answer in one sentence.', 'Explain defense in depth.', 'Defense in depth layers multiple independent security controls so that if one layer is bypassed, others still protect the system, whereas a single control is a single point of failure.', 'CONTAINS', ARRAY['Multiple layers of security controls.', 'No single control is assumed to be sufficient.', 'Examples: firewall + IDS + encryption + access control.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Secure Code Review
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Secure Code Review';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Code Review Focus Areas', 'FLAG_CAPTURE', 'During a security code review, which areas receive the highest priority? Return the top three categories.', 'Identify code review priorities.', 'Authentication, authorization, input validation, and cryptographic operations', 'CONTAINS', ARRAY['Authentication and authorization are critical.', 'Input validation prevents injection attacks.', 'Cryptographic mistakes are often catastrophic.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'SAST vs DAST', 'FLAG_CAPTURE', 'What is the difference between SAST and DAST security testing? Return the distinction.', 'Distinguish SAST from DAST.', 'SAST analyzes source code without running it (white-box), while DAST tests the running application by sending malicious inputs (black-box)', 'CONTAINS', ARRAY['SAST = Static Application Security Testing.', 'DAST = Dynamic Application Security Testing.', 'SAST finds code-level issues; DAST finds runtime issues.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Security Automation
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Security Automation (SAST/DAST/SCA)';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SCA Tool Purpose', 'FLAG_CAPTURE', 'What does a Software Composition Analysis (SCA) tool do? Return its function.', 'Identify SCA purpose.', 'Identifies known vulnerabilities in open-source dependencies used by the application', 'CONTAINS', ARRAY['SCA tools scan dependency manifests (package.json, requirements.txt).', 'They match dependencies against vulnerability databases.', 'Dependabot, Snyk, and OWASP Dependency-Check are SCA tools.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'CI/CD Security Gate', 'SHORT_RESPONSE', 'How should security checks be integrated into a CI/CD pipeline? Answer in one sentence.', 'Explain CI/CD security integration.', 'Security scans (SAST, SCA, secret detection) should run as automated gates in the pipeline, blocking deployment when critical vulnerabilities are found, with results fed back to developers.', 'CONTAINS', ARRAY['Security gates block vulnerable code from deployment.', 'Automated scans provide fast feedback.', 'Critical findings should block the pipeline.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Authentication and Authorization
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Authentication and Authorization';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Authentication vs Authorization', 'FLAG_CAPTURE', 'What is the difference between authentication and authorization? Return the distinction.', 'Distinguish authentication from authorization.', 'Authentication verifies identity (who you are), while authorization determines permissions (what you can do)', 'CONTAINS', ARRAY['Authentication = identity verification.', 'Authorization = permission enforcement.', 'Authentication must happen before authorization.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Multi-Factor Authentication', 'SHORT_RESPONSE', 'Why is MFA more secure than passwords alone? Answer in one sentence.', 'Explain MFA security benefit.', 'MFA requires multiple independent factors (something you know, have, or are), so compromising one factor like a password does not grant access without the additional factor.', 'CONTAINS', ARRAY['MFA combines multiple factor types.', 'Password-only authentication is vulnerable to phishing.', 'TOTP, SMS, and hardware keys are common second factors.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Cryptography
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Cryptography: What You Actually Need';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Symmetric vs Asymmetric', 'FLAG_CAPTURE', 'What is the fundamental difference between symmetric and asymmetric cryptography? Return the distinction.', 'Distinguish symmetric from asymmetric.', 'Symmetric uses the same key for encryption and decryption, while asymmetric uses a public-private key pair', 'CONTAINS', ARRAY['Symmetric is faster but requires key distribution.', 'Asymmetric solves the key distribution problem.', 'TLS uses both: asymmetric for key exchange, symmetric for data.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Hash Function Purpose', 'FLAG_CAPTURE', 'What are the three security properties of a cryptographic hash function? Return them comma-separated.', 'Identify hash function properties.', 'Pre-image resistance, second pre-image resistance, collision resistance', 'CONTAINS', ARRAY['Pre-image resistance: cannot reverse the hash.', 'Second pre-image: cannot find a different input with same hash.', 'Collision resistance: cannot find any two inputs with same hash.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Incident Response
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Incident Response';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'IR Plan Components', 'FLAG_CAPTURE', 'What are the four essential components of an incident response plan? Return them comma-separated.', 'Identify IR plan components.', 'Preparation, Detection, Containment, Recovery', 'CONTAINS', ARRAY['Preparation happens before incidents.', 'Detection identifies when incidents occur.', 'Containment limits damage.', 'Recovery restores normal operations.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Tabletop Exercise Purpose', 'SHORT_RESPONSE', 'What is the purpose of tabletop exercises for incident response? Answer in one sentence.', 'Explain tabletop exercise value.', 'Tabletop exercises simulate realistic scenarios to identify gaps in the IR plan, communication processes, and team readiness without any actual damage or system changes.', 'CONTAINS', ARRAY['Tabletop exercises are low-cost readiness tests.', 'They reveal gaps before real incidents.', 'They should involve technical and non-technical teams.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Vulnerability Management
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Vulnerability Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'CVSS Score Purpose', 'FLAG_CAPTURE', 'What does the Common Vulnerability Scoring System (CVSS) measure? Return the concept.', 'Identify CVSS purpose.', 'A standardized severity rating for security vulnerabilities, scoring from 0 to 10 based on exploitability and impact', 'CONTAINS', ARRAY['CVSS scores range from 0 to 10.', 'It considers exploitability metrics and impact metrics.', 'Critical = 9.0-10.0, High = 7.0-8.9.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Patch Management Priority', 'SHORT_RESPONSE', 'How should you prioritize patching vulnerabilities? Answer in one sentence.', 'Explain patch prioritization.', 'Prioritize by CVSS score and exploitability, patching actively exploited critical vulnerabilities first, then high-severity issues, while using compensating controls for issues that cannot be immediately patched.', 'CONTAINS', ARRAY['Actively exploited vulnerabilities get highest priority.', 'CVSS severity guides the order.', 'Compensating controls mitigate risk while patching.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Security Architecture
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Product Security Architecture & SDL' AND l.title = 'Security Architecture';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Zero Trust Principle', 'FLAG_CAPTURE', 'What is the core principle of Zero Trust architecture? Return the concept.', 'Identify Zero Trust principle.', 'Never trust, always verify — every request is authenticated and authorized regardless of network location', 'CONTAINS', ARRAY['Zero Trust eliminates implicit trust.', 'Network location does not determine trust.', 'Microsegmentation and continuous verification are key.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Security Architecture Review', 'SHORT_RESPONSE', 'When should a security architecture review be conducted for a new product? Answer in one sentence.', 'Explain architecture review timing.', 'A security architecture review should be conducted during the initial design phase before any code is written, as architectural security decisions are the cheapest to make and most impactful.', 'CONTAINS', ARRAY['Early reviews prevent costly redesigns.', 'Architecture decisions are hard to change later.', 'Design reviews are part of the SDL.'], 3, 25, true, 2, now(), now());
END $$;


-- ============================================================
-- 17. PYTHON FOR CYBERSECURITY & AUTOMATION
-- ============================================================

-- Lesson: Python for Security Getting Started
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Python for Security: Getting Started';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Virtual Environment Purpose', 'FLAG_CAPTURE', 'Why should you create a virtual environment for each Python security project? Return the reason.', 'Identify venv purpose.', 'Isolates project dependencies to prevent conflicts between projects', 'CONTAINS', ARRAY['Virtual environments create isolated Python environments.', 'Each project can have its own package versions.', 'pip install -r requirements.txt installs in the active venv.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Requests Library', 'FLAG_CAPTURE', 'Which Python library is most commonly used for making HTTP requests in security scripts? Return the library name.', 'Identify the HTTP library.', 'requests', 'EXACT', ARRAY['requests is the standard HTTP library.', 'It supports GET, POST, and other methods.', 'urllib is the built-in alternative.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: Network Scanning
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Network Scanning';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Socket Programming', 'COMMAND_ANSWER', 'Write a Python script using the socket module that tests if port 443 is open on host example.com. Return the complete connection test code.', 'Write a socket port scanner.', 'import socket\nsock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\nsock.settimeout(2)\nresult = sock.connect_ex(("example.com", 443))\nif result == 0:\n    print("Port 443 is open")\nsock.close()', 'CONTAINS', ARRAY['socket.connect_ex() returns 0 on success.', 'Set a timeout to avoid hanging.', 'Always close the socket after testing.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Port Scanner Logic', 'SHORT_RESPONSE', 'How would you build a Python port scanner that scans ports 1-1024 on a target host? Describe the approach in one sentence.', 'Describe port scanner logic.', 'Iterate through ports 1-1024, attempt a TCP connection to each with a short timeout, record which ports return a successful connection, and report open ports.', 'CONTAINS', ARRAY['Use socket.connect_ex() for non-blocking connection attempts.', 'Set a short timeout (1-2 seconds) per port.', 'Use threading for faster scanning.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Packet Analysis
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Packet Analysis';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Scapy Packet Capture', 'COMMAND_ANSWER', 'Write a Python script using Scapy that captures the first 10 packets on interface eth0 and prints the source IP of each. Return the complete script.', 'Capture packets with Scapy.', 'from scapy.all import *\ndef process_packet(pkt):\n    print(pkt[IP].src)\nsniff(iface="eth0", count=10, prn=process_packet)', 'CONTAINS', ARRAY['sniff() captures packets from an interface.', 'count limits the number of packets.', 'prn specifies a callback function for each packet.'], 3, 35, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Packet Field Extraction', 'SHORT_RESPONSE', 'How do you extract the HTTP method and URI from a captured HTTP packet in Scapy? Answer in one sentence.', 'Extract HTTP fields from packet.', 'Access the HTTP layer using pkt[HTTP].Method and pkt[HTTP].Path after filtering for HTTP packets with pkt.haslayer(HTTP).', 'CONTAINS', ARRAY['Use haslayer() to check for specific protocols.', 'HTTP fields are accessible as attributes.', 'Filter with BPF or Scapy filters for efficiency.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Web Scraping for Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Web Scraping for Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'BeautifulSoup Parsing', 'COMMAND_ANSWER', 'Write a Python script using BeautifulSoup that extracts all links (href attributes) from an HTML page. Return the complete code.', 'Extract links with BeautifulSoup.', 'from bs4 import BeautifulSoup\nimport requests\nresp = requests.get("http://example.com")\nsoup = BeautifulSoup(resp.text, "html.parser")\nfor link in soup.find_all("a"):\n    print(link.get("href"))', 'CONTAINS', ARRAY['BeautifulSoup parses HTML documents.', 'find_all("a") finds all anchor tags.', 'get("href") extracts the href attribute.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Security Scraping Use Case', 'SHORT_RESPONSE', 'What are two legitimate cybersecurity use cases for web scraping? Answer in one sentence.', 'Identify security scraping use cases.', 'Web scraping is used for reconnaissance (gathering information about targets from public sources) and monitoring (checking for leaked credentials or exposed data on paste sites).', 'CONTAINS', ARRAY['OSINT gathering uses web scraping.', 'Credential leak monitoring scrapes paste sites.', 'Always get authorization before scanning targets.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Exploit Development Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Exploit Development Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Buffer Overflow Concept', 'FLAG_CAPTURE', 'What is a buffer overflow vulnerability and why is it exploitable? Return the concept.', 'Identify buffer overflow.', 'Writing data beyond the allocated buffer boundary overwrites adjacent memory, potentially corrupting return addresses or function pointers to redirect code execution', 'CONTAINS', ARRAY['Buffer overflow writes past allocated memory.', 'It can overwrite return addresses on the stack.', 'Python struct module can craft binary payloads.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Python Struct Module', 'COMMAND_ANSWER', 'Write Python code using the struct module to pack the value 0x41414141 as a 32-bit little-endian unsigned integer for a buffer overflow payload. Return the code.', 'Pack binary data with struct.', 'import struct\npayload = struct.pack("<I", 0x41414141)', 'CONTAINS', ARRAY['struct.pack() converts Python values to bytes.', '< specifies little-endian byte order.', 'I is the format for unsigned 32-bit integer.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Automation Scripts
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Automation Scripts';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Bulk Credential Checker', 'SHORT_RESPONSE', 'How would you build a Python script that checks multiple SSH credentials against a list of hosts? Describe the approach in one sentence.', 'Describe credential checker approach.', 'Use paramiko to attempt SSH connections with each username/password pair against each host, recording successes and failures while implementing rate limiting to avoid account lockouts.', 'CONTAINS', ARRAY['paramiko is the Python SSH library.', 'Implement rate limiting to avoid lockouts.', 'Always get authorization before testing.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Subprocess Usage', 'COMMAND_ANSWER', 'Write a Python script that runs the nmap command to scan ports 22, 80, and 443 on 192.168.1.1 and captures the output. Return the complete script.', 'Run system commands with subprocess.', 'import subprocess\nresult = subprocess.run(\n    ["nmap", "-p", "22,80,443", "192.168.1.1"],\n    capture_output=True, text=True\n)\nprint(result.stdout)', 'CONTAINS', ARRAY['subprocess.run() executes system commands.', 'capture_output=True captures stdout and stderr.', 'text=True returns strings instead of bytes.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Cryptography with Python
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Cryptography with Python';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Hash Comparison', 'COMMAND_ANSWER', 'Write a Python script that computes the SHA-256 hash of the string "password123" and prints it in hexadecimal format. Return the complete code.', 'Compute SHA-256 hash.', 'import hashlib\nhash_obj = hashlib.sha256("password123".encode())\nprint(hash_obj.hexdigest())', 'CONTAINS', ARRAY['hashlib provides cryptographic hash functions.', '.encode() converts string to bytes.', 'hexdigest() returns the hash as a hex string.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'AES Encryption', 'SHORT_RESPONSE', 'What is the recommended Python library for AES encryption and why? Answer in one sentence.', 'Identify the AES library.', 'The cryptography library is recommended because it provides a safe, high-level API for AES encryption with proper padding, mode selection, and key derivation, avoiding the pitfalls of lower-level implementations.', 'CONTAINS', ARRAY['The cryptography library is the standard.', 'cryptography.fernet provides simple symmetric encryption.', 'PyCryptodome is an alternative.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Forensics Scripts
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Forensics Scripts';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Metadata Extraction', 'COMMAND_ANSWER', 'Write a Python script using Pillow that extracts EXIF metadata from a JPEG image and prints all tags. Return the complete script.', 'Extract EXIF metadata.', 'from PIL import Image\nfrom PIL.ExifTags import TAGS\nimg = Image.open("photo.jpg")\nexif = img._getexif()\nif exif:\n    for tag_id, value in exif.items():\n        tag = TAGS.get(tag_id, tag_id)\n        print(f"{tag}: {value}")', 'CONTAINS', ARRAY['Pillow provides image processing capabilities.', '_getexif() returns the EXIF dictionary.', 'TAGS maps numeric IDs to human-readable names.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'File Hashing Script', 'COMMAND_ANSWER', 'Write a Python script that computes MD5, SHA-1, and SHA-256 hashes of a file and prints all three. Return the complete script.', 'Compute file hashes.', 'import hashlib\ndef hash_file(path):\n    results = {}\n    for algo in [hashlib.md5, hashlib.sha1, hashlib.sha256]:\n        h = algo()\n        with open(path, "rb") as f:\n            for chunk in iter(lambda: f.read(8192), b""):\n                h.update(chunk)\n        results[algo().name] = h.hexdigest()\n    return results\nprint(hash_file("evidence.bin"))', 'CONTAINS', ARRAY['Read files in chunks for memory efficiency.', 'Update the hash object with each chunk.', 'Use binary mode ("rb") for file reading.'], 3, 35, true, 2, now(), now());
END $$;

-- Lesson: Malware Analysis Scripts
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Malware Analysis Scripts';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'YARA Rule Matching', 'COMMAND_ANSWER', 'Write a Python script that uses the yara-python library to compile a YARA rule from a file and scan a target file, printing matches. Return the complete script.', 'Scan files with YARA.', 'import yara\nrules = yara.compile(filepath="malware_rules.yar")\nmatches = rules.match("suspicious_file.exe")\nfor match in matches:\n    print(f"Rule: {match.rule}")\n    print(f"Strings: {match.strings}")', 'CONTAINS', ARRAY['yara-python compiles and runs YARA rules.', 'match() scans a file for rule matches.', 'Strings found by each rule are included in results.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'PE File Analysis', 'SHORT_RESPONSE', 'Which Python library can you use to parse Windows PE files and extract imports, exports, and section information? Answer in one sentence.', 'Identify PE analysis library.', 'The pefile library provides a comprehensive API for parsing PE files, extracting headers, sections, imports, exports, and resources without needing to understand the raw binary format.', 'CONTAINS', ARRAY['pefile parses Windows PE files.', 'It provides access to all PE structures.', 'struct is used for low-level binary parsing.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Building Custom Security Tools
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Python for Cybersecurity & Automation' AND l.title = 'Building Custom Security Tools';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'CLI Argument Parsing', 'COMMAND_ANSWER', 'Write a Python script using argparse that accepts a --target (required) and --ports (default: 80) argument for a security scanning tool. Return the complete argparse setup.', 'Parse CLI arguments with argparse.', 'import argparse\nparser = argparse.ArgumentParser(description="Security Scanner")\nparser.add_argument("--target", required=True, help="Target host")\nparser.add_argument("--ports", default="80", help="Ports to scan")\nargs = parser.parse_args()', 'CONTAINS', ARRAY['argparse provides built-in argument parsing.', 'required=True makes an argument mandatory.', 'default sets the fallback value.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Logging Configuration', 'COMMAND_ANSWER', 'Write Python code that configures logging to write to both console and a file called scan.log, with timestamps and severity levels. Return the configuration code.', 'Configure security tool logging.', 'import logging\nlogging.basicConfig(\n    level=logging.INFO,\n    format="%(asctime)s %(levelname)s %(message)s",\n    handlers=[\n        logging.FileHandler("scan.log"),\n        logging.StreamHandler()\n    ]\n)', 'CONTAINS', ARRAY['basicConfig configures the root logger.', 'FileHandler writes to a file.', 'StreamHandler outputs to console.'], 3, 30, true, 2, now(), now());
END $$;


-- ============================================================
-- 18. QUANTUM COMPUTING & POST-QUANTUM CRYPTOGRAPHY
-- ============================================================

-- Lesson: Quantum Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Quantum Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Qubit vs Bit', 'FLAG_CAPTURE', 'What is the fundamental difference between a classical bit and a qubit? Return the distinction.', 'Distinguish qubit from bit.', 'A classical bit is either 0 or 1, while a qubit can exist in a superposition of both 0 and 1 simultaneously', 'CONTAINS', ARRAY['Qubits leverage quantum mechanical properties.', 'Superposition allows multiple states at once.', 'Measurement collapses the superposition to 0 or 1.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Quantum Entanglement', 'SHORT_RESPONSE', 'What is quantum entanglement and why is it important for quantum computing? Answer in one sentence.', 'Explain quantum entanglement.', 'Entanglement links two qubits so that the state of one instantly determines the state of the other regardless of distance, enabling quantum algorithms to process correlated information in ways classical computers cannot.', 'CONTAINS', ARRAY['Entanglement creates correlations between qubits.', 'It enables quantum teleportation of states.', 'It is a resource for quantum algorithms.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Quantum Gates
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Quantum Gates';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Hadamard Gate Effect', 'FLAG_CAPTURE', 'What does the Hadamard (H) gate do to a qubit? Return the effect.', 'Identify the Hadamard gate effect.', 'Puts a qubit into an equal superposition of |0> and |1>', 'CONTAINS', ARRAY['H gate creates superposition.', 'H|0> = (|0> + |1>)/sqrt(2).', 'H|1> = (|0> - |1>)/sqrt(2).'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'CNOT Gate Purpose', 'FLAG_CAPTURE', 'What is the purpose of the CNOT (Controlled-NOT) gate? Return its function.', 'Identify CNOT gate purpose.', 'A two-qubit gate that flips the target qubit if and only if the control qubit is |1>', 'CONTAINS', ARRAY['CNOT creates entanglement between qubits.', 'It is the quantum equivalent of XOR.', 'It is a fundamental gate for quantum algorithms.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Quantum Algorithms
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Quantum Algorithms';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Shor Algorithm Threat', 'FLAG_CAPTURE', 'Which quantum algorithm threatens RSA and ECC cryptography by factoring large numbers efficiently? Return the algorithm name.', 'Identify the threat algorithm.', 'Shor''s algorithm', 'EXACT', ARRAY['Shor''s algorithm factors large integers efficiently.', 'It threatens public-key cryptography.', 'Grover''s algorithm threatens symmetric cryptography.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Grover Algorithm Speedup', 'FLAG_CAPTURE', 'What speedup does Grover''s algorithm provide for unstructured search problems? Return the speedup factor.', 'Identify Grover''s speedup.', 'Quadratic speedup (O(sqrt(N)) vs O(N))', 'CONTAINS', ARRAY['Grover''s algorithm provides quadratic speedup.', 'It searches unstructured databases faster.', 'It halves the effective key length of symmetric ciphers.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Cryptographic Threats
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Cryptographic Threats';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Harvest Now Decrypt Later', 'FLAG_CAPTURE', 'What is the "harvest now, decrypt later" threat? Return the concept.', 'Identify the HNDL threat.', 'Adversaries collect encrypted data now with the intention of decrypting it when quantum computers become powerful enough', 'CONTAINS', ARRAY['HNDL threatens data that must remain confidential long-term.', 'It targets data encrypted today with RSA/ECC.', 'Post-quantum cryptography mitigates this threat.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Quantum Threat Timeline', 'SHORT_RESPONSE', 'Why is the timeline for quantum threats to cryptography uncertain? Answer in one sentence.', 'Explain threat timeline uncertainty.', 'The development of a cryptographically relevant quantum computer depends on solving significant engineering challenges like error correction and qubit stability that have no guaranteed timeline.', 'CONTAINS', ARRAY['Quantum computing is still in early stages.', 'Error correction is a major unsolved challenge.', 'NIST is standardizing post-quantum algorithms now.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Post-Quantum Algorithms
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Post-Quantum Algorithms';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'NIST PQC Standards', 'FLAG_CAPTURE', 'Which NIST-selected algorithm is based on lattice problems for key encapsulation? Return the algorithm name.', 'Identify the NIST PQC algorithm.', 'CRYSTALS-Kyber (ML-KEM)', 'EXACT', ARRAY['CRYSTALS-Kyber is a lattice-based KEM.', 'CRYSTALS-Dilithium is for digital signatures.', 'NIST standardized these in 2024.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Lattice-Based Crypto', 'SHORT_RESPONSE', 'Why are lattice-based cryptographic algorithms considered resistant to quantum attacks? Answer in one sentence.', 'Explain lattice-based security.', 'Lattice problems like Learning With Errors (LWE) have no known efficient quantum algorithm to solve them, unlike factoring and discrete logarithm which Shor''s algorithm breaks.', 'CONTAINS', ARRAY['Lattice problems are hard for both classical and quantum computers.', 'Shor''s algorithm does not apply to lattice problems.', 'Lattice crypto is efficient and versatile.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Key Exchange
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Key Exchange';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Quantum Key Distribution', 'FLAG_CAPTURE', 'What is the fundamental security guarantee of Quantum Key Distribution (QKD)? Return the concept.', 'Identify QKD security guarantee.', 'Any attempt to eavesdrop on the quantum channel is detectable because measurement disturbs the quantum state', 'CONTAINS', ARRAY['QKD uses quantum mechanics for key exchange.', 'Eavesdropping causes detectable disturbance.', 'BB84 is the most well-known QKD protocol.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Hybrid Key Exchange', 'SHORT_RESPONSE', 'What is hybrid key exchange and why is it recommended during the transition to post-quantum cryptography? Answer in one sentence.', 'Explain hybrid key exchange.', 'Hybrid key exchange combines a classical algorithm (like ECDH) with a post-quantum algorithm (like Kyber), providing security against both classical and quantum attacks during the transition period.', 'CONTAINS', ARRAY['Hybrid approaches combine classical and post-quantum.', 'They provide security even if one algorithm is broken.', 'TLS 1.3 supports hybrid key exchange.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Digital Signatures
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Digital Signatures';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Post-Quantum Signature', 'FLAG_CAPTURE', 'Which NIST-selected post-quantum signature algorithm is based on hash functions? Return the algorithm name.', 'Identify the hash-based signature.', 'SPHINCS+ (SLH-DSA)', 'EXACT', ARRAY['SPHINCS+ is a hash-based signature scheme.', 'It has conservative security assumptions.', 'CRYSTALS-Dilithium is lattice-based instead.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Signature Size Impact', 'SHORT_RESPONSE', 'How do post-quantum digital signature sizes compare to RSA and ECDSA? Answer in one sentence.', 'Compare signature sizes.', 'Post-quantum signatures are generally larger than RSA and ECDSA, with some schemes producing signatures several kilobytes in size, which impacts bandwidth and storage requirements.', 'CONTAINS', ARRAY['Post-quantum signatures are larger.', 'SPHINCS+ signatures are especially large.', 'Signature size is a tradeoff for quantum resistance.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Migration
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Migration';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Crypto Inventory Purpose', 'FLAG_CAPTURE', 'What is a cryptographic inventory and why is it the first step in PQC migration? Return the concept.', 'Identify crypto inventory purpose.', 'A complete catalog of all cryptographic algorithms, keys, and certificates used across the organization, identifying what needs to be migrated to post-quantum algorithms', 'CONTAINS', ARRAY['You cannot migrate what you do not know.', 'Inventory identifies all crypto usage.', 'It maps algorithms to data sensitivity and lifetime.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Migration Priority', 'SHORT_RESPONSE', 'How should you prioritize which systems to migrate to post-quantum cryptography first? Answer in one sentence.', 'Explain migration prioritization.', 'Prioritize systems protecting data with long confidentiality requirements (like medical records or state secrets) and systems using vulnerable algorithms (like RSA key exchange) for immediate hybrid migration.', 'CONTAINS', ARRAY['Long-lived data needs protection earliest.', 'RSA key exchange is most vulnerable to Shor''s.', 'Low-risk systems can migrate later.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Implementation
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Implementation';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'liboqs Library', 'FLAG_CAPTURE', 'Which open-source library provides implementations of all NIST post-quantum algorithms? Return the library name.', 'Identify the PQC library.', 'liboqs (Open Quantum Safe)', 'EXACT', ARRAY['liboqs is part of the Open Quantum Safe project.', 'It provides C implementations of PQC algorithms.', 'oqs-provider adds PQC to OpenSSL.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'TLS PQC Integration', 'SHORT_RESPONSE', 'How can you enable post-quantum key exchange in TLS today? Answer in one sentence.', 'Enable PQC in TLS.', 'Use a hybrid key exchange by configuring your TLS library (like OpenSSL with oqs-provider) to combine X25519 with Kyber-768 for the key exchange, providing both classical and post-quantum security.', 'CONTAINS', ARRAY['Hybrid key exchange is available today.', 'OpenSSL supports PQC via oqs-provider.', 'Cloudflare and Google have deployed PQC in TLS.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Future
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Quantum Computing & Post-Quantum Cryptography' AND l.title = 'Future';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Quantum Computing Benefit', 'FLAG_CAPTURE', 'Besides breaking cryptography, what is a positive application of quantum computing in security? Return the application.', 'Identify quantum security benefit.', 'Quantum random number generation for truly unpredictable cryptographic keys', 'CONTAINS', ARRAY['QRNG produces truly random numbers.', 'Classical RNG is pseudorandom.', 'Quantum simulation can also improve drug discovery.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Crypto-Agility Concept', 'SHORT_RESPONSE', 'What is crypto-agility and why is it important? Answer in one sentence.', 'Explain crypto-agility.', 'Crypto-agility is the ability to quickly swap cryptographic algorithms in a system without major code changes, enabling rapid response to new threats like quantum computing breaking current algorithms.', 'CONTAINS', ARRAY['Crypto-agility means easy algorithm replacement.', 'It avoids vendor lock-in to specific algorithms.', 'Design systems with swappable crypto components.'], 3, 25, true, 2, now(), now());
END $$;


-- ============================================================
-- 19. SITE RELIABILITY ENGINEERING
-- ============================================================

-- Lesson: SRE Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'SRE Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Error Budget Concept', 'FLAG_CAPTURE', 'What is an error budget in SRE? Return the concept.', 'Identify the error budget.', 'The acceptable amount of unreliability (downtime or errors) that a service can have before triggering a feature freeze', 'CONTAINS', ARRAY['Error budgets quantify acceptable unreliability.', 'They balance reliability with feature velocity.', 'When the budget is spent, reliability work takes priority.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'SRE vs Traditional Ops', 'SHORT_RESPONSE', 'What is the fundamental difference between SRE and traditional operations? Answer in one sentence.', 'Compare SRE and traditional ops.', 'SRE treats operations as a software engineering problem, using automation, code, and data-driven decisions instead of manual processes and tribal knowledge.', 'CONTAINS', ARRAY['SRE applies software engineering to operations.', 'It automates away manual toil.', 'SRE focuses on measurable reliability targets.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: SLIs, SLOs, SLAs
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'SLIs, SLOs, SLAs';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SLI vs SLO vs SLA', 'FLAG_CAPTURE', 'What is the difference between an SLI, SLO, and SLA? Return the three definitions.', 'Distinguish SLI, SLO, SLA.', 'SLI = what you measure (latency, availability), SLO = the target you set (99.9%), SLA = the contractual commitment with consequences', 'CONTAINS', ARRAY['SLIs are the actual metrics.', 'SLOs are internal targets.', 'SLAs are external agreements with penalties.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Availability Calculation', 'FLAG_CAPTURE', 'A service has an SLO of 99.95% availability. How many minutes of downtime per month is this? Return the number.', 'Calculate downtime from SLO.', '21.6 minutes', 'CONTAINS', ARRAY['99.95% availability means 0.05% downtime.', '30 days = 43,200 minutes.', '0.05% of 43,200 = 21.6 minutes.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Toil Reduction
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'Toil Reduction';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Toil Definition', 'FLAG_CAPTURE', 'What is toil in SRE? Return the definition.', 'Define toil.', 'Manual, repetitive, automatable, tactical work that has no enduring value and scales linearly with service growth', 'CONTAINS', ARRAY['Toil is work that can be automated.', 'It is tactical, not strategic.', 'Scaling linearly means more service = more toil.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Toil Measurement', 'SHORT_RESPONSE', 'How should you measure and track toil in an SRE team? Answer in one sentence.', 'Explain toil measurement.', 'Track toil as a percentage of total engineering time using time tracking and categorization, setting targets to reduce toil below 50% and reviewing it regularly in team meetings.', 'CONTAINS', ARRAY['Measure toil as percentage of engineering time.', 'Set reduction targets.', 'Review toil metrics in team retrospectives.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Change Management
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'Change Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Canary Release Purpose', 'FLAG_CAPTURE', 'What is the purpose of canary releases in SRE? Return the goal.', 'Identify canary release purpose.', 'Gradually roll out changes to a small subset of users first to detect problems before they affect everyone', 'CONTAINS', ARRAY['Canary releases limit blast radius.', 'They provide real-world validation.', 'Automated rollback triggers on error rate increases.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Rollback Strategy', 'SHORT_RESPONSE', 'When should you rollback a deployment vs investigate and fix forward? Answer in one sentence.', 'Explain rollback decision.', 'Rollback immediately when the error rate exceeds the SLO or when customer-facing functionality is broken; investigate and fix forward only when the issue is minor and contained.', 'CONTAINS', ARRAY['Rollbacks should be fast and automated.', 'Fix-forward is acceptable for minor issues.', 'Always have a tested rollback procedure.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Capacity Planning
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'Capacity Planning';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Utilization Target', 'FLAG_CAPTURE', 'What CPU utilization target should SREs maintain for headroom? Return the target percentage.', 'Identify the utilization target.', '60-70% average utilization to allow headroom for traffic spikes', 'CONTAINS', ARRAY['Running at 100% leaves no headroom.', '60-70% allows for traffic spikes.', 'Auto-scaling should trigger before 80%.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Capacity Forecasting', 'SHORT_RESPONSE', 'How do you forecast capacity needs for a growing service? Answer in one sentence.', 'Explain capacity forecasting.', 'Analyze historical usage trends, project growth rates, add buffer for unexpected spikes, and plan procurement lead times to ensure capacity is available before demand arrives.', 'CONTAINS', ARRAY['Historical trends inform projections.', 'Buffer capacity handles unexpected growth.', 'Procurement lead times affect timing.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Performance Optimization
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'Performance Optimization';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Latency Percentile', 'FLAG_CAPTURE', 'Why should SREs track p99 latency instead of average latency? Return the reason.', 'Explain percentile vs average.', 'Average latency hides tail latency outliers that affect a small but significant percentage of users', 'CONTAINS', ARRAY['Average smooths out extremes.', 'p99 shows what the slowest 1% of users experience.', 'p50 (median) shows typical experience.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Performance Bottleneck', 'SHORT_RESPONSE', 'How do you systematically identify performance bottlenecks in a distributed system? Answer in one sentence.', 'Describe bottleneck identification.', 'Use distributed tracing to measure latency at each service hop, identify the component with the highest latency contribution, and profile that component to find the specific resource constraint.', 'CONTAINS', ARRAY['Distributed tracing shows latency across services.', 'The highest latency hop is the bottleneck.', 'CPU, memory, I/O, and network are common constraints.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Incident Management
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'Incident Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Incident Severity Levels', 'FLAG_CAPTURE', 'What criteria should determine incident severity levels in SRE? Return the primary factor.', 'Identify severity criteria.', 'Impact on users and the SLO, not internal technical severity', 'CONTAINS', ARRAY['Severity should be based on user impact.', 'SLO burn rate determines urgency.', 'Internal metrics alone are insufficient.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Incident Commander Role', 'SHORT_RESPONSE', 'What is the role of the Incident Commander during a major incident? Answer in one sentence.', 'Explain the IC role.', 'The Incident Commander coordinates the response effort, makes decisions on severity and communication, delegates tasks, and ensures the incident is resolved efficiently without being the one doing the technical work.', 'CONTAINS', ARRAY['IC coordinates, not troubleshoots.', 'They make severity and escalation decisions.', 'They ensure clear communication throughout.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Post-Mortems
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'Post-Mortems';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Blameless Post-Mortem', 'FLAG_CAPTURE', 'What is the core principle of blameless post-mortems? Return the concept.', 'Identify blameless post-mortem principle.', 'Focus on systemic causes and process improvements rather than individual blame to encourage honest reporting', 'CONTAINS', ARRAY['Blameless culture encourages transparency.', 'Fear of blame causes people to hide mistakes.', 'The goal is preventing recurrence, not punishment.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Action Item Tracking', 'SHORT_RESPONSE', 'How should post-mortem action items be managed? Answer in one sentence.', 'Explain action item management.', 'Each action item should have a specific owner, a realistic deadline, clear acceptance criteria, and be tracked in the team''s project management tool with regular follow-ups until completion.', 'CONTAINS', ARRAY['Unowned action items never get done.', 'Deadlines create accountability.', 'Track in the same tool as engineering work.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Chaos Engineering
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'Chaos Engineering';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Chaos Engineering Purpose', 'FLAG_CAPTURE', 'What is the primary purpose of chaos engineering? Return the goal.', 'Identify chaos engineering purpose.', 'Proactively identify weaknesses in distributed systems by introducing controlled failures before they cause production incidents', 'CONTAINS', ARRAY['Chaos engineering finds weaknesses proactively.', 'It uses controlled experiments.', 'Netflix Chaos Monkey pioneered this approach.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Chaos Experiment Design', 'SHORT_RESPONSE', 'What are the four steps of a chaos experiment? Answer in one sentence.', 'Describe chaos experiment steps.', 'Define the steady state hypothesis, introduce a failure (like killing a service or introducing latency), observe the system response, and verify it matches the hypothesis or identifies a weakness.', 'CONTAINS', ARRAY['Start with a measurable steady state.', 'Introduce a realistic failure.', 'Compare behavior against the hypothesis.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Continuous Improvement
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Site Reliability Engineering' AND l.title = 'Continuous Improvement';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SRE Metrics Review', 'FLAG_CAPTURE', 'How often should SRE teams review their SLIs, SLOs, and error budgets? Return the recommended frequency.', 'Identify review frequency.', 'Monthly for error budgets, quarterly for SLO targets', 'CONTAINS', ARRAY['Error budgets should be reviewed monthly.', 'SLO targets should be reviewed quarterly.', 'Trends matter more than individual data points.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Reliability Improvement', 'SHORT_RESPONSE', 'What is the systematic approach to improving service reliability? Answer in one sentence.', 'Describe reliability improvement.', 'Analyze incidents and error budget consumption to identify the highest-impact reliability improvements, prioritize them using data, implement changes, and measure the impact on SLIs.', 'CONTAINS', ARRAY['Use incident data to identify improvement areas.', 'Prioritize by impact on error budget.', 'Measure SLI improvements after changes.'], 3, 30, true, 2, now(), now());
END $$;


-- ============================================================
-- 20. WEB SERVER ADMINISTRATION
-- ============================================================

-- Lesson: Nginx Architecture
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'Security Hardening';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Master-Worker Model', 'FLAG_CAPTURE', 'In Nginx, what is the relationship between the master process and worker processes? Return the relationship.', 'Identify Nginx process model.', 'The master process runs as root, manages workers, and handles privileged operations; workers run as unprivileged users and handle actual request processing', 'CONTAINS', ARRAY['Master process manages worker processes.', 'Workers handle actual request processing.', 'Each worker handles thousands of connections via epoll.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Max Concurrent Connections', 'FLAG_CAPTURE', 'If Nginx has worker_processes=4 and worker_connections=4096, what is the maximum concurrent connections? Return the number.', 'Calculate Nginx capacity.', '16384', 'CONTAINS', ARRAY['Total connections = worker_processes x worker_connections.', '4 x 4096 = 16384.', 'Each worker can handle worker_connections simultaneously.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Virtual Hosts & SSL
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'Virtualization';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SSL Certificate Chain', 'FLAG_CAPTURE', 'What are the three components of an SSL certificate chain? Return them in order from bottom to top.', 'Identify certificate chain components.', 'Server certificate, Intermediate certificate, Root CA certificate', 'CONTAINS', ARRAY['The server certificate is for your domain.', 'Intermediate certificates bridge to the root.', 'Root CAs are trusted by browsers.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'HTTP to HTTPS Redirect', 'COMMAND_ANSWER', 'Write the Nginx server block that redirects all HTTP traffic on port 80 to HTTPS on port 443. Return the complete server block.', 'Configure HTTP to HTTPS redirect.', 'server {\n    listen 80;\n    server_name example.com;\n    return 301 https://$host$request_uri;\n}', 'CONTAINS', ARRAY['listen 80 catches HTTP traffic.', 'return 301 performs a permanent redirect.', '$host and $request_uri preserve the original request.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Reverse Proxying & Load Balancing
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'User Administration at Scale';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Load Balancing Algorithm', 'FLAG_CAPTURE', 'Which Nginx load balancing algorithm distributes requests to the server with the fewest active connections? Return the algorithm name.', 'Identify the load balancing method.', 'least_connections', 'EXACT', ARRAY['round-robin distributes requests sequentially.', 'least_connections sends to the least busy server.', 'ip_hash uses source IP for sticky sessions.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Proxy Pass Configuration', 'COMMAND_ANSWER', 'Write the Nginx location block that proxies all requests under /api/ to a backend server at http://localhost:3000. Return the complete location block.', 'Configure reverse proxy.', 'location /api/ {\n    proxy_pass http://localhost:3000/;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n}', 'CONTAINS', ARRAY['proxy_pass forwards requests to the backend.', 'proxy_set_header passes client information.', 'X-Real-IP and X-Forwarded-For identify the client.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Caching & Performance Tuning
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'Boot Process and Kernel Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Proxy Cache Configuration', 'COMMAND_ANSWER', 'Write the Nginx configuration that enables caching of proxy responses for 10 minutes, storing cached files in /var/cache/nginx. Return the configuration.', 'Configure Nginx proxy cache.', 'proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;\n\nlocation / {\n    proxy_pass http://backend;\n    proxy_cache my_cache;\n    proxy_cache_valid 200 10m;\n}', 'CONTAINS', ARRAY['proxy_cache_path defines the cache storage.', 'keys_zone defines the cache name and memory size.', 'proxy_cache_valid sets the TTL for cached responses.'], 3, 35, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Gzip Compression', 'SHORT_RESPONSE', 'Why should you enable gzip compression in Nginx? Answer in one sentence.', 'Explain gzip compression benefit.', 'Gzip compresses HTTP responses before sending them to clients, reducing bandwidth usage and improving page load times, especially for text-based content like HTML, CSS, and JavaScript.', 'CONTAINS', ARRAY['Gzip reduces response size.', 'It is especially effective for text content.', 'Enable gzip_types for specific content types.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Apache httpd Configuration
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'Backup and Recovery';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Apache MPM Module', 'FLAG_CAPTURE', 'Which Apache Multi-Processing Module uses a single process with multiple threads, suitable for most modern workloads? Return the module name.', 'Identify the Apache MPM.', 'event', 'EXACT', ARRAY['prefork uses one process per connection.', 'worker uses multiple processes with threads.', 'event optimizes for keep-alive connections.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Apache Rewrite Rule', 'COMMAND_ANSWER', 'Write an Apache mod_rewrite rule that redirects all non-www requests to www.example.com with a 301 redirect. Return the complete RewriteRule.', 'Configure Apache www redirect.', 'RewriteEngine On\nRewriteCond %{HTTP_HOST} !^www\\. [NC]\nRewriteRule ^(.*)$ http://www.%{HTTP_HOST}/$1 [R=301,L]', 'CONTAINS', ARRAY['RewriteEngine On enables mod_rewrite.', 'RewriteCond checks the condition.', 'R=301 specifies a permanent redirect.', 'L means last rule (stop processing).'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Alternative Web Servers
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'Ansible Automation';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Caddy Auto-HTTPS', 'FLAG_CAPTURE', 'Which web server automatically obtains and renews Let''s Encrypt SSL certificates with zero configuration? Return the server name.', 'Identify the auto-HTTPS server.', 'Caddy', 'EXACT', ARRAY['Caddy automatically provisions SSL certificates.', 'It uses ACME protocol for Let''s Encrypt.', 'It requires minimal configuration.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Traefik Use Case', 'FLAG_CAPTURE', 'Which web server is designed as a cloud-native reverse proxy with automatic service discovery for Docker and Kubernetes? Return the server name.', 'Identify the cloud-native proxy.', 'Traefik', 'EXACT', ARRAY['Traefik integrates with Docker and K8s.', 'It auto-discovers services via labels.', 'It provides automatic HTTPS and load balancing.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: Containerized Web Deployment
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'Network Configuration';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Nginx Docker Setup', 'COMMAND_ANSWER', 'Write a Dockerfile that serves a static website using Nginx Alpine, copying your HTML files and a custom nginx.conf. Return the complete Dockerfile.', 'Write an Nginx Dockerfile.', 'FROM nginx:alpine\nCOPY nginx.conf /etc/nginx/nginx.conf\nCOPY html/ /usr/share/nginx/html/\nEXPOSE 80', 'CONTAINS', ARRAY['Use Alpine for a minimal image.', 'Copy the custom config to override defaults.', 'Copy static files to the Nginx html directory.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Multi-Container Web Stack', 'SHORT_RESPONSE', 'In a containerized web application with nginx, app, and database containers, how should you configure networking so only the app container can reach the database? Answer in one sentence.', 'Configure container networking.', 'Place the database on a separate Docker network that only the app container joins, while nginx connects only to the app network, creating network-level isolation between tiers.', 'CONTAINS', ARRAY['Docker networks provide container isolation.', 'Different networks cannot communicate.', 'Only connect containers that need to communicate.'], 3, 30, true, 2, now(), now());
END $$;

-- Lesson: Node.js Application Deployment
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'Service Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'PM2 Cluster Mode', 'COMMAND_ANSWER', 'Write the PM2 command to start a Node.js app (app.js) in cluster mode using all CPU cores. Return the command.', 'Start PM2 in cluster mode.', 'pm2 start app.js -i max', 'CONTAINS', ARRAY['pm2 start launches the application.', '-i max uses all available CPU cores.', '-i 4 would use exactly 4 instances.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Production NODE_ENV', 'FLAG_CAPTURE', 'What value should NODE_ENV be set to for production Node.js deployments? Return the value.', 'Set production NODE_ENV.', 'production', 'EXACT', ARRAY['NODE_ENV=production enables Express optimizations.', 'It disables verbose error messages.', 'NODE_ENV=development is for local development only.'], 3, 20, true, 2, now(), now());
END $$;

-- Lesson: Python/Django Deployment
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'Storage and Filesystems';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'WSGI Server Purpose', 'FLAG_CAPTURE', 'Why should you not use Django''s built-in runserver in production? What should you use instead? Return both.', 'Identify the production WSGI server.', 'Django dev server is single-threaded and not optimized; use Gunicorn or uWSGI as the WSGI server', 'CONTAINS', ARRAY['The dev server is for development only.', 'Gunicorn is a production WSGI server.', 'uWSGI is another production WSGI option.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Django Static Files', 'COMMAND_ANSWER', 'Write the Django management command that collects all static files into the STATIC_ROOT directory for production serving. Return the command.', 'Collect Django static files.', 'python manage.py collectstatic --noinput', 'CONTAINS', ARRAY['collectstatic gathers all static files.', '--noinput skips the confirmation prompt.', 'STATIC_ROOT defines where files are collected to.'], 3, 25, true, 2, now(), now());
END $$;

-- Lesson: Container Orchestration
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Web Server Administration' AND l.title = 'Monitoring and Logging';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Docker Compose Scaling', 'COMMAND_ANSWER', 'Write the docker compose command to scale the web service to 5 replicas. Return the command.', 'Scale services with Compose.', 'docker compose up -d --scale web=5', 'CONTAINS', ARRAY['docker compose up starts services.', '--scale sets the number of replicas.', '-d runs in detached mode.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Nginx Ingress Purpose', 'SHORT_RESPONSE', 'What is the role of an Nginx Ingress controller in Kubernetes? Answer in one sentence.', 'Explain Nginx Ingress purpose.', 'The Nginx Ingress controller acts as a reverse proxy and load balancer, routing external HTTP/HTTPS traffic to internal Kubernetes services based on Ingress resource rules.', 'CONTAINS', ARRAY['Ingress controllers handle external traffic.', 'They route based on hostnames and paths.', 'They provide TLS termination and load balancing.'], 3, 30, true, 2, now(), now());
END $$;

