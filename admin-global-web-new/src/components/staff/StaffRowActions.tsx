import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StaffMenuAction } from './staffActions';

const DANGER: ReadonlySet<StaffMenuAction> = new Set(['disable', 'remove']);

/** "Actions" menu of one staff row; only the allowed actions are listed. */
export function StaffRowActions({
  actions,
  busy,
  onAction,
}: {
  actions: StaffMenuAction[];
  busy: boolean;
  onAction: (action: StaffMenuAction) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {busy ? t('Common.saving') : t('Staff.actions')}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
        >
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onAction(action);
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                DANGER.has(action) ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              {t(`Staff.action_${action}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
