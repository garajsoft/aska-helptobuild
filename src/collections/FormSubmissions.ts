import type { CollectionConfig } from "payload";
import { isEditorOrAbove } from "@/lib/auth/roles";

export const FormSubmissions: CollectionConfig = {
  slug: "form-submissions",
  labels: { singular: "Form Submission", plural: "Form Submissions" },
  admin: {
    defaultColumns: ["form", "createdAt"],
    description: "Read-only record of visitor submissions — see the linked form for field layout.",
  },
  access: {
    // Public create so the site's form-submit endpoint works for anonymous
    // visitors; everything else is staff-only.
    read: isEditorOrAbove,
    create: () => true,
    update: () => false,
    delete: isEditorOrAbove,
  },
  fields: [
    { name: "form", type: "relationship", relationTo: "forms", required: true },
    {
      name: "submissionData",
      type: "json",
      required: true,
      admin: { description: "Submitted field values, keyed by each field's name." },
    },
  ],
};
