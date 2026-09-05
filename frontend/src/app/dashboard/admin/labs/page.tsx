"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import { Microscope, Shield, Plus, Pencil, Trash2, ChevronRight, ArrowLeft, ClipboardCheck, AlertTriangle } from "lucide-react";
import toast from "@/lib/toast";
import AdminTable from "@/components/admin/AdminTable";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminSelect, AdminNumber } from "@/components/admin/AdminForm";
import type { AdminLab, AdminLabFlag } from "@/types/api";
import { getDifficultyStyle } from "@/lib/labs";
import PageHeader from "@/components/ui/PageHeader";

function getDifficultyLabel(d: number) {
  const s = getDifficultyStyle(d);
  return { label: s.label.charAt(0) + s.label.slice(1).toLowerCase(), color: s.badge };
}

export default function AdminLabsPage() {
  const [labs, setLabs] = useState<AdminLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState<AdminLab | null>(null);

  // Modal states
  const [labModal, setLabModal] = useState<{ open: boolean; editing: AdminLab | null }>({ open: false, editing: null });
  const [flagModal, setFlagModal] = useState<{ open: boolean; editing: AdminLabFlag | null }>({ open: false, editing: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; item: AdminLab | AdminLabFlag | null }>({ open: false, type: "", item: null });
  const [batchDelete, setBatchDelete] = useState<{ open: boolean; items: AdminLab[] }>({ open: false, items: [] });

  // Form states
  const [labForm, setLabForm] = useState({ title: "", description: "", dockerImage: "", difficulty: "1200", briefing: "", imageUrl: "", basePath: "", resourceProfile: "STANDARD" });
  const [flagForm, setFlagForm] = useState({ title: "", description: "", points: 100, correctAnswer: "" });
  const [saving, setSaving] = useState(false);

  const loadLabs = useCallback(async () => {
    try {
      const data = await fetchApi("/labs");
      setLabs(Array.isArray(data) ? data : data.data || []);
    } catch { toast.error("Failed to load labs"); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApi("/labs");
        if (!cancelled) setLabs(Array.isArray(data) ? data : data.data || []);
      } catch {
        toast.error("Failed to load labs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLabDetail = async (labId: string) => {
    try {
      const data = await fetchApi(`/labs/definition/${labId}`);
      setSelectedLab(data);
    } catch { toast.error("Failed to load lab details"); }
  };

  // === Lab CRUD ===
  const handleSaveLab = async () => {
    if (!labForm.title.trim() || !labForm.dockerImage.trim()) { toast.error("Title and Docker image are required"); return; }
    setSaving(true);
    try {
      const payload = { ...labForm, difficulty: parseInt(labForm.difficulty), imageUrl: labForm.imageUrl || null, basePath: labForm.basePath || null, briefing: labForm.briefing || null, resourceProfile: labForm.resourceProfile };
      if (labModal.editing) {
        await fetchApi(`/labs/${labModal.editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Lab updated");
      } else {
        await fetchApi("/labs", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Lab created");
      }
      setLabModal({ open: false, editing: null });
      loadLabs();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleDeleteLab = async () => {
    setSaving(true);
    try {
      if (!deleteDialog.item || deleteDialog.type !== "lab") return;
      await fetchApi(`/labs/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Lab deleted");
      setDeleteDialog({ open: false, type: "", item: null });
      setSelectedLab(null);
      loadLabs();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleBatchDelete = (selected: AdminLab[]) => {
    setBatchDelete({ open: true, items: selected });
  };

  const confirmBatchDelete = async () => {
    setSaving(true);
    try {
      await fetchApi("/labs/batch/delete", {
        method: "POST",
        body: JSON.stringify({ ids: batchDelete.items.map((l) => l.id) }),
      });
      toast.success(`Deleted ${batchDelete.items.length} lab${batchDelete.items.length > 1 ? "s" : ""}`);
      setBatchDelete({ open: false, items: [] });
      loadLabs();
    } catch { toast.error("Failed to delete labs"); } finally { setSaving(false); }
  };

  // === Flag CRUD ===
  const handleSaveFlag = async () => {
    if (!flagForm.title.trim()) { toast.error("Flag title is required"); return; }
    if (!flagModal.editing && !flagForm.correctAnswer.trim()) { toast.error("Correct answer is required"); return; }
    if (!selectedLab) return;
    setSaving(true);
    try {
      if (flagModal.editing) {
        await fetchApi(`/labs/flags/${flagModal.editing.id}`, { method: "PATCH", body: JSON.stringify(flagForm) });
        toast.success("Flag updated");
      } else {
        await fetchApi(`/labs/${selectedLab.id}/flags`, { method: "POST", body: JSON.stringify(flagForm) });
        toast.success("Flag created");
      }
      setFlagModal({ open: false, editing: null });
      loadLabDetail(selectedLab.id);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleDeleteFlag = async () => {
    if (!deleteDialog.item || deleteDialog.type !== "flag" || !selectedLab) return;
    setSaving(true);
    try {
      await fetchApi(`/labs/flags/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Flag deleted");
      setDeleteDialog({ open: false, type: "", item: null });
      loadLabDetail(selectedLab.id);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  // === Lab List View ===
  if (!selectedLab) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Lab Management"
          description="Control lab definitions, difficulty, and flag evidence without compromising platform safety"
        />

        <div className="relative overflow-hidden angular-card bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Microscope size={28} /></div>
              <div>
                <h1 className="text-2xl font-bold">Manage Labs</h1>
                <p className="text-violet-100 text-sm">{labs.length} labs total</p>
              </div>
            </div>
            <button onClick={() => { setLabForm({ title: "", description: "", dockerImage: "", difficulty: "1200", briefing: "", imageUrl: "", basePath: "", resourceProfile: "STANDARD" }); setLabModal({ open: true, editing: null }); }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm backdrop-blur-sm">
              <Plus size={16} /> New Lab
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-[#7AD62A]" />
              <h3 className="text-sm font-semibold text-white">What to review</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Confirm the lab objective, linked Docker image, and difficulty signal before publishing or changing a lab definition.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#7AD62A]" />
              <h3 className="text-sm font-semibold text-white">Flag integrity</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Flags should validate meaningful proof of work. Keep scoring proportional and answers tightly controlled.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-[#0f172a] p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Platform safety</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Editing a lab definition is allowed here, but core lab Docker images remain protected operational assets and should not be treated like disposable content.
            </p>
          </div>
        </div>

        <AdminTable
          columns={[
            { key: "title", label: "Lab", sortable: true, render: (lab: AdminLab) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0"><Microscope size={18} className="text-violet-600" /></div>
                <div><p className="font-medium text-white">{lab.title}</p><p className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{lab.dockerImage}</p></div>
              </div>
            )},
            { key: "difficulty", label: "Difficulty", sortable: true, render: (lab: AdminLab) => { const d = getDifficultyLabel(lab.difficulty || 1200); return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${d.color}`}>{d.label}</span>; }},
            { key: "flags", label: "Flags", render: (lab: AdminLab) => <span className="flex items-center gap-1.5 text-slate-300"><Shield size={14} className="text-slate-400" />{lab.flags?.length || 0}</span> },
            { key: "resourceProfile", label: "Resources", render: (lab: AdminLab) => {
              const profile = lab.resourceProfile || "STANDARD";
              const colors: Record<string, string> = { LIGHTWEIGHT: "bg-green-500/10 text-green-400", STANDARD: "bg-blue-500/10 text-blue-400", HEAVY: "bg-amber-500/10 text-amber-400" };
              return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[profile] || colors.STANDARD}`}>{profile}</span>;
            }},
            { key: "basePath", label: "Base Path", render: (lab: AdminLab) => <span className="text-xs font-mono text-slate-400">{lab.basePath || "/"}</span> },
          ]}
          data={labs}
          loading={loading}
          searchPlaceholder="Search labs..."
          searchKeys={["title", "dockerImage"]}
          onAdd={() => { setLabForm({ title: "", description: "", dockerImage: "", difficulty: "1200", briefing: "", imageUrl: "", basePath: "", resourceProfile: "STANDARD" }); setLabModal({ open: true, editing: null }); }}
          onEdit={(lab) => { setLabForm({ title: lab.title, description: lab.description, dockerImage: lab.dockerImage, difficulty: String(lab.difficulty || 1200), briefing: lab.briefing || "", imageUrl: lab.imageUrl || "", basePath: lab.basePath || "", resourceProfile: lab.resourceProfile || "STANDARD" }); setLabModal({ open: true, editing: lab }); }}
          onDelete={(item) => setDeleteDialog({ open: true, type: "lab", item })}
          onRowClick={(lab) => loadLabDetail(lab.id)}
          addLabel="New Lab"
          selectable
          exportable
          exportFilename="labs"
          bulkActions={[
            { label: "Delete", icon: <Trash2 size={16} />, variant: "danger", onClick: handleBatchDelete },
          ]}
        />

        <AdminModal isOpen={labModal.open} onClose={() => setLabModal({ open: false, editing: null })} title={labModal.editing ? "Edit Lab" : "New Lab"} size="lg" footer={<div className="flex gap-3 justify-end"><button onClick={() => setLabModal({ open: false, editing: null })} className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-700 hover:bg-white/5 text-sm font-medium">Cancel</button><button onClick={handleSaveLab} disabled={saving} className="px-4 py-2.5 rounded-xl bg-[#7AD62A] hover:bg-[#0F203A] text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput label="Title" value={labForm.title} onChange={(e) => setLabForm({ ...labForm, title: e.target.value })} placeholder="Lab title" required />
            <AdminInput label="Docker Image" value={labForm.dockerImage} onChange={(e) => setLabForm({ ...labForm, dockerImage: e.target.value })} placeholder="e.g. vulnerables/web-dvwa" required />
            <AdminInput label="Image URL" value={labForm.imageUrl} onChange={(e) => setLabForm({ ...labForm, imageUrl: e.target.value })} placeholder="Lab thumbnail URL" />
            <AdminInput label="Base Path" value={labForm.basePath} onChange={(e) => setLabForm({ ...labForm, basePath: e.target.value })} placeholder="/" />
            <AdminSelect label="Difficulty" value={labForm.difficulty} onChange={(e) => setLabForm({ ...labForm, difficulty: e.target.value })} options={[{ value: "1000", label: "Beginner (1000)" }, { value: "1100", label: "Beginner+ (1100)" }, { value: "1200", label: "Intermediate (1200)" }, { value: "1300", label: "Intermediate+ (1300)" }, { value: "1400", label: "Advanced (1400)" }, { value: "1500", label: "Advanced+ (1500)" }, { value: "1600", label: "Expert (1600)" }]} />
            <AdminSelect label="Resource Profile" value={labForm.resourceProfile} onChange={(e) => setLabForm({ ...labForm, resourceProfile: e.target.value })} options={[{ value: "LIGHTWEIGHT", label: "Lightweight (256MB / 5% CPU)" }, { value: "STANDARD", label: "Standard (512MB / 10% CPU)" }, { value: "HEAVY", label: "Heavy (1GB / 20% CPU)" }]} />
            <div className="md:col-span-2"><AdminTextarea label="Description" value={labForm.description} onChange={(e) => setLabForm({ ...labForm, description: e.target.value })} placeholder="Lab description" rows={3} /></div>
            <div className="md:col-span-2"><AdminTextarea label="Briefing (Markdown)" value={labForm.briefing} onChange={(e) => setLabForm({ ...labForm, briefing: e.target.value })} placeholder="Lab briefing / instructions" rows={6} /></div>
          </div>
        </AdminModal>

        <AdminConfirmDialog isOpen={deleteDialog.open && deleteDialog.type === "lab"} onClose={() => setDeleteDialog({ open: false, type: "", item: null })} onConfirm={handleDeleteLab} title="Delete Lab" message={`Delete "${deleteDialog.item?.title}"? This will also delete all flags.`} loading={saving} />
        <AdminConfirmDialog isOpen={batchDelete.open} onClose={() => setBatchDelete({ open: false, items: [] })} onConfirm={confirmBatchDelete} title="Delete Labs" message={`Delete ${batchDelete.items.length} selected lab${batchDelete.items.length > 1 ? "s" : ""}? This will also delete all associated flags.`} loading={saving} confirmLabel="Delete Selected" />
      </div>
    );
  }

  // === Lab Detail / Flags View ===
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
        <button onClick={() => setSelectedLab(null)} className="hover:text-[#7AD62A] transition-colors">Labs</button>
        <ChevronRight size={14} />
        <span className="text-white font-medium">{selectedLab?.title}</span>
      </div>

      <div className="relative overflow-hidden angular-card bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedLab(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all" aria-label="Back to labs list"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold">{selectedLab!.title}</h1>
              <p className="text-amber-100 text-sm font-mono">{selectedLab!.dockerImage} | {selectedLab!.flags?.length || 0} flags</p>
              <div className="flex items-center gap-2 mt-2">
                {(() => { const d = getDifficultyLabel(selectedLab!.difficulty || 1200); return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.color}`}>{d.label}</span>; })()}
                {(() => { const p = selectedLab!.resourceProfile || "STANDARD"; const c: Record<string, string> = { LIGHTWEIGHT: "bg-green-500/10 text-green-400", STANDARD: "bg-blue-500/10 text-blue-400", HEAVY: "bg-amber-500/10 text-amber-400" }; return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c[p] || c.STANDARD}`}>{p}</span>; })()}
              </div>
            </div>
          </div>
          <button onClick={() => { setFlagForm({ title: "", description: "", points: 100, correctAnswer: "" }); setFlagModal({ open: true, editing: null }); }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm backdrop-blur-sm">
            <Plus size={16} /> New Flag
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <h3 className="text-sm font-semibold text-white">Definition quality</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Keep the lab title, briefing, and flag set aligned so learners know what the exercise proves and reviewers know what success means.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <h3 className="text-sm font-semibold text-white">Assessment evidence</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Use multiple flags only when they reflect staged proof, not artificial difficulty. Each flag should map to a meaningful milestone.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <h3 className="text-sm font-semibold text-white">Operator caution</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Before removing a lab, review whether downstream courses, lessons, or existing learner records still depend on it.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {selectedLab!.flags?.map((flag) => (
          <div key={flag.id} className="angular-card bg-[#0f172a] p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Shield size={18} className="text-amber-600" /></div>
                <div>
                  <h3 className="font-semibold text-white">{flag.title}</h3>
                  {flag.description && <p className="text-sm text-slate-400 line-clamp-1 max-w-md">{flag.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-[#7AD62A]/10 text-[#0F203A] px-2.5 py-1 rounded-full font-medium">{flag.points} pts</span>
                <button onClick={() => { setFlagForm({ title: flag.title, description: flag.description || "", points: flag.points, correctAnswer: "" }); setFlagModal({ open: true, editing: flag }); }} className="p-2 text-slate-400 hover:text-[#7AD62A] hover:bg-[#7AD62A]/10 rounded-lg transition-all"><Pencil size={16} /></button>
                <button onClick={() => setDeleteDialog({ open: true, type: "flag", item: flag })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {(!selectedLab!.flags || selectedLab!.flags.length === 0) && (
          <div className="text-center py-12 angular-card bg-[#0f172a]">
            <Shield size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400">No flags yet. Add CTF flags for this lab.</p>
          </div>
        )}
      </div>

      <AdminModal isOpen={flagModal.open} onClose={() => setFlagModal({ open: false, editing: null })} title={flagModal.editing ? "Edit Flag" : "New Flag"} footer={<div className="flex gap-3 justify-end"><button onClick={() => setFlagModal({ open: false, editing: null })} className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-700 hover:bg-white/5 text-sm font-medium">Cancel</button><button onClick={handleSaveFlag} disabled={saving} className="px-4 py-2.5 rounded-xl bg-[#7AD62A] hover:bg-[#0F203A] text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>}>
        <div className="space-y-4">
          <AdminInput label="Flag Title" value={flagForm.title} onChange={(e) => setFlagForm({ ...flagForm, title: e.target.value })} placeholder="e.g. SQL Injection Root Flag" required />
          <AdminInput label="Correct Answer" value={flagForm.correctAnswer} onChange={(e) => setFlagForm({ ...flagForm, correctAnswer: e.target.value })} placeholder="Flag answer (hashed on save)" required={!!!flagModal.editing} hint={flagModal.editing ? "Leave blank to keep current answer" : ""} />
          <AdminNumber label="Points" value={flagForm.points} onChange={(e) => setFlagForm({ ...flagForm, points: parseInt(e.target.value) || 100 })} min={0} />
          <AdminTextarea label="Description" value={flagForm.description} onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })} placeholder="Optional hint or description" rows={3} />
        </div>
      </AdminModal>

      <AdminConfirmDialog isOpen={deleteDialog.open && deleteDialog.type === "flag"} onClose={() => setDeleteDialog({ open: false, type: "", item: null })} onConfirm={handleDeleteFlag} title="Delete Flag" message={`Delete "${deleteDialog.item?.title}"?`} loading={saving} />
    </div>
  );
}
