// No "server-only" guard: these are pure predicates (no DB/Node APIs) and
// Components.ts (imported by the client-side CategoryField) pulls this in
// transitively via isContentManager.
export type Role = "super-admin" | "admin" | "editor" | "customer";

export const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: "Super Admin — full system control", value: "super-admin" },
  { label: "Admin — full content & design tokens control", value: "admin" },
  { label: "Editor — content management only", value: "editor" },
  { label: "Customer — registered public user", value: "customer" },
];

/** Roles allowed into the /admin dashboard at all. */
const ADMIN_PANEL_ROLES: Role[] = ["super-admin", "admin", "editor"];
/** Roles with full content & design-token control (Styles/Components/Templates/Settings writes). */
const CONTENT_MANAGER_ROLES: Role[] = ["super-admin", "admin"];

function roleOf(user: unknown): Role | undefined {
  return (user as { roles?: Role } | null | undefined)?.roles;
}

/** Gates the /admin panel itself: `access.admin` on the Users collection. */
export const adminAccess = ({ req }: { req: { user?: unknown } }) =>
  ADMIN_PANEL_ROLES.includes(roleOf(req.user) as Role);

export const isSuperAdmin = ({ req }: { req: { user?: unknown } }) =>
  roleOf(req.user) === "super-admin";

/** super-admin or admin — Styles, Components, Templates, Settings writes. */
export const isContentManager = ({ req }: { req: { user?: unknown } }) =>
  CONTENT_MANAGER_ROLES.includes(roleOf(req.user) as Role);

/** super-admin, admin, or editor — House Designs writes (customers stay read-only). */
export const isEditorOrAbove = adminAccess;
