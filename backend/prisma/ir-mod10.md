# Module 10 — Post-Incident Review

The incident is over. The attacker has been removed, systems are restored, and business is back to normal. But the work is not done. The post-incident review — also called a post-mortem or after-action review — is where you turn a bad experience into organizational improvement. Without a structured review, you will make the same mistakes again. Without accountability, action items will sit in a backlog forever. Without metrics, you cannot demonstrate improvement. This module covers the blameless post-mortem process, root cause analysis, action item tracking, metrics and reporting, and how to conduct reviews that actually change behavior.

## Why Post-Incident Reviews Matter

The post-incident review is the most undervalued phase of incident response, and it is the phase that makes you better. Without it, every incident is a standalone event that teaches you nothing. With it, every incident becomes a lesson that strengthens your defenses.

The purpose of the post-incident review is not to assign blame. Blame is counterproductive — it makes people defensive and discourages transparency. The purpose is to understand what happened, why it happened, and what needs to change to prevent it from happening again.

The post-incident review also serves as a memorial. It documents the incident for future reference. When someone asks "what happened during the breach last year?" the post-incident review provides the answer. When a new team member joins, the post-incident reviews from previous incidents provide context and lessons.

## Blameless Post-Mortem Process

A blameless post-mortem focuses on the process and the systems, not on the individuals. The assumption is that people are competent and well-intentioned, and that failures result from system weaknesses, not individual incompetence.

### Principles of Blameless Post-Mortems

**Focus on systems, not people.** When something goes wrong, ask "why did the process allow this to happen?" not "why did this person make this mistake?" Every human error is a symptom of a system weakness.

**Assume positive intent.** Assume that everyone involved in the incident was trying to do the right thing. The analyst who missed the alert was not lazy — they were overloaded with alerts. The engineer who did not patch the server was not negligent — they were not aware of the vulnerability.

**Identify contributing factors.** Incidents rarely have a single root cause. They result from a combination of factors — technical, process, and human. The post-mortem should identify all contributing factors.

**Focus on improvement, not punishment.** The output of the post-mortem should be action items that improve the process. If the output is "person X should have done Y," you have not identified a systemic improvement.

### The Post-Mortem Meeting

The post-mortem meeting should happen within one to two weeks of incident resolution. It should involve everyone who participated in the response, from the SOC analysts who detected the incident to the executives who made containment decisions.

**Pre-meeting preparation:**

The meeting facilitator should prepare a timeline of the incident before the meeting. The timeline should include every significant event, from initial detection to final resolution, with timestamps and the names of the people involved. This timeline provides the factual foundation for the discussion.

The facilitator should also collect data about the incident: how long each phase took, what tools were used, what communications were sent, and what decisions were made. This data supports the discussion with facts rather than opinions.

**Meeting structure:**

1. **Timeline walkthrough (15-20 minutes):** Walk through the incident timeline. Stick to facts — what happened, when, and who was involved. Avoid opinions or judgments during the timeline walkthrough.

2. **What went well (10-15 minutes):** Identify what worked. Did the detection happen quickly? Was the containment effective? Was the communication clear? Acknowledging what went well reinforces good behavior and provides a positive foundation for discussing improvements.

3. **What did not go well (15-20 minutes):** Identify what did not work. Was the detection too slow? Was the containment ineffective? Were there communication gaps? Be specific — "we need better logging" is not actionable; "we could not reconstruct the attacker's commands because PowerShell module logging was not enabled" is actionable.

4. **What would we do differently (15-20 minutes):** Based on what went well and what did not, identify what would be done differently next time. This is where action items are generated.

5. **Action items (10-15 minutes):** Assign specific action items to specific people with specific deadlines. Each action item should be: specific, measurable, achievable, relevant, and time-bound.

**Post-meeting follow-up:**

The facilitator should distribute a summary of the meeting within 24 hours. The summary should include the timeline, the identified improvements, and the action items with owners and deadlines. The summary should be distributed to all meeting participants and to any stakeholders who were not present.

### Facilitation Tips

**Keep it constructive.** If the discussion becomes accusatory, redirect it to systems and processes. If someone says "John should have patched the server," respond with "what process could have ensured the server was patched?"

**Encourage participation.** Everyone who participated in the response has a perspective. The SOC analyst who detected the incident knows things that the Incident Commander does not. The communications lead who drafted the customer notification knows things that the technical lead does not. Draw out contributions from everyone.

**Stay focused.** The post-mortem should focus on this incident, not on every problem the organization has ever had. Tangential issues should be noted for future discussion but not pursued during the meeting.

**Document everything.** The post-mortem produces institutional knowledge. Document it thoroughly so that it can be referenced in the future.

