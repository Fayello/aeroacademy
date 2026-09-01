# Module 9: API Testing

API testing validates that your endpoints work correctly, handle errors gracefully, perform under load, and resist attacks. A well-tested API catches bugs before they reach production, prevents regressions when code changes, and gives you confidence to deploy frequently.

This module covers API testing strategies: unit tests, integration tests, contract tests, performance tests, and security tests: along with test organization, fixtures, and CI/CD integration.

## Testing Pyramid for APIs

The testing pyramid defines the balance between different types of tests:

```
        /\
       /  \        E2E Tests (few, slow, expensive)
      /    \
     /------\      Integration Tests (moderate, moderate speed)
    /        \
   /----------\    Unit Tests (many, fast, cheap)
```

**Unit tests** verify individual functions and methods in isolation. They are fast, cheap to write, and catch logic errors early. For an API, unit tests cover validation logic, authorization policies, data transformation, and utility functions.

**Integration tests** verify that components work together. They test the API endpoint against a real database, real authentication, and real middleware. They catch issues that unit tests miss: incorrect SQL queries, missing database indexes, broken middleware chains.

**End-to-end tests** verify the entire system from client to database. They simulate real user workflows: registration, login, creating resources, viewing data. They are slow and expensive but catch integration issues that lower-level tests miss.

## Unit Testing API Logic

### Testing Validation Schemas

```javascript
const { createPilotSchema } = require('./schemas/pilot');

describe('createPilotSchema', () => {
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
  
  test('rejects invalid email', () => {
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
  
  test('rejects missing required fields', () => {
    const input = { email: 'pilot@example.com' };
    
    const result = createPilotSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error.issues.length).toBeGreaterThan(1);
  });
  
  test('rejects future date of birth', () => {
    const input = {
      email: 'pilot@example.com',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '2030-01-15'
    };
    
    const result = createPilotSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  
  test('trims whitespace from string fields', () => {
    const input = {
      email: 'pilot@example.com',
      first_name: '  John  ',
      last_name: '  Doe  ',
      date_of_birth: '1990-01-15'
    };
    
    const result = createPilotSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.first_name).toBe('John');
    expect(result.data.last_name).toBe('Doe');
  });
});
```

### Testing Authorization Logic

```javascript
const { authorize } = require('./authorization');

describe('authorize', () => {
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
    }
  ];
  
  test('allows student to read own data', () => {
    const subject = { id: 'student1', role: 'student', schoolId: 'school1' };
    const resource = { type: 'flight_log', ownerId: 'student1', schoolId: 'school1' };
    
    expect(authorize(subject, 'read', resource, policies)).toBe(true);
  });
  
  test('denies student reading other student data', () => {
    const subject = { id: 'student1', role: 'student', schoolId: 'school1' };
    const resource = { type: 'flight_log', ownerId: 'student2', schoolId: 'school1' };
    
    expect(authorize(subject, 'read', resource, policies)).toBe(false);
  });
  
  test('allows instructor to read school data', () => {
    const subject = { id: 'instructor1', role: 'instructor', schoolId: 'school1' };
    const resource = { type: 'pilot', schoolId: 'school1' };
    
    expect(authorize(subject, 'read', resource, policies)).toBe(true);
  });
  
  test('denies instructor reading other school data', () => {
    const subject = { id: 'instructor1', role: 'instructor', schoolId: 'school1' };
    const resource = { type: 'pilot', schoolId: 'school2' };
    
    expect(authorize(subject, 'read', resource, policies)).toBe(false);
  });
});
```

### Testing Error Handling

