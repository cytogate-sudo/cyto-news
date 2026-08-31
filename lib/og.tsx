import type { ReactElement } from "react";

// Paylaşım kartlarının ortak çerçevesi. Satori yalnızca flexbox ve CSS'in
// bir alt kümesini destekler (grid yok), bu yüzden düzen tamamen flex.
// Renkler tema değişkenlerinden değil sabit değerlerden gelir — OG görseli
// tarayıcıda değil sunucuda üretiliyor, CSS değişkenleri orada yok.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PAPER = "#f1e6cc";
const INK = "#241c14";
const BORDO = "#7a2b28";
const GOLD = "#a9822e";
const MUTED = "#7a6c55";

export function OgFrame({
  kicker,
  title,
  footer,
  titleSize = 68,
}: {
  kicker?: string | null;
  title: string;
  footer?: string | null;
  titleSize?: number;
}): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: PAPER,
        padding: "56px 64px",
        borderTop: `18px solid ${BORDO}`,
      }}
    >
      {/* Üst şerit: gazete adı */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD }} />
        <div
          style={{
            fontSize: 24,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: BORDO,
            fontWeight: 700,
          }}
        >
          Cytogate Bilim Gazetesi
        </div>
      </div>

      {/* Orta: kicker + başlık */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {kicker ? (
          <div
            style={{
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: BORDO,
              marginBottom: 18,
            }}
          >
            {kicker}
          </div>
        ) : null}
        <div
          style={{
            fontSize: titleSize,
            lineHeight: 1.12,
            color: INK,
            fontWeight: 700,
            // Satori'de satır kırpma yok; uzun başlıklar için punto küçültülüyor
            display: "flex",
          }}
        >
          {title}
        </div>
      </div>

      {/* Alt şerit: künye */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `2px solid ${INK}`,
          paddingTop: 20,
          fontSize: 24,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        <div style={{ display: "flex" }}>{footer ?? "Gebze Teknik Üniversitesi"}</div>
        <div style={{ display: "flex" }}>@gtucytogate</div>
      </div>
    </div>
  );
}

/** Uzun başlıklar kartı taşırmasın diye punto uzunluğa göre küçülür. */
export function titleFontSize(title: string): number {
  if (title.length > 110) return 44;
  if (title.length > 80) return 52;
  if (title.length > 55) return 60;
  return 68;
}
