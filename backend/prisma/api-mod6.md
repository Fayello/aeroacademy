# Module 6: Error Handling

Error handling is how your API communicates failure. A well-designed error response tells the client exactly what went wrong, why it went wrong, and what the client can do to fix it. A poorly designed error response leaks internal details, confuses the client, or gives no information at all.

This module covers error response design, error codes, error logging, and how to handle errors gracefully without leaking sensitive information.

## Why Error Handling Matters

Consider two error responses from the same API:

**Bad error response:**
```json
{
  "error": "Error: ER_DUP_ENTRY: Duplicate entry 'pilot@example.com' for key 'pilots_email_unique'\n    at Query.execute (/app/node_modules/mysql2/lib/commands/command.js:29:22)\n    at Connection._handlePacket (/app/node_modules/mysql2/lib/connection.js:470:32)"
}
```

This response exposes the database schema (table name `pilots`, column `email`), the database driver (mysql2), the application path (`/app/node_modules/`), and internal error codes (`ER_DUP_ENTRY`). An attacker can use this information to craft targeted attacks.

**Good error response:**
```json
{
  "error": "conflict",
  "message": "A pilot with this email already exists",
  "field": "email",
  "request_id": "req_abc123"
}
```

This response tells the client exactly what happened (the email is already taken), which field caused the problem, and provides a reference ID for debugging. It exposes nothing about the internal implementation.

## Error Response Structure

Every error response from your API should follow the same structure. Consistency lets clients handle errors programmatically.

### The Standard Error Object

```json
{
  "error": "validation_error",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_format"
    }
  ],
  "request_id": "req_abc123def456"
}
```

**Fields:**

`error`: A machine-readable error code. This is the primary field clients use to handle errors programmatically. Use snake_case: `not_found`, `validation_error`, `rate_limit_exceeded`, `unauthorized`.

`message`: A human-readable description of what went wrong. This is for developers debugging the issue. Keep it clear and specific.

`details`: An array of additional error information. Use this for validation errors, where multiple fields may have issues.

`request_id`: A unique identifier for the request. Clients can provide this to support when debugging.

### HTTP Status Codes

The HTTP status code communicates the category of error:

**2xx: Success:**
- `200 OK`: Request succeeded
- `201 Created`: Resource created
- `204 No Content`: Request succeeded, no response body (for DELETE)

**4xx: Client Error:**
- `400 Bad Request`: Malformed request, invalid JSON, missing required fields
- `401 Unauthorized`: Missing or invalid authentication credentials
- `403 Forbidden`: Authenticated but not authorized for this action
- `404 Not Found`: Resource does not exist
- `409 Conflict`: Conflict with current state (duplicate email, concurrent modification)
- `422 Unprocessable Entity`: Valid JSON but semantically incorrect (business rule violation)
- `429 Too Many Requests`: Rate limit exceeded

**5xx: Server Error:**
- `500 Internal Server Error`: Unexpected server failure
- `502 Bad Gateway`: Upstream service unavailable
- `503 Service Unavailable`: Server temporarily unavailable (maintenance, overload)

### Choosing Between 400, 422, and 500

The distinction between 400, 422, and 500 confuses many developers.

**400 Bad Request**: The request is structurally invalid. The JSON is malformed, a required field is missing, or a field has the wrong type. The client can fix this by correcting the request structure.

**422 Unprocessable Entity**: The request is structurally valid (correct JSON, correct types) but semantically invalid. The date is in the past, the email is already taken, the user is not old enough. The client can fix this by changing the field values, not the structure.

**500 Internal Server Error**: The server failed to process a valid request. The database is down, a third-party service is unavailable, or there is a bug in the server code. The client cannot fix this.

```
// 400: Structure is wrong
{ "email": 12345 }  // email should be a string

// 422: Structure is correct, values are wrong
{ "email": "not-an-email" }  // valid string, invalid email

// 500: Request is fine, server broke
{ "email": "valid@example.com" }  // valid, but database is down
```

## Error Code Taxonomy

Define a consistent set of error codes for your API. Here is a taxonomy for a flight training API:

### Authentication Errors

```
missing_token        : Authorization header is missing
invalid_token        : Token is malformed or expired
token_expired        : Token has expired
invalid_credentials  : Email/password combination is incorrect
account_locked       : Account has been locked due to too many failed attempts
email_not_verified   : Email address has not been verified
```

### Authorization Errors

```
forbidden            : User does not have permission for this action
insufficient_scope   : Token does not include the required scope
not_your_resource    : User is trying to access another user's resource
school_accessDenied  : User does not belong to this school
```

