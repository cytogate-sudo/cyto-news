import type { MetadataRoute } from "next";
import { getAllIssues, getAllPublishedArticles, getCategories } from "@/lib/gazete";

const SITE_URL = "https://cyto-news.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [issues, articles, categories] = await Promise.all([
    getAllIssues(),
    getAllPublishedArticles(),
    getCategories(),
  ]);

  const latestChange = articles[0]?.published_at
    ? new Date(articles[0].published_at)
    : new Date();

  return [
    { url: SITE_URL, lastModified: latestChange, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/sayilar`, lastModified: latestChange, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/hakkinda`, changeFrequency: "yearly", priority: 0.4 },
    ...categories.map((category) => ({
      url: `${SITE_URL}/kategori/${category.slug}`,
      lastModified: latestChange,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...issues.map((issue) => ({
      url: `${SITE_URL}/sayi/${issue.issue_number}`,
      lastModified: new Date(issue.publish_date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: `${SITE_URL}/sayi/${article.issue?.issue_number ?? 1}/${article.slug}`,
      lastModified: article.published_at ? new Date(article.published_at) : undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
