"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Shield, Target, Microscope, ArrowRight, CheckCircle2, Play,
  Terminal, Users, BookOpen, Award, Server, Code, Network, Layers, BarChart3,
  Calendar, Clock, Video, UserCheck, ChevronRight, Zap, Lock
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import SkillFusionLab from "@/components/SkillFusionLab";
import HeroParticles from "@/components/HeroParticles";
import FloatingShapes from "@/components/FloatingShapes";
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import AngularDivider from "@/components/ui/AngularDivider";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";
import SectionLabel from "@/components/ui/SectionLabel";
import type { MasterClass, Trainer } from "@/types/api";

const AUDIENCES = [
  {
    tag: "For Students",
    title: "Launch your tech career with real skills",
    description: "Go beyond theory. Deploy real labs, crack real systems, and build a portfolio that gets you hired.",
    features: ["Hands-on labs with real tools", "Certified skill paths", "Leaderboard & gamification", "Career-ready portfolio"],
    cta: "Start Learning Free",
    href: "/get-started",
    icon: BookOpen,
    color: "emerald" as const,
  },
  {
    tag: "For Teams",
    title: "Scale security & DevOps skills across your org",
    description: "Custom learning paths, progress analytics, and sandbox environments built for enterprise readiness.",
    features: ["Custom learning paths", "Progress analytics dashboard", "Team leaderboards", "Isolated lab environments"],
    cta: "Request a Demo",
    href: "/get-started",
    icon: Users,
    color: "blue" as const,
  },
  {
    tag: "For Educators",
    title: "Teach with live, interactive environments",
    description: "Manage classrooms, track student progress, and deploy pre-built lab scenarios in one click.",
    features: ["Classroom management", "Assignment & grading tools", "30+ pre-built lab scenarios", "Student analytics"],
    cta: "Get Started",
    href: "/get-started",
    icon: Award,
    color: "violet" as const,
  },
];

const LEARNING_PATHS = [
  {
    tab: "Security",
    icon: Shield,
    title: "Master Product Security",
    description: "From OWASP Top 10 to advanced threat modeling. Learn to secure the entire software lifecycle.",
    courses: [
      { name: "Product Security Architecture & SDL", lessons: 3, level: "Advanced" },
      { name: "Advanced Web Vulnerabilities", lessons: 5, level: "Intermediate" },
      { name: "Advanced API & XML Security", lessons: 5, level: "Advanced" },
      { name: "Professional Security Operations", lessons: 4, level: "Intermediate" },
    ],
    labHighlight: "5 Security Labs: DVWA, Juice Shop, WebGoat, NodeGoat, vAPI",
  },
  {
    tab: "Linux & DevOps",
    icon: Terminal,
    title: "From Zero to Linux & DevOps Pro",
    description: "Master the command line, automate with Ansible, containerize with Docker, and orchestrate with Kubernetes.",
    courses: [
      { name: "Linux Fundamentals: Zero to CLI Hero", lessons: 5, level: "Beginner" },
      { name: "Web Server Administration", lessons: 6, level: "Intermediate" },
      { name: "Linux Kernel & System Internals", lessons: 7, level: "Advanced" },
      { name: "Containerization & DevOps", lessons: 8, level: "Intermediate" },
    ],
    labHighlight: "18 Linux Labs: Ubuntu, Debian, Docker, Kubernetes, Ansible",
  },
  {
    tab: "Networking",
    icon: Network,
    title: "Network Security & Infrastructure",
    description: "Build firewalls, configure VPNs, deploy IDS/IPS, and master network diagnostics from the ground up.",
    courses: [
      { name: "Networking & Security", lessons: 8, level: "Intermediate" },
      { name: "Linux Kernel & System Internals", lessons: 7, level: "Advanced" },
    ],
    labHighlight: "5 Network Labs: Firewalls, VPNs, IDS/IPS, Pentesting",
  },
  {
    tab: "All Courses",
    icon: Layers,
    title: "Browse the Full Catalog",
    description: "9 structured courses with 50+ lessons, quizzes, and linked hands-on labs.",
    courses: [
      { name: "Product Security Architecture & SDL", lessons: 3, level: "Advanced" },
      { name: "Advanced Web Vulnerabilities", lessons: 5, level: "Intermediate" },
      { name: "Linux Fundamentals: Zero to CLI Hero", lessons: 5, level: "Beginner" },
      { name: "Containerization & DevOps", lessons: 8, level: "Intermediate" },
    ],
    labHighlight: "37 Hands-on Labs across all disciplines",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Choose Your Path",
    description: "Pick a structured course or dive straight into hands-on labs. Whether you are a beginner or advanced, there is a path for you.",
    icon: Target,
  },
  {
    number: "02",
    title: "Deploy & Practice",
    description: "Launch isolated Docker sandbox environments in seconds. Practice on real tools with no setup required.",
    icon: Terminal,
  },
  {
    number: "03",
    title: "Earn & Advance",
    description: "Complete challenges, earn XP, climb the leaderboard, and earn certifications recognized by the industry.",
    icon: Award,
  },
];

