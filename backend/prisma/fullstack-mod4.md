# Module 4 — Database Integration: MongoDB and PostgreSQL with Node.js

## What You'll Actually Do

Connect a Node.js application to both document (MongoDB) and relational (PostgreSQL) databases. You'll write queries, handle connections, and understand when to use which database. No ORMs yet — you'll understand the drivers first, then see why Prisma exists.

---

## Connecting to MongoDB

```javascript
// src/db/mongo.js
const { MongoClient } = require("mongodb");

let client;
let db;

async function connect() {
  if (db) return db;

  client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 10,
  });

  await client.connect();
  db = client.db("aeroacademy");
  console.log("Connected to MongoDB");
  return db;
}

async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { connect, disconnect };
```

### CRUD Operations with MongoDB

```javascript
// src/models/MongoUser.js
const { connect } = require("../db/mongo");

async function create(userData) {
  const db = await connect();
  const result = await db.collection("users").insertOne({
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { _id: result.insertedId, ...userData };
}

async function findById(id) {
  const db = await connect();
  const { ObjectId } = require("mongodb");
  return db.collection("users").findOne({ _id: new ObjectId(id) });
}

async function findByEmail(email) {
  const db = await connect();
  return db.collection("users").findOne({ email });
}

async function findAll(filter = {}) {
  const db = await connect();
  return db.collection("users").find(filter).toArray();
}

async function update(id, updates) {
  const db = await connect();
  const { ObjectId } = require("mongodb");
  const result = await db.collection("users").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result.value;
}

async function remove(id) {
  const db = await connect();
  const { ObjectId } = require("mongodb");
  return db.collection("users").deleteOne({ _id: new ObjectId(id) });
}

module.exports = { create, findById, findByEmail, findAll, update, remove };
```

### Indexing for performance

```javascript
async function ensureIndexes() {
  const db = await connect();
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("courses").createIndex({ title: "text", description: "text" });
  await db.collection("labs").createIndex({ difficulty: 1, createdAt: -1 });
}
```

---

## Connecting to PostgreSQL

```javascript
// src/db/postgres.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
```

### CRUD Operations with raw SQL

```javascript
// src/models/PgUser.js
const db = require("../db/postgres");

async function createTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(20) DEFAULT 'student',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function create({ name, email, role = "student" }) {
  const result = await db.query(
    `INSERT INTO users (name, email, role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, email, role]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await db.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

async function findAll({ role, limit = 50, offset = 0 } = {}) {
  let query = "SELECT * FROM users";
  const params = [];

  if (role) {
    params.push(role);
    query += ` WHERE role = $${params.length}`;
  }

  params.push(limit, offset);
  query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const result = await db.query(query, params);
  return result.rows;
}

async function update(id, { name, email, role }) {
  const result = await db.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         role = COALESCE($3, role),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [name, email, role, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await db.query(
    "DELETE FROM users WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { createTable, create, findById, findAll, update, remove };
```

---

## Transactions (PostgreSQL)

When multiple operations must all succeed or all fail:

```javascript
async function enrollUserInCourse(userId, courseId) {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // Check if already enrolled
    const existing = await client.query(
      "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    if (existing.rows.length > 0) {
      throw new Error("Already enrolled");
    }

    // Create enrollment
    await client.query(
      "INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)",
      [userId, courseId]
    );

    // Update course enrollment count
    await client.query(
      "UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = $1",
      [courseId]
    );

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
```

---

## Choosing Between MongoDB and PostgreSQL

| Factor | MongoDB | PostgreSQL |
|--------|---------|------------|
| Schema flexibility | High — documents can vary | Fixed — define schema upfront |
| Relationships | Embed or reference | Foreign keys, JOINs |
| Transactions | Limited (single document easy, multi-document harder) | Full ACID support |
| Querying | Pipeline aggregation for complex queries | SQL — powerful, battle-tested |
| Best for | Rapid prototyping, varied data shapes | Structured data, complex relationships |

**Practical rule:** Use PostgreSQL for core data (users, courses, enrollments). Use MongoDB for logs, analytics events, or content that varies in structure.

---

## Assessment

**Lab Task: Dual Database Integration (60 minutes)**

Build a data layer that uses both MongoDB and PostgreSQL:

1. **MongoDB:** Create a `LabLog` collection that stores user lab activity. Write functions: `logActivity(userId, labId, action)`, `getLabHistory(userId)`, `getLabStats(labId)`.
2. **PostgreSQL:** Create `courses` and `enrollments` tables. Write functions: `createCourse()`, `enrollUser()`, `getUserEnrollments(userId)` with proper transactions.
3. **Indexing:** Create appropriate indexes on both databases.
4. **Error handling:** Wrap database calls with proper error handling and connection management.
5. **Test script:** Seed data and run queries to verify everything works.

**Deliverables:** Database models, connection files, and a test script that creates tables/collections, inserts data, and queries it.

**Grading:**
- MongoDB CRUD works correctly: 25%
- PostgreSQL CRUD with transactions works: 30%
- Indexes created and effective: 15%
- Error handling is solid: 15%
- Code is well-organized: 15%

---

## Evidence

Save all database model files and the test script. Include output showing successful operations on both databases. Note which database you'd choose for a specific use case and why.
