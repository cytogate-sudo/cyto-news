import Link from "next/link";
import type { Issue } from "@/lib/gazete";
import type { MastheadSettings } from "@/lib/settings";

function formatIssueDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

export function Masthead({
  issue,
  masthead,
}: {
  issue: Issue | null;
  masthead: MastheadSettings;
}) {
  return (
    <div className="masthead">
      <div className="eyebrow-row">
        <span className="dot" />
        <span className="kicker">{masthead.eyebrow}</span>
        <span className="dot" />
      </div>
      <h1 className="masthead-title">
        <Link href="/">{masthead.title}</Link>
      </h1>
      <div className="masthead-sub">{masthead.subtitle}</div>
      <div className="masthead-meta">
        {issue ? (
          <>
            <span>Sayı {issue.issue_number}</span>
            <span>·</span>
            <span>{formatIssueDate(issue.publish_date)}</span>
            <span>·</span>
          </>
        ) : null}
        <span>{masthead.university}</span>
      </div>
    </div>
  );
}
