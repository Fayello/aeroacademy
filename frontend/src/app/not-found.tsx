"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, ArrowLeft, Home } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function NotFound() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <div className="flex h-screen bg-white/5 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <main className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-red-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">404</h1>
              <p className="text-slate-600 mb-6">
                This page doesn&apos;t exist or has been moved.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7AD62A] text-white rounded-xl font-medium hover:bg-[#1e8a56] transition-colors"
                >
                  <Home size={16} />
                  Dashboard
                </Link>
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 text-slate-700 rounded-xl font-medium hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Go back
                </button>
              </div>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F203A] via-[#1a2d47] to-[#0F203A] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
          <Shield size={32} className="text-[#7AD62A]" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-3">404</h1>
        <p className="text-slate-400 mb-8 text-lg">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#7AD62A] text-white rounded-xl font-semibold hover:bg-[#1e8a56] transition-colors"
          >
            <Home size={18} />
            Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={18} />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
