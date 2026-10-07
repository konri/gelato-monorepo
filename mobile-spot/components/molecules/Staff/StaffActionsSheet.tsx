import { Typography } from '@/components/atoms/Typography';
import { SpotMultiSelect, type SpotOption } from '@/components/molecules/Staff/SpotMultiSelect';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { messageForError } from '@/utils/errorCodes';
import {
  adminResetStaffPassword,
  changeStaffKind,
  moveEmployee,
  removeStaffMember,
  resendStaffInvite,
  setSpotAdminSpots,
  type BrandStaffMember,
  type GraphQLResult,
} from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SpotAction = 'changeSpots' | 'move' | 'makeSpotAdmin' | 'makeEmployee';
type ConfirmAction = 'remove' | 'reset' | 'resend';
type View_ = { kind: 'menu' } | { kind: 'spots'; action: SpotAction } | { kind: 'confirm'; action: ConfirmAction };

type Props = {
  member: BrandStaffMember | null;
  /** Reset, resend, move (employees), remove. */
  canManage: boolean;
  /** Assign a spot admin's spots, change the kind (brand admin / Loodly team). */
  canAssign: boolean;
  /** Spots an employee can be moved to / placed at. */
  employeeSpots: SpotOption[];
  /** Spots a spot admin can be given. */
  adminSpots: SpotOption[];
  onClose: () => void;
  /** After a successful change: the notice to show and a reload. */
  onChanged: (notice: string) => void;
};

/**
 * The "…" menu of a team member (BRANDS_SPEC §4.7). Only allowed actions are
 * listed: reset password, resend the invitation, change spots, move an
 * employee, make spot admin / make employee, remove (with a confirm step).
 */
