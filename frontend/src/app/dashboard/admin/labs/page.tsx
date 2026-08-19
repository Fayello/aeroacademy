"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import { Microscope, Shield, Plus, Pencil, Trash2, ChevronRight, ArrowLeft } from "lucide-react";
import toast from "@/lib/toast";
import AdminTable from "@/components/admin/AdminTable";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminSelect, AdminNumber } from "@/components/admin/AdminForm";
import type { AdminLab, AdminLabFlag } from "@/types/api";

function getDifficultyLabel(d: number) {
  if (d < 1100) return { label: "Beginner", color: "bg-[#E9F8EE] text-[#0F203A]" };
  if (d < 1300) return { label: "Intermediate", color: "bg-amber-100 text-amber-700" };
  if (d < 1500) return { label: "Advanced", color: "bg-orange-100 text-orange-700" };
  return { label: "Expert", color: "bg-red-100 text-red-700" };
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
  const [labForm, setLabForm] = useState({ title: "", description: "", dockerImage: "", difficulty: "1200", briefing: "", imageUrl: "", basePath: "" });
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
      const payload = { ...labForm, difficulty: parseInt(labForm.difficulty), imageUrl: labForm.imageUrl || null, basePath: labForm.basePath || null, briefing: labForm.briefing || null };
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Microscope size={28} /></div>
              <div>
                <h1 className="text-2xl font-bold">Manage Labs</h1>
                <p className="text-violet-100 text-sm">{labs.length} labs total</p>
              </div>
            </div>
            <button onClick={() => { setLabForm({ title: "", description: "", dockerImage: "", difficulty: "1200", briefing: "", imageUrl: "", basePath: "" }); setLabModal({ open: true, editing: null }); }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm backdrop-blur-sm">
              <Plus size={16} /> New Lab
            </button>
          </div>
        </div>

        <AdminTable
          columns={[
            { key: "title", label: "Lab", sortable: true, render: (lab: AdminLab) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0"><Microscope size={18} className="text-violet-600" /></div>
                <div><p className="font-medium text-slate-900">{lab.title}</p><p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{lab.dockerImage}</p></div>
              </div>
            )},
            { key: "difficulty", label: "Difficulty", sortable: true, render: (lab: AdminLab) => { const d = getDifficultyLabel(lab.difficulty || 1200); return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${d.color}`}>{d.label}</span>; }},
            { key: "flags", label: "Flags", render: (lab: AdminLab) => <span className="flex items-center gap-1.5 text-slate-600"><Shield size={14} className="text-slate-400" />{lab.flags?.length || 0}</span> },
            { key: "basePath", label: "Base Path", render: (lab: AdminLab) => <span className="text-xs font-mono text-slate-500">{lab.basePath || "/"}</span> },
          ]}
          data={labs}
          loading={loading}
          searchPlaceholder="Search labs..."
          searchKeys={["title", "dockerImage"]}
          onAdd={() => { setLabForm({ title: "", description: "", dockerImage: "", difficulty: "1200", briefing: "", imageUrl: "", basePath: "" }); setLabModal({ open: true, editing: null }); }}
          onEdit={(lab) => { setLabForm({ title: lab.title, description: lab.description, dockerImage: lab.dockerImage, difficulty: String(lab.difficulty || 1200), briefing: lab.briefing || "", imageUrl: lab.imageUrl || "", basePath: lab.basePath || "" }); setLabModal({ open: true, editing: lab }); }}
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

        <AdminModal isOpen={labModal.open} onClose={() => setLabModal({ open: false, editing: null })} title={labModal.editing ? "Edit Lab" : "New Lab"} size="lg" footer={<div className="flex gap-3 justify-end"><button onClick={() => setLabModal({ open: false, editing: null })} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button><button onClick={handleSaveLab} disabled={saving} className="px-4 py-2.5 rounded-xl bg-[#229C62] hover:bg-[#0F203A] text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput label="Title" value={labForm.title} onChange={(e) => setLabForm({ ...labForm, title: e.target.value })} placeholder="Lab title" required />
            <AdminInput label="Docker Image" value={labForm.dockerImage} onChange={(e) => setLabForm({ ...labForm, dockerImage: e.target.value })} placeholder="e.g. vulnerables/web-dvwa" required />
            <AdminInput label="Image URL" value={labForm.imageUrl} onChange={(e) => setLabForm({ ...labForm, imageUrl: e.target.value })} placeholder="Lab thumbnail URL" />
            <AdminInput label="Base Path" value={labForm.basePath} onChange={(e) => setLabForm({ ...labForm, basePath: e.target.value })} placeholder="/" />
            <AdminSelect label="Difficulty" value={labForm.difficulty} onChange={(e) => setLabForm({ ...labForm, difficulty: e.target.value })} options={[{ value: "1000", label: "Beginner (1000)" }, { value: "1100", label: "Beginner+ (1100)" }, { value: "1200", label: "Intermediate (1200)" }, { value: "1300", label: "Intermediate+ (1300)" }, { value: "1400", label: "Advanced (1400)" }, { value: "1500", label: "Advanced+ (1500)" }, { value: "1600", label: "Expert (1600)" }]} />
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
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <button onClick={() => setSelectedLab(null)} className="hover:text-[#229C62] transition-colors">Labs</button>
        <ChevronRight size={14} />
        <span className="text-slate-900 font-medium">{selectedLab?.title}</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedLab(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all" aria-label="Back to labs list"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold">{selectedLab!.title}</h1>
              <p className="text-amber-100 text-sm font-mono">{selectedLab!.dockerImage} | {selectedLab!.flags?.length || 0} flags</p>
            </div>
          </div>
          <button onClick={() => { setFlagForm({ title: "", description: "", points: 100, correctAnswer: "" }); setFlagModal({ open: true, editing: null }); }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm backdrop-blur-sm">
            <Plus size={16} /> New Flag
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {selectedLab!.flags?.map((flag) => (
          <div key={flag.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Shield size={18} className="text-amber-600" /></div>
                <div>
                  <h3 className="font-semibold text-slate-900">{flag.title}</h3>
                  {flag.description && <p className="text-sm text-slate-500 line-clamp-1 max-w-md">{flag.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-[#E9F8EE] text-[#0F203A] px-2.5 py-1 rounded-full font-medium">{flag.points} pts</span>
                <button onClick={() => { setFlagForm({ title: flag.title, description: flag.description || "", points: flag.points, correctAnswer: "" }); setFlagModal({ open: true, editing: flag }); }} className="p-2 text-slate-400 hover:text-[#229C62] hover:bg-[#E9F8EE] rounded-lg transition-all"><Pencil size={16} /></button>
                <button onClick={() => setDeleteDialog({ open: true, type: "flag", item: flag })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {(!selectedLab!.flags || selectedLab!.flags.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Shield size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No flags yet. Add CTF flags for this lab.</p>
          </div>
        )}
      </div>

      <AdminModal isOpen={flagModal.open} onClose={() => setFlagModal({ open: false, editing: null })} title={flagModal.editing ? "Edit Flag" : "New Flag"} footer={<div className="flex gap-3 justify-end"><button onClick={() => setFlagModal({ open: false, editing: null })} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button><button onClick={handleSaveFlag} disabled={saving} className="px-4 py-2.5 rounded-xl bg-[#229C62] hover:bg-[#0F203A] text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>}>
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
