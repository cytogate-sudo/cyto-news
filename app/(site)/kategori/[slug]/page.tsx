import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleRow } from "@/components/ArticleRow";
import { getArticlesByCategorySlug, getCategories } from "@/lib/gazete";

export const revalidate = 3600;

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  return { title: category ? `${category.name} — Cytogate Bilim Gazetesi` : "Kategori" };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [articles, categories] = await Promise.all([
    getArticlesByCategorySlug(slug),
    getCategories(),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <div className="page-head-wrap">
      <div className="page-head">
        <div className="kicker">Köşe</div>
        <h1>{category.name}</h1>
        <p className="page-head-meta">
          {articles.length > 0 ? `${articles.length} yazı` : "Henüz yazı yok"}
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">Bu köşede henüz yazı yok.</div>
      ) : (
        <div className="art-rows">
          {articles.map((article) => (
            <ArticleRow
              key={article.id}
              article={article}
              issueNumber={article.issue?.issue_number ?? 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
