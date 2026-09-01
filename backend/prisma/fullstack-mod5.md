# Module 5: Authentication

Authentication is the process of verifying who a user is. Authorization is the process of verifying what they can do. This module covers both: implementing JWT-based authentication, understanding OAuth 2.0, managing sessions, and building a complete login/logout flow. Security is not optional: every mistake here is a potential data breach.

## Authentication vs Authorization

Authentication answers "who are you?" Authorization answers "what are you allowed to do?" A user can be authenticated (logged in) but not authorized to access a specific resource (like an admin panel). Your application must handle both correctly.

The most common mistake is treating authentication as a feature you bolt on at the end. Authentication shapes your entire data model, your API design, your middleware, and your frontend state management. Build it first.

There are three primary authentication strategies in web applications. Session-based authentication stores user state on the server and sends a session ID cookie to the client. Token-based authentication (JWT) stores user claims in a signed token that the client sends with each request. OAuth delegates authentication to a third-party provider like Google or GitHub. Each strategy has trade-offs. Sessions are simpler to revoke but require server-side storage. JWTs are stateless but harder to revoke. OAuth is convenient for users but adds complexity to your application.

The choice of authentication strategy affects your entire architecture. If you choose JWT, your frontend needs to manage token storage, handle token refresh, and attach tokens to requests. If you choose sessions, your backend needs a session store (like Redis) and your frontend needs to handle cookies. If you choose OAuth, you need to register with providers, handle callback URLs, and manage linked accounts. None of these choices is wrong, but they each require different infrastructure and different code patterns.

When building a full-stack application, start by deciding on your authentication strategy before writing any code. The authentication layer touches every part of your application: the database schema (user table, roles, permissions), the API (login, register, logout, refresh endpoints), the middleware (authentication checks, role-based access), the frontend (login forms, token management, protected routes), and even your deployment (secrets management, HTTPS configuration).

## JWT Implementation

JSON Web Tokens (JWT) are the standard for stateless authentication. A JWT is a signed token that contains claims about the user. The server signs the token with a secret key. The client sends the token with each request. The server verifies the signature and extracts the user information.

### How JWT Works

1. User provides credentials (email and password).
2. Server validates credentials against the database.
3. Server creates a JWT containing the user's ID and role.
4. Server signs the JWT with a secret key and sends it to the client.
5. Client stores the token (usually in memory or localStorage).
6. Client sends the token in the `Authorization` header with each request.
7. Server verifies the token signature and extracts user information.

The token is self-contained: the server does not need to look up the user in the database for every request. The trade-off is that you cannot revoke a JWT before it expires (without additional mechanisms).

### Token Generation

A JWT consists of three parts separated by dots: header, payload, and signature. The header specifies the algorithm used to sign the token. The payload contains the claims (user ID, email, role, expiration time). The signature ensures the token has not been tampered with. When you call `jwt.sign()`, the library encodes the header and payload as base64, signs them with the secret, and returns the three-part string.

The secret key used for signing is the most critical piece of your authentication system. If an attacker obtains the secret, they can create valid tokens for any user. Never hardcode the secret in your source code. Use environment variables and rotate the secret periodically. When rotating, keep both the old and new secrets valid for a grace period so existing tokens do not break.

```javascript
const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}
```

Access tokens are short-lived (15 minutes). Refresh tokens are long-lived (7 days). When the access token expires, the client uses the refresh token to get a new access token without re-entering credentials. The reason for two token types is security: if an access token is stolen, it is only valid for 15 minutes. If a refresh token is stolen, the attacker can get new access tokens indefinitely, which is why refresh tokens need additional protections like database storage, rotation, and revocation.

### Token Verification

```javascript
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Authentication error" });
  }
}
```

### Token Refresh Flow

```javascript
// Refresh token endpoint
app.post("/api/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token is revoked
    const isRevoked = await Redis.get(`revoked:${refreshToken}`);
    if (isRevoked) {
      return res.status(401).json({ error: "Refresh token revoked" });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Revoke old refresh token
    await Redis.set(`revoked:${refreshToken}`, "1", "EX", 7 * 24 * 60 * 60);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});
```

### Token Revocation

