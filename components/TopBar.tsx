"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/gazete";
import type { MastheadSettings } from "@/lib/settings";

export function TopBar({
  categories,
  masthead,
}: {
  categories: Category[];
  masthead: MastheadSettings;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa değişince menü açık kalmasın
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="topbar-wrap">
      <div className="topbar">
        <button
          type="button"
          className="topbar-trigger"
          aria-expanded={open}
          aria-controls="kategori-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="burger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Kategoriler
        </button>

        <a href={masthead.instagram_url} target="_blank" rel="noopener noreferrer">
          {masthead.instagram_handle}
        </a>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="topbar-scrim"
            aria-label="Menüyü kapat"
            onClick={() => setOpen(false)}
          />
          <div className="topbar-menu" id="kategori-menu">
            <div className="topbar-menu-inner">
              <div className="topbar-menu-col">
                <div className="topbar-menu-label">Köşeler</div>
                {categories.map((category) => (
                  <Link key={category.id} href={`/kategori/${category.slug}`}>
                    {category.name}
                  </Link>
                ))}
              </div>
              <div className="topbar-menu-col">
                <div className="topbar-menu-label">Gazete</div>
                <Link href="/">Ana Sayfa</Link>
                <Link href="/sayilar">Tüm Sayılar</Link>
                <Link href="/hakkinda">Hakkında</Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
