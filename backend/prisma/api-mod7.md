# Module 7 — API Versioning

APIs evolve. Endpoints change, response formats shift, new fields appear, old fields are removed. Without versioning, these changes break every client that depends on your API. Versioning lets you make changes without breaking existing clients.

This module covers versioning strategies — URL-based, header-based, and query parameter versioning — along with backward compatibility, deprecation workflows, and version management for a real API.

## Why Versioning Matters

Consider a flight training API that returns pilot data:

**Version 1 (current):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "license": "FAA-123456"
}
```

**Version 2 (planned):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "license_number": "FAA-123456",
  "license_type": "private"
}
```

The name field was split into first_name and last_name. The license field was renamed to license_number and a license_type field was added. Without versioning, every client that reads the name field breaks immediately.

With versioning, version 1 continues to work exactly as before. Clients can migrate to version 2 at their own pace.

## Versioning Strategies

### URL-Based Versioning

The version is part of the URL path:

```
GET /api/v1/pilots/123
GET /api/v2/pilots/123
```

**Pros:**
- Simple to implement
- Easy to understand and debug
- Browser-friendly (you can paste the URL in a browser)
- Cache-friendly (different versions are different URLs)
- Clear in documentation and examples

**Cons:**
- URL proliferation (every version doubles the route count)
- Violates REST principles (the resource is the same, only the representation changes)
- Requires client to update URLs when upgrading

**Implementation:**

```javascript
// Version 1 routes
app.get('/api/v1/pilots/:id', authenticate, async (req, res) => {
  const pilot = await db.pilots.findOne({ id: req.params.id });
  
  // V1 format: flat name field
  res.json({
    id: pilot.id,
    name: `${pilot.first_name} ${pilot.last_name}`,
    email: pilot.email,
    license: pilot.license_number
  });
});

// Version 2 routes
app.get('/api/v2/pilots/:id', authenticate, async (req, res) => {
  const pilot = await db.pilots.findOne({ id: req.params.id });
  
  // V2 format: separate name fields, additional data
  res.json({
    id: pilot.id,
    first_name: pilot.first_name,
    last_name: pilot.last_name,
    email: pilot.email,
    license_number: pilot.license_number,
    license_type: pilot.license_type,
    created_at: pilot.created_at
  });
});
```

**Route organization with Express:**

```javascript
// Separate routers for each version
const v1Router = require('./routes/v1');
const v2Router = require('./routes/v2');

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

### Header-Based Versioning

The version is in the Accept header:

```
GET /api/pilots/123
Accept: application/vnd.api.v1+json

GET /api/pilots/123
Accept: application/vnd.api.v2+json
```

**Pros:**
- URL stays clean (same resource, different representation)
- Follows REST principles more closely
- Does not pollute the URL space

**Cons:**
- Harder to test in a browser (you cannot set headers in the address bar)
- Harder to cache (caching keys must include the Accept header)
- Less visible in documentation and examples
- Many HTTP clients do not set custom headers easily

**Implementation:**

```javascript
function versionMiddleware(supportedVersions) {
  return (req, res, next) => {
    const accept = req.headers.accept || '';
    const match = accept.match(/application\/vnd\.api\.v(\d+)\+json/);
    
    if (!match) {
      // Default to latest version
      req.apiVersion = supportedVersions[supportedVersions.length - 1];
      return next();
    }
    
    const requestedVersion = parseInt(match[1]);
    
    if (!supportedVersions.includes(requestedVersion)) {
      return res.status(406).json({
        error: 'not_acceptable',
        message: `Unsupported API version. Supported: ${supportedVersions.join(', ')}`
      });
    }
    
    req.apiVersion = requestedVersion;
    next();
  };
}

