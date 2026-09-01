# Module 9: API Security

APIs are the backbone of modern web applications. Every mobile app, single-page application, and microservice architecture communicates through APIs. The OWASP API Security Top 10 (2023) lists the most critical API vulnerabilities, and they differ from traditional web application vulnerabilities in important ways. APIs expose more functionality than traditional web pages, process structured data, and often rely on token-based authentication rather than session cookies. Understanding API-specific attack patterns is essential for testing modern applications.

## REST API Vulnerabilities

### Broken Object Level Authorization (BOLA)

BOLA (formerly IDOR) is the number one API vulnerability. It occurs when an API endpoint accesses an object using a user-supplied identifier without verifying ownership:

```
GET /api/v1/users/12345/orders
GET /api/v1/users/12346/orders
```

The API returns order data for any user ID. The authentication middleware verifies the JWT is valid but does not check that the authenticated user is the user whose orders are being requested.

BOLA in APIs is more impactful than in traditional web applications because APIs often expose granular data. A single BOLA vulnerability in an order API can leak customer names, addresses, payment methods, order histories, and internal notes.

**Testing methodology**: Identify endpoints with resource IDs in the URL or request body. Use two different authenticated accounts. Request Account B's resources while authenticated as Account A. Test every CRUD operation (GET, POST, PUT, PATCH, DELETE) independently because authorization checks may differ per method.

### Broken Function Level Authorization (BFLA)

BFLA occurs when a regular user can access admin functions:

```
GET /api/v1/admin/users              (admin endpoint)
GET /api/v1/admin/users/config       (admin config)
POST /api/v1/admin/users/12345/role   (admin role change)
DELETE /api/v1/admin/users/12345      (admin delete)
```

APIs sometimes have separate admin and user endpoints but rely on client-side checks (hidden buttons, frontend routing) to prevent access. The server-side authorization is missing.

**Common patterns**:

- Admin endpoints at predictable paths (`/api/admin/`, `/api/v1/internal/`)
- HTTP methods not restricted (GET is protected but PUT is not)
- Role checks in middleware but not in endpoint handlers
- API documentation (Swagger/OpenAPI) exposing admin endpoints

### Mass Assignment

APIs that accept JSON bodies are particularly vulnerable to mass assignment. When a developer uses automatic object mapping:

```javascript
// Express.js with automatic body parsing
app.put('/api/users/:id', async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true});
    res.json(user);
});
```

An attacker sends:

```json
{
    "name": "John",
    "email": "john@example.com",
    "role": "admin",
    "isVerified": true,
    "balance": 1000000
}
```

The entire request body is applied to the user object. The `role`, `isVerified`, and `balance` fields are modified along with the legitimate `name` and `email`.

In different frameworks:

**Spring Boot (Java)**:
```java
// VULNERABLE - binds all request parameters
@PostMapping("/users")
public User createUser(@RequestBody User user) {
    return userRepository.save(user);
}

// SAFE - use DTO with only allowed fields
@PostMapping("/users")
public User createUser(@RequestBody UserDTO dto) {
    User user = new User();
    user.setName(dto.getName());
    user.setEmail(dto.getEmail());
    return userRepository.save(user);
}
```

**Django REST Framework (Python)**:
```python
# VULNERABLE - all fields editable
class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

# SAFE - restrict fields
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'email']
        read_only_fields = ['role', 'is_verified']
```

