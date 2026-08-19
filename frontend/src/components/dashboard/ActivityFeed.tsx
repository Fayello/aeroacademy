"use client";

import { Activity } from "lucide-react";

interface ActivityFeedProps {
  feed: Array<{
    type: string;
    message: string;
    points?: number;
    timestamp: string;
  }>;
}

export default function ActivityFeed({ feed }: ActivityFeedProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
        {feed.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-[#229C62]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#229C62] animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {feed.length > 0 ? feed.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
              item.type === "ACHIEVEMENT_UNLOCKED" ? "bg-amber-400" :
              item.type === "FLAG_CAPTURED" ? "bg-blue-400" :
              "bg-[#229C62]/60"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 leading-snug">{item.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {item.points && (
                  <span className="text-xs font-medium text-[#229C62]">+{item.points} XP</span>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Activity size={24} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
