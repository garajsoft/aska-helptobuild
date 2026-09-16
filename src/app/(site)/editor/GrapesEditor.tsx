"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import {
  COMPONENT_CATEGORY_CUSTOM_VALUE,
  COMPONENT_CATEGORY_OPTIONS,
} from "@/collections/Components";

interface ComponentDoc {
  id: string | number;
  name: string;
  category: string;
  customCategory?: string | null;
  html?: string | null;
  css?: string | null;
  js?: string | null;
  thumbnail?: { url?: string | null } | string | null;
}

const CATEGORY_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  COMPONENT_CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

/** Block-manager category label: the custom category text, or the fixed option's label. */
function categoryLabel(c: ComponentDoc): string {
  if (c.category === COMPONENT_CATEGORY_CUSTOM_VALUE) {
    return c.customCategory?.trim() || "Custom";
  }
  return CATEGORY_LABEL_BY_VALUE[c.category] ?? c.category;
}

/** Fallback `</>` icon for blocks with no thumbnail/image media. */
const DEFAULT_BLOCK_MEDIA =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" fill="none" style="display: block; margin: 0 auto;"><path d="M15.5 8L12 11.5L11.295 10.795L14.085 8L11.295 5.205L12 4.5L15.5 8ZM0.5 8L4 4.5L4.705 5.205L1.915 8L4.705 10.795L4 11.5L0.5 8ZM6.21 12.742L8.82 3L9.786 3.2585L7.176 13L6.21 12.742Z" fill="currentColor"/></svg>';

function componentBlockContent(c: ComponentDoc): string {
  const style = c.css ? `<style>${c.css}</style>` : "";
  const script = c.js ? `<script>${c.js}</script>` : "";
  return `${c.html ?? ""}${style}${script}`;
}

export type EditorTarget =
  | { mode: "page"; slug: string; title: string }
  | { mode: "template"; id: string | number; name: string; postTypeSlug: string | null };

export interface FieldMeta {
  name: string;
  type: string;
}

interface Props {
  target: EditorTarget;
  initial: { html: string; css: string };
  fields?: FieldMeta[];
}

// Stable reference for the (usually omitted) `fields` prop. A `fields = []`
// default parameter would otherwise be re-evaluated to a brand-new array on
// every render — including this component's own `saving`/`error`/`lastSaved`
// state updates — and since the init effect below depends on `fields`, that
// tore the live GrapesJS instance down and rebuilt it from the stale
// `initial` props on every Save click, silently discarding any block
// (e.g. a dragged-in header) added since the page first loaded.
const EMPTY_FIELDS: FieldMeta[] = [];

/** Primitive identity for the init effect: same page/template = same string,
 * regardless of how the caller re-creates the `target` object each render. */
function targetKey(t: EditorTarget): string {
  return t.mode === "page" ? `page:${t.slug}` : `template:${t.id}`;
}

/**
 * Return the GrapesJS block content for a given field, using the correct
 * placeholder syntax so the render engine substitutes safely:
 *   richText → {{{name}}} (raw HTML)
 *   upload   → <img src="{{name.url}}" alt="{{name.alt}}"> (populated media object)
 *   date     → {{name}} (string form)
 *   text/textarea/number/… → {{name}} (escaped)
 */
function contentForField(f: FieldMeta): string {
  switch (f.type) {
    case "richText":
      return `<div data-aska-field="${f.name}">{{{${f.name}}}}</div>`;
    case "upload":
      return `<img data-aska-field="${f.name}" src="{{${f.name}.url}}" alt="{{${f.name}.alt}}">`;
    case "textarea":
      return `<p data-aska-field="${f.name}">{{${f.name}}}</p>`;
    case "relationship":
      return `<span data-aska-field="${f.name}">{{${f.name}.id}}</span>`;
    default:
      return `<span data-aska-field="${f.name}">{{${f.name}}}</span>`;
  }
}

function buildSaveUrl(t: EditorTarget) {
  return t.mode === "page"
    ? `/api/editor/pages/${encodeURIComponent(t.slug)}`
    : `/api/editor/templates/${encodeURIComponent(String(t.id))}`;
}

