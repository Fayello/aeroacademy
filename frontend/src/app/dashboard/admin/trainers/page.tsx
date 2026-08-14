"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import { Calendar, Plus, Trash2, Clock, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import AdminTable from "@/components/admin/AdminTable";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminStatusBadge } from "@/components/admin/AdminForm";
import type { Trainer, TrainingSlot } from "@/types/api";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [slotsModal, setSlotsModal] = useState<{ isOpen: boolean; trainer: Trainer | null }>({ isOpen: false, trainer: null });
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: Trainer | null }>({ isOpen: false, item: null });
  const [batchDelete, setBatchDelete] = useState<{ open: boolean; items: { id: string }[] }>({ open: false, items: [] });
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [form, setForm] = useState({ userId: "", bio: "", specialties: "" });
  const [saving, setSaving] = useState(false);

  // Slots form
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: "1", startTime: "09:00", endTime: "10:00" });

  const loadTrainers = useCallback(async () => {
    try {
      const data = await fetchApi("/training/trainers");
      setTrainers(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Failed to load trainers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApi("/training/trainers");
        if (!cancelled) setTrainers(Array.isArray(data) ? data : data.data || []);
      } catch {
        toast.error("Failed to load trainers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = () => {
    setEditing(null);
    setForm({ userId: "", bio: "", specialties: "" });
    setModalOpen(true);
  };

  const handleEdit = (trainer: Trainer) => {
    setEditing(trainer);
    setForm({
      userId: trainer.userId || "",
      bio: trainer.bio || "",
      specialties: trainer.specialties?.join(", ") || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.userId.trim() && !editing) {
      toast.error("User ID is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        bio: form.bio.trim() || undefined,
        specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (editing) {
        await fetchApi(`/training/trainers/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Trainer updated!");
      } else {
        await fetchApi("/training/trainers", {
          method: "POST",
          body: JSON.stringify({ userId: form.userId.trim(), ...payload }),
        });
        toast.success("Trainer added!");
      }
      setModalOpen(false);
      loadTrainers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save trainer"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    setSaving(true);
    try {
      await fetchApi(`/training/trainers/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Trainer removed!");
      setDeleteDialog({ isOpen: false, item: null });
      loadTrainers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove trainer"));
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
      const res = await fetchApi("/training/batch/delete-trainers", {
        method: "POST",
        body: JSON.stringify({ ids: batchDelete.items.map((t) => t.id) }),
      });
      toast.success(`Removed ${res.deleted || batchDelete.items.length} trainer${(res.deleted || batchDelete.items.length) !== 1 ? "s" : ""}`);
      setBatchDelete({ open: false, items: [] });
      loadTrainers();
    } catch {
      toast.error("Failed to remove trainers");
    } finally {
      setSaving(false);
    }
  };

  const openSlotsModal = (trainer: Trainer) => {
    setSlotsModal({ isOpen: true, trainer });
    setSlots(trainer.slots || []);
    setNewSlot({ dayOfWeek: "1", startTime: "09:00", endTime: "10:00" });
  };

  const handleAddSlot = async () => {
    if (!slotsModal.trainer) return;
    setSaving(true);
    try {
      const payload = {
        slots: [{
          dayOfWeek: parseInt(newSlot.dayOfWeek),
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
        }],
      };
      await fetchApi(`/training/trainers/${slotsModal.trainer.id}/slots`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Slot added!");
      const updatedTrainers = await fetchApi("/training/trainers");
      setTrainers(Array.isArray(updatedTrainers) ? updatedTrainers : updatedTrainers.data || []);
      const updated = Array.isArray(updatedTrainers) ? updatedTrainers : updatedTrainers.data || [];
      const trainer = updated.find((t: Trainer) => t.id === slotsModal.trainer?.id);
      setSlots(trainer?.slots || []);
      setNewSlot({ dayOfWeek: "1", startTime: "09:00", endTime: "10:00" });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add slot"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setSaving(true);
    try {
      await fetchApi(`/training/slots/${slotId}`, { method: "DELETE" });
      toast.success("Slot removed!");
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      loadTrainers();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove slot"));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "user",
      label: "Trainer",
      sortable: true,
      render: (trainer: Trainer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-white font-bold">
            {(trainer.user?.name || "T").charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900">{trainer.user?.name || "Unknown"}</p>
            <p className="text-xs text-slate-500">{trainer.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (trainer: Trainer) => (
        <AdminStatusBadge
          status={trainer.isActive ? "ACTIVE" : "INACTIVE"}
        />
      ),
    },
    {
      key: "specialties",
      label: "Specialties",
      render: (trainer: Trainer) => (
        <div className="flex flex-wrap gap-1">
          {trainer.specialties?.slice(0, 3).map((s: string, i: number) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
              {s}
            </span>
          ))}
          {trainer.specialties?.length ? (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
              +{trainer.specialties.length - 3}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "bookings",
      label: "Bookings",
      render: (trainer: Trainer) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <BookOpen size={14} className="text-slate-400" />
          {trainer._count?.bookings || 0}
        </span>
      ),
    },
    {
      key: "slots",
      label: "Slots",
      render: (trainer: Trainer) => (
        <button
          onClick={() => openSlotsModal(trainer)}
          className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
        >
          <Clock size={14} />
          {trainer.slots?.length || 0} slots
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Calendar size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Trainers</h1>
            <p className="text-amber-100 text-sm">Add trainers and manage their availability</p>
          </div>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={trainers}
        loading={loading}
        searchPlaceholder="Search trainers..."
        searchKey="user"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(item) => setDeleteDialog({ isOpen: true, item })}
        addLabel="Add Trainer"
        emptyMessage="No trainers yet."
        selectable
        bulkActions={[
          { label: "Delete", icon: <Trash2 size={16} />, variant: "danger", onClick: handleBatchDelete },
        ]}
      />

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Trainer" : "Add Trainer"}
      >
        <div className="space-y-4">
          {!editing && (
            <AdminInput
              label="User ID"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              placeholder="User UUID"
            />
          )}
          <AdminTextarea
            label="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Trainer bio"
            rows={3}
          />
          <AdminInput
            label="Specialties (comma-separated)"
            value={form.specialties}
            onChange={(e) => setForm({ ...form, specialties: e.target.value })}
            placeholder="Security, Linux, DevOps"
          />
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update Trainer" : "Add Trainer"}
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

      {/* Slots Modal */}
      <AdminModal
        isOpen={slotsModal.isOpen}
        onClose={() => setSlotsModal({ isOpen: false, trainer: null })}
        title={`Manage Slots — ${slotsModal.trainer?.user?.name || ""}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Existing Slots */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Current Slots</h3>
            {slots.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 text-center">No slots configured yet.</p>
            ) : (
              <div className="space-y-2">
                {slots.map((slot: TrainingSlot) => (
                  <div key={slot.id || `${slot.dayOfWeek}-${slot.startTime}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Calendar size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{DAYS[slot.dayOfWeek]}</p>
                        <p className="text-xs text-slate-500">{slot.startTime} - {slot.endTime}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={saving}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Slot */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Add New Slot</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Day</label>
                <select
                  value={newSlot.dayOfWeek}
                  onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {DAYS.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">End Time</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              onClick={handleAddSlot}
              disabled={saving}
              className="mt-3 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm disabled:opacity-50"
            >
              <Plus size={16} /> Add Slot
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Remove Trainer"
        message={`Are you sure you want to remove "${deleteDialog.item?.user?.name}" as a trainer? Their slots will also be deleted.`}
        confirmLabel="Remove Trainer"
        loading={saving}
      />

      <AdminConfirmDialog
        isOpen={batchDelete.open}
        onClose={() => setBatchDelete({ open: false, items: [] })}
        onConfirm={confirmBatchDelete}
        title="Remove Trainers"
        message={`Remove ${batchDelete.items.length} selected trainer${batchDelete.items.length > 1 ? "s" : ""}? Their slots will also be deleted.`}
        confirmLabel="Remove Selected"
        loading={saving}
      />
    </div>
  );
}
