# Module 5: Access Control (IDOR)

Access control vulnerabilities are among the most common and most impactful web application flaws. They occur when an application fails to properly enforce who can access what. A user can view another user's data, modify resources they do not own, or perform actions beyond their role. These vulnerabilities are called Insecure Direct Object References (IDOR) when they involve predictable resource identifiers, but the broader class includes any authorization bypass: horizontal, vertical, or context-dependent.

## Horizontal vs Vertical Privilege Escalation

**Horizontal privilege escalation** occurs when a user accesses resources belonging to another user at the same privilege level. User A accesses User B's profile, orders, messages, or files. The attacker does not gain additional privileges: they access the same types of resources they are authorized to access, just belonging to someone else.

**Vertical privilege escalation** occurs when a user accesses resources or performs actions reserved for higher-privileged users. A regular user accesses the admin panel, deletes other users' accounts, or modifies system configuration. The attacker gains privileges they should not have.

Both types can exist simultaneously. A single application might have horizontal IDOR in the user profile endpoint and vertical IDOR in the admin settings endpoint. Testing for both is essential because they have different impacts and require different fixes.

The impact difference is significant. Horizontal IDOR typically exposes individual user data: one customer's orders, one patient's records, one employee's salary. Vertical IDOR can expose the entire system: all users' data, system configuration, administrative functions, and the ability to modify the application itself.

## IDOR in REST APIs

REST APIs use resource identifiers in URLs. This is the most common location for IDOR vulnerabilities.

A typical API pattern:

```
GET /api/users/12345/profile
GET /api/users/12345/orders
GET /api/invoices/67890
```

The user ID (12345) or invoice ID (67890) is a direct object reference. If the application does not verify that the authenticated user is authorized to access that specific resource, any user can access any other user's data by changing the ID.

```
GET /api/users/12345/profile → Returns your profile (authorized)
GET /api/users/12346/profile → Returns someone else's profile (IDOR)
```

### Testing for IDOR

The testing methodology is straightforward:

1. Create two accounts (Account A and Account B) with different data.
2. Log in as Account A and make a request for Account A's resource. Capture the request in Burp Suite.
3. Change the resource ID to Account B's ID. Send the request.
4. If Account B's data is returned, you have confirmed IDOR.

This must be tested on every endpoint that uses an identifier. Common locations:

- User profiles: `/api/users/{id}`
- Orders: `/api/orders/{id}`
- Invoices: `/api/invoices/{id}`
- Files: `/api/files/{id}/download`
- Messages: `/api/messages/{id}`
- Settings: `/api/users/{id}/settings`
- Documents: `/api/documents/{id}`
- Reports: `/api/reports/{id}`

### IDOR in Different HTTP Methods

IDOR is not limited to GET requests. Every HTTP method that accepts an identifier can be vulnerable:

**PUT /api/users/12346/profile**: Update another user's profile.

**DELETE /api/users/12346**: Delete another user's account.

**POST /api/users/12346/password-reset**: Trigger a password reset for another user.

**PATCH /api/users/12346/role**: Change another user's role to admin.

Each of these must be tested independently because the authorization check might exist for some methods but not others. A common pattern is that GET requests have proper authorization checks but PUT, PATCH, and DELETE do not: because the developer focused on the read path and forgot the write path.

### IDOR with UUIDs

Applications that use UUIDs (Universally Unique Identifiers) instead of sequential integers are sometimes considered immune to IDOR. This is false. UUIDs are predictable: many UUID generation algorithms use timestamps, MAC addresses, or sequential counters that can be predicted or extracted from other sources.

Even if UUIDs are truly random, they are often exposed in other locations: API responses, URL parameters, error messages, or JavaScript source code. An attacker who can observe any one instance of a UUID can use it to access that resource and potentially others.

Testing with UUIDs requires a different approach than sequential IDs. Instead of iterating through numbers, the tester must:

1. Find exposed UUIDs in API responses, HTML source, or JavaScript bundles.
2. Use one user's UUID while authenticated as another user.
3. Check for UUID prediction based on generation algorithm patterns.

## IDOR in GraphQL

GraphQL APIs expose a single endpoint (`/graphql`) and use a query language to request specific data. The query structure makes IDOR testing different from REST:

```graphql
query {
  user(id: "12345") {
    name
    email
    salary
  }
}
```

Changing the `id` parameter to another user's ID tests for horizontal IDOR. But GraphQL has additional attack vectors:

**Nested queries**: A user query might include related data that the authorization system does not properly filter:

```graphql
query {
  user(id: "12345") {
    name
    orders {
      id
      total
      creditCard { last4 }
    }
  }
}
```

Even if the user query is authorized, the nested orders and creditCard data might not be filtered by ownership.

**Batch queries**: GraphQL supports query batching, where multiple queries are sent in a single request:

