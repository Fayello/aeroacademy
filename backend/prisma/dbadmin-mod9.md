# Module 9 — Performance Tuning

Slow queries are the most common database performance problem. A single poorly written query can consume all available resources and bring the entire system to a crawl. This module teaches you how to diagnose and fix slow queries using indexes, EXPLAIN ANALYZE, query optimization techniques, and connection pooling. We will work through real execution plans, real performance problems, and real solutions that you can apply on your first day as a DBA.

## Indexes: B-Tree, Hash, GIN, GiST

An index is a data structure that speeds up data retrieval at the cost of additional storage and write overhead. Choosing the wrong index type is like using a screwdriver when you need a wrench — it might work, but poorly.

**B-Tree Index (Default):**

B-Tree is the most common index type. It maintains sorted order and supports equality checks, range queries, prefix matching, and sorting. It works well for most queries.

```sql
-- B-Tree index (default)
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Composite B-Tree index
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at DESC);

-- This index serves queries like:
-- SELECT * FROM orders WHERE customer_id = 123;
-- SELECT * FROM orders WHERE customer_id = 123 AND created_at > '2026-01-01';
-- SELECT * FROM orders WHERE customer_id = 123 ORDER BY created_at DESC;
```

B-Tree indexes are universal but not optimal for every use case. For columns with high cardinality (many unique values like email addresses), B-Tree is excellent. For columns with low cardinality (few unique values like status fields), a B-Tree index may not be much better than a sequential scan because the index still has to read many pages.

**Hash Index:**

Hash indexes are optimized for equality lookups only. They do not support range queries, sorting, or prefix matching. In PostgreSQL, hash indexes were not crash-safe before version 10. Now they are WAL-logged and suitable for production use.

```sql
-- Hash index for exact equality lookups
CREATE INDEX idx_users_email_hash ON users USING hash (email);

-- Fast lookup
SELECT * FROM users WHERE email = 'alice@example.com';

-- Does NOT work with range queries
-- SELECT * FROM users WHERE email > 'a';  -- Full scan, index not used
```

Hash indexes are smaller than B-Tree indexes and faster for equality lookups. If your workload is purely equality-based (like a session cache or a lookup table), hash is the better choice. The trade-off is zero support for range queries.

**GIN (Generalized Inverted Index):**

GIN indexes are designed for composite types, arrays, full-text search, and JSONB. They store a mapping from values to the rows that contain those values. Think of it like an index at the back of a book — it maps terms to page numbers.

```sql
-- GIN index for full-text search
CREATE INDEX idx_articles_fts ON articles USING gin (to_tsvector('english', title || ' ' || body));

-- Query using the index
SELECT * FROM articles
WHERE to_tsvector('english', title || ' ' || body) @@ to_tsquery('english', 'database & security');

-- GIN index for JSONB
CREATE INDEX idx_events_data ON events USING gin (data);

-- Query JSONB fields
SELECT * FROM events WHERE data @> '{"type": "login", "user_id": 123}';

-- GIN index for arrays
CREATE INDEX idx_products_tags ON products USING gin (tags);

-- Query arrays
SELECT * FROM products WHERE tags @> ARRAY['sale', 'clearance'];
```

The `@>` operator means "contains" — it checks if the left operand contains the right operand. GIN indexes make these containment queries fast. Without a GIN index, JSONB and array queries require scanning every row.

The downside of GIN indexes: they are slow to update. Every insert or update that modifies a GIN-indexed column requires updating the index, which involves multiple page writes. For write-heavy workloads with JSONB columns, this can be a bottleneck. Consider `fastupdate = off` for write-heavy GIN indexes:

```sql
CREATE INDEX idx_events_data ON events USING gin (data) WITH (fastupdate = off);
```

**GiST (Generalized Search Tree):**

GiST indexes support range types, geometric data, and full-text search. They are lossy — they store approximate locations of data, not exact positions. This makes them faster for some queries but less precise.