function buildSaveBody(t: EditorTarget, html: string, css: string) {
  return t.mode === "page"
    ? { title: t.title, html, css }
    : { html, css };
}

function viewHref(t: EditorTarget): string | null {
  if (t.mode === "page") return `/${t.slug}`;
  return null;
}

function label(t: EditorTarget): string {
  return t.mode === "page" ? `/${t.slug}` : `${t.name} (template)`;
}

function saveButtonClasses(state: SaveState): string {
  const base =
    "flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed";
  if (state === "success") return `${base} bg-green-500 text-white`;
  if (state === "error") return `${base} bg-red-500 text-white hover:bg-red-600`;
  return `${base} bg-white text-[#463a3c] hover:bg-zinc-200 disabled:opacity-60`;
}

type SaveState = "idle" | "saving" | "success" | "error";

export function GrapesEditor({ target, initial, fields = EMPTY_FIELDS }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const timersRef = useRef<{
    revert?: ReturnType<typeof setTimeout>;
    toast?: ReturnType<typeof setTimeout>;
  }>({});

  // Clear any pending revert/toast timers on unmount so they don't fire
  // setState after the editor's gone.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      clearTimeout(timers.revert);
      clearTimeout(timers.toast);
    };
  }, []);

  function flashToast(type: "success" | "error", text: string) {
    clearTimeout(timersRef.current.toast);
    setToast({ type, text });
    timersRef.current.toast = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [
        { default: grapesjs },
        { default: presetWebpage },
        { default: blocksBasic },
        { default: forms },
      ] = await Promise.all([
        import("grapesjs"),
        import("grapesjs-preset-webpage"),
        import("grapesjs-blocks-basic"),
        import("grapesjs-plugin-forms"),
      ]);
      if (cancelled || !containerRef.current) return;

      const editor = grapesjs.init({
        container: containerRef.current,
        height: "calc(100vh - 44px)",
        width: "auto",
        storageManager: false,
        fromElement: false,
        components:
          initial.html ||
          `<section style="padding:64px 24px;text-align:center;font-family:sans-serif"><h1>${
            target.mode === "page" ? target.title : target.name
          }</h1></section>`,
        style: initial.css || "",
        plugins: [presetWebpage, blocksBasic, forms],
        pluginsOpts: { "grapesjs-blocks-basic": { flexGrid: true } },
        // Trusted internal editor (login-gated): don't let the HTML parser
        // strip inline event handlers, "unsafe" attribute values, or
        // whitespace-only text nodes out of user/component-authored markup.
        // (allowServerText/cleanId aren't real optionsHtml keys in this
        // GrapesJS version — cleanId is a getHtml()/export-time option,
        // set explicitly there instead; see handleSave below.)
        parser: {
          optionsHtml: {
            allowScripts: true,
            allowUnsafeAttr: true,
            allowUnsafeAttrValue: true,
            keepEmptyTextNodes: true,
          },
        },
        canvas: { styles: ["/api/styles/tokens.css"] },
      });

      // Add built-in placeholders (title, slug) always available.
      const bm = editor.BlockManager;
      bm.add("aska-field-title", {
        label: "Post title",
        category: "Fields",
        media: DEFAULT_BLOCK_MEDIA,
        content: '<h1>{{title}}</h1>',
      });
      bm.add("aska-field-slug", {
        label: "Post slug",
        category: "Fields",
        media: DEFAULT_BLOCK_MEDIA,
        content: "<code>{{slug}}</code>",
      });
      bm.add("aska-settings-logo-light", {
        label: "Logo (light)",
        category: "Branding",
        media: DEFAULT_BLOCK_MEDIA,
        content: '<img src="{{settings.logoLight.url}}" alt="{{settings.logoLight.alt}}">',
      });
      bm.add("aska-settings-logo-dark", {
        label: "Logo (dark)",
        category: "Branding",
        media: DEFAULT_BLOCK_MEDIA,
        content: '<img src="{{settings.logoDark.url}}" alt="{{settings.logoDark.alt}}">',
      });
      bm.add("aska-settings-favicon", {
        label: "Favicon",
        category: "Branding",
        media: DEFAULT_BLOCK_MEDIA,
        content: '<img src="{{settings.favicon.url}}" alt="Favicon">',
      });
      for (const f of fields) {
        if (f.name === "title" || f.name === "slug") continue;
        bm.add(`aska-field-${f.name}`, {
          label: `${f.name}${f.type !== "text" ? ` · ${f.type}` : ""}`,
          category: "Collection Fields",
          media: DEFAULT_BLOCK_MEDIA,
          content: contentForField(f),
        });
      }

      // User-managed blocks from the Components collection — no hardcoded
      // components here, admins add/edit these from the dashboard.
      try {
        const res = await fetch("/api/components?limit=200&depth=1", {
          credentials: "include",
        });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { docs?: ComponentDoc[] };
          for (const c of data.docs ?? []) {
            const thumb =
              typeof c.thumbnail === "object" ? c.thumbnail?.url ?? null : null;
            bm.add(`aska-component-${c.id}`, {
              label: c.name,
              category: categoryLabel(c),
              media: thumb
                ? `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover" />`
                : DEFAULT_BLOCK_MEDIA,
              content: componentBlockContent(c),
            });
          }
        }
      } catch {
        // Editor still works without user components (e.g. offline/dev).
      }

      if (cancelled) return;
      editorRef.current = editor;
    })();
    return () => {
      cancelled = true;
      editorRef.current?.destroy();
    };
    // Deliberately keyed on primitives (targetKey, initial.html/css by value,
    // fields by its now-stable reference) instead of the `target` object —
    // see EMPTY_FIELDS/targetKey above for why object/array identity here
    // must not drive re-init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.html, initial.css, targetKey(target), fields]);

  async function handleSave() {
    if (!editorRef.current || saveState === "saving") return;
    clearTimeout(timersRef.current.revert);
    setSaveState("saving");
    setError(null);
    try {
      // Read straight from the live canvas at click-time (not from any
      // cached/initial value), and keep component-generated IDs so inline
      // CSS/JS in custom blocks that target them by #id still matches.
      const html = editorRef.current.getHtml({ cleanId: false }) ?? "";
      const css = editorRef.current.getCss() ?? "";
      const res = await fetch(buildSaveUrl(target), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSaveBody(target, html, css)),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      setLastSaved(new Date());
      setSaveState("success");
      flashToast("success", "Saved — changes written to the database");
      timersRef.current.revert = setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaveState("error");
      flashToast("error", "Save failed — changes were not written");
    }
  }

  const view = viewHref(target);

  return (
    <div className="flex h-screen w-screen flex-col bg-white">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#463a3c] px-4 text-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-300 hover:text-white">←</Link>
          <span className="font-medium text-white">Editing</span>
          <code className="rounded border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-zinc-200">
            {label(target)}
          </code>
          {error && (
            <span className="text-xs text-red-300" title={error}>
              Save failed
            </span>
          )}
          {!error && lastSaved && (
            <span className="text-xs text-zinc-300">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {view && (
            <a
              href={view}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-200 hover:bg-white/10"
            >
              View
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saveState === "saving"}
            className={saveButtonClasses(saveState)}
          >
            {saveState === "saving" && (
              <>
                <span
                  aria-hidden
                  className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
                Saving…
              </>
            )}
            {saveState === "success" && <>✓ Saved!</>}
            {saveState === "error" && <>⚠ Retry Save</>}
            {saveState === "idle" && "Save"}
          </button>
        </div>
      </header>
      <style>{`
        .gjs-block {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 80px !important;
          padding: 12px 8px !important;
          box-sizing: border-box !important;
        }

        .gjs-block__media {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 36px !important;
          margin-bottom: 6px !important;
          color: inherit !important;
        }

        .gjs-block__media svg {
          width: 32px !important;
          height: 32px !important;
          fill: currentColor !important;
        }
      `}</style>
      <div ref={containerRef} className="flex-1 overflow-hidden" />

      {/* Always mounted so opacity/translate can transition smoothly in and out. */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        } ${toast?.type === "error" ? "bg-red-600" : "bg-green-600"}`}
      >
        {toast?.text ?? ""}
      </div>
    </div>
  );
}
