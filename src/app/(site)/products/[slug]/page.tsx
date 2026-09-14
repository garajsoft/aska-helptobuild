import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@/payload.config";
import { readTemplateForCollection } from "@/lib/templates/repo";
import { renderTemplate } from "@/lib/templates/render";
import { getBrandingAssets } from "@/lib/settings/repo";
import { RenderedHtml } from "@/components/RenderedHtml";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

async function fetchProduct(slug: string) {
  const p = await getPayload({ config });
  const r = await p.find({
    collection: "products",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  });
  return r.docs[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await fetchProduct(slug);
  if (!doc) return { title: "Not found" };
  const title = (doc as { title?: string; name?: string }).title ?? (doc as { name?: string }).name;
  // description is a Lexical rich-text tree, not a string — flatten to plain text
  const raw = (doc as { description?: unknown }).description;
  const description =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object"
        ? flattenLexicalText(raw as { root?: { children?: unknown[] } })
        : undefined;
  return { title, description };
}

function flattenLexicalText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: string; children?: unknown[] };
  const parts: string[] = [];
  if (typeof n.text === "string") parts.push(n.text);
  for (const child of n.children ?? []) {
    const t = flattenLexicalText(child);
    if (t) parts.push(t);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doc = await fetchProduct(slug);
  if (!doc) notFound();
  const template = await readTemplateForCollection("products");
  const title = (doc as { title?: string; name?: string }).title ?? (doc as { name?: string }).name;
  if (!template) {
    return (
      <div style={{ padding: 32, fontFamily: "sans-serif" }}>
        <h1>{title}</h1>
        <p style={{ color: "#a00" }}>
          No template for the Products collection yet. Create one under Theme → Templates.
        </p>
      </div>
    );
  }
  const settings = await getBrandingAssets();
  const rendered = renderTemplate(template.html, { ...(doc as Record<string, unknown>), settings });
  return (
    <>
      {template.css && <style dangerouslySetInnerHTML={{ __html: template.css }} />}
      <RenderedHtml html={rendered} />
    </>
  );
}
