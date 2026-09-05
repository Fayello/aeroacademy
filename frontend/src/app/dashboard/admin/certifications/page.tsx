"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Award,
  Loader2,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface CertStats {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  xpRequired: number;
  totalAwards: number;
  activeAwards: number;
  expiredAwards: number;
}

export default function AdminCertificationsPage() {
  const [certs, setCerts] = useState<CertStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApi("/certifications/admin/stats");
        if (!cancelled) setCerts(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleToggleActive = async (cert: CertStats) => {
    setSaving(cert.id);
    try {
      await fetchApi(`/certifications/admin/${cert.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !cert.isActive }),
      });
      setCerts((prev) =>
        prev.map((c) => (c.id === cert.id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-20">
      <div className="angular-card bg-[#0f172a] border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Award size={24} className="text-[#7AD62A]" />
          <h1 className="text-2xl font-bold text-white">Certification Management</h1>
        </div>
        <p className="text-sm text-slate-400">
          Manage certification definitions, view award statistics, and toggle active status.
        </p>
      </div>

      {error && (
        <div className="angular-card border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Total Certifications", value: certs.length, icon: Shield },
          { label: "Total Awards", value: certs.reduce((s, c) => s + c.totalAwards, 0), icon: Users },
          { label: "Active Certifications", value: certs.filter((c) => c.isActive).length, icon: CheckCircle2 },
        ].map((stat) => (
          <div key={stat.label} className="angular-card bg-[#0f172a] border border-white/10 p-5">
            <stat.icon size={18} className="text-[#7AD62A] mb-2" />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="angular-card bg-[#0f172a] border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Certification Definitions</h2>
        </div>
        <div className="divide-y divide-white/5">
          {certs.map((cert) => (
            <div key={cert.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  cert.code === "XCA" ? "bg-blue-500/10" :
                  cert.code === "XCP" ? "bg-[#7AD62A]/10" :
                  "bg-amber-500/10"
                }`}>
                  <Shield size={24} className={
                    cert.code === "XCA" ? "text-blue-400" :
                    cert.code === "XCP" ? "text-[#7AD62A]" :
                    "text-amber-400"
                  } />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {cert.code}
                  </div>
                  <div className="text-sm font-semibold text-white">{cert.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {cert.xpRequired.toLocaleString()} XP required
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-white">{cert.totalAwards}</div>
                  <div className="text-[10px] text-slate-500">Total awards</div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-[#7AD62A]">{cert.activeAwards}</div>
                  <div className="text-[10px] text-slate-500">Active</div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-amber-400">{cert.expiredAwards}</div>
                  <div className="text-[10px] text-slate-500">Expired</div>
                </div>

                <button
                  onClick={() => handleToggleActive(cert)}
                  disabled={saving === cert.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    cert.isActive
                      ? "bg-[#7AD62A]/10 text-[#7AD62A] hover:bg-[#7AD62A]/20 border border-[#7AD62A]/20"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {saving === cert.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : cert.isActive ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <XCircle size={12} />
                  )}
                  {cert.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
