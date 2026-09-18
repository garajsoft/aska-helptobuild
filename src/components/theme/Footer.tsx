/**
 * DEFAULT_COMPONENT for the footer slot. Nothing like this existed before
 * Theme Builder — kept intentionally minimal; swap in the site's real footer
 * markup here whenever that's designed.
 */
export function Footer() {
  return (
    <footer className="border-t border-black/10 px-6 py-6 text-sm text-zinc-500">
      © {new Date().getFullYear()} åska. All rights reserved.
    </footer>
  );
}

export default Footer;
