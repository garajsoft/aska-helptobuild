import { redirect, notFound } from "next/navigation";
import { GrapesEditor } from "../../GrapesEditor";
import { readTemplate } from "@/lib/templates/repo";
import { getCurrentUser } from "@/lib/auth/requireUser";
import { getPayload } from "payload";
import config from "@/payload.config";

export const metadata = { title: "Template editor — aska CMS" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export interface FieldMeta {
  name: string;
  type: string;
}

async function fieldsForCollection(slug: string): Promise<FieldMeta[]> {
  const p = await getPayload({ config });
  const coll = p.collections[slug];
  if (!coll) return [];
  const out: FieldMeta[] = [];
  const visit = (fields: unknown[]) => {
    for (const f of fields) {
      const field = f as {
        name?: string;
        type?: string;
        fields?: unknown[];
        tabs?: { fields?: unknown[] }[];
      };
      if (field.type === "collapsible" || field.type === "row" || field.type === "group") {
        if (field.fields) visit(field.fields);
      } else if (field.type === "tabs" && field.tabs) {
        for (const t of field.tabs) if (t.fields) visit(t.fields);
      } else if (field.name) {
        out.push({ name: field.name, type: field.type ?? "text" });
      }
    }
  };
  visit(coll.config.fields);
  return out;
}

export default async function TemplateEditorPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    const back = `/editor/template/${encodeURIComponent(id)}`;
    redirect(`/admin/login?redirect=${encodeURIComponent(back)}`);
  }
  const template = await readTemplate(id);
  if (!template) notFound();

  const fields = await fieldsForCollection(template.collectionSlug);

  return (
    <GrapesEditor
      target={{
        mode: "template",
        id: template.id,
        name: template.name,
        postTypeSlug: template.collectionSlug,
      }}
      initial={{ html: template.html, css: template.css }}
      fields={fields}
    />
  );
}
