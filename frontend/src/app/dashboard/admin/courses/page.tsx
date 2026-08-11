"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { GraduationCap, Layers, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import AdminTable from "@/components/admin/AdminTable";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminStatusBadge } from "@/components/admin/AdminForm";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: any }>({ isOpen: false, item: null });
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await fetchApi("/courses");
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "" });
    setModalOpen(true);
  };

  const handleEdit = (course: any) => {
    setEditing(course);
    setForm({ title: course.title, description: course.description || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await fetchApi(`/courses/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        toast.success("Course updated!");
      } else {
        await fetchApi("/courses", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Course created!");
      }
      setModalOpen(false);
      loadCourses();
    } catch (err: any) {
      toast.error(err.message || "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    setSaving(true);
    try {
      await fetchApi(`/courses/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Course deleted!");
      setDeleteDialog({ isOpen: false, item: null });
      loadCourses();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete course");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Course",
      sortable: true,
      render: (course: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <GraduationCap size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{course.title}</p>
            <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{course.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "sections",
      label: "Modules",
      render: (course: any) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <Layers size={14} className="text-slate-400" />
          {course._count?.sections || course.sections?.length || 0}
        </span>
      ),
    },
    {
      key: "lessons",
      label: "Lessons",
      render: (course: any) => {
        const lessonCount = course.sections?.reduce((acc: number, s: any) => acc + (s.lessons?.length || 0), 0) || 0;
        return (
          <span className="flex items-center gap-1.5 text-slate-600">
            <BookOpen size={14} className="text-slate-400" />
            {lessonCount}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (course: any) => (
        <span className="text-slate-500">
          {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Courses</h1>
            <p className="text-blue-100 text-sm">Create, edit, and organize courses</p>
          </div>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={courses}
        loading={loading}
        searchPlaceholder="Search courses..."
        searchKey="title"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(item) => setDeleteDialog({ isOpen: true, item })}
        addLabel="New Course"
        emptyMessage="No courses yet. Create your first course."
      />

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Course" : "Create Course"}
      >
        <div className="space-y-4">
          <AdminInput
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Course title"
          />
          <AdminTextarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Course description"
            rows={4}
          />
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update Course" : "Create Course"}
            </button>
            <button
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteDialog.item?.title}"? This will also delete all sections and lessons. This action cannot be undone.`}
        confirmLabel="Delete Course"
        loading={saving}
      />
    </div>
  );
}
