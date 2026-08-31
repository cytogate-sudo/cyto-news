import type { Metadata } from "next";
import Link from "next/link";
import "./admin.css";
import { getAdminUsername } from "@/lib/admin/auth";
import { logoutAction } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Yönetim Paneli — Cytogate",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const username = await getAdminUsername();

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <span className="brand">Cytogate Yönetim</span>
        {username ? (
          <nav>
            <Link href="/admin">Sayılar</Link>
            <Link href="/admin/ayarlar">Ayarlar</Link>
            <Link href="/" target="_blank">
              Siteyi Gör ↗
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn small secondary">
                Çıkış ({username})
              </button>
            </form>
          </nav>
        ) : null}
      </header>
      {children}
    </div>
  );
}