```sql
-- GiST index for range queries
CREATE INDEX idx_events_time ON events USING gist (tsrange(start_time, end_time));

-- Query overlapping ranges
SELECT * FROM events
WHERE tsrange(start_time, end_time) && tsrange('2026-01-01', '2026-01-31');

-- GiST index for full-text search (alternative to GIN)
CREATE INDEX idx_articles_fts_gist ON articles USING gist (to_tsvector('english', title || ' ' || body));
```

GiST indexes are smaller and faster to update than GIN indexes, but slower for lookups. For full-text search with mostly read workloads, GIN is better. For write-heavy workloads with full-text search, GiST may be preferable.

**When to Use Which:**

| Query Pattern | Index Type |
|---|---|
| Equality: `WHERE col = value` | B-Tree or Hash |
| Range: `WHERE col > value AND col < value` | B-Tree |
| Sorting: `ORDER BY col` | B-Tree |
| Full-text search: `@@ to_tsquery` | GIN (read-heavy) or GiST (write-heavy) |
| JSONB containment: `WHERE data @>` | GIN |
| Array containment: `WHERE tags @>` | GIN |
| Range overlap: `WHERE range && range` | GiST |
| Geometric: `WHERE box @>` | GiST |

## EXPLAIN ANALYZE

EXPLAIN ANALYZE is the most important diagnostic tool for query performance. It shows the query plan the database optimizer chose, including which indexes it uses, how many rows it processes, and how long each step takes.

**Basic Usage:**

```sql
EXPLAIN ANALYZE
SELECT o.id, o.total_amount, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.created_at > '2026-01-01'
  AND o.status = 'completed'
ORDER BY o.total_amount DESC
LIMIT 10;
```

Output:

```
Limit  (cost=1234.56..1234.58 rows=10 width=48) (actual time=45.123..45.125 rows=10 loops=1)
  ->  Sort  (cost=1234.56..1236.78 rows=889 width=48) (actual time=45.122..45.123 rows=10 loops=1)
        Sort Key: o.total_amount DESC
        Sort Method: top-N heapsort  Memory: 25kB
        ->  Hash Join  (cost=100.12..1200.34 rows=889 width=48) (actual time=10.234..44.567 rows=889 loops=1)
              Hash Cond: (o.customer_id = c.id)
              ->  Seq Scan on orders o  (cost=0.00..1100.00 rows=889 width=28) (actual time=0.012..43.210 rows=889 loops=1)
                    Filter: ((created_at > '2026-01-01') AND (status = 'completed'))
                    Rows Removed by Filter: 99111
              ->  Hash  (cost=80.00..80.00 rows=5000 width=24) (actual time=8.123..8.124 rows=5000 loops=1)
                    Buckets: 8192  Batches: 1  Memory Usage: 313kB
                    ->  Seq Scan on customers c  (cost=0.00..80.00 rows=5000 width=24) (actual time=0.005..5.678 rows=5000 loops=1)
Planning Time: 0.234 ms
Execution Time: 45.234 ms
```

**Reading the Output:**

- `Seq Scan on orders o` — Full table scan on orders. This is the bottleneck.
- `Rows Removed by Filter: 99111` — The scan read 100,000 rows and discarded 99,111, keeping only 889.
- `Hash Join` — The database is building a hash table of all customers, then probing it for each order.
- The total execution time is 45ms, mostly spent on the sequential scan of orders.

**Identifying the Problem:**

The query scans 100,000 rows to find 889 matching orders. An index on `orders(created_at, status)` would allow the database to locate the 889 rows directly without scanning the entire table.

```sql
CREATE INDEX idx_orders_date_status ON orders(created_at, status);

-- Re-run EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT o.id, o.total_amount, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.created_at > '2026-01-01'
  AND o.status = 'completed'
ORDER BY o.total_amount DESC
LIMIT 10;
```

Output after index:

```
Limit  (cost=0.42..89.01 rows=10 width=48) (actual time=0.045..0.089 rows=10 loops=1)
  ->  Merge Join  (cost=0.42..8900.00 rows=889 width=48) (actual time=0.044..0.088 rows=10 loops=1)
        Merge Cond: (o.customer_id = c.id)
        ->  Index Scan using idx_orders_date_status on orders o  (cost=0.42..8500.00 rows=889 width=28) (actual time=0.023..0.065 rows=889 loops=1)
              Filter: (status = 'completed')
        ->  Index Scan using customers_pkey on customers c  (cost=0.28..400.00 rows=5000 width=24) (actual time=0.010..0.020 rows=5000 loops=1)
Planning Time: 0.156 ms
Execution Time: 0.123 ms
```

