/**
 * Collections wired into the Universal JSON Import/Export engine
 * (/api/cms/export, /api/cms/import, and the admin list-view buttons).
 * Deliberately excludes `users` and `media` (binary files).
 */
export const IMPORT_EXPORT_COLLECTIONS = [
  "pages",
  "blog",
  "products",
  "house-designs",
  "orders",
  "templates",
  "components",
  "styles",
] as const;

export type ImportExportCollection = (typeof IMPORT_EXPORT_COLLECTIONS)[number];

export const isImportExportCollection = (slug: string): slug is ImportExportCollection =>
  (IMPORT_EXPORT_COLLECTIONS as readonly string[]).includes(slug);

/**
 * Field used to match an incoming record to an existing document for the
 * "Smart Upsert" (slug/unique-key/title match -> update, else create).
 * `components` has no unique field in its schema, so `name` is best-effort;
 * `orders` has no business key at all, so imports always match by `id`
 * (i.e. they create unless the export came from this same instance).
 */
export const MATCH_FIELD_BY_COLLECTION: Record<ImportExportCollection, string> = {
  pages: "slug",
  blog: "slug",
  products: "slug",
  "house-designs": "slug",
  orders: "id",
  templates: "collection",
  components: "name",
  styles: "slug",
};
