import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, View } from 'react-native';
import { t } from 'i18next';
import { Ionicons } from '@expo/vector-icons';
import { CustomSafeAreaView } from '@/components/CustomSafeAreaView';
import { HeaderWithBackButton } from '@/components/HeaderWithBackButton';
import { Typography } from '@/components/atoms/Typography';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { markNotificationRead, AppNotification } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';

// Map a notification's `type` (backend FCMService.NotificationType) to a
// bell-list icon. Unknown/new types fall back to a generic bell below.
const typeIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  ORDER_PLACED: 'receipt-outline',
  ORDER_CONFIRMED: 'checkmark-circle-outline',
  ORDER_PREPARING: 'time-outline',
  ORDER_READY: 'bag-check-outline',
  ORDER_PICKED_UP: 'bicycle-outline',
  ORDER_OUT_FOR_DELIVERY: 'bicycle-outline',
  ORDER_DELIVERED: 'checkmark-done-outline',
  ORDER_CANCELLED: 'close-circle-outline',
  COURIER_ASSIGNED: 'person-outline',
  COURIER_NEARBY: 'navigate-outline',
  POINTS_EARNED: 'star-outline',
  POINTS_REDEEMED: 'star-outline',
  PRIZE_AVAILABLE: 'gift-outline',
  QUEST_COMPLETED: 'trophy-outline',
  NEWS_PUBLISHED: 'newspaper-outline',
  SPOT_ANNOUNCEMENT: 'megaphone-outline',
  REFERRAL_REWARD: 'people-outline',
};

export default function NotificationCenterScreen() {
  const { data, loading, refetch } = useNotificationsList();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mirror fetched data into local state so taps can flip isRead optimistically.
  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePress = async (notification: AppNotification) => {
    if (notification.isRead) return;

    // Optimistically mark as read; revert if the backend call fails.
    setItems((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    );

    const token = await safeGetItem('access_token');
    const result = await markNotificationRead({
      notificationId: notification.id,
      token: token ?? undefined,
    });

    if (!result.success) {
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: false } : n)),
      );
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      onPress={() => handlePress(item)}
      className={`flex-row items-start mx-4 mb-2 px-4 py-4 rounded-2xl ${
        item.isRead ? 'bg-white' : 'bg-amber-50'
      }`}
    >
      <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center mr-3">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-11 h-11 rounded-full" />
        ) : (
          <Ionicons name={typeIcon[item.type] ?? 'notifications-outline'} size={22} color="#EC2828" />
        )}
      </View>

      <View className="flex-1">
        <Typography
          variant={item.isRead ? 'body-base-semibold' : 'body-base-bold'}
          className="text-text-primary"
        >
          {item.title}
        </Typography>
        <Typography variant="body-small-regular" className="text-gray-600 mt-1">
          {item.body}
        </Typography>
        <Typography variant="body-very-small-regular" className="text-gray-400 mt-1">
          {new Date(item.createdAt).toLocaleDateString()}
        </Typography>
      </View>

      {!item.isRead && <View className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 ml-2" />}
    </Pressable>
  );

  return (
    <CustomSafeAreaView>
      <HeaderWithBackButton title={t('Notifications.title')} variant="card" />

      {loading && items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#EC2828" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#EC2828"
              colors={['#EC2828']}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6 py-20">
              <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="text-gray-500 text-center mt-4">
                {t('Notifications.noNotifications')}
              </Typography>
            </View>
          }
        />
      )}
    </CustomSafeAreaView>
  );
}
