# Module 3 — React Fundamentals: Components, Hooks, and State Management

## What You'll Actually Do

Build React applications with real state management. You'll write components that handle their own data, share state cleanly, and use hooks for side effects. This isn't about memorizing the API — it's about understanding the mental model so you can debug when things go wrong.

---

## Component Structure

Components are functions that return JSX. Keep them small and focused. One component, one job.

```jsx
// src/components/CourseCard.jsx
export default function CourseCard({ course, onSelect }) {
  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <span className="badge">{course.level}</span>
      <button onClick={() => onSelect(course.id)}>View Details</button>
    </div>
  );
}
```

```jsx
// src/components/CourseList.jsx
import { useState, useEffect } from "react";
import CourseCard from "./CourseCard";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load courses");
        return res.json();
      })
      .then((data) => setCourses(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="course-grid">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

---

## Hooks That Actually Get Used

### useState — local component state

```jsx
function TodoInput({ onAdd }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a task..."
      />
      <button type="submit">Add</button>
    </form>
  );
}
```

### useEffect — side effects and cleanup

```jsx
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}
```

### useRef — persist values without re-rendering

```jsx
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current); // cleanup
  }, []);

  return (
    <div>
      <p>{(elapsed / 1000).toFixed(1)}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

---

## Lifting State Up

When two components need to share state, move the state to their closest common parent.

```jsx
function LabEnvironment() {
  const [selectedLab, setSelectedLab] = useState(null);
  const [output, setOutput] = useState("");

  return (
    <div className="lab-layout">
      <LabSelector
        selected={selectedLab}
        onSelect={setSelectedLab}
      />
      <LabWorkspace
        lab={selectedLab}
        onOutput={setOutput}
      />
      <OutputPanel output={output} />
    </div>
  );
}
```

---

## Custom Hooks — Extract Reusable Logic

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setData(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

// Usage — clean, reusable
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <ProfileCard user={user} />;
}
```

---

## Managing Complex State with useReducer

When state logic gets complicated, `useReducer` keeps it organized.

```jsx
const initialState = { items: [], filter: "all" };

function todoReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return { ...state, items: [...state.items, action.payload] };
    case "TOGGLE":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload
            ? { ...item, done: !item.done }
            : item
        ),
      };
    case "SET_FILTER":
      return { ...state, filter: action.payload };
    default:
      return state;
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  const filtered = state.items.filter((item) => {
    if (state.filter === "done") return item.done;
    if (state.filter === "active") return !item.done;
    return true;
  });

  return (
    <div>
      <TodoInput onAdd={(text) => dispatch({ type: "ADD", payload: { id: Date.now(), text, done: false } })} />
      <FilterBar filter={state.filter} onChange={(f) => dispatch({ type: "SET_FILTER", payload: f })} />
      <TodoList items={filtered} onToggle={(id) => dispatch({ type: "TOGGLE", payload: id })} />
    </div>
  );
}
```

---

## Assessment

**Lab Task: Build a Lab Dashboard (60 minutes)**

Build a React app with:

1. **LabList** — fetches labs from `/api/labs` and displays them as cards. Use the `useFetch` custom hook.
2. **LabDetail** — when a card is clicked, show its full details (title, description, instructions, difficulty). Use `useState` to toggle between list and detail views.
3. **ProgressTracker** — track which labs the user has completed (localStorage persistence). Use `useReducer` to manage completion state.
4. **FilterBar** — filter labs by difficulty level (all, beginner, intermediate, advanced). Filter state lifted to the parent component.
5. **Error boundary** — wrap the lab list in an error boundary component that shows a fallback UI.

**Deliverables:** React components in separate files. Custom hook in `hooks/` directory. Clean prop passing (no prop drilling deeper than 2 levels).

**Grading:**
- Components render correctly with data: 25%
- Custom hook works and cleans up: 25%
- Filter and state management work: 25%
- Code is organized, components are small: 25%

---

## Evidence

Save your component files. Take a screenshot of the running app showing the lab list, detail view, and filtering. Include the component tree (which components render which).
