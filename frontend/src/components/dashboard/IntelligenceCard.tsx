"use client";

import Link from "next/link";
import { Play, ChevronRight } from "lucide-react";

interface IntelligenceCardProps {
  latestProgress: any;
  courseProgress: number;
}

export default function IntelligenceCard({ latestProgress, courseProgress }: IntelligenceCardProps) {
  return (
    <div className="card p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Play size={16} className="text-emerald-600" fill="currentColor" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Continue Learning</h3>
            <p className="text-xs text-slate-500">Pick up where you left off</p>
          </div>
        </div>

        {latestProgress?.lesson ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-1">Active Course</p>
              <p className="text-sm font-medium text-slate-900 line-clamp-2">{latestProgress.lesson.section?.course?.title || 'Course'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Current Lesson</p>
              <p className="text-sm text-slate-700 line-clamp-1">{latestProgress.lesson.title}</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span className="font-medium text-emerald-600">{courseProgress || 0}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${courseProgress || 0}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">No active courses yet</p>
          </div>
        )}
      </div>

      <Link
        href={latestProgress?.lessonId ? `/dashboard/courses/lessons/${latestProgress.lessonId}` : "/dashboard/courses"}
        className="btn-primary w-full mt-6 text-sm"
      >
        {latestProgress ? "Continue" : "Browse Courses"}
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
