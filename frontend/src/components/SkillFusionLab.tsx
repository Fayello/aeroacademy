"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Zap, Atom, Plus, BookOpen, Trophy, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface SkillNode {
  id: string;
  label: string;
  color: string;
  glow: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
  pulseDir: number;
  dragging: boolean;
  tier: number;
  rarity: string;
  parentA?: string;
  parentB?: string;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}

interface Explosion {
  x: number; y: number; life: number;
  particles: Particle[]; label: string; rarity: string;
}

interface Discovery {
  id: string;
  a: string;
  b: string;
  result: string;
  tier: number;
  rarity: string;
  timestamp: number;
  score: number;
}

/* ═══════════════════════════════════════════════════════════
   SKILL DATABASE
   ═══════════════════════════════════════════════════════════ */
const BASE_SKILLS: { id: string; label: string; color: string; category: string }[] = [
  { id: "security", label: "Security", color: "#10b981", category: "Tech" },
  { id: "linux", label: "Linux", color: "#f59e0b", category: "Tech" },
  { id: "devops", label: "DevOps", color: "#3b82f6", category: "Tech" },
  { id: "cloud", label: "Cloud", color: "#8b5cf6", category: "Tech" },
  { id: "coding", label: "Coding", color: "#ef4444", category: "Tech" },
  { id: "ai", label: "AI/ML", color: "#06b6d4", category: "Tech" },
  { id: "data", label: "Data", color: "#14b8a6", category: "Tech" },
  { id: "blockchain", label: "Blockchain", color: "#f97316", category: "Tech" },
  { id: "quantum", label: "Quantum", color: "#a855f7", category: "Science" },
  { id: "trading", label: "Trading", color: "#22c55e", category: "Finance" },
  { id: "risk", label: "Risk Mgmt", color: "#ef4444", category: "Finance" },
  { id: "quant", label: "Quantitative", color: "#3b82f6", category: "Finance" },
  { id: "defi", label: "DeFi", color: "#f59e0b", category: "Finance" },
  { id: "math", label: "Mathematics", color: "#8b5cf6", category: "Science" },
  { id: "stats", label: "Statistics", color: "#ec4899", category: "Science" },
  { id: "physics", label: "Physics", color: "#06b6d4", category: "Science" },
  { id: "biology", label: "Biology", color: "#22c55e", category: "Science" },
  { id: "design", label: "Design", color: "#f472b6", category: "Creative" },
  { id: "writing", label: "Writing", color: "#a78bfa", category: "Creative" },
  { id: "strategy", label: "Strategy", color: "#fbbf24", category: "Business" },
  { id: "marketing", label: "Marketing", color: "#fb923c", category: "Business" },
];

const CATEGORIES = [...new Set(BASE_SKILLS.map(s => s.category))];
const ALL_SKILL_IDS = new Set(BASE_SKILLS.map(s => s.id));
const TOTAL_PAIRS = BASE_SKILLS.length * (BASE_SKILLS.length - 1) / 2;

/* ═══════════════════════════════════════════════════════════
   KNOWN FUSIONS (hand-crafted combinations)
   ═══════════════════════════════════════════════════════════ */
