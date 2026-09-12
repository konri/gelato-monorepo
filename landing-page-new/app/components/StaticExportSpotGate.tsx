"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { bootSpotId, parseSpotIdFromPath } from "../lib/spot-route";

/**
 * Static hosting may serve `index.html` for unknown `/spots/:id` paths.
 * Next.js then hydrates as the homepage. If we booted on a spot URL, push
 * the client router to that spot so the detail page (or not-found recovery)
 * can load it.
 */
export function StaticExportSpotGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const did = useRef(false);

  useEffect(() => {
    if (did.current || !bootSpotId) return;
    if (parseSpotIdFromPath(pathname) === bootSpotId) return;
    if (parseSpotIdFromPath(window.location.pathname) === bootSpotId) return;
    if (pathname === "/" || pathname === "/spots/__fallback") {
      did.current = true;
      router.replace(`/spots/${bootSpotId}`);
    }
  }, [pathname, router]);

  return children;
}
