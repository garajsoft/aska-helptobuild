"use client";

import { useEffect, useRef } from "react";

/**
 * Renders stored page/template HTML and actually runs any embedded
 * <script> tags (from a dropped Components block) — dangerouslySetInnerHTML
 * inserts scripts into the DOM but browsers never execute them that way.
 */
export function RenderedHtml({ html }: { html: string }) {
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

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
