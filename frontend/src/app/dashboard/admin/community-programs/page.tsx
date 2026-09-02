"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  HandHeart,
  Loader2,
  Megaphone,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { CommunityProgramApplication, CommunityProgramApplicationResponse } from "@/types/api";
import type { CommunityProgramMember, CommunityProgramMemberResponse } from "@/types/api";

type ProgramStatus = "NEW" | "REVIEWING" | "INTERVIEW" | "ACCEPTED" | "CLOSED";
type ProgramType = "AMBASSADOR" | "VOLUNTEER";
type MemberStatus = "ONBOARDING" | "ACTIVE" | "PAUSED" | "ALUMNI";

const STATUS_OPTIONS: ProgramStatus[] = ["NEW", "REVIEWING", "INTERVIEW", "ACCEPTED", "CLOSED"];
const TYPE_OPTIONS: Array<ProgramType | "ALL"> = ["ALL", "AMBASSADOR", "VOLUNTEER"];
const MEMBER_STATUS_OPTIONS: MemberStatus[] = ["ONBOARDING", "ACTIVE", "PAUSED", "ALUMNI"];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getNextStatus(status: ProgramStatus): ProgramStatus | null {
  if (status === "NEW") return "REVIEWING";
  if (status === "REVIEWING") return "INTERVIEW";
  if (status === "INTERVIEW") return "ACCEPTED";
  return null;
}

