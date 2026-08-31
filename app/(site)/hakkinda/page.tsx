import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kulüp Hakkında — Cytogate Bilim Gazetesi",
};

export default function AboutPage() {
  return (
    <div className="article-shell">
      <div className="article-kicker">Kulüp Hakkında</div>
      <h1 className="article-title">GTÜ CytoGate Biyoteknolojik Araştırmalar Öğrenci Topluluğu</h1>

      <div className="article-body" style={{ marginTop: 28 }}>
        <p>
          GTÜ CytoGate, Gebze Teknik Üniversitesi bünyesinde faaliyet gösteren bir
          biyoteknolojik araştırmalar öğrenci topluluğudur. Yönetim Kurulu; Sosyal Medya ve
          Tasarım/Yayın, Finans, Takım ve Organizasyon Koordinatörlükleri altında
          yapılanmıştır. Kulüp; bilimsel makale tartışmalarından proje takımlarına, sektör
          buluşmalarından yarışma katılımlarına kadar geniş bir yelpazede öğrenci odaklı
          faaliyet yürütür.
        </p>

        <div className="term-box">
          <div className="kicker">Misyon</div>
          <p style={{ margin: 0 }}>
            Biyoteknolojiyle ilgilenen öğrencileri bir araya getirerek onları bilimsel üretim
            yapan, gerçek projeler geliştiren ve disiplinler arası ekiplerde çalışabilen
            bireylere dönüştürmek.
          </p>
        </div>

        <div className="term-box">
          <div className="kicker">Vizyon</div>
          <p style={{ margin: 0 }}>
            Yalnızca kendi bölümüyle sınırlı kalmayan; GTÜ&apos;nün tamamına açık, aynı zamanda
            diğer üniversitelerin öğrenci topluluklarıyla ve sektörün öncü biyoteknoloji
            kuruluşlarıyla köprü kuran, Türkiye&apos;nin biyoteknoloji ekosisteminde tanınan bir
            öğrenci topluluğu olmak.
          </p>
        </div>

        <p>
          Kulüp, düzenli olarak <strong>Paper Club</strong> tartışmaları, <strong>Biyo
          Panel</strong> serisi, <strong>Biyogirişimcilik Konferansı</strong> ve TEKNOFEST
          hazırlık süreçleri gibi etkinlikler düzenler; GOGEC 2026&apos;da CytoCyst takımının
          kazandığı gümüş madalya gibi somut başarılara imza atar.
        </p>

        <p>
          Bu gazete, kulübün bilimsel üretimini ve etkinliklerini düzenli olarak okuyucuyla
          buluşturmak için hazırlanıyor.
        </p>
      </div>
    </div>
  );
}
