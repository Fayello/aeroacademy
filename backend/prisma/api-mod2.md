# Module 2: RESTful Design

Building a REST API that works is easy. Building one that other developers actually want to use is harder. The difference comes down to design decisions that seem small in the moment but compound over time: how you name your resources, how you structure your URLs, how you handle pagination, and how you communicate errors. This module is about making those decisions well.

REST is an architectural style, not a standard. That means there is no RFC that defines the "correct" way to build a REST API. There are conventions: strong conventions, backed by years of collective experience: but no spec. This freedom is both REST's strength (you can adapt it to any domain) and its weakness (every API looks slightly different, and the differences matter).

## Resource Naming

Resources are the nouns of your API. An API that manages flight training might have resources like `pilots`, `aircraft`, `training-sessions`, `instructors`, and `certifications`. The names you choose for these resources determine how intuitive your API is to use.

### Rules That Hold Up

**Use nouns, not verbs.** The HTTP method is the verb. The URL is the noun. `GET /pilots` is correct. `GET /get-pilots` or `GET /listAllPilots` is not. The method already tells you what action is happening: the URL should tell you what thing it is happening to.

**Use plural nouns for collections.** `/pilots` not `/pilot`. The collection always exists even if it is empty. `GET /pilots` returns a list (even if the list is empty). `GET /pilots/123` returns a single pilot. This consistency eliminates ambiguity: developers never have to guess whether a URL expects singular or plural.

**Use kebab-case for multi-word resource names.** `/training-sessions` not `/trainingSessions` or `/training_sessions`. Kebab-case is the convention in HTTP headers (e.g., `Content-Type`), and it reads cleanly in URLs. CamelCase in URLs is hard to read and easy to mistype.

**Do not expose implementation details.** The URL should describe the resource, not how the server stores it. `/users` not `/db2/users`. `/api/v1/aircraft` not `/api/v1/mysql/aircraft`. The client should not know or care whether the data lives in PostgreSQL, MongoDB, or a flat file.

**Hierarchical URLs represent relationships.** `/pilots/123/training-sessions` means "training sessions belonging to pilot 123." This is natural and readable. But do not go deeper than two levels. `/pilots/123/training-sessions/456/grades/789` is a URL that nobody wants to type, remember, or debug. If you need deeper nesting, consider using query parameters to filter the top-level resource instead.

### Practical Naming Patterns

Here is how a flight training API might name its resources:

```
GET    /api/v1/pilots                          # All pilots
GET    /api/v1/pilots/123                      # Specific pilot
POST   /api/v1/pilots                          # Create pilot
GET    /api/v1/pilots/123/certifications       # Certifications for a pilot
GET    /api/v1/aircraft                        # All aircraft
GET    /api/v1/aircraft/N12345                 # Specific aircraft by tail number
GET    /api/v1/training-sessions               # All training sessions
GET    /api/v1/training-sessions?pilot_id=123  # Sessions for a specific pilot
```

Notice the two patterns for relationships. `/pilots/123/certifications` uses a nested URL to show the relationship. `GET /training-sessions?pilot_id=123` uses a query parameter to filter. Both are valid REST. The nested URL is more readable for tightly coupled parent-child relationships. The query parameter is more flexible when the same resource can be filtered by multiple criteria.

### Common Naming Mistakes

**Mixing singular and plural.** If some endpoints use `/pilot` and others use `/pilots`, developers will get confused. Pick one convention and enforce it everywhere. Plural is almost always the right choice.

**Using CRUD verbs in URLs.** `/createPilot`, `/updatePilot`, `/deletePilot`: these are RPC-style endpoints pretending to be REST. The HTTP method already communicates the action. Repeating it in the URL is redundant noise.

**Using abbreviations.** `/pilots/123/trn-sess` saves no one any time. Write out full words. URLs are read by humans, and abbreviations make them harder to parse.

**Inconsistent pluralization.** Some resources have irregular plurals (person/people, aircraft/aircraft). Pick one convention and stick with it. Most APIs use the same form for singular and plural when the plural is irregular: `aircraft` for both the collection and the individual record.

## HTTP Verbs in Depth

You learned the basics of HTTP methods in Module 1. Here we go deeper into the semantics and edge cases that matter in real API design.

### GET

GET retrieves a resource or collection. The server returns the current state of the resource. GET must be safe (no side effects) and idempotent (same result every time).

