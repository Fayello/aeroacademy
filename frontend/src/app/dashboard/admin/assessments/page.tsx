"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { ClipboardCheck, Plus, Pencil, Trash2, Loader2, ArrowLeft, ChevronDown, ChevronUp, X } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import toast from "@/lib/toast";
import Link from "next/link";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminSelect, AdminNumber } from "@/components/admin/AdminForm";
import PageHeader from "@/components/ui/PageHeader";

interface AssessmentQuestion {
  text: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  category: string;
}

interface AssessmentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: AssessmentQuestion[];
}

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: AssessmentItem | null }>({ open: false, editing: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: AssessmentItem | null }>({ open: false, item: null });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Web Security",
    questions: [
      { text: "", options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }], correctAnswer: "A", category: "General" },
    ] as AssessmentQuestion[],
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchApi<AssessmentItem[]>("/assessments");
      setAssessments(data);
    } catch {
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({
      title: "",
      description: "",
      category: "Web Security",
      questions: [
        { text: "", options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }], correctAnswer: "A", category: "General" },
      ],
    });
    setModal({ open: true, editing: null });
  };

  const openEdit = (a: AssessmentItem) => {
    setForm({
      title: a.title,
      description: a.description,
      category: a.category,
      questions: a.questions.length > 0 ? a.questions : [
        { text: "", options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }], correctAnswer: "A", category: "General" },
      ],
    });
    setModal({ open: true, editing: a });
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        { text: "", options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }], correctAnswer: "A", category: "General" },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    if (form.questions.length <= 1) return;
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) });
  };

  const updateQuestion = (index: number, field: keyof AssessmentQuestion, value: string) => {
    const updated = [...form.questions];
    updated[index] = { ...updated[index], [field]: value } as AssessmentQuestion;
    setForm({ ...form, questions: updated });
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...form.questions];
    updated[qIndex].options[oIndex].text = text;
    setForm({ ...form, questions: updated });
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast.error("Title and description are required");
      return;
    }
    if (form.questions.some((q) => !q.text)) {
      toast.error("All questions must have text");
      return;
    }
    setSaving(true);
    try {
      await fetchApi("/assessments", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success(modal.editing ? "Assessment updated" : "Assessment created");
      setModal({ open: false, editing: null });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchApi(`/assessments/${id}`, { method: "DELETE" });
      toast.success("Assessment deleted");
      setDeleteDialog({ open: false, item: null });
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#229C62] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ArrowLeft size={14} /> Admin
      </Link>
      <PageHeader title="Assessments" description={`${assessments.length} assessments`} action={
        <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1.5">
          <Plus size={14} /> Create Assessment
        </button>
      } />

      <div className="space-y-3">
        {assessments.map((a) => (
          <div key={a.id} className="angular-card bg-white overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleExpand(a.id)}>
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ClipboardCheck size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{a.title}</p>
                  <p className="text-[11px] text-slate-400">{a.questions.length} questions | {a.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteDialog({ open: true, item: a })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
                <button onClick={() => toggleExpand(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  {expanded.has(a.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>
            {expanded.has(a.id) && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
                <p className="text-xs text-slate-500">{a.description}</p>
                {a.questions.map((q, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-700">{i + 1}. {q.text}</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-1">
                      {q.options.map((opt) => (
                        <span key={opt.key} className={`text-[10px] px-2 py-0.5 rounded ${opt.key === q.correctAnswer ? "bg-[#E9F8EE] text-[#0F203A] font-medium" : "bg-slate-100 text-slate-500"}`}>
                          {opt.key}. {opt.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {assessments.length === 0 && (
          <EmptyState
            icon={ClipboardCheck}
            title="No assessments yet"
            description="Create an assessment to get started."
          />
        )}
      </div>

      <AdminModal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? "Edit Assessment" : "Create Assessment"} size="2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#229C62] text-white rounded-lg hover:bg-[#0F203A] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {modal.editing ? "Save Changes" : "Create Assessment"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminInput label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Web Security Fundamentals" />
          <AdminTextarea label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the assessment..." rows={2} />
          <AdminInput label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Web Security, Network Security" />

          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Questions ({form.questions.length})</h3>
              <button onClick={addQuestion} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus size={12} /> Add Question
              </button>
            </div>

            {form.questions.map((q, qi) => (
              <div key={qi} className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Question {qi + 1}</span>
                  {form.questions.length > 1 && (
                    <button onClick={() => removeQuestion(qi)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <AdminInput label="" value={q.text} onChange={(e) => updateQuestion(qi, "text", e.target.value)} placeholder="Enter question text..." />
                <AdminInput label="Category" value={q.category} onChange={(e) => updateQuestion(qi, "category", e.target.value)} placeholder="e.g. SQL Injection, XSS" />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={opt.key} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 w-4">{opt.key}.</span>
                      <input
                        value={opt.text}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${opt.key}`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62]"
                      />
                    </div>
                  ))}
                </div>
                <AdminSelect label="Correct Answer" value={q.correctAnswer} onChange={(e) => updateQuestion(qi, "correctAnswer", e.target.value)} options={q.options.map((o) => ({ value: o.key, label: `${o.key}. ${o.text || "(empty)"}` }))} />
              </div>
            ))}
          </div>
        </div>
      </AdminModal>

      <AdminConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} onConfirm={() => deleteDialog.item && handleDelete(deleteDialog.item.id)} title="Delete Assessment" message={`Are you sure you want to delete "${deleteDialog.item?.title}"? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  );
}
