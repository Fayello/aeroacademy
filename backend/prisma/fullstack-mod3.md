# Module 3 — React Fundamentals

React is a library for building user interfaces. It does not prescribe how you structure your application, manage state, or handle routing. This freedom is powerful but means you need to understand the core concepts deeply before making architectural decisions. This module covers components, JSX, hooks, state management, and how to put them together to build a real dashboard application.

## Why React

React's core idea is simple: build your UI from small, reusable pieces called components. Each component is a JavaScript function that takes data (props) and returns a description of what should appear on screen (JSX). When data changes, React figures out the most efficient way to update the DOM.

This declarative model means you do not manually manipulate the DOM. You describe what the UI should look like for a given state, and React handles the updates. This eliminates entire categories of bugs related to keeping the DOM in sync with your data.

React's component model encourages a specific way of thinking about UI development. Instead of building a page as one large HTML document with scattered JavaScript, you break the interface into small, self-contained components. Each component owns its own state, defines its own rendering logic, and handles its own events. Components are composed together like building blocks — a button is a component, a form is a component composed of inputs and buttons, a page is a component composed of forms and other components.

The virtual DOM is the mechanism that makes React efficient. When state changes, React does not immediately update the real DOM. Instead, it creates a virtual representation of the DOM in memory, computes the minimal set of changes needed, and then applies those changes to the real DOM in a single batch. This avoids expensive DOM manipulations and ensures that the browser only re-renders what actually changed.

React's ecosystem is vast. React Router handles navigation. Redux, Zustand, and Jotai handle state management. React Query and SWR handle server state. Material UI, Chakra UI, and Tailwind CSS handle styling. This ecosystem is both a strength and a challenge — you have many options, and choosing the right ones requires understanding the trade-offs of each library.

The learning curve for React is steeper than it appears. The basics — components, props, state — can be learned in a few hours. But mastering hooks, understanding the rendering lifecycle, optimizing performance, and managing complex state patterns takes weeks of practice. The investment is worth it: React is the most popular frontend framework, and the skills transfer to React Native for mobile development.

## Components and JSX

### What JSX Actually Is

JSX is not HTML. It is a syntax extension for JavaScript that gets compiled to function calls. When you write:

```jsx
const element = <h1 className="title">Hello, {name}</h1>;
```

Babel compiles it to:

```javascript
const element = React.createElement("h1", { className: "title" }, "Hello, ", name);
```

Every JSX expression becomes a `React.createElement` call. This means you can use any JavaScript expression inside JSX by wrapping it in curly braces:

```jsx
function UserCard({ user }) {
  return (
    <div className="user-card">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <span className={`role role--${user.role}`}>
        {user.role.toUpperCase()}
      </span>
      {user.posts.length > 0 && (
        <p>Latest post: {user.posts[0].title}</p>
      )}
    </div>
  );
}
```

Conditional rendering uses JavaScript expressions, not template directives. The `&&` operator works for simple conditions. For multiple branches, use ternary operators or early returns. The key insight is that JSX is just JavaScript — any expression that evaluates to a value can appear inside curly braces, and any expression that evaluates to null, undefined, or false renders nothing.

Understanding JSX compilation helps you debug rendering issues. When you see a blank page, the problem is usually that a JSX expression evaluates to null or undefined. When you see an unexpected element, the problem is usually a conditional expression that evaluates differently than expected. When you see a React key warning, the problem is that you are rendering a list without unique keys.

### Functional Components

Every React component is a function that returns JSX. The function receives one argument: `props`.

```jsx
function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className={todo.completed ? "completed" : ""}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.title}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
}
```

Props are read-only. A component must never modify its own props. If you need to change data, pass a callback function to the parent and let it handle the update.

### Component Composition

Build complex UIs by composing small components:

```jsx
function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return <p className="empty">No todos yet. Add one above!</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function TodoApp() {
  const [todos, setTodos] = React.useState([]);

  const addTodo = (title) => {
    setTodos(prev => [...prev, {
      id: Date.now(),
      title,
      completed: false
    }]);
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return (
    <div className="todo-app">
      <h1>Todo List</h1>
      <TodoForm onAdd={addTodo} />
      <TodoList
        todos={todos}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
    </div>
  );
}
```

