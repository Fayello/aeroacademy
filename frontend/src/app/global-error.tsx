"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="bg-[#0f172a] dark:bg-slate-950">
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white dark:text-white">Application Error</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
              A critical error occurred. Please try reloading the page.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#1d8a56] text-white text-sm font-medium transition-colors"
            >
              <RefreshCcw size={14} />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-white/10 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            >
              <Home size={14} />
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
