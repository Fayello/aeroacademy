# Module 2 — SLIs, SLOs, SLAs

## What You'll Actually Do

You're going to take a real service, figure out what actually matters to its users, and define measurable targets. Then you'll build the monitoring to track those targets and write the SLA that goes to customers. This is where reliability goes from vibes to numbers.

## The Measurement Hierarchy

```
SLI → SLO → SLA
What you   What you    What you
measure    promise     contract
```

- **SLI (Service Level Indicator)**: The raw metric you're tracking. Availability percentage, latency percentile, error rate.
- **SLO (Service Level Objective)**: The target you've set internally. "We aim for 99.9% availability."
- **SLA (Service Level Agreement)**: The contract with your customer. Usually less aggressive than your SLO, with penalties if missed.

```
Example:
  SLI: 99.95% of requests return successfully in < 500ms
  SLO: 99.9% availability (internal target, more aggressive)
  SLA: 99.5% availability (contractual, with credits if missed)
```

The gap between SLO and SLA gives you room to fix problems before you breach your contract.

## Choosing the Right SLIs

Not all metrics matter. Pick SLIs that reflect user experience, not system internals.

```
Good SLIs:
  - Request latency (p50, p99)
  - Error rate (5xx responses)
  - Availability (successful requests / total requests)
  - Throughput (requests per second)

Bad SLIs:
  - CPU utilization (users don't care)
  - Memory usage (users don't care)
  - Disk I/O (users don't care)
  - Number of pods running (implementation detail)
```

The question to ask: "If this metric degrades, will users notice?"

## Calculating SLIs

Availability is the most common SLI. Here's how to calculate it properly:

```
Availability = (good requests / total requests) * 100

A request is "good" if:
  1. It completed successfully (2xx status)
  2. It completed within the latency threshold
  3. It returned correct data (if measurable)

Example:
  10,000 total requests
  9,950 returned 2xx in < 500ms
  30 returned 2xx but took > 500ms
  20 returned 5xx

  Availability = 9,950 / 10,000 = 99.5%
```

Don't count 2xx that took too long as "good." Users experienced a slow response — that's a reliability hit.

## SLO Error Budget Math

```
SLO = 99.9%
Period = 30 days = 43,200 minutes
Budget = 0.1% × 43,200 = 43.2 minutes

If you've had 15 minutes of downtime this month:
  Budget used = 15 / 43.2 = 34.7%
  Budget remaining = 65.3%
  Status: GREEN
```

```
Burn rate: How fast you're consuming your budget
Ideal burn rate = 1.0 (using budget at the expected rate)

Burn rate > 1.0 → eating budget too fast
Burn rate < 1.0 → saving budget

14-day window burn rate = (total errors this period) / (allowed errors in window)

Example:
  Allowed errors in 14 days: 201.6 minutes (at 99.9% SLO)
  Actual errors this 14 days: 60 minutes
  Burn rate: 60 / 201.6 = 0.297 (healthy)
```

## Writing an SLA

An SLA is a business document, not a technical one. Keep it simple.

```
Template:

Service: [Service Name]
Measurement Period: Rolling 30 days
Availability Target: 99.5%
Measurement Method: Successful HTTP responses / total requests

Service Credits:
  - Availability 99.0% – 99.5%: 10% credit on next invoice
  - Availability 95.0% – 99.0%: 25% credit
  - Below 95.0%: 50% credit

Exclusions:
  - Scheduled maintenance (max 4 hours/month, announced 72h in advance)
  - Force majeure events
  - Issues caused by customer misconfiguration
```

Key principle: your SLA target should be LOWER than your SLO. If you're aiming for 99.9% internally, don't promise 99.9% to customers. Promise 99.5%. That gives you buffer to fix things before you owe credits.

## Lab Task — Build an SLI Dashboard and Write an SLA

You're given a running web service with three endpoints. Your job:

1. **Define SLIs** for each endpoint — What matters? Latency? Error rate? Both?
2. **Set SLOs** — Choose targets that are ambitious but achievable
3. **Build a monitoring script** — Write a script that queries the metrics endpoint and calculates SLI compliance over a rolling 24-hour window
4. **Write an SLA** — Create a 1-page SLA document suitable for sending to a customer
5. **Calculate your error budget** — Based on actual metrics, determine budget status

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: SLIs are user-facing and meaningful
- 2 points: SLOs are realistic with justification
- 3 points: Monitoring script works and calculates correctly
- 2 points: SLA is clear, professional, and excludes the right things
- 1 point: Error budget calculation matches actuals

## Evidence

- `sli-definitions.md` — your SLI choices with rationale
- `slo-targets.md` — your SLO targets and reasoning
- `monitor.py` (or `.sh`) — your monitoring script
- `sla-document.md` — the customer-facing SLA
- `budget-report.txt` — current error budget status
