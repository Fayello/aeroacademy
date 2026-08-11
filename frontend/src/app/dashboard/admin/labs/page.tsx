"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Microscope, Shield, Clock } from "lucide-react";
import toast from "react-hot-toast";
import AdminTable from "@/components/admin/AdminTable";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminSelect } from "@/components/admin/AdminForm";

function getDifficultyLabel(d: number) {
  if (d < 1100) return { label: "Beginner", color: "bg-emerald-100 text-emerald-700" };
  if (d < 1300) return { label: "Intermediate", color: "bg-amber-100 text-amber-700" };
  if (d < 1500) return { label: "Advanced", color: "bg-orange-100 text-orange-700" };
  return { label: "Expert", color: "bg-red-100 text-red-700" };
}

export default function AdminLabsPage() {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: any }>({ isOpen: false, item: null });
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dockerImage: "",
    difficulty: "1200",
    briefing: "",
    imageUrl: "",
    basePath: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLabs();
  }, []);

  const loadLabs = async () => {
    try {
      const data = await fetchApi("/labs");
      setLabs(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Failed to load labs");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", dockerImage: "", difficulty: "1200", briefing: "", imageUrl: "", basePath: "" });
    setModalOpen(true);
  };

  const handleEdit = (lab: any) => {
    setEditing(lab);
    setForm({
      title: lab.title || "",
      description: lab.description || "",
      dockerImage: lab.dockerImage || "",
      difficulty: String(lab.difficulty || 1200),
      briefing: lab.briefing || "",
      imageUrl: lab.imageUrl || "",
      basePath: lab.basePath || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.dockerImage.trim()) {
      toast.error("Title and Docker image are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        difficulty: parseInt(form.difficulty),
      };
      if (editing) {
        await fetchApi(`/labs/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Lab updated!");
      } else {
        await fetchApi("/labs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Lab created!");
      }
      setModalOpen(false);
      loadLabs();
    } catch (err: any) {
      toast.error(err.message || "Failed to save lab");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    setSaving(true);
    try {
      await fetchApi(`/labs/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Lab deleted!");
      setDeleteDialog({ isOpen: false, item: null });
      loadLabs();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete lab");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Lab",
      sortable: true,
      render: (lab: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Microscope size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{lab.title}</p>
            <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{lab.dockerImage}</p>
          </div>
        </div>
      ),
    },
    {
      key: "difficulty",
      label: "Difficulty",
      sortable: true,
      render: (lab: any) => {
        const d = getDifficultyLabel(lab.difficulty || 1200);
        return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${d.color}`}>{d.label}</span>;
      },
    },
    {
      key: "flags",
      label: "Flags",
      render: (lab: any) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <Shield size={14} className="text-slate-400" />
          {lab.flags?.length || 0}
        </span>
      ),
    },
    {
      key: "basePath",
      label: "Base Path",
      render: (lab: any) => (
        <span className="text-xs font-mono text-slate-500">{lab.basePath || "/"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Microscope size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Labs</h1>
            <p className="text-violet-100 text-sm">Create, edit, and manage lab environments</p>
          </div>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={labs}
        loading={loading}
        searchPlaceholder="Search labs..."
        searchKey="title"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(item) => setDeleteDialog({ isOpen: true, item })}
        addLabel="New Lab"
        emptyMessage="No labs yet. Create your first lab."
      />

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Lab" : "Create Lab"}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminInput
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Lab title"
          />
          <AdminInput
            label="Docker Image"
            value={form.dockerImage}
            onChange={(e) => setForm({ ...form, dockerImage: e.target.value })}
            placeholder="e.g. vulnerables/web-dvwa"
          />
          <AdminInput
            label="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="Lab thumbnail URL"
          />
          <AdminInput
            label="Base Path"
            value={form.basePath}
            onChange={(e) => setForm({ ...form, basePath: e.target.value })}
            placeholder="/"
          />
          <AdminSelect
            label="Difficulty"
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            options={[
              { value: "1000", label: "Beginner (1000)" },
              { value: "1100", label: "Beginner+ (1100)" },
              { value: "1200", label: "Intermediate (1200)" },
              { value: "1300", label: "Intermediate+ (1300)" },
              { value: "1400", label: "Advanced (1400)" },
              { value: "1500", label: "Advanced+ (1500)" },
              { value: "1600", label: "Expert (1600)" },
            ]}
          />
          <div className="md:col-span-2">
            <AdminTextarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Lab description"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <AdminTextarea
              label="Briefing"
              value={form.briefing}
              onChange={(e) => setForm({ ...form, briefing: e.target.value })}
              placeholder="Lab briefing / instructions (Markdown supported)"
              rows={5}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Update Lab" : "Create Lab"}
          </button>
          <button
            onClick={() => setModalOpen(false)}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all"
          >
            Cancel
          </button>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Delete Lab"
        message={`Are you sure you want to delete "${deleteDialog.item?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Lab"
        loading={saving}
      />
    </div>
  );
}
