import "server-only";
import { getPayload } from "payload";
import config from "@/payload.config";
import { ADMIN_THEME_DEFAULTS, buildAdminThemeCss, type AdminThemeVars } from "./adminTheme";

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
