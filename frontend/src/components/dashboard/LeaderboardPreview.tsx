"use client";

import { Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";
import { DIVISION_TEXT_COLORS } from "@/lib/constants";

interface LeaderboardPreviewProps {
  leaderboard: Array<{
    id: string;
    name: string;
    division: string;
    xp: number;
    rank: number;
  }>;
}

export default function LeaderboardPreview({ leaderboard }: LeaderboardPreviewProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-900">Top Performers</h3>
        </div>
        <Link href="/dashboard/leaderboard" className="text-xs text-[#229C62] hover:text-[#0F203A] font-medium flex items-center gap-1">
          View all <ChevronRight size={12} />
        </Link>
      </div>

      <div className="space-y-2">
        {leaderboard.slice(0, 5).map((op, idx) => (
          <div key={op.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
            <span className="text-xs font-medium text-slate-400 w-5 text-center">{idx + 1}</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
              {op.name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{op.name}</p>
              <p className={`text-xs font-medium ${DIVISION_TEXT_COLORS[op.division] || "text-slate-500"}`}>{op.division}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{op.xp.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">XP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
