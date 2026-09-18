"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Button, useFormFields, useFieldPath } from "@payloadcms/ui";

type PanelMode = "closed" | "split" | "fullscreen";

const SPLIT_WIDTH = "clamp(280px, 45vw, 720px)";

function buildSrcDoc(html: string, css: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${css}</style>
    <link rel="stylesheet" href="/api/styles/typography.css" />
  </head>
  <body>${html}</body>
</html>`;
}

function containerStyle(mode: Exclude<PanelMode, "closed">): CSSProperties {
  return {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: mode === "fullscreen" ? 0 : `calc(100% - ${SPLIT_WIDTH})`,
    zIndex: mode === "fullscreen" ? 9999 : 100,
    display: "flex",
    flexDirection: "column",
    background: "var(--theme-elevation-0)",
    borderLeft: mode === "fullscreen" ? "none" : "1px solid var(--theme-elevation-150)",
    boxShadow: mode === "fullscreen" ? "none" : "-4px 0 16px rgba(0, 0, 0, 0.12)",
  };
}

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "8px 12px",
  borderBottom: "1px solid var(--theme-elevation-150)",
  flexShrink: 0,
};

const linkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  background: "var(--theme-success-500)",
  color: "#fff",
  borderRadius: "4px",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 500,
};

const noteStyle: CSSProperties = {
  fontSize: "13px",
  color: "var(--theme-elevation-500)",
  padding: "8px 0",
};

/** "header.headerPreview" -> "header"; "customRules.0.footer.footerPreview" -> "customRules.0.footer" */
function parentPath(path: string): string {
  return path.split(".").slice(0, -1).join(".");
}

/** "customRules.0.footer" -> "customRules.0" (the array row), or null for a Global Defaults slot. */
function ruleRowPath(slotPath: string): string | null {
  const parts = slotPath.split(".");
  return parts[0] === "customRules" ? parts.slice(0, 2).join(".") : null;
}

/**
 * The GrapesJS-canvas half of the split view. Registered as the last field
 * in each header/footer group (see slotFields() in ThemeBuilder.ts), so one
 * component handles Global Defaults and every Custom Overrides row.
 *
 * Unlike Components' single-doc split/fullscreen store (componentPreviewStore),
 * state here is local — a Theme Builder page can have several slots open at
 * once (Global header + footer, plus one per override row), so a shared
 * singleton doesn't fit.
 */
export const ThemeSlotPreview = () => {
  const path = useFieldPath();
  const slotPath = parentPath(path);
  const rowPath = ruleRowPath(slotPath);
  const isGlobal = rowPath === null;

  const mode = useFormFields(([fields]) => fields[`${slotPath}.mode`]?.value as string | undefined) ?? "DEFAULT_COMPONENT";
  const templateId = useFormFields(([fields]) => fields[`${slotPath}.template`]?.value as string | number | undefined);
  const html = useFormFields(([fields]) => (fields[`${slotPath}.html`]?.value as string | undefined) ?? "");
  const css = useFormFields(([fields]) => (fields[`${slotPath}.css`]?.value as string | undefined) ?? "");
  const rowId = useFormFields(([fields]) =>
    rowPath ? (fields[`${rowPath}.id`]?.value as string | undefined) : undefined
  );

  const slot = slotPath.endsWith("header") ? "header" : "footer";
  const [panel, setPanel] = useState<PanelMode>("closed");
  const srcDoc = useMemo(() => buildSrcDoc(html, css), [html, css]);

  if (mode === "DEFAULT_COMPONENT") {
    return <p style={noteStyle}>Renders the built-in {slot === "header" ? "<Header />" : "<Footer />"} component.</p>;
  }

  if (mode === "NONE") {
    return <p style={noteStyle}>Hidden — nothing renders here.</p>;
  }

  if (mode === "SAVED_TEMPLATE") {
    if (!templateId) return <p style={noteStyle}>Pick a block above.</p>;
    return (
      <p style={noteStyle}>
        Editing happens on that Components entry —{" "}
        <a href={`/admin/collections/components/${templateId}`} target="_blank" rel="noopener noreferrer">
          open it
        </a>
        .
      </p>
    );
  }

  // CUSTOM_BUILD: inline live preview (Split View) + a link to the full-page
  // GrapesJS canvas (Fullscreen Focus Mode) — same "Edit Visually" pattern
  // Pages/Templates already use, keyed by this row's saved id.
  const editScope = isGlobal ? "global" : rowId;
  return (
    <div style={{ margin: "8px 0 16px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {editScope ? (
          <a
            href={`/editor/theme/${encodeURIComponent(editScope)}/${slot}`}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            Edit visually →
          </a>
        ) : (
          <span style={noteStyle}>Save this override to edit it visually.</span>
        )}
        <Button size="small" buttonStyle="secondary" onClick={() => setPanel(panel === "split" ? "closed" : "split")}>
          {panel === "split" ? "Hide preview" : "Split View"}
        </Button>
        <Button size="small" buttonStyle="secondary" onClick={() => setPanel("fullscreen")}>
          Fullscreen
        </Button>
      </div>

      {panel !== "closed" && (
        <div style={containerStyle(panel)}>
          <div style={headerStyle}>
            <span style={{ fontSize: "12px", fontWeight: 600, opacity: 0.6, textTransform: "uppercase" }}>
              Live preview
            </span>
            <Button size="small" buttonStyle="secondary" aria-label="Close preview" onClick={() => setPanel("closed")}>
              Close ✕
            </Button>
          </div>
          <iframe
            title="Theme slot live preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            style={{ flex: 1, border: "none", background: "#fff" }}
          />
        </div>
      )}
    </div>
  );
};

export default ThemeSlotPreview;