const KNOWN_FUSIONS: Record<string, { name: string; tier: number; rarity: string; score: number }> = {
  "linux+security": { name: "Penetration Testing", tier: 1, rarity: "Uncommon", score: 150 },
  "devops+linux": { name: "SRE Mastery", tier: 1, rarity: "Uncommon", score: 150 },
  "cloud+devops": { name: "Cloud Architecture", tier: 1, rarity: "Rare", score: 250 },
  "cloud+security": { name: "Cloud Security", tier: 1, rarity: "Rare", score: 250 },
  "coding+security": { name: "Secure Development", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+linux": { name: "Systems Programming", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+devops": { name: "Full-Stack DevOps", tier: 1, rarity: "Rare", score: 200 },
  "coding+cloud": { name: "Platform Engineering", tier: 1, rarity: "Rare", score: 250 },
  "devops+security": { name: "DevSecOps", tier: 1, rarity: "Epic", score: 300 },
  "cloud+linux": { name: "Cloud Linux Ops", tier: 1, rarity: "Uncommon", score: 150 },
  "ai+data": { name: "Deep Learning", tier: 1, rarity: "Rare", score: 200 },
  "ai+coding": { name: "ML Engineering", tier: 1, rarity: "Rare", score: 200 },
  "ai+math": { name: "Neural Mathematics", tier: 1, rarity: "Epic", score: 350 },
  "ai+quant": { name: "Algorithmic Trading", tier: 1, rarity: "Epic", score: 400 },
  "ai+security": { name: "AI Security Research", tier: 1, rarity: "Epic", score: 350 },
  "ai+trading": { name: "Quantitative AI", tier: 1, rarity: "Epic", score: 400 },
  "ai+strategy": { name: "Strategic AI", tier: 1, rarity: "Rare", score: 250 },
  "ai+biology": { name: "Bioinformatics", tier: 1, rarity: "Rare", score: 250 },
  "ai+physics": { name: "Computational Physics", tier: 1, rarity: "Rare", score: 250 },
  "ai+design": { name: "Generative Design", tier: 1, rarity: "Rare", score: 200 },
  "quant+trading": { name: "Quantitative Trading", tier: 1, rarity: "Rare", score: 300 },
  "quant+risk": { name: "Risk Modeling", tier: 1, rarity: "Rare", score: 250 },
  "quant+math": { name: "Mathematical Finance", tier: 1, rarity: "Epic", score: 350 },
  "quant+stats": { name: "Statistical Arbitrage", tier: 1, rarity: "Epic", score: 400 },
  "quant+ai": { name: "Quant AI Systems", tier: 1, rarity: "Legendary", score: 500 },
  "trading+risk": { name: "Portfolio Management", tier: 1, rarity: "Rare", score: 250 },
  "trading+defi": { name: "DeFi Trading", tier: 1, rarity: "Rare", score: 250 },
  "trading+stats": { name: "Statistical Trading", tier: 1, rarity: "Uncommon", score: 200 },
  "risk+stats": { name: "Actuarial Science", tier: 1, rarity: "Rare", score: 250 },
  "risk+defi": { name: "DeFi Risk Protocol", tier: 1, rarity: "Epic", score: 300 },
  "defi+blockchain": { name: "DeFi Protocol Dev", tier: 1, rarity: "Rare", score: 250 },
  "blockchain+coding": { name: "Smart Contract Dev", tier: 1, rarity: "Rare", score: 250 },
  "blockchain+security": { name: "Blockchain Security", tier: 1, rarity: "Epic", score: 350 },
  "blockchain+cloud": { name: "Decentralized Cloud", tier: 1, rarity: "Rare", score: 250 },
  "blockchain+quant": { name: "Quantum-Resistant Chain", tier: 1, rarity: "Legendary", score: 500 },
  "quantum+math": { name: "Quantum Computing", tier: 1, rarity: "Epic", score: 400 },
  "quantum+physics": { name: "Quantum Physics", tier: 1, rarity: "Epic", score: 350 },
  "quantum+coding": { name: "Quantum Programming", tier: 1, rarity: "Epic", score: 400 },
  "quantum+ai": { name: "Quantum AI", tier: 1, rarity: "Legendary", score: 550 },
  "quantum+security": { name: "Quantum Cryptography", tier: 1, rarity: "Legendary", score: 500 },
  "math+stats": { name: "Applied Mathematics", tier: 1, rarity: "Uncommon", score: 150 },
  "math+physics": { name: "Theoretical Physics", tier: 1, rarity: "Rare", score: 250 },
  "math+coding": { name: "Computational Mathematics", tier: 1, rarity: "Rare", score: 200 },
  "stats+data": { name: "Data Science", tier: 1, rarity: "Rare", score: 200 },
  "stats+biology": { name: "Biostatistics", tier: 1, rarity: "Rare", score: 250 },
  "data+cloud": { name: "Big Data Engineering", tier: 1, rarity: "Rare", score: 250 },
  "data+coding": { name: "Data Engineering", tier: 1, rarity: "Uncommon", score: 200 },
  "data+blockchain": { name: "Decentralized Data", tier: 1, rarity: "Rare", score: 250 },
  "design+coding": { name: "Creative Coding", tier: 1, rarity: "Uncommon", score: 150 },
  "design+ai": { name: "AI-Generated Design", tier: 1, rarity: "Rare", score: 200 },
  "design+strategy": { name: "UX Strategy", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+strategy": { name: "Content Strategy", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+marketing": { name: "Copywriting", tier: 1, rarity: "Common", score: 100 },
  "marketing+strategy": { name: "Growth Strategy", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+data": { name: "Marketing Analytics", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+ai": { name: "AI Marketing", tier: 1, rarity: "Rare", score: 200 },
  "strategy+trading": { name: "Trading Strategy", tier: 1, rarity: "Rare", score: 250 },
  "strategy+quant": { name: "Quant Strategy Design", tier: 1, rarity: "Epic", score: 350 },
  "physics+data": { name: "Experimental Data", tier: 1, rarity: "Uncommon", score: 150 },
  "biology+data": { name: "Genomic Data Science", tier: 1, rarity: "Rare", score: 250 },
  "biology+coding": { name: "Computational Biology", tier: 1, rarity: "Rare", score: 250 },
  "biology+math": { name: "Mathematical Biology", tier: 1, rarity: "Rare", score: 200 },
  "cloud+ai": { name: "MLOps", tier: 1, rarity: "Rare", score: 250 },
  "cloud+data": { name: "Data Lake Architecture", tier: 1, rarity: "Rare", score: 250 },
  "cloud+blockchain": { name: "Cloud-Native Blockchain", tier: 1, rarity: "Rare", score: 250 },
  "linux+coding": { name: "Systems Programming", tier: 1, rarity: "Uncommon", score: 150 },
  "linux+data": { name: "Linux Data Ops", tier: 1, rarity: "Common", score: 100 },
  "linux+ai": { name: "Edge AI Systems", tier: 1, rarity: "Rare", score: 200 },
  "security+data": { name: "Data Security", tier: 1, rarity: "Uncommon", score: 150 },
  "security+quantum": { name: "Post-Quantum Crypto", tier: 1, rarity: "Legendary", score: 500 },
  "security+defi": { name: "Smart Contract Auditing", tier: 1, rarity: "Epic", score: 350 },
  "risk+quantum": { name: "Quantum Risk Analysis", tier: 1, rarity: "Legendary", score: 500 },
  "trading+cloud": { name: "Cloud Trading Systems", tier: 1, rarity: "Rare", score: 250 },
  "trading+linux": { name: "Low-Latency Trading", tier: 1, rarity: "Epic", score: 350 },
  "trading+coding": { name: "Algo Development", tier: 1, rarity: "Rare", score: 250 },
  "defi+quant": { name: "DeFi Quant Strategies", tier: 1, rarity: "Epic", score: 400 },
  "defi+math": { name: "Token Engineering", tier: 1, rarity: "Rare", score: 250 },
  "defi+ai": { name: "AI DeFi Agent", tier: 1, rarity: "Legendary", score: 550 },
  "design+blockchain": { name: "Web3 Design", tier: 1, rarity: "Rare", score: 200 },
  "design+writing": { name: "Multimedia Storytelling", tier: 1, rarity: "Common", score: 100 },
  "physics+quantum": { name: "Advanced Quantum Theory", tier: 1, rarity: "Epic", score: 350 },
  "physics+coding": { name: "Scientific Computing", tier: 1, rarity: "Rare", score: 200 },
  "physics+stats": { name: "Experimental Physics Stats", tier: 1, rarity: "Rare", score: 200 },
};

const RARITY_COLORS: Record<string, string> = {
  Common: "#94a3b8",
  Uncommon: "#10b981",
  Rare: "#3b82f6",
  Epic: "#a855f7",
  Legendary: "#f59e0b",
  Mythic: "#ef4444",
};

const RARITY_SCORES: Record<string, number> = {
  Common: 50,
  Uncommon: 150,
  Rare: 250,
  Epic: 350,
  Legendary: 500,
  Mythic: 1000,
};

const TIER_RARITY: Record<number, string> = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary",
  6: "Mythic",
};

/* ═══════════════════════════════════════════════════════════
   FUSION NAME GENERATOR
   ═══════════════════════════════════════════════════════════ */
const PREFIXES = ["Neo", "Quantum", "Cyber", "Meta", "Hyper", "Ultra", "Proto", "Omni", "Syn", "Axio", "Volta", "Flux", "Nexa", "Aero", "Astro", "Bio", "Chrono", "Dyna", "Electro", "Ferro"];
const SUFFIXES = ["nix", "lytics", "sphere", "verse", "forge", "craft", "logic", "node", "link", "sync", "core", "wave", "pulse", "flux", "shift", "flow", "stack", "mesh", "net", "ops"];

function generateFusionName(a: string, b: string): { name: string; tier: number; rarity: string; score: number } {
  const key = [a, b].sort().join("+");
  if (KNOWN_FUSIONS[key]) return KNOWN_FUSIONS[key];

  const aLabel = BASE_SKILLS.find(s => s.id === a)?.label || a;
  const bLabel = BASE_SKILLS.find(s => s.id === b)?.label || b;

  const halfA = aLabel.slice(0, Math.ceil(aLabel.length / 2));
  const halfB = bLabel.slice(Math.floor(bLabel.length / 2));
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];

  const methods = [
    `${halfA}${halfB}`,
    `${prefix}${suffix}`,
    `${aLabel.slice(0, 3)}${bLabel.slice(-3)}`,
  ];

  const name = methods[Math.floor(Math.random() * methods.length)];
  return { name, tier: 1, rarity: "Common", score: 50 };
}

function getFusionResult(a: string, b: string, tier: number): { name: string; rarity: string; score: number } {
  const key = [a, b].sort().join("+");
  if (KNOWN_FUSIONS[key]) {
    const f = KNOWN_FUSIONS[key];
    const tierBonus = Math.max(0, tier - 1);
    return {
      name: f.name,
      rarity: TIER_RARITY[Math.min(f.tier + tierBonus, 6)] || f.rarity,
      score: f.score + tierBonus * 200,
    };
  }

  const gen = generateFusionName(a, b);
  const rarity = TIER_RARITY[Math.min(tier, 6)] || "Mythic";
  return {
    name: gen.name,
    rarity,
    score: RARITY_SCORES[rarity] + Math.floor(Math.random() * 100),
  };
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#22c55e"];

function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function loadDiscoveries(): Discovery[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("aero_fusions") || "[]");
  } catch { return []; }
}