// Usage
app.get('/api/pilots/:id',
  authenticate,
  versionMiddleware([1, 2]),
  async (req, res) => {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    
    if (req.apiVersion === 1) {
      res.json({
        id: pilot.id,
        name: `${pilot.first_name} ${pilot.last_name}`,
        email: pilot.email,
        license: pilot.license_number
      });
    } else if (req.apiVersion === 2) {
      res.json({
        id: pilot.id,
        first_name: pilot.first_name,
        last_name: pilot.last_name,
        email: pilot.email,
        license_number: pilot.license_number,
        license_type: pilot.license_type,
        created_at: pilot.created_at
      });
    }
  }
);
```

### Query Parameter Versioning

The version is a query parameter:

```
GET /api/pilots/123?version=1
GET /api/pilots/123?version=2
```

**Pros:**
- Simple to implement
- Easy to understand
- Does not require custom headers

**Cons:**
- Pollutes the URL with non-resource parameters
- Can be forgotten (clients omit the parameter)
- Cache keys become more complex
- Less standard than URL-based or header-based

**Implementation:**

```javascript
app.get('/api/pilots/:id', authenticate, async (req, res) => {
  const version = parseInt(req.query.version) || 2; // Default to latest
  const pilot = await db.pilots.findOne({ id: req.params.id });
  
  if (version === 1) {
    res.json({
      id: pilot.id,
      name: `${pilot.first_name} ${pilot.last_name}`,
      email: pilot.email,
      license: pilot.license_number
    });
  } else if (version === 2) {
    res.json({
      id: pilot.id,
      first_name: pilot.first_name,
      last_name: pilot.last_name,
      email: pilot.email,
      license_number: pilot.license_number,
      license_type: pilot.license_type,
      created_at: pilot.created_at
    });
  } else {
    res.status(400).json({
      error: 'invalid_version',
      message: `Unsupported version: ${version}. Supported: 1, 2`
    });
  }
});
```

## Backward Compatibility

A change is backward compatible if existing clients continue to work without modification. A change is backward incompatible if existing clients break.

### Safe Changes (No Version Bump Needed)

These changes do not break existing clients:

**Adding a new field:**
```json
// Before
{ "id": "123", "name": "John" }

// After
{ "id": "123", "name": "John", "email": "john@example.com" }
```

Clients that do not read the email field are unaffected. Clients that do read it now get data.

**Adding a new endpoint:**
```
GET /api/v1/pilots/:id          (existing)
GET /api/v1/pilots/:id/history  (new)
```

Existing endpoints are unaffected. Clients that do not call the new endpoint are unaffected.

**Adding a new query parameter:**
```
GET /api/v1/pilots?page=1          (existing, still works)
GET /api/v1/pilots?page=1&limit=50 (new parameter, ignored by old clients)
```

### Breaking Changes (Version Bump Required)

These changes break existing clients:

**Renaming a field:**
```json
// Before
{ "id": "123", "name": "John" }

// After
{ "id": "123", "full_name": "John" }
```

Clients reading the name field get undefined.

**Removing a field:**
```json
// Before
{ "id": "123", "name": "John", "email": "john@example.com" }

// After
{ "id": "123", "name": "John" }
```

Clients reading the email field get undefined.

**Changing a field type:**
```json
// Before
{ "id": "123", "license_number": "FAA-123456" }

// After
{ "id": "123", "license_number": { "number": "FAA-123456", "type": "private" } }
```

Clients reading license_number as a string get an object.

**Changing the response structure:**
```json
// Before
{ "id": "123", "name": "John" }

// After
{ "pilot": { "id": "123", "name": "John" } }
```

Clients reading pilot.name get undefined.

**Changing the URL structure:**
```
// Before
GET /api/v1/pilots/123

// After
GET /api/v1/users/123
```

Clients calling the old URL get 404.

**Changing status codes:**
```
// Before
POST /api/v1/pilots → 201 Created

// After
POST /api/v1/pilots → 200 OK
```

Clients checking for 201 get an error.

### Strategies for Backward Compatibility

**Deprecation with sunset period.** When you plan a breaking change, announce it in advance. Mark the old field as deprecated, continue returning it alongside the new field, and remove it after a sunset period:

```json
// Transitional response (both fields present)
{
  "id": "123",
  "name": "John Doe",           // Deprecated
  "full_name": "John Doe",     // New field
  "email": "john@example.com"
}
```

The deprecation notice goes in the response header:

```
Deprecation: true
Sunset: Sat, 01 Jan 2027 00:00:00 GMT
Link: <https://api.example.com/docs/v2>; rel="successor-version"
```

**Field aliasing.** Accept both the old and new field names in requests, and return both in responses:

```javascript
function normalizeInput(body) {
  // Accept both "name" and "full_name"
  if (body.name && !body.full_name) {
    const parts = body.name.split(' ');
    body.first_name = parts[0];
    body.last_name = parts.slice(1).join(' ');
  }
  
  // Accept both "license" and "license_number"
  if (body.license && !body.license_number) {
    body.license_number = body.license;
  }
  
  return body;
}
```

**Tolerance in responses.** When a response includes extra fields, clients should ignore fields they do not recognize:

```javascript
// Client should not break when new fields are added
const pilot = await fetch('/api/v1/pilots/123');
const data = await pilot.json();

