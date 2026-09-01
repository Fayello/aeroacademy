# Module 2 — Detection and Triage

Detection and triage is where incidents either get caught early or spiral out of control. A well-tuned detection pipeline with skilled triage analysts can catch a breach within hours. A poorly tuned pipeline with overloaded analysts will let an attacker dwell for months. This module covers how to build effective detection, how to prioritize alerts when you are drowning in them, and how to perform initial triage that separates real incidents from noise.

## Alert Sources

Your detection infrastructure generates alerts from multiple sources. Each source has strengths and weaknesses, and understanding them is critical for effective triage.

### SIEM

Your Security Information and Event Management system aggregates logs from across your environment — firewalls, proxies, Active Directory, endpoints, applications, and cloud services. The SIEM correlates these logs against detection rules to identify suspicious activity.

The strength of SIEM-based detection is visibility. A properly configured SIEM sees everything happening across your network. The weakness is volume. A SIEM running thousands of detection rules against millions of log events generates enormous numbers of alerts. The majority of SIEM alerts are false positives or low-severity findings that do not require immediate action.

Effective SIEM detection requires constant tuning. Rules that generate too many false positives get suppressed or refined. New detection rules are added as your threat landscape evolves. Log sources are added as new systems come online. The SIEM is a living system that requires ongoing maintenance.

Common SIEM detection rules include brute-force authentication attempts, unusual login times, privilege escalation events, lateral movement indicators, data exfiltration patterns, and known malicious indicator matches. Each of these rules has a threshold, and setting that threshold correctly is the difference between useful alerts and noise.

### IDS/IPS

Intrusion Detection and Prevention Systems monitor network traffic for known attack patterns. IDS alerts on suspicious traffic; IPS blocks it. These systems use signature-based detection, which means they are very good at catching known attacks and very bad at catching novel ones.

The strength of IDS/IPS is that they operate at the network level and can detect attacks that endpoint-based tools might miss. They also provide visibility into traffic between systems that may not have EDR agents installed. The weakness is that they only catch what they have signatures for. A sophisticated attacker using custom tools will not trigger IDS signatures.

IDS/IPS alerts need context. An alert that says "ET MALWARE Possible Trickbot C2 Traffic Detected" tells you that network traffic matched a known Trickbot signature. But you need to know which host generated the traffic, what the destination IP is, whether that destination is known malicious, and what happened before and after the alert. This context is what turns an IDS alert into actionable intelligence.

### EDR

Endpoint Detection and Response agents run on individual systems and monitor process execution, file system changes, registry modifications, network connections, and other endpoint-level activity. EDR is the most detailed detection source because it sees everything happening at the endpoint level.

The strength of EDR is behavioral detection. Unlike IDS signatures that match specific attack patterns, EDR can detect suspicious behavior — like a Word document spawning a PowerShell process, or a service account executing commands interactively. These behavioral detections catch attacks that do not match known signatures.

The weakness of EDR is coverage. Every endpoint needs an agent installed, and the agent needs to be properly configured. If an endpoint does not have an EDR agent, you have no visibility into what is happening on that system. In many organizations, coverage gaps are the biggest weakness in EDR-based detection.

EDR alerts often include rich context: the process tree showing what executed what, the network connections made by the suspicious process, the file hashes involved, and the user account that initiated the activity. This context makes triage faster and more accurate.

### User Reports

Do not underestimate the value of user reports. Your employees are sensors. A user who receives a suspicious email and reports it, or who notices unusual behavior on their computer, is providing you with a detection that your automated tools may have missed.

The challenge with user reports is consistency. Some users report everything; others report nothing. Training users on what to report and how to report it is essential. Make reporting easy — a dedicated email address, a button in the email client, a chatbot in your messaging platform. The easier you make it, the more reports you will receive.

User reports need to be triaged with the same rigor as automated alerts. A user reporting a "suspicious email" might be reporting a phishing attempt, or they might be reporting a legitimate marketing email that they do not recognize. Triage requires investigation, not assumption.

### External Notification

Sometimes you learn about an incident from outside your organization. Law enforcement might contact you about data they found on a dark web marketplace. A security researcher might report a vulnerability they found in your infrastructure. A customer might report unauthorized access to their account.

External notifications are high-priority because they often indicate that an incident has already occurred and the external party has evidence. Treat these notifications seriously and investigate immediately.

## Alert Fatigue and Prioritization

Alert fatigue is the single biggest threat to your detection capability. When analysts see hundreds or thousands of alerts per day, they start to tune out. Real incidents get buried in a sea of false positives and low-severity findings. The analyst who has been investigating the same type of alert for the twentieth time today is not going to give the twenty-first alert the attention it deserves.