function saveDiscoveries(d: Discovery[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("aero_fusions", JSON.stringify(d));
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function SkillFusionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<SkillNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const discoveredRef = useRef<Set<string>>(new Set());
  const dragNodeRef = useRef<SkillNode | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef<number>(0);
  const fusionCbRef = useRef<((d: Discovery) => void) | null>(null);

  const [discovered, setDiscovered] = useState<Discovery[]>([]);
  const [score, setScore] = useState(0);
  const [fusionMsg, setFusionMsg] = useState<{ name: string; rarity: string; score: number } | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [customName, setCustomName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAllSkills, setShowAllSkills] = useState(false);
  const fusionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalDiscovered = discovered.length;
  const totalPossible = TOTAL_PAIRS + 1000;

  const filteredSkills = useMemo(() =>
    selectedCategory === "All" ? BASE_SKILLS : BASE_SKILLS.filter(s => s.category === selectedCategory),
    [selectedCategory]
  );

  const visibleSkills = useMemo(() =>
    showAllSkills ? filteredSkills : filteredSkills.slice(0, 10),
    [filteredSkills, showAllSkills]
  );

  const stats = useMemo(() => {
    const rarityCount: Record<string, number> = {};
    discovered.forEach(d => { rarityCount[d.rarity] = (rarityCount[d.rarity] || 0) + 1; });
    return rarityCount;
  }, [discovered]);

  useEffect(() => {
    const saved = loadDiscoveries();
    setDiscovered(saved);
    setScore(saved.reduce((s, d) => s + d.score, 0));
    saved.forEach(d => {
      const key = [d.a, d.b].sort().join("+");
      discoveredRef.current.add(key);
    });
  }, []);

  const onDiscovery = useCallback((d: Discovery) => {
    setDiscovered(prev => {
      const exists = prev.some(x => x.id === d.id);
      return exists ? prev : [...prev, d];
    });
    setScore(prev => prev + d.score);
    saveDiscoveries([...discoveredRef.current].map(k => {
      const existing = discovered.find(x => x.id === k);
      return existing || { id: k, a: k.split("+")[0], b: k.split("+")[1], result: "Unknown", tier: 1, rarity: "Common", timestamp: Date.now(), score: 50 };
    }));
    setFusionMsg({ name: d.result, rarity: d.rarity, score: d.score });
    if (fusionTimeoutRef.current) clearTimeout(fusionTimeoutRef.current);
    fusionTimeoutRef.current = setTimeout(() => setFusionMsg(null), 3500);
  }, [discovered]);

  useEffect(() => { fusionCbRef.current = onDiscovery; }, [onDiscovery]);

  const addCustomNode = useCallback(() => {
    if (!customName.trim()) return;
    const id = customName.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const w = containerRef.current?.offsetWidth || 800;
    const h = containerRef.current?.offsetHeight || 500;
    nodesRef.current.push({
      id,
      label: customName.trim(),
      color,
      glow: rgba(color, 0.4),
      x: w / 2 + (Math.random() - 0.5) * 200,
      y: h / 2 + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: 30,
      pulse: 0,
      pulseDir: 1,
      dragging: false,
      tier: 0,
      rarity: "Custom",
    });
    setCustomName("");
    setShowCreator(false);
  }, [customName]);

  const spawnNode = useCallback((skill: { id: string; label: string; color: string }) => {
    const w = containerRef.current?.offsetWidth || 800;
    const h = containerRef.current?.offsetHeight || 500;
    nodesRef.current.push({
      id: skill.id + "_" + Date.now(),
      label: skill.label,
      color: skill.color,
      glow: rgba(skill.color, 0.4),
      x: w / 2 + (Math.random() - 0.5) * 300,
      y: h / 2 + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: 32,
      pulse: 0,
      pulseDir: 1,
      dragging: false,
      tier: 0,
      rarity: "Base",
    });
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 0.5;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, maxLife: 1,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  }, []);

  const spawnExplosion = useCallback((x: number, y: number, label: string, rarity: string) => {
    const p: Particle[] = [];
    const count = rarity === "Mythic" ? 80 : rarity === "Legendary" ? 60 : rarity === "Epic" ? 50 : 35;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      const rarityColor = RARITY_COLORS[rarity] || "#10b981";
      p.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, maxLife: 1,
        color: Math.random() > 0.4 ? rarityColor : COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 4 + 2,
      });
    }
    explosionsRef.current.push({ x, y, life: 1, particles: p, label, rarity });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      w = rect.width; h = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const getBaseId = (label: string) => {
      const base = BASE_SKILLS.find(s => s.label === label || s.id === label);
      return base ? base.id : label;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const node of nodesRef.current) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (dx * dx + dy * dy < (node.radius + 10) * (node.radius + 10)) {
          node.dragging = true;
          dragNodeRef.current = node;
          break;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (dragNodeRef.current) {
        dragNodeRef.current.x = mouseRef.current.x;
        dragNodeRef.current.y = mouseRef.current.y;
        dragNodeRef.current.vx = 0;
        dragNodeRef.current.vy = 0;
      }
    };

    const handleMouseUp = () => {
      if (dragNodeRef.current) { dragNodeRef.current.dragging = false; dragNodeRef.current = null; }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left;
      const my = e.touches[0].clientY - rect.top;
      for (const node of nodesRef.current) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (dx * dx + dy * dy < (node.radius + 15) * (node.radius + 15)) {
          node.dragging = true;
          dragNodeRef.current = node;
          e.preventDefault();
          break;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragNodeRef.current || !e.touches.length) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      dragNodeRef.current.x = e.touches[0].clientX - rect.left;
      dragNodeRef.current.y = e.touches[0].clientY - rect.top;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
    };

    const handleTouchEnd = () => {
      if (dragNodeRef.current) { dragNodeRef.current.dragging = false; dragNodeRef.current = null; }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;
      const time = Date.now();

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.12;
            const key = [getBaseId(a.label), getBaseId(b.label)].sort().join("+");
            const isFused = discoveredRef.current.has(key);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            if (isFused) {
              const p = 0.4 + Math.sin(time / 300) * 0.3;
              ctx.strokeStyle = rgba("#10b981", p);
              ctx.lineWidth = 2;
              ctx.shadowColor = "rgba(16,185,129,0.4)";
              ctx.shadowBlur = 8;
            } else {
              ctx.strokeStyle = rgba("#94a3b8", alpha);
              ctx.lineWidth = 0.8;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Ambient particles
      if (Math.random() < 0.1) {
        particlesRef.current.push({
          x: Math.random() * w, y: h + 5,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(Math.random() * 0.8 + 0.2),
          life: 1, maxLife: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 1.5 + 0.5,
        });
      }
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.004;
        if (p.life <= 0) return false;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.color, p.life * 0.4);
        ctx.fill();
        return true;
      });

      // Nodes
      for (const node of nodes) {
        if (!node.dragging) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < node.radius || node.x > w - node.radius) node.vx *= -1;
          if (node.y < node.radius || node.y > h - node.radius) node.vy *= -1;
          node.x = Math.max(node.radius, Math.min(w - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(h - node.radius, node.y));
          node.vx += (Math.random() - 0.5) * 0.015;
          node.vy += (Math.random() - 0.5) * 0.015;
          node.vx *= 0.999;
          node.vy *= 0.999;
        }
        node.pulse += 0.03 * node.pulseDir;
        if (node.pulse > 1) node.pulseDir = -1;
        if (node.pulse < 0) node.pulseDir = 1;

        const rarityColor = RARITY_COLORS[node.rarity] || node.color;
        const isCustom = node.tier === 0 && node.rarity === "Custom";
        const isBase = node.tier === 0 && node.rarity === "Base";
        const pulseScale = 1 + node.pulse * 0.06;
        const r = node.radius * pulseScale;

        // Glow
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.5);
        grad.addColorStop(0, rgba(isCustom ? node.color : rarityColor, 0.3));
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(node.x - r * 2.5, node.y - r * 2.5, r * 5, r * 5);

        // Outer ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(isBase ? node.color : rarityColor, 0.35);
        ctx.lineWidth = node.tier > 1 ? 2.5 : 1.5;
        ctx.stroke();

        // Main circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        bg.addColorStop(0, rgba(isBase ? node.color : rarityColor, 0.2));
        bg.addColorStop(1, rgba(isBase ? node.color : rarityColor, 0.05));
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = isBase ? rgba(node.color, 0.5) : rarityColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Letter
        ctx.save();
        ctx.font = "bold 18px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isBase ? node.color : rarityColor;
        ctx.fillText(node.label.charAt(0).toUpperCase(), node.x, node.y);
        ctx.restore();

        // Label
        ctx.font = "bold 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(node.label, node.x, node.y + r + 16);

        // Tier/rarity badge
        if (node.tier > 0) {
          ctx.font = "8px Inter, system-ui, sans-serif";
          ctx.fillStyle = rarityColor;
          ctx.fillText(`T${node.tier} ${node.rarity}`, node.x, node.y + r + 27);
        } else if (isCustom) {
          ctx.font = "8px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#f59e0b";
          ctx.fillText("CUSTOM", node.x, node.y + r + 27);
        }
      }

      // Explosions
      explosionsRef.current = explosionsRef.current.filter((exp) => {
        exp.life -= 0.012;
        if (exp.life <= 0) return false;
        const rarityColor = RARITY_COLORS[exp.rarity] || "#10b981";
        for (const p of exp.particles) {
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.97; p.vy *= 0.97;
          p.life -= 0.018;
          if (p.life > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = rgba(p.color, p.life * 0.7);
            ctx.fill();
          }
        }
        if (exp.life > 0.4) {
          ctx.save();
          ctx.globalAlpha = (exp.life - 0.4) / 0.6;
          ctx.font = "bold 14px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = rarityColor;
          ctx.shadowColor = rgba(rarityColor, 0.8);
          ctx.shadowBlur = 15;
          ctx.fillText(exp.label, exp.x, exp.y - 25 - (1 - exp.life) * 40);
          ctx.shadowBlur = 0;
          ctx.restore();
        }
        return true;
      });

      // Check fusions
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (!nodes[i].dragging && !nodes[j].dragging) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            const baseA = getBaseId(nodes[i].label);
            const baseB = getBaseId(nodes[j].label);
            if (baseA === baseB) continue;
            const key = [baseA, baseB].sort().join("+");
            if (discoveredRef.current.has(key)) continue;

            const tierA = Math.max(nodes[i].tier, 1);
            const tierB = Math.max(nodes[j].tier, 1);
            const newTier = Math.min(Math.max(tierA, tierB) + 1, 6);
            const result = getFusionResult(baseA, baseB, newTier);

            discoveredRef.current.add(key);
            const discovery: Discovery = {
              id: key,
              a: baseA,
              b: baseB,
              result: result.name,
              tier: newTier,
              rarity: result.rarity,
              timestamp: Date.now(),
              score: result.score,
            };

            spawnExplosion(
              (nodes[i].x + nodes[j].x) / 2,
              (nodes[i].y + nodes[j].y) / 2,
              result.name,
              result.rarity
            );
            spawnParticles(nodes[i].x, nodes[i].y, nodes[i].color, 15);
            spawnParticles(nodes[j].x, nodes[j].y, nodes[j].color, 15);

            const rarityColor = RARITY_COLORS[result.rarity] || "#10b981";
            const newLabel = `${result.name}`;
            nodes[i].label = newLabel;
            nodes[i].tier = newTier;
            nodes[i].rarity = result.rarity;
            nodes[i].color = rarityColor;
            nodes[i].glow = rgba(rarityColor, 0.4);
            nodes[i].radius = 32 + newTier * 3;
            nodes[i].vx = (Math.random() - 0.5) * 0.5;
            nodes[i].vy = (Math.random() - 0.5) * 0.5;
            nodes[i].parentA = nodes[i].label;
            nodes[i].parentB = nodes[j].label;

            nodes.splice(j, 1);

            fusionCbRef.current?.(discovery);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [spawnParticles, spawnExplosion]);

  return (
    <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Atom size={14} /> Skill Fusion Lab
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Fuse skills to <span className="text-emerald-400">discover</span> infinite possibilities
          </h2>
          <p className="text-base sm:text-lg text-slate-400 mt-3 max-w-2xl mx-auto">
            Drag nodes together to create new specializations. Build custom skills.
            Fuse fused skills again for higher tiers. How far can you go?
          </p>
        </div>

        {/* Score + Stats bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-sm">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-amber-400 font-bold">{score.toLocaleString()}</span>
            <span className="text-slate-500">pts</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-sm">
            <Sparkles size={14} className="text-emerald-400" />
            <span className="text-emerald-400 font-bold">{totalDiscovered}</span>
            <span className="text-slate-500">discovered</span>
          </div>
          <button
            onClick={() => setShowJournal(!showJournal)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-sm text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
          >
            <BookOpen size={14} />
            Journal
            {showJournal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-sm text-emerald-400 hover:bg-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus size={14} />
            Create Skill
          </button>
        </div>

        {/* Fusion notification */}
        {fusionMsg && (
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-bold animate-pulse"
              style={{ backgroundColor: rgba(RARITY_COLORS[fusionMsg.rarity] || "#10b981", 0.15), borderColor: rgba(RARITY_COLORS[fusionMsg.rarity] || "#10b981", 0.4), color: RARITY_COLORS[fusionMsg.rarity] || "#10b981" }}>
              <Zap size={16} />
              {fusionMsg.rarity} Fusion: {fusionMsg.name}
              <span className="ml-1 opacity-70">+{fusionMsg.score}</span>
            </div>
          </div>
        )}

        {/* Discovery Journal Panel */}
        {showJournal && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-800/90 border border-slate-700/50 backdrop-blur-sm max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Discovery Journal</h3>
              <button onClick={() => setShowJournal(false)} className="text-slate-500 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {discovered.length === 0 && (
                <p className="text-slate-500 text-xs col-span-full text-center py-4">No discoveries yet. Drag two skills together!</p>
              )}
              {[...discovered].reverse().map((d) => (
                <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-700/30 text-xs">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: RARITY_COLORS[d.rarity] || "#94a3b8" }} />
                  <div className="min-w-0">
                    <span className="text-slate-400">{d.a} + {d.b}</span>
                    <span className="text-slate-600 mx-1">=</span>
                    <span className="font-bold" style={{ color: RARITY_COLORS[d.rarity] }}>{d.result}</span>
                    <span className="text-slate-600 ml-1">T{d.tier}</span>
                  </div>
                  <span className="ml-auto text-amber-400/70 font-mono shrink-0">+{d.score}</span>
                </div>
              ))}
            </div>
            {/* Rarity breakdown */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-700/30">
              {Object.entries(RARITY_COLORS).map(([rarity, color]) => (
                <div key={rarity} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-500">{rarity}</span>
                  <span className="font-bold" style={{ color }}>{stats[rarity] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Skill Creator */}
        {showCreator && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-800/90 border border-emerald-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Create a Custom Skill</h3>
              <button onClick={() => setShowCreator(false)} className="text-slate-500 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomNode()}
                placeholder="Type any skill name... (e.g., Quantum Finance, Neural Art, Biohacking)"
                className="flex-1 bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={addCustomNode}
                disabled={!customName.trim()}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Custom skills appear as golden nodes. Fuse them with any other skill!</p>
          </div>
        )}

        {/* Skill Palette */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${selectedCategory === "All" ? "bg-emerald-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40"}`}
            >
              All ({BASE_SKILLS.length})
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat ? "bg-emerald-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleSkills.map(skill => (
              <button
                key={skill.id}
                onClick={() => spawnNode(skill)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-105 cursor-pointer"
                style={{ borderColor: rgba(skill.color, 0.3), backgroundColor: rgba(skill.color, 0.08), color: skill.color }}
              >
                <Plus size={10} />
                {skill.label}
              </button>
            ))}
            {filteredSkills.length > 10 && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/40 text-slate-500 hover:text-slate-300 border border-slate-700/30 cursor-pointer"
              >
                {showAllSkills ? "Show less" : `+${filteredSkills.length - 10} more`}
              </button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="relative w-full h-[450px] sm:h-[500px] rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

          {/* Empty state */}
          {nodesRef.current.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-20">+</div>
                <p className="text-slate-500 text-sm">Click any skill above to add it to the arena</p>
                <p className="text-slate-600 text-xs mt-1">Or create your own custom skill</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-800/80 backdrop-blur border border-slate-700/50 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
                Click skills to add
              </span>
              <span className="hidden sm:flex items-center gap-1">
                Drag nodes to fuse
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <Zap size={10} className="text-blue-400" />
                Fuse again for higher tiers
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <Plus size={10} className="text-amber-400" />
                Create custom skills
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
