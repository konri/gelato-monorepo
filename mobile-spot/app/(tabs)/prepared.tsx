import { Typography } from '@/components/atoms/Typography';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useSpotOrders } from '@/hooks/useSpotOrders';
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

const TODAY = new Date().toDateString();

export default function PreparedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // All orders; we show today's that this spot has moved past preparation.
  const { orders, loading, refetch } = useSpotOrders(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const prepared = orders.filter(
    (o) =>
      ['READY', 'COURIER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(
        String(o.status),
      ) &&
      o.claimedAt &&
      new Date(o.claimedAt).toDateString() === TODAY,
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="border-b border-gray-200 bg-white px-6 py-4">
        <Typography variant="body-lg-bold" className="text-text-primary">
          {t('Spot.preparedTitle')}
        </Typography>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
        }
      >
        {loading && orders.length === 0 ? (
          <View className="py-10 items-center">
            <ActivityIndicator color="#EC2828" />
          </View>
        ) : prepared.length === 0 ? (
          <View className="items-center px-8 py-16">
            <Ionicons name="checkmark-done-outline" size={48} color="#9CA3AF" />
            <Typography variant="body-base-regular" className="mt-4 text-center text-gray-500">
              {t('Spot.noPrepared')}
            </Typography>
          </View>
        ) : (
          <View className="gap-3">
            {prepared.map((o) => (
              <View key={o.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <Typography variant="body-base-bold" className="text-text-primary">
                    {t('Spot.orderNumber', { number: o.orderNumber })}
                  </Typography>
                  <Typography variant="body-small-semibold" style={{ color: '#6B7280' }}>
                    {String(o.status)}
                  </Typography>
                </View>
                <Typography variant="body-small-regular" className="mt-1 text-gray-500">
                  {t('Spot.claimedBy', { name: o.preparedByName ?? '—' })}
                </Typography>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
