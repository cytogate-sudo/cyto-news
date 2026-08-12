export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Cytogate © {new Date().getFullYear()} · Gebze Teknik Üniversitesi</span>
      <a
        href="https://www.instagram.com/gtucytogate"
        target="_blank"
        rel="noopener noreferrer"
      >
        @gtucytogate
      </a>
    </footer>
  );
}
