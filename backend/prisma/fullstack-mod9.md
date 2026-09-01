# Module 9 — Security

Security is not a feature. It is a requirement. Every web application is a target, and the most common attacks are the simplest ones. This module covers XSS prevention, CSRF protection, input validation, and how to harden an Express application against real attacks.

## Why Security Matters

The OWASP Top 10 lists the most critical web application security risks. The same vulnerabilities appear year after year: injection, broken authentication, cross-site scripting, insecure deserialization. These are not exotic attacks — they are simple mistakes that any developer can prevent with the right knowledge.

A security breach is not just a technical problem. It destroys user trust, violates regulations, and can put people at risk. The cost of prevention is a fraction of the cost of remediation.

Security in web applications follows the principle of defense in depth. No single security measure is perfect, so you layer multiple defenses. If one layer fails, the next one catches the attack. For example, you validate input (first layer), use parameterized queries (second layer), apply least-privilege database permissions (third layer), and monitor for suspicious activity (fourth layer). An attacker would need to bypass all four layers to compromise your application.

The most dangerous attitude in security is "nobody will attack my application." Automated bots scan every public-facing application continuously. They do not care whether you have 10 users or 10 million. They exploit known vulnerabilities in common libraries, guess default credentials, and inject malicious payloads into form fields. If your application has a vulnerability, it will be found and exploited.

Security is not something you add at the end of a project. It must be considered from the beginning. When you design your database schema, think about what data needs to be protected. When you design your API, think about what authentication and authorization each endpoint needs. When you write frontend code, think about what user input could be malicious. When you deploy, think about what secrets need to be protected and how to configure HTTPS.

The cost of a security breach includes direct costs (incident response, legal fees, regulatory fines), indirect costs (lost customers, damaged reputation, decreased stock price), and opportunity costs (engineers spending time on remediation instead of building features). The average cost of a data breach in 2024 was $4.88 million. Investing in security upfront is always cheaper than cleaning up after a breach.

## Cross-Site Scripting (XSS)

XSS occurs when an attacker injects malicious scripts into your application. The browser executes the script because it trusts the content from your site.

### Types of XSS

**Stored XSS:** The malicious script is stored in your database (e.g., in a comment or profile field) and served to other users.

**Reflected XSS:** The malicious script is in a URL parameter and reflected back in the response without sanitization.

**DOM-based XSS:** The malicious script modifies the DOM through client-side JavaScript.

### Prevention

```javascript
// server-side: sanitize all user input before storing
const sanitize = require("sanitize-html");

function sanitizeInput(dirty) {
  return sanitize(dirty, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {} // No attributes allowed
  });
}

// Or for rich text content (like comments with formatting)
function sanitizeRichText(dirty) {
  return sanitize(dirty, {
    allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
    allowedAttributes: {
      "a": ["href", "target", "rel"]
    },
    allowedSchemes: ["https", "http"],
    disallowedTagsMode: "discard"
  });
}
```

```javascript
// Express middleware to set security headers
function securityHeaders(req, res, next) {
  // Prevent XSS attacks
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Content Security Policy
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join("; "));
  
  next();
}

app.use(securityHeaders);
```

**Never use `innerHTML` with user data.** Always use `textContent` or React's JSX (which escapes by default):

```javascript
// DANGEROUS — allows XSS
element.innerHTML = userInput;

// SAFE — escapes HTML
element.textContent = userInput;

// React is safe by default — JSX escapes values
function Comment({ text }) {
  return <p>{text}</p>; // text is escaped automatically
}

// DANGEROUS — only use with trusted content
function Comment({ html }) {
  return <p dangerouslySetInnerHTML={{ __html: html }} />;
}
```

## Cross-Site Request Forgery (CSRF)

CSRF tricks a logged-in user into making an unintended request. If a user is logged into your banking app and visits a malicious site, that site could submit a form that transfers money.

### How CSRF Works

1. User logs into `mybank.com` and receives a session cookie.
2. User visits `evil-site.com`.
3. `evil-site.com` contains a hidden form that submits to `mybank.com/transfer`.
4. The browser automatically includes the session cookie with the request.
5. `mybank.com` processes the transfer because the cookie is valid.

### Prevention with CSRF Tokens

