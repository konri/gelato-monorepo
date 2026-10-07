/**
 * Central request-error signal. When a GraphQL/network request fails, the
 * api-client emits here so the root layout can show a friendly toast instead
 * of the raw dev LogBox. Decouples the non-React api-client from React UI.
 *
 * The payload carries the server's `extensions.code` (when there is one) so the
 * toast can show a localized `Errors.codes.*` text.
 */

export type RequestErrorKind = 'network' | 'server';
export type RequestErrorPayload = { kind: RequestErrorKind; message: string; code?: string | null };
type Listener = (payload: RequestErrorPayload) => void;

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
export const emitRequestError = (message: string, code?: string | null): void => {
  const now = Date.now();
  if (now - lastEmit < BURST_MS) return;
  lastEmit = now;
  // A missing/unreachable backend surfaces as "Network request failed".
  const kind: RequestErrorKind =
    !code && /network request failed|failed to fetch|network error/i.test(message)
      ? 'network'
      : 'server';
  listeners.forEach((l) => {
    try {
      l({ kind, message, code: code ?? null });
    } catch {
      /* ignore */
    }
  });
};