Notice how data flows down (props) and events flow up (callbacks). This is the one-way data flow that makes React predictable.

## Hooks

Hooks are functions that let you use state and other React features in functional components. They replaced class components as the standard way to write React.

### useState: Managing State

```jsx
function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(prev => prev - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

The setter function from `useState` can receive either a new value or a function that receives the previous state. The function form is required when the new state depends on the previous state:

```jsx
// Wrong — uses stale count
setCount(count + 1);
setCount(count + 1); // Still only adds 1, not 2

// Correct — uses functional update
setCount(prev => prev + 1);
setCount(prev => prev + 1); // Adds 2
```

### useState with Objects

When managing complex state, spread the previous state to avoid mutating it:

```jsx
function UserForm() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    preferences: { theme: "light", notifications: true }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleNotifications = () => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: !prev.preferences.notifications
      }
    }));
  };

  return (
    <form>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Name"
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      <label>
        <input
          type="checkbox"
          checked={formData.preferences.notifications}
          onChange={toggleNotifications}
        />
        Enable notifications
      </label>
    </form>
  );
}
```

### useEffect: Side Effects

`useEffect` lets you perform side effects in functional components: data fetching, subscriptions, DOM manipulation.

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();

        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!user) return null;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

The cleanup function (the function returned by `useEffect`) runs before the effect runs again and when the component unmounts. The `cancelled` flag prevents state updates on unmounted components.

### useEffect Dependencies

The dependency array controls when the effect runs. Understanding dependency arrays is one of the hardest parts of React hooks, and getting it wrong is the most common source of bugs.

```jsx
// Runs after every render — usually wrong
useEffect(() => {
  console.log("Component rendered");
});

// Runs only on mount — empty dependency array
useEffect(() => {
  console.log("Component mounted");
  return () => console.log("Component unmounted");
}, []);

// Runs when userId changes
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// Runs when userId or options change
useEffect(() => {
  fetchUser(userId, options);
}, [userId, options]);
```

A common mistake is forgetting to include dependencies. The React docs call this the "exhaustive deps" rule. Every variable from the component scope that the effect uses should be in the dependency array. If you use `userId` inside the effect, `userId` must be in the dependency array. If you do not include it, the effect uses a stale value from the previous render.

Another common mistake is including too many dependencies, which causes the effect to run too often. If you include an object or array dependency, the effect runs on every render because the object reference changes every time. To fix this, memoize the dependency with `useMemo` or `useCallback`, or restructure the effect to avoid depending on the object.

The dependency array is not a performance optimization — it is a correctness mechanism. It tells React when the effect's inputs have changed so it can re-run the effect with the new inputs. Omitting the dependency array does not prevent the effect from running — it just means the effect always uses stale values.

### useRef: Persisting Values

`useRef` creates a mutable container that persists across renders but does not trigger re-renders when changed. The `current` property of the ref is initialized with the value you pass and can be updated without causing a re-render.

`useRef` has two primary use cases: storing values that need to persist across renders without triggering re-renders, and accessing DOM elements directly. For the first use case, refs are ideal for storing interval IDs, timeout IDs, previous values, and any mutable value that should not cause re-renders when updated. For the second use case, refs give you direct access to DOM elements for operations like focusing inputs, measuring dimensions, or integrating with third-party libraries.

The key difference between `useRef` and `useState` is that updating a ref does not cause a re-render. This makes refs perfect for values that change frequently (like animation frame IDs or scroll positions) where triggering a re-render on every change would be wasteful. It also makes refs unsuitable for values that should cause the UI to update when changed — for those, use `useState`.

```jsx
function Stopwatch() {
  const [time, setTime] = React.useState(0);
  const intervalRef = React.useRef(null);

  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setTime(prev => prev + 10);
    }, 10);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const reset = () => {
    stop();
    setTime(0);
  };

  React.useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div>
      <h1>{(time / 1000).toFixed(2)}s</h1>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

`useRef` is also used to access DOM elements directly:

```jsx
function AutoFocusInput() {
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} placeholder="Auto-focused" />;
}
```

