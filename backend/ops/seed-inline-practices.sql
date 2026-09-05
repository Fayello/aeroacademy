-- ============================================================
-- INLINE PRACTICE SEED: Exercises tied to lesson content
-- Each exercise tests a specific concept taught in the lesson
-- ============================================================

-- 1. ADVANCED WEB VULNERABILITIES
-- ============================================================

-- Lesson: How Web Applications Actually Work
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'How Web Applications Actually Work';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Identify the HTTP Method', 'FLAG_CAPTURE', 'A web server receives this raw HTTP request:\n\nPOST /api/login HTTP/1.1\nHost: example.com\nContent-Type: application/x-www-form-urlencoded\n\nusername=admin&password=test123\n\nWhat HTTP method is being used to submit the login credentials? Enter the method name in uppercase.', 'Identify the HTTP method from the raw request line.', 'POST', 'EXACT', ARRAY['Look at the first word in the first line of the request.', 'GET retrieves data, POST sends data.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Identify the Injection Point', 'FLAG_CAPTURE', 'You intercept this HTTP request:\n\nGET /search?q=wireless+router&category=electronics HTTP/1.1\nHost: shop.example.com\nCookie: session=abc123def456\n\nWhich part of this request is the user-controlled input that could potentially be manipulated for injection? Return the exact parameter name.', 'Find the user-controlled input in the request.', 'q', 'EXACT', ARRAY['User input typically appears as query parameters in GET requests.', 'Look for the key-value pair after the ? in the URL.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'HTTP Response Status Meaning', 'FLAG_CAPTURE', 'A penetration tester sends a request and receives:\n\nHTTP/1.1 403 Forbidden\nContent-Type: text/html\nX-Frame-Options: DENY\n\nWhat does the 403 status code indicate about the server''s response to the request?', 'Interpret the HTTP status code.', 'Forbidden - the server understood the request but refuses to authorize it', 'CONTAINS', ARRAY['4xx codes indicate client-side errors.', '401 is Unauthorized, 403 is Forbidden.'], 3, 25, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Cookie Security Flags', 'SHORT_RESPONSE', 'A session cookie is set with:\nSet-Cookie: session_id=xyz789; Path=/; Domain=example.com\n\nThis cookie is missing two critical security flags. Name both flags that should be added to prevent session hijacking via XSS and network interception.', 'Name the two missing security flags on the cookie.', 'Secure and HttpOnly', 'CONTAINS', ARRAY['One flag prevents JavaScript access to the cookie.', 'Another flag ensures the cookie is only sent over HTTPS.'], 3, 25, true, 4, now(), now());
END $$;

-- Lesson: Injection Attacks
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'Injection Attacks';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SQL Injection Login Bypass', 'FLAG_CAPTURE', 'A login form submits:\n\nSELECT * FROM users WHERE username='' INPUT '' AND password='' INPUT ''\n\nAn attacker enters '' OR ''1''=''1'' as the username and anything as the password. What will the modified query return, and why is this dangerous? Return the key phrase that describes what the attacker achieves.', 'Analyze the SQL injection payload.', 'All users from the users table', 'CONTAINS', ARRAY['The OR condition makes the WHERE clause always true.', 'When the condition is always true, the query returns all rows.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'UNION-Based SQL Injection', 'FLAG_CAPTURE', 'A vulnerable endpoint returns user data from a query like:\nSELECT name, email FROM users WHERE id = INPUT\n\nAn attacker appends:\n UNION SELECT username, password FROM admins--\n\nWhat type of data exfiltration technique is this, and what two critical pieces of information is the attacker extracting? Return the type of attack in the format: TECHNIQUE', 'Identify the SQL injection technique being used.', 'UNION-Based', 'EXACT', ARRAY['This technique uses the UNION SQL operator to combine results.', 'It requires matching column counts between the original and injected queries.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Parameterized Query Fix', 'COMMAND_ANSWER', 'The following code is vulnerable to SQL injection:\n\ncursor.execute("SELECT * FROM users WHERE id = " + user_input)\n\nRewrite this query using parameterized queries in Python. Return the fixed line of code.', 'Fix the SQL injection vulnerability using parameterized queries.', 'cursor.execute("SELECT * FROM users WHERE id = %s", (user_input,))', 'CONTAINS', ARRAY['Parameterized queries use placeholders instead of string concatenation.', 'In Python DB-API, use %s as placeholder and pass parameters as a tuple.'], 3, 35, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'NoSQL Injection Payload', 'FLAG_CAPTURE', 'A MongoDB query is constructed as:\n{ username: userInput, password: passInput }\n\nAn attacker submits:\n{ "$ne": "" } as the username field.\n\nWhat MongoDB operator is being exploited, and what does it do? Return the operator name.', 'Identify the NoSQL injection operator.', '$ne', 'EXACT', ARRAY['The $ne operator stands for "not equal".', 'When compared to an empty string, it evaluates to true for most documents.'], 3, 30, true, 4, now(), now());
END $$;

