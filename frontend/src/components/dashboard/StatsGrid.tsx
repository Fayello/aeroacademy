"use client";

import { Trophy, Target, Shield, CheckCircle } from "lucide-react";

interface StatsGridProps {
  xp: number;
  rank: string | number;
  division: string;
  clearance: string;
  loading?: boolean;
}

const stats = [
  { key: "xp", label: "Total XP", icon: Trophy, color: "text-amber-600 bg-amber-100" },
  { key: "rank", label: "Rank (ELO)", icon: Target, color: "text-emerald-600 bg-emerald-100" },
  { key: "division", label: "Division", icon: Shield, color: "text-blue-600 bg-blue-100" },
  { key: "clearance", label: "Clearance", icon: CheckCircle, color: "text-emerald-600 bg-emerald-100" },
];

export default function StatsGrid({ xp, rank, division, clearance, loading }: StatsGridProps) {
  const values: Record<string, string> = {
    xp: xp?.toLocaleString() || "0",
    rank: String(rank || "1200"),
    division: division || "BRONZE",
    clearance: clearance || "STUDENT_L1",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">{label}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={16} />
            </div>
          </div>
          {loading ? (
            <div className="h-7 w-20 bg-slate-100 animate-pulse rounded" />
          ) : (
            <p className="text-xl font-semibold text-slate-900 tracking-tight">{values[key]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
