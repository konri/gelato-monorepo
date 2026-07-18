import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { useAuthState } from '@/hooks/useAuthState';
import { getSpotUnreadCount } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  const { isAdmin } = useRole();
  const { user } = useAuthState();
  const { logout } = useAuth();
  const [unread, setUnread] = useState(0);

  // Refresh the unread badge whenever this tab regains focus.
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

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: isWide ? 0 : insets.top }}>
      <View className="border-b border-gray-200 bg-white px-6 py-4">
        <ResponsiveContainer maxWidth={520}>
          <Typography variant={isWide ? 'heading-32-bold' : 'body-lg-bold'} className="text-text-primary">
            {t('Spot.profileTitle')}
          </Typography>
        </ResponsiveContainer>
      </View>

      <ResponsiveContainer maxWidth={520} className="p-6">
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-light" style={{ backgroundColor: '#FEF2F2' }}>
            <Ionicons name="person" size={36} color="#EC2828" />
          </View>
          <Typography variant="body-lg-bold" className="mt-3 text-text-primary">
            {user?.firstName || user?.email}
          </Typography>
          <Typography variant="body-small-regular" className="text-gray-500">
            {user?.email}
          </Typography>
        </View>

        <View className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <Typography variant="body-small-regular" className="text-gray-500">
            {t('Spot.role')}
          </Typography>
          <Typography variant="body-base-semibold" className="text-text-primary">
            {user?.roles?.join(', ') || '—'}
          </Typography>
        </View>

        {/* Notifications — all staff (incident alerts, etc.) */}
        <Pressable
          onPress={() => router.push('/notifications')}
          className="mt-4 flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
        >
          <Ionicons name="notifications-outline" size={20} color="#EC2828" />
          <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
            {t('Notifications.title')}
          </Typography>
          {unread > 0 && (
            <View
              className="mr-2 min-w-5 items-center justify-center rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: '#EC2828' }}
            >
              <Typography variant="body-very-small-medium" className="text-white">
                {unread > 99 ? '99+' : String(unread)}
              </Typography>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        {isAdmin && (
          <Pressable
            onPress={() => router.push('/dashboard')}
            className="mt-4 flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
          >
            <Ionicons name="bar-chart-outline" size={20} color="#EC2828" />
            <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
              {t('Dashboard.title')}
            </Typography>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        )}

        {isAdmin && (
          <Pressable
            onPress={() => router.push('/spot-details')}
            className="mt-4 flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
          >
            <Ionicons name="storefront-outline" size={20} color="#EC2828" />
            <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
              {t('SpotDetails.title')}
            </Typography>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        )}

        {isAdmin && (
          <Pressable
            onPress={() => router.push('/complaints')}
            className="mt-4 flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#EC2828" />
            <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
              {t('Complaints.title')}
            </Typography>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        )}

        {isAdmin && (
          <Pressable
            onPress={() => router.push('/news')}
            className="mt-4 flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
          >
            <Ionicons name="newspaper-outline" size={20} color="#EC2828" />
            <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
              {t('News.title')}
            </Typography>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        )}

        {isAdmin && (
          <Pressable
            onPress={() => router.push('/staff')}
            className="mt-4 flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
          >
            <Ionicons name="people-outline" size={20} color="#EC2828" />
            <Typography variant="body-base-semibold" className="ml-3 flex-1 text-text-primary">
              {t('Staff.title')}
            </Typography>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
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
    </View>
  );
}
