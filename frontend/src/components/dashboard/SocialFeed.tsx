"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  Activity, Trophy, Shield, GraduationCap, FlaskConical,
  Loader2, Users,
} from "lucide-react";

interface SocialActivity {
  id: string;
  userId: string;
  type: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const EVENT_CONFIG: Record<string, { icon: typeof Trophy; color: string; bg: string; verb: string }> = {
  FLAG_SOLVED: { icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10", verb: "captured a flag in" },
  LESSON_COMPLETED: { icon: GraduationCap, color: "text-[#7AD62A]", bg: "bg-[#7AD62A]/10", verb: "completed a lesson in" },
  COURSE_COMPLETED: { icon: GraduationCap, color: "text-amber-400", bg: "bg-amber-500/10", verb: "finished the course" },
  LAB_STARTED: { icon: FlaskConical, color: "text-violet-400", bg: "bg-violet-500/10", verb: "started working on" },
  QUIZ_PASSED: { icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10", verb: "passed a quiz in" },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SocialFeed() {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<SocialActivity[]>("/dashboard/global-activity")
      .then((data) => setActivities(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-[#7AD62A]" />
          <h2 className="text-sm font-semibold text-white">Community Activity</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="text-slate-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="angular-card bg-[#0f172a] border border-white/6 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#7AD62A]" />
          <h2 className="text-sm font-semibold text-white">Community Activity</h2>
        </div>
        {activities.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-[#7AD62A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7AD62A] animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {activities.length > 0 ? activities.map((item) => {
          const config = EVENT_CONFIG[item.type] || EVENT_CONFIG.LAB_STARTED;
          const Icon = config.icon;
          const meta = item.metadata as Record<string, unknown> | null;
          const targetTitle = (meta?.labTitle || meta?.lessonTitle || meta?.courseTitle || meta?.flagTitle || "an exercise") as string;

          return (
            <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon size={14} className={config.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 leading-snug">
                  <span className="font-medium text-white">{item.user.name || item.user.email.split("@")[0]}</span>
                  {" "}{config.verb}{" "}
                  <span className="font-medium text-white">{targetTitle}</span>
                </p>
                <span className="text-[11px] text-slate-500">{formatTimeAgo(item.createdAt)}</span>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8">
            <Users size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No activity yet</p>
            <p className="text-xs text-slate-600 mt-1">Start learning to see community activity here</p>
          </div>
        )}
      </div>
    </div>
  );
}
