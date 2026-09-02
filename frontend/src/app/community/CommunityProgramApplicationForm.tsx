"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { fetchPublicApi } from "@/lib/publicApi";
import toast from "@/lib/toast";
import { APPLICATION_DEFAULTS, PROGRAM_DETAILS, type ApplicationForm, type ProgramSlug } from "./programData";

type CommunityProgramApplicationFormProps = {
  programType: ProgramSlug;
  sourcePage: string;
  compact?: boolean;
};

type FormErrors = Partial<Record<keyof ApplicationForm, string>>;

type ApplicationResponse = {
  success: boolean;
  applicationId: string;
  message: string;
};

const FIELD_HELP: Partial<Record<keyof ApplicationForm, string>> = {
  city: "Helps us match you to local campus, event, or community opportunities.",
  organization: "Use your university, company, bootcamp, or community name.",
  experience: "Mention relevant community, teaching, mentoring, security, or technical background.",
  availability: "Example: 2-4 hours per week, weekends, monthly events.",
  linkedinUrl: "Optional, but useful for credibility review.",
  portfolioUrl: "Optional. GitHub, personal site, community page, or project link works.",
  interests: "Separate interests with commas.",
  contribution: "Be specific. Strong applications explain the audience, activity, and expected impact.",
};

function validateForm(form: ApplicationForm): FormErrors {
  const errors: FormErrors = {};
  const email = form.email.trim();
  const contribution = form.contribution.trim();
  const interests = form.interests.split(",").map((item) => item.trim()).filter(Boolean);

  if (form.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (form.city.trim().length < 2) errors.city = "Enter your city or region.";
  if (form.organization.trim().length < 2) errors.organization = "Enter your organization or community.";
  if (form.role.trim().length < 2) errors.role = "Tell us your current role.";
  if (form.availability.trim().length < 3) errors.availability = "Tell us when or how often you can contribute.";
  if (interests.length === 0) errors.interests = "Add at least one interest.";
  if (contribution.length < 80) {
    errors.contribution = "Write at least 80 characters so reviewers can understand your plan.";
  }

  for (const key of ["linkedinUrl", "portfolioUrl"] as const) {
    const value = form[key].trim();
    if (value && !/^https?:\/\/\S+\.\S+/.test(value)) {
      errors[key] = "Use a full URL starting with http:// or https://.";
    }
  }

  return errors;
}

function cleanPayload(form: ApplicationForm, sourcePage: string) {
  const cleanString = (value: string) => value.trim();
  const optionalString = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  return {
    programType: form.programType,
    name: cleanString(form.name),
    email: cleanString(form.email).toLowerCase(),
    city: cleanString(form.city),
    organization: cleanString(form.organization),
    role: cleanString(form.role),
    experience: optionalString(form.experience),
    interests: form.interests.split(",").map((item) => item.trim()).filter(Boolean),
    contribution: cleanString(form.contribution),
    availability: cleanString(form.availability),
    linkedinUrl: optionalString(form.linkedinUrl),
    portfolioUrl: optionalString(form.portfolioUrl),
    sourcePage,
  };
}

export default function CommunityProgramApplicationForm({
  programType,
  sourcePage,
  compact = false,
}: CommunityProgramApplicationFormProps) {
  const [form, setForm] = useState<ApplicationForm>(APPLICATION_DEFAULTS[programType]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<ApplicationResponse | null>(null);
  const selectedProgram = PROGRAM_DETAILS[programType];
  const contributionLength = form.contribution.trim().length;

  useEffect(() => {
    setForm(APPLICATION_DEFAULTS[programType]);
    setErrors({});
    setSubmitted(null);
  }, [programType]);

  function updateField(key: keyof ApplicationForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetchPublicApi<ApplicationResponse>("/inquiries/community-programs", {
        method: "POST",
        body: JSON.stringify(cleanPayload(form, sourcePage)),
      });
      toast.success("Application received");
      setSubmitted(response);
      setForm(APPLICATION_DEFAULTS[programType]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit application";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#7AD62A]/25 bg-[#0f172a] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#7AD62A]/20 bg-[#7AD62A]/10">
            <CheckCircle2 size={22} className="text-[#7AD62A]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Application received</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Your {selectedProgram.shortTitle.toLowerCase()} application is in review.</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              We captured your application and will review your background, availability, and contribution plan. Keep this reference in case you contact us later.
            </p>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Reference ID</p>
              <p className="mt-1 break-all font-mono text-sm text-white">{submitted.applicationId}</p>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setSubmitted(null)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7AD62A] px-5 py-3 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422]"
              >
                Submit another application
              </button>
              <a
                href="mailto:contact@xpertclass.academy"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
              >
                <Mail size={15} />
                Contact the team
              </a>
            </div>
          </div>
        </div>
      </div>
    );
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
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          "Reviewers look for specific local reach or support capacity.",
          "Strong applications explain what you can do in the first 30 days.",
          "Your details are used only for XpertClass community review.",
        ].map((item) => (
          <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-300">
            <ShieldCheck size={14} className="mb-2 text-[#7AD62A]" />
            {item}
          </div>
        ))}
      </div>
      <div className={`mt-6 grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        {[
          { key: "name", label: "Name", placeholder: "Your name", required: true },
          { key: "email", label: "Email", placeholder: "name@example.com", type: "email", required: true },
          { key: "city", label: "City or region", placeholder: "Douala", required: true },
          { key: "organization", label: "Organization or community", placeholder: "University, company, or chapter", required: true },
          { key: "role", label: "Current role", placeholder: "Student, engineer, mentor...", required: true },
          { key: "experience", label: "Experience", placeholder: "Community lead, mentor, DevOps engineer..." },
          { key: "availability", label: "Availability", placeholder: "A few hours per week", required: true },
          { key: "linkedinUrl", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
        ].map((field) => (
          <label key={field.key} className="space-y-2">
            <span className="flex items-center justify-between gap-2 text-sm font-medium text-slate-200">
              {field.label}
              {field.required && <span className="text-[10px] uppercase tracking-[0.16em] text-[#7AD62A]">Required</span>}
            </span>
            <input
              type={field.type || "text"}
              value={form[field.key as keyof ApplicationForm] as string}
              onChange={(event) => updateField(field.key as keyof ApplicationForm, event.target.value)}
              aria-invalid={Boolean(errors[field.key as keyof ApplicationForm])}
              className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none ${
                errors[field.key as keyof ApplicationForm]
                  ? "border-red-400/60 focus:border-red-300"
                  : "border-white/10 focus:border-[#7AD62A]/40"
              }`}
              placeholder={field.placeholder}
              required={field.required}
            />
            {FIELD_HELP[field.key as keyof ApplicationForm] && !errors[field.key as keyof ApplicationForm] && (
              <p className="text-xs leading-relaxed text-slate-500">{FIELD_HELP[field.key as keyof ApplicationForm]}</p>
            )}
            {errors[field.key as keyof ApplicationForm] && (
              <p className="text-xs leading-relaxed text-red-300">{errors[field.key as keyof ApplicationForm]}</p>
            )}
          </label>
        ))}
        <label className={`space-y-2 ${compact ? "" : "sm:col-span-2"}`}>
          <span className="text-sm font-medium text-slate-200">Portfolio or website</span>
          <input
            value={form.portfolioUrl}
            onChange={(event) => updateField("portfolioUrl", event.target.value)}
            aria-invalid={Boolean(errors.portfolioUrl)}
            className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none ${
              errors.portfolioUrl ? "border-red-400/60 focus:border-red-300" : "border-white/10 focus:border-[#7AD62A]/40"
            }`}
            placeholder="https://your-site.com"
          />
          {errors.portfolioUrl ? (
            <p className="text-xs leading-relaxed text-red-300">{errors.portfolioUrl}</p>
          ) : (
            <p className="text-xs leading-relaxed text-slate-500">{FIELD_HELP.portfolioUrl}</p>
          )}
        </label>
        <label className={`space-y-2 ${compact ? "" : "sm:col-span-2"}`}>
          <span className="flex items-center justify-between gap-2 text-sm font-medium text-slate-200">
            Interests
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#7AD62A]">Required</span>
          </span>
          <input
            value={form.interests}
            onChange={(event) => updateField("interests", event.target.value)}
            aria-invalid={Boolean(errors.interests)}
            className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none ${
              errors.interests ? "border-red-400/60 focus:border-red-300" : "border-white/10 focus:border-[#7AD62A]/40"
            }`}
            placeholder="community, security, mentorship, devops"
          />
          {errors.interests ? (
            <p className="text-xs leading-relaxed text-red-300">{errors.interests}</p>
          ) : (
            <p className="text-xs leading-relaxed text-slate-500">{FIELD_HELP.interests}</p>
          )}
        </label>
        <label className={`space-y-2 ${compact ? "" : "sm:col-span-2"}`}>
          <span className="flex items-center justify-between gap-2 text-sm font-medium text-slate-200">
            How would you contribute?
            <span className={contributionLength >= 80 ? "text-xs text-[#7AD62A]" : "text-xs text-slate-500"}>
              {contributionLength}/80 minimum
            </span>
          </span>
          <textarea
            value={form.contribution}
            onChange={(event) => updateField("contribution", event.target.value)}
            aria-invalid={Boolean(errors.contribution)}
            className={`min-h-36 w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none ${
              errors.contribution ? "border-red-400/60 focus:border-red-300" : "border-white/10 focus:border-[#7AD62A]/40"
            }`}
            placeholder={
              programType === "ambassador"
                ? "Example: I can run monthly campus sessions, introduce XpertClass to the cybersecurity club, and help new learners complete their first lab."
                : "Example: I can support onboarding sessions, mentor beginners during lab nights, and help organize community events twice per month."
            }
            required
          />
          {errors.contribution ? (
            <p className="text-xs leading-relaxed text-red-300">{errors.contribution}</p>
          ) : (
            <p className="text-xs leading-relaxed text-slate-500">{FIELD_HELP.contribution}</p>
          )}
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
