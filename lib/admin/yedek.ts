import JSZip from "jszip";
import { createSupabaseServerClient } from "../supabase/server";
import { MEDIA_BUCKET } from "../gazete";

// Yedek alma ve geri yükleme mantığı. Hem admin panelindeki butonlar hem de
// scripts/yedekle.ts & scripts/geri-yukle.ts bu dosyayı kullanır — iki ayrı
// kopya tutulmasın diye. Burada hiç console.log yok: sonuçlar rapor olarak
// döner, yazdırmayı çağıran taraf yapar.

type Json = Record<string, unknown>;

const STORAGE_PREFIX = "/storage/v1/object/public/";
const TABLOLAR = ["issues", "articles", "categories", "site_settings"] as const;

export type YedekRaporu = {
  dosyaAdi: string;
  buffer: Buffer;
  sayiSayisi: number;
  yaziSayisi: number;
  kategoriSayisi: number;
  gorselSayisi: number;
  gorselBoyut: number;
  uyarilar: string[];
};

export type GeriYuklemeRaporu = {
  alindi: string | null;
  gorsellerDahil: boolean;
  sayilar: { eskiNumara: number; yeniNumara: number; yaziSayisi: number }[];
  eklenenKategoriler: string[];
  yazilanYazi: number;
  gorselDuruyor: number;
  gorselYuklenen: number;
  ayarVar: boolean;
  uyarilar: string[];
};

function supabaseOrThrow() {
  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase yapılandırılmamış.");
  return supabase;
}

/** Görsel adresini bucket içindeki yola çevirir; bizim bucket'ımız değilse null. */
function objectPathOf(url: string): string | null {
  const at = url.indexOf(STORAGE_PREFIX);
  if (at === -1) return null;
  const rest = url.slice(at + STORAGE_PREFIX.length);
  if (!rest.startsWith(`${MEDIA_BUCKET}/`)) return null;
  return decodeURIComponent(rest.slice(MEDIA_BUCKET.length + 1));
}

/** Kapak + metne gömülü ![](...) görselleri. */
function imageUrlsOf(row: Json): string[] {
  const urls: string[] = [];
  if (typeof row.cover_image_url === "string" && row.cover_image_url.startsWith("http")) {
    urls.push(row.cover_image_url);
  }
  if (typeof row.content === "string") {
    for (const m of row.content.matchAll(/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g)) urls.push(m[1]);
  }
  return urls;
}

// ---------------------------------------------------------------- YEDEK AL

