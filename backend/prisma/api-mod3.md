# Module 3 — Authentication

Authentication is the process of verifying that a caller is who they claim to be. It is the front door of your API. If the front door is broken — if tokens are guessable, if keys are logged in plaintext, if sessions can be hijacked — nothing else you build matters. This module covers the three authentication mechanisms you will encounter in practice: API keys, OAuth 2.0, and JSON Web Tokens (JWT). We will look at how each one works, where each one fails, and how to implement them correctly.

The first thing to understand about authentication is the distinction between authentication and authorization. Authentication answers the question "Who are you?" Authorization answers "What are you allowed to do?" This module is about the first question. Module 4 covers the second.

## API Keys

API keys are the simplest authentication mechanism. A server generates a random string, associates it with a client, and the client sends that string with every request. The server looks up the key, finds the associated client, and proceeds.

### How API Keys Work

When a client registers with your API, you generate a key:

```
ak_live_7f3a9b2c4d5e6f7a8b9c0d1e2f3a4b5c
```

The key is stored in your database, associated with the client's identity and permissions. When the client makes a request, it sends the key in a header:

```
GET /api/v1/aircraft HTTP/1.1
Host: api.example.com
Authorization: ApiKey ak_live_7f3a9b2c4d5e6f7a8b9c0d1e2f3a4b5c
```

Or alternatively:

```
GET /api/v1/aircraft HTTP/1.1
Host: api.example.com
X-API-Key: ak_live_7f3a9b2c4d5e6f7a8b9c0d1e2f3a4b5c
```

The server extracts the key from the header, looks it up in the database (or a cache like Redis), and identifies the client. If the key is not found, the server returns 401 Unauthorized.

### Where API Keys Work Well

API keys are appropriate for:

**Server-to-server communication.** When one backend service calls another, API keys are simple and effective. Both sides are trusted environments, and the key can be stored securely in environment variables.

**Third-party integrations.** When a developer signs up to use your API, you give them a key. They include it in their requests. You track usage per key for billing, rate limiting, and abuse detection.

**Low-security scenarios.** Internal tools, development environments, and prototypes where the cost of key compromise is low.

### Where API Keys Fail

**They identify the application, not the user.** An API key tells you which application is making the request, not which human authorized it. If a developer's key is leaked (committed to a public GitHub repository, pasted in a Slack channel, logged in an access log), anyone can use it to make requests on behalf of that developer's application.

**They are long-lived.** Most API keys do not expire by default. A leaked key remains valid until someone manually revokes it. Compare this to OAuth tokens, which typically expire in hours or minutes.

**They encourage bad practices.** Developers tend to hardcode API keys in source code, embed them in mobile apps, or store them in configuration files that get committed to version control. GitHub receives over 10,000 requests per day to scan repositories for leaked API keys. It is a constant battle.

### API Key Best Practices

If you use API keys (and you will — they are unavoidable for many use cases), follow these practices:

**Generate keys with sufficient entropy.** A 32-character hexadecimal string provides 128 bits of entropy, which is sufficient against brute-force attacks. Do not use sequential IDs, timestamps, or predictable patterns.

**Prefix keys with an environment identifier.** `ak_live_` for production, `ak_test_` for development. This prevents test keys from being accidentally used in production and vice versa. Stripe, Twilio, and other major API providers use this pattern.

**Hash keys before storing them.** Do not store API keys in plaintext in your database. Store a SHA-256 hash of the key. When a request comes in, hash the presented key and compare it to the stored hash. This way, if your database is compromised, the attacker gets hashes, not usable keys.

```
# During key generation:
key = generate_random_string(32)
hashed_key = sha256(key)
store_in_database(client_id, hashed_key)

# During request validation:
presented_key = extract_from_header(request)
hashed_presented = sha256(presented_key)
client = database.lookup_by_hash(hashed_presented)
```

**Rotate keys periodically.** Provide a mechanism for developers to regenerate their API keys. When a new key is generated, the old one should continue to work for a grace period (24-48 hours) before being deactivated. This prevents service interruptions during key rotation.

**Log key usage, not key values.** Never log the full API key. Log the last 4 characters and the client identifier. If you need to audit which key made a request, the hash in the database is sufficient.

**Rate limit per key.** Each API key should have its own rate limit. This prevents one misbehaving client from affecting others. The rate limit should be configurable per client based on their plan.

### API Key Storage Patterns

