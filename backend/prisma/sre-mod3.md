# Module 3 — Toil Reduction

## What You'll Actually Do

You're going to find the repetitive, manual work your team does every week, measure how much time it eats, and automate the worst offenders. Not everything should be automated — you'll learn what's worth the effort and what's better left manual.

## What Toil Actually Is

Toil is work that is:
- Manual
- Repetitive
- Automatable
- Tactical (no long-term value)
- Linearly scaling with service growth

```
Not toil:
  - Designing a new monitoring pipeline (strategic)
  - Debugging a novel production issue (intellectual)
  - Writing an automation script (strategic)

Toil:
  - Manually deploying the same service every Tuesday
  - Running the same SQL query to generate a weekly report
  - Manually rotating certificates every 90 days
  - Restarting services that crash on OOM
  - Manually provisioning servers for new teams
```

The rule of thumb: if a human did it once and will need to do it again the same way, it's a candidate for automation.

## Measuring Toil

You can't fix what you don't measure. Track every manual task:

```
| Task                     | Frequency  | Time Each | Monthly Hours |
|--------------------------|------------|-----------|---------------|
| Deploy service X         | 4x/month   | 30 min    | 2 hours       |
| Rotate certs             | 4x/year    | 45 min    | 15 min        |
| Generate weekly report   | 4x/month   | 20 min    | 80 min        |
| Restart crashed services | 10x/month  | 15 min    | 150 min       |
| Provision new server     | 2x/month   | 60 min    | 120 min       |
| Total                    |            |           | 375 min/mo    |
|                          |            |           | ~6.25 hours   |
```

Six hours a month on things a machine should do. That's the problem.

## The Automation Decision Matrix

Not everything should be automated. Use this:

```
                    │  Done Frequently  │  Done Rarely
────────────────────┼───────────────────┼────────────────
High failure cost   │  AUTOMATE NOW     │  Script it
(e.g., deployments) │                   │
────────────────────┼───────────────────┼────────────────
Low failure cost    │  Automate if      │  Leave manual
(e.g., reports)     │  time makes sense │
```

High failure cost + done frequently = automate first.

## Automation Approaches

```
Level 0: Manual
  You do it by hand every time.
  Example: SSH into server, run commands manually

Level 1: Scripted
  You wrote a script, but someone runs it.
  Example: ./deploy.sh --service api --env prod

Level 2: Scheduled
  The script runs on a schedule.
  Example: Cron job rotates certs every 89 days

Level 3: Event-driven
  Something triggers it automatically.
  Example: Alert fires → script restarts the service

Level 4: Self-healing
  The system detects and fixes itself.
  Example: OOM → service auto-restarts with more memory
```

Most teams should aim for Level 2-3. Level 4 is great but takes more investment.

## Practical Automation Examples

```bash
# Level 1: Manual deploy script
#!/bin/bash
SERVICE=$1
ENV=$2
docker build -t $SERVICE:$VERSION .
docker push registry/$SERVICE:$VERSION
kubectl set image deployment/$SERVICE app=registry/$SERVICE:$VERSION -n $ENV

# Level 2: Scheduled cert rotation
#!/bin/bash
# crontab: 0 2 1 * * /scripts/rotate-certs.sh
certbot renew --quiet
kubectl create secret tls app-tls \
  --cert=/etc/letsencrypt/live/domain.com/fullchain.pem \
  --key=/etc/letsencrypt/live/domain.com/privkey.pem \
  --dry-run=client -o yaml | kubectl apply -f -

# Level 3: Event-driven restart
#!/bin/bash
# Triggered by monitoring alert
SERVICE=$1
kubectl rollout restart deployment/$SERVICE -n production
echo "$(date): Restarted $SERVICE" >> /var/log/auto-restarts.log
```

## Identifying Your Top Toil

Run this exercise with your team:

```
1. Everyone writes down every manual task they did this week
2. Put them on a whiteboard
3. Group duplicates (everyone is doing the same thing)
4. Rate each: How often? How long? How painful?
5. Pick the top 3 and automate them
6. Measure the time saved
```

## Lab Task — Toil Audit and Automation

You're given a server running five services. For one week, you'll be given a series of "ops requests" that simulate real toil. Your job:

1. **Log every task** — Record what you did, how long it took, and whether it was manual
2. **Categorize the toil** — Which tasks are repetitive? Which are automatable?
3. **Automate at least 2 tasks** — Write scripts or configure automation for the worst offenders
4. **Measure the impact** — Calculate time saved per month
5. **Present your findings** — Show your team the toil breakdown and automation results

**Time:** 60 minutes (plus observation period)

**Grading (10 points):**
- 2 points: Task log is complete and accurate
- 2 points: Toil categorization is correct
- 3 points: Automation scripts work without manual intervention
- 2 points: Impact measurement is realistic
- 1 point: Presentation is clear and actionable

## Evidence

- `task-log.csv` — every manual task with time and category
- `toil-analysis.md` — your analysis of what to automate
- `scripts/` — your automation scripts
- `impact-report.md` — time saved and recommendations
