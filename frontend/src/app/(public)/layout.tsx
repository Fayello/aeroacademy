import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      <nav className="sticky top-0 z-40 bg-[#0F203A]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.svg" alt="XpertClass" className="w-7 h-7" />
            <span className="font-bold text-white tracking-tight">XpertClass</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/courses" className="text-white/60 hover:text-white transition-colors">Courses</Link>
            <Link href="/labs" className="text-white/60 hover:text-white transition-colors">Labs</Link>
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/get-started" className="px-4 py-1.5 bg-[#7AD62A] text-white rounded-lg font-medium hover:bg-[#229C62] transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/5 py-6 px-6 text-center text-xs text-white/40">
        © 2026 XpertClass — Hands-on cybersecurity training.
      </footer>
    </div>
  );
}
