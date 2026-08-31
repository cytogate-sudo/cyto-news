import { getCategories } from "@/lib/gazete";
import { getSiteSettings } from "@/lib/settings";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollToTop } from "@/components/ScrollToTop";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [categories, settings] = await Promise.all([getCategories(), getSiteSettings()]);

  return (
    <>
      <TopBar categories={categories} masthead={settings.masthead} />
      <hr className="hairline" />
      <div className="flex-1">{children}</div>
      <SiteFooter masthead={settings.masthead} />
      <ScrollToTop />
    </>
  );
}
