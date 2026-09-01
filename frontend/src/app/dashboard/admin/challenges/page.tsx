"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Target, Plus, Pencil, Trash2, Loader2, ArrowLeft, Search } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import toast from "@/lib/toast";
import Link from "next/link";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminSelect, AdminNumber, AdminDatePicker } from "@/components/admin/AdminForm";
import PageHeader from "@/components/ui/PageHeader";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  objectiveType: string;
  objectiveTarget: number;
  xpReward: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  domainId: string | null;
  skillId: string | null;
  metadata: Record<string, unknown>;
  domain: { id: string; name: string; displayName: string } | null;
  skill: { id: string; name: string; displayName: string } | null;
  _count: { userChallenges: number };
}

const TYPE_OPTIONS = [
  { value: "DAILY_WARMUP", label: "Daily Warmup" },
  { value: "DAILY_SKILL", label: "Daily Skill" },
  { value: "DAILY_BOSS", label: "Daily Boss" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "SEASONAL", label: "Seasonal" },
  { value: "TEAM_WEEKLY", label: "Team Weekly" },
];

const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
  { value: "BOSS", label: "Boss" },
];

const OBJECTIVE_OPTIONS = [
  { value: "FLAG_COMPLETIONS", label: "Flag Completions" },
  { value: "LAB_COMPLETIONS", label: "Lab Completions" },
  { value: "LESSON_COMPLETIONS", label: "Lesson Completions" },
  { value: "QUIZ_COMPLETIONS", label: "Quiz Completions" },
  { value: "XP_EARNED", label: "XP Earned" },
  { value: "SKILL_XP_EARNED", label: "Skill XP Earned" },
];

const TYPE_COLORS: Record<string, string> = {
  DAILY_WARMUP: "bg-blue-100 text-blue-700",
  DAILY_SKILL: "bg-indigo-100 text-indigo-700",
  DAILY_BOSS: "bg-red-100 text-red-700",
  WEEKLY: "bg-purple-100 text-purple-700",
  MONTHLY: "bg-amber-100 text-amber-700",
  SEASONAL: "bg-teal-100 text-teal-700",
  TEAM_WEEKLY: "bg-orange-100 text-orange-700",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD: "bg-red-100 text-red-700",
  BOSS: "bg-purple-100 text-purple-700",
};

function defaultForm() {
  return {
    type: "DAILY_WARMUP",
    title: "",
    description: "",
    difficulty: "EASY",
    objectiveType: "FLAG_COMPLETIONS",
    objectiveTarget: 10,
    xpReward: 100,
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    domainId: "",
    skillId: "",
  };
}

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Challenge | null }>({ open: false, editing: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Challenge | null }>({ open: false, item: null });
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(defaultForm());

  const load = useCallback(async () => {
    try {
      const params = filterType ? `?type=${filterType}` : "";
      const data = await fetchApi<Challenge[]>(`/admin/challenges${params}`);
      setChallenges(data);
    } catch {
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  const filtered = challenges.filter((c) =>
    searchQuery ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) : true,
  );

  const openCreate = () => {
    setForm(defaultForm());
    setModal({ open: true, editing: null });
  };

  const openEdit = (c: Challenge) => {
    setForm({
      type: c.type,
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
      objectiveType: c.objectiveType,
      objectiveTarget: c.objectiveTarget,
      xpReward: c.xpReward,
      startAt: new Date(c.startAt).toISOString().slice(0, 16),
      endAt: new Date(c.endAt).toISOString().slice(0, 16),
      domainId: c.domainId || "",
      skillId: c.skillId || "",
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
      const body: Record<string, unknown> = {
        type: form.type,
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        objectiveType: form.objectiveType,
        objectiveTarget: form.objectiveTarget,
        xpReward: form.xpReward,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        domainId: form.domainId || null,
        skillId: form.skillId || null,
      };
      if (modal.editing) {
        await fetchApi(`/admin/challenges/${modal.editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await fetchApi("/admin/challenges", { method: "POST", body: JSON.stringify(body) });
      }
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
      await fetchApi(`/admin/challenges/${id}`, { method: "DELETE" });
      toast.success("Challenge deactivated");
      setDeleteDialog({ open: false, item: null });
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
      <PageHeader title="Mission Manager" description={`${challenges.length} missions`} action={
        <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1.5">
          <Plus size={14} /> Create Mission
        </button>
      } />

      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-white/10 rounded-lg bg-[#0f172a] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
        >
          <option value="">All Types</option>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-white/10 rounded-lg bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
          />
        </div>
      </div>

      <div className="angular-card bg-[#0f172a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Difficulty</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Objective</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">XP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Start</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">End</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const now = new Date();
                const start = new Date(c.startAt);
                const end = new Date(c.endAt);
                const status = !c.isActive ? "Inactive" : now < start ? "Scheduled" : now > end ? "Ended" : "Active";
                const statusColor =
                  status === "Active" ? "text-[#7AD62A]" :
                  status === "Scheduled" ? "text-blue-600" :
                  status === "Ended" ? "text-slate-400" : "text-slate-400";
                return (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[c.type] || "bg-slate-100 text-slate-600"}`}>
                        {c.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">{c.title}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{c.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[c.difficulty] || "bg-slate-100 text-slate-600"}`}>
                        {c.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.objectiveType.replace(/_/g, " ")} ({c.objectiveTarget})
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-white">{c.xpReward}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(c.startAt)}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(c.endAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium ${statusColor}`}>{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteDialog({ open: true, item: c })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors">
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
        {filtered.length === 0 && (
          <EmptyState
            icon={Target}
            title="No missions found"
            description="Create a mission to get started."
          />
        )}
      </div>

      <AdminModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? "Edit Mission" : "Create Mission"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-slate-600 hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#7AD62A] text-white rounded-lg hover:bg-[#0F203A] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {modal.editing ? "Save Changes" : "Create Mission"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect
              label="Type"
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={TYPE_OPTIONS}
            />
            <AdminSelect
              label="Difficulty"
              required
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              options={DIFFICULTY_OPTIONS}
            />
          </div>
          <AdminInput label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Daily Flag Hunt" />
          <AdminTextarea label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the mission..." rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect
              label="Objective Type"
              required
              value={form.objectiveType}
              onChange={(e) => setForm({ ...form, objectiveType: e.target.value })}
              options={OBJECTIVE_OPTIONS}
            />
            <AdminNumber label="Objective Target" required value={form.objectiveTarget} onChange={(e) => setForm({ ...form, objectiveTarget: parseInt(e.target.value) || 0 })} min={1} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminNumber label="XP Reward" required value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: parseInt(e.target.value) || 0 })} min={0} />
            <div />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminDatePicker label="Start At" required value={form.startAt} onChange={(v) => setForm({ ...form, startAt: v })} />
            <AdminDatePicker label="End At" required value={form.endAt} onChange={(v) => setForm({ ...form, endAt: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminInput label="Domain ID" value={form.domainId} onChange={(e) => setForm({ ...form, domainId: e.target.value })} placeholder="Optional" />
            <AdminInput label="Skill ID" value={form.skillId} onChange={(e) => setForm({ ...form, skillId: e.target.value })} placeholder="Optional" />
          </div>
        </div>
      </AdminModal>

      <AdminConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        onConfirm={() => deleteDialog.item && handleDelete(deleteDialog.item.id)}
        title="Deactivate Mission"
        message={`Are you sure you want to deactivate "${deleteDialog.item?.title}"? It will no longer be active for users.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
