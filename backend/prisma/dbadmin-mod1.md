# Module 1 — Database Fundamentals: Relational vs NoSQL, ACID

## What You'll Actually Do

Understand the core differences between relational and NoSQL databases. You'll work with both PostgreSQL and MongoDB, see how ACID properties hold up under real conditions, and decide which engine fits a given workload.

## Content

### Relational Databases (PostgreSQL)

Relational databases store data in tables with defined schemas. Every row follows the same column structure. This rigidity is a feature — it enforces consistency at the database level.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lab_submissions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    lab_id VARCHAR(50) NOT NULL,
    score INT CHECK (score BETWEEN 0 AND 100),
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

Joins are the backbone of relational queries. You combine data across tables:

```sql
SELECT u.full_name, l.lab_id, l.score
FROM users u
JOIN lab_submissions l ON u.id = l.user_id
WHERE l.score >= 80
ORDER BY l.submitted_at DESC;
```

### NoSQL Databases (MongoDB)

MongoDB stores documents in collections. Each document is a JSON-like structure with flexible schema — different documents in the same collection can have different fields.

```javascript
// Insert a user document
db.users.insertOne({
  name: "Alice Chen",
  email: "alice@example.com",
  role: "student",
  labs: [
    { lab_id: "lab-01", score: 92, completed_at: ISODate("2025-11-15") },
    { lab_id: "lab-02", score: 88, completed_at: ISODate("2025-11-22") }
  ]
});
```

No joins — you embed or reference:

```javascript
// Embedded approach (no join needed)
db.users.findOne(
  { email: "alice@example.com" },
  { name: 1, labs: 1, _id: 0 }
);

// Referenced approach (manual lookup)
db.lab_submissions.find({ user_id: ObjectId("...") });
```

### ACID Properties in Practice

ACID stands for Atomicity, Consistency, Isolation, Durability. Here's what that means with real SQL:

```sql
BEGIN;

-- Both statements succeed or neither does
UPDATE accounts SET balance = balance - 50 WHERE user_id = 1;
UPDATE accounts SET balance = balance + 50 WHERE user_id = 2;

-- If anything fails, ROLLBACK undoes everything
COMMIT;
```

**Atomicity**: The entire transaction is one unit. If the second UPDATE fails, the first one is also undone.

**Consistency**: Constraints (foreign keys, CHECK, UNIQUE) prevent invalid data. You can't insert a submission for a non-existent user.

**Isolation**: Concurrent transactions don't interfere. PostgreSQL's default `READ COMMITTED` level means you only see data committed before your query started.

**Durability**: Once `COMMIT` returns, the data survives a crash. PostgreSQL writes to the WAL (Write-Ahead Log) before confirming.

Test isolation by opening two psql sessions:

```sql
-- Session 1
BEGIN;
UPDATE users SET full_name = 'Modified' WHERE id = 1;
-- Don't commit yet

-- Session 2 (different terminal)
BEGIN;
SELECT full_name FROM users WHERE id = 1;
-- Returns the OLD value, not 'Modified'
```

### When to Use Which

| Need | Relational | NoSQL |
|------|-----------|-------|
| Fixed schema, complex joins | PostgreSQL | — |
| Schema evolving rapidly | — | MongoDB |
| Transactions across tables | PostgreSQL | MongoDB (4.0+) |
| Horizontal scaling (sharding) | Harder | Built-in |
| Full-text search | `tsvector` | Atlas Search |
| JSON-native storage | `jsonb` column | Native |

MongoDB's document model shines when your data is naturally hierarchical — like lab submissions nested under a user. PostgreSQL's `jsonb` column type gives you similar flexibility within a relational model:

```sql
-- PostgreSQL can store and query JSON too
INSERT INTO users (email, full_name, metadata)
VALUES ('bob@test.com', 'Bob', '{"os": "linux", "labs_completed": 3}');

-- Query into JSON
SELECT full_name, metadata->>'os' AS os FROM users WHERE (metadata->>'labs_completed')::int > 2;
```

### Handling Concurrency

Both systems handle concurrent access, but differently:

```sql
-- PostgreSQL: optimistic locking
ALTER TABLE lab_submissions ADD COLUMN version INT DEFAULT 1;

-- Update only if version hasn't changed
UPDATE lab_submissions
SET score = 95, version = version + 1
WHERE id = 42 AND version = 3;
-- If affected_rows = 0, someone else modified it first
```

```javascript
// MongoDB: optimistic concurrency via _version or findAndModify
db.lab_submissions.findOneAndUpdate(
  { _id: ObjectId("..."), version: 3 },
  { $set: { score: 95 }, $inc: { version: 1 } }
);
```

## Assessment

**Lab task — 45 minutes**

Set up a PostgreSQL database and a MongoDB database side by side. Create a `courses` collection/table and a `student_progress` collection/table in both. Insert at least 10 documents/rows of realistic data.

Perform the following:
1. A JOIN query in PostgreSQL that retrieves student names and their scores.
2. An equivalent lookup in MongoDB using both embedded and referenced approaches.
3. Run a transaction in PostgreSQL that transfers a "balance" between two accounts and verify atomicity by killing the process mid-transaction.
4. Demonstrate isolation levels by running two concurrent sessions and observing read behavior.

Write a brief comparison (200-300 words) of which approach felt more natural for this data model and why.

**Grading criteria:**
- Both databases are running with correct schemas (20 points)
- Data inserted and queries return correct results (25 points)
- Transaction atomicity demonstrated (25 points)
- Isolation test conducted correctly (15 points)
- Written comparison is thoughtful and specific (15 points)

## Evidence

- Screenshots of PostgreSQL and MongoDB schemas
- SQL and JavaScript query results showing correct output
- Transaction test showing rollback behavior
- Side-by-side comparison document
