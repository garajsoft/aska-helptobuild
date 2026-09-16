import "server-only";
import { getPayload } from "payload";
import config from "@/payload.config";

export type SnippetLocation =
  | "after_head_open"
  | "before_head_end"
  | "after_body_open"
  | "before_body_end";

export type CodeSnippetsByLocation = Record<SnippetLocation, string>;

function empty(): CodeSnippetsByLocation {
  return { after_head_open: "", before_head_end: "", after_body_open: "", before_body_end: "" };
}

/**
 * Active Code Snippets, grouped by injection point and concatenated in
 * priority order (lower first) — read once per request by the root layout
 * (see (site)/layout.tsx). Each snippet's `code` already carries its own
 * full tags (<script>...</script>, <style>...</style>, ...), so groups here
 * are just joined strings, never re-wrapped.
 */
export async function getCodeSnippetsByLocation(): Promise<CodeSnippetsByLocation> {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "code-snippets",
      where: { status: { equals: "active" } },
      sort: "priority",
      limit: 200,
      depth: 0,
    });
    const groups = empty();
    for (const doc of docs as { location?: SnippetLocation; code?: string }[]) {
      const loc = doc.location;
      if (loc && loc in groups && doc.code) {
        groups[loc] += (groups[loc] ? "\n" : "") + doc.code;
      }
    }
    return groups;
  } catch {
    return empty();
  }
}
