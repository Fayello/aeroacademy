# Module 10 — Performance: Optimization, Caching, and Monitoring

## What You'll Actually Do

Make a Node.js application fast and keep it fast. You'll profile to find bottlenecks, cache aggressively, optimize database queries, and set up monitoring so you know when things slow down. Performance isn't guesswork — it's measurement.

---

## Profiling Before Optimizing

Don't guess where the bottleneck is. Measure it.

```javascript
// src/middleware/timing.js
function timingMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    if (durationMs > 1000) {
      console.warn(`SLOW REQUEST: ${req.method} ${req.originalUrl} ${durationMs.toFixed(0)}ms`);
    }

    res.setHeader("X-Response-Time", `${durationMs.toFixed(0)}ms`);
  });

  next();
}

app.use(timingMiddleware);
```

### Node.js Profiling

```bash
# Find CPU bottlenecks
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Memory profiling
node --inspect app.js
# Open chrome://inspect in Chrome
```

### Clinic.js for comprehensive profiling

```bash
npx clinic doctor -- node src/server.js
npx clinic flame -- node src/server.js
npx clinic bubbleprof -- node src/server.js
```

---

## Caching Strategies

### In-memory cache for hot data

```javascript
// src/services/cache.js
class MemoryCache {
  constructor(ttlMs = 60000) {
    this.store = new Map();
    this.ttl = ttlMs;
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.ttl),
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = MemoryCache;
```

```javascript
// Usage in route
const cache = new MemoryCache(30000); // 30 second default TTL

router.get("/", async (req, res) => {
  const cacheKey = `courses:${JSON.stringify(req.query)}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const courses = await Course.find(req.query);
  cache.set(cacheKey, courses);
  res.json(courses);
});

// Invalidate on write
router.post("/", async (req, res) => {
  const course = await Course.create(req.body);
  cache.clear(); // Or be more targeted
  res.status(201).json(course);
});
```

### Redis cache for distributed systems

```javascript
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL);

async function getCached(key, ttlSeconds, fetchFn) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFn();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}

// Usage
router.get("/popular", async (req, res) => {
  const courses = await getCached("popular-courses", 300, () =>
    Course.find({}).sort({ enrollmentCount: -1 }).limit(10)
  );
  res.json(courses);
});
```

---

## Database Query Optimization

### N+1 Query Problem

```javascript
// BAD — N+1 queries
async function getCoursesWithInstructors() {
  const courses = await Course.find(); // 1 query
  for (const course of courses) {
    course.instructor = await User.findById(course.instructorId); // N queries
  }
  return courses;
}

// GOOD — single query with join
async function getCoursesWithInstructors() {
  return Course.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "instructorId",
        foreignField: "_id",
        as: "instructor",
      },
    },
    { $unwind: "$instructor" },
  ]);
}

// GOOD — PostgreSQL with JOIN
async function getCoursesWithInstructors() {
  const result = await db.query(`
    SELECT c.*, u.name as instructor_name, u.email as instructor_email
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    ORDER BY c.created_at DESC
  `);
  return result.rows;
}
```

### Pagination

```javascript
// Cursor-based pagination (better for large datasets)
router.get("/", async (req, res) => {
  const { cursor, limit = 20 } = req.query;
  const query = {};

  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  const courses = await Course.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit) + 1); // Fetch one extra to detect "has more"

  const hasMore = courses.length > Number(limit);
  const data = hasMore ? courses.slice(0, -1) : courses;
  const nextCursor = hasMore
    ? data[data.length - 1].createdAt.toISOString()
    : null;

  res.json({
    data,
    pagination: {
      nextCursor,
      hasMore,
    },
  });
});
```

---

## Connection Pooling

```javascript
// PostgreSQL — configure pool size
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,           // max connections
  min: 5,            // keep alive connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Monitor pool usage
pool.on("connect", () => console.log("New client connected"));
pool.on("remove", () => console.log("Client removed"));

// Check pool stats
function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}
```

---

## Compression and Streaming

```javascript
const compression = require("compression");
const zlib = require("zlib");

// Enable gzip compression
app.use(compression({
  threshold: 1024, // Only compress responses > 1KB
  level: 6,        // Balance between speed and compression
}));

// Stream large responses
router.get("/export", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=courses.json");

  const stream = Course.find().cursor();
  res.write("[");
  let first = true;

  stream.on("data", (doc) => {
    if (!first) res.write(",");
    res.write(JSON.stringify(doc));
    first = false;
  });

  stream.on("end", () => {
    res.write("]");
    res.end();
  });

  stream.on("error", (err) => {
    res.status(500).end();
  });
});
```

---

## Monitoring and Alerting

```javascript
// src/middleware/metrics.js
const metrics = {
  requests: { total: 0, byStatus: {}, byRoute: {} },
  errors: { total: 0, byType: {} },
  responseTime: { p50: 0, p95: 0, p99: 0 },
};

function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.originalUrl;
    const status = res.statusCode;

    // Update counters
    metrics.requests.total++;
    metrics.requests.byStatus[status] = (metrics.requests.byStatus[status] || 0) + 1;
    metrics.requests.byRoute[route] = (metrics.requests.byRoute[route] || 0) + 1;

    // Log errors
    if (status >= 500) {
      metrics.errors.total++;
      console.error(`ERROR: ${req.method} ${route} ${status} ${duration}ms`);
    }
  });

  next();
}

// Expose metrics endpoint
app.get("/metrics", (req, res) => {
  res.json(metrics);
});
```

### Structured logging

```javascript
const pino = require("pino");
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Usage
logger.info({ userId: "123", action: "login" }, "User logged in");
logger.error({ err, requestId: req.id }, "Request failed");
```

---

## Assessment

**Lab Task: Optimize and Monitor a Slow API (60 minutes)**

Given a deliberately slow API, optimize it:

1. **Profile:** Add timing middleware and identify the 3 slowest endpoints.
2. **Cache:** Implement in-memory caching for the most frequently accessed endpoint. Show before/after response times.
3. **Query optimization:** Fix at least one N+1 query problem. Use `explain` (PostgreSQL) or `.explain()` (MongoDB) to verify query plans.
4. **Compression:** Enable gzip compression and verify responses are compressed.
5. **Monitoring:** Add a `/metrics` endpoint that reports request counts, error rates, and response times.
6. **Logging:** Add structured logging with pino to at least 3 endpoints.

**Deliverables:** Optimized code with timing middleware, cache implementation, query fixes, and monitoring endpoints. A brief report showing before/after performance numbers.

**Grading:**
- Timing middleware identifies bottlenecks: 20%
- Caching improves response time: 25%
- Query optimization is correct: 25%
- Monitoring and logging work: 15%
- Before/after data is documented: 15%

---

## Evidence

Save all performance-related files. Include before/after timing data for optimized endpoints. Include the `/metrics` output. Document the specific optimizations you made and their impact.
