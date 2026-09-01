# Module 6 — API Design

An API is a contract between your backend and the clients that consume it. A well-designed API is predictable, consistent, and easy to use. A poorly designed API creates confusion, forces workarounds, and breaks when clients evolve. This module covers REST, GraphQL, API versioning, and how to design an API that serves both web and mobile clients.

## Why API Design Matters

Your API is the product for frontend developers. If the API is inconsistent, every frontend developer who uses it will waste time figuring out quirks. If the API is poorly documented, they will write code based on assumptions that turn out to be wrong.

Good API design is not about following a spec. It is about empathy for the developers who will use your API. They need to know what data they will get, what errors they might encounter, and how to handle pagination, filtering, and sorting without reading through your entire codebase.

The decisions you make in API design ripple through every layer of your application. A poorly named resource in the URL becomes a confusing endpoint in your documentation, a confusing component name in the frontend, and a confusing table name in your database. Get the API right and everything downstream falls into place.

API design is a conversation between the backend team and the frontend team. The backend team understands the data model, the business rules, and the technical constraints. The frontend team understands the user experience, the interaction patterns, and the performance requirements. A good API reflects both perspectives. It exposes the data the frontend needs in a structure that is easy to consume, while respecting the backend constraints like rate limits, authentication, and data validation.

Consistency is the most important principle in API design. If one endpoint returns `{ data: { id: 1 } }` and another returns `{ id: 1 }`, developers will be confused. If one endpoint uses `camelCase` for field names and another uses `snake_case`, developers will make mistakes. If one endpoint returns 400 for validation errors and another returns 422, developers will not know which status code to check. Pick conventions and apply them everywhere.

## RESTful Patterns

REST (Representational State Transfer) is an architectural style, not a protocol. It uses HTTP methods to communicate about resources.

### Resource Naming

Resources are nouns, not verbs. The URL identifies the resource, and the HTTP method identifies the action. This is the most fundamental rule of REST design, and violating it is the most common mistake.

```
GET    /api/users          — List users
POST   /api/users          — Create a user
GET    /api/users/:id      — Get a specific user
PUT    /api/users/:id      — Update a user (full replacement)
PATCH  /api/users/:id      — Update a user (partial)
DELETE /api/users/:id      — Delete a user
```

Use plural nouns for collections. Use singular for individual resources. Use nested resources for relationships:

```
GET    /api/users/:id/posts           — Posts by a specific user
POST   /api/users/:id/posts           — Create a post for a user
GET    /api/posts/:id/comments        — Comments on a specific post
POST   /api/posts/:id/comments        — Add a comment to a post
```

Keep nesting shallow. Two levels deep is usually enough. If you need deeper relationships, use query parameters:

```
# Instead of
GET /api/users/:id/posts/:postId/comments/:commentId

# Use
GET /api/comments/:commentId?include=post,user
```

The reason for shallow nesting is that deep nesting creates long URLs that are hard to remember, hard to type, and hard to document. More importantly, deep nesting implies ownership and access control that may not match your actual business rules.

### HTTP Methods and Status Codes

Use the right method for the right action, and return the right status code:

```
GET /api/users          → 200 OK
POST /api/users         → 201 Created
GET /api/users/999      → 404 Not Found
POST /api/users         → 400 Bad Request (validation error)
POST /api/users         → 409 Conflict (duplicate email)
DELETE /api/users/123   → 204 No Content
GET /api/users          → 304 Not Modified (with ETag)
```

Status codes are not optional. They tell the client what happened without parsing the response body. Use them correctly. The most common mistake is returning 200 for everything, which forces clients to parse the response body to determine if the request succeeded.

Here is the complete set of status codes you will use regularly:

- **200 OK** — Request succeeded, response body contains data
- **201 Created** — Resource created, response body contains the new resource
- **204 No Content** — Request succeeded, no response body (common for DELETE)
- **304 Not Modified** — Cached response is still valid
- **400 Bad Request** — Invalid input, validation failed
- **401 Unauthorized** — Authentication required or credentials invalid
- **403 Forbidden** — Authenticated but not authorized
- **404 Not Found** — Resource does not exist
- **409 Conflict** — Resource already exists or state conflict
- **422 Unprocessable Entity** — Valid JSON but semantically incorrect
- **429 Too Many Requests** — Rate limit exceeded
- **500 Internal Server Error** — Something broke on the server

