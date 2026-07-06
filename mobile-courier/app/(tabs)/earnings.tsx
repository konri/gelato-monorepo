import { Typography } from '@/components/atoms/Typography';
import { TAB_BAR_TOTAL_HEIGHT } from '@/constants/tabBarStyles';
import { useMyEarnings } from '@/hooks/useCourierApplications';
import { CourierDailyEarning } from '@repo/api-client';
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

function StatCard({
  label,
  amount,
  deliveries,
  accent,
}: {
  label: string;
  amount: number;
  deliveries?: number;
  accent?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View
      className="flex-1 rounded-2xl p-4 shadow-sm"
      style={{ backgroundColor: accent ? '#EC2828' : '#FFFFFF' }}
    >
      <Typography
        variant="body-very-small-regular"
        style={{ color: accent ? '#FFFFFF' : '#6B7280' }}
      >
        {label}
      </Typography>
      <Typography
        variant="body-2xl-bold"
        className="mt-1"
        style={{ color: accent ? '#FFFFFF' : '#212121' }}
      >
        {amount.toFixed(2)} zł
      </Typography>
      {deliveries != null && (
        <Typography
          variant="body-very-small-regular"
          style={{ color: accent ? 'rgba(255,255,255,0.85)' : '#9CA3AF' }}
        >
          {t('Courier.deliveriesCount', { count: deliveries })}
        </Typography>
      )}
    </View>
  );
}

function DayRow({ day }: { day: CourierDailyEarning }) {
  const { t } = useTranslation();
  const label = new Date(day.date).toLocaleDateString([], {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
  return (
    <View className="flex-row items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
      <View>
        <Typography variant="body-base-semibold" className="text-text-primary">
          {label}
        </Typography>
        <Typography variant="body-small-regular" className="text-gray-500">
          {t('Courier.deliveriesCount', { count: day.deliveries })}
        </Typography>
      </View>
      <Typography variant="body-base-bold" className="text-primary">
        {day.amount.toFixed(2)} zł
      </Typography>
    </View>
  );
}

export default function EarningsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: earnings, loading, refetch } = useMyEarnings();
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

  const daily = earnings?.daily ?? [];

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="px-6 py-4 border-b border-gray-200 bg-white">
        <Typography variant="body-lg-bold" className="text-text-primary">
          {t('Courier.earningsTitle')}
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
        {loading && !earnings ? (
          <View className="py-10 items-center">
            <ActivityIndicator color="#EC2828" />
          </View>
        ) : (
          <>
            {/* Today + this month */}
            <View className="flex-row gap-3">
              <StatCard
                label={t('Courier.today')}
                amount={earnings?.todayAmount ?? 0}
                deliveries={earnings?.todayDeliveries ?? 0}
                accent
              />
              <StatCard
                label={t('Courier.thisMonth')}
                amount={earnings?.monthAmount ?? 0}
                deliveries={earnings?.monthDeliveries ?? 0}
              />
            </View>

            {/* All-time total */}
            <View className="mt-3">
              <StatCard
                label={t('Courier.allTime')}
                amount={earnings?.totalAmount ?? 0}
              />
            </View>

            {/* Daily breakdown */}
            <Typography variant="body-lg-bold" className="text-text-primary mt-6 mb-3">
              {t('Courier.dailyBreakdown')}
            </Typography>
            {daily.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center">
                <Ionicons name="wallet-outline" size={36} color="#9CA3AF" />
                <Typography
                  variant="body-base-regular"
                  className="text-gray-500 text-center mt-3"
                >
                  {t('Courier.noEarningsYet')}
                </Typography>
              </View>
            ) : (
              <View className="gap-3">
                {daily.map((d) => (
                  <DayRow key={d.date} day={d} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
