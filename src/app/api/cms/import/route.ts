import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { getCurrentUser } from "@/lib/auth/requireUser";
import { adminAccess } from "@/lib/auth/roles";
import { isImportExportCollection, MATCH_FIELD_BY_COLLECTION } from "@/lib/importExport/collections";
import { extractImportItems } from "@/lib/importExport/footstamp";
import { sanitizeImportItem } from "@/lib/importExport/sanitize";

export const dynamic = "force-dynamic";

/**
 * POST /api/cms/import — multipart form: `file` (the .json export) + `collection`.
 * Unified endpoint for every collection in IMPORT_EXPORT_COLLECTIONS: validates
 * the footstamp (or a plain `{ data: [...] }` / bare-array template), then
 * smart-upserts each item through the Local API — Payload's own field schema
 * is the sanitization boundary, and `overrideAccess: false` means each
 * collection's own access control still applies per user/role.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !adminAccess({ req: { user } })) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const collection = String(form.get("collection") ?? "");

  if (!isImportExportCollection(collection)) {
    return NextResponse.json({ error: `Unsupported collection: ${collection}` }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    return NextResponse.json({ error: "File is not valid JSON" }, { status: 400 });
  }

  const items = extractImportItems(json);
  if (!items) {
    return NextResponse.json(
      { error: "Not a recognizable aska-cms export or { data: [...] } template" },
      { status: 400 }
    );
  }

  const payload = await getPayload({ config });
  const matchField = MATCH_FIELD_BY_COLLECTION[collection];

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const rawItem of items) {
    const matchValue = rawItem[matchField];
    const data = sanitizeImportItem(rawItem);

    try {
      let existingId: string | number | undefined;
      if (matchValue !== undefined && matchValue !== null && matchValue !== "") {
        const { docs } = await payload.find({
          collection,
          where: { [matchField]: { equals: matchValue } },
          limit: 1,
          depth: 0,
          overrideAccess: false,
          user,
        });
        existingId = (docs[0] as { id?: string | number } | undefined)?.id;
      }

      if (existingId !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- data shape varies per collection; validated by Payload's own schema at write time
        await payload.update({ collection, id: existingId, data: data as any, overrideAccess: false, user });
        updated += 1;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- data shape varies per collection; validated by Payload's own schema at write time
        await payload.create({ collection, data: data as any, overrideAccess: false, user });
        created += 1;
      }
    } catch (err) {
      errors.push(
        `${String(matchValue ?? "(new)")}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return NextResponse.json({
    message: `Imported ${created + updated} items (${created} created, ${updated} updated)`,
    created,
    updated,
    errors,
  });
}