The index scan reads only the matching rows. Execution time dropped from 45ms to 0.1ms — a 360x improvement.

**Common EXPLAIN Patterns to Watch For:**

1. `Seq Scan` on large tables — usually means a missing index
2. `Sort Method: external merge Disk` — sort spilled to disk, increase work_mem
3. `Hash Batch` count > 1 — hash table too large for memory, increase work_mem
4. `Rows Removed by Filter` much larger than rows returned — index would help
5. `Nested Loop` with high loop count — consider hash join or merge join

## Query Optimization

Beyond indexing, query structure significantly affects performance.

**Avoid SELECT \*:**

```sql
-- Bad: returns all columns, many unused
SELECT * FROM orders WHERE customer_id = 123;

-- Good: returns only needed columns
SELECT id, total_amount, status, created_at
FROM orders WHERE customer_id = 123;
```

SELECT * forces the database to read all columns from disk. If the table has large columns (TEXT, JSONB) that the query does not need, you are wasting I/O. Additionally, SELECT * prevents index-only scans — the database must visit the heap to retrieve columns not in the index.

**Use EXISTS Instead of IN for Subqueries:**

```sql
-- Bad: IN with a large subquery
SELECT * FROM customers
WHERE id IN (SELECT customer_id FROM orders WHERE total_amount > 1000);

-- Good: EXISTS — can stop at the first match
SELECT * FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.id
    AND o.total_amount > 1000
);
```

EXISTS can short-circuit — it stops as soon as it finds one matching row. IN must materialize the entire subquery result set before comparing.

**Avoid Functions on Indexed Columns:**

```sql
-- Bad: function on indexed column prevents index usage
SELECT * FROM orders WHERE YEAR(created_at) = 2026;

-- Good: range query that can use the index
SELECT * FROM orders
WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01';

-- Bad: function on indexed column
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';

-- Good: functional index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';
```

Functions on indexed columns force the database to evaluate the function for every row, preventing index usage. Create a functional index (index on the expression) if you need to query by function result.

**Use LIMIT Effectively:**

```sql
-- Bad: fetches all rows then discards most
SELECT * FROM orders ORDER BY created_at DESC;

-- Good: fetches only what is needed
SELECT * FROM orders ORDER BY created_at DESC LIMIT 100;

-- Bad: OFFSET-based pagination degrades with large offsets
SELECT * FROM orders ORDER BY created_at DESC OFFSET 100000 LIMIT 20;

-- Good: keyset pagination (cursor-based)
SELECT * FROM orders
WHERE created_at < '2026-01-15 10:30:00'  -- last seen value
ORDER BY created_at DESC
LIMIT 20;
```

OFFSET-based pagination must scan and discard all rows before the offset. For `OFFSET 100000`, the database reads 100,000 rows and throws them away. Keyset pagination (also called cursor-based pagination) uses a WHERE clause to start from the last seen value, which is O(1) regardless of position.

**Batch Operations:**

```sql
-- Bad: one-by-one inserts in a loop
INSERT INTO logs (message) VALUES ('event1');
INSERT INTO logs (message) VALUES ('event2');
-- ... repeat 10,000 times

-- Good: batch insert
INSERT INTO logs (message) VALUES
    ('event1'), ('event2'), ('event3'), /* ... */ ('event10000');
-- Repeat in batches of 1,000

-- Bad: one-by-one updates
UPDATE orders SET status = 'archived' WHERE id = 1;
UPDATE orders SET status = 'archived' WHERE id = 2;
-- ...

-- Good: batch update
UPDATE orders SET status = 'archived'
WHERE id IN (1, 2, 3, /* ... */ 1000);
-- Repeat in batches
```

Each INSERT is a separate transaction with its own WAL write, fsync, and network round trip. Batching 1,000 inserts into one statement reduces the overhead by roughly 1,000x.

