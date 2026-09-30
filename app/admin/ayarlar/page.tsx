import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { getCategories } from "@/lib/gazete";
import { getSiteSettings } from "@/lib/settings";
import {
  createCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
  saveMastheadAction,
} from "@/app/admin/actions";
import { ThemeForm } from "@/components/admin/ThemeForm";
import { AboutForm } from "@/components/admin/AboutForm";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ kayit?: string }>;
}) {
  await requireAdminOrRedirect();
  const { kayit } = await searchParams;
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()]);

  return (
    <>
      {kayit === "ok" ? <div className="admin-alert success">Kaydedildi.</div> : null}

      <div className="admin-card">
        <h2>Tema Renkleri</h2>
        <ThemeForm current={settings.theme} />
      </div>

      <div className="admin-card">
        <h2>Gazete Kimliği</h2>
        <form action={saveMastheadAction}>
          <div className="admin-grid-2">
            <div className="af-field">
              <label htmlFor="mh-eyebrow">Üst Etiket</label>
              <input
                id="mh-eyebrow"
                name="eyebrow"
                className="af-input"
                defaultValue={settings.masthead.eyebrow}
                required
              />
            </div>
            <div className="af-field">
              <label htmlFor="mh-title">Gazete Adı (büyük başlık)</label>
              <input
                id="mh-title"
                name="title"
                className="af-input"
                defaultValue={settings.masthead.title}
                required
              />
            </div>
            <div className="af-field">
              <label htmlFor="mh-subtitle">Alt Başlık</label>
              <input
                id="mh-subtitle"
                name="subtitle"
                className="af-input"
                defaultValue={settings.masthead.subtitle}
                required
              />
            </div>
            <div className="af-field">
              <label htmlFor="mh-university">Kurum / Üniversite</label>
              <input
                id="mh-university"
                name="university"
                className="af-input"
                defaultValue={settings.masthead.university}
                required
              />
            </div>
            <div className="af-field">
              <label htmlFor="mh-footer">Footer Metni</label>
              <input
                id="mh-footer"
                name="footer_text"
                className="af-input"
                defaultValue={settings.masthead.footer_text}
                required
              />
            </div>
            <div className="af-field">
              <label htmlFor="mh-insta-handle">Instagram Kullanıcı Adı</label>
              <input
                id="mh-insta-handle"
                name="instagram_handle"
                className="af-input"
                defaultValue={settings.masthead.instagram_handle}
                required
              />
            </div>
            <div className="af-field">
              <label htmlFor="mh-insta-url">Instagram Linki</label>
              <input
                id="mh-insta-url"
                name="instagram_url"
                type="url"
                className="af-input"
                defaultValue={settings.masthead.instagram_url}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn">
            Kimliği Kaydet
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h2>Hakkında Sayfası</h2>
        <AboutForm current={settings.about} />
      </div>

      <div className="admin-card">
        <h2>Kategoriler</h2>
        {categories.map((category) => (
          <div
            key={category.id}
            style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}
          >
            <form
              action={renameCategoryAction}
              style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}
            >
              <input type="hidden" name="id" value={category.id} />
              <input name="name" className="af-input" defaultValue={category.name} required />
              <button type="submit" className="btn small secondary">
                Kaydet
              </button>
            </form>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={category.id} />
              <ConfirmSubmit
                className="btn small danger"
                message={`"${category.name}" kategorisi silinecek. Bu kategorideki makaleler silinmez, kategorisiz kalır. Emin misin?`}
              >
                Sil
              </ConfirmSubmit>
            </form>
          </div>
        ))}
        <form
          action={createCategoryAction}
          style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}
        >
          <input
            name="name"
            className="af-input"
            placeholder="Yeni kategori adı"
            style={{ maxWidth: 320 }}
            required
          />
          <button type="submit" className="btn small">
            Ekle
          </button>
        </form>
        <p className="admin-note">
          Kategori adını değiştirmek adresi (slug) değiştirmez — eski linkler çalışmaya devam
          eder.
        </p>
      </div>

      <div className="admin-card">
        <h2>Şifre Değiştir</h2>
        <PasswordForm />
      </div>
    </>
  );
}