How you store and look up API keys affects both security and performance:

**Database lookup.** Store the hashed key in the database. On each request, hash the presented key and query the database. This is simple but adds a database query to every request.

**Redis cache.** Cache the hashed key in Redis with a TTL. On each request, check Redis first. If the key is in the cache, use the cached client information. If not, fall back to the database and populate the cache. This reduces database load but adds complexity.

**Bloom filter.** For large-scale APIs with millions of keys, a Bloom filter can quickly reject invalid keys without a database lookup. The Bloom filter has a small false positive rate (it might say a key exists when it does not), but it never has false negatives (it never says a valid key does not exist). When the Bloom filter says the key might exist, you fall back to the database.

### API Key Revocation

When a key is compromised, it must be revoked immediately. The revocation process:

1. The developer (or an administrator) triggers key revocation
2. The key is marked as revoked in the database (with a `revoked_at` timestamp)
3. The cached key in Redis is invalidated
4. Subsequent requests with the revoked key receive 401 Unauthorized
5. The developer generates a new key

For emergency revocation (e.g., a key is found in a public repository), the system should revoke the key within seconds, not minutes. This requires real-time cache invalidation.

## OAuth 2.0

OAuth 2.0 is an authorization framework that has become the de facto standard for delegated access. It allows a user to grant a third-party application limited access to their resources without sharing their credentials.

### Why OAuth Exists

Before OAuth, if a flight training app wanted to access a pilot's data from an aviation database, the pilot had to give the app their username and password. The app would then log in as the pilot and access everything the pilot could access. This was terrible for several reasons:

- The app had full access to the pilot's account, not just the data it needed
- The pilot could not revoke the app's access without changing their password
- The app stored the pilot's credentials, creating a massive attack surface
- There was no way to audit what the app was doing with the pilot's credentials

OAuth solves this by introducing a delegation model. The pilot never shares their password with the app. Instead, the aviation database issues the app a limited-access token that the pilot explicitly authorized.

### OAuth 2.0 Roles

**Resource Owner** — The user who owns the data. In our example, the pilot.

**Client** — The application requesting access. In our example, the flight training app.

**Authorization Server** — The server that authenticates the resource owner and issues tokens. In our example, the aviation database's auth server.

**Resource Server** — The server hosting the protected resources. In our example, the aviation database's API server.

### OAuth 2.0 Flows

OAuth defines several grant types (flows) for different scenarios. The four most common are:

#### Authorization Code Flow

This is the most secure flow and the one you should use for most web applications.

1. The client redirects the user to the authorization server's `/authorize` endpoint:
   ```
   GET /oauth/authorize?
     response_type=code&
     client_id=flight_training_app&
     redirect_uri=https://flightapp.com/callback&
     scope=read:profile+read:flight_logs&
     state=abc123
   ```

2. The authorization server authenticates the user (usually with a login form) and asks them to approve the requested permissions.

3. If the user approves, the authorization server redirects back to the client's `redirect_uri` with an authorization code:
   ```
   GET https://flightapp.com/callback?code=AUTH_CODE_HERE&state=abc123
   ```

4. The client exchanges the authorization code for tokens by making a server-to-server request:
   ```
   POST /oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&
   code=AUTH_CODE_HERE&
   redirect_uri=https://flightapp.com/callback&
   client_id=flight_training_app&
   client_secret=SECRET
   ```

5. The authorization server validates the code and returns an access token (and optionally a refresh token):
   ```json
   {
     "access_token": "eyJhbGciOiJSUzI1NiIs...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4",
     "scope": "read:profile read:flight_logs"
   }
   ```

The `state` parameter is critical for security. It prevents CSRF attacks by ensuring the callback came from an authorization request the client initiated. Always generate a random state value, store it in the user's session, and verify it when the callback arrives.

#### Authorization Code Flow with PKCE

PKCE (Proof Key for Code Exchange) extends the authorization code flow for public clients (mobile apps, single-page applications) that cannot securely store a client secret.

The difference is that instead of sending a `client_secret` in step 4, the client generates a random code verifier, creates a code challenge from it (SHA-256 hash), and sends the challenge with the authorization request. When exchanging the code for tokens, the client sends the original code verifier. The authorization server verifies that the challenge matches the verifier.

This prevents an attacker who intercepts the authorization code from exchanging it for tokens, because they do not have the code verifier.

#### Client Credentials Flow