## Connection Pooling

Database connections are expensive. Each connection consumes memory (10MB+ for PostgreSQL, 256KB+ for MySQL thread stack), requires a server process or thread, and adds context-switching overhead. A server with 200 connections is slower than one with 50 connections serving the same workload through a connection pooler.

**PgBouncer Configuration:**

```ini
# pgbouncer.ini
[databases]
mydb = host=127.0.0.1 port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt

# Pool modes
# session: connection assigned for the entire client session
# transaction: connection returned after each transaction
# statement: connection returned after each statement (no multi-statement transactions)
pool_mode = transaction

# Pool sizing
default_pool_size = 20      # connections per user/database pair
min_pool_size = 5           # minimum connections maintained
reserve_pool_size = 5       # extra connections for bursts
reserve_pool_timeout = 3    # seconds before using reserve pool

# Timeouts
server_idle_timeout = 300   # close idle server connections after 5 min
client_idle_timeout = 0     # no timeout for idle clients
query_timeout = 30          # kill queries running longer than 30s
query_wait_timeout = 120    # client waits max 120s for a connection

# Limits
max_client_conn = 1000      # total client connections accepted
max_db_connections = 50     # max connections to the database

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
```

**Connection Pool Monitoring:**

```sql
-- PgBouncer admin interface
psql -h localhost -p 6432 -U pgbouncer pgbouncer

-- Show pool statistics
SHOW POOLS;

-- Output:
--  database | user | cl_active | cl_waiting | sv_active | sv_idle | sv_used | sv_tested | maxwait
--  mydb     | app  |    15     |     0      |    12     |    3    |    5    |     0     |    0

-- cl_active: clients currently executing a query
-- cl_waiting: clients waiting for a connection (if > 0, increase pool size)
-- sv_active: server connections in use
-- sv_idle: idle server connections ready for use
-- sv_used: server connections recently used (waiting for idle timeout)

-- Show client connections
SHOW CLIENTS;

-- Show server connections
SHOW SERVERS;

-- Reset statistics
RESET STATS;
```

**Connection Pool Sizing:**

How do you know what pool size to set? Start with a formula and adjust based on observed behavior:

```
pool_size = (number_of_cpu_cores * 2) + effective_spindle_count
```

For SSDs (effective_spindle_count = 1):
- 4-core server: (4 * 2) + 1 = 9 connections per pool
- 8-core server: (8 * 2) + 1 = 17 connections per pool

The formula comes from PostgreSQL performance characteristics. Each connection uses a PostgreSQL backend process. Too many processes cause context-switching overhead. Too few causes idle clients waiting for connections.

Monitor pool utilization to fine-tune:

```sql
-- PgBouncer: check if pool is saturated
SHOW POOLS;
-- If cl_waiting > 0 consistently, increase default_pool_size
-- If sv_idle is consistently high, decrease default_pool_size

-- PostgreSQL: check connection count
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;
-- If "idle" count is very high, the pool is oversized
-- If "active" count approaches max_connections, the pool is undersized
```

**Connection Pool Troubleshooting:**

Common issues and fixes:

1. `cl_waiting > 0`: Clients are waiting for connections. Increase pool size or reduce client connection timeout.
2. `sv_idle` very high: Too many server connections. Decrease pool size to free server resources.
3. Connection leaks: Client acquires a connection but never returns it. Set `server_idle_timeout` and `query_timeout`.
4. Transaction state leaking: A client starts a transaction in transaction mode but does not commit/rollback. The connection stays assigned. Fix: enforce `AUTOCOMMIT` or use `reset_query = DISCARD ALL`.

```ini
# pgbouncer.ini — handle connection leaks
server_idle_timeout = 300      # Close idle server connections after 5 min
query_timeout = 30             # Kill queries running > 30s
client_idle_timeout = 600      # Disconnect idle clients after 10 min
```

**Pool Mode Comparison:**

- Session mode: Each client gets a dedicated server connection for the entire session. Simplest, highest latency, highest memory usage. Use when the application uses session-level features (SET commands, temp tables, prepared statements across transactions).

