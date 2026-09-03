"use client";

import { useState, useRef, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import {
  GraduationCap,
  Send,
  X,
  Bot,
  User,
  Loader2,
  HelpCircle,
  Lightbulb,
  Brain,
  Target,
  Wrench,
  CircleHelp,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  method?: string;
  followUpQuestions?: string[];
  conceptTags?: string[];
}

const SUGGESTIONS = [
  { label: "What should I study next?", icon: Target },
  { label: "Explain a concept", icon: Lightbulb },
  { label: "Help me with a lab", icon: Wrench },
  { label: "Why is this important?", icon: CircleHelp },
];

export default function TutorChat({
  labId,
  currentStep,
}: {
  labId?: string;
  currentStep?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI tutor. I'll guide you through concepts using questions and hints rather than giving direct answers. What would you like to explore?",
      method: "direct",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: msg },
      { role: "assistant", content: "" },
    ]);
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetchApi("/ai/tutor/chat", {
        method: "POST",
        timeout: 60000,
        body: JSON.stringify({
          message: msg,
          history,
          context: labId ? { labId, currentStep } : undefined,
        }),
      });

      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        lastMsg.content = response.response;
        lastMsg.method = response.method;
        lastMsg.followUpQuestions = response.followUpQuestions;
        lastMsg.conceptTags = response.conceptTags;
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content =
          "Sorry, I couldn't process that. Please try again.";
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function getMethodIcon(method?: string) {
    switch (method) {
      case "socratic":
        return <HelpCircle size={10} className="text-purple-500" />;
      case "hint":
        return <Lightbulb size={10} className="text-amber-500" />;
      case "encouragement":
        return <Brain size={10} className="text-blue-500" />;
      default:
        return null;
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 left-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all"
        style={{
          background: isOpen ? "#0F203A" : "#7AD62A",
          color: isOpen ? "white" : "#0F203A",
        }}
      >
        <GraduationCap size={18} />
        <span className="text-sm font-medium">Tutor</span>
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-36 left-4 z-50 w-96 h-[500px] bg-[#0f172a] rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: "#0F203A" }}
          >
            <div className="flex items-center gap-2">
              <GraduationCap size={18} style={{ color: "#7AD62A" }} />
              <div>
                <span className="text-white font-semibold text-sm">
                  AI Tutor
                </span>
                <span className="text-slate-400 text-xs block">
                  Socratic method • Adaptive hints
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#E9F8EE" }}
                    >
                      <Bot size={12} style={{ color: "#229C62" }} />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-[#7AD62A] text-white rounded-br-sm"
                        : "bg-slate-800 text-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {msg.content || (
                      <Loader2
                        size={14}
                        className="animate-spin text-slate-400"
                      />
                    )}
                    {msg.role === "assistant" && msg.method && (
                      <div className="flex items-center gap-1 mt-1 pt-1 border-t border-white/10">
                        {getMethodIcon(msg.method)}
                        <span className="text-[10px] text-slate-400 capitalize">
                          {msg.method}
                        </span>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#0F203A" }}
                    >
                      <User size={12} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Follow-up questions */}
                {msg.followUpQuestions &&
                  msg.followUpQuestions.length > 0 &&
                  i === messages.length - 1 && (
                    <div className="ml-8 mt-2 space-y-1">
                      {msg.followUpQuestions.map((q, qi) => (
                        <button
                          key={qi}
                          onClick={() => sendMessage(q)}
                          className="block text-xs text-left px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:border-[#7AD62A] hover:text-[#7AD62A] hover:bg-[#7AD62A]/10 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                {/* Concept tags */}
                {msg.conceptTags &&
                  msg.conceptTags.length > 0 &&
                  i === messages.length - 1 && (
                    <div className="ml-8 mt-1 flex flex-wrap gap-1">
                      {msg.conceptTags.map((tag, ti) => (
                        <span
                          key={ti}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-purple-50 text-purple-600 border border-purple-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.label)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-full border border-white/10 text-slate-300 hover:border-[#7AD62A] hover:text-[#7AD62A] hover:bg-[#7AD62A]/10 transition-colors"
                  >
                    <s.icon size={12} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question or describe what you need help with..."
                className="flex-1 px-3 py-2 text-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-[#7AD62A] focus:border-transparent outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 rounded-lg text-white disabled:opacity-50 transition-colors"
                style={{ background: "#229C62" }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