```javascript
const { AppError, formatError } = require('./errors');

describe('error handling', () => {
  test('AppError contains all required fields', () => {
    const error = new AppError(409, 'duplicate_entry', 'Email already exists', [
      { field: 'email', message: 'Email is already registered' }
    ]);
    
    expect(error.status).toBe(409);
    expect(error.code).toBe('duplicate_entry');
    expect(error.message).toBe('Email already exists');
    expect(error.details).toHaveLength(1);
    expect(error.isOperational).toBe(true);
  });
  
  test('formatError hides stack trace in production', () => {
    const error = new Error('Database connection failed');
    error.status = 500;
    error.code = 'database_error';
    
    process.env.NODE_ENV = 'production';
    const formatted = formatError(error);
    
    expect(formatted.stack).toBeUndefined();
    expect(formatted.message).toBe('An unexpected error occurred');
  });
  
  test('formatError shows stack trace in development', () => {
    const error = new Error('Database connection failed');
    error.status = 500;
    error.code = 'database_error';
    
    process.env.NODE_ENV = 'development';
    const formatted = formatError(error);
    
    expect(formatted.stack).toBeDefined();
  });
});
```

## Integration Testing API Endpoints

### Setting Up Test Environment

```javascript
const request = require('supertest');
const { app } = require('../app');
const { db } = require('../database');
const { seedTestData, clearTestData } = require('./fixtures');

beforeAll(async () => {
  await db.migrate.latest();
  await seedTestData();
});

afterAll(async () => {
  await clearTestData();
  await db.destroy();
});

beforeEach(async () => {
  await db('training_sessions').del();
  await db('pilots').del();
  await seedTestData();
});
```

### Testing CRUD Operations

