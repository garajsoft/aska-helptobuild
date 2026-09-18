import { NextRequest, NextResponse } from "next/server";
import { readThemeSlot, updateThemeSlotContent } from "@/lib/theme-builder/repo";
import { getCurrentUser } from "@/lib/auth/requireUser";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ scope: string; slot: string }>;
}

function parseSlot(slot: string): "header" | "footer" | null {
  return slot === "header" || slot === "footer" ? slot : null;
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const unauth = await requireUser();
  if (unauth) return unauth;
  const { scope, slot: slotParam } = await params;
  const slot = parseSlot(slotParam);
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const t = await readThemeSlot(scope, slot);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(t);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const unauth = await requireUser();
  if (unauth) return unauth;
  const { scope, slot: slotParam } = await params;
  const slot = parseSlot(slotParam);
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json()) as { html?: string; css?: string };
  await updateThemeSlotContent({ scope, slot, html: body.html ?? "", css: body.css ?? "" });
  const saved = await readThemeSlot(scope, slot);
  return NextResponse.json(saved);
}
