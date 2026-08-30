# Module 1 — How Web Apps Actually Work

**Course:** Web Application Security | **Path:** Web App Security (1 of 10)

---

## What You'll Actually Do

You need to understand how HTTP works before you can attack it. You'll trace requests, manipulate headers, intercept traffic, and understand the request/response cycle.

---

## HTTP Request/Response

```http
POST /api/login HTTP/1.1
Host: example.com
Content-Type: application/json
Cookie: session=abc123
Content-Length: 45

{"email":"alice@example.com","password":"s3cret"}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session=xyz789; HttpOnly; Secure; SameSite=Strict
Content-Length: 52

{"token":"eyJhbGciOiJIUzI1NiJ9...","user":"alice"}
```

Every web interaction is a request and a response. Understanding the details is where security starts.

---

## HTTP Methods

| Method | Purpose | Idempotent | Has body |
|--------|---------|-----------|----------|
| GET | Read | Yes | No |
| POST | Create | No | Yes |
| PUT | Update (full) | Yes | Yes |
| PATCH | Update (partial) | No | Yes |
| DELETE | Delete | Yes | Optional |
| OPTIONS | CORS preflight | Yes | No |

**Security relevance:** GET should never modify data. If it does, CSRF is trivial.

---

## Status Codes

```text
2xx: Success
  200 OK
  201 Created
  204 No Content

3xx: Redirect
  301 Moved Permanently
  302 Found (temporary)
  304 Not Modified

4xx: Client Error
  400 Bad Request
  401 Unauthorized (not authenticated)
  403 Forbidden (not authorized)
  404 Not Found
  405 Method Not Allowed
  429 Too Many Requests

5xx: Server Error
  500 Internal Server Error
  502 Bad Gateway
  503 Service Unavailable
```

---

## Headers That Matter

**Request headers:**
```text
Authorization: Bearer <token>
Cookie: session=abc123
Content-Type: application/json
X-Forwarded-For: 10.0.0.1
```

**Response headers:**
```text
Set-Cookie: session=xyz; HttpOnly; Secure; SameSite=Strict
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

---

## Cookies and Sessions

```text
1. User sends credentials
2. Server validates, creates session, sends Set-Cookie
3. Browser sends cookie on every request
4. Server reads session from cookie
```

**Security:**
```text
HttpOnly: No JavaScript access (prevents XSS stealing cookies)
Secure: HTTPS only
SameSite: No cross-site sending (prevents CSRF)
Path: Restrict cookie scope
```

---

## Tools

```bash
# curl — manual requests
curl -v -X POST https://example.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"test"}'

# Intercept with Burp Suite / OWASP ZAP
# Modify requests in transit
# Replay with different parameters
```

---

## Assessment

**Lab task (20 min):**

1. Use curl to send GET and POST requests
2. Inspect request/response headers
3. Intercept a request with Burp/ZAP
4. Modify a request and observe the response
5. Identify security headers in a response

**Grading:**
- curl used: 15%
- Headers inspected: 20%
- Intercept successful: 25%
- Modification tested: 20%
- Security headers identified: 20%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO1 — HTTP Fundamentals`
