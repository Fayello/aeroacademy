import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Labs | XpertClass",
  description: "Hands-on labs for security, Linux, Docker, Kubernetes, networking, and more. Deploy isolated sandboxes for practical training.",
  alternates: { canonical: "/labs" },
  openGraph: { title: "Labs | XpertClass", description: "Real Docker sandboxes with terminal access.", type: "website" },
};

const API_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:4000";
export const revalidate = 3600;

async function getLabs() {
  try {
    const res = await fetch(`${API_URL}/api/v1/labs`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch {
    return [];
  }
}

export default async function PublicLabsIndex() {
  const labs = await getLabs();
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-white tracking-tight">Labs</h1>
      <p className="text-slate-400 mt-3 max-w-2xl">Docker sandboxes with real terminals. SEO-indexable catalog; deploy and solve flags in the dashboard.</p>
      {labs.length === 0 ? (
        <div className="mt-10 p-8 rounded-2xl border border-white/10 bg-[#0f172a] text-slate-400">
          Lab catalog is available after sign-in. <Link href="/dashboard/labs" className="text-[#7AD62A] hover:underline">Go to dashboard</Link>.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {labs.map((l: { id: string; title: string; description: string }) => (
            <Link key={l.id} href={`/labs/${l.id}`} className="group rounded-2xl border border-white/10 bg-[#0f172a] p-6 hover:border-[#7AD62A]/30 hover:shadow-lg transition-all">
              <h3 className="font-semibold text-white group-hover:text-[#7AD62A] transition-colors">{l.title}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{l.description}</p>
              <span className="inline-flex mt-4 text-sm font-medium text-[#7AD62A]">View lab →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
