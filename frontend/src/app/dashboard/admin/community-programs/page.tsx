"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  HandHeart,
  Loader2,
  Megaphone,
  Users,
} from "lucide-react";
import type { CommunityProgramApplication, CommunityProgramApplicationResponse } from "@/types/api";

type ProgramStatus = "NEW" | "REVIEWING" | "INTERVIEW" | "ACCEPTED" | "CLOSED";
type ProgramType = "AMBASSADOR" | "VOLUNTEER";

const STATUS_OPTIONS: ProgramStatus[] = ["NEW", "REVIEWING", "INTERVIEW", "ACCEPTED", "CLOSED"];
const TYPE_OPTIONS: Array<ProgramType | "ALL"> = ["ALL", "AMBASSADOR", "VOLUNTEER"];

export default function CommunityProgramsAdminPage() {
  const [data, setData] = useState<CommunityProgramApplicationResponse>({ items: [], totals: {} });
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ProgramType | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const query = new URLSearchParams();
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (typeFilter !== "ALL") query.set("type", typeFilter);
      const suffix = query.toString() ? `?${query.toString()}` : "";

      try {
        const result = await fetchApi<CommunityProgramApplicationResponse>(`/admin/community-programs${suffix}`);
        if (cancelled) return;
        setData(result);
        setNoteDrafts((current) => {
          const next = { ...current };
          for (const item of result.items) {
            if (next[item.id] === undefined) next[item.id] = item.notes || "";
          }
          return next;
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, typeFilter]);

  async function saveApplication(item: CommunityProgramApplication, nextStatus: ProgramStatus) {
    setUpdatingId(item.id);
    try {
      const updated = await fetchApi<CommunityProgramApplication>(`/admin/community-programs/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          notes: noteDrafts[item.id] || "",
        }),
      });
      setData((current) => ({
        ...current,
        items: current.items.map((entry) => (entry.id === item.id ? updated : entry)),
      }));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-[#7AD62A] transition-colors hover:text-[#6bc422]">
        <ArrowLeft size={14} />
        Back to admin
      </Link>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#18344f] p-6">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Community Programs</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Ambassador and volunteer applications</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Review community interest, decide who should move into interviews, and keep track of the people representing or supporting XpertClass.
            </p>
          </div>
          <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">Working rule</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Prioritize people with clear contribution intent, credible local reach, and the reliability to support learners consistently.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {["NEW", "REVIEWING", "INTERVIEW", "ACCEPTED"].map((label) => (
          <div key={label} className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
            <div className="text-2xl font-bold text-white">{data.totals[label] || 0}</div>
            <div className="mt-1 text-sm text-slate-300">{label.replace("_", " ")}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0f172a] p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setLoading(true); setStatusFilter("ALL"); }} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === "ALL" ? "border-[#7AD62A] bg-[#7AD62A]/10 text-[#7AD62A]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>All statuses</button>
          {STATUS_OPTIONS.map((status) => (
            <button key={status} type="button" onClick={() => { setLoading(true); setStatusFilter(status); }} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === status ? "border-[#7AD62A] bg-[#7AD62A]/10 text-[#7AD62A]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {TYPE_OPTIONS.map((type) => (
            <button key={type} type="button" onClick={() => { setLoading(true); setTypeFilter(type); }} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${typeFilter === type ? "border-[#7AD62A] bg-[#7AD62A]/10 text-[#7AD62A]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>
              {type === "ALL" ? "All programs" : type === "AMBASSADOR" ? "Ambassadors" : "Volunteers"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-[#7AD62A]" />
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${item.programType === "AMBASSADOR" ? "border-blue-200 bg-blue-500/10 text-blue-300" : "border-amber-200 bg-amber-500/10 text-amber-300"}`}>
                      {item.programType === "AMBASSADOR" ? <Megaphone size={12} /> : <HandHeart size={12} />}
                      {item.programType === "AMBASSADOR" ? "Ambassador" : "Volunteer"}
                    </span>
                    <span className="rounded-full border border-[#7AD62A]/20 bg-[#7AD62A]/10 px-3 py-1 text-xs font-medium text-[#7AD62A]">
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{item.name}</h2>
                    <p className="mt-1 text-sm text-slate-300">
                      {item.role || "No role provided"}
                      {item.organization ? ` · ${item.organization}` : ""}
                      {item.city ? ` · ${item.city}` : ""}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Contribution</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.contribution}</p>
                  </div>
                  {item.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.interests.map((interest) => (
                        <span key={interest} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-200">
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full space-y-3 lg:max-w-sm">
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</span>
                    <select
                      value={item.status}
                      onChange={(event) => void saveApplication(item, event.target.value as ProgramStatus)}
                      disabled={updatingId === item.id}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-[#7AD62A]/40 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status} className="bg-[#0f172a]">
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Notes</span>
                    <textarea
                      value={noteDrafts[item.id] || ""}
                      onChange={(event) => setNoteDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                      className="min-h-28 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-[#7AD62A]/40 focus:outline-none"
                      placeholder="Capture reach, credibility, and next steps."
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void saveApplication(item, item.status)}
                    disabled={updatingId === item.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7AD62A] px-4 py-3 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422] disabled:opacity-70"
                  >
                    {updatingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Save review
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && data.items.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-10 text-center text-sm text-slate-300">
              No community applications match these filters yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
