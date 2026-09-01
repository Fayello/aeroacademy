# Module 1: How Web Applications Actually Work

Every web application attack begins with understanding how HTTP works at a mechanical level. Not the textbook definition: the actual bytes moving between your browser and a server. When you intercept a request in Burp Suite and see raw headers, when you craft a payload that needs to land in a specific header field, when you manipulate cookies to hijack a session: none of that makes sense unless you can visualize the full request/response lifecycle. This module strips away the abstractions and shows you exactly what happens when a browser talks to a server, and where attackers find their opening.

## The HTTP Request in Detail

An HTTP request is a text-based message sent from a client to a server. Every request follows the same structure: a request line, headers, an optional body. The request line contains the method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD), the target URI, and the HTTP version. Here is a raw HTTP request captured from a real login attempt:

```
POST /api/auth/login HTTP/1.1
Host: app.example.com
Content-Type: application/json
Cookie: session_id=a1b2c3d4e5f6; tracking=xyz789
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json, text/plain, */*
Origin: https://app.example.com
Referer: https://app.example.com/login
Content-Length: 58
Connection: keep-alive

{"username":"admin","password":"s3cur3P@ssw0rd"}
```

The request line `POST /api/auth/login HTTP/1.1` tells the server three things: the method (POST), the resource path (/api/auth/login), and the protocol version (HTTP/1.1). HTTP/2 changes the wire format to binary frames, but the logical structure remains the same.

The Host header is mandatory in HTTP/1.1. It tells the server which virtual host to route to. A single IP address can serve hundreds of domains: the Host header is how the server knows which one you want. This is a common attack surface: manipulating the Host header can sometimes bypass access controls, trigger password reset poisoning, or cause cache poisoning.

Headers like Content-Type tell the server how to interpret the body. Cookie headers carry session tokens. User-Agent identifies the client. Origin and Referer indicate where the request originated. Each of these headers can be manipulated by an attacker, and each has been the root cause of real vulnerabilities.

The request body carries data submitted by the client. For POST requests, this is typically form data or JSON. The Content-Type header tells the server how to parse the body. A request with `Content-Type: application/x-www-form-urlencoded` sends data as key=value pairs separated by ampersands. A request with `Content-Type: multipart/form-data` sends data as encoded parts separated by a boundary string, which is how file uploads work. A request with `Content-Type: application/json` sends raw JSON.

Security testers pay close attention to the body because it is the primary vector for injection attacks. SQL injection payloads land in form fields. XSS payloads land in text areas. Command injection payloads land in any field that gets passed to an operating system command. The format of the body determines how you encode and deliver these payloads.

## The HTTP Response

The server's response follows a parallel structure: status line, headers, body. A successful response looks like this:

```
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session_id=NEW_TOKEN_HERE; HttpOnly; Secure; SameSite=Strict
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Cache-Control: no-store
Content-Length: 142

{"status":"success","token":"eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4ifQ.hash"}
```

The status code communicates the result. 2xx means success, 3xx means redirect, 4xx means client error, 5xx means server error. Security testers pay close attention to status codes because they leak information. A 403 Forbidden tells you a resource exists but you lack permission. A 404 Not Found tells you it does not exist. A 401 Unauthorized tells you authentication is required. These differences let an attacker enumerate valid endpoints, valid usernames, and valid parameters.

The status line also includes a reason phrase ("OK", "Not Found", "Internal Server Error") that can vary between server implementations. Apache and Nginx might use different reason phrases for the same status code. This information can fingerprint the server software.

The Set-Cookie header in the response is how the server establishes a session. The browser stores this cookie and sends it back with every subsequent request to that domain. The attributes on the cookie determine its security posture:

- **HttpOnly**: Prevents JavaScript from reading the cookie. This is the primary defense against session theft via XSS.
- **Secure**: The cookie is only sent over HTTPS. Without this, an attacker on the same network can sniff the cookie in plaintext.
- **SameSite**: Controls whether the cookie is sent with cross-origin requests. Strict prevents all cross-site cookie sending, Lax allows it for top-level navigations, None allows it everywhere (requires Secure).
- **Path**: Limits the cookie to a specific URL path.
- **Domain**: Controls which subdomains receive the cookie.
- **Max-Age / Expires**: Determines how long the cookie persists.
- **Priority**: Controls cookie priority when the browser's cookie store is full (Chrome-specific).

