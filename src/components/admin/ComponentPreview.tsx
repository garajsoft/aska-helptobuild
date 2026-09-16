"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Button, useFormFields } from "@payloadcms/ui";
import { setPreviewMode, usePreviewMode, type PreviewMode } from "./componentPreviewStore";

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

const VIEWPORT_LABELS: Record<Viewport, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

const SPLIT_WIDTH = "clamp(280px, 45vw, 720px)";

function buildSrcDoc(html: string, css: string, js: string) {
  // This iframe is a fully self-contained `srcDoc` document, not a route —
  // there's no Next.js "preview page" to fetch typography settings into.
  // /api/styles/typography.css (same endpoint the GrapesJS canvas already
  // uses) resolves fine as a relative URL here: a srcDoc document without
  // its own <base> resolves relative URLs against the embedding admin
  // page's origin. It's placed after the component's own <style> so that on
  // an exact selector+!important tie, this still wins the cascade.
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${css}</style>
    <link rel="stylesheet" href="/api/styles/typography.css" />
  </head>
  <body>
    ${html}
    <script>${js}</script>
  </body>
</html>`;
}

/** Same fixed-position container for both view modes — only its edges move,
 * so the iframe underneath never remounts (no reload flash) when switching
 * between split and fullscreen, or between device viewports. */
function containerStyle(mode: Exclude<PreviewMode, "closed">): CSSProperties {
  const base: CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    background: "var(--theme-elevation-0)",
    transition: "left 0.25s ease, box-shadow 0.25s ease",
    zIndex: mode === "fullscreen" ? 9999 : 100,
    boxShadow: mode === "fullscreen" ? "none" : "-4px 0 16px rgba(0, 0, 0, 0.12)",
    borderLeft: mode === "fullscreen" ? "none" : "1px solid var(--theme-elevation-150)",
  };
  return { ...base, left: mode === "fullscreen" ? 0 : `calc(100% - ${SPLIT_WIDTH})` };
}

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "8px",
  padding: "8px 12px",
  borderBottom: "1px solid var(--theme-elevation-150)",
  flexShrink: 0,
};

const headerGroupStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  opacity: 0.6,
  marginRight: "4px",
};

const frameOuterStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  justifyContent: "center",
  overflow: "auto",
  background: "var(--theme-elevation-50)",
  padding: "12px",
};

function frameWrapperStyle(mode: PreviewMode, viewport: Viewport): CSSProperties {
  const framed = mode === "fullscreen" && viewport !== "desktop";
  return {
    width: mode === "fullscreen" ? VIEWPORT_WIDTHS[viewport] : "100%",
    maxWidth: "100%",
    height: "100%",
    flexShrink: 0,
    transition: "width 0.25s ease",
    background: "#fff",
    border: framed ? "1px solid var(--theme-elevation-150)" : "none",
    boxShadow: framed ? "0 8px 24px rgba(0, 0, 0, 0.12)" : "none",
  };
}

/**
 * "ui" field rendered right after the html/css/js code editors (see
 * Components.ts). Renders those three fields' live form values (via
 * useFormFields) into a sandboxed iframe, in either a side-panel or a
 * fullscreen overlay with Desktop/Tablet/Mobile width presets.
 *
 * Its open/closed mode is shared state (componentPreviewStore) — the entry
 * buttons that open it live in the header instead (ComponentPreviewToggle),
 * not here.
 */
export const ComponentPreview = () => {
  const mode = usePreviewMode();
  const setMode = setPreviewMode;
  const [viewport, setViewport] = useState<Viewport>("desktop");

  const html = useFormFields(([fields]) => (fields.html?.value as string | undefined) ?? "");
  const css = useFormFields(([fields]) => (fields.css?.value as string | undefined) ?? "");
  const js = useFormFields(([fields]) => (fields.js?.value as string | undefined) ?? "");

  const srcDoc = useMemo(() => buildSrcDoc(html, css, js), [html, css, js]);

  // Esc exits fullscreen back to the normal editor layout; while fullscreen,
  // lock body scroll so the inset:0 overlay behaves like a real modal.
  useEffect(() => {
    if (mode !== "fullscreen") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMode("closed");
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mode]);

  if (mode === "closed") return null;

  return (
    <div style={{ margin: "8px 0 16px" }}>
      <div style={containerStyle(mode)}>
        <div style={headerStyle}>
          <div style={headerGroupStyle}>
            <span style={titleStyle}>Live Preview</span>
            {mode === "fullscreen" &&
              (Object.keys(VIEWPORT_LABELS) as Viewport[]).map((v) => (
                <Button
                  key={v}
                  size="small"
                  buttonStyle={viewport === v ? "primary" : "secondary"}
                  onClick={() => setViewport(v)}
                >
                  {VIEWPORT_LABELS[v]}
                </Button>
              ))}
          </div>
          <div style={headerGroupStyle}>
            <Button
              size="small"
              buttonStyle={mode === "split" ? "primary" : "secondary"}
              onClick={() => setMode("split")}
            >
              Split View
            </Button>
            <Button
              size="small"
              buttonStyle={mode === "fullscreen" ? "primary" : "secondary"}
              onClick={() => setMode("fullscreen")}
            >
              Fullscreen
            </Button>
            <Button
              size="small"
              buttonStyle="secondary"
              aria-label="Close preview"
              onClick={() => setMode("closed")}
            >
              Close ✕
            </Button>
          </div>
        </div>

        <div style={frameOuterStyle}>
          <div style={frameWrapperStyle(mode, viewport)}>
            <iframe
              title="Component live preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentPreview;
