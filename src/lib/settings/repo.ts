import "server-only";
import { getPayload } from "payload";
import config from "@/payload.config";
import { ADMIN_THEME_DEFAULTS, buildAdminThemeCss, type AdminThemeVars } from "./adminTheme";
import {
  TYPOGRAPHY_DEFAULTS,
  type FontLibraryEntry,
  type FontStyle,
  type FontWeight,
  type TypographySettings,
} from "./typography";

export async function getHomepageSlug(): Promise<string | null> {
  const p = await getPayload({ config });
  const s = await p.findGlobal({ slug: "settings", depth: 1 });
  const hp = (s as { homepage?: { slug?: string } | number | string | null }).homepage;
  if (!hp || typeof hp !== "object") return null;
  return hp.slug ?? null;
}

export interface BrandingAsset {
  url?: string;
  alt?: string;
}

/** Branding media for `{{settings.logoLight}}` / `.logoDark` / `.favicon` placeholders. */
export async function getBrandingAssets(): Promise<{
  logoLight: BrandingAsset | null;
  logoDark: BrandingAsset | null;
  favicon: BrandingAsset | null;
}> {
  const p = await getPayload({ config });
  const s = await p.findGlobal({ slug: "settings", depth: 1 });
  const asset = (v: unknown): BrandingAsset | null =>
    v && typeof v === "object" ? (v as BrandingAsset) : null;
  const settings = s as { logoLight?: unknown; logoDark?: unknown; favicon?: unknown };
  return {
    logoLight: asset(settings.logoLight),
    logoDark: asset(settings.logoDark),
    favicon: asset(settings.favicon),
  };
}

interface AdminThemeSettingsDoc {
  adminPrimaryColor?: string;
  adminPrimaryButtonText?: string;
  adminFocusColor?: string;
  lightMainBackground?: string;
  lightCardBackground?: string;
  lightBaseText?: string;
  lightMutedText?: string;
  lightBorderColor?: string;
  lightSidebarBackground?: string;
  lightSidebarText?: string;
  darkMainBackground?: string;
  darkCardBackground?: string;
  darkBaseText?: string;
  darkMutedText?: string;
  darkBorderColor?: string;
  darkSidebarBackground?: string;
  darkSidebarText?: string;
}

/** The /admin dashboard's :root CSS override, built from Settings → Admin Theme. */
export async function getAdminThemeCss(): Promise<string> {
  const p = await getPayload({ config });
  const s = await p.findGlobal({ slug: "settings", depth: 0 });
  const d = s as AdminThemeSettingsDoc;
  const { light: L, dark: D } = ADMIN_THEME_DEFAULTS;
  const vars: AdminThemeVars = {
    primary: d.adminPrimaryColor || ADMIN_THEME_DEFAULTS.primary,
    primaryButtonText: d.adminPrimaryButtonText || ADMIN_THEME_DEFAULTS.primaryButtonText,
    focus: d.adminFocusColor || ADMIN_THEME_DEFAULTS.focus,
    light: {
      mainBg: d.lightMainBackground || L.mainBg,
      cardBg: d.lightCardBackground || L.cardBg,
      baseText: d.lightBaseText || L.baseText,
      mutedText: d.lightMutedText || L.mutedText,
      border: d.lightBorderColor || L.border,
      sidebarBg: d.lightSidebarBackground || L.sidebarBg,
      sidebarText: d.lightSidebarText || L.sidebarText,
    },
    dark: {
      mainBg: d.darkMainBackground || D.mainBg,
      cardBg: d.darkCardBackground || D.cardBg,
      baseText: d.darkBaseText || D.baseText,
      mutedText: d.darkMutedText || D.mutedText,
      border: d.darkBorderColor || D.border,
      sidebarBg: d.darkSidebarBackground || D.sidebarBg,
      sidebarText: d.darkSidebarText || D.sidebarText,
    },
  };
  return buildAdminThemeCss(vars);
}

interface FontLibraryEntryDoc {
  id: string;
  label?: string | null;
  fontFamilyName?: string | null;
  fontFile?: { url?: string; filename?: string; mimeType?: string } | number | string | null;
  fontWeight?: FontWeight | null;
  fontStyle?: FontStyle | null;
}

interface TypographySettingsDoc {
  typography?: {
    fontProvider?: "google_fonts" | "custom_upload";
    googleFontUrl?: string | null;
    fontFamilyName?: string | null;
    customFontLibrary?: FontLibraryEntryDoc[] | null;
    activeCustomFont?: string | null;
    applyToAdminUI?: boolean | null;
  };
}

/** woff2/ttf/otf — from the uploaded file's extension, since Media doesn't
 * carry a separate "this is a font, here's its format" field. */
function fontFormatFromMedia(
  v: FontLibraryEntryDoc["fontFile"]
): FontLibraryEntry["fileFormat"] {
  const name = v && typeof v === "object" ? (v.filename ?? v.url ?? "") : "";
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "woff2") return "woff2";
  if (ext === "ttf") return "truetype";
  if (ext === "otf") return "opentype";
  return null;
}

function fileUrl(v: FontLibraryEntryDoc["fontFile"]): string | null {
  return v && typeof v === "object" ? (v.url ?? null) : null;
}

/** Settings → Typography, normalized for typography.ts's CSS/HTML builders. */
export async function getTypographySettings(): Promise<TypographySettings> {
  const p = await getPayload({ config });
  // depth: 1 so each library entry's `fontFile` upload relationship resolves
  // to its `url`/`filename`.
  const s = (await p.findGlobal({ slug: "settings", depth: 1 })) as TypographySettingsDoc;
  const t = s.typography ?? {};
  const customFontLibrary: FontLibraryEntry[] = (t.customFontLibrary ?? []).map((entry) => ({
    id: entry.id,
    label: entry.label ?? "",
    fontFamilyName: entry.fontFamilyName ?? "",
    fileUrl: fileUrl(entry.fontFile),
    fileFormat: fontFormatFromMedia(entry.fontFile),
    fontWeight: entry.fontWeight ?? "400",
    fontStyle: entry.fontStyle ?? "normal",
  }));
  return {
    fontProvider: t.fontProvider ?? TYPOGRAPHY_DEFAULTS.fontProvider,
    googleFontUrl: t.googleFontUrl ?? "",
    fontFamilyName: t.fontFamilyName ?? TYPOGRAPHY_DEFAULTS.fontFamilyName,
    customFontLibrary,
    activeCustomFontId: t.activeCustomFont ?? "",
    applyToAdminUI: t.applyToAdminUI ?? TYPOGRAPHY_DEFAULTS.applyToAdminUI,
  };
}
