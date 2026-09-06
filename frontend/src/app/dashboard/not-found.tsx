"use client";

import Link from "next/link";
import { Shield, ArrowLeft, Home } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <Shield size={32} className="text-red-400" />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p className="text-sm text-slate-400">
          This page doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7AD62A] text-[#0F203A] rounded-xl font-medium hover:bg-[#6bc422] transition-colors"
        >
          <Home size={16} />
          Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={16} />
          Go back
        </button>
      </div>
    </div>
  );
}
