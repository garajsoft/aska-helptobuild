"use client";

import { Button } from "@payloadcms/ui";
import { setPreviewMode, usePreviewMode } from "./componentPreviewStore";

/**
 * Split View / Fullscreen entry buttons for the top document-controls
 * header — registered only on the Components collection (see Components.ts
 * admin.components.edit.beforeDocumentControls), so no other collection's
 * editor ever mounts this. Renders immediately left of Save/Publish, per
 * Payload's DocumentControls order.
 *
 * Hides once a preview is open — the panel (ComponentPreview, a `ui` field
 * below the code editors) renders its own Split View/Fullscreen/Close
 * buttons in that state for switching modes in place.
 */
export const ComponentPreviewToggle = () => {
  const mode = usePreviewMode();
  if (mode !== "closed") return null;

  return (
    <>
      <Button
        size="medium"
        buttonStyle="secondary"
        className="aska-header-preview-btn"
        onClick={() => setPreviewMode("split")}
      >
        Split View
      </Button>
      <Button
        size="medium"
        buttonStyle="secondary"
        className="aska-header-preview-btn"
        onClick={() => setPreviewMode("fullscreen")}
      >
        Fullscreen
      </Button>
    </>
  );
};

export default ComponentPreviewToggle;