A common violation of this rule is incrementing a view counter in a GET handler. `GET /articles/123` should not update a `view_count` column in the database. If you need to track views, use a separate mechanism: an analytics endpoint that accepts POST requests, or a background job that reads from access logs.

GET requests should never expose sensitive data in the URL. If you are filtering by a user's email, do not put it in the query string: `GET /users?email=user@secret.com`. The email will appear in server logs, browser history, and proxy logs. Instead, use POST with a body for searches that might contain sensitive data, even though this breaks the pure REST convention.

### POST

POST creates a new resource. The server decides the URL of the new resource and returns it in the `Location` header. POST is not idempotent: sending the same POST request twice should create two resources (unless the server has deduplication logic, which adds complexity).

A common confusion is using POST for updates. If the client sends a POST request with an ID that already exists, what should the server do? Options include: return 409 Conflict, update the resource (making POST behave like PUT), or ignore the ID and always create a new resource. The cleanest approach is to always create a new resource and let the client use PUT or PATCH for updates.

POST responses should return:
- `201 Created` with the new resource in the body
- `Location` header with the URL of the new resource
- Any relevant metadata (creation timestamp, default values applied)

### PUT

PUT replaces the entire resource. The client sends the complete representation, and the server replaces the stored version with it. PUT is idempotent: sending the same PUT request multiple times produces the same result.

The critical difference between PUT and POST is that PUT requires the client to know the full state of the resource. If a pilot record has 20 fields and the client only sends 3, what happens to the other 17? There are two valid interpretations:

**Null means delete.** If the client sends `{"name": "John", "email": null}`, the email field is cleared. This is dangerous because a client that does not know about all fields might accidentally null out important data.

**Missing means unchanged.** If the client sends only `{"name": "John"}`, the email and all other fields remain unchanged. This is safer but technically makes PUT behave more like PATCH.

The safest approach is to document clearly which interpretation your API uses and to validate that PUT requests contain all required fields. If a field is optional, document its default value.

### PATCH

PATCH partially updates a resource. Unlike PUT, the client only sends the fields that need to change. PATCH is not necessarily idempotent, though it can be.

PATCH requests typically use one of two formats:

**Merge format:** The request body contains only the fields to update.
```json
PATCH /pilots/123
{
  "phone": "+1-555-0199"
}
```

**JSON Patch format:** The request body contains an array of operations.
```json
PATCH /pilots/123
[
  { "op": "replace", "path": "/phone", "value": "+1-555-0199" },
  { "op": "remove", "path": "/middle_name" },
  { "op": "add", "path": "/certifications/-", "value": "CPL" }
]
```

JSON Patch is more powerful (it can handle removals, additions, and nested operations) but more complex. For most APIs, the merge format is sufficient. Use JSON Patch when you need atomic operations that modify multiple fields with different actions.

### DELETE

DELETE removes a resource. It is idempotent: deleting something that is already deleted returns either 200 (with the deleted resource) or 404 (if the resource is gone). Both are valid. The choice depends on whether your API wants to confirm what was deleted or signal that it was already gone.

DELETE should not permanently destroy data in most cases. Soft deletion (setting a `deleted_at` timestamp) is the standard approach for production APIs. This allows recovery from accidental deletions and maintains referential integrity. The API can filter out soft-deleted resources by default while still allowing administrators to access them.

```json
DELETE /pilots/123
# Response: 204 No Content

# Later, the pilot record still exists with deleted_at set:
{
  "id": 123,
  "name": "John Doe",
  "deleted_at": "2026-08-30T14:30:00Z"
}
```

### Idempotency in Practice

Idempotency is critical for reliable API communication. Network issues can cause a client to send the same request multiple times. If the request is idempotent (like PUT or DELETE), the result is the same regardless of how many times it executes. If the request is not idempotent (like POST), the client might create duplicate resources.

To handle this, some APIs support idempotency keys. The client generates a unique key and includes it with the request. The server stores the key and the response. If the same key arrives again, the server returns the stored response instead of executing the operation again:

```
POST /api/v1/pilots
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{ ... }
```

This is particularly important for payment APIs and any API where duplicate execution has real consequences.

## Pagination

When a collection can contain thousands or millions of records, you cannot return them all at once. Pagination breaks the response into manageable chunks. There are several approaches, each with trade-offs.

### Offset-Based Pagination

The most common approach. The client specifies a starting point and a page size:

