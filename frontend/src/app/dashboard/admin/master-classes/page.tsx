"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Video, Calendar, Clock, Users, UserCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminTable from "@/components/admin/AdminTable";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminSelect, AdminStatusBadge } from "@/components/admin/AdminForm";

export default function AdminMasterClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: any }>({ isOpen: false, item: null });
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructorName: "",
    instructorBio: "",
    category: "SECURITY",
    scheduledAt: "",
    duration: "60",
    maxParticipants: "50",
    status: "UPCOMING",
    recordingUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [batchDelete, setBatchDelete] = useState<{ open: boolean; items: { id: string }[] }>({ open: false, items: [] });
  const [batchStatus, setBatchStatus] = useState<{ open: boolean; items: { id: string }[]; status: string }>({ open: false, items: [], status: "UPCOMING" });

  const loadClasses = useCallback(async () => {
    try {
      const data = await fetchApi("/master-classes");
      setClasses(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Failed to load master classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleAdd = () => {
    setEditing(null);
    setForm({
      title: "", description: "", instructorName: "", instructorBio: "",
      category: "SECURITY", scheduledAt: "", duration: "60", maxParticipants: "50",
      status: "UPCOMING", recordingUrl: "",
    });
    setModalOpen(true);
  };

  const handleEdit = (mc: any) => {
    setEditing(mc);
    setForm({
      title: mc.title || "",
      description: mc.description || "",
      instructorName: mc.instructorName || "",
      instructorBio: mc.instructorBio || "",
      category: mc.category || "SECURITY",
      scheduledAt: mc.scheduledAt ? new Date(mc.scheduledAt).toISOString().slice(0, 16) : "",
      duration: String(mc.duration || 60),
      maxParticipants: String(mc.maxParticipants || 50),
      status: mc.status || "UPCOMING",
      recordingUrl: mc.recordingUrl || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: parseInt(form.duration),
        maxParticipants: parseInt(form.maxParticipants),
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      };
      if (editing) {
        await fetchApi(`/master-classes/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Master class updated!");
      } else {
        await fetchApi("/master-classes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Master class created!");
      }
      setModalOpen(false);
      loadClasses();
    } catch (err: any) {
      toast.error(err.message || "Failed to save master class");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    setSaving(true);
    try {
      await fetchApi(`/master-classes/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Master class deleted!");
      setDeleteDialog({ isOpen: false, item: null });
      loadClasses();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete master class");
    } finally {
      setSaving(false);
    }
  };

  const handleBatchDelete = (selected: { id: string }[]) => {
    setBatchDelete({ open: true, items: selected });
  };

  const confirmBatchDelete = async () => {
    setSaving(true);
    try {
      const res = await fetchApi("/master-classes/batch/delete", {
        method: "POST",
        body: JSON.stringify({ ids: batchDelete.items.map((mc) => mc.id) }),
      });
      toast.success(`Deleted ${res.count || batchDelete.items.length} master class${(res.count || batchDelete.items.length) !== 1 ? "es" : ""}`);
      setBatchDelete({ open: false, items: [] });
      loadClasses();
    } catch {
      toast.error("Failed to delete master classes");
    } finally {
      setSaving(false);
    }
  };

  const handleBatchStatus = (selected: { id: string }[]) => {
    setBatchStatus({ open: true, items: selected, status: "UPCOMING" });
  };

  const confirmBatchStatus = async () => {
    setSaving(true);
    try {
      const res = await fetchApi("/master-classes/batch/status", {
        method: "POST",
        body: JSON.stringify({ ids: batchStatus.items.map((mc) => mc.id), status: batchStatus.status }),
      });
      toast.success(`Status updated for ${res.count || batchStatus.items.length} master class${(res.count || batchStatus.items.length) !== 1 ? "es" : ""}`);
      setBatchStatus({ open: false, items: [], status: "UPCOMING" });
      loadClasses();
    } catch {
      toast.error("Failed to update master classes");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Master Class",
      sortable: true,
      render: (mc: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <Video size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{mc.title}</p>
            <p className="text-xs text-slate-500">{mc.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (mc: any) => <AdminStatusBadge status={mc.status} />,
    },
    {
      key: "instructorName",
      label: "Instructor",
      render: (mc: any) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <UserCheck size={14} className="text-slate-400" />
          {mc.instructorName || "TBD"}
        </span>
      ),
    },
    {
      key: "scheduledAt",
      label: "Scheduled",
      sortable: true,
      render: (mc: any) => (
        <span className="flex items-center gap-1.5 text-slate-500 text-sm">
          <Calendar size={14} className="text-slate-400" />
          {mc.scheduledAt ? new Date(mc.scheduledAt).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      render: (mc: any) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <Clock size={14} className="text-slate-400" />
          {mc.duration}min
        </span>
      ),
    },
    {
      key: "registrations",
      label: "Registered",
      render: (mc: any) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <Users size={14} className="text-slate-400" />
          {mc._count?.registrations || 0}/{mc.maxParticipants || "∞"}
        </span>
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
            <Video size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Master Classes</h1>
            <p className="text-violet-100 text-sm">Schedule and manage live sessions</p>
          </div>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={classes}
        loading={loading}
        searchPlaceholder="Search master classes..."
        searchKey="title"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(item) => setDeleteDialog({ isOpen: true, item })}
        addLabel="New Master Class"
        emptyMessage="No master classes yet."
        selectable
        bulkActions={[
          { label: "Set Status", icon: <Calendar size={16} />, onClick: handleBatchStatus },
          { label: "Delete", icon: <Trash2 size={16} />, variant: "danger", onClick: handleBatchDelete },
        ]}
      />

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Master Class" : "Create Master Class"}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminInput
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Master class title"
          />
          <AdminInput
            label="Instructor Name"
            value={form.instructorName}
            onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
            placeholder="Instructor name"
          />
          <div className="md:col-span-2">
            <AdminTextarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Master class description"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <AdminTextarea
              label="Instructor Bio"
              value={form.instructorBio}
              onChange={(e) => setForm({ ...form, instructorBio: e.target.value })}
              placeholder="Instructor bio"
              rows={2}
            />
          </div>
          <AdminSelect
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[
              { value: "SECURITY", label: "Security" },
              { value: "LINUX", label: "Linux" },
              { value: "DEVOPS", label: "DevOps" },
              { value: "CLOUD", label: "Cloud" },
            ]}
          />
          <AdminSelect
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: "UPCOMING", label: "Upcoming" },
              { value: "LIVE", label: "Live" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
          <AdminInput
            label="Date & Time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />
          <AdminInput
            label="Duration (minutes)"
            type="number"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />
          <AdminInput
            label="Max Participants"
            type="number"
            value={form.maxParticipants}
            onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
          />
          <AdminInput
            label="Recording URL"
            value={form.recordingUrl}
            onChange={(e) => setForm({ ...form, recordingUrl: e.target.value })}
            placeholder="YouTube/Vimeo URL"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Update Master Class" : "Create Master Class"}
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
        title="Delete Master Class"
        message={`Are you sure you want to delete "${deleteDialog.item?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Master Class"
        loading={saving}
      />

      <AdminModal
        isOpen={batchStatus.open}
        onClose={() => setBatchStatus({ open: false, items: [], status: "UPCOMING" })}
        title="Change Master Class Status"
      >
        <p className="text-sm text-slate-600 mb-4">Set the status for <span className="font-semibold text-slate-900">{batchStatus.items.length}</span> selected master class{batchStatus.items.length !== 1 ? "es" : ""}.</p>
        <AdminSelect
          label="Status"
          value={batchStatus.status}
          onChange={(e) => setBatchStatus({ ...batchStatus, status: e.target.value })}
          options={[
            { value: "UPCOMING", label: "Upcoming" },
            { value: "LIVE", label: "Live" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
        <div className="flex gap-3 pt-4">
          <button
            onClick={confirmBatchStatus}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Apply Status"}
          </button>
          <button
            onClick={() => setBatchStatus({ open: false, items: [], status: "UPCOMING" })}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all"
          >
            Cancel
          </button>
        </div>
      </AdminModal>

      <AdminConfirmDialog
        isOpen={batchDelete.open}
        onClose={() => setBatchDelete({ open: false, items: [] })}
        onConfirm={confirmBatchDelete}
        title="Delete Master Classes"
        message={`Delete ${batchDelete.items.length} selected master class${batchDelete.items.length > 1 ? "es" : ""}? This action cannot be undone.`}
        confirmLabel="Delete Selected"
        loading={saving}
      />
    </div>
  );
}
