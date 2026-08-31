"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImageAction } from "@/app/admin/actions";

/**
 * Kapak görseli alanı: dosya seç → sunucuda WebP'e çevrilip Storage'a
 * yüklenir → dönen URL hem önizlemede gösterilir hem gizli input'a yazılır
 * (böylece dıştaki formla birlikte kaydedilir).
 */
export function ImageUploadField({
  name,
  folder,
  defaultUrl,
  aspectRatio = "16 / 9",
  objectPosition = "center",
  onChange,
}: {
  name?: string;
  folder: string;
  defaultUrl?: string | null;
  aspectRatio?: string;
  objectPosition?: string;
  onChange?: (url: string | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(defaultUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function setBoth(next: string | null) {
    setUrl(next);
    onChange?.(next);
  }

  function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", folder);
      const result = await uploadImageAction(formData);
      if (result.error) setError(result.error);
      else if (result.url) setBoth(result.url);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div>
      {name ? <input type="hidden" name={name} value={url ?? ""} /> : null}
      <div className="cover-preview" style={{ aspectRatio }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Kapak görseli" style={{ objectPosition }} />
        ) : (
          <span>{pending ? "Yükleniyor..." : "Görsel yok"}</span>
        )}
      </div>
      {error ? <div className="admin-alert error" style={{ marginTop: 8 }}>{error}</div> : null}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="btn small secondary"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
        >
          {pending ? "Yükleniyor..." : url ? "Görseli Değiştir" : "Görsel Yükle"}
        </button>
        {url ? (
          <button
            type="button"
            className="btn small danger"
            disabled={pending}
            onClick={() => setBoth(null)}
          >
            Kaldır
          </button>
        ) : null}
      </div>
    </div>
  );
}
