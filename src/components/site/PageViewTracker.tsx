"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "aska_visitor_id";

// Anonymous per-browser id, not tied to any account or PII - just lets the
// dashboard tell "10 page views" apart from "10 different visitors".
function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Fires a beacon at Payload's own auto-generated REST endpoint for the
// page-views collection - no custom API route needed.
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const body = JSON.stringify({ path: pathname, visitorId: getVisitorId() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/page-views", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/page-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}

export default PageViewTracker;