## Root Cause Analysis

Root cause analysis is the process of identifying the fundamental reason why an incident occurred. Surface-level causes are easy to identify — the attacker exploited a vulnerability, the phishing email bypassed the filter, the analyst missed the alert. Root cause analysis digs deeper to understand why these things happened.

### The 5 Whys

The 5 Whys technique is a simple but effective root cause analysis method. Start with the incident and ask "why?" five times, each time drilling deeper into the cause.

Example:

**Incident:** Ransomware encrypted files on 50 workstations.

1. **Why?** The attacker gained access to the network through a phishing email.
2. **Why?** The email bypassed the email gateway's phishing detection.
3. **Why?** The email used a lookalike domain that was not in the gateway's block list.
4. **Why?** The gateway was not configured to detect lookalike domains.
5. **Why?** The email gateway configuration had not been updated since it was deployed two years ago.

The root cause is not the phishing email — it is the outdated email gateway configuration. Fixing the root cause (updating the email gateway configuration) prevents future phishing emails from bypassing detection. Fixing only the surface cause (blocking this specific phishing email) does not prevent the next one.

### Fishbone Diagrams

Fishbone diagrams (also called Ishikawa diagrams or cause-and-effect diagrams) provide a visual representation of the causes that contributed to an incident. The diagram has a central spine representing the incident and branches representing different categories of causes.

Categories for security incidents typically include:

- **People:** Training, skills, availability, communication
- **Process:** Procedures, workflows, approvals, escalation
- **Technology:** Tools, configurations, integrations, reliability
- **Environment:** Network architecture, system design, third-party dependencies

Each branch can have sub-branches that drill deeper into specific causes. The fishbone diagram provides a visual overview of all contributing factors and helps ensure that no category is overlooked.

### Fault Tree Analysis

Fault tree analysis is a top-down approach that starts with the incident and works backward to identify all possible causes. The analysis uses Boolean logic gates (AND, OR) to represent the relationships between causes.

For example, a data breach might be represented as:

```
Data Breach
├── Attacker gained access (OR)
│   ├── Phishing email
│   ├── Exploited vulnerability
│   └── Stolen credentials
├── Attacker moved laterally (OR)
│   ├── Pass-the-hash
│   ├── RDP with stolen credentials
│   └── Exploited vulnerability
└── Attacker exfiltrated data (OR)
    ├── Direct download
    ├── Encrypted channel
    └── Physical media
```

Fault tree analysis helps identify all the ways an incident could have occurred and ensures that remediation addresses all attack paths, not just the one the attacker used.

### Systemic Root Causes

Many incidents have systemic root causes that go beyond the immediate technical issue.

**Inadequate asset management.** If you do not know what you have, you cannot protect it. Missing asset inventory leads to unpatched systems, undetected compromises, and incomplete incident response.

**Insufficient logging.** If you are not logging the right data, you cannot detect or investigate incidents. Insufficient logging is one of the most common root causes of extended dwell time.

**Poor change management.** If changes are not reviewed and approved, misconfigurations and vulnerabilities are introduced. Poor change management is a frequent root cause of incidents.

**Inadequate training.** If your team is not trained on current threats and techniques, they will miss indicators that they should catch. Inadequate training is a root cause of missed detections.

**Technical debt.** Legacy systems, outdated software, and architectural shortcuts create vulnerabilities that attackers exploit. Technical debt is a systemic root cause that requires long-term investment to address.

## Action Items and Follow-Up

The output of a post-incident review is a set of action items. These action items are commitments to improvement. Without follow-up, action items are just words.

### Action Item Quality

Good action items are:

**Specific:** "Enable PowerShell module logging on all endpoints" is specific. "Improve logging" is not.

**Measurable:** "Deploy EDR agents to achieve 95% coverage within 30 days" is measurable. "Improve endpoint visibility" is not.

**Assigned:** Every action item has an owner. The owner is responsible for completing the action item and reporting progress.

**Time-bound:** Every action item has a deadline. The deadline creates urgency and accountability.

**Prioritized:** Action items should be prioritized based on risk reduction. High-risk gaps should be addressed first.

### Action Item Tracking

Action items need a tracking system. This can be as simple as a spreadsheet or as complex as a project management tool. The key is that every action item is recorded, assigned, and tracked to completion.

The tracking system should include:

- **Action item description:** What needs to be done
- **Owner:** Who is responsible for doing it
- **Deadline:** When it needs to be done
- **Status:** Not started, in progress, completed, blocked
- **Priority:** High, medium, low
- **Source:** Which incident generated this action item

