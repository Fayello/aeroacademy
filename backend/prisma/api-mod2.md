# Module 2 — RESTful Design: Resources, Methods, and Status Codes

## What You'll Actually Do

Design a REST API that doesn't make other developers want to throw their keyboards. You'll define resources, map HTTP methods correctly, use status codes that mean something, and avoid the common mistakes that make APIs confusing to use and hard to maintain.

---

## Resources Are Nouns, Not Verbs

A resource is a thing the client interacts with. The URL identifies the resource, the HTTP method identifies the action. Bad URL design is the most common REST mistake.

```
# BAD — verb-based URLs
GET  /api/getUser?id=42
POST /api/createUser
POST /api/deleteUser/42

# GOOD — resource-based URLs
GET    /api/users/42
POST   /api/users
DELETE /api/users/42
```

**Nested resources** show relationships:

```
/users/42/posts              → posts owned by user 42
/users/42/posts/7            → specific post by user 42
/users/42/posts/7/comments   → comments on that post
```

But don't go deeper than two levels. `/users/42/posts/7/comments/15/replies` is a URL nobody wants to type.

---

## HTTP Methods: What Each One Means

```
GET     → Read a resource. Safe, idempotent, cacheable.
POST    → Create a new resource. Neither safe nor idempotent.
PUT     → Replace a resource entirely. Idempotent.
PATCH   → Partially update a resource. Idempotent.
DELETE  → Remove a resource. Idempotent.
HEAD    → Same as GET but no body (useful for checking if a resource exists).
OPTIONS → What methods does this endpoint support? Used for CORS.
```

**Idempotent** means calling it N times has the same effect as calling it once. This matters for retry logic — if a network blip causes a client to retry a PUT, you don't want duplicate data.

```javascript
// POST — create (not idempotent)
app.post('/api/users', async (req, res) => {
  const user = await db.user.create({ data: req.body });
  res.status(201).json(user);
});

// PUT — replace entire resource (idempotent)
app.put('/api/users/:id', async (req, res) => {
  const user = await db.user.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  });
  res.json(user);
});

// PATCH — partial update (idempotent)
app.patch('/api/users/:id', async (req, res) => {
  const user = await db.user.update({
    where: { id: Number(req.params.id) },
    data: req.body, // only fields sent
  });
  res.json(user);
});
```

---

## Status Codes: Say What Happened

The biggest status code mistake: everything returns 200 with an error in the body. That breaks caching, monitoring, and developer sanity.

```
# Success
200 OK              → Request succeeded (GET, PUT, PATCH, DELETE)
201 Created         → Resource created (POST). Include Location header.
204 No Content      → Success, no body to return (DELETE)

# Client errors
400 Bad Request     → Malformed JSON, missing required fields
401 Unauthorized    → Not authenticated (missing or bad token)
403 Forbidden       → Authenticated but not allowed
404 Not Found       → Resource doesn't exist
409 Conflict        → Duplicate resource, version conflict
422 Unprocessable   → JSON is valid but data fails validation
429 Too Many Requests → Rate limited

# Server errors
500 Internal Error  → Something broke on your end. Don't leak details.
502 Bad Gateway     → Upstream service failed
503 Service Unavailable → Overloaded or down for maintenance
```

```javascript
app.post('/api/users', async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'email and name are required' });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'email already registered' });
  }

  const user = await db.user.create({ data: { email, name } });
  res.status(201)
     .header('Location', `/api/users/${user.id}`)
     .json(user);
});
```

---

## Pagination, Filtering, and Sorting

Don't return unbounded lists. Use query parameters for the client to control what they get.

```
GET /api/products?page=2&limit=20
GET /api/products?category=electronics&min_price=50
GET /api/products?sort=-created_at,name
```

```javascript
app.get('/api/products', async (req, res) => {
  const { page = 1, limit = 20, category, min_price, sort } = req.query;
  const where = {};
  if (category) where.category = category;
  if (min_price) where.price = { gte: Number(min_price) };

  const orderBy = sort
    ? sort.split(',').map(s => {
        const desc = s.startsWith('-');
        return { [desc ? s.slice(1) : s]: desc ? 'desc' : 'asc' };
      })
    : { created_at: 'desc' };

  const products = await db.product.findMany({
    where,
    orderBy,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });

  const total = await db.product.count({ where });

  res.json({
    data: products,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});
```

---

## Consistent Response Shape

Pick one response envelope and stick with it everywhere.

```javascript
// Successful single resource
{ "data": { "id": 42, "name": "Widget" } }

// Successful list
{ "data": [...], "meta": { "page": 1, "total": 100 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "email is required", "details": [...] } }
```

---

## Assessment

**Lab Task: Design and Implement a Bookstore API (50 minutes)**

Design a REST API for a bookstore with resources: `books`, `authors`, `reviews`.

1. Define the URL structure (list all endpoints with methods)
2. Implement at least 5 endpoints in Express with proper status codes
3. Implement pagination on the `GET /books` endpoint
4. Handle at least 3 error cases (validation, not found, duplicate)
5. Use a consistent response envelope for all responses

**Deliverables:** `bookstore-api.js` with all endpoints, plus a `routes.md` documenting every endpoint.

**Grading:**
- URL design follows REST conventions: 25%
- Status codes used correctly (not everything is 200): 25%
- Pagination works with metadata: 20%
- Error handling is consistent and informative: 20%
- Documentation is complete and accurate: 10%

---

## Evidence

Export your `routes.md` and a curl script that exercises every endpoint (success and error cases). Screenshot the curl output showing correct status codes and response shapes.
