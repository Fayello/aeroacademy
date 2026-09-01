# Module 4 — Database Integration

Every application that stores data needs a database layer. This module covers how to integrate MongoDB with Mongoose and PostgreSQL with Prisma into a Node.js application. We will look at connection management, schema design, querying patterns, and how to build a data access layer that your application code interacts with cleanly.

## Why the Database Layer Matters

The database is where your application's data lives. Get the schema wrong and you will fight your data model for years. Get the connection wrong and your production server will crash under load. Get the queries wrong and your API will be slow regardless of everything else you optimize.

The database layer is the bridge between your application logic and persistent storage. A good database layer abstracts the storage mechanism, provides a clean API for the rest of your code, handles errors consistently, and makes it possible to test your application without a live database.

Choosing between MongoDB and PostgreSQL is one of the first architectural decisions you will make. MongoDB is a document database that stores data as JSON-like documents. It is flexible, schemaless, and scales horizontally with ease. PostgreSQL is a relational database that stores data in tables with strict schemas. It is powerful, supports complex queries, and guarantees ACID transactions. Neither is universally better — the right choice depends on your data model, query patterns, and scalability requirements.

MongoDB works well when your data is naturally hierarchical (like blog posts with nested comments), when your schema evolves frequently, when you need horizontal scaling across multiple servers, or when you are building a prototype and want to iterate quickly without migration overhead. PostgreSQL works well when your data has complex relationships (like a social network with users, posts, comments, and likes), when you need complex queries (like aggregations, joins, and window functions), when you need strict data consistency (like financial transactions), or when your data model is stable and well-defined.

Most applications do not need to choose exclusively. You can use PostgreSQL for your primary data store (users, orders, transactions) and MongoDB for flexible data (logs, analytics, user-generated content). This hybrid approach gives you the strengths of both databases where they matter most.

The repository pattern is the key to building a maintainable database layer. A repository encapsulates all database operations for a specific entity (like users or posts). The rest of your application never calls the database directly — it calls repository methods. This separation means you can change the database implementation without changing the business logic. If you migrate from MongoDB to PostgreSQL, you rewrite the repositories but keep the services and controllers unchanged.

## MongoDB with Mongoose

MongoDB is a document database. Data is stored as JSON-like documents in collections. Mongoose is an Object Data Modeling (ODM) library that adds schema validation, type casting, and business logic hooks to MongoDB.

### Connection

```javascript
const mongoose = require("mongoose");

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log("Connected to MongoDB");

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}
```

The connection options matter in production. `maxPoolSize` limits how many connections the driver maintains. `serverSelectionTimeoutMS` controls how long the driver waits to find a server before throwing an error. `socketTimeoutMS` closes idle connections to free resources.

### Schema Design

A good Mongoose schema does more than define fields. It validates data, creates indexes, adds helper methods, and enforces business rules. Think of the schema as the first line of defense against invalid data. The database should reject malformed data before it corrupts your application state. Well-designed schemas catch errors early, provide clear error messages, and enforce data integrity at the storage layer rather than relying on application code.

```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false // Exclude from queries by default
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "moderator"],
      message: "{VALUE} is not a valid role"
    },
    default: "user"
  },
  profile: {
    avatar: String,
    bio: { type: String, maxlength: 500 },
    website: String
  },
  lastLoginAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for common queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ "profile.bio": "text", name: "text" });

// Pre-save hook — hash password
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method — check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method — find active users by role
userSchema.statics.findActiveByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Virtual — full name
userSchema.virtual("fullName").get(function() {
  return `${this.name}`;
});

const User = mongoose.model("User", userSchema);

module.exports = User;
```

### Querying with Mongoose

```javascript
// Basic queries
const user = await User.findById(userId);
const users = await User.find({ role: "admin", isActive: true });
const user = await User.findOne({ email: "alice@example.com" });

// Projections — select only specific fields
const users = await User.find().select("name email role");
const users = await User.find().select("-password -__v");

// Sorting
const recentUsers = await User.find().sort({ createdAt: -1 });
const sortedByName = await User.find().sort({ name: 1 });

// Pagination
const page = 2;
const limit = 20;
const users = await User.find()
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 });

// Chaining queries — they are lazy until awaited
const query = User.find({ isActive: true });
if (role) query.where("role").equals(role);
if (search) query.where("name").regex(new RegExp(search, "i"));
const users = await query.skip(skip).limit(limit);

// Aggregation
const stats = await User.aggregate([
  { $match: { isActive: true } },
  { $group: {
    _id: "$role",
    count: { $sum: 1 },
    avgAge: { $avg: "$age" }
  }},
  { $sort: { count: -1 } }
]);

// Population — reference documents
const posts = await Post.find()
  .populate("author", "name email")
  .populate("comments.author", "name avatar");
```

