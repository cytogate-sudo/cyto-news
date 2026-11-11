import { readFileSync } from "fs";
import { createInterface } from "readline/promises";
import JSZip from "jszip";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { MEDIA_BUCKET } from "../lib/gazete";

// Kullanım:
//   npm run geri-yukle -- yedekler/yedek-2026-11-12.zip
//   npm run geri-yukle -- yedekler/yedek-2026-11-12.zip --deneme   (hiçbir şey yazmaz, ne olacağını gösterir)
//   npm run geri-yukle -- yedekler/yedek-2026-11-12.zip --onayla   (soru sormaz)
//
// HİÇBİR ŞEYİN ÜZERİNE YAZMAZ. Yedekteki her sayıyı TASLAK olarak yeniden
// oluşturur; mevcut sayılar, yazılar ve ayarlar olduğu gibi kalır.
// Sayı numarası doluysa boş olan ilk numara kullanılır.

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

function objectPathOf(url: string): string | null {
  const at = url.indexOf(STORAGE_PREFIX);
  if (at === -1) return null;
  const rest = url.slice(at + STORAGE_PREFIX.length);
  if (!rest.startsWith(`${MEDIA_BUCKET}/`)) return null;
  return decodeURIComponent(rest.slice(MEDIA_BUCKET.length + 1));
}

/** Yazı metnindeki ve kapaktaki tüm görsel adresleri. */
function imageUrlsOf(article: Json): string[] {
  const urls: string[] = [];
  if (typeof article.cover_image_url === "string") urls.push(article.cover_image_url);
  if (typeof article.content === "string") {
    for (const m of article.content.matchAll(/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g)) {
      urls.push(m[1]);
    }
  }
  return urls;
}