```javascript
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

// Enable CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  }
});

// Apply to routes that modify state
app.use(cookieParser());

// Get CSRF token
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protected routes
app.post("/api/transfer", csrfProtection, async (req, res) => {
  // If CSRF token is invalid, middleware throws an error
  // Process the transfer...
});
```

### Prevention with SameSite Cookies

```javascript
// Set cookies with SameSite attribute
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // Prevents cross-site requests
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

The `SameSite` cookie attribute tells the browser to only send the cookie with requests from the same site. This prevents CSRF without tokens for most scenarios.

## Input Validation

Never trust user input. Validate everything on the server side, regardless of what the client does. Client-side validation improves user experience by providing immediate feedback, but it is trivially bypassed. An attacker can disable JavaScript, modify the HTML, or send requests directly to your API. Server-side validation is the only reliable defense.

Input validation has three components: type validation (is this a string, number, or boolean?), format validation (is this a valid email, URL, or date?), and business rule validation (is this username already taken? does this user have permission to perform this action?). Each component serves a different purpose and requires different validation logic.

Type validation is the most basic and the most important. If your endpoint expects a number and receives a string, the behavior is unpredictable. If your endpoint expects an array and receives an object, your code might crash. Always validate that input matches the expected types before processing it.

Format validation ensures that input matches a specific pattern. An email must match the email format. A URL must be a valid URL. A date must be a valid ISO date. Format validation prevents obvious errors (like submitting "hello" as an email address) but does not prevent sophisticated attacks (like using a valid email format with malicious content in the local part).

Business rule validation ensures that input satisfies your application's requirements. A password must be at least 8 characters. A username must be unique. A date must be in the future. A quantity must be positive. These rules are specific to your application and cannot be validated with generic validation libraries.

The key principle of input validation is: validate early, validate thoroughly, and fail fast. Validate input as soon as it arrives (in middleware), validate all fields (not just the ones you use immediately), and return clear error messages when validation fails. Do not silently ignore invalid input or try to fix it — reject it and tell the user what is wrong.

### Schema Validation with Joi

```javascript
const Joi = require("joi");

const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required()
      .messages({
        "string.min": "Name must be at least 2 characters",
        "string.max": "Name cannot exceed 50 characters",
        "any.required": "Name is required"
      }),
    email: Joi.string().email().required()
      .messages({
        "string.email": "Please provide a valid email",
        "any.required": "Email is required"
      }),
    password: Joi.string().min(8).max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters",
        "string.max": "Password cannot exceed 128 characters",
        "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "Password is required"
      }),
    confirmPassword: Joi.valid(Joi.ref("password")).required()
      .messages({
        "any.only": "Passwords do not match"
      })
  }),

  createPost: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    content: Joi.string().max(50000).allow("", null),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
    published: Joi.boolean().default(false)
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    bio: Joi.string().max(500).allow("", null),
    website: Joi.string().uri().allow("", null)
  }).min(1)
};

// Validation middleware
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: "Invalid schema name" });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join("."),
        message: detail.message
      }));
      return res.status(400).json({ errors });
    }

    req.body = value;
    next();
  };
}

// Usage
app.post("/api/register", validate("register"), registerUser);
app.post("/api/posts", validate("createPost"), createPost);
```

### SQL Injection Prevention

SQL injection occurs when user input is concatenated directly into SQL queries:

```javascript
// DANGEROUS — SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;
const user = await db.query(query);

// SAFE — use parameterized queries
const user = await db.query(
  "SELECT * FROM users WHERE email = $1",
  [email]
);

// SAFE — use ORM
const user = await User.findOne({ where: { email } });
```

### NoSQL Injection Prevention

MongoDB is also vulnerable to injection:

```javascript
// DANGEROUS — NoSQL injection
const user = await User.findOne({ email: req.body.email });

// If req.body.email is { "$gt": "" }, it matches all users
// Attacker sends: { "email": { "$gt": "" }, "password": "anything" }

// SAFE — validate types
const user = await User.findOne({
  email: typeof req.body.email === "string" ? req.body.email : null
});

