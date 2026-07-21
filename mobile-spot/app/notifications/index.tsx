import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import {
  getMySpotNotifications,
  markSpotNotificationRead,
  markAllSpotNotificationsRead,
  type SpotNotification,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { localizeNotification } from '@/utils/notificationDisplay';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

// Icon + tint per notification type.
function iconFor(type: string): { name: any; color: string; bg: string } {
  switch (type) {
    case 'DELIVERY_INCIDENT':
      return { name: 'alert-circle', color: '#DC2626', bg: '#FEE2E2' };
    case 'order':
      return { name: 'receipt', color: '#EC2828', bg: '#FEECEC' };
    default:
      return { name: 'notifications', color: '#6B7280', bg: '#F3F4F6' };
  }
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<SpotNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getMySpotNotifications({ token });
    setItems(res.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openItem = async (n: SpotNotification) => {
    if (!n.isRead) {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      await markSpotNotificationRead(n.id, { token });
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    // Open the detail screen (which offers a deep-link to the order).
    router.push(`/notification/${n.id}` as never);
  };

  const markAll = async () => {
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    await markAllSpotNotificationsRead({ token });
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  const timeAgo = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const hasUnread = items.some((i) => !i.isRead);

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title={t('Notifications.title')}
        backFallback="/(tabs)"
        right={
          hasUnread ? (
            <Pressable onPress={markAll} hitSlop={8}>
              <Typography variant="body-small-semibold" style={{ color: '#EC2828' }}>
                {t('Notifications.markAllRead')}
              </Typography>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EC2828" />}
      >
        <ResponsiveContainer maxWidth={640}>
          {loading ? (
            <View className="py-10 items-center"><ActivityIndicator color="#EC2828" /></View>
          ) : items.length === 0 ? (
            <View className="py-16 items-center">
              <Ionicons name="notifications-off-outline" size={40} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
                {t('Notifications.empty')}
              </Typography>
            </View>
          ) : (
            items.map((n) => {
              const ic = iconFor(n.type);
              const { title, body } = localizeNotification(t, n);
              return (
                <Pressable
                  key={n.id}
                  onPress={() => openItem(n)}
                  className="mb-2 flex-row rounded-2xl p-4"
                  style={{ backgroundColor: n.isRead ? '#fff' : '#FFF7F7' }}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: ic.bg }}
                  >
                    <Ionicons name={ic.name} size={20} color={ic.color} />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center">
                      <Typography variant="body-base-semibold" className="flex-1 text-text-primary">
                        {title}
                      </Typography>
                      {!n.isRead && (
                        <View className="ml-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#EC2828' }} />
                      )}
                    </View>
                    <Typography variant="body-small-regular" className="mt-0.5 text-gray-600">
                      {body}
                    </Typography>
                    {n.imageUrl ? (
                      <Image
                        source={{ uri: n.imageUrl }}
                        style={{ width: '100%', height: 140, borderRadius: 10, marginTop: 8 }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Typography variant="body-very-small-medium" className="mt-1 text-gray-400">
                      {timeAgo(n.createdAt)}
                    </Typography>
                  </View>
                </Pressable>
              );
            })
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}
