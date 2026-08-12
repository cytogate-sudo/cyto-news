import type { Metadata } from "next";
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

  return (
    <>
      <div className="section-title" style={{ marginTop: 40 }}>
        <h2>{category?.name ?? "Kategori"}</h2>
        <div className="rule" />
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">Bu kategoride henüz yazı yok.</div>
      ) : (
        <div className="grid-articles">
          {articles.map((article) => (
            <a
              key={article.id}
              href={`/sayi/${article.issue?.issue_number}/${article.slug}`}
              className="card"
            >
              <div className="kicker">{article.kicker ?? category?.name}</div>
              <h3>{article.title}</h3>
              {article.summary ? <p>{article.summary}</p> : null}
              {article.author_name ? <div className="byline">{article.author_name}</div> : null}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
