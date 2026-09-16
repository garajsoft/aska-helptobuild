/**
 * Builds the CSS/HTML for the site's single "master font" (Settings →
 * Typography): a Google Fonts stylesheet link, or an @font-face block per
 * entry in the custom font library (all of them, so switching the active
 * one is instant — no new file to load), plus the --font-master variable
 * and the body/control override that actually applies the active one.
 * Shared by the public site's <head> (src/app/(site)/layout.tsx) and, when
 * enabled, the admin panel (see repo.ts's getAdminTypographyCss).
 */

export type FontProvider = "google_fonts" | "custom_upload";
export type FontWeight = "300" | "400" | "500" | "600" | "700";
export type FontStyle = "normal" | "italic";

export interface FontLibraryEntry {
  id: string;
  label: string;
  fontFamilyName: string;
  fileUrl: string | null;
  fileFormat: "woff2" | "truetype" | "opentype" | null;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
}

export interface TypographySettings {
  fontProvider: FontProvider;
  googleFontUrl: string;
  fontFamilyName: string;
  customFontLibrary: FontLibraryEntry[];
  activeCustomFontId: string;
  applyToAdminUI: boolean;
}

export const TYPOGRAPHY_DEFAULTS: Pick<
  TypographySettings,
  "fontProvider" | "fontFamilyName" | "applyToAdminUI"
> = {
  fontProvider: "google_fonts",
  fontFamilyName: "",
  applyToAdminUI: true,
};

/** First name in a CSS font-family stack, unquoted — what @font-face's own
 * `font-family` needs (the fallback stack after it is meaningless there). */
