# Module 7 — Incident Management

## What You'll Actually Do

You'll be on-call for a simulated production environment. Alerts will fire, services will break, and you'll have to triage, communicate, and resolve issues under time pressure. You'll practice the difference between a 3-minute incident and a 3-hour incident.

## On-Call Reality

Being on-call means your phone can ring at 3 AM and you have to wake up, figure out what's wrong, and fix it. Or decide it can wait.

```
On-call responsibilities:
  - Acknowledge alerts within 5 minutes
  - Triage: Is this actually broken or just noisy?
  - If broken: How bad is it?
  - If bad: Who needs to know?
  - Fix it or escalate it
  - Document what happened
```

## Incident Severity

```
SEV1 — Production down, all users affected
  Response: Immediate. All hands. War room.
  Comms: Every 15 minutes to leadership

SEV2 — Production degraded, many users affected
  Response: Within 15 minutes. On-call + support.
  Comms: Every 30 minutes

SEV3 — Non-critical system down, few users affected
  Response: Within 1 hour. On-call handles.
  Comms: Status page update

SEV4 — Minor issue, workaround available
  Response: Next business day. Ticket queue.
  Comms: Internal ticket only
```

## The Incident Commander Role

Someone needs to be in charge. That's the IC.

```
IC responsibilities:
  - Own the incident (not the fix, the process)
  - Assign roles: who's investigating, who's communicating
  - Keep the timeline
  - Make escalation decisions
  - Call the all-clear

IC does NOT:
  - Debug the problem (they're coordinating)
  - Make technical decisions (that's the subject matter expert)
  - Go heads-down on one thing (they need the big picture)
```

## Communication Templates

```
Status page update (SEV1):
  "We are investigating reports of service degradation.
   Some users may experience errors or slow responses.
   We will provide an update in 15 minutes."

Internal update (Slack/Teams):
  "SEV1: [Service] experiencing [symptom].
   Impact: [percentage] of users affected.
   Current status: Investigating.
   IC: [name]
   War room: [link]"

Customer email (post-incident):
  "On [date], [service] experienced [issue] from [start] to [end].
   [X] users were affected. The root cause was [brief explanation].
   We have implemented [preventive measure] to avoid recurrence."
```

## Incident Timeline

Every incident needs a timeline. Start it when the alert fires.

```
Timeline template:
  14:32 - Alert fires: API error rate > 5%
  14:33 - On-call acknowledges
  14:35 - War room opened
  14:37 - Root cause identified: database connection pool exhausted
  14:38 - Action: Increased pool size from 20 to 100
  14:39 - Error rate dropping
  14:45 - Error rate back to normal
  14:50 - All-clear sent
  Total duration: 18 minutes
```

## Escalation

```
Escalation triggers:
  - Can't identify root cause within 15 minutes
  - Fix requires access you don't have
  - Fix requires changes to infrastructure you don't own
  - Business impact is higher than expected
  - Multiple systems affected (potential cascade)

Escalation path:
  1. On-call engineer
  2. Team lead / senior engineer
  3. Engineering manager
  4. VP/Director (if business-critical)
```

## Lab Task — Incident Simulation

You'll be on-call for a simulated environment. Alerts will fire and you'll respond in real-time.

1. **Respond to alerts** — Acknowledge, triage, and resolve at least 3 incidents
2. **Run the war room** — Practice being IC: assign roles, keep timeline, communicate
3. **Practice escalation** — At least one incident should require escalation
4. **Write incident reports** — Document what happened, what you did, what went well
5. **Communicate clearly** — Practice status updates and customer communication

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: Alerts acknowledged within SLA
- 2 points: Incidents triaged correctly (right severity)
- 2 points: War room process followed
- 2 points: Escalation handled properly
- 2 points: Incident reports are complete

## Evidence

- `incident-log.md` — timeline for each incident
- `war-room-notes.md` — your IC notes
- `escalation-record.md` — what triggered escalation and outcome
- `incident-reports/` — completed reports for each incident
