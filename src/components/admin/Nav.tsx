"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AskaMark } from "./AskaMark";

interface Entry {
  href: string;
  label: string;
  countSlug?: string;
  isGlobal?: boolean;
}

const ENTRIES: Entry[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/collections/pages", label: "Pages", countSlug: "pages" },
  { href: "/admin/collections/blog", label: "Blog", countSlug: "blog" },
  { href: "/admin/collections/forms", label: "Forms", countSlug: "forms" },
  {
    href: "/admin/collections/form-submissions",
    label: "Form Submissions",
    countSlug: "form-submissions",
  },
  { href: "/admin/collections/products", label: "Products", countSlug: "products" },
  {
    href: "/admin/collections/house-designs",
    label: "House Designs",
    countSlug: "house-designs",
  },
  { href: "/admin/collections/orders", label: "Orders", countSlug: "orders" },
  { href: "/admin/collections/users", label: "Users", countSlug: "users" },
  { href: "/admin/collections/media", label: "Media", countSlug: "media" },
  { href: "/admin/collections/templates", label: "Templates", countSlug: "templates" },
  { href: "/admin/collections/components", label: "Components", countSlug: "components" },
  { href: "/admin/collections/styles", label: "Styles", countSlug: "styles" },
  {
    href: "/admin/collections/code-snippets",
    label: "Code Snippets",
    countSlug: "code-snippets",
  },
  { href: "/admin/globals/settings", label: "Settings", isGlobal: true },
];

interface Me {
  user?: { email?: string } | null;
}

export const AskaNav = () => {
  const pathname = usePathname() ?? "";
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [me, setMe] = useState<Me["user"]>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        ENTRIES.filter((e) => e.countSlug).map(async (e) => {
          try {
            const r = await fetch(`/api/${e.countSlug}?limit=0&depth=0`, {
              credentials: "include",
            });
            if (!r.ok) return [e.countSlug!, 0] as const;
            const j = (await r.json()) as { totalDocs?: number };
            return [e.countSlug!, j.totalDocs ?? 0] as const;
          } catch {
            return [e.countSlug!, 0] as const;
          }
        })
      );
      if (cancelled) return;
      const map: Record<string, number> = {};
      for (const [slug, n] of results) map[slug] = n;
      setCounts(map);

      try {
        const r = await fetch("/api/users/me", { credentials: "include" });
        if (r.ok) {
          const j = (await r.json()) as Me;
          if (!cancelled) setMe(j.user ?? null);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav className="aska-nav">
      <div className="aska-nav__brand">
        <AskaMark height={26} />
      </div>

      <ul className="aska-nav__list">
        {ENTRIES.map((e) => {
          const active =
            e.href === "/admin"
              ? pathname === "/admin"
              : pathname === e.href || pathname.startsWith(`${e.href}/`);
          const n = e.countSlug ? counts[e.countSlug] : undefined;
          return (
            <li key={e.href}>
              <Link
                href={e.href}
                className={`aska-nav__item${active ? " is-active" : ""}`}
              >
                <span className="aska-nav__label">{e.label}</span>
                {typeof n === "number" && n > 0 && (
                  <span className="aska-nav__count">{n.toLocaleString()}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {me && (
        <div className="aska-nav__me">
          <span className="aska-nav__avatar" aria-hidden>
            {(me.email ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="aska-nav__me-text">{me.email}</span>
        </div>
      )}
    </nav>
  );
};

export default AskaNav;
