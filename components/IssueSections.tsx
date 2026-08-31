import Link from "next/link";
import type { Article, Category } from "@/lib/gazete";
import { ArticleRow } from "@/components/ArticleRow";
import { TeamCard } from "@/components/TeamCard";

// Takım tanıtımları liste yerine koyu kart ızgarası olarak gösterilir.
const CARD_GRID_CATEGORIES = new Set(["takimlar"]);

type Group = {
  key: string;
  name: string;
  slug: string | null;
  articles: Article[];
};

/** Yazıları kategori sırasına göre bölümlere ayırır; kategorisizler sona. */
function groupByCategory(articles: Article[], categories: Category[]): Group[] {
  const groups: Group[] = [];

  for (const category of categories) {
    const inCategory = articles.filter((a) => a.category?.slug === category.slug);
    if (inCategory.length > 0) {
      groups.push({
        key: category.id,
        name: category.name,
        slug: category.slug,
        articles: inCategory,
      });
    }
  }

  const uncategorized = articles.filter((a) => !a.category?.slug);
  if (uncategorized.length > 0) {
    groups.push({ key: "diger", name: "Diğer Yazılar", slug: null, articles: uncategorized });
  }

  return groups;
}

export function IssueSections({
  articles,
  categories,
  issueNumber,
}: {
  articles: Article[];
  categories: Category[];
  issueNumber: number;
}) {
  const groups = groupByCategory(articles, categories);

  if (groups.length === 0) {
    return <div className="empty-state">Bu sayıda henüz başka yazı eklenmedi.</div>;
  }

  return (
    <>
      {groups.map((group) => (
        <section key={group.key}>
          <div className="section-title">
            <h2>{group.name}</h2>
            <div className="rule" />
            {group.slug ? (
              <Link href={`/kategori/${group.slug}`} className="section-more">
                <span className="more-long">Kategorinin tamamı</span>
                <span className="more-short">Tümü</span>
                <span className="arrow">→</span>
              </Link>
            ) : null}
          </div>

          {group.slug && CARD_GRID_CATEGORIES.has(group.slug) ? (
            <div className="team-grid">
              {group.articles.map((article) => (
                <TeamCard key={article.id} article={article} issueNumber={issueNumber} />
              ))}
            </div>
          ) : (
            <div className="art-rows">
              {group.articles.map((article) => (
                <ArticleRow key={article.id} article={article} issueNumber={issueNumber} />
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
