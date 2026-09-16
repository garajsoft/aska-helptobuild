import { NextResponse } from "next/server";
import { getTypographySettings } from "@/lib/settings/repo";
import { buildTypographyCss } from "@/lib/settings/typography";

export const dynamic = "force-dynamic";

/** Same live-Settings CSS the site's own <head> gets, as a plain
 * stylesheet — what the GrapesJS canvas iframe loads via canvas.styles
 * (see GrapesEditor.tsx), same pattern as ./tokens.css for design tokens. */
export async function GET() {
  const typography = await getTypographySettings();
  const css = buildTypographyCss(typography);
  return new NextResponse(css, {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
}