**ASP.NET Core (C#)**:
```csharp
// VULNERABLE - Bind properties from request body
[HttpPut("{id}")]
public IActionResult UpdateUser(int id, User user) { ... }

// SAFE - use InputModel with only allowed properties
[HttpPut("{id}")]
public IActionResult UpdateUser(int id, [FromBody] UpdateUserInput input) { ... }
```

### Excessive Data Exposure

APIs often return more data than the client needs. A user profile endpoint might return:

```json
{
    "id": 12345,
    "name": "John Doe",
    "email": "john@example.com",
    "password_hash": "$2b$12$abc...",
    "ssn": "123-45-6789",
    "salary": 95000,
    "internal_notes": "Flagged for review",
    "api_key": "sk_live_abc123...",
    "admin": false
}
```

The frontend only displays the name and email, but the API returns password hash, SSN, salary, internal notes, and API key. An attacker intercepting the API response (through XSS, network sniffing, or BOLA) gains access to all exposed fields.

**Testing**: Use a proxy to capture all API responses. Examine the JSON structure for fields not displayed in the UI. Compare the API documentation (if available) with the actual response: undocumented fields are often internal data that should not be exposed.

### Rate Limiting and Throttling

APIs without rate limiting are vulnerable to:

- **Brute force**: Automated credential testing at high speed
- **Enumeration**: Harvesting user data by iterating through IDs
- **Denial of service**: Flooding the API with requests
- **Scraping**: Automated data extraction

Rate limiting in APIs should be:

- Per-user (not just per-IP, since IPs can be rotated)
- Endpoint-specific (stricter limits on sensitive endpoints like login)
- Response-aware (different limits for successful vs failed requests)
- Documented (return Retry-After and X-RateLimit headers)

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706140800
Retry-After: 30
```

## GraphQL Attacks

GraphQL APIs have unique attack surfaces compared to REST.

### Introspection

GraphQL introspection queries reveal the entire API schema:

```graphql
{
  __schema {
    queryType { name }
    mutationType { name }
    types {
      name
      kind
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }
}
```

This reveals every type, field, query, and mutation: including sensitive fields like `salary`, `password_hash`, `internalNotes`, and admin-only mutations.

**Testing**: Send an introspection query to the GraphQL endpoint:

```bash
curl -X POST https://target.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name fields { name } } } }"}'
```

If the response contains the schema, introspection is enabled. In production, introspection should be disabled.

### Query Batching

GraphQL allows multiple operations in a single request:

```json
[
  {"query": "query { user(id: 1) { name email } }"},
  {"query": "query { user(id: 2) { name email } }"},
  {"query": "query { user(id: 3) { name email } }"},
  {"query": "query { user(id: 4) { name email } }"},
  {"query": "query { user(id: 5) { name email } }"}
]
```

Batch queries can bypass rate limits that count HTTP requests rather than operations. If the rate limiter counts "1 request" but the batch contains 100 queries, the effective rate limit is 100x weaker.

### Query Depth and Complexity

GraphQL allows nested queries that can consume excessive server resources:

```graphql
query {
  users {
    orders {
      items {
        product {
          reviews {
            author {
              orders {
                items {
                  product {
                    name
                    price
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

This query traverses 7 levels of nesting, potentially executing thousands of database queries. Without depth limiting, a single request can exhaust server resources (denial of service).

GraphQL denial of service attacks use:

- **Deep nesting**: Exponential data fetching through nested relationships
- **Broad queries**: Fetching every field on every type
- **Batch attacks**: Sending hundreds of queries in a single request
- **Circular fragments**: Using GraphQL fragments that reference each other

**Defense**: Implement query depth limiting (max 10 levels), query complexity analysis (assign costs to fields), timeout limits, and rate limiting per query complexity rather than per request.

## API Authentication

### OAuth 2.0 in APIs

OAuth 2.0 tokens in APIs have different attack patterns than browser-based OAuth:

**Token leakage in logs**: If access tokens appear in URL query parameters, they are logged by web servers, proxies, and CDNs. Always transmit tokens in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Token replay**: If an access token has a long expiry, a stolen token grants prolonged access. Access tokens should have short lifetimes (15-30 minutes) with refresh tokens for obtaining new access tokens.

**Token scope abuse**: If a token has broader permissions than needed, a compromised token grants excessive access. Follow the principle of least privilege: request only the scopes needed for the specific operation.

### JWT in API Authentication

APIs using JWT for authentication have specific vulnerabilities:

**Token in localStorage**: Many single-page applications store JWTs in localStorage, accessible to any JavaScript on the page. XSS steals the token. Store tokens in HttpOnly cookies instead (for browser-based clients) or in secure storage (for mobile apps).

**Weak signing algorithms**: As covered in Module 4, weak HMAC secrets and algorithm confusion attacks apply to API JWTs. Always validate the algorithm and use a strong secret.

**Token revocation**: JWTs are self-contained: once issued, they are valid until expiry. If a user is deactivated or a token is compromised, the only way to invalidate it is to maintain a server-side blocklist. This adds complexity and defeats the stateless nature of JWTs.

**Refresh token compromise**: Refresh tokens have longer lifetimes and are higher-value targets. They should be stored securely (HttpOnly cookies or secure storage), rotated on each use, and bound to the client (using token binding or device fingerprinting).

### API Keys

API keys are simple tokens used for identification (not authentication). They should not be used for user authentication because:

- They are long-lived and difficult to rotate
- They identify the application, not the user
- They are often shared across environments (dev, staging, production)
- They may be logged by intermediaries

API keys should be:

- Generated with sufficient entropy (at least 128 bits)
- Rotated periodically
- Scoped to specific resources and operations
- Revocable without affecting the application
- Never transmitted in URLs (use headers)

```
X-API-Key: ak_live_abc123def456ghi789
```

## API Versioning Security Implications

API versioning (URL path, query parameter, or header) creates security implications:

**Old versions remain accessible**: If v1 has a vulnerability that is fixed in v2, the v1 endpoint may remain accessible:

```
GET /api/v1/users/12345  (vulnerable)
GET /api/v2/users/12345  (fixed)
```

Attackers target the older, vulnerable version.

**Version-specific authorization**: Different API versions may have different authorization logic. A security fix in v2 might not be backported to v1, leaving v1 endpoints unprotected.

**Deprecation without removal**: Deprecated API versions should return 410 Gone after a grace period. If they remain active indefinitely, they become permanent attack surfaces.

## Real Scenario: API Enumeration Leading to Data Breach

A healthcare platform provided a patient portal with a REST API. The portal allowed patients to view their own medical records, lab results, and prescriptions.

**The API structure**:

```
GET /api/v1/patients/{patient_id}/records
GET /api/v1/patients/{patient_id}/labs
GET /api/v1/patients/{patient_id}/prescriptions
GET /api/v1/patients/{patient_id}/demographics
```

**The vulnerability discovery**: The tester authenticated as a regular patient (patient_id = 1001) and tested the BOLA vulnerability:

```
GET /api/v1/patients/1002/records
Authorization: Bearer <patient_1001_token>
```

The API returned patient 1002's full medical records. The tester iterated through patient IDs:

```
GET /api/v1/patients/1/records
GET /api/v1/patients/2/records
...
GET /api/v1/patients/50000/records
```

Each request returned the patient's complete medical records, including:

- Full name, date of birth, Social Security Number
- Medical history (diagnoses, conditions, procedures)
- Lab results (HIV tests, cancer screenings, genetic tests)
- Prescriptions (controlled substances, psychiatric medications)
- Insurance information (policy numbers, group numbers)
- Doctor's notes (including mental health evaluations)

**The enumeration**: The API did not implement rate limiting on the patient records endpoint. The tester wrote a script that enumerated patient IDs from 1 to 50,000 in parallel:

```python
import aiohttp
import asyncio
import json

async def fetch_patient(session, patient_id, token):
    headers = {'Authorization': f'Bearer {token}'}
    url = f'https://api.healthcare.com/api/v1/patients/{patient_id}/records'
    async with session.get(url, headers=headers) as resp:
        if resp.status == 200:
            return await resp.json()
        return None

async def main():
    token = 'patient_1001_token'
    connector = aiohttp.TCPConnector(limit=50)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_patient(session, i, token) for i in range(1, 50001)]
        results = await asyncio.gather(*tasks)
        valid = [r for r in results if r is not None]
        with open('patient_data.json', 'w') as f:
            json.dump(valid, f)
        print(f'Extracted {len(valid)} patient records')

asyncio.run(main())
```

**The data breach**: Over 48 hours, the tester extracted 47,892 patient records. The API returned complete medical records for each patient. No alerts were triggered because:

- The API did not rate limit
- The requests appeared legitimate (authenticated with a valid token)
- The requests were distributed across different endpoints (records, labs, prescriptions)
- The monitoring system only flagged failed authentication attempts, not authorized requests

**The impact**: Complete medical records for 47,892 patients exposed. Under HIPAA, this constitutes a reportable breach affecting 500+ individuals. The organization faced:

- Mandatory notification to all affected patients
- OCR investigation and potential fines up to $1.5 million per violation category
- Class-action lawsuit from affected patients
- Mandatory 3-year corrective action plan with external monitoring
- Estimated total cost: $12-15 million

**The root cause**: The API verified authentication (the JWT was valid) but did not verify authorization (the authenticated user was not the patient whose records were being requested). The API also lacked rate limiting, anomaly detection, and access pattern monitoring.

**The fix**:

1. Implement authorization checks on every endpoint: verify that the authenticated user owns the requested resource.
2. Implement rate limiting per user (e.g., 100 requests per hour for medical records).
3. Implement anomaly detection for unusual access patterns (sequential ID enumeration, high request volume).
4. Log all access to medical records with patient ID, user ID, timestamp, and IP address.
5. Implement API gateway with request throttling and IP-based blocking.
6. Monitor for bulk data extraction patterns in real-time.

## Practical Exercise: API Security Lab

1. **BOLA testing**: Identify all endpoints with resource identifiers. Test each endpoint with two different authenticated accounts. Document which endpoints are vulnerable to horizontal access control bypass.

2. **BFLA testing**: Enumerate admin endpoints. Test whether regular users can access admin functions. Check if admin endpoints are protected at the server level.

3. **Mass assignment**: Identify update endpoints. Submit additional fields beyond the expected schema. Check whether unexpected fields are accepted and persisted.

4. **GraphQL testing**: If the API has a GraphQL endpoint, test introspection, query depth, batch queries, and nested queries for data extraction and denial of service.

5. **Rate limiting**: Test rate limiting on authentication endpoints, data retrieval endpoints, and write endpoints. Document the limits and identify bypass methods.

6. **API documentation**: Analyze the API documentation (Swagger/OpenAPI). Identify undocumented endpoints, excessive data exposure, and deprecated endpoints still in use.

Time limit: 60 minutes. Grading criteria: BOLA identification (25%), BFLA testing (15%), mass assignment (15%), GraphQL attacks (15%), rate limiting analysis (15%), documentation (15%).
