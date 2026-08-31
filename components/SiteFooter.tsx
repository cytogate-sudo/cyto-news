import type { MastheadSettings } from "@/lib/settings";

export function SiteFooter({ masthead }: { masthead: MastheadSettings }) {
  return (
    <footer className="site-footer">
      <span>
        {masthead.footer_text} © {new Date().getFullYear()}
      </span>
      <a href={masthead.instagram_url} target="_blank" rel="noopener noreferrer">
        {masthead.instagram_handle}
      </a>
    </footer>
  );
}
