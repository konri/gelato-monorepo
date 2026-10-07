import { useTranslation } from 'react-i18next';

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-gray-200 border-t-brand ${className}`}
      aria-hidden
    />
  );
}

/** Centered spinner for whole-page waits (session check, first load). */
export function FullPageSpinner({ inline = false }: { inline?: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-center justify-center ${inline ? 'py-16' : 'min-h-screen bg-gray-50'}`}
      role="status"
    >
      <Spinner className="h-8 w-8" />
      <span className="sr-only">{t('Common.loading')}</span>
    </div>
  );
}