### Validation Errors

```
validation_error     : Request body failed validation
invalid_format       : Field value does not match expected format
value_too_long       : String exceeds maximum length
value_too_short      : String is below minimum length
value_out_of_range   : Number is outside allowed range
required_field       : Required field is missing
duplicate_entry      : Unique constraint violation
```

### Resource Errors

```
not_found            : Resource does not exist
already_exists       : Resource already exists
gone                 : Resource has been permanently deleted
conflict             : Conflict with current state
```

### Rate Limiting Errors

```
rate_limit_exceeded  : Too many requests
daily_limit_exceeded : Daily quota exceeded
monthly_limit_exceeded: Monthly quota exceeded
```

### Server Errors

```
internal_error       : Unexpected server failure
service_unavailable  : Upstream service is unavailable
database_error       : Database operation failed
timeout              : Request processing timed out
```

## Implementation

### Centralized Error Handler

Do not handle errors in every route handler. Create a centralized error handler that processes all errors:

```javascript
class AppError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

// Usage in route handlers:
app.post('/api/v1/pilots', async (req, res, next) => {
  try {
    const existing = await db.pilots.findOne({ email: req.body.email });
    if (existing) {
      throw new AppError(409, 'duplicate_entry', 'A pilot with this email already exists', [
        { field: 'email', message: 'Email is already registered' }
      ]);
    }
    
    const pilot = await db.pilots.create(req.body);
    res.status(201).json(pilot);
  } catch (err) {
    next(err);
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  // Log the error
  logger.error({
    request_id: req.requestId,
    error: err.code || 'internal_error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    user_id: req.user?.id
  });
  
  // Determine status code
  const status = err.status || 500;
  const code = err.code || 'internal_error';
  const message = err.isOperational ? err.message : 'An unexpected error occurred';
  const details = err.details || [];
  
  res.status(status).json({
    error: code,
    message: message,
    details: details,
    request_id: req.requestId
  });
});
```

### Error Handling Patterns

**Try-catch with async/await:**

```javascript
app.get('/api/v1/pilots/:id', async (req, res, next) => {
  try {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    if (!pilot) {
      throw new AppError(404, 'not_found', 'Pilot not found');
    }
    res.json(pilot);
  } catch (err) {
    next(err);
  }
});
```

**Promise rejection handling:**

```javascript
app.post('/api/v1/pilots', async (req, res, next) => {
  const pilot = await db.pilots.create(req.body).catch(err => {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'duplicate_entry', 'A pilot with this email already exists');
    }
    throw err;
  });
  
  res.status(201).json(pilot);
});
```

**Error middleware chain:**

```javascript
// Validation middleware throws AppError
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(new AppError(400, 'validation_error', 'Request validation failed', 
        err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      ));
    }
  };
}

// Auth middleware throws AppError
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return next(new AppError(401, 'missing_token', 'Authorization token is required'));
  }
  
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(new AppError(401, 'invalid_token', 'Token is invalid or expired'));
  }
}
```

## Logging Errors

Error logging is essential for debugging and monitoring. Every error should be logged with enough context to diagnose the problem.

### What to Log

**Request context:**
- Request ID
- HTTP method and path
- Client IP
- User ID (if authenticated)
- Request body (sanitized)

**Error context:**
- Error code
- Error message
- Stack trace (in development)
- Affected resource (if applicable)

**Timing:**
- Timestamp
- Request duration

```javascript
function logError(err, req) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    request_id: req.requestId,
    level: err.status >= 500 ? 'error' : 'warn',
    error: {
      code: err.code || 'internal_error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      client_ip: req.ip,
      user_id: req.user?.id,
      body: sanitizeBody(req.body)
    },
    duration_ms: Date.now() - req.startTime
  };
  
  logger[logEntry.level](logEntry);
}

function sanitizeBody(body) {
  if (!body) return undefined;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'password_confirm', 'token', 'secret'];
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Truncate large fields
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string' && value.length > 1000) {
      sanitized[key] = value.substring(0, 1000) + '... [TRUNCATED]';
    }
  }
  
  return sanitized;
}
```

### Error Aggregation

Aggregate errors to identify patterns. If a specific endpoint starts returning 500 errors, you need to know about it:

