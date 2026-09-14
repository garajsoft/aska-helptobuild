import type { CollectionConfig } from "payload";
import { ROLE_OPTIONS, adminAccess, isSuperAdmin, type Role } from "@/lib/auth/roles";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email" },
  access: {
    // Gates the /admin dashboard itself — customers can authenticate against
    // the API but never see the CMS UI.
    admin: adminAccess,
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data, originalDoc, context }) => {
        // Trusted server-side calls (e.g. the startup safety-net backfill in
        // payload.config.ts) opt out of this guard explicitly.
        if (context?.skipRoleGuard) return data;

        if (operation === "create") {
          const { totalDocs } = await req.payload.count({ collection: "users" });
          if (totalDocs === 0) {
            // First-ever user (Payload's "create first user" bootstrap) —
            // always super-admin, never left as the 'customer' default.
            data.roles = "super-admin" satisfies Role;
            return data;
          }
        }

        const requesterRole = (req.user as { roles?: Role } | undefined)?.roles;
        if (requesterRole !== "super-admin") {
          // Only a super-admin may set or change roles. Everyone else's
          // writes fall back to the existing role (update) or the safe
          // 'customer' default (create / public self-registration).
          data.roles = operation === "update" ? (originalDoc?.roles ?? "customer") : "customer";
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "roles",
      type: "select",
      required: true,
      defaultValue: "customer",
      options: ROLE_OPTIONS,
      access: {
        // Belt-and-suspenders on top of the beforeChange hook: hides/disables
        // the field in the admin UI for anyone but a super-admin.
        update: isSuperAdmin,
      },
      admin: {
        description: "Controls /admin dashboard access and content permissions.",
      },
    },
  ],
};
