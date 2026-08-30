# Module 1 — Incident Response Process

## What You'll Actually Do

Something breaks. Maybe a server is compromised, maybe data is leaking, maybe ransomware just hit a workstation. Your job isn't to panic — it's to follow a process. You'll walk through the six phases of incident response, build a runbook you can actually use at 3 AM, and practice scoping an incident before it spirals.

## What IR Actually Means

Incident response is structured problem-solving under pressure. It's not about having every answer — it's about knowing what questions to ask and in what order.

```text
The six phases:
1. Preparation    — Build the playbook before you need it
2. Detection       — Something triggered an alert
3. Containment     — Stop the bleeding
4. Eradication     — Remove the threat
5. Recovery        — Get back to normal
6. Post-Incident   — Learn and get better
```

Most teams skip preparation and go straight to heroics. Heroics don't scale. A written process does.

## Building an IR Runbook

Your runbook is a step-by-step guide for common incident types. It should be specific enough that a junior analyst can follow it.

```markdown
# Runbook: Suspected Credential Compromise

## Trigger
- Alert: Impossible travel detected
- Alert: Multiple failed logins followed by success
- User report: "I didn't log in from that location"

## Immediate Steps (first 15 minutes)
1. Confirm the alert is real (not a false positive)
   - Check: `grep "198.51.100.50" /var/log/auth.log`
   - Verify: Is this IP from a VPN or known proxy?
2. Disable the account temporarily
   - `sudo passwd --lock username`
3. Notify the user and their manager
4. Document the timestamp and your actions

## Investigation (next hour)
1. Pull all auth logs for the affected account
2. Check for new SSH keys or API tokens created
3. Review any sudo or privilege escalation
4. Check cloud console for new resources or IAM changes

## Containment
- Revoke active sessions
- Force password reset
- Rotate any API keys or service accounts

## Recovery
- Restore access only after verification
- Monitor the account for 72 hours
- Check for lateral movement to other systems

## Escalation
- If data exfiltration is suspected → notify legal
- If ransomware → activate the full IR team
```

## Incident Severity Levels

Not every alert is a five-alarm fire. You need to triage.

```text
SEV1 — Critical
  Data breach, active ransomware, production systems compromised
  Response: All hands, war room, executive notification

SEV2 — High
  Confirmed compromise but contained, single system affected
  Response: IR team lead, 1-hour SLA

SEV3 — Medium
  Suspicious activity, unconfirmed, or limited impact
  Response: On-call analyst, 4-hour SLA

SEV4 — Low
  Policy violation, misconfiguration, no active threat
  Response: Ticket queue, next business day
```

## Scoping an Incident

When an alert fires, your first job is to answer three questions:

```text
1. What happened?
   - What system or account is affected?
   - What did the attacker do?
   - What data was accessed?

2. How bad is it?
   - Is it still happening?
   - How many systems are affected?
   - Is there lateral movement?

3. What's the blast radius?
   - What other systems can reach the compromised one?
   - What credentials or data might be exposed?
   - What's the regulatory implication?
```

## Real Task: Build a Runbook

Pick one of these scenarios and write a runbook from scratch:

```text
Scenario A: Web server showing signs of compromise
  - Unusual outbound traffic detected
  - Unknown process running as www-data
  - Access logs show anomalous requests

Scenario B: Employee account flagged for impossible travel
  - Login from New York, then 15 minutes later from Tokyo
  - Account has access to sensitive databases
  - MFA was not enabled on the account

Scenario C: Ransomware detected on a workstation
  - Files renamed with .locked extension
  - Workstation is on the same VLAN as file shares
  - User reports "something popped up and files started changing"
```

Your runbook must include:
- Clear trigger conditions
- Step-by-step actions for the first 15 minutes
- Investigation checklist
- Containment and recovery steps
- Escalation criteria

## Assessment

**Lab task (30 min):**

1. Write a complete runbook for one of the three scenarios above
2. Follow the runbook format: trigger, immediate steps, investigation, containment, recovery, escalation
3. Include specific commands, not just descriptions
4. Test the runbook by walking through it on a test system
5. Document any gaps or assumptions you found

**Grading:**
- Trigger conditions clear: 15%
- Immediate steps actionable: 25%
- Investigation thorough: 20%
- Containment and recovery complete: 20%
- Escalation criteria defined: 10%
- Commands work as written: 10%

## Evidence

- **OutcomeEvidence:** `IR-LO1 — Incident Response Process`
