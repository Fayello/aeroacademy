# Module 9 — Chaos Engineering

## What You'll Actually Do

You'll deliberately break things in a controlled environment and watch what happens. Kill processes, fill disks, block network traffic, and measure how your systems respond. The goal isn't destruction — it's finding weaknesses before production finds them for you.

## The Premise

If you've never seen your system fail, you don't know how it fails. You just know it hasn't failed yet.

```
Chaos engineering asks:
  "What happens when this component fails?"
  And then you find out, on purpose, in a safe environment.
```

The first rule: don't break production. Practice on staging or dev environments that look like production.

## Failure Modes to Test

```
Infrastructure failures:
  - Kill a process (SIGKILL a random service)
  - Fill disk to 100%
  - Exhaust memory (stress test)
  - Network partition (block traffic between services)
  - High latency (add delay to network)
  - DNS failure (block DNS resolution)

Application failures:
  - Return errors from dependencies
  - Slow response from databases
  - Connection pool exhaustion
  - Timeouts on external calls
  - Certificate expiration
  - Authentication failures
```

## Chaos Experiments

A chaos experiment has a clear hypothesis and measurable outcome.

```
Experiment template:
  Hypothesis: "If service X loses connectivity to database Y,
               it should return cached responses within 200ms"
  
  Method: Block network traffic to database Y for 5 minutes
  
  Steady state: Service X handles 1000 req/s at p99 < 100ms
  
  Inject failure: Block DB connection
  
  Observe:
    - Does the service fail open or closed?
    - Are cached responses actually served?
    - Does latency stay under 200ms?
    - Are errors returned to users?
    - Does the service recover when connection is restored?
```

## Tools

```bash
# Chaos Monkey (Netflix) — kills random instances
# Not covered in detail — but conceptually important

# tc (traffic control) — network delays and loss
# Add 200ms latency to all traffic
sudo tc qdisc add dev eth0 root netem delay 200ms

# Add 5% packet loss
sudo tc qdisc add dev eth0 root netem loss 5%

# Remove the rule
sudo tc qdisc del dev eth0 root

# stress — CPU and memory stress
stress --cpu 4 --timeout 300s
stress --vm 2 --vm-bytes 1G --timeout 300s

# kill random processes
for i in {1..5}; do
  PID=$(pgrep -f "nginx|node|python" | shuf -n 1)
  kill -9 $PID
  echo "Killed $PID"
done

# Fill disk
dd if=/dev/zero of=/tmp/filldisk bs=1M count=10240

# iptables — block specific traffic
sudo iptables -A INPUT -s 10.0.0.5 -j DROP
sudo iptables -D INPUT -s 10.0.0.5 -j DROP
```

## Blast Radius Control

Always control how much you break.

```
Control methods:
  1. Start small — Kill one instance, not all of them
  2. Time-box — Inject failure for 5 minutes, then stop
  3. Monitor — Watch error rates during the experiment
  4. Have a kill switch — One command to stop everything
  5. Run during business hours — Someone should be watching
  6. Have approval — Don't chaos alone
```

```bash
# Safe chaos script
#!/bin/bash
SERVICE=$1
DURATION=${2:-300}  # default 5 minutes

echo "Starting chaos experiment on $SERVICE"
echo "Duration: $DURATION seconds"

# Get target PID
PID=$(pgrep -f "$SERVICE" | head -1)
echo "Target PID: $PID"

# Inject failure
kill -STOP $PID  # Pause the process
echo "Process paused at $(date)"

# Wait
sleep $DURATION

# Restore
kill -CONT $PID  # Resume the process
echo "Process resumed at $(date)"
echo "Chaos experiment complete"
```

## Game Days

Run chaos experiments as a team exercise.

```
Game day agenda:
  1. Define the scenario (15 min)
     - What will we break?
     - What do we expect to happen?
     - What would surprise us?
  
  2. Run the experiment (30 min)
     - Inject the failure
     - Observe and document
     - Take notes on everything
  
  3. Debrief (15 min)
     - What actually happened?
     - Did it match expectations?
     - What surprised us?
     - What should we fix?
  
  4. Create action items (10 min)
     - List improvements
     - Assign owners
     - Set deadlines
```

## Lab Task — Chaos Experiments

You're given a running microservice environment with a web frontend, API, database, and cache. Run three chaos experiments.

1. **Database failure** — Block access to the database. Does the service fail gracefully or crash?
2. **Cache eviction** — Kill the cache service. What happens to response times?
3. **Network partition** — Add latency between the API and database. Does the service handle it?

For each experiment:
- State your hypothesis before starting
- Run the experiment for 5 minutes
- Document what actually happened
- Identify any gaps in your system's resilience

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: Hypotheses are clear and testable
- 2 points: Experiments are run safely with controls
- 3 points: Observations are detailed and accurate
- 2 points: Gaps identified with specific improvements
- 1 point: Blast radius was properly controlled

## Evidence

- `experiment-1.md` — database failure experiment
- `experiment-2.md` — cache eviction experiment
- `experiment-3.md` — network partition experiment
- `improvement-items.md` — what you'd fix based on the results
