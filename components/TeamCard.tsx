import Link from "next/link";
import type { Article } from "@/lib/gazete";

/** Takımlar bölümünün koyu renkli kartı. */
export function TeamCard({
  article,
  issueNumber,
}: {
  article: Article;
  issueNumber: number;
}) {
  return (
    <Link href={`/sayi/${issueNumber}/${article.slug}`} className="team-card">
      <h3>{article.title}</h3>
      {article.summary ? <p>{article.summary}</p> : null}
      <span className="team-card-link">
        Devamı oku <span className="arrow">→</span>
      </span>
    </Link>
  );
}