Used for machine-to-machine authentication where no user is involved:

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=service_a&
client_secret=SECRET&
scope=read:aircraft write:aircraft
```

The authorization server validates the client credentials and returns an access token. No user interaction is required.

This flow is appropriate for backend services that need to access resources on their own behalf. The flight training app's scheduling service might use client credentials to access the aircraft service.

#### Refresh Token Flow

Access tokens are intentionally short-lived (typically 15 minutes to 1 hour). When an access token expires, the client uses the refresh token to get a new one without requiring the user to log in again:

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
refresh_token=dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4&
client_id=flight_training_app&
client_secret=SECRET
```

The authorization server validates the refresh token and returns a new access token (and optionally a new refresh token). The old refresh token should be invalidated after use (rotation) to prevent token reuse if the refresh token is compromised.

### OAuth 2.0 Security Considerations

**Always use HTTPS.** OAuth tokens are bearer tokens — anyone who possesses one can use it. If tokens are transmitted over HTTP, they can be intercepted. Every OAuth endpoint must require HTTPS.

**Validate the `redirect_uri`.** The authorization server must validate that the `redirect_uri` in the authorization request matches a pre-registered URI for the client. An attacker could craft a malicious authorization request with a `redirect_uri` pointing to their own server, intercepting the authorization code.

**Use PKCE for all clients.** Even confidential clients (web applications with a server component) should use PKCE. It adds minimal overhead and protects against authorization code injection attacks.

**Rotate refresh tokens.** When a refresh token is used to get a new access token, issue a new refresh token and invalidate the old one. This limits the window of exploitation if a refresh token is compromised.

**Implement token revocation.** Provide a `/oauth/revoke` endpoint that allows clients (or administrators) to invalidate tokens. This is essential for logout, security incidents, and key rotation.

### OAuth 2.0 Token Storage

Where tokens are stored on the client matters for security:

**Web applications:** Store tokens in HTTP-only, Secure cookies. These are not accessible to JavaScript, which prevents XSS attacks from stealing tokens. The cookie is sent automatically with every request to the API.

**Mobile applications:** Use the platform's secure storage mechanism (iOS Keychain, Android Keystore). Never store tokens in plaintext files or SharedPreferences.

**Single-page applications:** Store tokens in memory (JavaScript variables). When the user closes the tab, the token is gone. Use refresh tokens to obtain new access tokens when needed. Avoid localStorage and sessionStorage, which are vulnerable to XSS.

## JSON Web Tokens (JWT)

JWT is a token format, not an authentication protocol. It defines how tokens are structured, signed, and verified. OAuth 2.0 is a protocol that often uses JWT as its token format.

### JWT Structure

