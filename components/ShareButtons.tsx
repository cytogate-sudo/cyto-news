"use client";

import { useEffect, useState } from "react";

/**
 * Yazı sonu paylaşım düğmeleri. Adres, sunucu render'ı ile istemci arasında
 * fark oluşmasın diye mount sonrasında window.location'dan okunur.
 */
export function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setUrl(window.location.href), []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Pano izni yoksa adresi seçilebilir şekilde göster
      window.prompt("Bağlantıyı kopyalayın:", url);
    }
  }

  const shareText = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);

  return (
    <div className="share-row">
      <span className="share-label">Paylaş</span>
      <a
        className="share-btn"
        href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
      <a
        className="share-btn"
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        X
      </a>
      <button type="button" className="share-btn" onClick={copyLink} disabled={!url}>
        {copied ? "Kopyalandı ✓" : "Linki kopyala"}
      </button>
    </div>
  );
}
