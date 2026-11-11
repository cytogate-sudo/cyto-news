export type ArticleSource = { label: string; url: string | null };

// Yazının en altındaki kaynakça. Bağlantısı girilmiş kaynak tıklanabilir,
// girilmemiş olan düz metin olarak listelenir. Hiç kaynak yoksa blok
// tamamen gizlenir — kapak görselindeki gibi boş bir çerçeve kalmaz.
export function SourceList({
  sources,
  title = "İlgili Çalışmalar",
}: {
  sources?: ArticleSource[] | null;
  title?: string;
}) {
  const items = (sources ?? []).filter((source) => source.label.trim());
  if (items.length === 0) return null;

  return (
    <aside className="source-list">
      <div className="kicker">{title}</div>
      <ol>
        {items.map((source, index) => (
          <li key={index}>
            {source.url ? (
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
            ) : (
              source.label
            )}
          </li>
        ))}
      </ol>
    </aside>
  );
}
