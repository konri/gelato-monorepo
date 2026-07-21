import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { useAuthState } from '@/hooks/useAuthState';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { getSpotUnreadCount } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// One tappable row in the More menu (matches the client settings look).
function MenuRow({
  icon,
  label,
  onPress,
  badge,
  tint = '#EC2828',
}: {
  icon: any;
  label: string;
  onPress: () => void;
  badge?: number;
  tint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
        {label}
      </Typography>
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

export default function MoreScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  const { isAdmin } = useRole();
  const { user } = useAuthState();
  const { data: me } = useWhoAmI();
  const { logout } = useAuth();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
        const res = await getSpotUnreadCount({ token });
        setUnread(res.data ?? 0);
      })();
    }, []),
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const displayName =
    [me?.firstName ?? user?.firstName, me?.surname ?? user?.surname].filter(Boolean).join(' ') ||
    user?.email;
  const avatar = me?.profilePicture ?? null;

  return (
    <View className="flex-1 bg-gray-50">
      <View
        className="border-b border-gray-200 bg-white px-6 pb-4"
        style={{ paddingTop: (isWide ? 0 : insets.top) + 16 }}
      >
        <ResponsiveContainer maxWidth={520}>
          <Typography
            variant={isWide ? 'heading-32-bold' : 'body-lg-bold'}
            className="text-text-primary"
          >
            {t('SpotTabs.more')}
          </Typography>
        </ResponsiveContainer>
      </View>

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
              <Typography variant="body-small-regular" className="text-gray-500">
                {user?.roles?.join(', ') || '—'}
              </Typography>
            </View>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="camera-outline" size={18} color="#212121" />
            </View>
          </Pressable>

          {/* Operations group */}
          <View className="mt-4 gap-3">
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
          </View>

          {/* Admin group */}
          {isAdmin && (
            <View className="mt-4 gap-3">
              <MenuRow icon="bar-chart-outline" label={t('Dashboard.title')} onPress={() => router.push('/dashboard')} />
              <MenuRow icon="storefront-outline" label={t('SpotDetails.title')} onPress={() => router.push('/spot-details')} />
              <MenuRow icon="chatbubble-ellipses-outline" label={t('Complaints.title')} onPress={() => router.push('/complaints')} />
              <MenuRow icon="newspaper-outline" label={t('News.title')} onPress={() => router.push('/news')} />
              <MenuRow icon="people-outline" label={t('Staff.title')} onPress={() => router.push('/staff')} />
              <MenuRow icon="time-outline" label={t('History.title')} onPress={() => router.push('/history')} />
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
    </View>
  );
}
