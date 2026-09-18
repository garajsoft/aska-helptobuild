import "server-only";
import { getPayload } from "payload";
import config from "@/payload.config";

export type ThemeSlotMode = "DEFAULT_COMPONENT" | "SAVED_TEMPLATE" | "CUSTOM_BUILD" | "NONE";

export interface ThemeSlot {
  mode: ThemeSlotMode;
  template: { id: string | number; html: string; css: string; js: string } | null;
  html: string;
  css: string;
}

export interface ThemeRule {
  id: string;
  targetPageSlugs: string[];
  header: ThemeSlot;
  footer: ThemeSlot;
}

export interface ThemeBuilderDoc {
  header: ThemeSlot;
  footer: ThemeSlot;
  rules: ThemeRule[];
}

interface RawSlot {
  mode?: ThemeSlotMode;
  template?: { id: string | number; html?: string | null; css?: string | null; js?: string | null } | string | number | null;
  html?: string | null;
  css?: string | null;
}

async function payload() {
  return getPayload({ config });
}

function mapSlot(raw: RawSlot | undefined): ThemeSlot {
  const template =
    raw?.template && typeof raw.template === "object"
      ? {
          id: raw.template.id,
          html: raw.template.html ?? "",
          css: raw.template.css ?? "",
          js: raw.template.js ?? "",
        }
      : null;
  return {
    mode: raw?.mode ?? "DEFAULT_COMPONENT",
    template,
    html: raw?.html ?? "",
    css: raw?.css ?? "",
  };
}

/** Full theme config, relationships populated (depth: 1) — for rendering the site. */
export async function readThemeBuilder(): Promise<ThemeBuilderDoc> {
  const p = await payload();
  const doc = (await p.findGlobal({ slug: "theme-builder", depth: 1 })) as {
    header?: RawSlot;
    footer?: RawSlot;
    customRules?: { id: string; targetPages?: ({ slug?: string } | string | number)[]; header?: RawSlot; footer?: RawSlot }[];
  };
  return {
    header: mapSlot(doc.header),
    footer: mapSlot(doc.footer),
    rules: (doc.customRules ?? []).map((r) => ({
      id: r.id,
      targetPageSlugs: (r.targetPages ?? [])
        .map((pg) => (typeof pg === "object" ? pg.slug : undefined))
        .filter((slug): slug is string => Boolean(slug)),
      header: mapSlot(r.header),
      footer: mapSlot(r.footer),
    })),
  };
}

/** Raw (relationships as IDs, depth: 0) — for the theme-slot editor page and safe re-saves. */
async function readThemeBuilderRaw() {
  const p = await payload();
  return (await p.findGlobal({ slug: "theme-builder", depth: 0 })) as {
    header?: RawSlot;
    footer?: RawSlot;
    customRules?: { id: string; header?: RawSlot; footer?: RawSlot }[];
  };
}

/** Initial html/css + a display label for the `/editor/theme/[scope]/[slot]` route. */
export async function readThemeSlot(
  scope: string,
  slot: "header" | "footer"
): Promise<{ html: string; css: string; label: string } | null> {
  const doc = await readThemeBuilderRaw();
  if (scope === "global") {
    const s = doc[slot];
    return { html: s?.html ?? "", css: s?.css ?? "", label: `Global ${slot}` };
  }
  const rule = (doc.customRules ?? []).find((r) => r.id === scope);
  if (!rule) return null;
  const s = rule[slot];
  return { html: s?.html ?? "", css: s?.css ?? "", label: `Override — ${slot}` };
}

/** Writes CUSTOM_BUILD html/css for one slot, leaving mode/template/targetPages untouched. */
export async function updateThemeSlotContent(input: {
  scope: string;
  slot: "header" | "footer";
  html: string;
  css: string;
}): Promise<void> {
  const p = await payload();
  const current = await readThemeBuilderRaw();

  if (input.scope === "global") {
    await p.updateGlobal({
      slug: "theme-builder",
      data: {
        [input.slot]: { ...current[input.slot], html: input.html, css: input.css },
      },
    });
    return;
  }

  const rules = current.customRules ?? [];
  const updatedRules = rules.map((rule) =>
    rule.id === input.scope
      ? { ...rule, [input.slot]: { ...rule[input.slot], html: input.html, css: input.css } }
      : rule
  );
  await p.updateGlobal({ slug: "theme-builder", data: { customRules: updatedRules } });
}
