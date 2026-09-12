const FALLBACK_IDS = new Set(["_placeholder", "__fallback"]);

export function isFallbackSpotId(id: string | undefined | null): boolean {
  return !id || FALLBACK_IDS.has(id);
}

/** Real spot id from a pathname like `/spots/lodziarnia-hopek-r9iut9`. */
export function parseSpotIdFromPath(pathname: string): string | null {
  const match = pathname.replace(/\/+$/, "").match(/^\/spots\/([^/]+)$/);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  return isFallbackSpotId(id) ? null : id;
}

/**
 * Captured when this module first loads, before the App Router can rewrite
 * the address bar. Needed because a static export may serve fallback HTML
 * (or even index.html) at `/spots/:id`.
 */
export const bootSpotId =
  typeof window !== "undefined"
    ? parseSpotIdFromPath(window.location.pathname)
    : null;
