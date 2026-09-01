# Module 1 — JavaScript Fundamentals

JavaScript is the language that powers the modern web, but most developers only scratch the surface of what it can do. This module takes you from "I know how to write functions" to "I understand exactly why my async code is behaving unexpectedly." We will dig into the mechanisms that make JavaScript unique — its scoping rules, its event loop, its asynchronous model — and by the end, you will be able to read any JavaScript codebase and predict exactly how it will execute.

## Why JavaScript Fundamentals Matter

Every bug you will ever debug in a full-stack application traces back to a misunderstanding of how JavaScript works at its core. A variable that is `undefined` when you expected a value, a function that runs before the line that declares it, a promise that resolves after you have already moved on — these are not quirks. They are predictable behaviors governed by rules you can learn.

The difference between a junior and a senior JavaScript developer is not the number of frameworks they know. It is the depth of their understanding of the language itself. When a React component re-renders unexpectedly, when an Express middleware does not catch an error, when a database callback fires at the wrong time — the answer is always in the fundamentals.

JavaScript is the most widely used programming language in the world. It runs in browsers, on servers, in mobile apps, in desktop applications, and even in embedded devices. This ubiquity means that the fundamentals apply everywhere. Understanding closures helps you write React hooks. Understanding the event loop helps you debug Express middleware. Understanding promises helps you write reliable database queries. The time you invest in learning the fundamentals pays dividends across every technology you will ever use.

The language has evolved significantly since its creation in 1995. Modern JavaScript (ES6+) introduced classes, arrow functions, template literals, destructuring, spread operators, modules, promises, async/await, and many other features that make the language more expressive and less error-prone. These features are not optional — they are the standard way JavaScript is written today. If you are still writing `var` and callback functions, you are making your code harder to read and more likely to contain bugs.

## Variables, Scope, and Hoisting

JavaScript has three ways to declare variables: `var`, `let`, and `const`. The differences between them are not aesthetic. They determine how your code behaves in ways that directly cause (or prevent) bugs.

### The Problem with var

`var` is function-scoped, not block-scoped. This means a variable declared inside an `if` block or a `for` loop leaks out into the enclosing function:

```javascript
function countOccurrences(items) {
  var counts = {};
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (counts[item]) {
      counts[item]++;
    } else {
      counts[item] = 1;
    }
  }
  console.log(i); // undefined? No — i is accessible here and equals items.length
  console.log(item); // also accessible — the last item value
  return counts;
}
```

In this code, `i` and `item` are accessible outside the loop because `var` ignores block boundaries. This is a common source of confusion, especially in loops with asynchronous callbacks.

### let and const: Block Scoping

`let` and `const` are block-scoped. A variable declared with `let` inside a loop exists only inside that loop iteration:

```javascript
function processQueue(tasks) {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    setTimeout(() => {
      console.log(`Processing task ${i}: ${task.name}`);
    }, 100 * i);
  }
  // i is not accessible here — ReferenceError
}
```

This is exactly why `let` was introduced. The `setTimeout` callback captures the correct value of `i` for each iteration because `let` creates a new binding for each loop cycle.

`const` works the same way as `let` for scoping, but it prevents reassignment. It does not make objects immutable:

```javascript
const config = { timeout: 5000 };
config.timeout = 10000; // This works — the object is mutable
config = {}; // TypeError — cannot reassign the binding
```

Use `const` by default. Switch to `let` only when you need to reassign. Never use `var` in new code.

### Hoisting

JavaScript moves declarations to the top of their scope during compilation, but leaves assignments in place. This is hoisting:

```javascript
function example() {
  console.log(name); // undefined — not ReferenceError
  var name = "Alice";
  console.log(name); // "Alice"
}
```

The `var name` declaration is hoisted to the top of the function scope, but the assignment `name = "Alice"` stays where it is. So between the first `console.log` and the assignment, `name` exists but has the value `undefined`.

`let` and `const` are also hoisted, but they are not initialized. Accessing them before declaration throws a `ReferenceError`:

```javascript
function example() {
  console.log(username); // ReferenceError: Cannot access 'username' before initialization
  let username = "Bob";
}
```

