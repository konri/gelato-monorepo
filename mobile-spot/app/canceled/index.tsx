import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { AttentionOrderCard } from '@/components/organisms/AttentionOrderCard';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { useSpotAttentionOrders } from '@/hooks/useSpotOrders';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';

export default function CanceledScreen() {
  const { t } = useTranslation();
  const { orders, loading, refetch } = useSpotAttentionOrders();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={t('SpotCanceled.title')} backFallback="/(tabs)" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EC2828" />}
      >
        <ResponsiveContainer maxWidth={640}>
          <Typography variant="body-small-regular" className="mb-4 text-gray-500">
            {t('SpotCanceled.subtitle')}
          </Typography>

          {loading && orders.length === 0 ? (
            <View className="py-10 items-center"><ActivityIndicator color="#EC2828" /></View>
          ) : orders.length === 0 ? (
            <View className="py-16 items-center">
              <Ionicons name="checkmark-circle-outline" size={44} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
                {t('SpotCanceled.empty')}
              </Typography>
            </View>
          ) : (
            <View className="gap-3">
              {orders.map((o) => (
                <AttentionOrderCard key={o.id} order={o} onChanged={refetch} />
              ))}
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}
