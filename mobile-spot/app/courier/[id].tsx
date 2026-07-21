import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { getStoredSpotContext } from '@/hooks/useSpotOrders';
import {
  getSpotCouriers,
  getSpotCourierDeliveries,
  type SpotCourier,
  type SpotCourierDelivery,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, View } from 'react-native';

export default function CourierDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [courier, setCourier] = useState<SpotCourier | null>(null);
  const [deliveries, setDeliveries] = useState<SpotCourierDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const ctx = await getStoredSpotContext();
    if (!ctx.spotId) {
      setLoading(false);
      return;
    }
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const [couriersRes, deliveriesRes] = await Promise.all([
      getSpotCouriers(ctx.spotId, { token }),
      getSpotCourierDeliveries(ctx.spotId, id, 50, { token }),
    ]);
    setCourier((couriersRes.data ?? []).find((c) => c.courierId === id) ?? null);
    setDeliveries(deliveriesRes.data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const fullName =
    courier &&
    ([courier.firstName, courier.surname].filter(Boolean).join(' ') || courier.name);
  const phone = courier?.phone?.trim();

  const fmt = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={t('Couriers.detailTitle')} backFallback="/(tabs)/couriers" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <ResponsiveContainer maxWidth={640}>
          {loading ? (
            <View className="py-10 items-center"><ActivityIndicator color="#EC2828" /></View>
          ) : !courier ? (
            <View className="py-16 items-center">
              <Ionicons name="person-outline" size={40} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
                {t('Couriers.noCouriers')}
              </Typography>
            </View>
          ) : (
            <>
              {/* Identity card */}
              <View className="items-center rounded-2xl bg-white p-6 shadow-sm">
                <View className="relative">
                  {courier.photo ? (
                    <Image
                      source={{ uri: courier.photo }}
                      style={{ width: 96, height: 96, borderRadius: 48 }}
                    />
                  ) : (
                    <View className="h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                      <Ionicons name="person" size={44} color="#9CA3AF" />
                    </View>
                  )}
                  <View
                    className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: courier.isOnline ? '#16A34A' : '#9CA3AF' }}
                  />
                </View>
                <Typography variant="body-lg-bold" className="mt-3 text-center text-text-primary">
                  {fullName}
                </Typography>
                {!!courier.email && (
                  <Typography variant="body-small-regular" className="mt-0.5 text-gray-500">
                    {courier.email}
                  </Typography>
                )}

                {/* Stats */}
                <View className="mt-4 flex-row gap-3">
                  <View className="items-center rounded-xl bg-gray-50 px-5 py-3">
                    <Typography variant="body-lg-bold" className="text-text-primary">
                      {courier.totalDeliveries}
                    </Typography>
                    <Typography variant="body-very-small-medium" className="text-gray-500">
                      {t('Couriers.totalDeliveriesLabel')}
                    </Typography>
                  </View>
                  {courier.averageRating != null && (
                    <View className="items-center rounded-xl bg-gray-50 px-5 py-3">
                      <Typography variant="body-lg-bold" className="text-text-primary">
                        ★ {courier.averageRating.toFixed(1)}
                      </Typography>
                      <Typography variant="body-very-small-medium" className="text-gray-500">
                        {t('Couriers.ratingLabel')}
                      </Typography>
                    </View>
                  )}
                </View>

                {/* Call */}
                <Pressable
                  onPress={() => phone && Linking.openURL(`tel:${phone}`)}
                  disabled={!phone}
                  className="mt-4 w-full flex-row items-center justify-center rounded-xl py-3"
                  style={{ backgroundColor: phone ? '#EC2828' : '#E5E7EB' }}
                >
                  <Ionicons name="call-outline" size={18} color={phone ? '#fff' : '#9CA3AF'} />
                  <Typography
                    variant="body-base-semibold"
                    className="ml-2"
                    style={{ color: phone ? '#fff' : '#9CA3AF' }}
                  >
                    {phone ? t('Couriers.call') : t('Couriers.noPhone')}
                  </Typography>
                </Pressable>
              </View>

              {/* Delivery history */}
              <Typography variant="body-base-bold" className="mb-2 mt-6 text-text-primary">
                {t('Couriers.deliveryHistory')}
              </Typography>
              {deliveries.length === 0 ? (
                <View className="rounded-2xl bg-white p-6 items-center shadow-sm">
                  <Typography variant="body-small-regular" className="text-gray-500">
                    {t('Couriers.noDeliveries')}
                  </Typography>
                </View>
              ) : (
                <View className="gap-2">
                  {deliveries.map((d) => (
                    <View key={d.id} className="rounded-2xl bg-white p-4 shadow-sm">
                      <View className="flex-row items-center justify-between">
                        <Typography variant="body-base-semibold" className="text-text-primary">
                          {t('Spot.orderNumber', { number: d.orderNumber })}
                        </Typography>
                        <Typography variant="body-small-semibold" style={{ color: '#6B7280' }}>
                          {t(`OrderStatus.${d.status}`, { defaultValue: d.status })}
                        </Typography>
                      </View>
                      <View className="mt-1 flex-row items-center justify-between">
                        <Typography variant="body-small-regular" className="text-gray-500">
                          {fmt(d.deliveredAt ?? d.createdAt)}
                        </Typography>
                        <Typography variant="body-small-regular" className="text-gray-500">
                          {d.total.toFixed(2)} zł
                        </Typography>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}
