"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Loader2, Compass, BookOpen, Target, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

interface Recommendations {
  courses: { id: string; title: string; description: string; imageUrl: string | null }[];
  learningPaths: { id: string; title: string; description: string; imageUrl: string | null; careerRole: string | null }[];
  labs: { id: string; title: string; description: string; difficulty: number }[];
  similarUsers: { id: string; name: string | null; username: string | null; xp: number }[];
  insights?: {
    weakDomains: string[];
    level: number;
    streak: number;
  };
}

export default function RecommendationsPage() {
  const [data, setData] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchApi<Recommendations>("/dashboard/recommendations");
        setData(result);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#229C62] animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-[#E9F8EE] p-3 rounded-xl">
          <Compass size={24} className="text-[#229C62]" />
        </div>
        <PageHeader title="For You" description="Personalized recommendations based on your profile" />
      </div>

      {/* Insights */}
      {data.insights && data.insights.weakDomains && data.insights.weakDomains.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">Skill Gaps Detected</p>
          </div>
          <p className="text-xs text-amber-700">
            We noticed you could improve in: <span className="font-semibold">{data.insights.weakDomains.join(", ")}</span>.
            Check out the recommended courses below to level up.
          </p>
        </div>
      )}

      {/* Learning Paths */}
      {data.learningPaths.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Recommended Career Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.learningPaths.map((path) => (
              <Link
                key={path.id}
                href={`/dashboard/learning-paths/${path.id}`}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-[#229C62]/20 transition-all"
              >
                <div className="bg-[#E9F8EE] p-2 rounded-lg w-fit mb-3">
                  <BookOpen size={16} className="text-[#229C62]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{path.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{path.description}</p>
                {path.careerRole && (
                  <span className="text-[10px] font-medium text-[#229C62] bg-[#E9F8EE] px-2 py-0.5 rounded-full">
                    {path.careerRole}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Courses */}
      {data.courses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Suggested Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.courses.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all"
              >
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{course.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Labs */}
      {data.labs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Try These Labs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.labs.map((lab) => (
              <Link
                key={lab.id}
                href={`/dashboard/labs/${lab.id}`}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-purple-300 transition-all"
              >
                <div className="bg-purple-50 p-2 rounded-lg w-fit mb-3">
                  <Target size={16} className="text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{lab.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{lab.description}</p>
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Difficulty: {lab.difficulty}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Similar Users */}
      {data.similarUsers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Operatives Like You</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {data.similarUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0">
                <div className="w-8 h-8 rounded-full bg-[#E9F8EE] flex items-center justify-center">
                  <Users size={14} className="text-[#229C62]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.username || user.name || "Operative"}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">{user.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
