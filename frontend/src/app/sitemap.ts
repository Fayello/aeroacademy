import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://xpertclass.academy";

  // Static routes — always indexable
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/courses`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/labs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/get-started`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/community/ambassador-program`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/community/volunteer-program`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  // Attempt to include dynamic course/lab URLs for SEO.
  // Best-effort: if backend is unreachable or requires auth, fall back to static only.
  // This keeps build resilient (no hard failure) while enabling indexation when public endpoint exists.
  try {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
    const [coursesRes, labsRes] = await Promise.all([
      fetch(`${api}/api/v1/courses`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${api}/api/v1/labs`, { next: { revalidate: 3600 } }).catch(() => null),
    ]);

    const dynamic: MetadataRoute.Sitemap = [];

    if (coursesRes?.ok) {
      const courses = await coursesRes.json().catch(() => []);
      const list = Array.isArray(courses) ? courses : courses.data || [];
      for (const c of list.slice(0, 100)) {
        if (c.id) dynamic.push({ url: `${baseUrl}/courses/${c.id}`, lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(), changeFrequency: "weekly", priority: 0.7 });
      }
    }
    if (labsRes?.ok) {
      const labs = await labsRes.json().catch(() => []);
      const list = Array.isArray(labs) ? labs : labs.data || [];
      for (const l of list.slice(0, 100)) {
        if (l.id) dynamic.push({ url: `${baseUrl}/labs/${l.id}`, lastModified: l.updatedAt ? new Date(l.updatedAt) : new Date(), changeFrequency: "weekly", priority: 0.7 });
      }
    }

    return [...staticRoutes, ...dynamic];
  } catch {
    return staticRoutes;
  }
}
