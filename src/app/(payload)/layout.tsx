import { RootLayout, handleServerFunctions } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";

import config from "@/payload.config";
import "@payloadcms/next/css";
import "./custom.scss";

import { importMap } from "./admin/importMap";
import { getAdminThemeCss } from "@/lib/settings/repo";

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({ ...args, config, importMap });
};

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const adminThemeCss = await getAdminThemeCss();
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      <style id="aska-admin-theme-vars" dangerouslySetInnerHTML={{ __html: adminThemeCss }} />
      {children}
    </RootLayout>
  );
};

export default Layout;
