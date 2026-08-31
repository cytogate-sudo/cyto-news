import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { adminGetArticleById } from "@/lib/admin/data";
import { getCategories } from "@/lib/gazete";
import { deleteArticleAction } from "@/app/admin/actions";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export default async function AdminArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminOrRedirect();
  const { id } = await params;

  const [article, categories] = await Promise.all([adminGetArticleById(id), getCategories()]);
  if (!article) notFound();

  return (
    <>
      <p style={{ marginTop: 0, display: "flex", justifyContent: "space-between", gap: 12 }}>
        <Link href={`/admin/sayi/${article.issue_id}`} className="back-link">
          ← Sayıya dön
        </Link>
        {article.issue && article.status === "published" ? (
          <Link
            href={`/sayi/${article.issue.issue_number}/${article.slug}`}
            target="_blank"
            className="back-link"
          >
            Sitede gör ↗
          </Link>
        ) : null}
      </p>

      <ArticleEditor article={article} categories={categories} />

      <div className="admin-card" style={{ marginTop: 24 }}>
        <h2>Tehlikeli Bölge</h2>
        <form action={deleteArticleAction}>
          <input type="hidden" name="id" value={article.id} />
          <input type="hidden" name="issue_id" value={article.issue_id} />
          <ConfirmSubmit
            className="btn danger"
            message={`"${article.title}" makalesi kalıcı olarak silinecek. Emin misin?`}
          >
            Makaleyi Sil
          </ConfirmSubmit>
        </form>
      </div>
    </>
  );
}
