import { Masthead } from "@/components/Masthead";
import { LeadStory } from "@/components/LeadStory";
import { IssueSections } from "@/components/IssueSections";
import { getLatestIssue, getArticlesByIssueId, getCategories } from "@/lib/gazete";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 3600;

export default async function HomePage() {
  const [issue, settings, categories] = await Promise.all([
    getLatestIssue(),
    getSiteSettings(),
    getCategories(),
  ]);
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

      <IssueSections
        articles={rest}
        categories={categories}
        issueNumber={issue.issue_number}
      />
    </>
  );
}
