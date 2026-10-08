import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { roleKeyFor } from '@/auth/levels';
import { withSpotScope } from '@/components/hoc/withSpotScope';
import { openSpotSwitcher } from '@/components/molecules/SpotSwitcher/SpotSwitcherSheet';
import { TabHeader } from '@/components/organisms/TabHeader';
import { config } from '@/config';
import { session } from '@/contexts/SessionProvider';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { useRole } from '@/hooks/useRole';
import { useAuthState } from '@/hooks/useAuthState';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { spotStore } from '@/stores/spotStore';
import { getSpotUnreadCount } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { LanguageSelectorModal } from '@/components/molecules/Settings/LanguageSelectorModal';

// One tappable row in the More menu (matches the client settings look).
function MenuRow({
  icon,
  label,
  onPress,
  badge,
  value,
  tint = '#EC2828',
}: {
  icon: any;
  label: string;
  onPress: () => void;
  badge?: number;
  /** Right-aligned value (e.g. the current spot's name). */
  value?: string | null;
  tint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
      style={{ minHeight: 56 }}
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
        {label}
      </Typography>
      {!!value && (
        <Typography
          variant="body-base-regular"
          className="mr-2 text-gray-600"
          numberOfLines={1}
          style={{ maxWidth: '50%' }}
        >
          {value}
        </Typography>
      )}
      {badge != null && badge > 0 && (
        <View
          className="mr-2 min-w-5 items-center justify-center rounded-full px-1.5 py-0.5"
          style={{ backgroundColor: '#EC2828' }}
        >
          <Typography variant="body-very-small-medium" className="text-white">
            {badge > 99 ? '99+' : String(badge)}
          </Typography>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

function MoreScreen() {
  const { t } = useTranslation();
  const { can, staffKind } = useRole();
  const { activeSpot, activeSpotId, brandName, canSwitch } = useActiveSpot();
  const { user } = useAuthState();
  const { data: me } = useWhoAmI();
  const [unread, setUnread] = useState(0);
  const [languageOpen, setLanguageOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!activeSpotId) return;
      (async () => {
        const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
        const res = await getSpotUnreadCount({ token, spotId: activeSpotId });
        if (spotStore.getActiveSpotId() !== activeSpotId) return;
        setUnread(res.data ?? 0);
      })();
    }, [activeSpotId]),
  );

  // Sign-out hygiene (push token, socket, spot context) lives in the session.
  const handleLogout = () => {
    void session.signOut();
  };

  const roleKey = roleKeyFor(staffKind);
  const roleLine = [roleKey ? t(roleKey) : null, brandName].filter(Boolean).join(' · ');
  const showBrandWeb = can.openBrandAdminWeb && !!config.ADMIN_WEB_URL;

  const displayName =
    [me?.firstName ?? user?.firstName, me?.surname ?? user?.surname].filter(Boolean).join(' ') ||
    user?.email;
  const avatar = me?.profilePicture ?? null;

  return (
    <View className="flex-1 bg-gray-50">
      <TabHeader title={t('SpotTabs.more')} maxWidth={520} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <ResponsiveContainer maxWidth={520}>
          {/* Account card — tap to edit profile / change photo. */}
          <Pressable
            onPress={() => router.push('/settings/edit-profile')}
            className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
            ) : (
              <View
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: '#FEF2F2' }}
              >
                <Ionicons name="person" size={26} color="#EC2828" />
              </View>
            )}
            <View className="ml-3 flex-1">
              <Typography variant="body-base-bold" className="text-text-primary" numberOfLines={1}>
                {displayName}
              </Typography>
              <Typography variant="body-small-regular" className="text-gray-600">
                {roleLine || '—'}
              </Typography>
            </View>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="camera-outline" size={18} color="#212121" />
            </View>
          </Pressable>

          {/* The spot this device works at (tap to switch when there are several). */}
          {activeSpot && (
            <View className="mt-4">
              {canSwitch ? (
                <MenuRow
                  icon="storefront-outline"
                  label={t('SpotSwitcher.current')}
                  value={activeSpot.name}
                  onPress={openSpotSwitcher}
                />
              ) : (
                <View
                  className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
                  style={{ minHeight: 56 }}
                >
                  <Ionicons name="storefront-outline" size={20} color="#EC2828" />
                  <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
                    {t('SpotSwitcher.current')}
                  </Typography>
                  <Typography variant="body-base-regular" className="text-gray-600" numberOfLines={1} style={{ maxWidth: '55%' }}>
                    {activeSpot.name}
                  </Typography>
                </View>
              )}
            </View>
          )}

          {/* Operations group */}
          <View className="mt-4 gap-3">
            <MenuRow
              icon="restaurant-outline"
              label={t('SpotTabs.menu')}
              onPress={() => router.push('/menu')}
            />
            <MenuRow
              icon="notifications-outline"
              label={t('Notifications.title')}
              badge={unread}
              onPress={() => router.push('/notifications')}
            />
            <MenuRow
              icon="close-circle-outline"
              label={t('SpotCanceled.title')}
              onPress={() => router.push('/canceled')}
            />
            <MenuRow
              icon="language-outline"
              label={t('Settings.language')}
              onPress={() => setLanguageOpen(true)}
            />
          </View>

          {/* Spot admin tools (level at the ACTIVE spot) */}
          {(can.viewDashboard || can.editSpotDetails || can.viewComplaints || can.postNews || can.manageStaff || can.viewHistory) && (
            <View className="mt-4 gap-3">
              {can.viewDashboard && (
                <MenuRow icon="bar-chart-outline" label={t('Dashboard.title')} onPress={() => router.push('/dashboard')} />
              )}
              {can.editSpotDetails && (
                <MenuRow icon="storefront-outline" label={t('SpotDetails.title')} onPress={() => router.push('/spot-details')} />
              )}
              {can.viewComplaints && (
                <MenuRow icon="chatbubble-ellipses-outline" label={t('Complaints.title')} onPress={() => router.push('/complaints')} />
              )}
              {can.postNews && (
                <MenuRow icon="newspaper-outline" label={t('News.title')} onPress={() => router.push('/news')} />
              )}
              {can.manageStaff && (
                <MenuRow icon="people-outline" label={t('Staff.title')} onPress={() => router.push('/staff')} />
              )}
              {can.viewHistory && (
                <MenuRow icon="time-outline" label={t('History.title')} onPress={() => router.push('/history')} />
              )}
            </View>
          )}

          {/* Brand setup lives in the admin web (D1). */}
          {showBrandWeb && (
            <View className="mt-6">
              <Typography variant="body-base-bold" className="mb-2 ml-1" style={{ color: '#4B5563', fontSize: 16 }}>
                {t('Brand.sectionTitle').toUpperCase()}
              </Typography>
              <MenuRow
                icon="open-outline"
                label={t('Brand.manageOnWeb')}
                onPress={() => Linking.openURL(config.ADMIN_WEB_URL).catch(() => {})}
              />
              <Typography variant="body-base-regular" className="ml-1 mt-2 text-gray-600">
                {t('Brand.manageOnWebHint')}
              </Typography>
            </View>
          )}

          <Pressable
            onPress={handleLogout}
            className="mt-6 items-center rounded-xl border border-gray-200 bg-white py-3.5"
          >
            <Typography variant="body-base-semibold" style={{ color: '#EC2828' }}>
              {t('Spot.signOut')}
            </Typography>
          </Pressable>
        </ResponsiveContainer>
      </ScrollView>

      <LanguageSelectorModal visible={languageOpen} onClose={() => setLanguageOpen(false)} />
    </View>
  );
}

export default withSpotScope(MoreScreen);
