import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../../brand/BrandScope';
import type { AdminSpot } from '../../graphql/spots';
import { SPOT_APP_URL } from '../../lib/config';
import { Card } from '../ui/Card';

type Step = { key: string; done: boolean; to: string; label: string; hint: string };

/**
 * First steps for a brand admin (BRANDS_SPEC §3.3): profile, cities, a spot,
 * a reward and the team; day-to-day work happens in the Loodly Spot app.
 */
export function SetupChecklist({ spots, spotsLoaded }: { spots: AdminSpot[]; spotsLoaded: boolean }) {
  const { t } = useTranslation();
  const { brand, view, paths } = useBrandScope();

  const steps: Step[] = [
    {
      key: 'profile',
      done: !!brand.logoUrl && !!(brand.description?.trim() || brand.descriptionLocal),
      to: `${paths.home}#identity`,
      label: t('Setup.profile'),
      hint: t('Setup.profileHint'),
    },
    {
      key: 'cities',
      done: brand.cityIds.length > 0,
      to: `${paths.home}#cities`,
      label: t('Setup.cities'),
      hint: t('Setup.citiesHint'),
    },
    {
      key: 'spot',
      done: spots.length > 0,
      to: spots.length > 0 ? paths.spots : paths.newSpot,
      label: t('Setup.spot'),
      hint: t('Setup.spotHint'),
    },
    {
      key: 'reward',
      done: brand.rewardCount > 0,
      to: paths.rewards,
      label: t('Setup.reward'),
      hint: t('Setup.rewardHint'),
    },
    {
      key: 'staff',
      done: view.staffCount > 1,
      to: paths.staff,
      label: t('Setup.staff'),
      hint: t('Setup.staffHint'),
    },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <Card
      title={t('Setup.title')}
      description={t('Setup.progress', { done, total: steps.length })}
    >
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-green-500"
          style={{ width: `${Math.round((done / steps.length) * 100)}%` }}
        />
      </div>
      <ol className="space-y-2">
        {steps.map((step) => (
          <li key={step.key}>
            <Link
              to={step.to}
              className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 hover:border-gray-200 hover:bg-gray-50"
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done ? 'bg-green-100 text-green-700' : 'border border-gray-300 text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${step.done ? 'text-gray-500' : 'text-gray-900'}`}>
                  {step.label}
                  <span className="sr-only">{step.done ? ` (${t('Setup.done')})` : ''}</span>
                </span>
                {!step.done && (step.key !== 'spot' || spotsLoaded) && (
                  <span className="block text-xs text-gray-500">{step.hint}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
        <p className="font-semibold">{t('Setup.spotAppTitle')}</p>
        <p className="mt-0.5 text-xs">{t('Setup.spotAppHint')}</p>
        {SPOT_APP_URL && (
          <a
            href={SPOT_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs font-semibold underline"
          >
            {t('SpotApp.open')}
          </a>
        )}
      </div>
    </Card>
  );
}