-- Lesson: Cross-Site Scripting (XSS)
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'Cross-Site Scripting (XSS)';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Identify XSS Type', 'FLAG_CAPTURE', 'A web application reflects user input in the URL:\nhttps://example.com/search?q=<script>alert("XSS")</script>\n\nThe page renders the script tag in the browser, executing the alert.\n\nWhat type of XSS attack is this? Return one word.', 'Classify the XSS attack type.', 'Reflected', 'EXACT', ARRAY['The payload is in the URL and reflected back immediately.', 'Stored XSS persists in the database; this does not.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'XSS Prevention Filter Bypass', 'FLAG_CAPTURE', 'A web app has this input filter:\n\ninput.replace(/<script>/gi, "").replace(/<\/script>/gi, "")\n\nAn attacker needs to bypass this filter to inject JavaScript. Which alternative tag pair can execute JavaScript and bypass this specific filter? Return the tag name only (e.g., <tagname>).', 'Find a way to bypass the XSS filter.', 'img', 'CONTAINS', ARRAY['The filter only blocks <script> tags specifically.', 'Other HTML elements can execute JavaScript through event handlers.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'DOM-Based XSS Indicator', 'SHORT_RESPONSE', 'You are reviewing JavaScript code and find:\n\ndocument.getElementById("output").innerHTML = document.location.hash.substring(1);\n\nThis code takes input from the URL hash and injects it directly into the DOM. What specific XSS type does this represent, and what makes it different from reflected XSS? Answer in one sentence.', 'Identify the XSS type and its distinguishing characteristic.', 'DOM-based XSS because the payload never reaches the server, it is processed entirely client-side', 'CONTAINS', ARRAY['In reflected XSS, the server processes the input.', 'In DOM-based XSS, the vulnerability is in the client-side JavaScript code.'], 3, 30, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Content Security Policy Header', 'FLAG_CAPTURE', 'A website deploys this CSP header:\n\nContent-Security-Policy: default-src ''self''; script-src ''self''; style-src ''self'' ''unsafe-inline''\n\nWhich XSS attack vector is still possible despite this CSP? Consider that style-src allows unsafe-inline. Return the attack technique name.', 'Analyze CSP weaknesses.', 'CSS Injection', 'CONTAINS', ARRAY['The CSP allows unsafe-inline in style-src.', 'CSS can be used to exfiltrate data through background-image URLs.'], 3, 30, true, 4, now(), now());
END $$;

-- Lesson: Authentication and Session Attacks
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'Authentication and Session Attacks';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Session Token Entropy', 'FLAG_CAPTURE', 'A web application generates session tokens using:\nsession_id = md5(username + timestamp)\n\nWhat is the fundamental weakness in this session generation method? Return the security concept that is violated.', 'Identify the session generation weakness.', 'Predictability', 'EXACT', ARRAY['The token is derived from known or guessable values.', 'Secure session tokens should be cryptographically random.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Brute Force Rate Limiting', 'FLAG_CAPTURE', 'A login endpoint processes 1000 authentication attempts per minute without any rate limiting or account lockout. What is the minimum defensive measure that should be implemented to mitigate credential brute forcing? Return the technique name.', 'Identify the primary defense against brute force.', 'Rate limiting', 'CONTAINS', ARRAY['The defense limits the number of attempts from a single source.', 'Account lockout is another option but rate limiting is less disruptive.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Session Fixation Attack', 'SHORT_RESPONSE', 'An attacker sets a victim''s session ID to a known value before the victim logs in. After login, the attacker uses that same session ID to access the victim''s account. What is this attack called, and what is the correct mitigation? Answer in one sentence.', 'Identify the attack and its fix.', 'Session fixation; the application should regenerate the session ID after successful authentication', 'CONTAINS', ARRAY['The attacker "fixes" the session before authentication.', 'Regenerating the session ID on login prevents the pre-set value from persisting.'], 3, 30, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'JWT Algorithm Confusion', 'FLAG_CAPTURE', 'A JWT token uses the algorithm header: {"alg": "HS256"}. The server''s public key is used as the HMAC secret. An attacker changes the algorithm to "none" and removes the signature. What vulnerability does this exploit, and what is the defense? Return the attack type.', 'Identify the JWT vulnerability.', 'Algorithm confusion', 'CONTAINS', ARRAY['The server must explicitly validate the algorithm in the JWT header.', 'The "none" algorithm bypasses signature verification if the server accepts it.'], 3, 35, true, 4, now(), now());
END $$;

