/**
 * Central request-error signal. When a GraphQL/network request fails, the
 * api-client emits here so the root layout can show a friendly toast instead
 * of the raw dev LogBox. Decouples the non-React api-client from React UI.
 */

export type RequestErrorKind = 'network' | 'server';
type Listener = (payload: { kind: RequestErrorKind; message: string }) => void;

const listeners = new Set<Listener>();

// Coalesce a burst of failures into a single toast.
let lastEmit = 0;
const BURST_MS = 3000;

export const onRequestError = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Emit a request-error event (deduped within a short burst window). Auth
 * errors are handled separately by the session-expiry flow, so callers should
 * not emit those here.
 */
export const emitRequestError = (message: string): void => {
  const now = Date.now();
  if (now - lastEmit < BURST_MS) return;
  lastEmit = now;
  // A missing/unreachable backend surfaces as "Network request failed".
  const kind: RequestErrorKind = /network request failed|failed to fetch|network error/i.test(
    message,
  )
    ? 'network'
    : 'server';
  listeners.forEach((l) => {
    try {
      l({ kind, message });
    } catch {
      /* ignore */
    }
  });
};
