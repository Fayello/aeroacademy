# Module 9 — Security: XSS, CSRF, Injection, and Hardening

## What You'll Actually Do

Harden a Node.js application against real attacks. You'll prevent injection by parameterizing queries, stop XSS by sanitizing output, block CSRF with tokens, and lock down a production server. Every technique here maps to a real vulnerability class.

---

## SQL Injection — Still Alive in 2026

Never concatenate user input into queries. Always use parameterized queries.

```javascript
// VULNERABLE — never do this
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Attack: email = "'; DROP TABLE users; --"

// SAFE — parameterized query
const result = await db.query(
  "SELECT * FROM users WHERE email = $1",
  [email]
);

// SAFE — even with dynamic conditions
function buildUserQuery(filters) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (filters.email) {
    conditions.push(`email = $${paramIndex++}`);
    params.push(filters.email);
  }
  if (filters.role) {
    conditions.push(`role = $${paramIndex++}`);
    params.push(filters.role);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { text: `SELECT * FROM users ${where}`, params };
}
```

### NoSQL Injection (MongoDB)

```javascript
// VULNERABLE
const user = await db.collection("users").findOne({ email: req.body.email });
// Attack: email = { "$gt": "" } — matches any document

// SAFE — validate types
const user = await db.collection("users").findOne({
  email: { $type: "string", $eq: req.body.email },
});

// Even better — validate before querying
function validateEmail(email) {
  if (typeof email !== "string") throw new Error("Invalid email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email format");
  }
  return email.toLowerCase();
}
```

---

## Cross-Site Scripting (XSS)

XSS happens when untrusted data enters HTML, JavaScript, or URLs without sanitization.

```javascript
const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

function sanitize(dirty) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href"],
  });
}

// Usage
app.post("/api/comments", (req, res) => {
  const clean = sanitize(req.body.content);
  // Store clean in database
});
```

### Content Security Policy

```javascript
const helmet = require("helmet");

app.use(helmet());

// Or customize:
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  })
);
```

---

## Cross-Site Request Forgery (CSRF)

CSRF tricks a logged-in user's browser into making unwanted requests.

```javascript
const crypto = require("crypto");

// Simple token-based CSRF protection
function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Middleware: set token in cookie, verify on mutations
function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    // Set new token for state-changing requests
    const token = generateCsrfToken();
    res.cookie("csrf-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    return next();
  }

  // Verify token on mutations
  const cookieToken = req.cookies["csrf-token"];
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next();
}

app.use(csrfProtection);
```

---

## Security Headers

```javascript
const helmet = require("helmet");

app.use(helmet());

// Additional headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
```

---

## Input Validation and Sanitization

```javascript
const { body, param, query, validationResult } = require("express-validator");
const xss = require("xss");

// Sanitize before validation
const sanitizeInput = (value) => xss(value);

// Validation rules
const createCourseRules = [
  body("title")
    .trim()
    .custom(sanitizeInput)
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be 3-100 characters"),
  body("description")
    .trim()
    .custom(sanitizeInput)
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be 10-2000 characters"),
  body("difficulty")
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty level"),
];

app.post("/api/courses", createCourseRules, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process valid input
});
```

---

## Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts" },
  skipSuccessfulRequests: true,
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
```

---

## Secrets Management

```javascript
// NEVER do this
const API_KEY = "sk-1234567890abcdef"; // in source code
process.env.API_KEY = "hardcoded"; // in code

// DO this
// .env file (gitignored)
API_KEY=sk-real-key-here

// Validate on startup
const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "API_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}
```

---

## Assessment

**Lab Task: Harden an Express API (60 minutes)**

Take an existing API and apply security hardening:

1. **Input validation:** Add `express-validator` rules to all POST/PUT endpoints. Sanitize all string inputs with `xss`.
2. **SQL injection prevention:** Ensure all database queries use parameterized queries. Find and fix any string concatenation.
3. **Security headers:** Add `helmet` with a custom CSP policy.
4. **Rate limiting:** Add rate limiting to the API (100 req/15min) and stricter limits to auth endpoints (5 req/15min).
5. **CSRF protection:** Implement CSRF tokens for state-changing requests.
6. **Error handling:** Ensure error responses don't leak stack traces or internal details.
7. **Dependency audit:** Run `npm audit` and fix any high/critical vulnerabilities.

**Deliverables:** Updated API with all security measures. A `SECURITY.md` documenting what was done and why.

**Grading:**
- Input validation on all endpoints: 20%
- No injection vulnerabilities: 20%
- Security headers configured: 15%
- Rate limiting works: 15%
- CSRF protection implemented: 15%
- Error handling is secure: 15%

---

## Evidence

Save your hardened code and SECURITY.md. Include the output of `npm audit` before and after fixes. Show a curl command that gets blocked by rate limiting. Document one vulnerability you found and how you fixed it.
