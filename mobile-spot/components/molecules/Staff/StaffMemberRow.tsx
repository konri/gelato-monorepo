import { Typography } from '@/components/atoms/Typography';
import type { BrandStaffMember } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Switch, View } from 'react-native';

const KIND_STYLE: Record<string, { bg: string; fg: string }> = {
  SPOT_ADMIN: { bg: '#FEECEC', fg: '#B91C1C' },
  EMPLOYEE: { bg: '#EEF2FF', fg: '#4338CA' },
  BRAND_ADMIN: { bg: '#FEF3C7', fg: '#92400E' },
};

/**
 * One member of the team (BRANDS_SPEC §4.7): name, "You", email, kind,
 * spots, a pending-invitation tag, the sign-in switch and the "…" menu.
 * Controls the caller may not use are hidden or disabled.
 */
export function StaffMemberRow({
  member,
  isSelf,
  showSpots,
  canToggleLogin,
  hasActions,
  busy,
  onToggleLogin,
  onOpenActions,
}: {
  member: BrandStaffMember;
  isSelf: boolean;
  showSpots: boolean;
  canToggleLogin: boolean;
  hasActions: boolean;
  busy?: boolean;
  onToggleLogin: () => void;
  onOpenActions: () => void;
}) {
  const { t } = useTranslation();
  const name = member.name?.trim() || member.email;
  const kind = member.kind ?? 'EMPLOYEE';
  const style = KIND_STYLE[kind] ?? KIND_STYLE.EMPLOYEE;

  return (
    <View className="mb-3 rounded-2xl bg-white p-4">
      <View className="flex-row items-start">
        <View className="flex-1 pr-2">
          <View className="flex-row flex-wrap items-center">
            <Typography variant="body-base-bold" className="mr-2 text-text-primary">
              {name}
            </Typography>
            {isSelf && (
              <View className="mr-2 rounded-full bg-gray-900 px-2 py-0.5">
                <Typography variant="body-small-semibold" className="text-white">
                  {t('Staff.you')}
                </Typography>
              </View>
            )}
          </View>
          <Typography variant="body-small-regular" className="text-gray-600">
            {member.email}
          </Typography>
        </View>
        {hasActions && (
          <Pressable
            onPress={onOpenActions}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t('Staff.actionsA11y', { name })}
            className="h-12 w-12 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="ellipsis-horizontal" size={22} color="#212121" />
          </Pressable>
        )}
      </View>

      <View className="mt-2 flex-row flex-wrap items-center gap-2">
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: style.bg }}>
          <Typography variant="body-small-semibold" style={{ color: style.fg }}>
            {t(`Roles.${kind}`)}
          </Typography>
        </View>
        {member.invitePending && (
          <View className="flex-row items-center rounded-full bg-amber-50 px-3 py-1">
            <Ionicons name="mail-outline" size={14} color="#92400E" />
            <Typography variant="body-small-semibold" className="ml-1" style={{ color: '#92400E' }}>
              {t('Staff.invitePending')}
            </Typography>
          </View>
        )}
        {showSpots &&
          member.spots.map((s) => (
            <View key={s.id} className="flex-row items-center rounded-full bg-gray-100 px-3 py-1">
              <Ionicons name="storefront-outline" size={14} color="#374151" />
              <Typography variant="body-small-semibold" className="ml-1 text-gray-700">
                {s.name}
              </Typography>
            </View>
          ))}
      </View>

      <View className="mt-3 flex-row items-center" style={{ minHeight: 44 }}>
        <Switch
          value={!member.loginDisabled}
          onValueChange={onToggleLogin}
          disabled={busy || !canToggleLogin}
          accessibilityLabel={t('Staff.loginToggleA11y', { name })}
          trackColor={{ true: '#EC2828', false: '#D1D5DB' }}
          thumbColor="#fff"
        />
        <Typography variant="body-small-regular" className="ml-2 text-gray-700">
          {t(member.loginDisabled ? 'Staff.loginDisabled' : 'Staff.loginEnabled')}
        </Typography>
      </View>
    </View>
  );
}
