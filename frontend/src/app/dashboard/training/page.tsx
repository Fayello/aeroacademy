"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ArrowRight, BookOpen, Award } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import PageHeader from "@/components/ui/PageHeader";
import type { Trainer } from "@/types/api";

export default function TrainingPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchApi("/training/trainers")
      .then((data) => {
        if (!cancelled) setTrainers(Array.isArray(data) ? data : data.data || []);
      })
      .catch(() => { if (!cancelled) toast.error("Failed to load trainers"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Training"
        description="Book private coaching sessions with expert trainers and move from practice into guided improvement"
        action={
          <Link href="/dashboard/training/bookings" className="bg-slate-900 text-white hover:bg-slate-800 font-medium py-2.5 px-5 rounded-lg transition-all duration-150 text-sm inline-flex items-center justify-center gap-2">
            <BookOpen size={16} /> My Bookings
          </Link>
        }
      />

      <div className="angular-card grid gap-4 border border-white/10 bg-[#0F203A] p-5 text-white lg:grid-cols-3">
        {[
          {
            title: "Who this is for",
            text: "Learners who need targeted help on a lab, course module, or assessment weak point.",
          },
          {
            title: "What you gain",
            text: "Direct coaching, clearer remediation, and a faster path from stuck to confident.",
          },
          {
            title: "Best next step",
            text: "Choose a trainer whose specialty matches the area you want to improve this week.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.title}</p>
            <p className="mt-2 text-sm text-slate-200">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Trainers Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((id) => (
            <div key={id} className="bg-[#0f172a] rounded-xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-full bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : trainers.length === 0 ? (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No trainers available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            1-on-1 training sessions are being set up. Check back soon for expert-led coaching.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer: Trainer) => (
            <Link
              key={trainer.id}
              href={`/dashboard/training/${trainer.id}`}
              className="group relative overflow-hidden bg-[#0f172a] rounded-xl border border-white/10 hover:border-white/10 hover:shadow-md transition-all duration-300"
            >
              {/* Avatar Section */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                    {(trainer.user?.name || "T").charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-slate-200 transition-colors text-lg">{trainer.user?.name}</h3>
                    <div className="text-sm text-slate-300">{trainer.specialties?.join(", ") || "General coaching"}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2 mb-4">{trainer.bio || "Expert trainer ready to help you unblock practical and theory gaps."}</p>
              </div>

              {/* Stats */}
              <div className="px-6 py-4 bg-white/5 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <BookOpen size={14} className="text-amber-500" />
                      {trainer._count?.bookings || 0} sessions
                    </span>
                    {trainer.hourlyRate && (
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Award size={14} className="text-amber-500" />
                        {trainer.hourlyRate.toLocaleString()} XAF/hr
                      </span>
                    )}
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
