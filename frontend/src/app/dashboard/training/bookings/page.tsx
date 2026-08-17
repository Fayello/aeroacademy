"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ArrowLeft, Loader2, X } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import type { TrainingBooking } from "@/types/api";
import PageHeader from "@/components/ui/PageHeader";
import toast from "@/lib/toast";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<TrainingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchApi("/training/bookings")
      .then((data) => {
        if (!cancelled) setBookings(Array.isArray(data) ? data : data.data || []);
      })
      .catch(() => { if (!cancelled) toast.error("Failed to load bookings"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await fetchApi(`/training/bookings/${id}`, { method: "DELETE" });
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to cancel"));
    } finally {
      setCancelling(null);
    }
  };

  const upcoming = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING");
  const past = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED");

  return (
    <div className="space-y-6">
      <Link href="/dashboard/training" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to Training
      </Link>
      <PageHeader title="My Bookings" description="Manage your upcoming and past training sessions." />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={24} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-3">No bookings yet.</p>
          <Link href="/dashboard/training" className="btn-primary text-sm">Browse Trainers</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Upcoming</h3>
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{b.topic}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        with {b.trainer?.user?.name || "Trainer"} | {new Date(b.date).toLocaleDateString()} | {b.startTime} - {b.endTime}
                      </div>
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                        b.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>{b.status}</span>
                    </div>
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancelling === b.id}
                      className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      {cancelling === b.id ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Past</h3>
              <div className="space-y-3">
                {past.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5 opacity-70">
                    <div className="font-medium text-slate-900">{b.topic}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      with {b.trainer?.user?.name || "Trainer"} | {new Date(b.date).toLocaleDateString()} | {b.startTime} - {b.endTime}
                    </div>
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                      b.status === "COMPLETED" ? "bg-slate-100 text-slate-600" : "bg-red-50 text-red-600"
                    }`}>{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
