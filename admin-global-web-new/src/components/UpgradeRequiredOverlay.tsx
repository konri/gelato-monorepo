import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';

/** UPGRADE_REQUIRED from the backend: this tab runs an outdated console. */
export function UpgradeRequiredOverlay() {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <h2 className="mb-2 text-lg font-bold text-gray-900">{t('Upgrade.title')}</h2>
        <p className="mb-5 text-sm text-gray-600">{t('Errors.UPGRADE_REQUIRED')}</p>
        <Button className="w-full" onClick={() => window.location.reload()}>
          {t('Upgrade.reload')}
        </Button>
      </div>
    </div>
  );
}
