import { useEffect } from 'react';

/**
 * App-wide count of open overlays (RN `Modal`s: sheets, pickers, dialogs,
 * the fullscreen card). React Native cannot tell whether a Modal is on
 * screen, so modals that can be open on a tab screen register here; the
 * "back to My card after a long break" rule (review #5) never jumps away from
 * an open one.
 */
let openOverlays = 0;

export const isOverlayOpen = (): boolean => openOverlays > 0;

/** Counts this overlay as open while `visible` is true (and it is mounted). */
export function useOverlayOpen(visible: boolean): void {
  useEffect(() => {
    if (!visible) return;
    openOverlays += 1;
    return () => {
      openOverlays = Math.max(0, openOverlays - 1);
    };
  }, [visible]);
}
