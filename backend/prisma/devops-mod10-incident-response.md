# Module 10: Incident Response and SRE Practices

## The Incident Response Process

When production breaks at 3 AM, panic is the default response. The phone rings, Slack explodes, dashboards light up red, and everyone starts doing things without knowing what to do. Incident response is the discipline of replacing panic with process.

The incident response process has six phases: detect, triage, mitigate, investigate, resolve, and review. Each phase has specific goals, roles, and artifacts.

### Detect

Detection is how you know something is wrong. Ideally, monitoring detects the problem before users report it. In practice, a mix of monitoring alerts and user reports triggers incident response.

A detection is valid when it meets three criteria: the alert is actionable (you can do something about it), the impact is real (users are affected or will be affected), and the urgency is appropriate (this needs attention now, not next week).

Bad detections waste time. A CPU usage alert at 80% with no user impact is noise. A latency alert at p99 > 2 seconds with 500 requests/second is a real problem. The difference is whether the metric correlates with user impact.

### Triage

Triage determines the severity and the response. Severity levels are not arbitrary: they determine who gets paged, who gets involved, and how fast the response needs to be.

**Severity 1 (Critical):** Complete service outage or data loss. All users affected. Revenue impact. Response time: immediate. Examples: database corruption, payment system down, complete API failure.

**Severity 2 (High):** Major feature degraded or unavailable. Significant user impact. Response time: 15 minutes. Examples: login broken, search not working, slow response times affecting most users.

**Severity 3 (Medium):** Minor feature degraded. Limited user impact. Response time: 1 hour. Examples: a specific API endpoint returning errors, a non-critical background job failing, a UI bug affecting a subset of users.

**Severity 4 (Low):** Cosmetic issue or minor inconvenience. Minimal user impact. Response time: next business day. Examples: typo in error message, slow page load on a rarely-used page, a dashboard showing incorrect data.

Severity is determined by user impact, not technical complexity. A database failover is technically complex but might be Severity 3 if the application handles it transparently. A single line of code causing a 500 error on the login page is technically simple but Severity 1 because no one can log in.

### Mitigate

Mitigation restores service. It does not fix the root cause: it stops the bleeding. Mitigation is about speed, not elegance.

Common mitigation strategies:

**Rollback**: If the last deployment caused the issue, roll it back. This is the fastest mitigation for deployment-related problems.

**Feature flag**: If a specific feature is causing problems, disable it with a feature flag. The code stays deployed but the feature is hidden from users.

**Scale up**: If the issue is resource exhaustion (CPU, memory, connections), add more instances.

**Failover**: If a component is broken, failover to a backup. Database failover, DNS failover, regional failover.

**Circuit breaker**: If a downstream service is failing, stop calling it. The circuit breaker pattern prevents cascading failures.

**Restart**: If the issue is a transient bug (memory leak, deadlock), restarting the service might restore it. This is a temporary fix, not a permanent one.

The key is to have pre-defined mitigation playbooks. When the database is slow, what do you do? When the API is returning 500 errors, what do you do? Having a runbook that describes the steps means the on-call engineer does not have to think under pressure.

### Investigate

Investigation finds the root cause. This happens after mitigation because the user impact is the priority, not the root cause.

Investigation follows the evidence:

1. **Timeline**: What changed recently? Deployments, configuration changes, infrastructure changes, traffic spikes.
2. **Metrics**: What do the dashboards show? When did the metric change? What correlates with the incident?
3. **Logs**: What do the application logs say? Are there error messages, stack traces, or unusual patterns?
4. **Traces**: Where is the time being spent? Which service or database query is slow?
5. **Infrastructure**: Are the servers healthy? CPU, memory, disk, network.

The investigation should be documented in real-time. Every observation, hypothesis, and test should be recorded. This documentation is essential for the post-mortem.

### Resolve

Resolution means the root cause is fixed, not just mitigated. If you rolled back a deployment, resolution means understanding why the deployment broke things and fixing the underlying issue. If you scaled up because of resource exhaustion, resolution means understanding why resources were exhausted and preventing it from happening again.

Resolution might take hours or days. The mitigation keeps the system running while the team works on the permanent fix. The resolution should include:
- The root cause identified during investigation
- A fix that addresses the root cause (not just the symptoms)
- Tests to verify the fix works
- Monitoring to detect if the issue recurs

### Review

The review (post-mortem or retrospective) is the most important phase. It is where the team learns from the incident and improves the system.