### useContext: Sharing State

`useContext` lets you access context values without prop drilling:

```jsx
// contexts/ThemeContext.js
const ThemeContext = React.createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState("light");

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Using it in a component
function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={`header header--${theme}`}>
      <h1>My App</h1>
      <button onClick={toggleTheme}>
        Switch to {theme === "light" ? "dark" : "light"} mode
      </button>
    </header>
  );
}
```

Context is good for global values like theme, locale, or current user. It is not a state management solution for frequently changing data — every context update re-renders all consumers.

### useReducer: Complex State Logic

When state logic gets complex, `useReducer` can be clearer than multiple `useState` calls:

```jsx
const initialState = { items: [], loading: false, error: null };

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }]
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload)
      };
    case "CLEAR_CART":
      return initialState;
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { items: action.payload, loading: false, error: null };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

function ShoppingCart() {
  const [state, dispatch] = React.useReducer(cartReducer, initialState);

  const addItem = (product) => {
    dispatch({ type: "ADD_ITEM", payload: product });
  };

  const removeItem = (id) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
  };

  return (
    <div>
      <h2>Cart ({state.items.length} items)</h2>
      {state.items.map(item => (
        <div key={item.id}>
          {item.name} x{item.quantity}
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

## Custom Hooks

Custom hooks extract reusable stateful logic. A custom hook is just a function that uses other hooks. The naming convention is important: custom hooks must start with "use" so that React knows they follow the rules of hooks.

Custom hooks are the primary mechanism for code reuse in React. Instead of duplicating logic across multiple components, you extract it into a custom hook. The hook encapsulates the state management, side effects, and return values. Components that use the hook share the logic but maintain independent state.

A custom hook can be as simple as a single `useState` call or as complex as a multi-step data fetching flow with caching, retry logic, and error handling. The complexity does not matter — what matters is that the logic is reusable and the hook has a clear, single responsibility.

Common custom hooks include `useLocalStorage` (persist state to localStorage), `useDebounce` (debounce rapidly changing values), `useFetch` (handle data fetching with loading and error states), `useMediaQuery` (respond to viewport changes), `useClickOutside` (detect clicks outside an element), and `usePrevious` (access the previous value of a state variable).

The power of custom hooks is that they compose. A `useUserProfile` hook might use `useFetch` internally. A `useSearchResults` hook might use `useDebounce` and `useFetch`. This composition creates a hierarchy of abstractions, where each hook handles one concern and complex behavior is built from simple pieces.

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = React.useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// Usage
function Settings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  const [language, setLanguage] = useLocalStorage("language", "en");

  return (
    <div>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <select value={language} onChange={e => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="fr">French</option>
      </select>
    </div>
  );
}
```

Another useful custom hook:

```jsx
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in a search component
function SearchBar({ onSearch }) {
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## Real Scenario: Building a Dashboard

Let us build a dashboard that displays user metrics, recent activity, and a task list. This brings together components, hooks, state management, and data fetching.

### App Structure

```
src/
  components/
    Dashboard/
      Dashboard.jsx
      MetricCard.jsx
      ActivityFeed.jsx
      TaskList.jsx
    Layout/
      Sidebar.jsx
      Header.jsx
  hooks/
    useFetch.js
    useLocalStorage.js
  contexts/
    AuthContext.jsx
  App.jsx
  main.jsx