A missing HttpOnly flag means any XSS payload can steal the session cookie. A missing Secure flag means the cookie travels in plaintext over HTTP. A missing SameSite attribute leaves the application open to CSRF attacks. These are not theoretical concerns: they are the difference between a secure application and one that gets breached.

Other response headers carry security implications:

- **X-Content-Type-Options: nosniff** prevents the browser from MIME-sniffing a response away from the declared Content-Type. Without it, the browser might interpret a text/html response as a script.
- **X-Frame-Options: DENY** prevents the page from being loaded in an iframe, blocking clickjacking attacks.
- **Strict-Transport-Security** forces HTTPS for the domain.
- **Content-Security-Policy** restricts content sources.
- **Referrer-Policy** controls how much information the Referer header sends.
- **Permissions-Policy** controls access to browser features like camera, microphone, and geolocation.

## TLS Handshake: What Happens Before HTTP

Before any HTTP request travels over the wire, a TLS handshake establishes an encrypted channel. Understanding this handshake matters because TLS misconfigurations are a major vulnerability class.

In TLS 1.2, the handshake works like this: the client sends a ClientHello message listing supported cipher suites and TLS versions. The server responds with its chosen cipher suite, its certificate (containing the public key), and optionally a request for client certificate authentication. The client verifies the server's certificate against its trusted CA store, generates a pre-master secret, encrypts it with the server's public key, and sends it back. Both sides derive session keys from this pre-master secret and switch to encrypted communication.

TLS 1.3 simplified this to a single round trip. The client sends supported groups and key shares in the ClientHello. The server responds with its chosen parameters and its certificate. The client can immediately send encrypted data. This is faster and eliminates several legacy cipher suites that were vulnerable.

The security-critical parts for a web tester are:

1. **Certificate validation**: Does the server present a valid certificate? Is it expired? Is it for the correct domain? Does the certificate chain to a trusted root? Tools like `openssl s_client` let you inspect this directly.

2. **Cipher suite selection**: Is the server allowing weak ciphers? RC4, DES, 3DES, export-grade ciphers, and null ciphers are all dangerous. The cipher suite determines the encryption algorithm, key exchange method, and hash function used.

3. **Protocol version**: Is the server allowing SSLv3 or TLS 1.0? Both are vulnerable to known attacks (POODLE, BEAST). A secure configuration should enforce TLS 1.2 or 1.3 only.

4. **HSTS**: The Strict-Transport-Security header tells the browser to only use HTTPS for that domain. Without it, an attacker can strip TLS on the first request (SSL stripping attack) and downgrade to HTTP.

5. **Certificate Transparency**: Modern certificates are logged in public CT logs. Checking for SCTs (Signed Certificate Timestamps) in the TLS handshake verifies that the certificate has been logged.

6. **OCSP Stapling**: The server can include OCSP (Online Certificate Status Protocol) responses in the TLS handshake, telling the client whether the certificate has been revoked. Without stapling, the client must make a separate request to the CA's OCSP responder, which can fail closed or fail open depending on the client's policy.

The TLS handshake also reveals information to passive observers. The SNI (Server Name Indication) extension in the ClientHello reveals which domain the client is connecting to, even though the connection is encrypted. This is a privacy concern because ISPs and network observers can see which websites a user visits.

## Same-Origin Policy and CORS

The Same-Origin Policy (SOP) is the browser's fundamental security mechanism. It prevents a script on one origin from reading data from another origin. An origin is defined as the combination of protocol, hostname, and port. `https://app.example.com:443` and `https://api.example.com:443` are different origins because the hostnames differ. `http://app.example.com` and `https://app.example.com` differ because the protocols differ.

SOP does not prevent sending requests to other origins: it prevents reading the responses. This is why CSRF attacks work: a form on `evil.com` can submit a POST request to `bank.com/api/transfer`, and the browser will include the bank.com cookies automatically. The SOP only blocks the attacker from reading the response, but the server-side action (transferring money) still executes.

Cross-Origin Resource Sharing (CORS) is the mechanism that relaxes SOP when legitimately needed. The server sends Access-Control-Allow-Origin headers that tell the browser which origins are permitted to read the response. A misconfigured CORS policy is one of the most impactful vulnerabilities you can find.