### Common Mongoose Patterns

```javascript
// Soft delete — never actually remove data
userSchema.pre("find", function() {
  this.where({ deletedAt: null });
});

userSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Unique validation on update
async function updateEmail(userId, newEmail) {
  const existing = await User.findOne({
    email: newEmail,
    _id: { $ne: userId }
  });
  if (existing) {
    throw new Error("Email already in use");
  }
  return User.findByIdAndUpdate(userId, { email: newEmail }, { new: true });
}
```

## PostgreSQL with Prisma

Prisma is an ORM for SQL databases. Unlike Mongoose, which is schemaless (you define schemas in code but MongoDB does not enforce them), Prisma uses a schema file that the database actually enforces.

### Project Setup

```bash
npm install prisma @prisma/client
npx prisma init
```

This creates `prisma/schema.prisma` and a `.env` file.

### Schema Definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([role])
  @@index([email])
}

model Post {
  id          String   @id @default(uuid())
  title       String
  content     String?
  published   Boolean  @default(false)
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String
  tags        Tag[]
  comments    Comment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([authorId])
  @@index([published])
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  authorId  String
  createdAt DateTime @default(now())

  @@index([postId])
}

model Profile {
  id     String @id @default(uuid())
  bio    String?
  avatar String?
  user   User   @relation(fields: [userId], references: [id], Unique)
  userId String

  @@unique([userId])
}

