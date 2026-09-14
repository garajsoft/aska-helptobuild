import type { CollectionConfig } from "payload";
import { isContentManager } from "@/lib/auth/roles";

/**
 * Suggested category names offered in the admin UI's datalist. `category`
 * is a free-text field — these are starting points, not a fixed enum, so
 * users can also type any custom category name.
 */
export const COMPONENT_CATEGORY_SUGGESTIONS = [
  "Headers",
  "Heroes",
  "Features",
  "Specs",
  "Forms",
  "Galleries",
  "Footers",
] as const;

export const Components: CollectionConfig = {
  slug: "components",
  labels: { singular: "Component", plural: "Components" },
  admin: {
    group: "Theme",
    useAsTitle: "name",
    defaultColumns: ["name", "category", "updatedAt"],
    description:
      "Reusable blocks fed into the GrapesJS block manager. Use {{fieldName}} placeholders for template binding; {{{fieldName}}} to render raw HTML.",
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
      name: "category",
      type: "text",
      required: true,
      defaultValue: "Heroes",
      admin: {
        description:
          "Groups this block in the GrapesJS block manager. Pick a suggestion or type your own.",
        components: {
          Field: "@/components/admin/fields/CategoryField#CategoryField",
        },
      },
    },
    { name: "thumbnail", type: "upload", relationTo: "media" },
    {
      name: "html",
      type: "code",
      admin: { language: "html", description: "Component markup." },
    },
    { name: "css", type: "code", admin: { language: "css" } },
    { name: "js", type: "code", admin: { language: "javascript" } },
  ],
};