The root cause of alert fatigue is poorly tuned detection rules. Every rule in your SIEM should be reviewed regularly. Rules that generate more than a handful of alerts per week should be tuned to reduce false positives. Rules that consistently produce only false positives should be disabled. New rules should be run in monitoring-only mode for a period before being enabled for alerting.

Prioritization is how you manage alert fatigue. Not every alert requires the same level of attention. A brute-force attempt against an external-facing service is lower priority than a successful login from a known malicious IP. A user connecting to an uncategorized website is lower priority than a user downloading a known malware sample. Your triage process should classify every alert by severity so analysts know where to focus.

The priority matrix considers several factors:

**Impact:** What is the worst case if this alert represents a real incident? An alert involving a domain administrator account has higher impact than an alert involving a standard user account. An alert involving access to sensitive data has higher impact than an alert involving access to a development server.

**Confidence:** How likely is this alert to be a true positive? An alert matching a known malicious IP address with high confidence is higher priority than a heuristic-based alert with lower confidence. The more context you have, the higher your confidence.

**Scope:** How many systems are affected? An alert affecting a single workstation is lower priority than an alert suggesting lateral movement across multiple systems. An alert indicating data exfiltration is higher priority than an alert indicating initial access.

**Urgency:** How time-sensitive is the response? An alert indicating active data exfiltration is more urgent than an alert indicating a vulnerability scan. An alert indicating ransomware execution is more urgent than an alert indicating reconnaissance.

Combining these factors gives you a priority level. High-impact, high-confidence, wide-scope, and urgent alerts get immediate attention. Low-impact, low-confidence, narrow-scope, and non-urgent alerts can wait.

## Initial Triage Checklist

When an alert fires, the triage analyst needs to quickly determine whether it represents a real incident. The following checklist provides a structured approach to initial triage.

### Step 1: Understand the Alert

Before investigating, understand what the alert is telling you. What detection rule fired? What log source generated the alert? What is the expected behavior, and what is the observed behavior that triggered the alert? Read the alert description and any associated documentation. If you do not understand the alert, do not investigate it until you do.

### Step 2: Validate the Data

Is the alert data accurate? Check whether the IP address, hostname, username, or file hash in the alert is correct. Verify that the log source is working properly and sending accurate data. A misconfigured log source can generate alerts that look real but are artifacts of a configuration error.

### Step 3: Check for Known False Positives

Is this alert pattern something you have seen before as a false positive? Check your false positive log. If this exact alert pattern has been a false positive in the past, investigate with that knowledge. Common false positive sources include vulnerability scanners, penetration tests, automated maintenance tasks, and legitimate administrative activity.

### Step 4: Investigate the Activity

Look at the surrounding context. What else was happening on the affected system around the time of the alert? Were there other alerts on the same system or the same user? What is the user's normal behavior pattern? Is this activity consistent with the user's job function?

Check related logs. If the alert is about a login, check what the user did after logging in. If the alert is about a process execution, check what processes spawned it and what it spawned afterward. If the alert is about a network connection, check whether the connection was successful and what data was transferred.

### Step 5: Determine Severity

Based on your investigation, classify the alert severity. This classification drives the next steps — whether you escalate to the IR team, whether you isolate a system, or whether you close the alert as a false positive.

### Step 6: Document Your Findings

Every triage action needs to be documented. What you checked, what you found, and what you decided. This documentation is critical for two reasons: it helps the next analyst who picks up the investigation, and it creates a record that can be used in legal proceedings if the incident escalates.

## Severity Classification

A clear severity classification system ensures that everyone on the team understands the urgency of an alert and the expected response time.

**Critical (Response: 15 minutes)** — Active compromise of a high-value system, confirmed data exfiltration, ransomware execution, or active attacker in the network with domain-level access. These incidents require immediate escalation to the IR team and immediate containment action.

**High (Response: 1 hour)** — Confirmed malicious activity on a critical system, successful phishing with credential compromise, lateral movement indicators, or unauthorized access to sensitive data. These incidents require IR team involvement and likely containment within the hour.

**Medium (Response: 4 hours)** — Suspicious activity that may indicate compromise, unusual access patterns to sensitive systems, malware detection on a single endpoint, or policy violations that may indicate malicious intent. These incidents require investigation and may require containment depending on findings.

**Low (Response: 24 hours)** — Low-confidence indicators of compromise, minor policy violations, suspicious but potentially legitimate activity, or informational alerts that may be useful context for future investigations. These incidents are investigated when resources permit.

**Informational (Response: next business day)** — Alerts that do not indicate malicious activity but provide useful context. Reconnaissance activity from external IPs, vulnerability scan detections, or policy violations that are clearly benign. These are documented and closed.

## Real Scenario: Triaging a Phishing Campaign

