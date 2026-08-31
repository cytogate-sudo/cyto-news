import Link from "next/link";
import type { Category } from "@/lib/gazete";
import type { MastheadSettings } from "@/lib/settings";

export function SiteFooter({
  masthead,
  categories,
}: {
  masthead: MastheadSettings;
  categories: Category[];
}) {
  return (
    <footer className="site-footer">
      <nav className="footer-links">
        <Link href="/">Ana Sayfa</Link>
        <Link href="/sayilar">Tüm Sayılar</Link>
        <Link href="/hakkinda">Hakkında</Link>
        {categories.map((category) => (
          <Link key={category.id} href={`/kategori/${category.slug}`}>
            {category.name}
          </Link>
        ))}
      </nav>
      <div className="footer-base">
        <span>
          {masthead.footer_text} © {new Date().getFullYear()}
        </span>
        <a href={masthead.instagram_url} target="_blank" rel="noopener noreferrer">
          {masthead.instagram_handle}
        </a>
      </div>
    </footer>
  );
}
