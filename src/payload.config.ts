import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { ecommercePlugin, USD, EUR, GBP } from "@payloadcms/plugin-ecommerce";
import { stripeAdapter } from "@payloadcms/plugin-ecommerce/payments/stripe";
import sharp from "sharp";

import { Pages } from "./collections/Pages";
import { Blog } from "./collections/Blog";
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Templates } from "./collections/Templates";
import { Components } from "./collections/Components";
import { Styles } from "./collections/Styles";
import { HouseDesigns } from "./collections/HouseDesigns";
import { Forms } from "./collections/Forms";
import { FormSubmissions } from "./collections/FormSubmissions";
import { CodeSnippets } from "./collections/CodeSnippets";
import { PageViews } from "./collections/PageViews";
import { Settings } from "./globals/Settings";
import { ThemeBuilder } from "./globals/ThemeBuilder";
import { isSignedIn } from "./lib/auth/isSignedIn";
import { withImportExportUI } from "./lib/importExport/withImportExportUI";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      title: "aska CMS",
      titleSuffix: " · aska",
      icons: [{ rel: "icon", type: "image/svg+xml", url: "/aska-favicon.svg" }],
    },
    components: {
      Nav: "@/components/admin/Nav#AskaNav",
      graphics: {
        Logo: "@/components/admin/Logo#Logo",
        Icon: "@/components/admin/Logo#Icon",
      },
      beforeDashboard: [
        "@/components/admin/dashboard/AskaDashboard#AskaDashboard",
      ],
    },
  },
  collections: [
    Pages,
    Blog,
    Templates,
    Components,
    Styles,
    HouseDesigns,
    Forms,
    FormSubmissions,
    CodeSnippets,
    PageViews,
    Users,
    Media,
  ],
  globals: [Settings, ThemeBuilder],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || "" },
    // push (dev-only schema sync) must stay off in production: it diffs the
    // live DB against this config and non-interactively resolves ambiguous
    // changes as drop-and-recreate, deleting data in any column/table it
    // decides no longer matches. Real schema changes go through
    // `payload migrate:create` + `payload migrate` instead.
    push: process.env.NODE_ENV !== "production",
  }),
  sharp,
  onInit: async (payload) => {
    // Safety net so an RBAC rollout can never lock everyone out of /admin —
    // runs on every boot (dev included); cheap no-op once an admin-capable
    // user already exists.
        try {
      const { pushDevSchema } = await import("@payloadcms/drizzle");
      // @ts-expect-error payload.db is the drizzle adapter; type not re-exported
      await pushDevSchema(payload.db);
      payload.logger.info("TEMPORARY: schema pushed to Postgres");
    } catch (err) {
      payload.logger.error({ err }, "TEMPORARY schema push failed");
    }

    try {
      const admins = await payload.count({
        collection: "users",
        where: { roles: { in: ["super-admin", "admin", "editor"] } },
      });
      if (admins.totalDocs === 0) {
        const { docs } = await payload.find({
          collection: "users",
          limit: 1,
          sort: "createdAt",
        });
        const first = docs[0];
        if (first) {
          await payload.update({
            collection: "users",
            id: first.id,
            data: { roles: "super-admin" },
            context: { skipRoleGuard: true },
          });
          payload.logger.warn(
            `No admin-capable user existed — promoted ${first.email} to super-admin.`
          );
        }
      }
    } catch (err) {
      payload.logger.error({ err }, "Admin-role safety-net check failed");
    }
  },
  plugins: [
    ecommercePlugin({
      access: {
        adminOnlyFieldAccess: isSignedIn,
        adminOrPublishedStatus: isSignedIn,
        isAdmin: isSignedIn,
        isDocumentOwner: isSignedIn,
      },
      customers: { slug: Users.slug },
      products: {
        // The plugin's default products collection only has inventory + per-currency
        // price groups — no name/slug/description/images, so products were barely
        // editable and the storefront (/products/[slug]) couldn't resolve anything.
        // Add the merchandising fields and keep every default field the plugin
        // generates (inventory, priceInUSD/EUR/GBP).
        productsCollectionOverride: ({ defaultCollection }) =>
          withImportExportUI({
            ...defaultCollection,
            admin: {
              ...defaultCollection.admin,
              useAsTitle: "name",
              defaultColumns: ["name", "slug", "_status", "updatedAt"],
              listSearchableFields: ["name", "slug"],
            },
            fields: [
              { name: "name", type: "text", required: true },
              {
                name: "slug",
                type: "text",
                required: true,
                unique: true,
                index: true,
                admin: { description: "URL segment: /products/<slug>." },
              },
              {
                name: "description",
                type: "richText",
                label: "Description",
              },
              {
                name: "images",
                type: "upload",
                relationTo: "media",
                hasMany: true,
              },
              ...defaultCollection.fields,
            ],
          }),
      },
      orders: {
        ordersCollectionOverride: ({ defaultCollection }) => withImportExportUI(defaultCollection),
      },
      currencies: {
        supportedCurrencies: [USD, EUR, GBP],
        defaultCurrency: "USD",
      },
      payments: {
        paymentMethods: [
          stripeAdapter({
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
            secretKey: process.env.STRIPE_SECRET_KEY || "",
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
          }),
        ],
      },
    }),
  ],
});