export function StaffActionsSheet({
  member,
  canManage,
  canAssign,
  employeeSpots,
  adminSpots,
  onClose,
  onChanged,
}: Props) {
  const { t } = useTranslation();
  const { isWide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<View_>({ kind: 'menu' });
  const [spotIds, setSpotIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A new member (or a closed sheet) starts at the menu.
  useEffect(() => {
    setView({ kind: 'menu' });
    setError(null);
    setBusy(false);
  }, [member?.id]);

  if (!member) return null;

  const name = member.name?.trim() || member.email;
  const isEmployee = member.kind === 'EMPLOYEE';
  const isSpotAdmin = member.kind === 'SPOT_ADMIN';
  const currentSpotId = member.spotIds[0] ?? null;
  const moveTargets = employeeSpots.filter((s) => s.id !== currentSpotId);

  const openSpots = (action: SpotAction) => {
    setError(null);
    if (action === 'changeSpots') setSpotIds(member.spotIds);
    else if (action === 'move') setSpotIds(moveTargets[0] ? [moveTargets[0].id] : []);
    else if (action === 'makeSpotAdmin') setSpotIds(member.spotIds.filter((id) => adminSpots.some((s) => s.id === id)));
    else {
      const keep = member.spotIds.find((id) => employeeSpots.some((s) => s.id === id));
      setSpotIds(keep ? [keep] : employeeSpots[0] ? [employeeSpots[0].id] : []);
    }
    setView({ kind: 'spots', action });
  };

  const run = async (call: () => Promise<GraphQLResult<unknown>>, notice: string) => {
    setBusy(true);
    setError(null);
    const res = await call();
    setBusy(false);
    if (res.error) {
      setError(messageForError(res.error, t('Staff.updateError')));
      return;
    }
    onChanged(notice);
  };

  const spotName = (id: string) =>
    [...employeeSpots, ...adminSpots].find((s) => s.id === id)?.name ?? '';

  const saveSpots = (action: SpotAction) => {
    if (spotIds.length === 0) {
      setError(t('Staff.spotsRequired'));
      return;
    }
    const opts = { silent: true };
    switch (action) {
      case 'changeSpots':
        return run(() => setSpotAdminSpots(member.id, spotIds, opts), t('Staff.spotsUpdated', { name }));
      case 'move':
        return run(() => moveEmployee(member.id, spotIds[0], opts), t('Staff.moved', { name, spot: spotName(spotIds[0]) }));
      case 'makeSpotAdmin':
        return run(
          () => changeStaffKind(member.id, 'SPOT_ADMIN', spotIds, opts),
          t('Staff.kindChanged', { name, role: t('Roles.SPOT_ADMIN') }),
        );
      case 'makeEmployee':
        return run(
          () => changeStaffKind(member.id, 'EMPLOYEE', spotIds.slice(0, 1), opts),
          t('Staff.kindChanged', { name, role: t('Roles.EMPLOYEE') }),
        );
    }
  };

  const confirm = (action: ConfirmAction) => {
    const opts = { silent: true };
    if (action === 'remove') return run(() => removeStaffMember(member.id, opts), t('Staff.removed', { name }));
    if (action === 'reset') {
      return run(() => adminResetStaffPassword(member.id, opts), t('Staff.passwordResetSent', { email: member.email }));
    }
    return run(() => resendStaffInvite(member.id, opts), t('Staff.inviteResent', { email: member.email }));
  };

  const actions: { key: string; icon: string; label: string; destructive?: boolean; onPress: () => void }[] = [];
  if (canManage && member.invitePending) {
    actions.push({ key: 'resend', icon: 'mail-outline', label: t('Staff.resendInvite'), onPress: () => setView({ kind: 'confirm', action: 'resend' }) });
  }
  if (canManage) {
    actions.push({ key: 'reset', icon: 'key-outline', label: t('Staff.resetPassword'), onPress: () => setView({ kind: 'confirm', action: 'reset' }) });
  }
  if (canAssign && isSpotAdmin) {
    actions.push({ key: 'spots', icon: 'storefront-outline', label: t('Staff.changeSpots'), onPress: () => openSpots('changeSpots') });
  }
  if (canManage && isEmployee && moveTargets.length > 0) {
    actions.push({ key: 'move', icon: 'swap-horizontal', label: t('Staff.moveEmployee'), onPress: () => openSpots('move') });
  }
  if (canAssign && isEmployee && adminSpots.length > 0) {
    actions.push({ key: 'promote', icon: 'arrow-up-circle-outline', label: t('Staff.makeSpotAdmin'), onPress: () => openSpots('makeSpotAdmin') });
  }
  if (canAssign && isSpotAdmin && employeeSpots.length > 0) {
    actions.push({ key: 'demote', icon: 'arrow-down-circle-outline', label: t('Staff.makeEmployee'), onPress: () => openSpots('makeEmployee') });
  }
  if (canManage) {
    actions.push({
      key: 'remove',
      icon: 'person-remove-outline',
      label: t('Staff.remove'),
      destructive: true,
      onPress: () => setView({ kind: 'confirm', action: 'remove' }),
    });
  }

  const errorBox = error ? (
    <View className="mt-3 rounded-xl bg-red-50 px-4 py-3" accessibilityRole="alert">
      <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
        {error}
      </Typography>
    </View>
  ) : null;

  const footer = (primary: { label: string; onPress: () => void; destructive?: boolean }) => (
    <View className="mt-4 flex-row gap-3">
      <Pressable
        onPress={() => {
          setError(null);
          setView({ kind: 'menu' });
        }}
        disabled={busy}
        accessibilityRole="button"
        className="flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white"
        style={{ minHeight: 56 }}
      >
        <Typography variant="body-base-bold" className="text-gray-700">
          {t('Staff.cancel')}
        </Typography>
      </Pressable>
      <Pressable
        onPress={primary.onPress}
        disabled={busy}
        accessibilityRole="button"
        className="flex-1 items-center justify-center rounded-xl"
        style={{ minHeight: 56, backgroundColor: busy ? '#F4A3A3' : primary.destructive ? '#B91C1C' : '#EC2828' }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Typography variant="body-base-bold" className="text-white">
            {primary.label}
          </Typography>
        )}
      </Pressable>
    </View>
  );

  let content: ReactNode;
  if (view.kind === 'menu') {
    content = (
      <>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            onPress={a.onPress}
            accessibilityRole="button"
            className="mb-2 flex-row items-center rounded-xl bg-gray-50 px-4"
            style={{ minHeight: 56 }}
          >
            <Ionicons name={a.icon as never} size={22} color={a.destructive ? '#B91C1C' : '#374151'} />
            <Typography
              variant="body-base-semibold"
              className="ml-3 flex-1"
              style={{ color: a.destructive ? '#B91C1C' : '#212121' }}
            >
              {a.label}
            </Typography>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </Pressable>
        ))}
      </>
    );
  } else if (view.kind === 'spots') {
    const { action } = view;
    const single = action === 'move' || action === 'makeEmployee';
    const options = action === 'move' ? moveTargets : single ? employeeSpots : adminSpots;
    content = (
      <>
        <Typography variant="body-base-semibold" className="mb-1 text-text-primary">
          {t(
            action === 'changeSpots'
              ? 'Staff.changeSpots'
              : action === 'move'
                ? 'Staff.moveEmployee'
                : action === 'makeSpotAdmin'
                  ? 'Staff.makeSpotAdmin'
                  : 'Staff.makeEmployee',
          )}
        </Typography>
        <Typography variant="body-small-regular" className="mb-3 text-gray-600">
          {t(single ? 'Staff.pickSpotHint' : 'Staff.pickSpotsHint')}
          {action === 'makeSpotAdmin' || action === 'makeEmployee' || action === 'move' ? ` ${t('Staff.signOutNote')}` : ''}
        </Typography>
        <SpotMultiSelect options={options} mode={single ? 'single' : 'multi'} selected={spotIds} onChange={setSpotIds} disabled={busy} />
        {errorBox}
        {footer({ label: t('Staff.save'), onPress: () => void saveSpots(action) })}
      </>
    );
  } else {
    const { action } = view;
    const message =
      action === 'remove'
        ? t('Staff.removeConfirm', { name })
        : action === 'reset'
          ? t('Staff.resetConfirm', { email: member.email })
          : t('Staff.resendConfirm', { email: member.email });
    const label = action === 'remove' ? t('Staff.removeCta') : action === 'reset' ? t('Staff.resetSendCta') : t('Staff.resendInvite');
    content = (
      <>
        <Typography variant="body-base-regular" className="text-gray-700">
          {message}
        </Typography>
        {errorBox}
        {footer({ label, onPress: () => void confirm(action), destructive: action === 'remove' })}
      </>
    );
  }

  const header = (
    <View className="mb-3 flex-row items-center">
      <View className="flex-1 pr-2">
        <Typography variant="body-xl-bold" className="text-text-primary" accessibilityRole="header" numberOfLines={1}>
          {name}
        </Typography>
        <Typography variant="body-small-regular" className="text-gray-600" numberOfLines={1}>
          {member.email}
        </Typography>
      </View>
      <Pressable
        onPress={busy ? undefined : onClose}
        accessibilityRole="button"
        accessibilityLabel={t('Staff.close')}
        className="h-12 w-12 items-center justify-center rounded-full bg-gray-100"
      >
        <Ionicons name="close" size={24} color="#212121" />
      </Pressable>
    </View>
  );

  const body = (
    <ScrollView keyboardShouldPersistTaps="handled">
      {header}
      {content}
    </ScrollView>
  );

  if (isWide) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 p-6" onPress={busy ? undefined : onClose}>
          <Pressable
            className="w-full rounded-3xl bg-white p-5"
            style={{ maxWidth: 520, maxHeight: '85%' }}
            onPress={(e) => e.stopPropagation()}
          >
            {body}
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={busy ? undefined : onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={busy ? undefined : onClose} accessibilityLabel={t('Staff.close')} />
        <View className="rounded-t-3xl bg-white px-4 pt-4" style={{ maxHeight: '85%', paddingBottom: insets.bottom + 16 }}>
          {body}
        </View>
      </View>
    </Modal>
  );
}
