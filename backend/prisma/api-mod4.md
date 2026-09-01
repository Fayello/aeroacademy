# Module 4 — Authorization

Authentication tells you who someone is. Authorization tells you what they can do. A pilot can view their own training records but not another pilot's. An instructor can grade flight sessions but not modify the aircraft registry. An administrator can do both. These distinctions are the domain of authorization.

This module covers the three main authorization models — Role-Based Access Control (RBAC), Attribute-Based Access Control (ABAC), and scope-based access — along with rate limiting as a form of abuse prevention. We will look at how to implement each model, where each model breaks down, and how to combine them for fine-grained access control in a real API.

## Role-Based Access Control (RBAC)

RBAC is the simplest authorization model. You assign each user a role, and each role grants a set of permissions. The role determines what the user can do.

### How RBAC Works

Define roles in your system:

```
pilot       → can read own profile, read own flight logs, read training sessions
instructor  → can read all pilots, grade flight sessions, view training analytics
admin       → can create pilots, manage aircraft, configure system settings
```

When a request arrives, the authorization middleware checks the user's role and compares it against the required permission for the endpoint:

```javascript
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'forbidden',
        message: `This operation requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

app.get('/api/v1/pilots', authenticate, requireRole(['instructor', 'admin']), listPilots);
app.post('/api/v1/aircraft', authenticate, requireRole(['admin']), createAircraft);
app.get('/api/v1/pilots/:id/flight-logs', authenticate, requireRole(['pilot', 'instructor', 'admin']), getFlightLogs);
```

### Where RBAC Works Well

RBAC is appropriate when:

**Permissions align with job functions.** If your organization has clear job titles with well-defined responsibilities, RBAC maps naturally. A pilot does pilot things. An instructor does instructor things. The boundaries are clear.

**The permission set is small.** If you have fewer than 20 distinct permissions, RBAC is manageable. You can visualize the entire permission matrix and reason about it easily.

**Role hierarchies are simple.** If an admin can do everything an instructor can do, and an instructor can do everything a pilot can do, you have a linear hierarchy. RBAC handles this well with role inheritance.

### Where RBAC Breaks Down

**Role explosion.** As your system grows, you need more and more roles. The pilot role can read their own data, but what about a pilot who is also a certified instructor? You need a `pilot-instructor` role. What about an instructor who also manages the maintenance schedule? A `maintenance-instructor` role. Soon you have dozens of roles, many of which overlap. This is the role explosion problem.

**Context matters.** RBAC does not handle context well. An instructor should be able to grade flight sessions at their own flight school, not at every flight school. A pilot should be able to view their own data, but a school administrator should be able to view all pilots at their school. RBAC requires either context-blind permissions (too permissive) or a new role for every context (role explosion).

**Data-level permissions.** RBAC works well for endpoint-level permissions ("can this user access `/api/v1/pilots`?"). It does not work well for data-level permissions ("can this user see pilot #456's data?"). The answer depends on the relationship between the requesting user and the data owner, which is a function of attributes, not roles.

### RBAC Implementation Patterns

**Flat roles.** Each user has exactly one role. The role determines all permissions. This is the simplest pattern but does not support users with multiple responsibilities.

```javascript
// Database schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('pilot', 'instructor', 'admin'))
);
```

**Role inheritance.** Roles can inherit permissions from other roles. An `instructor` role inherits all permissions of a `pilot` role, plus additional permissions.

```javascript
const roleHierarchy = {
  pilot: ['pilot:read', 'pilot:write', 'sessions:read'],
  instructor: ['instructor:read', 'instructor:write', 'sessions:grade', 'analytics:read'],
  admin: ['admin:read', 'admin:write', 'admin:delete']
};

// Instructor gets pilot permissions + instructor permissions
roleHierarchy.instructor = [
  ...roleHierarchy.pilot,
  ...roleHierarchy.instructor
];
```

**Multi-role assignments.** A user can have multiple roles. A user who is both a pilot and an instructor has both sets of permissions.

```javascript
// Database schema
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