```javascript
const errorCounts = {};

function trackError(code, path) {
  const key = `${code}:${path}`;
  errorCounts[key] = (errorCounts[key] || 0) + 1;
  
  // Alert if error rate is too high
  if (errorCounts[key] > 10) {
    alertOpsTeam({
      alert: 'high_error_rate',
      error_code: code,
      path: path,
      count: errorCounts[key]
    });
    errorCounts[key] = 0; // Reset after alert
  }
}
```

## Common Error Scenarios

### Not Found

When a resource does not exist, return 404 with a specific message:

```javascript
app.get('/api/v1/pilots/:id', async (req, res, next) => {
  try {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    
    if (!pilot) {
      throw new AppError(404, 'not_found', `Pilot with ID ${req.params.id} not found`);
    }
    
    res.json(pilot);
  } catch (err) {
    next(err);
  }
});
```

### Conflict

When a request conflicts with the current state:

```javascript
app.post('/api/v1/pilots', async (req, res, next) => {
  try {
    const existing = await db.pilots.findOne({ email: req.body.email });
    
    if (existing) {
      throw new AppError(409, 'duplicate_entry', 'A pilot with this email already exists', [
        { field: 'email', message: 'Email is already registered' }
      ]);
    }
    
    const pilot = await db.pilots.create(req.body);
    res.status(201).json(pilot);
  } catch (err) {
    next(err);
  }
});
```

### Concurrent Modification

When two clients modify the same resource simultaneously:

```javascript
app.put('/api/v1/pilots/:id', async (req, res, next) => {
  try {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    
    if (!pilot) {
      throw new AppError(404, 'not_found', 'Pilot not found');
    }
    
    if (req.body.version && req.body.version !== pilot.version) {
      throw new AppError(409, 'conflict', 'Resource has been modified by another user', [
        { field: 'version', message: 'Resource was modified since you last loaded it' }
      ]);
    }
    
    const updated = await db.pilots.update(req.params.id, {
      ...req.body,
      version: pilot.version + 1
    });
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
```

### Rate Limiting

When a client exceeds the rate limit:

```javascript
function rateLimiter(options) {
  const { windowMs, max, message } = options;
  const hits = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    const clientHits = hits.get(key) || [];
    const recentHits = clientHits.filter(time => time > windowStart);
    
    if (recentHits.length >= max) {
      const resetTime = Math.ceil((recentHits[0] + windowMs) / 1000);
      
      res.setHeader('X-Rate-Limit-Limit', max);
      res.setHeader('X-Rate-Limit-Remaining', 0);
      res.setHeader('X-Rate-Limit-Reset', resetTime);
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      
      throw new AppError(429, 'rate_limit_exceeded', message || 'Too many requests');
    }
    
    recentHits.push(now);
    hits.set(key, recentHits);
    
    res.setHeader('X-Rate-Limit-Limit', max);
    res.setHeader('X-Rate-Limit-Remaining', max - recentHits.length);
    res.setHeader('X-Rate-Limit-Reset', Math.ceil((windowStart + windowMs) / 1000));
    
    next();
  };
}
```

### Authentication Failure

```javascript
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next(new AppError(401, 'missing_token', 'Authorization header is required'));
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new AppError(401, 'invalid_token', 'Authorization header must be: Bearer <token>'));
  }
  
  try {
    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'token_expired', 'Token has expired'));
    }
    return next(new AppError(401, 'invalid_token', 'Token is invalid'));
  }
}
```

## Avoiding Information Leakage

Never expose internal details in error responses. Here are common leaks and how to prevent them.

### Database Errors

```
// BAD: Exposes database details
{
  "error": "ER_DUP_ENTRY: Duplicate entry 'test@example.com' for key 'pilots_email_unique'"
}

// GOOD: Sanitized message
{
  "error": "duplicate_entry",
  "message": "A record with this value already exists"
}
```

### Stack Traces

```
// BAD: Exposes application paths and dependencies
{
  "stack": "Error at /app/src/routes/pilots.js:42:15\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)"
}

// GOOD: No stack trace in production
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "request_id": "req_abc123"
}
```

### Internal IDs

```
// BAD: Exposes database primary keys
{
  "error": "not_found",
  "message": "Pilot with ID 8472 not found"
}

// GOOD: Use UUIDs, never sequential IDs
{
  "error": "not_found",
  "message": "Pilot not found"
}
```

### Version Information

