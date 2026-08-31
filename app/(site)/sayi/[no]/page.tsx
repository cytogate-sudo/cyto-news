import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Masthead } from "@/components/Masthead";
import { LeadStory } from "@/components/LeadStory";
import { ArticleCard } from "@/components/ArticleCard";
import { getIssueByNumber, getArticlesByIssueId } from "@/lib/gazete";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 3600;

type Params = { no: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { no } = await params;
  const issue = await getIssueByNumber(Number(no));
  return { title: issue ? `${issue.title} — Cytogate Bilim Gazetesi` : "Sayı bulunamadı" };
}

export default async function IssuePage({ params }: { params: Promise<Params> }) {
  const { no } = await params;
  const issueNumber = Number(no);
  const issue = await getIssueByNumber(issueNumber);
  if (!issue) notFound();

  const [articles, settings] = await Promise.all([
    getArticlesByIssueId(issue.id),
    getSiteSettings(),
  ]);
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
    </>
  );
}