```javascript
describe('POST /api/v1/pilots', () => {
  let authToken;
  
  beforeAll(async () => {
    authToken = await getAuthToken({ role: 'admin' });
  });
  
  test('creates a pilot with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/pilots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'newpilot@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1995-06-20'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('newpilot@example.com');
    expect(response.body.first_name).toBe('Jane');
    expect(response.body).not.toHaveProperty('password_hash');
  });
  
  test('rejects pilot with duplicate email', async () => {
    // First creation
    await request(app)
      .post('/api/v1/pilots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'duplicate@example.com',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-15'
      });
    
    // Second creation (duplicate)
    const response = await request(app)
      .post('/api/v1/pilots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'duplicate@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1995-06-20'
      });
    
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('duplicate_entry');
  });
  
  test('rejects pilot without authentication', async () => {
    const response = await request(app)
      .post('/api/v1/pilots')
      .send({
        email: 'newpilot@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1995-06-20'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('missing_token');
  });
  
  test('rejects pilot without required permissions', async () => {
    const pilotToken = await getAuthToken({ role: 'pilot' });
    
    const response = await request(app)
      .post('/api/v1/pilots')
      .set('Authorization', `Bearer ${pilotToken}`)
      .send({
        email: 'newpilot@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1995-06-20'
      });
    
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('forbidden');
  });
});

describe('GET /api/v1/pilots/:id', () => {
  let pilotToken;
  let testPilot;
  
  beforeAll(async () => {
    testPilot = await createTestPilot();
    pilotToken = await getAuthToken({ id: testPilot.id, role: 'pilot' });
  });
  
  test('returns pilot data', async () => {
    const response = await request(app)
      .get(`/api/v1/pilots/${testPilot.id}`)
      .set('Authorization', `Bearer ${pilotToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(testPilot.id);
    expect(response.body.email).toBe(testPilot.email);
  });
  
  test('returns 404 for non-existent pilot', async () => {
    const response = await request(app)
      .get('/api/v1/pilots/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${pilotToken}`);
    
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('not_found');
  });
  
  test('pilots cannot access other pilots data', async () => {
    const otherPilot = await createTestPilot();
    const otherToken = await getAuthToken({ id: otherPilot.id, role: 'pilot' });
    
    const response = await request(app)
      .get(`/api/v1/pilots/${testPilot.id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('forbidden');
  });
});
```

### Testing Error Responses

```javascript
describe('validation errors', () => {
  test('returns structured validation error', async () => {
    const response = await request(app)
      .post('/api/v1/pilots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'not-an-email',
        first_name: '',
        last_name: 'Doe',
        date_of_birth: '2030-01-15'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'first_name' }),
        expect.objectContaining({ field: 'date_of_birth' })
      ])
    );
  });
  
  test('returns rate limit error with retry header', async () => {
    // Make requests until rate limit is hit
    for (let i = 0; i < 101; i++) {
      await request(app)
        .get('/api/v1/pilots')
        .set('Authorization', `Bearer ${pilotToken}`);
    }
    
    const response = await request(app)
      .get('/api/v1/pilots')
      .set('Authorization', `Bearer ${pilotToken}`);
    
    expect(response.status).toBe(429);
    expect(response.body.error).toBe('rate_limit_exceeded');
    expect(response.headers['retry-after']).toBeDefined();
  });
});
```

## Contract Testing

Contract testing verifies that the API response matches the expected schema. It catches unexpected changes in the API response format.

### Using Jest with Schema Validation

```javascript
const { z } = require('zod');

const pilotResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

describe('API contract', () => {
  test('pilot response matches schema', async () => {
    const response = await request(app)
      .get(`/api/v1/pilots/${testPilot.id}`)
      .set('Authorization', `Bearer ${token}`);
    
    const result = pilotResponseSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });
  
  test('pilot list response matches schema', async () => {
    const response = await request(app)
      .get('/api/v1/pilots')
      .set('Authorization', `Bearer ${token}`);
    
    const listSchema = z.object({
      data: z.array(pilotResponseSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number()
      })
    });
    
    const result = listSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });
});
```

### Using Pact for Consumer-Driven Contracts

```javascript
const { Pact } = require('@pact-foundation/pact');

describe('Pact Consumer Tests', () => {
  const provider = new Pact({
    consumer: 'TrainingApp',
    provider: 'PilotAPI',
    port: 1234
  });
  
  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  
  test('gets a pilot by ID', async () => {
    await provider.addInteraction({
      state: 'pilot 123 exists',
      uponReceiving: 'a request for pilot 123',
      withRequest: {
        method: 'GET',
        path: '/api/v1/pilots/123',
        headers: { Authorization: 'Bearer test-token' }
      },
      willRespondWith: {
        status: 200,
        body: {
          id: '123',
          email: 'pilot@example.com',
          first_name: 'John',
          last_name: 'Doe'
        }
      }
    });
    
    const response = await fetch('http://localhost:1234/api/v1/pilots/123', {
      headers: { Authorization: 'Bearer test-token' }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe('123');
  });
});
```

## Performance Testing

### Load Testing with Artillery

```yaml
# artillery-config.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  
  defaults:
    headers:
      Authorization: "Bearer {{ $processEnvironment.TEST_TOKEN }}"

scenarios:
  - name: "Pilot API Load Test"
    flow:
      - get:
          url: "/api/v1/pilots"
          expect:
            - statusCode: 200
      
      - think: 1
      
      - get:
          url: "/api/v1/pilots/{{ $randomUUID() }}"
          expect:
            - statusCode: [200, 404]
      
      - think: 1
      
      - post:
          url: "/api/v1/training-sessions"
          json:
            student_id: "{{ $randomUUID() }}"
            aircraft_id: "{{ $randomUUID() }}"
            date: "2026-09-15"
            start_time: "09:00"
            end_time: "11:00"
          expect:
            - statusCode: [201, 400, 404]
```

### Running Load Tests

```bash
# Run the load test
artillery run artillery-config.yml

# Generate HTML report
artillery run --output report.json artillery-config.yml
artillery report report.json
```

### Performance Test Results

```json
{
  "aggregate": {
    "count": 15000,
    "errors": {
      "429": 234
    },
    "latency": {
      "min": 12,
      "max": 2340,
      "median": 45,
      "p95": 120,
      "p99": 450
    },
    "rps": {
      "count": 15000,
      "mean": 83.2
    }
  }
}
```

### Performance Testing Patterns

**Spike testing.** Simulate sudden traffic spikes:

```yaml
# Spike test configuration
config:
  target: "http://localhost:3000"
  phases:
    - duration: 30
      arrivalRate: 10    # Normal traffic
    - duration: 5
      arrivalRate: 500   # Sudden spike
    - duration: 30
      arrivalRate: 10    # Recovery
```

**Soak testing.** Run extended tests to find memory leaks and resource exhaustion:

```yaml
# Soak test configuration
config:
  target: "http://localhost:3000"
  phases:
    - duration: 3600  # 1 hour
      arrivalRate: 20
```

**Stress testing.** Find the breaking point:

```yaml
# Stress test configuration
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 60
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
    - duration: 60
      arrivalRate: 200
    - duration: 60
      arrivalRate: 400
    - duration: 60
      arrivalRate: 800
```

### Performance Thresholds

Define performance thresholds and fail tests that exceed them:

```javascript
// artillery-thresholds.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 50
  
  ensure:
    p95: 500      # 95th percentile under 500ms
    maxErrorRate: 1  # Less than 1% errors
    throughput: 100  # At least 100 requests per second
```

### Performance Monitoring During Tests

Monitor system resources during performance tests:

```javascript
const os = require('os');

function monitorSystemResources(intervalMs = 1000) {
  const metrics = [];
  
  const interval = setInterval(() => {
    metrics.push({
      timestamp: new Date().toISOString(),
      cpu_usage: os.loadavg(),
      memory_usage: {
        total: os.totalmem(),
        free: os.freemem(),
        used_percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      uptime: os.uptime()
    });
  }, intervalMs);
  
  return {
    stop: () => {
      clearInterval(interval);
      return metrics;
    }
  };
}
```

## Security Testing

### Authentication Testing

```javascript
describe('authentication security', () => {
  test('rejects expired tokens', async () => {
    const expiredToken = generateToken({ id: 'user1' }, { expiresIn: '-1h' });
    
    const response = await request(app)
      .get('/api/v1/pilots')
      .set('Authorization', `Bearer ${expiredToken}`);
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('token_expired');
  });
  
  test('rejects tokens with invalid signatures', async () => {
    const forgedToken = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6InVzZXIxIn0.forged_signature';
    
    const response = await request(app)
      .get('/api/v1/pilots')
      .set('Authorization', `Bearer ${forgedToken}`);
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('invalid_token');
  });
  
  test('does not leak user existence in login', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password' });
    
    expect(response.status).toBe(401);
    expect(response.body.message).not.toContain('not found');
    expect(response.body.message).not.toContain('does not exist');
  });
});
```

### Authorization Testing

```javascript
describe('authorization security', () => {
  test('pilot cannot access other pilots data', async () => {
    const pilot1Token = await getAuthToken({ id: 'pilot1', role: 'pilot' });
    const pilot2Id = 'pilot2';
    
    const response = await request(app)
      .get(`/api/v1/pilots/${pilot2Id}`)
      .set('Authorization', `Bearer ${pilot1Token}`);
    
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('forbidden');
  });
  
  test('instructor cannot access other schools data', async () => {
    const instructorToken = await getAuthToken({ 
      id: 'instructor1', 
      role: 'instructor', 
      schoolId: 'school1' 
    });
    
    const response = await request(app)
      .get('/api/v1/pilots?school_id=school2')
      .set('Authorization', `Bearer ${instructorToken}`);
    
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('forbidden');
  });
  
  test('pilot cannot perform admin actions', async () => {
    const pilotToken = await getAuthToken({ role: 'pilot' });
    
    const response = await request(app)
      .post('/api/v1/aircraft')
      .set('Authorization', `Bearer ${pilotToken}`)
      .send({ tail_number: 'N12345', model: 'Cessna 172' });
    
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('forbidden');
  });
});
```

### Input Validation Security Testing

```javascript
describe('input validation security', () => {
  test('prevents SQL injection in email field', async () => {
    const response = await request(app)
      .post('/api/v1/pilots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: "admin@example.com' OR '1'='1' --",
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-15'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });
  
  test('prevents XSS in bio field', async () => {
    const response = await request(app)
      .put(`/api/v1/pilots/${testPilot.id}`)
      .set('Authorization', `Bearer ${pilotToken}`)
      .send({
        bio: '<script>alert("xss")</script>'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.bio).not.toContain('<script>');
  });
  
  test('rejects oversized request body', async () => {
    const oversizedBody = { data: 'x'.repeat(10 * 1024 * 1024) }; // 10MB
    
    const response = await request(app)
      .post('/api/v1/pilots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(oversizedBody);
    
    expect(response.status).toBe(413);
  });
  
  test('prevents path traversal in file uploads', async () => {
    const response = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('test'), {
        filename: '../../../etc/passwd',
        mimetype: 'application/pdf'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('invalid_file_name');
  });
});
```

### Rate Limiting Testing

```javascript
describe('rate limiting', () => {
  test('enforces per-user rate limits', async () => {
    const token = await getAuthToken({ role: 'pilot' });
    
    // Make requests until limit is hit
    const responses = [];
    for (let i = 0; i < 101; i++) {
      const response = await request(app)
        .get('/api/v1/pilots')
        .set('Authorization', `Bearer ${token}`);
      responses.push(response);
    }
    
    // Last request should be rate limited
    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body.error).toBe('rate_limit_exceeded');
    expect(lastResponse.headers['retry-after']).toBeDefined();
  });
  
  test('different clients have separate limits', async () => {
    const token1 = await getAuthToken({ id: 'user1', role: 'pilot' });
    const token2 = await getAuthToken({ id: 'user2', role: 'pilot' });
    
    // User 1 makes 100 requests
    for (let i = 0; i < 100; i++) {
      await request(app)
        .get('/api/v1/pilots')
        .set('Authorization', `Bearer ${token1}`);
    }
    
    // User 2 should still be able to make requests
    const response = await request(app)
      .get('/api/v1/pilots')
      .set('Authorization', `Bearer ${token2}`);
    
    expect(response.status).toBe(200);
  });
});
```

### Input Validation Testing

```javascript
describe('input validation security', () => {
  test('prevents SQL injection in email field', async () => {
    const response = await request(app)
      .post('/api/v1/pilots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: "admin@example.com' OR '1'='1' --",
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-15'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });
  
  test('prevents XSS in bio field', async () => {
    const response = await request(app)
      .put(`/api/v1/pilots/${testPilot.id}`)
      .set('Authorization', `Bearer ${pilotToken}`)
      .send({
        bio: '<script>alert("xss")</script>'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.bio).not.toContain('<script>');
  });
  
  test('rejects oversized request body', async () => {
    const oversizedBody = { data: 'x'.repeat(10 * 1024 * 1024) }; // 10MB
    
    const response = await request(app)
      .post('/api/v1/pilots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(oversizedBody);
    
    expect(response.status).toBe(413);
  });
});
```

## Test Fixtures and Factories

### Creating Test Data

```javascript
// fixtures/pilots.js
const { v4: uuidv4 } = require('uuid');

function createTestPilot(overrides = {}) {
  return {
    id: uuidv4(),
    email: `pilot-${Date.now()}@example.com`,
    first_name: 'Test',
    last_name: 'Pilot',
    date_of_birth: '1990-01-15',
    role: 'pilot',
    status: 'active',
    school_id: 'test-school-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

function createTestTrainingSession(overrides = {}) {
  return {
    id: uuidv4(),
    student_id: uuidv4(),
    instructor_id: uuidv4(),
    aircraft_id: uuidv4(),
    date: '2026-09-15',
    start_time: '09:00',
    end_time: '11:00',
    session_type: 'dual',
    status: 'scheduled',
    created_at: new Date().toISOString(),
    ...overrides
  };
}

async function seedTestData() {
  const pilots = [
    createTestPilot({ email: 'admin@example.com', role: 'admin' }),
    createTestPilot({ email: 'instructor@example.com', role: 'instructor' }),
    createTestPilot({ email: 'student@example.com', role: 'pilot' })
  ];
  
  await db('pilots').insert(pilots);
  
  const sessions = pilots
    .filter(p => p.role === 'pilot')
    .map(p => createTestTrainingSession({ student_id: p.id }));
  
  await db('training_sessions').insert(sessions);
  
  return { pilots, sessions };
}
```

### Authentication Helpers

```javascript
// helpers/auth.js
const jwt = require('jsonwebtoken');

async function getAuthToken(overrides = {}) {
  const user = {
    id: overrides.id || uuidv4(),
    role: overrides.role || 'pilot',
    schoolId: overrides.schoolId || 'test-school-id',
    scope: overrides.scope || 'pilot:read sessions:read',
    ...overrides
  };
  
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function getAuthenticatedRequest(method, path, options = {}) {
  const token = await getAuthToken(options.auth || {});
  
  return request(app)
    [method](path)
    .set('Authorization', `Bearer ${token}`)
    .send(options.body)
    .query(options.query);
}
```

## CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/api-tests.yml
name: API Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-key
      
      - name: Run API contract tests
        run: npm run test:contract

  performance-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v3
      
      - name: Run load test
        uses: artilleryio/action-artillery@v2
        with:
          config: ./tests/performance/artillery-config.yml
          output: ./test-results
      
      - name: Check performance thresholds
        run: |
          # Fail if p95 latency > 500ms
          node -e "
            const results = require('./test-results/artillery.json');
            const p95 = results.aggregate.latency.p95;
            if (p95 > 500) {
              console.error('p95 latency ' + p95 + 'ms exceeds 500ms threshold');
              process.exit(1);
            }
          "
```

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration --runInBand",
    "test:contract": "jest --testPathPattern=tests/contract",
    "test:security": "jest --testPathPattern=tests/security",
    "test:performance": "artillery run ./tests/performance/artillery-config.yml",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

## Real Scenario: Testing a Training Session Endpoint

Consider the training session creation endpoint. Here is a complete test suite:

```javascript
describe('POST /api/v1/training-sessions', () => {
  let adminToken, instructorToken, pilotToken;
  let testStudent, testInstructor, testAircraft;
  
  beforeAll(async () => {
    adminToken = await getAuthToken({ role: 'admin' });
    instructorToken = await getAuthToken({ role: 'instructor' });
    pilotToken = await getAuthToken({ role: 'pilot' });
    
    testStudent = await createTestPilot({ role: 'pilot' });
    testInstructor = await createTestPilot({ role: 'instructor' });
    testAircraft = await createTestAircraft({ status: 'available' });
  });
  
  describe('success cases', () => {
    test('admin can create training session', async () => {
      const response = await request(app)
        .post('/api/v1/training-sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: testStudent.id,
          instructor_id: testInstructor.id,
          aircraft_id: testAircraft.id,
          date: '2026-09-15',
          start_time: '09:00',
          end_time: '11:00',
          session_type: 'dual'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('scheduled');
      expect(response.body.student_id).toBe(testStudent.id);
    });
    
    test('instructor can create training session', async () => {
      const response = await request(app)
        .post('/api/v1/training-sessions')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          student_id: testStudent.id,
          instructor_id: testInstructor.id,
          aircraft_id: testAircraft.id,
          date: '2026-09-15',
          start_time: '09:00',
          end_time: '11:00',
          session_type: 'dual'
        });
      
      expect(response.status).toBe(201);
    });
  });
  
  describe('error cases', () => {
    test('rejects non-existent student', async () => {
      const response = await request(app)
        .post('/api/v1/training-sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: '00000000-0000-0000-0000-000000000000',
          instructor_id: testInstructor.id,
          aircraft_id: testAircraft.id,
          date: '2026-09-15',
          start_time: '09:00',
          end_time: '11:00',
          session_type: 'dual'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('not_found');
    });
    
    test('rejects scheduling conflict', async () => {
      // Create first session
      await request(app)
        .post('/api/v1/training-sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: testStudent.id,
          instructor_id: testInstructor.id,
          aircraft_id: testAircraft.id,
          date: '2026-09-15',
          start_time: '09:00',
          end_time: '11:00',
          session_type: 'dual'
        });
      
      // Try to create overlapping session
      const response = await request(app)
        .post('/api/v1/training-sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: testStudent.id,
          instructor_id: testInstructor.id,
          aircraft_id: testAircraft.id,
          date: '2026-09-15',
          start_time: '10:00',
          end_time: '12:00',
          session_type: 'dual'
        });
      
      expect(response.status).toBe(409);
      expect(response.body.error).toBe('conflict');
    });
    
    test('rejects session in the past', async () => {
      const response = await request(app)
        .post('/api/v1/training-sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: testStudent.id,
          instructor_id: testInstructor.id,
          aircraft_id: testAircraft.id,
          date: '2020-01-01',
          start_time: '09:00',
          end_time: '11:00',
          session_type: 'dual'
        });
      
      expect(response.status).toBe(422);
      expect(response.body.error).toBe('validation_error');
    });
    
    test('rejects session longer than 8 hours', async () => {
      const response = await request(app)
        .post('/api/v1/training-sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: testStudent.id,
          instructor_id: testInstructor.id,
          aircraft_id: testAircraft.id,
          date: '2026-09-15',
          start_time: '09:00',
          end_time: '18:00',
          session_type: 'dual'
        });
      
      expect(response.status).toBe(422);
      expect(response.body.error).toBe('validation_error');
    });
  });
  
  describe('authorization', () => {
    test('pilot cannot create training session', async () => {
      const response = await request(app)
        .post('/api/v1/training-sessions')
        .set('Authorization', `Bearer ${pilotToken}`)
        .send({
          student_id: testStudent.id,
          instructor_id: testInstructor.id,
          aircraft_id: testAircraft.id,
          date: '2026-09-15',
          start_time: '09:00',
          end_time: '11:00',
          session_type: 'dual'
        });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('forbidden');
    });
    
    test('unauthenticated request is rejected', async () => {
      const response = await request(app)
        .post('/api/v1/training-sessions')
        .send({
          student_id: testStudent.id,
          instructor_id: testInstructor.id,
          aircraft_id: testAircraft.id,
          date: '2026-09-15',
          start_time: '09:00',
          end_time: '11:00',
          session_type: 'dual'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('missing_token');
    });
  });
});
```

## Assessment

**Lab 1: Unit Test Suite** (40 minutes)

Write unit tests for a rate limiting middleware. Test: that requests within the limit are allowed, that requests exceeding the limit are rejected with 429, that rate limit headers are set correctly, that different clients have separate limits, and that the rate limit resets after the window expires. Write at least 10 test cases.

Grading: 30 points. 6 points per correctly implemented test scenario.

**Lab 2: Integration Test Suite** (45 minutes)

Write integration tests for a pilot registration endpoint. Cover: successful registration, duplicate email rejection, validation errors (missing fields, invalid email, invalid date), authentication requirements, and response format verification. Include setup and teardown for test data. Write at least 12 test cases.

Grading: 36 points. 3 points per test case.

**Lab 3: Performance Test Plan** (25 minutes)

Design a performance test plan for an API with 3 endpoints: list pilots (GET), create training session (POST), and generate report (GET). Specify: load scenarios (normal, peak, stress), performance thresholds (response time, error rate, throughput), the testing tool and configuration, and how to interpret the results.

Grading: 20 points. 5 points per component.

## Evidence

- Testing Node.js APIs: github.com/goldbergyoni/nodebestpractices
- Jest documentation: jestjs.io
- Supertest: github.com/ladakh/supertest
- Artillery: docs.articulat.io
- Pact contract testing: docs.pact.io
- OWASP API Security Testing: owasp.org/www-project-api-security
- Martin Fowler's Testing Pyramid: martinfowler.com/bliki/TestPyramid.html
