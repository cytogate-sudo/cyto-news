import { readFileSync } from "fs";
import { createInterface } from "readline/promises";
import { yedekGeriYukle } from "../lib/admin/yedek";

// Kullanım:
//   npm run geri-yukle -- yedekler/yedek-2026-11-12.zip
//   npm run geri-yukle -- yedekler/yedek-2026-11-12.zip --deneme   (hiçbir şey yazmaz)
//   npm run geri-yukle -- yedekler/yedek-2026-11-12.zip --onayla   (soru sormaz)
//
// Panelde de aynı işi yapan bir alan var (Ayarlar > Yedekleme); ikisi de
// lib/admin/yedek.ts içindeki aynı kodu çalıştırır.
//
// HİÇBİR ŞEYİN ÜZERİNE YAZMAZ: her sayı TASLAK olarak yeniden oluşturulur.

async function main() {
  const args = process.argv.slice(2);
  const dosya = args.find((a) => !a.startsWith("--"));
  const deneme = args.includes("--deneme");
  const onayli = args.includes("--onayla") || deneme;

  if (!dosya) {
    console.error("Kullanım: npm run geri-yukle -- yedekler/<dosya>.zip [--deneme]");
    process.exit(1);
  }

  const bytes = readFileSync(dosya);

  if (!onayli) {
    // Ne olacağını önce yazmadan göster, sonra onay iste
    const onizleme = await yedekGeriYukle(bytes, { deneme: true });
    yazdir(onizleme, true);

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const cevap = await rl.question("\nDevam edilsin mi? (evet/hayir): ");
    rl.close();
    if (cevap.trim().toLowerCase() !== "evet") {
      console.log("Vazgeçildi, hiçbir şey yazılmadı.");
      return;
    }
  }

  const rapor = await yedekGeriYukle(bytes, { deneme });
  yazdir(rapor, deneme);
}

function yazdir(rapor: Awaited<ReturnType<typeof yedekGeriYukle>>, deneme: boolean) {
  const fiil = deneme ? "oluşturulacak" : "oluşturuldu";
  console.log(
    `\nYedek tarihi: ${rapor.alindi ? new Date(rapor.alindi).toLocaleString("tr-TR") : "bilinmiyor"}`
  );
  console.log(`Görseller: ${rapor.gorsellerDahil ? "dahil" : "DAHİL DEĞİL (yalnızca metin yedeği)"}`);
  console.log("\nMevcut hiçbir sayı, yazı veya ayar değiştirilmiyor.\n");

  for (const s of rapor.sayilar) {
    const not = s.yeniNumara === s.eskiNumara ? "" : ` (yedekte ${s.eskiNumara} idi, o numara doluydu)`;
    console.log(`  + Sayı ${s.yeniNumara} taslak olarak ${fiil}${not} — ${s.yaziSayisi} yazı`);
  }
  for (const slug of rapor.eklenenKategoriler) console.log(`  + kategori ${fiil}: ${slug}`);
  for (const uyari of rapor.uyarilar) console.warn(`  ! ${uyari}`);

  console.log(
    `\nGörseller: ${rapor.gorselDuruyor} tanesi depoda duruyordu (tekrar yüklenmedi), ` +
      `${rapor.gorselYuklenen} tanesi yedekten ${deneme ? "yüklenecekti" : "yüklendi"}.`
  );

  if (deneme) {
    console.log(
      `\nDeneme: ${rapor.sayilar.length} sayı, ${rapor.yazilanYazi} yazı oluşturulacaktı.` +
        " Hiçbir şey yazılmadı."
    );
  } else {
    console.log(
      `\nBitti. ${rapor.sayilar.length} sayı, ${rapor.yazilanYazi} yazı taslak olarak oluşturuldu.`
    );
    console.log("Panelden gözden geçirip yayınlayabilirsin.");
  }

  if (rapor.ayarVar) {
    console.log(
      "\nNot: tema/Hakkında ayarları bilerek uygulanmadı (mevcut ayarların üzerine" +
        " yazılmasın diye). Gerekirse yedeğin içindeki icerik.json'dan panele elle girebilirsin."
    );
  }
}

main().catch((error) => {
  console.error("\nGeri yükleme başarısız:", error instanceof Error ? error.message : error);
  process.exit(1);
});