// Client only reads the fields it knows about
console.log(data.name);
console.log(data.email);
// If the server adds a "phone" field, the client ignores it
```

**Semantic versioning for APIs.** Use semver for your API version:

- **Major version** (v1, v2, v3) — Breaking changes
- **Minor version** (v1.1, v1.2) — New features, backward compatible
- **Patch version** (v1.0.1, v1.0.2) — Bug fixes, backward compatible

## Deprecation Workflow

When you deprecate an API version or endpoint, follow a structured workflow:

### Step 1: Announce the Deprecation

Notify users well in advance:

```
API Deprecation Notice

We are deprecating API v1 endpoints.
Sunset date: January 1, 2027
Migration guide: https://api.example.com/docs/migrate-v1-to-v2

Affected endpoints:
- GET /api/v1/pilots (replaced by GET /api/v2/pilots)
- POST /api/v1/pilots (replaced by POST /api/v2/pilots)
```

### Step 2: Add Deprecation Headers

Every response from a deprecated endpoint includes:

```
Deprecation: true
Sunset: Sat, 01 Jan 2027 00:00:00 GMT
Link: <https://api.example.com/docs/migrate-v1-to-v2>; rel="successor-version"
Warning: 299 - "API v1 is deprecated. Migrate to v2."
```

### Step 3: Log Usage

Track which clients still use the deprecated version:

```javascript
app.use('/api/v1', (req, res, next) => {
  // Log deprecated version usage
  logger.warn({
    event: 'deprecated_api_usage',
    version: 'v1',
    path: req.path,
    method: req.method,
    client_ip: req.ip,
    user_agent: req.headers['user-agent']
  });
  
  // Add deprecation headers
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Sat, 01 Jan 2027 00:00:00 GMT');
  res.setHeader('Link', '<https://api.example.com/docs/migrate-v1-to-v2>; rel="successor-version"');
  
  next();
});
```

### Step 4: Notify Users

Send periodic reminders to users who still use the deprecated version:

```javascript
// Weekly email to users of deprecated API
const deprecatedUsers = await getDeprecatedVersionUsers();
for (const user of deprecatedUsers) {
  await sendEmail({
    to: user.email,
    subject: 'Action Required: Migrate from API v1 to v2',
    body: `You are still using API v1, which will be sunset on January 1, 2027. Please migrate to v2.`
  });
}
```

### Step 5: Sunset the Version

On the sunset date, return 410 Gone for all requests to the deprecated version:

```javascript
app.use('/api/v1', (req, res) => {
  res.status(410).json({
    error: 'gone',
    message: 'API v1 has been sunset. Please use API v2.',
    documentation: 'https://api.example.com/docs/migrate-v1-to-v2'
  });
});
```

## Version Negotiation

When a client does not specify a version, the API should use a default strategy:

**Default to latest.** If the client does not specify a version, use the latest version. This is the most common approach.

```javascript
app.use('/api', (req, res, next) => {
  // Extract version from URL or header
  const urlMatch = req.path.match(/^\/v(\d+)\//);
  const headerMatch = req.headers.accept?.match(/application\/vnd\.api\.v(\d+)\+json/);
  
  req.apiVersion = urlMatch?.[1] || headerMatch?.[1] || '2'; // Default to v2
  
  next();
});
```

**Require explicit version.** If the client does not specify a version, return an error. This forces clients to be explicit about which version they use.

```javascript
app.use('/api', (req, res, next) => {
  if (!req.headers['api-version'] && !req.query.version) {
    return res.status(400).json({
      error: 'missing_version',
      message: 'API version is required. Use the api-version header or version query parameter.'
    });
  }
  
  next();
});
```

## Real Scenario: Versioning a Flight Training API

Consider a flight training API with these endpoints:

```
GET    /api/v1/pilots              — List pilots
POST   /api/v1/pilots              — Create pilot
GET    /api/v1/pilots/:id          — Get pilot
PUT    /api/v1/pilots/:id          — Update pilot
DELETE /api/v1/pilots/:id          — Delete pilot
GET    /api/v1/aircraft            — List aircraft
GET    /api/v1/training-sessions   — List training sessions
POST   /api/v1/training-sessions   — Create training session
```

### The Breaking Change

The team wants to change the pilot response format. The current v1 format:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "license": "FAA-123456"
}
```

The new v2 format:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "license_number": "FAA-123456",
  "license_type": "private",
  "created_at": "2026-08-30T14:30:00Z",
  "updated_at": "2026-08-30T14:30:00Z"
}
```

### Implementation

**Router structure:**

```javascript
const v1Router = require('./routes/v1');
const v2Router = require('./routes/v2');

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// Redirect old URLs to versioned URLs
app.use('/api', (req, res, next) => {
  if (!req.path.startsWith('/v1/') && !req.path.startsWith('/v2/')) {
    return res.redirect(301, `/api/v2${req.path}`);
  }
  next();
});
```

**V1 handler (preserved):**

```javascript
// routes/v1/pilots.js
router.get('/pilots/:id', authenticate, async (req, res, next) => {
  try {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    if (!pilot) {
      throw new AppError(404, 'not_found', 'Pilot not found');
    }
    
    res.json({
      id: pilot.id,
      name: `${pilot.first_name} ${pilot.last_name}`,
      email: pilot.email,
      license: pilot.license_number
    });
  } catch (err) {
    next(err);
  }
});
```

**V2 handler (new format):**

```javascript
// routes/v2/pilots.js
router.get('/pilots/:id', authenticate, async (req, res, next) => {
  try {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    if (!pilot) {
      throw new AppError(404, 'not_found', 'Pilot not found');
    }
    
    res.json({
      id: pilot.id,
      first_name: pilot.first_name,
      last_name: pilot.last_name,
      email: pilot.email,
      license_number: pilot.license_number,
      license_type: pilot.license_type,
      created_at: pilot.created_at,
      updated_at: pilot.updated_at
    });
  } catch (err) {
    next(err);
  }
});
```

**Deprecation middleware for v1:**

```javascript
// middleware/deprecation.js
function deprecationMiddleware(version, sunsetDate, migrationUrl) {
  return (req, res, next) => {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', sunsetDate);
    res.setHeader('Link', `<${migrationUrl}>; rel="successor-version"`);
    res.setHeader('Warning', `299 - "API ${version} is deprecated"`);
    
    // Log usage
    logger.warn({
      event: 'deprecated_api_usage',
      version: version,
      path: req.path,
      method: req.method,
      client_ip: req.ip
    });
    
    next();
  };
}

