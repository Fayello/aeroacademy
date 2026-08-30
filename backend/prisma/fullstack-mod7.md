# Module 7 — Testing: Jest, React Testing Library, and Integration Tests

## What You'll Actually Do

Write tests that catch real bugs, not just tests that pass. You'll unit-test utility functions, component-test React UIs, and integration-test API endpoints. The goal isn't 100% coverage — it's confidence that your code works.

---

## Setting Up Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!**/node_modules/**",
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterSetup: ["./tests/setup.js"],
};
```

```json
// package.json (relevant scripts)
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage"
  }
}
```

---

## Unit Testing Pure Functions

```javascript
// src/utils/gradeCalculator.js
function calculateGrade(scores) {
  if (!scores.length) return null;

  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;

  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  if (avg >= 60) return "D";
  return "F";
}

function calculateGPA(grades) {
  const points = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };
  if (!grades.length) return 0;
  const sum = grades.reduce((acc, g) => acc + (points[g] || 0), 0);
  return Math.round((sum / grades.length) * 100) / 100;
}

module.exports = { calculateGrade, calculateGPA };
```

```javascript
// tests/gradeCalculator.test.js
const { calculateGrade, calculateGrade } = require("../src/utils/gradeCalculator");

describe("calculateGrade", () => {
  test("returns A for scores 90 and above", () => {
    expect(calculateGrade([95, 92, 90])).toBe("A");
    expect(calculateGrade([100])).toBe("A");
  });

  test("returns B for scores 80-89", () => {
    expect(calculateGrade([85, 82, 80])).toBe("B");
  });

  test("returns C for scores 70-79", () => {
    expect(calculateGrade([75])).toBe("C");
  });

  test("returns D for scores 60-69", () => {
    expect(calculateGrade([65, 60])).toBe("D");
  });

  test("returns F for scores below 60", () => {
    expect(calculateGrade([50, 55])).toBe("F");
  });

  test("returns null for empty array", () => {
    expect(calculateGrade([])).toBeNull();
  });

  test("rounds to nearest grade", () => {
    expect(calculateGrade([89, 91])).toBe("B"); // avg 90 → A
  });
});

describe("calculateGPA", () => {
  test("calculates average GPA", () => {
    expect(calculateGPA(["A", "B", "C"])).toBeCloseTo(3.0);
  });

  test("returns 0 for empty array", () => {
    expect(calculateGPA([])).toBe(0);
  });

  test("handles all grades", () => {
    expect(calculateGPA(["A", "A", "A", "A"])).toBe(4.0);
    expect(calculateGPA(["F", "F"])).toBe(0.0);
  });
});
```

---

## Testing Async Code and API Calls

```javascript
// tests/api.test.js
const request = require("supertest");
const app = require("../src/app");

