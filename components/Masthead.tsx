import type { Issue } from "@/lib/gazete";

function formatIssueDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

export function Masthead({ issue }: { issue: Issue | null }) {
  return (
    <div className="masthead">
      <div className="eyebrow-row">
        <span className="dot" />
        <span className="kicker">Biyoteknolojik Araştırmalar Topluluğu</span>
        <span className="dot" />
      </div>
      <h1 className="masthead-title">CYTOGATE</h1>
      <div className="masthead-sub">Bilim Gazetesi</div>
      <div className="masthead-meta">
        {issue ? (
          <>
            <span>Sayı {issue.issue_number}</span>
            <span>·</span>
            <span>{formatIssueDate(issue.publish_date)}</span>
            <span>·</span>
          </>
        ) : null}
        <span>Gebze Teknik Üniversitesi</span>
      </div>
    </div>
  );
}
