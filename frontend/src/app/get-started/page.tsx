"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, BookOpen, ArrowRight, CheckCircle2, ShieldCheck, FileBadge2, GraduationCap } from "lucide-react";

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-[#08111f] flex flex-col">
      {/* Minimal nav */}
      <nav className="w-full px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-icon.svg" alt="XpertClass" width={36} height={36} className="w-9 h-9" />
          <span className="text-lg font-bold text-white tracking-tight">XpertClass</span>
        </Link>
      </nav>

      {/* Main content */}
      <div className="flex-1 px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto w-full space-y-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7AD62A]/20 bg-[#7AD62A]/10 text-[#7AD62A] text-xs font-semibold uppercase tracking-[0.2em]">
              <ShieldCheck size={14} />
              Certification Pathways
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mt-5">
              Start with guided training. Finish with proof that matters.
            </h1>
            <p className="text-lg text-slate-300 mt-4 leading-relaxed">
              XpertClass is built to help learners and institutions move from skills development to measurable assessment and verifiable outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: GraduationCap,
                title: "Structured learning",
                text: "Begin with guided courses and labs designed to reduce uncertainty for first-time learners.",
              },
              {
                icon: ShieldCheck,
                title: "Assessment rigor",
                text: "Progress into practical exams with visible standards, attempt rules, and score thresholds.",
              },
              {
                icon: FileBadge2,
                title: "Verifiable credentials",
                text: "Complete the pathway and unlock certificates that can be checked by employers and institutions.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
                <item.icon size={18} className="text-[#7AD62A] mb-3" />
                <h2 className="text-base font-semibold text-white">{item.title}</h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Individual Card */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-8 hover:shadow-lg hover:border-[#7AD62A]/30 transition-all group">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7AD62A]/10 border border-[#7AD62A]/20 text-[#7AD62A] text-xs font-semibold mb-6">
                <BookOpen size={14} /> FOR INDIVIDUALS
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Create your learner account</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                Start your first year free and move through a clear sequence: learn, practice, qualify, and work toward a credential-worthy record.
              </p>
              <p className="text-sm text-slate-400 font-medium mb-4">Best for students and early-career professionals who need:</p>
              <ul className="space-y-3 mb-8">
                {[
                  "12 months of free access to the platform",
                  "A guided first step into labs and structured courses",
                  "Visible progress toward assessments and certificate eligibility",
                  "Hands-on evidence, not theory alone",
                  "A beginner journey that can become a serious professional pathway",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-[#7AD62A] shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="btn-primary w-full justify-center text-sm px-6 py-3"
              >
                Start Free for 1 Year <ArrowRight size={16} />
              </Link>
              <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
                No credit card required. Verify your email, personalize your path, and begin with a guided certification-ready foundation.
              </p>
            </div>

            {/* Enterprise Card */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-8 hover:shadow-lg hover:border-blue-300 transition-all group">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-200 text-blue-300 text-xs font-semibold mb-6">
                <Users size={14} /> FOR ENTERPRISES
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Build workforce capability with managed cohorts</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                Bring XpertClass into your institution or organization for structured readiness development, reporting, and practical verification.
              </p>
              <p className="text-sm text-slate-400 font-medium mb-4">Best for universities, academies, and team leaders looking to:</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Run disciplined cohorts with guided training pathways",
                  "Track learner progress, readiness, and completion quality",
                  "Map training to organizational capability goals",
                  "Combine labs, courses, and assessments inside one system",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-blue-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:enterprise@xpertclass.academy?subject=Enterprise%20Inquiry"
                className="btn-secondary w-full justify-center text-sm px-6 py-3 border-blue-200 text-blue-200 hover:bg-blue-500/10"
              >
                Contact Sales <ArrowRight size={16} />
              </a>
              <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
                Designed for leaders who want practical training outcomes, not just content consumption.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 sm:p-8">
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Enroll", text: "Create your account and choose your learning direction." },
                { step: "2", title: "Train", text: "Complete guided coursework and practical labs." },
                { step: "3", title: "Assess", text: "Demonstrate readiness through controlled exams." },
                { step: "4", title: "Verify", text: "Claim credentials that can be checked externally." },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="w-8 h-8 rounded-full bg-[#7AD62A]/15 text-[#7AD62A] flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-3">{item.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-[#7AD62A] hover:text-[#6bc422] font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
