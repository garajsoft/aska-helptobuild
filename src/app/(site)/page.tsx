import Link from "next/link";
import type { Metadata } from "next";
import { readPage, listPages } from "@/lib/pages/repo";
import { getHomepageSlug } from "@/lib/settings/repo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const slug = await getHomepageSlug();
  const page = slug ? await readPage(slug, { publishedOnly: true }) : null;
  if (!page) return {};

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

export default async function Home() {
  const slug = await getHomepageSlug();
  if (slug) {
    const page = await readPage(slug, { publishedOnly: true });
    if (page) {
      return (
        <>
          {page.css && <style dangerouslySetInnerHTML={{ __html: page.css }} />}
          <div dangerouslySetInnerHTML={{ __html: page.html }} />
        </>
      );
    }
  }

  const pages = await listPages();
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-8 font-sans">
      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-zinc-500">åska CMS</span>
        <h1 className="text-3xl font-semibold tracking-tight">Pages</h1>
        <p className="text-sm text-zinc-600">
          No homepage set in Settings. Pick one under <code>/admin/globals/settings</code>.
        </p>
      </header>
      <ul className="flex flex-col divide-y divide-black/5 rounded-lg border border-black/10">
        {pages.length === 0 && (
          <li className="p-4 text-sm text-zinc-500">
            No pages yet. Create one in the admin or the editor.
          </li>
        )}
        {pages.map((page) => (
          <li key={page.id} className="flex items-center justify-between p-4">
            <Link href={`/${page.slug}`} className="font-medium hover:underline">
              {page.title} <span className="text-zinc-400">/{page.slug}</span>
            </Link>
            <div className="flex gap-2">
              <Link
                href={`/${page.slug}`}
                className="rounded-full border border-black/10 px-3 py-1 text-xs hover:bg-black/5"
              >
                View
              </Link>
              <Link
                href={`/editor?slug=${encodeURIComponent(page.slug)}`}
                className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800"
              >
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-3">
        <Link href="/admin" className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-black/5">
          Open admin
        </Link>
      </div>
    </div>
  );
}
