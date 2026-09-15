import type { CollectionConfig } from "payload";
import { withImportExportUI } from "@/lib/importExport/withImportExportUI";

export const Pages: CollectionConfig = withImportExportUI({
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "metaDescription", "_status", "updatedAt"],
    components: {
      edit: {
        beforeDocumentControls: [
          "@/components/admin/EditVisuallyLink#EditPageVisuallyLink",
          "@/components/admin/ViewLink#ViewPageLink",
        ],
      },
    },
  },
  versions: {
    drafts: {
      autosave: false,
      schedulePublish: false,
    },
  },
  access: { read: () => true },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "URL path, e.g. 'home' or 'about'." },
    },
    {
      type: "collapsible",
      label: "SEO & Social",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "metaDescription",
          type: "textarea",
          maxLength: 320,
          admin: {
            description:
              "Shown in Google results and when the page is shared. ~155 chars is ideal.",
          },
        },
        {
          name: "shareImage",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "Used as the OG/Twitter image when this page is shared. Recommended 1200×630.",
          },
        },
      ],
    },
    {
      name: "html",
      type: "code",
      admin: { language: "html", description: "HTML from GrapesJS." },
    },
    {
      name: "css",
      type: "code",
      admin: { language: "css", description: "CSS from GrapesJS." },
    },
  ],
});