```json
[
  {"query": "query { user(id: \"12345\") { name email } }"},
  {"query": "query { user(id: \"12346\") { name email } }"},
  {"query": "query { user(id: \"12347\") { name email } }"}
]
```

This allows an attacker to enumerate user data quickly, potentially bypassing rate limits that count requests rather than queries.

**Introspection**: If GraphQL introspection is enabled, the attacker can query the entire schema:

```graphql
{
  __schema {
    types {
      name
      fields {
        name
      }
    }
  }
}
```

This reveals all available types, queries, mutations, and fields: including those the developer did not intend to expose. Sensitive fields like `salary`, `ssn`, `internalNotes`, or `adminNotes` might be visible in the schema even if they are not returned in normal queries.

## IDOR in File Downloads

File download endpoints often use predictable identifiers:

```
GET /api/files/download?file=invoice_2024_001.pdf
GET /api/attachments/12345
GET /documents/report-2024-Q3.xlsx
```

If the file name or ID is predictable and the application does not verify file ownership, any user can download any file. This is particularly dangerous for financial documents, medical records, legal documents, and other sensitive files.

**Path traversal in file downloads**: Sometimes the file parameter is used in a filesystem path:

```
GET /api/files/download?file=../../../../etc/passwd
GET /api/files/download?file=..\..\..\windows\win.ini
```

If the application does not sanitize the path, the attacker can read arbitrary files from the server. This combines IDOR with path traversal for maximum impact.

**Backup file IDOR**: Applications sometimes have backup files with predictable names:

```
GET /backup/database.sql
GET /db/backup_2024_01_01.sql.gz
GET /.bak/app.sql
```

Directory brute-force tools can discover these files if the server does not block directory listing and does not restrict access to backup files.

## Mass Assignment Vulnerabilities

Mass assignment (also called auto-binding or over-posting) occurs when an application automatically binds user input to object properties without filtering. The application trusts that the user will only submit the fields they are authorized to modify.

A typical vulnerable pattern:

```python
# The form only has 'name' and 'email' fields
@app.route('/profile', methods=['POST'])
def update_profile():
    user = User.query.get(current_user.id)
    for key, value in request.form.items():
        setattr(user, key, value)  # Mass assignment vulnerability
    db.session.commit()
```

An attacker submits additional fields:

```http
POST /profile
Content-Type: application/x-www-form-urlencoded

name=John&email=john@example.com&role=admin&is_verified=true&balance=100000
```

The application sets `role`, `is_verified`, and `balance` in addition to `name` and `email`. The attacker grants themselves admin privileges and inflates their account balance.

In Ruby on Rails, mass assignment is controlled by Strong Parameters:

```ruby
# VULNERABLE - no parameter filtering
User.update(params[:user])

# SAFE - only allowed parameters are passed through
User.update(user_params)

private
def user_params
  params.require(:user).permit(:name, :email)
end
```

In Django:

```python
# VULNERABLE
form = UserProfileForm(request.POST, instance=user)
form.save()

# SAFE - specify allowed fields
form = UserProfileForm(request.POST, instance=user, fields=['name', 'email'])
form.save()
```

In Node.js with Express:

```javascript
// VULNERABLE
Object.assign(user, req.body);
user.save();

// SAFE - only pick allowed fields
const { name, email } = req.body;
Object.assign(user, { name, email });
user.save();
```

Mass assignment is particularly dangerous in nested objects. If a user update endpoint accepts:

```json
{
  "name": "John",
  "company": {
    "id": 5,
    "name": "Attacker Corp"
  }
}
```

The attacker can reassign the user to a different company by changing the company ID.

### Mass Assignment in ORM Queries

Some ORMs allow passing request parameters directly to query filters:

```python
# VULNERABLE - user can filter by any field
users = User.query.filter_by(**request.args).all()
# Attacker sends: ?role=admin → returns all admin users
```

This enables data extraction by filtering on fields the user should not be able to query by.

## Authorization Bypass Techniques

Beyond direct IDOR, several techniques bypass authorization systems:

### HTTP Method Override

Some frameworks allow overriding the HTTP method using a header or parameter:

```
X-HTTP-Method-Override: GET
X-Method-Override: GET
_method: GET
```

If the authorization system only checks POST requests but the attacker overrides to GET, the authorization check might be skipped.

### Path Normalization Bypass

Authorization systems sometimes check the URL path but do not normalize it:

```
/admin
/./admin
/admin/.
/admin/./
/admin/../admin
/ADMIN
/%61dmin
```

If the authorization check compares the raw URL but the server processes the normalized URL, these variants might bypass the check.

### HTTP Header Injection

Some applications determine authorization from HTTP headers:

```
X-Forwarded-For: 127.0.0.1
X-Original-URL: /admin
X-Rewrite-URL: /admin
X-Custom-IP-Authorization: 127.0.0.1
```

