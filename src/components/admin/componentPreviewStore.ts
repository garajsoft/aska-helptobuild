"use client";

import { useSyncExternalStore } from "react";

export type PreviewMode = "closed" | "split" | "fullscreen";

/**
 * Shared client-only preview-mode state. The header's Split View/Fullscreen
 * trigger buttons (rendered via Components.ts's admin.components.edit.
 * beforeDocumentControls) and the preview panel (a `ui` field elsewhere in
 * the same form) are separate React subtrees — this is what lets them
 * control one state without threading a context through Payload's own
 * edit-view tree.
 */
let mode: PreviewMode = "closed";
const listeners = new Set<() => void>();

export function setPreviewMode(next: PreviewMode) {
  mode = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return mode;
}

function getServerSnapshot() {
  return "closed" as const;
}

export function usePreviewMode(): PreviewMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