// Check if user has any of the required roles
function hasAnyRole(user, roles) {
  return user.roles.some(r => roles.includes(r.name));
}
```

### Permission Matrices

A permission matrix maps roles to permissions. For a flight training API:

```
Permission              | Pilot | Instructor | Admin
------------------------|-------|------------|-------
read own profile        |  Yes  |    Yes     |  Yes
read own flight logs    |  Yes  |    Yes     |  Yes
read all pilots         |   No  |    Yes     |  Yes
grade flight sessions   |   No  |    Yes     |  Yes
manage aircraft         |   No  |     No     |  Yes
manage instructors      |   No  |     No     |  Yes
view analytics          |   No  |    Yes     |  Yes
configure system        |   No  |     No     |  Yes
```

This matrix is easy to understand and audit. When someone asks "can an instructor manage aircraft?", you look at the matrix and see "No." When a new feature is added, you add a row to the matrix and decide which roles get the permission.

## Attribute-Based Access Control (ABAC)

ABAC makes authorization decisions based on attributes of the user, the resource, the action, and the environment. Instead of asking "what role does this user have?", ABAC asks "given the attributes of this request, should access be granted?"

### How ABAC Works

Define policies as rules over attributes:

```
Policy: A pilot can read their own flight logs.
  Subject: user.id
  Resource: flight_log.pilot_id
  Action: read
  Condition: user.id == flight_log.pilot_id

Policy: An instructor can grade flight sessions at their school.
  Subject: user.role == instructor
  Resource: training_session.school_id
  Action: update
  Condition: user.school_id == training_session.school_id

Policy: An administrator can manage all resources at their school.
  Subject: user.role == admin
  Resource: *
  Action: *
  Condition: user.school_id == resource.school_id
