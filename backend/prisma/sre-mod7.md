# Module 7 — Incident Management

## On-Call Rotations

On-call is the practice of having engineers available outside business hours to respond to production incidents. It is the last line of defense between a system failure and a customer-impacting outage. A well-designed on-call rotation distributes the burden fairly, provides adequate coverage, and gives engineers the tools they need to respond effectively.

The fundamental components of an on-call rotation are the schedule, the escalation policy, and the support structure.

**Schedule design.** The schedule determines who is on call and when. The most common rotation patterns are weekly (one person on call for a full week), daily (one person on call for a full day), and follow-the-sun (multiple people in different time zones, each covering their local hours). Weekly rotations are the most common because they reduce context switching: the on-call engineer can focus on operations for a full week without interruptions from feature work. Daily rotations are more humane but create more handoff overhead.

A typical weekly rotation for a team of five engineers looks like: Engineer A is on call week 1, Engineer B is week 2, Engineer C is week 3, Engineer D is week 4, and Engineer E is week 5. Then it repeats. Each engineer is on call one week out of five, which means they carry the on-call burden 20% of the time. This is a common target: no engineer should be on call more than 25% of the time.

**Compensation.** On-call is not free labor. Engineers who are on call should receive compensation, either through direct payment (a per-hour or per-day on-call stipend), time off (compensatory time for incidents handled during off-hours), or salary adjustment. The specific compensation model depends on the company, but it must exist. Asking engineers to be available 24/7 without compensation is a fast path to burnout and turnover.

**Handoff.** When one on-call engineer hands off to the next, they need to transfer context. What incidents occurred? What issues are still open? What changes are pending? A good handoff document includes: a summary of incidents in the past week, open issues that may require attention, pending changes that could cause issues, and any known quirks or workarounds. The handoff should happen in a structured format, ideally in a shared document that both the outgoing and incoming on-call engineers review together.

**Escalation policy.** The escalation policy defines what happens when the on-call engineer cannot resolve an issue alone. A typical escalation policy has three tiers: the on-call engineer (first responder), the secondary on-call engineer (experienced engineer who can provide guidance), and the engineering manager (for resource allocation and communication). Each tier has a response time target: the on-call engineer responds within 5 minutes, the secondary within 15 minutes, and the manager within 30 minutes.

**Context switching.** The biggest challenge for on-call engineers is context switching. They are pulled away from feature work to handle incidents, then expected to resume feature work after the incident is resolved. This is cognitively expensive. Research shows that it takes an average of 23 minutes to fully regain focus after an interruption. An on-call engineer who handles three incidents in a day has lost over an hour of productive work just to context switching.

The solution is to protect on-call engineers from non-urgent work. When an engineer is on call, they should not be assigned feature work. They should be dedicated to responding to incidents. This is a productivity investment: the team loses one engineer's feature work for a week but gains a responsive on-call engineer who can resolve incidents quickly.

## Escalation Policies

An escalation policy is a predefined set of rules that determine who is notified when an incident occurs and how the notification changes over time. The goal is to ensure that incidents are handled by the right people at the right time, without requiring the on-call engineer to make ad-hoc decisions about who to call.

A well-designed escalation policy answers three questions: who gets notified, when do they get notified, and what happens if they do not respond.

**Who gets notified.** The first responder is the on-call engineer. If the on-call engineer does not acknowledge the alert within a specified time (e.g., 5 minutes), the alert escalates to the secondary on-call engineer. If the secondary does not acknowledge within 10 minutes, it escalates to the engineering manager. If the manager does not acknowledge within 15 minutes, it escalates to the VP of Engineering.

**When do they get notified.** Different severity levels have different escalation timelines. A P1 (critical) incident affects all users and requires immediate response. The escalation timeline is fast: 5 minutes to acknowledge, 15 minutes to begin investigation, 30 minutes to have a mitigation plan. A P2 (high) incident affects a significant subset of users. The escalation timeline is moderate: 15 minutes to acknowledge, 30 minutes to begin investigation, 1 hour to have a mitigation plan. A P3 (medium) incident affects a small subset of users or has a workaround. The escalation timeline is relaxed: 30 minutes to acknowledge, 2 hours to begin investigation.

**What happens if they do not respond.** If the first responder does not acknowledge the alert, the system should automatically escalate. This requires redundant notification channels: if the on-call engineer does not respond to PagerDuty, the system should call their phone. If they do not answer the phone, it should text them. If they still do not respond, it should escalate to the next person. The goal is to ensure that no incident goes unacknowledged.

Here is a real escalation policy example from a fintech company:

