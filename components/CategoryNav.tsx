import Link from "next/link";
import type { Category } from "@/lib/gazete";

export function CategoryNav({ categories }: { categories: Category[] }) {
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
      <a
        href="https://www.instagram.com/gtucytogate"
        target="_blank"
        rel="noopener noreferrer"
      >
        @gtucytogate
      </a>
    </nav>
  );
}
