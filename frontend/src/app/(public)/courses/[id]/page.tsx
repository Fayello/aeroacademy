import type { Metadata } from "next";
import Link from "next/link";

// ISR: revalidate every hour — SEO pages benefit from freshness without hammering API
export const revalidate = 3600;
// Allow dynamic params (courses created after build)
export const dynamicParams = true;

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  category?: string;
  difficulty?: number;
  estimatedHours?: number | null;
  createdAt?: string;
  sections?: { id: string; title: string; lessons?: unknown[] }[];
};

const API_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:4000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://xpertclass.academy";

async function fetchCourse(id: string): Promise<CourseDetail | null> {
  try {
    // NOTE: Backend currently guards /v1/courses/:id with JWT (see courses.controller.ts).
    // For public SEO we need a public endpoint (e.g. /v1/courses/:id/public) that returns
    // safe fields without auth. This fetch will succeed only when that endpoint exists or
    // when the controller's AuthGuard is relaxed for GET. Fallback is graceful (null).
    // TODO backend: add @Public() guard on GET :id returning sanitized DTO.
    const res = await fetch(`${API_URL}/api/v1/courses/${id}`, {
      next: { revalidate: 3600 },
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data as CourseDetail;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course = await fetchCourse(id);

  if (!course) {
    // Placeholder metadata — ensures crawlers get a valid response even before public API exists
    return {
      title: "Course | XpertClass",
      description: "Hands-on course on XpertClass — security, Linux, DevOps and cloud labs.",
      alternates: { canonical: `${SITE_URL}/courses/${id}` },
      robots: { index: true, follow: true },
      openGraph: {
        title: "Course | XpertClass",
        description: "Hands-on training with real labs.",
        url: `${SITE_URL}/courses/${id}`,
        type: "website",
        siteName: "XpertClass",
      },
    };
  }

  const title = `${course.title} | XpertClass`;
  const description = course.description?.slice(0, 155) || "Hands-on course with real labs on XpertClass Academy.";
  const url = `${SITE_URL}/courses/${course.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "XpertClass",
      images: course.imageUrl ? [{ url: course.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: course.imageUrl ? [course.imageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await fetchCourse(id);

  // If no course found and backend is still auth-guarded, show SEO-friendly placeholder
  // instead of hard 404 so crawlers can still index once data is public. Flip to notFound()
  // when public API is live if you prefer strict 404.
  if (!course) {
    return (
      <div className="min-h-[60vh] max-w-3xl mx-auto px-6 py-16">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-[#7AD62A]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/courses" className="hover:text-[#7AD62A]">Courses</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">{id.slice(0, 8)}…</span>
        </nav>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-8">
          <span className="inline-flex px-3 py-1 rounded-full bg-[#7AD62A]/10 border border-[#7AD62A]/20 text-[#7AD62A] text-xs font-semibold">Course</span>
          <h1 className="text-3xl font-bold text-white mt-4">Hands-on Course</h1>
          <p className="text-slate-400 mt-3 leading-relaxed">
            This course is part of the XpertClass catalog — security, Linux, DevOps and cloud training with 35+ real Docker labs.
            Sign in to view full curriculum, lessons and progress.
          </p>
          <div className="flex gap-3 mt-8">
            <Link href={`/dashboard/courses/${id}`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#7AD62A] text-white rounded-xl font-semibold hover:bg-[#1e8a56] transition-colors">
              View in Dashboard
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-colors">
              Browse Courses
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-6">
            SEO note: This placeholder is rendered when the course API requires authentication.
            After backend exposes a public <code className="px-1 py-0.5 bg-white/5 rounded">GET /v1/courses/:id/public</code> endpoint,
            this page will automatically render dynamic metadata and JSON-LD.
          </p>
        </div>
      </div>
    );
  }

  // JSON-LD for SEO (Course schema)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: { "@type": "Organization", name: "XpertClass", sameAs: SITE_URL },
    url: `${SITE_URL}/courses/${course.id}`,
    image: course.imageUrl || undefined,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-[#7AD62A]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/courses" className="hover:text-[#7AD62A]">Courses</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{course.title}</span>
      </nav>

      {course.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={course.imageUrl} alt={course.title} className="w-full h-64 object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {course.category && <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-200 text-blue-700 text-xs font-semibold">{course.category}</span>}
        {course.difficulty != null && <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-200 text-amber-700 text-xs font-medium">Level {course.difficulty}</span>}
        {course.estimatedHours != null && <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs">{course.estimatedHours}h</span>}
      </div>

      <h1 className="text-4xl font-bold text-white tracking-tight">{course.title}</h1>
      <p className="text-lg text-slate-400 mt-4 leading-relaxed">{course.description}</p>

      {course.sections && course.sections.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4">Curriculum</h2>
          <ul className="space-y-3">
            {course.sections.map((s) => (
              <li key={s.id} className="p-4 rounded-xl border border-white/10 bg-[#0f172a]">
                <div className="font-medium text-white">{s.title}</div>
                <div className="text-xs text-slate-500 mt-1">{(s.lessons?.length ?? 0)} lessons</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-10">
        <Link href={`/dashboard/courses/${course.id}`} className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#7AD62A] text-white rounded-xl font-semibold hover:bg-[#1e8a56] transition-colors">
          Start Learning
        </Link>
        <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-colors">
          Create Free Account
        </Link>
      </div>
    </div>
  );
}
