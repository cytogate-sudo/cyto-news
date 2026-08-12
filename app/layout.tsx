import type { Metadata } from "next";
import "./globals.css";
import { getCategories } from "@/lib/gazete";
import { CategoryNav } from "@/components/CategoryNav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Cytogate — Bilim Gazetesi",
  description:
    "GTÜ CytoGate Biyoteknolojik Araştırmalar Öğrenci Topluluğu'nun dijital bilim gazetesi.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();

  return (
    <html lang="tr">
      <body className="min-h-screen flex flex-col">
        <CategoryNav categories={categories} />
        <hr className="hairline" />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
