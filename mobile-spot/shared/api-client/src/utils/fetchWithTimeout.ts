/**
 * `fetch` with a deadline. React Native on Android sends requests through
 * OkHttp with no read timeout, so a stalled connection would otherwise never
 * settle and every screen waiting on it would stay busy.
 *
 * The deadline covers the whole exchange: the body is read inside it and handed
 * back as a fresh `Response`. When it passes, the request is aborted and the
 * promise rejects with `RequestTimeoutError`. An abort from the caller's own
 * `signal` (e.g. Apollo unsubscribing) still rejects with the usual AbortError.
 */

export const REQUEST_TIMEOUT_MS = 15_000;

/** Client-side codes for requests that got no usable answer (never sent by the server). */
export const CLIENT_ERROR_CODES = {
  TIMEOUT: 'REQUEST_TIMEOUT',
  NETWORK: 'NETWORK_ERROR',
} as const;

export class RequestTimeoutError extends Error {
  readonly code = CLIENT_ERROR_CODES.TIMEOUT;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${Math.round(timeoutMs / 1000)} s`);
    this.name = 'RequestTimeoutError';
  }
}

export const isRequestTimeoutError = (error: unknown): error is RequestTimeoutError =>
  error instanceof RequestTimeoutError ||
  (error instanceof Error && error.name === 'RequestTimeoutError');

/** `fetch` rejected without an HTTP answer (offline, DNS, connection refused or reset). */
export const isNetworkFailure = (error: unknown): boolean =>
  error instanceof Error &&
  !isRequestTimeoutError(error) &&
  error.name !== 'AbortError' &&
  /network request failed|failed to fetch|fetch failed|networkerror|load failed|network error/i.test(error.message);

// Statuses whose Response must not carry a body.
const NULL_BODY_STATUSES = new Set([101, 103, 204, 205, 304]);

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const outer = init.signal ?? null;
  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener('abort', onOuterAbort);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  // Rejects on its own even if a fetch polyfill ignores the abort.
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new RequestTimeoutError(timeoutMs));
      controller.abort();
    }, timeoutMs);
  });

  const request = (async () => {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const body = await response.text();
    return new Response(NULL_BODY_STATUSES.has(response.status) ? null : body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  })();

  return Promise.race([request, deadline]).finally(() => {
    if (timer) clearTimeout(timer);
    outer?.removeEventListener('abort', onOuterAbort);
  });
}