### Request and Response Format

Use JSON for both request and response bodies. Be consistent with field names (camelCase or snake_case — pick one and stick with it). Inconsistency in naming conventions is one of the fastest ways to erode developer trust in your API.

```json
// Successful response
{
  "data": {
    "id": "abc123",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}

// List response with pagination
{
  "data": [
    { "id": "abc123", "name": "Alice" },
    { "id": "def456", "name": "Bob" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Must be a valid email" },
      { "field": "name", "message": "Name is required" }
    ]
  }
}
```

Wrap successful responses in a `data` field. This makes it easy to add metadata later (pagination, rate limit headers, cache status) without breaking existing clients. Error responses should include a machine-readable code, a human-readable message, and details for field-level errors.

### Filtering, Sorting, and Pagination

Use query parameters for these. They are idempotent — the same request always returns the same result.

```
GET /api/posts?status=published&sort=-createdAt&page=2&limit=20
GET /api/users?role=admin&search=alice
GET /api/products?price_min=10&price_max=100&category=electronics
```

The prefix `-` on a sort field means descending order. Use underscored prefixes for range filters. Use descriptive parameter names.

Pagination comes in two flavors: offset-based and cursor-based. Offset pagination is simpler but breaks when data changes between requests. Cursor pagination is more complex but handles real-time data correctly.

```javascript
// Offset pagination
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const products = await Product.find(filter)
  .skip(skip)
  .limit(limit)
  .sort(sort);

// Cursor pagination
const { cursor, limit = 20 } = req.query;
const query = {};
if (cursor) {
  query._id = { $gt: cursor };
}

const products = await Product.find(query)
  .sort({ _id: 1 })
  .limit(parseInt(limit) + 1); // Fetch one extra to check if there are more

const hasMore = products.length > limit;
const data = hasMore ? products.slice(0, -1) : products;
const nextCursor = hasMore ? data[data.length - 1]._id : null;
```

### HATEOAS (Hypermedia)

Include links to related resources in your responses:

```json
{
  "data": {
    "id": "abc123",
    "name": "Alice",
    "email": "alice@example.com"
  },
  "links": {
    "self": "/api/users/abc123",
    "posts": "/api/users/abc123/posts",
    "avatar": "/api/users/abc123/avatar"
  }
}
```

This makes your API discoverable. Clients do not need to hardcode URLs — they follow links. In practice, HATEOAS is rarely implemented fully, but even partial implementation (including a `self` link and related resource links) makes your API easier to navigate.

The links in a response should follow a consistent pattern. The `self` link always points to the current resource. Related resource links use the plural noun of the related resource. Action links (like `confirm`, `cancel`, or `approve`) are named after the action. This consistency means developers can predict link names without reading documentation for every endpoint.

Hypermedia is particularly valuable for long-lived APIs. When you add a new endpoint, existing clients do not need to be updated because they discover the endpoint through links. When you change the URL structure, you can redirect old links to new ones. When you deprecate an endpoint, you can remove the link and clients will stop using it.

However, HATEOAS adds complexity to both the server and the client. The server must generate links for every response. The client must parse links and follow them instead of constructing URLs. For most APIs, the added complexity is not worth the benefit. Include `self` links and related resource links, but do not feel obligated to implement full HATEOAS unless you have a specific use case for it.

## GraphQL Basics

GraphQL is a query language for APIs. Instead of the server defining the shape of the response, the client specifies exactly what data it needs.

### When to Choose GraphQL Over REST

REST works well when your data is naturally organized into resources with predictable access patterns. GraphQL works better when:

- You have many related resources that clients often need together
- Different clients need different subsets of the same data
- You want to reduce the number of API calls from the client
- Your frontend team wants to iterate on data requirements without backend changes

