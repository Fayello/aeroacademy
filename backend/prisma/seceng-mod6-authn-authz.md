# Module 6 — Authentication and Authorization

Authentication and authorization are the two most security-critical components of any application. Authentication answers "who are you?" and authorization answers "what are you allowed to do?" A flaw in either component can compromise the entire application, regardless of how secure every other component is. The history of security breaches is littered with incidents that began with authentication or authorization failures — credential stuffing attacks that gained access through weak passwords, session hijacking that stole legitimate users' sessions, and privilege escalation that turned regular users into administrators.

The technical implementation of authentication and authorization is well-understood. The challenges are in the details: generating secure tokens, managing session lifetimes, handling credential recovery, implementing multi-factor authentication correctly, and designing authorization models that are both expressive enough to handle real-world requirements and simple enough to verify and audit.

## OAuth 2.0 Flows

OAuth 2.0 is the industry standard for delegated authorization. It allows a user to grant a third-party application limited access to their resources without sharing their credentials. Understanding the OAuth 2.0 flows is essential because each flow has different security properties, and choosing the wrong flow for a use case creates vulnerabilities.

### Authorization Code Flow

The authorization code flow is the most secure OAuth 2.0 flow for server-side applications. The client redirects the user to the authorization server, the user authenticates and grants consent, the authorization server redirects back to the client with an authorization code, and the client exchanges the code for tokens by making a direct request to the authorization server.

The security of this flow relies on the authorization code being short-lived and single-use, and on the token exchange happening server-side where the client secret is not exposed to the browser. An attacker who intercepts the authorization code cannot exchange it for tokens without the client secret.

A common mistake is using the authorization code flow for single-page applications (SPAs) without PKCE. In a SPA, the authorization code is returned to the browser, and if the application does not use PKCE, an attacker who intercepts the code can exchange it for tokens. PKCE (Proof Key for Code Exchange) mitigates this by requiring the client to prove it initiated the authorization request.

### Authorization Code Flow with PKCE

PKCE adds a code verifier and code challenge to the authorization code flow. The client generates a random code verifier, hashes it to create a code challenge, includes the code challenge in the authorization request, and includes the code verifier in the token exchange request. The authorization server verifies that the code verifier matches the code challenge, ensuring that the client that initiated the request is the same client exchanging the code.

PKCE is required for public clients (SPAs, mobile apps) and recommended for all clients. It prevents authorization code interception attacks even if the client secret is compromised.

### Client Credentials Flow

The client credentials flow is used for machine-to-machine authentication where no user is involved. The client authenticates directly with the authorization server using its client ID and client secret, and receives an access token.

This flow is appropriate for backend services that need to access APIs on their own behalf. It is not appropriate for any flow where a user is involved, because it does not support user consent or user-scoped permissions.

### Implicit Flow (Deprecated)

The implicit flow returned tokens directly in the URL fragment, which was suitable for SPAs in the early days of OAuth 2.0 but is now deprecated due to security concerns. Tokens in the URL fragment are exposed to the browser history, referrer headers, and JavaScript on the page. The authorization code flow with PKCE provides the same functionality without these risks.

If you encounter an application using the implicit flow, migrate to the authorization code flow with PKCE. The implicit flow should not be used for new applications.

## JWT: Structure, Signing, Validation

JSON Web Tokens (JWTs) are the most common token format used in modern applications. A JWT consists of three parts: a header, a payload, and a signature. The header specifies the signing algorithm, the payload contains claims (user ID, roles, expiration), and the signature ensures the token has not been tampered with.

### JWT Structure

A JWT looks like this: `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZXMiOlsidXNlciJdfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`

The three parts are base64url-encoded. The header and payload are not encrypted — they are readable by anyone with the token. The signature ensures integrity but not confidentiality. If you need to protect the token contents, use JWE (JSON Web Encryption) instead of JWS (JSON Web Signature).

### Common Pitfalls

**Algorithm Confusion:** The `alg` header specifies the signing algorithm. An attacker can modify the `alg` to `none` (which some libraries accept) or change from asymmetric to symmetric signing (`RS256` to `HS256`) and sign the token with the public key (which is often publicly available). The fix: the server should ignore the `alg` header and use a pre-configured algorithm. Or validate that the `alg` matches the expected algorithm.

**Key Confusion:** When using asymmetric signing (RSA), the server signs with the private key and verifies with the public key. If the server accepts the public key as the signing key for HMAC, an attacker can sign a token using the public key. The fix: use a dedicated library that handles algorithm verification correctly.

**Missing Expiration:** JWTs without expiration tokens (`exp` claim) are valid forever. If a token is compromised, it remains usable indefinitely. The fix: always include an `exp` claim with a short expiration time (5-15 minutes for access tokens).

