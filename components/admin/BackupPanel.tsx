"use client";

import { useRef, useState, useTransition } from "react";
import {
  inspectBackupAction,
  restoreBackupAction,
  type YedekOnizleme,
} from "@/app/admin/actions";

export function BackupPanel() {
  const [dosya, setDosya] = useState<File | null>(null);
  const [onizleme, setOnizleme] = useState<YedekOnizleme | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const [mesaj, setMesaj] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const dosyaRef = useRef<HTMLInputElement>(null);

  function temizle() {
    setDosya(null);
    setOnizleme(null);
    setYuklendi(false);
    setMesaj(null);
    if (dosyaRef.current) dosyaRef.current.value = "";
  }

  function dosyaSecildi(secilen: File | null) {
    setOnizleme(null);
    setYuklendi(false);
    setMesaj(null);
    setDosya(secilen);
    if (!secilen) return;

    const formData = new FormData();
    formData.set("dosya", secilen);
    startTransition(async () => {
      const sonuc = await inspectBackupAction(formData);
      if (sonuc.error) setMesaj({ type: "error", text: sonuc.error });
      else setOnizleme(sonuc.onizleme ?? null);
    });
  }

  function yukle() {
    if (!dosya) return;
    const formData = new FormData();
    formData.set("dosya", dosya);
    startTransition(async () => {
      const sonuc = await restoreBackupAction(formData);
      if (sonuc.error) {
        setMesaj({ type: "error", text: sonuc.error });
        return;
      }
      setOnizleme(sonuc.onizleme ?? null);
      setYuklendi(true);
      setMesaj({ type: "success", text: sonuc.success ?? "Yüklendi." });
    });
  }

  return (
    <div>
      {mesaj ? (
        <div className={mesaj.type === "error" ? "admin-alert error" : "admin-alert success"}>
          {mesaj.text}
        </div>
      ) : null}

      <h3 className="yedek-baslik">Yedeği İndir</h3>
      <p className="admin-note" style={{ marginTop: 0 }}>
        Tüm sayılar, yazılar, kategoriler ve görseller tek bir zip dosyasına konur. Panel
        şifresi yedeğe dahil edilmez. İndirdiğin dosyayı bilgisayarın dışında bir yerde de
        sakla (Drive, e-posta, harici disk).
      </p>
      <div className="yedek-butonlar">
        <a className="btn" href="/admin/yedek" download>
          Yedeği İndir (görsellerle)
        </a>
        <a className="btn secondary" href="/admin/yedek?sadece-metin=1" download>
          Yalnızca Yazılar
        </a>
      </div>
      <p className="admin-note">
        Görselli yedek birkaç MB tutar ve hazırlanması biraz sürebilir; yalnızca yazılar
        seçeneği birkaç saniyede iner ve çok küçüktür.
      </p>

      <hr className="hairline" style={{ margin: "22px 0" }} />

      <h3 className="yedek-baslik">Yedek Yükle</h3>
      <p className="admin-note" style={{ marginTop: 0 }}>
        Yükleme <strong>hiçbir şeyin üzerine yazmaz</strong>. Yedekteki her sayı yeni bir
        taslak sayı olarak eklenir; mevcut sayılar, yazılar ve ayarlar olduğu gibi kalır.
        Eklenen taslakları gözden geçirip sen yayınlarsın.
      </p>

      <input
        ref={dosyaRef}
        type="file"
        accept=".zip,application/zip"
        className="af-input"
        style={{ maxWidth: 420 }}
        onChange={(e) => dosyaSecildi(e.target.files?.[0] ?? null)}
        disabled={pending}
      />

      {pending && !onizleme ? <p className="admin-note">Dosya inceleniyor...</p> : null}

      {onizleme ? (
        <div className="yedek-ozet">
          <div className="kicker" style={{ marginBottom: 8 }}>
            {yuklendi ? "Yüklendi" : "Yüklenirse ne olacak"}
          </div>
          <p className="admin-note" style={{ marginTop: 0 }}>
            Yedek tarihi:{" "}
            {onizleme.alindi
              ? new Date(onizleme.alindi).toLocaleString("tr-TR")
              : "bilinmiyor"}
            {onizleme.gorsellerDahil ? "" : " · görseller dahil değil"}
          </p>
          <ul className="yedek-liste">
            {onizleme.sayilar.map((s) => (
              <li key={s.yeniNumara}>
                <strong>Sayı {s.yeniNumara}</strong> taslak olarak{" "}
                {yuklendi ? "eklendi" : "eklenecek"} — {s.yaziSayisi} yazı
                {s.yeniNumara === s.eskiNumara
                  ? ""
                  : ` (yedekte ${s.eskiNumara} idi, o numara dolu)`}
              </li>
            ))}
            {onizleme.eklenenKategoriler.map((slug) => (
              <li key={slug}>
                Kategori <strong>{slug}</strong> {yuklendi ? "oluşturuldu" : "oluşturulacak"}
              </li>
            ))}
            <li>
              Görsellerin {onizleme.gorselDuruyor} tanesi zaten depoda,{" "}
              {onizleme.gorselYuklenen} tanesi yedekten{" "}
              {yuklendi ? "yüklendi" : "yüklenecek"}
            </li>
          </ul>

          {onizleme.uyarilar.length > 0 ? (
            <ul className="yedek-liste uyari">
              {onizleme.uyarilar.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          ) : null}

          {onizleme.ayarVar ? (
            <p className="admin-note">
              Tema ve Hakkında ayarları yedekte var ama uygulanmıyor — mevcut ayarlarının
              üzerine yazmamak için.
            </p>
          ) : null}

          <div className="yedek-butonlar" style={{ marginTop: 14 }}>
            {yuklendi ? (
              <button type="button" className="btn secondary" onClick={temizle}>
                Tamam
              </button>
            ) : (
              <>
                <button type="button" className="btn" onClick={yukle} disabled={pending}>
                  {pending ? "Yükleniyor..." : "Taslak Olarak Ekle"}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={temizle}
                  disabled={pending}
                >
                  Vazgeç
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
