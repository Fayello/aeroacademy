# Module 5 — Capacity Planning

## What You'll Actually Do

You'll monitor a service's resource usage, forecast when it'll hit limits, and provision capacity before it runs out. You'll also run a load test to see what actually breaks your service. No guessing — data-driven decisions.

## Why Capacity Planning Matters

Running out of capacity is the most avoidable outage. It's also the most embarrassing. Someone should have seen it coming.

```
Capacity failure scenarios:
- CPU maxed out → requests queue up → timeouts cascade
- Memory exhausted → OOM kills → service restarts in a loop
- Disk full → writes fail → data corruption
- Network saturated → packet drops → latency spikes
- Connection pool exhausted → requests block → service hangs
```

Every one of these has a warning. You just have to be looking.

## Resource Monitoring

Track these for every service:

```
CPU:
  - Utilization % (average and peak)
  - Load average (1, 5, 15 minute)
  - Context switches per second

Memory:
  - Used / Available / Cached
  - Swap usage (should be zero for most services)
  - Memory allocation rate

Disk:
  - Used / Total / IOPS
  - Read/write latency
  - Disk queue depth

Network:
  - Bandwidth utilization (in/out)
  - Packet drops
  - Connection count
```

```bash
# Quick resource check
top -bn1 | head -5
free -h
df -h
iostat -x 1 3
ss -s
```

## Capacity Forecasting

Use historical data to predict when you'll need more capacity.

```
Forecasting method:

1. Collect daily peak metrics for 30 days
2. Calculate the trend (linear regression or simple growth rate)
3. Extrapolate to find when you hit 80% capacity
4. Order capacity with enough lead time

Example:
  Current CPU peak: 45%
  Growth rate: 2% per week
  Threshold: 80%
  Weeks until threshold: (80 - 45) / 2 = 17.5 weeks
  Action: Order new servers in 12 weeks (5 weeks buffer)
```

```
Simple growth calculation:
  Day 1 CPU: 40%
  Day 30 CPU: 52%
  Daily growth: (52 - 40) / 30 = 0.4% per day
  Days until 80%: (80 - 52) / 0.4 = 70 days
```

## Load Testing

You can't plan capacity without knowing your limits. Load testing tells you where the ceiling is.

```bash
# Apache Bench — simple load test
ab -n 10000 -c 100 http://localhost:8080/api/endpoint

# k6 — more realistic
import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },   // ramp up
    { duration: '3m', target: 50 },   // hold
    { duration: '1m', target: 200 },  // spike
    { duration: '3m', target: 200 },  // hold at spike
    { duration: '1m', target: 0 },    // ramp down
  ],
};

export default function () {
  http.get('http://localhost:8080/api/endpoint');
  sleep(1);
}
```

```
What to measure during load tests:
  - Throughput: requests per second
  - Latency: p50, p95, p99
  - Error rate: percentage of failed requests
  - Resource usage: CPU, memory, connections
  - Breakpoint: when does it start failing?
```

## Headroom Planning

Always keep buffer capacity for unexpected spikes.

```
Headroom rules:
  - Never run above 70% CPU in production
  - Never run above 80% memory in production
  - Keep 30% headroom for traffic spikes
  - Keep 50% headroom for growth between provisioning cycles

If you need 100 CPU cores:
  Provision for 143 cores (100 / 0.7)
```

## Capacity Triggers

Set alerts that fire BEFORE you run out.

```
Alert thresholds:
  - CPU > 70% for 15 minutes → warning
  - CPU > 85% for 15 minutes → critical
  - Memory > 80% for 10 minutes → warning
  - Disk > 75% → warning
  - Disk > 90% → critical
  - Connection pool > 80% → warning
```

## Lab Task — Load Test and Capacity Plan

You're given a web service. Your job:

1. **Establish a baseline** — Run a light load test and record metrics
2. **Find the breaking point** — Ramp up load until the service starts degrading
3. **Identify the bottleneck** — Which resource hits the ceiling first?
4. **Forecast** — Based on the load test, how much capacity do you need for 10x current traffic?
5. **Write a capacity plan** — Document your findings and recommendations

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: Baseline metrics are accurate
- 2 points: Breaking point is identified with data
- 2 points: Bottleneck is correctly identified
- 2 points: Forecast is realistic with calculations shown
- 2 points: Capacity plan is actionable

## Evidence

- `baseline-metrics.txt` — your baseline measurements
- `load-test-results.md` — breaking point data
- `bottleneck-analysis.md` — which resource failed first
- `capacity-plan.md` — forecast and recommendations