- Transaction mode: Connections are shared. A client gets a connection when a transaction starts and returns it when the transaction ends. Best balance of performance and compatibility. Most applications should use this.

- Statement mode: Connections are returned after each statement. Maximum connection sharing but breaks multi-statement transactions. Only use for simple applications that do not use transactions.

**MySQL Proxy with ProxySQL:**

```sql
-- ProxySQL configuration
-- Add backend MySQL servers
INSERT INTO mysql_servers(hostgroup_id, hostname, port, weight)
VALUES (1, '10.0.1.10', 3306, 1000);

-- Define routing rules
INSERT INTO mysql_query_rules(rule_id, active, match_pattern, destination_hostgroup)
VALUES (1, 1, '^SELECT.*FOR UPDATE$', 1),  -- Read-write transactions
       (2, 1, '^SELECT$', 2);              -- Read-only queries

-- Apply changes
LOAD MYSQL SERVERS TO RUNTIME;
LOAD MYSQL QUERY RULES TO RUNTIME;
SAVE MYSQL SERVERS TO DISK;
SAVE MYSQL QUERY RULES TO DISK;
```

ProxySQL can route read queries to replicas and write queries to the primary, manage connection pooling, and perform query rewriting — all without changing the application.

## Real Scenario: Optimizing a Slow Query

You are the DBA for an e-commerce platform. The customer support team reports that the "Order History" page loads slowly — 8-12 seconds. The page shows a customer's recent orders with product details. The application team has asked for help.

**Step 1: Identify the Query.**

```sql
-- The application runs this query when loading order history
SELECT
    o.id AS order_id,
    o.created_at,
    o.total_amount,
    o.status,
    p.name AS product_name,
    p.price AS product_price,
    oi.quantity,
    oi.subtotal
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.customer_id = $1
ORDER BY o.created_at DESC
LIMIT 50;
```

**Step 2: Analyze the Execution Plan.**

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    o.id AS order_id,
    o.created_at,
    o.total_amount,
    o.status,
    p.name AS product_name,
    p.price AS product_price,
    oi.quantity,
    oi.subtotal
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.customer_id = 12345
ORDER BY o.created_at DESC
LIMIT 50;
```

Output:

```
Limit  (cost=5678.90..5678.92 rows=50 width=64) (actual time=8234.567..8234.589 rows=50 loops=1)
  ->  Sort  (cost=5678.90..5680.12 rows=489 width=64) (actual time=8234.566..8234.578 rows=50 loops=1)
        Sort Key: o.created_at DESC
        Sort Method: top-N heapsort  Memory: 30kB
        ->  Hash Join  (cost=100.45..5600.00 rows=489 width=64) (actual time=100.234..8200.123 rows=489 loops=1)
              Hash Cond: (oi.product_id = p.id)
              ->  Hash Join  (cost=10.12..5500.00 rows=489 width=40) (actual time=5.678..8150.456 rows=489 loops=1)
                    Hash Cond: (o.id = oi.order_id)
                    ->  Seq Scan on orders o  (cost=0.00..5400.00 rows=489 width=24) (actual time=0.012..8100.000 rows=489 loops=1)
                          Filter: (customer_id = 12345)
                          Rows Removed by Filter: 9999511
                    ->  Hash  (cost=8.78..8.78 rows=489 width=20) (actual time=3.456..3.457 rows=489 loops=1)
                          Buckets: 1024  Batches: 1  Memory Usage: 30kB
                          ->  Seq Scan on order_items oi  (cost=0.00..8.78 rows=489 width=20) (actual time=0.005..2.345 rows=489 loops=1)
              ->  Hash  (cost=78.00..78.00 rows=5000 width=24) (actual time=40.000..40.001 rows=5000 loops=1)
                    Buckets: 8192  Batches: 1  Memory Usage: 313kB
                    ->  Seq Scan on products p  (cost=0.00..78.00 rows=5000 width=24) (actual time=0.005..30.000 rows=5000 loops=1)
