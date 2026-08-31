import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { adminGetArticlesByIssueId, adminGetIssueById } from "@/lib/admin/data";
import {
  createArticleAction,
  deleteIssueAction,
  moveArticleAction,
  saveIssueAction,
} from "@/app/admin/actions";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export default async function AdminIssuePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kayit?: string }>;
}) {
  await requireAdminOrRedirect();
  const { id } = await params;
  const { kayit } = await searchParams;

  const issue = await adminGetIssueById(id);
  if (!issue) notFound();
  const articles = await adminGetArticlesByIssueId(id);

  return (
    <>
      <p style={{ marginTop: 0 }}>
        <Link href="/admin" className="back-link">
          ← Tüm sayılar
        </Link>
      </p>

      {kayit === "ok" ? <div className="admin-alert success">Kaydedildi.</div> : null}

      <div className="admin-card">
        <h2>
          Sayı {issue.issue_number} — Bilgiler{" "}
          <span className={`status-pill ${issue.status}`}>
            {issue.status === "published" ? "Yayında" : "Taslak"}
          </span>
        </h2>
        <form action={saveIssueAction}>
          <input type="hidden" name="id" value={issue.id} />
          <div className="admin-grid-2">
            <div>
              <div className="af-field">
                <label htmlFor="issue_number">Sayı Numarası</label>
                <input
                  id="issue_number"
                  name="issue_number"
                  type="number"
                  min={1}
                  defaultValue={issue.issue_number}
                  className="af-input"
                  required
                />
              </div>
              <div className="af-field">
                <label htmlFor="title">Başlık</label>
                <input
                  id="title"
                  name="title"
                  defaultValue={issue.title}
                  className="af-input"
                  required
                />
              </div>
              <div className="af-field">
                <label htmlFor="description">Açıklama</label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={issue.description ?? ""}
                  className="af-textarea"
                />
              </div>
              <div className="admin-grid-2">
                <div className="af-field">
                  <label htmlFor="publish_date">Yayın Tarihi</label>
                  <input
                    id="publish_date"
                    name="publish_date"
                    type="date"
                    defaultValue={issue.publish_date}
                    className="af-input"
                    required
                  />
                </div>
                <div className="af-field">
                  <label htmlFor="status">Durum</label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={issue.status}
                    className="af-select"
                  >
                    <option value="draft">Taslak (sitede görünmez)</option>
                    <option value="published">Yayında</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <div className="af-field">
                <label>Sayı Kapak Görseli</label>
                <ImageUploadField
                  name="cover_image_url"
                  folder={`issues/sayi-${issue.issue_number}`}
                  defaultUrl={issue.cover_image_url}
                />
              </div>
              <div className="af-field">
                <label htmlFor="cover_position">Kapak Kadrajı</label>
                <select
                  id="cover_position"
                  name="cover_position"
                  defaultValue={(issue as { cover_position?: string }).cover_position ?? "center"}
                  className="af-select"
                >
                  <option value="top">Üstten göster</option>
                  <option value="center">Ortala</option>
                  <option value="bottom">Alttan göster</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn">
              Kaydet
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2>Bu Sayıdaki Makaleler ({articles.length})</h2>
        {articles.length === 0 ? (
          <p className="admin-note">Henüz makale yok.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Sıra</th>
                <th>Başlık</th>
                <th>Kategori</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article, index) => (
                <tr key={article.id}>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <form action={moveArticleAction}>
                        <input type="hidden" name="id" value={article.id} />
                        <input type="hidden" name="issue_id" value={issue.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          className="btn small secondary"
                          disabled={index === 0}
                          title="Yukarı taşı"
                        >
                          ↑
                        </button>
                      </form>
                      <form action={moveArticleAction}>
                        <input type="hidden" name="id" value={article.id} />
                        <input type="hidden" name="issue_id" value={issue.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          className="btn small secondary"
                          disabled={index === articles.length - 1}
                          title="Aşağı taşı"
                        >
                          ↓
                        </button>
                      </form>
                    </div>
                  </td>
                  <td>
                    {article.is_featured ? "★ " : ""}
                    {article.title}
                  </td>
                  <td>{article.category?.name ?? "—"}</td>
                  <td>
                    <span className={`status-pill ${article.status}`}>
                      {article.status === "published" ? "Yayında" : "Taslak"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/admin/makale/${article.id}`} className="btn small secondary">
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="admin-note">★ = manşet makalesi. Sıralama sitedeki karta dizilimini belirler.</p>

        <form action={createArticleAction} style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <input type="hidden" name="issue_id" value={issue.id} />
          <input
            name="title"
            className="af-input"
            placeholder="Yeni makale başlığı"
            style={{ maxWidth: 420 }}
          />
          <button type="submit" className="btn">
            Makale Ekle
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h2>Tehlikeli Bölge</h2>
        <form action={deleteIssueAction}>
          <input type="hidden" name="id" value={issue.id} />
          <ConfirmSubmit
            className="btn danger"
            message={`Sayı ${issue.issue_number} ve içindeki ${articles.length} makale kalıcı olarak silinecek. Emin misin?`}
          >
            Sayıyı ve Tüm Makalelerini Sil
          </ConfirmSubmit>
        </form>
      </div>
    </>
  );
}
