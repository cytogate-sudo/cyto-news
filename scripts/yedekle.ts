import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import JSZip from "jszip";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { MEDIA_BUCKET } from "../lib/gazete";

// Kullanım:
//   npm run yedekle                  → yazılar + görseller (~3 MB)
//   npm run yedekle -- --sadece-metin → yalnızca yazılar (~35 KB)
//
// yedekler/yedek-YYYY-AA-GG.zip dosyası üretir. Şifreleme YOK: içerik
// zaten sitede herkese açık, şifre kaybı yedeği çöpe çevirirdi.
// Panel şifresinin özeti (admin_users) bilerek yedeğe ALINMAZ.

type Json = Record<string, unknown>;

const STORAGE_PREFIX = "/storage/v1/object/public/";

function supabaseOrExit() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    console.error(
      "Supabase yapılandırılmamış. .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY olmalı."
    );
    process.exit(1);
  }
  return supabase;
}

/** Bir görsel adresini bucket içindeki yola çevirir; bizim bucket'ımız değilse null. */
function objectPathOf(url: string): string | null {
  const at = url.indexOf(STORAGE_PREFIX);
  if (at === -1) return null;
  const rest = url.slice(at + STORAGE_PREFIX.length);
  if (!rest.startsWith(`${MEDIA_BUCKET}/`)) return null;
  return decodeURIComponent(rest.slice(MEDIA_BUCKET.length + 1));
}

/** Kapak görselleri + metin içine gömülü ![](...) görselleri. */
function collectImageUrls(articles: Json[], issues: Json[]): string[] {
  const urls = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value.startsWith("http")) urls.add(value);
  };

  for (const issue of issues) add(issue.cover_image_url);
  for (const article of articles) {
    add(article.cover_image_url);
    const content = article.content;
    if (typeof content === "string") {
      for (const match of content.matchAll(/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g)) {
        add(match[1]);
      }
    }
  }
  return [...urls];
}

async function main() {
  const sadeceMetin = process.argv.includes("--sadece-metin");
  const supabase = supabaseOrExit();

  console.log("İçerik okunuyor...");
  const tablolar = ["issues", "articles", "categories", "site_settings"] as const;
  const icerik: Record<string, Json[]> = {};
  for (const tablo of tablolar) {
    const { data, error } = await supabase.from(tablo).select("*");
    if (error) throw new Error(`${tablo}: ${error.message}`);
    icerik[tablo] = (data ?? []) as Json[];
    console.log(`  ${tablo.padEnd(14)} ${icerik[tablo].length} kayıt`);
  }

  const zip = new JSZip();
  zip.file(
    "icerik.json",
    JSON.stringify(
      {
        surum: 1,
        alindi: new Date().toISOString(),
        gorseller_dahil: !sadeceMetin,
        ...icerik,
      },
      null,
      2
    )
  );

  let gorselSayisi = 0;
  let gorselBoyut = 0;
  if (!sadeceMetin) {
    const urls = collectImageUrls(icerik.articles, icerik.issues);
    console.log(`\n${urls.length} görsel indiriliyor...`);
    for (const url of urls) {
      const path = objectPathOf(url);
      if (!path) {
        console.warn(`  ! bizim depomuzda değil, atlandı: ${url}`);
        continue;
      }
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`  ! indirilemedi (${response.status}): ${path}`);
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      zip.file(`gorseller/${path}`, bytes);
      gorselSayisi++;
      gorselBoyut += bytes.length;
    }
    console.log(`  ${gorselSayisi} görsel, ${(gorselBoyut / 1024 / 1024).toFixed(1)} MB`);
  }

  zip.file("OKUBENI.txt", okubeni(icerik, gorselSayisi, sadeceMetin));

  // Metin çok iyi sıkışır, görseller (webp) zaten sıkışık — onları olduğu
  // gibi saklamak hem daha hızlı hem de dosyayı büyütmüyor.
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  const klasor = join(process.cwd(), "yedekler");
  mkdirSync(klasor, { recursive: true });
  const bugun = new Date().toISOString().slice(0, 10);
  const ad = sadeceMetin ? `yedek-${bugun}-metin.zip` : `yedek-${bugun}.zip`;
  const tamYol = join(klasor, ad);
  writeFileSync(tamYol, buffer);

  console.log(`\nBitti: ${tamYol}`);
  console.log(`Boyut: ${(buffer.length / 1024).toFixed(0)} KB`);
}

function okubeni(icerik: Record<string, Json[]>, gorselSayisi: number, sadeceMetin: boolean) {
  return [
    "CYTOGATE BILIM GAZETESI - ICERIK YEDEGI",
    `Alindi: ${new Date().toLocaleString("tr-TR")}`,
    "",
    "ICINDEKILER",
    `  icerik.json  : ${icerik.issues.length} sayi, ${icerik.articles.length} yazi, ` +
      `${icerik.categories.length} kategori, ${icerik.site_settings.length} ayar kaydi`,
    sadeceMetin
      ? "  gorseller/   : YOK (--sadece-metin ile alinmis)"
      : `  gorseller/   : ${gorselSayisi} gorsel, site adresindeki klasor yapisiyla`,
    "",
    "GERI YUKLEME",
    "  Proje klasorunde:",
    "      npm run geri-yukle -- yedekler/<bu-dosya>.zip",
    "",
    "  Geri yukleme HICBIR SEYIN UZERINE YAZMAZ. Yedekteki her sayiyi",
    "  TASLAK olarak yeniden olusturur; mevcut sayilar oldugu gibi kalir.",
    "  Yukledikten sonra panelden gozden gecirip yayinlarsin.",
    "",
    "ARAC YOKSA (elle kurtarma)",
    "  icerik.json duz metindir, herhangi bir metin editoruyle acilir.",
    "  Yazilarin tamami 'articles' listesinde, metinleri 'content'",
    "  alanindadir (Markdown). Gorseller gorseller/ klasorunde durur.",
    "",
    "NOT",
    "  Panel kullanici adi/sifresi bu yedege BILEREK dahil edilmemistir.",
    "  Dosya sifrelenmemistir: icerigin tamami zaten sitede yayindadir.",
  ].join("\n");
}

main().catch((error) => {
  console.error("\nYedekleme başarısız:", error instanceof Error ? error.message : error);
  process.exit(1);
});