Post-mortems are blameless. The goal is not to find someone to blame but to find the systemic failures that allowed the incident to happen. People do not make mistakes on purpose. They make mistakes because the system made it easy to make mistakes.

A blameless post-mortem asks:
- What went wrong?
- Why did it go wrong?
- What did we do well?
- What can we improve?
- What actions will we take?

The actions are the most important part. Every post-mortem should produce specific, assigned, time-bound action items. "Improve monitoring" is not an action item. "Add latency alerting for the payment API with a 2-second threshold" is an action item.

## Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date:** [Date]
**Duration:** [Start time] - [End time] ([Duration])
**Severity:** [1-4]
**Author:** [Name]
**Status:** Draft / Final

## Summary
[One paragraph describing what happened, the impact, and the resolution]

## Impact
- **Users affected:** [Number or percentage]
- **Duration:** [How long users were affected]
- **Revenue impact:** [If applicable]
- **Data impact:** [If any data was lost or corrupted]

## Timeline
| Time (UTC) | Event |
|------------|-------|
| [Time] | [What happened] |
| [Time] | [What happened] |
| [Time] | [What happened] |

## Root Cause
[Detailed explanation of why the incident occurred]

## What Went Well
- [Thing that went well]
- [Thing that went well]

## What Went Wrong
- [Thing that went wrong]
- [Thing that went wrong]

## Where We Got Lucky
- [Lucky circumstance]
- [Lucky circumstance]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action item] | [Name] | [Date] | Open |
| [Action item] | [Name] | [Date] | Open |

## Lessons Learned
- [Lesson]
- [Lesson]
```

The "Where We Got Lucky" section is important. Luck is not a strategy. If you were lucky that the database failover worked, you need to test database failover regularly. If you were lucky that the incident happened during business hours when the team was available, you need better on-call coverage.

## SRE Principles

Site Reliability Engineering (SRE) is Google's approach to operations. It treats operations as a software engineering problem. The core principles:

### Error Budgets

An error budget is the acceptable level of unreliability. If your SLO is 99.9% availability, your error budget is 0.1%: about 43 minutes of downtime per month.

Error budgets create a feedback mechanism:
- If the error budget is full (no errors yet), you can ship risky changes
- If the error budget is low (approaching the limit), you focus on reliability
- If the error budget is exhausted, you stop feature development and fix reliability

This prevents the conflict between "ship fast" and "keep it stable." The error budget quantifies the trade-off.

```promql
# Error budget remaining (30-day window)
# SLO: 99.9% availability
# Budget: 0.1% of requests can fail

# Successful requests over 30 days
sum(rate(http_requests_total{status_code!~"5.."}[30d]))

# Total requests over 30 days
sum(rate(http_requests_total[30d]))

