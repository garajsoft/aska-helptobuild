import type { CollectionConfig } from "payload";
import { isContentManager } from "@/lib/auth/roles";
import { withImportExportUI } from "@/lib/importExport/withImportExportUI";

/**
 * Slugs of collections that can be rendered through a template. Add new
 * collection slugs here as they get promoted to "renderable" content.
 */
export const RENDERABLE_COLLECTIONS = [
  { label: "Blog Posts", value: "blog" },
  { label: "Products", value: "products" },
  { label: "House Designs", value: "house-designs" },
] as const;

export const Templates: CollectionConfig = withImportExportUI({
  slug: "templates",
  admin: {
    group: "Theme",
    useAsTitle: "name",
    defaultColumns: ["name", "collection", "updatedAt"],
    description:
      "Layouts for a collection (Blog, Products, …). Edit visually in GrapesJS; use {{title}}, {{slug}}, {{fieldName}} placeholders — or {{{fieldName}}} to render raw HTML.",
    components: {
      edit: {
        beforeDocumentControls: [
          "@/components/admin/EditVisuallyLink#EditTemplateVisuallyLink",
        ],
      },
    },
  },
  access: {
    read: () => true,
    create: isContentManager,
    update: isContentManager,
    delete: isContentManager,
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "collection",
      type: "select",
      required: true,
      unique: true,
      options: RENDERABLE_COLLECTIONS as unknown as { label: string; value: string }[],
      admin: { description: "One template per collection." },
    },
    {
      name: "html",
      type: "code",
      admin: { language: "html", description: "Template HTML with {{placeholders}}." },
    },
    { name: "css", type: "code", admin: { language: "css" } },
  ],
});