const FEATURES = [
  { icon: Terminal, title: "Real-Time Terminal", description: "Full SSH terminal access to lab environments. Run real commands on real systems, not simulations." },
  { icon: Server, title: "Docker Sandboxes", description: "Each lab runs in an isolated container. Spin up vulnerable apps, break them, learn from them safely." },
  { icon: BarChart3, title: "Progress Analytics", description: "Track your learning with XP, rankings, and division tiers. See exactly where you stand." },
  { icon: Users, title: "Team Collaboration", description: "Form squads, compete on leaderboards, and tackle challenges together. Security is a team sport." },
  { icon: Code, title: "Structured Curriculum", description: "50+ lessons with deep technical content, quizzes, and lab-linked practice. No fluff, just skills." },
  { icon: Award, title: "Skill Certifications", description: "Earn verified certifications for completing skill paths. Prove your expertise to employers." },
];

const TESTIMONIALS = [
  { quote: "XpertClass gave me the hands-on experience I could not get from textbooks. The Docker labs let me practice real attacks in a safe environment.", name: "Amadou T.", role: "Security Engineer, Garoua" },
  { quote: "The Linux curriculum is the best I have seen. It goes from basic commands all the way to kernel internals and Kubernetes.", name: "Fabiola S.", role: "DevOps Intern, Douala" },
  { quote: "As a university instructor, the platform lets me deploy labs for my students without any infrastructure headaches. Game changer.", name: "Dr. Moussa C.", role: "CS Faculty, Maroua" },
];

