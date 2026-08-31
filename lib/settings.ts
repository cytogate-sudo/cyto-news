import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ThemeSettings = {
  paper: string;
  paper_card: string;
  ink: string;
  ink_soft: string;
  bordo: string;
  bordo_deep: string;
  gold: string;
  muted: string;
};

export type MastheadSettings = {
  eyebrow: string;
  title: string;
  subtitle: string;
  university: string;
  footer_text: string;
  instagram_handle: string;
  instagram_url: string;
};

export type SiteSettings = {
  theme: ThemeSettings;
  masthead: MastheadSettings;
};

export const DEFAULT_THEME: ThemeSettings = {
  paper: "#f1e6cc",
  paper_card: "#fbf4e4",
  ink: "#241c14",
  ink_soft: "#4a3e2e",
  bordo: "#7a2b28",
  bordo_deep: "#591e1c",
  gold: "#a9822e",
  muted: "#7a6c55",
};

export const THEME_PRESETS: { name: string; theme: ThemeSettings }[] = [
  { name: "Vintage (varsayılan)", theme: DEFAULT_THEME },
  {
    name: "Gece Baskısı",
    theme: {
      paper: "#1e1a16",
      paper_card: "#2a251f",
      ink: "#efe6d4",
      ink_soft: "#c9bda6",
      bordo: "#d98a86",
      bordo_deep: "#b96560",
      gold: "#d4af5e",
      muted: "#9c8f78",
    },
  },
  {
    name: "Deniz Feneri",
    theme: {
      paper: "#e8eef1",
      paper_card: "#f7fafc",
      ink: "#14212b",
      ink_soft: "#31485a",
      bordo: "#1f5673",
      bordo_deep: "#153d52",
      gold: "#b08d3e",
      muted: "#5f7382",
    },
  },
  {
    name: "Botanik",
    theme: {
      paper: "#e9edda",
      paper_card: "#f6f8ec",
      ink: "#1f2415",
      ink_soft: "#445030",
      bordo: "#3f6135",
      bordo_deep: "#2c4625",
      gold: "#a9822e",
      muted: "#75805c",
    },
  },
];

export const DEFAULT_MASTHEAD: MastheadSettings = {
  eyebrow: "Biyoteknolojik Araştırmalar Topluluğu",
  title: "CYTOGATE",
  subtitle: "Bilim Gazetesi",
  university: "Gebze Teknik Üniversitesi",
  footer_text: "Cytogate · Gebze Teknik Üniversitesi",
  instagram_handle: "@gtucytogate",
  instagram_url: "https://www.instagram.com/gtucytogate",
};

export const DEFAULT_SETTINGS: SiteSettings = {
  theme: DEFAULT_THEME,
  masthead: DEFAULT_MASTHEAD,
};

/**
 * site_settings tablosundan ayarları okur; tablo yoksa veya satır eksikse
 * varsayılanlarla tamamlar (site admin migration'ı olmadan da çalışır).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return DEFAULT_SETTINGS;

  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error || !data) return DEFAULT_SETTINGS;

  const map = Object.fromEntries(data.map((row) => [row.key, row.value]));
  return {
    theme: { ...DEFAULT_THEME, ...(map.theme ?? {}) },
    masthead: { ...DEFAULT_MASTHEAD, ...(map.masthead ?? {}) },
  };
}

export function themeCssVariables(theme: ThemeSettings): string {
  return `:root{--paper:${theme.paper};--paper-card:${theme.paper_card};--ink:${theme.ink};--ink-soft:${theme.ink_soft};--bordo:${theme.bordo};--bordo-deep:${theme.bordo_deep};--gold:${theme.gold};--muted:${theme.muted};}`;
}
