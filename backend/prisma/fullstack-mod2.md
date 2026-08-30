# Module 2 — Node.js and Express: Server Setup, Middleware, and Routing

## What You'll Actually Do

Build a production-ready HTTP server with Express. You'll structure routes cleanly, write middleware that actually works, and understand how the request lifecycle flows through your code. No boilerplate generators — you'll know what every line does.

---

## Project Structure

Start with a layout that scales:

```
project/
  src/
    routes/
      users.js
      posts.js
    middleware/
      auth.js
      errorHandler.js
    app.js
    server.js
  package.json
```

`app.js` configures Express. `server.js` starts it. This separation lets you import and test `app` without binding to a port.

---

## Setting Up Express

```javascript
// src/app.js
const express = require("express");
const morgan = require("morgan");

const app = express();

// Built-in middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler — must be last, must have 4 params
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
});

module.exports = app;
```

```javascript
// src/server.js
const app = require("./app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Routing That Scales

Don't put all routes in one file. Use `express.Router()`.

```javascript
// src/routes/users.js
const router = require("express").Router();
const { body, param, validationResult } = require("express-validator");

const users = new Map();
let nextId = 1;

router.get("/", (req, res) => {
  const { role } = req.query;
  let result = Array.from(users.values());
  if (role) result = result.filter((u) => u.role === role);
  res.json(result);
});

router.get("/:id", (req, res) => {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.post(
  "/",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("role").isIn(["student", "instructor", "admin"]),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = { id: String(nextId++), ...req.body };
    users.set(user.id, user);
    res.status(201).json(user);
  }
);

router.put("/:id", (req, res) => {
  if (!users.has(req.params.id)) {
    return res.status(404).json({ error: "User not found" });
  }
  const updated = { ...users.get(req.params.id), ...req.body };
  users.set(req.params.id, updated);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  if (!users.delete(req.params.id)) {
    return res.status(404).json({ error: "User not found" });
  }
  res.status(204).end();
});

module.exports = router;
```

---

## Writing Middleware That Matters

Middleware runs in order. Each function receives `req`, `res`, and `next`. Call `next()` to pass control forward, or send a response to stop the chain.

```javascript
// src/middleware/auth.js
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
```

```javascript
// Usage in routes
router.delete("/:id", requireAuth, requireRole("admin"), (req, res) => {
  // Only admins can delete
});
```

### Request logging middleware

```javascript
// src/middleware/requestLogger.js
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  next();
}
```

---

## Handling Errors Across Async Routes

Express doesn't catch async errors by default. Wrap async handlers:

```javascript
// src/middleware/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
router.get("/", asyncHandler(async (req, res) => {
  const users = await db.users.findMany();
  res.json(users);
}));
```

---

## Assessment

**Lab Task: Build a Course API (60 minutes)**

Build an Express API for managing courses:

1. **Routes:** `GET /courses`, `GET /courses/:id`, `POST /courses`, `PUT /courses/:id`, `DELETE /courses/:id`
2. **Validation:** Use `express-validator` to require `title` (string, 3-100 chars) and `description` (string, min 10 chars) on POST/PUT.
3. **Middleware:** Write a `requestLogger` that logs method, path, status, and duration. Write a `requireAuth` middleware (stub the JWT verify — just check for a header).
4. **Error handling:** Centralized error handler that returns structured JSON errors. Async routes wrapped with `asyncHandler`.
5. **Data:** In-memory store (Map or array). Seed with 3 courses on startup.

**Deliverables:** A complete project with `app.js`, `server.js`, routes, and middleware files. Include a `test.sh` or `curl` commands demonstrating each endpoint.

**Grading:**
- All 5 CRUD endpoints work: 30%
- Validation rejects bad input: 20%
- Middleware chain executes in correct order: 20%
- Error responses are structured and consistent: 20%
- Project is well-organized: 10%

---

## Evidence

Save your project files. Include the output of your test commands showing successful CRUD operations and validation errors. Note how middleware ordering affects request flow.
