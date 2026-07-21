import Logo from '@/assets/images/logo.svg';
import { Typography } from '@/components/atoms/Typography';
import { SpotOrderCard } from '@/components/molecules/SpotOrderCard';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSpotOrderSubscription } from '@/hooks/useSpotOrderSubscription';
import {
  advanceOrderStatus,
  claimOrder,
  getStoredSpotContext,
  useSpotOrders,
} from '@/hooks/useSpotOrders';
import { getSpotUnreadCount } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SpotOrdersScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  // Active orders = anything not yet ready/delivered. We fetch all and filter.
  const { orders, loading, refetch, setOrders } = useSpotOrders(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const hasNew = useRef(false);

  useEffect(() => {
    void getStoredSpotContext().then((c) => setUserId(c.userId));
  }, []);

  const loadUnread = useCallback(async () => {
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotUnreadCount({ token });
    setUnread(res.data ?? 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void loadUnread();
    }, [refetch, loadUnread]),
  );

  // Live: a new order arrives → refetch so it appears; a claim → refetch so it
  // moves/disappears for everyone else.
  useSpotOrderSubscription(true, {
    onNewOrder: () => {
      hasNew.current = true;
      void refetch();
    },
    onOrderClaimed: () => {
      void refetch();
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleClaim = async (id: string) => {
    const res = await claimOrder(id);
    if (res.error) {
      const taken = res.error.message?.toLowerCase().includes('already');
      Alert.alert(t('Spot.newOrderBanner'), taken ? t('Spot.alreadyClaimed') : res.error.message);
    }
    await refetch();
  };

  const handleMarkReady = async (id: string) => {
    await advanceOrderStatus(id, 'READY');
    // Optimistically drop it from the active list.
    setOrders((prev) => prev.filter((o) => o.id !== id));
    await refetch();
  };

  // Active queue: pending (need claiming) + preparing (in progress).
  const pending = orders.filter((o) => o.status === 'PENDING');
  const preparing = orders.filter((o) => o.status === 'PREPARING');
  // Empty state is about the ACTIVE queue, not the raw fetch — otherwise a spot
  // whose orders are all READY/on-the-way rendered a blank page (looked broken).
  const noActive = pending.length === 0 && preparing.length === 0;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: isWide ? 0 : insets.top }}>
      <View className="border-b border-gray-200 bg-white px-6 py-4">
        <ResponsiveContainer>
          <View className="flex-row items-center justify-between">
            {/* Logo hidden on wide layout — the sidebar already shows the brand. */}
            {isWide ? (
              <Typography variant="heading-32-bold" className="text-text-primary">
                {t('SpotTabs.orders')}
              </Typography>
            ) : (
              <View className="flex-row items-center">
                <Logo width={30} height={30} />
                <View className="ml-2">
                  <Typography variant="body-lg-bold" className="text-text-primary leading-5">
                    Gelato
                  </Typography>
                  <Typography variant="body-very-small-medium" style={{ color: '#EC2828', letterSpacing: 2 }}>
                    SPOT
                  </Typography>
                </View>
              </View>
            )}
            <View className="flex-row items-center gap-3">
              {pending.length > 0 && (
                <View className="flex-row items-center rounded-full px-3 py-1" style={{ backgroundColor: '#EC2828' }}>
                  <Ionicons name="cart" size={14} color="#fff" />
                  <Typography variant="body-small-bold" className="ml-1 text-white">
                    {pending.length}
                  </Typography>
                </View>
              )}
              {/* Bell → notification center, with unread badge. */}
              <Pressable onPress={() => router.push('/notifications')} hitSlop={8} className="relative">
                <Ionicons name="notifications-outline" size={24} color="#212121" />
                {unread > 0 && (
                  <View
                    className="absolute -right-1.5 -top-1.5 min-w-4 items-center justify-center rounded-full px-1"
                    style={{ backgroundColor: '#EC2828' }}
                  >
                    <Typography variant="body-very-small-medium" className="text-white" style={{ fontSize: 10 }}>
                      {unread > 9 ? '9+' : String(unread)}
                    </Typography>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
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
        ) : noActive ? (
          <View className="items-center px-8 py-16">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
              <Ionicons name="ice-cream-outline" size={40} color="#EC2828" />
            </View>
            <Typography variant="body-lg-bold" className="mt-5 text-center text-text-primary">
              {t('Spot.noOrdersTitle')}
            </Typography>
            <Typography variant="body-base-regular" className="mt-2 text-center text-gray-500">
              {t('Spot.noOrdersBody')}
            </Typography>
          </View>
        ) : (
          <>
            {pending.length > 0 && (
              <View className="mb-6">
                <Typography variant="body-lg-bold" className="mb-3 text-text-primary">
                  {t('Spot.ordersTitle')}
                </Typography>
                <View className="gap-3">
                  {pending.map((o) => (
                    <SpotOrderCard
                      key={o.id}
                      order={o}
                      currentUserId={userId}
                      onClaim={handleClaim}
                      onMarkReady={handleMarkReady}
                    />
                  ))}
                </View>
              </View>
            )}

            {preparing.length > 0 && (
              <View>
                <Typography variant="body-lg-bold" className="mb-3 text-text-primary">
                  {t('Spot.preparingTitle')}
                </Typography>
                <View className="gap-3">
                  {preparing.map((o) => (
                    <SpotOrderCard
                      key={o.id}
                      order={o}
                      currentUserId={userId}
                      onClaim={handleClaim}
                      onMarkReady={handleMarkReady}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}
