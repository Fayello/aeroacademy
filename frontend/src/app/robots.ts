import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://xpertclass.academy";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses/", "/labs/"],
        disallow: ["/dashboard/", "/api/", "/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
