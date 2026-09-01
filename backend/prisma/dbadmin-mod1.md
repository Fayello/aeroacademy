# Module 1: Database Fundamentals

Databases sit at the center of nearly every application you will encounter in the field. Whether you are building a simple blog, a banking platform, or an IoT data pipeline, the way you store, retrieve, and manage data determines how far you can scale, how reliably your system performs, and how much pain you will face when things go wrong. This module lays the groundwork for everything that follows in this course. We will not gloss over the basics: we will go deep into why relational databases still dominate, when NoSQL is the right call, and how to think about consistency, availability, and durability in practical terms you can apply on your first day on the job.

## Relational vs NoSQL: When to Use Which

Every data storage decision starts with a question: what shape is my data, and how will I query it? The answer determines whether a relational database (RDBMS) or a NoSQL store is the better fit.

Relational databases organize data into tables with predefined schemas. Each row represents a record, each column represents a field, and relationships between tables are enforced through foreign keys. This model works exceptionally well when your data is structured, your queries are known in advance, and you need transactions that span multiple operations. Think of a financial system where you must debit one account and credit another atomically: either both happen or neither happens. Relational databases guarantee this through ACID properties (covered below).

NoSQL databases take different approaches. Document stores like MongoDB store JSON-like documents with flexible schemas. Key-value stores like Redis are optimized for simple lookups by key. Column-family stores like Cassandra spread data across nodes for horizontal scalability. Graph databases like Neo4j model relationships between entities as first-class citizens. Each model trades off something in exchange for advantages in specific use cases.

Consider an e-commerce product catalog. Products have varying attributes: a shirt has size and color, a laptop has RAM and CPU specs, a book has ISBN and page count. A rigid relational schema forces you into either a sparse table with many NULL columns or a complex web of joined tables. MongoDB handles this naturally: each product document contains only the fields relevant to that product type, and the schema evolves without migrations. You add a new product type with new attributes and existing queries still work.

But now consider the order processing system for that same e-commerce platform. Orders reference customers, products, inventory, and payment records. An order must update inventory counts, record the transaction, and generate a shipment: all atomically. If the payment goes through but the inventory decrement fails, you have oversold a product. MongoDB 4.0+ supports multi-document transactions, but they come with performance overhead and complexity that makes a relational database the natural choice here.

The real world does not force a single choice. Most production systems use multiple data stores. PostgreSQL handles transactional data. Redis caches session information and recent queries. Elasticsearch powers full-text search across product catalogs. The skill is knowing which tool fits which job, not picking one database for everything.

**Practical decision framework:**

Use a relational database when you need ACID transactions, your schema is stable or changes infrequently, your queries involve joins across multiple entities, or you need complex reporting with aggregations. Use NoSQL when your schema is highly variable, you need to scale horizontally across many nodes, your access patterns are simple (key-based lookups), or your data volume exceeds what a single relational server can handle without sharding complexity.

Be cautious of the "NoSQL is faster" claim. NoSQL databases are faster for specific workloads: typically simple reads and writes at massive scale. A well-tuned PostgreSQL instance with proper indexing will outperform MongoDB for complex analytical queries. The performance advantage of NoSQL comes from relaxed consistency guarantees and denormalized data, not from some magical architectural superiority.

## ACID Properties with Real Examples

ACID stands for Atomicity, Consistency, Isolation, and Durability. These four properties guarantee that database transactions are reliable, even when the system crashes or multiple users access the same data simultaneously.

