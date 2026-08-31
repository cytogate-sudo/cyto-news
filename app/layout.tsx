import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings, themeCssVariables } from "@/lib/settings";

const SITE_URL = "https://cyto-news.vercel.app";
const SITE_DESCRIPTION =
  "GTÜ CytoGate Biyoteknolojik Araştırmalar Öğrenci Topluluğu'nun dijital bilim gazetesi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Cytogate — Bilim Gazetesi",
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: "Cytogate Bilim Gazetesi",
    locale: "tr_TR",
    type: "website",
    title: "Cytogate — Bilim Gazetesi",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
  },
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
