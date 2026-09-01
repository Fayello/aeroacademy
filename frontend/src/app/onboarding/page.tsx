"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "@/lib/toast";
import {
  ChevronRight,
  ChevronLeft,
  Shield,
  Code,
  Server,
  Network,
  Database,
  Cloud,
  GraduationCap,
  Briefcase,
  User,
  Award,
  Rocket,
  Target,
  Zap,
  Lock,
  Terminal,
  Globe,
  ArrowRight,
  Check,
  Brain,
  Cpu,
  BarChart3,
  Palette,
  Building2,
  Users,
  BookOpen,
  FlaskConical,
  Lightbulb,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import {
  EMPTY_ONBOARDING_SELECTIONS,
  markOnboardingComplete,
  writeOnboardingSelections,
  type OnboardingSelections,
} from "@/lib/onboarding";

const testimonials = [
  {
    quote: "XpertClass turned me from a complete beginner into a confident engineer in 6 months.",
    author: "Marie K.",
    role: "SOC Analyst at Orange Cyberdefense",
  },
  {
    quote: "The hands-on labs are incredible. I learned more in 2 weeks here than in a year of theory.",
    author: "Jean-Pierre M.",
    role: "Cloud Security Engineer",
  },
  {
    quote: "The certifications are recognized everywhere. My university degree + XpertClass cert got me my dream job.",
    author: "Amina D.",
    role: "Penetration Tester",
  },
  {
    quote: "As a professor, the instructor tools let me create custom labs for my students. Game changer.",
    author: "Dr. Koné",
    role: "Computer Science Professor",
  },
  {
    quote: "The community is amazing. I found my co-founder through a team challenge on XpertClass.",
    author: "Lucas T.",
    role: "CTO at SecureOps",
  },
  {
    quote: "I went from knowing nothing about cloud to passing the AWS Security Specialty in 4 months.",
    author: "Fatou S.",
    role: "Cloud Architect at Deloitte",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(-1); // -1 = welcome screen
  const [selections, setSelections] = useState<OnboardingSelections>(EMPTY_ONBOARDING_SELECTIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
    }
  }, [router]);

  const toggleMulti = (key: "purpose" | "field" | "skills" | "jobInterests", value: string) => {
    setSelections((prev) => {
      const arr = prev[key] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next };
    });
  };

  const setSingle = (key: "role" | "experience", value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  const canNext = () => {
    switch (step) {
      case 0: return selections.purpose.length > 0;
      case 1: return selections.field.length > 0;
      case 2: return selections.role !== "";
      case 3: return selections.experience !== "";
      case 4: return selections.skills.length > 0;
      case 5: return selections.jobInterests.length > 0;
      case 6: return true;
      default: return true;
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const experienceMap: Record<string, string> = {
        "Student": "INDIVIDUAL",
        "Professional": "INDIVIDUAL",
        "Educator": "INSTRUCTOR",
        "Researcher": "INDIVIDUAL",
      };
      const userExperience = experienceMap[selections.role] || "INDIVIDUAL";

      await fetchApi("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          userExperience,
          onboardingCompleted: true,
          onboardingSelections: selections,
        }),
      });

      markOnboardingComplete();
      writeOnboardingSelections(selections);
      router.push("/dashboard");
    } catch {
      markOnboardingComplete();
      writeOnboardingSelections(selections);
      toast.error("Failed to save preferences. You can update them later in Settings.");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    markOnboardingComplete();
    router.push("/dashboard");
  };

  const userName = useMemo(() => {
    try {
      const s = localStorage.getItem("user");
      if (s) {
        const u = JSON.parse(s);
        return u.name?.split(" ")[0] || u.email?.split("@")[0] || "";
      }
    } catch {}
    return "";
  }, []);

  const currentTestimonial = testimonials[(step >= 0 ? step : 0) % testimonials.length];
  const completedSteps = Math.max(0, step + 1);
  const progressPercent = (completedSteps / 6) * 100;
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (progressPercent / 100) * circumference;

  const selectedFieldName = useMemo(() => {
    if (selections.field.length === 0) return "";
    const labels: Record<string, string> = {
      cybersecurity: "Cybersecurity",
      software: "Software Engineering",
      data: "Data Science & Analytics",
      cloud: "Cloud Computing",
      ai: "AI & Machine Learning",
      devops: "DevOps & Infrastructure",
      networking: "Networking & Systems",
      web: "Web & Mobile Development",
      design: "UX/UI Design",
      other: "Technology",
    };
    return labels[selections.field[0]] || selections.field[0];
  }, [selections.field]);

  return (
    <div className="min-h-screen bg-[#0a1628] flex">
      {/* Left — Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 lg:px-10 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-icon.svg" alt="XpertClass" width={32} height={32} className="w-8 h-8" />
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">Xpert</span><span className="text-[#7AD62A]">Class</span>
            </span>
          </Link>
          <button
            onClick={handleSkip}
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-10 pb-8">
          <div className="w-full max-w-2xl animate-fade-in-up">
            {step >= 0 && step < 6 && (
              <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7AD62A]">Personalization progress</p>
                    <p className="mt-1 text-sm text-white/80">Step {step + 1} of 6. This shapes your first dashboard recommendations and starting pathway.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
                    About 1 minute total
                  </div>
                </div>
              </div>
            )}

            {/* ─── WELCOME SCREEN (step -1) ─── */}
            {step === -1 && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={36} className="text-[#7AD62A]" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  Welcome{userName ? `, ${userName}` : ""}
                </h1>
                <p className="text-base text-white/50 mb-8 max-w-md mx-auto">
                  Let&apos;s personalize your learning experience. It only takes a minute.
                </p>
                <div className="mx-auto mb-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                  {[
                    "Recommend the right first course or lab",
                    "Reduce dashboard clutter for new learners",
                    "Connect your progress to certification readiness",
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                      {item}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep(0)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-sm font-semibold transition-colors"
                >
                  Get Started
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* ─── STEP 0: PURPOSE ─── */}
            {step === 0 && (
              <StepContent
                title="What brings you to XpertClass?"
                subtitle="Select all that apply. We'll tailor your experience."
                options={[
                  { id: "learn", label: "Start learning technology skills", icon: GraduationCap, description: "Hands-on labs and courses to build real skills" },
                  { id: "train", label: "Train and improve my skills", icon: Target, description: "Practice with real-world scenarios and challenges" },
                  { id: "certify", label: "Earn industry-recognized certifications", icon: Award, description: "Credentials that prove your expertise to employers" },
                  { id: "connect", label: "Connect with tech professionals", icon: Users, description: "Join a community of learners and experts" },
                  { id: "jobs", label: "Explore job opportunities", icon: Briefcase, description: "Get discovered by top tech companies" },
                  { id: "compete", label: "Challenge myself in competitions", icon: Zap, description: "Leaderboards, CTFs, and team challenges" },
                  { id: "teach", label: "Teach or mentor others", icon: BookOpen, description: "Create courses, manage students, build curricula" },
                  { id: "team", label: "Train my team", icon: Building2, description: "Enterprise training with progress tracking" },
                  { id: "other", label: "Something else", icon: Lightbulb, description: "Just exploring — not sure yet" },
                ]}
                selected={selections.purpose}
                onToggle={(id) => toggleMulti("purpose", id)}
                multi
              />
            )}

            {/* ─── STEP 1: FIELD ─── */}
            {step === 1 && (
              <StepContent
                title="Which field do you work or study in?"
                subtitle="Select one or more options."
                options={[
                  { id: "cybersecurity", label: "Cybersecurity", icon: Shield, description: "Offensive & defensive security operations" },
                  { id: "software", label: "Software Engineering", icon: Code, description: "Full-stack, backend, mobile, and systems development" },
                  { id: "data", label: "Data Science & Analytics", icon: BarChart3, description: "Data engineering, ML pipelines, business intelligence" },
                  { id: "cloud", label: "Cloud Computing", icon: Cloud, description: "AWS, Azure, GCP — architecture and operations" },
                  { id: "ai", label: "AI & Machine Learning", icon: Brain, description: "Deep learning, NLP, computer vision, LLMs" },
                  { id: "devops", label: "DevOps & Infrastructure", icon: Terminal, description: "CI/CD, containers, IaC, platform engineering" },
                  { id: "networking", label: "Networking & Systems", icon: Network, description: "Network engineering, sysadmin, infrastructure" },
                  { id: "web", label: "Web & Mobile Development", icon: Globe, description: "Frontend, backend, React, mobile apps" },
                  { id: "design", label: "UX/UI Design", icon: Palette, description: "Product design, user research, prototyping" },
                  { id: "other", label: "Other Technology Field", icon: Cpu, description: "Hardware, IoT, blockchain, or something else" },
                ]}
                selected={selections.field}
                onToggle={(id) => toggleMulti("field", id)}
                multi
              />
            )}

            {/* ─── STEP 2: ROLE ─── */}
            {step === 2 && (
              <StepContent
                title="Which best describes you?"
                subtitle="This helps us show the right content."
                options={[
                  { id: "Student", label: "Student", icon: GraduationCap, description: "Currently studying or learning" },
                  { id: "Professional", label: "IT Professional", icon: Briefcase, description: "Working in tech or security" },
                  { id: "Educator", label: "Educator / Professor", icon: User, description: "Teaching at a university or institution" },
                  { id: "Researcher", label: "Researcher", icon: Code, description: "Academic or industry research" },
                ]}
                selected={selections.role ? [selections.role] : []}
                onToggle={(id) => setSingle("role", id)}
                multi={false}
              />
            )}

            {/* ─── STEP 3: EXPERIENCE (now field-specific) ─── */}
            {step === 3 && (
              <StepContent
                title={
                  <>
                    How many years of experience do you have in{" "}
                    <span className="text-[#7AD62A]">{selectedFieldName || "your field"}</span>?
                  </>
                }
                subtitle="Select one option"
                options={[
                  { id: "None", label: "None / 0 years (Entry Level)", icon: Rocket, description: "Just getting started — brand new to this" },
                  { id: "1-2", label: "1-2 years (Junior Level)", icon: Zap, description: "Some experience — completed courses or projects" },
                  { id: "3-5", label: "3-5 years (Mid Level)", icon: Target, description: "Solid foundation — comfortable with core tools" },
                  { id: "5+", label: "5+ years (Senior/Architect Level)", icon: Award, description: "Experienced professional — looking for advanced challenges" },
                ]}
                selected={selections.experience ? [selections.experience] : []}
                onToggle={(id) => setSingle("experience", id)}
                multi={false}
              />
            )}

            {/* ─── STEP 4: SKILLS ─── */}
            {step === 4 && (
              <StepContent
                title="What skills do you want to develop?"
                subtitle="Select multiple — we'll recommend labs and courses."
                options={[
                  { id: "fullstack", label: "Full-Stack Development", icon: Code, description: "React, Node.js, databases, API design" },
                  { id: "cloud", label: "Cloud & Infrastructure", icon: Cloud, description: "AWS, Azure, GCP, Terraform, IaC" },
                  { id: "containers", label: "Containers & Kubernetes", icon: Server, description: "Docker, K8s, orchestration, microservices" },
                  { id: "data-eng", label: "Data Engineering", icon: Database, description: "Pipelines, ETL, data warehousing, SQL" },
                  { id: "ml-ops", label: "AI & Machine Learning", icon: Brain, description: "Model training, deployment, MLOps" },
                  { id: "cicd", label: "CI/CD & Automation", icon: Terminal, description: "GitHub Actions, Jenkins, pipeline design" },
                  { id: "networking", label: "Networking & Systems", icon: Network, description: "TCP/IP, Linux admin, system design" },
                  { id: "cybersecurity", label: "Security & Compliance", icon: Shield, description: "AppSec, cloud security, compliance frameworks" },
                  { id: "mobile", label: "Mobile Development", icon: Smartphone, description: "React Native, Flutter, iOS/Android" },
                  { id: "design", label: "UX/UI Design", icon: Palette, description: "Figma, user research, design systems" },
                ]}
                selected={selections.skills}
                onToggle={(id) => toggleMulti("skills", id)}
                multi
              />
            )}

            {/* ─── STEP 5: JOB INTERESTS ─── */}
            {step === 5 && (
              <StepContent
                title="Are you open to job opportunities?"
                subtitle="Select one preference."
                options={[
                  { id: "yes", label: "Yes, I'm open to exploring new job opportunities", icon: Briefcase, description: "Recruiters can contact you. You'll be in the talent pool." },
                  { id: "no", label: "No, I'm not open to new job opportunities", icon: Lock, description: "Focus on learning without recruitment outreach" },
                ]}
                selected={selections.jobInterests}
                onToggle={(id) => {
                  setSelections((prev) => ({ ...prev, jobInterests: [id] }));
                }}
                multi={false}
              />
            )}

            {/* ─── STEP 6: FINISH ─── */}
            {step === 6 && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={36} className="text-[#7AD62A]" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                  You&apos;re all set!
                </h1>
                <p className="text-base text-white/50 mb-8 max-w-md mx-auto">
                  Your learning dashboard is ready. We&apos;ve personalized your experience based on your selections.
                </p>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] disabled:opacity-40 text-[#0F203A] text-sm font-bold transition-colors"
                >
                  {loading ? "Saving..." : "Enter Dashboard"}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom navigation */}
        {step >= 0 && step < 6 && (
          <div className="flex items-center justify-between px-6 lg:px-10 py-5 border-t border-white/5">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : setStep(-1)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-8 bg-[#7AD62A]" : i < step ? "w-3 bg-[#7AD62A]/60" : "w-3 bg-white/10"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => canNext() && setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F203A] text-sm font-semibold transition-colors"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Right — Sidebar: Incentive + Progress + Testimonial */}
      <div className="hidden xl:flex w-80 bg-[#0d1d35] border-l border-white/5 flex-col px-8 py-10 gap-8">
        {/* Incentive card */}
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#7AD62A]/10 flex items-center justify-center mx-auto mb-3">
            <FlaskConical size={24} className="text-[#7AD62A]" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Personalize your experience</h3>
          <p className="text-xs text-white/50 leading-relaxed mb-4">
            Your selections help us recommend the right courses, labs, and assessment path without dropping you into a crowded dashboard.
          </p>
          <div className="flex items-center gap-2 justify-center bg-white/[0.04] rounded-lg px-3 py-2">
            <BookOpen size={14} className="text-[#7AD62A]" />
            <span className="text-xs font-semibold text-white">
              {completedSteps}/6 steps completed
            </span>
          </div>
        </div>

        {/* Progress circle */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width="108" height="108" viewBox="0 0 108 108">
              <circle cx="54" cy="54" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="54" cy="54" r="44" fill="none"                 stroke="#7AD62A" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
                transform="rotate(-90 54 54)" className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{completedSteps}</span>
              <span className="text-xs text-white/40">/ 6</span>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="text-center">
          <p className="text-sm text-white/70 italic leading-relaxed mb-4">
            &ldquo;{currentTestimonial.quote}&rdquo;
          </p>
          <p className="text-xs font-semibold text-white">{currentTestimonial.author}</p>
          <p className="text-xs text-white/40">{currentTestimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

/* --- StepContent sub-component --- */

function StepContent({
  title,
  subtitle,
  options,
  selected,
  onToggle,
  multi,
}: {
  title: React.ReactNode;
  subtitle: string;
  options: { id: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; description: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  multi: boolean;
}) {
  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-white/50 mb-8">{subtitle}</p>

      <div className="grid gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 group ${
                isSelected
                  ? "border-[#7AD62A] bg-[#7AD62A]/10"
                  : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? "bg-[#7AD62A]/20" : "bg-white/5 group-hover:bg-white/8"
              }`}>
                <Icon size={20} className={isSelected ? "text-[#7AD62A]" : "text-white/50 group-hover:text-white/70"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-white/80"}`}>{opt.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{opt.description}</p>
              </div>
              {multi ? (
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? "border-[#7AD62A] bg-[#7AD62A]" : "border-white/20"
                }`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
              ) : (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? "border-[#7AD62A] bg-[#7AD62A]" : "border-white/20"
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#0f172a]" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