export async function yedekOlustur(
  opts: { sadeceMetin?: boolean } = {}
): Promise<YedekRaporu> {
  const supabase = supabaseOrThrow();
  const uyarilar: string[] = [];

  const icerik: Record<string, Json[]> = {};
  for (const tablo of TABLOLAR) {
    const { data, error } = await supabase.from(tablo).select("*");
    if (error) throw new Error(`${tablo}: ${error.message}`);
    icerik[tablo] = (data ?? []) as Json[];
  }

  const zip = new JSZip();
  zip.file(
    "icerik.json",
    JSON.stringify(
      {
        surum: 1,
        alindi: new Date().toISOString(),
        gorseller_dahil: !opts.sadeceMetin,
        ...icerik,
      },
      null,
      2
    )
  );

  let gorselSayisi = 0;
  let gorselBoyut = 0;

  if (!opts.sadeceMetin) {
    const urls = new Set<string>();
    for (const row of [...icerik.articles, ...icerik.issues]) {
      for (const u of imageUrlsOf(row)) urls.add(u);
    }
    for (const url of urls) {
      const path = objectPathOf(url);
      if (!path) {
        uyarilar.push(`Bizim depomuzda değil, atlandı: ${url}`);
        continue;
      }
      const response = await fetch(url);
      if (!response.ok) {
        uyarilar.push(`İndirilemedi (${response.status}): ${path}`);
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      zip.file(`gorseller/${path}`, bytes);
      gorselSayisi++;
      gorselBoyut += bytes.length;
    }
  }

  zip.file(
    "OKUBENI.txt",
    okubeni(icerik, gorselSayisi, Boolean(opts.sadeceMetin))
  );

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  // toISOString UTC verir; Türkiye'de gece yarısından sonra dosya adı bir gün
  // geriden gelirdi. Dosya adındaki tarih kullanıcının gördüğü tarih olmalı.
  const simdi = new Date();
  const bugun = [
    simdi.getFullYear(),
    String(simdi.getMonth() + 1).padStart(2, "0"),
    String(simdi.getDate()).padStart(2, "0"),
  ].join("-");
  return {
    dosyaAdi: opts.sadeceMetin ? `yedek-${bugun}-metin.zip` : `yedek-${bugun}.zip`,
    buffer,
    sayiSayisi: icerik.issues.length,
    yaziSayisi: icerik.articles.length,
    kategoriSayisi: icerik.categories.length,
    gorselSayisi,
    gorselBoyut,
    uyarilar,
  };
}

// ----------------------------------------------------------- GERİ YÜKLEME

/**
 * Yedekteki her sayıyı TASLAK olarak yeniden oluşturur. Hiçbir şeyin üzerine
 * yazmaz: sayı numarası doluysa boş olan ilk numara kullanılır, mevcut
 * yazılara ve ayarlara dokunulmaz. `deneme` true ise hiçbir yazma yapılmaz.
 */
export async function yedekGeriYukle(
  zipBytes: Buffer | ArrayBuffer | Uint8Array,
  opts: { deneme: boolean }
): Promise<GeriYuklemeRaporu> {
  const { deneme } = opts;
  const uyarilar: string[] = [];

  const zip = await JSZip.loadAsync(zipBytes);
  const icerikDosyasi = zip.file("icerik.json");
  if (!icerikDosyasi) {
    throw new Error("Bu dosya bir Cytogate yedeği değil: içinde icerik.json yok.");
  }

  let yedek: Json;
  try {
    yedek = JSON.parse(await icerikDosyasi.async("string"));
  } catch {
    throw new Error("Yedeğin içeriği okunamadı (icerik.json bozuk).");
  }

  const issues = (yedek.issues ?? []) as Json[];
  const articles = (yedek.articles ?? []) as Json[];
  const categories = (yedek.categories ?? []) as Json[];
  const ayarlar = (yedek.site_settings ?? []) as Json[];

  if (issues.length === 0 && articles.length === 0) {
    throw new Error("Yedek boş görünüyor: içinde hiç sayı veya yazı yok.");
  }

  const supabase = supabaseOrThrow();

  // --- Kategoriler: slug eşleşeni kullan, eksiği oluştur ---
  const { data: mevcutKategoriler, error: katHata } = await supabase
    .from("categories")
    .select("id, slug");
  if (katHata) throw new Error(katHata.message);

  const kategoriIdBySlug = new Map<string, string>(
    (mevcutKategoriler ?? []).map((c) => [c.slug as string, c.id as string])
  );
  const slugByEskiId = new Map<string, string>(
    categories.map((c) => [c.id as string, c.slug as string])
  );

  const eklenenKategoriler: string[] = [];
  for (const kategori of categories) {
    const slug = kategori.slug as string;
    if (kategoriIdBySlug.has(slug)) continue;
    eklenenKategoriler.push(slug);
    if (deneme) {
      kategoriIdBySlug.set(slug, "deneme");
      continue;
    }
    const { data, error } = await supabase
      .from("categories")
      .insert({ slug, name: kategori.name, sort_order: kategori.sort_order ?? 0 })
      .select("id")
      .single();
    if (error) throw new Error(`kategori "${slug}": ${error.message}`);
    kategoriIdBySlug.set(slug, data.id as string);
  }

  // --- Boş sayı numarası bulmak için mevcutları oku ---
  const { data: mevcutSayilar, error: sayiHata } = await supabase
    .from("issues")
    .select("issue_number");
  if (sayiHata) throw new Error(sayiHata.message);
  const doluNumaralar = new Set<number>(
    (mevcutSayilar ?? []).map((i) => i.issue_number as number)
  );

  function bosNumaraBul(tercih: number): number {
    if (!doluNumaralar.has(tercih)) return tercih;
    let n = Math.max(0, ...doluNumaralar) + 1;
    while (doluNumaralar.has(n)) n++;
    return n;
  }

  // --- Görseller: depoda duranı tekrar yükleme, kaybolanı yedekten koy ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const urlCache = new Map<string, string>();
  let gorselDuruyor = 0;
  let gorselYuklenen = 0;

  async function gorselAdresi(eskiUrl: string): Promise<string> {
    const onbellek = urlCache.get(eskiUrl);
    if (onbellek) return onbellek;

    const path = objectPathOf(eskiUrl);
    if (!path) return eskiUrl;

    const herkeseAcik = `${supabaseUrl}${STORAGE_PREFIX}${MEDIA_BUCKET}/${path}`;
    const kontrol = await fetch(herkeseAcik, { method: "HEAD" });
    if (kontrol.ok) {
      gorselDuruyor++;
      urlCache.set(eskiUrl, herkeseAcik);
      return herkeseAcik;
    }

    const dosya = zip.file(`gorseller/${path}`);
    if (!dosya) {
      uyarilar.push(`Görsel ne depoda ne yedekte: ${path}`);
      urlCache.set(eskiUrl, eskiUrl);
      return eskiUrl;
    }

    gorselYuklenen++;
    if (!deneme) {
      const bytes = await dosya.async("nodebuffer");
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, bytes, { contentType: "image/webp", upsert: false });
      if (error) uyarilar.push(`Yüklenemedi (${path}): ${error.message}`);
    }
    urlCache.set(eskiUrl, herkeseAcik);
    return herkeseAcik;
  }

  async function adresleriDuzelt(article: Json): Promise<Json> {
    const kopya: Json = { ...article };
    for (const eski of imageUrlsOf(article)) {
      const yeni = await gorselAdresi(eski);
      if (yeni === eski) continue;
      if (kopya.cover_image_url === eski) kopya.cover_image_url = yeni;
      if (typeof kopya.content === "string") kopya.content = kopya.content.split(eski).join(yeni);
    }
    return kopya;
  }

  // --- Sayılar ve yazılar ---
  const sayilar: GeriYuklemeRaporu["sayilar"] = [];
  let yazilanYazi = 0;

  for (const sayi of issues) {
    const eskiNumara = sayi.issue_number as number;
    const yeniNumara = bosNumaraBul(eskiNumara);
    doluNumaralar.add(yeniNumara);

    const kapak = sayi.cover_image_url
      ? await gorselAdresi(sayi.cover_image_url as string)
      : null;

    let yeniSayiId = "deneme";
    if (!deneme) {
      const { data, error } = await supabase
        .from("issues")
        .insert({
          issue_number: yeniNumara,
          title: sayi.title,
          description: sayi.description ?? null,
          cover_image_url: kapak,
          publish_date: sayi.publish_date,
          status: "draft", // gözden geçirilmeden yayına çıkmasın
        })
        .select("id")
        .single();
      if (error) throw new Error(`sayı ${yeniNumara}: ${error.message}`);
      yeniSayiId = data.id as string;
    }

    const sayininYazilari = articles.filter((a) => a.issue_id === sayi.id);
    for (const yazi of sayininYazilari) {
      const duzeltilmis = await adresleriDuzelt(yazi);
      const eskiKategoriId = yazi.category_id as string | null;
      const slug = eskiKategoriId ? slugByEskiId.get(eskiKategoriId) : undefined;

      if (deneme) {
        yazilanYazi++;
        continue;
      }

      // Yeni satır kendi kimliğini/zaman damgalarını alsın diye bunlar ayıklanıyor.
      // Kalanı olduğu gibi aktarılıyor: ileride eklenecek sütunlar da yedekten döner.
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const {
        id: _id,
        issue_id: _issueId,
        category_id: _categoryId,
        created_at: _createdAt,
        updated_at: _updatedAt,
        published_at: _publishedAt,
        ...alanlar
      } = duzeltilmis;
      /* eslint-enable @typescript-eslint/no-unused-vars */

      const { error } = await supabase.from("articles").insert({
        ...alanlar,
        issue_id: yeniSayiId,
        category_id: slug ? (kategoriIdBySlug.get(slug) ?? null) : null,
        status: "draft",
        published_at: null,
      });
      if (error) {
        uyarilar.push(`"${yazi.slug}" yazılamadı: ${error.message}`);
        continue;
      }
      yazilanYazi++;
    }

    sayilar.push({ eskiNumara, yeniNumara, yaziSayisi: sayininYazilari.length });
  }

  return {
    alindi: typeof yedek.alindi === "string" ? yedek.alindi : null,
    gorsellerDahil: yedek.gorseller_dahil !== false,
    sayilar,
    eklenenKategoriler,
    yazilanYazi,
    gorselDuruyor,
    gorselYuklenen,
    ayarVar: ayarlar.length > 0,
    uyarilar,
  };
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
      ? "  gorseller/   : YOK (yalnizca metin yedegi)"
      : `  gorseller/   : ${gorselSayisi} gorsel, site adresindeki klasor yapisiyla`,
    "",
    "GERI YUKLEME",
    "  Yonetim panelinde Ayarlar > Yedekleme bolumunden bu dosyayi yukle.",
    "  Alternatif olarak proje klasorunde:",
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
