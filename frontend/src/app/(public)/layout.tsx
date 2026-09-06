"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      <nav className="sticky top-0 z-40 bg-[#0F203A]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.svg" alt="XpertClass" className="w-7 h-7" />
            <span className="font-bold text-white tracking-tight">XpertClass</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <Link href="/courses" className="text-white/60 hover:text-white transition-colors">Courses</Link>
            <Link href="/labs" className="text-white/60 hover:text-white transition-colors">Labs</Link>
            <Link href="/community" className="text-white/60 hover:text-white transition-colors">Programs</Link>
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/get-started" className="px-4 py-1.5 bg-[#7AD62A] text-white rounded-lg font-medium hover:bg-[#229C62] transition-colors">Get Started</Link>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 text-white/60 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="sm:hidden border-t border-white/10 bg-[#0F203A] px-6 py-4 space-y-3">
            <Link href="/courses" className="block text-sm text-white/60 hover:text-white" onClick={() => setMobileOpen(false)}>Courses</Link>
            <Link href="/labs" className="block text-sm text-white/60 hover:text-white" onClick={() => setMobileOpen(false)}>Labs</Link>
            <Link href="/community" className="block text-sm text-white/60 hover:text-white" onClick={() => setMobileOpen(false)}>Programs</Link>
            <Link href="/dashboard" className="block text-sm text-white/60 hover:text-white" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            <Link href="/get-started" className="block text-sm px-4 py-2 bg-[#7AD62A] text-white rounded-lg font-medium text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
          </div>
        )}
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/5 py-6 px-6 text-center text-xs text-white/40">
        © 2026 XpertClass — Hands-on cybersecurity training.
      </footer>
    </div>
  );
}
