import Link from "next/link";
import { getBrandingAssets } from "@/lib/settings/repo";

/**
 * DEFAULT_COMPONENT for the header slot. Nothing like this existed before
 * Theme Builder — kept intentionally minimal; swap in the site's real header
 * markup here whenever that's designed.
 */
export async function Header() {
  const { logoLight } = await getBrandingAssets();
  return (
    <header className="flex items-center justify-between border-b border-black/10 px-6 py-4">
      <Link href="/" className="font-semibold">
        {logoLight?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoLight.url} alt={logoLight.alt ?? "Logo"} className="h-8 w-auto" />
        ) : (
          "aska"
        )}
      </Link>
    </header>
  );
}

export default Header;
