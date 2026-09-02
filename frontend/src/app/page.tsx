"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Shield, Target, Microscope, ArrowRight, CheckCircle2, Play,
  Terminal, Users, BookOpen, Award, Server, Code, Network, Layers, BarChart3,
  Calendar, Clock, Video, ChevronRight, Menu, X, Megaphone, HandHeart
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
    tag: "For Learners",
    title: "Build practical skill and trusted proof",
    description: "Start with guided learning, build real hands-on evidence, and work toward verifiable outcomes that matter beyond the platform.",
    features: ["Hands-on labs with real tools", "Certification-first learning paths", "Clear first-step onboarding", "Evidence you can show"],
    cta: "Start Free for 1 Year",
    href: "/register",
    icon: BookOpen,
    color: "emerald" as const,
  },
  {
    tag: "For Universities",
    title: "Run cohorts with academic structure and lab rigor",
    description: "Bring coursework, practical environments, grading visibility, and learner readiness into one academic delivery system.",
    features: ["Curricula and cohort structure", "Classroom lab control", "Academic records and gradebook", "Practical readiness tracking"],
    cta: "Explore University Route",
    href: "/get-started",
    icon: Users,
    color: "blue" as const,
  },
  {
    tag: "For Enterprises",
    title: "Identify and develop workforce-ready capability",
    description: "Use practical evidence, managed learning, and talent visibility to make more confident institutional decisions.",
    features: ["Managed learning paths", "Talent evidence and shortlisting", "Practical capability signals", "Institutional reporting workflows"],
    cta: "Explore Enterprise Route",
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

const NAV_ITEMS = [
  { label: "Platform", href: "#platform" },
  { label: "Courses", href: "#courses" },
  { label: "Labs", href: "#labs" },
  { label: "Programs", href: "/community" },
  { label: "University", href: "#enterprise" },
  { label: "Master Classes", href: "#master-classes" },
  { label: "Training", href: "#training" },
  { label: "Enterprise", href: "#enterprise" },
];

const TRUST_PILLARS = [
  {
    title: "Structured certification pathways",
    description: "Every credential is tied to defined domains, measurable outcomes, and a visible progression from training to assessment to issuance.",
    icon: Target,
  },
  {
    title: "Practical assessment evidence",
    description: "Learners earn certificates through hands-on work, scored attempts, and competency proof instead of passive course consumption alone.",
    icon: Shield,
  },
  {
    title: "Public verification",
    description: "Credentials can be checked through a verification page with issuer, issue date, status, and supporting evidence summary.",
    icon: Award,
  },
];

const CERTIFICATION_STEPS = [
  {
    step: "01",
    title: "Learn the standard",
    description: "Follow a mapped curriculum with the lessons, labs, and outcomes required for your target certificate.",
  },
  {
    step: "02",
    title: "Prove practical ability",
    description: "Complete guided labs and controlled practical exams with transparent scoring and attempt rules.",
  },
  {
    step: "03",
    title: "Verify your credential",
    description: "Share a credential ID that employers and partners can verify through the public registry.",
  },
];

const JOURNEY_CHECKPOINTS = [
  {
    title: "Start with the right path",
    description: "Choose learner or institutional access based on your goals, not on feature overload.",
  },
  {
    title: "Build measurable proof",
    description: "Complete structured courses and hands-on labs before moving into assessment and issuance.",
  },
  {
    title: "Earn a verifiable outcome",
    description: "Finish with a credential record that can be checked publicly through the registry flow.",
  },
];

const COLOR_MAP = {
  emerald: { bg: "bg-[#7AD62A]/10", border: "border-[#7AD62A]/20", text: "text-[#0F203A]", icon: "text-[#7AD62A] bg-[#7AD62A]/10", dot: "bg-[#7AD62A]" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-600 bg-blue-100", dot: "bg-blue-500" },
  violet: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", icon: "text-violet-600 bg-violet-500/10", dot: "bg-violet-500" },
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-[#7AD62A]/10 text-[#0F203A] border-[#7AD62A]/20",
  Intermediate: "bg-amber-500/10 text-amber-700 border-amber-200",
  Advanced: "bg-red-500/10 text-red-700 border-red-200",
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0, totalCourses: 0, totalLabs: 0, totalLessons: 0 });
  const [masterClasses, setMasterClasses] = useState<MasterClass[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const { convert } = useCurrency();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

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
    <div className="min-h-screen bg-[#0f172a]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#7AD62A] focus:text-white focus:rounded-xl focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md border-b-2 border-[#7AD62A]/30 shadow-sm" : "bg-transparent border-b border-white/10"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo-icon.svg" alt="XpertClass" width={32} height={32} className="w-8 h-8" priority />
              <span className="text-lg font-bold tracking-tight">
                <span className={scrolled ? "text-[#0F203A]" : "text-white"}>Xpert</span><span className="text-[#7AD62A]">Class</span>
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                item.href.startsWith("#") ? (
                  <a key={item.label} href={item.href} className={`px-3 py-2 text-sm font-medium transition-all ${scrolled ? "text-slate-600 hover:text-[#7AD62A] hover:bg-[#7AD62A]/10/50" : "text-white/75 hover:text-white hover:bg-white/10"}`}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} href={item.href} className={`px-3 py-2 text-sm font-medium transition-all ${scrolled ? "text-slate-600 hover:text-[#7AD62A] hover:bg-[#7AD62A]/10/50" : "text-white/75 hover:text-white hover:bg-white/10"}`}>
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <CurrencySwitcher />
            </div>
            <Link href="/login" className={`hidden sm:inline-flex btn-ghost text-sm ${scrolled ? "" : "text-white/80 hover:text-white"}`}>Sign in</Link>
            <Link href="/get-started" className="angular-btn btn-primary text-sm px-5 py-2">
              <span>Get Started</span> <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              className={`lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
                scrolled
                  ? "border-slate-200 text-slate-700 hover:bg-slate-100"
                  : "border-white/10 text-white hover:bg-white/10"
              }`}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div
            id="mobile-nav"
            className="lg:hidden border-t border-white/10 bg-[#0F203A]/95 backdrop-blur-xl"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-2">
              <div className="sm:hidden pb-2">
                <CurrencySwitcher />
              </div>
              {NAV_ITEMS.map((item) => (
                item.href.startsWith("#") ? (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="px-3 py-3 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="px-3 py-3 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {item.label}
                  </Link>
                )
              ))}
              <div className="flex gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex-1 inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#7AD62A] px-4 py-3 text-sm font-semibold text-[#0F203A] hover:bg-[#6bc422] transition-colors"
                >
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        )}
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
                1 year free for early learners
              </div>
              <h1 className="text-6xl sm:text-7xl lg:text-[80px] font-extrabold text-white tracking-tight leading-[1.02] glitch-hover">
                XpertClass <span className="text-gradient-brand">Platform</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200">
                An African-rooted, globally benchmarked training and certification system for security, Linux, DevOps, and cloud capability. Start free for 12 months, then prove what you can do.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4 mt-10">
                <Link href="/register" className="angular-btn btn-primary text-base px-10 py-4 font-semibold shadow-lg shadow-[#7AD62A]/20 hover:shadow-[#7AD62A]/40 magnetic-btn">
                  <span>Start Free for 1 Year</span> <ArrowRight size={18} />
                </Link>
                <Link href="/get-started" className="btn-ghost px-6 py-3.5 text-sm text-slate-200 hover:text-white">
                  <Play size={14} /> Choose Your Path
                </Link>
              </div>
              <div className="grid gap-3 mt-8 sm:grid-cols-3">
                {JOURNEY_CHECKPOINTS.map((checkpoint) => (
                  <div key={checkpoint.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Journey</p>
                    <h2 className="mt-2 text-sm font-semibold text-white">{checkpoint.title}</h2>
                    <p className="mt-2 text-xs leading-relaxed text-slate-200/90">{checkpoint.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-slate-100">
                <span className="font-semibold uppercase tracking-[0.18em] text-[#7AD62A]">Recommended flow</span>
                <span>Create account</span>
                <ChevronRight size={12} className="text-white/50" />
                <span>Personalize onboarding</span>
                <ChevronRight size={12} className="text-white/50" />
                <span>Start first pathway</span>
                <ChevronRight size={12} className="text-white/50" />
                <span>Build toward certification</span>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
                {["No credit card required", `${stats.totalLabs || 35}+ hands-on labs`, "12 months of free access"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#7AD62A]" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block lg:-ml-12">
              <div className="absolute -inset-6 bg-gradient-to-br from-[#7AD62A]/20 via-[#7AD62A]/10 to-transparent clip-path-trapezoid blur-xl" />
              <div className="bg-[#0d1117] angular-card p-6 font-mono text-sm overflow-hidden border border-slate-700/50 shadow-2xl relative z-10 w-[440px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  <span className="text-slate-500 ml-2 text-xs">student@aero-lab ~ $</span>
                </div>
                <div className="space-y-2 text-[#7AD62A]/70">
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
              { value: stats.totalLessons || "50+", label: "Video Lessons", icon: Award },
            ].map((s, i) => (
              <div key={s.label} className={`text-center animate-fade-in-up animate-delay-${i + 1}`}>
                <s.icon size={22} className="text-[#7AD62A] mx-auto mb-3" />
                <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{s.value}</div>
                <div className="mt-2 text-xs text-slate-300 label-tracking">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TRUSTED BY ═══════════ */}
      <section className="py-8 px-6 bg-[#0a1628] border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto text-center">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">Built for Cameroon&apos;s next generation of engineers</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-slate-200">
            <span className="transition-colors hover:text-white">University of Yaoundé</span>
            <span className="text-white/20">|</span>
            <span className="transition-colors hover:text-white">ENS Yaoundé</span>
            <span className="text-white/20">|</span>
            <span className="transition-colors hover:text-white">Digital Cameroon</span>
            <span className="text-white/20">|</span>
            <span className="transition-colors hover:text-white">Cameroon Tech Hub</span>
            <span className="text-white/20">|</span>
            <span className="transition-colors hover:text-white">Garoua Innovation Hub</span>
          </div>
        </div>
      </section>

      <AngularDivider />

      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <SectionLabel>Community</SectionLabel>
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Build the movement with us</h2>
              <p className="text-lg text-slate-400 mt-4 max-w-2xl">
                XpertClass grows best when credible people help learners start well, support local communities, and represent the platform with clarity.
              </p>
            </div>
            <Link href="/community" className="btn-ghost text-sm text-[#7AD62A] hover:text-[#6bc422]">
              Explore community programs <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Megaphone,
                title: "Brand ambassadors",
                text: "For students, alumni, and community builders who can introduce XpertClass in universities and local tech circles.",
              },
              {
                icon: HandHeart,
                title: "Volunteers",
                text: "For mentors and contributors who want to help with learner support, community sessions, and program momentum.",
              },
            ].map((item) => (
              <div key={item.title} className="angular-card bg-[#0f172a] border border-white/10/80 p-8">
                <item.icon size={20} className="text-[#7AD62A]" />
                <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.text}</p>
                <Link href={item.title === "Brand ambassadors" ? "/community/ambassador-program" : "/community/volunteer-program"} className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-[#7AD62A] hover:text-[#6bc422]">
                  Apply now
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AngularDivider />

      <section id="certification-system" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 angular-grid-bg opacity-[0.03]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            <div>
              <SectionLabel>How it works</SectionLabel>
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Training, assessment, and verification in one system
              </h2>
              <p className="text-lg text-slate-400 mt-5 max-w-2xl leading-relaxed">
                XpertClass is built around practical work, clear progression, and credentials people can verify. Learners should always know what they are working toward and what comes next.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                {TRUST_PILLARS.map((pillar) => (
                  <div key={pillar.title} className="angular-card bg-[#0f172a] border border-white/10 p-5">
                    <pillar.icon size={20} className="text-[#7AD62A] mb-3" />
                    <h3 className="text-sm font-semibold text-white mb-2">{pillar.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="angular-card bg-[#0f172a] border border-[#7AD62A]/20 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">What this includes</p>
              <h3 className="text-2xl font-bold text-white mt-3">What makes the credential credible</h3>
              <div className="space-y-4 mt-6">
                {[
                  "Courses tied to defined skill areas and measurable outcomes",
                  "Practical exams with scoring, pass marks, and attempt rules",
                  "Public credential verification with issued status and supporting evidence",
                  "Dashboards that show progress toward a certificate",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-[#7AD62A] shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-7 pt-5 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard/certifications" className="angular-btn btn-primary text-sm justify-center">
                  View Credentials
                </Link>
                <Link href="/privacy" className="angular-btn btn-ghost text-sm justify-center border border-white/10 hover:border-[#7AD62A] hover:text-[#7AD62A]">
                  See Standards
                </Link>
              </div>
            </div>
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
            <span className="label-tracking text-[#7AD62A] mb-4 block">Who it&apos;s for</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Built for every learner</h2>
            <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">Whether you are a student, a team lead, or an educator, there is a path designed for you.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {AUDIENCES.map((audience) => {
              const colors = COLOR_MAP[audience.color];
              return (
                <div key={audience.tag} className="angular-card relative bg-[#0f172a] p-8 border border-white/10/80 hover-glow transition-all duration-300 group overflow-hidden hover-lift">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.border} ${colors.text} text-xs font-semibold mb-6 relative z-10`}>
                    <audience.icon size={14} />
                    {audience.tag}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 relative z-10 leading-tight group-hover:text-[#7AD62A] transition-colors">{audience.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 relative z-10">{audience.description}</p>
                  <ul className="space-y-3 mb-8 relative z-10">
                    {audience.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 size={16} className="text-[#7AD62A] shrink-0" /> {f}
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
            <span className="label-tracking text-[#7AD62A] mb-4 block">Curriculum</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">What you will learn</h2>
            <p className="text-lg text-slate-500 mt-4">Structured learning paths from fundamentals to advanced topics.</p>
          </div>
          <div className="flex justify-center border-b border-white/10 mb-10">
            {LEARNING_PATHS.map((path, i) => (
              <button
                key={path.tab}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === i ? "border-[#7AD62A] text-[#7AD62A]" : "border-transparent text-slate-400 hover:text-slate-300"}`}
              >
                <path.icon size={16} /> {path.tab}
              </button>
            ))}
          </div>
          <div className="bg-[#0f172a] angular-card border border-white/10/80 p-8 md:p-10 hover-lift">
            <div className="grid lg:grid-cols-2 gap-10">
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">{LEARNING_PATHS[activeTab].title}</h3>
                <p className="text-slate-500 leading-relaxed mb-6">{LEARNING_PATHS[activeTab].description}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7AD62A]/10 border border-[#7AD62A]/20 text-[#0F203A] text-xs font-semibold mb-8">
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
                  <div key={course.name} className="flex items-center justify-between p-4 angular-card border border-white/10/80 hover:border-[#7AD62A]/30 hover:bg-[#7AD62A]/10/30 hover:shadow-sm transition-all duration-200">
                    <div>
                      <div className="font-medium text-white text-sm">{course.name}</div>
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
            <p className="mt-4 text-lg text-slate-200">From sign-up to skill mastery in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="relative">
                <div className="angular-card relative bg-white/[0.04] backdrop-blur-sm p-8 border border-white/[0.06] hover:border-[#7AD62A]/20 hover:bg-white/[0.06] transition-all duration-300 group">
                  <div className="text-6xl font-extrabold text-[#7AD62A]/10 absolute top-4 right-6 group-hover:text-[#7AD62A]/20 transition-colors">{step.number}</div>
                  <div className="w-16 h-16 angular-card bg-gradient-to-br from-[#7AD62A] to-[#1a8a55] flex items-center justify-center mb-6 shadow-lg shadow-[#7AD62A]/20 group-hover-rotate relative z-10">
                    <step.icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2 mb-3 relative z-10">{step.title}</h3>
                  <p className="relative z-10 text-sm leading-relaxed text-slate-200/90">{step.description}</p>
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
            <span className="label-tracking text-[#7AD62A] mb-4 block">Capabilities</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">The platform built for real skills</h2>
            <p className="text-lg text-slate-500 mt-4">Everything you need to learn, practice, and prove your expertise.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={feature.title} className={`angular-card bg-[#0f172a] p-8 border border-white/10/80 hover-glow transition-all duration-300 group hover-lift animate-fade-in-up animate-delay-${i + 1}`}>
                <div className="w-12 h-12 angular-card bg-gradient-to-br from-[#7AD62A] to-[#1a8a55] flex items-center justify-center mb-5 shadow-md shadow-[#7AD62A]/15 group-hover-rotate">
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7AD62A] transition-colors">{feature.title}</h3>
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
              <span className="inline-flex items-center gap-2 px-3 py-1.5 hex-badge bg-blue-500/10 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
                <Terminal size={14} /> Hands-on Labs
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                Deploy your first lab in <span className="text-[#7AD62A]">30 seconds</span>
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
                    <CheckCircle2 size={16} className="text-[#7AD62A] shrink-0" /> {item}
                  </div>
                ))}
              </div>
              <Link href="/register" className="btn-primary text-sm mt-10 px-8 py-3.5">
                Try a Lab Now <ArrowRight size={14} />
              </Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-[#7AD62A]/20 via-[#7AD62A]/10 to-transparent clip-path-trapezoid blur-xl" />
              <div className="bg-[#0d1117] angular-card p-6 font-mono text-sm overflow-hidden border border-slate-700/50 shadow-2xl relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  <span className="text-slate-500 ml-2 text-xs">student@aero-lab ~ $</span>
                </div>
                <div className="space-y-2 text-[#7AD62A]/70">
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

      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <SectionLabel>Pathway Clarity</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">From first lesson to verified certificate</h2>
            <p className="text-lg text-slate-400 mt-4">
              The learner journey should always answer four questions: what am I training for, what must I complete, what assessment comes next, and how will my credential be verified?
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {CERTIFICATION_STEPS.map((step) => (
              <div key={step.step} className="angular-card bg-[#0f172a] border border-white/10 p-7">
                <div className="text-4xl font-extrabold text-[#7AD62A]/20 mb-4">{step.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
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
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Master Classes</h2>
              <p className="text-lg text-slate-500 mt-3">Learn from expert instructors in live sessions. Can&apos;t make it? Watch the recording.</p>
            </div>
            <Link href="/dashboard/master-classes" className="btn-ghost text-sm mt-4 md:mt-0 text-[#7AD62A] hover:text-[#1a8a55]">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {masterClasses.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {masterClasses.map((mc: MasterClass, i) => (
                <div key={mc.id} className={`angular-card bg-[#0f172a] border border-white/10/80 overflow-hidden hover-lift transition-all duration-300 group animate-fade-in-up animate-delay-${i + 1}`}>
                  <div className="h-44 bg-gradient-to-br from-[#0F203A] to-[#7AD62A] flex items-center justify-center relative">
                    <Video size={40} className="text-white/70" />
                    {mc.status === "LIVE" && (
                      <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-xs font-bold hex-badge animate-pulse-glow">
                        <span className="w-2 h-2 bg-[#0f172a] rounded-full" /> LIVE
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
                    <h3 className="font-bold text-white mb-2 group-hover:text-[#7AD62A] transition-colors leading-tight">{mc.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">{mc.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {mc.instructorName && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#7AD62A]/10 text-[#0F203A] text-[10px] font-bold flex items-center justify-center">{mc.instructorName.charAt(0)}</span>
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
          ) : (
            <div className="angular-card bg-[#0f172a] border border-dashed border-violet-400/20 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <Video size={24} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">New master classes are being scheduled</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                We don&apos;t have a live or upcoming session listed right now, but the catalog is still available for learners who want to explore past formats.
              </p>
              <Link
                href="/dashboard/master-classes"
                className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-sm font-medium transition-colors"
              >
                Browse Master Classes
                <ChevronRight size={14} />
              </Link>
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
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Personal Training</h2>
              <p className="text-lg text-slate-500 mt-3">Book private sessions with expert trainers. Tailored to your goals and schedule.</p>
            </div>
            <Link href="/dashboard/training" className="btn-ghost text-sm mt-4 md:mt-0 text-[#7AD62A] hover:text-[#1a8a55]">
              Browse Trainers <ChevronRight size={14} />
            </Link>
          </div>
          {trainers.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {trainers.map((trainer: Trainer, i) => (
                <Link key={trainer.id} href={`/dashboard/training/${trainer.id}`} className={`angular-card bg-[#0f172a] p-6 border border-white/10/80 hover-lift transition-all duration-300 group animate-fade-in-up animate-delay-${i + 1}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-[#0F203A] font-bold text-lg">
                      {(trainer.user?.name || "T").charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-[#7AD62A] transition-colors">{trainer.user?.name}</div>
                      <div className="text-xs text-slate-400">{trainer.specialties?.join(", ") || "Security, Linux"}</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{trainer.bio || "Expert trainer with years of hands-on experience."}</p>
                  <div className="flex items-center gap-1 text-[#7AD62A] text-sm font-medium">
                    Book a Session <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="angular-card bg-[#0f172a] border border-dashed border-amber-400/20 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Trainer sessions open soon</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Private coaching is part of the platform direction, but there are no trainer profiles published yet. You can still start with courses and labs today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A] text-sm font-semibold transition-colors"
                >
                  Start Learning
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-200 text-sm font-medium transition-colors"
                >
                  Ask About Team Training
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <AngularDivider />

      {/* TESTIMONIALS */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="label-tracking text-[#7AD62A] mb-4 block">Testimonials</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">What our learners say</h2>
            <p className="text-lg text-slate-500 mt-4">Real feedback from engineers building their skills on XpertClass.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`angular-card bg-[#0f172a] p-8 border border-white/10/80 hover-lift transition-all duration-300 relative overflow-hidden animate-fade-in-up animate-delay-${i + 1}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#7AD62A] to-[#7AD62A]" />
                <p className="text-slate-600 text-sm leading-relaxed mb-6 pl-4">&quot;{t.quote}&quot;</p>
                <div className="pl-4">
                  <div className="font-semibold text-white text-sm">{t.name}</div>
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
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Choose the right access path</h2>
            <p className="text-lg text-slate-500 mt-4">Keep the decision simple: individual learners start free, while institutions and teams move into managed access and reporting.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="angular-card bg-[#0f172a] p-8 border border-white/10/80 hover-lift transition-all duration-300">
              <div className="mb-6">
                <span className="label-tracking text-slate-400 mb-2 block">Early Learner</span>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold text-white">{convert(0)}</span>
                  <span className="text-slate-500 mb-2">for 12 months</span>
                </div>
                <p className="text-slate-500 text-sm mt-3">Everything you need to start learning, practicing, and earning proof of skill</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["All courses", "Hands-on labs", "Community access", "Basic certifications"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-[#7AD62A] shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="angular-btn btn-ghost text-sm w-full justify-center border border-white/10 hover:border-[#7AD62A] hover:text-[#7AD62A]">
                <span>Create Free Account</span>
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="angular-card bg-[#0f172a] p-8 border-2 border-[#7AD62A] hover-lift transition-all duration-300 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#7AD62A] text-white text-xs font-bold px-4 py-1.5 hex-badge shadow-lg shadow-[#7AD62A]/25">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <span className="label-tracking text-[#7AD62A] mb-2 block">Universities and Enterprises</span>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold text-white">Custom</span>
                  <span className="text-slate-500 mb-2">plans</span>
                </div>
                <p className="text-slate-500 text-sm mt-3">For universities, cohorts, and organizations that need governed delivery, reporting, and practical evidence</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["Everything in Free", "Priority lab access", "Academic and enterprise workflows", "Advanced certifications", "Team analytics"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-[#7AD62A] shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/get-started" className="angular-btn btn-primary text-sm w-full justify-center shadow-lg shadow-[#7AD62A]/20 hover:shadow-[#7AD62A]/40">
                <span>Discuss Team Access</span> <ArrowRight size={14} />
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
              { value: stats.totalLessons || "55+", label: "Lessons", icon: Code },
              { value: stats.totalStudents ? `${stats.totalStudents}+` : "7+", label: "Engineers", icon: Users },
            ].map((s, i) => (
              <div key={s.label} className={`angular-card bg-white/[0.04] backdrop-blur-sm p-6 border border-white/[0.06] hover:bg-white/[0.07] transition-all duration-300 group hover-lift animate-fade-in-up animate-delay-${i + 1}`}>
                <s.icon size={24} className="text-[#7AD62A] mx-auto mb-3 group-hover-rotate" />
                <div className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">{s.value}</div>
                <div className="mt-2 text-sm text-slate-200 label-tracking">{s.label}</div>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#7AD62A]/[0.12] clip-path-trapezoid blur-3xl" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight text-stroke-white">Ready to master the tech stack?</h2>
          <p className="mt-5 max-w-xl mx-auto text-lg leading-relaxed text-slate-200">
            Join hundreds of engineers learning security, Linux, DevOps, and cloud infrastructure through hands-on practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/register" className="angular-btn btn-primary text-base px-10 py-4 font-semibold shadow-lg shadow-[#7AD62A]/25 hover:shadow-[#7AD62A]/40 magnetic-btn">
              <span>Start Free for 1 Year</span> <ArrowRight size={18} />
            </Link>
            <a href="#courses" className="px-6 py-4 text-sm font-medium text-slate-200 transition-colors hover:text-white">
              Browse Courses
            </a>
          </div>
          <p className="mt-5 text-sm text-slate-300">No credit card required. 12 months free for early learners.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10/80 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image src="/logo-icon.svg" alt="XpertClass" width={32} height={32} className="w-8 h-8" />
                <span className="text-lg font-bold text-white tracking-tight">XpertClass</span>
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-slate-300">
                The platform for hands-on training in security, Linux, DevOps, and cloud infrastructure. Built for engineers, by engineers.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-xs text-slate-300">Built with</span>
                {["NestJS", "PostgreSQL", "Docker", "Next.js"].map((tech) => (
                  <span key={tech} className="rounded bg-white/10/80 px-2 py-0.5 text-xs text-slate-200">{tech}</span>
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
                { label: "Documentation", href: "/dashboard/courses" },
              ],
              Company: [
                { label: "Mission", href: "/get-started" },
                { label: "Community Programs", href: "/community" },
                { label: "Ambassador Program", href: "/community/ambassador-program" },
                { label: "Volunteer Program", href: "/community/volunteer-program" },
                { label: "Contact", href: "mailto:contact@xpertclass.academy" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ],
            }).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold text-white text-sm mb-4">{category}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("#") ? (
                        <a href={link.href} className="text-sm text-slate-300 transition-colors hover:text-[#7AD62A]">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-sm text-slate-300 transition-colors hover:text-[#7AD62A]">
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
        <div className="border-t border-white/10/80 py-6 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>&copy; 2026 XpertClass. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
              <a href="mailto:contact@xpertclass.academy" className="hover:text-slate-300 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
