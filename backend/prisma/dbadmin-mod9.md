# Module 9 — Performance Tuning: Indexes, Query Optimization, EXPLAIN

## What You'll Actually Do

Analyze slow queries, create effective indexes, interpret EXPLAIN ANALYZE output, and tune PostgreSQL and MySQL for real workloads. You'll take a sluggish database and make it fast.

## Content

### Understanding EXPLAIN ANALYZE

EXPLAIN shows the query plan. ANALYZE actually runs it and shows actual times. Always use both.

```sql
EXPLAIN ANALYZE
SELECT u.full_name, COUNT(s.id) AS total_labs
FROM users u
JOIN submissions s ON u.id = s.user_id
WHERE s.submitted_at > '2025-01-01'
GROUP BY u.full_name
HAVING COUNT(s.id) > 5;
```

Output interpretation:

```
HashAggregate  (cost=1250.00..1260.00 rows=50 width=48) (actual time=45.234..45.280 rows=42 loops=1)
  Group Key: u.full_name
  Filter: (count(s.id) > 5)
  Rows Removed by Filter: 18
  ->  Hash Join  (cost=100.00..1200.00 rows=5000 width=44) (actual time=5.123..42.890 rows=5000 loops=1)
        Hash Cond: (s.user_id = u.id)
        ->  Seq Scan on submissions s  (cost=0.00..1100.00 rows=5000 width=12) (actual time=0.012..35.678 rows=5000 loops=1)
              Filter: (submitted_at > '2025-01-01')
              Rows Removed by Filter: 3000
        ->  Hash  (cost=80.00..80.00 rows=5000 width=40) (actual time=4.890..4.891 rows=5000 loops=1)
              Buckets: 8192  Batches: 1  Memory Usage: 352kB
              ->  Seq Scan on users u  (cost=0.00..80.00 rows=5000 width=40) (actual time=0.008..3.456 rows=5000 loops=1)
Planning Time: 0.234 ms
Execution Time: 45.456 ms
```

Key things to look for:
- **Seq Scan**: Reading the entire table. Bad on large tables.
- **actual time**: First number is startup, second is total. Higher = slower.
- **rows**: Estimated vs actual. If estimates are way off, run `ANALYZE`.
- **loops**: If > 1, the node runs multiple times (nested loops).

### Index Types

**B-tree (default, most common):**

```sql
-- Single column
CREATE INDEX idx_submissions_user_id ON submissions(user_id);

-- Composite
CREATE INDEX idx_submissions_user_date ON submissions(user_id, submitted_at DESC);

-- Partial index — only index rows matching a condition
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
```

**GIN (Generalized Inverted Index) — for arrays, full-text, JSON:**

```sql
-- JSONB queries
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);

-- Query using the index
SELECT * FROM users WHERE metadata @> '{"os": "linux"}';

-- Full-text search
CREATE INDEX idx_courses_search ON courses USING GIN(to_tsvector('english', title || ' ' || description));
SELECT * FROM courses WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('network & security');
```

**Hash index — for exact equality only:**

```sql
CREATE INDEX idx_users_email_hash ON users USING HASH(email);
SELECT * FROM users WHERE email = 'alice@example.com';
```

**BRIN (Block Range Index) — for naturally ordered data:**

```sql
-- Great for timestamp columns on large tables
CREATE INDEX idx_logs_timestamp ON access_logs USING BRIN(created_at);
```

### Query Optimization Patterns

**Avoid SELECT \*:**

```sql
-- Bad
SELECT * FROM submissions WHERE user_id = 42;

-- Good — only fetch what you need
SELECT id, score, submitted_at FROM submissions WHERE user_id = 42;
```

**Use covering indexes (INCLUDE):**

```sql
-- Index that contains the answer without hitting the table
CREATE INDEX idx_submissions_covering ON submissions(user_id)
  INCLUDE (score, submitted_at);

-- This query is answered entirely from the index
SELECT score, submitted_at FROM submissions WHERE user_id = 42;
```

**Fix N+1 queries:**

```python
# BAD: N+1 — one query for users, then N queries for submissions
users = db.query("SELECT * FROM users WHERE role = 'student'")
for user in users:
    submissions = db.query(
        "SELECT * FROM submissions WHERE user_id = %s", (user.id,)
    )

# GOOD: Single query with JOIN
results = db.query("""
    SELECT u.id, u.full_name, s.score, s.submitted_at
    FROM users u
    LEFT JOIN submissions s ON u.id = s.user_id
    WHERE u.role = 'student'
""")
```

**Use EXISTS instead of IN for subqueries:**

```sql
-- Bad
SELECT * FROM users WHERE id IN (SELECT user_id FROM submissions WHERE score > 90);

-- Good
SELECT * FROM users u WHERE EXISTS (
    SELECT 1 FROM submissions s WHERE s.user_id = u.id AND s.score > 90
);
```

**Pagination — use keyset instead of OFFSET:**

```sql
-- Bad: OFFSET gets slower as page number increases
SELECT * FROM submissions ORDER BY id LIMIT 20 OFFSET 10000;

-- Good: keyset pagination
SELECT * FROM submissions WHERE id > 10000 ORDER BY id LIMIT 20;
```

### MySQL-Specific Tuning

```sql
-- Check query execution plan
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';

-- Profile a query
SET profiling = 1;
SELECT * FROM submissions WHERE user_id = 42;
SHOW PROFILES;
SHOW PROFILE FOR QUERY 1;

-- Find slow queries
SELECT * FROM sys.statements_with_runtimes_in_95th_percentile LIMIT 10;

-- Check index usage
SELECT * FROM sys.schema_unused_indexes;
```

### pg_stat_statements

Enable this extension to track all query performance:

```sql
-- Enable in postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all

-- Restart, then create the extension
CREATE EXTENSION pg_stat_statements;

-- Find slowest queries
SELECT
  query,
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round((100 * total_exec_time / sum(total_exec_time) OVER())::numeric, 2) AS pct
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### MySQL Index Hints

```sql
-- Force index usage
SELECT * FROM submissions FORCE INDEX (idx_user_id) WHERE user_id = 42;

-- Ignore an index
SELECT * submissions IGNORE INDEX (idx_submitted_at) WHERE submitted_at > '2025-01-01';
```

## Assessment

**Lab task — 55 minutes**

1. Create a PostgreSQL database with tables: `users` (1000 rows), `submissions` (5000 rows), `courses` (50 rows). Use realistic data.
2. Write 5 queries that are slow without indexes. Use EXPLAIN ANALYZE to show the sequential scans.
3. Create appropriate indexes for each query. Re-run EXPLAIN ANALYZE and document the improvement.
4. Enable pg_stat_statements, run all 5 queries 100 times, and identify the most expensive query.
5. Optimize one query using covering indexes, keyset pagination, or JOIN restructuring.
6. For MySQL: repeat steps 2-3 on a MySQL instance and compare the optimizer behavior.

**Grading criteria:**
- Realistic database with correct row counts (10 points)
- 5 queries with before/after EXPLAIN ANALYZE output (30 points)
- Indexes chosen appropriately for each query pattern (20 points)
- pg_stat_statements used to identify expensive queries (15 points)
- Optimization demonstrates measurable improvement (15 points)
- MySQL comparison with different optimizer behavior noted (10 points)

## Evidence

- EXPLAIN ANALYZE output before and after indexing
- pg_stat_statements query results
- Before/after timing comparisons
- Index creation statements
- Comparison notes between PostgreSQL and MySQL optimizer behavior
