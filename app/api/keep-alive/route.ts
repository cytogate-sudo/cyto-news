import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Supabase ücretsiz projeleri ~7 gün kullanılmazsa otomatik duraklatılır.
// Bu uç nokta veritabanına minik (satır döndürmeyen) bir sorgu atarak projeyi
// aktif tutar. Vercel Cron her gün çağırır — bkz. vercel.json.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase not configured" }, { status: 503 });
  }

  try {
    const { error } = await supabase
      .from("issues")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 503 }
    );
  }
}
