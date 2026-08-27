"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2,
  BookOpen, Microscope, ClipboardCheck, ArrowRight, Sparkles, BarChart3, Zap,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

type Any = any;

interface SkillGapReport {
  userId: string;
  domains: Array<{
    domain: string;
    mastery: number;
    level: string;
    labsCompleted: number;
    assessmentsTaken: number;
    avgAssessmentScore: number;
    skillCount: number;
    skills: Array<{ skill: string; mastery: number; lastPracticed: string | null; isDecaying: boolean }>;
  }>;
  overallScore: number;
  weakestDomain: string;
  strongestDomain: string;
  recommendations: Array<{ type: string; title: string; reason: string; priority: string }>;
}

interface PersonalizedPath {
  title: string;
  description: string;
  estimatedHours: number;
  steps: Array<{
    order: number;
    type: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    skillTargets: string[];
  }>;
}

function MasteryBar({ mastery, domain }: { mastery: number; domain: string }) {
  const color = mastery >= 70 ? "#229C62" : mastery >= 40 ? "#d97706" : "#dc2626";
  const bgColor = mastery >= 70 ? "bg-[#7AD62A]" : mastery >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-300 font-medium">{domain}</span>
        <span className="font-semibold" style={{ color }}>{mastery.toFixed(0)}%</span>
      </div>
      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full ${bgColor} transition-all duration-700`} style={{ width: `${mastery}%` }} />
      </div>
    </div>
  );
}

function RadarChart({ domains }: { domains: Array<{ domain: string; mastery: number }> }) {
  const size = 240;
  const center = size / 2;
  const maxRadius = 90;
  const levels = 5;
  const angleStep = (Math.PI * 2) / Math.max(domains.length, 1);

  const getPoint = (angle: number, radius: number) => ({
    x: center + radius * Math.cos(angle - Math.PI / 2),
    y: center + radius * Math.sin(angle - Math.PI / 2),
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid circles */}
      {Array.from({ length: levels }, (_, i) => {
        const r = (maxRadius / levels) * (i + 1);
        return (
          <circle key={i} cx={center} cy={center} r={r} fill="none" stroke="#e2e8f0" strokeWidth="1" />
        );
      })}

      {/* Grid lines */}
      {domains.map((_, i) => {
        const angle = i * angleStep;
        const p = getPoint(angle, maxRadius);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />;
      })}

      {/* Data polygon */}
      {domains.length > 0 && (
        <polygon
          points={domains.map((d, i) => {
            const angle = i * angleStep;
            const r = (d.mastery / 100) * maxRadius;
            const p = getPoint(angle, r);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="rgba(34, 156, 98, 0.15)"
          stroke="#229C62"
          strokeWidth="2"
        />
      )}

      {/* Data points */}
      {domains.map((d, i) => {
        const angle = i * angleStep;
        const r = (d.mastery / 100) * maxRadius;
        const p = getPoint(angle, r);
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#229C62" />;
      })}

      {/* Labels */}
      {domains.map((d, i) => {
        const angle = i * angleStep;
        const p = getPoint(angle, maxRadius + 20);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            className="text-[10px] fill-slate-600 font-medium">
            {d.domain}
          </text>
        );
      })}
    </svg>
  );
}

export default function SkillGapPage() {
  const [report, setReport] = useState<SkillGapReport | null>(null);
  const [path, setPath] = useState<PersonalizedPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"gaps" | "path">("gaps");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchApi("/ai/skill-gaps"),
      fetchApi("/ai/personalized-path"),
    ]).then(([g, p]) => {
      if (!cancelled) { setReport(g); setPath(p); }
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Skill gap data unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 border border-white/10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <Target size={24} className="text-[#7AD62A]" />
            </div>
            <PageHeader title="Skill Gap Analysis" description="Your competency profile across all domains" />
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm">
              <span className="text-slate-500">Overall Score:</span>{" "}
              <span className="font-bold text-[#7AD62A]">{report.overallScore}%</span>
            </div>
            <div className="bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm">
              <span className="text-slate-500">Strongest:</span>{" "}
              <span className="font-bold text-[#7AD62A]">{report.strongestDomain}</span>
            </div>
            <div className="bg-[#0f172a] rounded-lg border border-white/10 px-4 py-2 text-sm">
              <span className="text-slate-500">Weakest:</span>{" "}
              <span className="font-bold text-red-600">{report.weakestDomain}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab("gaps")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "gaps" ? "bg-[#7AD62A] text-white" : "bg-[#0f172a] border border-white/10 text-slate-400 hover:bg-white/5"}`}>
          <Target size={14} className="inline mr-1.5" /> Skill Gaps
        </button>
        <button onClick={() => setActiveTab("path")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "path" ? "bg-[#7AD62A] text-white" : "bg-[#0f172a] border border-white/10 text-slate-400 hover:bg-white/5"}`}>
          <Sparkles size={14} className="inline mr-1.5" /> Learning Path
        </button>
      </div>

      {activeTab === "gaps" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Radar Chart */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6 flex flex-col items-center">
            <h3 className="font-semibold text-white mb-4">Competency Radar</h3>
            <RadarChart domains={report.domains} />
          </div>

          {/* Domain Breakdown */}
          <div className="lg:col-span-2 space-y-4">
            {report.domains.map((d) => (
              <div key={d.domain} className="bg-[#0f172a] rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{d.domain}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.level === "Expert" ? "bg-[#7AD62A]/10 text-[#7AD62A]" :
                      d.level === "Advanced" ? "bg-blue-500/10 text-blue-400" :
                      d.level === "Intermediate" ? "bg-amber-500/10 text-amber-400" :
                      "bg-white/5 text-slate-400"
                    }`}>{d.level}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{d.labsCompleted} labs</span>
                    <span>{d.assessmentsTaken} assessments</span>
                    {d.avgAssessmentScore > 0 && <span>Avg: {d.avgAssessmentScore}%</span>}
                  </div>
                </div>
                <MasteryBar mastery={d.mastery} domain={d.domain} />
                {d.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.skills.slice(0, 8).map((s) => (
                      <span key={s.skill} className={`px-2 py-0.5 rounded-full text-[10px] ${
                        s.isDecaying ? "bg-amber-500/10 text-amber-600" :
                        s.mastery >= 70 ? "bg-[#7AD62A]/10 text-[#7AD62A]" :
                        s.mastery >= 40 ? "bg-blue-500/10 text-blue-400" :
                        "bg-red-500/10 text-red-600"
                      }`}>
                        {s.skill} {s.mastery.toFixed(0)}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "path" && path && (
        <div className="space-y-4">
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <h3 className="font-semibold text-white mb-2">{path.title}</h3>
            <p className="text-sm text-slate-500 mb-1">{path.description}</p>
            <p className="text-xs text-slate-400">Estimated time: {path.estimatedHours} hours</p>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
            <div className="space-y-4">
              {path.steps.map((step) => (
                <div key={step.order} className="relative flex gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    step.type === "lab" ? "bg-amber-500/10" :
                    step.type === "assessment" ? "bg-violet-500/10" :
                    step.type === "course" ? "bg-blue-500/10" :
                    "bg-white/5"
                  }`}>
                    {step.type === "lab" ? <Microscope size={18} className="text-amber-600" /> :
                     step.type === "assessment" ? <ClipboardCheck size={18} className="text-violet-600" /> :
                     step.type === "course" ? <BookOpen size={18} className="text-blue-400" /> :
                     <Target size={18} className="text-slate-400" />}
                  </div>
                  <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white text-sm">{step.title}</h4>
                      <span className="text-xs text-slate-400">{step.estimatedMinutes}m</span>
                    </div>
                    <p className="text-xs text-slate-500">{step.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {step.skillTargets.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-500">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {activeTab === "gaps" && report.recommendations.length > 0 && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={16} className="text-[#7AD62A]" /> Recommended Next Steps
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  rec.type === "lab" ? "bg-amber-500/10" :
                  rec.type === "assessment" ? "bg-violet-500/10" : "bg-blue-500/10"
                }`}>
                  {rec.type === "lab" ? <Microscope size={14} className="text-amber-600" /> :
                   rec.type === "assessment" ? <ClipboardCheck size={14} className="text-violet-600" /> :
                   <BookOpen size={14} className="text-blue-400" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{rec.title}</div>
                  <div className="text-xs text-slate-500">{rec.reason}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                  rec.priority === "high" ? "bg-red-500/10 text-red-400" :
                  rec.priority === "medium" ? "bg-amber-500/10 text-amber-400" :
                  "bg-white/5 text-slate-400"
                }`}>{rec.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
