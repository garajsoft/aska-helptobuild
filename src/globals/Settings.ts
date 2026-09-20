import type { GlobalConfig, Field } from "payload";
import { isContentManager } from "@/lib/auth/roles";
import { ADMIN_THEME_DEFAULTS } from "@/lib/settings/adminTheme";
import { TYPOGRAPHY_DEFAULTS } from "@/lib/settings/typography";

const isFontProvider = (value: "google_fonts" | "custom_upload") => (
  _data: unknown,
  siblingData: unknown
) => (siblingData as { fontProvider?: string })?.fontProvider === value;

const providerFields = (
  provider: "stripe" | "paypal" | "square",
  extra: Field[] = []
): Field[] => [
  {
    name: "enabled",
    type: "checkbox",
    defaultValue: false,
    admin: { description: `Turn ${provider} on at checkout.` },
  },
  {
    name: "mode",
    type: "select",
    defaultValue: "test",
    options: [
      { label: "Test / sandbox", value: "test" },
      { label: "Live", value: "live" },
    ],
    admin: {
      condition: (_data, siblingData) => Boolean(siblingData?.enabled),
    },
  },
  ...extra,
  {
    name: "publishableKey",
    type: "text",
    admin: {
      description: "Client-side (publishable) key.",
      condition: (_data, siblingData) => Boolean(siblingData?.enabled),
    },
  },
  {
    name: "secretKey",
    type: "text",
    admin: {
      description:
        "Server secret. Stored in the database — restrict admin access accordingly.",
      condition: (_data, siblingData) => Boolean(siblingData?.enabled),
    },
  },
  {
    name: "webhookSecret",
    type: "text",
    admin: {
      description: "Signing secret for provider webhooks.",
      condition: (_data, siblingData) => Boolean(siblingData?.enabled),
    },
  },
];