export default function CommunityProgramsAdminPage() {
  const [data, setData] = useState<CommunityProgramApplicationResponse>({ items: [], totals: {} });
  const [members, setMembers] = useState<CommunityProgramMemberResponse>({ items: [], totals: {} });
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ProgramType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [memberStageDrafts, setMemberStageDrafts] = useState<Record<string, string>>({});
  const [memberNoteDrafts, setMemberNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const query = new URLSearchParams();
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (typeFilter !== "ALL") query.set("type", typeFilter);
      const suffix = query.toString() ? `?${query.toString()}` : "";

      try {
        const [result, memberResult] = await Promise.all([
          fetchApi<CommunityProgramApplicationResponse>(`/admin/community-programs${suffix}`),
          fetchApi<CommunityProgramMemberResponse>(`/admin/community-program-members${typeFilter !== "ALL" ? `?type=${typeFilter}` : ""}`),
        ]);
        if (cancelled) return;
        setData(result);
        setMembers(memberResult);
        setNoteDrafts((current) => {
          const next = { ...current };
          for (const item of result.items) {
            if (next[item.id] === undefined) next[item.id] = item.notes || "";
          }
          return next;
        });
        setMemberStageDrafts((current) => {
          const next = { ...current };
          for (const item of memberResult.items) {
            if (next[item.id] === undefined) next[item.id] = item.onboardingStage || "WELCOME";
          }
          return next;
        });
        setMemberNoteDrafts((current) => {
          const next = { ...current };
          for (const item of memberResult.items) {
            if (next[item.id] === undefined) next[item.id] = item.onboardingNotes || "";
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
      if (updated.status === "ACCEPTED") {
        const memberResult = await fetchApi<CommunityProgramMemberResponse>(`/admin/community-program-members${typeFilter !== "ALL" ? `?type=${typeFilter}` : ""}`);
        setMembers(memberResult);
        setMemberStageDrafts((current) => {
          const next = { ...current };
          for (const member of memberResult.items) {
            if (next[member.id] === undefined) next[member.id] = member.onboardingStage || "WELCOME";
          }
          return next;
        });
        setMemberNoteDrafts((current) => {
          const next = { ...current };
          for (const member of memberResult.items) {
            if (next[member.id] === undefined) next[member.id] = member.onboardingNotes || "";
          }
          return next;
        });
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveMember(item: CommunityProgramMember, nextStatus: MemberStatus) {
    setUpdatingMemberId(item.id);
    try {
      const updated = await fetchApi<CommunityProgramMember>(`/admin/community-program-members/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          onboardingStage: memberStageDrafts[item.id] || "WELCOME",
          onboardingNotes: memberNoteDrafts[item.id] || "",
        }),
      });
      setMembers((current) => ({
        ...current,
        items: current.items.map((entry) => (entry.id === item.id ? updated : entry)),
      }));
    } finally {
      setUpdatingMemberId(null);
    }
  }

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data.items;

    return data.items.filter((item) =>
      [
        item.name,
        item.email,
        item.city,
        item.organization,
        item.role,
        item.experience,
        item.sourcePage,
        item.interests.join(" "),
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [data.items, searchQuery]);

  const ambassadorCount = filteredItems.filter((item) => item.programType === "AMBASSADOR").length;
  const volunteerCount = filteredItems.filter((item) => item.programType === "VOLUNTEER").length;
  const unassignedCount = filteredItems.filter((item) => !item.assignedTo).length;
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.items.filter((item) => {
      if (typeFilter !== "ALL" && item.programType !== typeFilter) return false;
      if (!query) return true;
      return [
        item.name,
        item.email,
        item.city,
        item.organization,
        item.role,
        item.onboardingStage,
        item.owner?.name,
        item.owner?.email,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [members.items, searchQuery, typeFilter]);
  const onboardingCount = filteredMembers.filter((item) => item.status === "ONBOARDING").length;
  const activeMemberCount = filteredMembers.filter((item) => item.status === "ACTIVE").length;

  function getNextMemberStatus(status: MemberStatus): MemberStatus | null {
    if (status === "ONBOARDING") return "ACTIVE";
    if (status === "ACTIVE") return "PAUSED";
    if (status === "PAUSED") return "ALUMNI";
    return null;
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2 text-slate-300">
            <Megaphone size={15} className="text-blue-300" />
            <span className="text-sm font-medium">Ambassador queue</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{ambassadorCount}</div>
          <p className="mt-1 text-sm text-slate-400">Applicants currently in this filtered view.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2 text-slate-300">
            <HandHeart size={15} className="text-amber-300" />
            <span className="text-sm font-medium">Volunteer queue</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{volunteerCount}</div>
          <p className="mt-1 text-sm text-slate-400">Applicants currently in this filtered view.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck size={15} className="text-[#7AD62A]" />
            <span className="text-sm font-medium">Needs owner</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{unassignedCount}</div>
          <p className="mt-1 text-sm text-slate-400">Applications with no assigned reviewer yet.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck size={15} className="text-[#7AD62A]" />
            <span className="text-sm font-medium">Members onboarding</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{onboardingCount}</div>
          <p className="mt-1 text-sm text-slate-400">Accepted people still moving through setup.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2 text-slate-300">
            <Users size={15} className="text-blue-300" />
            <span className="text-sm font-medium">Active members</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{activeMemberCount}</div>
          <p className="mt-1 text-sm text-slate-400">Members already active in the program.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock3 size={15} className="text-amber-300" />
            <span className="text-sm font-medium">Total member records</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{filteredMembers.length}</div>
          <p className="mt-1 text-sm text-slate-400">Accepted applicants now tracked beyond review.</p>
        </div>
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
        <label className="relative block w-full sm:ml-auto sm:max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, city..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-[#7AD62A]/40 focus:outline-none"
          />
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-[#7AD62A]" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Post-acceptance</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Program members and onboarding</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Every accepted application now creates a member record so onboarding can be tracked separately from intake review.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {filteredMembers.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
                  No accepted members match the current filter yet.
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const nextMemberStatus = getNextMemberStatus(member.status);

                  return (
                    <div key={member.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${member.programType === "AMBASSADOR" ? "border-blue-200 bg-blue-500/10 text-blue-300" : "border-amber-200 bg-amber-500/10 text-amber-300"}`}>
                              {member.programType === "AMBASSADOR" ? <Megaphone size={12} /> : <HandHeart size={12} />}
                              {member.programType === "AMBASSADOR" ? "Ambassador" : "Volunteer"}
                            </span>
                            <span className="rounded-full border border-[#7AD62A]/20 bg-[#7AD62A]/10 px-3 py-1 text-xs font-medium text-[#7AD62A]">
                              {member.status.replace("_", " ")}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300">
                              Stage: {member.onboardingStage}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                            <p className="mt-1 text-sm text-slate-300">
                              {member.email}
                              {member.role ? ` · ${member.role}` : ""}
                              {member.organization ? ` · ${member.organization}` : ""}
                            </p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-white/10 bg-[#0f172a] p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Joined</p>
                              <p className="mt-2 text-sm text-slate-200">{formatDate(member.joinedAt)}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-[#0f172a] p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Owner</p>
                              <p className="mt-2 text-sm text-slate-200">{member.owner?.name || member.owner?.email || "Unassigned"}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-[#0f172a] p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Application</p>
                              <p className="mt-2 text-sm text-slate-200">{member.application?.status || "Accepted"}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-[#0f172a] p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Activated</p>
                              <p className="mt-2 text-sm text-slate-200">{member.activatedAt ? formatDate(member.activatedAt) : "Not active yet"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full space-y-3 lg:max-w-sm">
                          <div className="rounded-xl border border-[#7AD62A]/15 bg-[#7AD62A]/10 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7AD62A]">Onboarding action</p>
                            <p className="mt-2 text-sm text-slate-200">
                              {nextMemberStatus
                                ? `Recommended next move: advance this member to ${nextMemberStatus.replace("_", " ")} when the current stage is complete.`
                                : "This member is already at the last tracked lifecycle state."}
                            </p>
                            {nextMemberStatus && (
                              <button
                                type="button"
                                onClick={() => void saveMember(member, nextMemberStatus)}
                                disabled={updatingMemberId === member.id}
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7AD62A] px-4 py-2.5 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422] disabled:opacity-70"
                              >
                                {updatingMemberId === member.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Advance to {nextMemberStatus.replace("_", " ")}
                              </button>
                            )}
                          </div>
                          <label className="block space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Member status</span>
                            <select
                              value={member.status}
                              onChange={(event) => void saveMember(member, event.target.value as MemberStatus)}
                              disabled={updatingMemberId === member.id}
                              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-[#7AD62A]/40 focus:outline-none"
                            >
                              {MEMBER_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status} className="bg-[#0f172a]">
                                  {status.replace("_", " ")}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Onboarding stage</span>
                            <input
                              type="text"
                              value={memberStageDrafts[member.id] || member.onboardingStage}
                              onChange={(event) => setMemberStageDrafts((current) => ({ ...current, [member.id]: event.target.value }))}
                              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#7AD62A]/40 focus:outline-none"
                              placeholder="WELCOME, INTRO CALL, FIRST TASK..."
                            />
                          </label>
                          <label className="block space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Onboarding notes</span>
                            <textarea
                              value={memberNoteDrafts[member.id] || ""}
                              onChange={(event) => setMemberNoteDrafts((current) => ({ ...current, [member.id]: event.target.value }))}
                              className="min-h-28 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-[#7AD62A]/40 focus:outline-none"
                              placeholder="Welcome sent, intro call scheduled, first activation task assigned..."
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => void saveMember(member, member.status)}
                            disabled={updatingMemberId === member.id}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8 disabled:opacity-70"
                          >
                            {updatingMemberId === member.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            Save onboarding update
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {filteredItems.map((item) => {
            const nextStatus = getNextStatus(item.status);

            return (
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
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Contact</p>
                      <a href={`mailto:${item.email}`} className="mt-2 inline-flex items-center gap-1 text-sm text-slate-200 transition-colors hover:text-white">
                        {item.email}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Submitted</p>
                      <p className="mt-2 text-sm text-slate-200">{formatDate(item.createdAt)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Reviewer</p>
                      <p className="mt-2 text-sm text-slate-200">{item.assignedTo?.name || item.assignedTo?.email || "Unassigned"}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Source</p>
                      <p className="mt-2 truncate text-sm text-slate-200">{item.sourcePage || "Not captured"}</p>
                    </div>
                  </div>
                  {(item.experience || item.availability || item.linkedinUrl || item.portfolioUrl) && (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {item.experience && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Background</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-200">{item.experience}</p>
                        </div>
                      )}
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Availability and links</p>
                        <div className="mt-2 space-y-2 text-sm text-slate-200">
                          <p>{item.availability || "Availability not provided"}</p>
                          {item.linkedinUrl && (
                            <a href={item.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-300 transition-colors hover:text-blue-200">
                              LinkedIn
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {item.portfolioUrl && (
                            <a href={item.portfolioUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex items-center gap-1 text-blue-300 transition-colors hover:text-blue-200">
                              Portfolio
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                  <div className="rounded-xl border border-[#7AD62A]/15 bg-[#7AD62A]/10 p-4">
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} className="text-[#7AD62A]" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7AD62A]">Decision helper</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">
                      {nextStatus
                        ? `Recommended next step: move this applicant to ${nextStatus.replace("_", " ")} once notes are ready.`
                        : item.status === "ACCEPTED"
                          ? "This applicant is accepted. Keep notes current and use this record as the team handoff."
                          : "This application is closed. Reopen by switching the status if the conversation resumes."}
                    </p>
                    {nextStatus && (
                      <button
                        type="button"
                        onClick={() => void saveApplication(item, nextStatus)}
                        disabled={updatingId === item.id}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#7AD62A]/20 bg-[#7AD62A] px-4 py-2.5 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422] disabled:opacity-70"
                      >
                        {updatingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Advance to {nextStatus.replace("_", " ")}
                      </button>
                    )}
                  </div>
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
          );
          })}

          {!loading && filteredItems.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-10 text-center text-sm text-slate-300">
              No community applications match the current filters or search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