```
GET /api/v1/pilots?page=3&limit=25
```

This is simple to implement and understand. The server runs `SELECT * FROM pilots OFFSET 75 LIMIT 25`. Most databases support this natively.

The problem is performance. As the offset grows, the database must scan through all the preceding rows before it can return the page. For a table with 1 million rows, page 40,000 (offset 1,000,000) is significantly slower than page 1. This is the "deep pagination" problem.

A standard response looks like:

```json
{
  "data": [...],
  "pagination": {
    "page": 3,
    "limit": 25,
    "total": 1247,
    "total_pages": 50,
    "has_next": true,
    "has_previous": true
  }
}
```

### Cursor-Based Pagination

Instead of an offset, the client passes a cursor: a opaque string that encodes the position in the result set:

```
GET /api/v1/pilots?cursor=eyJpZCI6MTIzfQ==&limit=25
```

The server decodes the cursor (which typically contains the last ID seen) and returns the next batch:

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTQ4fQ==",
    "has_next": true,
    "limit": 25
  }
}
```

Cursor-based pagination eliminates the deep pagination problem because the database uses an index seek (`WHERE id > 123 LIMIT 25`) instead of an offset. It is also resilient to data changes: if a new record is inserted while the user is paginating, offset-based pagination might skip or duplicate records. Cursor-based pagination does not have this issue because it uses the last seen ID as the anchor.

The trade-off is that cursors are opaque. The client cannot jump to an arbitrary page. There is no "go to page 5" with cursor pagination. If the user needs to navigate to specific pages, offset-based pagination is still the right choice.

### Keyset Pagination

A variant of cursor pagination where the client specifies the sort key directly:

```
GET /api/v1/pilots?created_after=2026-01-15T10:00:00Z&limit=25
```

This is more transparent than opaque cursors and works well when the sort key is a timestamp or sequential ID. It has the same performance benefits as cursor-based pagination but exposes the pagination mechanism to the client.

### Which to Choose

Use cursor-based pagination for APIs where clients scroll through results (like a feed or search results). Use offset-based pagination for APIs where clients need to jump to specific pages (like admin dashboards with page numbers). Use keyset pagination when the sort key is a timestamp and the client needs to query records "since" a specific point.

## Filtering and Sorting

Pagination tells you which page to return. Filtering tells you which records belong on that page. Sorting tells you what order they should be in.

### Filtering

Filtering uses query parameters to narrow the result set:

```
GET /api/v1/pilots?status=active&certification=CPL&min_flight_hours=500
```

Each query parameter maps to a condition on the resource. The server applies all conditions and returns only matching records.

For date ranges, use standard ISO 8601 format with separate parameters for start and end:

```
GET /api/v1/training-sessions?start_date=2026-01-01&end_date=2026-06-30
```

For text search, use a `q` parameter:

```
GET /api/v1/pilots?q=smith
```

The `q` parameter triggers a full-text search across relevant fields (name, email, license number). The implementation is database-specific: PostgreSQL uses `ts_vector` and `ts_query`, MySQL uses `FULLTEXT` indexes.

### Sorting

Sorting uses a `sort` query parameter:

```
GET /api/v1/pilots?sort=name
GET /api/v1/pilots?sort=-created_at   # Descending order
```

The convention of prefixing with `-` for descending order comes from JSON API and is widely adopted. An alternative is `sort=name:desc`, but the `-` prefix is simpler.

The server should validate the sort parameter against a whitelist of allowed fields. If a client tries to sort by `password_hash` or `ssn`, the server should reject the request with 400 Bad Request, not silently ignore it.

### Compound Filtering

Real-world filtering often combines multiple parameters with different operators:

```
GET /api/v1/pilots?status=active&min_flight_hours=500&certification_in=CPL,ATPL&sort=-total_flight_hours&limit=10
```

This gets complex quickly. For APIs with sophisticated filtering needs, consider using a standardized filtering syntax like the one defined by JSON API:

```
GET /api/v1/pilots?filter[status]=active&filter[flight_hours][gte]=500
```

Or for simpler cases, stick with the flat query parameter approach and document clearly which parameters support which operations.

## Content Negotiation

REST supports multiple representations of the same resource. A pilot record can be returned as JSON, XML, CSV, or any other format. Content negotiation uses the `Accept` header to let the client specify which format it wants:

```
GET /api/v1/pilots/123
Accept: application/json
```

The server reads the `Accept` header and returns the requested format:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 123,
  "first_name": "John",
  "last_name": "Doe"
}
```