export const Settings: GlobalConfig = {
  slug: "settings",
  access: { read: () => true, update: isContentManager },
  admin: { description: "Site-wide settings." },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "General",
          fields: [
            {
              name: "homepage",
              type: "relationship",
              relationTo: "pages",
              admin: {
                description:
                  "The page rendered at /. Leave empty to show the page list.",
              },
            },
          ],
        },
        {
          label: "Dashboard",
          fields: [
            {
              name: "dashboard",
              type: "group",
              fields: [
                {
                  name: "widgets",
                  type: "select",
                  hasMany: true,
                  defaultValue: ["site_traffic", "form_submissions", "conversions", "comments"],
                  options: [
                    { label: "Page views", value: "site_traffic" },
                    { label: "Form submissions", value: "form_submissions" },
                    { label: "Conversions", value: "conversions" },
                    { label: "Comments", value: "comments" },
                  ],
                  admin: {
                    description:
                      "Widgets to show on /admin. Deselect any to hide them.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Conversions",
          description:
            "Define what counts as a conversion for the dashboard's Conversions widget.",
          fields: [
            {
              name: "conversions",
              type: "group",
              fields: [
                {
                  name: "formSubmissions",
                  type: "checkbox",
                  label: "Form submissions",
                  defaultValue: true,
                  admin: { description: "Count every submitted form as a conversion." },
                },
                {
                  name: "sales",
                  type: "checkbox",
                  label: "Sales",
                  defaultValue: false,
                  admin: { description: "Count completed orders as conversions." },
                },
                {
                  name: "goals",
                  type: "array",
                  label: "Custom goals",
                  admin: {
                    description:
                      "Anything else that counts as a conversion, tracked by the page a visitor reaches — e.g. a booking request's thank-you page.",
                  },
                  fields: [
                    {
                      name: "label",
                      type: "text",
                      required: true,
                      admin: { description: 'e.g. "Booking request"' },
                    },
                    {
                      name: "path",
                      type: "text",
                      required: true,
                      admin: { description: "Page path that counts as this conversion, e.g. /booking-confirmed" },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Branding",
          description:
            "Site logos and favicon. Exposed at /api/globals/settings?depth=1 and as {{settings.logoLight}}, {{settings.logoDark}}, {{settings.favicon}} placeholders in the editor.",
          fields: [
            {
              name: "logoLight",
              type: "upload",
              relationTo: "media",
              label: "Light logo",
              admin: { description: "For light backgrounds — main header/hero." },
            },
            {
              name: "logoDark",
              type: "upload",
              relationTo: "media",
              label: "Dark logo",
              admin: { description: "For dark backgrounds — footer or dark sections." },
            },
            {
              name: "favicon",
              type: "upload",
              relationTo: "media",
              label: "Favicon",
              admin: { description: "Browser tab icon — .ico, .png, or .svg." },
            },
          ],
        },
        {
          label: "Typography",
          description:
            "The site's master font — applied to body text and form controls everywhere via --font-master. Exposed at /api/globals/settings and read by (site)/layout.tsx.",
          fields: [
            {
              name: "typography",
              type: "group",
              fields: [
                {
                  name: "fontProvider",
                  type: "select",
                  defaultValue: TYPOGRAPHY_DEFAULTS.fontProvider,
                  options: [
                    { label: "Google Fonts", value: "google_fonts" },
                    { label: "Custom upload", value: "custom_upload" },
                  ],
                },
                {
                  name: "googleFontUrl",
                  type: "text",
                  label: "Google Fonts stylesheet URL",
                  admin: {
                    description:
                      "e.g. https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap",
                    condition: isFontProvider("google_fonts"),
                  },
                },
                {
                  name: "fontFamilyName",
                  type: "text",
                  label: "CSS font-family value",
                  admin: {
                    description:
                      "Full CSS stack including fallback, e.g. 'Plus Jakarta Sans', sans-serif — this is what --font-master is set to.",
                    condition: isFontProvider("google_fonts"),
                  },
                },
                {
                  name: "customFontLibrary",
                  type: "array",
                  label: "Custom font library",
                  admin: {
                    condition: isFontProvider("custom_upload"),
                    description: "Upload every font you might use here, then pick the active one below.",
                  },
                  fields: [
                    {
                      name: "label",
                      type: "text",
                      required: true,
                      admin: { description: "e.g. \"Playfair Display Bold\"." },
                    },
                    {
                      name: "fontFamilyName",
                      type: "text",
                      required: true,
                      label: "CSS font-family value",
                      admin: { description: "e.g. 'Playfair Display', serif." },
                    },
                    { name: "fontFile", type: "upload", relationTo: "media", required: true },
                    {
                      name: "fontWeight",
                      type: "select",
                      defaultValue: "400",
                      options: ["300", "400", "500", "600", "700"].map((v) => ({
                        label: v,
                        value: v,
                      })),
                    },
                    {
                      name: "fontStyle",
                      type: "select",
                      defaultValue: "normal",
                      options: [
                        { label: "Normal", value: "normal" },
                        { label: "Italic", value: "italic" },
                      ],
                    },
                  ],
                },
                {
                  name: "activeCustomFont",
                  type: "text",
                  label: "Active font",
                  admin: {
                    condition: isFontProvider("custom_upload"),
                    description: "Which font-library entry above is live as --font-master.",
                    components: {
                      Field: "@/components/admin/ActiveCustomFontSelect#ActiveCustomFontSelect",
                    },
                  },
                },
                {
                  name: "applyToAdminUI",
                  type: "checkbox",
                  label: "Also apply to the admin dashboard",
                  defaultValue: TYPOGRAPHY_DEFAULTS.applyToAdminUI,
                  admin: {
                    description: "Uses the same font in /admin so the editor UI matches the site.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Admin Theme",
          description:
            "Colors for the /admin dashboard itself (not the public site). Applies live on next page load — no rebuild needed.",
          fields: [
            {
              type: "collapsible",
              label: "Global Accent & Button Tokens",
              admin: { initCollapsed: false },
              fields: [
                {
                  name: "adminPrimaryColor",
                  type: "text",
                  label: "Primary / accent color",
                  defaultValue: ADMIN_THEME_DEFAULTS.primary,
                  admin: { description: "CTA buttons, links, active nav state." },
                },
                {
                  name: "adminPrimaryButtonText",
                  type: "text",
                  label: "Primary button text color",
                  defaultValue: ADMIN_THEME_DEFAULTS.primaryButtonText,
                  admin: {
                    description:
                      "Forces high contrast on primary buttons. Note: white on the default accent (#6395DA) is ~3.1:1 — under WCAG AA's 4.5:1 for normal text.",
                  },
                },
                {
                  name: "adminFocusColor",
                  type: "text",
                  label: "Focus ring / active link color",
                  defaultValue: ADMIN_THEME_DEFAULTS.focus,
                },
              ],
            },
            {
              type: "collapsible",
              label: "Light Theme",
              admin: { initCollapsed: false },
              fields: [
                {
                  name: "lightMainBackground",
                  type: "text",
                  label: "Light main background",
                  defaultValue: ADMIN_THEME_DEFAULTS.light.mainBg,
                },
                {
                  name: "lightCardBackground",
                  type: "text",
                  label: "Light card / panel background",
                  defaultValue: ADMIN_THEME_DEFAULTS.light.cardBg,
                },
                {
                  name: "lightBaseText",
                  type: "text",
                  label: "Light base text color",
                  defaultValue: ADMIN_THEME_DEFAULTS.light.baseText,
                },
                {
                  name: "lightMutedText",
                  type: "text",
                  label: "Light secondary / muted text",
                  defaultValue: ADMIN_THEME_DEFAULTS.light.mutedText,
                },
                {
                  name: "lightBorderColor",
                  type: "text",
                  label: "Light border color",
                  defaultValue: ADMIN_THEME_DEFAULTS.light.border,
                },
                {
                  name: "lightSidebarBackground",
                  type: "text",
                  label: "Light sidebar background",
                  defaultValue: ADMIN_THEME_DEFAULTS.light.sidebarBg,
                },
                {
                  name: "lightSidebarText",
                  type: "text",
                  label: "Light sidebar text / link color",
                  defaultValue: ADMIN_THEME_DEFAULTS.light.sidebarText,
                },
              ],
            },
            {
              type: "collapsible",
              label: "Dark Theme",
              admin: { initCollapsed: false },
              fields: [
                {
                  name: "darkMainBackground",
                  type: "text",
                  label: "Dark main background",
                  defaultValue: ADMIN_THEME_DEFAULTS.dark.mainBg,
                },
                {
                  name: "darkCardBackground",
                  type: "text",
                  label: "Dark card / panel background",
                  defaultValue: ADMIN_THEME_DEFAULTS.dark.cardBg,
                },
                {
                  name: "darkBaseText",
                  type: "text",
                  label: "Dark base text color",
                  defaultValue: ADMIN_THEME_DEFAULTS.dark.baseText,
                },
                {
                  name: "darkMutedText",
                  type: "text",
                  label: "Dark secondary / muted text",
                  defaultValue: ADMIN_THEME_DEFAULTS.dark.mutedText,
                },
                {
                  name: "darkBorderColor",
                  type: "text",
                  label: "Dark border color",
                  defaultValue: ADMIN_THEME_DEFAULTS.dark.border,
                },
                {
                  name: "darkSidebarBackground",
                  type: "text",
                  label: "Dark sidebar background",
                  defaultValue: ADMIN_THEME_DEFAULTS.dark.sidebarBg,
                },
                {
                  name: "darkSidebarText",
                  type: "text",
                  label: "Dark sidebar text / link color",
                  defaultValue: ADMIN_THEME_DEFAULTS.dark.sidebarText,
                },
              ],
            },
          ],
        },
        {
          label: "Payments",
          description:
            "Connect payment providers. Keys are stored in the database — until we wire dedicated flows, edits here don't automatically override any env-var credentials used by the ecommerce plugin.",
          fields: [
            {
              name: "stripe",
              type: "group",
              label: "Stripe",
              fields: providerFields("stripe"),
            },
            {
              name: "paypal",
              type: "group",
              label: "PayPal",
              fields: providerFields("paypal", [
                {
                  name: "clientId",
                  type: "text",
                  admin: {
                    description: "PayPal client ID.",
                    condition: (_data, siblingData) => Boolean(siblingData?.enabled),
                  },
                },
              ]),
            },
            {
              name: "square",
              type: "group",
              label: "Square",
              fields: providerFields("square", [
                {
                  name: "locationId",
                  type: "text",
                  admin: {
                    description: "Square location ID.",
                    condition: (_data, siblingData) => Boolean(siblingData?.enabled),
                  },
                },
              ]),
            },
          ],
        },
      ],
    },
  ],
};