model Tag {
  id    String @id @default(uuid())
  name  String @unique
  posts Post[]

  @@index([name])
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Migrations

Prisma manages database migrations:

```bash
# Create a migration
npx prisma migrate dev --name add-user-role

# Apply migrations in production
npx prisma migrate deploy

# Reset the database (development only)
npx prisma migrate reset

# Generate the Prisma Client
npx prisma generate
```

Migrations are version-controlled SQL files. Each migration describes the changes to make to the database schema. In production, you use `migrate deploy` to apply pending migrations.

Understanding the difference between `migrate dev` and `migrate deploy` is important. `migrate dev` is for development — it creates a new migration file, applies it to your development database, and regenerates the Prisma Client. It also handles conflicts and allows you to reset the database if needed. `migrate deploy` is for production — it applies pending migrations without creating new ones. It assumes the database is in a known state and only applies migrations that have not been applied yet.

A common mistake is running `migrate dev` in production. This command can reset the database, drop tables, and create destructive changes. Always use `migrate deploy` in production. Another mistake is making manual changes to the database schema without creating a migration. If you add a column directly in PostgreSQL, Prisma will not know about it and will create a migration that conflicts with your manual changes. Always use Prisma migrations for schema changes.

Migration files are plain SQL, so you can read them to understand exactly what changes will be made. Review migration files before applying them, especially in production. If a migration drops a table or column, make sure you have a backup. If a migration adds an index on a large table, be aware that it might lock the table for a few seconds.

### Prisma Client Queries

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Basic CRUD
const user = await prisma.user.create({
  data: {
    email: "alice@example.com",
    name: "Alice",
    profile: {
      create: { bio: "Software developer" }
    }
  }
});

const users = await prisma.user.findMany({
  where: {
    role: "USER",
    posts: {
      some: { published: true }
    }
  },
  include: {
    _count: { select: { posts: true } }
  },
  orderBy: { createdAt: "desc" },
  take: 20
});

// Transactions
const result = await prisma.$transaction(async (tx) => {
  const post = await tx.post.create({
    data: { title: "New Post", authorId: user.id }
  });

  await tx.tag.createMany({
    data: [
      { name: "javascript", postId: post.id },
      { name: "tutorial", postId: post.id }
    ]
  });

  return post;
});

// Raw queries (when Prisma's API is not enough)
const stats = await prisma.$queryRaw`
  SELECT role, COUNT(*) as count
  FROM "User"
  GROUP BY role
`;
```

### Prisma Patterns

```javascript
// Reusable query builder
async function findPosts(filters = {}) {
  const where = {};

  if (filters.authorId) where.authorId = filters.authorId;
  if (filters.published !== undefined) where.published = filters.published;
  if (filters.tag) where.tags = { some: { name: filters.tag } };

  return prisma.post.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, email: true } },
      tags: true,
      _count: { select: { comments: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

// Select only what you need
const lightweightPosts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    published: true,
    author: { select: { name: true } }
  }
});
```

## Connection Pooling

Connection pooling is the practice of maintaining a cache of database connections that can be reused. Opening a new connection for every request is expensive — it involves network latency, authentication, and TLS negotiation.

The cost of creating a new database connection varies depending on the distance between your application and the database, the authentication mechanism, and whether TLS is used. For a local database, creating a connection might take 1-5ms. For a remote database across a data center, it might take 50-100ms. For a cloud database across regions, it might take 100-200ms. If your application handles 1000 requests per second and each request creates a new connection, you are spending 1-200 seconds per second just on connection creation.

Connection pooling solves this by maintaining a pool of open connections. When your application needs a database connection, it borrows one from the pool. When the operation completes, the connection is returned to the pool. The pool manages the lifecycle of connections — creating new ones when demand increases, closing idle ones when demand decreases, and handling connection failures gracefully.

The pool size should match your application's concurrency level. Too few connections and requests queue up waiting for a connection. Too many connections and the database becomes overloaded. A good starting point is `(number of CPU cores) * 2 + (number of disk spindles)`. For most web applications running on a 4-core server, a pool size of 8-12 connections is sufficient.

### How Connection Pooling Works

When your application starts, the database driver creates a pool of connections. When your code needs to interact with the database, it borrows a connection from the pool, uses it, and returns it. The pool manages the lifecycle of connections — creating new ones when demand increases, closing idle ones when demand decreases.

### MongoDB Connection Pooling

```javascript
// Mongoose connection options
await mongoose.connect(uri, {
  maxPoolSize: 10,        // Maximum connections in pool
  minPoolSize: 2,         // Minimum connections maintained
  maxIdleTimeMS: 30000,   // Close connections idle for 30s
  waitQueueTimeoutMS: 5000 // Wait 5s for a connection
});
```

In production, `maxPoolSize` should match your expected concurrent database operations. A good rule of thumb: `maxPoolSize = (number of CPU cores) * 2 + (number of disk spindles)`. For most web applications, 10-20 connections is sufficient.

### Prisma Connection Pooling

```javascript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=10"
    }
  }
});
```

Prisma uses pg-bouncer or PostgreSQL's built-in connection pooling depending on your setup. For serverless environments (AWS Lambda, Vercel), you need PgBouncer or Prisma Accelerate to handle connection limits.

### Connection Pool Monitoring

```javascript
// Monitor pool usage
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

// In Express, log pool stats periodically
setInterval(() => {
  const pool = mongoose.connection.db.s.pool;
  console.log(`Pool stats - Total: ${pool.totalConnectionCount}, 
    Available: ${pool.availableConnectionCount}, 
    Active: ${pool.checkedOutCount}`);
}, 30000);
```

## Real Scenario: Setting Up a Database Layer

Let us build a complete database layer for a blog application. This includes models, connection management, and a service that handles all database operations.

### Connection Manager

```javascript
// src/db/connection.js
const { PrismaClient } = require("@prisma/client");

let prisma;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"]
    });
  }
  return prisma;
}

