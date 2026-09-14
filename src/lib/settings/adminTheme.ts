/**
 * Builds the :root override CSS that feeds Payload admin theme colors (see
 * custom.scss, which maps --admin-* onto Payload's own --theme-* variables)
 * from Settings → Admin Theme. Global tokens go on a bare :root (same in
 * both themes); light/dark tokens are scoped to :root[data-theme="..."] so
 * a light-only value can never leak into dark mode (or vice versa).
 */

export interface ThemeModeVars {
  mainBg: string;
  cardBg: string;
  baseText: string;
  mutedText: string;
  border: string;
  sidebarBg: string;
  sidebarText: string;
}

export interface AdminThemeVars {
  primary: string;
  primaryButtonText: string;
  focus: string;
  light: ThemeModeVars;
  dark: ThemeModeVars;
}

export const ADMIN_THEME_DEFAULTS: AdminThemeVars = {
  primary: "#6395DA",
  primaryButtonText: "#FFFFFF",
  focus: "#6395DA",
  light: {
    mainBg: "#FFFFFF",
    cardBg: "#F8FAFC",
    baseText: "#0F172A",
    mutedText: "#64748B",
    border: "#E2E8F0",
    sidebarBg: "#F8FAFC",
    sidebarText: "#0F172A",
  },
  dark: {
    mainBg: "#141E2C",
    cardBg: "#1B2638",
    baseText: "#F8FAFC",
    mutedText: "#94A3B8",
    border: "#2D3748",
    sidebarBg: "#1B2638",
    sidebarText: "#F8FAFC",
  },
};

function modeBlock(theme: "light" | "dark", v: ThemeModeVars): string {
  return (
    `:root[data-theme="${theme}"] {\n` +
    `  --admin-main-bg: ${v.mainBg};\n` +
    `  --admin-card-bg: ${v.cardBg};\n` +
    `  --admin-base-text: ${v.baseText};\n` +
    `  --admin-muted-text: ${v.mutedText};\n` +
    `  --admin-border: ${v.border};\n` +
    `  --admin-sidebar-bg: ${v.sidebarBg};\n` +
    `  --admin-sidebar-text: ${v.sidebarText};\n` +
    `}\n`
  );
}

export function buildAdminThemeCss(vars: AdminThemeVars): string {
  return (
    `:root {\n` +
    `  --admin-primary: ${vars.primary};\n` +
    `  --admin-primary-text: ${vars.primaryButtonText};\n` +
    `  --admin-focus: ${vars.focus};\n` +
    `}\n` +
    modeBlock("light", vars.light) +
    modeBlock("dark", vars.dark)
  );
}

// Self-check
if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildAdminThemeCss(ADMIN_THEME_DEFAULTS);
  const expected =
    ":root {\n" +
    "  --admin-primary: #6395DA;\n" +
    "  --admin-primary-text: #FFFFFF;\n" +
    "  --admin-focus: #6395DA;\n" +
    "}\n" +
    ':root[data-theme="light"] {\n' +
    "  --admin-main-bg: #FFFFFF;\n" +
    "  --admin-card-bg: #F8FAFC;\n" +
    "  --admin-base-text: #0F172A;\n" +
    "  --admin-muted-text: #64748B;\n" +
    "  --admin-border: #E2E8F0;\n" +
    "  --admin-sidebar-bg: #F8FAFC;\n" +
    "  --admin-sidebar-text: #0F172A;\n" +
    "}\n" +
    ':root[data-theme="dark"] {\n' +
    "  --admin-main-bg: #141E2C;\n" +
    "  --admin-card-bg: #1B2638;\n" +
    "  --admin-base-text: #F8FAFC;\n" +
    "  --admin-muted-text: #94A3B8;\n" +
    "  --admin-border: #2D3748;\n" +
    "  --admin-sidebar-bg: #1B2638;\n" +
    "  --admin-sidebar-text: #F8FAFC;\n" +
    "}\n";
  if (out !== expected) {
    console.error("FAIL");
    console.error("got:  ", JSON.stringify(out));
    console.error("want: ", JSON.stringify(expected));
    process.exit(1);
  }
  console.log("ok");
}