A JWT consists of three Base64Url-encoded parts separated by dots:

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpc3MiOiJodHRwczovL2FwaS5leGFtcGxlLmNvbSIsInN1YiI6IjEyMzQ1Njc4OTAiLCJhdWQiOiJmbGlnaHR0cmFpbmluZy1hcHAiLCJleHAiOjE2OTM0MjQwMDAsImlhdCI6MTY5MzQyMDQwMCwic2NvcGUiOiJyZWFkOnByb2ZpbGUgcmVhZDpmbGlnaHRfbG9ncyJ9.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Header** (first part):
```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

**Payload** (second part):
```json
{
  "iss": "https://api.example.com",
  "sub": "1234567890",
  "aud": "flight-training-app",
  "exp": 1693424000,
  "iat": 1693420400,
  "scope": "read:profile read:flight_logs"
}
```

**Signature** (third part):
The signature is computed over the header and payload using the algorithm specified in the header. For RS256 (RSA with SHA-256), the server signs with its private key. Clients verify with the public key.

### Standard JWT Claims

- `iss` (issuer) — Who issued the token
- `sub` (subject) — Who the token is about (the user ID)
- `aud` (audience) — Who the token is intended for (the API)
- `exp` (expiration) — When the token expires (Unix timestamp)
- `iat` (issued at) — When the token was issued (Unix timestamp)
- `nbf` (not before) — When the token becomes valid (Unix timestamp)
- `jti` (JWT ID) — Unique identifier for the token (used for token revocation)

### JWT Validation

When your API receives a JWT, you must validate it before trusting it:

1. **Verify the signature.** Use the issuer's public key (obtained from the JWKS endpoint) to verify that the token was signed by the issuer and has not been tampered with.

2. **Check the expiration.** Reject tokens where `exp` is in the past. Add a small clock skew tolerance (30-60 seconds) to account for clock differences between servers.

3. **Check `iss`.** Ensure the token was issued by a trusted issuer. Do not accept tokens from unknown sources.

4. **Check `aud`.** Ensure the token was intended for your API. This prevents a token issued for one API from being used on another.

5. **Check `nbf`.** If present, reject tokens that are not yet valid.

6. **Check token revocation.** For high-security scenarios, maintain a revocation list (blacklist) and check it during validation. This adds latency and complexity, so it is usually reserved for scenarios where immediate token invalidation is required (e.g., user logout, security incident).

### JWT Security Pitfalls

**The `alg: none` attack.** Some JWT libraries support the `none` algorithm, which means no signature is required. An attacker can craft a JWT with `alg: none` and a forged payload. If the server's JWT library accepts this, the attacker can impersonate any user. Always configure your JWT library to reject the `none` algorithm.

**The algorithm confusion attack.** If the server expects RS256 (asymmetric) but the attacker sends a token signed with HS256 (symmetric) using the server's public key as the secret, some libraries will verify it successfully. Always specify which algorithms you accept and never derive the verification key from the token itself.

**Do not put secrets in the payload.** The payload is Base64Url-encoded, not encrypted. Anyone who intercepts a JWT can decode the payload and read it. Never include passwords, Social Security numbers, or other sensitive data in a JWT payload.

**Short expiration times.** JWTs are self-contained tokens that cannot be easily revoked (without a revocation list). Keep expiration times short (15 minutes to 1 hour) to limit the window of exploitation. Use refresh tokens for long-lived sessions.

**Store tokens securely on the client.** HTTP-only cookies are the most secure option for web applications. They cannot be accessed by JavaScript, which prevents XSS attacks from stealing tokens. Local storage and session storage are vulnerable to XSS.

### JWT Key Management

JWT signing keys must be managed carefully:

**Key rotation.** Sign keys should be rotated periodically (e.g., every 90 days). During rotation, the server accepts tokens signed with both the old and new keys. After a transition period, the old key is removed.

**JWKS endpoint.** Publish your public keys at `/.well-known/jwks.json`. Clients fetch this endpoint to get the public keys for token verification. The JWKS response includes a `kid` (key ID) header in each key, which matches the `kid` in the JWT header.

```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-1",
      "use": "sig",
      "n": "0vx7agoebGcQSuu...",
      "e": "AQAB"
    },
    {
      "kty": "RSA",
      "kid": "key-2",
      "use": "sig",
      "n": "yK3pY9vO2Nc8...",
      "e": "AQAB"
    }
  ]
}
```

When verifying a JWT, the server looks at the `kid` in the JWT header and selects the matching key from the JWKS endpoint.

## Implementing API Authentication: A Practical Guide

Here is how to implement authentication for a flight training API that supports both third-party applications (using OAuth 2.0) and direct API access (using API keys).

### Step 1: Design the Token Structure

For JWTs issued through OAuth 2.0:

```json
{
  "iss": "https://api.flighttraining.com",
  "sub": "pilot_456",
  "aud": "https://api.flighttraining.com",
  "exp": 1725100800,
  "iat": 1725097200,
  "scope": "pilot:read pilot:write sessions:read",
  "client_id": "training_app_abc",
  "roles": ["pilot"],
  "org_id": "flight_school_789"
}
```

### Step 2: Implement Key Endpoints

**Token endpoint:**
```
POST /oauth/token
# Handles authorization_code, refresh_token, and client_credentials grants
```

**Authorization endpoint:**
```
GET /oauth/authorize
# Redirects to login, then to client with auth code
```

**JWKS endpoint:**
```
GET /.well-known/jwks.json
# Returns public keys for JWT verification
```

**Revocation endpoint:**
```
POST /oauth/revoke
# Invalidates a token
```

### Step 3: Implement Middleware

Every protected endpoint needs middleware that:
1. Extracts the token from the `Authorization` header
2. Validates the token (signature, expiration, issuer, audience)
3. Decodes the claims and attaches them to the request context
4. Returns 401 if the token is missing, expired, or invalid

```javascript
// Pseudocode for auth middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Authorization header must start with "Bearer"'
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://api.flighttraining.com',
      audience: 'https://api.flighttraining.com'
    });
    
    req.user = {
      id: decoded.sub,
      scope: decoded.scope,
      roles: decoded.roles,
      clientId: decoded.client_id,
      orgId: decoded.org_id
    };
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'token_expired',
        message: 'Access token has expired'
      });
    }
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Token verification failed'
    });
  }
}
```

### Step 4: Scope Checking

After authentication, check that the token has the required scope for the requested operation:

```javascript
function requireScope(requiredScope) {
  return (req, res, next) => {
    const tokenScopes = req.user.scope.split(' ');
    
    if (!tokenScopes.includes(requiredScope)) {
      return res.status(403).json({
        error: 'insufficient_scope',
        message: `This operation requires the "${requiredScope}" scope`
      });
    }
    
    next();
  };
}