The period between the start of the scope and the declaration is called the "temporal dead zone" (TDZ). This is a feature, not a bug. It prevents you from using a variable before it has a meaningful value.

## Closures

A closure is a function that remembers the variables from the scope where it was created, even after that scope has finished executing. This is not an advanced concept — it is a core mechanism that you use every time you write a callback.

### How Closures Work

```javascript
function createCounter(initial) {
  let count = initial;
  return {
    increment() { return ++count; },
    decrement() { return --count; },
    getValue() { return count; }
  };
}

const counter = createCounter(0);
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.getValue()); // 2
```

When `createCounter` returns, its execution context is destroyed. But the returned methods still have access to `count` because they form closures over that variable. The `count` variable does not exist in the global scope — it exists in the closure's scope chain.

### Closures in Loops

The classic closure-in-a-loop problem happens when you use `var`:

```javascript
function createFunctions() {
  var functions = [];
  for (var i = 0; i < 3; i++) {
    functions.push(function() {
      return i;
    });
  }
  return functions;
}

const funcs = createFunctions();
console.log(funcs[0]()); // 3
console.log(funcs[1]()); // 3
console.log(funcs[2]()); // 3
```

All three functions return 3 because they all close over the same `i` variable, which is 3 after the loop finishes. With `let`, each function gets its own copy of `i`:

```javascript
function createFunctions() {
  const functions = [];
  for (let i = 0; i < 3; i++) {
    functions.push(function() {
      return i;
    });
  }
  return functions;
}

const funcs = createFunctions();
console.log(funcs[0]()); // 0
console.log(funcs[1]()); // 1
console.log(funcs[2]()); // 2
```

### Practical Closure: Data Encapsulation

Closures give you private state without classes:

```javascript
function createBankAccount(ownerName, initialBalance) {
  let balance = initialBalance;
  const transactions = [];

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Deposit must be positive");
      balance += amount;
      transactions.push({ type: "deposit", amount, date: new Date() });
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      transactions.push({ type: "withdrawal", amount, date: new Date() });
      return balance;
    },
    getBalance() {
      return balance;
    },
    getStatement() {
      return [...transactions];
    }
  };
}

const account = createBankAccount("Alice", 1000);
account.deposit(500);
account.withdraw(200);
console.log(account.getBalance()); // 1300
// account.balance is undefined — it is private
```

This pattern is the foundation for many JavaScript libraries and frameworks. React hooks use closures to maintain state. Express middleware uses closures to share configuration. Database drivers use closures to manage connection state.

## Promises and Asynchronous JavaScript

JavaScript is single-threaded. It cannot do two things at the same time. But it can start something, move on, and come back when the result is ready. This is the asynchronous model, and promises are how you manage it.

### The Callback Problem

Before promises, asynchronous code used callbacks:

```javascript
function fetchUserPosts(userId, callback) {
  fetchUser(userId, (error, user) => {
    if (error) return callback(error);
    fetchPosts(user.id, (error, posts) => {
      if (error) return callback(error);
      fetchComments(posts[0].id, (error, comments) => {
        if (error) return callback(error);
        callback(null, { user, posts: posts[0], comments });
      });
    });
  });
}
```

This is the "callback hell" — nested callbacks that make code hard to read, hard to debug, and hard to error-handle. Each level adds indentation and another error check.

### Promises

A promise is an object representing a value that does not exist yet. It can be in one of three states: pending, fulfilled, or rejected.

```javascript
function fetchUserPosts(userId) {
  return fetchUser(userId)
    .then(user => fetchPosts(user.id))
    .then(posts => fetchComments(posts[0].id))
    .then(comments => ({ user, posts: posts[0], comments }))
    .catch(error => {
      console.error("Failed to fetch data:", error);
      throw error;
    });
}
```

Each `.then()` returns a new promise, so you can chain them. The `.catch()` at the end handles any error from any step in the chain.

### Creating Promises

You create a promise with the `Promise` constructor:

```javascript
function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`Done after ${ms}ms`);
    }, ms);
  });
}

delay(1000).then(message => console.log(message));
```

