import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@/payload.config";
import { checkPrivateAccess } from "@/lib/auth/gate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "House Designs", robots: { index: false } };

interface HouseDesignSummary {
  id: string | number;
  name: string;
  slug: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  houseSize?: string | null;
  images?: { url?: string | null }[] | null;
}

export default async function HouseDesignsCatalog() {
  const authed = await checkPrivateAccess();
  if (!authed) {
    redirect(`/admin/login?redirect=${encodeURIComponent("/house-designs")}`);
  }

  const p = await getPayload({ config });
  const { docs } = await p.find({
    collection: "house-designs",
    limit: 100,
    depth: 1,
    sort: "name",
  });

  return (
    <div style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h1>House Designs</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
          marginTop: 24,
        }}
      >
        {(docs as HouseDesignSummary[]).map((d) => (
          <Link
            key={d.id}
            href={`/house-designs/${encodeURIComponent(d.slug)}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {d.images?.[0]?.url && (
              <img
                src={d.images[0].url}
                alt={d.name}
                style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8 }}
              />
            )}
            <h2 style={{ fontSize: 18, margin: "8px 0 4px" }}>{d.name}</h2>
            <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
              {[
                d.bedrooms != null ? `${d.bedrooms} bed` : null,
                d.bathrooms != null ? `${d.bathrooms} bath` : null,
                d.houseSize,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Link>
        ))}
        {docs.length === 0 && <p>No house designs published yet.</p>}
      </div>
    </div>
  );
}
