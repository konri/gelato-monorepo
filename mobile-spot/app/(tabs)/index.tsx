import Lockup from '@/assets/images/loodly_lockup.svg';
import { Typography } from '@/components/atoms/Typography';
import { withSpotScope } from '@/components/hoc/withSpotScope';
import { SpotOrderCard } from '@/components/molecules/SpotOrderCard';
import { OtherSpotsStrip } from '@/components/organisms/OtherSpotsStrip';
import { useSpotRealtime } from '@/components/organisms/RealtimeProvider';
import { TabHeader } from '@/components/organisms/TabHeader';
import { useToast } from '@/components/organisms/ToastProvider';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useSession } from '@/contexts/SessionProvider';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  advanceOrderStatus,
  claimOrder,
  terminateOrder,
  useSpotOrders,
} from '@/hooks/useSpotOrders';
import { spotStore } from '@/stores/spotStore';
import { scheduledForSortKey } from '@/utils/scheduledFor';
import { getSpotUnreadCount } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
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

function SpotOrdersScreen() {
  const { t } = useTranslation();
  const { isWide } = useBreakpoint();
  // Active orders = anything not yet ready/delivered. We fetch all and filter.
  const { orders, loading, refetch, setOrders, spotId } = useSpotOrders(null);
  const toast = useToast();
  const { userId } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);
  const hasNew = useRef(false);

  // The bell counts this spot's notifications (plus spot-less ones).
  const loadUnread = useCallback(async () => {
    if (!spotId) return;
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotUnreadCount({ token, spotId });
    if (spotStore.getActiveSpotId() !== spotId) return;
    setUnread(res.data ?? 0);
  }, [spotId]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void loadUnread();
    }, [refetch, loadUnread]),
  );

  // Live (active spot only): a new order arrives → refetch so it appears; a
  // claim → refetch so it moves/disappears for everyone else; a reconnect or a
  // spot switch → refetch whatever may have been missed.
  useSpotRealtime({
    onNewOrder: () => {
      hasNew.current = true;
      void refetch();
    },
    onOrderClaimed: () => {
      void refetch();
    },
    onResync: () => {
      void refetch();
    },
  });

  // Pull-to-refresh also revalidates the spot context (spots, levels, counts).
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), spotStore.refresh('pullToRefresh'), loadUnread()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, loadUnread]);

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

  const handleCancel = async (id: string, reason: string, points: number) => {
    const res = await terminateOrder(id, reason, points);
    if (res.error || !res.data) {
      throw new Error(res.error?.message || t('OrderTrack.terminateFailed'));
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success(t('CancelOrder.done'));
    await refetch();
  };

  // Active queue: pending (need claiming) + preparing (in progress).
  // ASAP / earlier ready times first so tomorrow's orders sit below today's.
  const byReady = (a: (typeof orders)[number], b: (typeof orders)[number]) =>
    scheduledForSortKey(a.scheduledFor) - scheduledForSortKey(b.scheduledFor);
  const pending = orders.filter((o) => o.status === 'PENDING').sort(byReady);
  const preparing = orders.filter((o) => o.status === 'PREPARING').sort(byReady);
  // Empty state is about the ACTIVE queue, not the raw fetch — otherwise a spot
  // whose orders are all READY/on-the-way rendered a blank page (looked broken).
  const noActive = pending.length === 0 && preparing.length === 0;

  return (
    <View className="flex-1 bg-gray-50">
      <TabHeader
        title={t('SpotTabs.orders')}
        left={
          // Logo hidden on wide layout — the sidebar already shows the brand.
          isWide ? undefined : (
            // SPOT tucks under the cone (centred on the cone axis, which sits
            // at ~32% of the lockup width) rather than beside it.
            <View style={{ width: 88, height: 61 }}>
              <Lockup width={88} height={61} />
              <View
                style={{ position: 'absolute', left: 26, width: 56, bottom: -3, alignItems: 'center' }}
              >
                <Typography
                  variant="body-very-small-medium"
                  style={{ color: '#EC2828', letterSpacing: 2, fontSize: 9 }}
                >
                  SPOT
                </Typography>
              </View>
            </View>
          )
        }
        right={
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
            <Pressable
              onPress={() => router.push('/notifications')}
              hitSlop={8}
              className="relative"
              accessibilityRole="button"
              accessibilityLabel={t('Notifications.title')}
            >
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
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: (isWide ? 24 : TAB_BAR_TOTAL_HEIGHT) + 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
        }
      >
        <ResponsiveContainer>
        {/* What is waiting at the user's other spots (switchable users only). */}
        <OtherSpotsStrip />
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
                      onCancel={handleCancel}
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
                      onCancel={handleCancel}
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

export default withSpotScope(SpotOrdersScreen);
