import type { CollectionConfig } from "payload";
import { isContentManager } from "@/lib/auth/roles";
import { withImportExportUI } from "@/lib/importExport/withImportExportUI";
import { CODE_FIELD_ADMIN } from "@/lib/adminFields/codeEditor";

export const CODE_SNIPPET_LOCATIONS = [
  { label: "After <head> open", value: "after_head_open" },
  { label: "Before </head> close", value: "before_head_end" },
  { label: "After <body> open", value: "after_body_open" },
  { label: "Before </body> close", value: "before_body_end" },
] as const;

export const CodeSnippets: CollectionConfig = withImportExportUI({
  slug: "code-snippets",
  labels: { singular: "Code Snippet", plural: "Code Snippets" },
  admin: {
    group: "Integrations",
    useAsTitle: "title",
    defaultColumns: ["title", "location", "status", "priority", "updatedAt"],
    description:
      "Raw HTML/JS/CSS injected site-wide — GA4, GTM, Meta Pixel, Hotjar, custom scripts. Rendered by (site)/layout.tsx; see getCodeSnippetsByLocation.",
  },
  // Same trust model as Styles: raw injected code is a bigger blast radius
  // than ordinary content, so writes are content-manager (admin) only, not
  // every editor. Local API reads (the layout's own fetch) bypass access
  // control by default regardless of `read` here.
  access: {
    read: () => true,
    create: isContentManager,
    update: isContentManager,
    delete: isContentManager,
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Disabled", value: "disabled" },
      ],
    },
    {
      name: "location",
      type: "select",
      required: true,
      defaultValue: "before_body_end",
      options: [...CODE_SNIPPET_LOCATIONS],
      admin: { description: "Where in the document this snippet's code is injected." },
    },
    {
      name: "codeType",
      type: "select",
      defaultValue: "html",
      options: [
        { label: "HTML", value: "html" },
        { label: "JavaScript", value: "javascript" },
        { label: "CSS", value: "css" },
      ],
      admin: {
        description:
          "For your own reference only — the code field below always accepts full tags (e.g. <script>...</script> or <style>...</style>).",
      },
    },
    {
      name: "code",
      type: "code",
      required: true,
      admin: {
        language: "html",
        description: "Complete snippet, tags included — pasted exactly as the vendor gives it to you.",
        ...CODE_FIELD_ADMIN,
      },
    },
    {
      name: "priority",
      type: "number",
      defaultValue: 10,
      admin: { description: "Lower runs first among snippets at the same location." },
    },
    {
      name: "targetPages",
      type: "select",
      defaultValue: "all_pages",
      options: [
        { label: "All pages", value: "all_pages" },
        { label: "Specific pages (not yet implemented)", value: "specific_pages" },
      ],
      admin: {
        description:
          "Reserved for future per-page targeting — every active snippet renders site-wide regardless of this value today.",
      },
    },
  ],
});
