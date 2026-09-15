"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Button, useFormFields } from "@payloadcms/ui";

const panelStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: "clamp(280px, 45vw, 720px)",
  display: "flex",
  flexDirection: "column",
  background: "var(--theme-elevation-0)",
  borderLeft: "1px solid var(--theme-elevation-150)",
  boxShadow: "-4px 0 16px rgba(0, 0, 0, 0.12)",
  zIndex: 100,
};

const headerStyle: CSSProperties = {
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  opacity: 0.6,
  borderBottom: "1px solid var(--theme-elevation-150)",
  flexShrink: 0,
};

function buildSrcDoc(html: string, css: string, js: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>${js}</script>
  </body>
</html>`;
}

/**
 * "ui" field rendered right after the html/css/js code editors (see
 * Components.ts). Toggles a fixed, responsive side panel that renders those
 * three fields' live form values in a sandboxed iframe via srcDoc — updates
 * instantly as the code fields are edited, no save required.
 */
export const ComponentPreview = () => {
  const [open, setOpen] = useState(false);

  const html = useFormFields(([fields]) => (fields.html?.value as string | undefined) ?? "");
  const css = useFormFields(([fields]) => (fields.css?.value as string | undefined) ?? "");
  const js = useFormFields(([fields]) => (fields.js?.value as string | undefined) ?? "");

  const srcDoc = useMemo(() => buildSrcDoc(html, css, js), [html, css, js]);

  return (
    <div style={{ margin: "8px 0 16px" }}>
      <Button
        size="small"
        buttonStyle="secondary"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "Hide Live Preview" : "Show Live Preview"}
      </Button>

      {open && (
        <div style={panelStyle}>
          <div style={headerStyle}>Live Preview</div>
          <iframe
            title="Component live preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            style={{ flex: 1, width: "100%", border: "none", background: "#fff" }}
          />
        </div>
      )}
    </div>
  );
};

export default ComponentPreview;
