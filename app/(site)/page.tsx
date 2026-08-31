import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { LeadStory } from "@/components/LeadStory";
import { ArticleCard } from "@/components/ArticleCard";
import { getLatestIssue, getArticlesByIssueId } from "@/lib/gazete";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 3600;

export default async function HomePage() {
  const [issue, settings] = await Promise.all([getLatestIssue(), getSiteSettings()]);
  const articles = issue ? await getArticlesByIssueId(issue.id) : [];

  if (!issue) {
    return (
      <>
        <Masthead issue={null} masthead={settings.masthead} />
        <hr className="hairline-thick" />
        <div className="empty-state">
          Henüz yayınlanmış bir sayı yok. İlk sayı yakında burada olacak.
        </div>
      </>
    );
  }

  const featured = articles.find((a) => a.is_featured) ?? articles[0] ?? null;
  const rest = articles.filter((a) => a.id !== featured?.id);

  return (
    <>
      <Masthead issue={issue} masthead={settings.masthead} />
      <hr className="hairline-thick" />

      {featured ? <LeadStory article={featured} issueNumber={issue.issue_number} /> : null}

      <div className="section-title">
        <h2>Bu sayıda</h2>
        <div className="rule" />
      </div>

      {rest.length > 0 ? (
        <div className="grid-articles">
          {rest.map((article) => (
            <ArticleCard key={article.id} article={article} issueNumber={issue.issue_number} />
          ))}
        </div>
      ) : (
        <div className="empty-state">Bu sayıda henüz başka makale eklenmedi.</div>
      )}

      <div className="section-title">
        <h2>Arşiv</h2>
        <div className="rule" />
      </div>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 40px" }}>
        <Link href="/sayilar" className="read-link">
          Tüm sayıları gör <span className="arrow">→</span>
        </Link>
      </div>
    </>
  );
}
