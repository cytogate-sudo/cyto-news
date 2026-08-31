"use client";

import { useState } from "react";
import { saveThemeAction } from "@/app/admin/actions";
import { THEME_PRESETS, type ThemeSettings } from "@/lib/settings";

const FIELDS: { key: keyof ThemeSettings; label: string }[] = [
  { key: "paper", label: "Zemin" },
  { key: "paper_card", label: "Kart Zemini" },
  { key: "ink", label: "Ana Metin" },
  { key: "ink_soft", label: "İkincil Metin" },
  { key: "bordo", label: "Vurgu (bordo)" },
  { key: "bordo_deep", label: "Koyu Vurgu" },
  { key: "gold", label: "Altın Detay" },
  { key: "muted", label: "Soluk Metin" },
  { key: "team_card", label: "Takım Kartı Zemini" },
];

export function ThemeForm({ current }: { current: ThemeSettings }) {
  const [theme, setTheme] = useState<ThemeSettings>(current);

  return (
    <form action={saveThemeAction}>
      <div className="af-field">
        <label>Hazır Temalar</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="btn small secondary"
              onClick={() => setTheme(preset.theme)}
              style={{
                background: preset.theme.paper,
                color: preset.theme.ink,
                borderColor: preset.theme.bordo,
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-grid-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="af-field">
            <label htmlFor={`theme-${key}`}>{label}</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                id={`theme-${key}`}
                type="color"
                className="af-color"
                value={theme[key]}
                onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
              />
              <input
                type="text"
                name={key}
                className="af-input"
                value={theme[key]}
                onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                pattern="#[0-9a-fA-F]{6}"
                required
              />
            </div>
          </div>
        ))}
      </div>

      {/* Mini önizleme */}
      <div
        style={{
          background: theme.paper,
          border: `1px solid ${theme.ink}33`,
          borderRadius: 6,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-label), sans-serif",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: theme.bordo,
            fontWeight: 600,
          }}
        >
          Örnek Kicker
        </div>
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 700,
            fontSize: 22,
            color: theme.ink,
          }}
        >
          Başlık böyle görünecek
        </div>
        <div style={{ color: theme.ink_soft, fontSize: 14 }}>
          Gövde metni ve <span style={{ color: theme.muted }}>soluk ayrıntılar</span> —{" "}
          <span style={{ color: theme.gold }}>altın detaylar</span> ile birlikte.
        </div>
        <div
          style={{
            background: theme.paper_card,
            border: `1px solid ${theme.ink}22`,
            borderRadius: 4,
            padding: 10,
            marginTop: 10,
            fontSize: 13,
            color: theme.ink,
          }}
        >
          Kart zemini örneği
        </div>
      </div>

      <button type="submit" className="btn">
        Temayı Kaydet
      </button>
      <p className="admin-note">Kaydedince tüm site bu renklerle yayınlanır.</p>
    </form>
  );
}
