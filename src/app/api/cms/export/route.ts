import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { getCurrentUser } from "@/lib/auth/requireUser";
import { adminAccess } from "@/lib/auth/roles";
import { isImportExportCollection } from "@/lib/importExport/collections";
import { buildFootstamp } from "@/lib/importExport/footstamp";

export const dynamic = "force-dynamic";

/**
 * GET /api/cms/export?collection=<slug>[&ids=id1,id2,...]
 * Powers both "Export All JSON" (no `ids`) and "Bulk Export JSON" (selected
 * rows) from the admin list view. Returns a downloadable, footstamped JSON
 * file for any collection in IMPORT_EXPORT_COLLECTIONS.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !adminAccess({ req: { user } })) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const collection = searchParams.get("collection") ?? "";
  if (!isImportExportCollection(collection)) {
    return NextResponse.json({ error: `Unsupported collection: ${collection}` }, { status: 400 });
  }

  const idsParam = searchParams.get("ids");
  const ids = idsParam
    ? idsParam.split(",").map((id) => id.trim()).filter(Boolean)
    : null;

  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection,
    where: ids && ids.length > 0 ? { id: { in: ids } } : undefined,
    limit: 0,
    depth: 0,
    overrideAccess: false,
    user,
  });

  const body = JSON.stringify(
    { _footstamp: buildFootstamp(collection), data: docs },
    null,
    2
  );

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${collection}-export-${Date.now()}.json"`,
    },
  });
}
