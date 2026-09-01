# Module 7 — Testing

Testing is the practice of verifying that your code works as expected. Without tests, every change is a gamble. With tests, every change is a verified improvement. This module covers unit tests with Jest, component tests with React Testing Library, integration tests, and how to build a test suite that actually catches bugs.

## Why Testing Matters

Tests are not a waste of time. They are an investment that pays off every time you make a change. Without tests, you refactor by hand-testing every page and endpoint. With tests, you refactor by running a command and fixing whatever breaks.

The goal of testing is not 100% code coverage. The goal is confidence. If you have tests that cover the critical paths in your application — authentication, payment processing, data validation — you can make changes knowing that if something breaks, the tests will tell you.

There are three levels of testing that every full-stack application needs. Unit tests verify that individual functions and components work correctly in isolation. They are fast, cheap to write, and catch most logic errors. Integration tests verify that multiple components work together correctly — that your Express middleware chain handles authentication, that your React component renders data from an API, that your database queries return the expected results. End-to-end tests verify that complete user flows work from start to finish — that a user can register, log in, add items to a cart, and complete a purchase.

The testing pyramid describes the ideal distribution: many unit tests at the base, fewer integration tests in the middle, and a few end-to-end tests at the top. Unit tests are cheap and fast, so write many of them. Integration tests are more expensive but catch more bugs, so write a moderate number. End-to-end tests are expensive and fragile, so write only for the most critical user flows.

A common mistake is writing tests that pass regardless of the code quality. Tests that always pass are worse than no tests because they give false confidence. Good tests fail when the code is broken and pass when the code is correct. To write good tests, you need to understand both the code you are testing and the test framework you are using.

Another common mistake is testing implementation details rather than behavior. If you test that a React component calls `setState` with a specific value, your test breaks when you refactor the component to use `useReducer`. If you test that clicking a button updates the displayed text, your test still works regardless of how the component is implemented. Test behavior, not implementation.

## Jest Fundamentals

Jest is a testing framework that provides a test runner, assertion library, mocking, and coverage reporting out of the box.

### Writing Your First Test

```javascript
// src/utils/math.js
function add(a, b) {
  return a + b;
}

function divide(a, b) {
  if (b === 0) throw new Error("Cannot divide by zero");
  return a / b;
}

module.exports = { add, divide };

// tests/utils/math.test.js
const { add, divide } = require("../../src/utils/math");

describe("math utilities", () => {
  describe("add", () => {
    it("should add two positive numbers", () => {
      expect(add(2, 3)).toBe(5);
    });

    it("should add negative numbers", () => {
      expect(add(-1, -3)).toBe(-4);
    });

    it("should add zero", () => {
      expect(add(5, 0)).toBe(5);
    });
  });

  describe("divide", () => {
    it("should divide two numbers", () => {
      expect(divide(10, 2)).toBe(5);
    });

    it("should throw when dividing by zero", () => {
      expect(() => divide(10, 0)).toThrow("Cannot divide by zero");
    });
  });
});
```

### Matchers

Jest provides matchers for different types of assertions:

```javascript
// Equality
expect(value).toBe(42);           // Strict equality (===)
expect(value).toEqual({ a: 1 });  // Deep equality
expect(value).not.toBe(42);       // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThanOrEqual(10);
expect(value).toBeCloseTo(3.14, 2); // 2 decimal places

// Strings
expect(message).toMatch(/hello/i);
expect(message).toContain("world");

// Arrays
expect(list).toContain(42);
expect(list).toHaveLength(3);

// Objects
expect(user).toHaveProperty("name", "Alice");
expect(user).toEqual(
  expect.objectContaining({
    name: "Alice",
    role: "admin"
  })
);

// Exceptions
expect(() => riskyFunction()).toThrow(Error);
expect(() => riskyFunction()).toThrow("specific message");

// Async
await expect(asyncFn()).resolves.toBe(42);
await expect(asyncFn()).rejects.toThrow("error");
```

### Async Testing

