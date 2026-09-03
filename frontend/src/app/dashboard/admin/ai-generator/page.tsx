"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Microscope, BookOpen, BarChart3, Loader2,
  Copy, Check, Target, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";


interface Lab { id: string; title: string; difficulty: number; description: string }
interface Assessment { id: string; title: string; description: string; category: string }
interface Course { id: string; title: string; description: string }

interface BriefingResult {
  briefing: string;
  objectives: string[];
  prerequisites: string[];
}

interface QuestionsResult {
  questions: Array<{
    text: string;
    options: Array<{ key: string; text: string }>;
    correctAnswer: string;
    category: string;
  }>;
}

interface OutlineResult {
  modules: Array<{
    title: string;
    description: string;
    lessons: Array<{ title: string; type: string }>;
  }>;
}

interface CalibrationResult {
  labId: string;
  title: string;
  currentDifficulty: number;
  newDifficulty: number;
  adjustment: number;
  reasons: string[];
  metrics: { completionRate: number; failureRate: number; avgTimeMinutes: number; totalAttempts: number };
  changed: boolean;
  suggestion?: string;
  message?: string;
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = typeof children === "string" ? children : JSON.stringify(children, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h4 className="font-medium text-white text-sm">{title}</h4>
        <button onClick={handleCopy} className="text-xs text-slate-500 hover:text-[#7AD62A] flex items-center gap-1 transition-colors">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function BriefingOutput({ data }: { data: BriefingResult }) {
  return (
    <div className="space-y-4">
      <div>
        <h5 className="text-xs font-medium text-slate-500 mb-2">SCENARIO BRIEFING</h5>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{data.briefing}</p>
      </div>
      {data.objectives.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-slate-500 mb-2">LEARNING OBJECTIVES</h5>
          <ul className="space-y-1">
            {data.objectives.map((obj, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <CheckCircle size={14} className="text-[#7AD62A] mt-0.5 shrink-0" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.prerequisites.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-slate-500 mb-2">PREREQUISITES</h5>
          <div className="flex flex-wrap gap-2">
            {data.prerequisites.map((prereq, i) => (
              <span key={i} className="px-2 py-1 rounded-full text-xs bg-white/5 text-slate-400">{prereq}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsOutput({ data }: { data: QuestionsResult }) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-medium text-slate-500">{data.questions.length} QUESTIONS GENERATED</h5>
      {data.questions.map((q, i) => (
        <div key={i} className="border border-white/10 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-xs font-bold text-[#7AD62A] shrink-0">{i + 1}</span>
              <span className="text-sm text-slate-300 truncate">{q.text}</span>
            </div>
            {expanded === i ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
          </button>
          {expanded === i && (
            <div className="px-4 pb-3 border-t border-slate-50">
              <div className="space-y-1.5 mt-2">
                {q.options.map((opt) => (
                  <div key={opt.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    opt.key === q.correctAnswer ? "bg-[#7AD62A]/10 text-[#7AD62A] font-medium" : "bg-white/5 text-slate-400"
                  }`}>
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs shrink-0">{opt.key}</span>
                    {opt.text}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-400">Category:</span>
                <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{q.category}</span>
                <span className="text-xs text-[#7AD62A] font-medium">Answer: {q.correctAnswer}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OutlineOutput({ data }: { data: OutlineResult }) {
  return (
    <div className="space-y-4">
      <h5 className="text-xs font-medium text-slate-500">{data.modules.length} MODULES GENERATED</h5>
      {data.modules.map((mod, i) => (
        <div key={i} className="border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-[#7AD62A] flex items-center justify-center text-xs font-bold text-white shrink-0">{i + 1}</span>
            <h6 className="font-medium text-white text-sm">{mod.title}</h6>
          </div>
          <p className="text-xs text-slate-500 mb-2 ml-8">{mod.description}</p>
          <div className="ml-8 space-y-1">
            {mod.lessons.map((lesson, j) => (
              <div key={j} className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  lesson.type === "lab" ? "bg-amber-500/10 text-amber-400" :
                  lesson.type === "quiz" ? "bg-violet-500/10 text-violet-700" :
                  lesson.type === "video" ? "bg-blue-500/10 text-blue-400" :
                  "bg-white/5 text-slate-400"
                }`}>{lesson.type.toUpperCase()}</span>
                {lesson.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AIGeneratorPage() {
  const [activeTab, setActiveTab] = useState<"briefing" | "questions" | "outline" | "calibrate">("briefing");

  // Data lists
  const [labs, setLabs] = useState<Lab[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Selections
  const [selectedLab, setSelectedLab] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [questionCount, setQuestionCount] = useState(5);

  // Results
  const [briefingResult, setBriefingResult] = useState<BriefingResult | null>(null);
  const [questionsResult, setQuestionsResult] = useState<QuestionsResult | null>(null);
  const [outlineResult, setOutlineResult] = useState<OutlineResult | null>(null);
  const [calibrationAll, setCalibrationAll] = useState<CalibrationResult[]>([]);

  // Loading
  const [loadingData, setLoadingData] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchApi("/labs").catch(() => []),
      fetchApi("/assessments").catch(() => []),
      fetchApi("/courses").catch(() => []),
    ]).then(([l, a, c]) => {
      if (!cancelled) {
        setLabs(Array.isArray(l) ? l : []);
        setAssessments(Array.isArray(a) ? a : []);
        setCourses(Array.isArray(c) ? c : []);
      }
    }).finally(() => { if (!cancelled) setLoadingData(false); });
    return () => { cancelled = true; };
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      if (activeTab === "briefing") {
        if (!selectedLab) { toast.error("Select a lab"); return; }
        const data = await fetchApi("/ai/generate/briefing", { method: "POST", body: JSON.stringify({ labId: selectedLab }), timeout: 120000 });
        setBriefingResult(data);
        toast.success("Briefing generated");
      } else if (activeTab === "questions") {
        if (!selectedAssessment) { toast.error("Select an assessment"); return; }
        const data = await fetchApi("/ai/generate/questions", { method: "POST", body: JSON.stringify({ assessmentId: selectedAssessment, count: questionCount }), timeout: 120000 });
        setQuestionsResult(data);
        toast.success(`${data.questions.length} questions generated`);
      } else if (activeTab === "outline") {
        if (!selectedCourse) { toast.error("Select a course"); return; }
        const data = await fetchApi("/ai/generate/outline", { method: "POST", body: JSON.stringify({ courseId: selectedCourse }), timeout: 120000 });
        setOutlineResult(data);
        toast.success(`${data.modules.length} modules generated`);
      } else if (activeTab === "calibrate") {
        const data = await fetchApi("/ai/calibrate-all", { method: "POST", timeout: 120000 });
        setCalibrationAll(data);
        toast.success(`Calibrated ${data.length} labs`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [activeTab, selectedLab, selectedAssessment, selectedCourse, questionCount]);

  const tabs = [
    { key: "briefing" as const, label: "Lab Briefing", icon: Microscope, desc: "Generate scenario, objectives, prerequisites" },
    { key: "questions" as const, label: "Questions", icon: Target, desc: "Generate MCQ assessment questions" },
    { key: "outline" as const, label: "Course Outline", icon: BookOpen, desc: "Generate module structure and lessons" },
    { key: "calibrate" as const, label: "Calibrate", icon: BarChart3, desc: "Auto-adjust lab difficulty from analytics" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 border border-white/10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <Sparkles size={24} className="text-[#7AD62A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Content Engine</h1>
              <p className="text-sm text-slate-500">Generate lab briefings, assessment questions, course outlines, and calibrate difficulty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-[#7AD62A]/10 border-[#7AD62A] shadow-sm"
                : "bg-[#0f172a] border-white/10 hover:border-white/10"
            }`}
          >
            <tab.icon size={18} className={activeTab === tab.key ? "text-[#7AD62A]" : "text-slate-400"} />
            <div className={`text-sm font-medium mt-2 ${activeTab === tab.key ? "text-[#7AD62A]" : "text-slate-300"}`}>{tab.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Input + Generate */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-[#7AD62A]" size={24} />
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "briefing" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Select Lab</label>
                <select value={selectedLab} onChange={(e) => setSelectedLab(e.target.value)} className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]">
                  <option value="">Choose a lab...</option>
                  {labs.map((l) => <option key={l.id} value={l.id}>{l.title} (ELO {l.difficulty})</option>)}
                </select>
              </div>
            )}

            {activeTab === "questions" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Select Assessment</label>
                  <select value={selectedAssessment} onChange={(e) => setSelectedAssessment(e.target.value)} className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]">
                    <option value="">Choose an assessment...</option>
                    {assessments.map((a) => <option key={a.id} value={a.id}>{a.title} ({a.category})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Number of Questions</label>
                  <input type="number" min={1} max={20} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]" />
                </div>
              </div>
            )}

            {activeTab === "outline" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Select Course</label>
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]">
                  <option value="">Choose a course...</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            )}

            {activeTab === "calibrate" && (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-200 rounded-lg">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Auto-calibrate all labs</p>
                  <p className="text-xs text-amber-600">This will analyze completion rates and failure rates, then adjust difficulty ELO ratings automatically. Labs with insufficient data (less than 5 attempts) will be skipped.</p>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#7AD62A] text-white rounded-lg text-sm font-medium hover:bg-[#1e8a55] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? "Generating..." : activeTab === "calibrate" ? "Calibrate All Labs" : "Generate"}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {activeTab === "briefing" && briefingResult && (
        <ResultCard title="Generated Lab Briefing">
          <BriefingOutput data={briefingResult} />
        </ResultCard>
      )}

      {activeTab === "questions" && questionsResult && (
        <ResultCard title="Generated Questions">
          <QuestionsOutput data={questionsResult} />
        </ResultCard>
      )}

      {activeTab === "outline" && outlineResult && (
        <ResultCard title="Generated Course Outline">
          <OutlineOutput data={outlineResult} />
        </ResultCard>
      )}

      {activeTab === "calibrate" && calibrationAll.length > 0 && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h3 className="font-semibold text-white">Calibration Results ({calibrationAll.length} labs)</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {calibrationAll.map((r) => (
              <div key={r.labId} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white text-sm">{r.title}</span>
                  {r.changed ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#7AD62A]/10 text-[#7AD62A]">Adjusted</span>
                  ) : r.suggestion === "insufficient_data" ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">No Data</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-slate-400">OK</span>
                  )}
                </div>
                {r.reasons && r.reasons.length > 0 && (
                  <div className="text-xs text-slate-500">{r.reasons[0]}</div>
                )}
                {r.message && (
                  <div className="text-xs text-slate-500">{r.message}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
