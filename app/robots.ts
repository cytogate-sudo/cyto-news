import type { MetadataRoute } from "next";

const SITE_URL = "https://cytogate.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Yönetim paneli arama sonuçlarına düşmesin
      disallow: ["/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