```javascript
// src/services/userService.js
async function createUser(data) {
  if (!data.email) throw new Error("Email is required");
  if (!data.name) throw new Error("Name is required");

  const existing = await User.findOne({ email: data.email });
  if (existing) throw new Error("Email already in use");

  const hashedPassword = await bcrypt.hash(data.password, 12);
  return User.create({ ...data, password: hashedPassword });
}

// tests/services/userService.test.js
describe("createUser", () => {
  it("should create a user with valid data", async () => {
    const userData = {
      email: "alice@example.com",
      name: "Alice",
      password: "password123"
    };

    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ id: "123", ...userData });

    const user = await createUser(userData);

    expect(user.id).toBe("123");
    expect(User.create).toHaveBeenCalled();
  });

  it("should throw if email is missing", async () => {
    await expect(createUser({ name: "Alice", password: "pass" }))
      .rejects.toThrow("Email is required");
  });

  it("should throw if email already exists", async () => {
    User.findOne.mockResolvedValue({ id: "existing" });

    await expect(createUser({
      email: "taken@example.com",
      name: "Alice",
      password: "pass"
    })).rejects.toThrow("Email already in use");
  });
});
```

### Mocking

Mocking replaces real dependencies with controlled substitutes:

```javascript
// Mock an entire module
jest.mock("../../src/models/User");
const User = require("../../src/models/User");

// Mock specific methods
User.findById.mockReturnValue({
  select: jest.fn().mockResolvedValue({ _id: "123", name: "Alice" })
});

// Mock a module factory
jest.mock("../../src/services/emailService", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordReset: jest.fn().mockResolvedValue(true)
}));

// Spy on a method
const spy = jest.spyOn(console, "log");
expect(spy).toHaveBeenCalledWith("expected message");
spy.mockRestore();
```

Mocking is necessary when your code depends on external services, databases, or APIs. Without mocking, your tests would need a running database, a network connection, and a third-party API key. This makes tests slow, unreliable, and dependent on external services.

There are three types of mocks in Jest. A mock function (`jest.fn()`) replaces a function with a test implementation that records calls and returns configured values. A mock module (`jest.mock()`) replaces an entire module with a test implementation. A spy (`jest.spyOn()`) wraps an existing function to record calls while preserving the original behavior.

Use mocks sparingly. Mocks make your tests less realistic — they test the interaction between your code and the mock, not the interaction between your code and the real dependency. If you mock everything, your tests pass but your application might still be broken. Mock only what you need to mock (external services, slow operations, non-deterministic behavior) and let everything else run for real.

### Test Setup and Teardown

```javascript
describe("database operations", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
  });

  it("should create and retrieve a user", async () => {
    const user = await User.create({
      email: "test@example.com",
      name: "Test"
    });

    const found = await User.findById(user._id);
    expect(found.email).toBe("test@example.com");
  });
});
```

## React Testing Library

React Testing Library tests your components the way users interact with them — by finding elements, clicking buttons, and reading text. It does not test implementation details like state or hooks. This philosophy makes your tests more robust: they continue to work even when you refactor the component's internal structure.

The library provides queries that mimic how users and assistive technology find elements on the screen. Use `getByRole` for buttons, links, and headings. Use `getByLabelText` for form fields. Use `getByText` for text content. Use `getByTestId` only as a last resort when no other query works. The priority order matters because queries that match how users find elements are more resilient to change.

When a query cannot find the element you are looking for, React Testing Library throws an error that includes the entire accessible name of every element on the screen. This makes debugging much easier — you can see exactly what the component rendered and figure out why your query did not match.

Avoid these common mistakes when writing component tests. Do not test that a component renders specific HTML tags — test that it displays the expected content. Do not test internal state — test the visible output. Do not use `waitFor` to wait for state updates — use `findBy` queries that automatically wait. Do not use `act` directly — React Testing Library handles it internally.

### Basic Component Test

