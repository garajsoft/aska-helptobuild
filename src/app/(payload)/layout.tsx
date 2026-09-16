import { RootLayout, handleServerFunctions } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";

import config from "@/payload.config";
import "@payloadcms/next/css";
import "./custom.scss";

import { importMap } from "./admin/importMap";
import { getAdminThemeCss, getTypographySettings } from "@/lib/settings/repo";
import { buildAdminTypographyCss } from "@/lib/settings/typography";

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({ ...args, config, importMap });
};

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const [adminThemeCss, typography] = await Promise.all([
    getAdminThemeCss(),
    getTypographySettings(),
  ]);
  // Separate <style> tag: @import (used for the Google Fonts case) is only
  // valid as the first rule of its own stylesheet, so it can't share a tag
  // with adminThemeCss's :root rules.
  const adminTypographyCss = buildAdminTypographyCss(typography);
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      <style id="aska-admin-typography" dangerouslySetInnerHTML={{ __html: adminTypographyCss }} />
      <style id="aska-admin-theme-vars" dangerouslySetInnerHTML={{ __html: adminThemeCss }} />
      {children}
    </RootLayout>
  );
};

export default Layout;
