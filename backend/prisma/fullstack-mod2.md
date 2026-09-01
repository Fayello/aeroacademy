# Module 2: Node.js and Express

Node.js changed the game by letting developers write server-side code in JavaScript. Express is the minimal framework that sits on top of Node.js and gives you the tools to build web applications and APIs without reinventing the wheel. This module covers everything you need to build production-ready servers: setting up Express, designing middleware, handling routes, managing errors, and building a complete REST API.

## Why Node.js and Express

Node.js uses the V8 JavaScript engine and an event-driven, non-blocking I/O model. This means it can handle thousands of concurrent connections with a single thread. For a full-stack JavaScript developer, this means you write one language on both sides of the application, share validation logic, and move between frontend and backend without context switching.

Express gives you the building blocks: routing, middleware, request/response handling. It does not impose opinions about project structure, database access, or authentication. This flexibility is both its strength and its challenge: you need to understand the patterns to build something maintainable.

Understanding the event-driven architecture of Node.js is essential for writing performant server code. When a request arrives, Node.js does not create a new thread to handle it. Instead, it adds the request to an event loop and continues processing other events. When an asynchronous operation completes (like reading from a database or file system), Node.js executes the callback function associated with that operation. This model is efficient for I/O-bound workloads (like web servers that spend most of their time waiting for database responses) but inefficient for CPU-bound workloads (like image processing or complex calculations).

Express is intentionally minimal. It provides the essential features for building web applications: routing, middleware, template engines, static file serving: but leaves everything else to you. This means you choose your own database driver, authentication library, validation framework, and testing tools. The advantage is that you are not forced to use tools you do not need. The disadvantage is that you need to make these choices yourself and integrate them correctly.

The middleware pattern is what makes Express powerful. Middleware functions are small, focused units of code that process HTTP requests. They can log requests, parse body content, authenticate users, validate input, handle errors, and more. You chain middleware together to build complex request processing pipelines. Understanding how middleware works: how it receives the request, how it calls `next()` to pass control, and how it can send a response to end the chain: is the key to writing Express applications.

## Setting Up a Node.js Project

Start with a clean project structure. The way you organize code at the beginning determines how painful development will be six months from now.

### Project Initialization

```bash
mkdir my-api && cd my-api
npm init -y
npm install express
npm install -D nodemon
```

Update `package.json` with scripts:

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  }
}
```

### Directory Structure

```
my-api/
  src/
    index.js         : Entry point
    app.js           : Express app configuration
    routes/
      users.js       : User routes
      orders.js      : Order routes
    middleware/
      auth.js        : Authentication middleware
      errorHandler.js: Global error handling
      validate.js    : Request validation
    models/
      User.js        : User data model
    services/
      userService.js : Business logic
  package.json
  .env
  .env.example