async function main() {
  const args = process.argv.slice(2);
  const dosya = args.find((a) => !a.startsWith("--"));
  const deneme = args.includes("--deneme");
  const onayli = args.includes("--onayla") || deneme;

  if (!dosya) {
    console.error("Kullanım: npm run geri-yukle -- yedekler/<dosya>.zip");
    process.exit(1);
  }

  const zip = await JSZip.loadAsync(readFileSync(dosya));
  const icerikDosyasi = zip.file("icerik.json");
  if (!icerikDosyasi) {
    console.error("Bu zip bir Cytogate yedeği değil: içinde icerik.json yok.");
    process.exit(1);
  }
  const yedek = JSON.parse(await icerikDosyasi.async("string"));
  const issues = (yedek.issues ?? []) as Json[];
  const articles = (yedek.articles ?? []) as Json[];
  const categories = (yedek.categories ?? []) as Json[];

  console.log(`Yedek: ${dosya}`);
  console.log(`Alınma tarihi: ${new Date(yedek.alindi).toLocaleString("tr-TR")}`);
  console.log(`İçinde: ${issues.length} sayı, ${articles.length} yazı, ${categories.length} kategori`);
  console.log(
    `Görseller: ${yedek.gorseller_dahil ? "dahil" : "DAHİL DEĞİL (--sadece-metin yedeği)"}`
  );
  console.log("\nYapılacak: her sayı TASLAK olarak yeniden oluşturulacak.");
  console.log("Mevcut hiçbir sayı, yazı veya ayar değiştirilmeyecek.\n");
  if (deneme) {
    console.log("*** DENEME MODU — hiçbir şey yazılmayacak, sadece ne olacağı gösterilecek ***\n");
  }

  if (!onayli) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const cevap = await rl.question("Devam edilsin mi? (evet/hayir): ");
    rl.close();
    if (cevap.trim().toLowerCase() !== "evet") {
      console.log("Vazgeçildi, hiçbir şey yazılmadı.");
      return;
    }
  }

  const supabase = supabaseOrExit();

  // --- Kategoriler: slug eşleşeni kullan, eksik olanı oluştur ---
  const { data: mevcutKategoriler, error: katHata } = await supabase
    .from("categories")
    .select("id, slug");
  if (katHata) throw new Error(katHata.message);

  const kategoriIdBySlug = new Map<string, string>(
    (mevcutKategoriler ?? []).map((c) => [c.slug as string, c.id as string])
  );
  // Yedekteki kategori id'sinden slug'a
  const slugByEskiId = new Map<string, string>(
    categories.map((c) => [c.id as string, c.slug as string])
  );

  for (const kategori of categories) {
    const slug = kategori.slug as string;
    if (kategoriIdBySlug.has(slug)) continue;
    if (deneme) {
      kategoriIdBySlug.set(slug, "deneme");
      console.log(`  + kategori oluşturulacak: ${slug}`);
      continue;
    }
    const { data, error } = await supabase
      .from("categories")
      .insert({ slug, name: kategori.name, sort_order: kategori.sort_order ?? 0 })
      .select("id")
      .single();
    if (error) throw new Error(`kategori "${slug}": ${error.message}`);
    kategoriIdBySlug.set(slug, data.id as string);
    console.log(`  + kategori oluşturuldu: ${slug}`);
  }

  // --- Boş sayı numaralarını bulmak için mevcutları oku ---
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

  // --- Görseller: depoda yoksa yedekten yükle, varsa mevcut adresi kullan ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const yeniUrlCache = new Map<string, string>();
  let gorselDuruyor = 0;
  let gorselYuklendi = 0;

  async function gorselAdresi(eskiUrl: string): Promise<string> {
    const onbellek = yeniUrlCache.get(eskiUrl);
    if (onbellek) return onbellek;

    const path = objectPathOf(eskiUrl);
    if (!path) return eskiUrl; // bizim depomuz değil, olduğu gibi bırak

    const herkeseAcik = `${supabaseUrl}${STORAGE_PREFIX}${MEDIA_BUCKET}/${path}`;
    // Depoda hâlâ duruyorsa tekrar yüklemeye gerek yok
    const kontrol = await fetch(herkeseAcik, { method: "HEAD" });
    if (kontrol.ok) {
      gorselDuruyor++;
      yeniUrlCache.set(eskiUrl, herkeseAcik);
      return herkeseAcik;
    }

    const dosya = zip.file(`gorseller/${path}`);
    if (!dosya) {
      console.warn(`  ! görsel ne depoda ne yedekte: ${path}`);
      yeniUrlCache.set(eskiUrl, eskiUrl);
      return eskiUrl;
    }

    if (deneme) {
      gorselYuklendi++;
      console.log(`  + görsel yüklenecek: ${path}`);
      yeniUrlCache.set(eskiUrl, herkeseAcik);
      return herkeseAcik;
    }

    const bytes = await dosya.async("nodebuffer");
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, bytes, { contentType: "image/webp", upsert: false });
    if (error) {
      console.warn(`  ! yüklenemedi (${path}): ${error.message}`);
    } else {
      gorselYuklendi++;
      console.log(`  + görsel yüklendi: ${path}`);
    }

    yeniUrlCache.set(eskiUrl, herkeseAcik);
    return herkeseAcik;
  }

  /** Yazının kapağını ve metnindeki gömülü görselleri yeni adreslerle değiştirir. */
  async function adresleriDuzelt(article: Json): Promise<Json> {
    const kopya: Json = { ...article };
    for (const eski of imageUrlsOf(article)) {
      const yeni = await gorselAdresi(eski);
      if (yeni === eski) continue;
      if (kopya.cover_image_url === eski) kopya.cover_image_url = yeni;
      if (typeof kopya.content === "string") {
        kopya.content = kopya.content.split(eski).join(yeni);
      }
    }
    return kopya;
  }

  // --- Sayılar ve yazılar ---
  let toplamYazi = 0;
  for (const sayi of issues) {
    const tercih = sayi.issue_number as number;
    const numara = bosNumaraBul(tercih);
    doluNumaralar.add(numara);

    const kapak = sayi.cover_image_url
      ? await gorselAdresi(sayi.cover_image_url as string)
      : null;

    let yeniSayiId = "deneme";
    if (!deneme) {
      const { data: yeniSayi, error } = await supabase
        .from("issues")
        .insert({
          issue_number: numara,
          title: sayi.title,
          description: sayi.description ?? null,
          cover_image_url: kapak,
          publish_date: sayi.publish_date,
          status: "draft", // gözden geçirilmeden yayına çıkmasın
        })
        .select("id")
        .single();
      if (error) throw new Error(`sayı ${numara}: ${error.message}`);
      yeniSayiId = yeniSayi.id as string;
    }

    const not = numara === tercih ? "" : ` (yedekte ${tercih} idi, o numara doluydu)`;
    const fiil = deneme ? "oluşturulacak" : "oluşturuldu";
    console.log(`\n  + Sayı ${numara} taslak olarak ${fiil}${not}`);

    const sayininYazilari = articles.filter((a) => a.issue_id === sayi.id);
    for (const yazi of sayininYazilari) {
      const duzeltilmis = await adresleriDuzelt(yazi);
      const eskiKategoriId = yazi.category_id as string | null;
      const slug = eskiKategoriId ? slugByEskiId.get(eskiKategoriId) : undefined;

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

      if (deneme) {
        toplamYazi++;
        continue;
      }

      const { error: yaziHata } = await supabase.from("articles").insert({
        ...alanlar,
        issue_id: yeniSayiId,
        category_id: slug ? (kategoriIdBySlug.get(slug) ?? null) : null,
        status: "draft",
        published_at: null,
      });
      if (yaziHata) {
        console.warn(`    ! "${yazi.slug}" yazılamadı: ${yaziHata.message}`);
        continue;
      }
      toplamYazi++;
    }
    console.log(`    ${sayininYazilari.length} yazı taslak olarak ${deneme ? "eklenecek" : "eklendi"}`);
  }

  console.log(
    `\nGörseller: ${gorselDuruyor} tanesi depoda duruyordu (tekrar yüklenmedi), ` +
      `${gorselYuklendi} tanesi yedekten ${deneme ? "yüklenecekti" : "yüklendi"}.`
  );

  if (deneme) {
    console.log(
      `\nDeneme bitti: ${issues.length} sayı, ${toplamYazi} yazı oluşturulacaktı.` +
        " Hiçbir şey yazılmadı — gerçekten yüklemek için --deneme'yi kaldır."
    );
    return;
  }

  console.log(`\nBitti. ${issues.length} sayı, ${toplamYazi} yazı taslak olarak oluşturuldu.`);
  console.log("Panelden gözden geçirip yayınlayabilirsin.");
  if ((yedek.site_settings ?? []).length > 0) {
    console.log(
      "\nNot: tema/Hakkında ayarları bilerek uygulanmadı (mevcut ayarların üzerine" +
        " yazılmasın diye). Gerekirse icerik.json içindeki site_settings bölümünden" +
        " panele elle girebilirsin."
    );
  }
}

main().catch((error) => {
  console.error("\nGeri yükleme başarısız:", error instanceof Error ? error.message : error);
  process.exit(1);
});
