"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Award, User, Trophy, MoreHorizontal, Lock } from "lucide-react";
import { logout } from "@/lib/auth";
import { useState, useRef, useEffect } from "react";
import { getLevel, getSidebarItemLock } from "@/lib/levelGating";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Courses", icon: GraduationCap },
  { href: "/dashboard/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/dashboard/certifications", label: "Certs", icon: Award },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const moreLinks = [
  { href: "/dashboard/labs", label: "Labs" },
  { href: "/dashboard/master-classes", label: "Master Classes" },
  { href: "/dashboard/training", label: "Training" },
  { href: "/dashboard/registry", label: "Registry" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    try {
      const xp = parseInt(localStorage.getItem("xp") || "0", 10);
      setLevel(getLevel(xp));
    } catch {}
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50" aria-label="Mobile navigation">
      <div className="flex justify-around items-center h-16 px-2 safe-area-pb">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const gate = getSidebarItemLock(href, level);
          const isLocked = gate.locked;
          return (
            <Link
              key={href}
              href={isLocked ? "#" : href}
              aria-current={isActive ? "page" : undefined}
              title={isLocked ? gate.reason : undefined}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isLocked ? "text-slate-300" : isActive ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
              }`}
              onClick={(e) => { if (isLocked) e.preventDefault(); }}
            >
              <div className="relative">
                <Icon size={20} />
                {isLocked && <Lock size={8} className="absolute -top-1 -right-1 text-slate-400" />}
              </div>
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            aria-label="More options"
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              moreOpen ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
              {moreLinks.map(({ href, label }) => {
                const gate = getSidebarItemLock(href, level);
                const isLocked = gate.locked;
                return isLocked ? (
                  <span
                    key={href}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  >
                    {label}
                    <span className="text-[10px] flex items-center gap-1"><Lock size={10} />Lv.{gate.requiredLevel}</span>
                  </span>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={() => { setMoreOpen(false); logout(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