**Atomicity** means a transaction either completes entirely or not at all. There is no partial state. Consider a bank transfer: you withdraw $500 from Account A and deposit $500 into Account B. If the system crashes after the withdrawal but before the deposit, Atomicity ensures the withdrawal is rolled back. In PostgreSQL, the transfer looks like this:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE account_id = 'A';
UPDATE accounts SET balance = balance + 500 WHERE account_id = 'B';
COMMIT;
```

If anything fails between BEGIN and COMMIT, the entire transaction is rolled back. No partial updates persist. Without Atomicity, you would need compensating logic to detect and fix half-completed transactions: a maintenance nightmare that scales poorly.

**Consistency** ensures that every transaction moves the database from one valid state to another, respecting all defined constraints. If you have a CHECK constraint requiring account balances to be non-negative, a transaction that would make a balance negative is rejected entirely. Consider:

```sql
ALTER TABLE accounts ADD CONSTRAINT positive_balance CHECK (balance >= 0);
```

Now if Account A has $300 and you try to withdraw $500, the CHECK constraint fails, the transaction rolls back, and the database remains in a consistent state. Consistency is enforced by the database engine through constraints, triggers, and rules. It is not something your application layer can reliably enforce on its own: concurrent requests can race past application checks.

**Isolation** determines how concurrent transactions interact. Without proper isolation, one transaction can read uncommitted changes from another (dirty reads), miss updates entirely (non-repeatable reads), or see phantom rows that appear or disappear between reads. PostgreSQL defaults to READ COMMITTED isolation, which prevents dirty reads but allows non-repeatable reads. For financial systems, SERIALIZABLE isolation is often required:

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- Both reads and writes are fully isolated
SELECT balance FROM accounts WHERE account_id = 'A';
UPDATE accounts SET balance = balance - 500 WHERE account_id = 'A';
COMMIT;
```

SERIALIZABLE behaves as if transactions execute one at a time, even though they actually run concurrently. The database detects conflicts and aborts one transaction if serializability cannot be maintained. The cost is performance: more transactions will be aborted and retried under high concurrency. Most systems use READ COMMITTED or REPEATABLE READ and accept the trade-offs for better throughput.

**Durability** guarantees that once a transaction is committed, it survives system failures. PostgreSQL achieves this through write-ahead logging (WAL). Before any change is applied to the data files, the change is written to the WAL on disk. If the server crashes, PostgreSQL replays the WAL on recovery to restore committed changes. You can tune durability with the synchronous_commit setting:

```sql
-- Maximum durability: wait for WAL to hit disk before acknowledging commit
SET synchronous_commit = on;

-- Better performance, slight risk: WAL flushed to OS buffer, not necessarily disk
SET synchronous_commit = off;
```

Setting synchronous_commit to off improves write performance but means you could lose up to a few seconds of committed transactions if the server loses power. For most applications, the default (on) is correct. For logging tables or analytics data where occasional loss is acceptable, turning it off can meaningfully improve throughput.

## CAP Theorem

The CAP theorem, proposed by Eric Brewer in 2000 and proven by Gilbert and Lynch in 2002, states that a distributed data store can provide at most two of three guarantees: Consistency, Availability, and Partition tolerance. In practice, network partitions happen: servers lose connectivity, network cards fail, data centers lose communication. Since you cannot prevent partitions, you must choose between consistency and availability when a partition occurs.

**Consistency (C):** Every read receives the most recent write or an error. All nodes see the same data at the same time. If you write a value to one node, any subsequent read from any node returns that value.

**Availability (A):** Every request receives a non-error response, without guaranteeing it contains the most recent write. The system is always responsive.

**Partition tolerance (P):** The system continues to operate despite network partitions between nodes. Messages between nodes may be delayed or dropped.

In a single-node database, CAP does not apply. CAP is about distributed systems where data is replicated across multiple nodes. When a partition occurs, you must decide:

- **CP systems** sacrifice availability for consistency. If a partition occurs, some nodes may stop accepting reads or writes to ensure they do not serve stale data. MongoDB in its default configuration (with majority write concern) is CP: a write to a three-node replica set requires acknowledgment from a majority (2 of 3 nodes). If two nodes lose connectivity with the third, the third node cannot form a majority and becomes read-only. Writes fail until the partition heals.

- **AP systems** sacrifice consistency for availability. Cassandra is AP by default. If a partition occurs, all nodes continue accepting reads and writes. After the partition heals, a conflict resolution mechanism (last-write-wins or a custom resolver) reconciles the differences. You might read stale data during the partition, but the system never stops accepting requests.

