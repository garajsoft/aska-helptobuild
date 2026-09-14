/**
 * Central access predicate for private content (House Designs today).
 * Swap point for Memz's auth: replace this function's body only — every
 * call site (collection `access.read`, route guards) stays the same.
 * No "server-only" guard: it's a pure predicate, safe in any bundle.
 */
export const isSignedIn = ({ req }: { req: { user?: unknown } }) => Boolean(req.user);
