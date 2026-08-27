"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Award, Plus, Pencil, Trash2, Loader2, ArrowLeft } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import toast from "@/lib/toast";
import Link from "next/link";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminSelect, AdminNumber } from "@/components/admin/AdminForm";
import PageHeader from "@/components/ui/PageHeader";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  xpReward: number;
  requirement: string;
  _count: { users: number };
}

const iconOptions = [
  "Footprints", "BookOpen", "GraduationCap", "Award", "Crown",
  "Flag", "Target", "Crosshair", "Trophy", "Compass", "Library",
  "Flame", "Zap", "Star", "Shield",
];

const requirementOptions = [
  { value: "complete_1_lesson", label: "Complete 1 Lesson" },
  { value: "complete_5_lessons", label: "Complete 5 Lessons" },
  { value: "complete_10_lessons", label: "Complete 10 Lessons" },
  { value: "complete_25_lessons", label: "Complete 25 Lessons" },
  { value: "complete_50_lessons", label: "Complete 50 Lessons" },
  { value: "capture_1_flag", label: "Capture 1 Flag" },
  { value: "capture_5_flags", label: "Capture 5 Flags" },
  { value: "capture_10_flags", label: "Capture 10 Flags" },
  { value: "capture_25_flags", label: "Capture 25 Flags" },
  { value: "enroll_3_courses", label: "Enroll in 3 Courses" },
  { value: "enroll_5_courses", label: "Enroll in 5 Courses" },
  { value: "streak_7_days", label: "7-Day Streak" },
  { value: "streak_30_days", label: "30-Day Streak" },
  { value: "level_5", label: "Reach Level 5" },
  { value: "level_10", label: "Reach Level 10" },
];

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: BadgeItem | null }>({ open: false, editing: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: BadgeItem | null }>({ open: false, item: null });
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "Award",
    category: "MILESTONE",
    tier: "BRONZE",
    xpReward: 100,
    requirement: "complete_1_lesson",
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchApi<BadgeItem[]>("/badges");
      setBadges(data);
    } catch {
      toast.error("Failed to load badges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ name: "", description: "", icon: "Award", category: "MILESTONE", tier: "BRONZE", xpReward: 100, requirement: "complete_1_lesson" });
    setModal({ open: true, editing: null });
  };

  const openEdit = (b: BadgeItem) => {
    setForm({ name: b.name, description: b.description, icon: b.icon, category: b.category, tier: b.tier, xpReward: b.xpReward, requirement: b.requirement });
    setModal({ open: true, editing: b });
  };

  const handleSave = async () => {
    if (!form.name || !form.description) {
      toast.error("Name and description are required");
      return;
    }
    setSaving(true);
    try {
      await fetchApi("/badges", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success(modal.editing ? "Badge updated" : "Badge created");
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
      await fetchApi(`/badges/${id}`, { method: "DELETE" });
      toast.success("Badge deleted");
      setDeleteDialog({ open: false, item: null });
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const tierColors: Record<string, string> = {
    BRONZE: "bg-amber-500/10 text-amber-400",
    SILVER: "bg-white/10 text-slate-300",
    GOLD: "bg-yellow-100 text-yellow-700",
    PLATINUM: "bg-purple-100 text-purple-700",
  };

  const categoryColors: Record<string, string> = {
    MILESTONE: "bg-blue-500/10 text-blue-400",
    SKILL: "bg-[#7AD62A]/10 text-[#0F203A]",
    ENGAGEMENT: "bg-orange-500/10 text-orange-400",
    STREAK: "bg-red-100 text-red-700",
    LEVEL: "bg-indigo-100 text-indigo-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#7AD62A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200">
        <ArrowLeft size={14} /> Admin
      </Link>
      <PageHeader title="Badges" description={`${badges.length} badges defined`} action={
        <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1.5">
          <Plus size={14} /> Create Badge
        </button>
      } />

      <div className="angular-card bg-[#0f172a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Badge</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">XP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Earned By</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {badges.map((b) => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{b.name}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[250px]">{b.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryColors[b.category] || "bg-white/5 text-slate-400"}`}>
                      {b.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tierColors[b.tier] || "bg-white/5 text-slate-400"}`}>
                      {b.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-white">{b.xpReward}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{b._count.users}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteDialog({ open: true, item: b })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {badges.length === 0 && (
          <EmptyState
            icon={Award}
            title="No badges yet"
            description="Create a badge to get started."
          />
        )}
      </div>

      <AdminModal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? "Edit Badge" : "Create Badge"} size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-slate-400 hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#7AD62A] text-white rounded-lg hover:bg-[#0F203A] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {modal.editing ? "Save Changes" : "Create Badge"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminInput label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. First Blood" />
          <AdminTextarea label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what this badge represents..." rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect label="Icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} options={iconOptions.map((i) => ({ value: i, label: i }))} />
            <AdminSelect label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={[
              { value: "MILESTONE", label: "Milestone" },
              { value: "SKILL", label: "Skill" },
              { value: "ENGAGEMENT", label: "Engagement" },
              { value: "STREAK", label: "Streak" },
              { value: "LEVEL", label: "Level" },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect label="Tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} options={[
              { value: "BRONZE", label: "Bronze" },
              { value: "SILVER", label: "Silver" },
              { value: "GOLD", label: "Gold" },
              { value: "PLATINUM", label: "Platinum" },
            ]} />
            <AdminNumber label="XP Reward" required value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: parseInt(e.target.value) || 0 })} min={0} />
          </div>
          <AdminSelect label="Requirement" value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} options={requirementOptions} />
        </div>
      </AdminModal>

      <AdminConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} onConfirm={() => deleteDialog.item && handleDelete(deleteDialog.item.id)} title="Delete Badge" message={`Are you sure you want to delete "${deleteDialog.item?.name}"? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  );
}
