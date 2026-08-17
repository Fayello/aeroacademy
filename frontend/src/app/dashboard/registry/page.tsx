"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useState, useEffect } from "react";
import { Shield, Award, CheckCircle, Trophy, Loader2, ExternalLink } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import toast from "@/lib/toast";
import type { Achievement } from "@/types/api";

export default function RegistryPage() {
  const { userMetrics } = useDashboard();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!userMetrics && !timedOut) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((id) => (
            <div key={id} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
              <div className="h-20 w-20 rounded-full bg-slate-200 animate-pulse mx-auto" />
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mx-auto" />
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userMetrics) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title="Security Registry" description="Your verified credentials and achievements." />
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Unable to load user data. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Security Registry" description="Your verified credentials and achievements." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clearance status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Shield size={36} className="text-slate-600" />
          </div>
          <p className="text-lg font-semibold text-slate-900">{userMetrics.division}</p>
          <p className="text-xs text-slate-500 mt-1">Level {userMetrics.level}</p>
          <div className="mt-4 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200 inline-block">
            {userMetrics.clearance}
          </div>
        </div>

        {/* League stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
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
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Verification</h3>
          <p className="text-sm text-slate-500 mb-4">
            Share your profile with recruiters to verify your skills.
          </p>
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${userMetrics.id}`}
              className="bg-transparent text-xs text-slate-600 font-mono flex-1 outline-none"
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
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Award size={16} className="text-slate-600" />
          Achievements
        </h3>
        {userMetrics.achievements?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userMetrics.achievements.map((achievement: Achievement) => (
              <div key={achievement.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Trophy size={18} className="text-slate-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{achievement.title}</p>
                    <CheckCircle size={12} className="text-slate-600" />
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
