# Module 4 — Change Management

## What You'll Actually Do

You'll deploy code using canary, blue-green, and rollback strategies. You'll watch what happens when a bad deploy hits production, practice rolling it back, and learn to minimize blast radius. The goal: ship fast without breaking everything.

## Why Change Management Matters

Most outages aren't caused by hackers. They're caused by someone deploying code that broke something. Change management isn't about bureaucracy — it's about shipping safely.

```
Top causes of production incidents:
1. Bad code deploys (30-40%)
2. Configuration changes (15-20%)
3. Infrastructure changes (10-15%)
4. Capacity exhaustion (10%)
5. External dependencies (5-10%)
```

You can't eliminate deploy risk, but you can contain it.

## Deployment Strategies

### Rolling Deployment

Replace instances one at a time. Simple, but slow to detect problems.

```
Before: [v1] [v1] [v1] [v1] [v1]
Step 1: [v2] [v1] [v1] [v1] [v1]  — 1 of 5 updated
Step 2: [v2] [v2] [v1] [v1] [v1]  — 2 of 5 updated
Step 3: [v2] [v2] [v2] [v1] [v1]  — 3 of 5 updated
Step 4: [v2] [v2] [v2] [v2] [v1]  — 4 of 5 updated
Step 5: [v2] [v2] [v2] [v2] [v2]  — all updated

Problem: If v2 is bad, you've already replaced half your fleet
```

### Canary Deployment

Route a small percentage of traffic to the new version. Monitor closely. If it looks good, gradually increase.

```
Step 1:  95% v1, 5% v2   — watch for errors
Step 2:  90% v1, 10% v2  — still watching
Step 3:  75% v1, 25% v2  — metrics look good
Step 4:  50% v1, 50% v2  — confident now
Step 5:  100% v2          — full rollout

If anything goes wrong at any step → stop and rollback
```

```nginx
# Nginx canary config
upstream backend {
    server v1-app:8080 weight=95;
    server v2-app:8080 weight=5;
}
```

### Blue-Green Deployment

Run two identical environments. Switch traffic all at once.

```
Before deploy:
  BLUE (live)   → [v1] [v1] [v1]
  GREEN (idle)  → [empty]

Deploy to green:
  BLUE (live)   → [v1] [v1] [v1]
  GREEN (idle)  → [v2] [v2] [v2]

Switch traffic:
  BLUE (idle)   → [v1] [v1] [v1]
  GREEN (live)  → [v2] [v2] [v2]

If v2 breaks:
  Switch back to blue instantly
  BLUE (live)   → [v1] [v1] [v1]
  GREEN (idle)  → [v2] [v2] [v2]  ← broken, but not live
```

## Rollback Strategy

Every deployment plan needs a rollback plan. Before you deploy, know how to undo it.

```
Rollback checklist:
1. Database migrations reversible?
   - Yes → proceed
   - No → STOP. You need a different approach

2. Previous version still deployed?
   - Rolling: maybe (old instances might be gone)
   - Blue-green: yes (blue is still there)
   - Canary: yes (v1 is still running)

3. Rollback command ready?
   - kubectl rollout undo deployment/api -n prod
   - docker-compose down && docker-compose -f docker-compose.v1.yml up -d
   - Switch load balancer back to blue

4. Rollback tested?
   - Run through it in staging first
   - Don't discover your rollback is broken during an incident
```

## Feature Flags

Feature flags let you deploy code without exposing it to users. Decouple deployment from release.

```python
# Feature flag check
def get_feature(user_id, feature_name):
    flags = redis.get(f"features:{user_name}")
    return flags.get(feature_name, False)

# Usage
if get_feature(user_id, "new_checkout"):
    return new_checkout_flow()
else:
    return old_checkout_flow()
```

```
Benefits:
  - Deploy code to production with flag OFF
  - Enable gradually (1% → 10% → 50% → 100%)
  - Instant disable without rollback
  - A/B testing built in
```

## Lab Task — Deployment Strategies

You're given a web service with a load balancer. You'll deploy three times using different strategies:

1. **Rolling deploy** — Deploy v2 using rolling update. Watch for errors in real-time.
2. **Canary deploy** — Route 10% traffic to v2. Monitor error rates. Graduate to 100%.
3. **Blue-green deploy** — Deploy to green environment. Switch traffic. Practice instant rollback.
4. **Inject a bad deploy** — Deploy v3 (intentionally broken). Practice rolling back.
5. **Measure rollback time** — How fast can you recover from a bad deploy?

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: Rolling deploy completes with zero downtime
- 2 points: Canary deploy monitors error rates correctly
- 2 points: Blue-green deploy switches traffic cleanly
- 2 points: Bad deploy is detected and rolled back within 60 seconds
- 2 points: Rollback time is measured and documented

## Evidence

- `deploy-log.md` — timestamps and commands for each deployment
- `rollback-test.md` — your bad deploy and rollback results
- `rollback-time.txt` — measured rollback time
