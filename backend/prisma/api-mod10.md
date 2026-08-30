# Module 10 — API Gateway: Rate Limiting, Caching, and Monitoring

## What You'll Actually Do

Build the layer that sits between your clients and your services. You'll implement rate limiting that actually works under load, caching that reduces response time without serving stale data, and monitoring that tells you when something's wrong before your users tell you.

---

## What an API Gateway Actually Does

An API gateway is a single entry point that handles cross-cutting concerns. Instead of every service implementing rate limiting, auth, caching, and logging, the gateway does it once.

```
Client → API Gateway → Service A
                      → Service B
                      → Service C

Gateway handles:
- Authentication/Authorization
- Rate limiting
- Request/response transformation
- Caching
- Logging and metrics
- Load balancing
- Circuit breaking
```

---

## Rate Limiting at the Gateway Level

In-memory rate limiting breaks with multiple instances. Use Redis for distributed state.

```javascript
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

// Sliding window rate limiter with Redis
async function slidingWindowRateLimit({ windowMs, max, keyPrefix = 'rl' }) {
  return async (req, res, next) => {
    const key = `${keyPrefix}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const multi = client.multi();
    multi.zRemRangeByScore(key, 0, windowStart);
    multi.zAdd(key, { score: now, value: `${now}:${Math.random()}` });
    multi.zCard(key);
    multi.expire(key, Math.ceil(windowMs / 1000));

    const results = await multi.exec();
    const count = results[2][1];

    const remaining = Math.max(0, max - count);
    const resetAt = Math.ceil((windowStart + windowMs) / 1000);

    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', remaining);
    res.set('X-RateLimit-Reset', resetAt);

    if (count > max) {
      res.set('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    next();
  };
}

// Tiered rate limits
const globalLimit = slidingWindowRateLimit({ windowMs: 60000, max: 100 });
const authLimit = slidingWindowRateLimit({ windowMs: 900000, max: 5, keyPrefix: 'rl:auth' });
const apiLimit = slidingWindowRateLimit({ windowMs: 60000, max: 50, keyPrefix: 'rl:api' });
```

**Per-user vs per-IP:** Apply IP limits for unauthenticated endpoints, user limits for authenticated ones.

```javascript
function adaptiveRateLimit({ windowMs, ipMax, userMax }) {
  return async (req, res, next) => {
    const isAuthenticated = !!req.user;
    const max = isAuthenticated ? userMax : ipMax;
    const key = isAuthenticated ? `rl:user:${req.user.id}` : `rl:ip:${req.ip}`;

    // ... same Redis logic as above, using `key` and `max`
  };
}
```

---

## Response Caching

Cache responses at the gateway to avoid hitting your services for repeated requests.

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute default

function gatewayCache({ ttl = 300, keyFn, conditions = {} } = {}) {
  return async (req, res, next) => {
    // Don't cache authenticated requests by default
    if (req.headers.authorization && !conditions.cacheAuth) {
      return next();
    }

    // Don't cache POST, PUT, DELETE
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyFn
      ? keyFn(req)
      : `cache:${req.method}:${req.originalUrl}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-TTL', cache.getTtl(cacheKey));
      return res.status(cached.statusCode).json(cached.body);
    }

    // Intercept res.json to capture the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, { statusCode: res.statusCode, body }, ttl);
      }
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

// Apply to public endpoints
app.use('/api/products', gatewayCache({ ttl: 60 }));
app.use('/api/categories', gatewayCache({ ttl: 3600 })); // cache categories for an hour
```

**Cache invalidation:** When data changes, invalidate the cache.

```javascript
// After updating a product, invalidate its cache
async function updateProduct(id, data) {
  const product = await db.product.update({ where: { id }, data });

  // Invalidate related cache entries
  cache.del(`cache:GET:/api/products/${id}`);
  cache.del('cache:GET:/api/products');

  // Or use a pattern to invalidate all product caches
  const keys = cache.keys().filter(k => k.includes('/api/products'));
  cache.del(keys);

  return product;
}
```

**Cache-Control headers for downstream caches:**

```javascript
app.get('/api/products/:id', async (req, res) => {
  const product = await db.product.findUnique({ where: { id: Number(req.params.id) } });

  // Public, cache for 5 minutes, stale-while-revalidate for 1 hour
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  res.set('ETag', generateETag(product));

  if (req.headers['if-none-match'] === res.get('ETag')) {
    return res.status(304).end();
  }

  res.json(product);
});
```

---

## Monitoring and Observability

You need three things: metrics (numbers), logs (events), and traces (request flow).

```javascript
// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();

  req.requestId = requestId;
  res.set('X-Request-Id', requestId);

  // Capture response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.headers['user-agent'],
    };

    // Track slow requests
    if (duration > 1000) {
      log.slow = true;
    }

    // Track errors
    if (res.statusCode >= 400) {
      log.error = true;
    }

    console.log(JSON.stringify(log));

    // Send to metrics system
    metrics.requestDuration.observe({ method: req.method, path: req.path, status: res.statusCode }, duration / 1000);
  });

  next();
}

