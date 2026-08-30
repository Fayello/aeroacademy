# Module 6 — API Design: RESTful Patterns and GraphQL Basics

## What You'll Actually Do

Design APIs that developers actually want to use. You'll learn REST conventions that make endpoints predictable, then build a basic GraphQL API to understand when it's the better choice. This is about designing interfaces, not just wiring up routes.

---

## REST Design Principles

REST isn't just "use HTTP verbs." It's about resources, statelessness, and consistent patterns.

### Resource naming

```
GET    /courses              → list courses
GET    /courses/:id          → get one course
POST   /courses              → create a course
PUT    /courses/:id          → update a course (full)
PATCH  /courses/:id          → update a course (partial)
DELETE /courses/:id          → delete a course

GET    /courses/:id/labs     → nested resource
POST   /courses/:id/labs     → add lab to course
```

### HTTP status codes — use them correctly

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, malformed input |
| 401 | Unauthorized | Missing or invalid auth |
| 403 | Forbidden | Valid auth, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email, unique constraint |
| 422 | Unprocessable | Valid JSON, but semantically wrong |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server crashed |

---

## Building a RESTful Course API

```javascript
// src/routes/courses.js
const router = require("express").Router();
const { body, param, query, validationResult } = require("express-validator");
const { authenticate, authorize } = require("../middleware/auth");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /courses — list with filtering and pagination
router.get("/", async (req, res) => {
  const { difficulty, instructor, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (difficulty) filter.difficulty = difficulty;
  if (instructor) filter.instructorId = instructor;

  const courses = await Course.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Course.countDocuments(filter);

  res.json({
    data: courses,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// GET /courses/:id
router.get("/:id", [
  param("id").isMongoId(),
  validate,
], async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  res.json({ data: course });
});

// POST /courses
router.post("/", authenticate, authorize("admin", "instructor"), [
  body("title").trim().notEmpty().isLength({ max: 100 }),
  body("description").trim().notEmpty().isLength({ max: 500 }),
  body("difficulty").isIn(["beginner", "intermediate", "advanced"]),
  validate,
], async (req, res) => {
  const course = await Course.create({
    ...req.body,
    instructorId: req.user.sub,
  });
  res.status(201).json({ data: course });
});

// PATCH /courses/:id
router.patch("/:id", authenticate, authorize("admin", "instructor"), [
  param("id").isMongoId(),
  body("title").optional().trim().notEmpty().isLength({ max: 100 }),
  body("description").optional().trim().notEmpty().isLength({ max: 500 }),
  body("difficulty").optional().isIn(["beginner", "intermediate", "advanced"]),
  validate,
], async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  res.json({ data: course });
});

// DELETE /courses/:id
router.delete("/:id", authenticate, authorize("admin"), [
  param("id").isMongoId(),
  validate,
], async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }
  res.status(204).end();
});

module.exports = router;
```

---

## API Versioning

Version your API from day one. Breaking changes in v1 affect every consumer.

```
/api/v1/courses
/api/v2/courses    ← new version with breaking changes
```

Simple approach:

```javascript
app.use("/api/v1/courses", require("./routes/v1/courses"));
app.use("/api/v2/courses", require("./routes/v2/courses"));
```

---

## GraphQL Basics

GraphQL lets clients request exactly the data they need. One endpoint, flexible queries.

```javascript
// src/graphql/typeDefs.js
const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Course {
    id: ID!
    title: String!
    description: String!
    difficulty: String!
    labs: [Lab!]!
    instructor: User!
    createdAt: String!
  }

  type Lab {
    id: ID!
    title: String!
    instructions: String!
    difficulty: String!
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    courses(difficulty: String): [Course!]!
    course(id: ID!): Course
    labs(courseId: ID!): [Lab!]!
  }

  type Mutation {
    createCourse(input: CreateCourseInput!): Course!
    updateCourse(id: ID!, input: UpdateCourseInput!): Course!
    deleteCourse(id: ID!): Boolean!
  }

  input CreateCourseInput {
    title: String!
    description: String!
    difficulty: String!
  }

  input UpdateCourseInput {
    title: String
    description: String
    difficulty: String
  }
`;

module.exports = typeDefs;
```

```javascript
// src/graphql/resolvers.js
const resolvers = {
  Query: {
    courses: async (_, { difficulty }) => {
      const filter = difficulty ? { difficulty } : {};
      return Course.find(filter);
    },
    course: async (_, { id }) => Course.findById(id),
    labs: async (_, { courseId }) => Lab.find({ courseId }),
  },

  Course: {
    instructor: (course) => User.findById(course.instructorId),
    labs: (course) => Lab.find({ courseId: course.id }),
  },

  Mutation: {
    createCourse: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError("Not authenticated");
      return Course.create({ ...input, instructorId: user.sub });
    },
    updateCourse: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError("Not authenticated");
      return Course.findByIdAndUpdate(id, input, { new: true });
    },
    deleteCourse: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError("Not authenticated");
      await Course.findByIdAndDelete(id);
      return true;
    },
  },
};

module.exports = resolvers;
```

---

## REST vs GraphQL — When to Choose

| Scenario | Choose |
|----------|--------|
| Simple CRUD, well-known resources | REST |
| Mobile app needs minimal data transfer | GraphQL |
| Multiple consumers need different data shapes | GraphQL |
| File uploads, webhooks | REST |
| Public API for external developers | REST |
| Internal microservice communication | GraphQL |

---

## Assessment

**Lab Task: Design and Build an API (60 minutes)**

Build both REST and GraphQL APIs for a lab platform:

1. **REST API:**
   - `GET /api/v1/labs` with filtering (difficulty, status) and pagination
   - `GET /api/v1/labs/:id` with proper error handling
   - `POST /api/v1/labs` with validation
   - `PATCH /api/v1/labs/:id` partial update
   - `DELETE /api/v1/labs/:id`
   - Consistent response format: `{ data: ... }` for success, `{ error: ... }` for failures

2. **GraphQL API:**
   - Schema with `Lab`, `User`, and `Course` types
   - Query: `labs`, `lab(id)`, `courses`, `course(id)`
   - Mutation: `createLab`, `updateLab`, `deleteLab`
   - Nested resolvers: `Lab.course`, `Course.labs`

3. **Documentation:** Write a brief API doc (one page) describing endpoints and fields.

**Deliverables:** Both API implementations, schema file, resolvers, and API documentation.

**Grading:**
- REST follows conventions (verbs, status codes, naming): 30%
- GraphQL schema is complete and resolvers work: 30%
- Validation and error handling on both: 20%
- API documentation is clear: 20%

---

## Evidence

Save your REST routes, GraphQL schema, and resolvers. Include curl/query examples showing both APIs working. Include your API documentation.