// Usage:
app.get('/api/v1/pilots/:id', authenticate, requireScope('pilot:read'), getPilot);
app.post('/api/v1/pilots', authenticate, requireScope('pilot:write'), createPilot);
```

### Step 5: API Key Authentication

For direct API access (not through OAuth), implement a separate authentication path:

```javascript
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'missing_api_key',
      message: 'X-API-Key header is required'
    });
  }
  
  const hashedKey = sha256(apiKey);
  const keyRecord = database.lookupKeyByHash(hashedKey);
  
  if (!keyRecord) {
    return res.status(401).json({
      error: 'invalid_api_key',
      message: 'The provided API key is invalid'
    });
  }
  
  if (keyRecord.revoked_at) {
    return res.status(401).json({
      error: 'revoked_api_key',
      message: 'This API key has been revoked'
    });
  }
  
  req.user = {
    id: keyRecord.client_id,
    scope: keyRecord.scopes,
    type: 'api_key'
  };
  
  next();
}
```

## Real Scenario: Securing a Flight Training API

Consider a flight training platform that needs to support three types of clients:

1. **The web application** — needs to act on behalf of logged-in users
2. **Mobile applications** — need to act on behalf of logged-in users, with token refresh
3. **Third-party simulation software** — needs API access for integration

The authentication architecture:

**Web and mobile applications** use OAuth 2.0 Authorization Code Flow with PKCE. The authorization server issues JWTs with 1-hour expiration and refresh tokens with 30-day expiration (rotated on each use). Scopes include `pilot:read`, `pilot:write`, `sessions:read`, `sessions:write`, `admin:read`, `admin:write`.

**Third-party simulation software** uses API keys. Each integration gets a unique key with a defined scope (usually read-only access to specific resources). Keys are hashed before storage, rotated every 90 days, and rate-limited per key.

**Backend services** use client credentials. The scheduling service uses a client credentials token to call the aircraft service. These tokens have no user context but include the calling service's identity for audit logging.

This layered approach gives you the right authentication mechanism for each use case: OAuth for user-facing applications, API keys for third-party integrations, and client credentials for machine-to-machine communication.

## Assessment

**Lab 1: JWT Construction** (30 minutes)

Given a scenario (a user logs into a flight training app), construct a complete JWT including header, payload, and describe the signature generation process. The JWT must include at least 6 standard claims and 2 custom claims. Show the Base64Url encoding for each part.

Grading: 25 points. 5 points for correct header, 10 points for correct payload with appropriate claims, 5 points for signature description, 5 points for Base64Url encoding.

**Lab 2: OAuth 2.0 Flow Diagram** (45 minutes)

Draw a complete sequence diagram for the OAuth 2.0 Authorization Code Flow with PKCE. Include all 8 steps (authorization request, user authentication, authorization grant, code exchange, token response, API request, token refresh, token revocation). For each step, show the HTTP request/response with headers and body.

Grading: 35 points. 4 points per correctly drawn step.

**Lab 3: Authentication Vulnerability Analysis** (40 minutes)

Review 5 code snippets that implement API authentication. Identify at least 4 security vulnerabilities across the snippets (e.g., missing signature verification, storing keys in plaintext, no expiration check, accepting `alg: none`, missing CSRF protection). For each vulnerability, explain the attack vector and provide the fix.

Grading: 30 points. 7.5 points per correctly identified and fixed vulnerability.

## Evidence

- OAuth 2.0 specification: RFC 6749
- JWT specification: RFC 7519
- PKCE specification: RFC 7636
- OAuth 2.0 security best practices: RFC 6819
- JWT best practices: RFC 8725
- API key management: NIST SP 800-207 (Zero Trust Architecture)