Planning Time: 0.345 ms
Execution Time: 8234.678 ms
```

**Problem:** The orders table has 10 million rows. The query scans all 10 million rows to find 489 orders for customer 12345 (`Rows Removed by Filter: 9999511`). There is no index on `customer_id`.

**Step 3: Create the Index.**

```sql
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at DESC);
```

The composite index follows the ESR rule: customer_id for equality (E), created_at for sort (S).

**Step 4: Re-Analyze.**

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
-- Same query as before
```

Output after index:

```
Limit  (cost=0.56..12.34 rows=50 width=64) (actual time=0.089..0.234 rows=50 loops=1)
  ->  Nested Loop  (cost=0.56..12.34 rows=50 width=64) (actual time=0.088..0.228 rows=50 loops=1)
        ->  Index Scan using idx_orders_customer_date on orders o  (cost=0.42..8.90 rows=50 width=24) (actual time=0.045..0.089 rows=50 loops=1)
              Filter: (customer_id = 12345)
        ->  Index Scan using order_items_pkey on order_items oi  (cost=0.14..0.06 rows=1 width=20) (actual time=0.002..0.002 rows=1 loops=50)
              Index Cond: (order_id = o.id)
        ->  Index Scan using products_pkey on products p  (cost=0.07..0.07 rows=1 width=24) (actual time=0.001..0.001 rows=1 loops=50)
              Index Cond: (id = oi.product_id)
Planning Time: 0.456 ms
Execution Time: 0.345 ms
```

The index allows the database to locate the 50 matching orders directly without scanning the entire table. Execution time dropped from 8,234ms to 0.345ms — a 23,867x improvement.

**Step 5: Verify with Realistic Load.**

```bash
# Run the query 100 times with pgbench
pgbench -h localhost -U appuser -d myapp -c 10 -T 60 -f query.sql
```

Before index: 10 concurrent connections, 8-12 seconds per query, high CPU and I/O.
After index: 10 concurrent connections, sub-millisecond per query, minimal resource usage.

**Step 6: Document the Change.**

```sql
-- Add index to migration script
-- Migration: Add composite index for order history query
-- Date: 2026-01-15
-- Author: DBA Team
-- Performance improvement: 8234ms -> 0.345ms (23,867x)
CREATE INDEX CONCURRENTLY idx_orders_customer_date
    ON orders(customer_id, created_at DESC);

-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders' AND indexname = 'idx_orders_customer_date';
```

The `CONCURRENTLY` flag creates the index without locking the table, allowing reads and writes to continue during index creation. For a 10-million-row table, this might take 30-60 minutes instead of 5 seconds, but the table remains available throughout.

## Assessment

**Lab Tasks:**

1. Create a table with 1 million rows. Write a query that performs a sequential scan on a non-indexed column. Use EXPLAIN ANALYZE to measure performance. Create the appropriate index and re-measure. Document the before and after execution times and the index type used. Time limit: 30 minutes.

2. Optimize the following slow query by creating appropriate indexes and rewriting the query if needed:

```sql
SELECT u.name, COUNT(o.id) as order_count, SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2025-01-01'
  AND o.status = 'completed'
GROUP BY u.id, u.name
HAVING SUM(o.total) > 1000
ORDER BY total_spent DESC;
```

Document the execution plan before and after optimization. Time limit: 45 minutes.

3. Set up PgBouncer with transaction pooling mode. Connect 50 concurrent clients to a PostgreSQL database through PgBouncer. Monitor pool statistics to verify that server connections are being reused. Compare performance with and without PgBouncer. Time limit: 45 minutes.

4. Write a shell script that monitors slow queries by tailing the PostgreSQL log file. The script should parse log entries, extract queries running longer than 1 second, and write them to a report file with timestamps. Time limit: 30 minutes.

**Grading Criteria:**
- Index creation (25%): Correct index type chosen, performance improvement documented
- Query optimization (30%): Execution plan analyzed correctly, optimization achieves measurable improvement
- Connection pooling (25%): PgBouncer configured correctly, pool statistics demonstrate connection reuse
- Monitoring (20%): Script correctly parses logs and identifies slow queries

**Evidence:**
- EXPLAIN ANALYZE output before and after indexing
- PgBouncer configuration and pool statistics
- Performance comparison with and without connection pooling
- Slow query monitoring script output
