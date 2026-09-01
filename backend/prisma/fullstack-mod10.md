# Module 10 — Performance

A slow application is a broken application. Users leave after 3 seconds. Search engines penalize slow pages. Every millisecond of latency costs revenue. This module covers code splitting, caching strategies, database optimization, and how to measure and improve application performance.

## Why Performance Matters

Performance is not an optimization you do after launch. It is a fundamental quality of your application. A page that takes 5 seconds to load loses 90% of mobile users. A 100ms delay in response time can reduce conversions by 7%.

The key to performance is measurement. You cannot improve what you do not measure. Before optimizing anything, you need to know where the time is actually spent. Too many developers guess at performance problems and optimize the wrong things. Measure first, then fix.

Performance falls into three categories: how fast the page loads (network), how fast the page becomes interactive (JavaScript execution), and how fast the page responds to user input (rendering). Each category has different tools and different solutions.

Network performance is about how much data you send and how quickly it arrives. Reducing bundle size, compressing responses, using a CDN, and enabling HTTP/2 all improve network performance. JavaScript execution performance is about how efficiently the browser runs your code. Minimizing main thread work, breaking up long tasks, and using Web Workers for heavy computation all improve execution performance. Rendering performance is about how quickly the browser paints pixels on the screen. Minimizing DOM mutations, avoiding layout thrashing, and using CSS containment all improve rendering performance.

The relationship between performance and business metrics is well-documented. Amazon found that every 100ms of latency cost them 1% in sales. Google found that a 0.5-second delay in search results reduced traffic by 20%. Pinterest found that reducing wait times by 40% increased signups by 15%. These are not abstract numbers — they represent real revenue and real user growth.

Performance optimization is an ongoing process, not a one-time task. As your application grows, new performance bottlenecks emerge. New features add code to the bundle. New queries add load to the database. New traffic patterns expose scaling limits. You need to monitor performance continuously and address regressions before they affect users.

## Measuring Performance

### Frontend Performance Metrics

Core Web Vitals are the metrics that Google uses to rank pages in search results. They measure real user experience, not synthetic benchmarks.

```javascript
// Core Web Vitals — the metrics that matter
// LCP (Largest Contentful Paint) — how fast the main content loads
// FID (First Input Delay) — how fast the page responds to interaction
// CLS (Cumulative Layout Shift) — how much the page jumps around

// Measure in your application
function reportWebVitals() {
  if ("performance" in window) {
    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log("LCP:", lastEntry.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });

    // FID
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log("FID:", entry.processingStart - entry.startTime);
      }
    }).observe({ type: "first-input", buffered: true });

    // CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log("CLS:", clsValue);
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  }
}
```

Good scores: LCP under 2.5 seconds, FID under 100ms, CLS under 0.1. If your scores are worse than these, you have work to do.

### Backend Performance Monitoring

```javascript
// Response time middleware
function responseTime(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6; // nanoseconds to milliseconds

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.originalUrl} ${duration}ms`);
    }

    // Send to monitoring service
    metrics.recordResponseTime(req.method, req.route?.path, duration, res.statusCode);
  });

  next();
}

app.use(responseTime);
```

Track response times for every endpoint. Set thresholds for slow requests (typically 500ms for API endpoints, 1000ms for complex queries). When a request exceeds the threshold, log it with enough context to investigate: the endpoint, the query parameters, the user, and the database query time.

## Code Splitting

Code splitting breaks your JavaScript bundle into smaller pieces that load on demand. Users download only the code they need for the current page. A dashboard user does not need the settings page code. A settings user does not need the analytics charts library.

Without code splitting, your entire application is one bundle. With code splitting, each route loads only its own code, reducing the initial download from hundreds of kilobytes to tens of kilobytes.

### React.lazy and Suspense

```jsx
import React, { Suspense } from "react";

// Lazy load route components
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Analytics = React.lazy(() => import("./pages/Analytics"));

function App() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

