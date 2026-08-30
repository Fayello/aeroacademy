# Module 1 — JavaScript Fundamentals: Closures, Promises, and Async/Await

## What You'll Actually Do

Write JavaScript that behaves predictably. You'll master the concepts that trip up most junior developers: how closures capture variables, how promises chain, and how async/await makes asynchronous code readable. These aren't academic exercises — they're the patterns you'll use daily in any Node.js or React codebase.

---

## Closures in Practice

A closure is a function that remembers the variables from its outer scope, even after that outer function has returned. This isn't a trick — it's how JavaScript scoping works.

```javascript
function createCounter(initial) {
  let count = initial;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}

const counter = createCounter(0);
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
// count is private — no way to access it from outside
```

**Why this matters:** Closures let you create private state without classes. React hooks use closures extensively — `useState`, `useEffect`, custom hooks all rely on this pattern.

### Practical closure: memoization

```javascript
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((n) => {
  console.log("computing...");
  return n * n;
});

expensiveCalc(4); // logs "computing..."
expensiveCalc(4); // returns cached result, no log
```

---

## Promises: Chaining and Error Handling

Promises represent a value that will resolve or reject in the future. The real power is in chaining and combining them.

```javascript
function fetchUser(id) {
  return fetch(`/api/users/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
}

function fetchUserPosts(user) {
  return fetch(`/api/users/${user.id}/posts`)
    .then((res) => res.json());
}

// Chaining: each .then receives the previous result
fetchUser(1)
  .then((user) => fetchUserPosts(user))
  .then((posts) => console.log(posts))
  .catch((err) => console.error("Failed:", err));
```

### Promise combinators

```javascript
// Run in parallel, wait for all
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
]);

// Race — first to resolve wins
const fastest = await Promise.race([
  fetchFromMirror1(),
  fetchFromMirror2(),
]);

// Settle — wait for all, regardless of outcome
const results = await Promise.allSettled([
  fetchUsers(),
  fetchMaybeFails(),
]);
// results[0] = { status: 'fulfilled', value: [...] }
// results[1] = { status: 'rejected', reason: Error }
```

---

## Async/Await: Write Async Code That Reads Like Sync

Async/await is syntactic sugar over promises. It makes error handling natural with try/catch.

```javascript
async function loadDashboard(userId) {
  try {
    const user = await fetchUser(userId);
    const [posts, notifications] = await Promise.all([
      fetchPosts(user.id),
      fetchNotifications(user.id),
    ]);

    return { user, posts, notifications };
  } catch (error) {
    console.error("Dashboard load failed:", error);
    throw error; // re-throw so caller can handle
  }
}
```

### Common mistake: sequential vs parallel

```javascript
// BAD — sequential, slow
async function getData() {
  const users = await fetchUsers();   // waits 200ms
  const posts = await fetchPosts();   // waits 200ms after users finishes
  // total: ~400ms
}

// GOOD — parallel, fast
async function getData() {
  const [users, posts] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
  ]);
  // total: ~200ms
}
```

### Error boundaries in async code

```javascript
async function processWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
}

// Usage
const data = await processWithRetry(() => fetch("/api/data"));
```

---

## Putting It Together: A Real Pattern

```javascript
// Closure + async/await: a rate limiter
function createRateLimiter(limit, windowMs) {
  const tokens = [];
  
  return async function throttled(fn) {
    const now = Date.now();
    // Remove expired tokens
    while (tokens.length && tokens[0] < now - windowMs) {
      tokens.shift();
    }

    if (tokens.length >= limit) {
      const wait = tokens[0] + windowMs - now;
      await new Promise((r) => setTimeout(r, wait));
    }

    tokens.push(Date.now());
    return fn();
  };
}

const apiLimiter = createRateLimiter(10, 60000); // 10 per minute
const data = await apiLimiter(() => fetch("/api/heavy-query"));
```

---

## Assessment

**Lab Task: Build an Async Task Runner (45 minutes)**

Build a module that manages a queue of async tasks with concurrency control:

1. Create a function `createTaskRunner(concurrency)` that returns an object with `add(taskFn)` and `drain()` methods.
2. `add()` enqueues an async function. No more than `concurrency` tasks run simultaneously.
3. `drain()` returns a promise that resolves when all queued tasks complete.
4. Each task receives a `taskId` (sequential integer) and a `release()` callback. The task calls `release()` when done.
5. Implement retry logic: failed tasks (tasks that throw) are retried up to 2 times with a 500ms delay between retries.

**Deliverables:** A single `task-runner.js` file exporting `createTaskRunner`. Include a brief test script (`test-runner.js`) that runs 10 mock tasks with concurrency 3 and logs execution order.

**Grading:**
- Concurrency limit respected: 30%
- `drain()` resolves only after all tasks complete: 25%
- Retry logic works correctly: 25%
- Code is clean, no race conditions: 20%

---

## Evidence

Save your `task-runner.js` and `test-runner.js` files. Take a screenshot of the test output showing concurrent execution respecting the limit. Note in a comment how closures were used to maintain the queue state.