```jsx
// components/Counter.jsx
function Counter({ initialCount = 0 }) {
  const [count, setCount] = React.useState(initialCount);

  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// tests/components/Counter.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import Counter from "../../components/Counter";

describe("Counter", () => {
  it("should display initial count", () => {
    render(<Counter initialCount={5} />);
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 5");
  });

  it("should increment count", () => {
    render(<Counter />);
    
    fireEvent.click(screen.getByText("Increment"));
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 1");
    
    fireEvent.click(screen.getByText("Increment"));
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 2");
  });

  it("should decrement count", () => {
    render(<Counter initialCount={5} />);
    
    fireEvent.click(screen.getByText("Decrement"));
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 4");
  });

  it("should reset count to zero", () => {
    render(<Counter initialCount={10} />);
    
    fireEvent.click(screen.getByText("Reset"));
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 0");
  });
});
```

### Testing Forms

```jsx
// components/LoginForm.jsx
function LoginForm({ onSubmit }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div role="alert" className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}

// tests/components/LoginForm.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../../components/LoginForm";

describe("LoginForm", () => {
  it("should show error when fields are empty", async () => {
    render(<LoginForm onSubmit={jest.fn()} />);
    
    fireEvent.click(screen.getByText("Login"));
    
    expect(await screen.findByRole("alert"))
      .toHaveTextContent("All fields are required");
  });

  it("should call onSubmit with email and password", async () => {
    const onSubmit = jest.fn().mockResolvedValue({});
    render(<LoginForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByLabelText("Email"), "alice@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    fireEvent.click(screen.getByText("Login"));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("alice@example.com", "password123");
    });
  });

  it("should display error when onSubmit fails", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Invalid credentials"));
    render(<LoginForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByLabelText("Email"), "alice@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    fireEvent.click(screen.getByText("Login"));
    
    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Invalid credentials");
  });
});
```

### Testing Async Components

```jsx
// components/UserList.jsx
function UserList() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetch("/api/users")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div role="status">Loading users...</div>;
  if (error) return <div role="alert">Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// tests/components/UserList.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import UserList from "../../components/UserList";

const server = setupServer(
  rest.get("/api/users", (req, res, ctx) => {
    return res(ctx.json([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("UserList", () => {
  it("should show loading state", () => {
    render(<UserList />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading users...");
  });

  it("should display users after loading", async () => {
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("should display error on failure", async () => {
    server.use(
      rest.get("/api/users", (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByRole("alert"))
        .toHaveTextContent("Error: Failed to fetch");
    });
  });
});
```

## Integration Tests

Integration tests verify that multiple components work together correctly. They test the actual data flow through your application.

The key difference between unit tests and integration tests is scope. A unit test verifies that a single function works correctly in isolation. An integration test verifies that multiple functions, modules, or services work together correctly. Unit tests are fast (milliseconds) and reliable (they do not depend on external services). Integration tests are slower (seconds) and less reliable (they depend on databases, APIs, and other services).

Integration tests catch bugs that unit tests miss. A unit test might verify that your authentication middleware correctly validates a token. An integration test verifies that the middleware correctly integrates with the route handler, the database query, and the response formatter. The middleware might work correctly in isolation but fail when connected to the rest of the application because of a missing database column, a misconfigured middleware chain, or a response format mismatch.

The cost of integration tests is that they require infrastructure. You need a test database, a test cache, and possibly a test API server. This infrastructure can be set up manually, with Docker, or with cloud services. The most common approach is to use Docker Compose to start the required services, run the tests, and then stop the services.

Integration tests should be deterministic. If you run the same test twice, it should produce the same result. This means cleaning up the database before each test, using fixed data instead of random data, and avoiding tests that depend on external time or network conditions. Non-deterministic tests are worse than no tests because they erode trust in the test suite.

### API Integration Tests

```javascript
// tests/api/users.test.js
const request = require("supertest");
const app = require("../../src/app");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("User API", () => {
  let authToken;

  beforeEach(async () => {
    await prisma.user.deleteMany();
    
    // Create test user
    const hashedPassword = await bcrypt.hash("password123", 12);
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        role: "USER"
      }
    });

    // Login to get token
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    authToken = response.body.accessToken;
  });

  it("should get user profile", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.email).toBe("test@example.com");
    expect(response.body.name).toBe("Test User");
  });

  it("should return 401 without token", async () => {
    await request(app)
      .get("/api/users/me")
      .expect(401);
  });

  it("should update user profile", async () => {
    const response = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Updated Name" })
      .expect(200);

    expect(response.body.name).toBe("Updated Name");
  });

  it("should validate input", async () => {
    const response = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ email: "not-an-email" })
      .expect(400);

    expect(response.body.errors).toBeDefined();
  });
});
```

