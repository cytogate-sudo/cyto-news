import Link from "next/link";
import Image from "next/image";
import {
  coverAspectRatio,
  coverObjectPosition,
  type Article,
  type Issue,
} from "@/lib/gazete";

export function LeadStory({
  article,
  issueNumber,
}: {
  article: Article;
  issueNumber: Issue["issue_number"];
}) {
  // Kapak görseli isteğe bağlı: yoksa boş bir yer tutucu kutu göstermek
  // yerine manşet metni tüm genişliğe yayılır.
  const hasCover = Boolean(article.cover_image_url);

  return (
    <div className={hasCover ? "lead-wrap" : "lead-wrap no-media"}>
      {hasCover ? (
        <div
          className="lead-media"
          style={{ aspectRatio: coverAspectRatio(article.cover_aspect) }}
        >
          <Image
            src={article.cover_image_url as string}
            alt={article.title}
            fill
            style={{
              objectFit: "cover",
              objectPosition: coverObjectPosition(article.cover_position),
            }}
            sizes="(max-width: 860px) 100vw, 50vw"
          />
        </div>
      ) : null}
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