If the client requests a format the server does not support:

```
GET /api/v1/pilots/123
Accept: application/pdf

HTTP/1.1 406 Not Acceptable
{
  "error": "not_acceptable",
  "message": "Supported formats: application/json, application/xml, text/csv"
}
```

Content negotiation is particularly useful for APIs that serve multiple consumers. A web application requests JSON. An Excel plugin requests CSV. A legacy system requests XML. The same endpoint serves all of them.

## Hypermedia (HATEOAS)

REST, in its purest form, includes hypermedia as the engine of application state (HATEOAS). This means the API response includes links that tell the client what actions are available next:

```json
{
  "id": 123,
  "name": "John Doe",
  "status": "active",
  "links": [
    { "rel": "self", "href": "/api/v1/pilots/123", "method": "GET" },
    { "rel": "certifications", "href": "/api/v1/pilots/123/certifications", "method": "GET" },
    { "rel": "training-sessions", "href": "/api/v1/pilots/123/training-sessions", "method": "GET" },
    { "rel": "update", "href": "/api/v1/pilots/123", "method": "PATCH" },
    { "rel": "delete", "href": "/api/v1/pilots/123", "method": "DELETE" }
  ]
}
```

The idea is that the client discovers available actions by following links, rather than hardcoding URLs. In theory, this makes the API more resilient to URL changes: if the server changes the URL for certifications, the client does not need to be updated because it follows the link.

In practice, HATEOAS is rarely implemented fully. Most REST APIs include self links but skip the full hypermedia approach because:
- It adds significant response size overhead
- Clients typically hardcode URL patterns anyway
- The added complexity does not justify the resilience benefits for most APIs
- There is no widely adopted standard for link formats (HAL, JSON API, and JSON:API all propose different structures)

Include self links in your responses (they help with discoverability and debugging), but do not feel obligated to implement full HATEOAS unless you have a specific use case that justifies it.

## Real Scenario: Designing a REST API for a Flight Training Platform

You are building the API for a flight training management system. The platform tracks pilots, their training progress, aircraft availability, and flight sessions. Here is how you would design the API from scratch.

### Resource Identification

The core resources are:
- `pilots`: People learning to fly
- `aircraft`: The planes used for training
- `training-sessions`: Scheduled flight or ground training
- `instructors`: Certified flight instructors
- `certifications`: Pilot ratings and certificates
- `flight-logs`: Records of completed flights

### URL Structure

```
/api/v1/pilots
/api/v1/pilots/:id
/api/v1/pilots/:id/certifications
/api/v1/pilots/:id/flight-logs
/api/v1/aircraft
/api/v1/aircraft/:id
/api/v1/aircraft/:id/maintenance-records
/api/v1/training-sessions
/api/v1/training-sessions/:id
/api/v1/instructors
/api/v1/instructors/:id
/api/v1/certifications
/api/v1/flight-logs
```

### Example Requests

**Create a new pilot:**
```
POST /api/v1/pilots
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Martinez",
  "email": "jane.martinez@email.com",
  "phone": "+1-555-0142",
  "date_of_birth": "1995-03-22",
  "medical_certificate_class": 2,
  "medical_certificate_expiry": "2027-03-22"
}
```

Response:
```
HTTP/1.1 201 Created
Location: /api/v1/pilots/456
Content-Type: application/json

{
  "id": 456,
  "first_name": "Jane",
  "last_name": "Martinez",
  "email": "jane.martinez@email.com",
  "phone": "+1-555-0142",
  "date_of_birth": "1995-03-22",
  "medical_certificate_class": 2,
  "medical_certificate_expiry": "2027-03-22",
  "total_flight_hours": 0,
  "status": "active",
  "created_at": "2026-08-30T14:30:00Z",
  "updated_at": "2026-08-30T14:30:00Z",
  "links": [
    { "rel": "self", "href": "/api/v1/pilots/456" },
    { "rel": "certifications", "href": "/api/v1/pilots/456/certifications" },
    { "rel": "flight-logs", "href": "/api/v1/pilots/456/flight-logs" }
  ]
}
```

**List pilots with filtering and pagination:**
```
GET /api/v1/pilots?status=active&certification=CPL&sort=-total_flight_hours&page=1&limit=20
```

