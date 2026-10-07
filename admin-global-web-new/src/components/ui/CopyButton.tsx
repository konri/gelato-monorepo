import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buttonClass } from './buttonClass';

/** Small "Copy" button: copies `value`, then shows "Copied" (or a failure) for a moment. */
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const id = window.setTimeout(() => setState('idle'), 1500);
    return () => window.clearTimeout(id);
  }, [state]);

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  const text = state === 'copied' ? t('Common.copied') : state === 'failed' ? t('Common.copyFailed') : t('Common.copy');
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={label ? `${t('Common.copy')}: ${label}` : undefined}
      className={buttonClass(
        'secondary',
        'sm',
        `shrink-0 ${state === 'copied' ? 'text-green-700' : state === 'failed' ? 'text-red-600' : ''}`,
      )}
    >
      <span aria-live="polite">{text}</span>
    </button>
  );
}
