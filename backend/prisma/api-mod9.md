# Module 9 — API Testing: Contract and Security Testing

## What You'll Actually Do

Write tests that verify your API behaves correctly and stays secure. You'll build contract tests that ensure your API matches its documentation, security tests that probe for common vulnerabilities, and integration tests that catch real-world bugs. Not unit tests on individual functions — tests that hit real endpoints with real data.

---

## Contract Testing: Does the API Match the Spec?

Contract tests verify your API responses match what you promised. If your docs say `GET /api/users/:id` returns `{ id, name, email }`, the test checks that's what actually comes back.

```javascript
const request = require('supertest');
const app = require('../app');

describe('GET /api/users/:id', () => {
  it('returns user with correct shape', async () => {
    const res = await request(app)
      .get('/api/users/1')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      email: expect.stringMatching(/@/),
    });

    // Verify no extra fields leak
    const allowedFields = ['id', 'name', 'email', 'created_at'];
    const returnedFields = Object.keys(res.body.data);
    expect(returnedFields.sort()).toEqual(allowedFields.sort());
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app)
      .get('/api/users/999999')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid ID', async () => {
    await request(app)
      .get('/api/users/abc')
      .expect(400);
  });
});
```

**Automate contract testing:** Run these tests on every deploy. If a response shape changes, the test fails and you catch the breaking change before clients do.

```javascript
// Schema validation in tests
function validateUserSchema(user) {
  const required = ['id', 'name', 'email'];
  for (const field of required) {
    expect(user).toHaveProperty(field);
  }
  expect(typeof user.id).toBe('number');
  expect(typeof user.name).toBe('string');
  expect(typeof user.email).toBe('string');
}
```

---

## Security Testing: Probe for Common Vulnerabilities

These tests don't check if features work — they check if attackers can break in.

```javascript
describe('Security: Authentication', () => {
  it('rejects requests without token', async () => {
    await request(app)
      .get('/api/profile')
      .expect(401);
  });

  it('rejects invalid tokens', async () => {
    await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalidtoken123')
      .expect(401);
  });

  it('rejects expired tokens', async () => {
    const expiredToken = generateExpiredToken();
    await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });
});

describe('Security: Input Validation', () => {
  it('rejects SQL injection in query params', async () => {
    const res = await request(app)
      .get("/api/users?name='; DROP TABLE users; --")
      .expect(400); // or 200 with empty results, never 500

    // Verify the table still exists
    await request(app).get('/api/users').expect(200);
  });

  it('rejects XSS in user input', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: '<script>alert("xss")</script>', email: 'test@test.com' })
      .expect(422);

    // Verify the script tag was stripped or rejected
    expect(res.body.error).toBeDefined();
  });

  it('rejects oversized payloads', async () => {
    const hugePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB
    await request(app)
      .post('/api/users')
      .send({ name: hugePayload })
      .expect(413);
  });
});

describe('Security: Authorization', () => {
  it('prevents regular user from accessing admin endpoints', async () => {
    const userToken = await loginAs('user');
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('prevents IDOR (accessing other users data)', async () => {
    const userToken = await loginAs('user1');
    await request(app)
      .get('/api/users/user2-private-data')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
```

---

## Rate Limiting Tests

```javascript
describe('Security: Rate Limiting', () => {
  it('returns rate limit headers', async () => {
    const res = await request(app)
      .get('/api/users')
      .expect(200);

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
  });

  it('returns 429 when limit exceeded', async () => {
    // Send requests up to the limit
    const limit = 5;
    for (let i = 0; i < limit; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });
    }

    // Next request should be rate limited
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrong' })
      .expect(429);

    expect(res.body.error).toContain('Too many');
    expect(res.headers['retry-after']).toBeDefined();
  });
});
```

---

## Integration Tests: Real Workflows

Test complete user flows, not just individual endpoints.

```javascript
describe('Workflow: User Registration and Login', () => {
  it('registers, verifies email, logs in, accesses protected resource', async () => {
    // Step 1: Register
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'SecurePass1', name: 'Test User' })
      .expect(201);

    const verificationToken = reg.body.data.verificationToken;

    // Step 2: Verify email
    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationToken })
      .expect(200);

    // Step 3: Login
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'new@test.com', password: 'SecurePass1' })
      .expect(200);

    const token = login.body.data.token;

    // Step 4: Access protected resource
    await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

---

## Test Organization

```
tests/
  contract/          → Response shape and format tests
    users.test.js
    products.test.js
  security/          → Vulnerability probe tests
    auth.test.js
    input-validation.test.js
    authorization.test.js
    rate-limiting.test.js
  integration/       → Complete workflow tests
    registration.test.js
    checkout.test.js
  helpers/           → Shared test utilities
    auth.js          → Login helpers, token generators
    db.js            → Test database setup/teardown
```

---

## Assessment

**Lab Task: Test Suite for an API (60 minutes)**

Given an existing API with authentication, user management, and a protected resource:

1. Write 5 contract tests verifying response shapes and status codes
2. Write 5 security tests: missing auth, invalid token, SQL injection, XSS, rate limiting
3. Write 2 integration tests for complete user workflows
4. Run the full test suite and verify all tests pass
5. Write a test report summarizing what was covered and any findings

**Deliverables:** Test files in the directory structure above, `test-report.md` with results and coverage.

**Grading:**
- Contract tests verify correct response shapes: 25%
- Security tests cover auth, injection, XSS, and rate limiting: 35%
- Integration tests cover complete workflows: 20%
- All tests pass and report is accurate: 20%

---

## Evidence

Run the full test suite and screenshot the output. Include the test report with pass/fail counts and any security findings. Show at least one security test that catches a vulnerability.
