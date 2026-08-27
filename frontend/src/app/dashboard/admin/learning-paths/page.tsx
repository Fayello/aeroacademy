"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import { Route, Plus, Pencil, Trash2, Loader2, GripVertical, X, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import toast from "@/lib/toast";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminSelect } from "@/components/admin/AdminForm";

interface Course {
  id: string;
  title: string;
}

interface LearningPathCourse {
  id: string;
  order: number;
  courseId: string;
  course: Course;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  difficulty: string;
  courses: LearningPathCourse[];
  _count: { enrollments: number };
  createdAt: string;
}

export default function AdminLearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LearningPath | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: LearningPath | null }>({ open: false, item: null });
  const [selectedCourses, setSelectedCourses] = useState<{ courseId: string; order: number }[]>([]);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", difficulty: "BEGINNER" });

  const loadPaths = useCallback(async () => {
    try {
      const data = await fetchApi("/learning-paths");
      setPaths(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load learning paths");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const data = await fetchApi("/courses");
      const list = Array.isArray(data) ? data : data.data || [];
      setAllCourses(list.map((c: Course) => ({ id: c.id, title: c.title })));
    } catch {}
  }, []);

  useEffect(() => {
    loadPaths();
    loadCourses();
  }, [loadPaths, loadCourses]);

  const openCreate = () => {
    setForm({ title: "", description: "", imageUrl: "", difficulty: "BEGINNER" });
    setSelectedCourses([]);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (path: LearningPath) => {
    setForm({
      title: path.title,
      description: path.description,
      imageUrl: path.imageUrl || "",
      difficulty: path.difficulty,
    });
    setSelectedCourses(
      path.courses.map((c) => ({ courseId: c.courseId, order: c.order }))
    );
    setEditing(path);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl || undefined,
        difficulty: form.difficulty,
        courses: selectedCourses,
      };
      if (editing) {
        await fetchApi(`/learning-paths/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
        toast.success("Learning path updated");
      } else {
        await fetchApi("/learning-paths", { method: "POST", body: JSON.stringify(body) });
        toast.success("Learning path created");
      }
      setModalOpen(false);
      loadPaths();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    setSaving(true);
    try {
      await fetchApi(`/learning-paths/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Learning path deleted");
      setDeleteDialog({ open: false, item: null });
      loadPaths();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const addCourseToPath = (courseId: string) => {
    if (selectedCourses.some((c) => c.courseId === courseId)) return;
    setSelectedCourses([...selectedCourses, { courseId, order: selectedCourses.length }]);
  };

  const removeCourseFromPath = (courseId: string) => {
    setSelectedCourses(
      selectedCourses
        .filter((c) => c.courseId !== courseId)
        .map((c, i) => ({ ...c, order: i }))
    );
  };

  const moveCourse = (courseId: string, direction: "up" | "down") => {
    const idx = selectedCourses.findIndex((c) => c.courseId === courseId);
    if (idx === -1) return;
    const next = [...selectedCourses];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setSelectedCourses(next.map((c, i) => ({ ...c, order: i })));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#229C62]" size={32} /></div>;
  }

  const diffColors: Record<string, string> = {
    BEGINNER: "bg-[#E9F8EE] text-[#0F203A]",
    INTERMEDIATE: "bg-amber-100 text-amber-700",
    ADVANCED: "bg-red-100 text-red-700",
    EXPERT: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative overflow-hidden angular-card bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Route size={28} /></div>
            <div>
              <h1 className="text-2xl font-bold">Manage Learning Paths</h1>
              <p className="text-violet-100 text-sm">{paths.length} paths total</p>
            </div>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm backdrop-blur-sm">
            <Plus size={16} /> New Path
          </button>
        </div>
      </div>

      {paths.length === 0 ? (
        <div className="angular-card bg-white p-12 text-center">
          <Route size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No learning paths yet</h3>
          <p className="text-sm text-slate-500 mb-4">Create your first learning path to guide students through a structured curriculum.</p>
          <button onClick={openCreate} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">
            Create Path
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {paths.map((path) => (
            <div key={path.id} className="angular-card bg-white p-5 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Route size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{path.title}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${diffColors[path.difficulty] || diffColors.BEGINNER}`}>
                        {path.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1 max-w-lg">{path.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{path.courses?.length || 0}</p>
                    <p className="text-xs text-slate-500">Courses</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{path._count?.enrollments || 0}</p>
                    <p className="text-xs text-slate-500">Enrolled</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(path)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"><Pencil size={16} /></button>
                    <button onClick={() => setDeleteDialog({ open: true, item: path })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
              {path.courses && path.courses.length > 0 && (
                <div className="mt-3 pl-16 flex flex-wrap gap-1.5">
                  {path.courses.sort((a, b) => a.order - b.order).map((lpc, i) => (
                    <span key={lpc.id} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      <span className="text-violet-500 font-bold">{i + 1}.</span>
                      {lpc.course.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Learning Path" : "New Learning Path"}
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminInput label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Training Fundamentals" required />
          <AdminTextarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the learning path..." rows={3} required />
          <AdminInput label="Image URL (optional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          <AdminSelect
            label="Difficulty"
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            options={[
              { value: "BEGINNER", label: "Beginner" },
              { value: "INTERMEDIATE", label: "Intermediate" },
              { value: "ADVANCED", label: "Advanced" },
              { value: "EXPERT", label: "Expert" },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Courses in Path ({selectedCourses.length})</label>
            {selectedCourses.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">No courses added yet. Select below.</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {selectedCourses.map((sc, i) => {
                  const course = allCourses.find((c) => c.id === sc.courseId);
                  return (
                    <div key={sc.courseId} className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-violet-600 w-5">{i + 1}.</span>
                      <span className="text-sm text-slate-800 flex-1">{course?.title || sc.courseId}</span>
                      <button onClick={() => moveCourse(sc.courseId, "up")} disabled={i === 0} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp size={14} /></button>
                      <button onClick={() => moveCourse(sc.courseId, "down")} disabled={i === selectedCourses.length - 1} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown size={14} /></button>
                      <button onClick={() => removeCourseFromPath(sc.courseId)} className="p-0.5 text-slate-400 hover:text-red-600"><X size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            <select
              onChange={(e) => { if (e.target.value) { addCourseToPath(e.target.value); e.target.value = ""; } }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <option value="">Add a course...</option>
              {allCourses
                .filter((c) => !selectedCourses.some((sc) => sc.courseId === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
            </select>
          </div>
        </div>
      </AdminModal>

      <AdminConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        onConfirm={handleDelete}
        title="Delete Learning Path"
        message={`Delete "${deleteDialog.item?.title}"? This will also remove all course associations.`}
        loading={saving}
      />
    </div>
  );
}
