import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../translations';

/**
 * Language picker. `changeLanguage` persists the choice to localStorage via the
 * i18n `languageChanged` listener (see src/translations/index.ts).
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2).toLowerCase();

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <span className="sr-only">{t('Language.label')}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0 text-gray-400"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
      <select
        value={SUPPORTED_LANGUAGES.includes(current as never) ? current : 'en'}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        aria-label={t('Language.label')}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng}>
            {t(`Language.${lng}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
