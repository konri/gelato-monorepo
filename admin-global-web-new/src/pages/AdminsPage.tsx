import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { ADMIN_ACCOUNTS, type AdminAccount } from '../graphql/admin';
import { ADMIN_BRANDS, type BrandAdminView } from '../graphql/brands';
import { RESEND_ADMIN_INVITE, SET_STAFF_LOGIN_DISABLED } from '../graphql/staff';
import { errorText } from '../lib/errors';
import { fmtDate } from '../lib/format';
import { PageHeader } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FilterChip } from '../components/ui/FilterChip';
import { Input } from '../components/ui/Field';

type RoleFilter = 'ALL' | 'PLATFORM' | 'BRAND_ADMIN' | 'SPOT_ADMIN' | 'EMPLOYEE' | 'NONE';

function roleOf(a: AdminAccount): Exclude<RoleFilter, 'ALL'> {
  if (a.roles.includes('SUPER_ADMIN')) return 'PLATFORM';
  return a.kind ?? 'NONE';
}

/**
 * PLATFORM: every admin-namespace account, read-only (BRANDS_SPEC §3.3). Staff
 * are invited from their brand (Brand admins card, Staff page); here an
 * account's login can be disabled or its set-password code resent.
 */
export function AdminsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, loading, error } = useQuery<{ adminAccounts: AdminAccount[] }>(ADMIN_ACCOUNTS, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: brandsData } = useQuery<{ adminBrands: BrandAdminView[] }>(ADMIN_BRANDS);
  const [resendInvite] = useMutation(RESEND_ADMIN_INVITE);
  const [setDisabled] = useMutation(SET_STAFF_LOGIN_DISABLED, { refetchQueries: ['AdminAccounts'] });
  const [busy, setBusy] = useState<Record<string, 'sending' | 'sent' | 'saving' | undefined>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('ALL');

  const brandName = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of brandsData?.adminBrands ?? []) map.set(b.brand.id, b.brand.name);
    return map;
  }, [brandsData]);

  const accounts = useMemo(() => data?.adminAccounts ?? [], [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts
      .filter((a) => role === 'ALL' || roleOf(a) === role)
      .filter(
        (a) =>
          !q ||
          [a.name ?? '', a.email, a.brandId ? brandName.get(a.brandId) ?? '' : ''].some((f) =>
            f.toLowerCase().includes(q),
          ),
      );
  }, [accounts, role, query, brandName]);

  const run = async (id: string, state: 'sending' | 'saving', action: () => Promise<unknown>) => {
    setActionError(null);
    setBusy((b) => ({ ...b, [id]: state }));
    try {
      await action();
      setBusy((b) => ({ ...b, [id]: state === 'sending' ? 'sent' : undefined }));
    } catch (err) {
      setBusy((b) => ({ ...b, [id]: undefined }));
      setActionError(errorText(err));
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-8">
      <PageHeader title={t('Admins.title')} subtitle={t('Admins.subtitle')} />

      <div className="mb-5 space-y-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Admins.searchPlaceholder')}
          aria-label={t('Admins.searchPlaceholder')}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'PLATFORM', 'BRAND_ADMIN', 'SPOT_ADMIN', 'EMPLOYEE'] as RoleFilter[]).map((r) => (
            <FilterChip key={r} active={role === r} onClick={() => setRole(r)}>
              {r === 'ALL' ? t('Admins.allRoles') : t(`Roles.${r}`)}
            </FilterChip>
          ))}
        </div>
      </div>

      {error && <Alert tone="error" className="mb-4">{errorText(error)}</Alert>}
      {actionError && <Alert tone="error" className="mb-4">{actionError}</Alert>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3">{t('Common.name')}</th>
              <th className="px-5 py-3">{t('Admins.role')}</th>
              <th className="px-5 py-3">{t('Admins.colBrand')}</th>
              <th className="px-5 py-3">{t('Admins.colSpots')}</th>
              <th className="px-5 py-3">{t('Admins.colStatus')}</th>
              <th className="px-5 py-3 text-right">{t('Admins.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && !data && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-gray-500">
                  {t('Common.loading')}
                </td>
              </tr>
            )}
            {data && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-gray-500">
                  {t('Admins.noAdminsYet')}
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const r = roleOf(a);
              const state = busy[a.id];
              const self = a.id === user?.id;
              const spotCount = r === 'BRAND_ADMIN' ? null : a.spotIds?.length ?? null;
              return (
                <tr key={a.id}>
                  <td className="px-5 py-3">
                    <span className="block font-medium text-gray-900">{a.name || '—'}</span>
                    <span className="block text-xs text-gray-500">{a.email}</span>
                    <span className="block text-xs text-gray-400">{t('Admins.since', { date: fmtDate(a.createdAt) })}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={r === 'PLATFORM' ? 'purple' : r === 'NONE' ? 'gray' : 'brand'}>{t(`Roles.${r}`)}</Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {a.brandId ? (
                      <Link to={`/brands/${encodeURIComponent(a.brandId)}`} className="hover:text-brand">
                        {brandName.get(a.brandId) ?? '—'}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {r === 'BRAND_ADMIN' ? t('Admins.allSpots') : spotCount ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    {a.loginDisabled ? (
                      <Badge tone="red">{t('StaffStatus.disabled')}</Badge>
                    ) : (
                      <Badge tone="green">{t('StaffStatus.active')}</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {!self && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={state === 'sending' || state === 'saving'}
                          onClick={() => void run(a.id, 'sending', () => resendInvite({ variables: { userId: a.id } }))}
                        >
                          {state === 'sending' ? t('Common.sending') : state === 'sent' ? t('Common.codeSent') : t('Common.resendCode')}
                        </Button>
                        <Button
                          size="sm"
                          variant={a.loginDisabled ? 'primary' : 'secondary'}
                          disabled={state === 'sending' || state === 'saving'}
                          onClick={() =>
                            void run(a.id, 'saving', () =>
                              setDisabled({ variables: { userId: a.id, disabled: !a.loginDisabled } }),
                            )
                          }
                        >
                          {a.loginDisabled ? t('Staff.enableLogin') : t('Staff.disableLogin')}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