The `resolve` function transitions the promise from pending to fulfilled. The `reject` function transitions it from pending to rejected. Once a promise is settled (fulfilled or rejected), it stays that way.

### Promise.all and Promise.allSettled

When you need to run multiple asynchronous operations in parallel:

```javascript
const userIds = [1, 2, 3, 4, 5];

// Wait for all — fails fast
Promise.all(userIds.map(id => fetchUser(id)))
  .then(users => console.log("All users:", users))
  .catch(error => console.error("One failed:", error));

// Wait for all — reports individual results
Promise.allSettled(userIds.map(id => fetchUser(id)))
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`User ${userIds[index]}:`, result.value);
      } else {
        console.error(`User ${userIds[index]} failed:`, result.reason);
      }
    });
  });
```

`Promise.all` rejects as soon as any promise rejects. `Promise.allSettled` waits for all promises to complete and tells you which ones succeeded and which ones failed.

## Async/Await

`async/await` is syntactic sugar over promises. It makes asynchronous code look synchronous:

```javascript
async function getUserDashboard(userId) {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchPosts(user.id);
    const comments = await fetchComments(posts[0].id);

    return {
      user,
      latestPost: posts[0],
      comments
    };
  } catch (error) {
    console.error("Dashboard fetch failed:", error);
    throw error;
  }
}
```

The `async` keyword before the function means it always returns a promise. The `await` keyword pauses execution until the promise resolves, then returns the resolved value.

### Sequential vs Parallel

A common mistake is writing sequential awaits when you could run things in parallel:

```javascript
// Slow — sequential
async function getDashboardSlow(userId) {
  const user = await fetchUser(userId);      // 200ms
  const posts = await fetchPosts(userId);    // 300ms
  const notifications = await fetchNotifications(userId); // 150ms
  return { user, posts, notifications };     // Total: 650ms
}

// Fast — parallel
async function getDashboardFast(userId) {
  const [user, posts, notifications] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchNotifications(userId)
  ]);
  return { user, posts, notifications };     // Total: 300ms
}
```

The sequential version waits for each request to complete before starting the next. The parallel version starts all three at once and waits for the slowest one. This is not a micro-optimization — it is a fundamental performance pattern.

### Error Handling Patterns

With `async/await`, you use try/catch. But you can also create utility functions to reduce boilerplate:

```javascript
function to(promise) {
  return promise
    .then(result => [null, result])
    .catch(error => [error, null]);
}

async function fetchUserData(userId) {
  const [error, user] = await to(fetchUser(userId));
  if (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }

  const [postsError, posts] = await to(fetchPosts(user.id));
  if (postsError) {
    console.error("Failed to fetch posts:", postsError);
    return { user, posts: [] };
  }

  return { user, posts };
}
```

This Go-style error handling pattern makes it easy to handle errors at each step without nested try/catch blocks.

## The Event Loop

JavaScript is single-threaded, but it can handle thousands of concurrent operations. This is possible because of the event loop — the mechanism that manages the execution of asynchronous code.

### How the Event Loop Works

When you run JavaScript code, the engine creates a call stack and a task queue (also called a macro-task queue). When you call `setTimeout`, `fetch`, or any other asynchronous API, the browser (or Node.js) handles it in the background and puts a callback function into the task queue when it is done. The event loop continuously checks: if the call stack is empty, take the first task from the queue and push it onto the call stack.

```javascript
console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

Promise.resolve().then(() => {
  console.log("3");
});

console.log("4");
```

Output: `1, 4, 3, 2`

Here is why:
1. `console.log("1")` runs synchronously — prints `1`
2. `setTimeout` schedules a callback in the macro-task queue — not executed yet
3. `Promise.resolve().then()` schedules a callback in the micro-task queue — not executed yet
4. `console.log("4")` runs synchronously — prints `4`
5. The call stack is now empty. The event loop processes micro-tasks first — prints `3`
6. Then it processes macro-tasks — prints `2`

### Micro-tasks vs Macro-tasks

