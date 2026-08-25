"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Lightbulb,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Brain,
} from "lucide-react";

interface LabAssistPanelProps {
  labId: string;
  labTitle: string;
  currentStep?: string;
  errorOutput?: string;
  flagTitle?: string;
}

interface AssistResponse {
  hint: string;
  approach: string;
  nextSteps: string[];
  relatedConcepts: string[];
  difficulty: string;
}

export default function LabAssistPanel({
  labId,
  labTitle,
  currentStep,
  errorOutput,
  flagTitle,
}: LabAssistPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AssistResponse | null>(null);
  const [history, setHistory] = useState<
    Array<{ level: number; response: AssistResponse }>
  >([]);
  const [context, setContext] = useState("");

  const hintLabels = ["Vague", "Moderate", "Explicit"];
  const hintColors = ["text-slate-500", "text-amber-600", "text-red-600"];

  async function requestHint() {
    setLoading(true);
    try {
      const result = await fetchApi("/ai/tutor/lab-assist", {
        method: "POST",
        body: JSON.stringify({
          labId,
          currentStep: currentStep || context || undefined,
          errorOutput,
          flagTitle,
          hintLevel,
        }),
      });
      setResponse(result);
      setHistory((prev) => [...prev, { level: hintLevel, response: result }]);
    } catch (err) {
      console.error("Lab assist failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all"
        style={{
          background: isOpen ? "#0F203A" : "#229C62",
          color: "white",
        }}
      >
        <Lightbulb size={18} />
        <span className="text-sm font-medium">Lab Assist</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100" style={{ background: "#E9F8EE" }}>
            <div className="flex items-center gap-2">
              <Lightbulb size={16} style={{ color: "#229C62" }} />
              <span className="font-semibold text-sm" style={{ color: "#0F203A" }}>
                Lab Assist — {labTitle}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {/* Hint level selector */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Hint Level
              </label>
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    onClick={() => setHintLevel(level)}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      hintLevel === level
                        ? "border-[#229C62] bg-[#E9F8EE] text-[#229C62]"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {hintLabels[level - 1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Context input */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                What are you working on?
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Trying to find the SQL injection"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#229C62] focus:border-transparent outline-none"
              />
            </div>

            {/* Request hint button */}
            <button
              onClick={requestHint}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: "#229C62" }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              {loading ? "Getting hint..." : "Get Hint"}
            </button>

            {/* Response */}
            {response && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {/* Hint */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={12} className="text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">
                      Hint ({hintLabels[hintLevel - 1]})
                    </span>
                  </div>
                  <p className="text-sm text-amber-900">{response.hint}</p>
                </div>

                {/* Approach */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target size={12} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">
                      Approach
                    </span>
                  </div>
                  <p className="text-sm text-blue-900">{response.approach}</p>
                </div>

                {/* Next steps */}
                {response.nextSteps.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-600 block mb-1.5">
                      Next Steps
                    </span>
                    <ul className="space-y-1">
                      {response.nextSteps.map((step, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                          <span className="text-[#229C62] mt-0.5">→</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concepts */}
                {response.relatedConcepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {response.relatedConcepts.map((concept, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-100"
                      >
                        <Brain size={10} />
                        {concept}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {history.length > 1 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-400">
                  {history.length} hints requested
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
