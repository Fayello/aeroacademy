"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Loader2,
  Plus,
  Trash2,
  Save,
  BookOpen,
  X,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import toast from "@/lib/toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TrainerProfile {
  id: string;
  userId: string;
  bio: string | null;
  specialties: string[] | null;
  hourlyRate: number | null;
  isActive: boolean;
  user: { id: string; name: string | null; email: string; avatarUrl?: string | null };
  slots: { id: string; dayOfWeek: number; startTime: string; endTime: string; isActive?: boolean }[];
  _count?: { bookings: number };
}

interface TrainerBooking {
  id: string;
  trainerId: string;
  studentId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  student?: { id: string; name: string | null; email: string; avatarUrl?: string | null };
}

export default function MySessionsPage() {
  const [profile, setProfile] = useState<TrainerProfile | null>(null);
  const [bookings, setBookings] = useState<TrainerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "slots" | "profile">("bookings");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchApi<TrainerProfile>("/training/me"),
      fetchApi<TrainerBooking[]>("/training/me/bookings"),
    ])
      .then(([p, b]) => {
        if (cancelled) return;
        setProfile(p);
        setBookings(Array.isArray(b) ? b : []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load trainer data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const upcoming = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PENDING"
  );
  const past = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#7AD62A]" size={24} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/training"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200"
        >
          <ArrowLeft size={16} /> Back to Training
        </Link>
        <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            Trainer profile not found
          </h3>
          <p className="text-xs text-slate-400">
            You don&apos;t have a trainer profile yet. Contact an admin to set one
            up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/training"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200"
      >
        <ArrowLeft size={16} /> Back to Training
      </Link>

      <PageHeader
        title="Trainer Dashboard"
        description={`Manage your sessions, availability, and profile`}
      />

      {/* Profile summary */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-[#7AD62A] font-bold text-lg shrink-0">
            {profile.user?.name
              ?.split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold">{profile.user?.name}</h2>
            <p className="text-xs text-slate-400">{profile.user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.specialties?.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full bg-[#7AD62A]/10 text-[#7AD62A] text-[10px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white font-semibold">
              {profile.hourlyRate?.toLocaleString()} XAF
            </p>
            <p className="text-[10px] text-slate-500">per session</p>
            <p className="text-xs text-slate-400 mt-1">
              {profile._count?.bookings || 0} total bookings
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {(
          [
            { id: "bookings", label: "Bookings", count: upcoming.length },
            { id: "slots", label: "Availability", count: profile.slots.length },
            { id: "profile", label: "Profile" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-[#7AD62A] text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "bookings" && (
        <BookingsTab upcoming={upcoming} past={past} />
      )}
      {activeTab === "slots" && (
        <SlotsTab
          slots={profile.slots}
          onSlotsUpdate={(slots) => setProfile((p) => (p ? { ...p, slots } : p))}
        />
      )}
      {activeTab === "profile" && (
        <ProfileTab
          profile={profile}
          onProfileUpdate={(p) => setProfile(p)}
        />
      )}
    </div>
  );
}

function BookingsTab({
  upcoming,
  past,
}: {
  upcoming: TrainerBooking[];
  past: TrainerBooking[];
}) {
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await fetchApi(`/training/bookings/${id}`, { method: "DELETE" });
      toast.success("Booking cancelled");
      window.location.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to cancel"));
    } finally {
      setCancelling(null);
    }
  };

  if (upcoming.length === 0 && past.length === 0) {
    return (
      <div className="bg-[#0f172a] rounded-xl border border-white/10 py-12 text-center">
        <Calendar size={28} className="text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-400">No bookings yet</p>
        <p className="text-xs text-slate-600 mt-1">
          Students will see your availability and book sessions with you
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Upcoming ({upcoming.length})
          </h3>
          <div className="space-y-2">
            {upcoming.map((b) => (
              <div
                key={b.id}
                className="bg-[#0f172a] rounded-xl border border-white/10 p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-[#7AD62A]/10 flex items-center justify-center shrink-0">
                  <User size={18} className="text-[#7AD62A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {b.student?.name || "Student"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{b.topic}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-white font-medium">
                    {new Date(b.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {b.startTime} - {b.endTime}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    b.status === "CONFIRMED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {b.status}
                </span>
                <button
                  onClick={() => handleCancel(b.id)}
                  disabled={cancelling === b.id}
                  className="p-1.5 rounded-lg hover:bg-red-900/20 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Cancel"
                >
                  {cancelling === b.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <X size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Past ({past.length})
          </h3>
          <div className="space-y-2">
            {past.map((b) => (
              <div
                key={b.id}
                className="bg-[#0f172a] rounded-xl border border-white/5 p-4 flex items-center gap-4 opacity-60"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <User size={18} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-300 truncate">
                    {b.student?.name || "Student"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{b.topic}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">
                    {new Date(b.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    b.status === "COMPLETED"
                      ? "bg-slate-700 text-slate-400"
                      : "bg-red-900/20 text-red-400"
                  }`}
                >
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SlotsTab({
  slots,
  onSlotsUpdate,
}: {
  slots: TrainerProfile["slots"];
  onSlotsUpdate: (s: TrainerProfile["slots"]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "12:00",
  });
  const [removing, setRemoving] = useState<string | null>(null);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await fetchApi("/training/me/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: [newSlot] }),
      });
      toast.success("Slot added");
      const updated = await fetchApi<TrainerProfile>("/training/me");
      onSlotsUpdate(updated.slots);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add slot"));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await fetchApi(`/training/me/slots/${id}`, { method: "DELETE" });
      toast.success("Slot removed");
      const updated = await fetchApi<TrainerProfile>("/training/me");
      onSlotsUpdate(updated.slots);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove slot"));
    } finally {
      setRemoving(null);
    }
  };

  const grouped = DAYS.map((day, i) => ({
    day,
    dayNum: i,
    slots: slots.filter((s) => s.dayOfWeek === i),
  })).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-4">
      {/* Existing slots */}
      {grouped.length > 0 ? (
        <div className="space-y-3">
          {grouped.map((g) => (
            <div
              key={g.dayNum}
              className="bg-[#0f172a] rounded-xl border border-white/10 p-4"
            >
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {g.day === 0
                  ? "Sunday"
                  : g.day === 1
                  ? "Monday"
                  : g.day === 2
                  ? "Tuesday"
                  : g.day === 3
                  ? "Wednesday"
                  : g.day === 4
                  ? "Thursday"
                  : g.day === 5
                  ? "Friday"
                  : "Saturday"}
              </h4>
              <div className="space-y-1.5">
                {g.slots.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-[#7AD62A]" />
                      <span className="text-sm text-white">
                        {s.startTime} - {s.endTime}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemove(s.id)}
                      disabled={removing === s.id}
                      className="p-1 rounded hover:bg-red-900/20 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {removing === s.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 py-12 text-center">
          <Clock size={28} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No availability set</p>
          <p className="text-xs text-slate-600 mt-1">
            Add time slots so students can book sessions with you
          </p>
        </div>
      )}

      {/* Add new slot */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Add Availability
        </h4>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Day</label>
            <select
              value={newSlot.dayOfWeek}
              onChange={(e) =>
                setNewSlot((s) => ({
                  ...s,
                  dayOfWeek: parseInt(e.target.value),
                }))
              }
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">
              Start
            </label>
            <input
              type="time"
              value={newSlot.startTime}
              onChange={(e) =>
                setNewSlot((s) => ({ ...s, startTime: e.target.value }))
              }
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">
              End
            </label>
            <input
              type="time"
              value={newSlot.endTime}
              onChange={(e) =>
                setNewSlot((s) => ({ ...s, endTime: e.target.value }))
              }
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7AD62A] text-[#0F203A] rounded-lg text-sm font-medium hover:bg-[#6bc424] transition-colors disabled:opacity-50"
          >
            {adding ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({
  profile,
  onProfileUpdate,
}: {
  profile: TrainerProfile;
  onProfileUpdate: (p: TrainerProfile) => void;
}) {
  const [bio, setBio] = useState(profile.bio || "");
  const [specialties, setSpecialties] = useState(
    profile.specialties?.join(", ") || ""
  );
  const [hourlyRate, setHourlyRate] = useState(
    profile.hourlyRate?.toString() || ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await fetchApi<TrainerProfile>("/training/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          specialties: specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          hourlyRate: hourlyRate ? parseInt(hourlyRate) : undefined,
        }),
      });
      onProfileUpdate(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-white/10 p-5 space-y-4">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/30"
          placeholder="Tell students about your experience..."
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">
          Specialties (comma-separated)
        </label>
        <input
          type="text"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/30"
          placeholder="e.g. Network Security, DevOps, Linux"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">
          Hourly Rate (XAF)
        </label>
        <input
          type="number"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/30"
          placeholder="5000"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#7AD62A] text-[#0F203A] rounded-lg text-sm font-medium hover:bg-[#6bc424] transition-colors disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        Save Changes
      </button>
    </div>
  );
}
