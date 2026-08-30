# Module 10 — Modern Attack Surfaces

**Course:** Web Application Security | **Path:** Web App Security (10 of 10)

---

## What You'll Actually Do

You'll understand modern attack surfaces — WebSockets, supply chain attacks, and how to secure modern applications.

---

## WebSocket Security

```text
WebSocket: ws://example.com/ws
Connection: Upgrade
Upgrade: websocket
```

**Vulnerabilities:**
```text
No authentication on WebSocket connection
Cross-Site WebSocket Hijacking
Unvalidated input in WebSocket messages
DoS via message flooding
```

**Prevention:**
```text
- Authenticate on connection
- Validate Origin header
- Sanitize all input
- Rate limit messages
```

---

## Supply Chain Attacks

```text
Dependency confusion:
  Attacker publishes malicious package with same name as internal package
  npm install internal-pkg → installs attacker's version

Typosquatting:
  Attacker publishes "expresss" (3 s's)
  Developer mistypes → installs malicious package

Compromised dependency:
  Maintainer account hacked → malicious code in update
  event-stream, ua-parser-js, coa → all happened
```

**Prevention:**
```text
- Lock file (package-lock.json, yarn.lock)
- Verify checksums
- Use private registry for internal packages
- Monitor dependencies (Snyk, Dependabot)
- Pin dependency versions
```

---

## Server-Side Template Injection (SSTI)

```text
Input: {{7*7}}
Output: 49
→ Template engine is processing input as template

Exploit:
{{config.__class__.__init__.__globals__['os'].popen('id').read()}}
→ Remote code execution
```

**Prevention:**
```text
- Never render user input as template
- Use sandboxed templates
- Validate input
```

---

## Assessment

**Lab task (25 min):**

1. Find WebSocket vulnerabilities
2. Understand supply chain attack vectors
3. Detect SSTI in a template
4. Test for each vulnerability
5. Fix each issue

**Grading:**
- WebSocket tested: 20%
- Supply chain understood: 20%
- SSTI detected: 25%
- Fixes applied: 35%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO10 — Modern Attack Surfaces` — final competency for Web Application Security

---

## Course Complete

You can now:
- Understand HTTP and web architecture
- Exploit and prevent injection attacks
- Find and fix XSS vulnerabilities
- Attack and secure authentication
- Test access control (IDOR)
- Find and fix misconfigurations
- Understand cryptographic failures
- Exploit and prevent SSRF
- Secure REST and GraphQL APIs
- Understand modern attack surfaces
