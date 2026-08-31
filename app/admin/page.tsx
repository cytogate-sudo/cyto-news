import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { adminGetAllIssues } from "@/lib/admin/data";
import { createIssueAction } from "@/app/admin/actions";

export default async function AdminDashboardPage() {
  await requireAdminOrRedirect();
  const issues = await adminGetAllIssues();

  const nextNumber = issues.length > 0 ? Math.max(...issues.map((i) => i.issue_number)) + 1 : 1;

  return (
    <>
      <div className="admin-card">
        <h2>Sayılar</h2>
        {issues.length === 0 ? (
          <p className="admin-note">Henüz sayı yok — aşağıdan ilk sayıyı oluştur.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Başlık</th>
                <th>Tarih</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td>{issue.issue_number}</td>
                  <td>{issue.title}</td>
                  <td>{issue.publish_date}</td>
                  <td>
                    <span className={`status-pill ${issue.status}`}>
                      {issue.status === "published" ? "Yayında" : "Taslak"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/admin/sayi/${issue.id}`} className="btn small secondary">
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-card">
        <h2>Yeni Sayı Oluştur</h2>
        <form action={createIssueAction}>
          <div className="admin-grid-2">
            <div className="af-field">
              <label htmlFor="issue_number">Sayı Numarası</label>
              <input
                id="issue_number"
                name="issue_number"
                type="number"
                min={1}
                defaultValue={nextNumber}
                className="af-input"
                required
              />
            </div>
            <div className="af-field">
              <label htmlFor="publish_date">Yayın Tarihi</label>
              <input
                id="publish_date"
                name="publish_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="af-input"
                required
              />
            </div>
          </div>
          <div className="af-field">
            <label htmlFor="title">Başlık</label>
            <input
              id="title"
              name="title"
              className="af-input"
              placeholder={`Cytogate Bilim Bülteni — Sayı ${nextNumber}`}
              required
            />
          </div>
          <button type="submit" className="btn">
            Sayıyı Oluştur (taslak olarak)
          </button>
          <p className="admin-note">
            Yeni sayı taslak olarak açılır; makalelerini ekleyip hazır olunca sayı sayfasından
            &quot;Yayında&quot; durumuna alırsın.
          </p>
        </form>
      </div>
    </>
  );
}
