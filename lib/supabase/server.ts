import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let warned = false;

// Supabase projesi henüz kurulmadıysa (örn. Faz 3'te tasarım aşamasında)
// sayfaların çökmesi yerine boş içerikle çalışabilmesi için null döner.
export function createSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    if (!warned) {
      console.warn(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil — boş içerikle devam ediliyor."
      );
      warned = true;
    }
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
