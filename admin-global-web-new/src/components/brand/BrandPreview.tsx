import { useTranslation } from 'react-i18next';
import { BrandLogo } from './BrandLogo';

/** How the brand card looks in the client app (cover, logo, name, description). */
export function BrandPreview({
  name,
  logoUrl,
  coverUrl,
  description,
}: {
  name: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">{t('BrandProfile.preview')}</p>
      <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-br from-brand-light to-gray-100">
          {coverUrl && <img src={coverUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="-mt-6 px-4 pb-4">
          <div className="inline-block rounded-xl bg-white p-1 shadow-sm">
            <BrandLogo name={name} logoUrl={logoUrl} size="lg" />
          </div>
          <p className="mt-1 font-bold text-gray-900">{name}</p>
          {description ? (
            <p className="mt-0.5 line-clamp-3 text-xs text-gray-500">{description}</p>
          ) : (
            <p className="mt-0.5 text-xs italic text-gray-400">{t('BrandProfile.noDescription')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