app.use(requestLogger);
```

**Health check endpoint:**

```javascript
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  const healthy = Object.values(checks).every(c => c.status !== 'error');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

async function checkDatabase() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'ok', latency: await measureDbLatency() };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

async function checkRedis() {
  try {
    const start = Date.now();
    await client.ping();
    return { status: 'ok', latency: Date.now() - start };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}
```

**Alerting rules:**

```javascript
// Track metrics that matter
const metrics = {
  errorRate: 0,
  p99Latency: 0,
  rateLimitHits: 0,
};

// Alert when thresholds are breached
function checkAlerts() {
  if (metrics.errorRate > 0.05) { // > 5% errors
    sendAlert('High error rate', metrics.errorRate);
  }
  if (metrics.p99Latency > 2000) { // > 2s p99
    sendAlert('High latency', metrics.p99Latency);
  }
  if (metrics.rateLimitHits > 1000) { // many rate limited requests
    sendAlert('Possible abuse', metrics.rateLimitHits);
  }
}

setInterval(checkAlerts, 60000); // check every minute
```

---

## Circuit Breaking

When a downstream service fails, stop sending requests to it instead of hammering it.

```javascript
class CircuitBreaker {
  constructor(fn, { threshold = 5, resetTimeout = 30000 } = {}) {
    this.fn = fn;
    this.failures = 0;
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
    this.state = 'closed'; // closed = normal, open = failing, half-open = testing
    this.lastFailure = null;
  }

  async call(...args) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await this.fn(...args);
      this.failures = 0;
      this.state = 'closed';
      return result;
    } catch (err) {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures >= this.threshold) {
        this.state = 'open';
      }
      throw err;
    }
  }
}

// Usage
const paymentService = new CircuitBreaker(
  async (amount, userId) => {
    const res = await fetch('http://payment-service/charge', {
      method: 'POST',
      body: JSON.stringify({ amount, userId }),
    });
    if (!res.ok) throw new Error('Payment failed');
    return res.json();
  },
  { threshold: 3, resetTimeout: 15000 }
);
```

---

## Assessment

**Lab Task: Build an API Gateway (60 minutes)**

Build a gateway that proxies requests to a backend service with these features:

1. **Rate limiting:** Redis-based, 100 req/min per IP, 20 req/min for auth endpoints
2. **Caching:** Cache GET responses for 60 seconds, invalidate on POST/PUT/DELETE to same paths
3. **Logging:** Structured JSON logs with request ID, method, path, status, duration, and user ID
4. **Health check:** `/health` endpoint that checks database and Redis connectivity
5. **Circuit breaker:** Protect calls to an external service (use a mock that fails 50% of the time)

**Deliverables:** `gateway.js` with all middleware, `test-gateway.sh` that exercises rate limiting (shows 429), caching (shows X-Cache headers), logging (shows structured output), and circuit breaker (shows state transitions).

**Grading:**
- Rate limiting works with Redis and returns correct headers: 25%
- Caching reduces backend calls (verified with X-Cache headers): 25%
- Structured logs include all required fields: 20%
- Health check reports status of dependencies: 15%
- Circuit breaker transitions between states correctly: 15%

---

## Evidence

Run the test script and screenshot: rate limit headers and 429 response, X-Cache HIT/MISS headers, structured log output, health check response, and circuit breaker state transitions. Include a brief writeup of what monitoring you'd add in production.