The dangerous pattern is when a server reflects the Origin header in Access-Control-Allow-Origin without validation:

```
Request:
Origin: https://evil.com

Response:
Access-Control-Allow-Origin: https://evil.com
Access-Control-Allow-Credentials: true
```

This means any website can make authenticated requests to the API and read the responses. An attacker hosts a page on evil.com that makes fetch requests to the target API with credentials included. The browser sends the victim's cookies, the server responds with the data, and the CORS headers allow evil.com's JavaScript to read it. This completely bypasses the Same-Origin Policy.

The secure configuration is to either use a static whitelist of allowed origins or validate the incoming Origin against a whitelist before reflecting it. Never use a wildcard (`*`) with credentials. Never reflect the Origin header without validation.

CORS preflight requests add another attack surface. When a browser makes a "non-simple" request (anything beyond GET with standard headers), it sends an OPTIONS request first. The server responds with CORS headers indicating what is allowed. If the server allows credentials and reflects arbitrary origins in the preflight response, the attack works even for complex requests.

## Content Security Policy (CSP)

CSP is an HTTP response header that tells the browser which sources of content are trusted. It is the primary defense against XSS. A strict CSP can prevent inline script execution, block loading scripts from untrusted domains, and restrict where forms can submit data.

A basic CSP looks like this:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.example.com; frame-ancestors 'none'
```

This says: load scripts only from the same origin, load styles from the same origin (plus inline styles), load images from the same origin and data URIs, make API connections to the same origin and api.example.com, and do not allow the page to be framed by anyone.

The 'unsafe-inline' directive weakens CSP significantly because it allows arbitrary inline scripts. Many real-world CSP implementations use nonces or hashes instead of unsafe-inline, which allows specific inline scripts while blocking all others.

CSP bypass techniques are common in penetration tests. An attacker might find a JSONP endpoint on the trusted domain that can be used to load scripts. They might find a subdomain with XSS that allows them to set cookies or redirect. They might exploit a path traversal to get their payload served from the trusted domain. CSP is not a silver bullet: it is a defense-in-depth layer that must be implemented carefully.

CSP Level 3 introduces additional directives like `require-trusted-types-for` which prevents DOM XSS by requiring all DOM manipulation to go through trusted types APIs. This is a powerful mitigation but requires application refactoring to adopt.

## Browser DevTools for Security Testing

The browser's developer tools are the first instrument a security tester picks up. The Network tab shows every request and response, including headers, cookies, and timing. The Console tab lets you execute JavaScript in the page context. The Application tab shows stored cookies, local storage, session storage, and service workers.

For security testing, the most useful DevTools features are:

**Request interception**: In the Network tab, you can right-click any request and copy it as a cURL command. This gives you the exact request with all headers and cookies, ready to replay in a terminal or modify in Burp Suite.

**Cookie inspection**: The Application tab shows every cookie set by the domain, including its flags (HttpOnly, Secure, SameSite). A missing HttpOnly flag on a session cookie is an immediate finding.

**JavaScript debugging**: The Sources tab lets you set breakpoints and step through JavaScript execution. This is critical for finding DOM-based XSS, where the vulnerability exists in client-side code rather than server-side code.

**Local storage inspection**: Tokens stored in localStorage are accessible to any JavaScript on the page, including XSS payloads. Storing sensitive tokens in localStorage is a vulnerability in itself. Cookies with HttpOnly are more secure for session management.

**CORS testing**: You can use the Console to make fetch requests to other origins and see whether the browser blocks them. `fetch('https://api.example.com/users', {credentials: 'include'})` will tell you immediately whether CORS is misconfigured.

**Service worker inspection**: The Application tab shows registered service workers. A compromised service worker can intercept all network requests for its scope, acting as a man-in-the-browser. Checking for suspicious service workers is part of modern web security testing.

**DOM inspection**: The Elements tab shows the current DOM state, including dynamically inserted elements. This is useful for identifying XSS payloads that have been injected and rendered by the browser.

## Proxy Interception with Burp Suite

Burp Suite is the standard proxy tool for web application testing. It sits between your browser and the server, capturing every request and response. You can modify requests before they reach the server and modify responses before they reach the browser.

The workflow is straightforward: configure your browser to use Burp as a proxy (typically 127.0.0.1:8080), install Burp's CA certificate so it can intercept HTTPS traffic, and browse the target application. Burp captures everything in the HTTP history tab.

The key capabilities for security testing are:

**Repeater**: Take any request from the history, modify it, and resend it. This is how you test for injection vulnerabilities: change a parameter value to a SQL injection payload and observe the response. Test for IDOR by changing an ID parameter. Test for access control by removing authentication headers.

**Intruder**: Automate parameter fuzzing. Send a request with a parameter replaced by a list of payloads. This is used for brute force attacks, directory enumeration, and fuzzing for injection points. The position markers define where payloads are injected, and the payload list defines what values to try. Intruder supports four attack types: Sniper (single payload set), Battering Ram (same payload in all positions), Pitchfork (parallel payload sets), and Cluster Bomb (all combinations).

**Decoder**: Encode and decode data in various formats: URL encoding, base64, HTML entities, hex. Many vulnerabilities require properly encoded payloads to work.

**Comparer**: Diff two responses side by side. This is useful for identifying how a parameter change affects the response: does a valid user return different content than an invalid user?

**Scanner**: Automated vulnerability scanning. While manual testing is always more thorough, the scanner can catch low-hanging fruit like missing headers, known CVEs in detected technologies, and obvious injection points.

**Logger**: Records all proxy traffic for later analysis. Useful for identifying patterns in how the application handles different types of input.

**Target**: Organizes discovered content into a site map. The crawler automatically discovers endpoints, parameters, and content types.

## Real Scenario: Tracing a Login Request End-to-End

Let me walk through a complete login flow as seen from a security testing perspective. You open the browser and navigate to `https://app.example.com/login`. The browser performs a DNS lookup, establishes a TCP connection, completes the TLS handshake, and sends an HTTP GET request. The server responds with the HTML of the login page.

