"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  bootSpotId,
  isFallbackSpotId,
  parseSpotIdFromPath,
} from "./spot-route";

/**
 * Resolve the spot id for a statically exported `/spots/[id]` page.
 * Prefers the live URL, then the baked-in param, then the id captured at boot
 * (when Apache served fallback HTML at a pretty spot URL).
 */
export function useSpotRouteId(paramId: string): string | null {
  const pathname = usePathname();
  const fromPath = parseSpotIdFromPath(pathname);
  const fromParam = isFallbackSpotId(paramId) ? null : paramId;
  const [fromBoot, setFromBoot] = useState<string | null>(null);

  useEffect(() => {
    if (bootSpotId) setFromBoot(bootSpotId);
  }, []);

  useEffect(() => {
    const live = parseSpotIdFromPath(window.location.pathname);
    const resolved = live ?? fromParam ?? bootSpotId;
    if (
      resolved &&
      parseSpotIdFromPath(window.location.pathname) !== resolved
    ) {
      window.history.replaceState(
        window.history.state,
        "",
        `/spots/${resolved}`,
      );
    }
  }, [fromParam]);

  return fromPath ?? fromParam ?? fromBoot;
}
