import { useEffect } from 'react';

// The console uses <BrowserRouter> (no data router, so no useBlocker): a
// page with unsaved edits registers here, the browser asks before a reload
// or tab close, and in-app links ask through confirmLeave().
let pending = false;

/** Marks the current page as having unsaved changes while `dirty` is true. */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    pending = true;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Older Chromium needs returnValue set to show the prompt.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      pending = false;
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [dirty]);
}

/** True when the user may leave: nothing unsaved, or they confirmed. */
export function confirmLeave(message: string): boolean {
  if (!pending) return true;
  if (!window.confirm(message)) return false;
  pending = false;
  return true;
}

/** onClick for a link or button that leaves the page: cancels it if the user stays. */
export function guardLeave(message: string) {
  return (e: { preventDefault: () => void }) => {
    if (!confirmLeave(message)) e.preventDefault();
  };
}
