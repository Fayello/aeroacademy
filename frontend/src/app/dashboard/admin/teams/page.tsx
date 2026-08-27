"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import {
  Users,
  Trophy,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  Search,
  X,
  Mail,
  Shield,
} from "lucide-react";
import toast from "@/lib/toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  xp: number;
}

interface TeamCourse {
  id: string;
  title: string;
}

interface Team {
  id: string;
  name: string;
  owner: { id: string; name: string; email: string };
  members: TeamMember[];
  enrolledCourses: TeamCourse[];
  xp: number;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  const [enrollModal, setEnrollModal] = useState<{
    open: boolean;
    teamIds: string[];
  }>({ open: false, teamIds: [] });
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [saving, setSaving] = useState(false);

  const [leaderboard, setLeaderboard] = useState<Team[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const loadTeams = useCallback(async () => {
    try {
      const data = await fetchApi("/team-enrollments");
      setTeams(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const data = await fetchApi("/courses");
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApi("/team-enrollments");
        if (!cancelled) setTeams(Array.isArray(data) ? data : data.data || []);
      } catch {
        toast.error("Failed to load teams");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    (async () => {
      try {
        const data = await fetchApi("/courses");
        if (!cancelled) setCourses(Array.isArray(data) ? data : data.data || []);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await fetchApi("/team-enrollments/leaderboard");
      setLeaderboard(Array.isArray(data) ? data : []);
      setShowLeaderboard(true);
    } catch {
      toast.error("Failed to load leaderboard");
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedTeams);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTeams(next);
  };

  const toggleSelectAll = () => {
    const filtered = teams.filter((t) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.owner?.name?.toLowerCase().includes(q) ||
        t.owner?.email?.toLowerCase().includes(q)
      );
    });
    if (selectedTeams.size === filtered.length) setSelectedTeams(new Set());
    else setSelectedTeams(new Set(filtered.map((t) => t.id)));
  };

  const openEnrollModal = (teamIds: string[]) => {
    setSelectedCourseId("");
    setEnrollModal({ open: true, teamIds });
  };

  const handleEnroll = async () => {
    if (!selectedCourseId) {
      toast.error("Select a course");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        enrollModal.teamIds.map((teamId) =>
          fetchApi(`/team-enrollments/${teamId}/enroll`, {
            method: "POST",
            body: JSON.stringify({ courseId: selectedCourseId }),
          })
        )
      );
      toast.success(
        `Enrolled ${enrollModal.teamIds.length} team${enrollModal.teamIds.length !== 1 ? "s" : ""}`
      );
      setEnrollModal({ open: false, teamIds: [] });
      loadTeams();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filtered = teams.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.owner?.name?.toLowerCase().includes(q) ||
      t.owner?.email?.toLowerCase().includes(q)
    );
  });

  const totalXp = teams.reduce((acc, t) => acc + (t.xp || 0), 0);
  const totalMembers = teams.reduce(
    (acc, t) => acc + (t.members?.length || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden angular-card bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manage Teams</h1>
              <p className="text-indigo-100 text-sm">
                {teams.length} teams
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadLeaderboard}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm backdrop-blur-sm"
            >
              <Trophy size={16} /> Leaderboard
            </button>
            {selectedTeams.size > 0 && (
              <button
                onClick={() => openEnrollModal(Array.from(selectedTeams))}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm backdrop-blur-sm"
              >
                <Plus size={16} /> Enroll Selected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="angular-card border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Users size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {teams.length}
              </p>
              <p className="text-xs text-slate-500">Teams</p>
            </div>
          </div>
        </div>
        <div className="angular-card border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center">
              <Users size={18} className="text-[#7AD62A]" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {totalMembers}
              </p>
              <p className="text-xs text-slate-500">Members</p>
            </div>
          </div>
        </div>
        <div className="angular-card border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Trophy size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {totalXp.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Total XP</p>
            </div>
          </div>
        </div>
        <div className="angular-card border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <BookOpen size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {new Set(teams.flatMap((t) => t.enrolledCourses?.map((c) => c.id) || [])).size}
              </p>
              <p className="text-xs text-slate-500">Courses Enrolled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedTeams.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
          <span className="text-sm font-medium text-indigo-700">
            {selectedTeams.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setSelectedTeams(new Set())}
              className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-[#0f172a] transition-all"
              title="Clear selection"
            >
              <X size={16} />
            </button>
            <button
              onClick={() => openEnrollModal(Array.from(selectedTeams))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all"
            >
              <Plus size={14} /> Enroll in Course
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard View */}
      {showLeaderboard && (
        <div className="angular-card border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" /> Team
              Leaderboard
            </h2>
            <button
              onClick={() => setShowLeaderboard(false)}
              className="p-2 text-slate-400 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {leaderboard.map((team, i) => (
              <div
                key={team.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  i === 0
                    ? "bg-amber-500/10 border border-amber-200"
                    : i === 1
                      ? "bg-white/5 border border-white/10"
                      : i === 2
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-[#0f172a] border border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      i === 0
                        ? "bg-amber-400 text-white"
                        : i === 1
                          ? "bg-slate-400 text-white"
                          : i === 2
                            ? "bg-orange-400 text-white"
                            : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-white">{team.name}</p>
                    <p className="text-xs text-slate-500">
                      {team.owner?.name} • {team.members?.length || 0} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {(team.xp || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">XP</p>
                  </div>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No teams found.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search teams by name or owner..."
          className="w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Select All */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSelectAll}
          className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
        >
          {selectedTeams.size === filtered.length && filtered.length > 0
            ? "Deselect All"
            : "Select All"}
        </button>
        <span className="text-xs text-slate-400">
          ({filtered.length} teams)
        </span>
      </div>

      {/* Teams List */}
      <div className="grid gap-3">
        {filtered.map((team) => (
          <div
            key={team.id}
            className={`angular-card border-white/10 transition-all ${
              selectedTeams.has(team.id)
                ? "border-indigo-400 ring-1 ring-indigo-400/40"
                : ""
            }`}
          >
            <div
              className="p-5 cursor-pointer hover:bg-white/5/50 transition-colors"
              onClick={() => toggleExpand(team.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(team.id);
                    }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedTeams.has(team.id)
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-white/10 hover:border-indigo-400"
                    }`}
                  >
                    {selectedTeams.has(team.id) && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6L5 9L10 3"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {team.name?.[0]?.toUpperCase() || "T"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Shield size={12} />
                      <span>{team.owner?.name || team.owner?.email}</span>
                      <span>•</span>
                      <Users size={12} />
                      <span>{team.members?.length || 0} members</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-white">
                      {(team.xp || 0).toLocaleString()} XP
                    </p>
                    <p className="text-xs text-slate-500">
                      {team.enrolledCourses?.length || 0} courses
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEnrollModal([team.id]);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Enroll in course"
                  >
                    <Plus size={16} />
                  </button>
                  {expanded.has(team.id) ? (
                    <ChevronDown size={18} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={18} className="text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expanded.has(team.id) && (
              <div className="border-t border-white/10 px-5 py-4 bg-white/5/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Members */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Users size={14} className="text-slate-500" /> Members
                    </h4>
                    {team.members?.length ? (
                      <div className="space-y-2">
                        {team.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2.5 bg-[#0f172a] rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                {(member.name || member.email)?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {member.name || "No name"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-mono text-slate-500">
                              {(member.xp || 0).toLocaleString()} XP
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 bg-[#0f172a] rounded-lg border border-white/10 p-3 text-center">
                        No members.
                      </p>
                    )}
                  </div>

                  {/* Enrolled Courses */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <BookOpen size={14} className="text-slate-500" /> Enrolled
                      Courses
                    </h4>
                    {team.enrolledCourses?.length ? (
                      <div className="space-y-2">
                        {team.enrolledCourses.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center gap-2.5 p-2.5 bg-[#0f172a] rounded-lg border border-white/10"
                          >
                            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                              <BookOpen
                                size={14}
                                className="text-blue-600"
                              />
                            </div>
                            <p className="text-sm font-medium text-white">
                              {course.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 bg-[#0f172a] rounded-lg border border-white/10 p-3 text-center">
                        No courses enrolled.
                      </p>
                    )}
                    <button
                      onClick={() => openEnrollModal([team.id])}
                      className="mt-3 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <Plus size={14} /> Enroll in Course
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Users size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No teams found.</p>
          </div>
        )}
      </div>

      {/* Enroll Modal */}
      {enrollModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEnrollModal({ open: false, teamIds: [] })}
          />
          <div className="relative angular-card border-white/10 shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Enroll Team{enrollModal.teamIds.length !== 1 ? "s" : ""} in
                Course
              </h3>
              <button
                onClick={() => setEnrollModal({ open: false, teamIds: [] })}
                className="p-1.5 text-slate-400 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Select a course to enroll{" "}
              <span className="font-medium text-white">
                {enrollModal.teamIds.length}
              </span>{" "}
              team{enrollModal.teamIds.length !== 1 ? "s" : ""}.
            </p>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0f172a] text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setEnrollModal({ open: false, teamIds: [] })}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-700 hover:bg-white/5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={saving || !selectedCourseId}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Enrolling..." : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
