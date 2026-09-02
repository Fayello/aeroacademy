"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { ArrowLeft, BriefcaseBusiness, Building2, CheckCircle2, Clock3, ExternalLink, Inbox, Loader2, Mail, Phone } from "lucide-react";

type InquiryStatus = "NEW" | "REVIEWING" | "CONTACTED" | "QUALIFIED" | "CLOSED";
type InquiryType = "UNIVERSITY" | "ENTERPRISE";

interface InquiryItem {
  id: string;
  inquiryType: InquiryType;
  status: InquiryStatus;
  name: string;
  email: string;
  organization: string;
  role: string | null;
  teamSize: string | null;
  phone: string | null;
  message: string;
  sourcePage: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; name: string | null; email: string } | null;
}

interface InquiryResponse {
  items: InquiryItem[];
  totals: Record<string, number>;
}

const STATUS_OPTIONS: InquiryStatus[] = ["NEW", "REVIEWING", "CONTACTED", "QUALIFIED", "CLOSED"];
const TYPE_OPTIONS: Array<InquiryType | "ALL"> = ["ALL", "UNIVERSITY", "ENTERPRISE"];

export default function AdminInquiriesPage() {
  const [data, setData] = useState<InquiryResponse>({ items: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<InquiryType | "ALL">("ALL");
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
        const result = await fetchApi<InquiryResponse>(`/admin/inquiries${suffix}`);
        if (cancelled) return;

        setData(result);
        setNoteDrafts((current) => {
          const next = { ...current };
          for (const item of result.items) {
            if (next[item.id] === undefined) {
              next[item.id] = item.notes || "";
            }
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

  async function saveInquiry(item: InquiryItem, nextStatus: InquiryStatus) {
    setUpdatingId(item.id);
    try {
      const updated = await fetchApi<InquiryItem>(`/admin/inquiries/${item.id}`, {
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
      setNoteDrafts((current) => ({
        ...current,
        [item.id]: updated.notes || "",
      }));
    } finally {
      setUpdatingId(null);
    }
  }

  const statCards = [
    { label: "New", value: data.totals.NEW || 0 },
    { label: "Reviewing", value: data.totals.REVIEWING || 0 },
    { label: "Contacted", value: data.totals.CONTACTED || 0 },
    { label: "Qualified", value: data.totals.QUALIFIED || 0 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-[#7AD62A] transition-colors hover:text-[#6bc422]">
        <ArrowLeft size={14} />
        Back to admin
      </Link>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#18344f] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Institutional pipeline</p>
            <h1 className="mt-2 text-3xl font-bold text-white">University and enterprise inquiries</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Review new interest, capture context, and keep outreach moving from one place instead of losing leads in inbox threads.
            </p>
          </div>
          <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
            <div className="flex items-center gap-2">
              <Inbox size={16} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">Working rule</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Mark new inquiries quickly, add notes before outreach, and keep status changes visible for the rest of the admin team.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="mt-1 text-sm text-slate-300">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0f172a] p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setStatusFilter("ALL");
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === "ALL" ? "border-[#7AD62A] bg-[#7AD62A]/10 text-[#7AD62A]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
          >
            All statuses
          </button>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setLoading(true);
                setStatusFilter(status);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === status ? "border-[#7AD62A] bg-[#7AD62A]/10 text-[#7AD62A]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setLoading(true);
                setTypeFilter(type);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${typeFilter === type ? "border-[#7AD62A] bg-[#7AD62A]/10 text-[#7AD62A]" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
            >
              {type === "ALL" ? "All types" : type === "UNIVERSITY" ? "Universities" : "Employers"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-[#7AD62A]" />
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-10 text-center">
          <Inbox size={28} className="mx-auto text-[#7AD62A]" />
          <h2 className="mt-4 text-lg font-semibold text-white">No inquiries match these filters</h2>
          <p className="mt-2 text-sm text-slate-300">New university and enterprise form submissions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${item.inquiryType === "UNIVERSITY" ? "border-blue-200 bg-blue-500/10 text-blue-300" : "border-amber-200 bg-amber-500/10 text-amber-300"}`}>
                      {item.inquiryType === "UNIVERSITY" ? <Building2 size={12} /> : <BriefcaseBusiness size={12} />}
                      {item.inquiryType === "UNIVERSITY" ? "University" : "Enterprise"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-200">
                      <Clock3 size={12} />
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                    <span className="rounded-full border border-[#7AD62A]/20 bg-[#7AD62A]/10 px-3 py-1 text-xs font-medium text-[#7AD62A]">
                      {item.status.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">{item.organization}</h2>
                    <p className="mt-1 text-sm text-slate-300">
                      {item.name}
                      {item.role ? ` · ${item.role}` : ""}
                      {item.teamSize ? ` · ${item.teamSize}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                    <a href={`mailto:${item.email}`} className="inline-flex items-center gap-2 hover:text-white">
                      <Mail size={14} className="text-[#7AD62A]" />
                      {item.email}
                    </a>
                    {item.phone && (
                      <span className="inline-flex items-center gap-2">
                        <Phone size={14} className="text-[#7AD62A]" />
                        {item.phone}
                      </span>
                    )}
                    {item.sourcePage && (
                      <span className="inline-flex items-center gap-2">
                        <ExternalLink size={14} className="text-[#7AD62A]" />
                        {item.sourcePage}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Inquiry</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.message}</p>
                  </div>
                </div>

                <div className="w-full space-y-3 lg:max-w-sm">
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</span>
                    <select
                      value={item.status}
                      onChange={(event) => void saveInquiry(item, event.target.value as InquiryStatus)}
                      disabled={updatingId === item.id}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-[#7AD62A]/40 focus:outline-none disabled:opacity-70"
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
                      placeholder="Capture outreach context, requirements, or next steps."
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void saveInquiry(item, item.status)}
                    disabled={updatingId === item.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7AD62A] px-4 py-3 text-sm font-semibold text-[#0F203A] transition-colors hover:bg-[#6bc422] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updatingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Save notes
                  </button>

                  {item.assignedTo && (
                    <p className="text-xs text-slate-400">
                      Last updated by {item.assignedTo.name || item.assignedTo.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
