export interface Footstamp {
  generator: string;
  collection: string;
  exportedAt: string;
  schemaVersion: string;
}

export interface ExportPayload {
  _footstamp: Footstamp;
  data: Record<string, unknown>[];
}

export function buildFootstamp(collection: string): Footstamp {
  return {
    generator: "aska-cms",
    collection,
    exportedAt: new Date().toISOString(),
    schemaVersion: "1.0",
  };
}

/**
 * Accepts our own `{ _footstamp, data }` export shape, a compatible export
 * from another Aska CMS instance (same shape, any generator string
 * containing "aska-cms"), or a plain `{ data: [...] }` / bare-array JSON
 * template from an external source. Returns the normalized item list, or
 * null if the file isn't a recognizable import shape.
 */
export function extractImportItems(json: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(json)) {
    return json.filter((item): item is Record<string, unknown> => isRecord(item));
  }

  if (!isRecord(json)) return null;

  const footstamp = json._footstamp;
  if (footstamp !== undefined) {
    if (!isRecord(footstamp) || typeof footstamp.generator !== "string") return null;
    if (!footstamp.generator.includes("aska-cms")) return null;
  }

  if (!Array.isArray(json.data)) return null;
  return json.data.filter((item): item is Record<string, unknown> => isRecord(item));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
