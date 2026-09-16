import type { Block, CollectionConfig } from "payload";
import { isEditorOrAbove } from "@/lib/auth/roles";
import { withImportExportUI } from "@/lib/importExport/withImportExportUI";

/** Shared by every input block below — the key a submission stores its
 * value under, the visible label, and whether the form can be sent without it.
 * A function, not a shared array: each block needs its own field objects so
 * Payload's per-block config sanitization doesn't mutate one block's copy
 * through another's reference. */
const fieldBasics = (): NonNullable<Block["fields"]> => [
  { name: "name", type: "text", required: true, admin: { description: "Submission data key." } },
  { name: "label", type: "text", required: true },
  { name: "required", type: "checkbox", defaultValue: false },
];

const TextField: Block = {
  slug: "text",
  labels: { singular: "Text Field", plural: "Text Fields" },
  fields: fieldBasics(),
};

const EmailField: Block = {
  slug: "email",
  labels: { singular: "Email Field", plural: "Email Fields" },
  fields: fieldBasics(),
};

const TextareaField: Block = {
  slug: "textarea",
  labels: { singular: "Textarea Field", plural: "Textarea Fields" },
  fields: fieldBasics(),
};

const SelectField: Block = {
  slug: "select",
  labels: { singular: "Select Field", plural: "Select Fields" },
  fields: [
    ...fieldBasics(),
    {
      name: "options",
      type: "array",
      required: true,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
      ],
    },
  ],
};

export const Forms: CollectionConfig = withImportExportUI({
  slug: "forms",
  labels: { singular: "Form", plural: "Forms" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "updatedAt"],
    description: "Reusable forms — reference by ID from a page's Form block.",
  },
  access: {
    read: () => true,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isEditorOrAbove,
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "fields",
      label: "Form fields",
      type: "blocks",
      blocks: [TextField, EmailField, TextareaField, SelectField],
    },
    { name: "submitButtonLabel", type: "text", defaultValue: "Submit" },
    {
      name: "confirmationMessage",
      type: "richText",
      admin: { description: "Shown after a successful submission." },
    },
  ],
});