```

The key principle: `index.js` is only responsible for starting the server. `app.js` configures Express. Business logic lives in services, not in route handlers.

### The Entry Point

The entry point is responsible for starting the server, connecting to the database, and handling process signals. It should be as simple as possible: all configuration happens in `app.js`.

```javascript
// src/index.js
const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully.");
  server.close(() => {
    process.exit(0);
  });
});
```

Notice the `SIGTERM` handler. When your application runs in production (behind a load balancer or in a container), it needs to shut down gracefully: finish processing current requests, close database connections, then exit. Without this, you get dropped connections and data corruption.

The `server` variable is important. The `app.listen()` method returns an HTTP server instance, which you need for the graceful shutdown. Calling `server.close()` stops the server from accepting new connections but allows existing connections to complete. The callback passed to `server.close()` runs after all connections are closed, which is when you should exit the process.

In production, you might also want to handle uncaught exceptions and unhandled promise rejections. These indicate bugs in your code that would otherwise crash the process silently:

```javascript
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
```

These handlers should log the error and exit the process. Do not try to recover from uncaught exceptions: the application is in an undefined state and should be restarted. The difference between SIGTERM and SIGINT is that SIGTERM can be caught and handled gracefully, while SIGINT (Ctrl+C) is typically used for immediate termination. In production, you will almost always receive SIGTERM from the process manager or container orchestrator.

## Express App Configuration

```javascript
// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const userRoutes = require("./routes/users");
const orderRoutes = require("./routes/orders");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// Request logging
app.use(morgan("combined"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// 404 handler: must come after all routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler: must be last
app.use(errorHandler);

module.exports = app;
```

The order of middleware matters. Express executes middleware in the order you register it. If you put the error handler before your routes, it will never catch route errors. If you put the 404 handler before your routes, every request will return 404.

## Middleware Patterns

Middleware functions are the backbone of Express. A middleware function has access to `req`, `res`, and a `next` function. It can modify the request, send a response, or pass control to the next middleware.

Understanding middleware execution order is critical. Express processes middleware in the order you register it. When a request arrives, Express starts at the first middleware and calls it. If the middleware calls `next()`, Express moves to the next middleware. If the middleware sends a response (like `res.json()`), the chain stops. If the middleware throws an error, Express skips to the error handler.

This sequential execution model means that the order of middleware registration matters enormously. Security middleware (like helmet) should come first so it applies to all subsequent handlers. Body parsing middleware should come before routes that need the request body. Authentication middleware should come before protected routes. Error handlers must come last so they can catch errors from any middleware in the chain.

A common mistake is registering middleware after routes. If you register `app.use(express.json())` after your routes, the routes will not have access to the parsed request body. If you register `app.use(errorHandler)` before your routes, the error handler will never catch route errors. Always follow this order: security middleware, utility middleware, body parsing, routes, 404 handler, error handler.

Middleware can also be scoped to specific paths. When you use `app.use("/api", apiMiddleware)`, the middleware only runs for requests that start with `/api`. This is useful for applying authentication only to API routes while leaving public routes (like health checks) unprotected.

### The Middleware Chain

```javascript
// Simple logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
}

app.use(requestLogger);
```

This middleware does not modify the request or send a response. It attaches a listener to the `finish` event and calls `next()` to pass control to the next middleware. The `finish` event fires when the response has been sent, so you can log the response time.

### Middleware That Modifies Request

```javascript
// Attach user to request from JWT token
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(401).json({ error: "Invalid token" });
  }
}

// Use it on specific routes
app.get("/api/profile", authenticate, (req, res) => {
  res.json(req.user);
});
```

### Middleware Factory Functions

Create configurable middleware with factory functions:

```javascript
// Validation middleware factory
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join("."),
        message: detail.message
      }));
      return res.status(400).json({ errors });
    }

    req.body = value;
    next();
  };
}

// Usage with Joi schema
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid("user", "admin").default("user")
});

app.post("/api/users", validate(createUserSchema), async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});
```

### Role-Based Middleware

```javascript
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

// Only admins can access
app.delete("/api/users/:id", authenticate, authorize("admin"), deleteUser);

// Both admins and managers can access
app.get("/api/reports", authenticate, authorize("admin", "manager"), getReports);
```

## Routing

Express routing is flexible. You can define routes inline, in separate files, or using routers for modular organization.

### Route Files

```javascript
// src/routes/users.js
const router = require("express").Router();
const ctrl = require("../controllers/userController");
const { validate } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const { createUserSchema, updateUserSchema } = require("../schemas/userSchemas");

router.get("/", authenticate, ctrl.listUsers);
router.get("/:id", authenticate, ctrl.getUser);
router.post("/", validate(createUserSchema), ctrl.createUser);
router.put("/:id", authenticate, validate(updateUserSchema), ctrl.updateUser);
router.delete("/:id", authenticate, ctrl.deleteUser);

module.exports = router;
```

### Route Parameters and Query Strings

```javascript
// GET /api/products?category=electronics&sort=-price&page=2&limit=20
router.get("/", async (req, res) => {
  const { category, sort, page = 1, limit = 20 } = req.query;
  
  const filter = {};
  if (category) filter.category = category;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const products = await Product.find(filter)
    .sort(sort || "-createdAt")
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(filter);

  res.json({
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});
```

### Router-Level Middleware

```javascript
// src/routes/orders.js
const router = require("express").Router();
const { authenticate } = require("../middleware/auth");

// All routes in this router require authentication
router.use(authenticate);

router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/", createOrder);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
```

Using `router.use(authenticate)` applies the middleware to every route in the router. This is cleaner than adding `authenticate` to every individual route.

## Error Handling

Error handling is not optional. Every Express application needs a consistent strategy for catching, logging, and returning errors.

### The Error Handler Middleware

```javascript
// src/middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  // Log the full error for debugging
  console.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    userId: req.user?.id
  });

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({ errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: `${field} already exists`
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Default to 500
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message
  });
}

