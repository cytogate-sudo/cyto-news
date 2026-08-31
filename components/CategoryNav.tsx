import Link from "next/link";
import type { Category } from "@/lib/gazete";
import type { MastheadSettings } from "@/lib/settings";

export function CategoryNav({
  categories,
  masthead,
}: {
  categories: Category[];
  masthead: MastheadSettings;
}) {
  return (
    <nav className="util-nav">
      <div className="cats">
        {categories.map((category) => (
          <Link key={category.id} href={`/kategori/${category.slug}`}>
            {category.name}
          </Link>
        ))}
        <Link href="/hakkinda">Hakkında</Link>
      </div>
      <a href={masthead.instagram_url} target="_blank" rel="noopener noreferrer">
        {masthead.instagram_handle}
      </a>
    </nav>
  );
}
