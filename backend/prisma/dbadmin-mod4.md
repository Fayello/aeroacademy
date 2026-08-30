# Module 4 — MongoDB: Document Databases, Aggregation, Security

## What You'll Actually Do

Install MongoDB, model data with documents, build aggregation pipelines, and lock down access with authentication and network controls. You'll work with real data and see why document databases fit certain workloads.

## Content

### Installation

On Ubuntu 22.04:

```bash
# Import the public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Add the repo
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod
```

Verify:

```bash
mongosh --eval "db.version()"
```

### Data Modeling

MongoDB stores BSON (binary JSON) documents in collections. No rigid schema, but you should still design intentional structures:

```javascript
// Users collection
db.users.insertOne({
  name: "Maria Santos",
  email: "maria@example.com",
  role: "instructor",
  profile: {
    specialization: "network-security",
    certifications: ["CISSP", "CEH"],
    years_experience: 12
  },
  created_at: new Date()
});

// Lab submissions — embedded under users for fast reads
db.users.updateOne(
  { email: "maria@example.com" },
  {
    $push: {
      submissions: {
        lab_id: "net-sec-lab-03",
        score: 97,
        completed_at: new Date(),
        feedback: "Excellent use of firewall rules"
      }
    }
  }
);
```

**Embedding vs referencing**: Embed when data is read together. Reference when the sub-data is large or queried independently.

### Aggregation Pipelines

The aggregation framework is MongoDB's replacement for SQL GROUP BY, JOIN, and subqueries. It's a pipeline of stages:

```javascript
// Average score per lab, only labs with avg >= 85
db.users.aggregate([
  // Stage 1: Deconstruct the submissions array
  { $unwind: "$submissions" },

  // Stage 2: Group by lab_id and compute average
  { $group: {
      _id: "$submissions.lab_id",
      avg_score: { $avg: "$submissions.score" },
      total_submissions: { $sum: 1 }
  }},

  // Stage 3: Filter groups
  { $match: { avg_score: { $gte: 85 } } },

  // Stage 4: Sort by average descending
  { $sort: { avg_score: -1 } },

  // Stage 5: Format output
  { $project: {
      _id: 0,
      lab_id: "$_id",
      avg_score: { $round: ["$avg_score", 1] },
      total_submissions: 1
  }}
]);
```

A more complex pipeline — find users who completed more than 3 labs:

```javascript
db.users.aggregate([
  { $project: {
      name: 1,
      email: 1,
      lab_count: { $size: { $ifNull: ["$submissions", []] } }
  }},
  { $match: { lab_count: { $gt: 3 } } },
  { $sort: { lab_count: -1 } }
]);
```

### Indexes

Without indexes, MongoDB scans every document. Create indexes for your query patterns:

```javascript
// Single field
db.users.createIndex({ email: 1 }, { unique: true });

// Compound index for common queries
db.users.createIndex({ role: 1, created_at: -1 });

// Check if an index is being used
db.users.find({ role: "student" }).explain("executionStats");
```

### Authentication and Users

MongoDB disables auth by default. Enable it:

Edit `/etc/mongod.conf`:

```yaml
security:
  authorization: enabled
```

Restart mongod, then create admin and app users:

```javascript
// Connect as admin
use admin

db.createUser({
  user: "admin",
  pwd: "securepassword",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
});

// Create app user for a specific database
use aeroacademy

db.createUser({
  user: "appuser",
  pwd: "apppassword",
  roles: [
    { role: "readWrite", db: "aeroacademy" }
  ]
});
```

Connect with auth:

```bash
mongosh -u appuser -p apppassword --authenticationDatabase aeroacademy
```

### Network Security

Bind to localhost or specific interface in `mongod.conf`:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1  # Only local access
```

For remote access, use SSH tunneling instead of exposing the port. If you must expose it, restrict with firewall rules:

```bash
# UFW example
sudo ufw allow from 10.0.0.0/24 to any port 27017 proto tcp
```

### Role-Based Access Control

MongoDB has granular built-in roles:

```javascript
// Read-only user for reporting
db.createUser({
  user: "reporter",
  pwd: "reporterpwd",
  roles: [
    { role: "read", db: "aeroacademy" }
  ]
});

// User that can manage indexes but not read data
db.createUser({
  user: "dba",
  pwd: "dbapwd",
  roles: [
    { role: "dbAdmin", db: "aeroacademy" }
  ]
});
```

Check current user privileges:

```javascript
db.getUsers()
db.runCommand({ connectionStatus: 1 })
```

## Assessment

**Lab task — 50 minutes**

1. Install MongoDB 7.0 on Ubuntu.
2. Create a database `training` with a `courses` collection and a `student_progress` collection. Insert at least 20 documents across both.
3. Build an aggregation pipeline that computes: average score per course, minimum score, maximum score, and number of students.
4. Create an index on `student_progress.course_id` and verify with `explain()` that queries use it.
5. Enable authentication, create three users: admin (userAdminAnyDatabase), appuser (readWrite), and reporter (read). Verify each can only do what their role allows.
6. Lock down the network port to localhost only and confirm remote connections are refused.

**Grading criteria:**
- MongoDB installed and running (10 points)
- Data model is reasonable with at least 20 documents (15 points)
- Aggregation pipeline returns correct computed results (25 points)
- Index created and explain() confirms usage (15 points)
- Three users created with correct role restrictions (25 points)
- Network binding verified (10 points)

## Evidence

- Aggregation pipeline code and output
- `explain("executionStats")` showing index usage
- Login attempts with each user showing allowed and denied operations
- `netstat` or `ss` output showing MongoDB bound to 127.0.0.1
