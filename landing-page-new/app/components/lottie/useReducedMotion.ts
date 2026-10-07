"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getMediaQueryList(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia(QUERY);
}

function subscribe(onChange: () => void): () => void {
  const mql = getMediaQueryList();
  if (!mql) return () => {};
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }
  // Safari < 14
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

const getSnapshot = () => getMediaQueryList()?.matches ?? false;
const getServerSnapshot = () => false;

/**
 * `true` when the visitor asked the OS for reduced motion.
 * Always `false` during SSR / static export; updates live when the setting changes.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
