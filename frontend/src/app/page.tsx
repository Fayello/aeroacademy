"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield, Target, Microscope, ArrowRight, CheckCircle2, Play,
  Terminal, Users, BookOpen, Award, Server, Code, Network, Layers, BarChart3,
  Calendar, Clock, Video, UserCheck, ChevronRight
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import SkillFusionLab from "@/components/SkillFusionLab";
import HeroParticles from "@/components/HeroParticles";
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
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-600 bg-emerald-100", dot: "bg-emerald-500" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-600 bg-blue-100", dot: "bg-blue-500" },
  violet: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", icon: "text-violet-600 bg-violet-100", dot: "bg-violet-500" },
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-red-50 text-red-700 border-red-200",
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0, totalCourses: 0, totalLabs: 0 });
  const [masterClasses, setMasterClasses] = useState<MasterClass[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);

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
      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm" : "bg-white border-b border-slate-100"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo-icon.svg" alt="XpertClass" className="w-8 h-8" />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-[#0F1B2D]">Xpert</span><span className="text-[#059669]">Class</span>
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-1">
              {["Platform", "Courses", "Labs", "Master Classes", "Training", "Enterprise"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-all">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-flex btn-ghost text-sm">Sign in</Link>
            <Link href="/get-started" className="btn-primary text-sm px-5 py-2">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <HeroParticles />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-6">
                <CheckCircle2 size={14} />
                Trusted by engineers across Cameroon
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                Master the <span className="text-emerald-600">technologies</span> that power modern software
              </h1>
              <p className="text-lg text-slate-500 mt-6 leading-relaxed max-w-xl">
                Hands-on training in security, Linux, DevOps, and cloud infrastructure. Deploy real labs, break real systems, build real skills.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3 mt-8">
                <Link href="/get-started" className="btn-primary text-sm px-7 py-3">
                  Start Learning Free <ArrowRight size={16} />
                </Link>
                <a href="#labs" className="btn-secondary text-sm px-7 py-3">
                  <Play size={14} /> Explore Labs
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-500">
                {["No credit card required", `${stats.totalLabs || 37}+ hands-on labs`, "Free tier available"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: stats.totalCourses || "—", label: "Structured Courses", icon: BookOpen },
                    { value: stats.totalLabs || "—", label: "Hands-on Labs", icon: Microscope },
                    { value: "50+", label: "Technical Lessons", icon: Code },
                    { value: stats.totalStudents || "—", label: "Students Training", icon: Users },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <stat.icon size={20} className="text-emerald-600 mb-3" />
                      <div className="text-3xl font-bold text-slate-900">{stat.value}{typeof stat.value === 'number' ? '+' : ''}</div>
                      <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500"].map((color, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-slate-900">{stats.totalStudents || "500+"}</span>
                    <span className="text-slate-500 ml-1">engineers learning right now</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-100 rounded-full opacity-50 blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-100 rounded-full opacity-50 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SKILL FUSION LAB ═══════════ */}
      <SkillFusionLab />

      {/* ═══════════ AUDIENCE SEGMENTATION ═══════════ */}
      <section id="enterprise" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Built for every learner</h2>
            <p className="text-lg text-slate-500 mt-4">Whether you are a student, a team lead, or an educator, there is a path designed for you.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {AUDIENCES.map((audience) => {
              const colors = COLOR_MAP[audience.color];
              return (
                <div key={audience.tag} className="card p-8 hover:shadow-lg transition-all duration-300 group">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} ${colors.border} ${colors.text} text-xs font-semibold mb-6`}>
                    <audience.icon size={14} />
                    {audience.tag}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{audience.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">{audience.description}</p>
                  <ul className="space-y-2.5 mb-8">
                    {audience.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={audience.href} className="btn-primary text-sm w-full justify-center">
                    {audience.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ LEARNING PATHS (TABBED) ═══════════ */}
      <section id="courses" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">What you will learn</h2>
            <p className="text-lg text-slate-500 mt-4">Structured learning paths from fundamentals to advanced topics.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {LEARNING_PATHS.map((path, i) => (
              <button
                key={path.tab}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === i ? "bg-emerald-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
              >
                <path.icon size={16} /> {path.tab}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10">
            <div className="grid lg:grid-cols-2 gap-10">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{LEARNING_PATHS[activeTab].title}</h3>
                <p className="text-slate-500 leading-relaxed mb-6">{LEARNING_PATHS[activeTab].description}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-8">
                  <Microscope size={14} /> {LEARNING_PATHS[activeTab].labHighlight}
                </div>
                <Link href="/register" className="btn-primary text-sm">
                  Explore This Path <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {LEARNING_PATHS[activeTab].courses.map((course) => (
                  <div key={course.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{course.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{course.lessons} lessons</div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${LEVEL_COLORS[course.level] || ""}`}>{course.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">How it works</h2>
            <p className="text-lg text-slate-500 mt-4">From sign-up to skill mastery in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                {i < STEPS.length - 1 && <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-slate-200" />}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6">
                    <step.icon size={28} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Step {step.number}</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2 mb-3">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section id="platform" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">The platform built for real skills</h2>
            <p className="text-lg text-slate-500 mt-4">Everything you need to learn, practice, and prove your expertise.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <feature.icon size={22} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAB SHOWCASE */}
      <section id="labs" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
                <Terminal size={14} /> Hands-on Labs
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Deploy your first lab in <span className="text-emerald-600">30 seconds</span>
              </h2>
              <p className="text-lg text-slate-500 mt-4 leading-relaxed">
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
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {item}
                  </div>
                ))}
              </div>
              <Link href="/register" className="btn-primary text-sm mt-8 px-7 py-3">
                Try a Lab Now <ArrowRight size={14} />
              </Link>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm overflow-hidden border border-slate-700 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-500 ml-2 text-xs">student@aero-lab ~ $</span>
              </div>
              <div className="space-y-2 text-emerald-400">
                <div><span className="text-slate-500">$</span> docker ps</div>
                <div className="text-slate-300">CONTAINER ID  IMAGE          STATUS   PORTS</div>
                <div className="text-slate-300">a3f2b1c       dvwa:latest    Up 2m    0.0.0.0:8080-&gt;80</div>
                <div className="mt-3"><span className="text-slate-500">$</span> sqlmap -u &quot;http://localhost:8080/?id=1&quot; --dbs</div>
                <div className="text-amber-400">[*] testing connection to target URL</div>
                <div className="text-amber-400">[+] available databases [3]:</div>
                <div className="text-white ml-4">dvwa</div>
                <div className="text-white ml-4">information_schema</div>
                <div className="text-white ml-4">mysql</div>
                <div className="mt-3"><span className="text-slate-500">$</span> <span className="animate-pulse">_</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MASTER CLASSES ═══════════ */}
      <section id="master-classes" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold mb-4">
                <Video size={14} /> Live + Recorded
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Master Classes</h2>
              <p className="text-lg text-slate-500 mt-2">Learn from expert instructors in live sessions. Can&apos;t make it? Watch the recording.</p>
            </div>
            <Link href="/dashboard/master-classes" className="btn-secondary text-sm mt-4 md:mt-0">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {masterClasses.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {masterClasses.map((mc: MasterClass) => (
                <div key={mc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="h-40 bg-gradient-to-br from-violet-500 to-emerald-600 flex items-center justify-center relative">
                    <Video size={40} className="text-white/80" />
                    {mc.status === "LIVE" && (
                      <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
                      </span>
                    )}
                    {mc.recordingUrl && (
                      <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 text-white text-xs font-medium rounded-full">
                        <Play size={12} /> Recorded
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-violet-600 font-semibold mb-2">{mc.category || "Security"}</div>
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">{mc.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{mc.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {mc.instructorName && (
                        <span className="flex items-center gap-1"><UserCheck size={12} /> {mc.instructorName}</span>
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
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Video size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Master classes coming soon. Stay tuned.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ 1-ON-1 TRAINING ═══════════ */}
      <section id="training" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-4">
                <Calendar size={14} /> 1-on-1 Sessions
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Personal Training</h2>
              <p className="text-lg text-slate-500 mt-2">Book private sessions with expert trainers. Tailored to your goals and schedule.</p>
            </div>
            <Link href="/dashboard/training" className="btn-secondary text-sm mt-4 md:mt-0">
              Browse Trainers <ChevronRight size={14} />
            </Link>
          </div>
          {trainers.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {trainers.map((trainer: Trainer) => (
                <Link key={trainer.id} href={`/dashboard/training/${trainer.id}`} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-emerald-300 transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                      {(trainer.user?.name || "T").charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{trainer.user?.name}</div>
                      <div className="text-xs text-slate-500">{trainer.specialties?.join(", ") || "Security, Linux"}</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{trainer.bio || "Expert trainer with years of hands-on experience."}</p>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                    Book a Session <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Trainer profiles coming soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">What our learners say</h2>
            <p className="text-lg text-slate-500 mt-4">Real feedback from engineers building their skills on XpertClass.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">&quot;{t.quote}&quot;</p>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BIG STATS */}
      <section className="py-20 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: stats.totalCourses || "—", label: "Courses" },
              { value: stats.totalLabs ? `${stats.totalLabs}+` : "—", label: "Labs" },
              { value: "50+", label: "Lessons" },
              { value: stats.totalStudents ? `${stats.totalStudents}+` : "—", label: "Engineers" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl md:text-5xl font-bold text-white">{s.value}</div>
                <div className="text-emerald-100 text-sm mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Ready to master the tech stack?</h2>
          <p className="text-lg text-slate-500 mt-4 leading-relaxed">
            Join hundreds of engineers learning security, Linux, DevOps, and cloud infrastructure through hands-on practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/get-started" className="btn-primary text-sm px-8 py-3">
              Start Free Today <ArrowRight size={16} />
            </Link>
            <a href="#courses" className="btn-secondary text-sm px-8 py-3">
              Browse Courses
            </a>
          </div>
          <p className="text-sm text-slate-400 mt-4">No credit card required. Free tier available.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="bg-emerald-600 p-1.5 rounded-lg">
                  <Shield size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">XpertClass</span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                The platform for hands-on training in security, Linux, DevOps, and cloud infrastructure. Built for engineers, by engineers.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-xs text-slate-400">Built with</span>
                {["NestJS", "PostgreSQL", "Docker", "Next.js"].map((tech) => (
                  <span key={tech} className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{tech}</span>
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
                { label: "About Us", href: "#" },
                { label: "Contact", href: "mailto:contact@xpertclass.academy" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" },
              ],
            }).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold text-slate-900 text-sm mb-4">{category}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("#") ? (
                        <a href={link.href} className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">
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
        <div className="border-t border-slate-200 py-6 px-6">
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