// Apply to v1 routes
app.use('/api/v1', deprecationMiddleware('v1', 'Sat, 01 Jan 2027 00:00:00 GMT', 'https://api.example.com/docs/migrate-v1-to-v2'));
```

### Migration Support

Provide tools to help clients migrate:

**Migration guide:**
```
# Migrating from v1 to v2

## Pilot Response Changes

### name field
v1: { "name": "John Doe" }
v2: { "first_name": "John", "last_name": "Doe" }

### license field
v1: { "license": "FAA-123456" }
v2: { "license_number": "FAA-123456", "license_type": "private" }

## New Fields in v2
- created_at: ISO 8601 timestamp
- updated_at: ISO 8601 timestamp
```

**Version comparison endpoint:**
```
GET /api/versions
Response:
{
  "versions": ["v1", "v2"],
  "latest": "v2",
  "deprecated": ["v1"],
  "sunset_dates": {
    "v1": "2027-01-01"
  }
}
```

**Compatibility mode:**
```
GET /api/v1/pilots/123?format=v2
Response (v2 format with v1 URL):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "license_number": "FAA-123456",
  "license_type": "private"
}
```

This allows clients to test the v2 format without changing their base URL.

## Versioning Decision Framework

When choosing a versioning strategy, consider these factors:

### Team Size and Expertise

Small teams with limited API consumers benefit from URL-based versioning. It is the simplest to implement, debug, and document. New developers can understand it immediately by looking at a URL.

Large teams with many API consumers may prefer header-based versioning. It keeps URLs clean and follows REST principles more closely. However, it requires more tooling (custom headers in documentation, API clients, and testing tools).

### Client Types

If your API is consumed by browsers, curl users, and diverse clients, URL-based versioning is the most accessible. Every HTTP client can set a URL. Not every HTTP client can set custom headers easily.

If your API is consumed primarily by server-side applications and mobile apps, header-based versioning works well. These clients can set custom headers programmatically.

### Caching Infrastructure

URL-based versioning is the easiest to cache. Different versions are different URLs, so CDN caches, browser caches, and reverse proxy caches all work automatically.

Header-based versioning requires cache keys that include the Accept header. This is possible with most caching infrastructure but requires explicit configuration.

### Documentation and Discoverability

URL-based versioning is the most discoverable. When a developer sees `/api/v1/pilots`, they know immediately which version they are using. Documentation can show version-specific examples with different URLs.

Header-based versioning is less discoverable. The version is hidden in a header that developers might not think to check.

### Migration Complexity

URL-based versioning requires clients to change their URLs when upgrading. This is a simple find-and-replace but touches every API call.

Header-based versioning requires clients to change their Accept header when upgrading. This is also simple but is a single change that applies to all endpoints.

## Version Lifecycle Management

### Version States

Every API version should have a defined lifecycle:

**Active.** The version is fully supported. All features are available. Bugs are fixed. Security patches are applied.

**Deprecated.** The version is still functional but is being phased out. No new features are added. Security patches are applied. Clients are encouraged to migrate.

**Sunset.** The version is no longer functional. Requests return 410 Gone. The version is removed from production.

### Version Documentation

Document each version's status:

```yaml
versions:
  v1:
    status: deprecated
    released: "2024-01-15"
    deprecated: "2026-01-15"
    sunset: "2027-01-01"
    migration_guide: "https://api.example.com/docs/migrate-v1-to-v2"
    
  v2:
    status: active
    released: "2026-01-15"
    features:
      - "Separate first_name and last_name fields"
      - "Added license_type field"
      - "Added created_at and updated_at timestamps"
