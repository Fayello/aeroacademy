"use client";

import { useState, useEffect } from "react";
import { Video, Plus, Trash2, Loader2, Calendar, Clock, Users, UserCheck } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";

const CATEGORIES = ["SECURITY", "LINUX", "DEVOPS", "CLOUD"];

export default function AdminMasterClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", instructorName: "", category: "SECURITY", scheduledAt: "", duration: 60, maxParticipants: 50 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApi("/master-classes")
      .then((data: any) => setClasses(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const mc = await fetchApi("/master-classes", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setClasses((prev) => [mc, ...prev]);
      setShowCreate(false);
      setForm({ title: "", description: "", instructorName: "", category: "SECURITY", scheduledAt: "", duration: 60, maxParticipants: 50 });
      toast.success("Master class created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this master class?")) return;
    try {
      await fetchApi(`/master-classes/${id}`, { method: "DELETE" });
      setClasses((prev) => prev.filter((c) => c.id !== id));
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Video size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manage Master Classes</h1>
              <p className="text-violet-100 text-sm">Create and manage live sessions</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="bg-white text-violet-600 hover:bg-violet-50 font-medium py-2.5 px-5 rounded-lg transition-all duration-150 text-sm inline-flex items-center justify-center gap-2">
            <Plus size={16} /> New Master Class
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Plus size={18} className="text-violet-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Create New Master Class</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Master class title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Instructor</label>
              <input type="text" value={form.instructorName} onChange={(e) => setForm({ ...form, instructorName: e.target.value })} className="input-field" placeholder="Instructor name" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="Master class description" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date & Time</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (min)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Participants</label>
              <input type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) || 50 })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Video size={14} />}
              Create Master Class
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Master Classes List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Video size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No master classes yet</h3>
          <p className="text-sm text-slate-500 mb-6">Create your first master class to get started.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            <Plus size={14} /> Create Master Class
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {classes.map((mc) => (
            <div key={mc.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Video size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{mc.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${mc.status === "UPCOMING" ? "bg-emerald-50 text-emerald-700" : mc.status === "COMPLETED" ? "bg-slate-100 text-slate-600" : "bg-red-50 text-red-600"}`}>
                        {mc.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {mc.category}</span>
                      {mc.instructorName && <span className="flex items-center gap-1"><UserCheck size={14} /> {mc.instructorName}</span>}
                      <span className="flex items-center gap-1"><Clock size={14} /> {mc.duration}min</span>
                      <span className="flex items-center gap-1"><Users size={14} /> {mc.maxParticipants} max</span>
                    </div>
                    {mc.scheduledAt && (
                      <div className="text-xs text-slate-400 mt-2">
                        <Calendar size={12} className="inline mr-1" />
                        {new Date(mc.scheduledAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(mc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