**Insecure Storage:** Storing JWTs in `localStorage` makes them accessible to JavaScript, which means any XSS vulnerability compromises all tokens. The fix: store tokens in httpOnly, secure, same-site cookies.

**Insufficient Validation:** Libraries that do not validate the issuer (`iss`), audience (`aud`), and expiration (`exp`) claims allow tokens from other applications or expired tokens to be accepted. The fix: validate all claims explicitly using the library's validation functions.

## Session Management: Tokens vs Sessions

Session management is the mechanism that maintains user state across multiple requests. The two primary approaches are server-side sessions and token-based sessions (using JWTs or similar tokens).

### Server-Side Sessions

Server-side sessions store session data on the server and provide the client with a session ID (typically in a cookie). The client sends the session ID with each request, and the server looks up the session data.

Server-side sessions are simple and secure. Session data is never exposed to the client. Sessions can be invalidated server-side (on logout, password change, or suspected compromise). The session store can be centralized (Redis, database) to support multiple application instances.

The limitation is scalability. Server-side sessions require shared state between application instances. In a distributed system, this requires a shared session store, which adds latency and a single point of failure. Server-side sessions also do not work well for cross-domain authentication (SSO) because cookies are domain-scoped.

### Token-Based Sessions

Token-based sessions store all session data in the token itself. The server signs the token and sends it to the client. The client sends the token with each request, and the server validates the signature and extracts the session data without a database lookup.

Token-based sessions are stateless and scalable — no shared state is required between application instances. They work well for microservices architectures where requests may be routed to any instance. They support cross-domain use cases because tokens are not domain-scoped.

The limitation is revocation. Once a token is issued, it remains valid until it expires. If a user's permissions change or a token is compromised, the server cannot immediately invalidate it. Mitigation strategies include short token lifetimes, token blacklists (which reintroduce state), and refresh token rotation.

### Choosing Between Them

For most applications, a hybrid approach works best. Use server-side sessions for the primary authentication mechanism (login, logout, session management) and short-lived JWTs for API authentication. This gives you the simplicity and revocability of server-side sessions for user management and the statelessness and scalability of JWTs for API access.

## Multi-Factor Authentication

Multi-factor authentication (MFA) adds an additional verification step beyond the password. The three factors are something you know (password), something you have (device), and something you are (biometric). MFA requires at least two of these factors.

### TOTP (Time-Based One-Time Password)

TOTP generates a time-based code (typically 6 digits) using a shared secret and the current time. The user scans a QR code to set up TOTP in an authenticator app. The app generates a new code every 30 seconds. The server verifies the code using the shared secret and the current time.

TOTP is widely supported and easy to implement. The shared secret must be stored securely (encrypted at rest). The server should accept codes within a time window (typically ±1 step) to account for clock skew. Rate limiting on TOTP verification prevents brute-force attacks.

### WebAuthn and FIDO2

WebAuthn is a web standard for passwordless authentication using hardware security keys or platform authenticators (fingerprint readers, face recognition). FIDO2 is the underlying protocol that enables WebAuthn.

WebAuthn is the strongest MFA option available. The private key never leaves the user's device. The server stores a public key and a credential ID. During authentication, the server sends a challenge, the device signs the challenge using the private key, and the server verifies the signature using the stored public key.

WebAuthn is resistant to phishing because the credential is bound to the origin. A phishing site cannot use the credential because it is registered to a different origin. It is resistant to credential stuffing because there is no shared secret to steal. It is resistant to replay attacks because the challenge is unique per authentication attempt.

The limitation is user experience. Hardware security keys must be purchased and carried. Platform authenticators require devices with biometric capabilities. Recovery mechanisms (backup keys, backup authenticators) must be designed and communicated to users.

## RBAC vs ABAC vs ReBAC

Authorization models define how permissions are structured and evaluated. The choice of model affects the expressiveness, maintainability, and auditability of your authorization logic.

### Role-Based Access Control (RBAC)

RBAC assigns permissions to roles, and users are assigned to roles. A user's permissions are the union of all permissions assigned to their roles. RBAC is simple to implement and audit — you can list all roles, list all permissions per role, and verify that the authorization logic correctly evaluates roles.

The limitation of RBAC is that it cannot express context-dependent permissions. "User can access their own data" requires a role for every user, which is impractical. "User can access data only during business hours" is not expressible in standard RBAC. "Manager can approve requests for their direct reports" requires a role for every manager-report relationship.

### Attribute-Based Access Control (ABAC)

ABAC evaluates permissions based on attributes of the subject, object, and environment. A policy might state: "Allow access if the subject's department equals the object's department, the subject's clearance level is greater than or equal to the object's classification, and the current time is within business hours."

