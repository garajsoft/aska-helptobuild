"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Renders stored page/template HTML and actually runs any embedded
 * <script> tags (from a dropped Components block) — dangerouslySetInnerHTML
 * inserts scripts into the DOM but browsers never execute them that way.
 *
 * `style` is a passthrough onto this wrapper div — e.g. `{ display: "contents" }`
 * for content (like a sticky header) that can't tolerate an extra box between
 * it and its real layout parent. A div sized to fit only its content gives a
 * `position: sticky` child no room to actually stay put while the page
 * scrolls past it; `display: contents` removes the wrapper from the box
 * model entirely without losing the ref this component needs.
 */
export function RenderedHtml({ html, style }: { html: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      for (const { name, value } of Array.from(oldScript.attributes)) {
        newScript.setAttribute(name, value);
      }
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
  }, [html]);

  return <div ref={ref} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