If the application trusts these headers for authorization decisions, the attacker can set them to bypass access controls. The X-Forwarded-For header is particularly commonly trusted, making IP-based access controls unreliable when proxies are involved.

### Parameter Pollution

Sending the same parameter multiple times can confuse authorization logic:

```
GET /api/users/12345?user_id=12346
```

If the application uses the first parameter value for authorization and the second for data retrieval, the attacker can pass different values to bypass the check.

### Race Conditions

In some applications, the authorization check and the data access are not atomic:

```
Thread 1: Check authorization for user 12345 → Authorized
Thread 2: Check authorization for user 12345 → Authorized
Thread 1: Access resource 12346 → Success (authorization not re-checked)
Thread 2: Access resource 12346 → Success (authorization not re-checked)
```

Race conditions in authorization are common in file uploads, payment processing, and inventory management. The TOCTOU (Time of Check to Time of Use) pattern creates windows where authorization can be bypassed.

## Real Scenario: Accessing CEO's Salary Data via IDOR

A mid-size technology company with 2,000 employees had a self-service HR portal. Employees could view their own profile, pay stubs, and benefits. The portal was a single-page application using a REST API.

**The application architecture**: The frontend was built with React. The backend was Node.js with Express. The API used MongoDB. User authentication was handled by JWT tokens. The HR portal was at `https://hr.company.com`.

**The vulnerability discovery**: When viewing a pay stub, the browser sent:

```
GET /api/paystubs/my?employee_id=12345
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

The employee_id was the current user's ID, embedded in the JWT payload. The API returned the pay stub data. But when the employee_id was changed to any other value, the API returned the other employee's pay stub data.

**The exploitation**: The attacker (a junior developer with portal access) used Burp Suite to intercept the pay stub request. They replaced employee_id with sequential numbers (1, 2, 3, ...) and discovered that the API returned pay stub data for every employee: including the CEO, CTO, CFO, and other executives.

**What was exposed**:

- Full salary data for all 2,000 employees
- Bank account numbers for direct deposit
- Social Security Numbers (last 4 digits)
- Tax withholding information
- Benefits elections including health plan details
- Stock option grant amounts and vesting schedules

**The root cause**: The API endpoint used the employee_id parameter to look up pay stubs without verifying that the authenticated user was authorized to access that specific employee's data. The authorization check only verified that the JWT was valid (authentication), not that the user had permission to access the requested resource (authorization).

**The fix**: The API must verify that the employee_id in the request matches the employee_id from the JWT token. If a user requests another employee's data, the API returns 403 Forbidden. Additionally, the frontend should not expose the employee_id parameter: it should use the token's user identity to determine which pay stub to return.

```javascript
// FIXED endpoint
app.get('/api/paystubs/my', authenticate, (req, res) => {
    const userId = req.user.id; // From JWT, not from request parameter
    const paystub = Paystub.findOne({ employee_id: userId });
    if (!paystub) return res.status(404).json({error: 'Not found'});
    res.json(paystub);
});
```

**Detection in production**: The attacker downloaded pay stubs for all 2,000 employees over a period of two weeks. The company discovered the breach when the attacker shared salary data on an anonymous forum, leading to internal complaints. The forensic investigation found no WAF logs because the requests appeared to be legitimate API calls from an authenticated user. The API access logs showed the sequential pattern of employee_id values, but no alerting was configured for anomalous API access patterns.

## Practical Exercise: IDOR and Access Control Lab

1. **Basic IDOR**: Create two test accounts. Identify endpoints that use user-specific identifiers. Test each endpoint by substituting the other account's identifier. Document which endpoints are vulnerable and which are properly protected.

2. **Vertical escalation**: If an admin endpoint exists, test whether a regular user can access it by directly navigating to the URL or calling the API endpoint. Test whether the admin functionality is protected at the server level or only hidden in the UI.

3. **GraphQL testing**: If the application uses GraphQL, enable introspection and map the schema. Identify sensitive fields. Craft queries targeting other users' data. Test batch queries for enumeration.

4. **Mass assignment**: Examine the application's update endpoints. Identify which fields are accepted. Submit additional fields (role, is_admin, balance, etc.) and observe whether they are accepted. Check the database after submission to verify whether the additional fields were persisted.

5. **File download IDOR**: Find file download endpoints. Test with different file identifiers. Attempt path traversal if the file parameter is used in a filesystem path. Test for backup files using directory brute-force.

6. **Authorization bypass**: Test HTTP method override, path normalization, and header injection techniques against endpoints with access controls. Document which techniques work.

Time limit: 60 minutes. Grading criteria: horizontal IDOR identification (25%), vertical privilege escalation (20%), mass assignment testing (20%), file download IDOR (15%), authorization bypass techniques (10%), documentation (10%).
