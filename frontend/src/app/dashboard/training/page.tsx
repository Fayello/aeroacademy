"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ArrowRight, Loader2, BookOpen, Award } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function TrainingPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/training/trainers")
      .then((data: any) => setTrainers(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training</h1>
          <p className="text-sm text-slate-500 mt-1">Book private sessions with expert trainers</p>
        </div>
        <Link href="/dashboard/training/bookings" className="bg-slate-900 text-white hover:bg-slate-800 font-medium py-2.5 px-5 rounded-lg transition-all duration-150 text-sm inline-flex items-center justify-center gap-2">
          <BookOpen size={16} /> My Bookings
        </Link>
      </div>

      {/* Trainers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : trainers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No trainers available</h3>
          <p className="text-sm text-slate-500">Check back later for trainer availability.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer: any) => (
            <Link
              key={trainer.id}
              href={`/dashboard/training/${trainer.id}`}
              className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-amber-300 transition-all duration-300"
            >
              {/* Avatar Section */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                    {(trainer.user?.name || "T").charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors text-lg">{trainer.user?.name}</h3>
                    <div className="text-sm text-slate-500">{trainer.specialties?.join(", ") || "General"}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{trainer.bio || "Expert trainer with years of experience."}</p>
              </div>

              {/* Stats */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <BookOpen size={14} className="text-amber-500" />
                      {trainer._count?.bookings || 0} sessions
                    </span>
                    {trainer.hourlyRate && (
                      <span className="flex items-center gap-1.5 text-slate-600">
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
