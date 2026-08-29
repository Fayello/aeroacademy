import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Courses | XpertClass",
  description: "Browse hands-on courses in security, Linux, DevOps and cloud. 9 courses, 50+ lessons with linked labs.",
  alternates: { canonical: "/courses" },
  openGraph: { title: "Courses | XpertClass", description: "Structured learning paths with real labs.", type: "website" },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

export const revalidate = 3600;

async function getCourses() {
  try {
    const res = await fetch(`${API_URL}/api/v1/courses`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch {
    return [];
  }
}

export default async function PublicCoursesIndex() {
  const courses = await getCourses();
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-white tracking-tight">Courses</h1>
      <p className="text-slate-400 mt-3 max-w-2xl">Structured, lab-linked courses. This public catalog is SEO-indexable; full progress and lessons live in the dashboard.</p>
      {courses.length === 0 ? (
        <div className="mt-10 p-8 rounded-2xl border border-white/10 bg-[#0f172a] text-slate-400">
          Course catalog is available after sign-in. <Link href="/dashboard/courses" className="text-[#7AD62A] hover:underline">Go to dashboard</Link> or <Link href="/register" className="text-[#7AD62A] hover:underline">create free account</Link>.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {courses.map((c: { id: string; title: string; description: string; imageUrl?: string }) => (
            <Link key={c.id} href={`/courses/${c.id}`} className="group rounded-2xl border border-white/10 bg-[#0f172a] p-6 hover:border-[#7AD62A]/30 hover:shadow-lg transition-all">
              <h3 className="font-semibold text-white group-hover:text-[#7AD62A] transition-colors">{c.title}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{c.description}</p>
              <span className="inline-flex mt-4 text-sm font-medium text-[#7AD62A]">View course →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
