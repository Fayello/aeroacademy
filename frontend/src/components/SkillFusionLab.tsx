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

const SKILLS: Omit<SkillNode, "x" | "y" | "vx" | "vy" | "radius" | "pulse" | "pulseDir" | "dragging" | "fused" | "fusionPartner">[] = [
  { id: "security", label: "Security", icon: Shield, color: "#10b981", glow: "rgba(16,185,129,0.4)" },
  { id: "linux", label: "Linux", icon: Terminal, color: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  { id: "devops", label: "DevOps", icon: Layers, color: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  { id: "cloud", label: "Cloud", icon: Cloud, color: "#8b5cf6", glow: "rgba(139,92,246,0.4)" },
  { id: "coding", label: "Coding", icon: Code2, color: "#ef4444", glow: "rgba(239,68,68,0.4)" },
  { id: "automation", label: "Automation", icon: Zap, color: "#06b6d4", glow: "rgba(6,182,212,0.4)" },
  { id: "analysis", label: "Analysis", icon: Atom, color: "#ec4899", glow: "rgba(236,72,153,0.4)" },
];

const FUSIONS: Record<string, string> = {
  "security+linux": "Penetration Testing",
  "linux+devops": "SRE Mastery",
  "devops+cloud": "Cloud Architecture",
  "cloud+coding": "Platform Engineering",
  "security+coding": "Secure Development",
  "automation+linux": "Infrastructure Automation",
  "devops+security": "DevSecOps",
  "cloud+security": "Cloud Security",
  "coding+analysis": "Data Engineering",
  "automation+cloud": "Cloud Automation",
  "automation+coding": "CI/CD Pipelines",
  "linux+coding": "Systems Programming",
  "security+cloud": "Cloud Security",
  "analysis+security": "Threat Intelligence",
  "analysis+devops": "Observability",
  "linux+cloud": "Cloud Linux",
  "coding+devops": "Full-Stack DevOps",
  "automation+security": "Security Automation",
  "analysis+linux": "Forensics",
  "analysis+coding": "Reverse Engineering",
};

function getFusionLabel(a: string, b: string): string {
  return FUSIONS[`${a}+${b}`] || FUSIONS[`${b}+${a}`] || "Specialization";
}

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

export default function SkillFusionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<SkillNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const explosionsRef = useRef<FusionExplosion[]>([]);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dragNodeRef = useRef<SkillNode | null>(null);
  const [fusedPairs, setFusedPairs] = useState<Set<string>>(new Set());
  const [fusionMessage, setFusionMessage] = useState<string>("");
  const fusionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initNodes = useCallback((w: number, h: number) => {
    const padding = 80;
    const nodes = SKILLS.map((s, i) => {
      const angle = (i / SKILLS.length) * Math.PI * 2;
      const dist = Math.min(w, h) * 0.28;
      return {
        ...s,
        x: w / 2 + Math.cos(angle) * dist,
        y: h / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 32,
        pulse: 0,
        pulseDir: 1,
        dragging: false,
        fused: false,
        fusionPartner: null,
      };
    });
    nodesRef.current = nodes;
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  }, []);

  const spawnFusionExplosion = useCallback((x: number, y: number, label: string) => {
    const p: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      p.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 4 + 2,
      });
    }
    explosionsRef.current.push({ x, y, life: 1, particles: p, label });
  }, []);

  const checkFusion = useCallback((nodeA: SkillNode, nodeB: SkillNode) => {
    const dx = nodeA.x - nodeB.x;
    const dy = nodeA.y - nodeB.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 60) {
      const key = [nodeA.id, nodeB.id].sort().join("+");
      if (!fusedPairs.has(key)) {
        const label = getFusionLabel(nodeA.id, nodeB.id);
        setFusedPairs((prev) => new Set([...prev, key]));
        spawnFusionExplosion((nodeA.x + nodeB.x) / 2, (nodeA.y + nodeB.y) / 2, label);
        spawnParticles(nodeA.x, nodeA.y, nodeA.color, 20);
        spawnParticles(nodeB.x, nodeB.y, nodeB.color, 20);
        nodeA.fused = true;
        nodeB.fused = true;
        nodeA.fusionPartner = nodeB.id;
        nodeB.fusionPartner = nodeA.id;
        setFusionMessage(label);
        if (fusionTimeoutRef.current) clearTimeout(fusionTimeoutRef.current);
        fusionTimeoutRef.current = setTimeout(() => setFusionMessage(""), 3000);
      }
    }
  }, [fusedPairs, spawnParticles, spawnFusionExplosion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      if (nodesRef.current.length === 0) {
        initNodes(rect.width, rect.height);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const node of nodesRef.current) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (dx * dx + dy * dy < node.radius * node.radius) {
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
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
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

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouseRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      if (dragNodeRef.current) {
        dragNodeRef.current.x = mouseRef.current.x;
        dragNodeRef.current.y = mouseRef.current.y;
        dragNodeRef.current.vx = 0;
        dragNodeRef.current.vy = 0;
      }
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

    const W = () => canvas.width / window.devicePixelRatio;
    const H = () => canvas.height / window.devicePixelRatio;

    const drawConnections = () => {
      const nodes = nodesRef.current;
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
            const isFused = fusedPairs.has(key);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = isFused
              ? `rgba(16,185,129,${0.6 + Math.sin(Date.now() / 300) * 0.3})`
              : `rgba(148,163,184,${alpha})`;
            ctx.lineWidth = isFused ? 2.5 : 1;
            if (isFused) {
              ctx.shadowColor = "rgba(16,185,129,0.5)";
              ctx.shadowBlur = 10;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }
    };

    const drawAmbientParticles = () => {
      const w = W();
      const h = H();
      if (Math.random() < 0.15) {
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
        ctx.fillStyle = p.color + Math.floor(p.life * 80).toString(16).padStart(2, "0");
        ctx.fill();
        return true;
      });
    };

    const drawExplosions = () => {
      explosionsRef.current = explosionsRef.current.filter((exp) => {
        exp.life -= 0.015;
        if (exp.life <= 0) return false;
        exp.particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.life -= 0.02;
          if (p.life > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.floor(p.life * 200).toString(16).padStart(2, "0");
            ctx.fill();
          }
        });
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
    };

    const drawNodes = () => {
      const w = W();
      const h = H();
      nodesRef.current.forEach((node) => {
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
        ctx.strokeStyle = isFused ? "#10b981" : node.color + "40";
        ctx.lineWidth = isFused ? 2.5 : 1.5;
        ctx.stroke();

        // Main circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        bg.addColorStop(0, node.color + "30");
        bg.addColorStop(1, node.color + "10");
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = isFused ? "#10b981" : node.color + "80";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon
        ctx.save();
        ctx.translate(node.x, node.y);
        const IconComponent = node.icon;
        const iconSize = 20;
        // Draw icon as SVG path
        const svgStr = new XMLSerializer().serializeToString(
          (IconComponent as any).toSvg ? (IconComponent as any).toSvg({ size: iconSize }) : document.createElementNS("http://www.w3.org/2000/svg", "svg")
        );
        // Fallback: draw letter
        ctx.font = `bold ${iconSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isFused ? "#10b981" : node.color;
        ctx.fillText(node.label.charAt(0), 0, 0);
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
      });
    };

    // Check fusions for all pairs
    const checkAllFusions = () => {
      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].dragging || nodes[j].dragging) {
            checkFusion(nodes[i], nodes[j]);
          }
        }
      }
    };

    const animate = () => {
      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);
      drawConnections();
      drawAmbientParticles();
      drawNodes();
      drawExplosions();
      checkAllFusions();
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [initNodes, checkFusion, fusedPairs]);

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background grid */}
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

        {/* Fusion notification */}
        {fusionMessage && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold animate-pulse">
              <Zap size={16} /> Fusion Unlocked: {fusionMessage}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div ref={containerRef} className="relative w-full h-[500px] rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center">
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
                  <span className="text-[8px] text-violet-400 font-bold">{fusedPairs.size}/{Math.floor(SKILLS.length * (SKILLS.length - 1) / 2)}</span>
                </span>
                {fusedPairs.size > 0 ? "Fused" : "Discover all"}
              </span>
            </div>
          </div>
        </div>

        {/* Discovered fusions */}
        {fusedPairs.size > 0 && (
          <div className="mt-8">
            <h3 className="text-center text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Discovered Specializations</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from(fusedPairs).map((key) => {
                const [a, b] = key.split("+");
                const label = getFusionLabel(a, b);
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
