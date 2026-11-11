import { createSupabaseServerClient } from "@/lib/supabase/server";

export const MEDIA_BUCKET = "gazete-medya";

export type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type Issue = {
  id: string;
  issue_number: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  // Admin migration'ından geliyor; eski kayıtlarda olmayabilir.
  cover_position?: string;
  publish_date: string;
  status: "draft" | "published";
};

export type Article = {
  id: string;
  issue_id: string;
  category_id: string | null;
  kicker: string | null;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  pull_quote: string | null;
  terms: { term: string; definition: string }[] | null;
  // Kaynakça migration'ı (supabase/migration-kaynaklar.sql) uygulanmadan önce
  // bu alan sorgudan gelmeyebilir; SourceList boş listeyi zaten gizliyor.
  sources?: { label: string; url: string | null }[] | null;
  author_name: string | null;
  cover_image_url: string | null;
  // Admin migration'ı uygulanmadan önce bu iki alan sorgudan gelmeyebilir;
  // coverAspectRatio/coverObjectPosition yardımcıları undefined'ı da kabul eder.
  cover_position?: string;
  cover_aspect?: string;
  is_featured: boolean;
  reading_minutes: number | null;
  status: "draft" | "published";
  published_at: string | null;
  sort_order: number;
  category?: Pick<Category, "slug" | "name"> | null;
  issue?: Pick<Issue, "issue_number" | "title" | "publish_date">;
};

// Tüm sütunlar + kategori join'i. Bilerek "*" kullanılıyor: admin migration'ı
// (cover_position/cover_aspect) uygulanmadan önce de sonra da aynı kod çalışır.
const ARTICLE_SUMMARY_COLUMNS = "*, category:categories(slug, name)";

// Panelden seçilen kapak oranı/konumu → CSS değerleri
export function coverAspectRatio(aspect: string | null | undefined): string {
  switch (aspect) {
    case "standard":
      return "4 / 3";
    case "square":
      return "1 / 1";
    case "tall":
      return "3 / 4";
    default:
      return "16 / 9";
  }
}

export function coverObjectPosition(position: string | null | undefined): string {
  switch (position) {
    case "top":
      return "center top";
    case "bottom":
      return "center bottom";
    default:
      return "center";
  }
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLatestIssue(): Promise<Issue | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("status", "published")
    .order("issue_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllIssues(): Promise<Issue[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("status", "published")
    .order("issue_number", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getIssueByNumber(issueNumber: number): Promise<Issue | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("status", "published")
    .eq("issue_number", issueNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getArticlesByIssueId(issueId: string): Promise<Article[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SUMMARY_COLUMNS)
    .eq("issue_id", issueId)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as unknown as Article[]) ?? [];
}

export async function getArticleBySlug(
  issueNumber: number,
  slug: string
): Promise<Article | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select(
      `${ARTICLE_SUMMARY_COLUMNS}, issue:issues!inner(issue_number, title, publish_date)`
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("issue.issue_number", issueNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as unknown as Article | null;
}

/** Sitemap için: yayındaki tüm yazılar, ait oldukları sayı numarasıyla. */
export async function getAllPublishedArticles(): Promise<Article[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("*, issue:issues!inner(issue_number, title, publish_date)")
    .eq("status", "published")
    .eq("issue.status", "published")
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as Article[]) ?? [];
}

/** Aynı köşeden başka yazılar (yazının kendisi hariç). */
export async function getRelatedArticles(
  categoryId: string | null,
  excludeArticleId: string,
  limit = 3
): Promise<Article[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase || !categoryId) return [];

  const { data, error } = await supabase
    .from("articles")
    .select(`${ARTICLE_SUMMARY_COLUMNS}, issue:issues!inner(issue_number, title, publish_date)`)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", excludeArticleId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as unknown as Article[]) ?? [];
}

/** Aynı sayı içinde sort_order'a göre önceki ve sonraki yazı. */
export async function getAdjacentArticles(
  issueId: string,
  sortOrder: number
): Promise<{ previous: Article | null; next: Article | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { previous: null, next: null };

  const [prevResult, nextResult] = await Promise.all([
    supabase
      .from("articles")
      .select(ARTICLE_SUMMARY_COLUMNS)
      .eq("issue_id", issueId)
      .eq("status", "published")
      .lt("sort_order", sortOrder)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("articles")
      .select(ARTICLE_SUMMARY_COLUMNS)
      .eq("issue_id", issueId)
      .eq("status", "published")
      .gt("sort_order", sortOrder)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (prevResult.error) throw new Error(prevResult.error.message);
  if (nextResult.error) throw new Error(nextResult.error.message);

  return {
    previous: (prevResult.data as unknown as Article) ?? null,
    next: (nextResult.data as unknown as Article) ?? null,
  };
}

export async function getArticlesByCategorySlug(categorySlug: string): Promise<Article[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  // Not: ARTICLE_SUMMARY_COLUMNS zaten bir "category" join'i içerdiği için
  // burada onu kullanmıyoruz — aynı tabloyu iki kez join etmek PostgREST'te
  // "specified more than once" hatası veriyor.
  const { data, error } = await supabase
    .from("articles")
    .select(
      "*, issue:issues!inner(issue_number, title, publish_date), category:categories!inner(slug, name)"
    )
    .eq("status", "published")
    .eq("category.slug", categorySlug)
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as Article[]) ?? [];
}