ABAC is highly expressive and can handle complex authorization requirements. It is well-suited for systems with dynamic permissions and context-dependent access control.

The limitation of ABAC is complexity. Policies can be difficult to write, test, and audit. Debugging authorization failures is harder because the evaluation depends on multiple attributes that may change over time. Performance can be an issue if policies require queries to external systems for attribute values.

### Relationship-Based Access Control (ReBAC)

ReBAC evaluates permissions based on relationships between subjects and objects. Zanzibar, Google's authorization system, is a well-known ReBAC implementation. A policy might state: "User can access document if user is the owner, or user is a collaborator, or user is in the same group as the owner."

ReBAC is natural for systems where access is determined by organizational structure, team membership, or document sharing. It is more expressive than RBAC for relationship-dependent permissions and simpler than ABAC for common access patterns.

The limitation of ReBAC is that it requires a relationship store that efficiently evaluates relationship queries. Zanzibar-style systems (SpiceDB, OpenFGA, Ory Keto) provide this capability but add infrastructure complexity.

## Real Scenario: Implementing SSO for 5000 Employees

Consider a company with 5000 employees, 15 SaaS applications, and no existing SSO infrastructure. The goal is to implement SSO so that employees authenticate once and can access all applications without re-authenticating.

The architecture begins with an identity provider (IdP) that serves as the central authentication authority. The IdP manages user identities, authenticates users, and issues tokens that the SaaS applications (service providers) use to verify identity.

The implementation phases:

**Phase 1: Identity Provider Setup.** Deploy an IdP (Keycloak, Auth0, Azure AD, or Okta). Configure the user directory to synchronize with the company's HR system. Define the user schema: employee ID, email, department, role, groups, and MFA status. Configure password policies: minimum 12 characters, no reuse of last 12 passwords, account lockout after 5 failed attempts.

**Phase 2: MFA Enrollment.** Require all employees to enroll in MFA before accessing any SaaS application. Support TOTP as the primary factor and WebAuthn as the preferred factor. Provide hardware security keys to employees who cannot use platform authenticators. Set a 30-day enrollment window, after which unenrolled accounts are locked.

**Phase 3: Application Integration.** Integrate each SaaS application with the IdP using SAML 2.0 or OIDC. For applications that do not support SAML or OIDC, deploy a proxy (Dex, Keycloak) that handles authentication and passes user attributes to the application. Configure single logout so that logging out of the IdP terminates sessions in all applications.

**Phase 4: Group-Based Authorization.** Define groups in the IdP that map to application roles. When an employee's department changes in the HR system, their group membership updates automatically, and their application permissions change accordingly. This eliminates the manual process of granting and revoking application access when employees change roles.

**Phase 5: Monitoring and Compliance.** Configure audit logging for all authentication events. Generate monthly reports showing which employees have access to which applications. Review dormant accounts (no login in 90 days) and disable them. Monitor for anomalous authentication patterns (multiple failed attempts, logins from unusual locations).

The rollout timeline: Phase 1 (4 weeks), Phase 2 (2 weeks), Phase 3 (8 weeks, with applications rolled out in batches of 3-4), Phase 4 (4 weeks), Phase 5 (2 weeks). Total: approximately 20 weeks.

The expected outcomes: 80% reduction in password-related support tickets, 60% reduction in time to provision new employee access, immediate revocation of access for terminated employees (currently takes 2-3 days), and compliance with SOC 2 access control requirements.

## Password Storage

Passwords must be stored using a slow, salted hashing algorithm. The algorithm must be slow enough to make brute-force attacks impractical (millions of iterations) but fast enough to not impact user experience during login (under 1 second per hash).

### Argon2id

Argon2id is the winner of the Password Hashing Competition and is the recommended algorithm for new applications. It is resistant to both GPU and side-channel attacks. Argon2id has three parameters: memory cost (how much RAM is required), time cost (how many iterations), and parallelism (how many threads).

A recommended configuration for Argon2id:
- Memory: 64 MB (65536 KB)
- Iterations: 3
- Parallelism: 4

This configuration takes approximately 0.5 seconds on modern hardware and requires approximately 64 MB of RAM per hash, making GPU-based attacks expensive.

### bcrypt

bcrypt is a widely-used password hashing algorithm based on the Blowfish cipher. It is implemented in most languages and is well-understood. bcrypt's work factor is configurable (the `cost` parameter), and each increment doubles the computation time.

A recommended configuration for bcrypt:
- Cost: 12 (approximately 250ms on modern hardware)
- For high-security applications: Cost: 14 (approximately 1 second)

bcrypt's limitation is that it uses a fixed 18 KB of memory, making it less resistant to GPU-based attacks than Argon2id. However, bcrypt is still considered secure for password storage and is more widely available than Argon2id.

### scrypt