### End-to-End Test Flow

```javascript
// tests/e2e/checkout.test.js
describe("Checkout Flow", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/auth/login").as("login");
    cy.intercept("POST", "/api/orders").as("createOrder");
    cy.intercept("GET", "/api/products").as("getProducts");
  });

  it("should complete a purchase", () => {
    // Login
    cy.visit("/login");
    cy.get("[data-testid=email]").type("buyer@example.com");
    cy.get("[data-testid=password]").type("password123");
    cy.get("[data-testid=login-btn]").click();
    cy.wait("@login");

    // Add product to cart
    cy.visit("/products");
    cy.wait("@getProducts");
    cy.get("[data-testid=product-card]").first().click();
    cy.get("[data-testid=add-to-cart]").click();

    // Checkout
    cy.visit("/checkout");
    cy.get("[data-testid=shipping-address]").type("123 Main St");
    cy.get("[data-testid=city]").type("New York");
    cy.get("[data-testid=zip]").type("10001");
    cy.get("[data-testid=place-order]").click();
    cy.wait("@createOrder");

    // Verify order confirmation
    cy.url().should("include", "/order-confirmation");
    cy.get("[data-testid=order-id]").should("exist");
  });
});
```

## Real Scenario: Testing a Checkout Flow

Here is a comprehensive test suite for an e-commerce checkout flow. This tests the backend API, frontend components, and the integration between them.

### Backend Tests

```javascript
// tests/api/checkout.test.js
const request = require("supertest");
const app = require("../../src/app");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

beforeAll(async () => {
  // Seed test data
  const password = await bcrypt.hash("password123", 12);
  const user = await prisma.user.create({
    data: {
      email: "buyer@example.com",
      name: "Test Buyer",
      password,
      role: "USER"
    }
  });

  const product = await prisma.product.create({
    data: {
      name: "Test Product",
      price: 29.99,
      stock: 10
    }
  });

  global.testUser = user;
  global.testProduct = product;
});

describe("Checkout API", () => {
  let authToken;

  beforeEach(async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "buyer@example.com", password: "password123" });
    authToken = response.body.accessToken;

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { userId: global.testUser.id }
    });
  });

  it("should add item to cart", async () => {
    const response = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        productId: global.testProduct.id,
        quantity: 2
      })
      .expect(201);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].quantity).toBe(2);
  });

  it("should calculate cart total correctly", async () => {
    await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ productId: global.testProduct.id, quantity: 3 });

    const response = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.total).toBeCloseTo(89.97, 2);
  });

  it("should create order from cart", async () => {
    // Add items to cart
    await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ productId: global.testProduct.id, quantity: 1 });

    // Create order
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        shippingAddress: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001"
        }
      })
      .expect(201);

    expect(response.body.status).toBe("pending");
    expect(response.body.items).toHaveLength(1);
  });

  it("should reject order with insufficient stock", async () => {
    await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ productId: global.testProduct.id, quantity: 100 });

    await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        shippingAddress: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001"
        }
      })
      .expect(400);
  });
});
```

### Frontend Component Tests

