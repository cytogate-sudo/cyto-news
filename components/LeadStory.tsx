import Link from "next/link";
import Image from "next/image";
import type { Article, Issue } from "@/lib/gazete";

export function LeadStory({
  article,
  issueNumber,
}: {
  article: Article;
  issueNumber: Issue["issue_number"];
}) {
  return (
    <div className="lead-wrap">
      <div className="lead-media">
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 860px) 100vw, 50vw"
          />
        ) : (
          <span>Kapak Görseli</span>
        )}
      </div>
      <div>
        <div className="kicker">{article.kicker ?? article.category?.name}</div>
        <h2 className="lead-headline">{article.title}</h2>
        {article.summary ? <p className="lead-dek">{article.summary}</p> : null}
        <div className="byline">
          {[article.author_name, article.reading_minutes ? `${article.reading_minutes} dakikalık okuma` : null]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <Link href={`/sayi/${issueNumber}/${article.slug}`} className="read-link">
          Yazının tamamı <span className="arrow">→</span>
        </Link>
      </div>
    </div>
  );
}
