"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/gazete";
import type { MastheadSettings } from "@/lib/settings";

type MenuItem =
  | { kind: "label"; text: string }
  | { kind: "link"; href: string; text: string };

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

  const items: MenuItem[] = [
    { kind: "label", text: "Köşeler" },
    ...categories.map((c) => ({
      kind: "link" as const,
      href: `/kategori/${c.slug}`,
      text: c.name,
    })),
    { kind: "label", text: "Gazete" },
    { kind: "link", href: "/", text: "Ana Sayfa" },
    { kind: "link", href: "/sayilar", text: "Tüm Sayılar" },
    { kind: "link", href: "/hakkinda", text: "Hakkında" },
  ];

  return (
    <div className="topbar-wrap">
      <div className="topbar">
        <button
          type="button"
          className={open ? "topbar-trigger is-open" : "topbar-trigger"}
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
          <div className="topbar-menu-anchor">
            <nav className="topbar-menu" id="kategori-menu">
              {items.map((item, index) => {
                // Maddeler sırayla kayarak görünsün
                const style = { animationDelay: `${index * 26}ms` };
                return item.kind === "label" ? (
                  <div key={`l-${item.text}`} className="topbar-menu-label" style={style}>
                    {item.text}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="topbar-menu-item"
                    style={style}
                  >
                    {item.text}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
