import { getAdminUsername } from "@/lib/admin/auth";
import { yedekOlustur } from "@/lib/admin/yedek";

// Panelde "Yedeği İndir" butonunun ucu. Oturumu olmayan hiç kimse
// buradan içerik indiremez.
//
// /admin/yedek                 → yazılar + görseller
// /admin/yedek?sadece-metin=1  → yalnızca yazılar

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const username = await getAdminUsername();
  if (!username) {
    return new Response("Yetkisiz erişim", { status: 401 });
  }

  const sadeceMetin = new URL(request.url).searchParams.has("sadece-metin");

  try {
    const rapor = await yedekOlustur({ sadeceMetin });
    return new Response(new Uint8Array(rapor.buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${rapor.dosyaAdi}"`,
        "Content-Length": String(rapor.buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const mesaj = error instanceof Error ? error.message : "bilinmeyen hata";
    return new Response(`Yedek alınamadı: ${mesaj}`, { status: 500 });
  }
}
