/**
 * Actions row of a form inside a Modal body: sticks to the bottom of the
 * scrolling body, so Save / Send stays visible on short screens (1280×720).
 */
export const modalActionsClass =
  'sticky bottom-0 z-10 -mx-6 -mb-4 flex gap-3 border-t border-gray-100 bg-white px-6 py-4';

/**
 * Save / Cancel row at the end of a long page form: sticks to the bottom of
 * the console's scrolling content, so it is reachable without scrolling to
 * the end (1280×720, phones).
 */
export const stickyActionsClass =
  'sticky bottom-0 z-10 -mx-6 flex justify-end gap-3 border-t border-gray-200 bg-gray-50/95 px-6 py-3 backdrop-blur sm:-mx-8 sm:px-8';