- **CA systems** are theoretically possible only in single-node deployments or networks that never partition. In practice, every distributed system must tolerate partitions, so CA is not a realistic option for distributed databases.

The practical implication: when someone tells you a distributed database is "consistent and available," ask them what happens during a network partition. The answer reveals whether they are selling you something or being honest about trade-offs.

For a banking system that must never show inconsistent balances, a CP system like PostgreSQL with synchronous replication is appropriate. For a social media feed where showing a slightly outdated post is acceptable but the service must never go down, an AP system like Cassandra makes more sense.

## Database Engines

The database engine is the component that actually stores, retrieves, and manipulates data. Choosing the right engine within a database system matters as much as choosing the database system itself.

**InnoDB (MySQL):** InnoDB is the default storage engine for MySQL since version 5.5. It supports transactions, row-level locking, foreign keys, and crash recovery through redo logs. InnoDB uses a clustered index for primary keys, meaning the data is physically ordered by the primary key. This makes primary key lookups very fast but means you should choose your primary keys carefully: auto-incrementing integers are ideal, while random UUIDs cause page splits and performance degradation.

```sql
-- InnoDB stores data in the primary key order
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;
```

InnoDB's buffer pool caches both data and indexes in memory. For a dedicated MySQL server, setting innodb_buffer_pool_size to 70-80% of available RAM is a common starting point. The buffer pool is the single most important InnoDB tuning parameter.

**MyISAM (MySQL):** MyISAM was the default engine before MySQL 5.5. It uses table-level locking, does not support transactions or foreign keys, and stores data and indexes separately. MyISAM is faster than InnoDB for read-heavy workloads with no write contention because table-level locking has less overhead than row-level locking. It also supports full-text indexing (though InnoDB supports this since MySQL 5.6).

For a read-only reporting table that is bulk-loaded periodically, MyISAM might outperform InnoDB. But for any system with concurrent writes, InnoDB is the correct choice. The table-level locking in MyISAM means a single UPDATE locks the entire table, blocking all other operations.

**PostgreSQL Engine Architecture:** PostgreSQL does not have pluggable storage engines like MySQL. Instead, it uses a single, unified storage engine with MVCC (Multi-Version Concurrency Control) built in. MVCC means readers do not block writers and writers do not block readers: each transaction sees a snapshot of the data as it existed at the start of the transaction. This is fundamentally different from MySQL's InnoDB, which uses undo logs to provide MVCC-like behavior.

PostgreSQL stores data in 8KB pages organized into heap files. Each tuple (row) has a xmin (transaction that created it) and xmax (transaction that deleted or updated it) field. When you read a row, PostgreSQL checks whether the creating transaction committed and the deleting transaction has not, using this visibility information to show each transaction its own consistent snapshot.

The WAL (Write-Ahead Log) in PostgreSQL is the foundation for durability, replication, and point-in-time recovery. Every modification is first written to the WAL before being applied to data files. The WAL is a sequential append-only file, making writes fast. Checkpoints periodically flush dirty pages from shared buffers to disk, but recovery only needs to replay WAL from the last checkpoint.

```sql
-- Check current WAL configuration
SHOW wal_level;          -- 'replica' or 'logical' for replication support
SHOW max_wal_senders;    -- max concurrent replication connections
SHOW wal_keep_size;      -- WAL retained for replicas (MB)
```

## Database Design Principles

Before you choose a database engine or configure replication, you need to design your schema correctly. Bad design causes performance problems that no amount of tuning can fix.

**Normalization:**

Normalization organizes data to reduce redundancy. The normal forms (1NF through 5NF) progressively eliminate duplicate data. In practice, most databases are designed to Third Normal Form (3NF):

First Normal Form (1NF): Each column contains atomic values. No arrays, no comma-separated lists. If you need to store multiple values, use a separate table.

