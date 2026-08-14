"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { Shield, Award, CheckCircle, Trophy, Loader2, ExternalLink } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import toast from "react-hot-toast";
import type { Achievement } from "@/types/api";

export default function RegistryPage() {
  const { userMetrics } = useDashboard();

  if (!userMetrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Security Registry" description="Your verified credentials and achievements." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clearance status */}
        <div className="card p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={36} className="text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-slate-900">{userMetrics.division}</p>
          <p className="text-xs text-slate-500 mt-1">Level {userMetrics.level}</p>
          <div className="mt-4 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200 inline-block">
            {userMetrics.clearance}
          </div>
        </div>

        {/* League stats */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Stats</h3>
          <div className="space-y-3">
            {[
              { label: "Global Rank", value: `#${userMetrics.rank}` },
              { label: "XP Earned", value: userMetrics.xp.toLocaleString() },
              { label: "Achievements", value: userMetrics.achievements?.length || 0 },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{stat.label}</span>
                <span className="text-sm font-semibold text-slate-900">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Verification</h3>
          <p className="text-sm text-slate-500 mb-4">
            Share your profile with recruiters to verify your skills.
          </p>
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${userMetrics.id}`}
              className="bg-transparent text-xs text-emerald-600 font-mono flex-1 outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${userMetrics.id}`);
                toast.success("Link copied to clipboard!");
              }}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Copy link"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Award size={16} className="text-amber-500" />
          Achievements
        </h3>
        {userMetrics.achievements?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userMetrics.achievements.map((achievement: Achievement) => (
              <div key={achievement.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Trophy size={18} className="text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{achievement.title}</p>
                    <CheckCircle size={12} className="text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">No achievements yet. Complete courses and labs to earn them.</p>
        )}
      </div>
    </div>
  );
}
