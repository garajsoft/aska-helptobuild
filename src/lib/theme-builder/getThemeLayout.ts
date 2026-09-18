import "server-only";
import { readThemeBuilder, type ThemeSlot } from "./repo";

export type ResolvedSlot =
  | { kind: "DEFAULT_COMPONENT" }
  | { kind: "TEMPLATE"; html: string; css: string; js: string }
  | { kind: "CUSTOM"; html: string; css: string }
  | { kind: "NONE" };

export interface ThemeLayout {
  header: ResolvedSlot;
  footer: ResolvedSlot;
}

function resolveSlot(slot: ThemeSlot): ResolvedSlot {
  switch (slot.mode) {
    case "SAVED_TEMPLATE":
      // ponytail: no block picked yet — fail safe to the built-in component
      // instead of rendering nothing.
      return slot.template
        ? { kind: "TEMPLATE", html: slot.template.html, css: slot.template.css, js: slot.template.js }
        : { kind: "DEFAULT_COMPONENT" };
    case "CUSTOM_BUILD":
      return { kind: "CUSTOM", html: slot.html, css: slot.css };
    case "NONE":
      return { kind: "NONE" };
    default:
      return { kind: "DEFAULT_COMPONENT" };
  }
}

/**
 * Resolves which header/footer to render for a page.
 *
 * `pathname` is the page's `slug` (e.g. "about", not "/about" — Pages.slug
 * has no leading slash). The first customRules entry whose targetPages
 * includes that slug wins; otherwise Global Defaults apply.
 *
 * This is a pure lookup with no knowledge of Next's routing — call it from
 * each page (home `page.tsx`, `[slug]/page.tsx`, `blog/[slug]/page.tsx`, …)
 * with whatever slug that page already resolved from `params`, and render
 * the result around `children` there. There's currently no shared pathname
 * available in the root `(site)/layout.tsx` to do this once for every route
 * (see AGENTS.md: Next 16 renamed Middleware to `proxy.ts` — that's the
 * place to add one if a single shared insertion point is wanted later).
 */
export async function getThemeLayout(pathname: string): Promise<ThemeLayout> {
  const theme = await readThemeBuilder();
  const slug = pathname.replace(/^\/+/, "");
  const rule = theme.rules.find((r) => r.targetPageSlugs.includes(slug));
  const source = rule ?? theme;
  return { header: resolveSlot(source.header), footer: resolveSlot(source.footer) };
}