**P1 (Service Down):**
- 0 min: Alert fires. On-call engineer notified via PagerDuty (push notification + phone call).
- 5 min: If not acknowledged, secondary on-call engineer notified.
- 10 min: If not acknowledged, engineering manager notified.
- 15 min: If not acknowledged, VP of Engineering notified.
- 20 min: If not acknowledged, CTO notified.

**P2 (Service Degraded):**
- 0 min: Alert fires. On-call engineer notified via PagerDuty (push notification).
- 15 min: If not acknowledged, secondary on-call engineer notified.
- 30 min: If not acknowledged, engineering manager notified.

**P3 (Non-urgent):**
- 0 min: Alert fires. On-call engineer notified via email.
- 2 hours: If not acknowledged, secondary on-call engineer notified.

The escalation policy is not just about notification. It is also about action. At each escalation tier, the responder has specific responsibilities:

- **On-call engineer:** Acknowledge the alert, assess the severity, begin investigation, and communicate status.
- **Secondary on-call engineer:** Provide guidance and expertise, assist with investigation, and help with mitigation.
- **Engineering manager:** Allocate resources, communicate with stakeholders, and make decisions about service degradation or shutdown.
- **VP of Engineering:** Make high-level decisions about service trade-offs, authorize emergency changes, and communicate with executive leadership.

The escalation policy should be documented, tested, and reviewed regularly. Every quarter, the team should conduct an escalation drill: simulate an incident and verify that the escalation policy works as expected. If the drill reveals gaps (e.g., the secondary on-call engineer is unreachable), the policy should be updated.

## Communication During Incidents

Incident communication is the practice of keeping stakeholders informed during an incident. Stakeholders include the engineering team, management, customers, and partners. Good communication reduces anxiety, prevents misinformation, and enables coordinated response.

The key communication channels during an incident are the war room, status updates, and customer communication.

**War room.** The war room is a dedicated communication channel for the incident response team. In most organizations, this is a Slack channel (e.g., `#incident-2024-01-15-payment-outage`). The war room has strict communication rules: only incident-related messages, no side conversations, and every action is documented. The war room is where the investigation happens, where decisions are made, and where the response is coordinated.

A war room typically has several roles: the incident commander (leads the response), the technical lead (investigates the root cause), the communications lead (handles status updates and customer communication), and the scribe (documents everything). These roles may be filled by different people or by the same person in smaller incidents.

**Status updates.** Status updates are regular communications to the broader team and management. For a P1 incident, status updates should be posted every 15-30 minutes. For a P2 incident, every 30-60 minutes. The status update should include: current status (investigating, identified, mitigating, resolved), impact (which users are affected, what symptoms they are seeing), next steps (what the team is doing to resolve the issue), and ETA (if known, when the issue will be resolved; if unknown, state that explicitly).

A common status update format is:

```
[Status: Investigating]
Impact: Payment processing is unavailable for all users.
Investigation: We have identified that the payment database is unreachable. The database failover did not complete as expected.
Next steps: We are manually promoting the standby database to primary. ETA: 30 minutes.
```

**Customer communication.** Customer communication is the most visible and most sensitive aspect of incident communication. Customers need to know: is the service down? How long will it be down? What should I do in the meantime? The communication should be honest, timely, and specific.

For planned maintenance, communicate at least 48 hours in advance. For unplanned outages, communicate within 30 minutes of confirming the outage. For degraded performance, communicate within 1 hour. The communication should be sent through all relevant channels: status page, email, social media, and in-app notifications.

A real example of incident communication. A SaaS platform had a major outage that affected all users. The communications lead posted the following updates:

**T+0 (9:01 AM):** "We are investigating reports of service unavailability. Our team is actively working to identify the issue. We will provide updates every 15 minutes."

**T+15 (9:16 AM):** "We have identified the root cause: a database migration that ran at 8:55 AM caused a schema conflict. The API is returning 500 errors for all requests. We are working on a rollback."

**T+30 (9:31 AM):** "We have rolled back the database migration. The API is recovering. Some users may experience intermittent errors as the system stabilizes. We are monitoring closely."

**T+45 (9:46 AM):** "The API is fully recovered. All services are operating normally. We will conduct a post-mortem and share findings within 48 hours."

The total downtime was 35 minutes. The communication was honest, timely, and specific. Customers knew what was happening, what the team was doing, and when to expect resolution. This built trust even though the service had failed.

## Managing a Major Outage: A Real Story

NightOwl was a fintech startup that processed $50 million in daily transactions. At 2:17 AM on a Tuesday, their payment processing system went down. All payment transactions were failing. The error rate jumped from 0.01% to 100%.

The on-call engineer, Priya, received the PagerDuty alert at 2:17 AM. She acknowledged it within 2 minutes and opened the war room in Slack. The incident severity was P1: all users affected, revenue impact.

