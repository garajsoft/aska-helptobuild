import "server-only";
import { getPayload } from "payload";
import config from "@/payload.config";
import { buildStyleTokensCss, type StyleDoc } from "./tokens";

export async function getStyleTokensCss(): Promise<string> {
  const p = await getPayload({ config });
  const { docs } = await p.find({
    collection: "styles",
    limit: 500,
    depth: 0,
  });
  return buildStyleTokensCss(docs as unknown as StyleDoc[]);
}
