# Module 9 — API Security

**Course:** Web Application Security | **Path:** Web App Security (9 of 10)

---

## What You'll Actually Do

You'll attack and secure REST and GraphQL APIs — broken auth, excessive data exposure, rate limiting, injection.

---

## REST API Vulnerabilities

**Broken authentication:**
```text
GET /api/users/123 → returns password hash
PUT /api/users/123/role → no authorization check
```

**Excessive data exposure:**
```json
{
  "id": 123,
  "name": "Alice",
  "email": "alice@example.com",
  "password_hash": "$argon2id$...",
  "ssn": "123-45-6789",
  "api_key": "sk_live_abc123"
}
```

**Mass assignment:**
```json
{"name": "Alice", "role": "admin"}
```
If the server accepts `role` from the client → privilege escalation.

---

## GraphQL Vulnerabilities

**Introspection:**
```graphql
query {
  __schema {
    types {
      name
      fields {
        name
      }
    }
  }
}
```
If introspection is enabled → attacker sees entire schema.

**Depth attacks:**
```graphql
query {
  user(id: 1) {
    friends {
      friends {
        friends {
          friends {  # nested deep = expensive query
          }
        }
      }
    }
  }
}
```

**Batch attacks:**
```graphql
query { user(id: 1) { email } }
query { user(id: 2) { email } }
query { user(id: 3) { email } }
# 1000 queries in one request = account enumeration
```

---

## Prevention

```text
REST:
  - Authentication on every endpoint
  - Authorization checked server-side
  - Rate limiting per endpoint
  - Input validation
  - Don't expose internal IDs

GraphQL:
  - Disable introspection in production
  - Query depth limiting
  - Query complexity analysis
  - Rate limiting per query
  - Authentication on resolvers
```

---

## Assessment

**Lab task (25 min):**

1. Find broken auth on a REST API
2. Find excessive data exposure
3. Test mass assignment
4. Exploit GraphQL introspection
5. Perform a depth attack on GraphQL
6. Fix each vulnerability

**Grading:**
- REST auth broken: 15%
- Data exposure found: 15%
- Mass assignment tested: 15%
- GraphQL introspection: 20%
- Depth attack: 15%
- Fixes correct: 20%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO9 — API Security`
