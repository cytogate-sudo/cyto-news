"use client";

import { useState, useTransition } from "react";
import { saveAboutAction } from "@/app/admin/actions";
import type { AboutHighlight, AboutSettings } from "@/lib/settings";

export function AboutForm({ current }: { current: AboutSettings }) {
  const [kicker, setKicker] = useState(current.kicker);
  const [title, setTitle] = useState(current.title);
  const [intro, setIntro] = useState(current.intro);
  const [highlights, setHighlights] = useState<AboutHighlight[]>(current.highlights);
  const [outro, setOutro] = useState(current.outro);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function updateHighlight(index: number, patch: Partial<AboutHighlight>) {
    setHighlights(highlights.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  }

  function save() {
    startTransition(async () => {
      const result = await saveAboutAction({ kicker, title, intro, highlights, outro });
      if (result.error) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: result.success ?? "Kaydedildi." });
    });
  }

  return (
    <div>
      {message ? (
        <div className={message.type === "error" ? "admin-alert error" : "admin-alert success"}>
          {message.text}
        </div>
      ) : null}

      <div className="admin-grid-2">
        <div className="af-field">
          <label htmlFor="ab-kicker">Üst Etiket</label>
          <input
            id="ab-kicker"
            className="af-input"
            value={kicker}
            onChange={(e) => setKicker(e.target.value)}
          />
        </div>
        <div className="af-field">
          <label htmlFor="ab-title">Sayfa Başlığı</label>
          <input
            id="ab-title"
            className="af-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>

      <div className="af-field">
        <label htmlFor="ab-intro">
          Giriş Metni — kutuların üstünde görünür (Markdown: **kalın**, - liste)
        </label>
        <textarea
          id="ab-intro"
          className="af-textarea"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
        />
      </div>

      <div className="af-field">
        <label>Çerçeveli Kutular (Misyon, Vizyon gibi)</label>
        {highlights.map((highlight, index) => (
          <div
            key={index}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 4,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                className="af-input"
                placeholder="Kutu başlığı (örn. Misyon)"
                value={highlight.title}
                onChange={(e) => updateHighlight(index, { title: e.target.value })}
              />
              <button
                type="button"
                className="btn small danger"
                onClick={() => setHighlights(highlights.filter((_, i) => i !== index))}
              >
                Sil
              </button>
            </div>
            <textarea
              className="af-textarea"
              style={{ minHeight: 80 }}
              placeholder="Kutu metni"
              value={highlight.text}
              onChange={(e) => updateHighlight(index, { text: e.target.value })}
            />
          </div>
        ))}
        <div>
          <button
            type="button"
            className="btn small secondary"
            onClick={() => setHighlights([...highlights, { title: "", text: "" }])}
          >
            + Kutu Ekle
          </button>
        </div>
      </div>

      <div className="af-field">
        <label htmlFor="ab-outro">Devam Metni — kutuların altında görünür (Markdown)</label>
        <textarea
          id="ab-outro"
          className="af-textarea"
          value={outro}
          onChange={(e) => setOutro(e.target.value)}
        />
      </div>

      <button type="button" className="btn" onClick={save} disabled={pending}>
        {pending ? "Kaydediliyor..." : "Hakkında Sayfasını Kaydet"}
      </button>
      <p className="admin-note">
        Kaydedince sitedeki Hakkında sayfası anında güncellenir.
      </p>
    </div>
  );
}
