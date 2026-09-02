"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import { APPLICATION_DEFAULTS, PROGRAM_DETAILS, type ApplicationForm, type ProgramSlug } from "./programData";

type CommunityProgramApplicationFormProps = {
  programType: ProgramSlug;
  sourcePage: string;
  compact?: boolean;
};

export default function CommunityProgramApplicationForm({
  programType,
  sourcePage,
  compact = false,
}: CommunityProgramApplicationFormProps) {
  const [form, setForm] = useState<ApplicationForm>(APPLICATION_DEFAULTS[programType]);
  const [submitting, setSubmitting] = useState(false);
  const selectedProgram = PROGRAM_DETAILS[programType];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await fetchApi("/inquiries/community-programs", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          interests: form.interests.split(",").map((item) => item.trim()).filter(Boolean),
          sourcePage,
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-white">
        {programType === "ambassador" ? "Apply to become an ambassador" : "Apply to volunteer"}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        Tell us how you want to contribute and what communities or learners you can support.
      </p>
      <div className="mt-5 rounded-2xl border border-[#7AD62A]/15 bg-[#7AD62A]/10 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7AD62A]">Program snapshot</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{selectedProgram.summary}</p>
      </div>
      <div className={`mt-6 grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
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
        <label className={`space-y-2 ${compact ? "" : "sm:col-span-2"}`}>
          <span className="text-sm font-medium text-slate-200">Portfolio or website</span>
          <input
            value={form.portfolioUrl}
            onChange={(event) => setForm({ ...form, portfolioUrl: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#7AD62A]/40 focus:outline-none"
            placeholder="https://your-site.com"
          />
        </label>
        <label className={`space-y-2 ${compact ? "" : "sm:col-span-2"}`}>
          <span className="text-sm font-medium text-slate-200">Interests</span>
          <input
            value={form.interests}
            onChange={(event) => setForm({ ...form, interests: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#7AD62A]/40 focus:outline-none"
            placeholder="community, security, mentorship, devops"
          />
        </label>
        <label className={`space-y-2 ${compact ? "" : "sm:col-span-2"}`}>
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
        <Link
          href="/get-started"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
        >
          Explore the platform
        </Link>
      </div>
    </form>
  );
}
