"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi } from "@/lib/api";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Megaphone,
  HandHeart,
  School2,
  Users,
} from "lucide-react";
import toast from "@/lib/toast";
import { APPLICATION_DEFAULTS, PROGRAM_DETAILS, type ApplicationForm, type ProgramSlug } from "./programData";

export default function CommunityPage() {
  const [programType, setProgramType] = useState<ProgramSlug>("ambassador");
  const [form, setForm] = useState<ApplicationForm>(APPLICATION_DEFAULTS.ambassador);
  const [submitting, setSubmitting] = useState(false);
  const selectedProgram = PROGRAM_DETAILS[programType];

  function switchProgram(nextType: ProgramSlug) {
    setProgramType(nextType);
    setForm(APPLICATION_DEFAULTS[nextType]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await fetchApi("/inquiries/community-programs", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          interests: form.interests.split(",").map((item) => item.trim()).filter(Boolean),
          sourcePage: "/community",
        }),
      });
      toast.success("Application received");
      setForm(APPLICATION_DEFAULTS[programType]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
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

            <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white">{programType === "ambassador" ? "Apply to become an ambassador" : "Apply to volunteer"}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Tell us how you want to contribute and what communities or learners you can support.
              </p>
              <div className="mt-5 rounded-2xl border border-[#7AD62A]/15 bg-[#7AD62A]/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7AD62A]">Program snapshot</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">{selectedProgram.summary}</p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { key: "name", label: "Name", placeholder: "Your name" },
                  { key: "email", label: "Email", placeholder: "name@example.com", type: "email" },
                  { key: "city", label: "City", placeholder: "Douala" },
                  { key: "organization", label: "Organization", placeholder: "University or company" },
                  { key: "role", label: "Role", placeholder: "Student, engineer, mentor..." },
                  { key: "experience", label: "Experience", placeholder: "Community lead, mentor, DevOps engineer..." },
                  { key: "availability", label: "Availability", placeholder: "A few hours per week" },
                  { key: "linkedinUrl", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
                ].map((field) => (
                  <label key={field.key} className="space-y-2">
                    <span className="text-sm font-medium text-slate-200">{field.label}</span>
                    <input
                      type={field.type || "text"}
                      value={form[field.key as keyof ApplicationForm] as string}
                      onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#7AD62A]/40 focus:outline-none"
                      placeholder={field.placeholder}
                      required={field.key === "name" || field.key === "email"}
                    />
                  </label>
                ))}
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-200">Portfolio or website</span>
                  <input
                    value={form.portfolioUrl}
                    onChange={(event) => setForm({ ...form, portfolioUrl: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#7AD62A]/40 focus:outline-none"
                    placeholder="https://your-site.com"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-200">Interests</span>
                  <input
                    value={form.interests}
                    onChange={(event) => setForm({ ...form, interests: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#7AD62A]/40 focus:outline-none"
                    placeholder="community, security, mentorship, devops"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-200">How would you contribute?</span>
                  <textarea
                    value={form.contribution}
                    onChange={(event) => setForm({ ...form, contribution: event.target.value })}
                    className="min-h-36 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#7AD62A]/40 focus:outline-none"
                    required
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7AD62A] px-5 py-3 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Submit application
                </button>
                <Link href="/get-started" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5">
                  Explore the platform
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