React.lazy takes a function that returns a dynamic import. When the component is first rendered, React loads the chunk. Suspense shows the fallback while the chunk loads. This is transparent to the rest of your code — the lazy-loaded component works exactly like a regular component.

### Lazy Loading Components

Not all code splitting is route-based. Some components are expensive to load and should only load when needed:

```jsx
// Lazy load heavy components
const HeavyChart = React.lazy(() => import("./components/HeavyChart"));
const DataTable = React.lazy(() => import("./components/DataTable"));

function AnalyticsPage({ showChart }) {
  return (
    <div>
      <h1>Analytics</h1>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
      <Suspense fallback={<TableSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  );
}
```

A chart library might be 200KB. If the user never opens the chart tab, they should never download that code. Conditional lazy loading with Suspense handles this automatically.

### Route-Based Splitting

```jsx
// Create a chunk per route
const routes = {
  "/dashboard": React.lazy(() => import("./pages/Dashboard")),
  "/settings": React.lazy(() => import("./pages/Settings")),
  "/analytics": React.lazy(() => import("./pages/Analytics")),
  "/admin": React.lazy(() => import("./pages/Admin"))
};

function AppRouter() {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handleNav = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handleNav);
    return () => window.removeEventListener("popstate", handleNav);
  }, []);

  const Component = routes[currentPath] || NotFound;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  );
}
```

### Vite Configuration for Code Splitting

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown"],
          charts: ["recharts", "d3"]
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
});
```

Manual chunks group frequently used libraries into separate files. The vendor chunk rarely changes, so the browser caches it for a long time. When you update your application code, only the application chunk changes — users do not re-download React.

## Caching Strategies

Caching stores frequently accessed data in a fast-to-access location. Different data needs different caching strategies. Static assets can be cached for years. User-specific data should not be cached at all. API responses fall somewhere in between.

### Browser Caching

```javascript
// Set cache headers for static assets
app.use(express.static("public", {
  maxAge: "1y", // Cache for 1 year
  immutable: true
}));

