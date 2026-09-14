import "server-only";
import { getCurrentUser } from "./requireUser";

/**
 * Central private-content access check for route guards (House Designs
 * today). Default: the existing Payload session (same login as /admin).
 * Swap point for Memz's auth — replace the body only, callers don't change.
 */
export async function checkPrivateAccess(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user);
}
