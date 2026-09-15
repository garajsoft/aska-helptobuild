/**
 * Meta/derived keys Payload owns itself — never accepted from an import,
 * whichever collection it targets. Everything else is left to Payload's
 * Local API field validation (create/update only ever persist fields that
 * exist in the collection's schema), which is the actual guard against
 * injected/invalid fields.
 */
const STRIPPED_KEYS = new Set(["id", "createdAt", "updatedAt", "_verificationToken", "sizes"]);

export function sanitizeImportItem(item: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (STRIPPED_KEYS.has(key)) continue;
    clean[key] = value;
  }
  return clean;
}