# Success rate
sum(rate(http_requests_total{status_code!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))

# Error budget remaining
(0.001 - (1 - (sum(rate(http_requests_total{status_code!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))))) / 0.001
```

### Toil Reduction

Toil is manual, repetitive, automatable work that scales linearly with the size of the system. Examples: manually provisioning servers, manually deploying code, manually responding to alerts that have known fixes.

SRE targets: no more than 50% of an SRE's time should be spent on toil. The rest should be spent on engineering: building tools, improving automation, reducing future toil.

Toil reduction follows a cycle:
1. Identify toil (what manual work do you do repeatedly?)
2. Measure toil (how much time does it take?)
3. Automate toil (write scripts, build tools)
4. Verify automation (does the automation work correctly?)
5. Monitor toil (is the automation reducing manual work?)

The goal is not to eliminate all toil but to keep it below 50%. Some toil is inevitable: you need to respond to novel incidents, investigate new problems, and make decisions that require human judgment.

### Blameless Culture

Blameless culture means that incidents are not used to punish individuals. When something breaks, the question is "what in the system allowed this to happen?" not "who made the mistake?"

This does not mean there are no consequences. It means the consequences are focused on improving the system, not punishing people. If a developer deploys a breaking change, the fix is better testing, not firing the developer. If an on-call engineer misses an alert, the fix is better alerting, not reprimanding the engineer.

Blameless culture requires trust. People must feel safe reporting mistakes, asking for help, and admitting when they do not know something. Without trust, people hide mistakes, which makes the system less safe.

## On-Call Rotations

On-call is the practice of having engineers available outside business hours to respond to incidents. Good on-call is sustainable. Bad on-call burns people out.

### On-Call Structure

**Rotation:** Each engineer takes a turn being on-call. A typical rotation is one week. The on-call engineer is the first responder for all incidents during their shift.

**Escalation:** If the on-call engineer cannot resolve an issue within a specified time, they escalate to a senior engineer or the team lead. Escalation should be automatic, not manual.

**Handoff:** When a new on-call engineer takes over, they receive a briefing on open issues, ongoing incidents, and recent changes.

**Compensation:** On-call work outside business hours should be compensated. This can be time off in lieu, financial compensation, or reduced workload during the on-call week.

### PagerDuty Setup

PagerDuty is an incident management platform that handles on-call scheduling, alerting, and escalation.

Configuration:

```yaml
# PagerDuty schedule
schedule:
  name: "Production On-Call"
  rotation:
    - name: "Primary"
      users:
        - user1@example.com
        - user2@example.com
        - user3@example.com
      duration: 168  # 1 week in hours
    - name: "Secondary"
      users:
        - user4@example.com
        - user5@example.com
        - user6@example.com
      duration: 168
      start: 168  # Offset by 1 week

# Escalation policy
escalation_policy:
  name: "Production Escalation"
  rules:
    - escalation:
        - type: user
          user: user1@example.com
          delay: 0  # Immediate
        - type: user
          user: user2@example.com
          delay: 15  # 15 minutes
        - type: user
          user: team_lead@example.com
          delay: 30  # 30 minutes
```

Escalation policies define who gets notified and when. The primary on-call engineer is notified immediately. If they do not acknowledge within 15 minutes, the secondary is notified. If neither acknowledges within 30 minutes, the team lead is notified.

### On-Call Best Practices

1. **Keep the rotation fair.** Everyone should take equal turns. Use a tool to manage the rotation and prevent favoritism.

2. **Limit on-call duration.** Being on-call for more than one week at a time is unsustainable. Rotate frequently.

3. **Reduce noise.** If the on-call engineer gets paged 10 times per night, something is wrong. Tune alerts to reduce false positives.

4. **Document runbooks.** Every alert should have a runbook that tells the on-call engineer what to do. Do not expect people to figure it out at 3 AM.

5. **Compensate fairly.** On-call work is real work. Compensate accordingly.

6. **Conduct regular reviews.** Review on-call metrics (pages per week, time to acknowledge, time to resolve) and improve the process.

## Runbook Creation

A runbook is a step-by-step guide for responding to a specific type of incident. Good runbooks are written for someone who is tired, stressed, and woken up at 3 AM. They should be clear, concise, and actionable.

### Runbook Structure

```markdown
# Runbook: High Error Rate on Payment API

**Alert:** PaymentAPIHighErrorRate
**Severity:** 1
**On-call response time:** Immediate

## Symptoms
- Error rate on payment API exceeds 5% for 5 minutes
- Users report payment failures
- Revenue impact

## Diagnosis
1. Check Grafana dashboard: "Payment API Overview"
2. Look at the error rate panel: is it a spike or sustained?
3. Check the latency panel: is latency elevated?
4. Check the database panel: is the database slow?

## Mitigation Steps

### If the last deployment caused the issue:
1. Check `kubectl rollout history deployment/payment-api -n production`
2. Rollback: `kubectl rollout undo deployment/payment-api -n production`
3. Verify: `curl -f https://api.example.com/health/payment`

### If the database is slow:
1. Check database connections: `kubectl exec -it postgres-0 -- psql -c "SELECT count(*) FROM pg_stat_activity"`
2. Check for slow queries: `kubectl exec -it postgres-0 -- psql -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10"`
3. If connections are exhausted: `kubectl exec -it postgres-0 -- psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes'"`

### If a downstream service is failing:
1. Check the dependency graph in Jaeger
2. If the service is degraded, add circuit breaker configuration
3. If the service is down, contact the service owner

## Escalation
- If mitigation does not work within 15 minutes, escalate to team lead
- If data loss is suspected, escalate immediately to CTO

## Verification
- Error rate drops below 5%
- Payment success rate returns to normal
- No user reports of payment failures in the last 10 minutes

## Follow-up
- Create incident ticket
- Notify stakeholders of resolution
- Schedule post-mortem within 24 hours
```

Runbooks should be stored in a version-controlled repository and linked to alert definitions. They should be tested regularly: run through the runbook during a drill to verify the steps work.

## Real Story: 4 AM Production Outage and What We Learned

At 4:17 AM, the PagerDuty alert fired: "API Error Rate Critical: 15% error rate for 5 minutes." The on-call engineer was woken up, grabbed their laptop, and started diagnosing.

The Grafana dashboard showed that the error rate had spiked from 0.1% to 15% over 5 minutes. The latency dashboard showed response times jumping from 200ms to 8 seconds. The CPU dashboard was normal. The memory dashboard was normal. The database dashboard was normal.

The first hypothesis: the last deployment. A new feature was deployed at 3:45 AM (the team had a policy of deploying during off-peak hours to minimize user impact). The engineer checked the deployment logs and found no errors.

The second hypothesis: traffic spike. The traffic dashboard showed normal request volume. No spike.

The third hypothesis: downstream dependency. The Jaeger traces showed that API requests were spending 7 seconds in a call to the notification service. The notification service was not responding.

The engineer checked the notification service dashboard. It was healthy: CPU normal, memory normal, no errors. But the traces showed that the API was calling the notification service synchronously, and the notification service was slow.

The investigation revealed the root cause: the new feature added a synchronous call to the notification service to send a welcome email when a user signed up. The notification service had been migrated to a new email provider the previous week, and the new provider had a 3-second latency for email sending. Before the migration, email sending took 200ms. The new code did not account for this latency change.

The mitigation was straightforward: disable the new feature with a feature flag. The error rate dropped to 0.1% within 2 minutes. The fix took 30 seconds.

The root cause analysis revealed three systemic issues:

1. **No latency testing.** The migration was tested for correctness (emails were delivered) but not for latency (how long the email API took). The team added latency testing to the migration process.

2. **Synchronous external calls.** The new feature called the notification service synchronously, meaning the API response waited for the email to be sent. The team established a policy: external service calls must be asynchronous or have aggressive timeouts.

3. **Insufficient alerting.** The notification service had latency monitoring but no alerting on latency changes. The team added alerts for latency increases of more than 50% from baseline.

The post-mortem produced three action items:
1. Add latency testing to all service migration checklists
2. Review all synchronous external calls and convert to async where possible
3. Add latency change alerts for all critical dependencies

All three action items were completed within two weeks. The team also created a runbook for "high latency from downstream services" with specific steps for diagnosing and mitigating similar issues.

The most important lesson: the incident was not caused by a bug. It was caused by a missing test (latency testing) and an architectural decision (synchronous external calls). The fix was not a code change: it was a process change. This is the essence of SRE: fixing the system, not just the symptom.

## Chaos Engineering Basics

Chaos engineering is the practice of deliberately injecting failures into production systems to test resilience. The goal is not to break things for fun: it is to find weaknesses before they cause incidents.

### Chaos Engineering Principles

1. **Start with a hypothesis.** "If the notification service goes down, the API should continue to function without sending emails."

2. **Design an experiment.** Inject a failure that tests the hypothesis. Kill the notification service pod, block network traffic, or introduce latency.

3. **Run the experiment in production.** Testing in staging is useful but not sufficient. Production has traffic patterns, data volumes, and dependencies that staging does not have.

4. **Monitor the results.** Watch the metrics, logs, and traces during the experiment. Does the system behave as expected?

5. **Automate and repeat.** Run the experiment regularly. A one-time test is not enough: systems change, and new weaknesses can appear.

### Common Chaos Experiments

**Pod kill:** Kill a random pod to test if the system recovers automatically.

```bash
# Kill a random pod in the payment service
kubectl delete pod -l app=payment-service -n production
```

**Network latency:** Add latency to a downstream service to test timeout handling.

```bash
# Add 2-second latency to the database connection
kubectl exec -it postgres-0 -n production -- tc qdisc add dev eth0 root netem delay 2000ms
```

**CPU stress:** Add CPU load to test autoscaling.

```bash
# Add CPU load to a pod
kubectl exec -it my-app-pod -n production -- stress-ng --cpu 2 --timeout 60s
```

**Disk fill:** Fill disk to test disk space monitoring and cleanup processes.

```bash
# Fill disk in a container
kubectl exec -it my-app-pod -n production -- dd if=/dev/zero of=/tmp/fill bs=1M count=1024
```

### Chaos Engineering Tools

**Chaos Monkey** (Netflix): Randomly terminates production instances to test resilience.

**Litmus** (CNCF): Kubernetes-native chaos engineering framework with predefined experiments.

**Gremlin**: Commercial chaos engineering platform with a web interface and pre-built experiments.

**ToxiProxy**: Network proxy for simulating network conditions (latency, packet loss, connection failures).

### Chaos Engineering Best Practices

1. **Start small.** Begin with non-critical systems and low-impact experiments. Do not start by killing the database.

2. **Have a kill switch.** Always have a way to stop the experiment immediately if something goes wrong.

3. **Run during business hours.** Chaos experiments in production should run when the team is available to respond. Do not run experiments at 3 AM.

4. **Notify the team.** Everyone should know that a chaos experiment is happening. Surprising people with production failures is not chaos engineering: it is chaos.

5. **Document results.** Record what happened, what broke, and what you learned. The value of chaos engineering is in the findings, not the failures.

## Assessment

**Lab Task 1: Incident Response Drill (90 minutes)**

Simulate a production incident with the following scenario:
- The application's database connection pool is exhausted
- Users are seeing 500 errors
- The error rate is 20%

Your task:
1. Detect the issue (using provided dashboards)
2. Triage and assign severity
3. Mitigate the issue (restore service)
4. Investigate the root cause
5. Document the timeline

You have 60 minutes to restore service and 30 minutes to write the timeline.

Grading criteria: Issue detected within 5 minutes (15%), severity correctly assigned (10%), mitigation restores service within 15 minutes (25%), root cause identified (20%), timeline is complete and accurate (20%), communication is clear (10%).

**Lab Task 2: Post-Mortem Writing (60 minutes)**

Using the incident from Task 1, write a complete post-mortem:
1. Summary
2. Impact assessment
3. Timeline
4. Root cause analysis
5. What went well
6. What went wrong
7. Where we got lucky
8. Action items with owners and due dates

Grading criteria: All sections present and complete (40%), action items are specific and actionable (25%), blameless tone maintained (15%), timeline is accurate (10%), lessons learned are meaningful (10%).

**Lab Task 3: Runbook Creation (60 minutes)**

Create runbooks for three common incidents:
1. High API error rate
2. Database connection exhaustion
3. Memory leak causing OOM kills

Each runbook should include symptoms, diagnosis steps, mitigation steps, escalation criteria, and verification steps.

Grading criteria: All three runbooks complete (40%), steps are clear and actionable (25%), escalation criteria are defined (15%), runbooks are tested (10%), documentation is clear (10%).

**Lab Task 4: Chaos Engineering Experiment (60 minutes)**

Design and execute a chaos engineering experiment:
1. Define a hypothesis about system resilience
2. Design the experiment (what failure to inject)
3. Execute the experiment in a test environment
4. Monitor the system during the experiment
5. Document the results and lessons learned

Grading criteria: Hypothesis is testable (15%), experiment design is sound (25%), experiment executed correctly (25%), monitoring captures relevant data (15%), results documented (20%).

## Evidence

The incident response process (detect, triage, mitigate, investigate, resolve, review) is based on industry-standard incident management practices documented in the ITIL framework and adapted for modern software systems by organizations including Google, PagerDuty, and Atlassian.

The severity levels (1-4) and their definitions are based on common industry practices. The specific thresholds (immediate response for Sev1, 15 minutes for Sev2) are consistent with the practices documented in the PagerDuty Incident Response documentation and the Google SRE book.

The post-mortem template follows the blameless post-mortem format developed by John Allspaw at Etsy and popularized by the DevOps community. The "Where We Got Lucky" section is a common addition that helps identify hidden risks.

SRE principles (error budgets, toil reduction, blameless culture) are documented in the Google SRE book "Site Reliability Engineering: How Google Runs Production Systems" and the follow-up "The Site Reliability Workbook." The error budget calculation and burn rate formulas are based on the SLO mathematics described in these books.

The on-call practices (rotation, escalation, compensation) are based on industry best practices documented by PagerDuty, Google SRE, and the broader DevOps community. The PagerDuty configuration examples follow the PagerDuty API and documentation.

Runbook creation follows the format recommended by PagerDuty, Atlassian, and other incident management platforms. The runbook examples are designed for readability under stress, with clear steps and explicit escalation criteria.

The real-world incident story is based on common patterns in production outages. The sequence (deploy, break, diagnose, mitigate, investigate, fix) is typical of deployment-related incidents. The systemic issues identified (missing latency testing, synchronous external calls, insufficient alerting) are common failure modes in distributed systems.

Chaos engineering principles are based on the principles defined by Netflix (which created Chaos Monkey) and the principles documented in the O'Reilly book "Chaos Engineering" by Casey Rosenthal, Nora Jones, and Russ Miles. The experiments described (pod kill, network latency, CPU stress) are common chaos engineering practices used in Kubernetes environments.