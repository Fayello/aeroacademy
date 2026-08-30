# Module 2 — Detection and Triage

## What You'll Actually Do

Alerts are coming in. Some are real, most are noise. You'll learn to work with SIEM data, write detection rules that actually catch threats, and triage alerts without burning out. The goal isn't to investigate every alert — it's to identify the ones that matter.

## The Alert Problem

A typical SOC gets thousands of alerts per day. Most are false positives or low-sigma noise. Your job is to build a system that surfaces real threats.

```text
Common alert sources:
- Authentication logs (failed logins, impossible travel)
- Network logs (unusual outbound traffic, port scans)
- Endpoint logs (new processes, registry changes)
- Application logs (injection attempts, privilege escalation)
- Cloud logs (IAM changes, S3 access patterns)
```

## SIEM Querying Basics

Most SIEM tools (Splunk, ELK, Sentinel) use a query language. The patterns are similar.

```bash
# Splunk — find failed logins in the last 24 hours
index=auth_log action=failure
| stats count by src_ip, user
| where count > 10
| sort -count

# ELK/Kibana — same query in KQL
event.code: "4625" AND winlog.channel: "Security"
| stats count by source.ip, user.name
| where count > 10

# Splunk — find processes spawned by PowerShell
index=sysmon EventCode=1 ParentImage="*powershell*"
| table _time, user, ParentImage, Image, CommandLine

# ELK — detect new service installations
event.code: "7045" AND winlog.channel: "System"
| stats count by winlog.event_data.ServiceName, winlog.event_data.ImagePath
```

## Writing Detection Rules

A good detection rule has three parts: what to look for, when to alert, and what it means.

```text
Rule: Suspicious PowerShell Execution
  WHAT: Process creation with ParentImage containing powershell
  CONDITION: CommandLine contains encoded command, download cradle, or suspicious flags
  SEVERITY: High
  RESPONSE: Alert and capture process tree

Rule: Brute Force Attempt
  WHAT: Authentication failure events from same source
  CONDITION: >10 failures in 5 minutes to same account
  SEVERITY: Medium
  RESPONSE: Alert, consider temporary account lock

Rule: Lateral Movement via SMB
  WHAT: New SMB connections between workstations
  CONDITION: Workstation-to-workstation SMB (not to/from servers)
  SEVERITY: High
  RESPONSE: Alert and capture source/destination, user context
```

## Triage Workflow

When an alert hits, follow this process:

```text
Step 1: Validate — Is this real?
  - Check: Does the source IP belong to a known proxy/VPN?
  - Check: Is this a scheduled task or automation?
  - Check: Does the user have a history of similar activity?

Step 2: Scope — How bad is it?
  - Single system or multiple?
  - Is the activity still ongoing?
  - What data/systems does the user or source have access to?

Step 3: Prioritize — Where do I focus first?
  - Active compromise > historical alert
  - Admin accounts > standard users
  - Internet-facing > internal only
  - Data access > reconnaissance

Step 4: Act — What do I do now?
  - Immediate action: disable account, block IP, isolate host
  - Investigation: pull logs, capture memory, image disk
  - Escalation: notify team, engage legal if needed
```

## Real Task: Triage and Detection

You'll be given a set of SIEM alerts. Your job:

```text
Alert 1: 47 failed login attempts from 203.0.113.45 to admin@corp.local
Alert 2: New scheduled task created on WORKSTATION-04 (never seen before)
Alert 3: Outbound connection from 10.0.1.50 to 45.33.32.156 on port 4444
Alert 4: User jsmith downloaded 47 files from S3 bucket "financial-records" between 2 AM and 4 AM
Alert 5: DNS queries to randomly generated domain names from 10.0.2.15

For each alert:
1. Is it real or false positive? What makes you think that?
2. What's the severity? Justify your rating.
3. What's your next action? Be specific.
```

## Assessment

**Lab task (25 min):**

1. Write 3 SIEM detection rules for different attack techniques
2. Triage 5 alerts from a simulated alert queue
3. For each alert: determine validity, severity, and next action
4. Document your triage decisions and reasoning
5. Identify which alert is the highest priority and why

**Grading:**
- Detection rules well-defined: 20%
- Triage decisions logical: 25%
- Severity ratings justified: 20%
- Actions appropriate: 20%
- Prioritization correct: 15%

## Evidence

- **OutcomeEvidence:** `IR-LO2 — Detection and Triage`
