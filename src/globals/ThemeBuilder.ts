import type { GlobalConfig, Field } from "payload";
import { isContentManager } from "@/lib/auth/roles";
import { CODE_FIELD_ADMIN } from "@/lib/adminFields/codeEditor";

export const THEME_SLOT_MODE_OPTIONS = [
  { label: "Default component", value: "DEFAULT_COMPONENT" },
  { label: "Saved block (Components library)", value: "SAVED_TEMPLATE" },
  { label: "Custom build (GrapesJS)", value: "CUSTOM_BUILD" },
  { label: "None — hide it", value: "NONE" },
] as const;

const isMode = (value: string) => (_data: unknown, sibling: unknown) =>
  (sibling as { mode?: string })?.mode === value;

/**
 * One header or footer slot: DEFAULT_COMPONENT/SAVED_TEMPLATE/CUSTOM_BUILD/NONE.
 * "Saved template" reuses the existing Components collection (it already has
 * header/footer categories — see COMPONENT_CATEGORY_OPTIONS) instead of the
 * Templates collection, which is one-row-per-post-type and doesn't fit "pick
 * one of several saved header layouts".
 */
function slotFields(kind: "header" | "footer"): Field[] {
  return [
    {
      name: "mode",
      type: "select",
      defaultValue: "DEFAULT_COMPONENT",
      options: THEME_SLOT_MODE_OPTIONS as unknown as { label: string; value: string }[],
    },
    {
      name: "template",
      type: "relationship",
      relationTo: "components",
      filterOptions: { category: { equals: kind } },
      admin: {
        description: `Pick a saved ${kind} block (Components → category: ${kind}).`,
        condition: isMode("SAVED_TEMPLATE"),
      },
    },
    {
      name: "html",
      type: "code",
      admin: { language: "html", condition: isMode("CUSTOM_BUILD"), ...CODE_FIELD_ADMIN },
    },
    {
      name: "css",
      type: "code",
      admin: { language: "css", condition: isMode("CUSTOM_BUILD"), ...CODE_FIELD_ADMIN },
    },
    {
      type: "ui",
      name: `${kind}Preview`,
      admin: {
        components: { Field: "@/components/admin/ThemeSlotPreview#ThemeSlotPreview" },
      },
    },
  ];
}

export const ThemeBuilder: GlobalConfig = {
  slug: "theme-builder",
  label: "Theme Builder",
  access: { read: () => true, update: isContentManager },
  admin: {
    group: "Theme",
    description: "Global header/footer and per-page overrides.",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Global Defaults",
          fields: [
            { name: "header", type: "group", label: "Header", fields: slotFields("header") },
            { name: "footer", type: "group", label: "Footer", fields: slotFields("footer") },
          ],
        },
        {
          label: "Custom Overrides",
          fields: [
            {
              name: "customRules",
              type: "array",
              label: "Page Overrides",
              labels: { singular: "Override", plural: "Overrides" },
              admin: {
                description:
                  "First rule whose target pages include the current page wins; unmatched pages fall back to Global Defaults.",
              },
              fields: [
                {
                  name: "targetPages",
                  type: "relationship",
                  relationTo: "pages",
                  hasMany: true,
                  required: true,
                  admin: { description: "Pages this override applies to." },
                },
                { name: "header", type: "group", label: "Header override", fields: slotFields("header") },
                { name: "footer", type: "group", label: "Footer override", fields: slotFields("footer") },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default ThemeBuilder;
