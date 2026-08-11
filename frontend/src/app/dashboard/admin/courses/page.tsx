"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Plus, Trash2, Loader2, BookOpen, Layers } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApi("/courses")
      .then((data: any) => setCourses(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    try {
      const newCourse = await fetchApi("/courses", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      setCourses((prev) => [...prev, newCourse]);
      setTitle("");
      setDescription("");
      setShowCreate(false);
      toast.success("Course created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    try {
      await fetchApi(`/courses/${id}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success("Course deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manage Courses</h1>
              <p className="text-blue-100 text-sm">Add, edit, or remove courses from the platform</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2.5 px-5 rounded-lg transition-all duration-150 text-sm inline-flex items-center justify-center gap-2">
            <Plus size={16} /> New Course
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Plus size={18} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Create New Course</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Course title" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} placeholder="Course description" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <GraduationCap size={14} />}
              Create Course
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Courses List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No courses yet</h3>
          <p className="text-sm text-slate-500 mb-6">Create your first course to get started.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            <Plus size={14} /> Create Course
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{course.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{course.description}</p>
                    {course._count && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Layers size={12} /> {course._count.sections} sections</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(course.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
