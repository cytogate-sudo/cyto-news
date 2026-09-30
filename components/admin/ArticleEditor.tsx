"use client";

import { useRef, useState, useTransition } from "react";
import {
  saveArticleAction,
  uploadImageAction,
  type ArticlePayload,
} from "@/app/admin/actions";
import { coverAspectRatio, coverObjectPosition, type Article, type Category } from "@/lib/gazete";
import { ArticleBody } from "@/components/ArticleBody";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type Term = { term: string; definition: string };

export function ArticleEditor({
  article,
  categories,
}: {
  article: Article;
  categories: Category[];
}) {
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [kicker, setKicker] = useState(article.kicker ?? "");
  const [categoryId, setCategoryId] = useState(article.category_id ?? "");
  const [summary, setSummary] = useState(article.summary ?? "");
  const [content, setContent] = useState(article.content);
  const [pullQuote, setPullQuote] = useState(article.pull_quote ?? "");
  const [terms, setTerms] = useState<Term[]>(article.terms ?? []);
  const [authorName, setAuthorName] = useState(article.author_name ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(article.cover_image_url);
  const [coverPosition, setCoverPosition] = useState(article.cover_position ?? "center");
  const [coverAspect, setCoverAspect] = useState(article.cover_aspect ?? "wide");
  const [isFeatured, setIsFeatured] = useState(article.is_featured);
  const [readingMinutes, setReadingMinutes] = useState(
    article.reading_minutes ? String(article.reading_minutes) : ""
  );
  const [status, setStatus] = useState<"draft" | "published">(article.status);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploadingInline, setUploadingInline] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const inlineFileRef = useRef<HTMLInputElement>(null);

  function save() {
    const payload: ArticlePayload = {
      title,
      slug,
      kicker: kicker || null,
      category_id: categoryId || null,
      summary: summary || null,
      content,
      pull_quote: pullQuote || null,
      terms: terms.filter((t) => t.term.trim() && t.definition.trim()),
      author_name: authorName || null,
      cover_image_url: coverUrl,
      cover_position: coverPosition,
      cover_aspect: coverAspect,
      is_featured: isFeatured,
      reading_minutes: readingMinutes ? Number(readingMinutes) : null,
      status,
    };
    startTransition(async () => {
      const result = await saveArticleAction(article.id, payload);
      if (result.error) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: result.success ?? "Kaydedildi." });
    });
  }

  async function insertInlineImage(file: File | null) {
    if (!file) return;
    setUploadingInline(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", "inline");
      const result = await uploadImageAction(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result.url) {
        const textarea = contentRef.current;
        const snippet = `![Görsel açıklaması](${result.url})`;
        if (textarea) {
          const pos = textarea.selectionStart ?? content.length;
          setContent(`${content.slice(0, pos)}\n\n${snippet}\n\n${content.slice(pos)}`);
        } else {
          setContent(`${content}\n\n${snippet}\n`);
        }
      }
    } finally {
      setUploadingInline(false);
      if (inlineFileRef.current) inlineFileRef.current.value = "";
    }
  }

  function updateTerm(index: number, patch: Partial<Term>) {
    setTerms(terms.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  return (
    <div className="editor-layout">
      {/* -------- Sol: form -------- */}
      <div>
        <div className="admin-card">
          <h2>Makale Bilgileri</h2>

          <div className="af-field">
            <label htmlFor="ae-title">Başlık</label>
            <input
              id="ae-title"
              className="af-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="admin-grid-2">
            <div className="af-field">
              <label htmlFor="ae-slug">Slug (adres)</label>
              <input
                id="ae-slug"
                className="af-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="af-field">
              <label htmlFor="ae-kicker">Kicker (başlık üstü etiket)</label>
              <input
                id="ae-kicker"
                className="af-input"
                value={kicker}
                placeholder="örn. Nobel Tıp Ödülü · Kapak Haberi"
                onChange={(e) => setKicker(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="af-field">
              <label htmlFor="ae-category">Kategori</label>
              <select
                id="ae-category"
                className="af-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— Kategorisiz —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="af-field">
              <label htmlFor="ae-author">Yazar</label>
              <input
                id="ae-author"
                className="af-input"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="af-field">
              <label htmlFor="ae-minutes">Okuma Süresi (dakika)</label>
              <input
                id="ae-minutes"
                className="af-input"
                type="number"
                min={1}
                value={readingMinutes}
                onChange={(e) => setReadingMinutes(e.target.value)}
              />
            </div>
            <div className="af-field">
              <label htmlFor="ae-status">Durum</label>
              <select
                id="ae-status"
                className="af-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              >
                <option value="draft">Taslak (sitede görünmez)</option>
                <option value="published">Yayında</option>
              </select>
            </div>
          </div>

          <label className="af-check">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Manşet makalesi yap (ana sayfada büyük gösterilir)
          </label>

          <div className="af-field" style={{ marginTop: 12 }}>
            <label htmlFor="ae-summary">Özet (kartlarda ve manşette görünür)</label>
            <textarea
              id="ae-summary"
              className="af-textarea"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-card">
          <h2>Kapak Görseli (isteğe bağlı)</h2>
          <p className="admin-note" style={{ marginTop: -6, marginBottom: 12 }}>
            Görsel eklemek zorunlu değil. Boş bırakırsan yazı sitede görselsiz yayınlanır;
            boş bir çerçeve görünmez, metin doğrudan başlığın altından başlar.
          </p>
          <ImageUploadField
            folder={`articles/${slug || article.id}`}
            defaultUrl={coverUrl}
            aspectRatio={coverAspectRatio(coverAspect)}
            objectPosition={coverObjectPosition(coverPosition)}
            onChange={setCoverUrl}
          />
          <div className="admin-grid-2" style={{ marginTop: 12 }}>
            <div className="af-field">
              <label htmlFor="ae-aspect">Görsel Oranı</label>
              <select
                id="ae-aspect"
                className="af-select"
                value={coverAspect}
                onChange={(e) => setCoverAspect(e.target.value)}
              >
                <option value="wide">Geniş (16:9)</option>
                <option value="standard">Standart (4:3)</option>
                <option value="square">Kare (1:1)</option>
                <option value="tall">Dikey (3:4)</option>
              </select>
            </div>
            <div className="af-field">
              <label htmlFor="ae-position">Kadraj</label>
              <select
                id="ae-position"
                className="af-select"
                value={coverPosition}
                onChange={(e) => setCoverPosition(e.target.value)}
              >
                <option value="top">Üstten göster</option>
                <option value="center">Ortala</option>
                <option value="bottom">Alttan göster</option>
              </select>
            </div>
          </div>
          <p className="admin-note">
            Oran makale sayfasındaki çerçeveyi, kadraj görselin hangi kısmının görüneceğini
            belirler — sağdaki önizlemede birebir görürsün.
          </p>
        </div>

        <div className="admin-card">
          <h2>Metin</h2>
          <div className="af-field">
            <label htmlFor="ae-content">
              Markdown destekli: **kalın**, *italik*, ## alt başlık, - liste
            </label>
            <textarea
              id="ae-content"
              ref={contentRef}
              className="af-textarea tall"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <input
            ref={inlineFileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => insertInlineImage(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="btn small secondary"
            disabled={uploadingInline}
            onClick={() => inlineFileRef.current?.click()}
          >
            {uploadingInline ? "Yükleniyor..." : "Metnin İçine Görsel Ekle"}
          </button>
        </div>

        <div className="admin-card">
          <h2>Alıntı ve Terim Köşesi</h2>
          <div className="af-field">
            <label htmlFor="ae-quote">Pull Quote (metnin ortasında büyük alıntı)</label>
            <textarea
              id="ae-quote"
              className="af-textarea"
              style={{ minHeight: 70 }}
              value={pullQuote}
              onChange={(e) => setPullQuote(e.target.value)}
            />
          </div>

          <div className="af-field">
            <label>Terim Köşesi</label>
            {terms.map((term, index) => (
              <div key={index} className="terms-editor-row">
                <input
                  className="af-input"
                  placeholder="Terim"
                  value={term.term}
                  onChange={(e) => updateTerm(index, { term: e.target.value })}
                />
                <input
                  className="af-input"
                  placeholder="Tanım"
                  value={term.definition}
                  onChange={(e) => updateTerm(index, { definition: e.target.value })}
                />
                <button
                  type="button"
                  className="btn small danger"
                  onClick={() => setTerms(terms.filter((_, i) => i !== index))}
                >
                  Sil
                </button>
              </div>
            ))}
            <div>
              <button
                type="button"
                className="btn small secondary"
                onClick={() => setTerms([...terms, { term: "", definition: "" }])}
              >
                + Terim Ekle
              </button>
            </div>
          </div>
        </div>

        <div className="savebar">
          <button type="button" className="btn" onClick={save} disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {message ? (
            <span className={message.type === "error" ? "admin-alert error" : "admin-alert success"} style={{ margin: 0 }}>
              {message.text}
            </span>
          ) : null}
        </div>
      </div>

      {/* -------- Sağ: canlı önizleme -------- */}
      <div className="editor-preview">
        <div className="preview-label">Canlı Önizleme</div>
        <div className="article-kicker">
          {kicker || categories.find((c) => c.id === categoryId)?.name || ""}
        </div>
        <h1 className="article-title">{title}</h1>
        <div className="article-meta">
          {authorName ? <span>{authorName}</span> : null}
          {readingMinutes ? (
            <>
              <span>·</span>
              <span>{readingMinutes} dakikalık okuma</span>
            </>
          ) : null}
        </div>
        {/* Sitedeki davranışın aynısı: görsel yoksa çerçeve de yok */}
        {coverUrl ? (
          <div
            className="article-hero"
            style={{ aspectRatio: coverAspectRatio(coverAspect) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: coverObjectPosition(coverPosition),
              }}
            />
          </div>
        ) : null}
        <ArticleBody
          content={content || "*Metin buraya gelecek...*"}
          pullQuote={pullQuote || null}
          terms={terms.filter((t) => t.term.trim() && t.definition.trim())}
        />
      </div>
    </div>
  );
}
