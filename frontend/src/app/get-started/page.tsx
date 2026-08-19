"use client";

import Link from "next/link";
import { Users, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal nav */}
      <nav className="w-full px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo-icon.svg" alt="XpertClass" className="w-9 h-9" />
          <span className="text-lg font-bold text-slate-900 tracking-tight">XpertClass</span>
        </Link>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Choose the right XpertClass path for you
            </h1>
            <p className="text-lg text-slate-500 mt-3">
              Train yourself on the latest technologies, or build and scale engineering teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Individual Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg hover:border-[#229C62]/30 transition-all group">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F8EE] border border-[#229C62]/20 text-[#0F203A] text-xs font-semibold mb-6">
                <BookOpen size={14} /> FOR INDIVIDUALS
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Start learning immediately for free</h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                Join a growing community of engineers across Cameroon building real skills through hands-on labs and structured courses.
              </p>
              <p className="text-sm text-slate-600 font-medium mb-4">Best for students and individuals:</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Personal use",
                  "Free access to courses & labs",
                  "Get started in seconds",
                  "Earn XP & climb the leaderboard",
                  "Earn certifications",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-[#229C62] shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="btn-primary w-full justify-center text-sm px-6 py-3"
              >
                Create Free Account <ArrowRight size={16} />
              </Link>
              <p className="text-xs text-slate-400 text-center mt-4">
                Best for personal learning and career growth. Sign up in less than 1 minute.
              </p>
            </div>

            {/* Enterprise Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg hover:border-blue-300 transition-all group">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
                <Users size={14} /> FOR ENTERPRISES
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Build enterprise team capability and mastery</h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                Get a solution tailored to your organization and reporting needs.
              </p>
              <p className="text-sm text-slate-600 font-medium mb-4">Best for managers and team leads looking to:</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Validate organizational readiness across labs & courses",
                  "Develop your workforce with structured training paths",
                  "Track team progress with analytics dashboards",
                  "Deploy isolated lab environments for your team",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-blue-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:enterprise@xpertclass.academy?subject=Enterprise%20Inquiry"
                className="btn-secondary w-full justify-center text-sm px-6 py-3 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Contact Sales <ArrowRight size={16} />
              </a>
              <p className="text-xs text-slate-400 text-center mt-4">
                Used by top-performing teams to validate readiness, develop talent, and improve resilience.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[#229C62] hover:text-[#0F203A] font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