module.exports = errorHandler;
```

The error handler must have exactly four parameters: `(err, req, res, next)`. Express uses the presence of the error parameter to distinguish error handlers from regular middleware.

### Custom Application Errors

```javascript
// src/errors/ApplicationError.js
class ApplicationError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = "ApplicationError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`, 404);
  }
}

class ValidationError extends ApplicationError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends ApplicationError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

// Usage in service layer
async function getUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User", userId);
  }
  return user;
}
```

### Async Error Handling

Wrap async route handlers to catch errors automatically:

```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
router.get("/:id", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError("User", req.params.id);
  res.json(user);
}));
```

Without this wrapper, an unhandled promise rejection in an async route handler would crash the process. The wrapper catches the rejection and passes it to the error handler.

## Building a REST API

Let us build a complete REST API for a task management application. This brings together routing, middleware, error handling, and data validation.

Before writing any code, plan your API design. What resources do you need? What operations can be performed on each resource? What data does each resource contain? What are the relationships between resources? Answering these questions before writing code prevents design changes that require rewriting large sections.

For a task management application, the primary resources are Users and Tasks. A User has a name, email, password, and role. A Task has a title, description, status, priority, assignee, due date, and tags. The relationship is that a User is assigned to many Tasks, and each Task has one assignee.

The API endpoints follow REST conventions. Users have standard CRUD endpoints (GET, POST, PUT, DELETE). Tasks have the same standard endpoints, plus filtering by status, priority, and assignee. Authentication is required for all endpoints except registration and login. Authorization ensures that users can only modify their own tasks (unless they are admins).

Before writing the service layer, plan the error handling strategy. What errors can occur? How should they be reported to the client? The most common errors are validation errors (invalid input), not found errors (resource does not exist), authentication errors (invalid or missing credentials), and authorization errors (insufficient permissions). Each error type should have a consistent HTTP status code and response format.

### Data Models

```javascript
// src/models/Task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, "Description cannot exceed 2000 characters"]
  },
  status: {
    type: String,
    enum: ["todo", "in-progress", "done"],
    default: "todo"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  dueDate: Date,
  tags: [String]
}, {
  timestamps: true
});

// Index for common queries
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
```

### Service Layer

```javascript
// src/services/taskService.js
const Task = require("../models/Task");
const { NotFoundError, ValidationError } = require("../errors/ApplicationError");

class TaskService {
  async listTasks(filters = {}, options = {}) {
    const { assignee, status, priority, search } = filters;
    const { page = 1, limit = 20, sort = "-createdAt" } = options;

    const query = {};
    if (assignee) query.assignee = assignee;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const [tasks, total] = await Promise.all([
      Task.find(query).sort(sort).skip(skip).limit(limit).populate("assignee", "name email"),
      Task.countDocuments(query)
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getTask(taskId) {
    const task = await Task.findById(taskId).populate("assignee", "name email");
    if (!task) throw new NotFoundError("Task", taskId);
    return task;
  }

  async createTask(data) {
    const task = await Task.create(data);
    return task.populate("assignee", "name email");
  }

  async updateTask(taskId, data, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new NotFoundError("Task", taskId);

    // Only assignee or admin can update
    if (task.assignee.toString() !== userId && !data.isAdmin) {
      throw new ValidationError("You can only update your own tasks");
    }

    Object.assign(task, data);
    await task.save();
    return task.populate("assignee", "name email");
  }

  async deleteTask(taskId) {
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) throw new NotFoundError("Task", taskId);
    return task;
  }
}

module.exports = new TaskService();
```

### Route Handlers

```javascript
// src/routes/tasks.js
const router = require("express").Router();
const taskService = require("../services/taskService");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createTaskSchema, updateTaskSchema } = require("../schemas/taskSchemas");
const asyncHandler = require("../utils/asyncHandler");

router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const { status, priority, search, page, limit, sort } = req.query;
  const result = await taskService.listTasks(
    { assignee: req.user.id, status, priority, search },
    { page: parseInt(page), limit: parseInt(limit), sort }
  );
  res.json(result);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.params.id);
  res.json(task);
}));

