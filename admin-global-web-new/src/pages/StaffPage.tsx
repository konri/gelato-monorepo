import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import type { StaffActor } from '../auth/scope';
import { useBrandScope } from '../brand/BrandScope';
import {
  ADMIN_RESET_STAFF_PASSWORD,
  BRAND_STAFF,
  REMOVE_STAFF_MEMBER,
  RESEND_ADMIN_INVITE,
  SET_STAFF_LOGIN_DISABLED,
  type StaffMember,
} from '../graphql/staff';
import { BRAND_SPOTS, type AdminSpot } from '../graphql/spots';
import type { StaffKind } from '../lib/authApi';
import { evictRoot } from '../lib/cachePolicies';
import { errorText } from '../lib/errors';
import { SpotPicker } from '../components/SpotPicker';
import { StaffTable } from '../components/staff/StaffTable';
import { InviteStaffModal } from '../components/staff/InviteStaffModal';
import { StaffSpotsModal } from '../components/staff/StaffSpotsModal';
import { isSpotChange, type SpotChangeMode, type StaffMenuAction } from '../components/staff/staffActions';
import { PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { Input } from '../components/ui/Field';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FullPageSpinner } from '../components/ui/FullPageSpinner';

type Tab = 'ALL' | StaffKind;
const TABS: Tab[] = ['ALL', 'SPOT_ADMIN', 'EMPLOYEE', 'BRAND_ADMIN'];

function tabFrom(raw: string | null): Tab {
  return raw === 'SPOT_ADMIN' || raw === 'EMPLOYEE' || raw === 'BRAND_ADMIN' ? raw : 'ALL';
}

type Confirm = { member: StaffMember; action: 'reset' | 'disable' | 'remove' };

/**
 * Staff of the brand (BRANDS_SPEC §3.3). URL: ?kind=&spot=&q=&invite=1.
 * Tabs by role, a spot filter and search over brandStaff (filtered here),
 * row actions gated like the server's assertCanManageStaff, and the invite
 * dialog (opened by ?invite=1, with ?spot= preselected).
 */
