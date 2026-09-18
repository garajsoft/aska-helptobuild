import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Stamps the resolved pathname onto the request so the shared (site)/layout.tsx
 * can call getThemeLayout(pathname) — the App Router gives a layout its
 * segment params, not the request's pathname, and (site)/layout.tsx sits
 * above every route (home, [slug], blog/[slug], …).
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-aska-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!admin|api|_next/static|_next/image|favicon.ico).*)"],
};
