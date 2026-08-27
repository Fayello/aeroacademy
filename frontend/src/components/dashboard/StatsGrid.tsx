"use client";

import { Trophy, Target, Shield, CheckCircle } from "lucide-react";
import { useDisplayMode } from "@/lib/displayMode";

interface StatsGridProps {
  xp?: number;
  rank?: string | number;
  division?: string;
  clearance: string;
  loading?: boolean;
}

export default function StatsGrid({ xp, rank, division, clearance, loading }: StatsGridProps) {
  const { config } = useDisplayMode();

  const allStats = [
    config.showXp && { key: "xp", label: "Total XP", icon: Trophy, color: "text-amber-600 bg-amber-100", value: xp?.toLocaleString() || "0" },
    config.showRanks && { key: "rank", label: "Rank (ELO)", icon: Target, color: "text-[#7AD62A] bg-[#7AD62A]/10", value: String(rank || "1200") },
    config.showRanks && { key: "division", label: "Division", icon: Shield, color: "text-blue-600 bg-blue-100", value: division || "BRONZE" },
    { key: "clearance", label: "Clearance", icon: CheckCircle, color: "text-[#7AD62A] bg-[#7AD62A]/10", value: clearance || "STUDENT_L1" },
  ].filter(Boolean) as { key: string; label: string; icon: typeof Trophy; color: string; value: string }[];

  return (
    <div className={`grid gap-4 ${allStats.length <= 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
      {allStats.map(({ key, label, icon: Icon, color, value }) => (
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
            <p className="text-xl font-semibold text-white tracking-tight">{value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
