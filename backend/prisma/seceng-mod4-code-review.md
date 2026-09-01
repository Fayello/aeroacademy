# Module 4: Secure Code Review

Secure code review is the process of examining source code to identify security vulnerabilities, logic flaws, and deviations from secure coding standards. It is the most effective method of finding vulnerabilities before they reach production because it examines the actual logic that will execute, rather than observing behavior from the outside as testing does. A penetration test might find 10% of the vulnerabilities in a codebase. A thorough code review can find the other 90%.

The challenge is that most code reviews are not designed to find security issues. Standard code reviews focus on functionality, readability, performance, and maintainability. Security is either assumed to be handled elsewhere or addressed through automated tools that miss context-dependent vulnerabilities. Effective secure code review requires a different mindset: you are not asking "does this code work?" but "how can this code be abused?"

## Manual Code Review Checklist

A manual code review checklist provides structure to an activity that otherwise risks being unfocused and inconsistent. The checklist should cover the most common vulnerability classes and be tailored to the language, framework, and application type.

**Input Validation:** Every piece of data that enters the application from an external source must be validated. This includes HTTP request parameters, headers, cookies, URL paths, file uploads, API payloads, database query results, message queue contents, and data from third-party services. Validation should be applied at the boundary: the earliest point where data enters the application: and should enforce allowlists rather than denylists. Denylists are inherently incomplete because they cannot anticipate every possible malicious input.

**Output Encoding:** Every piece of data that leaves the application toward a browser, API client, log file, or other external system must be encoded appropriately for the destination context. HTML context requires HTML entity encoding. JavaScript context requires JavaScript string encoding. SQL context requires parameterized queries (not string encoding). URL context requires URL encoding. Each encoding type protects against a specific class of injection, and using the wrong encoding provides no protection.

**Authentication and Session Management:** Authentication logic should be reviewed for bypass vulnerabilities, credential storage mechanisms, session token generation and validation, session fixation, session expiration, and concurrent session handling. Pay particular attention to password reset flows, which are frequently more vulnerable than the primary authentication mechanism.

