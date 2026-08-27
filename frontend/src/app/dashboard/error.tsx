"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white dark:text-white">Something went wrong</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
          An unexpected error occurred. Please try again or reload the page.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">Error: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#1d8a56] text-white text-sm font-medium transition-colors"
        >
          <RefreshCcw size={14} />
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-white/10 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
