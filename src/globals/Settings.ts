import type { GlobalConfig, Field } from "payload";
import { isContentManager } from "@/lib/auth/roles";
import { ADMIN_THEME_DEFAULTS } from "@/lib/settings/adminTheme";

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
                    { label: "Site traffic", value: "site_traffic" },
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
