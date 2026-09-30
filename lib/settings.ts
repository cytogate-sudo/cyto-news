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
  team_card: string;
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

/** Hakkında sayfasındaki Misyon/Vizyon gibi çerçeveli kutular */
export type AboutHighlight = {
  title: string;
  text: string;
};

export type AboutSettings = {
  kicker: string;
  title: string;
  /** Kutuların üstünde kalan metin (Markdown) */
  intro: string;
  highlights: AboutHighlight[];
  /** Kutuların altında kalan metin (Markdown) */
  outro: string;
};

export type SiteSettings = {
  theme: ThemeSettings;
  masthead: MastheadSettings;
  about: AboutSettings;
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
  team_card: "#1f4f4a",
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
      team_card: "#2f5f58",
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
      team_card: "#1b3d52",
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
      team_card: "#2c4625",
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

// Panelden hiç kaydedilmediyse gösterilecek metin — sayfanın ilk halidir.
export const DEFAULT_ABOUT: AboutSettings = {
  kicker: "Kulüp Hakkında",
  title: "GTÜ CytoGate Biyoteknolojik Araştırmalar Öğrenci Topluluğu",
  intro:
    "GTÜ CytoGate, Gebze Teknik Üniversitesi bünyesinde faaliyet gösteren bir biyoteknolojik araştırmalar öğrenci topluluğudur. Yönetim Kurulu; Sosyal Medya ve Tasarım/Yayın, Finans, Takım ve Organizasyon Koordinatörlükleri altında yapılanmıştır. Kulüp; bilimsel makale tartışmalarından proje takımlarına, sektör buluşmalarından yarışma katılımlarına kadar geniş bir yelpazede öğrenci odaklı faaliyet yürütür.",
  highlights: [
    {
      title: "Misyon",
      text: "Biyoteknolojiyle ilgilenen öğrencileri bir araya getirerek onları bilimsel üretim yapan, gerçek projeler geliştiren ve disiplinler arası ekiplerde çalışabilen bireylere dönüştürmek.",
    },
    {
      title: "Vizyon",
      text: "Yalnızca kendi bölümüyle sınırlı kalmayan; GTÜ'nün tamamına açık, aynı zamanda diğer üniversitelerin öğrenci topluluklarıyla ve sektörün öncü biyoteknoloji kuruluşlarıyla köprü kuran, Türkiye'nin biyoteknoloji ekosisteminde tanınan bir öğrenci topluluğu olmak.",
    },
  ],
  outro:
    "Kulüp, düzenli olarak **Paper Club** tartışmaları, **Biyo Panel** serisi, **Biyogirişimcilik Konferansı** ve TEKNOFEST hazırlık süreçleri gibi etkinlikler düzenler; GOGEC 2026'da CytoCyst takımının kazandığı gümüş madalya gibi somut başarılara imza atar.\n\nBu gazete, kulübün bilimsel üretimini ve etkinliklerini düzenli olarak okuyucuyla buluşturmak için hazırlanıyor.",
};

export const DEFAULT_SETTINGS: SiteSettings = {
  theme: DEFAULT_THEME,
  masthead: DEFAULT_MASTHEAD,
  about: DEFAULT_ABOUT,
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
  const about = { ...DEFAULT_ABOUT, ...(map.about ?? {}) };
  return {
    theme: { ...DEFAULT_THEME, ...(map.theme ?? {}) },
    masthead: { ...DEFAULT_MASTHEAD, ...(map.masthead ?? {}) },
    // Kutular silinip boş kaydedilmiş olabilir; dizi değilse varsayılana dön
    about: {
      ...about,
      highlights: Array.isArray(about.highlights) ? about.highlights : DEFAULT_ABOUT.highlights,
    },
  };
}

export function themeCssVariables(theme: ThemeSettings): string {
  return `:root{--paper:${theme.paper};--paper-card:${theme.paper_card};--ink:${theme.ink};--ink-soft:${theme.ink_soft};--bordo:${theme.bordo};--bordo-deep:${theme.bordo_deep};--gold:${theme.gold};--muted:${theme.muted};--team-card-bg:${theme.team_card};}`;
}
