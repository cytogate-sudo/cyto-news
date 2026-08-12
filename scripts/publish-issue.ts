import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { createSupabaseServerClient } from "../lib/supabase/server";

// Kullanım: npx tsx scripts/publish-issue.ts sayi-01
//
// content/<sayi-klasoru>/issue.yml + *.md dosyalarını okuyup Supabase'e yazar.
// Görselleri yüklemez (henüz kapak görseli yok) — cover_image_url alanları
// boş bırakılır, ileride Supabase Storage'a yükleyip URL eklenebilir.

type ArticleFrontmatter = {
  title: string;
  slug: string;
  category: string;
  kicker?: string;
  author?: string;
  summary?: string;
  is_featured?: boolean;
  reading_minutes?: number;
  pull_quote?: string;
  terms?: { term: string; definition: string }[];
  sort_order?: number;
};

type IssueMeta = {
  issue_number: number;
  title: string;
  description?: string;
  publish_date: string;
};

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Kullanım: npx tsx scripts/publish-issue.ts <klasor-adi>");
    process.exit(1);
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    console.error(
      "Supabase yapılandırılmamış. .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı."
    );
    process.exit(1);
  }

  const contentDir = join(process.cwd(), "content", folder);
  const issueMeta: IssueMeta = JSON.parse(
    readFileSync(join(contentDir, "issue.json"), "utf-8")
  );

  const { data: issueRow, error: issueError } = await supabase
    .from("issues")
    .upsert(
      {
        issue_number: issueMeta.issue_number,
        title: issueMeta.title,
        description: issueMeta.description ?? null,
        publish_date: issueMeta.publish_date,
        status: "published",
      },
      { onConflict: "issue_number" }
    )
    .select()
    .single();

  if (issueError) throw new Error(issueError.message);
  console.log(`Sayı ${issueMeta.issue_number} yazıldı: ${issueRow.id}`);

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, slug");
  if (catError) throw new Error(catError.message);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const files = readdirSync(contentDir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const raw = readFileSync(join(contentDir, file), "utf-8");
    const { data, content } = matter(raw);
    const fm = data as ArticleFrontmatter;

    const categoryId = categoryBySlug.get(fm.category);
    if (!categoryId) {
      console.warn(`⚠️  "${fm.category}" kategorisi bulunamadı, atlanıyor: ${file}`);
    }

    const { error } = await supabase.from("articles").upsert(
      {
        issue_id: issueRow.id,
        category_id: categoryId ?? null,
        title: fm.title,
        slug: fm.slug,
        kicker: fm.kicker ?? null,
        author_name: fm.author ?? null,
        summary: fm.summary ?? null,
        content: content.trim(),
        pull_quote: fm.pull_quote ?? null,
        terms: fm.terms ?? null,
        is_featured: fm.is_featured ?? false,
        reading_minutes: fm.reading_minutes ?? null,
        sort_order: fm.sort_order ?? 0,
        status: "published",
        published_at: new Date().toISOString(),
      },
      { onConflict: "issue_id,slug" }
    );

    if (error) {
      console.error(`✗ ${file}: ${error.message}`);
    } else {
      console.log(`✓ ${fm.title}`);
    }
  }

  console.log("Tamamlandı.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
