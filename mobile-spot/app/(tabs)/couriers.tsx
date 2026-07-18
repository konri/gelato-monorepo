import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { CourierEarnings } from '@/components/molecules/CourierEarnings';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRole } from '@/hooks/useRole';
import { getStoredSpotContext } from '@/hooks/useSpotOrders';
import {
  getSpotCouriers,
  getSpotCourierApplications,
  reviewCourierApplication,
  type SpotCourier,
  type SpotCourierApplication,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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

type Mode = 'list' | 'earnings';

export default function CouriersScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  const { isAdmin } = useRole();

  const [mode, setMode] = useState<Mode>('list');
  const [spotId, setSpotId] = useState<string | null>(null);
  const [couriers, setCouriers] = useState<SpotCourier[]>([]);
  const [applications, setApplications] = useState<SpotCourierApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState(false);

  const load = useCallback(async () => {
    const ctx = await getStoredSpotContext();
    setSpotId(ctx.spotId);
    if (!ctx.spotId) {
      setLoading(false);
      return;
    }
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const [c, a] = await Promise.all([
      getSpotCouriers(ctx.spotId, { token }),
      isAdmin ? getSpotCourierApplications(ctx.spotId, { token }) : Promise.resolve({ data: [] } as any),
    ]);
    setCouriers(c.data ?? []);
    setApplications(a.data ?? []);
    setLoading(false);
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const review = async (app: SpotCourierApplication, approved: boolean) => {
    setActionError(false);
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await reviewCourierApplication(app.id, approved, { token });
    if (res.error) setActionError(true);
    else await load();
  };

  const activeCount = couriers.filter((c) => c.activeHere).length;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: isWide ? 0 : insets.top }}>
      <View className="border-b border-gray-200 bg-white px-6 py-4">
        <ResponsiveContainer>
          <Typography variant={isWide ? 'heading-32-bold' : 'body-lg-bold'} className="text-text-primary">
            {t('Couriers.title')}
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
          {/* Admins get the earnings sub-tab */}
          {isAdmin && (
            <View className="mb-4 flex-row rounded-2xl bg-gray-100 p-1">
              {(['list', 'earnings'] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={{ backgroundColor: mode === m ? '#fff' : 'transparent' }}
                >
                  <Typography variant="body-small-bold" style={{ color: mode === m ? '#EC2828' : '#6B7280' }}>
                    {t(m === 'list' ? 'Couriers.tabList' : 'Couriers.tabEarnings')}
                  </Typography>
                </Pressable>
              ))}
            </View>
          )}

          {mode === 'earnings' && isAdmin && spotId ? (
            <CourierEarnings spotId={spotId} />
          ) : loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#EC2828" />
            </View>
          ) : (
            <>
              {actionError && (
                <View className="mb-3 rounded-xl bg-red-50 px-4 py-3">
                  <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>
                    {t('Couriers.actionError')}
                  </Typography>
                </View>
              )}

              {/* Pending applications (admin) */}
              {isAdmin && applications.length > 0 && (
                <View className="mb-6">
                  <Typography variant="body-small-bold" className="mb-2" style={{ color: '#EC2828', letterSpacing: 1 }}>
                    {t('Couriers.pending')}
                  </Typography>
                  <View className="gap-2">
                    {applications.map((app) => (
                      <View key={app.id} className="rounded-2xl bg-white p-4 shadow-sm">
                        <Typography variant="body-base-semibold" className="text-text-primary">
                          {app.courierName}
                        </Typography>
                        <Typography variant="body-small-regular" className="text-gray-500">
                          {t('Couriers.deliveries', { count: app.totalDeliveries })}
                          {app.courierPhone ? ` · ${app.courierPhone}` : ''}
                        </Typography>
                        <View className="mt-3 flex-row gap-2">
                          <Pressable
                            onPress={() => review(app, true)}
                            className="flex-1 items-center rounded-xl py-2.5"
                            style={{ backgroundColor: '#16A34A' }}
                          >
                            <Typography variant="body-small-bold" className="text-white">
                              {t('Couriers.accept')}
                            </Typography>
                          </Pressable>
                          <Pressable
                            onPress={() => review(app, false)}
                            className="flex-1 items-center rounded-xl border border-gray-300 py-2.5"
                          >
                            <Typography variant="body-small-bold" className="text-gray-700">
                              {t('Couriers.reject')}
                            </Typography>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Courier list */}
              <View className="mb-2 flex-row items-center justify-between">
                <Typography variant="body-small-bold" style={{ color: '#6B7280', letterSpacing: 1 }}>
                  {t('Couriers.tabList').toUpperCase()}
                </Typography>
                {activeCount > 0 && (
                  <View className="flex-row items-center rounded-full bg-green-50 px-2.5 py-1">
                    <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: '#16A34A' }} />
                    <Typography variant="body-very-small-medium" style={{ color: '#15803D' }}>
                      {activeCount} {t('Couriers.activeNow')}
                    </Typography>
                  </View>
                )}
              </View>

              {couriers.length === 0 ? (
                <View className="items-center px-8 py-12">
                  <Ionicons name="bicycle-outline" size={44} color="#9CA3AF" />
                  <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
                    {t('Couriers.noCouriers')}
                  </Typography>
                </View>
              ) : (
                <View className="gap-2">
                  {couriers.map((c) => (
                    <View key={c.courierId} className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm">
                      <View className="relative">
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                          <Ionicons name="person" size={20} color="#9CA3AF" />
                        </View>
                        <View
                          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: c.isOnline ? '#16A34A' : '#9CA3AF' }}
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Typography variant="body-base-semibold" className="text-text-primary">
                          {c.name}
                        </Typography>
                        <Typography variant="body-small-regular" className="text-gray-500">
                          {t('Couriers.deliveries', { count: c.totalDeliveries })}
                          {c.averageRating != null ? ` · ★ ${c.averageRating.toFixed(1)}` : ''}
                        </Typography>
                      </View>
                      {c.activeHere ? (
                        <View className="rounded-full bg-green-50 px-2.5 py-1">
                          <Typography variant="body-very-small-medium" style={{ color: '#15803D' }}>
                            {t('Couriers.activeNow')}
                          </Typography>
                        </View>
                      ) : (
                        <Typography variant="body-very-small-medium" className="text-gray-400">
                          {c.isOnline ? t('Couriers.online') : t('Couriers.offline')}
                        </Typography>
                      )}
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
