import { Fragment } from "react";
import ReactMarkdown from "react-markdown";
import { PullQuote } from "@/components/PullQuote";
import { TermBox, type Term } from "@/components/TermBox";

// Makale metni boş satırlarla ayrılmış bloklardan oluşur (paragraf, ##
// alt başlık, veya bir madde listesi). Her blok react-markdown ile render
// edilir (kalın/italik/liste/başlık desteği), pull-quote ve terim kutusu
// mockup'taki editorial düzene benzer şekilde metnin ortasına yerleştirilir.
export function ArticleBody({
  content,
  pullQuote,
  terms,
}: {
  content: string;
  pullQuote?: string | null;
  terms?: Term[] | null;
}) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const quoteAfter = pullQuote ? Math.max(1, Math.floor(blocks.length / 2) - 1) : -1;
  const termsAfter = terms && terms.length > 0 ? quoteAfter + 1 : -1;

  return (
    <div className="article-body">
      {blocks.map((block, index) => (
        <Fragment key={index}>
          <ReactMarkdown>{block}</ReactMarkdown>
          {index === quoteAfter && pullQuote ? <PullQuote>{pullQuote}</PullQuote> : null}
          {index === termsAfter && terms ? <TermBox terms={terms} /> : null}
        </Fragment>
      ))}
    </div>
  );
}
