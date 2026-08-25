"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApiV2 } from "@/lib/api";
import { Swords, Plus, Pencil, Trash2, ArrowLeft, Loader2, Search, Skull } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import toast from "@/lib/toast";
import Link from "next/link";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminNumber, AdminSelect, AdminDatePicker } from "@/components/admin/AdminForm";
import PageHeader from "@/components/ui/PageHeader";

interface BossMission {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  maxAttempts: number;
  xpReward: number;
  ratingReward: number;
  theme: string | null;
  domainId: string | null;
  labId: string | null;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  season: { name: string; seasonNumber: number } | null;
  _count: { attempts: number };
}

interface Season {
  id: string;
  name: string;
  seasonNumber: number;
}

const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
  { value: "BOSS", label: "Boss" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD: "bg-red-100 text-red-700",
  BOSS: "bg-purple-100 text-purple-700",
};

function defaultForm() {
  return {
    seasonId: "",
    title: "",
    description: "",
    difficulty: "BOSS",
    maxAttempts: 3,
    xpReward: 500,
    ratingReward: 200,
    theme: "",
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
  };
}

export default function AdminBossMissionsPage() {
  const [missions, setMissions] = useState<BossMission[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: BossMission | null }>({ open: false, editing: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: BossMission | null }>({ open: false, item: null });
  const [saving, setSaving] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(defaultForm());

  const load = useCallback(async () => {
    try {
      const [missionData, seasonData] = await Promise.all([
        fetchApiV2<BossMission[]>("/boss-missions"),
        fetchApiV2<Season[]>("/seasons"),
      ]);
      setMissions(missionData);
      setSeasons(seasonData);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = missions.filter((m) => {
    if (filterDifficulty && m.difficulty !== filterDifficulty) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openCreate = () => {
    setForm(defaultForm());
    setModal({ open: true, editing: null });
  };

  const openEdit = (m: BossMission) => {
    setForm({
      seasonId: m.season?.name ? seasons.find((s) => s.name === m.season!.name)?.id || "" : "",
      title: m.title,
      description: m.description,
      difficulty: m.difficulty,
      maxAttempts: m.maxAttempts,
      xpReward: m.xpReward,
      ratingReward: m.ratingReward,
      theme: m.theme || "",
      startsAt: new Date(m.startsAt).toISOString().slice(0, 16),
      expiresAt: new Date(m.expiresAt).toISOString().slice(0, 16),
    });
    setModal({ open: true, editing: m });
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        seasonId: form.seasonId || null,
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        maxAttempts: form.maxAttempts,
        xpReward: form.xpReward,
        ratingReward: form.ratingReward,
        theme: form.theme || null,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
      };
      if (modal.editing) {
        await fetchApiV2(`/boss-missions/${modal.editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await fetchApiV2("/boss-missions", { method: "POST", body: JSON.stringify(body) });
      }
      toast.success(modal.editing ? "Mission updated" : "Mission created");
      setModal({ open: false, editing: null });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await fetchApiV2(`/boss-missions/${id}`, { method: "DELETE" });
      toast.success("Mission deactivated");
      setDeleteDialog({ open: false, item: null });
      load();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#229C62] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ArrowLeft size={14} /> Admin
      </Link>
      <PageHeader title="Boss Missions" description={`${missions.length} missions`} action={
        <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1.5">
          <Plus size={14} /> Create Boss Mission
        </button>
      } />

      <div className="flex items-center gap-3">
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62]"
        >
          <option value="">All Difficulties</option>
          {DIFFICULTY_OPTIONS.map((opt) => (
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
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Difficulty</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Season</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Attempts</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">XP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Start</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Expires</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => {
                const now = new Date();
                const starts = new Date(m.startsAt);
                const expires = new Date(m.expiresAt);
                const status = !m.isActive ? "Inactive" : now < starts ? "Upcoming" : now > expires ? "Expired" : "Active";
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{m.title}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{m.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[m.difficulty] || "bg-slate-100 text-slate-600"}`}>
                        {m.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {m.season ? `S${m.season.seasonNumber}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{m._count.attempts}/{m.maxAttempts}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">{m.xpReward}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">{m.ratingReward}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(m.startsAt)}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(m.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteDialog({ open: true, item: m })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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
            icon={Skull}
            title="No boss missions found"
            description="Create a boss mission to get started."
          />
        )}
      </div>

      <AdminModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? "Edit Boss Mission" : "Create Boss Mission"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#229C62] text-white rounded-lg hover:bg-[#0F203A] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {modal.editing ? "Save Changes" : "Create Boss Mission"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Season</label>
              <select
                value={form.seasonId}
                onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62] text-sm"
              >
                <option value="">No season</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>Season {s.seasonNumber} — {s.name}</option>
                ))}
              </select>
            </div>
            <AdminSelect
              label="Difficulty"
              required
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              options={DIFFICULTY_OPTIONS}
            />
          </div>
          <AdminInput label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The Firewall Boss" />
          <AdminTextarea label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the boss mission..." rows={3} />
          <div className="grid grid-cols-3 gap-4">
            <AdminNumber label="Max Attempts" required value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: parseInt(e.target.value) || 3 })} min={1} />
            <AdminNumber label="XP Reward" required value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: parseInt(e.target.value) || 0 })} min={0} />
            <AdminNumber label="Rating Reward" required value={form.ratingReward} onChange={(e) => setForm({ ...form, ratingReward: parseInt(e.target.value) || 0 })} min={0} />
          </div>
          <AdminInput label="Theme" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} placeholder="Optional theme tag" />
          <div className="grid grid-cols-2 gap-4">
            <AdminDatePicker label="Starts At" required value={form.startsAt} onChange={(v) => setForm({ ...form, startsAt: v })} />
            <AdminDatePicker label="Expires At" required value={form.expiresAt} onChange={(v) => setForm({ ...form, expiresAt: v })} />
          </div>
        </div>
      </AdminModal>

      <AdminConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        onConfirm={() => deleteDialog.item && handleDeactivate(deleteDialog.item.id)}
        title="Deactivate Boss Mission"
        message={`Are you sure you want to deactivate "${deleteDialog.item?.title}"?`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