The tracking system should be reviewed regularly — at least monthly. Action items that are past due should be escalated. Action items that are blocked should have the blockers addressed. Action items that are completed should be verified.

### Follow-Up Accountability

Accountability is what makes action items happen. Without accountability, action items sit in a backlog forever.

The most effective accountability mechanism is executive sponsorship. If the CISO or CTO is tracking action items and asking for updates, things get done. If action items are tracked only by the security team, they compete with other priorities and may not get completed.

Regular status reviews are another accountability mechanism. Monthly reviews of action item status keep the items visible and the owners accountable. Public accountability — reporting status to leadership — creates additional motivation to complete items.

### Closing Action Items

When an action item is completed, verify that it was completed correctly. "Enable PowerShell module logging" should be verified by checking that logging is actually enabled on all endpoints. "Deploy EDR agents to 95% coverage" should be verified by checking the actual coverage percentage.

Close completed action items in the tracking system. Record the completion date, the verification method, and any lessons learned during implementation. These records provide a history of improvements and can be referenced during future post-incident reviews.

## Metrics and Reporting

Metrics measure the effectiveness of your incident response program. Without metrics, you cannot demonstrate improvement, justify investment, or identify areas that need attention.

### Incident Response Metrics

**Mean Time to Detect (MTTD):** The average time from when an incident starts to when it is detected. MTTD measures the effectiveness of your detection capabilities. A decreasing MTTD indicates improving detection.

**Mean Time to Contain (MTTC):** The average time from detection to containment. MTTC measures the effectiveness of your response process. A decreasing MTTC indicates improving response.

**Mean Time to Recover (MTTR):** The average time from containment to full recovery. MTTR measures the effectiveness of your recovery process. A decreasing MTTR indicates improving recovery.

**Incident Volume:** The number of incidents per time period. Increasing volume may indicate improving detection (you are catching more incidents) or increasing threat activity. Context is needed to interpret this metric.

**Incident Severity Distribution:** The distribution of incidents by severity. A shift toward higher severity may indicate that the threat landscape is becoming more dangerous, or it may indicate that detection is improving and catching more serious incidents earlier.

**False Positive Rate:** The percentage of alerts that are false positives. A decreasing false positive rate indicates improving detection accuracy.

### Reporting

Metrics need to be reported to stakeholders. The reporting frequency and detail depend on the audience.

**Executive reporting** should be concise and focused on business impact. Monthly or quarterly reports should include: number of incidents, business impact (financial, operational, reputational), key improvements made, and risks that need attention. Avoid technical jargon — executives need to understand the business implications, not the technical details.

**Operational reporting** should be detailed and focused on process effectiveness. Weekly reports should include: alerts triaged, incidents detected, containment times, recovery times, and action item status. Operational reporting helps the team identify trends and adjust their approach.

**Regulatory reporting** should be compliant and focused on meeting regulatory requirements. Some regulations require specific reporting formats and timelines. Ensure that your reporting meets these requirements.

### Metrics for Improvement

Metrics are not just for reporting — they are for improvement. Use metrics to:

**Identify trends.** Is MTTD increasing or decreasing? Is the false positive rate increasing or decreasing? Trends reveal whether your program is improving or deteriorating.

**Compare against benchmarks.** How does your MTTD compare to industry averages? How does your false positive rate compare to peer organizations? Benchmarks provide context for your metrics.

**Justify investment.** If your MTTD is 30 days and you want to reduce it to 7 days, you need investment in additional detection capabilities. Metrics provide the data to justify that investment.

**Track the impact of improvements.** After implementing an improvement — like deploying a new EDR agent or tuning detection rules — measure the impact on relevant metrics. If the improvement did not have the expected impact, investigate why.

## Real Scenario: Lessons Learned from a Major Breach

In August 2024, a financial services company experienced a major breach that affected 50,000 customer accounts. The attacker gained access through a compromised VPN account, moved laterally through the network, and exfiltrated customer financial data over a period of three weeks before detection.

The post-incident review was conducted two weeks after the incident was resolved. The meeting involved the IR team, the SOC team, the IT operations team, the legal team, the communications team, and executive leadership.

**Timeline walkthrough:**

The timeline revealed several critical gaps:

- **Day 1:** Attacker gained access through a VPN account with no MFA. The account belonged to a former employee whose access was not revoked.
- **Day 3:** Attacker escalated privileges by exploiting a known vulnerability in Active Directory that had not been patched.
- **Day 7:** Attacker began accessing customer data from the production database.
- **Day 14:** Attacker began exfiltrating data through an encrypted HTTPS channel to an external server.
- **Day 21:** An analyst noticed unusual database query patterns during a routine review and escalated to the IR team.
- **Day 21:** IR team contained the incident by blocking the exfiltration channel and disabling the compromised account.
- **Day 28:** Recovery completed. All affected systems rebuilt from clean backups.