Micro-tasks have higher priority than macro-tasks. Micro-tasks include promise callbacks (`.then`, `.catch`, `.finally`) and `queueMicrotask`. Macro-tasks include `setTimeout`, `setInterval`, `setImmediate` (Node.js), and I/O callbacks.

```javascript
setTimeout(() => console.log("setTimeout 1"), 0);
setTimeout(() => console.log("setTimeout 2"), 0);

Promise.resolve().then(() => console.log("promise 1"));
Promise.resolve().then(() => console.log("promise 2"));

queueMicrotask(() => console.log("microtask 1"));

console.log("sync");
```

Output: `sync, promise 1, promise 2, microtask 1, setTimeout 1, setTimeout 2`

All micro-tasks run before any macro-task. Within each category, tasks run in the order they were added.

### Practical Implications

The event loop model means that a long-running synchronous operation blocks everything:

```javascript
// This freezes the UI for 5 seconds
function expensiveComputation() {
  const start = Date.now();
  while (Date.now() - start < 5000) {
    // Busy wait — blocks the call stack
  }
  return "Done";
}

// This does NOT freeze the UI
async function nonBlockingComputation() {
  return new Promise(resolve => {
    // Offload to a Web Worker or break into chunks
    setTimeout(() => resolve("Done"), 5000);
  });
}
```

In Node.js, this matters even more because a blocked event loop means your server cannot handle any incoming requests. Always keep synchronous operations short, and use asynchronous APIs for anything that involves I/O.

## ES6+ Features You Will Use Daily

Modern JavaScript has features that make code shorter, clearer, and less error-prone. Here are the ones that matter most in full-stack development.

### Destructuring

Extract values from arrays and objects in a single line:

```javascript
// Object destructuring
const { name, email, role = "user" } = user;

// Array destructuring
const [first, second, ...rest] = items;

// Function parameter destructuring
function createOrder({ productId, quantity, shippingAddress }) {
  // Use productId, quantity, shippingAddress directly
}

// Nested destructuring
const { profile: { firstName, lastName } } = user;
```

### Spread and Rest

```javascript
// Spread — expand arrays/objects
const newUser = { ...existingUser, name: "Alice", role: "admin" };
const mergedArrays = [...array1, ...array2];

// Rest — collect remaining elements
function logFirst(first, ...others) {
  console.log("First:", first);
  console.log("Rest:", others);
}

// Rest in destructuring
const [head, ...tail] = [1, 2, 3, 4];
// head: 1, tail: [2, 3, 4]
```

### Template Literals

```javascript
const message = `Hello, ${user.name}! You have ${unreadCount} unread messages.`;

// Tagged templates — useful for SQL query builders
function sql(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i] !== undefined ? values[i] : "";
    return result + str + value;
  }, "");
}

const query = sql`SELECT * FROM users WHERE id = ${userId} AND status = ${status}`;
```

### Optional Chaining and Nullish Coalescing

```javascript
// Optional chaining — safely access nested properties
const street = user?.address?.street;
const firstItem = array?.[0]?.name;
const result = callback?.();

// Nullish coalescing — default values for null/undefined
const port = config.port ?? 3000;
// ?? only triggers for null/undefined, not for 0 or ""
const name = user.name ?? "Anonymous";
```

### Array Methods

```javascript
// map — transform each element
const names = users.map(user => user.name);

// filter — keep elements that pass a test
const activeUsers = users.filter(user => user.isActive);

// reduce — accumulate into a single value
const total = orders.reduce((sum, order) => sum + order.amount, 0);

// find — get first matching element
const admin = users.find(user => user.role === "admin");

// some/every — test conditions
const hasAdmin = users.some(user => user.role === "admin");
const allActive = users.every(user => user.isActive);

// flatMap — map then flatten one level
const allTags = posts.flatMap(post => post.tags);
```

### Object shorthand

```javascript
function createUser(name, email) {
  return { name, email, createdAt: new Date() };
  // Shorthand for { name: name, email: email, createdAt: new Date() }
}
```

## Real Scenario: Debugging Async Issues

Here is a real-world debugging scenario that combines everything in this module.

### The Bug