async function connectDB() {
  const client = getPrisma();
  try {
    await client.$connect();
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

async function disconnectDB() {
  const client = getPrisma();
  await client.$disconnect();
  console.log("Database disconnected");
}

module.exports = { getPrisma, connectDB, disconnectDB };
```

### User Repository

```javascript
// src/repositories/userRepository.js
const { getPrisma } = require("../db/connection");

class UserRepository {
  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        _count: { select: { posts: true } }
      }
    });
  }

  async findByEmail(email) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true
      }
    });
  }

  async create(data) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        profile: data.bio ? { create: { bio: data.bio } } : undefined
      },
      include: { profile: true }
    });
  }

  async update(id, data) {
    return this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role
      },
      include: { profile: true }
    });
  }

  async list({ role, isActive, page = 1, limit = 20 }) {
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: { select: { avatar: true } },
          _count: { select: { posts: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async delete(id) {
    return this.prisma.user.delete({ where: { id } });
  }
}

module.exports = new UserRepository();
```

### Post Repository

```javascript
// src/repositories/postRepository.js
const { getPrisma } = require("../db/connection");

class PostRepository {
  constructor() {
    this.prisma = getPrisma();
  }

  async findById(id) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags: true,
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });
  }

  async create(data) {
    return this.prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        published: data.published || false,
        authorId: data.authorId,
        tags: data.tags?.length ? {
          connectOrCreate: data.tags.map(tag => ({
            where: { name: tag },
            create: { name: tag }
          }))
        } : undefined
      },
      include: {
        author: { select: { id: true, name: true } },
        tags: true
      }
    });
  }

  async update(id, data) {
    return this.prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        published: data.published,
        tags: data.tags ? {
          set: [],
          connectOrCreate: data.tags.map(tag => ({
            where: { name: tag },
            create: { name: tag }
          }))
        } : undefined
      },
      include: {
        author: { select: { id: true, name: true } },
        tags: true
      }
    });
  }

  async list({ authorId, published, tag, page = 1, limit = 20 }) {
    const where = {};
    if (authorId) where.authorId = authorId;
    if (published !== undefined) where.published = published;
    if (tag) where.tags = { some: { name: tag } };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          tags: true,
          _count: { select: { comments: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.post.count({ where })
    ]);

    return {
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async delete(id) {
    return this.prisma.post.delete({ where: { id } });
  }

  async addComment(postId, authorId, content) {
    return this.prisma.comment.create({
      data: { postId, authorId, content },
      include: { author: { select: { id: true, name: true } } }
    });
  }
}

module.exports = new PostRepository();
```

### Database Seeding

```javascript
// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const password = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      name: "Alice",
      password,
      role: "ADMIN",
      profile: { create: { bio: "Full-stack developer" } }
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      name: "Bob",
      password,
      role: "USER"
    }
  });

  // Create posts with tags
  await prisma.post.create({
    data: {
      title: "Getting Started with Prisma",
      content: "Prisma is a modern ORM for Node.js...",
      published: true,
      authorId: alice.id,
      tags: {
        connectOrCreate: [
          { where: { name: "prisma" }, create: { name: "prisma" } },
          { where: { name: "database" }, create: { name: "database" } }
        ]
      }
    }
  });

  console.log("Seed data created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Assessment

### Lab Task: Database Layer Implementation

**Time Limit: 60 minutes**

Build a database layer for a simple e-commerce application. You must implement:

1. **Schema Design:** Define models for Product, Category, Order, and OrderItem.
2. **Connection Management:** Create a connection manager with proper error handling.
3. **Repository Pattern:** Implement repositories for Product and Order.
4. **Queries:** Implement listing with filtering, pagination, and sorting.
5. **Seed Data:** Create a seed script that populates the database with at least 10 products across 3 categories.

**Requirements:**
- Use either Mongoose or Prisma (your choice)
- Include proper indexes for common queries
- Handle connection errors gracefully
- Repositories must use consistent error handling
- Pagination must return total count and page information

### Grading Criteria

- **Schema Design (25 points):** Models are well-structured with proper types, relationships, and validation. Indexes are defined for common queries.
- **Connection Management (15 points):** Proper connection setup with error handling, disconnection, and pool configuration.
- **Repository Pattern (30 points):** Clean separation of concerns, consistent API across repositories, proper use of ORM features.
- **Query Implementation (20 points):** Filtering, pagination, and sorting work correctly. Queries are efficient.
- **Seed Data (10 points):** Seed script creates realistic data and handles idempotency (can run multiple times).

### Evidence

After completing this module, you should be able to:

1. Set up and configure both MongoDB (Mongoose) and PostgreSQL (Prisma) in a Node.js project.
2. Design database schemas with proper relationships, validation, and indexes.
3. Implement connection pooling and manage connection lifecycle.
4. Build a repository layer that abstracts database operations from business logic.
5. Write efficient queries with filtering, pagination, and sorting.
6. Create seed scripts for development and testing.
7. Run database migrations in a controlled manner.
