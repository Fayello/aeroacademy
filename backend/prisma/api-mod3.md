# Module 3 — Authentication: API Keys, OAuth 2.0, and JWT

## What You'll Actually Do

Implement three authentication mechanisms and understand when each one is appropriate. You'll build an API key system, an OAuth 2.0 flow, and a JWT-based auth system. No auth library magic — you'll write the logic yourself so you understand what's actually happening under the hood.

---

## API Keys: Simple, Not Secure (But Sometimes Enough)

API keys are just long random strings that identify a caller. They're not authentication in the strong sense — they identify the project, not the user. Good for server-to-server calls and tracking usage. Bad for anything exposed to browsers.

```javascript
// Generate an API key
const crypto = require('crypto');

function generateApiKey() {
  return `ak_${crypto.randomBytes(32).toString('hex')}`;
}

// Store in database
async function createApiKey(userId, name) {
  const key = generateApiKey();
  await db.apiKey.create({
    data: {
      key,
      name,
      userId,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });
  return key; // Show this ONCE, store hashed in DB
}
```

```javascript
// Middleware to validate API keys
async function authenticateApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  const record = await db.apiKey.findUnique({ where: { key } });
  if (!record || record.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired API key' });
  }

  req.user = record.userId;
  next();
}

app.use('/api', authenticateApiKey);
```

**Hash API keys before storing them.** You can't reverse a hash, so when a user provides a key, hash it and look up the hash. This way a database breach doesn't expose all your keys in plaintext.

```javascript
const crypto = require('crypto');

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}
```

---

## OAuth 2.0: Let Someone Else Handle Passwords

OAuth 2.0 lets users grant your app limited access to their account on another service (Google, GitHub, etc.) without sharing their password. You're not building a full OAuth provider here — you're implementing the client side.

**The Authorization Code Flow (what you'll use 95% of the time):**

```
1. User clicks "Login with Google"
2. You redirect them to Google's auth URL with your client_id
3. Google authenticates the user, asks for consent
4. Google redirects back to your app with an authorization code
5. Your server exchanges the code for tokens (server-to-server, no browser involved)
6. You get an access_token and refresh_token
7. Use the access_token to call Google's APIs on behalf of the user
```

```javascript
const axios = require('axios');

// Step 1: Redirect to Google
app.get('/auth/google', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: 'http://localhost:3000/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Step 4-5: Exchange code for tokens
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: 'http://localhost:3000/auth/google/callback',
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token } = tokenResponse.data;

  // Step 6: Fetch user info
  const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const googleUser = userResponse.data;

  // Find or create user in your database
  let user = await db.user.findUnique({ where: { email: googleUser.email } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: googleUser.email,
        name: googleUser.name,
        provider: 'google',
        providerId: googleUser.id,
      },
    });
  }

  // Issue your own JWT
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});
```

**Store refresh tokens encrypted.** A refresh token lets you get new access tokens without user interaction. If it leaks, the attacker has long-term access.

---

## JWT: Stateless Authentication That Actually Works

JSON Web Tokens encode user identity and permissions in a signed token. The server doesn't need to store session state — the token is self-contained.

**JWT structure:** `header.payload.signature`

```
Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": 42, "role": "admin", "iat": 1700000000, "exp": 1700003600 }
Signature: HMAC-SHA256(base64(header) + "." + base64(payload), secret)
```

```javascript
const jwt = require('jsonwebtoken');

// Generate a JWT
function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Middleware to validate JWT
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Protected route
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

**Never put sensitive data in a JWT payload.** JWTs are signed, not encrypted. Anyone can decode the payload and read it. Only put non-secret identity info (user ID, role, email).

**Use short expiry times + refresh tokens.** A 1-hour access token means a stolen token is only good for an hour. The refresh token lets legitimate users get new access tokens without re-entering credentials.

---

## Choosing the Right Mechanism

```
API Keys   → Server-to-server, rate limiting, usage tracking
OAuth 2.0  → User authentication via third-party (Google, GitHub)
JWT        → Stateful sessions on stateless APIs, microservices
```

Most production systems combine all three: OAuth for login, JWT for session management, API keys for programmatic access.

---

## Assessment

**Lab Task: Build Auth From Scratch (60 minutes)**

1. Implement API key authentication with hashed storage and expiration
2. Build an OAuth 2.0 authorization code flow (use Google or GitHub as provider)
3. Create JWT generation and validation middleware
4. Create a protected route that requires a valid JWT
5. Implement a token refresh endpoint that issues new access tokens

**Deliverables:** `auth-api.js` with all three mechanisms, a test script that demonstrates each flow.

**Grading:**
- API keys are hashed, expired keys rejected: 20%
- OAuth flow completes end-to-end: 30%
- JWT middleware correctly validates and rejects tokens: 30%
- Refresh token flow works: 20%

---

## Evidence

Screenshot your test script output for each auth mechanism. Include the curl commands that show: valid API key access, expired key rejection, successful OAuth callback, JWT validation, and token refresh.