The login page contains a form that submits to `/api/auth/login` via POST. The form has two fields: username and password. When you fill in the form and click Submit, the browser constructs a POST request with a JSON body containing the credentials.

You intercept this request in Burp Suite. The raw request looks like:

```
POST /api/auth/login HTTP/1.1
Host: app.example.com
Content-Type: application/json
Cookie: csrf_token=abc123; analytics_id=xyz
Origin: https://app.example.com
Content-Length: 55

{"username":"user@test.com","password":"MyP@ssw0rd!"}
```

The server processes the credentials. If valid, it responds with:

```
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjM0NTY3ODkwLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c; HttpOnly; Secure; SameSite=Strict
Set-Cookie: csrf_defense=xyz789; Path=/api

{"status":"success","redirect":"/dashboard"}
```

From a security perspective, here is what you check:

1. **Session cookie flags**: HttpOnly is present (good: prevents JavaScript access). Secure is present (good: HTTPS only). SameSite=Strict (good: prevents CSRF). All three flags are properly set.

2. **Token structure**: The session token is a JWT. You decode the payload and see the user_id and role. The role is "admin": this means the role is embedded in the client-side token. Can you modify the token to change the role to "admin"? You test this by decoding the JWT, changing the role claim, and re-encoding it. If the server does not verify the signature properly (for example, if it uses the "none" algorithm), you have a privilege escalation vulnerability.

3. **Error handling**: You try an invalid username. The server responds with `{"error":"Invalid credentials"}`. You try a valid username with an invalid password. The server responds with the same message. Good: it does not reveal whether the username exists. But you try a non-existent email and get `{"error":"User not found"}`. Now you have a username enumeration vulnerability: the error message differs based on whether the user exists.

4. **Rate limiting**: You send 100 rapid login attempts. If the server does not rate-limit, you have a brute force vulnerability. Check for lockout mechanisms, account lockout notifications, and whether the rate limit applies per-IP or per-account.

5. **Transport security**: The response includes `Strict-Transport-Security: max-age=31536000; includeSubDomains`. This tells the browser to use HTTPS for the next year, including all subdomains. Without this header, an attacker could strip TLS on the first request.

6. **CSRF protection**: The login form includes a csrf_token in a cookie, but the server does not validate a matching CSRF token in the request body or a custom header. This means the login endpoint might be vulnerable to CSRF: an attacker could force a victim to log in as the attacker's account, setting up a session fixation attack.

7. **Timing analysis**: Measure the time between request and response for valid vs invalid usernames. If valid usernames take longer (because the server performs password hashing), you can enumerate valid usernames through timing side channels.

