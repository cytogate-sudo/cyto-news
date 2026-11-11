"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/gazete";
import {
  createAdminSession,
  destroyAdminSession,
  hashPassword,
  requireAdmin,
  verifyCredentials,
  verifyPassword,
} from "@/lib/admin/auth";
import type { AboutSettings, MastheadSettings, ThemeSettings } from "@/lib/settings";
import { yedekGeriYukle, type GeriYuklemeRaporu } from "@/lib/admin/yedek";

function supabaseOrThrow() {
  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase yapılandırılmamış");
  return supabase;
}

// Yayındaki tüm sayfaların ISR önbelleğini temizler — panelden yapılan her
// değişiklik "Kaydet" anında canlı sitede görünsün diye.
function revalidateSite() {
  revalidatePath("/", "layout");
}

// ---------- Oturum ----------

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Kullanıcı adı ve şifre gerekli." };

  // Kaba kuvvet denemelerini yavaşlatmak için küçük sabit gecikme
  await new Promise((r) => setTimeout(r, 400));

  const ok = await verifyCredentials(username, password);
  if (!ok) return { error: "Kullanıcı adı veya şifre hatalı." };

  await createAdminSession(username);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin");
}

export async function changePasswordAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const username = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const next2 = String(formData.get("next2") ?? "");

  if (next.length < 8) return { error: "Yeni şifre en az 8 karakter olmalı." };
  if (next !== next2) return { error: "Yeni şifreler birbiriyle uyuşmuyor." };

  const supabase = supabaseOrThrow();
  const { data } = await supabase
    .from("admin_users")
    .select("password_hash")
    .eq("username", username)
    .maybeSingle();
  if (!data || !verifyPassword(current, data.password_hash)) {
    return { error: "Mevcut şifre hatalı." };
  }

  const { error } = await supabase
    .from("admin_users")
    .update({ password_hash: hashPassword(next) })
    .eq("username", username);
  if (error) return { error: error.message };
  return { success: "Şifre güncellendi." };
}

// ---------- Sayılar ----------

