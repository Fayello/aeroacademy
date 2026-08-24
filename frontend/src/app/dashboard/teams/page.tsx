"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import {
  Users,
  Trophy,
  BookOpen,
  Star,
  ChevronRight,
  Loader2,
  Crown,
  Info,
} from "lucide-react";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  xp: number;
  role: string;
  joinedAt: string;
}

interface TeamCourse {
  id: string;
  title: string;
  progress?: number;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  ownerName: string;
  ownerId: string;
  totalXp: number;
  memberCount: number;
  maxMembers?: number;
  members?: TeamMember[];
  courses?: TeamCourse[];
}

export default function TeamsPage() {
  const { t } = useI18n();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<Team[]>("/team-enrollments");
        setTeams(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openTeam(team: Team) {
    setDetailLoading(true);
    try {
      const detail = await fetchApi<Team>(`/team-enrollments/${team.id}`);
      setSelectedTeam(detail);
    } catch {
      setSelectedTeam(team);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#229C62] animate-spin" />
      </div>
    );
  }

  if (selectedTeam) {
    const sortedMembers = selectedTeam.members
      ? [...selectedTeam.members].sort((a, b) => b.xp - a.xp)
      : [];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <button
          onClick={() => setSelectedTeam(null)}
          className="text-sm text-[#229C62] hover:text-[#0F203A] font-medium"
        >
          &larr; Back to Teams
        </button>

        <div className="flex items-center gap-3">
          <div className="bg-[#E9F8EE] p-3 rounded-xl">
            <Users size={24} className="text-[#229C62]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {selectedTeam.name}
            </h1>
            {selectedTeam.description && (
              <p className="text-sm text-slate-500 mt-0.5">{selectedTeam.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Crown size={14} /> Owner
            </div>
            <p className="text-sm font-semibold text-slate-900">{selectedTeam.ownerName}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Users size={14} /> Members
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {selectedTeam.memberCount}
              {selectedTeam.maxMembers ? ` / ${selectedTeam.maxMembers}` : ""}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Trophy size={14} /> Total XP
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {selectedTeam.totalXp.toLocaleString()}
            </p>
          </div>
        </div>

        {sortedMembers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Leaderboard</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {sortedMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0"
                >
                  <span className="text-sm font-bold text-slate-400 w-6 text-center">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#E9F8EE] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#0F203A]">
                      {member.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{member.role?.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      {member.xp?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTeam.courses && selectedTeam.courses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Enrolled Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedTeam.courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <BookOpen size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{course.title}</p>
                    {course.progress !== undefined && (
                      <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-[#229C62] h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(course.progress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="My Teams"
        description={`${teams.length} team${teams.length !== 1 ? "s" : ""}`}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Contact admin to join a team. Teams are created and managed by administrators.
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E9F8EE] flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-[#229C62]" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No teams yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Teams let you collaborate with other engineers. Ask your administrator to create or assign you to a team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => openTeam(team)}
              className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:shadow-md hover:border-[#229C62]/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-[#E9F8EE] p-2 rounded-lg group-hover:bg-[#229C62]/30 transition-colors">
                  <Users size={18} className="text-[#229C62]" />
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-[#229C62] transition-colors mt-1"
                />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">{team.name}</h3>
              {team.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{team.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <Crown size={12} className="text-amber-400" />
                <span>{team.ownerName}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy size={12} className="text-amber-500" />
                  <span>{team.totalXp.toLocaleString()} XP</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
