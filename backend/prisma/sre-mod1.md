# Module 1 — SRE Fundamentals

## What You'll Actually Do

You'll set up a production-like service, define what "working" actually means, and then watch it fail. Your job is to measure the failures, decide how much failure is acceptable, and build the guardrails that keep the team honest about reliability. No slides — you're going to manage error budgets in a real scenario.

## What SRE Actually Is

SRE is what happens when you treat operations as a software problem. Instead of someone manually fixing things and calling it "ops," you write code to automate the messy parts and measure everything.

Google coined the term, but the idea is simple:

```
SRE = Software engineering applied to operations problems
```

The core insight is that reliability is a feature, not a binary state. Your service isn't "up" or "down" — it's performing at some level, and your users care about how often it performs well enough for them.

## The Error Budget

An error budget is the maximum amount of failure your team has agreed is acceptable. It's the inverse of your SLO.

```
If your SLO is 99.9% uptime:
  Error budget = 100% - 99.9% = 0.1%
  0.1% of 30 days = 43.2 minutes of downtime
  That's your budget for the month
```

When you're under budget, you can ship aggressively — new features, risky changes, experiments. When you're over budget, you stop and fix reliability. It's a forcing function.

```
Error budget remaining = SLO - actual performance

Example:
  SLO: 99.9% (0.1% budget)
  Actual this month: 99.95% (0.05% actual)
  Budget used: 0.05% / 0.1% = 50%
  Status: GREEN — you have budget to burn
```

## The Four Golden Signals

These are the four things you should always measure for any service. If you only monitor four things, monitor these:

```
Latency      — How long a request takes
Traffic      — How much demand hits your service
Errors       — How many requests fail
Saturation   — How "full" your service is
```

```
# Example: monitoring a web service
Latency:   p50=45ms, p99=230ms, p999=1.2s
Traffic:   12,000 requests/sec
Errors:    0.3% error rate (4xx + 5xx)
Saturation: CPU at 62%, memory at 71%, disk at 43%
```

## SRE vs Traditional Ops

```
Traditional Ops:
  - "Keep it running" is the goal
  - Success = nothing breaks
  - Manual intervention is normal
  - Metrics are reviewed weekly

SRE:
  - "Keep it running" is a side effect
  - Success = users have a good experience
  - Manual intervention is a bug to fix
  - Metrics are reviewed in real-time
```

The biggest shift is that SRE teams have a budget for failure. Ops teams treated every failure as a catastrophe. SRE says: some failure is inevitable, so measure it and manage it.

## Building a Reliability Dashboard

You need a dashboard that answers one question: "Are we within budget?"

```
Components of a reliability dashboard:
1. Current SLO compliance (green/yellow/red)
2. Error budget remaining (minutes or percentage)
3. Burn rate (how fast you're eating budget)
4. Historical trend (are we getting better or worse?)
5. Per-service breakdown
```

## Lab Task — Error Budget Simulation

You'll run a simulated service for one hour. The service has three failure modes: latency spikes, error rate increases, and downtime. Your job:

1. **Define an SLO** — Pick an availability target (e.g., 99.9%, 99.5%) and a latency target (e.g., p99 < 500ms)
2. **Monitor the service** — Use the provided metrics endpoint to track the four golden signals
3. **Calculate the error budget** — After the hour, determine how much budget you used
4. **Decide: ship or fix?** — Based on your budget status, decide whether the team should deploy a risky new feature or focus on reliability
5. **Write a 1-page decision brief** — Justify your decision with the data

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: SLO is realistic and well-defined
- 2 points: Metrics collected and documented correctly
- 2 points: Error budget calculation is accurate
- 2 points: Decision is justified with data
- 2 points: Decision brief is clear and professional

## Evidence

- `slo-definition.md` — your chosen SLO with justification
- `metrics-log.csv` — the raw metrics you collected
- `error-budget-calc.txt` — your budget calculation
- `decision-brief.md` — your ship-or-fix decision with reasoning
