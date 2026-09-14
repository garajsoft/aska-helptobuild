import type { CollectionConfig } from "payload";
import { isSignedIn } from "@/lib/auth/isSignedIn";
import { isEditorOrAbove } from "@/lib/auth/roles";

export const HouseDesigns: CollectionConfig = {
  slug: "house-designs",
  labels: { singular: "House Design", plural: "House Designs" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "bedrooms", "bathrooms", "updatedAt"],
    listSearchableFields: ["name", "slug"],
    description: "Private catalogue — only visible to signed-in users on the site.",
  },
  // Gated at the API level too, not just the page route: an unauthenticated
  // request straight to /api/house-designs must not leak data either.
  // Any signed-in user (including 'customer') can read; only editor-or-above
  // can create/update/delete.
  access: {
    read: isSignedIn,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isEditorOrAbove,
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "URL segment: /house-designs/<slug>." },
    },
    { name: "description", type: "richText" },
    {
      type: "row",
      fields: [
        { name: "bedrooms", type: "number", admin: { width: "25%" } },
        { name: "bathrooms", type: "number", admin: { width: "25%" } },
        { name: "garage", type: "number", admin: { width: "25%" } },
        {
          name: "houseSize",
          type: "text",
          admin: { width: "25%", description: "e.g. 245m²" },
        },
      ],
    },
    { name: "images", label: "Image gallery", type: "upload", relationTo: "media", hasMany: true },
    { name: "floorplans", type: "upload", relationTo: "media", hasMany: true },
    {
      name: "aiVideoUrl",
      label: "AI video walkthrough URL",
      type: "text",
      admin: { description: "Embed URL for the video player block." },
    },
    { name: "brochure", label: "Downloadable brochure", type: "upload", relationTo: "media" },
    {
      type: "collapsible",
      label: "SEO & Social",
      admin: { initCollapsed: true },
      fields: [
        { name: "metaDescription", type: "textarea", maxLength: 320 },
        { name: "shareImage", type: "upload", relationTo: "media" },
      ],
    },
  ],
};