```sql
-- Violates 1NF: tags column contains multiple values
CREATE TABLE products_bad (
    id INT PRIMARY KEY,
    name TEXT,
    tags TEXT  -- "sale, clearance, new"
);

-- Follows 1NF: separate table for tags
CREATE TABLE products (
    id INT PRIMARY KEY,
    name TEXT
);

CREATE TABLE product_tags (
    product_id INT REFERENCES products(id),
    tag TEXT,
    PRIMARY KEY (product_id, tag)
);
```

Second Normal Form (2NF): Every non-key column depends on the entire primary key, not just part of it. This matters primarily for composite primary keys.

Third Normal Form (3NF): Non-key columns depend only on the primary key, not on other non-key columns. If you have a customers table where city determines state, state should not be in the customers table: it should be in a separate zip_codes table.

Denormalization is the opposite of normalization: you deliberately add redundancy to improve read performance. A common pattern is to store a computed total in an orders table rather than calculating it from order_items every time. The trade-off is clear: reads are faster, but writes must update the denormalized value.

```sql
-- Denormalized: total stored alongside order items
CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    item_count INT NOT NULL,
    total NUMERIC(10,2) NOT NULL,  -- Denormalized from order_items
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to keep denormalized total in sync
CREATE FUNCTION update_order_total() RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET total = (SELECT COALESCE(SUM(quantity * price), 0) FROM order_items WHERE order_id = NEW.order_id),
        item_count = (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = NEW.order_id)
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_changed
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();
```

**Data Type Selection:**

Choosing the wrong data type wastes disk space, slows queries, and causes bugs. A few practical guidelines:

- Use UUIDs for primary keys when you need distributed generation or merge from multiple sources. Use auto-incrementing integers for single-server OLTP workloads where sequential access patterns matter.
- Use NUMERIC (exact) for money. Never use FLOAT or DOUBLE for financial calculations: floating-point rounding produces incorrect totals.
- Use TIMESTAMPTZ (timestamp with time zone) for all timestamps. Store in UTC, convert to local time in the application layer.
- Use TEXT/VARCHAR with appropriate length limits. MySQL's VARCHAR(255) is not the same as VARCHAR(255) in other databases: MySQL VARCHAR uses 1 byte for lengths under 256, 2 bytes for longer.
- Use JSONB (PostgreSQL) or JSON (MySQL 8.0+) for semi-structured data that benefits from indexing. Use TEXT for opaque JSON that is only read by the application.

```sql
-- Good schema design examples
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(id),
    amount NUMERIC(12,2) NOT NULL,  -- Exact precision for money
    currency CHAR(3) NOT NULL,       -- ISO 4217: USD, EUR, GBP
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (amount != 0)  -- Prevent zero-amount transactions
);
```

## Real Scenario: Choosing a Database for an E-Commerce Platform

You are the DBA for a growing online retailer. The platform currently runs on MySQL 8.0 with a single server handling product catalog, user accounts, orders, and search. The CTO wants to redesign the data layer for the next phase of growth. Let us walk through the decision process.

**Product Catalog:** Products have wildly varying attributes. Electronics have technical specs, clothing has sizes and colors, books have authors and ISBNs. The current schema uses a massive products table with 80+ columns, most of which are NULL for any given product. The catalog team wants to add new product types without waiting for schema migrations.

You decide to migrate the product catalog to MongoDB. The document model handles varying attributes naturally. Each product type gets its own shape without NULL columns. The read-heavy nature of the catalog (thousands of reads per write) fits MongoDB's access pattern. You create a compound index on category and price for the most common query pattern:

```javascript
db.products.createIndex({ category: 1, price: -1 })
```

**User Accounts and Authentication:** User data is structured, relational, and requires transactions. A user creation must atomically create the user record, default preferences, and initial session. PostgreSQL handles this well. The schema is stable: every user has a name, email, hashed password, and created timestamp. Joins between users and orders are frequent.

