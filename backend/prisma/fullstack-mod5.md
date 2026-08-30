# Module 5 — Authentication: JWT, OAuth, and Session Management

## What You'll Actually Do

Implement authentication from scratch. You'll generate and verify JWTs, handle OAuth flows, and manage sessions properly. You'll also learn the security mistakes that lead to real breaches — and how to avoid them.

---

## How JWT Works

A JSON Web Token has three parts: header, payload, signature. The payload carries claims (user ID, role, expiry). The signature prevents tampering.

```javascript
// src/services/tokenService.js
const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

function generateTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { sub: user.id },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken };
```

**Why short-lived access tokens:** If a token leaks, the attacker has 15 minutes. The refresh token lets legitimate users get new access tokens without re-logging in.

---

## Password Hashing — Never Store Plain Text

```javascript
// src/services/passwordService.js
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

module.exports = { hashPassword, verifyPassword };
```

**Why bcrypt:** It's slow on purpose. A fast hash like MD5 lets attackers try billions of passwords per second. bcrypt makes each attempt take ~100ms, which makes brute force impractical.

---

## Complete Auth Flow

```javascript
// src/routes/auth.js
const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const { hashPassword, verifyPassword } = require("../services/passwordService");
const { generateTokens, verifyRefreshToken } = require("../services/tokenService");
const { findUserByEmail, createUser } = require("../models/user");
const { storeRefreshToken, findRefreshToken, deleteRefreshToken } = require("../models/session");

router.post("/register", [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body("name").trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existing = await findUserByEmail(req.body.email);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hashedPassword = await hashPassword(req.body.password);
  const user = await createUser({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });

  const tokens = generateTokens(user);
  await storeRefreshToken(user.id, tokens.refreshToken);

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email },
    ...tokens,
  });
});

router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = await findUserByEmail(req.body.email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await verifyPassword(req.body.password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const tokens = generateTokens(user);
  await storeRefreshToken(user.id, tokens.refreshToken);

  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    ...tokens,
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await findRefreshToken(payload.sub, refreshToken);
    if (!stored) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Rotate: delete old, issue new
    await deleteRefreshToken(payload.sub, refreshToken);

    const tokens = generateTokens({ id: payload.sub });
    await storeRefreshToken(payload.sub, tokens.refreshToken);

    res.json(tokens);
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await deleteRefreshToken(payload.sub, refreshToken);
    } catch {
      // Token might already be expired — that's fine
    }
  }
  res.json({ message: "Logged out" });
});

module.exports = router;
```

---

## OAuth with GitHub (Simplified)

```javascript
// src/routes/oauth.js
const router = require("express").Router();

router.get("/github", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    scope: "user:email",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get("/github/callback", async (req, res) => {
  const { code } = req.query;

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token } = await tokenRes.json();

  // Fetch user info
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const githubUser = await userRes.json();

  // Find or create user in your database
  let user = await findUserByGithubId(githubUser.id);
  if (!user) {
    user = await createUser({
      email: githubUser.email,
      name: githubUser.name,
      githubId: githubUser.id,
    });
  }

  const tokens = generateTokens(user);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}`);
});

module.exports = router;
```

---

## Protecting Routes

```javascript
// src/middleware/auth.js
const { verifyAccessToken } = require("../services/tokenService");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = verifyAccessToken(header.split(" ")[1]);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
```

---

## Security Checklist

- Store refresh tokens in a database (not just in the token — you need to revoke them)
- Use `httpOnly` and `secure` flags on cookies if using cookie-based auth
- Rate-limit login attempts (5 per minute per IP)
- Never return the password hash in API responses
- Validate input on every auth endpoint

---

## Assessment

**Lab Task: Full Auth System (60 minutes)**

Build a complete authentication system:

1. **Registration:** Email/password signup with validation (min 8 chars, uppercase, lowercase, number). Hash passwords with bcrypt.
2. **Login:** Verify credentials, return access token (15 min) and refresh token (7 days).
3. **Token refresh:** Implement token rotation — old refresh token is deleted, new pair issued.
4. **Logout:** Invalidate refresh token server-side.
5. **Protected route:** Middleware that checks access token and returns user info.
6. **Rate limiting:** Add basic rate limiting to login endpoint (use an in-memory store).

**Deliverables:** Complete auth routes, token service, password service, and middleware. Test script demonstrating register → login → access protected route → refresh → logout flow.

**Grading:**
- Registration validates and hashes passwords: 20%
- Login returns proper tokens: 20%
- Token refresh rotates correctly: 20%
- Protected route works with valid token: 20%
- Logout invalidates refresh token: 10%
- Rate limiting on login: 10%

---

## Evidence

Save all auth-related files. Include the test script output showing the full auth flow. Note any security considerations you implemented.
