import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import config from "@/payload.config";
import { checkPrivateAccess } from "@/lib/auth/gate";
import { readTemplateForCollection } from "@/lib/templates/repo";
import { renderTemplate } from "@/lib/templates/render";
import { getBrandingAssets } from "@/lib/settings/repo";
import { RenderedHtml } from "@/components/RenderedHtml";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

async function fetchDesign(slug: string) {
  const p = await getPayload({ config });
  const r = await p.find({
    collection: "house-designs",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  });
  return r.docs[0] ?? null;
}

/** Convert the richText `description` field into an HTML string for {{{description}}}. */
function flattenDescription(doc: Record<string, unknown>): Record<string, unknown> {
  const description = doc.description;
  if (!description || typeof description !== "object") return doc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ...doc, description: convertLexicalToHTML({ data: description as any }) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Private content: never resolve real metadata for a logged-out request.
  if (!(await checkPrivateAccess())) {
    return { title: "Sign in required", robots: { index: false } };
  }
  const { slug } = await params;
  const doc = await fetchDesign(slug);
  if (!doc) return { title: "Not found", robots: { index: false } };
  const description = (doc as { metaDescription?: string }).metaDescription || undefined;
  const share = (doc as { shareImage?: { url?: string } }).shareImage?.url;
  return {
    title: (doc as { name?: string }).name,
    description,
    robots: { index: false },
    openGraph: {
      title: (doc as { name?: string }).name,
      description,
      images: share ? [share] : undefined,
      type: "website",
    },
  };
}

export default async function HouseDesignPage({ params }: Props) {
  const { slug } = await params;
  const authed = await checkPrivateAccess();
  if (!authed) {
    redirect(`/admin/login?redirect=${encodeURIComponent(`/house-designs/${slug}`)}`);
  }

  const doc = await fetchDesign(slug);
  if (!doc) notFound();

  const template = await readTemplateForCollection("house-designs");
  const name = (doc as { name?: string }).name;
  if (!template) {
    return (
      <div style={{ padding: 32, fontFamily: "sans-serif" }}>
        <h1>{name}</h1>
        <p style={{ color: "#a00" }}>
          No template for the House Designs collection yet. Create one under Theme → Templates.
        </p>
      </div>
    );
  }

  const settings = await getBrandingAssets();
  const rendered = renderTemplate(template.html, {
    ...flattenDescription(doc as Record<string, unknown>),
    settings,
  });

  return (
    <>
      {template.css && <style dangerouslySetInnerHTML={{ __html: template.css }} />}
      <RenderedHtml html={rendered} />
    </>
  );
}