export async function createIssueAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = supabaseOrThrow();

  const issueNumber = Number(formData.get("issue_number"));
  const title = String(formData.get("title") ?? "").trim();
  if (!Number.isInteger(issueNumber) || issueNumber < 1 || !title) {
    throw new Error("Sayı numarası ve başlık gerekli");
  }

  const { data, error } = await supabase
    .from("issues")
    .insert({
      issue_number: issueNumber,
      title,
      publish_date: String(formData.get("publish_date") || new Date().toISOString().slice(0, 10)),
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidateSite();
  redirect(`/admin/sayi/${data.id}`);
}

export async function saveIssueAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = supabaseOrThrow();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("issues")
    .update({
      issue_number: Number(formData.get("issue_number")),
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      publish_date: String(formData.get("publish_date")),
      status: formData.get("status") === "published" ? "published" : "draft",
      cover_image_url: String(formData.get("cover_image_url") ?? "").trim() || null,
      cover_position: String(formData.get("cover_position") ?? "center"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateSite();
  redirect(`/admin/sayi/${id}?kayit=ok`);
}

export async function deleteIssueAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = supabaseOrThrow();
  const id = String(formData.get("id"));
  // articles tablosunda on delete cascade var — makaleler de silinir.
  const { error } = await supabase.from("issues").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSite();
  redirect("/admin");
}

// ---------- Makaleler ----------

function slugify(text: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return text
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createArticleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = supabaseOrThrow();
  const issueId = String(formData.get("issue_id"));
  const title = String(formData.get("title") ?? "").trim() || "Yeni Makale";

  const { data: last } = await supabase
    .from("articles")
    .select("sort_order")
    .eq("issue_id", issueId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let slug = slugify(title) || "yeni-makale";
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("issue_id", issueId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("articles")
    .insert({
      issue_id: issueId,
      title,
      slug,
      content: "",
      status: "draft",
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  redirect(`/admin/makale/${data.id}`);
}

export type ArticlePayload = {
  title: string;
  slug: string;
  kicker: string | null;
  category_id: string | null;
  summary: string | null;
  content: string;
  pull_quote: string | null;
  terms: { term: string; definition: string }[] | null;
  sources: { label: string; url: string | null }[] | null;
  author_name: string | null;
  cover_image_url: string | null;
  cover_position: string;
  cover_aspect: string;
  is_featured: boolean;
  reading_minutes: number | null;
  status: "draft" | "published";
};

export async function saveArticleAction(
  id: string,
  payload: ArticlePayload
): Promise<{ error?: string; success?: string }> {
  await requireAdmin();
  const supabase = supabaseOrThrow();

  const slug = slugify(payload.slug || payload.title);
  if (!payload.title.trim() || !slug) return { error: "Başlık ve slug gerekli." };

  const { error } = await supabase
    .from("articles")
    .update({
      title: payload.title.trim(),
      slug,
      kicker: payload.kicker?.trim() || null,
      category_id: payload.category_id || null,
      summary: payload.summary?.trim() || null,
      content: payload.content,
      pull_quote: payload.pull_quote?.trim() || null,
      terms: payload.terms && payload.terms.length > 0 ? payload.terms : null,
      sources: payload.sources && payload.sources.length > 0 ? payload.sources : null,
      author_name: payload.author_name?.trim() || null,
      cover_image_url: payload.cover_image_url || null,
      cover_position: payload.cover_position,
      cover_aspect: payload.cover_aspect,
      is_featured: payload.is_featured,
      reading_minutes: payload.reading_minutes,
      status: payload.status,
      published_at: payload.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateSite();
  return { success: "Kaydedildi." };
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = supabaseOrThrow();
  const id = String(formData.get("id"));
  const issueId = String(formData.get("issue_id"));
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSite();
  redirect(`/admin/sayi/${issueId}`);
}

export async function moveArticleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = supabaseOrThrow();
  const id = String(formData.get("id"));
  const issueId = String(formData.get("issue_id"));
  const direction = formData.get("direction") === "up" ? "up" : "down";

  const { data: articles } = await supabase
    .from("articles")
    .select("id, sort_order")
    .eq("issue_id", issueId)
    .order("sort_order", { ascending: true });
  if (!articles) return;

  const index = articles.findIndex((a) => a.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= articles.length) return;

  const a = articles[index];
  const b = articles[swapWith];
  await supabase.from("articles").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("articles").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidateSite();
  redirect(`/admin/sayi/${issueId}`);
}

// ---------- Kategoriler ----------

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = supabaseOrThrow();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("categories").insert({
    name,
    slug: slugify(name),
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw new Error(error.message);
  revalidateSite();
  redirect("/admin/ayarlar?kayit=ok");
}

export async function renameCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = supabaseOrThrow();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { error } = await supabase.from("categories").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSite();
  redirect("/admin/ayarlar?kayit=ok");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = supabaseOrThrow();
  const id = String(formData.get("id"));
  // articles.category_id "on delete set null" — makaleler silinmez, kategorisiz kalır.
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSite();
  redirect("/admin/ayarlar?kayit=ok");
}

// ---------- Görsel yükleme ----------

export async function uploadImageAction(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const supabase = supabaseOrThrow();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Dosya seçilmedi." };
  if (file.size > 15 * 1024 * 1024) return { error: "Dosya 15MB'den büyük olamaz." };

  const folder = String(formData.get("folder") || "uploads");
  const buffer = Buffer.from(await file.arrayBuffer());

  let webp: Buffer;
  try {
    webp = await sharp(buffer)
      .rotate() // EXIF yönünü uygula
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { error: "Görsel işlenemedi — desteklenen bir resim dosyası seçin." };
  }

  const name = `${folder}/${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}.webp`;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(name, webp, { contentType: "image/webp", upsert: false });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(name);
  return { url: data.publicUrl };
}

// ---------- Site ayarları ----------

async function upsertSetting(key: string, value: unknown): Promise<void> {
  const supabase = supabaseOrThrow();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function saveThemeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const theme: ThemeSettings = {
    paper: String(formData.get("paper")),
    paper_card: String(formData.get("paper_card")),
    ink: String(formData.get("ink")),
    ink_soft: String(formData.get("ink_soft")),
    bordo: String(formData.get("bordo")),
    bordo_deep: String(formData.get("bordo_deep")),
    gold: String(formData.get("gold")),
    muted: String(formData.get("muted")),
    team_card: String(formData.get("team_card")),
  };
  await upsertSetting("theme", theme);
  revalidateSite();
  redirect("/admin/ayarlar?kayit=ok");
}

export async function saveAboutAction(
  payload: AboutSettings
): Promise<{ error?: string; success?: string }> {
  await requireAdmin();

  if (!payload.title.trim()) return { error: "Sayfa başlığı boş olamaz." };

  await upsertSetting("about", {
    kicker: payload.kicker.trim(),
    title: payload.title.trim(),
    intro: payload.intro,
    // Başlığı ve metni boş kalan kutular kaydedilmez
    highlights: payload.highlights.filter((h) => h.title.trim() && h.text.trim()),
    outro: payload.outro,
  } satisfies AboutSettings);

  revalidateSite();
  return { success: "Hakkında sayfası güncellendi." };
}

export async function saveMastheadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const masthead: MastheadSettings = {
    eyebrow: String(formData.get("eyebrow") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    university: String(formData.get("university") ?? "").trim(),
    footer_text: String(formData.get("footer_text") ?? "").trim(),
    instagram_handle: String(formData.get("instagram_handle") ?? "").trim(),
    instagram_url: String(formData.get("instagram_url") ?? "").trim(),
  };
  await upsertSetting("masthead", masthead);
  revalidateSite();
  redirect("/admin/ayarlar?kayit=ok");
}

// ---------- Yedekleme ----------

export type YedekOnizleme = {
  alindi: string | null;
  gorsellerDahil: boolean;
  sayilar: { eskiNumara: number; yeniNumara: number; yaziSayisi: number }[];
  eklenenKategoriler: string[];
  toplamYazi: number;
  gorselDuruyor: number;
  gorselYuklenen: number;
  ayarVar: boolean;
  uyarilar: string[];
};

/** Dosyayı okur ama HİÇBİR ŞEY YAZMAZ — yalnızca ne olacağını döner. */
export async function inspectBackupAction(
  formData: FormData
): Promise<{ error?: string; onizleme?: YedekOnizleme }> {
  await requireAdmin();
  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { error: "Dosya seçilmedi." };

  try {
    const rapor = await yedekGeriYukle(Buffer.from(await dosya.arrayBuffer()), {
      deneme: true,
    });
    return { onizleme: raporuOnizlemeyeCevir(rapor) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Dosya okunamadı." };
  }
}

/** Yedeği gerçekten yükler. Üzerine yazmaz: her sayı TASLAK olarak eklenir. */
export async function restoreBackupAction(
  formData: FormData
): Promise<{ error?: string; onizleme?: YedekOnizleme; success?: string }> {
  await requireAdmin();
  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return { error: "Dosya seçilmedi." };

  try {
    const rapor = await yedekGeriYukle(Buffer.from(await dosya.arrayBuffer()), {
      deneme: false,
    });
    revalidateSite();
    return {
      onizleme: raporuOnizlemeyeCevir(rapor),
      success: `${rapor.sayilar.length} sayı, ${rapor.yazilanYazi} yazı taslak olarak eklendi.`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Geri yükleme başarısız." };
  }
}

function raporuOnizlemeyeCevir(rapor: GeriYuklemeRaporu): YedekOnizleme {
  return {
    alindi: rapor.alindi,
    gorsellerDahil: rapor.gorsellerDahil,
    sayilar: rapor.sayilar,
    eklenenKategoriler: rapor.eklenenKategoriler,
    toplamYazi: rapor.yazilanYazi,
    gorselDuruyor: rapor.gorselDuruyor,
    gorselYuklenen: rapor.gorselYuklenen,
    ayarVar: rapor.ayarVar,
    uyarilar: rapor.uyarilar,
  };
}