On a Tuesday morning at 9:15 AM, the security operations center received three separate user reports of suspicious emails. The emails appeared to come from the company's HR department and contained a link to "update your benefits information." The emails were convincing — they used the company's branding, addressed recipients by name, and came from an email address that closely resembled the HR department's actual address (hr-department@company-hr.com instead of hr@company.com).

The triage analyst started by examining the emails. The sender address was a lookalike domain — not the company's actual domain. The link in the email pointed to a URL that was not the company's actual benefits portal. The URL used a domain that was registered two days ago, which was a strong indicator of a phishing campaign.

The analyst classified this as a High-severity incident because it was a targeted phishing campaign with a lookalike domain, and the emails were sent to multiple employees. The analyst immediately escalated to the IR team and began collecting evidence.

The analyst pulled the full email headers from the reported emails and identified the sending mail server. They searched the email gateway logs for all emails sent from the same source and found that 247 employees had received the phishing email. Of those, 31 had clicked the link, and 14 had entered their credentials on the fake benefits portal.

The analyst escalated the incident to the IR team with a clear scope: 31 users had been exposed to the phishing page, 14 had potentially entered credentials, and the attacker-controlled domain was still live. The IR team initiated containment by blocking the phishing domain at the email gateway and web proxy, forcing password resets for all 14 users who had entered credentials, and searching for any signs that the compromised credentials had been used to access company systems.

The investigation revealed that the attacker had used the harvested credentials to access the company's VPN from an IP address in Eastern Europe. The VPN access was brief — approximately 12 minutes — but the attacker had enough time to download a file from a shared drive containing employee PII. The scope of the incident expanded from a phishing campaign to a data breach.

The triage analyst's initial classification was correct. What started as a phishing campaign escalated to a data breach because the analyst moved quickly and the IR team was able to identify the scope of the compromise. If the triage had been slower — if the analyst had classified this as Medium severity and waited four hours — the attacker would have had more time to access additional systems.

Key takeaways from this scenario:

**Speed matters.** The analyst triaged the initial reports within 15 minutes of receiving them. That speed enabled the IR team to contain the compromise before the attacker could do more damage.

**Context matters.** The analyst did not just look at the email — they looked at who received it, who clicked the link, and who entered credentials. That context determined the severity classification.

**Scope matters.** The analyst quickly determined the scope of the campaign — 247 recipients, 31 clickers, 14 credential entries. That scope information was critical for the IR team's response.

**Escalation matters.** The analyst escalated to the IR team immediately rather than trying to handle everything alone. Phishing campaigns that result in credential compromise are not one-person incidents.

## Building a Triage Workflow

A triage workflow is the process your team follows from alert generation to resolution. The workflow needs to be documented, followed, and continuously improved.

The workflow starts with alert ingestion. Alerts from all sources — SIEM, IDS, EDR, user reports, external notifications — flow into a central queue. The queue should be prioritized so analysts work on the highest-severity alerts first.

Triage assignments should be based on analyst skill level and alert complexity. Newer analysts handle lower-severity alerts and learn the triage process. Experienced analysts handle higher-severity alerts and complex investigations. This progression builds team capability while ensuring that critical incidents get the attention they need.

Handoff procedures are critical. When an analyst's shift ends, they need to hand off any open investigations to the next analyst. This handoff should include a summary of what has been investigated, what the current status is, and what the next steps are. A poorly executed handoff can cause an investigation to stall or duplicate work.

Quality assurance is the feedback loop that improves your triage process. A supervisor or senior analyst should review closed alerts periodically to verify that triage decisions were correct. False negatives — real incidents that were closed as false positives — are the most dangerous quality gap. If your team is missing real incidents, you need to understand why and fix the root cause.

## False Positive Management

False positives are not just noise — they are a signal that your detection rules need tuning. Every false positive should be analyzed to determine why it occurred and how to prevent it.

Common causes of false positives include overly broad detection rules, insufficient context in alert data, changes in legitimate user behavior, new applications or services that match detection patterns, and misconfigured log sources.

When a false positive is identified, document the root cause and the tuning action taken. If the rule is too broad, narrow the scope. If the rule is missing context, add additional log sources. If the rule is based on a threshold that is too low, raise the threshold. The goal is to reduce false positives without creating false negatives.

Some false positives are acceptable. A detection rule that catches a real incident once a year but generates a false positive once a week may still be worth keeping. The decision to keep or tune a rule should be based on the risk tradeoff — what is the cost of the false positives versus the value of the detection?

## Advanced Triage Techniques

As your team matures, your triage process should evolve beyond basic checklist-based triage.

**Behavioral baseline analysis** compares observed activity against a baseline of normal behavior. If a user who normally works 9 AM to 5 PM suddenly logs in at 3 AM from a foreign country, that deviation from baseline is suspicious even if no specific detection rule fires. Building and maintaining behavioral baselines requires time and tooling, but it dramatically improves detection of sophisticated attacks.

