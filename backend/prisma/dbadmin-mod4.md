# Module 4 — MongoDB

MongoDB is a document-oriented database that stores data as JSON-like documents in a format called BSON (Binary JSON). Unlike relational databases where you fit data into rigid table schemas, MongoDB lets you store documents with varying structures in the same collection. This flexibility makes it popular for content management systems, real-time analytics, IoT data, and applications where the data model evolves frequently. This module covers the core concepts you need to operate MongoDB in production: the document model, CRUD operations, aggregation pipelines, indexing strategies, and security hardening.

## Document Model and BSON

A MongoDB document is a data structure composed of field-value pairs, similar to a JSON object. Documents are stored in collections, which are analogous to tables in relational databases. The key difference: documents in the same collection do not need to have the same fields or structure.

Consider a product catalog:

```javascript
// A clothing product
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Cotton T-Shirt",
  category: "clothing",
  price: 29.99,
  sizes: ["S", "M", "L", "XL"],
  colors: [
    { name: "Red", hex: "#FF0000", stock: 45 },
    { name: "Blue", hex: "#0000FF", stock: 32 }
  ],
  attributes: {
    material: "100% Cotton",
    care: "Machine wash cold"
  },
  created_at: ISODate("2026-01-15T10:30:00Z")
}

// An electronics product — different structure, same collection
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  name: "Wireless Mouse",
  category: "electronics",
  price: 49.99,
  specs: {
    dpi: 16000,
    battery_life: "70 hours",
    connectivity: "USB-C / Bluetooth 5.0"
  },
  warranty: {
    duration_months: 24,
    type: "manufacturer"
  },
  created_at: ISODate("2026-01-15T11:00:00Z")
}
```

The `_id` field is mandatory in every document. If you do not provide one, MongoDB generates an ObjectId automatically. ObjectId is a 12-byte value: 4 bytes for timestamp, 5 bytes for a random value, and 3 bytes for an incrementing counter. This means ObjectIds are roughly time-ordered, which has implications for index performance (discussed later).

**BSON vs JSON:**

BSON is the binary encoding of JSON-like documents. It supports types that JSON does not: Date, ObjectId, Binary Data, Regular Expressions, 32-bit and 64-bit integers, and Decimal128. BSON also includes type information and lengths, which allows MongoDB to skip over fields it does not need without parsing the entire document.

The practical impact: BSON's binary format is more compact than JSON text for large documents, and the type information allows MongoDB to compare values correctly. JSON stores everything as strings — `"42"` and `42` are both strings. BSON distinguishes between Int32, Int64, Double, and Decimal128, which matters for correct sorting and arithmetic.

**When to Embed vs Reference:**

MongoDB offers two ways to model relationships: embedding documents within documents, or referencing other documents by `_id` (like foreign keys in relational databases).

