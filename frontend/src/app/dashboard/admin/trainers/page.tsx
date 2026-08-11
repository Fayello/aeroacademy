"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Loader2, BookOpen, Clock } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [userId, setUserId] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApi("/training/trainers")
      .then((data: any) => setTrainers(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!userId.trim()) return;
    setSaving(true);
    try {
      const trainer = await fetchApi("/training/trainers", {
        method: "POST",
        body: JSON.stringify({
          userId: userId.trim(),
          bio: bio.trim() || undefined,
          specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      setTrainers((prev) => [trainer, ...prev]);
      setShowAdd(false);
      setUserId("");
      setBio("");
      setSpecialties("");
      toast.success("Trainer added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add trainer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Calendar size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manage Trainers</h1>
              <p className="text-amber-100 text-sm">Add trainers and manage their availability</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="bg-white text-amber-600 hover:bg-amber-50 font-medium py-2.5 px-5 rounded-lg transition-all duration-150 text-sm inline-flex items-center justify-center gap-2">
            <Plus size={16} /> Add Trainer
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Plus size={18} className="text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Add New Trainer</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">User ID</label>
              <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} className="input-field" placeholder="User UUID" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialties (comma-separated)</label>
              <input type="text" value={specialties} onChange={(e) => setSpecialties(e.target.value)} className="input-field" placeholder="Security, Linux, DevOps" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input-field" rows={2} placeholder="Trainer bio" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Calendar size={14} />}
              Add Trainer
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Trainers List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : trainers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No trainers yet</h3>
          <p className="text-sm text-slate-500 mb-6">Add your first trainer to get started.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            <Plus size={14} /> Add Trainer
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {trainers.map((trainer) => (
            <div key={trainer.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                    {(trainer.user?.name || "T").charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{trainer.user?.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${trainer.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {trainer.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{trainer.specialties?.join(", ") || "General"}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><BookOpen size={12} /> {trainer._count?.bookings || 0} bookings</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {trainer.slots?.length || 0} slots</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