```
// BAD: Exposes software versions
{
  "error": "Server Error",
  "message": "nginx/1.18.0"
}

// GOOD: Generic message
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

## Real Scenario: Error Handling for a Flight Training Platform

Consider a training session creation endpoint. The endpoint can fail in multiple ways:

```javascript
app.post('/api/v1/training-sessions',
  authenticate,
  validateBody(createSessionSchema),
  async (req, res, next) => {
    try {
      // Check student exists
      const student = await db.pilots.findOne({ 
        id: req.body.student_id, 
        status: 'active' 
      });
      
      if (!student) {
        throw new AppError(404, 'not_found', 'Student not found', [
          { field: 'student_id', message: 'No active pilot with this ID' }
        ]);
      }
      
      // Check instructor exists and is certified
      const instructor = await db.pilots.findOne({ 
        id: req.body.instructor_id, 
        role: 'instructor',
        status: 'active'
      });
      
      if (!instructor) {
        throw new AppError(404, 'not_found', 'Instructor not found', [
          { field: 'instructor_id', message: 'No active instructor with this ID' }
        ]);
      }
      
      // Check aircraft exists and is available
      const aircraft = await db.aircraft.findOne({ 
        id: req.body.aircraft_id,
        status: 'available'
      });
      
      if (!aircraft) {
        throw new AppError(404, 'not_found', 'Aircraft not found', [
          { field: 'aircraft_id', message: 'No available aircraft with this ID' }
        ]);
      }
      
      // Check for scheduling conflicts
      const conflicts = await db.training_sessions.findMany({
        where: {
          OR: [
            { instructor_id: req.body.instructor_id },
            { student_id: req.body.student_id },
            { aircraft_id: req.body.aircraft_id }
          ],
          status: { not: 'cancelled' },
          start_time: { lt: new Date(req.body.end_time) },
          end_time: { gt: new Date(req.body.start_time) }
        }
      });
      
      if (conflicts.length > 0) {
        throw new AppError(409, 'conflict', 'Scheduling conflict detected', [
          { field: 'schedule', message: 'Time slot is not available' }
        ]);
      }
      
      // Create the session
      const session = await db.training_sessions.create({
        ...req.body,
        instructor_id: instructor.id,
        student_id: student.id,
        aircraft_id: aircraft.id,
        created_by: req.user.id
      });
      
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  }
);
```

This endpoint handles every possible failure mode with a specific, actionable error message. The client knows exactly what went wrong and can fix the request accordingly.

## Error Handling Patterns for Common Scenarios

### Database Connection Errors

When the database is unavailable, return a generic error without exposing connection details:

```javascript
async function withDbRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.code === 'ECONNREFUSED' && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw new AppError(500, 'database_error', 'Database service is temporarily unavailable');
    }
  }
}

// Usage
app.get('/api/v1/pilots', async (req, res, next) => {
  try {
    const pilots = await withDbRetry(() => db.pilots.findMany());
    res.json(pilots);
  } catch (err) {
    next(err);
  }
});
```

### Third-Party Service Errors

When a third-party service fails, return a clear error without exposing the service name:

```javascript
async function sendWelcomeEmail(email, name) {
  try {
    await emailService.send({
      to: email,
      subject: 'Welcome to Flight Training Academy',
      template: 'welcome',
      data: { name }
    });
  } catch (err) {
    // Log the actual error for debugging
    logger.error({
      event: 'email_service_error',
      error: err.message,
      email: email
    });
    
    // Return generic error to the client
    throw new AppError(502, 'email_service_error', 'Failed to send welcome email');
  }
}
```

### Timeout Errors

Handle slow operations gracefully:

```javascript
function withTimeout(promise, ms, errorMessage) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new AppError(408, 'timeout', errorMessage || 'Request timed out'));
    }, ms);
  });
  
  return Promise.race([promise, timeout]);
}

