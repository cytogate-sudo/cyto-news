import { Fragment } from "react";
import { PullQuote } from "@/components/PullQuote";
import { TermBox, type Term } from "@/components/TermBox";

// Makale metni boş satırlarla ayrılmış paragraflardan oluşur. Pull-quote ve
// terim kutusu, mockup'taki editorial düzene benzer şekilde metnin ortasına
// yerleştirilir. İçerik gerçek Sayı 1 metinleriyle doldurulurken (Faz 4)
// zengin metin/markdown ihtiyacı çıkarsa bu bileşen genişletilebilir.
export function ArticleBody({
  content,
  pullQuote,
  terms,
}: {
  content: string;
  pullQuote?: string | null;
  terms?: Term[] | null;
}) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const quoteAfter = pullQuote ? Math.max(1, Math.floor(paragraphs.length / 2) - 1) : -1;
  const termsAfter = terms && terms.length > 0 ? quoteAfter + 1 : -1;

  return (
    <div className="article-body">
      {paragraphs.map((paragraph, index) => (
        <Fragment key={index}>
          <p>{paragraph}</p>
          {index === quoteAfter && pullQuote ? <PullQuote>{pullQuote}</PullQuote> : null}
          {index === termsAfter && terms ? <TermBox terms={terms} /> : null}
        </Fragment>
      ))}
    </div>
  );
}
