import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings, themeCssVariables } from "@/lib/settings";

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
  const settings = await getSiteSettings();

  return (
    <html lang="tr">
      <head>
        {/* Tema renkleri panelden düzenlenebilir; globals.css'teki :root
            varsayılanlarını veritabanındaki değerlerle ezer. */}
        <style dangerouslySetInnerHTML={{ __html: themeCssVariables(settings.theme) }} />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
