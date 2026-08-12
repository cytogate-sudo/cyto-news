import Link from "next/link";
import type { Metadata } from "next";
import { getAllIssues } from "@/lib/gazete";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sayı Arşivi — Cytogate Bilim Gazetesi",
};

function formatIssueDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

export default async function IssuesPage() {
  const issues = await getAllIssues();

  return (
    <>
      <div className="section-title" style={{ marginTop: 40 }}>
        <h2>Sayı Arşivi</h2>
        <div className="rule" />
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">Henüz yayınlanmış bir sayı yok.</div>
      ) : (
        <div className="grid-articles">
          {issues.map((issue) => (
            <Link key={issue.id} href={`/sayi/${issue.issue_number}`} className="card">
              <div className="kicker">Sayı {issue.issue_number}</div>
              <h3>{issue.title}</h3>
              {issue.description ? <p>{issue.description}</p> : null}
              <div className="byline">{formatIssueDate(issue.publish_date)}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
