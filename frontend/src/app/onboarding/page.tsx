"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Eye,
  Bug,
  Terminal,
  Globe,
  ArrowRight,
  Check,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

const ONBOARDING_KEY = "onboardingComplete";

const testimonials = [
  {
    quote: "XpertClass turned me from a complete beginner into a confident SOC analyst in 6 months.",
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
];

type Selections = {
  purpose: string[];
  field: string[];
  role: string;
  experience: string;
  skills: string[];
  jobInterests: string[];
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({
    purpose: [],
    field: [],
    role: "",
    experience: "",
    skills: [],
    jobInterests: [],
  });
  const [loading, setLoading] = useState(false);
  const totalSteps = 6;

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
        }),
      });

      localStorage.setItem(ONBOARDING_KEY, "true");
      localStorage.setItem("onboardingSelections", JSON.stringify(selections));
      router.push("/dashboard");
    } catch {
      localStorage.setItem(ONBOARDING_KEY, "true");
      localStorage.setItem("onboardingSelections", JSON.stringify(selections));
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    router.push("/dashboard");
  };

  const currentTestimonial = testimonials[step % testimonials.length];

  const progressPercent = ((step + 1) / totalSteps) * 100;
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#0a1628] flex">
      {/* Left — Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 lg:px-10 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#229C62] flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">XpertClass</span>
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
            {step === 0 && (
              <StepContent
                title="What brings you to XpertClass?"
                subtitle="Select all that apply. We'll tailor your experience."
                options={[
                  { id: "learn", label: "Learn cybersecurity skills", icon: GraduationCap, description: "Hands-on labs and courses to build real skills" },
                  { id: "teach", label: "Teach or mentor others", icon: Briefcase, description: "Create courses, manage students, build curricula" },
                  { id: "certify", label: "Earn certifications", icon: Award, description: "Industry-recognized credentials for your career" },
                  { id: "compete", label: "Compete and climb rankings", icon: Target, description: "Leaderboards, challenges, and CTF events" },
                  { id: "team", label: "Train my team", icon: Users, description: "Enterprise training with progress tracking" },
                ]}
                selected={selections.purpose}
                onToggle={(id) => toggleMulti("purpose", id)}
                multi
              />
            )}

            {step === 1 && (
              <StepContent
                title="What field interests you?"
                subtitle="Choose the domains you want to explore."
                options={[
                  { id: "cybersecurity", label: "Cybersecurity", icon: Shield, description: "Offensive & defensive security operations" },
                  { id: "cloud", label: "Cloud Security", icon: Cloud, description: "AWS, Azure, GCP security configurations" },
                  { id: "devops", label: "DevSecOps", icon: Terminal, description: "CI/CD pipelines, container security, IaC" },
                  { id: "networking", label: "Network Security", icon: Network, description: "Firewalls, IDS/IPS, traffic analysis" },
                  { id: "forensics", label: "Digital Forensics", icon: Eye, description: "Incident response, malware analysis,取证" },
                  { id: "web", label: "Web Application Security", icon: Globe, description: "OWASP Top 10, API security, app pentesting" },
                ]}
                selected={selections.field}
                onToggle={(id) => toggleMulti("field", id)}
                multi
              />
            )}

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

            {step === 3 && (
              <StepContent
                title="What's your experience level?"
                subtitle="Be honest — we'll adjust difficulty recommendations."
                options={[
                  { id: "Beginner", label: "Beginner", icon: Rocket, description: "New to cybersecurity — starting from scratch" },
                  { id: "Intermediate", label: "Intermediate", icon: Zap, description: "Some experience — completed basic courses" },
                  { id: "Advanced", label: "Advanced", icon: Target, description: "Solid foundation — comfortable with tools" },
                  { id: "Expert", label: "Expert", icon: Award, description: "Experienced professional — looking for challenges" },
                ]}
                selected={selections.experience ? [selections.experience] : []}
                onToggle={(id) => setSingle("experience", id)}
                multi={false}
              />
            )}

            {step === 4 && (
              <StepContent
                title="What skills do you want to develop?"
                subtitle="Select multiple — we'll recommend labs and courses."
                options={[
                  { id: "pentesting", label: "Penetration Testing", icon: Bug, description: "Ethical hacking, exploitation, post-exploitation" },
                  { id: "defensive", label: "Defensive Security", icon: Lock, description: "SOC operations, SIEM, threat detection" },
                  { id: "cloud-sec", label: "Cloud Security", icon: Cloud, description: "IAM, networking, storage security in cloud" },
                  { id: "crypto", label: "Cryptography", icon: Database, description: "Encryption, hashing, PKI, certificates" },
                  { id: "scripting", label: "Security Scripting", icon: Code, description: "Python, Bash, PowerShell for security" },
                  { id: "forensics-skill", label: "Forensics & IR", icon: Eye, description: "Incident response, log analysis,取证" },
                ]}
                selected={selections.skills}
                onToggle={(id) => toggleMulti("skills", id)}
                multi
              />
            )}

            {step === 5 && (
              <StepContent
                title="Any specific career interests?"
                subtitle="We'll surface relevant courses and certification paths."
                options={[
                  { id: "soc", label: "SOC Analyst", icon: Shield, description: "Monitor, detect, and respond to threats" },
                  { id: "pentester", label: "Penetration Tester", icon: Bug, description: "Find and exploit vulnerabilities" },
                  { id: "cloud-eng", label: "Cloud Security Engineer", icon: Cloud, description: "Secure cloud infrastructure" },
                  { id: "devsecops", label: "DevSecOps Engineer", icon: Terminal, description: "Integrate security into CI/CD" },
                  { id: "forensics-eng", label: "Digital Forensics Analyst", icon: Eye, description: "Investigate security incidents" },
                  { id: "security-arch", label: "Security Architect", icon: Server, description: "Design secure systems and networks" },
                ]}
                selected={selections.jobInterests}
                onToggle={(id) => toggleMulti("jobInterests", id)}
                multi
              />
            )}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between px-6 lg:px-10 py-5 border-t border-white/5">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-[#229C62]" : i < step ? "w-3 bg-[#229C62]/60" : "w-3 bg-white/10"
                }`}
              />
            ))}
          </div>

          {step < totalSteps - 1 ? (
            <button
              onClick={() => canNext() && setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#229C62] hover:bg-[#1d8a56] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canNext() || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F203A] text-sm font-bold transition-colors"
            >
              {loading ? "Saving..." : "Get Started"}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Right — Progress & Testimonial sidebar */}
      <div className="hidden xl:flex w-80 bg-[#0d1d35] border-l border-white/5 flex-col items-center justify-center px-8 py-10 gap-10">
        {/* Progress circle */}
        <div className="relative">
          <svg width="108" height="108" viewBox="0 0 108 108">
            <circle cx="54" cy="54" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="54" cy="54" r="44" fill="none" stroke="#229C62" strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
              transform="rotate(-90 54 54)" className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{step + 1}</span>
            <span className="text-xs text-white/40">/ {totalSteps}</span>
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
  title: string;
  subtitle: string;
  options: { id: string; label: string; icon: any; description: string }[];
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
                  ? "border-[#229C62] bg-[#229C62]/10"
                  : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? "bg-[#229C62]/20" : "bg-white/5 group-hover:bg-white/8"
              }`}>
                <Icon size={20} className={isSelected ? "text-[#229C62]" : "text-white/50 group-hover:text-white/70"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-white/80"}`}>{opt.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{opt.description}</p>
              </div>
              {multi ? (
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? "border-[#229C62] bg-[#229C62]" : "border-white/20"
                }`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
              ) : (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? "border-[#229C62] bg-[#229C62]" : "border-white/20"
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Users({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
