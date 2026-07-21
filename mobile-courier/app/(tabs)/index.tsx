import Logo from '@/assets/images/logo.svg';
import { Typography } from '@/components/atoms/Typography';
import { DeliveryPoolCard } from '@/components/molecules/DeliveryPoolCard';
import { SpotSelectionModal } from '@/components/molecules/SpotSelectionModal';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import {
  useAvailableDeliveries,
  useMyActiveDelivery,
  useMyActiveWorkSession,
  useMyApprovedSpots,
  useMyCourierApplications,
} from '@/hooks/useCourierApplications';
import {
  CourierApplication,
  acceptDelivery,
  endWorkSession,
  startWorkSession,
} from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

const STATUS_STYLE: Record<
  CourierApplication['status'],
  { bg: string; text: string; labelKey: string }
> = {
  pending: { bg: '#FEF3C7', text: '#B45309', labelKey: 'Courier.statusPending' },
  approved: { bg: '#DCFCE7', text: '#15803D', labelKey: 'Courier.statusApproved' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C', labelKey: 'Courier.statusRejected' },
};

function StatusBadge({ status }: { status: CourierApplication['status'] }) {
  const { t } = useTranslation();
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <View className="rounded-full px-3 py-1" style={{ backgroundColor: s.bg }}>
      <Typography variant="body-small-semibold" style={{ color: s.text }}>
        {t(s.labelKey)}
      </Typography>
    </View>
  );
}

function ApplicationCard({ app }: { app: CourierApplication }) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Typography variant="body-base-semibold" className="text-text-primary">
          {app.spotName ?? '—'}
        </Typography>
        {!!app.cityName && (
          <Typography variant="body-small-regular" className="text-gray-500 mt-0.5">
            {app.cityName}
          </Typography>
        )}
        {!!app.spotAddress && (
          <Typography variant="body-small-regular" className="text-gray-400 mt-0.5">
            {app.spotAddress}
          </Typography>
        )}
      </View>
      <StatusBadge status={app.status} />
    </View>
  );
}

