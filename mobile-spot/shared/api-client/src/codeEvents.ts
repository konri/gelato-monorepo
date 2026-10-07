/**
 * Central signal for server error codes that need an app-wide reaction
 * (BRANDS_SPEC §4.1). The api-client reads `errors[].extensions.code` (GraphQL)
 * or `code` (REST) and emits here; React providers subscribe:
 *
 *   - SCOPE_FORBIDDEN          → the spot context revalidates (assignments may
 *                                have changed);
 *   - PASSWORD_CHANGE_REQUIRED → sign out to the login screen with a notice;
 *   - UPGRADE_REQUIRED         → full-screen "update the app" overlay.
 *
 * Decoupled from React like errorEvents.ts.
 */

export type AppErrorCode = 'SCOPE_FORBIDDEN' | 'PASSWORD_CHANGE_REQUIRED' | 'UPGRADE_REQUIRED';

export type CodeEvent = {
  code: AppErrorCode;
  message?: string;
  extensions?: Record<string, unknown> | null;
};

type Listener = (event: CodeEvent) => void;

const listeners = new Set<Listener>();

const WATCHED: ReadonlySet<string> = new Set<AppErrorCode>([
  'SCOPE_FORBIDDEN',
  'PASSWORD_CHANGE_REQUIRED',
  'UPGRADE_REQUIRED',
]);

export const onCodeEvent = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Emits only for the codes above; anything else is ignored. */
export const emitCodeEvent = (
  code: string | null | undefined,
  message?: string,
  extensions?: Record<string, unknown> | null,
): void => {
  if (!code || !WATCHED.has(code)) return;
  const event: CodeEvent = { code: code as AppErrorCode, message, extensions };
  listeners.forEach((l) => {
    try {
      l(event);
    } catch {
      /* ignore */
    }
  });
};
