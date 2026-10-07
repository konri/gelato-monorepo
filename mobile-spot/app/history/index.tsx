import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { withSpotScope } from '@/components/hoc/withSpotScope';
import { AccessGuard } from '@/components/molecules/AccessGuard';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { useRole } from '@/hooks/useRole';
import { spotStore } from '@/stores/spotStore';
import { getSpotOrders, type SpotOrder } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';

// Orders that are no longer in the active queue → history.
const DONE_STATUSES = ['DELIVERED', 'COLLECTED', 'CANCELLED', 'FAILED', 'TERMINATED'];

type DayGroup = { key: string; label: string; orders: SpotOrder[] };

function OrderHistoryScreen() {
  const { t, i18n } = useTranslation();
  const { spotId } = useRole();

  const [orders, setOrders] = useState<SpotOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!spotId) {
      setLoading(false);
      return;
    }
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotOrders(spotId, null, { token });
    // Stale guard: the spot changed while loading.
    if (spotStore.getActiveSpotId() !== spotId) return;
    setOrders((res.data ?? []).filter((o) => DONE_STATUSES.includes(String(o.status))));
    setLoading(false);
  }, [spotId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  // Group by calendar day (newest first). Backend already returns createdAt desc.
  const groups = useMemo<DayGroup[]>(() => {
    const byDay = new Map<string, SpotOrder[]>();
    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(o);
    }
    const today = new Date();
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    return Array.from(byDay.entries()).map(([key, list]) => {
      const d = new Date(list[0].createdAt);
      let label: string;
      if (isSameDay(d, today)) label = t('History.today');
      else if (isSameDay(d, yesterday)) label = t('History.yesterday');
      else label = d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' });
      return { key, label, orders: list };
    });
  }, [orders, t, i18n.language]);

  const statusColor = (status: string) => {
    if (status === 'DELIVERED' || status === 'COLLECTED') return '#16A34A';
    if (status === 'CANCELLED' || status === 'FAILED' || status === 'TERMINATED') return '#DC2626';
    return '#6B7280';
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={t('History.title')} spotScoped />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
        }
      >
        <ResponsiveContainer maxWidth={680}>
          {loading ? (
            <View className="py-10 items-center"><ActivityIndicator color="#EC2828" /></View>
          ) : groups.length === 0 ? (
            <View className="items-center px-8 py-16">
              <Ionicons name="time-outline" size={44} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-4 text-center text-gray-500">
                {t('History.empty')}
              </Typography>
            </View>
          ) : (
            groups.map((g) => (
              <View key={g.key} className="mb-6">
                <Typography variant="body-small-bold" className="mb-2 ml-1 uppercase text-gray-500">
                  {g.label}
                </Typography>
                <View className="gap-2">
                  {g.orders.map((o) => (
                    <Pressable
                      key={o.id}
                      onPress={() => router.push(`/order/${o.id}` as never)}
                      className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <View className="flex-1">
                        <Typography variant="body-base-semibold" className="text-text-primary">
                          {t('Spot.orderNumber', { number: o.orderNumber })}
                        </Typography>
                        <Typography variant="body-small-regular" className="text-gray-500">
                          {new Date(o.createdAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                          {typeof o.total === 'number' ? ` · ${o.total.toFixed(2)} zł` : ''}
                        </Typography>
                      </View>
                      <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${statusColor(String(o.status))}1A` }}>
                        <Typography variant="body-very-small-medium" style={{ color: statusColor(String(o.status)) }}>
                          {t(`OrderStatus.${o.status}`, { defaultValue: String(o.status) })}
                        </Typography>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

function GuardedHistory() {
  return (
    <AccessGuard min="MANAGE_SPOT" messageKey="History.adminOnly">
      <OrderHistoryScreen />
    </AccessGuard>
  );
}

export default withSpotScope(GuardedHistory);