Priya's first action was to assess the situation. She checked the dashboard: the payment service was returning HTTP 500 errors for all requests. The database connection pool was exhausted. The error rate was 100%. The p99 latency was 30 seconds (requests were timing out).

Priya posted the first status update: "Investigating: Payment service returning 500 errors. Database connection pool exhausted. ETA for diagnosis: 15 minutes."

She began investigating. The database connection pool was configured for 100 connections. At 2:15 AM, a batch job had started that opened 500 connections to the database, exhausting the pool. The batch job was a data export that ran nightly. It had been running successfully for months. What changed?

Priya discovered that a code deploy at 10 PM the previous evening had changed the batch job's connection handling. The old code used a single connection for the entire batch job. The new code opened a new connection for each query in the batch job. The batch job processed 10,000 queries, so it opened 10,000 connections. The database connection pool could only handle 100. The pool was exhausted within seconds of the batch job starting.

The immediate fix was to kill the batch job. Priya ran a command to terminate the batch process. The connection pool recovered. The payment service started working again. The total downtime was 23 minutes.

But the fix was temporary. The batch job would run again the next night and cause the same outage. The permanent fix was to revert the code change to the batch job's connection handling. The engineering team deployed the revert at 3:30 AM. The batch job ran successfully at its scheduled time the next night without exhausting the connection pool.

**Post-incident communication:**

- T+5 minutes (2:22 AM): "Investigating: Payment service returning 500 errors. Database connection pool exhausted. Working on diagnosis."
- T+15 minutes (2:32 AM): "Identified: A batch job running at 2:15 AM exhausted the database connection pool. We have terminated the batch job and are monitoring recovery."
- T+23 minutes (2:40 AM): "Mitigated: The payment service has recovered. All transactions are processing normally. We are monitoring for any recurrence."
- T+75 minutes (3:32 AM): "Resolved: We have deployed a permanent fix that prevents the batch job from exhausting the connection pool. A post-mortem will be conducted within 48 hours."

**Post-mortem findings:**

The root cause was a code change that altered the batch job's connection handling. The code review did not catch the issue because the reviewer was not aware that the batch job ran against a shared database with a limited connection pool. The testing did not catch the issue because the staging environment had a larger connection pool than production.

The action items from the post-mortem were:
1. Add a connection limit to the batch job's code (completed: 1 day)
2. Add monitoring for database connection pool utilization (completed: 3 days)
3. Add a test that verifies the batch job's connection usage (completed: 1 week)
4. Update the code review checklist to include connection pool impact assessment (completed: 1 week)
5. Reduce the staging environment's connection pool to match production (completed: 1 week)

The NightOwl incident illustrates several important principles:
- On-call engineers must be empowered to take immediate action (killing the batch job) without waiting for approval.
- Communication must be timely and honest, even at 2 AM.
- The immediate fix (kill the job) and the permanent fix (revert the code) are separate actions that must both be completed.
- The post-mortem must identify systemic issues (code review process, testing environment) not just the proximate cause (bad code change).

## Incident Severity and Prioritization

Not all incidents are equal. A complete outage of the payment system is more severe than a slow page load for the settings page. Incident severity classification determines the response level: how quickly the team responds, who is involved, and how much effort is dedicated to resolution.

A common severity classification:

**P1 (Critical):** Complete loss of a critical service. All users affected. Revenue impact. The team drops everything to resolve this. Response time: 5 minutes. Update frequency: every 15 minutes.

**P2 (Major):** Significant degradation of a critical service. Most users affected. Revenue impact likely. The team prioritizes this over feature work. Response time: 15 minutes. Update frequency: every 30 minutes.

**P3 (Minor):** Degradation of a non-critical service or a small subset of users affected. Workaround available. The team addresses this during business hours. Response time: 1 hour. Update frequency: every 2 hours.

**P4 (Low):** Minor issue with no user impact or a cosmetic issue. Addressed in the normal sprint cycle. Response time: next business day. Update frequency: daily.

The severity classification should be based on impact, not on the technical nature of the issue. A CSS bug that affects the checkout page (high revenue impact) is more severe than a database performance issue that affects an internal dashboard (no user impact).

Incident prioritization is the process of determining which incident to work on first when multiple incidents are occurring simultaneously. The general rule is: highest severity first, then by impact (most users affected first), then by age (oldest incident first). This prevents the team from spending all their time on easy, low-impact incidents while high-impact incidents wait.

## Incident Response Tools and Automation

Modern incident management relies on a stack of tools that automate detection, communication, and remediation. The right tooling can reduce MTTR by 50% or more by eliminating manual steps and providing the on-call engineer with the information they need to diagnose and resolve incidents quickly.