```

The authorization engine evaluates all applicable policies and makes a decision based on the combination of attributes.

### ABAC in Practice

Here is how you might implement ABAC for a flight training API:

```javascript
function authorize(action, getResourceAttributes) {
  return async (req, res, next) => {
    const subject = {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.orgId,
      scopes: req.user.scope
    };
    
    const resource = getResourceAttributes(req);
    
    const allowed = evaluatePolicy(subject, action, resource, req.environment);
    
    if (!allowed) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
}

// Usage:
app.get('/api/v1/pilots/:id/flight-logs',
  authenticate,
  authorize('read', (req) => ({
    type: 'flight_log',
    pilotId: req.params.id,
    schoolId: req.pilot?.schoolId
  })),
  getFlightLogs
);
```

The `evaluatePolicy` function checks the subject's attributes against the resource's attributes. For the flight log example, it checks whether the user's ID matches the flight log's pilot ID (the user is viewing their own logs) or whether the user is an instructor/admin at the same school.

### Where ABAC Works Well

**Context-sensitive permissions.** ABAC excels when the same action should be allowed or denied based on context. "Can this instructor grade this flight session?" depends on whether the instructor and the student are at the same school. ABAC handles this naturally.

**Fine-grained data access.** ABAC can make decisions at the row level, not just the endpoint level. "Can user X see record Y?" is a question ABAC can answer.

**Policy flexibility.** Policies can encode complex business rules. "An instructor can only grade sessions that occurred within the last 30 days" is straightforward in ABAC but awkward in RBAC.

### Where ABAC Breaks Down

**Complexity.** ABAC is harder to implement and debug than RBAC. Policy evaluation is not always intuitive, and when access is denied, the user (and the developer) need to understand why.

**Performance.** Evaluating multiple policies against multiple attributes on every request adds overhead. If policies require database lookups to resolve resource attributes, the authorization check can become a bottleneck.

**Auditability.** When a user is denied access, you need to explain which policy denied it and why. This requires a policy decision log that records the subject attributes, resource attributes, action, and the specific policy that made the decision.

### ABAC Policy Languages

Several standardized policy languages exist for ABAC:

**XACML (eXtensible Access Control Markup Language).** An XML-based policy language with a standardized architecture (PDP, PIP, PAP, PEP). XACML is powerful but verbose. It is common in enterprise environments.

**Rego (Open Policy Agent).** A declarative policy language used by the Open Policy Agent (OPA). Rego policies are evaluated by a sidecar service that intercepts authorization decisions.

```rego
# Rego policy example
package authz

default allow = false

allow {
  input.method == "GET"
  input.path = ["pilots", pilot_id]
  input.user.id == pilot_id
}

allow {
  input.method == "GET"
  input.path = ["pilots", pilot_id]
  input.user.role == "instructor"
  input.user.schoolId == data.pilots[pilot_id].schoolId
}
```

**Cedar (AWS Cedar).** A policy language designed for ABAC in AWS environments. Cedar policies are concise and fast to evaluate.

## Scope-Based Access Control

Scope-based access is a model commonly used in OAuth 2.0. Instead of assigning roles, you assign scopes — fine-grained permissions that specify what the client is allowed to do.

### How Scopes Work

Each scope represents a specific permission:

```
pilot:read          → read pilot profiles
pilot:write         → create or update pilot profiles
sessions:read       → read training sessions
sessions:write      → create or update training sessions
sessions:grade      → grade flight sessions
aircraft:read       → read aircraft data
aircraft:write      → manage aircraft records
admin:read          → access administrative data
admin:write         → perform administrative actions
analytics:read      → access analytics data
```

When a client requests access, it specifies which scopes it needs:

```
GET /oauth/authorize?
  response_type=code&
  client_id=training_app&
  scope=sessions:read sessions:grade&
  redirect_uri=https://app.example.com/callback
```

The user sees the requested scopes and approves or denies them. If approved, the issued token contains only those scopes. The API checks the token's scopes before allowing access:

```javascript
function requireScope(scope) {
  return (req, res, next) => {
    const tokenScopes = req.user.scope.split(' ');
    if (!tokenScopes.includes(scope)) {
      return res.status(403).json({
        error: 'insufficient_scope',
        message: `Required scope: ${scope}`
      });
    }
    next();
  };
}

app.put('/api/v1/training-sessions/:id/grade',
  authenticate,
  requireScope('sessions:grade'),
  gradeSession
);
```

### Where Scopes Work Well

**Third-party access.** Scopes are the standard model for OAuth 2.0. When a third-party application requests access to your API, you let the user choose which scopes to grant. This follows the principle of least privilege — the application gets only the permissions it needs.

**API-driven systems.** Scopes map naturally to API endpoints. Each endpoint requires a specific scope, and the token's scopes determine which endpoints the client can access.

**Revocable access.** Scopes are part of the token. If you want to revoke access, you invalidate the token. The next request will fail, and the client must obtain a new token with the updated scopes.

### Where Scopes Fall Short

**Coarse granularity.** Standard scopes like `pilot:read` do not distinguish between reading your own data and reading someone else's data. You need additional logic to enforce data-level permissions.

**Token bloat.** If you need many fine-grained scopes, the token becomes large. A token with 20 scopes is larger than a token with 3 scopes, and the size affects network performance.

**Scope management complexity.** Managing which clients have which scopes becomes complex at scale. You need a system for requesting, approving, and revoking scopes.

## Rate Limiting

Rate limiting is a form of abuse prevention that restricts how many requests a client can make in a given time period. It is not strictly authorization (it does not control what a user can do, only how often), but it is an essential part of API access control.

### Why Rate Limiting Matters

Without rate limiting, a single misbehaving client can:
- Exhaust server resources, causing denial of service for other clients
- Generate excessive database load, degrading performance for everyone
- Run up costs in pay-per-use infrastructure (cloud compute, database reads)
- Abuse free-tier APIs by scraping all the data

### Rate Limiting Algorithms

**Fixed Window Counter.** The simplest algorithm. You define a window (e.g., 1 minute) and a limit (e.g., 100 requests). Each request increments a counter. If the counter exceeds the limit, the request is rejected.

```
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 42
X-Rate-Limit-Reset: 1693424060
```

The problem is the "boundary burst" — a client can make 100 requests at 11:59:59 and 100 more at 12:00:01, getting 200 requests in 2 seconds despite a limit of 100 per minute.

**Sliding Window Log.** Store the timestamp of every request. When a new request arrives, count the requests in the last N seconds. This eliminates the boundary burst but requires more memory (you store every request timestamp).

**Sliding Window Counter.** A hybrid approach that combines the current window's count with a weighted portion of the previous window's count. This approximates the sliding window without storing individual timestamps.

**Token Bucket.** The bucket fills with tokens at a fixed rate (e.g., 10 tokens per second). Each request consumes one token. If the bucket is empty, the request is rejected. This allows bursts (the bucket can accumulate tokens) while maintaining a long-term average rate.

**Leaky Bucket.** Requests enter a queue (the bucket) and are processed at a fixed rate. If the queue is full, new requests are rejected. This smooths out traffic but adds latency because requests wait in the queue.

### Implementing Rate Limiting

Rate limiting should happen at the API gateway or reverse proxy level, not in application code. This ensures the limit is enforced before the request reaches your application, preventing resource exhaustion.

The rate limit headers communicate the client's current status:

```
HTTP/1.1 200 OK
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 42
X-Rate-Limit-Reset: 1693424060
```

When the limit is exceeded:

```
HTTP/1.1 429 Too Many Requests
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 0
X-Rate-Limit-Reset: 1693424060
Retry-After: 30

{
  "error": "rate_limit_exceeded",
  "message": "You have exceeded 100 requests in the last 60 seconds",
  "retry_after": 30
}
```

### Multi-Tier Rate Limiting

Different clients have different limits. A free-tier user gets 100 requests per minute. A paid user gets 1,000. An enterprise customer gets 10,000. An internal service gets unlimited access.

Implement this with a tiered configuration:

```yaml
rate_limits:
  free:
    requests_per_minute: 100
    requests_per_day: 10000
  pro:
    requests_per_minute: 1000
    requests_per_day: 100000
  enterprise:
    requests_per_minute: 10000
    requests_per_day: 1000000
  internal:
    requests_per_minute: unlimited
    requests_per_day: unlimited
```

The tier is determined by the client's subscription plan (for OAuth clients) or their API key tier (for API key authentication).

### Rate Limiting Strategies

**Per-user limits.** Each user gets their own limit. This prevents one user from affecting others. But it does not prevent a user from creating multiple accounts to get multiple limits.

**Per-key limits.** Each API key gets its own limit. This is more granular than per-user limits because a single user might have multiple API keys for different applications.

**Per-endpoint limits.** Different endpoints have different limits. Expensive endpoints (like report generation) get lower limits. Cheap endpoints (like reading a single record) get higher limits.

**Global limits.** The API has a total request limit across all clients. This protects the infrastructure from overload even if individual clients are within their limits.

## Combining Authorization Models

In practice, most systems use a combination of RBAC, ABAC, and scopes. Each model handles a different aspect of authorization:

- **RBAC** for coarse-grained access (which endpoints can this role access?)
- **ABAC** for fine-grained access (can this user see this specific record?)
- **Scopes** for third-party access (which permissions did the user grant to this application?)

The implementation layers these checks:

```javascript
app.get('/api/v1/pilots/:id/flight-logs',
  authenticate,                          // Verify identity
  requireRole(['pilot', 'instructor', 'admin']),  // Coarse-grained (RBAC)
  requireScope('sessions:read'),         // Third-party permissions (Scopes)
  authorize('read', (req) => ({          // Fine-grained (ABAC)
    type: 'flight_log',
    pilotId: req.params.id,
    schoolId: req.user.schoolId
  })),
  getFlightLogs
);
```

Each layer adds a check. If any layer denies access, the request is rejected with the appropriate error (401 for authentication, 403 for authorization).

## Real Scenario: Fine-Grained Access Control for a Flight Training Platform

Consider a flight training platform with these user types:
- **Students** (pilots in training)
- **Instructors** (certified flight instructors)
- **School administrators** (manage the school's operations)
- **Platform administrators** (manage the overall platform)

The authorization requirements are:

1. Students can read their own profile, flight logs, and training sessions
2. Instructors can read all students at their school, grade flight sessions, and view training analytics
3. School administrators can manage all resources at their school (pilots, aircraft, sessions)
4. Platform administrators can manage all schools and all resources

This requires a combination of RBAC and ABAC:

**Roles:** student, instructor, school_admin, platform_admin

**Data-level rules (ABAC):**
- A student can access resources where `resource.student_id == user.id`
- An instructor can access resources where `resource.school_id == user.school_id`
- A school admin can access all resources at their school
- A platform admin can access everything

**Implementation with a policy engine:**

```javascript
const policies = [
  {
    name: 'student_own_data',
    effect: 'allow',
    subject: { role: 'student' },
    action: ['read'],
    resource: { type: 'self' },
    condition: (subject, resource) => resource.ownerId === subject.id
  },
  {
    name: 'instructor_school_read',
    effect: 'allow',
    subject: { role: 'instructor' },
    action: ['read'],
    resource: { schoolOwned: true },
    condition: (subject, resource) => resource.schoolId === subject.schoolId
  },
  {
    name: 'instructor_grade',
    effect: 'allow',
    subject: { role: 'instructor' },
    action: ['grade'],
    resource: { type: 'training_session' },
    condition: (subject, resource) => resource.schoolId === subject.schoolId
  },
  {
    name: 'school_admin_all',
    effect: 'allow',
    subject: { role: 'school_admin' },
    action: ['read', 'write', 'delete'],
    resource: { schoolOwned: true },
    condition: (subject, resource) => resource.schoolId === subject.schoolId
  },
  {
    name: 'platform_admin_all',
    effect: 'allow',
    subject: { role: 'platform_admin' },
    action: ['*'],
    resource: { type: '*' },
    condition: () => true
  }
];

function authorize(subject, action, resource) {
  for (const policy of policies) {
    if (matchesSubject(policy.subject, subject) &&
        policy.action.includes(action) &&
        matchesResource(policy.resource, resource) &&
        policy.condition(subject, resource)) {
      return policy.effect === 'allow';
    }
  }
  return false; // Default deny
}
```

### Protecting Endpoints

```javascript
// Student views their own flight logs
app.get('/api/v1/pilots/:id/flight-logs',
  authenticate,
  authorizeEndpoint({
    action: 'read',
    getResource: (req) => ({
      type: 'flight_log',
      ownerId: req.params.id,
      schoolId: req.user.schoolId
    }),
    error: 'You can only view your own flight logs'
  }),
  getFlightLogs
);

// Instructor grades a flight session
app.put('/api/v1/training-sessions/:id/grade',
  authenticate,
  authorizeEndpoint({
    action: 'grade',
    getResource: (req) => ({
      type: 'training_session',
      schoolId: req.session.schoolId
    }),
    error: 'You can only grade sessions at your school'
  }),
  gradeSession
);
```

### Audit Logging

Every authorization decision should be logged for security auditing:

```javascript
function logAuthDecision(subject, action, resource, allowed, reason) {
  auditLog.push({
    timestamp: new Date().toISOString(),
    userId: subject.id,
    userRole: subject.role,
    schoolId: subject.schoolId,
    action: action,
    resourceType: resource.type,
    resourceId: resource.id,
    allowed: allowed,
    reason: reason
  });
}
```

This log answers questions like: "Who tried to access pilot #456's data last Tuesday?" and "Why was the instructor denied access to grade this session?"

## Assessment

**Lab 1: RBAC Role Hierarchy** (30 minutes)

Design an RBAC system for a hospital management API with 5 user types: patient, nurse, doctor, department_head, and hospital_admin. Define the permissions for each role, the role hierarchy (which roles inherit from which), and identify at least 3 scenarios where pure RBAC is insufficient.

Grading: 25 points. 5 points per correctly defined role with appropriate permissions, 5 points for correct hierarchy, 10 points for identified limitations.

**Lab 2: ABAC Policy Design** (45 minutes)

Write 5 ABAC policies for a multi-tenant SaaS platform. Each policy must include subject attributes, resource attributes, action, and condition. Cover these scenarios:
1. Users can only access their own tenant's data
2. Managers can approve requests within their department
3. Read access is allowed during business hours only
4. Users with a security clearance of 3+ can access classified documents
5. Users cannot delete records older than 90 days

Grading: 35 points. 7 points per correctly defined policy.

**Lab 3: Rate Limiting Strategy** (30 minutes)

Design a rate limiting strategy for an API with three tiers: free (100 req/min), pro (1,000 req/min), and enterprise (10,000 req/min). Specify:
1. The algorithm you would use and why
2. The HTTP headers to include in every response
3. The response format when the limit is exceeded
4. How to handle burst traffic (e.g., a sudden spike from an enterprise client)
5. How to prevent one client from affecting others

Grading: 25 points. 5 points for algorithm choice, 5 points for headers, 5 points for error response, 5 points for burst handling, 5 points for isolation.

## Evidence

- RBAC: NIST SP 800-162 (Guide to Attribute Based Access Control)
- ABAC: NIST SP 800-162
- OAuth 2.0 scopes: RFC 6749 Section 3.3
- Rate limiting: RFC 6585 (429 Too Many Requests)
- Rate limiting algorithms: IETF draft-ietf-httpapi-ratelimit-headers
- Policy engines: Open Policy Agent (openpolicyagent.org)
- Attribute-based access control: Lam, S.S. et al. (2020). "A Survey of Attribute-Based Access Control." ACM Computing Surveys.
