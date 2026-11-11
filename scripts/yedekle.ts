import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { yedekOlustur } from "../lib/admin/yedek";

// Kullanım:
//   npm run yedekle                   → yazılar + görseller
//   npm run yedekle -- --sadece-metin → yalnızca yazılar
//
// Panelde de aynı işi yapan bir buton var (Ayarlar > Yedekleme); ikisi de
// lib/admin/yedek.ts içindeki aynı kodu çalıştırır.

async function main() {
  const sadeceMetin = process.argv.includes("--sadece-metin");

  console.log("İçerik okunuyor ve paketleniyor...");
  const rapor = await yedekOlustur({ sadeceMetin });

  console.log(`  ${rapor.sayiSayisi} sayı, ${rapor.yaziSayisi} yazı, ${rapor.kategoriSayisi} kategori`);
  if (!sadeceMetin) {
    console.log(`  ${rapor.gorselSayisi} görsel, ${(rapor.gorselBoyut / 1024 / 1024).toFixed(1)} MB`);
  }
  for (const uyari of rapor.uyarilar) console.warn(`  ! ${uyari}`);

  const klasor = join(process.cwd(), "yedekler");
  mkdirSync(klasor, { recursive: true });
  const tamYol = join(klasor, rapor.dosyaAdi);
  writeFileSync(tamYol, rapor.buffer);

  console.log(`\nBitti: ${tamYol}`);
  console.log(`Boyut: ${(rapor.buffer.length / 1024).toFixed(0)} KB`);
}

main().catch((error) => {
  console.error("\nYedekleme başarısız:", error instanceof Error ? error.message : error);
  process.exit(1);
});
