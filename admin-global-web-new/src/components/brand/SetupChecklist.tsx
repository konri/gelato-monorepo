import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useBrandScope } from '../../brand/BrandScope';
import { BRAND_STAFF, type StaffMember } from '../../graphql/staff';
import { SPOT_MENU_COUNT, hasOpeningHours, type AdminSpot } from '../../graphql/spots';
import { SPOT_APP_URL } from '../../lib/config';
import { Card } from '../ui/Card';

type Step = {
  key: string;
  /** null while the data behind it is still loading. */
  done: boolean | null;
  /** In-console route, or an external URL (the Loodly Spot app). */
  to: string;
  external?: boolean;
  label: string;
  hint: string;
};

/**
 * First steps for a brand admin (BRANDS_SPEC §3.3): profile, cities, a spot,
 * its set-up in the Loodly Spot app, its activation, a reward and the spot
 * team. The list ends when a spot takes orders, not when the console part
 * is filled in; the first open step is marked as the next one.
 */
export function SetupChecklist({ spots, spotsLoaded }: { spots: AdminSpot[]; spotsLoaded: boolean }) {
  const { t } = useTranslation();
  const { brand, brandId, quota, paths } = useBrandScope();

  const anyActive = quota.activeSpots > 0 || spots.some((s) => s.isActive);
  // The spot whose set-up in the spot app is checked: the first one not active yet.
  const candidate = anyActive ? null : spots.find((s) => !s.isActive) ?? null;
  const { data: menu } = useQuery<{ spotTastes: { id: string }[]; spotProducts: { id: string }[] }>(SPOT_MENU_COUNT, {
    variables: { spotId: candidate?.id ?? '' },
    skip: !candidate,
    fetchPolicy: 'cache-and-network',
  });
  const { data: staffData } = useQuery<{ brandStaff: StaffMember[] }>(BRAND_STAFF, {
    variables: { brandId },
    fetchPolicy: 'cache-and-network',
  });

  const menuCount = menu ? menu.spotTastes.length + menu.spotProducts.length : null;
  const spotAppDone: boolean | null = anyActive
    ? true
    : !candidate
      ? false
      : menuCount === null
        ? null
        : menuCount > 0 &&
          hasOpeningHours(candidate.openingHours) &&
          !!(candidate.logoUrl || candidate.coverUrl || candidate.photos.length > 0);
  // Spot admins and employees; a second brand admin is not the spot team.
  const spotTeam = staffData
    ? staffData.brandStaff.filter((m) => m.kind === 'SPOT_ADMIN' || m.kind === 'EMPLOYEE').length
    : null;

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
      done: spotsLoaded ? spots.length > 0 : null,
      to: spots.length > 0 ? paths.spots : paths.newSpot,
      label: t('Setup.spot'),
      hint: t('Setup.spotHint'),
    },
    {
      key: 'spotApp',
      done: spotsLoaded ? spotAppDone : null,
      to: SPOT_APP_URL,
      external: true,
      label: t('Setup.spotApp'),
      hint: t('Setup.spotAppStepHint'),
    },
    {
      key: 'activate',
      done: spotsLoaded ? anyActive : null,
      to: paths.spots,
      label: t('Setup.activate'),
      hint: t('Setup.activateHint'),
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
      done: spotTeam === null ? null : spotTeam > 0,
      to: paths.staff,
      label: t('Setup.staff'),
      hint: t('Setup.staffHint'),
    },
  ];
  const done = steps.filter((s) => s.done === true).length;
  const nextKey = steps.find((s) => s.done === false)?.key ?? null;

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
        {steps.map((step) => {
          const next = step.key === nextKey;
          const body: ReactNode = (
            <>
              <span
                aria-hidden
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done ? 'bg-green-100 text-green-700' : 'border border-gray-300 text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${step.done ? 'text-gray-500' : 'text-gray-900'}`}>
                  {step.label}
                  <span className="sr-only">{step.done ? ` (${t('Setup.done')})` : ''}</span>
                </span>
                {step.done === false && <span className="block text-xs text-gray-500">{step.hint}</span>}
              </span>
              {next && (
                <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                  {t('Setup.next')}
                </span>
              )}
              {step.external && step.done === false && (
                <span aria-hidden className="shrink-0 text-sm text-gray-400">
                  ↗
                </span>
              )}
            </>
          );
          const cls = `flex min-h-11 items-start gap-3 rounded-lg border p-3 hover:border-gray-200 hover:bg-gray-50 ${
            next ? 'border-brand' : 'border-gray-100'
          }`;
          return (
            <li key={step.key}>
              {step.external ? (
                <a href={step.to} target="_blank" rel="noreferrer" className={cls}>
                  {body}
                </a>
              ) : (
                <Link to={step.to} className={cls}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
        <p className="font-semibold">{t('Setup.spotAppTitle')}</p>
        <p className="mt-0.5 text-xs">{t('Setup.spotAppHint')}</p>
        <a
          href={SPOT_APP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold underline md:min-h-0"
        >
          {t('SpotApp.open')} ↗
        </a>
      </div>
    </Card>
  );
}
