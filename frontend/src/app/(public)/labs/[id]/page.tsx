import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;
export const dynamicParams = true;

type LabDetail = {
  id: string;
  title: string;
  description: string;
  briefing?: string | null;
  difficulty: number;
  imageUrl?: string | null;
  dockerImage?: string;
  tasks?: string[] | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://xpertclass.academy";

async function fetchLab(id: string): Promise<LabDetail | null> {
  try {
    // Backend labs controller guards detail with AuthGuard. For public SEO we need
    // GET /v1/labs/:id public projection (title/description/briefing/difficulty/tasks only).
    // Until then this will return null and we render placeholder with generic metadata.
    const res = await fetch(`${API_URL}/api/v1/labs/definition/${id}`, {
      next: { revalidate: 3600 },
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      // fallback try non-definition endpoint without auth (may 401)
      const res2 = await fetch(`${API_URL}/api/v1/labs/${id}`, {
        next: { revalidate: 3600 },
      }).catch(() => null);
      if (!res2?.ok) return null;
      return (await res2.json()) as LabDetail;
    }
    const data = await res.json();
    return data as LabDetail;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lab = await fetchLab(id);

  if (!lab) {
    return {
      title: "Lab | XpertClass",
      description: "Hands-on lab on XpertClass — deploy real Docker sandboxes and practice security, DevOps and Linux skills.",
      alternates: { canonical: `${SITE_URL}/labs/${id}` },
      robots: { index: true, follow: true },
      openGraph: {
        title: "Hands-on Lab | XpertClass",
        description: "Deploy isolated Docker labs and learn by doing.",
        url: `${SITE_URL}/labs/${id}`,
        type: "website",
        siteName: "XpertClass",
      },
    };
  }

  const title = `${lab.title} | XpertClass Lab`;
  const description = lab.description?.slice(0, 155) || lab.briefing?.slice(0, 155) || "Hands-on lab with real terminal and Docker sandbox.";
  const url = `${SITE_URL}/labs/${lab.id}`;

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
      images: lab.imageUrl ? [{ url: lab.imageUrl }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function PublicLabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lab = await fetchLab(id);

  if (!lab) {
    return (
      <div className="min-h-[60vh] max-w-3xl mx-auto px-6 py-16">
        <nav className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-[#7AD62A]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/labs" className="hover:text-[#7AD62A]">Labs</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-400">{id.slice(0, 8)}…</span>
        </nav>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-8">
          <span className="inline-flex px-3 py-1 rounded-full bg-blue-500/10 border border-blue-200 text-blue-700 text-xs font-semibold">Lab</span>
          <h1 className="text-3xl font-bold text-white mt-4">Hands-on Lab</h1>
          <p className="text-slate-400 mt-3 leading-relaxed">
            This lab spins up an isolated Docker container with real terminal access. Practice on vulnerable apps safely — no local setup required.
            Sign in to deploy your sandbox in ~30 seconds.
          </p>
          <div className="flex gap-3 mt-8">
            <Link href={`/dashboard/labs/${id}`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#7AD62A] text-white rounded-xl font-semibold hover:bg-[#1e8a56] transition-colors">
              Launch in Dashboard
            </Link>
            <Link href="/labs" className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-colors">
              Browse Labs
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-6">
            SEO placeholder rendered when lab API requires auth. After backend exposes public lab projection, dynamic metadata + JSON-LD will render automatically.
          </p>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lab.title,
    description: lab.description,
    provider: { "@type": "Organization", name: "XpertClass", sameAs: SITE_URL },
    url: `${SITE_URL}/labs/${lab.id}`,
    image: lab.imageUrl || undefined,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-[#7AD62A]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/labs" className="hover:text-[#7AD62A]">Labs</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{lab.title}</span>
      </nav>

      {lab.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lab.imageUrl} alt={lab.title} className="w-full h-64 object-cover" />
        </div>
      )}

      <h1 className="text-4xl font-bold text-white tracking-tight">{lab.title}</h1>
      <p className="text-lg text-slate-400 mt-4 leading-relaxed">{lab.description}</p>
      {lab.briefing && <div className="prose prose-invert max-w-none mt-6 text-slate-300 whitespace-pre-wrap">{lab.briefing}</div>}

      {lab.tasks && lab.tasks.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4">Tasks</h2>
          <ul className="space-y-2">
            {lab.tasks.map((t, i) => (
              <li key={i} className="flex gap-3 p-3 rounded-xl border border-white/10 bg-[#0f172a] text-slate-300 text-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#7AD62A]/15 text-[#7AD62A] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-10">
        <Link href={`/dashboard/labs/${lab.id}`} className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#7AD62A] text-white rounded-xl font-semibold hover:bg-[#1e8a56] transition-colors">
          Deploy Lab — 30s
        </Link>
        <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-colors">
          Create Free Account
        </Link>
      </div>
    </div>
  );
}
