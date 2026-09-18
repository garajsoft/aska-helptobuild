import type { CodeField } from "payload";

/**
 * Payload's `code` field has no built-in height cap — @payloadcms/ui's
 * CodeEditor resizes the Monaco container to `lineCount * 18px` on every
 * keystroke, with no internal scrollbar. Past ~1000 lines the *admin page*
 * becomes the scroll container instead of Monaco's own viewport, and each
 * keystroke's height recalculation shifts scrollTop out from under the
 * cursor — clicking or typing then appears to jump to an unrelated line.
 * Capping `maxHeight` hands scrolling back to Monaco's own internal
 * viewport, which is what actually fixes it (not a CSS/scroll-anchoring
 * issue — verified by reading @payloadcms/ui/dist/elements/CodeEditor).
 */
export const CODE_FIELD_ADMIN: Pick<NonNullable<CodeField["admin"]>, "editorOptions" | "editorProps"> = {
  editorOptions: {
    scrollBeyondLastLine: false,
    smoothScrolling: true,
  },
  editorProps: {
    // @ts-expect-error `maxHeight` is accepted by the underlying CodeEditor
    // component (@payloadcms/ui/dist/elements/CodeEditor/CodeEditor.js,
    // which destructures it directly off props) but missing from the
    // `editorProps` type Payload exposes here (typed as monaco-react's own
    // EditorProps, which has no maxHeight/minHeight of its own).
    maxHeight: 480,
  },
};
