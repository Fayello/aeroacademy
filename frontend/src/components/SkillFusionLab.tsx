"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Zap, Atom, Shield, Terminal, Cloud, Code2, Layers } from "lucide-react";

interface SkillNode {
  id: string;
  label: string;
  icon: any;
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
  fused: boolean;
  fusionPartner: string | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FusionExplosion {
  x: number;
  y: number;
  life: number;
  particles: Particle[];
  label: string;
}

const SKILLS: { id: string; label: string; icon: any; color: string; glow: string }[] = [
  { id: "security", label: "Security", icon: Shield, color: "#10b981", glow: "rgba(16,185,129,0.4)" },
  { id: "linux", label: "Linux", icon: Terminal, color: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  { id: "devops", label: "DevOps", icon: Layers, color: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  { id: "cloud", label: "Cloud", icon: Cloud, color: "#8b5cf6", glow: "rgba(139,92,246,0.4)" },
  { id: "coding", label: "Coding", icon: Code2, color: "#ef4444", glow: "rgba(239,68,68,0.4)" },
  { id: "automation", label: "Auto", icon: Zap, color: "#06b6d4", glow: "rgba(6,182,212,0.4)" },
  { id: "analysis", label: "Analysis", icon: Atom, color: "#ec4899", glow: "rgba(236,72,153,0.4)" },
];

const FUSIONS: Record<string, string> = {
  "analysis+coding": "Data Engineering",
  "analysis+devops": "Observability",
  "analysis+linux": "Forensics",
  "analysis+security": "Threat Intelligence",
  "automation+cloud": "Cloud Automation",
  "automation+coding": "CI/CD Pipelines",
  "automation+linux": "Infra Automation",
  "automation+security": "Security Automation",
  "cloud+coding": "Platform Engineering",
  "cloud+devops": "Cloud Architecture",
  "cloud+linux": "Cloud Linux",
  "cloud+security": "Cloud Security",
  "coding+devops": "Full-Stack DevOps",
  "coding+linux": "Systems Programming",
  "coding+security": "Secure Development",
  "devops+linux": "SRE Mastery",
  "devops+security": "DevSecOps",
  "linux+security": "Penetration Testing",
};

function getFusionLabel(a: string, b: string): string {
  return FUSIONS[`${a}+${b}`] || FUSIONS[`${b}+${a}`] || "Specialization";
}

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];
const TOTAL_PAIRS = Math.floor(SKILLS.length * (SKILLS.length - 1) / 2);

function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function SkillFusionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<SkillNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const explosionsRef = useRef<FusionExplosion[]>([]);
  const fusedPairsRef = useRef<Set<string>>(new Set());
  const dragNodeRef = useRef<SkillNode | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef<number>(0);
  const fusionCallbackRef = useRef<((key: string, label: string) => void) | null>(null);

  const [fusedDisplay, setFusedDisplay] = useState<string[]>([]);
  const [fusionMessage, setFusionMessage] = useState("");
  const fusionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onFusion = useCallback((key: string, label: string) => {
    setFusedDisplay((prev) => [...prev, `${key}=${label}`]);
    setFusionMessage(label);
    if (fusionTimeoutRef.current) clearTimeout(fusionTimeoutRef.current);
    fusionTimeoutRef.current = setTimeout(() => setFusionMessage(""), 3000);
  }, []);

  useEffect(() => {
    fusionCallbackRef.current = onFusion;
  }, [onFusion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (nodesRef.current.length === 0) {
        const padding = 80;
        nodesRef.current = SKILLS.map((s, i) => {
          const angle = (i / SKILLS.length) * Math.PI * 2;
          const dist = Math.min(w, h) * 0.28;
          return {
            ...s,
            x: w / 2 + Math.cos(angle) * dist,
            y: h / 2 + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: 32,
            pulse: Math.random() * Math.PI * 2,
            pulseDir: 1,
            dragging: false,
            fused: false,
            fusionPartner: null,
          };
        });
      }
    };
    resize();

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const node of nodesRef.current) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (dx * dx + dy * dy < (node.radius + 8) * (node.radius + 8)) {
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
      if (dragNodeRef.current) {
        dragNodeRef.current.dragging = false;
        dragNodeRef.current = null;
      }
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
      if (dragNodeRef.current) {
        dragNodeRef.current.dragging = false;
        dragNodeRef.current = null;
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 0.5;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          color,
          size: Math.random() * 3 + 1,
        });
      }
    };

    const spawnExplosion = (x: number, y: number, label: string) => {
      const p: Particle[] = [];
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        p.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 4 + 2,
        });
      }
      explosionsRef.current.push({ x, y, life: 1, particles: p, label });
    };

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
          if (dist < 200) {
            const alpha = (1 - dist / 200) * 0.15;
            const key = [a.id, b.id].sort().join("+");
            const isFused = fusedPairsRef.current.has(key);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            if (isFused) {
              const pulse = 0.5 + Math.sin(time / 300) * 0.3;
              ctx.strokeStyle = rgba("#10b981", pulse);
              ctx.lineWidth = 2.5;
              ctx.shadowColor = "rgba(16,185,129,0.5)";
              ctx.shadowBlur = 10;
            } else {
              ctx.strokeStyle = rgba("#94a3b8", alpha);
              ctx.lineWidth = 1;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Ambient particles
      if (Math.random() < 0.12) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: h + 5,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -(Math.random() * 1 + 0.3),
          life: 1,
          maxLife: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 2 + 0.5,
        });
      }
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.005;
        if (p.life <= 0) return false;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.color, p.life * 0.5);
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
          node.vx += (Math.random() - 0.5) * 0.02;
          node.vy += (Math.random() - 0.5) * 0.02;
          node.vx *= 0.999;
          node.vy *= 0.999;
        }

        node.pulse += 0.03 * node.pulseDir;
        if (node.pulse > 1) node.pulseDir = -1;
        if (node.pulse < 0) node.pulseDir = 1;

        const isFused = node.fused;
        const pulseScale = 1 + node.pulse * 0.08;
        const r = node.radius * pulseScale;

        // Glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.5);
        gradient.addColorStop(0, node.glow);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(node.x - r * 2.5, node.y - r * 2.5, r * 5, r * 5);

        // Outer ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = isFused ? "#10b981" : rgba(node.color, 0.25);
        ctx.lineWidth = isFused ? 2.5 : 1.5;
        ctx.stroke();

        // Main circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        bg.addColorStop(0, rgba(node.color, 0.19));
        bg.addColorStop(1, rgba(node.color, 0.06));
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = isFused ? "#10b981" : rgba(node.color, 0.5);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Letter icon
        ctx.save();
        ctx.font = "bold 20px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isFused ? "#10b981" : node.color;
        ctx.fillText(node.label.charAt(0), node.x, node.y);
        ctx.restore();

        // Label
        ctx.font = "bold 11px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = isFused ? "#10b981" : "#475569";
        ctx.fillText(node.label, node.x, node.y + r + 18);

        if (isFused) {
          ctx.font = "9px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#10b981";
          ctx.fillText("FUSED", node.x, node.y + r + 30);
        }
      }

      // Explosion particles
      explosionsRef.current = explosionsRef.current.filter((exp) => {
        exp.life -= 0.015;
        if (exp.life <= 0) return false;
        for (const p of exp.particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.life -= 0.02;
          if (p.life > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = rgba(p.color, p.life * 0.8);
            ctx.fill();
          }
        }
        if (exp.life > 0.5) {
          ctx.save();
          ctx.globalAlpha = (exp.life - 0.5) * 2;
          ctx.font = "bold 16px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#10b981";
          ctx.shadowColor = "rgba(16,185,129,0.8)";
          ctx.shadowBlur = 20;
          ctx.fillText(exp.label, exp.x, exp.y - 20 - (1 - exp.life) * 30);
          ctx.shadowBlur = 0;
          ctx.restore();
        }
        return true;
      });

      // Check fusions for dragging nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (!nodes[i].dragging && !nodes[j].dragging) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            const key = [nodes[i].id, nodes[j].id].sort().join("+");
            if (!fusedPairsRef.current.has(key)) {
              fusedPairsRef.current.add(key);
              const label = getFusionLabel(nodes[i].id, nodes[j].id);
              spawnExplosion((nodes[i].x + nodes[j].x) / 2, (nodes[i].y + nodes[j].y) / 2, label);
              spawnParticles(nodes[i].x, nodes[i].y, nodes[i].color, 20);
              spawnParticles(nodes[j].x, nodes[j].y, nodes[j].color, 20);
              nodes[i].fused = true;
              nodes[j].fused = true;
              nodes[i].fusionPartner = nodes[j].id;
              nodes[j].fusionPartner = nodes[i].id;
              fusionCallbackRef.current?.(key, label);
            }
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
  }, []);

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <Atom size={14} /> Interactive Skill Lab
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Drag skills together to <span className="text-emerald-400">fuse</span> them
          </h2>
          <p className="text-lg text-slate-400 mt-4 max-w-2xl mx-auto">
            Drag any two skill nodes close together to discover a new specialization.
            Watch the fusion explosion and see your learning path evolve.
          </p>
        </div>

        {fusionMessage && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold animate-pulse">
              <Zap size={16} /> Fusion Unlocked: {fusionMessage}
            </div>
          </div>
        )}

        <div ref={containerRef} className="relative w-full h-[500px] rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
            <div className="flex items-center gap-6 px-5 py-2.5 rounded-xl bg-slate-800/80 backdrop-blur border border-slate-700/50 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </span>
                Drag nodes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                  <Zap size={10} className="text-blue-400" />
                </span>
                Fuse = New Skill
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                  <span className="text-[8px] text-violet-400 font-bold">{fusedDisplay.length}/{TOTAL_PAIRS}</span>
                </span>
                {fusedDisplay.length > 0 ? "Fused" : "Discover all"}
              </span>
            </div>
          </div>
        </div>

        {fusedDisplay.length > 0 && (
          <div className="mt-8">
            <h3 className="text-center text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Discovered Specializations</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {fusedDisplay.map((entry) => {
                const [key, label] = entry.split("=");
                const [a, b] = key.split("+");
                return (
                  <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <span className="capitalize">{a}</span>
                    <Zap size={10} />
                    <span className="capitalize">{b}</span>
                    <span className="text-emerald-300 font-bold">= {label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
