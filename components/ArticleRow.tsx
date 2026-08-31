import Link from "next/link";
import Image from "next/image";
import { coverObjectPosition, type Article } from "@/lib/gazete";

/**
 * Bölüm listelerindeki yatay yazı satırı: solda küçük kapak görseli,
 * sağda kicker / başlık / özet / künye.
 */
export function ArticleRow({
  article,
  issueNumber,
}: {
  article: Article;
  issueNumber: number;
}) {
  return (
    <Link
      href={`/sayi/${issueNumber}/${article.slug}`}
      className={article.cover_image_url ? "art-row" : "art-row no-media"}
    >
      {article.cover_image_url ? (
        <div className="art-row-media">
          <Image
            src={article.cover_image_url}
            alt=""
            fill
            sizes="150px"
            style={{
              objectFit: "cover",
              objectPosition: coverObjectPosition(article.cover_position),
            }}
          />
        </div>
      ) : null}
      <div className="art-row-body">
        <div className="kicker">{article.kicker ?? article.category?.name}</div>
        <h3>{article.title}</h3>
        {article.summary ? <p>{article.summary}</p> : null}
        {article.author_name || article.reading_minutes ? (
          <div className="byline">
            {[
              article.author_name,
              article.reading_minutes ? `${article.reading_minutes} dakikalık okuma` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