scrypt is a memory-hard algorithm designed to be resistant to GPU and hardware attacks. It requires a configurable amount of memory (the `N` parameter), making it more expensive to attack with specialized hardware than bcrypt.

scrypt is a good choice for applications where GPU resistance is a priority. However, its memory requirement can cause performance issues on low-memory systems, and it is less widely implemented than bcrypt.

### What Not to Use

MD5 and SHA1 are not password hashing algorithms. They are fast by design, which is the opposite of what you need for password storage. An attacker with a modern GPU can test billions of MD5 hashes per second. SHA256 is also too fast for password storage without key stretching.

The `hashlib.pbkdf2_hmac` function in Python uses PBKDF2, which is an acceptable password hashing algorithm but is less resistant to GPU attacks than Argon2id, bcrypt, or scrypt. PBKDF2 with 600,000 iterations and SHA256 is the minimum acceptable configuration.

## Assessment

**Lab 6.1 — OAuth 2.0 Implementation (60 minutes)**
Implement an OAuth 2.0 authorization server that supports the authorization code flow with PKCE and the client credentials flow. The server must validate tokens, enforce expiration, and support token revocation. Test the implementation using a provided client application and verify that each flow works correctly and that common attacks (algorithm confusion, token replay, code interception) are prevented.

**Grading criteria:**
- Correct implementation of authorization code flow with PKCE (15 points)
- Correct implementation of client credentials flow (10 points)
- Proper token validation and expiration enforcement (10 points)
- Token revocation functionality (5 points)
- Prevention of common attacks: algorithm confusion, token replay, code interception (10 points)

**Lab 6.2 — JWT Security Analysis (45 minutes)**
Analyze a set of 10 JWTs for security issues. For each token, identify whether the signature is valid, whether the algorithm is secure, whether the claims are appropriate, and whether the token has expired. For each vulnerability found, provide a specific attack scenario and a fix.

**Grading criteria:**
- Correct validation of all 10 tokens (10 points)
- Identification of at least 5 security issues across the tokens (15 points)
- Specific attack scenarios for each issue (10 points)
- Correct fixes for each issue (10 points)

**Lab 6.3 — Authorization Model Design (45 minutes)**
Design an authorization model for a hospital information system using RBAC, ABAC, and ReBAC. The system must support: doctors accessing patient records in their department, nurses accessing patient records for patients under their care, administrators accessing system configuration, patients accessing their own records, and researchers accessing anonymized data. Compare the three models for this use case and recommend the best fit.

**Grading criteria:**
- Complete RBAC model with defined roles and permissions (10 points)
- Complete ABAC model with defined attributes and policies (10 points)
- Complete ReBAC model with defined relationships (10 points)
- Comparison of the three models for this use case (10 points)
- Justified recommendation (10 points)

## Evidence

Authentication and authorization are the gatekeepers of every application. A flaw in authentication means an attacker can become any user. A flaw in authorization means any user can do anything. These are the most impactful vulnerability classes because they bypass all other security controls — if the attacker can authenticate as an administrator, encryption, input validation, and network security are irrelevant.

The OAuth 2.0 flows in this module demonstrate why choosing the correct flow matters. The implicit flow, once standard for SPAs, is now deprecated because tokens were exposed to the browser. The authorization code flow with PKCE provides the same functionality without the security risks. The difference is not in the functionality but in the security properties — and understanding those properties is the core competency of security engineering.

JWTs are powerful but dangerous when misused. The common pitfalls in this module — algorithm confusion, key confusion, missing expiration, insecure storage — are not theoretical. They are regularly exploited in production systems. The fix is not to avoid JWTs but to implement them correctly using well-tested libraries and following the validation practices outlined here.

MFA is the single most effective control against credential-based attacks. TOTP provides a significant security improvement with minimal user friction. WebAuthn provides the strongest available protection against phishing and credential theft. The investment in MFA is trivial compared to the cost of a credential-based breach.

## Summary

Authentication and authorization are the two most security-critical components of any application. OAuth 2.0 provides the standard framework for delegated authorization, with the authorization code flow with PKCE as the recommended approach for all client types. JWTs provide the standard token format, but require careful implementation to avoid common pitfalls. Session management must balance security (short-lived tokens, revocation capability) with user experience. MFA adds a critical layer of protection, with WebAuthn providing the strongest available security.

Authorization models must match the application's requirements. RBAC works for simple role-based access. ABAC handles complex, context-dependent policies. ReBAC naturally models relationship-based access. The choice depends on the specific requirements, and most complex systems benefit from combining multiple models.

Password storage must use slow, salted hashing algorithms (Argon2id, bcrypt, scrypt) with appropriate parameters. The investment in correct password storage is trivial compared to the cost of a credential compromise.