// API response caching
app.get("/api/products", async (req, res) => {
  const cacheKey = `products:${JSON.stringify(req.query)}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    res.set("X-Cache", "HIT");
    return res.json(JSON.parse(cached));
  }

  // Cache miss — query database
  const products = await Product.find(req.query);
  
  // Store in cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(products));
  
  res.set("X-Cache", "MISS");
  res.json(products);
});
```

The `immutable` directive tells the browser that the file will never change at the same URL. When you build with Vite, filenames include a content hash (like `app.a1b2c3.js`). If the content changes, the filename changes. This means you can set aggressive cache headers without worrying about stale content.

### HTTP Caching Headers

```javascript
// ETag-based caching
app.get("/api/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  const etag = `"${post.updatedAt.getTime()}"`;
  
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).send();
  }

  res.set("ETag", etag);
  res.set("Cache-Control", "private, max-age=0, must-revalidate");
  res.json(post);
});

// Cache-Control directives
// public — can be cached by any cache (CDN, browser)
// private — can only be cached by the user's browser
// no-cache — must revalidate with server before using cached version
// no-store — never cache
// max-age — how long to cache (in seconds)
```

ETag caching works by sending a hash of the response. The client sends the hash back with its next request. If the hash matches, the server returns 304 (not modified) with no body. This saves bandwidth without sacrificing freshness.

### Redis Caching Layer

```javascript
class CacheService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.defaultTTL = 300; // 5 minutes
  }

  async get(key) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, value, ttl = this.defaultTTL) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key) {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache-aside pattern
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    let data = await this.get(key);
    if (data) return data;

    data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }
}

const cache = new CacheService();

// Usage
app.get("/api/dashboard", async (req, res) => {
  const data = await cache.getOrSet(
    "dashboard:main",
    async () => {
      const [users, posts, revenue] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
      ]);
      return { users, posts, revenue: revenue[0]?.total || 0 };
    },
    60 // Cache for 1 minute
  );

  res.json(data);
});
```

The cache-aside pattern is the most common caching strategy. Check the cache first. If the data is there, return it. If not, fetch it from the database, store it in the cache, and return it. The `getOrSet` method encapsulates this pattern so every endpoint uses it consistently.

Cache invalidation is the hard part. When a user creates a post, you need to invalidate the post list cache. When a user updates their profile, you need to invalidate the user cache. Use pattern-based invalidation to clear related caches:

```javascript
// When a post is created
await cache.invalidatePattern("posts:*");
await cache.invalidatePattern("dashboard:*");

// When a user is updated
await cache.invalidatePattern(`user:${userId}:*`);
```

## Database Optimization

Slow queries are the most common cause of backend performance problems. A query that takes 100ms with an index takes 10 seconds without one. At scale, this difference determines whether your application handles 100 requests per second or 10.

Database optimization starts with understanding how your database executes queries. Every relational database has an EXPLAIN command that shows the query execution plan. The plan tells you which indexes are being used, how many rows are scanned, and what operations are performed. Before optimizing any query, run EXPLAIN to understand the current behavior. You might discover that a missing index is causing a full table scan, or that a query is fetching more data than necessary, or that a join is not using the expected index.

The most impactful optimization is usually adding the right index. An index is a data structure that allows the database to find rows quickly without scanning the entire table. Without an index, a query on a million-row table might scan all million rows. With the right index, the same query might scan only 10 rows. The trade-off is that indexes slow down writes (because the index must be updated) and consume disk space. Choose indexes based on your query patterns: index the columns that appear in WHERE clauses, JOIN conditions, and ORDER BY clauses.

Query optimization is the second most impactful improvement. Select only the columns you need instead of selecting all columns. Use LIMIT to restrict the number of rows returned. Avoid N+1 queries by using JOINs or batch loading. Use aggregation queries instead of fetching all rows and computing in application code. These changes can reduce query time from seconds to milliseconds.

Connection pooling is the third optimization. Establishing a new database connection takes 50-200ms. Connection pooling keeps a cache of open connections that can be reused. When your application needs to query the database, it borrows a connection from the pool, uses it, and returns it. This eliminates the connection overhead for every request. Most database drivers have built-in connection pooling — you just need to configure the pool size.

### Indexing

```javascript
// Without index — full table scan (slow)
const users = await User.find({ email: "alice@example.com" });

// With index — index lookup (fast)
userSchema.index({ email: 1 });

// Compound indexes for common query patterns
userSchema.index({ role: 1, isActive: 1, createdAt: -1 });

// Text index for search
postSchema.index({ title: "text", content: "text" });

// Check index usage
const explanation = await User.find({ email: "alice@example.com" }).explain("executionStats");
console.log(explanation.queryPlanner.winningPlan);
```

The `explain()` method shows you how MongoDB executes the query. Look for `"stage": "IXSCAN"` (index scan) — this means the index is being used. If you see `"stage": "COLLSCAN"` (collection scan), the query is scanning every document, which means you need an index.

Compound indexes follow the ESR rule: Equality fields first, Sort fields second, Range fields third. For a query that filters by `role`, sorts by `createdAt`, and ranges on `dateJoined`, the index should be `{ role: 1, createdAt: -1, dateJoined: 1 }`.

### Query Optimization

```javascript
// Bad — fetches all fields
const users = await User.find({ role: "admin" });

// Good — only fetches needed fields
const users = await User.find({ role: "admin" })
  .select("name email createdAt")
  .lean();

// Bad — N+1 query problem
const posts = await Post.find();
for (const post of posts) {
  post.author = await User.findById(post.authorId); // N queries
}

// Good — populate in one query
const posts = await Post.find().populate("author", "name email");

// Good — aggregate pipeline
const stats = await Post.aggregate([
  { $match: { published: true } },
  { $lookup: {
    from: "users",
    localField: "authorId",
    foreignField: "_id",
    as: "author"
  }},
  { $unwind: "$author" },
  { $group: {
    _id: "$author.name",
    postCount: { $sum: 1 },
    avgLikes: { $avg: "$likesCount" }
  }},
  { $sort: { postCount: -1 } }
]);
```

The `.lean()` method returns plain JavaScript objects instead of Mongoose documents. This is faster because it skips the overhead of attaching Mongoose methods and change tracking. Use it when you only need to read data, not modify it.

The N+1 query problem is when you fetch a list of items and then fetch related data for each item individually. If you have 100 posts, you make 101 queries (1 for posts, 100 for authors). Populate solves this by joining the data in a single query.

### Connection Pooling

```javascript
// Optimize connection pool for your workload
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=20&pool_timeout=10"
    }
  }
});

// Monitor connection usage
setInterval(() => {
  const metrics = prisma.$metrics;
  metrics.toJSON().then(data => {
    console.log("DB metrics:", data);
  });
}, 60000);
```

### Pagination Optimization

```javascript
// Offset pagination — slow for large datasets
const products = await Product.find()
  .skip(10000) // Skips 10,000 documents (slow)
  .limit(20);

// Cursor pagination — fast regardless of position
const products = await Product.find({
  _id: { $gt: lastId } // Uses index efficiently
})
  .sort({ _id: 1 })
  .limit(20);
```

Offset pagination gets slower as the offset increases because the database must scan through all skipped records. Cursor pagination uses the index to jump directly to the right position, making it equally fast whether you are on page 1 or page 1000.

## Real Scenario: Improving Page Load Time

Let us optimize a dashboard page that currently takes 8 seconds to load.

### Before Optimization

```javascript
// Slow endpoint — multiple sequential queries, no caching
app.get("/api/dashboard", async (req, res) => {
  const users = await User.find(); // Fetches ALL users
  const posts = await Post.find(); // Fetches ALL posts
  const orders = await Order.find(); // Fetches ALL orders
  
  const stats = {
    totalUsers: users.length,
    totalPosts: posts.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.amount, 0),
    recentPosts: posts.slice(0, 5),
    activeUsers: users.filter(u => u.lastLoginAt > Date.now() - 86400000)
  };

  res.json(stats);
});
```

This endpoint has three problems. First, it fetches all documents from three collections — potentially millions of records — just to count them and find a few. Second, the queries run sequentially — each waits for the previous one to finish. Third, there is no caching — every request hits the database.

### After Optimization

```javascript
// Optimized endpoint — targeted queries, caching, lean
app.get("/api/dashboard", async (req, res) => {
  const cached = await cache.get("dashboard:stats");
  if (cached) {
    res.set("X-Cache", "HIT");
    return res.json(cached);
  }

  // Parallel queries with targeted fields
  const [totalUsers, totalPosts, revenueResult, recentPosts, activeCount] =
    await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Order.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Post.find()
        .select("title createdAt author")
        .populate("author", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      User.countDocuments({
        lastLoginAt: { $gte: new Date(Date.now() - 86400000) }
      })
    ]);

  const stats = {
    totalUsers,
    totalPosts,
    totalRevenue: revenueResult[0]?.total || 0,
    recentPosts,
    activeUsers: activeCount
  };

  await cache.set("dashboard:stats", stats, 60);
  res.set("X-Cache", "MISS");
  res.json(stats);
});
```

The fixes: `countDocuments()` instead of `find()` (database counts instead of fetching all documents), `Promise.all` instead of sequential awaits (all queries run in parallel), targeted fields with `select()` (only fetch what you need), `.lean()` (skip Mongoose overhead), and Redis caching (subsequent requests return instantly).

### Frontend Optimization

```jsx
// Code splitting with lazy loading
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Analytics = React.lazy(() => import("./pages/Analytics"));

// Optimized image component
function OptimizedImage({ src, alt, width, height }) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}

// Prefetch on hover
function NavLink({ to, children }) {
  const prefetch = () => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = to;
    document.head.appendChild(link);
  };

  return (
    <Link to={to} onMouseEnter={prefetch}>
      {children}
    </Link>
  );
}
```

The `loading="lazy"` attribute on images tells the browser to defer loading until the image is near the viewport. The `decoding="async"` attribute tells the browser to decode the image off the main thread. The prefetch on hover loads the next page's code before the user clicks, making navigation feel instant.

### Bundle Analysis

```javascript
// vite.config.js — analyze bundle size
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      filename: "bundle-analysis.html"
    })
  ]
});
```

Run the bundle analyzer to see what is in your bundle. You might find that a library you use for one function is pulling in 100KB of code. Replace it with a smaller alternative or import only the function you need.

### Performance Budget

A performance budget sets limits on bundle sizes. If a pull request increases the bundle beyond the budget, CI fails. This prevents gradual performance degradation — the kind that happens when every developer adds "just one more small library" until the bundle is 2MB.

Performance budgets work at multiple levels. At the bundle level, you set maximum sizes for the initial load, vendor chunk, and per-route chunks. At the metric level, you set maximum values for LCP, FID, and CLS. At the resource level, you set maximum sizes for individual files (no single JavaScript file should exceed 100KB).

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "200kb",
      "maximumError": "300kb"
    },
    {
      "type": "bundle",
      "name": "vendor",
      "maximumWarning": "150kb",
      "maximumError": "200kb"
    }
  ]
}
```

When a budget is exceeded, the CI pipeline should fail with a clear error message indicating which file or metric exceeded the budget and by how much. This gives the developer actionable information to fix the issue. Common fixes include removing unused dependencies, replacing heavy libraries with lighter alternatives, splitting large bundles into smaller chunks, and lazy-loading non-critical code.

Performance budgets should be reviewed and adjusted periodically. As your application grows, your budgets may need to be relaxed. As you optimize, you may be able to tighten them. The goal is not to hit a specific number — it is to prevent regressions and maintain awareness of performance.

A performance budget sets limits on bundle sizes. If a pull request increases the bundle beyond the budget, CI fails. This prevents gradual performance degradation — the kind that happens when every developer adds "just one more small library" until the bundle is 2MB.

## Assessment

### Lab Task: Performance Optimization

**Time Limit: 60 minutes**

You are given a slow application with the following issues:

1. A dashboard page that loads all data sequentially (8+ second load time).
2. No code splitting — entire application is one bundle (500kb+).
3. No caching — every request hits the database.
4. Missing indexes — queries are doing full table scans.
5. Images are not optimized — large images load on every page.

**Optimize the following:**

1. **Backend:** Optimize the dashboard endpoint to load data in parallel, add caching, and use targeted queries.
2. **Frontend:** Implement code splitting with React.lazy for at least 3 route components.
3. **Database:** Add indexes for the three most common query patterns.
4. **Caching:** Implement Redis caching for the dashboard endpoint with a 60-second TTL.
5. **Images:** Implement lazy loading for images and add proper cache headers.

### Grading Criteria

- **Backend Optimization (25 points):** Dashboard endpoint loads data in parallel, uses targeted queries, and responds in under 200ms.
- **Code Splitting (20 points):** At least 3 routes are lazy loaded, bundle size is reduced, loading states are shown.
- **Caching (25 points):** Redis caching is implemented with proper TTL, cache invalidation works, cache headers are set.
- **Database (15 points):** Indexes are added for common queries, query performance is measurably improved.
- **Images (15 points):** Images use lazy loading, proper dimensions, and appropriate cache headers.

### Evidence

After completing this module, you should be able to:

1. Measure frontend performance using Core Web Vitals (LCP, FID, CLS).
2. Implement code splitting with React.lazy and Suspense.
3. Apply different caching strategies for different data types.
4. Optimize database queries with indexes, projections, and aggregation pipelines.
5. Reduce bundle size through tree shaking and chunk splitting.
6. Implement Redis caching for API responses.
7. Optimize images with lazy loading and proper sizing.
8. Set performance budgets and monitor regressions.
