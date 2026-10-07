/**
 * Session signals raised outside React (Apollo ErrorLink, REST helpers) and
 * handled by AuthContext:
 * - `unauthenticated`: the token is gone or revoked (UNAUTHENTICATED / 401) → log out.
 * - `password-change-required`: restricted session → /change-password.
 * - `upgrade-required`: the backend wants a newer console → Reload overlay.
 */
export type SessionEvent = 'unauthenticated' | 'password-change-required' | 'upgrade-required';

type Listener = (event: SessionEvent) => void;

const listeners = new Set<Listener>();

export function onSessionEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionEvent(event: SessionEvent): void {
  for (const listener of listeners) listener(event);
}
