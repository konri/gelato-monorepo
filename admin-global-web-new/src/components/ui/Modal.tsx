import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type ModalProps = {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Buttons row at the bottom. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Blocks closing by Escape / backdrop (e.g. while saving). */
  busy?: boolean;
};

const WIDTH = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' } as const;

export function Modal({ title, onClose, children, footer, size = 'md', busy = false }: ModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose()} />
      <div className={`relative flex max-h-[90vh] w-full ${WIDTH[size]} flex-col rounded-xl bg-white shadow-xl`}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t('Common.close')}
            className="-mr-2 -mt-1 rounded-lg px-2 py-1 text-lg leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex gap-3 border-t border-gray-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
