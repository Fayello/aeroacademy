"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Loader2,
  Plus,
  Save,
  X,
  BarChart3,
  Users,
  Edit3,
  Trash2,
} from "lucide-react";
import toast from "@/lib/toast";

interface GradeEntry {
  id: string;
  userId: string;
  title: string;
  score: number;
  maxScore: number;
  weight: number;
  comment: string | null;
  user?: { id: string; name: string; email: string };
}

interface GradeCategory {
  id: string;
  name: string;
  weight: number;
  entries: GradeEntry[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface GradeBookData {
  cohort: { id: string; name: string };
  categories: { id: string; name: string; weight: number }[];
  students: Array<{
    student: { id: string; name: string; email: string };
    categories: Array<{ categoryId: string; name: string; weight: number; average: number | null }>;
    finalGrade: number;
  }>;
}

function getGradeColor(grade: number): string {
  if (grade >= 90) return "text-emerald-600";
  if (grade >= 80) return "text-blue-600";
  if (grade >= 70) return "text-amber-600";
  return "text-red-600";
}

export default function GradebookPage() {
  const params = useParams();
  const cohortId = params.id as string;
  const [gradebook, setGradebook] = useState<GradeBookData | null>(null);
  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [members, setMembers] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "grade">("overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [gradeTitle, setGradeTitle] = useState("");
  const [gradeScore, setGradeScore] = useState("");
  const [gradeMax, setGradeMax] = useState("100");
  const [gradeComment, setGradeComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New category form
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatWeight, setNewCatWeight] = useState("");

  const load = useCallback(async () => {
    try {
      const [gb, cats, mems] = await Promise.all([
        fetchApi<GradeBookData>(`/gradebook/cohorts/${cohortId}/grades`),
        fetchApi<GradeCategory[]>(`/gradebook/cohorts/${cohortId}/categories`),
        fetchApi<Student[]>(`/cohorts/${cohortId}/members`),
      ]);
      setGradebook(gb);
      setCategories(cats);
      setMembers(mems.filter((m: Student) => (m as any).role === "STUDENT"));
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].id);
      }
    } catch {
      toast.error("Failed to load gradebook");
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createCategory() {
    if (!newCatName || !newCatWeight) return;
    try {
      await fetchApi(`/gradebook/cohorts/${cohortId}/categories`, {
        method: "POST",
        body: JSON.stringify({ name: newCatName, weight: parseFloat(newCatWeight) }),
      });
      toast.success("Category created");
      setShowNewCategory(false);
      setNewCatName("");
      setNewCatWeight("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    }
  }

  async function deleteCategory(categoryId: string) {
    if (!confirm("Delete this category and all its grades?")) return;
    try {
      await fetchApi(`/gradebook/categories/${categoryId}`, { method: "DELETE" });
      toast.success("Category deleted");
      load();
    } catch {
      toast.error("Failed to delete category");
    }
  }

  async function submitGrade() {
    if (!selectedCategory || !selectedStudent || !gradeTitle || !gradeScore) return;
    setSubmitting(true);
    try {
      await fetchApi(`/gradebook/categories/${selectedCategory}/entries`, {
        method: "POST",
        body: JSON.stringify({
          userId: selectedStudent,
          title: gradeTitle,
          score: parseFloat(gradeScore),
          maxScore: parseFloat(gradeMax),
          comment: gradeComment || undefined,
        }),
      });
      toast.success("Grade submitted");
      setGradeTitle("");
      setGradeScore("");
      setGradeComment("");
      setSelectedStudent("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit grade");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEntry(entryId: string) {
    if (!confirm("Delete this grade entry?")) return;
    try {
      await fetchApi(`/gradebook/entries/${entryId}`, { method: "DELETE" });
      toast.success("Grade deleted");
      load();
    } catch {
      toast.error("Failed to delete grade");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-48 bg-[#0f172a] rounded-xl border border-white/10 animate-pulse" />
        <div className="h-64 bg-[#0f172a] rounded-xl border border-white/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/dashboard/cohorts"
        className="text-sm text-slate-500 hover:text-[#7AD62A] flex items-center gap-1 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Cohorts
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
            <ClipboardCheck size={24} className="text-[#7AD62A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gradebook</h1>
            <p className="text-sm text-slate-500">{gradebook?.cohort.name}</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "overview" ? "bg-[#0f172a] text-white shadow-sm" : "text-slate-500 hover:text-slate-200"
          }`}
        >
          <BarChart3 size={14} className="inline mr-1.5" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("grade")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "grade" ? "bg-[#0f172a] text-white shadow-sm" : "text-slate-500 hover:text-slate-200"
          }`}
        >
          <Edit3 size={14} className="inline mr-1.5" />
          Enter Grades
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Categories */}
          <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Grade Categories</h2>
              <button
                onClick={() => setShowNewCategory(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-[#7AD62A] hover:text-[#0F203A] transition-colors"
              >
                <Plus size={14} /> Add Category
              </button>
            </div>

            {showNewCategory && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-lg">
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
                />
                <input
                  type="number"
                  placeholder="Weight (0.3)"
                  step="0.05"
                  min="0"
                  max="1"
                  value={newCatWeight}
                  onChange={(e) => setNewCatWeight(e.target.value)}
                  className="w-28 px-3 py-1.5 text-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
                />
                <button
                  onClick={createCategory}
                  className="px-3 py-1.5 text-xs font-medium bg-[#7AD62A] text-white rounded-lg hover:bg-[#0F203A] transition-colors"
                >
                  <Save size={12} />
                </button>
                <button
                  onClick={() => setShowNewCategory(false)}
                  className="text-slate-400 hover:text-slate-300"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No grade categories. Create one to start grading.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-sm"
                  >
                    <span className="font-medium text-white">{cat.name}</span>
                    <span className="text-xs text-slate-500">{Math.round(cat.weight * 100)}%</span>
                    <span className="text-xs text-slate-400">({cat.entries.length} entries)</span>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="text-slate-400 hover:text-red-500 ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Grades Table */}
          {gradebook && gradebook.students.length > 0 && (
            <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Users size={16} /> Student Grades
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Student</th>
                      {gradebook.categories.map((cat) => (
                        <th key={cat.id} className="text-right py-2 text-xs font-medium text-slate-500 uppercase">
                          {cat.name}
                        </th>
                      ))}
                      <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradebook.students.map((row) => (
                      <tr key={row.student.id} className="border-b border-slate-100 last:border-0 hover:bg-white/5">
                        <td className="py-3">
                          <div className="font-medium text-white">{row.student.name}</div>
                          <div className="text-xs text-slate-500">{row.student.email}</div>
                        </td>
                        {row.categories.map((cat) => (
                          <td key={cat.categoryId} className="py-3 text-right">
                            {cat.average !== null ? (
                              <span className={`font-medium ${getGradeColor(cat.average)}`}>
                                {cat.average}%
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        ))}
                        <td className="py-3 text-right">
                          <span className={`text-lg font-bold ${getGradeColor(row.finalGrade)}`}>
                            {row.finalGrade}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ENTER GRADES TAB */}
      {activeTab === "grade" && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Enter Grade</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name} ({Math.round(cat.weight * 100)}%)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
              >
                <option value="">Select student</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g. Midterm Exam"
                value={gradeTitle}
                onChange={(e) => setGradeTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Score</label>
                <input
                  type="number"
                  placeholder="85"
                  min="0"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-500 mb-1">Max</label>
                <input
                  type="number"
                  value={gradeMax}
                  onChange={(e) => setGradeMax(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Comment (optional)</label>
              <input
                type="text"
                placeholder="Optional feedback"
                value={gradeComment}
                onChange={(e) => setGradeComment(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] outline-none"
              />
            </div>
          </div>

          <button
            onClick={submitGrade}
            disabled={submitting || !selectedCategory || !selectedStudent || !gradeTitle || !gradeScore}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7AD62A] text-white text-sm font-medium rounded-xl hover:bg-[#0F203A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Submit Grade
          </button>

          {/* Existing entries for selected category */}
          {selectedCategory && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="text-xs font-medium text-slate-500 mb-3">Existing entries</h3>
              {categories
                .find((c) => c.id === selectedCategory)
                ?.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-white">{entry.title}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {entry.user?.name ?? "Unknown"} — {entry.score}/{entry.maxScore}
                      </span>
                      {entry.comment && (
                        <span className="text-xs text-slate-400 ml-2">({entry.comment})</span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