// Usage
app.get('/api/v1/reports/generate', async (req, res, next) => {
  try {
    const report = await withTimeout(
      generateReport(req.query),
      30000,
      'Report generation timed out. Please try with a smaller date range.'
    );
    
    res.json(report);
  } catch (err) {
    next(err);
  }
});
```

### Concurrent Modification Errors

Handle race conditions when multiple users modify the same resource:

```javascript
app.put('/api/v1/pilots/:id', async (req, res, next) => {
  try {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    
    if (!pilot) {
      throw new AppError(404, 'not_found', 'Pilot not found');
    }
    
    // Optimistic locking
    if (req.body.version && req.body.version !== pilot.version) {
      throw new AppError(409, 'conflict', 'Resource was modified by another user', [
        { field: 'version', message: 'Please refresh and try again' }
      ]);
    }
    
    const updated = await db.pilots.update({
      where: { id: req.params.id, version: pilot.version },
      data: { ...req.body, version: pilot.version + 1 }
    });
    
    if (!updated) {
      throw new AppError(409, 'conflict', 'Resource was modified by another user');
    }
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
```

### Circuit Breaker Pattern

Prevent cascading failures when a service is down:

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.failures = 0;
    this.state = 'closed';
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new AppError(503, 'service_unavailable', 'Service is temporarily unavailable');
      }
      this.state = 'half-open';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}

// Usage
const emailBreaker = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 30000 });

app.post('/api/v1/pilots', async (req, res, next) => {
  try {
    const pilot = await db.pilots.create(req.body);
    
    await emailBreaker.execute(() => sendWelcomeEmail(pilot.email, pilot.first_name));
    
    res.status(201).json(pilot);
  } catch (err) {
    if (err.code === 'service_unavailable') {
      // Email failed, but pilot was created
      logger.warn({ event: 'email_circuit_open', pilot_id: pilot.id });
      res.status(201).json({
        ...pilot,
        _warning: 'Welcome email will be sent later'
      });
    } else {
      next(err);
    }
  }
});
```

### Graceful Degradation

When a non-critical service fails, continue with reduced functionality:

```javascript
app.get('/api/v1/pilots/:id', async (req, res, next) => {
  try {
    const pilot = await db.pilots.findOne({ id: req.params.id });
    
    if (!pilot) {
      throw new AppError(404, 'not_found', 'Pilot not found');
    }
    
    // Try to get certification status, but don't fail if service is down
    let certificationStatus = null;
    try {
      certificationStatus = await certificationService.getStatus(pilot.id);
    } catch (err) {
      logger.warn({ event: 'certification_service_degraded', pilot_id: pilot.id });
    }
    
    res.json({
      ...pilot,
      certification_status: certificationStatus || 'unknown',
      _degraded: !certificationStatus
    });
  } catch (err) {
    next(err);
  }
});
```

## Error Recovery Strategies

### Retry with Exponential Backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      
      const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Fallback Values

```javascript
async function getPilotWithFallback(id) {
  try {
    return await db.pilots.findOne({ id });
  } catch (err) {
    logger.error({ event: 'db_query_failed', pilot_id: id, error: err.message });
    
    // Return cached version if available
    const cached = await redis.get(`pilot:${id}`);
    if (cached) {
      return { ...JSON.parse(cached), _from_cache: true };
    }
    
    throw new AppError(500, 'database_error', 'Unable to retrieve pilot data');
  }
}
```

### Error Aggregation for Batch Operations

```javascript
async function batchCreatePilots(items) {
  const results = [];
  const errors = [];
  
  for (let i = 0; i < items.length; i++) {
    try {
      const pilot = await db.pilots.create(items[i]);
      results.push({ index: i, status: 'success', data: pilot });
    } catch (err) {
      errors.push({ index: i, status: 'error', error: err.message });
    }
  }
  
  return {
    successful: results.length,
    failed: errors.length,
    results: results,
    errors: errors
  };
}
```

## Assessment

**Lab 1: Error Response Design** (35 minutes)

Design error responses for these scenarios: validation error with 3 field errors, authentication failure (expired token), authorization failure (wrong school), resource not found, rate limit exceeded, and server error. For each, specify the HTTP status code, error code, message, and any additional fields.

Grading: 30 points. 5 points per correctly designed error response.

**Lab 2: Centralized Error Handler** (40 minutes)

Implement a centralized error handler for a Node.js/Express API that: catches all errors, logs them with request context, returns consistent error responses, differentiates between operational and programmer errors, and handles async errors. Write the complete middleware code.

Grading: 32 points. 8 points per correctly implemented feature.

**Lab 3: Security Audit** (25 minutes)

Review these 5 error responses and identify what information they leak:
1. `"error": "ER_DUP_ENTRY: Duplicate entry 'x' for key 'users_email_unique'"`
2. `"stack": "Error at /app/src/auth.js:42:15"`
3. `"error": "User 8472 not found"`
4. `"message": "Invalid password for user admin@example.com"`
5. `"error": "PostgreSQL 14.2 error at line 42"`

Grading: 20 points. 4 points per correctly identified leak and its remediation.

## Evidence

- RFC 7231 (HTTP/1.1 Semantics): datatracker.ietf.org/doc/html/rfc7231
- RFC 7807 (Problem Details): datatracker.ietf.org/doc/html/rfc7807
- OWASP Error Handling: owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/08-Testing_for_Error_Handling
- AppError pattern: Based on common Node.js error handling patterns
- Error logging best practices: based on 12-factor app methodology