**What went well:**

- Once the incident was detected, the IR team responded quickly. Containment happened within hours of detection.
- The communications team prepared customer notifications quickly and clearly.
- The legal team coordinated regulatory notifications within the required timeframes.
- The recovery was completed within a week using clean backups.

**What did not go well:**

- The attacker was in the network for three weeks before detection. The compromised VPN account was not monitored because it was a service account that was assumed to be unused.
- The Active Directory vulnerability had been known for six months but had not been patched because the patch was classified as "low priority."
- The database query monitoring that eventually detected the incident was performed manually by an analyst. There were no automated alerts for unusual database query patterns.
- The VPN did not enforce MFA, allowing the attacker to access the network with only a password.
- The former employee's VPN access was not revoked because there was no automated process for offboarding.

**Root cause analysis:**

The team conducted a 5 Whys analysis for the primary contributing factors:

1. **Attacker gained access through a former employee's VPN account.**
2. **Why?** The account was not revoked during offboarding.
3. **Why?** There was no automated offboarding process for VPN accounts.
4. **Why?** The offboarding process was manual and relied on IT staff to remember to revoke access.
5. **Why?** The organization had not invested in identity governance tooling.

Root cause: Lack of automated identity governance.

1. **Attacker escalated privileges through a known Active Directory vulnerability.**
2. **Why?** The vulnerability had not been patched.
3. **Why?** The patch was classified as "low priority" by the vulnerability management team.
4. **Why?** The risk scoring model did not account for the vulnerability's exploitability in the context of the organization's network architecture.
5. **Why?** The vulnerability management team did not have visibility into the network architecture.

Root cause: Inadequate vulnerability risk scoring.

1. **The attacker was in the network for three weeks before detection.**
2. **Why?** The detection relied on manual database query review.
3. **Why?** There were no automated alerts for unusual database query patterns.
4. **Why?** Database activity monitoring was not implemented.
5. **Why?** The project to implement database activity monitoring had been deprioritized due to budget constraints.

Root cause: Insufficient investment in detection capabilities.

**Action items:**

| Action Item | Owner | Deadline | Priority |
|-------------|-------|----------|----------|
| Implement automated VPN account deprovisioning | IT Operations | 30 days | Critical |
| Enable MFA on all VPN connections | Network Engineering | 14 days | Critical |
| Reprioritize Active Directory patching to Critical | Vulnerability Management | 7 days | Critical |
| Update vulnerability risk scoring model to include exploitability context | Vulnerability Management | 60 days | High |
| Implement database activity monitoring | Security Engineering | 90 days | High |
| Implement automated offboarding for all access systems | IT Operations | 60 days | High |
| Review and update IR playbooks based on lessons learned | IR Team | 30 days | Medium |
| Conduct tabletop exercise focused on data exfiltration scenarios | IR Team | 60 days | Medium |

**Metrics and follow-up:**

The team established metrics to track improvement:

- **MTTD target:** Reduce from 21 days to 7 days through improved detection capabilities
- **VPN MFA coverage:** Target 100% within 14 days
- **Patch compliance:** Target 95% for Critical patches within 7 days
- **Automated offboarding:** Target 100% of access systems within 60 days

Monthly reviews were scheduled to track action item progress. The CISO committed to reporting status to the board quarterly.

Three months after the post-incident review:

- VPN MFA was enabled on all connections (completed in 12 days)
- Active Directory patching was reprioritized and all Critical patches applied within 7 days
- Automated VPN deprovisioning was implemented (completed in 28 days)
- Database activity monitoring was procured and deployment was in progress (on track for 90-day deadline)
- The vulnerability risk scoring model was updated to include exploitability context (completed in 55 days)
- IR playbooks were updated and a tabletop exercise was conducted (completed in 45 days)

The post-incident review transformed a major breach into organizational improvement. The action items addressed the root causes that allowed the breach to occur, and the metrics tracked the impact of those improvements. Without the structured post-incident review, the organization would have fixed the immediate symptoms — disabled the compromised account, patched the vulnerability — but not the systemic issues that allowed the breach to happen.

## Building a Post-Incident Review Culture

A post-incident review process only works if the organization supports it. Building a culture of post-incident reviews requires leadership commitment, psychological safety, and consistent execution.

**Leadership commitment.** Executive leadership must support the post-incident review process. This means allocating time for reviews, attending reviews, and following up on action items. If leadership does not value post-incident reviews, the rest of the organization will not either.

