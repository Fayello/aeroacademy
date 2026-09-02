"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Megaphone, Users, School2 } from "lucide-react";
import CommunityProgramApplicationForm from "../CommunityProgramApplicationForm";
import { PROGRAM_DETAILS } from "../programData";

const program = PROGRAM_DETAILS.ambassador;

export default function AmbassadorProgramPage() {
  return (
    <div className="min-h-screen bg-[#08111f]">
      <nav className="border-b border-white/10 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-icon.svg" alt="XpertClass" width={36} height={36} className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight text-white">XpertClass</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/community" className="text-sm text-slate-300 transition-colors hover:text-white">Community</Link>
            <Link href="/get-started" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#193553] p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">{program.eyebrow}</p>
                <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">{program.title}</h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">{program.summary}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href="#apply" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7AD62A] px-5 py-3 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422]">
                    Apply now
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/community/volunteer-program" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5">
                    Compare volunteer path
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
                <div className="flex items-center gap-2">
                  <Megaphone size={16} className="text-[#7AD62A]" />
                  <p className="text-sm font-semibold text-white">Best fit</p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">{program.audience}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: School2, label: "Campus reach" },
                    { icon: Users, label: "Community trust" },
                    { icon: Megaphone, label: "Clear representation" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                      <item.icon size={16} className="mx-auto text-[#7AD62A]" />
                      <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 lg:col-span-2">
              <h2 className="text-2xl font-bold text-white">What ambassadors do</h2>
              <div className="mt-5 grid gap-3">
                {program.outcomes.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#7AD62A]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
              <h2 className="text-xl font-bold text-white">What we look for</h2>
              <div className="mt-5 space-y-3">
                {program.expectations.map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6">
              <h2 className="text-2xl font-bold text-white">Program benefits</h2>
              <div className="mt-5 space-y-3">
                {program.perks.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#7AD62A]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#7AD62A]/20 bg-gradient-to-br from-[#0F203A] to-[#122a47] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Program flow</p>
              <h2 className="mt-3 text-2xl font-bold text-white">How the ambassador path works</h2>
              <div className="mt-5 space-y-3">
                {program.process.map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7AD62A]">Step {index + 1}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="apply" className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] scroll-mt-24">
            <div className="rounded-2xl border border-[#7AD62A]/20 bg-gradient-to-br from-[#0F203A] to-[#122a47] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Apply directly</p>
              <h2 className="mt-3 text-2xl font-bold text-white">Start your ambassador application here</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                This page now works as a full program destination, so interested ambassadors can review the offer and apply without bouncing back to the community hub.
              </p>
              <div className="mt-5 space-y-3">
                {program.focusPoints.map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <CommunityProgramApplicationForm programType="ambassador" sourcePage="/community/ambassador-program" />
          </section>
        </div>
      </div>
    </div>
  );
}
