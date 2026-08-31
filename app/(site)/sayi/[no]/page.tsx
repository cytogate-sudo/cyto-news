import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Masthead } from "@/components/Masthead";
import { LeadStory } from "@/components/LeadStory";
import { IssueSections } from "@/components/IssueSections";
import { getIssueByNumber, getArticlesByIssueId, getCategories } from "@/lib/gazete";
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

  const [articles, settings, categories] = await Promise.all([
    getArticlesByIssueId(issue.id),
    getSiteSettings(),
    getCategories(),
  ]);
  const featured = articles.find((a) => a.is_featured) ?? articles[0] ?? null;
  const rest = articles.filter((a) => a.id !== featured?.id);

  return (
    <>
      <Masthead issue={issue} masthead={settings.masthead} />
      <hr className="hairline-thick" />

      {featured ? <LeadStory article={featured} issueNumber={issue.issue_number} /> : null}

      <IssueSections
        articles={rest}
        categories={categories}
        issueNumber={issue.issue_number}
      />
    </>
  );
}
