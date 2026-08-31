import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Article, Issue } from "@/lib/gazete";

// Yayın sitesindeki lib/gazete.ts yalnızca status='published' okur;
// admin paneli taslaklar dahil her şeyi görmek zorunda olduğu için ayrı.

export async function adminGetAllIssues(): Promise<Issue[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .order("issue_number", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminGetIssueById(id: string): Promise<Issue | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function adminGetArticlesByIssueId(issueId: string): Promise<Article[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("articles")
    .select("*, category:categories(slug, name)")
    .eq("issue_id", issueId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as unknown as Article[]) ?? [];
}

export async function adminGetArticleById(id: string): Promise<Article | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("articles")
    .select("*, issue:issues(issue_number, title, publish_date)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as Article | null;
}
