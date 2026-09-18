import type { ResolvedSlot } from "@/lib/theme-builder/getThemeLayout";
import { RenderedHtml } from "@/components/RenderedHtml";
import { Header } from "./Header";
import { Footer } from "./Footer";

/** Renders whatever getThemeLayout() resolved for one slot. */
export function ThemeSlot({ kind, resolved }: { kind: "header" | "footer"; resolved: ResolvedSlot }) {
  if (resolved.kind === "NONE") return null;
  if (resolved.kind === "DEFAULT_COMPONENT") return kind === "header" ? <Header /> : <Footer />;

  const js = resolved.kind === "TEMPLATE" ? resolved.js : "";
  const markup =
    resolved.html +
    (resolved.css ? `<style>${resolved.css}</style>` : "") +
    (js ? `<script>${js}</script>` : "");
  // display: contents — a box-model-less wrapper, so whatever positioning
  // the authored markup uses (sticky header, etc.) applies against the real
  // layout parent instead of a div sized to fit only this content.
  return <RenderedHtml html={markup} style={{ display: "contents" }} />;
}

export default ThemeSlot;