export function StaffPage() {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { user } = useAuth();
  const { brandId, brand, brandActive, isPlatform, paths, refetch: refetchBrand } = useBrandScope();
  const [params, setParams] = useSearchParams();
  const tab = tabFrom(params.get('kind'));
  const spotFilter = params.get('spot') ?? '';
  const query = params.get('q') ?? '';
  const inviteOpen = params.get('invite') === '1';

  const staffQuery = useQuery<{ brandStaff: StaffMember[] }>(BRAND_STAFF, {
    variables: { brandId },
    fetchPolicy: 'cache-and-network',
  });
  const spotsQuery = useQuery<{ brandSpots: AdminSpot[] }>(BRAND_SPOTS, {
    variables: { brandId },
    fetchPolicy: 'cache-and-network',
  });
  const [resend] = useMutation(RESEND_ADMIN_INVITE);
  const [resetPassword] = useMutation(ADMIN_RESET_STAFF_PASSWORD);
  const [setDisabled] = useMutation(SET_STAFF_LOGIN_DISABLED);
  const [remove] = useMutation(REMOVE_STAFF_MEMBER, {
    update: (cache) => evictRoot(cache, ['brandStaff']),
  });

  const [spotChange, setSpotChange] = useState<{ member: StaffMember; mode: SpotChangeMode } | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const members = useMemo(() => staffQuery.data?.brandStaff ?? [], [staffQuery.data]);
  const spots = useMemo(() => spotsQuery.data?.brandSpots ?? [], [spotsQuery.data]);
  const spotNames = useMemo(() => new Map(spots.map((s) => [s.id, s.name])), [spots]);

  const actor: StaffActor = {
    userId: user?.id ?? '',
    scope: isPlatform ? 'PLATFORM' : 'BRAND_ADMIN',
    brandId: isPlatform ? null : brandId,
  };

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { ALL: members.length, SPOT_ADMIN: 0, EMPLOYEE: 0, BRAND_ADMIN: 0 };
    for (const m of members) if (m.kind) c[m.kind]++;
    return c;
  }, [members]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rank: Record<string, number> = { BRAND_ADMIN: 0, SPOT_ADMIN: 1, EMPLOYEE: 2 };
    return members
      .filter((m) => tab === 'ALL' || m.kind === tab)
      .filter((m) => !spotFilter || m.spotIds.includes(spotFilter))
      .filter((m) => !q || [m.name ?? '', m.email].some((f) => f.toLowerCase().includes(q)))
      .sort(
        (a, b) =>
          (rank[a.kind ?? ''] ?? 3) - (rank[b.kind ?? ''] ?? 3) ||
          (a.name || a.email).localeCompare(b.name || b.email),
      );
  }, [members, tab, spotFilter, query]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const who = (m: StaffMember) => m.name || m.email;

  const markDisabled = (userId: string, disabled: boolean) => {
    client.cache.modify({
      id: client.cache.identify({ __typename: 'StaffMember', id: userId }),
      fields: { loginDisabled: () => disabled },
    });
  };

  const onAction = async (member: StaffMember, action: StaffMenuAction) => {
    setNotice(null);
    setActionError(null);
    if (isSpotChange(action)) {
      setSpotChange({ member, mode: action });
      return;
    }
    if (action === 'reset' || action === 'disable' || action === 'remove') {
      setConfirmError(null);
      setConfirm({ member, action });
      return;
    }
    setRowBusy(member.id);
    try {
      if (action === 'resend') {
        await resend({ variables: { userId: member.id } });
        setNotice(t('Staff.resentNotice', { email: member.email }));
      } else if (action === 'enable') {
        await setDisabled({ variables: { userId: member.id, disabled: false } });
        markDisabled(member.id, false);
        setNotice(t('Staff.enabledNotice', { name: who(member) }));
      }
    } catch (err) {
      setActionError(errorText(err));
    } finally {
      setRowBusy(null);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { member, action } = confirm;
    setConfirmError(null);
    setConfirmBusy(true);
    try {
      if (action === 'reset') {
        await resetPassword({ variables: { userId: member.id } });
        setNotice(t('Staff.resetNotice', { email: member.email }));
      } else if (action === 'disable') {
        await setDisabled({ variables: { userId: member.id, disabled: true } });
        markDisabled(member.id, true);
        setNotice(t('Staff.disabledNotice', { name: who(member) }));
      } else {
        await remove({ variables: { userId: member.id } });
        void refetchBrand();
        setNotice(t('Staff.removedNotice', { name: who(member), brand: brand.name }));
      }
      setConfirm(null);
    } catch (err) {
      setConfirmError(errorText(err));
    } finally {
      setConfirmBusy(false);
    }
  };

  const canInvite = brandActive && spots.length > 0;
  const inviteBlockedReason = !brandActive
    ? t('Staff.inviteBlockedInactive')
    : spotsQuery.data && spots.length === 0
      ? t('Staff.inviteBlockedNoSpots')
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl p-6 sm:p-8">
      <PageHeader
        title={t('Staff.title')}
        subtitle={t('Staff.subtitle', { brand: brand.name })}
        actions={
          <Button
            disabled={!canInvite}
            title={inviteBlockedReason ?? undefined}
            onClick={() => setParam('invite', '1')}
          >
            {t('Staff.invite')}
          </Button>
        }
      />

      {inviteBlockedReason && (
        <Alert tone="warning" className="mb-4">
          {inviteBlockedReason}
        </Alert>
      )}
      {notice && (
        <Alert
          tone="success"
          className="mb-4"
          action={
            <button type="button" className="text-xs font-semibold underline" onClick={() => setNotice(null)}>
              {t('Common.close')}
            </button>
          }
        >
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mb-4">
          {actionError}
        </Alert>
      )}
      {staffQuery.error && (
        <Alert
          tone="error"
          className="mb-4"
          action={
            <Button size="sm" variant="secondary" onClick={() => void staffQuery.refetch()}>
              {t('Common.retry')}
            </Button>
          }
        >
          {errorText(staffQuery.error)}
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((k) => (
          <FilterChip key={k} active={tab === k} onClick={() => setParam('kind', k === 'ALL' ? null : k)} count={counts[k]}>
            {t(`Staff.tab_${k}`)}
          </FilterChip>
        ))}
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Input
          value={query}
          onChange={(e) => setParam('q', e.target.value || null)}
          placeholder={t('Staff.searchPlaceholder')}
          aria-label={t('Staff.searchPlaceholder')}
        />
        <SpotPicker
          spots={spots}
          value={spotFilter}
          onChange={(id) => setParam('spot', id || null)}
          allLabel={t('Staff.allSpotsFilter')}
        />
      </div>

      {tab === 'BRAND_ADMIN' && (
        <p className="mb-3 text-sm text-gray-500">
          {isPlatform ? (
            <>
              {t('Staff.brandAdminsHintPlatform')}{' '}
              <Link to={paths.home} className="font-semibold text-brand hover:underline">
                {t('Staff.openProfile')}
              </Link>
            </>
          ) : (
            t('Staff.brandAdminsHint')
          )}
        </p>
      )}
      {spotFilter && tab !== 'BRAND_ADMIN' && <p className="mb-3 text-xs text-gray-500">{t('Staff.spotFilterHint')}</p>}

      {staffQuery.loading && !staffQuery.data && <FullPageSpinner inline />}
      {staffQuery.data && members.length === 0 && (
        <EmptyState
          title={t('Staff.empty')}
          description={t('Staff.emptyHint')}
          action={canInvite ? <Button onClick={() => setParam('invite', '1')}>{t('Staff.invite')}</Button> : undefined}
        />
      )}
      {members.length > 0 && visible.length === 0 && <EmptyState title={t('Staff.noMatch')} />}
      {visible.length > 0 && (
        <StaffTable
          members={visible}
          actor={actor}
          spotNames={spotNames}
          busyId={rowBusy}
          onAction={(m, a) => void onAction(m, a)}
        />
      )}

      {inviteOpen && canInvite && (
        <InviteStaffModal
          brandId={brandId}
          brandName={brand.name}
          spots={spots}
          members={members}
          initialSpotId={spotFilter || null}
          onClose={() => setParam('invite', null)}
        />
      )}
      {spotChange && (
        <StaffSpotsModal
          member={spotChange.member}
          mode={spotChange.mode}
          spots={spots}
          onClose={() => setSpotChange(null)}
          onDone={setNotice}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={t(`Staff.confirmTitle_${confirm.action}`, { name: who(confirm.member) })}
          body={t(`Staff.confirmBody_${confirm.action}`, { brand: brand.name, email: confirm.member.email })}
          confirmLabel={t(`Staff.confirmLabel_${confirm.action}`)}
          tone={confirm.action === 'reset' ? 'default' : 'danger'}
          busy={confirmBusy}
          error={confirmError}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void runConfirm()}
        />
      )}
    </div>
  );
}
