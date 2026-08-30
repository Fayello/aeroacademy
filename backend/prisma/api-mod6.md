# Module 6 — Error Handling: Consistent Errors and Security

## What You'll Actually Do

Build an error handling system that gives clients useful information without leaking your internals. You'll create structured error responses, handle unexpected failures gracefully, and make sure stack traces never reach the outside world.

---

## The Problem With Default Error Handling

Most frameworks dump stack traces and internal details on errors. That's a gift to attackers — they learn your file structure, library versions, and code patterns.

```javascript
// Express default: dumps everything
app.use((err, req, res, next) => {
  res.status(500).json({
    message: err.message,
    stack: err.stack, // NEVER expose this
  });
});
```

---

## Structured Error Classes

Create a hierarchy of application errors with HTTP status codes and error codes.

```javascript
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // expected error, not a bug
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(details) {
    super('Validation failed', 422, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}
```

---

## The Error Handler

One place that handles all errors consistently. Log the details internally, return a clean response to the client.

```javascript
function errorHandler(err, req, res, next) {
  // Operational errors: we expected these, send clean response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Unexpected errors: log everything, send generic response
  console.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    requestId: req.headers['x-request-id'],
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
}

app.use(errorHandler);
```

---

## Using Error Classes in Route Handlers

```javascript
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError([{ field: 'id', message: 'Must be a number' }]);
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    res.json({ data: user });
  } catch (err) {
    next(err); // pass to error handler
  }
});

app.post('/api/users', async (req, res, next) => {
  try {
    const existing = await db.user.findUnique({ where: { email: req.body.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const user = await db.user.create({ data: req.body });
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
});
```

---

## Async Error Catching

Wrapping every handler in try/catch is tedious. Use a wrapper function.

```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Now handlers don't need try/catch
app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await db.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) throw new NotFoundError('User');
  res.json({ data: user });
}));

app.post('/api/users', asyncHandler(async (req, res) => {
  const user = await db.user.create({ data: req.body });
  res.status(201).json({ data: user });
}));
```

---

## Error Logging

Log errors with enough context to debug, but never log sensitive data.

```javascript
function logError(err, req) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    requestId: req.headers['x-request-id'],
  };

  if (!err.isOperational) {
    entry.stack = err.stack;
  }

  // NEVER log: passwords, tokens, API keys, PII
  console.log(JSON.stringify(entry));
}
```

---

## Common Security Mistakes in Error Responses

```
DON'T include:                    DO include:
- Stack traces                    - Error code (machine-readable)
- SQL query errors                - Human-readable message
- File paths                      - Field-level validation details
- Library versions                - Request ID for correlation
- Internal IP addresses
- Database schema info
```

```javascript
// BAD: leaks SQL error
catch (err) {
  res.status(500).json({ error: err.message });
  // "relation 'userss' does not exist" → attacker knows table names
}

// GOOD: generic message, detail in logs
catch (err) {
  console.error('Database error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
```

---

## Assessment

**Lab Task: Build an Error Handling System (45 minutes)**

Build an API with comprehensive error handling:

1. Create error classes for: not found, validation, auth, forbidden, conflict
2. Implement a global error handler that returns structured JSON
3. Use async handler wrapper on all routes
4. Add request IDs (generate if not provided, include in all responses and error logs)
5. Write a test script that triggers each error type and verifies the response format
6. Ensure stack traces never appear in responses

**Deliverables:** `error-api.js` with error classes and handler, `test-errors.sh` script, `errors.log` showing structured log output.

**Grading:**
- All error classes return correct status codes and codes: 30%
- Error handler logs details internally but returns clean responses: 25%
- Request IDs appear in all responses and logs: 20%
- Test script validates all error scenarios: 15%
- No sensitive data leaks in any response: 10%

---

## Evidence

Screenshot the test script output for each error type. Include the errors.log showing structured log entries with request IDs. Show a side-by-side comparison of what the client sees vs what gets logged.