```

### Version Coexistence

During the deprecation period, both versions must work simultaneously. This means:

**Same database, different representations.** Both versions read from the same database tables. The difference is only in how the data is formatted for the response.

**Shared middleware.** Authentication, rate limiting, and logging middleware are shared across versions. Only the response formatting differs.

**Independent error handling.** Each version may have different error response formats. V1 might return `{ "error": "not_found" }` while V2 returns `{ "error": "not_found", "message": "Pilot not found" }`.

**Testing both versions.** Every code change must be tested against both active versions. If a database migration changes a column name, the v1 handler must still map the old column name to the response format. If a new feature is added, decide whether it is available in both versions or only the latest.

**Documentation maintenance.** Both versions need accurate documentation. The v1 documentation should be marked as deprecated with a link to the v2 documentation. The v2 documentation should include a migration guide from v1.

### Version Metrics

Track version usage to inform deprecation decisions:

```javascript
const versionMetrics = {
  requests: new Counter({
    name: 'api_requests_total',
    help: 'Total API requests',
    labelNames: ['version', 'method', 'path', 'status']
  }),
  
  deprecatedUsage: new Gauge({
    name: 'api_deprecated_version_users',
    help: 'Number of unique users on deprecated versions',
    labelNames: ['version']
  })
};

// Middleware to track version usage
app.use('/api', (req, res, next) => {
  const version = req.path.match(/^\/v(\d+)\//)?.[1] || 'unknown';
  
  res.on('finish', () => {
    versionMetrics.requests.inc({
      version: version,
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode
    });
  });
  
  next();
});
```

Use these metrics to answer: "How many users are still on v1?" "Which endpoints are most used on the deprecated version?" "Is the migration progressing?" If v1 usage drops below 1% of total traffic, you can accelerate the sunset timeline.

## Real Scenario: Versioning a Flight Training API

Consider a flight training API with these endpoints:

```
GET    /api/v1/pilots              — List pilots
POST   /api/v1/pilots              — Create pilot
GET    /api/v1/pilots/:id          — Get pilot
PUT    /api/v1/pilots/:id          — Update pilot
DELETE /api/v1/pilots/:id          — Delete pilot
GET    /api/v1/aircraft            — List aircraft
GET    /api/v1/training-sessions   — List training sessions
POST   /api/v1/training-sessions   — Create training session
```

### The Breaking Change

The team wants to change the pilot response format. The current v1 format:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "license": "FAA-123456"
}
```

The new v2 format:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "license_number": "FAA-123456",
  "license_type": "private",
  "created_at": "2026-08-30T14:30:00Z",
  "updated_at": "2026-08-30T14:30:00Z"
}
```

### Implementation

**Router structure:**

```javascript
const v1Router = require('./routes/v1');
const v2Router = require('./routes/v2');

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// Redirect old URLs to versioned URLs
app.use('/api', (req, res, next) => {
  if (!req.path.startsWith('/v1/') && !req.path.startsWith('/v2/')) {
    return res.redirect(301, `/api/v2${req.path}`);
  }
  next();
});
```

**V1 handler (preserved):**

```javascript
// routes/v1/pilots.js
router.get('/pilots/:id', authenticate, async (req, res, next) => {
  try {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    if (!pilot) {
      throw new AppError(404, 'not_found', 'Pilot not found');
    }
    
    res.json({
      id: pilot.id,
      name: `${pilot.first_name} ${pilot.last_name}`,
      email: pilot.email,
      license: pilot.license_number
    });
  } catch (err) {
    next(err);
  }
});
```

**V2 handler (new format):**

```javascript
// routes/v2/pilots.js
router.get('/pilots/:id', authenticate, async (req, res, next) => {
  try {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    if (!pilot) {
      throw new AppError(404, 'not_found', 'Pilot not found');
    }
    
    res.json({
      id: pilot.id,
      first_name: pilot.first_name,
      last_name: pilot.last_name,
      email: pilot.email,
      license_number: pilot.license_number,
      license_type: pilot.license_type,
      created_at: pilot.created_at,
      updated_at: pilot.updated_at
    });
  } catch (err) {
    next(err);
  }
});
```

**Deprecation middleware for v1:**

```javascript
// middleware/deprecation.js
function deprecationMiddleware(version, sunsetDate, migrationUrl) {
  return (req, res, next) => {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', sunsetDate);
    res.setHeader('Link', `<${migrationUrl}>; rel="successor-version"`);
    res.setHeader('Warning', `299 - "API ${version} is deprecated"`);
    
    // Log usage
    logger.warn({
      event: 'deprecated_api_usage',
      version: version,
      path: req.path,
      method: req.method,
      client_ip: req.ip
    });
    
    next();
  };
}