**Orders and Payments:** Orders reference users, products (now in MongoDB), and payment records. This is the most transactionally critical data. An order must atomically: create the order record, decrement inventory, record the payment, and generate a shipment. The payment processing requires ACID guarantees: a partial order is unacceptable.

You keep orders in PostgreSQL but face a design question: orders reference products in MongoDB. You solve this by embedding a snapshot of the product details (name, price at time of purchase) in the order record. This is a common pattern in polyglot persistence: embed immutable copies of cross-store references so you never need a cross-database join.

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    items JSONB NOT NULL,  -- Embedded product snapshots
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Search:** The product catalog search needs full-text search with faceting, fuzzy matching, and relevance scoring. Neither PostgreSQL's tsvector nor MongoDB's text search meets the performance requirements at scale. Elasticsearch is the right tool for this job. You replicate product data from MongoDB to Elasticsearch using a change stream, keeping the search index in sync within seconds of catalog updates.

**Session and Caching:** User sessions are ephemeral, high-read, and need sub-millisecond latency. Redis stores session data with automatic expiration. Every HTTP request reads the session from Redis rather than querying PostgreSQL, reducing database load significantly.

**The Architecture in Summary:**
- PostgreSQL: User accounts, orders, payments (transactional, relational)
- MongoDB: Product catalog (flexible schema, varying attributes)
- Elasticsearch: Product search (full-text, faceted)
- Redis: Session cache, rate limiting (ephemeral, fast)

This polyglot approach is more complex than a single database, but each component handles what it does best. The alternative: shoving everything into PostgreSQL or everything into MongoDB: would create performance bottlenecks and development friction that slow the team down more than the operational complexity of multiple stores.

**Migration Planning:** You do not rip out MySQL overnight. The migration happens in phases:

Phase 1: Set up PostgreSQL and MongoDB in production. Run both databases in parallel, writing to MySQL as the primary and syncing to PostgreSQL/MongoDB via CDC (Change Data Capture) using Debezium.

Phase 2: Move read traffic to the new databases. Monitor performance and correctness by comparing query results between old and new stores.

Phase 3: Switch write traffic to the new databases. MySQL becomes read-only, still receiving sync for rollback safety.

Phase 4: Decommission MySQL after a two-week bake period with no discrepancies.

Each phase has a rollback plan. If anything goes wrong, you switch traffic back to MySQL within minutes. This staged approach reduces risk while allowing you to validate each component under real production load.

## Assessment

**Lab Tasks:**

1. Design a database schema for an e-commerce platform with the following entities: users, products (3 different categories with different attributes), orders, and reviews. Write the DDL for both a PostgreSQL schema and a MongoDB collection structure. Justify each design decision in 200 words or fewer per entity. Time limit: 45 minutes.

2. Set up a PostgreSQL instance and a MongoDB instance. Create equivalent datasets (1,000 products, 500 users, 2,000 orders). Write queries in both databases to: (a) find all orders for a specific user with product details, (b) find the top 5 products by revenue, (c) find users who left reviews in the last 30 days. Compare the query approaches and performance. Time limit: 60 minutes.

3. Scenario response: Your team is debating whether to use PostgreSQL or MongoDB for a new logging system that ingests 10,000 events per second. Each event is a JSON document with 15-25 fields. The system needs to support queries by timestamp range and by specific field values. Write a 300-word recommendation explaining your choice, the indexing strategy, and how you would handle the write throughput. Time limit: 30 minutes.

**Grading Criteria:**
- Schema design correctness (30%): Tables/collections are properly structured with appropriate data types, keys, and relationships
- Query implementation (30%): Queries return correct results and demonstrate understanding of each database's query language
- Performance awareness (20%): Indexes are created appropriately, queries avoid unnecessary full scans
- Justification quality (20%): Design decisions are explained with reference to trade-offs, not just stated as preferences

**Evidence:**
- DDL scripts for PostgreSQL schema
- MongoDB shell commands for collection creation and indexing
- Query results with execution times from both databases
- Written recommendation document
