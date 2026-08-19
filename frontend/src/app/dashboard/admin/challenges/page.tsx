"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Target, Plus, Pencil, Trash2, Loader2, Users, Trophy, ArrowLeft } from "lucide-react";
import toast from "@/lib/toast";
import Link from "next/link";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminSelect, AdminNumber, AdminDatePicker } from "@/components/admin/AdminForm";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  goalType: string;
  goalCount: number;
  xpReward: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count: { participants: number; teamParticipants: number };
}

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Challenge | null }>({ open: false, editing: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Challenge | null }>({ open: false, item: null });
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "INDIVIDUAL",
    goalType: "LESSONS_COMPLETED",
    goalCount: 10,
    xpReward: 500,
    startDate: "",
    endDate: "",
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchApi<Challenge[]>("/challenges");
      setChallenges(data);
    } catch {
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({
      title: "",
      description: "",
      type: "INDIVIDUAL",
      goalType: "LESSONS_COMPLETED",
      goalCount: 10,
      xpReward: 500,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    });
    setModal({ open: true, editing: null });
  };

  const openEdit = (c: Challenge) => {
    setForm({
      title: c.title,
      description: c.description,
      type: c.type,
      goalType: c.goalType,
      goalCount: c.goalCount,
      xpReward: c.xpReward,
      startDate: new Date(c.startDate).toISOString().slice(0, 16),
      endDate: new Date(c.endDate).toISOString().slice(0, 16),
    });
    setModal({ open: true, editing: c });
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      await fetchApi("/challenges", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
        }),
      });
      toast.success(modal.editing ? "Challenge updated" : "Challenge created");
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
      await fetchApi(`/challenges/${id}`, { method: "DELETE" });
      toast.success("Challenge deleted");
      setDeleteDialog({ open: false, item: null });
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const goalLabels: Record<string, string> = {
    LESSONS_COMPLETED: "Lessons Completed",
    FLAGS_CAPTURED: "Flags Captured",
    XP_EARNED: "XP Earned",
    STREAK_DAYS: "Streak Days",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-2">
            <ArrowLeft size={14} /> Admin
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Challenges</h1>
          <p className="text-sm text-slate-500 mt-1">{challenges.length} challenges</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1.5">
          <Plus size={14} /> Create Challenge
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Challenge</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Goal</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">XP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Participants</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Dates</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challenges.map((c) => {
                const ended = new Date(c.endDate) < new Date();
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Target size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{c.title}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{c.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.type === "TEAM" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {goalLabels[c.goalType] || c.goalType} ({c.goalCount})
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">{c.xpReward}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Users size={12} />
                        {c._count.participants + c._count.teamParticipants}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] text-slate-500">
                        <p>{new Date(c.startDate).toLocaleDateString()}</p>
                        <p className={ended ? "text-slate-400" : "text-[#229C62]"}>
                          {ended ? "Ended" : "Active"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteDialog({ open: true, item: c })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {challenges.length === 0 && (
          <div className="py-12 text-center">
            <Target size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No challenges yet</p>
          </div>
        )}
      </div>

      <AdminModal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? "Edit Challenge" : "Create Challenge"} size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#229C62] text-white rounded-lg hover:bg-[#0F203A] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {modal.editing ? "Save Changes" : "Create Challenge"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminInput label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Weekly CTF Challenge" />
          <AdminTextarea label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the challenge..." rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ value: "INDIVIDUAL", label: "Individual" }, { value: "TEAM", label: "Team" }]} />
            <AdminSelect label="Goal Type" value={form.goalType} onChange={(e) => setForm({ ...form, goalType: e.target.value })} options={[
              { value: "LESSONS_COMPLETED", label: "Lessons Completed" },
              { value: "FLAGS_CAPTURED", label: "Flags Captured" },
              { value: "XP_EARNED", label: "XP Earned" },
              { value: "STREAK_DAYS", label: "Streak Days" },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminNumber label="Goal Count" required value={form.goalCount} onChange={(e) => setForm({ ...form, goalCount: parseInt(e.target.value) || 0 })} min={1} />
            <AdminNumber label="XP Reward" required value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: parseInt(e.target.value) || 0 })} min={0} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminDatePicker label="Start Date" required value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
            <AdminDatePicker label="End Date" required value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
          </div>
        </div>
      </AdminModal>

      <AdminConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} onConfirm={() => deleteDialog.item && handleDelete(deleteDialog.item.id)} title="Delete Challenge" message={`Are you sure you want to delete "${deleteDialog.item?.title}"? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  );
}