**Threat intelligence integration** enriches alerts with external context. If an alert involves an IP address, check it against threat intelligence feeds. If an alert involves a file hash, check it against malware databases. If an alert involves a domain, check it against domain reputation databases. This enrichment happens automatically in well-configured SIEMs and EDR platforms, but it needs to be set up and maintained.

**Correlation across alert sources** connects dots that individual alerts cannot. A suspicious login alert from the SIEM combined with a malware detection alert from the EDR on the same system within the same time window is much more significant than either alert alone. Correlation rules that combine multiple alert types dramatically improve detection accuracy.

**Kill chain mapping** maps alerts to stages of the cyber kill chain. An alert indicating reconnaissance is less urgent than an alert indicating lateral movement, which is less urgent than an alert indicating data exfiltration. Understanding where an alert falls in the kill chain helps prioritize response effort.

## Assessment

### Lab Exercise 1: Alert Triage Practice (45 minutes)

You are given a set of 20 SIEM alerts. Your task is to triage each alert using the initial triage checklist and classify each by severity.

**Lab Tasks:**

1. Review all 20 alerts and understand what each is reporting (15 minutes)
2. Triage each alert using the checklist — validate data, check for false positives, investigate activity (20 minutes)
3. Classify each alert by severity and document your reasoning (10 minutes)

**Grading Criteria:**

- Correct triage of each alert: 50 points (2.5 points per alert)
- Accurate severity classification: 30 points
- Documentation quality: 20 points

### Lab Exercise 2: Phishing Campaign Triage (60 minutes)

You receive a batch of 15 emails reported by users as suspicious. Your task is to analyze the emails, determine which are phishing, scope the campaign, and draft an escalation report.

**Lab Tasks:**

1. Analyze email headers for all 15 emails (15 minutes)
2. Identify phishing emails and categorize them by type (spear phishing, bulk phishing, etc.) (15 minutes)
3. Determine the scope — how many recipients, how many clickers, how many credential entries (15 minutes)
4. Write an escalation report for the IR team (15 minutes)

**Grading Criteria:**

- Correct identification of phishing emails: 30 points
- Accurate scope determination: 30 points
- Quality of escalation report: 30 points
- Proper use of email header analysis: 10 points

### Lab Exercise 3: Detection Rule Tuning (30 minutes)

You are given a detection rule that generates 500 alerts per day, most of which are false positives. Your task is to analyze the alerts and propose tuning changes.

**Lab Tasks:**

1. Analyze the 500 alerts to identify patterns in false positives (10 minutes)
2. Analyze the true positive alerts to understand what they have in common (10 minutes)
3. Propose specific tuning changes to the detection rule (10 minutes)

**Grading Criteria:**

- Accurate identification of false positive patterns: 30 points
- Accurate identification of true positive patterns: 30 points
- Specific and actionable tuning recommendations: 40 points

## Evidence

### Key Concepts

- **Alert Sources:** SIEM, IDS/IPS, EDR, user reports, external notifications — each with strengths and weaknesses
- **Alert Fatigue:** The condition where analysts become desensitized to alerts due to volume; addressed through tuning and prioritization
- **Triage Checklist:** Six-step process — understand the alert, validate data, check false positives, investigate activity, determine severity, document findings
- **Severity Classification:** Critical, High, Medium, Low, Informational — each with defined response times and escalation paths
- **False Positive Management:** Root cause analysis, rule tuning, threshold adjustment, ongoing maintenance

### Detection Maturity Model

- **Level 1:** Basic signature-based detection with high false positive rates
- **Level 2:** Tuned signatures with some behavioral detection and basic correlation
- **Level 3:** Behavioral detection with threat intelligence integration and kill chain mapping
- **Level 4:** Advanced behavioral analytics with automated correlation and response
- **Level 5:** Full-spectrum detection with predictive analytics and autonomous response

### Metrics

- **Mean Time to Detect (MTTD):** Average time from incident occurrence to detection — target under 24 hours
- **Mean Time to Triage (MTTT):** Average time from alert generation to triage decision — target under 1 hour for High/Critical alerts
- **False Positive Rate:** Percentage of alerts that are false positives — target under 20%
- **True Positive Rate:** Percentage of real incidents detected — target over 90%
- **Alert Volume per Analyst:** Average number of alerts each analyst triages per day — monitor for burnout indicators

### Common Phishing Indicators

- Sender address does not match the display name or organizational domain
- Links use URL shorteners or recently registered domains
- Urgency language demanding immediate action
- Request for credentials or personal information
- Attachments with suspicious extensions (.exe, .scr, .js, .vbs)
- Inconsistencies in branding, grammar, or formatting
- Reply-to address differs from sender address
- Email headers show mismatched routing information