```

### Data Fetching Hook

```jsx
// hooks/useFetch.js
function useFetch(url, options = {}) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}
```

### Dashboard Component

```jsx
// components/Dashboard/Dashboard.jsx
function Dashboard() {
  const { data: metrics, loading: metricsLoading } = useFetch("/api/metrics");
  const { data: activity, loading: activityLoading } = useFetch("/api/activity?limit=10");
  const { data: tasks, loading: tasksLoading, error: tasksError } = useFetch("/api/tasks?status=todo");

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <section className="metrics-grid">
        <MetricCard
          title="Total Users"
          value={metrics?.totalUsers ?? 0}
          change={metrics?.userGrowth ?? 0}
          loading={metricsLoading}
        />
        <MetricCard
          title="Revenue"
          value={`$${(metrics?.revenue ?? 0).toLocaleString()}`}
          change={metrics?.revenueGrowth ?? 0}
          loading={metricsLoading}
        />
        <MetricCard
          title="Active Tasks"
          value={metrics?.activeTasks ?? 0}
          change={metrics?.taskCompletion ?? 0}
          loading={metricsLoading}
        />
      </section>

      <div className="dashboard-content">
        <section className="activity-section">
          <h2>Recent Activity</h2>
          <ActivityFeed
            items={activity ?? []}
            loading={activityLoading}
          />
        </section>

        <section className="tasks-section">
          <h2>Open Tasks</h2>
          <TaskList
            tasks={tasks ?? []}
            loading={tasksLoading}
            error={tasksError}
          />
        </section>
      </div>
    </div>
  );
}
```

### Metric Card Component

```jsx
// components/Dashboard/MetricCard.jsx
function MetricCard({ title, value, change, loading }) {
  if (loading) {
    return (
      <div className="metric-card metric-card--loading">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--value" />
      </div>
    );
  }

  const isPositive = change >= 0;

  return (
    <div className="metric-card">
      <h3 className="metric-card__title">{title}</h3>
      <p className="metric-card__value">{value}</p>
      <p className={`metric-card__change ${isPositive ? "positive" : "negative"}`}>
        {isPositive ? "+" : ""}{change}%
      </p>
    </div>
  );
}
```

### Task List with Optimistic Updates

```jsx
// components/Dashboard/TaskList.jsx
function TaskList({ tasks: initialTasks, loading, error }) {
  const [tasks, setTasks] = React.useState(initialTasks);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const updatedTask = { ...task, completed: !task.completed };

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? updatedTask : t
    ));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: updatedTask.completed })
      });
    } catch (err) {
      // Revert on failure
      setTasks(prev => prev.map(t =>
        t.id === taskId ? task : t
      ));
    }
  };

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (tasks.length === 0) return <p>No open tasks</p>;

  return (
    <ul className="task-list">
      {tasks.map(task => (
        <li key={task.id} className="task-item">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleComplete(task.id)}
          />
          <span className={task.completed ? "completed" : ""}>
            {task.title}
          </span>
          <span className={`priority priority--${task.priority}`}>
            {task.priority}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

### Auth Context

```jsx
// contexts/AuthContext.jsx
const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser(token).then(setUser).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const { token, user } = await response.json();
    localStorage.setItem("token", token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

## Assessment

### Lab Task: Build an Interactive Dashboard

**Time Limit: 60 minutes**

Build a dashboard application with the following features:

1. **Data Display:** Show at least 4 metric cards with different data types (numbers, percentages, currency).
2. **Filtering:** Add a filter that lets users filter a list of items by category.
3. **Pagination:** Implement client-side pagination for a list of at least 25 items.
4. **Form:** Create a form with at least 4 fields that validates input before submission.
5. **State Management:** Use context to share a theme setting across at least 3 components.

**Requirements:**
- Use functional components with hooks only (no class components)
- Implement at least one custom hook
- Handle loading and error states for all data fetching
- Use optimistic updates for at least one action
- Components must be properly composed (not one giant component)

### Grading Criteria

- **Component Architecture (25 points):** Components are small, focused, and composable. Proper separation of concerns.
- **Hooks Usage (25 points):** Correct use of useState, useEffect, useRef, useContext. Custom hook for reusable logic.
- **State Management (20 points):** State is lifted appropriately, context is used correctly, no unnecessary re-renders.
- **Data Fetching (15 points):** Proper loading/error handling, cleanup functions, abort controllers.
- **Code Quality (15 points):** Clean code, consistent naming, no prop drilling, proper key usage in lists.

### Evidence

After completing this module, you should be able to:

1. Build functional React components that compose together to form complex UIs.
2. Use useState, useEffect, useRef, and useContext correctly with proper dependency arrays.
3. Create custom hooks that extract reusable stateful logic.
4. Implement data fetching with loading states, error handling, and cleanup.
5. Build forms with controlled components and validation.
6. Use context for global state that does not change frequently.
7. Debug React components using the React DevTools and understanding of the rendering cycle.
