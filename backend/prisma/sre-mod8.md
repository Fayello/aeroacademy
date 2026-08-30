# Module 8 — Post-Mortems

## What You'll Actually Do

Something broke. Now you need to write about it honestly, find the real root cause (not the first thing that sounds plausible), and create action items that actually get done. You'll read real post-mortems, write your own, and learn the difference between blame and accountability.

## The Point of a Post-Mortem

A post-mortem isn't about blame. It's about learning. If your post-mortem makes someone feel bad, you're doing it wrong.

```
What a post-mortem IS:
  - A document that explains what happened and why
  - A process that finds systemic problems
  - A commitment to fix things so they don't happen again
  - A way to share knowledge across teams

What a post-mortem is NOT:
  - A punishment
  - A performance review
  - A place to say "John broke it"
  - A one-time exercise that goes nowhere
```

## Blameless Culture

Blameless doesn't mean nobody is responsible. It means we focus on the system, not the individual.

```
Blame:
  "Sarah deployed bad code and caused the outage."
  → Sarah feels terrible. Nobody else learns anything.
  → Next person makes the same mistake.

Blameless:
  "The deployment pipeline didn't catch a regression because
   there were no integration tests for the payment flow."
  → The system had a gap.
  → We fix the system (add tests).
  → Everyone learns, nobody is punished.
```

The key question: "How did our systems allow this to happen?" not "Who allowed this to happen?"

## Post-Mortem Template

```markdown
# Incident: [Title]
Date: [Date]
Duration: [Start] to [End] ([total time])
Severity: [SEV1/2/3/4]
Author: [Name]

## Summary
One paragraph. What broke, how bad was it, how did we fix it.

## Impact
- Users affected: [number or percentage]
- Revenue impact: [if applicable]
- SLA/SLO impact: [did we breach?]
- Other systems affected: [list]

## Timeline
| Time  | Event                              |
|-------|------------------------------------|
| 14:32 | Alert fires: API error rate > 5%  |
| 14:33 | On-call acknowledges               |
| 14:35 | Root cause identified              |
| 14:38 | Fix deployed                       |
| 14:45 | Service recovered                  |

## Root Cause
The actual root cause. Not "bad code" — why did the bad code get through?
What conditions allowed this to happen?

## Contributing Factors
- Factor 1: [description]
- Factor 2: [description]
- Factor 3: [description]

## What Went Well
- Thing 1 that worked
- Thing 2 that worked

## What Went Wrong
- Thing 1 that didn't work
- Thing 2 that didn't work

## Action Items
| # | Action                              | Owner   | Due Date |
|---|-------------------------------------|---------|----------|
| 1 | Add integration tests for payments | Sarah   | 2024-02-15 |
| 2 | Set up alert for connection pool    | Mike    | 2024-02-10 |
| 3 | Update runbook with new procedure  | Alex    | 2024-02-08 |
```

## Writing Good Action Items

Bad action items don't get done. Good ones have owners, dates, and specific outcomes.

```
Bad action items:
  "Improve monitoring"
  "Make sure this doesn't happen again"
  "Review the system"
  "Consider adding tests"

Good action items:
  "Add p99 latency alert for /api/checkout at 500ms threshold — Owner: Mike, Due: Feb 10"
  "Add integration tests covering payment flow error handling — Owner: Sarah, Due: Feb 15"
  "Update runbook with steps for connection pool exhaustion — Owner: Alex, Due: Feb 8"
  "Schedule architecture review of retry logic — Owner: Team lead, Due: Feb 20"
```

Rule: If you can't complete the action item in a week, break it into smaller items.

## Following Up

Action items without follow-up are fiction. Someone needs to track them.

```
Follow-up process:
  1. IC owns action items until completed
  2. Weekly check: Are items on track?
  3. If an item is blocked, escalate immediately
  4. Don't let items rot in the backlog
  5. Report completion status in team meeting
```

## Lab Task — Write a Post-Mortem

You're given a scenario where a production service went down for 45 minutes. Write a complete post-mortem.

1. **Read the incident details** — Timeline, logs, and root cause information provided
2. **Write the post-mortem** — Follow the template. Be specific, not vague.
3. **Identify root cause** — Go beyond "bad code." What systemic issue allowed this?
4. **Create action items** — At least 4, with owners and dates
5. **Review for blameless language** — Rewrite any blaming statements

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: Summary is clear and accurate
- 2 points: Root cause analysis goes deep enough
- 2 points: Timeline is complete with correct timestamps
- 2 points: Action items are specific, owned, and dated
- 2 points: Language is blameless throughout

## Evidence

- `post-mortem.md` — your completed post-mortem
- `action-items.md` — extracted action items with owners and dates
