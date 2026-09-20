import type { CollectionConfig } from "payload";

// Minimal internal analytics: one row per page load, written by the public
// site's PageViewTracker beacon. No sessions, no bot filtering, no external
// service - just enough to feed the dashboard's traffic chart with real
// numbers instead of demo data.
export const PageViews: CollectionConfig = {
  slug: "page-views",
  admin: { hidden: true },
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "path",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "visitorId",
      type: "text",
      admin: {
        description: "Anonymous per-browser id (localStorage), used to count unique visitors.",
      },
    },
  ],
};
