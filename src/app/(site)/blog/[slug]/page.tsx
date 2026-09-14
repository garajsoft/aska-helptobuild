import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import config from "@/payload.config";
import { readTemplateForCollection } from "@/lib/templates/repo";
import { renderTemplate } from "@/lib/templates/render";
import { getBrandingAssets } from "@/lib/settings/repo";
import { RenderedHtml } from "@/components/RenderedHtml";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

async function fetchPublished(slug: string) {
  const p = await getPayload({ config });
  const r = await p.find({
    collection: "blog",
    where: { slug: { equals: slug }, _status: { equals: "published" } },
    limit: 1,
    depth: 2,
    draft: false,
  });
  return r.docs[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await fetchPublished(slug);
  if (!doc) return { title: "Not found" };
  const description = (doc as { metaDescription?: string }).metaDescription || undefined;
  const share = (doc as { shareImage?: { url?: string } }).shareImage?.url;
  const cover = (doc as { coverImage?: { url?: string } }).coverImage?.url;
  const images = share || cover ? [share || cover!] : undefined;
  return {
    title: (doc as { title?: string }).title,
    description,
    openGraph: { title: (doc as { title?: string }).title, description, images, type: "article" },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: (doc as { title?: string }).title,
      description,
      images,
    },
  };
}

function isLexicalDoc(v: unknown): v is { root: { type: "root" } } {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as { root?: { type?: string } }).root === "object" &&
    (v as { root: { type?: string } }).root.type === "root"
  );
}

/** Walk one level; convert any lexical JSON field into an HTML string. */
function flattenLexical(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...doc };
  for (const [k, v] of Object.entries(out)) {
    if (isLexicalDoc(v)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      out[k] = convertLexicalToHTML({ data: v as any });
    }
  }
  return out;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const doc = await fetchPublished(slug);
  if (!doc) notFound();
  const template = await readTemplateForCollection("blog");
  if (!template) {
    return (
      <div style={{ padding: 32, fontFamily: "sans-serif" }}>
        <h1>{(doc as { title?: string }).title}</h1>
        <p style={{ color: "#a00" }}>
          No template for the Blog collection yet. Create one under Theme → Templates.
        </p>
      </div>
    );
  }
  const settings = await getBrandingAssets();
  const rendered = renderTemplate(template.html, {
    ...flattenLexical(doc as Record<string, unknown>),
    settings,
  });
  return (
    <>
      {template.css && <style dangerouslySetInnerHTML={{ __html: template.css }} />}
      <RenderedHtml html={rendered} />
    </>
  );
}
