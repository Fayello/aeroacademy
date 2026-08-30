# Module 10 — Post-Incident Review

## What You'll Actually Do

The incident is over. The systems are back up. But the job isn't done until you figure out what went wrong, what went right, and how to make sure it doesn't happen again. You'll run a blameless post-mortem, create actionable improvement items, and build a feedback loop that makes your team stronger.

## Why Post-Incident Reviews Matter

```text
Without a review:
- Same incident happens again in 6 months
- Team burns out from repeated heroics
- Root cause never gets fixed
- Management loses confidence in the team

With a review:
- Gaps get identified and fixed
- Runbooks improve
- Detection rules get better
- Team builds muscle memory
- Costs drop over time
```

## The Blameless Post-Mortem

```text
Rules for the post-mortem meeting:
1. Focus on systems, not people
   BAD: "John clicked the phishing link"
   GOOD: "The email filtering didn't catch the lure, and there was no user training"

2. Assume good intent
   Everyone was trying to do the right thing with what they knew

3. Document facts, not opinions
   BAD: "The response was slow"
   GOOD: "Alert fired at 14:00, containment started at 15:30"

4. Be specific about improvements
   BAD: "Improve monitoring"
   GOOD: "Add a Sigma rule for PowerShell encoded commands"
```

## Post-Mortem Template

```text
INCIDENT POST-MORTEM
====================

Incident Title:  [Brief description]
Date:            [Date of incident]
Duration:        [How long from detection to resolution]
Severity:        [SEV1/SEV2/SEV3/SEV4]
Incident Lead:   [Who led the response]

SUMMARY
-------
[2-3 sentences describing what happened]

TIMELINE
--------
HH:MM — First alert triggered
HH:MM — Analyst acknowledged alert
HH:MM — Containment initiated
HH:MM — Root cause identified
HH:MM — Eradication complete
HH:MM — Systems restored
HH:MM — Incident declared resolved

ROOT CAUSE
----------
[Detailed technical explanation of why this happened]

IMPACT
------
- Systems affected: [list]
- Data exposed: [yes/no, what data]
- Users affected: [number]
- Business impact: [revenue, reputation, compliance]

WHAT WENT WELL
--------------
- [Thing 1]
- [Thing 2]

WHAT WENT WRONG
---------------
- [Thing 1]
- [Thing 2]

WHERE WE GOT LUCKY
-------------------
- [Thing 1 — what could have been worse]

ACTION ITEMS
------------
- [ ] [Owner]: [Specific action] — Due: [Date]
- [ ] [Owner]: [Specific action] — Due: [Date]
- [ ] [Owner]: [Specific action] — Due: [Date]
```

## From Incident to Improvement

```text
Convert each finding into a concrete action:

FINDING                          ACTION                          OWNER
Email filter missed lure        → Deploy advanced email filter   → Security
No user phishing training       → Implement quarterly training   → HR/Security
Detection took 90 minutes       → Add Sigma rule for this TTP    → SOC
Credential rotation was manual  → Automate with Ansible          → Ops
Runbook outdated                → Update runbook with new steps  → IR Lead
No network segmentation         → Implement VLAN segmentation    → NetOps
```

## Tracking Improvements

```text
After the review, track these items:

1. Action item completion rate
   - Are items getting done?
   - Are deadlines being met?

2. Incident frequency over time
   - Are the same incidents happening again?
   - Are new types of incidents appearing?

3. Mean time to detect (MTTD)
   - How fast are we finding threats?

4. Mean time to respond (MTTR)
   - How fast are we containing them?

5. Process improvement
   - Are runbooks being updated?
   - Are detection rules being tuned?
   - Is the team getting faster?
```

## Building a Feedback Loop

```text
Continuous improvement cycle:

1. Incident happens
2. Respond and contain
3. Post-mortem review
4. Create action items
5. Implement improvements
6. Test improvements (tabletop exercises, red team)
7. Monitor for new incidents
8. Repeat

This is how you get better. Not by being heroes, but by building systems that prevent incidents or catch them earlier.
```

## Real Task: Run a Post-Mortem

```text
You're given:
- A timeline of a recent incident (data breach via phishing)
- Response logs from the IR team
- System logs from the affected servers
- Notes from the incident commander

Your job:
1. Write a complete post-mortem using the template
2. Identify root cause (technical and process)
3. Create at least 5 specific, actionable improvement items
4. Assign owners and deadlines to each item
5. Propose metrics to track whether improvements are working
6. Present the post-mortem to the class as if it were a real team meeting
```

## Assessment

**Lab task (30 min):**

1. Write a complete post-mortem for a given incident
2. Create a detailed timeline from detection to resolution
3. Identify root cause and contributing factors
4. Create 5+ actionable improvement items with owners
5. Propose measurable metrics for tracking progress
6. Present findings in a blameless, constructive format

**Grading:**
- Post-mortem complete and well-structured: 20%
- Timeline accurate and detailed: 15%
- Root cause analysis thorough: 20%
- Action items specific and measurable: 20%
- Metrics proposed: 10%
- Presentation professional: 15%

## Evidence

- **OutcomeEvidence:** `IR-LO10 — Post-Incident Review`
