"use client";

import { useEffect } from "react";

// The resize handle is 32px square and sits 12px outside the image edges,
// so it overlaps the image by ~20px on each side. Below this width the
// handle visually swallows most of the image (e.g. at the old 60px floor it
// covered a third of the width and half the height), making a correctly
// proportioned image look broken even though its actual box math is fine.
const MIN_RESIZE_WIDTH = 120;

export function RichTextStyles() {
  useEffect(() => {
    let resizingImg: HTMLImageElement | null = null;
    let startX = 0;
    let startWidth = 0;
    let resizeAspectRatio = 1;

    // Setup resize on image
    const setupImageResize = (img: HTMLImageElement) => {
      if (img.dataset.resizeSetup === "true") return;

      // Payload reserves layout space (and offsetWidth) from stored upload
      // metadata before the actual image bytes finish downloading, so
      // naturalWidth/naturalHeight can still be 0 here for a real, larger
      // photo even though the element already has a nonzero size. Resizing
      // before decode finishes would have no reliable source for the true
      // aspect ratio at all. Defer the whole setup until the browser has
      // actually decoded it.
      if (!img.complete || !img.naturalWidth) {
        img.addEventListener("load", () => setupImageResize(img), { once: true });
        return;
      }
      img.dataset.resizeSetup = "true";

      // Style the image for inline positioning. Payload's own editor theme
      // pins upload preview images to a fixed 450px box depending on
      // orientation: landscape gets `max-width: 450px; min-width: 450px`,
      // portrait gets `max-height: 450px; min-height: 450px`. We already
      // knew about the max- side (it caused images to stretch instead of
      // grow past 450px) - but min-width/min-height are a floor, not a
      // ceiling: whichever axis Payload pins can never render below 450px
      // no matter what our own resize math sets it to. So shrinking a
      // landscape image kept its width stuck at 450px while height (driven
      // off the *intended*, uncapped width) kept shrinking - visually
      // squishing it vertically instead of scaling it down proportionally.
      // Neutralize all four so our explicit width/height are the only
      // constraint in effect, in both directions, for either orientation.
      img.style.display = "inline-block";
      img.style.position = "relative";
      img.style.verticalAlign = "top";
      img.style.cursor = "grab";
      img.style.maxWidth = getMaxWidth(img) + "px";
      img.style.maxHeight = "none";
      img.style.minWidth = "0";
      img.style.minHeight = "0";

      // Create resize handle
      const handle = document.createElement("div");
      handle.className = "image-resize-handle";
      handle.title = "Drag to resize (maintains aspect ratio)";

      img.parentElement?.insertBefore(handle, img.nextSibling);

      // Handle mousedown event on handle
      handle.addEventListener("mousedown", (e: MouseEvent) => {
        resizingImg = img;
        startX = e.clientX;
        startWidth = img.offsetWidth || img.width || 400;
        // Lock the ratio to the image's true intrinsic dimensions (guaranteed
        // decoded by now, see the load-event guard in setupImageResize), not
        // its current rendered (integer-rounded) size - deriving it from
        // offsetWidth/offsetHeight every drag let rounding drift compound
        // across repeated resizes, especially once clamped at the minimum
        // width, so the image slowly stopped matching its original shape.
        resizeAspectRatio = img.naturalHeight / img.naturalWidth;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "se-resize";
        e.preventDefault();
        e.stopPropagation();
      });
    };

    // Find all images in editor and setup
    const findAndSetupImages = () => {
      const editors = [
        document.querySelector("[data-lexical-editor]"),
        document.querySelector(".lexical-editor"),
        document.querySelector(".payload-richtext"),
        document.querySelector("[contenteditable]"),
      ].filter(Boolean);

      editors.forEach((editor) => {
        if (!editor) return;
        editor.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
          if (img.offsetWidth > 0) {
            setupImageResize(img);
          }
        });
      });
    };

    // Widest the image can go before it overflows the editor's text area.
    // Upload nodes are wrapped in their own contenteditable="false" decorator,
    // so closest("[contenteditable]") from the img would match that instead
    // of the real editable root - target data-lexical-editor specifically.
    const getMaxWidth = (img: HTMLImageElement): number => {
      const container = img.closest<HTMLElement>('[data-lexical-editor]');
      if (!container) return Infinity;
      const style = getComputedStyle(container);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      return Math.max(MIN_RESIZE_WIDTH, container.clientWidth - padding);
    };

    // Global mouse move handler
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingImg) return;

      const deltaX = e.clientX - startX;
      const maxWidth = getMaxWidth(resizingImg);
      const newWidth = Math.min(maxWidth, Math.max(MIN_RESIZE_WIDTH, startWidth + deltaX));
      const newHeight = newWidth * resizeAspectRatio;

      resizingImg.style.width = newWidth + "px";
      resizingImg.style.height = newHeight + "px";
    };

    // Global mouse up handler
    const onMouseUp = () => {
      if (resizingImg) {
        resizingImg.style.cursor = "grab";
        resizingImg = null;
      }
      document.body.style.userSelect = "auto";
      document.body.style.cursor = "auto";
    };

    // Attach global event listeners
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);

    // Initial setup
    findAndSetupImages();

    // Watch for content changes
    const observer = new MutationObserver(() => {
      findAndSetupImages();
    });

    // Observe multiple possible locations
    const targets = [
      document.querySelector("[data-lexical-editor]"),
      document.querySelector(".lexical-editor"),
      document.querySelector(".payload-richtext"),
      document.body,
    ].filter(Boolean) as Element[];

    targets.forEach((target) => {
      observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });
    });

    // Cleanup
    return () => {
      observer.disconnect();
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("mouseup", onMouseUp, true);
    };
  }, []);

  return (
    <style>{`
      /* Image resize handle */
      .image-resize-handle {
        position: absolute;
        bottom: -12px;
        right: -12px;
        width: 32px;
        height: 32px;
        background: #667eea;
        border: 2px solid white;
        border-radius: 4px;
        cursor: se-resize;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        user-select: none;
        pointer-events: auto;
      }

      .image-resize-handle::after {
        content: '↘';
        color: white;
        font-size: 18px;
        font-weight: bold;
        line-height: 1;
      }

      .image-resize-handle:hover {
        background: #5568d3;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
      }

      .image-resize-handle:active {
        background: #4a57c2;
      }

      /* Image hover state */
      [data-lexical-editor] img:hover,
      .lexical-editor img:hover,
      .payload-richtext img:hover {
        outline: 2px dashed #667eea;
        outline-offset: 2px;
      }

      /* Lexical figure elements */
      [data-lexical-editor] figure,
      .lexical-editor figure,
      .payload-richtext figure {
        margin: 1em 0;
        position: relative;
      }

      [data-lexical-editor] figure img,
      .lexical-editor figure img,
      .payload-richtext figure img {
        max-width: 100%;
        height: auto;
      }

      [data-lexical-editor] figcaption,
      .lexical-editor figcaption,
      .payload-richtext figcaption {
        font-size: 0.9em;
        color: #666;
        margin-top: 0.5em;
        font-style: italic;
      }
    `}</style>
  );
}
