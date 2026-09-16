import type { CollectionConfig } from "payload";
import { isContentManager } from "@/lib/auth/roles";
import { withImportExportUI } from "@/lib/importExport/withImportExportUI";

/**
 * Fixed category list for the GrapesJS block manager grouping. "custom"
 * is a sentinel: when selected, the real category comes from the sibling
 * `customCategory` free-text field instead (see COMPONENT_CATEGORY_CUSTOM_VALUE
 * and Components.customCategory's admin.condition below).
 */
export const COMPONENT_CATEGORY_CUSTOM_VALUE = "custom";

export const COMPONENT_CATEGORY_OPTIONS = [
  { label: "Header", value: "header" },
  { label: "Footer", value: "footer" },
  { label: "Hero", value: "hero" },
  { label: "Feature", value: "feature" },
  { label: "Card", value: "card" },
  { label: "CTA", value: "cta" },
  { label: "Pricing", value: "pricing" },
  { label: "Form", value: "form" },
  { label: "Slider", value: "slider" },
  { label: "Custom", value: COMPONENT_CATEGORY_CUSTOM_VALUE },
] as const;

export const Components: CollectionConfig = withImportExportUI({
  slug: "components",
  labels: { singular: "Component", plural: "Components" },
  admin: {
    group: "Theme",
    useAsTitle: "name",
    defaultColumns: ["name", "category", "updatedAt"],
    description:
      "Reusable blocks fed into the GrapesJS block manager. Use {{fieldName}} placeholders for template binding; {{{fieldName}}} to render raw HTML.",
    components: {
      // Split View/Fullscreen entry buttons, left of Save in the doc-controls
      // header. Registered only here, so no other collection's editor ever
      // renders them — that scoping is Payload's own per-collection slot,
      // not a runtime slug check.
      edit: {
        beforeDocumentControls: [
          "@/components/admin/ComponentPreviewToggle#ComponentPreviewToggle",
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
      name: "category",
      type: "select",
      required: true,
      defaultValue: "hero",
      options: COMPONENT_CATEGORY_OPTIONS as unknown as { label: string; value: string }[],
      admin: {
        description: "Groups this block in the GrapesJS block manager.",
      },
    },
    {
      name: "customCategory",
      type: "text",
      label: "Custom category",
      admin: {
        description: "Category name used when \"Custom\" is selected above.",
        condition: (_data, siblingData) =>
          siblingData?.category === COMPONENT_CATEGORY_CUSTOM_VALUE,
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
    {
      type: "ui",
      name: "componentPreview",
      admin: {
        components: {
          Field: "@/components/admin/ComponentPreview#ComponentPreview",
        },
      },
    },
  ],
});
