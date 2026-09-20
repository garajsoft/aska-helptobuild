import { redirect, notFound } from "next/navigation";
import { GrapesEditor } from "../../../GrapesEditor";
import { readThemeSlot } from "@/lib/theme-builder/repo";
import { getCurrentUser } from "@/lib/auth/requireUser";

export const metadata = { title: "Theme editor — aska CMS" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ scope: string; slot: string }>;
}

function parseSlot(slot: string): "header" | "footer" | null {
  return slot === "header" || slot === "footer" ? slot : null;
}

export default async function ThemeSlotEditorPage({ params }: Props) {
  const { scope, slot: slotParam } = await params;
  const slot = parseSlot(slotParam);
  if (!slot) notFound();

  const user = await getCurrentUser();
  if (!user) {
    const back = `/editor/theme/${encodeURIComponent(scope)}/${slot}`;
    redirect(`/admin/login?redirect=${encodeURIComponent(back)}`);
  }
  const target = await readThemeSlot(scope, slot);
  if (!target) notFound();

  return (
    <GrapesEditor
      target={{ mode: "theme", scope, slot, label: target.label }}
      initial={{ html: target.html, css: target.css }}
    />
  );
}