Embed when:
- The child data is accessed primarily with the parent
- The child data is small (under 16MB per document, MongoDB's document size limit)
- The parent-child relationship is one-to-few (a few dozen children)
- You need atomic updates of parent and child together

Reference when:
- The child data is large
- The parent-child relationship is one-to-many or many-to-many
- The child is frequently accessed independently
- The child data grows unbounded

Example of embedding (order with items):

```javascript
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),  // Reference to user
  items: [  // Embedded — items are always accessed with the order
    { product_id: ObjectId("..."), name: "T-Shirt", qty: 2, price: 29.99 },
    { product_id: ObjectId("..."), name: "Mouse", qty: 1, price: 49.99 }
  ],
  total: 109.97,
  status: "shipped"
}
```

Example of referencing (user with reviews):

```javascript
// User document
{
  _id: ObjectId("..."),
  name: "Alice",
  email: "alice@example.com"
}

// Review document — references user, not embedded in user
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),  // Reference to user
  product_id: ObjectId("..."),  // Reference to product
  rating: 5,
  comment: "Great product!",
  created_at: ISODate("...")
}
```

## CRUD Operations

**Insert:**

```javascript
// Insert one document
db.products.insertOne({
  name: "Mechanical Keyboard",
  category: "electronics",
  price: 149.99,
  in_stock: true,
  created_at: new Date()
})

// Insert multiple documents
db.products.insertMany([
  { name: "USB Cable", category: "accessories", price: 9.99, in_stock: true },
  { name: "Monitor Stand", category: "accessories", price: 39.99, in_stock: false },
  { name: "Webcam HD", category: "electronics", price: 79.99, in_stock: true }
])
```

**Read:**

```javascript
// Find all products in electronics category
db.products.find({ category: "electronics" })

// Find with projection (only return name and price)
db.products.find(
  { category: "electronics" },
  { name: 1, price: 1, _id: 0 }
)

// Find one product by ID
db.products.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })

// Find products with compound query
db.products.find({
  category: "electronics",
  price: { $gte: 50, $lte: 200 },
  in_stock: true
}).sort({ price: -1 }).limit(10)

// Find products where name contains "wireless" (regex)
db.products.find({ name: { $regex: /wireless/i } })

// Count documents matching a query
db.products.countDocuments({ category: "electronics" })
```

**Update:**

```javascript
// Update one document
db.products.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $set: { price: 24.99, updated_at: new Date() } }
)

// Update many documents
db.products.updateMany(
  { category: "electronics", in_stock: false },
  { $set: { price: { $multiply: ["$price", 0.9] } } }  // 10% discount
)

// Upsert: update if exists, insert if not
db.products.updateOne(
  { name: "USB Cable" },
  {
    $set: { price: 12.99 },
    $setOnInsert: { created_at: new Date() }
  },
  { upsert: true }
)

// Array operations
db.products.updateOne(
  { _id: ObjectId("...") },
  { $push: { tags: "sale" } }  // Add element to array
)

db.products.updateOne(
  { _id: ObjectId("...") },
  { $pull: { tags: "clearance" } }  // Remove element from array
)
```

**Delete:**

```javascript
// Delete one document
db.products.deleteOne({ _id: ObjectId("...") })

// Delete many documents
db.products.deleteMany({ category: "discontinued" })

// Delete with conditions
db.products.deleteMany({
  in_stock: false,
  created_at: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
})
```

## Aggregation Pipeline

The aggregation pipeline is MongoDB's most powerful analytical tool. It processes documents through a series of stages, where each stage transforms the documents and passes them to the next stage. Think of it as a data processing pipeline where each stage is a specific operation.

**Pipeline stages:**

- `$match` — Filter documents (like WHERE in SQL)
- `$group` — Group documents by a key and apply accumulators (like GROUP BY)
- `$project` — Reshape documents, include/exclude fields, compute new fields
- `$sort` — Sort documents
- `$limit` / `$skip` — Pagination
- `$lookup` — Join with another collection (like JOIN in SQL)
- `$unwind` — Deconstruct array fields into individual documents
- `$addFields` — Add new computed fields

**Example: Sales analytics pipeline:**

```javascript
db.orders.aggregate([
  // Stage 1: Filter to Q1 2026
  {
    $match: {
      created_at: {
        $gte: ISODate("2026-01-01"),
        $lt: ISODate("2026-04-01")
      }
    }
  },

  // Stage 2: Unwind items array (one document per item)
  { $unwind: "$items" },

  // Stage 3: Group by product category, calculate metrics
  {
    $group: {
      _id: "$items.category",
      total_revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
      total_orders: { $addToSet: "$_id" },  // unique orders
      avg_order_value: { $avg: "$total" },
      min_price: { $min: "$items.price" },
      max_price: { $max: "$items.price" },
      item_count: { $sum: "$items.qty" }
    }
  },

  // Stage 4: Reshape the output
  {
    $project: {
      category: "$_id",
      total_revenue: { $round: ["$total_revenue", 2] },
      unique_orders: { $size: "$total_orders" },
      avg_order_value: { $round: ["$avg_order_value", 2] },
      price_range: {
        $concat: [
          { $toString: "$min_price" },
          " - ",
          { $toString: "$max_price" }
        ]
      },
      items_sold: "$item_count"
    }
  },

  // Stage 5: Sort by revenue descending
  { $sort: { total_revenue: -1 } },

  // Stage 6: Limit to top 10
  { $limit: 10 }
])
```

**Example: Customer lifetime value analysis:**

```javascript
db.orders.aggregate([
  // Group by user, calculate lifetime metrics
  {
    $group: {
      _id: "$user_id",
      total_spent: { $sum: "$total" },
      order_count: { $sum: 1 },
      first_order: { $min: "$created_at" },
      last_order: { $max: "$created_at" },
      avg_order_value: { $avg: "$total" }
    }
  },

  // Calculate customer lifetime in days
  {
    $addFields: {
      lifetime_days: {
        $divide: [
          { $subtract: ["$last_order", "$first_order"] },
          86400000  // milliseconds per day
        ]
      }
    }
  },

  // Join with users collection to get name
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
    }
  },

  { $unwind: "$user" },

  // Final output
  {
    $project: {
      name: "$user.name",
      email: "$user.email",
      total_spent: { $round: ["$total_spent", 2] },
      order_count: 1,
      avg_order_value: { $round: ["$avg_order_value", 2] },
      lifetime_days: { $round: ["$lifetime_days", 0] }
    }
  },

  { $sort: { total_spent: -1 } }
])
```

The aggregation pipeline is processed in memory by default. Each stage that accumulates or sorts data uses memory. If the pipeline exceeds 100MB of memory per stage, MongoDB throws an error. For large datasets, use `{ allowDiskUse: true }` to allow temporary data to be written to disk:

```javascript
db.orders.aggregate([...pipeline...], { allowDiskUse: true })
```

**Aggregation Pipeline Performance Tips:**

1. Put `$match` stages early in the pipeline. This reduces the number of documents flowing through subsequent stages, just like putting WHERE before GROUP BY in SQL.

2. Use `$project` to limit fields early. If you only need `name` and `price`, project those fields before `$group` or `$sort` to reduce memory usage.

3. Create indexes that support your pipeline's `$match` and `$sort` stages. An index on `{ category: 1, created_at: -1 }` supports both `db.orders.aggregate([{ $match: { category: "electronics" } }, { $sort: { created_at: -1 } }])`.

4. Use `$limit` early when possible. A `$limit` before a `$sort` reduces the sort input size.

5. Monitor pipeline memory usage:

```javascript
// Check current aggregation memory usage
db.currentOp({
  "active": true,
  "op": "command",
  "command.aggregate": { $exists: true }
})
```

6. Use `$merge` instead of `$out` for incremental analytics. `$out` replaces the entire collection, while `$merge` can upsert, merge, or fail on duplicate keys.

## Indexes: Types and Strategy

Indexes are the single most important factor in MongoDB query performance. Without indexes, every query performs a collection scan — reading every document in the collection. With the right indexes, MongoDB can locate the documents it needs by reading a small portion of the index.

**B-Tree Index (Default):**

```javascript
// Create a single-field index
db.products.createIndex({ name: 1 })  // 1 = ascending, -1 = descending

// Create a compound index
db.products.createIndex({ category: 1, price: -1 })

// Create a unique index
db.users.createIndex({ email: 1 }, { unique: true })

// Create a sparse index (only index documents where the field exists)
db.products.createIndex({ discount: 1 }, { sparse: true })

// Create a TTL index (automatically delete documents after a time period)
db.sessions.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 3600 }  // Delete after 1 hour
)
```

**Compound Index Rules:**

Compound indexes follow the ESR (Equality, Sort, Range) rule. Fields used in equality comparisons come first, then fields used in sorting, then fields used in range queries.

```javascript
// Query: find orders by user_id AND status, sort by created_at
db.orders.find({
  user_id: ObjectId("..."),
  status: "completed"
}).sort({ created_at: -1 })

// Optimal compound index follows ESR:
db.orders.createIndex({
  user_id: 1,     // Equality
  status: 1,      // Equality
  created_at: -1  // Sort
})
```

Without the ESR rule, you might create the index in a suboptimal order. A common mistake is putting the sort field first. The order of fields in the index determines which query patterns it can efficiently serve.

**Multikey Index (Array Fields):**

```javascript
// Index on an array field — one index entry per array element
db.products.createIndex({ tags: 1 })

// This index efficiently serves queries like:
db.products.find({ tags: "sale" })
db.products.find({ tags: { $in: ["sale", "clearance"] } })
```

**Text Index (Full-Text Search):**

```javascript
// Create a text index for full-text search
db.products.createIndex({ name: "text", description: "text" })

// Query with text search
db.products.find({ $text: { $search: "wireless mouse" } })

// With relevance scoring
db.products.find(
  { $text: { $search: "wireless mouse" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

Text indexes are useful for basic full-text search but do not replace Elasticsearch for complex search requirements. They support stemming, stop words, and basic relevance but lack faceting, fuzzy matching, and the scalability of dedicated search engines.

**Index Strategy Principles:**

1. Create indexes that match your most frequent and most performance-critical queries. Use `db.collection.explain("executionStats")` to see which queries are scanning too many documents.

2. Avoid over-indexing. Every index adds overhead to writes. Each insert, update, and delete must update every index on the collection. A collection with 20 indexes will have significantly slower writes than one with 3.

3. Use `db.collection.getIndexes()` to review existing indexes. Drop indexes that are not used. Use the `db.collection.aggregate([{ $indexStats: {} }])` command to see index usage statistics.

4. For collections with high write throughput, consider whether all indexes are necessary. The `_id` index is always present. Every additional index costs write performance.

5. Monitor index usage with:

```javascript
db.collection.aggregate([{ $indexStats: {} }])
// Shows access count and time since last access for each index

db.collection.stats().indexSizes
// Shows disk usage of each index
```

**Index Maintenance:**

Indexes degrade over time due to document growth, updates, and deletions. MongoDB's default storage engine (WiredTiger) uses copy-on-write, meaning updates create new versions of documents. This causes index fragmentation.

```javascript
// Check index fragmentation
db.collection.aggregate([
  { $indexStats: {} },
  { $project: { name: 1, accesses: 1, size: { $meta: 'indexStats' } } }
])

// Rebuild a fragmented index
db.collection.reIndex()

// Compact the entire collection (returns disk space to the OS)
db.runCommand({ compact: 'collection_name' })
```

Compaction and reIndexing are expensive operations. Schedule them during low-traffic periods. For large collections, reIndexing can take hours. During this time, the collection is locked for writes. Use MongoDB 4.2+ background index builds to minimize impact:

```javascript
// Background index build (MongoDB 4.2+)
db.collection.createIndex(
  { field: 1 },
  { background: true }
)
```

## Security: Authentication, Encryption

MongoDB security starts with authentication and authorization. By default, older MongoDB installations may run without authentication. This is a critical misconfiguration.

**Enabling Authentication:**

```yaml
# mongod.conf
security:
  authorization: enabled

net:
  port: 27017
  bindIp: 127.0.0.1,10.0.1.10
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/mongodb/ssl/mongodb.pem
    CAFile: /etc/mongodb/ssl/ca.pem
```

**Creating Users with Roles:**

```javascript
// Connect as admin
mongosh -u admin -p --authenticationDatabase admin

// Create an application user with readWrite on a specific database
use myapp
db.createUser({
  user: "appuser",
  pwd: "Str0ng_P@ssw0rd!",
  roles: [
    { role: "readWrite", db: "myapp" }
  ]
})

// Create a read-only user
db.createUser({
  user: "reader",
  pwd: "R3ad_0nly!",
  roles: [
    { role: "read", db: "myapp" }
  ]
})

// Create an admin user
use admin
db.createUser({
  user: "dbadmin",
  pwd: "Adm1n_S3cure!",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})

// Create a backup user
use admin
db.createUser({
  user: "backupuser",
  pwd: "B@ckup_S3cure!",
  roles: [
    { role: "backup", db: "admin" },
    { role: "restore", db: "admin" }
  ]
})
```

**Built-in Roles:**

- `read` — Read-only access to a database
- `readWrite` — Read and write access to a database
- `dbAdmin` — Administrative operations (compact, index, validate)
- `userAdmin` — Create and modify users and roles
- `clusterAdmin` — Full cluster administration
- `backup` — Run backup operations
- `restore` — Restore from backup

Never use `root` for application connections. Follow the principle of least privilege — grant only the roles the user needs.

**MongoDB Built-in Roles:**

- `read` — Read-only access to a database
- `readWrite` — Read and write access to a database
- `dbAdmin` — Administrative operations (compact, index, validate)
- `userAdmin` — Create and modify users and roles
- `clusterAdmin` — Full cluster administration
- `backup` — Run backup operations
- `restore` — Restore from backup
- `readAnyDatabase` — Read access to all databases
- `readWriteAnyDatabase` — Read and write access to all databases
- `userAdminAnyDatabase` — User administration across all databases
- `dbAdminAnyDatabase` — Administrative operations across all databases

Custom roles provide finer-grained control:

```javascript
// Create a custom role with specific privileges
db.createRole({
  role: "analytics_reader",
  privileges: [
    { resource: { db: "analytics", collection: "reports" }, actions: ["find"] },
    { resource: { db: "analytics", collection: "metrics" }, actions: ["find"] }
  ],
  roles: []
})

// Assign the custom role to a user
db.createUser({
  user: "analyst",
  pwd: "Analyst_S3cure!",
  roles: [{ role: "analytics_reader", db: "admin" }]
})
```

**Network Encryption (TLS):**

```yaml
# mongod.conf
net:
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/mongodb/ssl/mongodb.pem
    CAFile: /etc/mongodb/ssl/ca.pem
    allowConnectionsWithoutCertificates: false
```

Generate the SSL certificates:

```bash
# Generate CA key and certificate
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -out ca.pem -subj "/CN=MongoDB CA"

# Generate server key and certificate
openssl genrsa -out mongodb.key 2048
openssl req -new -key mongodb.key -out mongodb.csr \
  -subj "/CN=mongodb-server"
openssl x509 -req -in mongodb.csr -CA ca.pem -CAkey ca.key \
  -CAcreateserial -out mongodb.crt -days 365 -sha256

# Combine key and certificate
cat mongodb.key mongodb.crt > mongodb.pem
```

**Encryption at Rest:**

MongoDB Enterprise offers WiredTiger encryption at rest. For community edition, use LUKS (Linux Unified Key Setup) or dm-crypt to encrypt the data directory at the filesystem level:

```bash
# Create encrypted volume
sudo cryptsetup luksFormat /dev/sdb1
sudo cryptsetup luksOpen /dev/sdb1 mongodb_encrypted
sudo mkfs.ext4 /dev/mapper/mongodb_encrypted
sudo mount /dev/mapper/mongodb_encrypted /var/lib/mongodb
```

Client-Side Field Level Encryption (CSFLE) encrypts specific fields before they reach the server. The server never sees the plaintext values. This is the strongest protection for sensitive data like SSNs, credit card numbers, or health records.

## Real Scenario: MongoDB Performance Optimization

You are the DBA for a social media platform. The posts collection has 500 million documents and is growing by 10 million per day. The application is experiencing slow queries during peak hours (6-9 PM), with some queries taking 5-10 seconds. The current setup is a 3-node replica set with 16GB RAM per node.

**Problem Queries:**

Query 1: Load a user's feed (posts from people they follow)
```javascript
db.posts.find({ author_id: ObjectId("...") })
  .sort({ created_at: -1 })
  .limit(20)
```
Current execution time: 8-10 seconds

Query 2: Search posts by hashtag
```javascript
db.posts.find({ hashtags: "javascript" })
  .sort({ likes: -1 })
  .limit(20)
```
Current execution time: 3-5 seconds

**Step 1: Analyze with explain().**

```javascript
db.posts.find({ author_id: ObjectId("...") })
  .sort({ created_at: -1 })
  .limit(20)
  .explain("executionStats")
```

The output shows `totalDocsExamined: 500000000` — MongoDB scanned every document in the collection. There is no index on `author_id`, and no index supports the sort on `created_at`.

**Step 2: Create targeted indexes.**

```javascript
// For query 1: compound index on author_id and created_at
// ESR: author_id (equality), created_at (sort)
db.posts.createIndex({ author_id: 1, created_at: -1 })

// For query 2: compound index on hashtags and likes
db.posts.createIndex({ hashtags: 1, likes: -1 })
```

After creating the indexes, re-run explain():

```javascript
db.posts.find({ author_id: ObjectId("...") })
  .sort({ created_at: -1 })
  .limit(20)
  .explain("executionStats")
```

The output now shows `totalDocsExamined: 20` — MongoDB reads only the 20 documents it needs. Execution time drops to under 1ms.

**Step 3: Optimize the feed query with pre-computation.**

The feed query still has a problem at scale: users follow hundreds of people. Querying posts from all followed users and sorting by date is expensive even with indexes. The solution is to pre-compute feeds.

Create a `feeds` collection that stores pre-built feed data:

```javascript
// When a user creates a post, add it to each follower's feed
db.feeds.insertMany(
  followers.map(follower_id => ({
    user_id: follower_id,
    post_id: post._id,
    author_id: post.author_id,
    created_at: post.created_at
  }))
)

// Index for fast feed retrieval
db.feeds.createIndex({ user_id: 1, created_at: -1 })

// Feed query is now a simple index lookup
db.feeds.find({ user_id: ObjectId("...") })
  .sort({ created_at: -1 })
  .limit(20)
```

This is a classic space-time trade-off. The `feeds` collection uses more storage but reduces read latency from seconds to milliseconds. The write overhead of updating feeds is acceptable because reads vastly outnumber writes on social media platforms.

**Step 4: Implement connection pooling.**

MongoDB connections are expensive to create. Configure the application driver to use a connection pool:

```javascript
// Node.js driver configuration
const client = new MongoClient(uri, {
  maxPoolSize: 100,        // Maximum connections in pool
  minPoolSize: 10,         // Minimum connections maintained
  maxIdleTimeMS: 30000,    // Close idle connections after 30s
  waitQueueTimeoutMS: 5000 // Timeout waiting for available connection
})
```

**Step 5: Monitor and alert.**

```javascript
// Current operations (find slow queries)
db.currentOp({ "secs_running": { $gt: 1 } })

// Collection statistics
db.posts.stats()

// Server status
db.serverStatus().connections
db.serverStatus().opcounters
```

Set up monitoring for:
- Connection pool utilization exceeding 80%
- Query latency exceeding 100ms for critical queries
- Replication lag exceeding 10 seconds
- Disk usage exceeding 80%

**Result:** After implementing these changes, query 1 drops from 8-10 seconds to under 5ms. Query 2 drops from 3-5 seconds to under 10ms. The feed pre-computation adds 50ms of write latency per post but eliminates the need for complex queries on read. The system handles peak traffic without degradation.

## Assessment

**Lab Tasks:**

1. Set up a MongoDB replica set (3 nodes) using Docker. Create a database with 2 collections containing at least 5,000 documents each. Demonstrate that the replica set elects a primary and that writes on the primary replicate to secondaries. Time limit: 45 minutes.

2. Write 5 aggregation pipelines that answer these business questions: (a) total revenue by category, (b) top 10 customers by lifetime value, (c) monthly order trends for the last 12 months, (d) products that have never been ordered, (e) average time between order creation and shipment. Each pipeline must use at least 3 stages. Time limit: 60 minutes.

3. Analyze a slow query using explain("executionStats"). Create an index that improves performance. Document the before and after execution statistics (totalDocsExamined, executionTimeMillis). Time limit: 30 minutes.

4. Configure MongoDB authentication: create an admin user, an application user with readWrite on a test database, and a read-only user. Connect with each user and verify that permissions are correctly enforced. Time limit: 30 minutes.

**Grading Criteria:**
- Replica set setup (20%): 3-node replica set is operational with proper election and replication
- Aggregation pipelines (30%): All 5 pipelines return correct results and demonstrate understanding of pipeline stages
- Index optimization (25%): Correct index identified, created, and performance improvement documented
- Security configuration (25%): Users created with correct roles, unauthorized operations properly rejected

**Evidence:**
- Docker compose file for replica set
- Aggregation pipeline code with output
- explain() output before and after index creation
- Authentication test results with each user role
