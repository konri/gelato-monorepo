import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSpotOrders } from '@/hooks/useSpotOrders';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TODAY = new Date().toDateString();

export default function PreparedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
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
    <View className="flex-1 bg-gray-50" style={{ paddingTop: isWide ? 0 : insets.top }}>
      <View className="border-b border-gray-200 bg-white px-6 py-4">
        <ResponsiveContainer>
          <Typography variant={isWide ? 'heading-32-bold' : 'body-lg-bold'} className="text-text-primary">
            {t('Spot.preparedTitle')}
          </Typography>
        </ResponsiveContainer>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: (isWide ? 24 : TAB_BAR_TOTAL_HEIGHT) + 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
        }
      >
        <ResponsiveContainer>
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
              <Pressable
                key={o.id}
                onPress={() => router.push(`/order/${o.id}`)}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <Typography variant="body-base-bold" className="text-text-primary">
                    {t('Spot.orderNumber', { number: o.orderNumber })}
                  </Typography>
                  <View className="flex-row items-center">
                    <Typography variant="body-small-semibold" style={{ color: '#6B7280' }}>
                      {t(`OrderStatus.${o.status}`, { defaultValue: String(o.status) })}
                    </Typography>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
                  </View>
                </View>
                {!!o.customerName && (
                  <View className="mt-1 flex-row items-center">
                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                    <Typography variant="body-small-regular" className="ml-1.5 text-gray-600">
                      {o.customerName}
                    </Typography>
                  </View>
                )}
                {o.items?.length > 0 && (
                  <View className="mt-2 rounded-lg bg-gray-50 p-2.5">
                    {o.items.map((it) => (
                      <View key={it.id}>
                        <Typography variant="body-small-regular" className="text-text-primary">
                          {it.quantity}× {it.displayName ?? t('Spot.item')}
                        </Typography>
                        {!!it.boxTasteNames?.length && (
                          <Typography variant="body-very-small-medium" className="ml-4 text-gray-500">
                            {it.boxTasteNames.join(', ')}
                          </Typography>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                <Typography variant="body-small-regular" className="mt-2 text-gray-500">
                  {t('Spot.claimedBy', { name: o.preparedByName ?? '—' })}
                </Typography>
              </Pressable>
            ))}
          </View>
        )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}
