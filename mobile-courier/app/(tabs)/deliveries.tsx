import { StarRating } from '@/components/atoms/StarRating';
import { Typography } from '@/components/atoms/Typography';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import {
  useCourierProfile,
  useMyDeliveryHistory,
} from '@/hooks/useCourierApplications';
import { CourierDelivery } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function HistoryCard({ delivery }: { delivery: CourierDelivery }) {
  const { t } = useTranslation();
  const date = delivery.deliveredAt
    ? new Date(delivery.deliveredAt).toLocaleDateString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Typography variant="body-base-bold" className="text-text-primary">
          {t('Courier.orderNumber', { number: delivery.orderNumber })}
        </Typography>
        <Typography variant="body-base-bold" className="text-primary">
          {delivery.total.toFixed(2)} zł
        </Typography>
      </View>

      <View className="flex-row items-center mt-2">
        <Ionicons name="storefront-outline" size={15} color="#6B7280" />
        <Typography variant="body-small-regular" className="text-gray-600 ml-2 flex-1">
          {delivery.spotName}
        </Typography>
      </View>

      {!!delivery.deliveryAddress && (
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={15} color="#6B7280" />
          <Typography variant="body-small-regular" className="text-gray-600 ml-2 flex-1">
            {delivery.deliveryAddress}
          </Typography>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <Typography variant="body-very-small-regular" className="text-gray-400">
          {t('Courier.historyDeliveredOn', { date })}
        </Typography>
        {delivery.courierRating ? (
          <StarRating rating={delivery.courierRating} size={14} />
        ) : (
          <Typography variant="body-very-small-regular" className="text-gray-400">
            {t('Courier.notRatedYet')}
          </Typography>
        )}
      </View>

      {!!delivery.reviewComment && (
        <View className="mt-2 bg-gray-50 rounded-xl p-3">
          <Typography variant="body-small-regular" className="text-gray-700 italic">
            “{delivery.reviewComment}”
          </Typography>
        </View>
      )}
    </View>
  );
}

export default function DeliveriesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: history, loading, refetch } = useMyDeliveryHistory();
  const { data: profile, refetch: refetchProfile } = useCourierProfile();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchProfile();
    }, [refetch, refetchProfile]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchProfile()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchProfile]);

  const items = history ?? [];

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="px-6 py-4 border-b border-gray-200 bg-white">
        <Typography variant="body-lg-bold" className="text-text-primary">
          {t('Courier.deliveriesTitle')}
        </Typography>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#EC2828"
            colors={['#EC2828']}
          />
        }
      >
        {/* Summary: total deliveries + average rating */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
            <Ionicons name="cube" size={22} color="#EC2828" />
            <Typography variant="body-2xl-bold" className="text-text-primary mt-1">
              {profile?.totalDeliveries ?? 0}
            </Typography>
            <Typography variant="body-very-small-regular" className="text-gray-500 text-center">
              {t('Courier.totalDeliveries')}
            </Typography>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
            <Ionicons name="star" size={22} color="#F59E0B" />
            <Typography variant="body-2xl-bold" className="text-text-primary mt-1">
              {profile?.averageRating ? profile.averageRating.toFixed(1) : '—'}
            </Typography>
            <Typography variant="body-very-small-regular" className="text-gray-500 text-center">
              {t('Courier.yourRating')}
            </Typography>
          </View>
        </View>

        {loading && items.length === 0 ? (
          <View className="py-10 items-center">
            <ActivityIndicator color="#EC2828" />
          </View>
        ) : items.length === 0 ? (
          <View className="items-center justify-center px-8 py-16">
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            <Typography
              variant="body-base-regular"
              className="text-gray-500 text-center mt-4"
            >
              {t('Courier.deliveriesEmpty')}
            </Typography>
          </View>
        ) : (
          <View className="gap-3">
            {items.map((d) => (
              <HistoryCard key={d.id} delivery={d} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