-- Lesson: Access Control (IDOR)
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'Access Control (IDOR)';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'IDOR Detection', 'FLAG_CAPTURE', 'User A is logged in and accesses:\nGET /api/invoices/1234\n\nUser A then tries:\nGET /api/invoices/1235\n\nAnd sees User B''s invoice data. What class of vulnerability is this, and what is the root cause? Return the vulnerability class acronym.', 'Identify the IDOR vulnerability.', 'IDOR', 'EXACT', ARRAY['The application uses sequential identifiers in the URL.', 'The server does not verify that the requesting user owns the resource.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Horizontal vs Vertical Privilege Escalation', 'FLAG_CAPTURE', 'A regular user discovers they can access admin endpoints by changing their role parameter from "user" to "admin" in the request body. Is this horizontal or vertical privilege escalation? Return one word.', 'Classify the privilege escalation type.', 'Vertical', 'EXACT', ARRAY['Horizontal escalation means accessing another user at the same privilege level.', 'Vertical escalation means gaining higher privileges than intended.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'UUID as IDOR Mitigation', 'SHORT_RESPONSE', 'A developer replaces sequential integer IDs (1, 2, 3...) with UUIDs (550e8400-e29b-41d4-a716-446655440000) to prevent IDOR. Does this fully prevent the vulnerability? Explain in one sentence why or why not.', 'Evaluate UUID as an IDOR defense.', 'No, UUIDs only make IDs harder to guess; the server must still verify authorization for each request', 'CONTAINS', ARRAY['UUIDs add obscurity but not authorization.', 'The core issue is missing access control checks, not predictable IDs.'], 3, 30, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Access Control Test Case', 'SHORT_RESPONSE', 'Write a test case to detect IDOR vulnerabilities. Describe the exact steps an attacker would take to test whether a document sharing endpoint is vulnerable to IDOR. Keep your answer under 3 sentences.', 'Write a practical IDOR test case.', 'Create two accounts, upload a document with account A, extract the document ID from the URL or API response, then access that same document ID while logged in as account B to check if unauthorized access is possible.', 'CONTAINS', ARRAY['The test requires two different user contexts.', 'Compare the response between authorized and unauthorized access attempts.'], 3, 35, true, 4, now(), now());
END $$;

-- Lesson: Security Misconfiguration
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'Security Misconfiguration';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Default Credential Risk', 'FLAG_CAPTURE', 'A newly deployed Redis server is accessible on port 6379 from the internet with no password configured. What specific attack can be performed against this misconfiguration? Return the attack technique.', 'Identify the attack on default credentials.', 'Unauthorized access', 'CONTAINS', ARRAY['Redis has a well-known default configuration.', 'Without authentication, anyone can connect and execute commands.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Error Message Information Disclosure', 'FLAG_CAPTURE', 'A web application returns this error to users:\n\n"PDOException: SQLSTATE[42S02]: Table ''shop.users'' doesn''t exist in /var/www/html/db.php on line 42"\n\nWhat sensitive information is leaked in this error message? Return the category of information disclosed.', 'Identify the information leak.', 'Database structure', 'CONTAINS', ARRAY['The error reveals internal file paths and database names.', 'Production error messages should be generic to users.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Directory Listing Exploit', 'COMMAND_ANSWER', 'A web server has directory listing enabled. An attacker accesses:\nhttps://target.com/uploads/\n\nAnd sees a list of all files including backup.sql, config.php.bak, and database-export.zip. What HTTP server configuration change disables directory listing in Apache? Return the directive name.', 'Identify the Apache configuration to disable directory listing.', 'Options -Indexes', 'EXACT', ARRAY['Apache uses the Options directive to control directory features.', 'The Indexes option enables directory listing; removing it disables it.'], 3, 30, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Security Header Missing', 'FLAG_CAPTURE', 'A security scan reports the following missing headers:\n- X-Content-Type-Options\n- X-Frame-Options\n- Strict-Transport-Security\n- Content-Security-Policy\n\nWhat is the name of this category of security issue where the server fails to send recommended security headers? Return the category name.', 'Identify the security misconfiguration category.', 'Security Misconfiguration', 'EXACT', ARRAY['These headers are part of server hardening best practices.', 'Missing headers indicate the server is not properly configured for defense-in-depth.'], 3, 25, true, 4, now(), now());
END $$;

-- Lesson: Cryptographic Failures
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'Cryptographic Failures';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Weak Hash Identification', 'FLAG_CAPTURE', 'A password database stores hashes as:\n5f4dcc3b5aa765d61d8327deb882cf99\n\nThis is 32 hex characters. What hashing algorithm produced this hash, and why is it insecure for passwords? Return the algorithm name.', 'Identify the weak hash algorithm.', 'MD5', 'EXACT', ARRAY['MD5 produces 128-bit (32 hex character) hashes.', 'MD5 is fast and vulnerable to rainbow table attacks.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Password Storage Best Practice', 'FLAG_CAPTURE', 'A security audit finds that passwords are stored using:\nsha256(password + salt)\n\nWhat is the recommended modern alternative for password hashing that provides built-in salting, key stretching, and configurable work factor? Return the algorithm name.', 'Identify the recommended password hashing algorithm.', 'bcrypt', 'CONTAINS', ARRAY['Modern password hashing should be slow and computationally expensive.', 'bcrypt, scrypt, and Argon2 are the recommended algorithms.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'TLS Version Vulnerability', 'FLAG_CAPTURE', 'A server supports TLS 1.0 and TLS 1.1 in addition to TLS 1.2 and 1.3. What specific attack is possible against TLS 1.0 that makes it insecure? Return the attack name.', 'Identify the TLS 1.0 attack.', 'BEAST', 'EXACT', ARRAY['TLS 1.0 uses CBC mode ciphers that are vulnerable.', 'The BEAST attack exploits CBC mode in TLS 1.0.'], 3, 30, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Encryption at Rest vs Transit', 'SHORT_RESPONSE', 'A database stores credit card numbers in plaintext on disk, but all connections use TLS 1.3. A disk theft occurs. Are the credit card numbers compromised? Explain in one sentence why or why not.', 'Evaluate encryption coverage.', 'Yes, because encryption at rest was not implemented; TLS only protects data in transit, not on disk', 'CONTAINS', ARRAY['TLS protects data while it moves between client and server.', 'Encryption at rest protects data stored on disk.'], 3, 30, true, 4, now(), now());
END $$;

-- Lesson: Server-Side Request Forgery
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'Server-Side Request Forgery (SSRF)';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SSRF Cloud Metadata Exploit', 'FLAG_CAPTURE', 'An attacker discovers a web app that fetches URLs provided by users. They submit:\nhttp://169.254.169.254/latest/meta-data/iam/security-credentials/admin\n\nWhat cloud metadata endpoint is being targeted, and what sensitive information can be obtained? Return the IP address of the metadata service.', 'Identify the SSRF target.', '169.254.169.254', 'EXACT', ARRAY['Cloud instances expose metadata at a well-known IP.', 'AWS, GCP, and Azure all use 169.254.169.254 for metadata.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'SSRF Internal Network Scan', 'COMMAND_ANSWER', 'Using an SSRF vulnerability, an attacker wants to discover internal services. Write the curl command that would test whether port 3306 (MySQL) is open on the internal host 10.0.0.5, using the vulnerable endpoint at https://target.com/fetch?url=INPUT. Return the full curl command.', 'Craft an SSRF curl command for internal port scanning.', 'curl "https://target.com/fetch?url=http://10.0.0.5:3306"', 'CONTAINS', ARRAY['The SSRF allows fetching arbitrary URLs from the server.', 'MySQL runs on port 3306 by default.'], 3, 35, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'SSRF Defense Mechanism', 'FLAG_CAPTURE', 'A developer wants to prevent SSRRF by blocking requests to private IP ranges. Which RFC defines the private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) that should be blocked? Return the RFC number.', 'Identify the RFC for private IPs.', 'RFC 1918', 'EXACT', ARRAY['Private IP ranges are defined in a specific RFC.', 'These ranges are not routable on the public internet.'], 3, 25, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'DNS Rebinding SSRRF', 'SHORT_RESPONSE', 'An attacker uses DNS rebinding to bypass SSRRF defenses. Explain in one sentence how DNS rebaching allows an attacker to reach internal services even when the application validates the initial DNS resolution.', 'Explain DNS rebinding.', 'The attacker registers a domain that first resolves to a safe public IP to pass validation, then changes the DNS record to resolve to an internal IP like 127.0.0.1, and the application follows the now-malicious DNS response to reach internal services', 'CONTAINS', ARRAY['DNS rebinding exploits the time gap between DNS resolution and connection.', 'The DNS TTL can be set very low so the record changes quickly.'], 3, 35, true, 4, now(), now());
END $$;

-- Lesson: API Security
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'API Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'BOLA Detection', 'FLAG_CAPTURE', 'A REST API endpoint:\nGET /api/v1/users/1234/orders\n\nAn attacker changes 1234 to 1235 and sees another user''s orders. What is this vulnerability class called in the OWASP API Security Top 10? Return the acronym.', 'Identify the OWASP API vulnerability.', 'BOLA', 'EXACT', ARRAY['BOLA stands for Broken Object Level Authorization.', 'It is the most common API vulnerability in the OWASP Top 10.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Mass Assignment API Vulnerability', 'FLAG_CAPTURE', 'A user registration API accepts:\nPOST /api/users\n{ "name": "Alice", "email": "alice@example.com", "role": "admin" }\n\nThe API does not filter which fields the user can set. What vulnerability class allows the attacker to set the "role" field? Return the vulnerability name.', 'Identify the mass assignment vulnerability.', 'Mass Assignment', 'EXACT', ARRAY['The API accepts all submitted fields without filtering.', 'The role field should not be user-controllable during registration.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'API Rate Limiting Implementation', 'SHORT_RESPONSE', 'An API has no rate limiting and is being abused for credential stuffing. Write a rate limiting strategy that allows 5 login attempts per minute per IP, with exponential backoff after repeated violations. Describe the policy in 2 sentences.', 'Design an API rate limiting policy.', 'Allow 5 login attempts per minute per IP using a sliding window counter; after 3 consecutive violations (15+ attempts in 5 minutes), apply exponential backoff starting at 5 minutes and doubling each time, resetting after 30 minutes of inactivity', 'CONTAINS', ARRAY['Sliding window counters are more accurate than fixed windows.', 'Exponential backoff progressively increases the penalty for repeated abuse.'], 3, 35, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'API Error Information Disclosure', 'FLAG_CAPTURE', 'An API returns this error response:\n{\n  "error": "DatabaseError",\n  "message": "relation \"users\" does not exist",\n  "stack": "at Query.run (/app/node_modules/pg/lib/client.js:321:19)"\n}\n\nWhat three categories of sensitive information are leaked in this response? Return them as a comma-separated list.', 'Identify information leaks in API errors.', 'Database structure, internal paths, technology stack', 'CONTAINS', ARRAY['The error reveals the database technology and table names.', 'Stack traces expose internal file paths and dependencies.'], 3, 30, true, 4, now(), now());
END $$;

