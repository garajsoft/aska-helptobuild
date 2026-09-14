import { NextResponse } from "next/server";
import { getStyleTokensCss } from "@/lib/styles/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const css = await getStyleTokensCss();
  return new NextResponse(css, {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
}
