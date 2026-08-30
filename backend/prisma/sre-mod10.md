# Module 10 — Continuous Improvement

## What You'll Actually Do

You'll set up a metrics-driven improvement process, run a team retrospective that actually changes something, and build a culture where reliability gets better every month. Not a one-time project — a sustainable practice.

## The Improvement Cycle

Reliability isn't a destination. It's a process.

```
1. Measure   → Collect data on what's happening
2. Analyze   → Find patterns and root causes
3. Prioritize → Decide what to fix first
4. Implement → Make the change
5. Verify    → Did it actually help?
6. Repeat    → Never stop improving
```

Without this cycle, you're just reacting to incidents and hoping things get better.

## Building a Reliability Review

Monthly reliability reviews keep the team honest.

```
Reliability review agenda:
  1. SLO compliance this month (5 min)
     - Are we meeting targets?
     - Error budget status?
  
  2. Incident review (10 min)
     - How many incidents?
     - What were the top causes?
     - Any patterns?
  
  3. Action item check (10 min)
     - Did we complete last month's items?
     - Any blocked items?
  
  4. Metrics trend (5 min)
     - Are things getting better or worse?
     - What's the trend over 3 months?
  
  5. Next month's focus (5 min)
     - What are we going to improve?
     - Who owns what?
```

## Metrics That Matter

Track these over time. Single data points are meaningless — trends are everything.

```
Reliability metrics:
  - SLO compliance (% of time meeting target)
  - Error budget remaining (trend over months)
  - Mean time to detect (MTTD) — how fast do we know?
  - Mean time to resolve (MTTR) — how fast do we fix?
  - Incident count (trend, not absolute number)
  - Change failure rate (% of deploys causing incidents)
  - Toil percentage (manual work vs total work)

Review monthly. Compare to previous months. Celebrate improvements.
```

```
Example 3-month trend:
Month    | SLO    | MTTD  | MTTR  | Incidents
---------|--------|-------|-------|----------
January  | 99.8%  | 8 min | 45 min| 12
February | 99.85% | 5 min | 32 min| 9
March    | 99.92% | 3 min | 18 min| 5
```

## Retrospectives

Retrospectives are team discussions about what's working and what isn't. Most retros fail because they don't lead to action.

```
Retrospective format:

What went well? (10 min)
  - Each person writes 2-3 things on sticky notes
  
What didn't go well? (10 min)
  - Each person writes 2-3 things on sticky notes
  
What should we try? (10 min)
  - Group similar items
  - Discuss top 3
  - Assign owners and deadlines

Rules:
  - No blaming individuals
  - Focus on process, not people
  - Every "didn't go well" needs a "try this instead"
  - Assign owners — unassigned items die
```

## Building a Learning Culture

```
Practices that build culture:

1. Blameless post-mortems
   - Every incident gets a post-mortem
   - Focus on systems, not people
   - Share post-mortems across teams

2. Knowledge sharing
   - Monthly tech talks
   - Runbooks are maintained
   - Documentation is current

3. Experimentation
   - Time for chaos engineering
   - Time for tool improvement
   - Time for learning

4. Recognition
   - Celebrate reliability wins
   - Recognize people who fix systemic problems
   - Reward transparency about failures
```

## Kaizen (Continuous Improvement)

Small, incremental changes compound over time.

```
Kaizen principles:
  - Make small changes frequently
  - Every change is an experiment
  - Measure the result
  - Keep what works, discard what doesn't
  - Everyone participates

Example monthly kaizen:
  Month 1: Add alerting for connection pool exhaustion
  Month 2: Automate certificate rotation
  Month 3: Add integration tests for payment flow
  Month 4: Reduce MTTR by adding better dashboards
  Month 5: Eliminate one source of toil
```

## Lab Task — Build an Improvement Process

You're given a team scenario with 3 months of incident data. Your job:

1. **Analyze the data** — Find patterns, trends, and the biggest opportunities
2. **Run a retrospective** — Facilitate a team retrospective using the data
3. **Create an improvement plan** — Prioritized list of changes with owners and dates
4. **Build a metrics dashboard** — Track the key metrics over time
5. **Write a 30-60-90 day plan** — What the team should focus on in each period

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: Data analysis identifies real patterns
- 2 points: Retrospective is well-facilitated with actionable outcomes
- 2 points: Improvement plan is prioritized and realistic
- 2 points: Metrics dashboard tracks meaningful indicators
- 2 points: 30-60-90 day plan is specific and achievable

## Evidence

- `data-analysis.md` — your analysis of the incident data
- `retrospective-notes.md` — what came out of the retro
- `improvement-plan.md` — prioritized action items with owners
- `dashboard.md` — your metrics dashboard design
- `30-60-90-plan.md` — your phased improvement plan