**Alerting systems.** PagerDuty, Opsgenie, and VictorOps are the most common alerting platforms. They handle on-call scheduling, escalation, and multi-channel notification (push, SMS, phone call). The key to effective alerting is signal-to-noise ratio. Every alert should require human action. If an alert fires and the on-call engineer does not need to do anything, the alert should be removed or automated.

**Incident tracking.** Incident.io, PagerDuty's incident management module, and Jira Service Management provide structured incident workflows. They automate the creation of war rooms, status page updates, and stakeholder notifications. They also capture incident metadata for post-mortem analysis: timeline, participants, actions taken, and resolution.

**Status pages.** Statuspage.io, Instatus, and Atlassian Statuspage provide public-facing status pages that communicate service health to customers. During an incident, the status page is updated with current status, impact, and ETA. This reduces the burden on customer support because customers can check the status page instead of opening tickets.

**Runbook automation.** Runbooks are step-by-step instructions for handling specific incidents. Modern runbook tools (Rundeck, AWS Systems Manager, Azure Automation) can automate runbook execution. Instead of the on-call engineer manually following the steps, the tool executes them automatically. This reduces human error and speeds up resolution.

**ChatOps.** ChatOps integrates incident management into chat platforms (Slack, Microsoft Teams). Chatbots can execute common operations (restart a service, check a dashboard, scale a deployment) directly from the chat channel. This reduces context switching and creates an audit trail of all actions taken during an incident.

Here is a real tooling example. A company implemented a comprehensive incident management stack: PagerDuty for alerting, incident.io for incident tracking, Statuspage for customer communication, and Rundeck for runbook automation. Before the stack, the average MTTR was 45 minutes. After the stack, the average MTTR was 18 minutes. The improvement came from:

- Automated alert routing reduced time to acknowledge from 8 minutes to 2 minutes.
- Automated war room creation reduced time to begin investigation from 15 minutes to 5 minutes.
- Runbook automation reduced time to diagnose known issues from 20 minutes to 5 minutes.
- Automated status page updates reduced time to communicate with customers from 30 minutes to 5 minutes.

The total investment in tooling was approximately $50,000 per year (software licenses and implementation time). The return was a 60% reduction in MTTR, which translated to approximately 500 fewer hours of downtime per year. At $200 per hour (fully loaded engineering cost), that is $100,000 in savings. The ROI was achieved in six months.

The key lesson is that incident management tooling is not a luxury. It is a necessity. The cost of the tools is a fraction of the cost of prolonged outages. Every minute of downtime costs money, reputation, and customer trust. Investing in tooling that reduces MTTR is one of the highest-ROI investments an SRE team can make.

## Assessment

**Lab 1: On-Call Rotation Design (45 minutes)**

You are an SRE lead. Your team has 6 engineers. You need to design an on-call rotation for a service that requires 24/7 coverage.

Tasks:
1. Design a weekly rotation schedule that distributes the on-call burden equally.
2. Define an escalation policy with three tiers and specific response time targets.
3. Design a handoff process that ensures context transfer between on-call engineers.
4. Define compensation for on-call work (use your judgment for reasonable values).
5. Create a runbook for the on-call engineer that covers the top 5 most common incidents.

Grading criteria:
- Rotation schedule is fair and covers all hours (20 points)
- Escalation policy is complete with response times (25 points)
- Handoff process ensures context transfer (15 points)
- Compensation is reasonable and documented (10 points)
- Runbook covers common incidents with clear steps (30 points)

**Lab 2: Incident Simulation (60 minutes)**

You are given a simulated incident: a database failover has failed, and the primary database is unreachable. The service is returning 500 errors.

Tasks:
1. Act as the incident commander. Document your first 5 actions.
2. Write a status update for the war room at T+0, T+10, and T+20 minutes.
3. Write a customer-facing status page update.
4. Document the escalation steps you would take.
5. Write a post-mortem draft based on the simulated resolution.

Grading criteria:
- First actions are logical and prioritize diagnosis (20 points)
- Status updates are timely, honest, and specific (25 points)
- Customer communication is clear and appropriate (20 points)
- Escalation steps follow a structured policy (15 points)
- Post-mortem draft is blameless and includes action items (20 points)

**Lab 3: Escalation Policy Review (30 minutes)**

You are given three real-world escalation policies from different companies. Analyze them.

Tasks:
1. Compare the escalation timelines across the three policies.
2. Identify strengths and weaknesses of each policy.
3. Recommend improvements for the weakest policy.
4. Propose a unified escalation policy that incorporates the best elements from all three.

Grading criteria:
- Comparison is thorough and accurate (25 points)
- Strengths and weaknesses are correctly identified (30 points)
- Recommendations are practical and specific (25 points)
- Unified policy is well-designed (20 points)
