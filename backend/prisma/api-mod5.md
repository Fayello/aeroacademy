# Module 5 — Input Validation and Sanitization

## What You'll Actually Do

Validate every piece of data that touches your API. You'll build schema validation that rejects bad input before it hits your database, sanitize strings to prevent injection, and handle file uploads without getting owned. No trust in client data — ever.

---

## Schema Validation: Define What's Allowed

Validation happens at the API boundary. Every request body, query parameter, and path parameter gets checked before your business logic runs.

```javascript
const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  name: Joi.string().min(1).max(100).pattern(/^[a-zA-Z\s'-]+$/).required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('admin', 'manager', 'user').default('user'),
  age: Joi.number().integer().min(13).max(150).optional(),
});

// Validation middleware
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // return all errors, not just the first
      stripUnknown: true, // remove fields not in schema
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(422).json({ error: 'Validation failed', details });
    }

    req.body = value; // use sanitized/typed values
    next();
  };
}

app.post('/api/users', validate(createUserSchema), createUser);
```

**Don't forget query parameters and path parameters.** Clients can send anything in query strings.

```javascript
const listUsersQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid('admin', 'manager', 'user'),
  sort: Joi.string().valid('name', 'email', 'created_at').default('created_at'),
});

app.get('/api/users', validateQuery(listUsersQuery), listUsers);

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.details.map(d => d.message),
      });
    }
    req.query = value;
    next();
  };
}
```

---

## Sanitization: Clean Before You Use

Validation rejects bad data. Sanitization cleans data that passes validation but might still be dangerous.

```javascript
const sanitize = require('sanitize-html');

// Strip HTML tags from user input
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = sanitize(value, { allowedTags: [], allowedAttributes: {} });
      }
    }
  }
  next();
}

app.use(sanitizeInput);
```

**SQL injection prevention:** If you're using an ORM like Prisma, parameterized queries are built in. If you're writing raw SQL, always use parameterized queries.

```javascript
// Prisma — safe by default
const user = await db.user.findMany({
  where: { email: userInput }, // Prisma parameterizes this
});

// Raw SQL — ALWAYS use parameters
const user = await db.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;

// NEVER do this
const user = await db.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userInput}'` // SQL injection
);
```

**NoSQL injection:** MongoDB is vulnerable if you pass raw objects from user input.

```javascript
// DANGEROUS — attacker sends { "$gt": "" } as email
const user = await db.collection('users').findOne({ email: req.body.email });

// SAFE — validate types explicitly
const email = String(req.body.email);
if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
  return res.status(400).json({ error: 'Invalid email' });
}
const user = await db.collection('users').findOne({ email });
```

---

## Type Coercion: Don't Trust `req.params`

Express gives you strings from path parameters. If you expect numbers, validate and convert explicitly.

```javascript
// req.params.id is always a string
app.get('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
```

---

## File Upload Validation

File uploads are a common attack vector. Validate file type, size, and content — not just the extension.

```javascript
const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp/uploads',
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
    cb(null, true);
  },
});

app.post('/api/avatar', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Additional check: verify magic bytes, not just extension
  const buffer = require('fs').readFileSync(req.file.path);
  const magic = buffer.toString('hex', 0, 4);
  const validMagic = ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', '89504e47', '52494646'];
  if (!validMagic.includes(magic)) {
    require('fs').unlinkSync(req.file.path);
    return res.status(400).json({ error: 'File content does not match allowed type' });
  }

  // Move to permanent storage...
  res.json({ path: `/uploads/${req.file.filename}` });
});
```

---

## Validation Strategy

```
Layer 1: Schema validation (reject bad structure)
Layer 2: Sanitization (clean dangerous content)
Layer 3: Type checking (ensure correct types)
Layer 4: Business rules (check constraints specific to your domain)
```

All four layers run before your core logic. Fail fast with clear error messages.

---

## Assessment

**Lab Task: Build a Validated API (50 minutes)**

Build an API for user registration with these requirements:

1. Validate registration: email (valid format), name (2-100 chars, letters only), password (min 8 chars, at least one number and one letter), age (13-150, optional)
2. Sanitize all string inputs (strip HTML)
3. Validate query parameters on list endpoints (page, limit, sort)
4. Handle file upload for avatar: max 3MB, images only, verify magic bytes
5. Return structured validation errors with field-level messages
6. Test with both valid and invalid input to verify all checks work

**Deliverables:** `validated-api.js` with all validation logic, plus a `test-validation.sh` script that sends valid and invalid requests.

**Grading:**
- Schema validation catches all invalid inputs: 30%
- Sanitization strips HTML from strings: 20%
- Query parameter validation works: 15%
- File upload validates type, size, and magic bytes: 20%
- Error messages are clear and field-specific: 15%

---

## Evidence

Run the test script and screenshot the output. Show at least 5 different validation failures with structured error responses. Include the curl commands that trigger each validation check.
