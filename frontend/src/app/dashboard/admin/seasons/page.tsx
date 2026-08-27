"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApiV2 } from "@/lib/api";
import { Calendar, Plus, Pencil, ArrowLeft, Loader2, Search, RotateCcw, StopCircle } from "lucide-react";
import toast from "@/lib/toast";
import Link from "next/link";
import AdminModal from "@/components/admin/AdminModal";
import { AdminInput, AdminNumber, AdminDatePicker } from "@/components/admin/AdminForm";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

interface Season {
  id: string;
  name: string;
  theme: string | null;
  domainTheme: string | null;
  seasonNumber: number;
  xpMultiplier: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  softResetCompleted: boolean;
  createdAt: string;
  _count: { battlePasses: number; bossMissions: number };
}

function defaultForm() {
  return {
    name: "",
    theme: "",
    xpMultiplier: 1.0,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 16),
  };
}

export default function AdminSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Season | null }>({ open: false, editing: null });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(defaultForm());

  const load = useCallback(async () => {
    try {
      const data = await fetchApiV2<Season[]>("/seasons");
      setSeasons(data);
    } catch {
      toast.error("Failed to load seasons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = seasons.filter((s) =>
    searchQuery ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
  );

  const openCreate = () => {
    setForm(defaultForm());
    setModal({ open: true, editing: null });
  };

  const openEdit = (s: Season) => {
    setForm({
      name: s.name,
      theme: s.theme || "",
      xpMultiplier: s.xpMultiplier,
      startDate: new Date(s.startDate).toISOString().slice(0, 16),
      endDate: new Date(s.endDate).toISOString().slice(0, 16),
    });
    setModal({ open: true, editing: s });
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Season name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        theme: form.theme || null,
        xpMultiplier: form.xpMultiplier,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };
      if (modal.editing) {
        await fetchApiV2(`/seasons/${modal.editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await fetchApiV2("/seasons", { method: "POST", body: JSON.stringify(body) });
      }
      toast.success(modal.editing ? "Season updated" : "Season created");
      setModal({ open: false, editing: null });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleEnd = async (id: string) => {
    try {
      await fetchApiV2(`/seasons/${id}/end`, { method: "POST" });
      toast.success("Season ended");
      load();
    } catch {
      toast.error("Failed to end season");
    }
  };

  const handleRotate = async () => {
    try {
      await fetchApiV2("/seasons/rotate", { method: "POST" });
      toast.success("Season rotated — new season created");
      load();
    } catch {
      toast.error("Failed to rotate season");
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
      <PageHeader title="Seasons" description={`${seasons.length} seasons`} action={
        <div className="flex gap-2">
          <button onClick={handleRotate} className="px-4 py-2 text-sm border border-white/10 text-slate-700 rounded-lg hover:bg-white/5 flex items-center gap-1.5 transition-colors">
            <RotateCcw size={14} /> Rotate
          </button>
          <button onClick={openCreate} className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={14} /> Create Season
          </button>
        </div>
      } />

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search seasons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-white/10 rounded-lg bg-[#0f172a] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
        />
      </div>

      <div className="angular-card bg-[#0f172a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Theme</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">XP Multi</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Start</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">End</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => {
                const now = new Date();
                const start = new Date(s.startDate);
                const end = new Date(s.endDate);
                const status = !s.isActive ? "Ended" : now < start ? "Upcoming" : now > end ? "Ended" : "Active";
                const statusColor =
                  status === "Active" ? "text-[#7AD62A]" :
                  status === "Upcoming" ? "text-blue-600" : "text-slate-400";
                return (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{s.seasonNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{s.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{s.theme || "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-white">{s.xpMultiplier}x</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(s.startDate)}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(s.endDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium ${statusColor}`}>{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors">
                          <Pencil size={14} />
                        </button>
                        {s.isActive && (
                          <button onClick={() => handleEnd(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors">
                            <StopCircle size={14} />
                          </button>
                        )}
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
            icon={Calendar}
            title="No seasons found"
            description="Create a season to get started."
          />
        )}
      </div>

      <AdminModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? "Edit Season" : "Create Season"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-slate-600 hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#7AD62A] text-white rounded-lg hover:bg-[#0F203A] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {modal.editing ? "Save Changes" : "Create Season"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminInput label="Season Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Season 1 — Zero Day" />
          <AdminInput label="Theme" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} placeholder="e.g. ZERO_DAY, RANSOMWARE" />
          <AdminNumber label="XP Multiplier" required value={form.xpMultiplier} onChange={(e) => setForm({ ...form, xpMultiplier: parseFloat(e.target.value) || 1.0 })} min={0.1} step={0.1} />
          <div className="grid grid-cols-2 gap-4">
            <AdminDatePicker label="Start Date" required value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
            <AdminDatePicker label="End Date" required value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