GraphQL is not always better. It adds complexity to your server, makes caching harder, and requires more tooling. Start with REST and move to GraphQL only when you have a clear need.

### Schema Definition

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String
  author: User!
  comments: [Comment!]!
  published: Boolean!
  createdAt: DateTime!
}

type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  createdAt: DateTime!
}

type Query {
  user(id: ID!): User
  users(role: Role, limit: Int, offset: Int): [User!]!
  post(id: ID!): Post
  posts(status: String, tag: String): [Post!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  createPost(input: CreatePostInput!): Post!
  addComment(postId: ID!, content: String!): Comment!
}

input CreateUserInput {
  name: String!
  email: String!
  password: String!
}

input CreatePostInput {
  title: String!
  content: String
  published: Boolean
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Resolver Implementation

```javascript
const resolvers = {
  Query: {
    user: async (_, { id }) => {
      return prisma.user.findUnique({
        where: { id },
        include: { posts: true }
      });
    },

    users: async (_, { role, limit = 20, offset = 0 }) => {
      const where = role ? { role } : {};
      return prisma.user.findMany({
        where,
        include: { posts: true },
        take: limit,
        skip: offset
      });
    },

    post: async (_, { id }) => {
      return prisma.post.findUnique({
        where: { id },
        include: { author: true, comments: true }
      });
    }
  },

  Mutation: {
    createUser: async (_, { input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 12);
      return prisma.user.create({
        data: { ...input, password: hashedPassword }
      });
    },

    createPost: async (_, { input }, context) => {
      if (!context.user) throw new Error("Not authenticated");
      return prisma.post.create({
        data: { ...input, authorId: context.user.id }
      });
    }
  },

  User: {
    posts: (parent) => {
      return prisma.post.findMany({
        where: { authorId: parent.id }
      });
    }
  },

  Post: {
    author: (parent) => {
      return prisma.user.findUnique({
        where: { id: parent.authorId }
      });
    }
  }
};
```

The resolver architecture follows a simple pattern: Query resolvers handle top-level reads, Mutation resolvers handle writes, and type resolvers handle relationships between types. Each resolver receives the parent object as its first argument, which is how GraphQL chains resolvers together.

### Client Queries

```graphql
# Client asks for exactly what it needs
query GetUserDashboard($userId: ID!) {
  user(id: $userId) {
    name
    email
    posts(limit: 5) {
      id
      title
      createdAt
      comments {
        id
        content
        author {
          name
        }
      }
    }
  }
}
```

The client gets back exactly the shape it asked for. No over-fetching, no under-fetching. This is the primary advantage of GraphQL over REST for complex, nested data requirements.

## API Versioning

APIs evolve. Endpoints change, fields are added or removed, response formats shift. Without versioning, breaking changes will break existing clients.

The fundamental tension in API design is between stability and evolution. Clients want a stable API that does not break when they upgrade. You want the freedom to improve your API without being constrained by backward compatibility. Versioning resolves this tension by allowing both: the old version continues to work while the new version introduces changes.

Not every change requires a new version. Adding a new field to a response is non-breaking — existing clients simply ignore the new field. Adding a new endpoint is non-breaking — existing clients do not know about it and continue using existing endpoints. Adding a new optional parameter is non-breaking — existing clients do not send the parameter and get the default behavior.

Breaking changes require a new version. Removing or renaming a field breaks clients that depend on it. Changing a field's type (from number to string) breaks clients that parse the field. Changing the response structure (from flat to nested) breaks clients that access the old structure. Adding a required parameter breaks clients that do not send it.

The decision to create a new version should be based on the impact to existing clients. If you have 10 clients and 1 of them will break, you might decide to update that client instead of creating a new version. If you have 1000 clients and 100 of them will break, you definitely need a new version. The cost of maintaining multiple versions must be weighed against the cost of updating clients.

### What Counts as a Breaking Change

Not every change requires a new version. Here is the distinction:

**Non-breaking changes (no version bump needed):**
- Adding a new field to a response
- Adding a new endpoint
- Adding a new optional parameter
- Adding a new enum value (if clients handle unknown values)

**Breaking changes (version bump required):**
- Removing or renaming a field
- Changing a field's type
- Changing the meaning of a field
- Changing the response structure
- Adding a required parameter to an existing endpoint
- Changing authentication requirements

### URL Versioning

The simplest approach — include the version in the URL:

```
/api/v1/users
/api/v2/users
```

```javascript
// src/routes/v1/users.js
router.get("/", listUsersV1);

// src/routes/v2/users.js
router.get("/", listUsersV2); // Different response format

// src/app.js
app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);
```

URL versioning is explicit, easy to understand, works with browser caching, and is supported by all tools. The downside is URL proliferation — you end up with duplicate routes. But this is a small price for clarity.

### Header Versioning

Include the version in the `Accept` header:

```
Accept: application/vnd.myapp.v2+json
```

```javascript
function versionMiddleware(req, res, next) {
  const accept = req.headers.accept || "";
  const match = accept.match(/application\/vnd\.myapp\.v(\d+)\+json/);
  
  if (match) {
    req.apiVersion = parseInt(match[1]);
  } else {
    req.apiVersion = 1; // Default version
  }
  
  next();
}
```

### Query Parameter Versioning

```
/api/users?version=2
```

### Choosing a Strategy

URL versioning is the most common and easiest to understand. It is explicit and works well with tools and caches. Use it unless you have a specific reason not to.

Whatever you choose, be consistent. Do not mix strategies. And document your versioning policy so clients know when to upgrade. A common policy is to support the current version and one previous version, giving clients time to migrate.

When planning your versioning strategy, consider the following practical aspects. Versioning adds overhead to every API change — you need to decide whether the change is breaking, potentially maintain multiple versions, and coordinate deprecation timelines. For small teams with few clients, the overhead of versioning may not be justified. For large teams with many clients, versioning is essential.

If you decide not to version your API, you can still make breaking changes by following the expand and contract pattern. First, add the new field or endpoint alongside the old one (expand). Then, update all clients to use the new field or endpoint. Finally, remove the old field or endpoint (contract). This approach avoids explicit versioning but requires coordination with clients and a deprecation period.

Regardless of your versioning strategy, communicate changes clearly. Use changelogs, migration guides, and deprecation warnings. Give clients ample time to upgrade. Test the migration path before releasing the change. The goal is to make upgrades as painless as possible for the people who depend on your API.

## Real Scenario: Designing an API for a Mobile App

Let us design an API for a social media mobile app. Mobile clients have specific needs: they need efficient data transfer, offline support indicators, and minimal round trips.

### Requirements

- User profiles with follow/unfollow
- Posts with images, text, and hashtags
- Feed of posts from followed users
- Comments and likes
- Push notification registration

### Resource Design

```
# Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

# Users
GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/:id
POST   /api/v1/users/:id/follow
DELETE /api/v1/users/:id/follow

# Posts
GET    /api/v1/feed                     — Paginated feed
POST   /api/v1/posts                    — Create post
GET    /api/v1/posts/:id
DELETE /api/v1/posts/:id
POST   /api/v1/posts/:id/like
DELETE /api/v1/posts/:id/like
GET    /api/v1/posts/:id/comments
POST   /api/v1/posts/:id/comments

# Search
GET    /api/v1/search/users?q=alice
GET    /api/v1/search/posts?q=javascript&tag=tutorial

# Notifications
POST   /api/v1/notifications/register   — Register push token
GET    /api/v1/notifications             — List notifications
PATCH  /api/v1/notifications/:id/read
```

Notice the pattern: each resource has consistent endpoints for CRUD operations, and action-based endpoints (like follow, like, register) use POST for actions and DELETE for undoing them. This consistency means developers can predict endpoint names without reading documentation.

### Response Design

```json
// User profile
{
  "data": {
    "id": "abc123",
    "name": "Alice",
    "username": "alice_dev",
    "avatar": "https://cdn.example.com/avatars/abc123.jpg",
    "bio": "Full-stack developer",
    "followersCount": 1234,
    "followingCount": 567,
    "postsCount": 89,
    "isFollowing": false,
    "joinedAt": "2025-06-15T00:00:00Z"
  }
}

// Feed post (optimized for mobile)
{
  "data": [
    {
      "id": "post123",
      "author": {
        "id": "user456",
        "name": "Bob",
        "username": "bob_coder",
        "avatar": "https://cdn.example.com/avatars/user456.jpg"
      },
      "content": "Just published a new article about API design!",
      "image": "https://cdn.example.com/posts/post123.jpg",
      "imageWidth": 1200,
      "imageHeight": 800,
      "likesCount": 42,
      "commentsCount": 7,
      "isLiked": false,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "eyJpZCI6InBvc3QxMjMifQ==",
    "hasMore": true
  }
}
```

Notice the feed uses cursor-based pagination instead of offset-based. Cursor pagination is more efficient for mobile infinite scroll — it does not skip records, so it handles new posts being added between requests. The `nextCursor` is a base64-encoded value that the client passes as a query parameter in the next request.

The response includes `imageWidth` and `imageHeight` so the client can reserve space for the image before it loads, preventing layout shift. This is a small detail that makes a big difference in user experience.

### Mobile-Specific Considerations

```javascript
// Field selection — mobile clients may need fewer fields
router.get("/posts", async (req, res) => {
  const { fields } = req.query;
  const select = fields ? fields.split(",") : undefined;

  const posts = await prisma.post.findMany({
    select: select ? {
      id: true,
      ...Object.fromEntries(select.map(f => [f, true]))
    } : undefined
  });

  res.json({ data: posts });
});

// Conditional requests — save bandwidth
router.get("/posts/:id", async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });

  const etag = `"${post.updatedAt.getTime()}"`;
  
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).send();
  }

  res.set("ETag", etag);
  res.json({ data: post });
});

// Batch endpoints — reduce round trips
router.post("/batch", async (req, res) => {
  const { requests } = req.body;

  const results = await Promise.all(requests.map(async (req) => {
    switch (req.resource) {
      case "user":
        return prisma.user.findUnique({ where: { id: req.id } });
      case "post":
        return prisma.post.findUnique({ where: { id: req.id } });
      default:
        return null;
    }
  }));

  res.json({ data: results });
});
```

Mobile networks are slow and unreliable. Every round trip costs 100-500ms. A batch endpoint that fetches 5 resources in one request is 5 times faster than 5 separate requests. ETag caching means the server can return an empty 304 response instead of re-sending data that has not changed, saving both bandwidth and battery.

## Assessment

### Lab Task: Design a REST API

**Time Limit: 60 minutes**

Design and document a REST API for a project management tool (like Trello). The API must support:

1. **Workspaces:** Multiple workspaces, each with members and roles.
2. **Boards:** Boards within workspaces, each with lists.
3. **Cards:** Cards within lists, with assignees, due dates, and labels.
4. **Comments:** Comments on cards with author information.
5. **Search:** Search across cards by title, label, or assignee.

**Deliverables:**
- API endpoint documentation (URLs, methods, status codes)
- Request/response examples for at least 8 endpoints
- Error response format
- Pagination strategy
- At least 2 endpoints that demonstrate nested resource access
- Implementation of at least 3 endpoints in Express

### Grading Criteria

- **Resource Design (25 points):** Resources are named consistently, use proper HTTP methods, and follow REST conventions.
- **Response Format (20 points):** Consistent JSON structure, proper status codes, meaningful error messages.
- **Pagination and Filtering (20 points):** Cursor or offset pagination works, filtering is supported on key fields.
- **Implementation (25 points):** Express endpoints are functional, validate input, and handle errors.
- **Documentation (10 points):** Clear endpoint documentation with examples.

### Evidence

After completing this module, you should be able to:

1. Design RESTful APIs with consistent resource naming and HTTP methods.
2. Choose appropriate status codes for different scenarios.
3. Implement filtering, sorting, and pagination with query parameters.
4. Build a GraphQL schema and resolvers for a complex data model.
5. Implement API versioning with a clear strategy.
6. Design APIs for mobile clients with efficiency in mind.
7. Document APIs clearly with examples and error formats.
