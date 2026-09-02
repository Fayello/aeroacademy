"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Megaphone,
  HandHeart,
  School2,
  Users,
} from "lucide-react";
import CommunityProgramApplicationForm from "./CommunityProgramApplicationForm";
import { PROGRAM_DETAILS, type ProgramSlug } from "./programData";

export default function CommunityPage() {
  const [programType, setProgramType] = useState<ProgramSlug>("ambassador");
  const selectedProgram = PROGRAM_DETAILS[programType];

  function switchProgram(nextType: ProgramSlug) {
    setProgramType(nextType);
  }

  return (
    <div className="min-h-screen bg-[#08111f]">
      <nav className="border-b border-white/10 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-icon.svg" alt="XpertClass" width={36} height={36} className="h-9 w-9" />
            <span className="text-lg font-bold text-white tracking-tight">XpertClass</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/get-started" className="text-sm text-slate-300 transition-colors hover:text-white">Get started</Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <div className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#193553] p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Community Programs</p>
                <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">Help grow XpertClass with credibility, not noise</h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
                  We want ambassadors and volunteers who can help learners start well, support communities, and represent a serious training and certification system with clarity.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { title: "Campus ambassadors", text: "Introduce XpertClass in universities and student communities.", icon: School2, href: PROGRAM_DETAILS.ambassador.path },
                    { title: "Community volunteers", text: "Support events, learner onboarding, and community momentum.", icon: HandHeart, href: PROGRAM_DETAILS.volunteer.path },
                    { title: "Trusted representation", text: "Promote a platform that values proof, structure, and learner outcomes.", icon: Users },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <item.icon size={16} className="text-[#7AD62A]" />
                      <h2 className="mt-3 text-sm font-semibold text-white">{item.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.text}</p>
                      {"href" in item && item.href ? (
                        <Link href={item.href} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#7AD62A] transition-colors hover:text-[#6bc422]">
                          Learn more
                          <ArrowRight size={12} />
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
                <div className="flex items-center gap-2">
                  {programType === "ambassador" ? <Megaphone size={16} className="text-[#7AD62A]" /> : <HandHeart size={16} className="text-[#7AD62A]" />}
                  <p className="text-sm font-semibold text-white">Program focus</p>
                </div>
                <div className="mt-4 space-y-3">
                  {selectedProgram.focusPoints.map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
                <Link href={selectedProgram.path} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#7AD62A] transition-colors hover:text-[#6bc422]">
                  See full {selectedProgram.shortTitle.toLowerCase()} program
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => switchProgram("ambassador")}
                className={`w-full rounded-2xl border p-5 text-left transition-colors ${programType === "ambassador" ? "border-[#7AD62A]/25 bg-[#7AD62A]/10" : "border-white/10 bg-[#0f172a] hover:bg-white/[0.03]"}`}
              >
                <div className="flex items-center gap-2">
                  <Megaphone size={16} className="text-[#7AD62A]" />
                  <p className="text-sm font-semibold text-white">{PROGRAM_DETAILS.ambassador.shortTitle}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {PROGRAM_DETAILS.ambassador.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#7AD62A]">
                  Learn about the program below
                  <ArrowRight size={14} />
                </div>
              </button>
              <Link href={PROGRAM_DETAILS.ambassador.path} className="inline-flex items-center gap-2 pl-1 text-sm font-medium text-[#7AD62A] transition-colors hover:text-[#6bc422]">
                Open ambassador program page
                <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => switchProgram("volunteer")}
                className={`w-full rounded-2xl border p-5 text-left transition-colors ${programType === "volunteer" ? "border-[#7AD62A]/25 bg-[#7AD62A]/10" : "border-white/10 bg-[#0f172a] hover:bg-white/[0.03]"}`}
              >
                <div className="flex items-center gap-2">
                  <HandHeart size={16} className="text-[#7AD62A]" />
                  <p className="text-sm font-semibold text-white">{PROGRAM_DETAILS.volunteer.shortTitle}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {PROGRAM_DETAILS.volunteer.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#7AD62A]">
                  Learn about the program below
                  <ArrowRight size={14} />
                </div>
              </button>
              <Link href={PROGRAM_DETAILS.volunteer.path} className="inline-flex items-center gap-2 pl-1 text-sm font-medium text-[#7AD62A] transition-colors hover:text-[#6bc422]">
                Open volunteer program page
                <ArrowRight size={14} />
              </Link>
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
                <h2 className="text-sm font-semibold text-white">What we look for</h2>
                <div className="mt-4 space-y-3">
                  {selectedProgram.expectations.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#7AD62A]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <CommunityProgramApplicationForm programType={programType} sourcePage="/community" />
          </div>
        </div>
      </div>
    </div>
  );
}