router.post("/", validate(createTaskSchema), asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    ...req.body,
    assignee: req.user.id
  });
  res.status(201).json(task);
}));

router.put("/:id", validate(updateTaskSchema), asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.id,
    req.body,
    req.user.id
  );
  res.json(task);
}));

router.delete("/:id", authorize("admin"), asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id);
  res.status(204).send();
}));

module.exports = router;
```

### Request Validation Schemas

```javascript
// src/schemas/taskSchemas.js
const Joi = require("joi");

const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).allow("", null),
  status: Joi.string().valid("todo", "in-progress", "done").default("todo"),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
  dueDate: Joi.date().iso().greater("now"),
  tags: Joi.array().items(Joi.string().max(30)).max(5)
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().max(2000).allow("", null),
  status: Joi.string().valid("todo", "in-progress", "done"),
  priority: Joi.string().valid("low", "medium", "high"),
  dueDate: Joi.date().iso().allow(null),
  tags: Joi.array().items(Joi.string().max(30)).max(5)
}).min(1);

module.exports = { createTaskSchema, updateTaskSchema };
```

### Environment Configuration

```javascript
// src/config.js
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/taskmanager",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development"
};
```

## Testing Express Applications

Testing is not optional. Every route, every middleware, every error handler needs tests.

### Unit Testing Middleware

```javascript
// tests/middleware/auth.test.js
const { authenticate } = require("../../src/middleware/auth");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/User");

jest.mock("../../src/models/User");

describe("authenticate middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it("should return 401 when no token is provided", async () => {
    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No token provided" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid", async () => {
    req.headers.authorization = "Bearer invalidtoken";

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next and attach user when token is valid", async () => {
    const token = jwt.sign({ userId: "123" }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "123", name: "Test User" })
    });

    await authenticate(req, res, next);

    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});
```

## Assessment

### Lab Task: Build a REST API

**Time Limit: 60 minutes**

Build a REST API for a simple bookmark management application. The API should support:

1. **User Authentication:** Registration and login with JWT tokens.
2. **CRUD Operations:** Create, read, update, and delete bookmarks.
3. **Filtering:** Filter bookmarks by tag and search by title.
4. **Pagination:** Paginate results with page and limit query parameters.
5. **Error Handling:** Proper error responses for all failure cases.

**Required Endpoints:**
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and receive a JWT
- `GET /api/bookmarks`: List bookmarks (with filtering and pagination)
- `POST /api/bookmarks`: Create a bookmark
- `PUT /api/bookmarks/:id`: Update a bookmark (owner only)
- `DELETE /api/bookmarks/:id`: Delete a bookmark (owner only)

**Requirements:**
- Use Express Router for modular route organization
- Implement a service layer for business logic
- Use middleware for authentication and authorization
- Validate all request bodies with Joi
- Handle errors with a global error handler
- Include at least 5 unit tests for middleware or services

### Grading Criteria

- **Project Structure (15 points):** Clean separation of routes, controllers/services, middleware, and models.
- **Authentication (25 points):** Working registration and login with password hashing and JWT.
- **CRUD Operations (25 points):** All endpoints functional with proper HTTP status codes.
- **Error Handling (15 points):** Global error handler, validation errors, 404 handling.
- **Testing (10 points):** At least 5 passing tests covering middleware or service logic.
- **Code Quality (10 points):** Consistent naming, no hardcoded values, environment variables for configuration.

### Evidence

After completing this module, you should be able to:

1. Set up a Node.js project with proper directory structure and configuration.
2. Configure Express with security, CORS, logging, and body parsing middleware.
3. Write custom middleware for authentication, authorization, and validation.
4. Organize routes using Express Router with middleware chains.
5. Implement a global error handler that covers Mongoose, JWT, and application errors.
6. Build a complete REST API with a service layer and proper data flow.
7. Write unit tests for Express middleware and services.