describe("Courses API", () => {
  let createdId;

  test("POST /api/courses creates a course", async () => {
    const res = await request(app)
      .post("/api/courses")
      .send({
        title: "Test Course",
        description: "A course for testing",
        difficulty: "beginner",
      })
      .expect(201);

    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.title).toBe("Test Course");
    createdId = res.body.data.id;
  });

  test("GET /api/courses lists courses", async () => {
    const res = await request(app)
      .get("/api/courses")
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  test("GET /api/courses/:id returns a course", async () => {
    const res = await request(app)
      .get(`/api/courses/${createdId}`)
      .expect(200);

    expect(res.body.data.id).toBe(createdId);
  });

  test("GET /api/courses/:id returns 404 for missing", async () => {
    await request(app)
      .get("/api/courses/nonexistent")
      .expect(404);
  });

  test("POST /api/courses validates input", async () => {
    const res = await request(app)
      .post("/api/courses")
      .send({ title: "" })
      .expect(400);

    expect(res.body.errors).toBeDefined();
  });

  test("DELETE /api/courses/:id removes a course", async () => {
    await request(app)
      .delete(`/api/courses/${createdId}`)
      .expect(204);

    await request(app)
      .get(`/api/courses/${createdId}`)
      .expect(404);
  });
});
```

---

## Testing Middleware

```javascript
// tests/auth.middleware.test.js
const jwt = require("jsonwebtoken");
const { authenticate, authorize } = require("../src/middleware/auth");

const mockReq = (token) => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
});
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe("authenticate middleware", () => {
  beforeEach(() => mockNext.mockClear());

  test("calls next with valid token", () => {
    const token = jwt.sign({ sub: "123" }, process.env.JWT_SECRET);
    authenticate(mockReq(token), mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test("returns 401 without token", () => {
    const res = mockRes();
    authenticate(mockReq(null), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("returns 401 with invalid token", () => {
    const res = mockRes();
    authenticate(mockReq("bad.token.here"), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("authorize middleware", () => {
  test("calls next if user has required role", () => {
    const req = { user: { role: "admin" } };
    authorize("admin")(req, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test("returns 403 if user lacks role", () => {
    const req = { user: { role: "student" } };
    const res = mockRes();
    authorize("admin")(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
```

---

## React Component Testing

```jsx
// tests/CourseCard.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import CourseCard from "../src/components/CourseCard";

const mockCourse = {
  id: "1",
  title: "JavaScript Fundamentals",
  description: "Learn JS from scratch",
  difficulty: "beginner",
};

test("renders course title and description", () => {
  render(<CourseCard course={mockCourse} />);

  expect(screen.getByText("JavaScript Fundamentals")).toBeInTheDocument();
  expect(screen.getByText("Learn JS from scratch")).toBeInTheDocument();
});

test("renders difficulty badge", () => {
  render(<CourseCard course={mockCourse} />);
  expect(screen.getByText("beginner")).toBeInTheDocument();
});

test("calls onSelect when button is clicked", () => {
  const handleSelect = jest.fn();
  render(<CourseCard course={mockCourse} onSelect={handleSelect} />);

  fireEvent.click(screen.getByText("View Details"));
  expect(handleSelect).toHaveBeenCalledWith("1");
});

test("does not call onSelect on other clicks", () => {
  const handleSelect = jest.fn();
  render(<CourseCard course={mockCourse} onSelect={handleSelect} />);

  fireEvent.click(screen.getByText("JavaScript Fundamentals"));
  expect(handleSelect).not.toHaveBeenCalled();
});
```

---

## Testing Custom Hooks

```jsx
// tests/useFetch.test.jsx
import { renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "../src/hooks/useFetch";

// Mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn();
});

test("returns loading state initially", () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  });

  const { result } = renderHook(() => useFetch("/api/test"));
  expect(result.current.loading).toBe(true);
  expect(result.current.data).toBeNull();
});

test("returns data after fetch completes", async () => {
  const mockData = { id: 1, name: "Test" };
  global.fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockData),
  });

  const { result } = renderHook(() => useFetch("/api/test"));

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data).toEqual(mockData);
  expect(result.current.error).toBeNull();
});

test("returns error on fetch failure", async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 500 });

  const { result } = renderHook(() => useFetch("/api/test"));

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.error).toBeDefined();
});
```

---

## Test Organization

```
tests/
  unit/
    gradeCalculator.test.js
    helpers.test.js
  integration/
    courses.api.test.js
    auth.api.test.js
  components/
    CourseCard.test.jsx
    LabList.test.jsx
  hooks/
    useFetch.test.jsx
  middleware/
    auth.test.js
  setup.js
```

---

## Assessment

**Lab Task: Comprehensive Test Suite (60 minutes)**

Write tests for a lab submission system:

1. **Unit tests (3+ tests):** Test a `validateSubmission(code, language)` function that checks code isn't empty, language is supported, and code length is under 10,000 characters.
2. **Integration tests (4+ tests):** Test `POST /api/submissions` endpoint: successful submission, validation errors, authentication required, duplicate prevention.
3. **Component tests (3+ tests):** Test a `SubmissionForm` component: renders form fields, disables submit while loading, shows validation errors.
4. **Mock external calls:** Mock any database or API calls in integration tests.
5. **Test organization:** Tests in a clean folder structure with a `setup.js` for shared configuration.

**Deliverables:** Complete test suite with unit, integration, and component tests. Jest config with coverage thresholds.

**Grading:**
- Tests are meaningful (catch real bugs): 30%
- Proper mocking of external dependencies: 25%
- Tests are well-organized and readable: 25%
- Coverage is reasonable (>80% for tested modules): 20%

---

## Evidence

Save your test files and jest config. Include the coverage report output. Note which tests were most useful and why.
