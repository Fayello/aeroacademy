# Module 6 — Performance Optimization

## What You'll Actually Do

You'll profile a slow service, find the bottleneck, fix it, and measure the improvement. Not guesswork — you'll use actual profiling tools to see where time is spent and optimize based on data.

## Performance is a Feature

Slow is broken. Users won't tell you they're unhappy — they'll just leave.

```
Response time and user behavior:
  < 100ms: Feels instant
  100-300ms: Noticeable but acceptable
  300ms-1s: User starts waiting
  1-3s: User loses focus
  3-10s: User considers leaving
  > 10s: User leaves
```

Every millisecond you shave off response time is money in the bank.

## Profiling Tools

### CPU Profiling

```bash
# Go — built-in profiler
go test -bench=. -cpuprofile=cpu.prof -benchtime=30s
go tool pprof cpu.prof

# Python — cProfile
python -m cProfile -o profile.out app.py
python -m pstats profile.out

# Node.js --prof flag
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Linux perf
perf record -g -p <PID> -- sleep 30
perf report
```

### Memory Profiling

```bash
# Go
go test -bench=. -memprofile=mem.prof
go tool pprof mem.prof

# Python — memory_profiler
pip install memory_profiler
python -m memory_profiler app.py

# Node.js
node --inspect app.js
# Connect Chrome DevTools → Memory tab → take heap snapshot
```

### Database Query Profiling

```sql
-- PostgreSQL — slow query log
ALTER SYSTEM SET log_min_duration_statement = 200;  -- log queries > 200ms
SELECT pg_reload_conf();

-- See slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Common Bottlenecks

```
1. Database queries
   Symptom: High DB CPU, slow response times
   Fix: Add indexes, optimize queries, add caching

2. N+1 queries
   Symptom: Many small queries instead of one big one
   Fix: Eager loading, batch queries

3. Missing indexes
   Symptom: Sequential scans on large tables
   Fix: CREATE INDEX on filtered/joined columns

4. Connection pool exhaustion
   Symptom: Requests queuing, timeout errors
   Fix: Increase pool size, reduce connection hold time

5. CPU-bound work on main thread
   Symptom: High CPU, single-threaded bottleneck
   Fix: Offload to workers, use async I/O

6. Memory leaks
   Symptom: Memory grows over time, OOM kills
   Fix: Find the leak, fix allocation patterns
```

## Optimization Workflow

```
1. Measure    → Profile the current state
2. Identify   → Find the biggest bottleneck
3. Hypothesize → "If I fix X, performance improves by Y"
4. Fix        → Make ONE change at a time
5. Measure    → Profile again
6. Compare    → Did it actually help?
7. Repeat     → Find the next bottleneck
```

Never optimize without measuring first. You might be optimizing the wrong thing.

## Example: Optimizing a Slow Endpoint

```python
# BEFORE — takes 2.3 seconds
def get_user_orders(user_id):
    user = db.query(f"SELECT * FROM users WHERE id = {user_id}")
    orders = db.query(f"SELECT * FROM orders WHERE user_id = {user_id}")
    items = []
    for order in orders:
        item = db.query(f"SELECT * FROM items WHERE order_id = {order.id}")
        items.append(item)
    return {"user": user, "orders": orders, "items": items}

# Profile shows: 18 queries, 2.1 seconds in DB calls

# AFTER — takes 45ms
def get_user_orders(user_id):
    user = db.query("SELECT * FROM users WHERE id = %s", user_id)
    orders = db.query("SELECT * FROM orders WHERE user_id = %s", user_id)
    order_ids = [o.id for o in orders]
    items = db.query("SELECT * FROM items WHERE order_id = ANY(%s)", order_ids)
    return {"user": user, "orders": orders, "items": items}

# Profile shows: 3 queries, 40ms in DB calls
# Fix: Eliminated N+1 queries with batch fetch
```

## Lab Task — Profile and Optimize

You're given a service with three slow endpoints. Your job:

1. **Profile each endpoint** — Use profiling tools to find where time is spent
2. **Identify bottlenecks** — Database? CPU? Network? Memory?
3. **Fix the worst endpoint** — Apply one optimization at a time
4. **Measure improvement** — Document before/after metrics
5. **Repeat for the other endpoints** — You should have time for at least one more

**Time:** 60 minutes

**Grading (10 points):**
- 2 points: Profiling data collected for each endpoint
- 2 points: Bottlenecks correctly identified
- 3 points: Optimization measurably improves performance
- 2 points: Before/after comparison is documented
- 1 point: Changes don't break existing functionality

## Evidence

- `profile-*.txt` — profiling output for each endpoint
- `bottleneck-analysis.md` — what you found
- `optimization-log.md` — what you changed and the results
- `before-after.md` — side-by-side performance comparison