You have an Express endpoint that should fetch a user and their recent orders. Sometimes it works, sometimes it returns an empty orders array.

```javascript
app.get("/api/users/:id/orders", async (req, res) => {
  const user = await User.findById(req.params.id);
  let orders;

  Order.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .exec((err, results) => {
      orders = results;
    });

  res.json({ user, orders });
});
```

### The Diagnosis

There are two bugs here. First, the `Order.find()` call uses a callback but the code does not wait for it to complete. The `res.json()` runs immediately, before the database query finishes, so `orders` is always `undefined`.

Second, mixing async/await with callbacks is confusing. The function is `async` (so it can use `await`), but the database query uses a callback pattern.

### The Fix

```javascript
app.get("/api/users/:id/orders", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const orders = await Order.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ user, orders });
  } catch (error) {
    console.error("Failed to fetch user orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

The fix is straightforward: use `await` on the database query. Mongoose queries are thenables, so they work with `await`. This makes the code sequential — the function waits for the query to complete before sending the response.

### The Takeaway

The event loop is always running. When you forget to `await` an asynchronous operation, the code continues executing before the operation completes. This is not a bug in JavaScript — it is the intended behavior. Your job is to make sure you are waiting for the right things at the right time.

## Assessment

### Lab Task: Async Debugging Challenge

**Time Limit: 45 minutes**

You are given a Node.js application with three broken endpoints. Each endpoint has a bug related to async behavior, closures, or the event loop. Fix all three bugs.

**Endpoint 1: `/api/stats`**
The endpoint should calculate statistics for an array of numbers but returns `NaN` for the average.

```javascript
app.get("/api/stats", (req, res) => {
  const numbers = [10, 20, 30, 40, 50];
  let sum = 0;
  let average;

  numbers.forEach(num => {
    sum += num;
  });

  average = sum / numbers.length;
  res.json({ sum, average, count: numbers.length });
});
```

Identify the bug, explain why it fails, and fix it.

**Endpoint 2: `/api/countdown`**
The endpoint should return an array of countdown values but returns `[6, 6, 6, 6, 6]` instead of `[1, 2, 3, 4, 5]`.

```javascript
app.get("/api/countdown", (req, res) => {
  const results = [];
  for (var i = 1; i <= 5; i++) {
    setTimeout(() => {
      results.push(i);
    }, 100 * i);
  }
  setTimeout(() => {
    res.json(results);
  }, 1000);
});
```

Identify the bug, explain the event loop behavior, and fix it.

**Endpoint 3: `/api/user/:id`**
The endpoint should return a user and their posts but sometimes returns posts from the wrong user.

```javascript
app.get("/api/user/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  const posts = [];

  for (let i = 0; i < user.postIds.length; i++) {
    Post.findById(user.postIds[i]).then(post => {
      posts.push(post);
    });
  }

  // Wait a bit for all queries to finish
  setTimeout(() => {
    res.json({ user, posts });
  }, 500);
});
```

Identify the bug, explain why the timeout is unreliable, and fix it using `Promise.all`.

### Grading Criteria

- **Endpoint 1 (30 points):** Correctly identifies that the calculation itself is correct but explains when `NaN` could occur (e.g., empty array division) and provides a safe implementation.
- **Endpoint 2 (35 points):** Correctly identifies the `var` hoisting issue in the loop closure, explains how the event loop processes `setTimeout` callbacks, and provides a fix using `let` or a closure.
- **Endpoint 3 (35 points):** Correctly identifies that the `setTimeout` does not guarantee all queries have completed, explains the race condition, and provides a fix using `Promise.all` with `await`.

### Evidence

After completing this module, you should be able to:

1. Explain the difference between `var`, `let`, and `const` and when to use each.
2. Write a function that uses closures to encapsulate private state.
3. Convert callback-based code to promises and async/await.
4. Predict the output of any code involving the event loop, promises, and `setTimeout`.
5. Debug asynchronous code by tracing the flow through the call stack and task queues.
6. Use `Promise.all` and `Promise.allSettled` to manage parallel asynchronous operations.
7. Apply ES6+ features to write cleaner, more maintainable JavaScript code.
