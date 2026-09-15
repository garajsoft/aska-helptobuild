import type { CollectionConfig } from "payload";

const IMPORT_EXPORT_BAR = "@/components/admin/importExport/ImportExportBar#ImportExportBar";

/**
 * Adds the "Export All JSON" / "Bulk Export JSON" / "Import JSON" bar above
 * a collection's list table. Applied to every collection in
 * IMPORT_EXPORT_COLLECTIONS (src/lib/importExport/collections.ts).
 */
export function withImportExportUI(collection: CollectionConfig): CollectionConfig {
  return {
    ...collection,
    admin: {
      ...collection.admin,
      components: {
        ...collection.admin?.components,
        beforeListTable: [
          ...(collection.admin?.components?.beforeListTable ?? []),
          IMPORT_EXPORT_BAR,
        ],
      },
    },
  };
}
