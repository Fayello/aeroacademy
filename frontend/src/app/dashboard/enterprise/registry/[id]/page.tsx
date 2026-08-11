"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shield, Award, CheckCircle, Target, Trophy, Loader2, MapPin, GraduationCap, ChevronLeft, Mail, Star } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

export default function CandidateRegistry() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const data = await fetchApi(`/recruitment/candidate/${id}`);
      setProfile(data);
    } catch {
      toast.error("Candidate not found.");
      router.push("/dashboard/enterprise");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Link href="/dashboard/enterprise" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} />
        Back to talent pool
      </Link>

      {/* Header */}
      <div className="card p-6 flex flex-col sm:flex-row items-start gap-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700 shrink-0">
          {profile.name?.[0] || '?'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">{profile.name}</h1>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1"><MapPin size={14} />{profile.city || "N/A"}</span>
            <span className="flex items-center gap-1"><GraduationCap size={14} />{profile.organization?.name || "Independent"}</span>
            <span className="flex items-center gap-1"><Mail size={14} />{profile.email}</span>
          </div>
          {profile.bio && <p className="text-sm text-slate-600 mt-3">{profile.bio}</p>}
        </div>
        <a href={`mailto:${profile.email}`} className="btn-primary text-sm shrink-0">
          Contact
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="space-y-4">
          <div className="card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Shield size={28} className="text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-slate-900">{profile.division}</p>
            <p className="text-xs text-slate-500">{profile.clearance}</p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Metrics</h3>
            <div className="space-y-2">
              {[
                { label: "XP", value: profile.xp.toLocaleString() },
                { label: "Labs", value: profile._count.labSubmissions },
                { label: "Lessons", value: profile._count.progress },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                  <span className="text-slate-500">{stat.label}</span>
                  <span className="font-semibold text-slate-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Award size={16} className="text-amber-500" />
            Achievements
          </h3>
          {profile.achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.achievements.map((item: any) => (
                <div key={item.achievement.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Trophy size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.achievement.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-slate-500">
              <Target size={24} className="mx-auto mb-2 text-slate-300" />
              No achievements yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
