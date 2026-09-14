import { readPage } from "@/lib/pages/repo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RenderedHtml } from "@/components/RenderedHtml";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await readPage(slug, { publishedOnly: true });
  if (!page) return { title: "Not found" };

  const description = page.metaDescription || undefined;
  const images = page.shareImageUrl ? [page.shareImageUrl] : undefined;

  return {
    title: page.title,
    description,
    openGraph: {
      title: page.title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: page.title,
      description,
      images,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = await readPage(slug, { publishedOnly: true });
  if (!page) notFound();
  return (
    <>
      {page.css && <style dangerouslySetInnerHTML={{ __html: page.css }} />}
      <RenderedHtml html={page.html} />
    </>
  );
}
