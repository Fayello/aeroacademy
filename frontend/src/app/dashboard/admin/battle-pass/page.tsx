"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApiV2 } from "@/lib/api";
import { Layers, Plus, Pencil, Trash2, ArrowLeft, Loader2, Search, ChevronDown, ChevronUp, Swords } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import toast from "@/lib/toast";
import Link from "next/link";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminNumber } from "@/components/admin/AdminForm";
import PageHeader from "@/components/ui/PageHeader";

interface BattlePassTier {
  tierNumber: number;
  title: string;
  xpRequired: number;
  isPremium: boolean;
  rewards: any;
}

interface BattlePass {
  id: string;
  seasonId: string;
  title: string;
  totalTiers: number;
  isActive: boolean;
  season: { name: string; seasonNumber: number };
  tiers: BattlePassTier[];
  _count: { progress: number };
}

interface Season {
  id: string;
  name: string;
  seasonNumber: number;
  isActive: boolean;
}

function defaultTier(idx: number): BattlePassTier {
  return { tierNumber: idx + 1, title: "", xpRequired: (idx + 1) * 500, isPremium: false, rewards: [] };
}

function defaultForm() {
  return {
    seasonId: "",
    title: "",
    tiers: [defaultTier(0), defaultTier(1), defaultTier(2)],
  };
}

export default function AdminBattlePassPage() {
  const [battlePasses, setBattlePasses] = useState<BattlePass[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: BattlePass | null }>({ open: false, editing: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: BattlePass | null }>({ open: false, item: null });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(defaultForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [bpData, seasonData] = await Promise.all([
        fetchApiV2<BattlePass[]>("/battle-pass"),
        fetchApiV2<Season[]>("/seasons"),
      ]);
      setBattlePasses(bpData);
      setSeasons(seasonData);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = battlePasses.filter((bp) =>
    searchQuery ? bp.title.toLowerCase().includes(searchQuery.toLowerCase()) : true,
  );

  const openCreate = () => {
    setForm(defaultForm());
    setModal({ open: true, editing: null });
  };

  const openEdit = (bp: BattlePass) => {
    setForm({
      seasonId: bp.seasonId,
      title: bp.title,
      tiers: bp.tiers.map((t) => ({ ...t, rewards: Array.isArray(t.rewards) ? t.rewards : [] })),
    });
    setModal({ open: true, editing: bp });
  };

  const addTier = () => {
    setForm({ ...form, tiers: [...form.tiers, defaultTier(form.tiers.length)] });
  };

  const removeTier = (idx: number) => {
    if (form.tiers.length <= 1) return;
    setForm({ ...form, tiers: form.tiers.filter((_, i) => i !== idx) });
  };

  const updateTier = (idx: number, field: string, value: any) => {
    const tiers = [...form.tiers];
    (tiers[idx] as any)[field] = value;
    setForm({ ...form, tiers });
  };

  const handleSave = async () => {
    if (!form.seasonId || !form.title) {
      toast.error("Season and title are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        seasonId: form.seasonId,
        title: form.title,
        tiers: form.tiers.map((t, i) => ({
          tierNumber: i + 1,
          title: t.title,
          xpRequired: t.xpRequired,
          isPremium: t.isPremium,
          rewards: t.rewards,
        })),
      };
      if (modal.editing) {
        await fetchApiV2(`/battle-pass/${modal.editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await fetchApiV2("/battle-pass", { method: "POST", body: JSON.stringify(body) });
      }
      toast.success(modal.editing ? "Battle Pass updated" : "Battle Pass created");
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
      await fetchApiV2(`/battle-pass/${id}`, { method: "DELETE" });
      toast.success("Battle Pass deactivated");
      setDeleteDialog({ open: false, item: null });
      load();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  const getSeasonName = (seasonId: string) => {
    const s = seasons.find((s) => s.id === seasonId);
    return s ? `Season ${s.seasonNumber} — ${s.name}` : "Unknown";
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
      <PageHeader title="Battle Pass" description={`${battlePasses.length} battle passes`} action={
        <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1.5">
          <Plus size={14} /> Create Battle Pass
        </button>
      } />

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search battle passes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-white/10 rounded-lg bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((bp) => (
          <div key={bp.id} className="angular-card bg-[#0f172a] overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{bp.title}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${bp.isActive ? "bg-[#7AD62A]/10 text-[#7AD62A]" : "bg-slate-100 text-slate-500"}`}>
                    {bp.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {getSeasonName(bp.seasonId)} \u2022 {bp.totalTiers} tiers \u2022 {bp._count.progress} players
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setExpandedId(expandedId === bp.id ? null : bp.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-white/5 transition-colors">
                  {expandedId === bp.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button onClick={() => openEdit(bp)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteDialog({ open: true, item: bp })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {expandedId === bp.id && bp.tiers.length > 0 && (
              <div className="border-t border-slate-100 px-5 pb-5">
                <p className="text-xs font-medium text-slate-500 mt-3 mb-2">Tiers</p>
                <div className="space-y-1">
                  {bp.tiers.sort((a, b) => a.tierNumber - b.tierNumber).map((t) => (
                    <div key={t.tierNumber} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400 w-6">T{t.tierNumber}</span>
                        <span className="text-sm text-white">{t.title}</span>
                        {t.isPremium && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Premium</span>}
                      </div>
                      <span className="text-xs font-medium text-slate-600">{t.xpRequired.toLocaleString()} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <EmptyState
            icon={Swords}
            title="No battle passes found"
            description="Create a battle pass to get started."
          />
        )}
      </div>

      <AdminModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? "Edit Battle Pass" : "Create Battle Pass"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-slate-600 hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#7AD62A] text-white rounded-lg hover:bg-[#0F203A] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {modal.editing ? "Save Changes" : "Create Battle Pass"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {!modal.editing && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Season <span className="text-red-500">*</span></label>
              <select
                value={form.seasonId}
                onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0f172a] text-white focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A] text-sm"
              >
                <option value="">Select season...</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>Season {s.seasonNumber} — {s.name}</option>
                ))}
              </select>
            </div>
          )}
          <AdminInput label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Season 1 Battle Pass" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700">Tiers</p>
              <button onClick={addTier} className="text-xs text-[#7AD62A] hover:text-[#0F203A] flex items-center gap-1">
                <Plus size={12} /> Add Tier
              </button>
            </div>
            <div className="space-y-3">
              {form.tiers.map((tier, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">Tier {idx + 1}</span>
                    {form.tiers.length > 1 && (
                      <button onClick={() => removeTier(idx)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <AdminInput label="Title" value={tier.title} onChange={(e) => updateTier(idx, "title", e.target.value)} placeholder="e.g. Bronze" />
                    <AdminNumber label="XP Required" value={tier.xpRequired} onChange={(e) => updateTier(idx, "xpRequired", parseInt(e.target.value) || 0)} min={0} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tier.isPremium}
                      onChange={(e) => updateTier(idx, "isPremium", e.target.checked)}
                      className="rounded border-white/10"
                    />
                    <span className="text-xs text-slate-600">Premium tier</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminModal>

      <AdminConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        onConfirm={() => deleteDialog.item && handleDeactivate(deleteDialog.item.id)}
        title="Deactivate Battle Pass"
        message={`Are you sure you want to deactivate "${deleteDialog.item?.title}"?`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