8. **Response header analysis**: Check for server version disclosure, technology stack headers, and any custom headers that reveal implementation details.

This single login request tells you the state of TLS, cookie security, session management, error handling, rate limiting, CSRF protection, and potential for privilege escalation. This is the level of analysis you need to apply to every endpoint you test.

## HTTP/2 and HTTP/3 Considerations

HTTP/2 multiplexes multiple requests over a single TCP connection using binary frames. This changes how some attacks work. Request smuggling, which exploits discrepancies between how front-end and back-end servers parse HTTP requests, becomes more complex in HTTP/2 because the binary framing eliminates some of the ambiguity that HTTP/1.1 smuggling relies on. However, HTTP/2 introduces new attack surfaces like stream manipulation and frame-level vulnerabilities.

HTTP/3 runs over QUIC (UDP) instead of TCP. This eliminates head-of-line blocking at the transport layer and provides built-in encryption for the handshake. From a security testing perspective, HTTP/3 does not change the application-layer attack surface: the HTTP semantics remain the same. But the encryption of the transport header means some network-level inspection tools cannot see the QUIC frames, which can blind security monitoring.

HTTP/2 stream manipulation attacks allow an attacker to send crafted frames that cause the server to process requests out of order, potentially bypassing security controls. The HTTP/2 specification requires servers to process frames in order, but implementation bugs can create exploitation opportunities.

## Practical Exercise: Full Request Analysis

Take a web application you have access to (a lab environment, a bug bounty target, or your own application). Perform the following steps:

1. Open Burp Suite and configure your browser proxy. Browse through the entire application, clicking every link and submitting every form.

2. For each unique request type (GET, POST, PUT, DELETE), open it in Repeater. Change one parameter at a time and observe the response. Document every difference.

3. Examine every Set-Cookie header. Check each cookie for HttpOnly, Secure, and SameSite flags. Note any missing flags.

4. Check the CORS configuration by examining Access-Control-Allow-Origin headers in responses. If the Origin header is reflected, test whether credentials are also allowed.

5. Check for the Content-Security-Policy header. If present, analyze the directives and identify potential bypass vectors. If absent, note it as a finding.

6. Examine error responses. Trigger errors by sending invalid input, malformed JSON, missing required fields, and oversized payloads. Document the error messages: do they leak implementation details, stack traces, or database information?

7. Check for information disclosure in response headers. Server headers, X-Powered-By, X-AspNet-Version, and similar headers reveal technology stack details.

8. Test for HTTP method tampering. Send requests with different methods (GET, POST, PUT, DELETE, OPTIONS, PATCH) to the same URL. Some servers respond differently to different methods, and this can bypass access controls.

9. Analyze the TLS certificate. Use `openssl s_client -connect target.com:443` to examine the certificate chain, expiry, key size, and signature algorithm. Check for deprecated protocols and weak cipher suites.

10. Test for HTTP request smuggling by sending malformed requests. In HTTP/1.1, ambiguous Content-Length and Transfer-Encoding headers can cause parsing discrepancies between front-end and back-end servers.

Each of these steps builds your understanding of how the application handles HTTP at a fundamental level. Every subsequent module in this course builds on this foundation. You cannot find injection vulnerabilities if you do not understand where user input enters the application. You cannot exploit session management flaws if you do not understand how cookies work. You cannot bypass access controls if you do not understand how the server identifies and authorizes requests.

## Key Takeaways

HTTP is a text-based protocol with a simple request/response structure. Security vulnerabilities live in the gaps between how different components parse and interpret this text. The headers, cookies, status codes, and security mechanisms discussed in this module are the building blocks of every web application attack. Master them, and you have the foundation for everything that follows.

The browser enforces security policies (SOP, CSP, cookie flags) that the server cannot control. Understanding these client-side mechanisms is essential because many vulnerabilities exist at the intersection of server-side logic and client-side enforcement. An attacker who understands both sides of this boundary can find and exploit gaps that neither side intended to exist.

Every security assessment starts with mapping the application: understanding what endpoints exist, what parameters they accept, what headers they use, and how they handle errors. This reconnaissance phase determines the success of every subsequent attack. Rushing to exploit without understanding the application's HTTP behavior is the most common mistake new testers make.
