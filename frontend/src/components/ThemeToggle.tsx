"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="p-2 rounded-lg hover:bg-white/5 dark:hover:bg-slate-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={18} className="text-slate-400" /> : <Moon size={18} className="text-slate-400" />}
    </button>
  );
}