function primaryFontName(fontFamilyName: string): string {
  const first = fontFamilyName.split(",")[0]?.trim() ?? "";
  return first.replace(/^['"]|['"]$/g, "") || "Custom Font";
}

export function buildGoogleFontLinkHtml(googleFontUrl: string): string {
  if (!googleFontUrl) return "";
  return (
    `<link rel="preconnect" href="https://fonts.googleapis.com">\n` +
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
    `<link rel="stylesheet" href="${googleFontUrl}">`
  );
}

/** One @font-face block per library entry that actually has a file — every
 * entry, not just the active one, so switching --font-master later never
 * waits on a new stylesheet. */
export function buildFontFaceCss(library: FontLibraryEntry[]): string {
  return library
    .filter((e) => e.fontFamilyName && e.fileUrl && e.fileFormat)
    .map(
      (e) =>
        `@font-face {\n` +
        `  font-family: '${primaryFontName(e.fontFamilyName)}';\n` +
        `  src: url('${e.fileUrl}') format('${e.fileFormat}');\n` +
        `  font-weight: ${e.fontWeight};\n` +
        `  font-style: ${e.fontStyle};\n` +
        `  font-display: swap;\n` +
        `}`
    )
    .join("\n");
}

/** Element-type selectors this forces the master font onto — every text
 * and form-control tag, not just body. Plain inheritance from `body` isn't
 * enough: any element with its OWN font-family (an inline style, a
 * component's scoped <style> block, a Tailwind utility class) wins over an
 * inherited value regardless of specificity, so this has to name those
 * elements directly. `!important` is what then lets it still win against a
 * component's own non-!important rule. */
const FONT_MASTER_SELECTOR =
  "body, p, span, a, h1, h2, h3, h4, h5, h6, input, textarea, select, button, label";

export function buildFontMasterCss(fontFamilyName: string): string {
  if (!fontFamilyName) return "";
  return (
    `:root {\n  --font-master: ${fontFamilyName};\n}\n` +
    `${FONT_MASTER_SELECTOR} {\n  font-family: var(--font-master), sans-serif !important;\n}\n`
  );
}

/** The font-family string that should back --font-master right now: the
 * Google Fonts field for that provider, or — for custom uploads — whichever
 * library entry is selected as active (falling back to the first entry so
 * a library with nothing explicitly picked still renders something). */
export function resolveActiveFontFamilyName(t: TypographySettings): string {
  if (t.fontProvider === "google_fonts") return t.fontFamilyName;
  const active =
    t.customFontLibrary.find((e) => e.id === t.activeCustomFontId) ?? t.customFontLibrary[0];
  return active?.fontFamilyName ?? "";
}

/** Public-site <head> fragment: font source (link, or every library
 * entry's @font-face) + the --font-master var/override, in load-priority
 * order. */
export function buildTypographyHeadHtml(t: TypographySettings): string {
  const parts: string[] = [];
  if (t.fontProvider === "google_fonts" && t.googleFontUrl) {
    parts.push(buildGoogleFontLinkHtml(t.googleFontUrl));
  }
  if (t.fontProvider === "custom_upload" && t.customFontLibrary.length > 0) {
    const css = buildFontFaceCss(t.customFontLibrary);
    if (css) parts.push(`<style id="aska-font-face">${css}</style>`);
  }
  const masterCss = buildFontMasterCss(resolveActiveFontFamilyName(t));
  if (masterCss) parts.push(`<style id="aska-font-master">${masterCss}</style>`);
  return parts.filter(Boolean).join("\n");
}

/**
 * The typography CSS as a standalone stylesheet: `@import` for Google Fonts
 * (only legal here because this becomes its own file/tag rather than being
 * spliced into a larger one — @import must lead its stylesheet), every
 * library entry's @font-face, and the --font-master override. Shared by
 * everything that needs typography as plain CSS rather than <head> HTML:
 * the admin panel's <style> tag below, the /api/styles/typography.css route
 * (which is how the GrapesJS canvas iframe gets it — see GrapesEditor.tsx's
 * canvas.styles), and anywhere else that isn't the site's own <head>.
 */
export function buildTypographyCss(t: TypographySettings): string {
  const parts: string[] = [];
  if (t.fontProvider === "google_fonts" && t.googleFontUrl) {
    parts.push(`@import url('${t.googleFontUrl}');`);
  }
  if (t.fontProvider === "custom_upload" && t.customFontLibrary.length > 0) {
    const css = buildFontFaceCss(t.customFontLibrary);
    if (css) parts.push(css);
  }
  const masterCss = buildFontMasterCss(resolveActiveFontFamilyName(t));
  if (masterCss) parts.push(masterCss);
  return parts.filter(Boolean).join("\n");
}

/** Same CSS, gated behind Settings → "Also apply to the admin dashboard" —
 * this is the one consumer where that flag is relevant (it's about the
 * admin chrome specifically, not the GrapesJS canvas, which always shows
 * the real site font since it's a preview of real site content). */
export function buildAdminTypographyCss(t: TypographySettings): string {
  return t.applyToAdminUI ? buildTypographyCss(t) : "";
}

// Self-check
if (import.meta.url === `file://${process.argv[1]}`) {
  const gf = buildTypographyHeadHtml({
    fontProvider: "google_fonts",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans&display=swap",
    fontFamilyName: "'Plus Jakarta Sans', sans-serif",
    customFontLibrary: [],
    activeCustomFontId: "",
    applyToAdminUI: true,
  });
  if (
    !gf.includes('<link rel="stylesheet" href="https://fonts.googleapis.com') ||
    !gf.includes("--font-master: 'Plus Jakarta Sans', sans-serif")
  ) {
    console.error("FAIL google_fonts", gf);
    process.exit(1);
  }

  const library: FontLibraryEntry[] = [
    {
      id: "a",
      label: "Acme Sans",
      fontFamilyName: "'Acme Sans', sans-serif",
      fileUrl: "https://cdn.example/acme.woff2",
      fileFormat: "woff2",
      fontWeight: "400",
      fontStyle: "normal",
    },
    {
      id: "b",
      label: "Playfair Bold",
      fontFamilyName: "'Playfair Display', serif",
      fileUrl: "https://cdn.example/playfair.woff2",
      fileFormat: "woff2",
      fontWeight: "700",
      fontStyle: "normal",
    },
  ];

  const cu = buildTypographyHeadHtml({
    fontProvider: "custom_upload",
    googleFontUrl: "",
    fontFamilyName: "",
    customFontLibrary: library,
    activeCustomFontId: "b",
    applyToAdminUI: true,
  });
  if (
    (cu.match(/@font-face/g) ?? []).length !== 2 ||
    !cu.includes("font-family: 'Acme Sans'") ||
    !cu.includes("font-family: 'Playfair Display'") ||
    !cu.includes("font-display: swap") ||
    !cu.includes("--font-master: 'Playfair Display', serif") || // active entry, not the first
    !cu.includes("h1, h2, h3, h4, h5, h6") ||
    !cu.includes("font-family: var(--font-master), sans-serif !important")
  ) {
    console.error("FAIL custom_upload (all @font-face, active entry drives --font-master)", cu);
    process.exit(1);
  }

  const typographyCssIgnoresAdminFlag = buildTypographyCss({
    fontProvider: "google_fonts",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Inter",
    fontFamilyName: "Inter, sans-serif",
    customFontLibrary: [],
    activeCustomFontId: "",
    applyToAdminUI: false,
  });
  if (!typographyCssIgnoresAdminFlag.includes("--font-master")) {
    console.error(
      "FAIL buildTypographyCss (used by the GrapesJS canvas route) must not gate on applyToAdminUI",
      typographyCssIgnoresAdminFlag
    );
    process.exit(1);
  }

  const fallbackToFirst = resolveActiveFontFamilyName({
    fontProvider: "custom_upload",
    googleFontUrl: "",
    fontFamilyName: "",
    customFontLibrary: library,
    activeCustomFontId: "does-not-exist",
    applyToAdminUI: true,
  });
  if (fallbackToFirst !== "'Acme Sans', sans-serif") {
    console.error("FAIL should fall back to first library entry", fallbackToFirst);
    process.exit(1);
  }

  const noAdmin = buildAdminTypographyCss({
    fontProvider: "google_fonts",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Inter",
    fontFamilyName: "Inter, sans-serif",
    customFontLibrary: [],
    activeCustomFontId: "",
    applyToAdminUI: false,
  });
  if (noAdmin !== "") {
    console.error("FAIL applyToAdminUI:false should produce no CSS", noAdmin);
    process.exit(1);
  }

  console.log("ok");
}