JWTs are stateless by design, but you sometimes need to revoke them (user changes password, user logs out, security breach). Use a blacklist:

```javascript
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);

async function revokeToken(token) {
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.set(`revoked:${token}`, "1", "EX", ttl);
  }
}

async function isTokenRevoked(token) {
  const result = await Redis.get(`revoked:${token}`);
  return result === "1";
}
```

Token revocation adds complexity to an otherwise stateless system. You need to check the blacklist on every request, which adds a Redis lookup to every authenticated request. You need to set the TTL on the blacklist entry to match the token expiry, so expired tokens do not clutter the cache. You need to decide when to revoke tokens: on logout, on password change, on account deletion, or on security incidents.

A common approach is to use refresh token rotation instead of access token revocation. When the client uses a refresh token to get a new access token, the old refresh token is deleted and a new one is issued. If an attacker steals a refresh token and uses it, the legitimate user's next refresh attempt will fail (because the token was already used), which alerts both the user and the system to the compromise. This detection mechanism is more practical than trying to revoke individual access tokens.

For applications that require immediate revocation (like banking or healthcare), consider using sessions instead of JWTs. Sessions are stored server-side, so revoking a session is as simple as deleting it from the store. The trade-off is that sessions require server-side storage and do not work well in distributed systems without a shared session store.

## OAuth 2.0

OAuth 2.0 is a protocol that lets third-party applications access user data without sharing passwords. When you click "Sign in with Google," you are using OAuth 2.0. The key insight of OAuth is that the user authenticates with the provider (Google, GitHub, Facebook) and the provider gives your application a limited-access token. Your application never sees the user's password.

OAuth is particularly useful for applications that need to access user data from multiple sources. A project management tool might let users sign in with Google and also connect their GitHub account to link pull requests to tasks. Each connection is a separate OAuth flow, and the application stores the access tokens for each provider.

There are four OAuth grant types, but for web applications you will primarily use the Authorization Code grant. The other grant types (Implicit, Password, Client Credentials) are either deprecated or designed for machine-to-machine communication. The Authorization Code flow works by redirecting the user to the provider, having them authenticate, and then redirecting back to your application with an authorization code. Your application then exchanges this code for an access token by making a server-side request to the provider.

Security considerations for OAuth include: always use HTTPS for redirect URIs, validate the state parameter to prevent CSRF attacks, store tokens securely (never in localStorage for production applications), and request only the scopes your application actually needs. Requesting excessive permissions erodes user trust and increases the damage if your application is compromised.

### OAuth Flow

1. User clicks "Sign in with Google" on your application.
2. Your application redirects the user to Google's authorization endpoint.
3. User logs in with Google and grants permission.
4. Google redirects back to your application with an authorization code.
5. Your application exchanges the authorization code for an access token.
6. Your application uses the access token to fetch user information from Google.
7. Your application creates or finds the user in your database and issues a JWT.

### Implementation with Passport.js

```javascript
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
          isVerified: true
        });
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

// Routes
app.get("/api/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })
);

app.get("/api/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false
  }),
  (req, res) => {
    // Issue JWT
    const accessToken = generateAccessToken(req.user);
    const refreshToken = generateRefreshToken(req.user);

    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
  }
);
```

### OAuth for Multiple Providers

```javascript
// github.js
const GitHubStrategy = require("passport-github2").Strategy;

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });

      if (!user) {
        user = await User.create({
          githubId: profile.id,
          email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
          name: profile.displayName || profile.username,
          avatar: profile.photos[0]?.value,
          isVerified: true
        });
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));
```

## Session Management

Sessions store user state on the server. The client receives a session ID (usually in a cookie) and sends it with each request. The server looks up the session data using the session ID. This is the oldest and most straightforward authentication mechanism in web applications.

Session management has advantages that are often overlooked. When a user changes their password, you can invalidate all their sessions instantly by clearing the session store. When an admin needs to force-logout a user, they can delete that user's session. When you need to audit who is logged in, you can query the session store. None of these operations are straightforward with JWT.

The downside of sessions is that they require server-side storage. For a single-server application, this is trivial (in-memory storage works). For a distributed application with multiple servers, you need a shared session store like Redis. This adds infrastructure complexity but is manageable with modern tools.

