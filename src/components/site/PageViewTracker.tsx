"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fires a beacon at Payload's own auto-generated REST endpoint for the
// page-views collection - no custom API route needed.
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const body = JSON.stringify({ path: pathname });
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