```jsx
// components/Checkout/CheckoutForm.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import CheckoutForm from "./CheckoutForm";

const server = setupServer(
  rest.post("/api/orders", (req, res, ctx) => {
    return res(ctx.json({
      id: "order-123",
      status: "pending",
      total: 59.98
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("CheckoutForm", () => {
  const defaultProps = {
    cart: {
      items: [{ id: "1", name: "Product 1", price: 29.99, quantity: 2 }],
      total: 59.98
    },
    onOrderComplete: jest.fn()
  };

  it("should display cart items and total", () => {
    render(<CheckoutForm {...defaultProps} />);
    
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("$59.98")).toBeInTheDocument();
  });

  it("should validate required fields", async () => {
    render(<CheckoutForm {...defaultProps} />);
    
    fireEvent.click(screen.getByText("Place Order"));
    
    expect(await screen.findByText("Street address is required"))
      .toBeInTheDocument();
  });

  it("should submit order with valid data", async () => {
    const onOrderComplete = jest.fn();
    render(<CheckoutForm {...defaultProps} onOrderComplete={onOrderComplete} />);
    
    fireEvent.change(screen.getByLabelText("Street Address"), {
      target: { value: "123 Main St" }
    });
    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "New York" }
    });
    fireEvent.change(screen.getByLabelText("ZIP Code"), {
      target: { value: "10001" }
    });
    
    fireEvent.click(screen.getByText("Place Order"));
    
    await waitFor(() => {
      expect(onOrderComplete).toHaveBeenCalledWith("order-123");
    });
  });

  it("should show error on order failure", async () => {
    server.use(
      rest.post("/api/orders", (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ error: "Insufficient stock" }));
      })
    );

    render(<CheckoutForm {...defaultProps} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText("Street Address"), {
      target: { value: "123 Main St" }
    });
    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "New York" }
    });
    fireEvent.change(screen.getByLabelText("ZIP Code"), {
      target: { value: "10001" }
    });
    
    fireEvent.click(screen.getByText("Place Order"));
    
    expect(await screen.findByText("Insufficient stock")).toBeInTheDocument();
  });
});
```

## Test Configuration

Jest configuration affects how tests run, what files are tested, and what the coverage report looks like. A good configuration ensures consistent behavior across different machines and CI environments.

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/index.js",
    "!src/**/*.test.{js,jsx}"
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleNameMapper: {
    "\\.(css|less|scss)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1"
  }
};
```

The `testEnvironment` setting determines how tests are executed. `jsdom` simulates a browser environment, which is necessary for React component tests. `node` runs tests in a plain Node.js environment, which is faster for backend tests. You can override the environment per file by adding a comment at the top: `/** @jest-environment node */`.

The `setupFilesAfterEnv` option runs a file before each test suite. Use it for global setup like extending Jest matchers, setting up test database connections, or configuring mock services. The setup file runs after the test framework is installed, so you have access to `describe`, `it`, `expect`, and other Jest globals.

The `coverageThreshold` option fails the test suite if code coverage falls below the specified thresholds. This prevents coverage from degrading over time. Set realistic thresholds based on your current coverage — if you currently have 50% coverage, setting the threshold to 90% will cause every test run to fail. Increase the threshold gradually as you add more tests.

The `moduleNameMapper` option maps module imports to alternative implementations. The CSS mapping prevents Jest from trying to parse CSS files. The path alias mapping allows you to use `@/components/Button` instead of relative paths like `../../components/Button`, which improves readability and makes refactoring easier.

## Assessment

### Lab Task: Build a Test Suite

**Time Limit: 60 minutes**

Write a comprehensive test suite for a user management module. The module includes:

- User registration with validation
- User login with JWT
- User profile update
- User list with filtering and pagination

**Requirements:**
- Write at least 10 unit tests for the service layer
- Write at least 5 component tests for the login and registration forms
- Write at least 3 integration tests for the API endpoints
- Mock external dependencies (database, email service)
- Test both success and error paths
- Achieve at least 70% code coverage

### Grading Criteria

- **Unit Tests (30 points):** Tests cover all service functions, test edge cases, use proper assertions.
- **Component Tests (25 points):** Tests use user-centric queries (getByRole, getByLabelText), test form submissions and error states.
- **Integration Tests (25 points):** Tests hit actual endpoints, verify response formats, test authentication flow.
- **Mocking (10 points):** External dependencies are properly mocked, mocks are cleaned up between tests.
- **Code Quality (10 points):** Tests are organized, readable, and follow naming conventions.

### Evidence

After completing this module, you should be able to:

1. Write unit tests for JavaScript functions using Jest.
2. Mock modules, functions, and database calls for isolated testing.
3. Test React components using React Testing Library with user-centric queries.
4. Write integration tests that verify API endpoints work correctly.
5. Set up test databases and seed data for integration testing.
6. Configure Jest for coverage reporting and code quality thresholds.
7. Debug failing tests and identify the root cause of test failures.
