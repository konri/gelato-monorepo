import { CustomSafeAreaView } from '@/components/CustomSafeAreaView';
import { HeaderWithBackButton } from '@/components/HeaderWithBackButton';
import { Typography } from '@/components/atoms/Typography';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { localizeNotification } from '@/utils/notificationDisplay';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
function iconFor(type: string): { name: keyof typeof Ionicons.glyphMap; color: string; bg: string } {
  switch (type) {
    case 'COURIER_APPROVED':
      return { name: 'checkmark-circle', color: '#16A34A', bg: '#DCFCE7' };
    case 'COURIER_REJECTED':
      return { name: 'close-circle', color: '#DC2626', bg: '#FEE2E2' };
    case 'DELIVERY_BROADCAST':
      return { name: 'bicycle', color: '#EC2828', bg: '#FEECEC' };
    case 'order_message':
      return { name: 'chatbubble-ellipses', color: '#2563EB', bg: '#DBEAFE' };
    default:
      return { name: 'notifications', color: '#6B7280', bg: '#F3F4F6' };
  }
}

export default function CourierNotificationsScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = (await safeGetItem('access_token')) ?? undefined;
    const res = await getMyNotifications({ token });
    setItems(res.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Refetch when a push arrives while this screen is mounted.
  useEffect(() => refreshEmitter.subscribe(() => void load()), [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openItem = async (n: AppNotification) => {
    if (!n.isRead) {
      const token = (await safeGetItem('access_token')) ?? undefined;
      await markNotificationRead({ notificationId: n.id, token });
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    router.push(`/notification/${n.id}` as never);
  };

  const markAll = async () => {
    const token = (await safeGetItem('access_token')) ?? undefined;
    await markAllNotificationsRead({ token });
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  const timeAgo = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const hasUnread = items.some((i) => !i.isRead);

  return (
    <CustomSafeAreaView>
      <HeaderWithBackButton title={t('Notifications.listTitle')} variant="card" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EC2828" />}
      >
        {hasUnread && (
          <Pressable onPress={markAll} hitSlop={8} className="mb-3 self-end">
            <Typography variant="body-small-semibold" style={{ color: '#EC2828' }}>
              {t('Notifications.markAllRead')}
            </Typography>
          </Pressable>
        )}

        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color="#EC2828" />
          </View>
        ) : items.length === 0 ? (
          <View className="py-16 items-center">
            <Ionicons name="notifications-off-outline" size={40} color="#9CA3AF" />
            <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
              {t('Notifications.noNotifications')}
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
      </ScrollView>
    </CustomSafeAreaView>
  );
}
