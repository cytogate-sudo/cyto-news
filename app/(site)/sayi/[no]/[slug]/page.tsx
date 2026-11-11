import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleRow } from "@/components/ArticleRow";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ShareButtons } from "@/components/ShareButtons";
import { SourceList } from "@/components/SourceList";
import {
  coverAspectRatio,
  coverObjectPosition,
  getAdjacentArticles,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/gazete";

export const revalidate = 3600;

type Params = { no: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { no, slug } = await params;
  const article = await getArticleBySlug(Number(no), slug);
  if (!article) return { title: "Yazı bulunamadı" };

  const title = `${article.title} — Cytogate Bilim Gazetesi`;
  return {
    title,
    description: article.summary ?? undefined,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary ?? undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { no, slug } = await params;
  const article = await getArticleBySlug(Number(no), slug);
  if (!article) notFound();

  const [related, adjacent] = await Promise.all([
    getRelatedArticles(article.category_id, article.id),
    getAdjacentArticles(article.issue_id, article.sort_order),
  ]);

  const issueNumber = Number(no);

  return (
    <>
      <ReadingProgress />
      <div className="article-shell">
        <Link href={`/sayi/${no}`} className="back-link">
          ← Sayı {no}&apos;e dön
        </Link>

        <div className="article-kicker">{article.kicker ?? article.category?.name}</div>
        <h1 className="article-title">{article.title}</h1>
        <div className="article-meta">
          {/* Yazar yoksa ayraç da yazılmasın (başta öksüz "·" kalmasın) */}
          {article.author_name ? (
            <>
              <span>{article.author_name}</span>
              <span>·</span>
            </>
          ) : null}
          <span>Sayı {no}</span>
          {article.reading_minutes ? (
            <>
              <span>·</span>
              <span>{article.reading_minutes} dakikalık okuma</span>
            </>
          ) : null}
        </div>

        {/* Kapak görseli isteğe bağlı — yoksa başlıktan doğrudan metne geçilir */}
        {article.cover_image_url ? (
          <div
            className="article-hero"
            style={{ aspectRatio: coverAspectRatio(article.cover_aspect) }}
          >
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              style={{
                objectFit: "cover",
                objectPosition: coverObjectPosition(article.cover_position),
              }}
              sizes="760px"
            />
          </div>
        ) : null}

        <ArticleBody
          content={article.content}
          pullQuote={article.pull_quote}
          terms={article.terms}
        />

        <SourceList sources={article.sources} />

        <hr className="hairline" style={{ marginTop: 40 }} />
        <ShareButtons title={article.title} />

        {adjacent.previous || adjacent.next ? (
          <nav className="adjacent-nav">
            {adjacent.previous ? (
              <Link
                href={`/sayi/${issueNumber}/${adjacent.previous.slug}`}
                className="adjacent-link"
              >
                <span className="kicker">← Önceki yazı</span>
                <span className="adjacent-title">{adjacent.previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {adjacent.next ? (
              <Link
                href={`/sayi/${issueNumber}/${adjacent.next.slug}`}
                className="adjacent-link is-next"
              >
                <span className="kicker">Sonraki yazı →</span>
                <span className="adjacent-title">{adjacent.next.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}

        {related.length > 0 ? (
          <section className="related-block">
            <div className="section-title">
              <h2>{article.category?.name ?? "Bu köşeden"}</h2>
              <div className="rule" />
            </div>
            <div className="art-rows">
              {related.map((item) => (
                <ArticleRow
                  key={item.id}
                  article={item}
                  issueNumber={item.issue?.issue_number ?? issueNumber}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div style={{ paddingTop: 26 }}>
          <Link href={`/sayi/${no}`} className="back-link">
            ← Sayı {no}&apos;e dön
          </Link>
        </div>
      </div>
    </>
  );
}