const COLOR_MAP = {
  emerald: { bg: "bg-[#E9F8EE]", border: "border-[#229C62]/20", text: "text-[#0F203A]", icon: "text-[#229C62] bg-[#E9F8EE]", dot: "bg-[#229C62]" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-600 bg-blue-100", dot: "bg-blue-500" },
  violet: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", icon: "text-violet-600 bg-violet-100", dot: "bg-violet-500" },
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-[#E9F8EE] text-[#0F203A] border-[#229C62]/20",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-red-50 text-red-700 border-red-200",
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0, totalCourses: 0, totalLabs: 0 });
  const [masterClasses, setMasterClasses] = useState<MasterClass[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const { convert, config: currencyConfig } = useCurrency();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchApi("/dashboard/public-stats")
      .then((data) => {
        if (data && typeof data === "object" && !Array.isArray(data)) setStats(data);
      })
      .catch(() => {});
    fetchApi("/master-classes?status=UPCOMING&limit=3")
      .then((data) => setMasterClasses(Array.isArray(data) ? data : data.data || []))
      .catch(() => {});
    fetchApi("/training/trainers")
      .then((data) => setTrainers(Array.isArray(data) ? data.slice(0, 3) : data.data?.slice(0, 3) || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#229C62] focus:text-white focus:rounded-xl focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md border-b-2 border-[#229C62]/30 shadow-sm" : "bg-transparent border-b border-white/10"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8" />
              <span className="text-lg font-bold tracking-tight">
                <span className={scrolled ? "text-[#0F203A]" : "text-white"}>Xpert</span><span className="text-[#229C62]">Class</span>
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-1">
              {["Platform", "Courses", "Labs", "Master Classes", "Training", "Enterprise"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className={`px-3 py-2 text-sm font-medium transition-all ${scrolled ? "text-slate-500 hover:text-[#229C62] hover:bg-[#E9F8EE]/50" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CurrencySwitcher />
            <Link href="/login" className={`hidden sm:inline-flex btn-ghost text-sm ${scrolled ? "" : "text-white/80 hover:text-white"}`}>Sign in</Link>
            <Link href="/get-started" className="angular-btn btn-primary text-sm px-5 py-2">
              <span>Get Started</span> <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section id="main-content" className="pt-32 pb-24 px-6 relative overflow-hidden bg-[#0F203A]">
        <HeroParticles />
        <FloatingShapes />
        <div className="absolute inset-0 angular-grid-bg opacity-[0.04]" />
        <div className="absolute inset-0 scanline-overlay opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <div className="lg:pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[#7AD62A] text-xs font-semibold mb-6 label-tracking">
                <CheckCircle2 size={14} />
                Built for hands-on learners
              </div>
              <h1 className="text-6xl sm:text-7xl lg:text-[80px] font-extrabold text-white tracking-tight leading-[1.02] glitch-hover">
                Master the <span className="text-gradient-brand">technologies</span> that power modern software
              </h1>
              <p className="text-lg text-white/60 mt-6 leading-relaxed max-w-xl">
                Hands-on training in security, Linux, DevOps, and cloud infrastructure. Deploy real labs, break real systems, build real skills.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4 mt-10">
                <Link href="/get-started" className="angular-btn btn-primary text-base px-10 py-4 font-semibold shadow-lg shadow-[#229C62]/20 hover:shadow-[#229C62]/40 magnetic-btn">
                  <span>Start Learning Free</span> <ArrowRight size={18} />
                </Link>
                <a href="#labs" className="btn-ghost text-sm px-6 py-3.5 text-white/60 hover:text-white">
                  <Play size={14} /> Explore Labs
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-white/40">
                {["No credit card required", `${stats.totalLabs || 37}+ hands-on labs`, "Free tier available"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#7AD62A]" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block lg:-ml-12">
              <div className="absolute -inset-6 bg-gradient-to-br from-[#229C62]/20 via-[#7AD62A]/10 to-transparent clip-path-trapezoid blur-xl" />
              <div className="bg-[#0d1117] angular-card p-6 font-mono text-sm overflow-hidden border border-slate-700/50 shadow-2xl relative z-10 w-[440px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  <span className="text-slate-500 ml-2 text-xs">student@aero-lab ~ $</span>
                </div>
                <div className="space-y-2 text-emerald-400/70">
                  <div><span className="text-slate-500">$</span> docker ps</div>
                  <div className="text-slate-300">CONTAINER ID  IMAGE          STATUS   PORTS</div>
                  <div className="text-slate-300">a3f2b1c       dvwa:latest    Up 2m    0.0.0.0:8080-&gt;80</div>
                  <div className="mt-3"><span className="text-slate-500">$</span> sqlmap -u &quot;http://localhost:8080/?id=1&quot; --dbs</div>
                  <div className="text-amber-400/80">[*] testing connection to target URL</div>
                  <div className="text-amber-400/80">[+] available databases [3]:</div>
                  <div className="text-white/90 ml-4">dvwa</div>
                  <div className="text-white/90 ml-4">information_schema</div>
                  <div className="text-white/90 ml-4">mysql</div>
                  <div className="mt-3"><span className="text-slate-500">$</span> <span className="animate-pulse">_</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="py-10 px-6 bg-[#0a1628] border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 angular-grid-bg opacity-[0.03]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: stats.totalStudents ? `${stats.totalStudents}+` : "7+", label: "Engineers Training", icon: Users },
              { value: stats.totalLabs ? `${stats.totalLabs}+` : "35+", label: "Hands-on Labs", icon: Terminal },
              { value: stats.totalCourses || "7", label: "Expert Courses", icon: BookOpen },
              { value: "95%", label: "Completion Rate", icon: Award },
            ].map((s, i) => (
              <div key={s.label} className={`text-center animate-fade-in-up animate-delay-${i + 1}`}>
                <s.icon size={22} className="text-[#7AD62A] mx-auto mb-3" />
                <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{s.value}</div>
                <div className="text-xs text-white/40 mt-2 label-tracking">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TRUSTED BY ═══════════ */}
      <section className="py-8 px-6 bg-[#0a1628] border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[10px] text-white/30 font-semibold tracking-[0.25em] uppercase mb-5">Trusted by engineers at</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-white/40">
            <span className="hover:text-white/70 transition-colors">University of Yaoundé</span>
            <span className="text-white/10">|</span>
            <span className="hover:text-white/70 transition-colors">ENS Yaoundé</span>
            <span className="text-white/10">|</span>
            <span className="hover:text-white/70 transition-colors">Digital Cameroon</span>
            <span className="text-white/10">|</span>
            <span className="hover:text-white/70 transition-colors">Cameroon Tech Hub</span>
            <span className="text-white/10">|</span>
            <span className="hover:text-white/70 transition-colors">Garoua Innovation Hub</span>
          </div>
        </div>
      </section>

      <AngularDivider />

      {/* ═══════════ SKILL FUSION LAB ═══════════ */}
      <SkillFusionLab />

      <AngularDivider />

      {/* ═══════════ AUDIENCE SEGMENTATION ═══════════ */}
      <section id="enterprise" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 angular-grid-bg" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="label-tracking text-[#229C62] mb-4 block">Who it&apos;s for</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Built for every learner</h2>
            <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">Whether you are a student, a team lead, or an educator, there is a path designed for you.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {AUDIENCES.map((audience) => {
              const colors = COLOR_MAP[audience.color];
              return (
                <div key={audience.tag} className="angular-card relative bg-white p-8 border border-slate-200/80 hover-glow transition-all duration-300 group overflow-hidden hover-lift">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.border} ${colors.text} text-xs font-semibold mb-6 relative z-10`}>
                    <audience.icon size={14} />
                    {audience.tag}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10 leading-tight group-hover:text-[#229C62] transition-colors">{audience.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 relative z-10">{audience.description}</p>
                  <ul className="space-y-3 mb-8 relative z-10">
                    {audience.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 size={16} className="text-[#229C62] shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={audience.href} className="relative z-10 angular-btn btn-primary text-sm w-full justify-center">
                    <span>{audience.cta}</span> <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AngularDivider />

      {/* ═══════════ LEARNING PATHS (TABBED) ═══════════ */}
      <section id="courses" className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="label-tracking text-[#229C62] mb-4 block">Curriculum</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">What you will learn</h2>
            <p className="text-lg text-slate-500 mt-4">Structured learning paths from fundamentals to advanced topics.</p>
          </div>
          <div className="flex justify-center border-b border-slate-200 mb-10">
            {LEARNING_PATHS.map((path, i) => (
              <button
                key={path.tab}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === i ? "border-[#229C62] text-[#229C62]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <path.icon size={16} /> {path.tab}
              </button>
            ))}
          </div>
          <div className="bg-white angular-card border border-slate-200/80 p-8 md:p-10 hover-lift">
            <div className="grid lg:grid-cols-2 gap-10">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{LEARNING_PATHS[activeTab].title}</h3>
                <p className="text-slate-500 leading-relaxed mb-6">{LEARNING_PATHS[activeTab].description}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E9F8EE] border border-[#229C62]/20 text-[#0F203A] text-xs font-semibold mb-8">
                  <Microscope size={14} /> {LEARNING_PATHS[activeTab].labHighlight}
                </div>
                <div>
                  <Link href="/register" className="angular-btn btn-primary text-sm">
                    <span>Explore This Path</span> <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                {LEARNING_PATHS[activeTab].courses.map((course) => (
                  <div key={course.name} className="flex items-center justify-between p-4 angular-card border border-slate-200/80 hover:border-[#229C62]/30 hover:bg-[#E9F8EE]/30 hover:shadow-sm transition-all duration-200">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{course.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{course.lessons} lessons</div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 hex-badge border ${LEVEL_COLORS[course.level] || ""}`}>{course.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AngularDivider />

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-28 px-6 relative overflow-hidden scanline-overlay">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F203A] via-[#162a45] to-[#0F203A]" />
        <div className="absolute inset-0 angular-grid-bg" />
        <NoiseOverlay opacity={0.025} />
        <FloatingShapes className="opacity-40" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="label-tracking text-[#7AD62A] mb-4 block">Process</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight text-stroke-white">How it works</h2>
            <p className="text-lg text-white/60 mt-4">From sign-up to skill mastery in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                <div className="angular-card relative bg-white/[0.04] backdrop-blur-sm p-8 border border-white/[0.06] hover:border-[#229C62]/20 hover:bg-white/[0.06] transition-all duration-300 group">
                  <div className="text-6xl font-extrabold text-[#229C62]/10 absolute top-4 right-6 group-hover:text-[#229C62]/20 transition-colors">{step.number}</div>
                  <div className="w-16 h-16 angular-card bg-gradient-to-br from-[#229C62] to-[#1a8a55] flex items-center justify-center mb-6 shadow-lg shadow-[#229C62]/20 group-hover-rotate relative z-10">
                    <step.icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2 mb-3 relative z-10">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed relative z-10">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AngularDivider />

      {/* PLATFORM FEATURES */}
      <section id="platform" className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="label-tracking text-[#229C62] mb-4 block">Capabilities</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">The platform built for real skills</h2>
            <p className="text-lg text-slate-500 mt-4">Everything you need to learn, practice, and prove your expertise.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={feature.title} className={`angular-card bg-white p-8 border border-slate-200/80 hover-glow transition-all duration-300 group hover-lift animate-fade-in-up animate-delay-${i + 1}`}>
                <div className="w-12 h-12 angular-card bg-gradient-to-br from-[#229C62] to-[#1a8a55] flex items-center justify-center mb-5 shadow-md shadow-[#229C62]/15 group-hover-rotate">
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#229C62] transition-colors">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AngularDivider />

      {/* LAB SHOWCASE */}
      <section id="labs" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E9F8EE]/20 via-white to-blue-50/20" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 hex-badge bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
                <Terminal size={14} /> Hands-on Labs
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                Deploy your first lab in <span className="text-[#229C62]">30 seconds</span>
              </h2>
              <p className="text-lg text-slate-500 mt-5 leading-relaxed">
                Each lab spins up an isolated Docker container with a real terminal. No virtual machines, no complicated setup.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Real terminal access with SSH",
                  "Isolated Docker containers per user",
                  "Automatic expiration and cleanup",
                  "Flag-based progress tracking",
                  "Pre-configured vulnerable applications",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-[#229C62] shrink-0" /> {item}
                  </div>
                ))}
              </div>
              <Link href="/register" className="btn-primary text-sm mt-10 px-8 py-3.5">
                Try a Lab Now <ArrowRight size={14} />
              </Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-[#229C62]/20 via-[#7AD62A]/10 to-transparent clip-path-trapezoid blur-xl" />
              <div className="bg-[#0d1117] angular-card p-6 font-mono text-sm overflow-hidden border border-slate-700/50 shadow-2xl relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  <span className="text-slate-500 ml-2 text-xs">student@aero-lab ~ $</span>
                </div>
                <div className="space-y-2 text-emerald-400/70">
                  <div><span className="text-slate-500">$</span> docker ps</div>
                  <div className="text-slate-300">CONTAINER ID  IMAGE          STATUS   PORTS</div>
                  <div className="text-slate-300">a3f2b1c       dvwa:latest    Up 2m    0.0.0.0:8080-&gt;80</div>
                  <div className="mt-3"><span className="text-slate-500">$</span> sqlmap -u &quot;http://localhost:8080/?id=1&quot; --dbs</div>
                  <div className="text-amber-400/80">[*] testing connection to target URL</div>
                  <div className="text-amber-400/80">[+] available databases [3]:</div>
                  <div className="text-white/90 ml-4">dvwa</div>
                  <div className="text-white/90 ml-4">information_schema</div>
                  <div className="text-white/90 ml-4">mysql</div>
                  <div className="mt-3"><span className="text-slate-500">$</span> <span className="animate-pulse">_</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AngularDivider />

      {/* ═══════════ MASTER CLASSES ═══════════ */}
      <section id="master-classes" className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="label-tracking text-violet-600 mb-4 block">Live + Recorded</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Master Classes</h2>
              <p className="text-lg text-slate-500 mt-3">Learn from expert instructors in live sessions. Can&apos;t make it? Watch the recording.</p>
            </div>
            <Link href="/dashboard/master-classes" className="btn-ghost text-sm mt-4 md:mt-0 text-[#229C62] hover:text-[#1a8a55]">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {masterClasses.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              {masterClasses.map((mc: MasterClass, i) => (
                <div key={mc.id} className={`angular-card bg-white border border-slate-200/80 overflow-hidden hover-lift transition-all duration-300 group animate-fade-in-up animate-delay-${i + 1}`}>
                  <div className="h-44 bg-gradient-to-br from-[#0F203A] to-[#229C62] flex items-center justify-center relative">
                    <Video size={40} className="text-white/70" />
                    {mc.status === "LIVE" && (
                      <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-xs font-bold hex-badge animate-pulse-glow">
                        <span className="w-2 h-2 bg-white rounded-full" /> LIVE
                      </span>
                    )}
                    {mc.recordingUrl && (
                      <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 text-white text-xs font-medium hex-badge backdrop-blur-sm">
                        <Play size={12} /> Recorded
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-violet-600 font-semibold mb-2">{mc.category || "Security"}</div>
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-[#229C62] transition-colors leading-tight">{mc.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">{mc.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {mc.instructorName && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#E9F8EE] text-[#0F203A] text-[10px] font-bold flex items-center justify-center">{mc.instructorName.charAt(0)}</span>
                          {mc.instructorName}
                        </span>
                      )}
                      {mc.scheduledAt && (
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(mc.scheduledAt).toLocaleDateString()}</span>
                      )}
                      {mc.duration && (
                        <span className="flex items-center gap-1"><Clock size={12} /> {mc.duration}min</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AngularDivider />

      {/* ═══════════ 1-ON-1 TRAINING ═══════════ */}
      <section id="training" className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="label-tracking text-amber-600 mb-4 block">1-on-1 Sessions</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Personal Training</h2>
              <p className="text-lg text-slate-500 mt-3">Book private sessions with expert trainers. Tailored to your goals and schedule.</p>
            </div>
            <Link href="/dashboard/training" className="btn-ghost text-sm mt-4 md:mt-0 text-[#229C62] hover:text-[#1a8a55]">
              Browse Trainers <ChevronRight size={14} />
            </Link>
          </div>
          {trainers.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              {trainers.map((trainer: Trainer, i) => (
                <Link key={trainer.id} href={`/dashboard/training/${trainer.id}`} className={`angular-card bg-white p-6 border border-slate-200/80 hover-lift transition-all duration-300 group animate-fade-in-up animate-delay-${i + 1}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#E9F8EE] flex items-center justify-center text-[#0F203A] font-bold text-lg">
                      {(trainer.user?.name || "T").charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-[#229C62] transition-colors">{trainer.user?.name}</div>
                      <div className="text-xs text-slate-400">{trainer.specialties?.join(", ") || "Security, Linux"}</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{trainer.bio || "Expert trainer with years of hands-on experience."}</p>
                  <div className="flex items-center gap-1 text-[#229C62] text-sm font-medium">
                    Book a Session <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <AngularDivider />

      {/* TESTIMONIALS */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="label-tracking text-[#229C62] mb-4 block">Testimonials</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">What our learners say</h2>
            <p className="text-lg text-slate-500 mt-4">Real feedback from engineers building their skills on XpertClass.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`angular-card bg-white p-8 border border-slate-200/80 hover-lift transition-all duration-300 relative overflow-hidden animate-fade-in-up animate-delay-${i + 1}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#229C62] to-[#7AD62A]" />
                <p className="text-slate-600 text-sm leading-relaxed mb-6 pl-4">&quot;{t.quote}&quot;</p>
                <div className="pl-4">
                  <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AngularDivider />

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionLabel>Simple Pricing</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">Choose your plan</h2>
            <p className="text-lg text-slate-500 mt-4">Start free, upgrade when you are ready. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="angular-card bg-white p-8 border border-slate-200/80 hover-lift transition-all duration-300">
              <div className="mb-6">
                <span className="label-tracking text-slate-400 mb-2 block">Free</span>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold text-slate-900">{convert(0)}</span>
                  <span className="text-slate-500 mb-2">/mo</span>
                </div>
                <p className="text-slate-500 text-sm mt-3">Everything you need to get started</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["All courses", "Hands-on labs", "Community access", "Basic certifications"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-[#229C62] shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/get-started" className="angular-btn btn-ghost text-sm w-full justify-center border border-slate-200 hover:border-[#229C62] hover:text-[#229C62]">
                <span>Get Started Free</span>
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="angular-card bg-white p-8 border-2 border-[#229C62] hover-lift transition-all duration-300 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#229C62] text-white text-xs font-bold px-4 py-1.5 hex-badge shadow-lg shadow-[#229C62]/25">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <span className="label-tracking text-[#229C62] mb-2 block">Pro</span>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold text-slate-900">{convert(29)}</span>
                  <span className="text-slate-500 mb-2">/mo</span>
                </div>
                <p className="text-slate-500 text-sm mt-3">For serious practitioners</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["Everything in Free", "Priority lab access", "1-on-1 training sessions", "Advanced certifications", "Team analytics"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-[#229C62] shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/get-started" className="angular-btn btn-primary text-sm w-full justify-center shadow-lg shadow-[#229C62]/20 hover:shadow-[#229C62]/40">
                <span>Start Pro Trial</span> <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AngularDivider />

      {/* BIG STATS */}
      <section className="py-24 px-6 bg-[#0F203A] relative overflow-hidden scanline-overlay">
        <div className="absolute inset-0 angular-grid-bg" />
        <NoiseOverlay opacity={0.025} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: stats.totalCourses || "7", label: "Courses", icon: BookOpen },
              { value: stats.totalLabs ? `${stats.totalLabs}+` : "35+", label: "Labs", icon: Microscope },
              { value: "55+", label: "Lessons", icon: Code },
              { value: stats.totalStudents ? `${stats.totalStudents}+` : "7+", label: "Engineers", icon: Users },
            ].map((s, i) => (
              <div key={s.label} className={`angular-card bg-white/[0.04] backdrop-blur-sm p-6 border border-white/[0.06] hover:bg-white/[0.07] transition-all duration-300 group hover-lift animate-fade-in-up animate-delay-${i + 1}`}>
                <s.icon size={24} className="text-[#7AD62A] mx-auto mb-3 group-hover-rotate" />
                <div className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">{s.value}</div>
                <div className="text-white/60 text-sm mt-2 label-tracking">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AngularDivider color="#7AD62A" />

      {/* CTA */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0F203A]" />
        <div className="absolute inset-0 angular-grid-bg" />
        <NoiseOverlay opacity={0.02} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#229C62]/[0.12] clip-path-trapezoid blur-3xl" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight text-stroke-white">Ready to master the tech stack?</h2>
          <p className="text-lg text-white/60 mt-5 leading-relaxed max-w-xl mx-auto">
            Join hundreds of engineers learning security, Linux, DevOps, and cloud infrastructure through hands-on practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/get-started" className="angular-btn btn-primary text-base px-10 py-4 font-semibold shadow-lg shadow-[#229C62]/25 hover:shadow-[#229C62]/40 magnetic-btn">
              <span>Start Free Today</span> <ArrowRight size={18} />
            </Link>
            <a href="#courses" className="text-white/60 hover:text-white text-sm font-medium px-6 py-4 transition-colors">
              Browse Courses
            </a>
          </div>
          <p className="text-sm text-white/40 mt-5">No credit card required. Free tier available.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8" />
                <span className="text-lg font-bold text-slate-900 tracking-tight">XpertClass</span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                The platform for hands-on training in security, Linux, DevOps, and cloud infrastructure. Built for engineers, by engineers.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-xs text-slate-400">Built with</span>
                {["NestJS", "PostgreSQL", "Docker", "Next.js"].map((tech) => (
                  <span key={tech} className="text-xs bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded">{tech}</span>
                ))}
              </div>
            </div>
            {Object.entries({
              Platform: [
                { label: "Courses", href: "/dashboard/courses" },
                { label: "Labs", href: "/dashboard/labs" },
                { label: "Master Classes", href: "/dashboard/master-classes" },
                { label: "1-on-1 Training", href: "/dashboard/training" },
              ],
              Resources: [
                { label: "Linux Fundamentals", href: "/dashboard/courses" },
                { label: "Security Training", href: "/dashboard/courses" },
                { label: "DevOps Paths", href: "/dashboard/courses" },
                { label: "Documentation", href: "#" },
              ],
              Company: [
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "mailto:contact@xpertclass.academy" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ],
            }).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold text-slate-900 text-sm mb-4">{category}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("#") ? (
                        <a href={link.href} className="text-sm text-slate-500 hover:text-[#229C62] transition-colors">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-sm text-slate-500 hover:text-[#229C62] transition-colors">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-200/80 py-6 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>&copy; 2026 XpertClass. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
              <a href="mailto:contact@xpertclass.academy" className="hover:text-slate-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