Response:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "id": 123,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@email.com",
      "total_flight_hours": 342,
      "status": "active",
      "links": [
        { "rel": "self", "href": "/api/v1/pilots/123" }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  }
}
```

**Log a completed flight:**
```
POST /api/v1/flight-logs
Content-Type: application/json

{
  "pilot_id": 456,
  "aircraft_id": 789,
  "instructor_id": 321,
  "date": "2026-08-30",
  "departure_time": "2026-08-30T08:00:00Z",
  "arrival_time": "2026-08-30T10:30:00Z",
  "route": "KJFK-KBOS",
  "flight_type": "cross_country",
  "instrument_conditions": false,
  "dual_command": true,
  "pic_time": 0,
  "dual_time": 2.5,
  "night_time": 0,
  "instrument_time": 0,
  "fuel_burned_gallons": 45,
  "notes": "Practiced instrument approaches at KBOS"
}
```

### Validation Rules

Every endpoint needs validation rules. For the pilot creation endpoint:
- `first_name`: required, string, 1-100 characters
- `last_name`: required, string, 1-100 characters
- `email`: required, valid email format, unique in the database
- `phone`: optional, valid phone format
- `date_of_birth`: required, date in the past, pilot must be at least 16 years old
- `medical_certificate_class`: required, one of [1, 2, 3]
- `medical_certificate_expiry`: required, date in the future

Return 422 Unprocessable Entity with specific field-level errors when validation fails:

```json
{
  "error": "validation_failed",
  "message": "The request contains invalid fields",
  "details": [
    {
      "field": "email",
      "message": "A pilot with this email already exists",
      "code": "unique_violation"
    },
    {
      "field": "medical_certificate_expiry",
      "message": "Medical certificate must not be expired",
      "code": "future_date_required"
    }
  ]
}
```

This response format gives the client everything it needs to display meaningful error messages and highlight the specific fields that need correction.

### API Documentation

Every REST API needs documentation. The OpenAPI specification (formerly Swagger) is the standard format for documenting REST APIs. It defines the available endpoints, request parameters, response formats, authentication requirements, and error codes in a machine-readable format.

A good API documentation includes:
- A getting started guide with authentication instructions
- Endpoint reference with request/response examples
- Error code reference with descriptions
- Rate limit information
- Code examples in multiple languages

Tools like Swagger UI, Redoc, and Stoplight render OpenAPI specifications as interactive documentation where developers can test endpoints directly from the browser.

## Assessment

**Lab 1: URL Design** (40 minutes)

Given a domain model with 10 resources and their relationships (e.g., hospitals, doctors, patients, appointments, prescriptions, medications, lab results, departments, insurance plans, billing records), design the complete URL structure for a REST API. Include:
- Collection and individual resource URLs
- Relationship URLs (e.g., a doctor's patients)
- At least 2 filter variations per collection endpoint

Write your answer as a table with columns: HTTP Method, URL, Description.

Grading: 40 points. 2 points per correctly designed URL.

**Lab 2: Pagination Implementation** (45 minutes)

Implement cursor-based pagination for an API endpoint. You are given a database table schema and sample data. Write:
1. The SQL query that implements cursor-based pagination
2. The API response format with cursor, has_next, and has_previous fields
3. Edge case handling: what happens when the cursor references a deleted record?
4. A test case with 5 pages of 10 records, showing the cursor values at each step

Grading: 35 points. 10 points for correct SQL, 10 points for response format, 10 points for edge case handling, 5 points for test case.

**Lab 3: API Design Review** (30 minutes)

You are given an existing API specification with 8 endpoints. Identify at least 5 design problems (e.g., inconsistent naming, wrong HTTP methods, missing pagination, unclear error responses, URLs that expose implementation details). For each problem, explain why it is a problem and provide the corrected design.

Grading: 25 points. 5 points per correctly identified and fixed problem (minimum 5 problems required).

## Evidence

- REST API design: Richardson, L. & Amundsen, M. (2013). "RESTful Web APIs." O'Reilly Media.
- HTTP/1.1 semantics: RFC 9110
- JSON API specification: jsonapi.org
- Pagination patterns: Microsoft REST API Guidelines (github.com/microsoft/api-guidelines)
- Fielding's dissertation: Fielding, R. (2000). "Architectural Styles and the Design of Network-based Software Architectures." UC Irvine.
- OpenAPI specification: swagger.io/specification