// BETTER — use schema validation
const schema = Joi.object({
  email: Joi.string().email().required()
});
```

## Rate Limiting

Prevent brute force attacks and abuse by limiting request rates:

```javascript
const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: "Too many login attempts, please try again in 15 minutes"
  },
  skipSuccessfulRequests: true
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
```

Rate limiting is a critical defense against brute force attacks. Without rate limiting, an attacker can try thousands of password combinations per second. With rate limiting, they can only try a few, making brute force impractical.

The `skipSuccessfulRequests` option is important for login endpoints. Without it, a user who successfully logs in consumes a rate limit slot. This means a user who logs in successfully 5 times in 15 minutes is blocked from logging in again. With `skipSuccessfulRequests`, only failed attempts count toward the limit.

Rate limiting also protects against denial of service attacks. An attacker can flood your server with requests, consuming all available resources and making the application unavailable to legitimate users. Rate limiting caps the number of requests from each IP address, preventing any single attacker from overwhelming the server.

For distributed applications, rate limiting requires a shared store (like Redis) so that limits are enforced across all server instances. Without a shared store, each server tracks its own limits, and an attacker can distribute requests across servers to bypass the limits.

Rate limiting should be combined with other defenses. It slows down attacks but does not prevent them entirely. A determined attacker with a botnet can distribute requests across thousands of IP addresses, bypassing per-IP rate limits. Additional defenses like account lockout, CAPTCHA, and IP reputation scoring provide additional layers of protection.

## Password Security

Password security is one of the most important aspects of application security. If your database is compromised and passwords are not hashed, every user's account is at risk. If passwords are hashed with a weak algorithm, crackers can recover most passwords within hours.

The standard for password hashing is bcrypt. It is slow by design — hashing a password takes about 100ms, which makes brute force attacks impractical. It includes a salt (random data mixed into the password before hashing) to prevent rainbow table attacks. It uses a cost factor that determines how slow the hashing is — higher cost means slower hashing and better security.

```javascript
const bcrypt = require("bcryptjs");

// Hash passwords with appropriate cost factor
async function hashPassword(password) {
  const saltRounds = 12; // Minimum 10, recommended 12
  return bcrypt.hash(password, saltRounds);
}

// Verify passwords
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Password strength validation
function isStrongPassword(password) {
  return {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
}
```

Never store passwords in plain text. Never use MD5 or SHA-1 for password hashing — they are too fast and do not include salting. Never use a custom hashing algorithm — use bcrypt, scrypt, or Argon2. Never log passwords or include them in error messages. Never send passwords over unencrypted connections.

Password policies should balance security with usability. Requiring too many character types or frequent password changes leads to weak passwords (users write them down or use predictable patterns). A good policy requires a minimum length of 8 characters, checks against common passwords, and allows all character types. Consider supporting passphrases (multiple random words) as an alternative to complex passwords.

## Security Headers with Helmet

Helmet is the standard way to set security headers in Express. It configures multiple headers with sensible defaults and is easy to customize:

```javascript
const helmet = require("helmet");

app.use(helmet());

// Customize specific headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdn.example.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'none'"],
    frameSrc: ["'none'"]
  }
}));

app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

Content Security Policy (CSP) is the most complex and most powerful security header. It tells the browser which resources are allowed to load and from which origins. Without CSP, an attacker can inject a script tag that loads a malicious script from their server. With CSP, the browser blocks the script because it is not in the allowed origins list.

CSP configuration requires careful thought. If you set it too strictly, your application will break (inline styles, external fonts, analytics scripts will all be blocked). If you set it too loosely, it provides little protection. Start with a strict policy and relax it as needed. Use report-only mode (`Content-Security-Policy-Report-Only`) to test your policy without breaking the application.

HTTP Strict Transport Security (HSTS) tells the browser to only use HTTPS for your domain. Once the browser receives the HSTS header, it will automatically redirect HTTP requests to HTTPS for the specified duration. The `includeSubDomains` option applies HSTS to all subdomains. The `preload` option allows you to submit your domain to the HSTS preload list, which is included in major browsers.

## Real Scenario: Hardening an Express Application

Let us take a standard Express application and apply all security hardening.

### Before (Vulnerable)