**Authorization:** Authorization checks should be reviewed for completeness and correctness. Check that every endpoint that accesses protected resources enforces authorization. Look for horizontal privilege escalation (user A accessing user B's data through ID manipulation) and vertical privilege escalation (regular user accessing admin functions). Verify that authorization checks cannot be bypassed through parameter manipulation, HTTP method changes, or URL path traversal.

**Cryptographic Usage:** Review all uses of cryptographic functions for correct algorithm selection, proper key management, secure random number generation, and correct implementation. Common mistakes include using MD5 or SHA1 for password hashing, using ECB mode for symmetric encryption, generating predictable keys or IVs, and using cryptographic functions incorrectly (such as using AES in CBC mode without proper padding).

**Error Handling:** Review error handling for information leakage. Error messages should not contain stack traces, database queries, internal file paths, version information, or other details useful to an attacker. Errors should be logged server-side with sufficient detail for debugging but returned to the user with generic messages.

## Common Vulnerabilities by Language

Each language and framework has characteristic vulnerability patterns that reviewers should be familiar with.

### Python

Python applications, particularly those using Django or Flask, are susceptible to several common vulnerability patterns. Template injection occurs when user input is rendered in Jinja2 or Mako templates without proper escaping. Django's template engine auto-escapes by default, but raw strings rendered with `mark_safe()` or templates using the `|safe` filter bypass this protection.

SQL injection in Python applications typically occurs when developers use string formatting or concatenation to build queries instead of using parameterized queries. The SQLAlchemy ORM prevents this by default, but raw SQL queries executed with `cursor.execute("SELECT * FROM users WHERE id = %s" % user_id)` are vulnerable.

Deserialization vulnerabilities in Python occur when `pickle.loads()` or `yaml.load()` (without `Loader=SafeLoader`) processes untrusted input. An attacker can craft a serialized object that executes arbitrary code when deserialized.

Path traversal in Python occurs when `open()` or `os.path.join()` processes user input without sanitization. An attacker can use `../` sequences to access files outside the intended directory.

### Java

Java applications are susceptible to deserialization vulnerabilities, particularly when using the default Java serialization mechanism. The `readObject()` method in serialized classes can execute arbitrary code during deserialization. Libraries like Apache Commons Collections have historically provided gadget classes that enable remote code execution through deserialization.

SQL injection in Java occurs when developers use `Statement` with string concatenation instead of `PreparedStatement` with parameterized queries. The JDBC API supports both approaches, and the vulnerable pattern is common in legacy codebases.

Expression Language injection in Java web applications occurs when user input is evaluated in EL expressions, which can execute arbitrary code. This is particularly dangerous in applications using JSP pages with user-controlled EL expressions.

XML External Entity (XXE) injection occurs when Java XML parsers process untrusted XML input without disabling external entity resolution. The default configuration of many Java XML parsers allows external entity resolution, which can lead to file disclosure and server-side request forgery.

### JavaScript

JavaScript applications are susceptible to prototype pollution, where an attacker modifies the `Object.prototype` to inject properties that are subsequently used by the application. This can lead to cross-site scripting, denial of service, or remote code execution depending on how the polluted properties are used.

ReDoS (Regular Expression Denial of Service) occurs when a vulnerable regular expression enters catastrophic backtracking when processing a crafted input. This blocks the event loop in Node.js applications, causing denial of service.

NoSQL injection in MongoDB-backed applications occurs when user input is used to construct MongoDB queries without sanitization. An attacker can inject operators like `$gt`, `$ne`, or `$regex` to bypass authentication or extract data.

Server-side request forgery (SSRF) in Node.js applications occurs when user-supplied URLs are fetched by the server. An attacker can provide internal URLs to access cloud metadata services, internal APIs, or local files.

### Go

Go applications are less susceptible to some common vulnerability classes due to the language's type safety and standard library design, but they have their own characteristic vulnerabilities. Command injection occurs when `os/exec` processes user input without sanitization. SQL injection in Go occurs when developers use `fmt.Sprintf` to build queries instead of using the `database/sql` parameterized query mechanism.

Path traversal in Go occurs when `os.Open()` or `ioutil.ReadFile()` processes user input without validation. Go's standard library does not provide automatic path sanitization, and developers must explicitly validate paths.

Race conditions in Go occur when concurrent goroutines access shared state without proper synchronization. The `data race` detector can catch these during testing, but many race conditions are timing-dependent and do not manifest consistently.

## Injection Patterns Across Languages

Injection vulnerabilities share a common pattern across languages: untrusted data is used in a context where it is interpreted as code or commands rather than treated as data. The specific syntax differs by language and context, but the fundamental flaw is the same.

SQL injection appears in every language that uses SQL: `cursor.execute(f"SELECT * FROM users WHERE name = '{name}'")` in Python, `Statement.executeQuery("SELECT * FROM users WHERE name = '" + name + "'")` in Java, `db.query(\`SELECT * FROM users WHERE name = '${name}'\`)` in JavaScript template literals. The fix is always the same: use parameterized queries. `cursor.execute("SELECT * FROM users WHERE name = %s", (name,))` in Python, `PreparedStatement` with `setString()` in Java, `db.query("SELECT * FROM users WHERE name = ?", [name])` in JavaScript.

OS command injection occurs when user input is passed to system shell commands. In Python: `os.system(f"ping {host}")`. In Java: `Runtime.getRuntime().exec("ping " + host)`. In Go: `exec.Command("ping", host)` (safe if arguments are separate) vs `exec.Command("sh", "-c", "ping "+host)` (unsafe). The fix is to avoid shell execution entirely or to use the language's safe command execution API with properly separated arguments.

Cross-site scripting (XSS) occurs when user input is rendered in HTML without encoding. In server-side templates, the fix is auto-encoding (enabled by default in most modern frameworks). In client-side JavaScript, the fix is using `textContent` instead of `innerHTML` or using a template engine that escapes by default.

LDAP injection occurs when user input is used in LDAP queries without escaping. The fix is to use parameterized LDAP queries or to escape special characters in the input before constructing the query.

## Authentication and Authorization Flaws in Code

Authentication flaws in code often involve subtle logic errors that are difficult to detect through automated testing. A common pattern is the authentication bypass through parameter manipulation. Consider a login endpoint that checks `if request.form['username'] == 'admin' and request.form['password'] == admin_password:` but also processes a hidden field `request.form['is_admin']`. If the application checks `is_admin` elsewhere in the request processing, an attacker can set this field to gain admin access without knowing the password.

Another common pattern is the authentication bypass through exception handling. If the authentication logic is wrapped in a try-catch block that catches authentication exceptions and continues processing, a malformed request that triggers an exception might bypass the authentication check entirely. The code continues executing without having verified the user's identity.

Authorization flaws frequently involve missing checks on specific code paths. A developer adds a new API endpoint for administrative functions but forgets to add the authorization middleware. The endpoint works correctly but is accessible to any authenticated user. Or the authorization check is placed after the data retrieval, so the data is fetched and processed before the authorization check rejects the request. If the response time differs between authorized and unauthorized requests, this can leak information even when the request is rejected.

Session management flaws include session tokens generated from predictable sources (such as timestamps or sequential IDs), session tokens not invalidated on logout, session tokens stored in localStorage (accessible to JavaScript) instead of httpOnly cookies, and session tokens that do not expire.

## Cryptographic Misuse Patterns

Cryptographic misuse is one of the most common and most dangerous vulnerability classes because it provides a false sense of security. The application appears to use encryption, but the implementation is flawed.

Using MD5 or SHA1 for password hashing is a common misuse. These algorithms are fast by design, making them suitable for integrity checking but unsuitable for password storage. An attacker with a database of MD5-hashed passwords can test billions of candidate passwords per second using GPU-accelerated cracking. The fix is to use a purpose-built password hashing algorithm: Argon2id, bcrypt, or scrypt with appropriate work factors.

Using AES in ECB mode is a common misuse that preserves patterns in the encrypted data. If two plaintext blocks are identical, their ciphertext blocks are identical, leaking information about the plaintext structure. The fix is to use a block cipher mode that incorporates an initialization vector: CBC, CTR, or GCM.

Generating cryptographic keys from insufficient entropy is a common misuse. Using `Math.random()` in JavaScript, `random.randint()` in Python, or `System.currentTimeMillis()` as a seed for key generation produces predictable keys. The fix is to use the language's cryptographically secure random number generator: `secrets.token_bytes()` in Python, `java.security.SecureRandom` in Java, `crypto.randomBytes()` in Node.js.

Hardcoded encryption keys in source code are a common misuse. If the key is in the code, anyone with access to the repository (including former employees, contractors, and anyone who can access the source code through a breach) can decrypt the data. The fix is to use a key management service or hardware security module.

## Real Code Review: Finding SQL Injection in a Django Application

Consider the following Django view that handles a user search function:

```python
from django.shortcuts import render
from django.contrib.auth.models import User
from django.db import connection

def search_users(request):
    query = request.GET.get('q', '')
    role = request.GET.get('role', '')
    
    with connection.cursor() as cursor:
        sql = f"SELECT id, username, email FROM auth_user WHERE username LIKE '%{query}%'"
        if role:
            sql += f" AND is_staff = {'1' if role == 'admin' else '0'}"
        cursor.execute(sql)
        results = cursor.fetchall()
    
    return render(request, 'search_results.html', {'results': results})
```

This code contains three distinct vulnerabilities. The first is SQL injection through the `query` parameter. An attacker can submit `' OR 1=1 --` as the search term, which modifies the SQL query to return all users. Or they can submit `'; DROP TABLE auth_user; --` to delete the table. The fix is to use parameterized queries: `cursor.execute("SELECT id, username, email FROM auth_user WHERE username LIKE %s", [f'%{query}%'])`.

The second vulnerability is SQL injection through the `role` parameter. While the `role` parameter is compared against specific values, the resulting SQL fragment is constructed through string concatenation. An attacker can submit `admin' OR '1'='1` as the role value, which modifies the query. The fix is the same: parameterized queries.

The third vulnerability is information disclosure through the response. The view returns all fields from the `auth_user` table, including fields that may not be appropriate for display (such as password hashes, last login IP addresses, or other sensitive data). Even if the SQL injection is fixed, the view exposes more data than necessary. The fix is to explicitly select only the fields needed for display.

A correct implementation:

```python
from django.shortcuts import render
from django.contrib.auth.models import User
from django.db.models import Q

def search_users(request):
    query = request.GET.get('q', '')
    role = request.GET.get('role', '')
    
    users = User.objects.filter(
        username__icontains=query
    )
    
    if role == 'admin':
        users = users.filter(is_staff=True)
    elif role == 'user':
        users = users.filter(is_staff=False)
    
    users = users.values('id', 'username', 'email')
    
    return render(request, 'search_results.html', {'results': list(users)})
```

This version uses Django's ORM, which handles parameterization automatically, selects only the needed fields, and is readable and maintainable.

## Integrating Security into Code Review Process

Security must be integrated into the code review process, not treated as a separate activity. This means training developers to identify security issues during standard code reviews, establishing security review requirements for high-risk changes, and using automated tools to augment human review.

The first step is training. Developers who review code should understand the vulnerability classes most relevant to their technology stack. This does not require every developer to be a security expert: it requires them to recognize common patterns and know when to escalate to the security team. A two-hour training session covering the top 10 vulnerability classes for a specific language and framework provides sufficient foundation.

The second step is establishing review requirements. High-risk changes: modifications to authentication logic, changes to authorization checks, new API endpoints, database schema changes, changes to encryption or key management, and integrations with external services: should require review by someone with security training. This does not need to be a dedicated security reviewer; a senior developer with security training can fulfill this role.

The third step is integrating automated tools into the review process. Static analysis tools, linters with security rules, and dependency vulnerability scanners should run automatically on every pull request and flag potential issues before human review. The tools do not replace human review: they reduce the cognitive load on reviewers by catching obvious issues, allowing reviewers to focus on logic and context-dependent vulnerabilities.

The fourth step is establishing feedback loops. When security issues are found in code review, the findings should be documented and used to improve the review process. If a particular class of vulnerability is consistently missed, the checklist should be updated and additional training provided. If a particular developer or team consistently introduces security issues, targeted training should be provided.

The fifth step is measuring effectiveness. Track the number of security issues found in code review versus the number found in testing or production. Track the time between vulnerability introduction and detection. Track the cost of remediation at different stages. These metrics demonstrate the value of security-integrated code review and justify continued investment.

## Assessment

**Lab 4.1: Code Review Exercise (60 minutes)**
Review the following code files for security vulnerabilities. Each file contains at least three distinct vulnerability classes. Identify each vulnerability, explain the attack scenario, and provide a specific code fix. You must find at least 12 vulnerabilities across the four files.

Files provided:
1. A Python Flask API endpoint handling user registration
2. A Java servlet handling file upload
3. A Node.js Express route handling password reset
4. A Go HTTP handler processing webhook payloads

**Grading criteria:**
- Correct identification of at least 12 vulnerabilities (24 points, 2 per vulnerability)
- Specific attack scenarios for each vulnerability (24 points, 2 per vulnerability)
- Correct, compilable/runnable code fixes (24 points, 2 per vulnerability)
- Identification of at least two vulnerabilities requiring understanding of the application's business logic (12 points)

**Lab 4.2: Security-Focused Code Review Report (45 minutes)**
Write a code review report for a provided codebase (a Django application with 15 source files). The report should categorize findings by severity (Critical, High, Medium, Low), provide specific file and line references, and include prioritized remediation recommendations. The report should be written for a technical audience but should not assume knowledge of the specific codebase.

**Grading criteria:**
- Accurate severity classification (10 points)
- Specific file and line references for all findings (10 points)
- Clear, actionable remediation recommendations (10 points)
- Prioritization that considers both severity and remediation effort (10 points)
- Professional report format (10 points)

**Lab 4.3: Secure Coding Standards (45 minutes)**
Write a secure coding standards document for a Python Django development team. The document should cover the top 10 vulnerability classes relevant to Django applications, with specific do and do-not examples for each. Include code examples showing both vulnerable and secure patterns. The document should be concise enough that developers will actually read it (target: 5 pages).

**Grading criteria:**
- Coverage of at least 8 vulnerability classes (16 points, 2 per class)
- Clear, specific do and do-not examples (16 points, 2 per class)
- Correct, runnable code examples (8 points)
- Concise, readable format (5 points)
- Django-specific guidance (5 points)

## Evidence

Secure code review is the most effective security control because it addresses vulnerabilities at their source. A vulnerability that is found and fixed in code review costs a fraction of what it costs to find and fix in testing, and a fraction of what it costs to find and fix after a breach. The 2023 Cost of a Data Breach Report found that vulnerabilities identified through code review cost an average of $800 to remediate, while vulnerabilities identified through production incidents cost an average of $150,000.

The challenge is scalability. Manual code review does not scale to large codebases with hundreds of thousands of lines of code. The solution is a layered approach: automated tools catch the obvious issues, trained developers catch the context-dependent issues during standard code review, and security specialists focus on the highest-risk changes.

The real code review example in this module demonstrates why automated tools alone are insufficient. The SQL injection vulnerabilities in the Django view would be caught by static analysis tools. But the information disclosure through excess data fields, the subtle authorization logic issues, and the business logic flaws that create exploitable conditions require human understanding of the application's purpose and context.

Integrating security into code review is a cultural change as much as a technical one. It requires developers to think about how their code can be abused, not just how it should be used. It requires reviewers to ask "what happens if this input is malicious?" rather than "does this input match the expected format?" And it requires organizations to invest in developer security training and to allocate time for security-focused review.

The result is a development process that produces secure code by default, not by exception. When security is part of every code review, vulnerabilities are caught before they reach testing, let alone production. The investment in training and process pays for itself many times over in reduced incident response costs, reduced remediation costs, and reduced risk.

## Code Review Efficiency

Effective security code review requires balancing thoroughness with velocity. Reviewing every line of code for every possible vulnerability is impractical. The solution is risk-based review: focusing security attention on the code that matters most.

High-risk code includes: authentication and authorization logic, cryptographic operations, input validation and output encoding, database queries, file operations, network calls, deserialization logic, and code that handles sensitive data. These areas should receive focused security review from reviewers with security training.

Low-risk code includes: unit tests, documentation, configuration files (with no secrets), UI components (with no security logic), and utility functions with no security implications. These areas can receive standard code review without security-specific focus.

The risk-based approach reduces the security review burden by approximately 60% while maintaining coverage of the security-critical code. This makes security review practical for teams with limited security expertise and tight development timelines.

Another efficiency technique is incremental review. Rather than reviewing an entire codebase for security issues, focus security review on the diff: the changes introduced by the pull request. This is faster and more targeted than full codebase review, and it catches new vulnerabilities as they are introduced. The limitation is that it does not catch vulnerabilities in pre-existing code, which is why periodic full codebase security scans (using SAST tools) complement incremental review.