// Apply to v1 routes
app.use('/api/v1', deprecationMiddleware('v1', 'Sat, 01 Jan 2027 00:00:00 GMT', 'https://api.example.com/docs/migrate-v1-to-v2'));
```

### Migration Support

Provide tools to help clients migrate:

**Migration guide:**
```
# Migrating from v1 to v2

## Pilot Response Changes

### name field
v1: { "name": "John Doe" }
v2: { "first_name": "John", "last_name": "Doe" }

### license field
v1: { "license": "FAA-123456" }
v2: { "license_number": "FAA-123456", "license_type": "private" }

## New Fields in v2
- created_at: ISO 8601 timestamp
- updated_at: ISO 8601 timestamp
```

**Version comparison endpoint:**
```
GET /api/versions
Response:
{
  "versions": ["v1", "v2"],
  "latest": "v2",
  "deprecated": ["v1"],
  "sunset_dates": {
    "v1": "2027-01-01"
  }
}
```

**Compatibility mode:**
```
GET /api/v1/pilots/123?format=v2
Response (v2 format with v1 URL):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "license_number": "FAA-123456",
  "license_type": "private"
}
```

This allows clients to test the v2 format without changing their base URL.

## Assessment

**Lab 1: Version Strategy** (35 minutes)

A flight training API has 3 versions (v1, v2, v3). Design a versioning strategy that handles: URL-based versioning for the current and next version, backward compatibility for the previous version, deprecation workflow for the oldest version, and version negotiation for clients that do not specify a version. Write the routing configuration and middleware.

Grading: 28 points. 7 points per correctly implemented concern.

**Lab 2: Backward Compatibility** (30 minutes)

Given this v1 response:
```json
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "license": "FAA-123456"
}
```

Design a v2 response that: splits name into first_name and last_name, adds a license_type field, adds created_at and updated_at timestamps, and maintains backward compatibility during a 6-month transition period. Show the v2 response, the transitional response (during the transition period), and the deprecation headers.

Grading: 24 points. 6 points per correctly designed response or header set.

**Lab 3: Deprecation Plan** (35 minutes)

Design a deprecation plan for retiring API v1 in 6 months. Include: announcement timeline (when to announce, when to start logging, when to start sending reminder emails, when to sunset), the deprecation headers to add, the monitoring strategy (how to track usage of the deprecated version), the communication plan (how to notify users), and the rollback plan (what to do if the sunset breaks critical integrations).

Grading: 28 points. 5 points for timeline, 5 points for headers, 5 points for monitoring, 5 points for communication, 8 points for rollback.

## Evidence

- Microsoft API Guidelines: github.com/microsoft/api-guidelines
- Stripe API Versioning: stripe.com/docs/api/versioning
- GitHub API Versioning: docs.github.com/en/rest/about-the-rest-api/api-versions
- Semantic Versioning: semver.org
- HTTP Link Header: RFC 8288 (datatracker.ietf.org/doc/html/rfc8288)
- Sunset Header: RFC 8594 (datatracker.ietf.org/doc/html/rfc8594)
- Deprecation Header: draft-ietf-httpapi-deprecation-header
