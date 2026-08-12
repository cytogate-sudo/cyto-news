import Link from "next/link";
import type { Article, Issue } from "@/lib/gazete";

export function ArticleCard({
  article,
  issueNumber,
}: {
  article: Article;
  issueNumber: Issue["issue_number"];
}) {
  return (
    <Link href={`/sayi/${issueNumber}/${article.slug}`} className="card">
      <div className="kicker">{article.kicker ?? article.category?.name}</div>
      <h3>{article.title}</h3>
      {article.summary ? <p>{article.summary}</p> : null}
      {article.author_name ? <div className="byline">{article.author_name}</div> : null}
    </Link>
  );
}