export default function CourierHomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: applications, loading, refetch } = useMyCourierApplications();
  const { data: approvedSpots, refetch: refetchApproved } = useMyApprovedSpots();
  const { data: activeSession, refetch: refetchSession } = useMyActiveWorkSession();
  const { data: deliveries, refetch: refetchDeliveries } = useAvailableDeliveries();
  const { data: activeDelivery, refetch: refetchActiveDelivery } = useMyActiveDelivery();
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If a delivery is in progress, jump straight to the active-delivery screen.
  useEffect(() => {
    if (activeDelivery) {
      router.replace('/delivery');
    }
  }, [activeDelivery]);

  // Refetch everything whenever the tab regains focus (e.g. after applying).
  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchApproved();
      void refetchSession();
      void refetchDeliveries();
      void refetchActiveDelivery();
    }, [
      refetch,
      refetchApproved,
      refetchSession,
      refetchDeliveries,
      refetchActiveDelivery,
    ]),
  );

  // While online, poll the delivery pool so new broadcasts appear promptly.
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      void refetchDeliveries();
      void refetchActiveDelivery();
    }, 15_000);
    return () => clearInterval(interval);
  }, [activeSession, refetchDeliveries, refetchActiveDelivery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        refetchApproved(),
        refetchSession(),
        refetchDeliveries(),
        refetchActiveDelivery(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetch,
    refetchApproved,
    refetchSession,
    refetchDeliveries,
    refetchActiveDelivery,
  ]);

  const apps = applications ?? [];
  const approved = approvedSpots ?? [];
  const pool = deliveries ?? [];
  const hasApproved = approved.length > 0;
  const isOnline = !!activeSession;

  const handleAccept = async (orderId: string) => {
    const res = await acceptDelivery(orderId);
    if (res.error) {
      // Someone else grabbed it first, or another guard failed.
      const taken = res.error.message?.toLowerCase().includes('already been taken');
      Alert.alert(
        taken ? t('Courier.deliveryTakenTitle') : t('Common.error'),
        taken ? t('Courier.deliveryTakenBody') : res.error.message,
      );
      await refetchDeliveries();
      return;
    }
    await refetchActiveDelivery();
    router.replace('/delivery');
  };

  const handleGoOnlinePress = () => {
    if (!hasApproved) return;
    if (approved.length === 1) {
      // Single spot → skip the picker.
      void doStart([approved[0].spotId]);
    } else {
      setPickerVisible(true);
    }
  };

  const doStart = async (spotIds: string[]) => {
    setSubmitting(true);
    try {
      const res = await startWorkSession(spotIds);
      if (res.error) {
        Alert.alert(t('Common.error'), res.error.message);
        return;
      }
      setPickerVisible(false);
      await refetchSession();
    } catch (e) {
      Alert.alert(t('Common.error'), e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoOffline = () => {
    Alert.alert(
      t('Courier.stopWorkConfirmTitle'),
      t('Courier.stopWorkConfirmBody'),
      [
        { text: t('Courier.cancel'), style: 'cancel' },
        {
          text: t('Courier.stopWork'),
          style: 'destructive',
          onPress: async () => {
            try {
              await endWorkSession();
              await refetchSession();
            } catch (e) {
              Alert.alert(
                t('Common.error'),
                e instanceof Error ? e.message : String(e),
              );
            }
          },
        },
      ],
    );
  };

  const startedTime = activeSession
    ? new Date(activeSession.startedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const receivingCount = activeSession?.selectedSpotIds.length ?? 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header — carries the safe-area top padding so the status-bar area is
          white (was gray, which made the top look two-toned). */}
      <View
        className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200 bg-white"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center">
          <Logo width={32} height={32} />
          <View className="ml-2">
            <Typography variant="body-lg-bold" className="text-text-primary leading-5">
              Gelato
            </Typography>
            <Typography
              variant="body-very-small-medium"
              className="text-primary tracking-[2px]"
              style={{ color: '#EC2828' }}
            >
              COURIER
            </Typography>
          </View>
        </View>
        <Pressable onPress={() => router.push('/settings' as any)}>
          <Ionicons name="settings-outline" size={24} color="#212121" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#EC2828"
            colors={['#EC2828']}
          />
        }
      >
        {/* Online/offline control */}
        <View className="px-4 mt-6">
          {isOnline ? (
            <>
              <Pressable
                onPress={handleGoOffline}
                className="rounded-3xl py-8 items-center justify-center shadow-lg"
                style={{ backgroundColor: '#EF4444' }}
              >
                <Ionicons name="stop-circle-outline" size={40} color="#FFFFFF" />
                <Typography variant="body-xl-bold" className="text-white mt-2">
                  {t('Courier.goOffline')}
                </Typography>
                <Typography variant="body-small-regular" className="text-white/90 mt-1">
                  {t('Courier.onlineSince', { time: startedTime })}
                </Typography>
              </Pressable>
              <View className="flex-row items-center justify-center mt-3">
                <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
                <Typography variant="body-small-semibold" className="text-gray-600">
                  {t('Courier.online')} ·{' '}
                  {t('Courier.workingFromCount', { count: receivingCount })}
                </Typography>
              </View>
            </>
          ) : (
            <>
              <Pressable
                disabled={!hasApproved}
                onPress={handleGoOnlinePress}
                className="rounded-3xl py-8 items-center justify-center shadow-lg"
                style={{ backgroundColor: hasApproved ? '#22C55E' : '#D1D5DB' }}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="power" size={40} color="#FFFFFF" />
                    <Typography variant="body-xl-bold" className="text-white mt-2">
                      {hasApproved
                        ? t('Courier.goOnline')
                        : t('Courier.goOnlineSoon')}
                    </Typography>
                  </>
                )}
              </Pressable>
              {!hasApproved && (
                <Typography
                  variant="body-small-regular"
                  className="text-gray-500 text-center mt-3 px-2"
                >
                  {t('Courier.jobStartHint')}
                </Typography>
              )}
            </>
          )}
        </View>

        {/* Available deliveries pool (only while online) */}
        {isOnline && (
          <View className="px-4 mt-8">
            <Typography variant="body-lg-bold" className="text-text-primary mb-3">
              {t('Courier.availableDeliveries')}
            </Typography>
            {pool.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center">
                <Ionicons name="hourglass-outline" size={32} color="#9CA3AF" />
                <Typography
                  variant="body-base-regular"
                  className="text-gray-500 text-center mt-3"
                >
                  {t('Courier.noAvailableDeliveries')}
                </Typography>
              </View>
            ) : (
              <View className="gap-3">
                {pool.map((d) => (
                  <DeliveryPoolCard
                    key={d.id}
                    delivery={d}
                    onAccept={handleAccept}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* My spots / applications */}
        <View className="px-4 mt-8">
          <View className="flex-row items-center justify-between mb-3">
            <Typography variant="body-lg-bold" className="text-text-primary">
              {t('Courier.myApplications')}
            </Typography>
            <Pressable
              onPress={() => router.push('/apply-spot' as any)}
              className="flex-row items-center"
            >
              <Ionicons name="add-circle-outline" size={20} color="#EC2828" />
              <Typography variant="body-small-semibold" className="text-primary ml-1">
                {t('Courier.applyToSpot')}
              </Typography>
            </Pressable>
          </View>

          {loading && apps.length === 0 ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#EC2828" />
            </View>
          ) : apps.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Ionicons name="storefront-outline" size={36} color="#9CA3AF" />
              <Typography
                variant="body-base-regular"
                className="text-gray-500 text-center mt-3"
              >
                {t('Courier.noApplications')}
              </Typography>
              <Pressable
                onPress={() => router.push('/apply-spot' as any)}
                className="mt-4 rounded-2xl px-6 py-3"
                style={{ backgroundColor: '#EC2828' }}
              >
                <Typography variant="body-base-semibold" className="text-white">
                  {t('Courier.applyCta')}
                </Typography>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {apps.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <SpotSelectionModal
        visible={pickerVisible}
        spots={approved}
        submitting={submitting}
        onClose={() => setPickerVisible(false)}
        onConfirm={doStart}
      />
    </View>
  );
}