**Psychological safety.** People must feel safe to speak honestly during post-incident reviews. If people fear punishment for mistakes, they will not share what really happened. A blameless culture requires genuine psychological safety — not just lip service.

**Consistent execution.** Every significant incident should have a post-incident review. Not just the big incidents — the small ones too. The small incidents often reveal process gaps that lead to big incidents. Consistency builds the habit and ensures that improvement is continuous.

**Knowledge sharing.** Post-incident reviews produce institutional knowledge. Share this knowledge across the organization. A summary of each post-incident review should be available to the entire security team. Lessons learned from one team's incident can prevent similar incidents in other teams.

## Assessment

### Lab Exercise 1: Post-Mortem Facilitation (60 minutes)

You are given a scenario involving a major security incident. Your task is to facilitate a post-incident review meeting.

**Scenario:** A ransomware attack encrypted files across the organization's network. The attack began with a phishing email, spread through the network using EternalBlue, and encrypted 200 workstations and 10 servers. Recovery took 5 days and cost $2 million.

**Lab Tasks:**

1. Prepare a timeline of the incident (15 minutes)
2. Facilitate a discussion of what went well (10 minutes)
3. Facilitate a discussion of what did not go well (15 minutes)
4. Identify root causes using the 5 Whys technique (10 minutes)
5. Generate and assign action items (10 minutes)

**Grading Criteria:**

- Accurate and complete timeline: 20 points
- Balanced discussion of successes and failures: 25 points
- Effective root cause analysis: 25 points
- Specific and actionable action items: 30 points

### Lab Exercise 2: Root Cause Analysis (45 minutes)

You are given incident details and must perform a root cause analysis.

**Scenario:** A data breach occurred because an attacker exploited a misconfigured S3 bucket that was publicly accessible. The S3 bucket contained customer PII. The bucket was misconfigured during a migration project three months before the breach.

**Lab Tasks:**

1. Perform a 5 Whys analysis (15 minutes)
2. Create a fishbone diagram identifying contributing factors (15 minutes)
3. Identify systemic root causes beyond the immediate technical issue (15 minutes)

**Grading Criteria:**

- Effective 5 Whys analysis: 30 points
- Comprehensive fishbone diagram: 30 points
- Identification of systemic root causes: 40 points

### Lab Exercise 3: Metrics and Reporting (30 minutes)

You are given incident data and must create a post-incident report with metrics.

**Scenario:** Over the past quarter, your organization experienced 45 security incidents: 30 Low, 10 Medium, 4 High, and 1 Critical. The average MTTD was 12 hours, MTTC was 4 hours, and MTTR was 48 hours. The false positive rate was 25%.

**Lab Tasks:**

1. Calculate and interpret the key metrics (10 minutes)
2. Create an executive summary report (10 minutes)
3. Identify trends and areas for improvement (10 minutes)

**Grading Criteria:**

- Accurate metric calculation and interpretation: 30 points
- Clear and concise executive summary: 40 points
- Insightful trend analysis and recommendations: 30 points

## Evidence

### Key Concepts

- **Blameless Post-Mortem:** Focus on systems and processes, not individuals; assume positive intent; identify contributing factors; focus on improvement
- **Root Cause Analysis:** 5 Whys, fishbone diagrams, fault tree analysis — techniques for identifying fundamental causes
- **Action Items:** Specific, measurable, assigned, time-bound commitments to improvement
- **Metrics:** MTTD, MTTC, MTTR, incident volume, severity distribution, false positive rate
- **Reporting:** Executive (business impact), operational (process effectiveness), regulatory (compliance)
- **Culture:** Leadership commitment, psychological safety, consistent execution, knowledge sharing

### Post-Incident Review Template

1. **Incident Summary:** What happened, when, impact
2. **Timeline:** Detailed timeline with timestamps and actions
3. **What Went Well:** Strengths in the response
4. **What Did Not Go Well:** Weaknesses in the response
5. **Root Causes:** Fundamental reasons for the incident
6. **Action Items:** Specific improvements with owners and deadlines
7. **Metrics:** Key metrics and targets for improvement
8. **Lessons Learned:** Key takeaways for the organization

### Metrics Reference

| Metric | Definition | Target |
|--------|-----------|--------|
| MTTD | Mean Time to Detect | < 24 hours |
| MTTC | Mean Time to Contain | < 4 hours |
| MTTR | Mean Time to Recover | < 48 hours |
| False Positive Rate | % of alerts that are false positives | < 20% |
| Action Item Completion | % of action items completed on time | > 90% |
| Patch Compliance | % of Critical patches applied within SLA | > 95% |
