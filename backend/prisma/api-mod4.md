# Module 4 — Authorization: RBAC, ABAC, and Rate Limiting

## What You'll Actually Do

Control who can do what. You'll implement role-based access control (RBAC), attribute-based access control (ABAC), and rate limiting. You'll build middleware that checks permissions at the right granularity and write rate limiters that protect your API without blocking legitimate traffic.

---

## RBAC: Roles Determine Permissions

RBAC assigns users to roles, roles map to permissions. Simple, auditable, works for most applications.

```
Roles:       admin, manager, user
Permissions: users:read, users:write, orders:read, orders:write, reports:read

admin    → all permissions
manager  → users:read, orders:read, orders:write, reports:read
user     → orders:read (own orders only)
```

```javascript
const permissions = {
  admin: ['users:read', 'users:write', 'orders:read', 'orders:write', 'reports:read'],
  manager: ['users:read', 'orders:read', 'orders:write', 'reports:read'],
  user: ['orders:read'],
};

function authorize(...requiredPermissions) {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = permissions[userRole] || [];

    const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        required: requiredPermissions,
        your_role: userRole,
      });
    }
    next();
  };
}

// Usage
app.get('/api/users', authenticate, authorize('users:read'), listUsers);
app.put('/api/users/:id', authenticate, authorize('users:write'), updateUser);
app.get('/api/reports', authenticate, authorize('reports:read'), getReports);
```

**Resource-level RBAC:** The user can access orders, but only their own orders. This needs ownership checks, not just role checks.

```javascript
async function getOrder(req, res) {
  const order = await db.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Admins and managers see everything, users see only their own
  if (req.user.role === 'user' && order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(order);
}
```

---

## ABAC: Attributes Determine Access

ABAC evaluates policies based on attributes of the user, resource, and environment. More flexible than RBAC, but harder to reason about.

```
Policy examples:
- "Users can edit articles they authored"
- "Managers can approve expenses under $5,000"
- "No access to production data outside business hours"
- "Users in the same department can view each other's reports"
```

```javascript
const policies = [
  {
    name: 'own-resource-edit',
    check: (user, resource) => user.id === resource.authorId,
  },
  {
    name: 'manager-approval-limit',
    check: (user, resource) =>
      user.role === 'manager' && resource.type === 'expense' && resource.amount <= 5000,
  },
  {
    name: 'business-hours-only',
    check: (user, resource, context) => {
      const hour = new Date().getUTCHours();
      return hour >= 9 && hour < 17;
    },
  },
];

function authorizeAbac(resourceLoader) {
  return async (req, res, next) => {
    const resource = resourceLoader(req);
    const context = { ip: req.ip, timestamp: new Date() };

    const allowed = policies.some(p => p.check(req.user, resource, context));
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied by policy' });
    }
    next();
  };
}

// Usage
app.put('/api/articles/:id', authenticate, authorizeAbac(req => req.article), updateArticle);
```

**When to use ABAC over RBAC:** When permissions depend on data values (amounts, dates, ownership) rather than just roles. Most systems use RBAC as the base with ABAC for specific rules.

---

## Rate Limiting: Protect Without Blocking

Rate limiting prevents abuse while allowing legitimate traffic. You need three decisions: what to limit, how to count, and what to do when limits are hit.

```javascript
// Simple in-memory rate limiter using a sliding window
function createRateLimiter({ windowMs, max }) {
  const hits = new Map();

  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits) {
      const valid = timestamps.filter(t => t > now - windowMs);
      if (valid.length === 0) hits.delete(key);
      else hits.set(key, valid);
    }
  }, 60000);

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!hits.has(key)) hits.set(key, []);

    const timestamps = hits.get(key).filter(t => t > windowStart);
    hits.set(key, timestamps);

    if (timestamps.length >= max) {
      const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
      res.set('Retry-After', retryAfter);
      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', 0);
      res.set('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000));
      return res.status(429).json({ error: 'Too many requests', retryAfter });
    }

    timestamps.push(now);
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', max - timestamps.length);
    next();
  };
}

// Apply globally
app.use(createRateLimiter({ windowMs: 60000, max: 100 })); // 100 req/min

// Stricter on auth endpoints
app.use('/api/auth', createRateLimiter({ windowMs: 900000, max: 5 })); // 5 per 15 min
```

**Per-user vs per-IP:** IP-based limiting blocks legitimate users behind a shared NAT. User-based limiting (after authentication) is more accurate. Combine both: IP limits prevent brute force, user limits prevent abuse by authenticated users.

```javascript
// Per-user rate limiter (use after authentication)
function userRateLimit({ windowMs, max }) {
  const hits = new Map();

  return (req, res, next) => {
    const key = `user:${req.user.id}`;
    const now = Date.now();

    if (!hits.has(key)) hits.set(key, []);
    const timestamps = hits.get(key).filter(t => t > now - windowMs);
    hits.set(key, timestamps);

    if (timestamps.length >= max) {
      return res.status(429).json({ error: 'Rate limit exceeded for your account' });
    }

    timestamps.push(now);
    next();
  };
}
```

**For production, use Redis** instead of in-memory Maps. In-memory state doesn't survive restarts and doesn't work across multiple server instances.

```javascript
// Redis-based rate limiter (conceptual)
async function redisRateLimit(redis, key, windowMs, max) {
  const now = Date.now();
  const windowStart = now - windowMs;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(key, now, now);
  multi.zcard(key);
  multi.expire(key, Math.ceil(windowMs / 1000));

  const results = await multi.exec();
  const count = results[2][1];

  return { allowed: count <= max, remaining: Math.max(0, max - count) };
}
```

---

## Combining RBAC + Rate Limiting

```javascript
// Layer 1: Global rate limit (per IP)
app.use(createRateLimiter({ windowMs: 60000, max: 100 }));

// Layer 2: Authentication
app.use('/api', authenticate);

// Layer 3: Role-based access
app.get('/api/admin/users', authorize('users:read'), adminListUsers);

// Layer 4: Per-user rate limit for sensitive operations
app.post('/api/admin/users', authorize('users:write'), userRateLimit({ windowMs: 60000, max: 10 }), createUser);
```

---

## Assessment

**Lab Task: Build a Permissioned API (50 minutes)**

Build an API for a project management tool with these requirements:

1. Three roles: `admin`, `manager`, `member`
2. Admins can do everything. Managers can manage projects and tasks. Members can only view and comment.
3. Members can only see projects they're assigned to (resource-level check).
4. Implement rate limiting: 100 requests/minute globally, 10 requests/minute for member-level operations, 5 requests/minute for admin operations.
5. Include a `/api/permissions` endpoint that returns the current user's effective permissions.

**Deliverables:** `project-api.js` with all middleware and endpoints, plus a test script that demonstrates permission checks and rate limiting.

**Grading:**
- RBAC correctly enforces role permissions: 30%
- Resource-level access works (members see only their projects): 25%
- Rate limiting works at all three levels: 25%
- Permission endpoint returns correct data: 20%

---

## Evidence

Run your test script as different roles. Screenshot the outputs showing: admin access, member access denied, rate limit headers in responses, and 429 responses when limits are hit.
