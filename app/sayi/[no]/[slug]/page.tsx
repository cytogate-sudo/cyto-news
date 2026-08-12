import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { getArticleBySlug } from "@/lib/gazete";

export const revalidate = 3600;

type Params = { no: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { no, slug } = await params;
  const article = await getArticleBySlug(Number(no), slug);
  return { title: article ? `${article.title} — Cytogate Bilim Gazetesi` : "Yazı bulunamadı" };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { no, slug } = await params;
  const article = await getArticleBySlug(Number(no), slug);
  if (!article) notFound();

  return (
    <div className="article-shell">
      <Link href={`/sayi/${no}`} className="back-link">
        ← Sayı {no}&apos;e dön
      </Link>

      <div className="article-kicker">{article.kicker ?? article.category?.name}</div>
      <h1 className="article-title">{article.title}</h1>
      <div className="article-meta">
        {article.author_name ? <span>{article.author_name}</span> : null}
        <span>·</span>
        <span>Sayı {no}</span>
        {article.reading_minutes ? (
          <>
            <span>·</span>
            <span>{article.reading_minutes} dakikalık okuma</span>
          </>
        ) : null}
      </div>

      <div className="article-hero">
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            style={{ objectFit: "cover" }}
            sizes="760px"
          />
        ) : (
          <span>Kapak Görseli</span>
        )}
      </div>

      <ArticleBody
        content={article.content}
        pullQuote={article.pull_quote}
        terms={article.terms}
      />

      <hr className="hairline" style={{ marginTop: 40 }} />
      <div style={{ paddingTop: 18 }}>
        <Link href={`/sayi/${no}`} className="back-link">
          ← Sayı {no}&apos;e dön
        </Link>
      </div>
    </div>
  );
}
