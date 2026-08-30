# Module 7 — API Versioning: URL, Headers, and Backward Compatibility

## What You'll Actually Do

Version an API without breaking existing clients. You'll implement three versioning strategies, understand the tradeoffs of each, and handle backward compatibility when you need to change a response shape or remove an endpoint.

---

## Why Versioning Matters

Every API change is a potential breaking change. A field you add, rename, or remove can break clients you don't control. Versioning gives you a way to evolve without orphaning everyone who depends on the old behavior.

---

## URL Versioning: Simple, Visible, Fragments Cacheable

Put the version in the URL path. It's the most common approach because it's explicit and easy to route.

```
/api/v1/users
/api/v2/users
```

```javascript
// Express: versioned routers
const v1Router = express.Router();
const v2Router = express.Router();

// V1: returns full user object
v1Router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.user.findUnique({ where: { id: Number(req.params.id) } });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at,
  });
}));

// V2: splits name into first/last, adds avatar
v2Router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.user.findUnique({ where: { id: Number(req.params.id) } });
  res.json({
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    avatar_url: user.avatarUrl,
    created_at: user.created_at,
  });
}));

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

**Pros:** Easy to understand, easy to route, CDN-friendly (different URLs = different cache entries).

**Cons:** URL proliferation, clients tend to never upgrade, you end up maintaining many versions.

---

## Header Versioning: Clean URLs, Client Controls the Version

The client sends the desired version in a request header. URLs stay clean.

```
GET /api/users/42
Accept: application/vnd.myapp.v2+json
```

```javascript
function versionHeader(supportedVersions) {
  return (req, res, next) => {
    const accept = req.headers.accept || '';
    const match = accept.match(/application\/vnd\.myapp\.v(\d+)\+json/);

    if (!match) {
      req.apiVersion = supportedVersions[supportedVersions.length - 1]; // latest
      return next();
    }

    const requested = Number(match[1]);
    if (!supportedVersions.includes(requested)) {
      return res.status(406).json({
        error: 'Unsupported version',
        supported: supportedVersions,
      });
    }

    req.apiVersion = requested;
    next();
  };
}

app.use(versionHeader([1, 2]));

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await db.user.findUnique({ where: { id: Number(req.params.id } });

  if (req.apiVersion === 1) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    });
  } else {
    res.json({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      avatar_url: user.avatarUrl,
      created_at: user.created_at,
    });
  }
}));
```

**Pros:** Clean URLs, no URL proliferation, client-driven.

**Cons:** Harder to test in browser, cache keys need version-aware logic, version header is easy to forget.

---

## Query Parameter Versioning: Simple, Bookmarkable

```
GET /api/users/42?version=2
```

```javascript
app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const version = Number(req.query.version) || 1;
  const user = await db.user.findUnique({ where: { id: Number(req.params.id) } });

  if (version === 1) {
    res.json({ id: user.id, name: user.name, email: user.email });
  } else {
    res.json({ id: user.id, first_name: user.firstName, email: user.email });
  }
}));
```

**Pros:** Easy to test, bookmarkable, explicit.

**Cons:** Query parameters affect caching, clients often ignore it, harder to enforce.

---

## Backward Compatibility Strategy

**The golden rule:** Add, don't remove. New fields don't break old clients. Removed fields do.

```javascript
// SAFE: Adding a field (old clients ignore what they don't know)
v1 response: { "id": 1, "name": "Alice" }
v2 response: { "id": 1, "name": "Alice", "avatar_url": "..." }

// DANGEROUS: Renaming a field (old clients break)
v1: { "name": "Alice" }
v2: { "display_name": "Alice" } // old clients looking for "name" get null
```

**Deprecation headers:** Tell clients what's going away and when.

```javascript
app.get('/api/v1/users/:id', asyncHandler(async (req, res) => {
  res.set('Deprecation', 'true');
  res.set('Sunset', 'Sat, 01 Jan 2027 00:00:00 GMT');
  res.set('Link', '</api/v2/users/' + req.params.id + '>; rel="successor-version"');

  const user = await db.user.findUnique({ where: { id: Number(req.params.id) } });
  res.json({ id: user.id, name: user.name, email: user.email });
}));
```

---

## Version Migration Strategy

```
Phase 1: Release new version, old version still works
Phase 2: Add deprecation headers to old version
Phase 3: Log usage of old version endpoints
Phase 4: When usage drops, return 410 Gone with migration guide
Phase 5: Remove old version code
```

```javascript
// Phase 4: sunset endpoint
app.all('/api/v1/*', (req, res) => {
  res.status(410).json({
    error: 'API v1 has been removed',
    migration_guide: 'https://docs.example.com/migration/v1-to-v2',
    successor: req.originalUrl.replace('/api/v1/', '/api/v2/'),
  });
});
```

---

## Assessment

**Lab Task: Version an API (50 minutes)**

Start with a v1 API that returns user data with a `name` field. Then:

1. Implement URL versioning (`/api/v1/users`, `/api/v2/users`)
2. V2 splits `name` into `first_name` and `last_name`, adds `avatar_url`
3. Implement header versioning on a shared endpoint
4. Add deprecation headers to v1 responses
5. Write a test script that hits both versions and verifies the response shapes
6. Document the migration path from v1 to v2

**Deliverables:** `versioned-api.js` with v1 and v2 routers, `test-versions.sh` script, `migration-guide.md`.

**Grading:**
- URL versioning works correctly: 25%
- Header versioning works correctly: 25%
- Deprecation headers are present on v1: 20%
- V2 response has new fields without breaking v1: 20%
- Migration guide is clear: 10%

---

## Evidence

Run the test script showing v1 and v2 responses. Screenshot the deprecation headers. Include the migration guide showing the field mapping between versions.
