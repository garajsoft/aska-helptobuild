import type { CollectionConfig } from "payload";
import { isContentManager } from "@/lib/auth/roles";

export const STYLE_CATEGORIES = [
  { label: "Color", value: "Color" },
  { label: "Typography Scale", value: "Typography Scale" },
  { label: "Spacing / Container", value: "Spacing / Container" },
  { label: "Border Radius & Shadow", value: "Border Radius & Shadow" },
];

const TYPE_SCALE_PRESETS = [
  "Display Large",
  "Display Medium",
  "Display Small",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "Body Large",
  "Body Base",
  "Body Small",
  "Caption",
  "Overline / Eyebrow",
  "Button / Label",
  "Code / Monospace",
  "Custom",
].map((v) => ({ label: v, value: v }));

const FONT_WEIGHTS = [
  { label: "100 Thin", value: "100" },
  { label: "300 Light", value: "300" },
  { label: "400 Regular", value: "400" },
  { label: "500 Medium", value: "500" },
  { label: "600 SemiBold", value: "600" },
  { label: "700 Bold", value: "700" },
  { label: "800 ExtraBold", value: "800" },
  { label: "900 Black", value: "900" },
];

const isCategory = (value: string) => (_data: unknown, siblingData: unknown) =>
  (siblingData as { category?: string })?.category === value;

export const Styles: CollectionConfig = {
  slug: "styles",
  labels: { singular: "Style Token", plural: "Styles" },
  admin: {
    group: "Theme",
    useAsTitle: "name",
    defaultColumns: ["name", "category", "slug", "updatedAt"],
    description:
      "Design tokens exposed as CSS custom properties (--{slug} for Color/Spacing/Radius, --{property}-{slug} for Typography) on the site and in the GrapesJS canvas.",
  },
  access: {
    read: () => true,
    create: isContentManager,
    update: isContentManager,
    delete: isContentManager,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.name) {
          data.slug = String(data.name)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "CSS variable name (without --). Auto-filled from name if left blank, e.g. 'color-primary'.",
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: STYLE_CATEGORIES,
    },
    // Color
    {
      name: "colorValue",
      type: "text",
      label: "Color value",
      admin: {
        description: "Hex, rgb(), or hsl() string, e.g. #1a1a1a or rgb(26 26 26).",
        condition: isCategory("Color"),
      },
    },
    // Typography Scale
    {
      name: "typeScalePreset",
      type: "select",
      label: "Type scale preset",
      options: TYPE_SCALE_PRESETS,
      admin: { condition: isCategory("Typography Scale") },
    },
    {
      name: "fontSourceType",
      type: "select",
      label: "Font source",
      options: [
        { label: "Google Font URL", value: "Google Font URL" },
        { label: "Custom File Upload", value: "Custom File Upload" },
        { label: "System Font Family Name", value: "System Font Family Name" },
      ],
      admin: { condition: isCategory("Typography Scale") },
    },
    {
      name: "googleFontUrl",
      type: "text",
      label: "Google Font URL",
      admin: {
        description: "e.g. https://fonts.googleapis.com/css2?family=Inter:wght@400;700",
        condition: (data, siblingData) =>
          isCategory("Typography Scale")(data, siblingData) &&
          siblingData?.fontSourceType === "Google Font URL",
      },
    },
    {
      name: "customFontFile",
      type: "upload",
      relationTo: "media",
      label: "Custom font file",
      admin: {
        description: "woff2, woff, ttf, or otf.",
        condition: (data, siblingData) =>
          isCategory("Typography Scale")(data, siblingData) &&
          siblingData?.fontSourceType === "Custom File Upload",
      },
    },
    {
      name: "fontFamily",
      type: "text",
      label: "Font family",
      admin: {
        description: "e.g. Inter, Playfair Display.",
        condition: isCategory("Typography Scale"),
      },
    },
    {
      name: "fontSize",
      type: "text",
      label: "Font size",
      admin: { description: "e.g. 3.75rem, 60px.", condition: isCategory("Typography Scale") },
    },
    {
      name: "fontWeight",
      type: "select",
      label: "Font weight",
      options: FONT_WEIGHTS,
      admin: { condition: isCategory("Typography Scale") },
    },
    {
      name: "lineHeight",
      type: "text",
      label: "Line height",
      admin: { description: "e.g. 1.2, 120%.", condition: isCategory("Typography Scale") },
    },
    {
      name: "letterSpacing",
      type: "text",
      label: "Letter spacing",
      admin: { description: "e.g. -0.02em.", condition: isCategory("Typography Scale") },
    },
    // Spacing / Container
    {
      name: "spacingValue",
      type: "text",
      label: "Value",
      admin: {
        description: "e.g. 1.5rem, 24px, or a max-width bound like 1280px.",
        condition: isCategory("Spacing / Container"),
      },
    },
    // Border Radius & Shadow
    {
      name: "radiusShadowValue",
      type: "text",
      label: "Value",
      admin: {
        description: "e.g. 8px, or 0 4px 12px rgba(0,0,0,.1) for a shadow.",
        condition: isCategory("Border Radius & Shadow"),
      },
    },
  ],
};