```javascript
const express = require("express");
const app = express();

app.use(express.json());

app.post("/api/users", async (req, res) => {
  const { name, email, password } = req.body;
  
  // SQL injection vulnerability
  const existing = await db.query(
    `SELECT * FROM users WHERE email = '${email}'`
  );
  
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email exists" });
  }
  
  // No password hashing
  const user = await db.query(
    `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${password}')`
  );
  
  res.json(user);
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  
  // No rate limiting
  // No password comparison
  const user = await db.query(
    `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`
  );
  
  res.json({ user: user[0] });
});
```

### After (Hardened)

```javascript
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Body parsing with size limits
app.use(express.json({ limit: "10kb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

// Input validation
app.post("/api/users",
  authLimiter,
  [
    body("name").trim().isLength({ min: 2, max: 50 })
      .withMessage("Name must be 2-50 characters"),
    body("email").isEmail().normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must be 8+ chars with uppercase, lowercase, and number")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Parameterized query (no SQL injection)
    const existing = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Password hashing
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  }
);

// Login with rate limiting and secure token generation
app.post("/api/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const result = await db.query(
      "SELECT id, name, email, password FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      // Use same error message for both "user not found" and "wrong password"
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  }
);
```

## Security Checklist

```markdown
## Express Security Checklist

### Headers
- [ ] Helmet.js installed and configured
- [ ] Content Security Policy configured
- [ ] HSTS enabled with appropriate max-age
- [ ] X-Frame-Options set to DENY or SAMEORIGIN
- [ ] X-Content-Type-Options set to nosniff

### Input
- [ ] All user input is validated with Joi or express-validator
- [ ] SQL queries use parameterized queries
- [ ] MongoDB queries validate input types
- [ ] File uploads are validated (type, size)
- [ ] Request body size limits are set

### Authentication
- [ ] Passwords are hashed with bcrypt (cost >= 10)
- [ ] JWT tokens have appropriate expiry
- [ ] Refresh tokens are rotated
- [ ] Failed login attempts are rate limited
- [ ] Session cookies have httpOnly, secure, sameSite

### Authorization
- [ ] Every endpoint checks authorization
- [ ] Role-based access control is implemented
- [ ] Users can only access their own resources
- [ ] Admin endpoints are protected

### Error Handling
- [ ] Error messages do not leak sensitive information
- [ ] Stack traces are not sent to clients in production
- [ ] Database errors are caught and logged

### CORS
- [ ] CORS is configured with specific origins
- [ ] Credentials are only allowed from trusted origins
- [ ] Methods and headers are restricted

### Rate Limiting
- [ ] General API rate limiting is in place
- [ ] Authentication endpoints have stricter limits
- [ ] File upload endpoints are rate limited
```

## Assessment

### Lab Task: Security Audit and Hardening

**Time Limit: 60 minutes**

You are given a vulnerable Express application. Perform a security audit and fix all vulnerabilities.

**The Vulnerable Application:**

```javascript
const express = require("express");
const app = express();

app.use(express.json());

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.query(
    `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`
  );
  if (user.length > 0) {
    res.json({ token: "static-token-123" });
  } else {
    res.status(401).json({ error: "Wrong credentials" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  const user = await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);
  res.json(user[0]);
});

app.post("/api/posts", async (req, res) => {
  const post = await db.query(
    `INSERT INTO posts (title, content) VALUES ('${req.body.title}', '${req.body.content}')`
  );
  res.json(post);
});
```

**Fix all vulnerabilities:**
1. SQL injection in all three endpoints
2. No password hashing
3. No input validation
4. No rate limiting
5. No security headers
6. Static JWT token
7. No error handling
8. Missing CORS configuration

### Grading Criteria

- **SQL Injection (25 points):** All queries use parameterized queries or ORM.
- **Password Security (20 points):** Passwords are hashed with bcrypt, cost factor >= 12.
- **Input Validation (20 points):** All endpoints validate input with Joi or express-validator.
- **Rate Limiting (15 points):** Authentication endpoints have rate limiting, general API has basic limiting.
- **Security Headers (10 points):** Helmet is configured with appropriate headers.
- **Error Handling (10 points):** Errors are caught, logged, and do not leak sensitive information.

### Evidence

After completing this module, you should be able to:

1. Identify and prevent XSS attacks through input sanitization and security headers.
2. Implement CSRF protection using tokens and SameSite cookies.
3. Validate all user input with schema-based validation.
4. Prevent SQL and NoSQL injection through parameterized queries.
5. Implement rate limiting to prevent brute force attacks.
6. Hash passwords securely with bcrypt.
7. Apply security headers with Helmet.js.
8. Conduct a security audit of an Express application.
