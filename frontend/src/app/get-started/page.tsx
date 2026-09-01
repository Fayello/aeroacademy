"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  FileBadge2,
  GraduationCap,
  ChevronLeft,
  Sparkles,
  Target,
  Building2,
  BriefcaseBusiness,
  School2,
  ClipboardCheck,
} from "lucide-react";

const ROUTES = [
  {
    badge: "For Learners",
    icon: BookOpen,
    title: "Build skills and earn verifiable proof",
    description:
      "Start free, complete guided onboarding, and move through a disciplined path from training to practice to certification.",
    cta: "Create learner account",
    href: "/register",
    external: false,
    tone: "border-[#7AD62A]/25 bg-[#7AD62A]/10 text-[#7AD62A]",
    bullets: [
      "12 months of free access",
      "One clear first milestone",
      "Course, lab, and assessment progression",
    ],
  },
  {
    badge: "For Universities",
    icon: School2,
    title: "Run cohorts with academic structure and practical rigor",
    description:
      "Use XpertClass to combine coursework, lab delivery, grading visibility, and learner readiness inside one controlled academic environment.",
    cta: "Discuss university rollout",
    href: "mailto:enterprise@xpertclass.academy?subject=University%20Program%20Inquiry",
    external: true,
    tone: "border-blue-200 bg-blue-500/10 text-blue-300",
    bullets: [
      "Academic cohorts and transcript visibility",
      "Classroom lab control for instructors",
      "Readiness and completion reporting",
    ],
  },
  {
    badge: "For Employers",
    icon: BriefcaseBusiness,
    title: "Develop and identify workforce-ready talent",
    description:
      "Support internal upskilling, evaluate practical capability, and review candidate evidence through a more structured enterprise workflow.",
    cta: "Contact enterprise team",
    href: "mailto:enterprise@xpertclass.academy?subject=Enterprise%20Capability%20Inquiry",
    external: true,
    tone: "border-amber-200 bg-amber-500/10 text-amber-300",
    bullets: [
      "Managed cohorts and talent visibility",
      "Practical evidence over theory alone",
      "Verification-oriented outcomes",
    ],
  },
];

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-[#08111f] flex flex-col">
      <nav className="w-full px-4 sm:px-6 py-5 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex w-full items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-icon.svg" alt="XpertClass" width={36} height={36} className="w-9 h-9" />
            <span className="text-lg font-bold text-white tracking-tight">XpertClass</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden sm:inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={14} />
              Back to homepage
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto w-full space-y-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7AD62A]/20 bg-[#7AD62A]/10 text-[#7AD62A] text-xs font-semibold uppercase tracking-[0.2em]">
              <ShieldCheck size={14} />
              Certification Pathways
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mt-5">
              Choose the path that matches your role.
            </h1>
            <p className="text-lg text-slate-300 mt-4 leading-relaxed">
              XpertClass should feel clear from the first click. Learners, universities, and enterprises each need a different route into the same trusted system.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">No credit card required for learners</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">Guided onboarding in about 1 minute</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">Clear path from training to verification</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {ROUTES.map((route) => (
              <div key={route.title} className="bg-[#0f172a] rounded-2xl border border-white/10 p-6 sm:p-8 hover:shadow-lg hover:border-white/20 transition-all group flex flex-col">
                <div className={`inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-6 ${route.tone}`}>
                  <route.icon size={14} />
                  {route.badge}
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">{route.title}</h2>
                <p className="text-slate-300 leading-relaxed mb-6">{route.description}</p>
                <ul className="space-y-3 mb-8">
                  {route.bullets.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 size={16} className="text-[#7AD62A] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                {route.external ? (
                  <a href={route.href} className="btn-secondary w-full justify-center text-sm px-6 py-3 border-white/15 text-slate-100 hover:bg-white/5 mt-auto">
                    {route.cta} <ArrowRight size={16} />
                  </a>
                ) : (
                  <Link href={route.href} className="btn-primary w-full justify-center text-sm px-6 py-3 mt-auto">
                    {route.cta} <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Sparkles,
                title: "What happens first",
                text: "Pick the right route so the experience starts with the right language, controls, and next action.",
              },
              {
                icon: Target,
                title: "What happens next",
                text: "Learners get guided onboarding, while institutions move into cohort, classroom, and reporting workflows.",
              },
              {
                icon: ShieldCheck,
                title: "What you are building toward",
                text: "A coherent learning and evidence record that supports readiness, credentialing, and trust.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
                <item.icon size={18} className="text-[#7AD62A] mb-3" />
                <h2 className="text-base font-semibold text-white">{item.title}</h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Enroll", text: "Choose the learner, university, or enterprise route." },
                { step: "2", title: "Train", text: "Launch guided coursework, practical labs, or cohort sessions." },
                { step: "3", title: "Assess", text: "Measure readiness through controlled evaluations and records." },
                { step: "4", title: "Verify", text: "Use transcript, candidate, or credential records as trusted proof." },
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Building2,
                title: "Institutional confidence",
                text: "Universities and organizations need program structure, reporting clarity, and practical outcomes they can defend.",
              },
              {
                icon: ClipboardCheck,
                title: "Operational rigor",
                text: "Assessments, lab usage, transcripts, and cohort evidence should feel governed, not improvised.",
              },
              {
                icon: Users,
                title: "Shared journey model",
                text: "Learners, instructors, and employers should all understand the same pathway from training to proof.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <item.icon size={18} className="text-[#7AD62A] mb-3" />
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400">
            Already have an account and want to continue your current pathway?{" "}
            <Link href="/login" className="text-[#7AD62A] hover:text-[#6bc422] font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
