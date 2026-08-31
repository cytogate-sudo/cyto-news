import { getCategories } from "@/lib/gazete";
import { getSiteSettings } from "@/lib/settings";
import { CategoryNav } from "@/components/CategoryNav";
import { SiteFooter } from "@/components/SiteFooter";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [categories, settings] = await Promise.all([getCategories(), getSiteSettings()]);

  return (
    <>
      <CategoryNav categories={categories} masthead={settings.masthead} />
      <hr className="hairline" />
      <div className="flex-1">{children}</div>
      <SiteFooter masthead={settings.masthead} />
    </>
  );
}
