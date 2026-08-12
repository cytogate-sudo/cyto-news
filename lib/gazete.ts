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
  author_name: string | null;
  cover_image_url: string | null;
  is_featured: boolean;
  reading_minutes: number | null;
  status: "draft" | "published";
  published_at: string | null;
  sort_order: number;
  category?: Pick<Category, "slug" | "name"> | null;
  issue?: Pick<Issue, "issue_number" | "title" | "publish_date">;
};

const ARTICLE_SUMMARY_COLUMNS =
  "id, issue_id, category_id, kicker, title, slug, summary, content, pull_quote, terms, author_name, cover_image_url, is_featured, reading_minutes, status, published_at, sort_order, category:categories(slug, name)";

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

export async function getArticlesByCategorySlug(categorySlug: string): Promise<Article[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("articles")
    .select(
      `${ARTICLE_SUMMARY_COLUMNS}, issue:issues!inner(issue_number, title, publish_date), category:categories!inner(slug, name)`
    )
    .eq("status", "published")
    .eq("category.slug", categorySlug)
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as Article[]) ?? [];
}