-- Lesson: Modern Attack Surfaces
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Advanced Web Vulnerabilities' AND l.title = 'Modern Attack Surfaces';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Server-Side Template Injection', 'FLAG_CAPTURE', 'A web app uses Jinja2 templating and unsafely renders user input as a template. An attacker submits:\n{{7*7}}\n\nThe page displays "49". What vulnerability class does this indicate? Return the acronym.', 'Identify the template injection vulnerability.', 'SSTI', 'EXACT', ARRAY['When template syntax is evaluated, the input is being processed as a template.', 'SSTI can lead to Remote Code Execution if the template engine allows it.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Prototype Pollution', 'FLAG_CAPTURE', 'In JavaScript, an attacker submits this JSON payload:\n{\"__proto__\": {\"isAdmin\": true}}\n\nAfter this is merged into an existing object, all objects in the application inherit the isAdmin property. What vulnerability class is this? Return the name.', 'Identify the prototype pollution vulnerability.', 'Prototype Pollution', 'EXACT', ARRAY['JavaScript objects inherit from prototypes via __proto__.', 'Polluting the prototype affects all objects that inherit from it.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'WebSocket Security', 'SHORT_RESPONSE', 'A WebSocket connection is established without origin validation. An attacker creates a malicious page at evil.com that connects to the application''s WebSocket endpoint. What attack is possible, and what is the primary defense? Answer in one sentence.', 'Identify the WebSocket attack and defense.', 'Cross-Site WebSocket Hijacking; the server must validate the Origin header on WebSocket upgrade requests', 'CONTAINS', ARRAY['WebSockets can be initiated from any origin if not validated.', 'The Origin header should be checked during the WebSocket handshake.'], 3, 30, true, 3, now(), now());

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Deserialization Attack', 'FLAG_CAPTURE', 'A Java application deserializes user-provided objects from a Base64-encoded cookie. What vulnerability class allows an attacker to execute arbitrary code by crafting a malicious serialized object? Return the name of the attack.', 'Identify the deserialization vulnerability.', 'Insecure Deserialization', 'CONTAINS', ARRAY['Deserialization converts data back into objects.', 'If the application does not validate the object type, an attacker can inject malicious objects.'], 3, 30, true, 4, now(), now());
END $$;
