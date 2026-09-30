import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getSiteSettings();
  return { title: `${about.kicker} — Cytogate Bilim Gazetesi` };
}

export default async function AboutPage() {
  const { about } = await getSiteSettings();

  return (
    <div className="article-shell">
      <div className="article-kicker">{about.kicker}</div>
      <h1 className="article-title">{about.title}</h1>

      {/* Tek bir .article-body içinde: giriş metni → kutular → devam metni.
          Böylece ilk paragrafın drop-cap'i yalnızca bir kez uygulanır. */}
      <div className="article-body" style={{ marginTop: 28 }}>
        {about.intro ? <ReactMarkdown>{about.intro}</ReactMarkdown> : null}

        {about.highlights.map((highlight, index) => (
          <div className="term-box" key={`${highlight.title}-${index}`}>
            <div className="kicker">{highlight.title}</div>
            <p style={{ margin: 0 }}>{highlight.text}</p>
          </div>
        ))}

        {about.outro ? <ReactMarkdown>{about.outro}</ReactMarkdown> : null}
      </div>
    </div>
  );
}
