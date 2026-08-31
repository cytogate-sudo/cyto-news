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
    <div className="page-head-wrap">
      <div className="page-head">
        <div className="kicker">Arşiv</div>
        <h1>Tüm Sayılar</h1>
        <p className="page-head-meta">
          {issues.length > 0 ? `${issues.length} sayı` : "Henüz sayı yok"}
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">Henüz yayınlanmış bir sayı yok.</div>
      ) : (
        <div className="art-rows">
          {issues.map((issue) => (
            <Link key={issue.id} href={`/sayi/${issue.issue_number}`} className="art-row">
              <div className="art-row-media issue-media">
                <span>Sayı {issue.issue_number}</span>
              </div>
              <div className="art-row-body">
                <div className="kicker">{formatIssueDate(issue.publish_date)}</div>
                <h3>{issue.title}</h3>
                {issue.description ? <p>{issue.description}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