### Session vs JWT

Sessions are server-side. You control when they expire, and you can revoke them instantly. JWTs are client-side. You cannot revoke them without additional infrastructure (like Redis blacklisting).

For most applications, sessions are simpler and more secure. JWTs are better when you need stateless authentication across multiple services. If you are building a monolithic application with a single frontend, sessions are usually the better choice. If you are building a microservices architecture where services need to verify authentication independently, JWTs are more practical.

A common misconception is that JWTs are always faster than sessions because they do not require a database lookup. This is true for the happy path, but JWTs require additional infrastructure for revocation (Redis blacklist), refresh token management (database storage), and token rotation (additional database writes). When you factor in all the infrastructure, the performance difference is negligible for most applications.

### Express Sessions

```javascript
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL);

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({ user: { id: user.id, name: user.name, role: user.role } });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

// Check session
app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ userId: req.session.userId, role: req.session.role });
});
```

## Real Scenario: Implementing Login/Logout

Let us build a complete authentication system with registration, login, logout, token refresh, and protected routes.

### User Registration and Login

```javascript
// src/routes/auth.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { validate } = require("../middleware/validate");
const Joi = require("joi");

const prisma = new PrismaClient();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post("/register", validate(registerSchema), async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name }
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
    refreshToken
  });
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, password: true, role: true }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken
  });
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
  }

  res.json({ message: "Logged out" });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  // Verify token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken }
  });

  if (!storedToken) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  // Check expiry
  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    return res.status(401).json({ error: "Refresh token expired" });
  }

  // Verify JWT
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

module.exports = router;
```

### Frontend Authentication Hook

The frontend needs to manage authentication state, store tokens securely, and handle token refresh. This hook encapsulates all authentication logic in a single reusable function. It tracks the current user, loading state, and any errors that occur during authentication. The hook also handles automatic token refresh and provides login, register, and logout functions that update the UI state accordingly.

```javascript
// hooks/useAuth.js
function useAuth() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Check for existing session on mount
  React.useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUser(token)
        .then(setUser)
        .catch(() => localStorage.removeItem("accessToken"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
  };

  return { user, loading, error, login, register, logout };
}
```

### Protected Route Wrapper

A protected route wrapper component checks if the user is authenticated and redirects them to the login page if they are not. This eliminates the need to check authentication in every route individually. The wrapper also handles role-based access by comparing the user's role with the required role specified in the route configuration.

```jsx
// components/ProtectedRoute.jsx
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Usage in routing
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

## Assessment

### Lab Task: Build Authentication System

**Time Limit: 60 minutes**

Build a complete authentication system with the following features:

1. **Registration:** Email and password registration with validation.
2. **Login:** Email and password login that returns JWT tokens.
3. **Token Refresh:** Implement refresh token rotation.
4. **Protected Routes:** Create at least 3 protected API endpoints.
5. **Role-Based Access:** Implement role-based authorization for at least 2 roles.
6. **Frontend Integration:** Create a login form, registration form, and a protected page.

**Requirements:**
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Passwords must be hashed with bcrypt (cost factor 12)
- Refresh tokens must be stored in the database and rotated on use
- Include error handling for invalid credentials, expired tokens, and unauthorized access

### Grading Criteria

- **Registration and Login (25 points):** Working registration with validation, login that returns tokens, proper error messages.
- **Token Management (25 points):** Access and refresh token generation, token refresh with rotation, proper expiry handling.
- **Protected Routes (20 points):** Middleware correctly protects endpoints, role-based authorization works.
- **Frontend Integration (20 points):** Login and registration forms, token storage, automatic redirect on auth state change.
- **Security (10 points):** Password hashing, no plain-text secrets, proper token expiry, no sensitive data in tokens.

### Evidence

After completing this module, you should be able to:

1. Implement JWT-based authentication with access and refresh tokens.
2. Configure token expiry, signing, and verification.
3. Implement OAuth 2.0 login with at least one provider.
4. Build session-based authentication as an alternative to JWT.
5. Implement role-based authorization middleware.
6. Handle token refresh, rotation, and revocation.
7. Build frontend authentication flows with proper state management.
