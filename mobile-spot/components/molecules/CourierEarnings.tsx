import { Typography } from '@/components/atoms/Typography';
import {
  getSpotCourierEarnings,
  type SpotCourierEarningsSummary,
} from '@repo/api-client';
import { downloadReport } from '@/services/downloadReport';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

const money = (v: number) => `${v.toFixed(2)} zł`;

/**
 * Admin dashboard: courier earnings for a spot, per month. Shows the aggregate
 * (total money + deliveries) and a per-courier breakdown, with a month stepper.
 */
export function CourierEarnings({ spotId }: { spotId: string }) {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [data, setData] = useState<SpotCourierEarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    setExporting(true);
    try {
      // Month → [first day, last day] range for the report route.
      const from = `${year}-${`${month}`.padStart(2, '0')}-01`;
      const last = new Date(year, month, 0).getDate();
      const to = `${year}-${`${month}`.padStart(2, '0')}-${last}`;
      await downloadReport(`courier/${spotId}?from=${from}&to=${to}`, `courier-${from}.pdf`, i18n.language);
    } catch {
      /* surfaced below via alert-free no-op; keep UI simple */
    } finally {
      setExporting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotCourierEarnings(spotId, year, month, { token });
    setData(res.data ?? null);
    setLoading(false);
  }, [spotId, year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const step = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(
    i18n.language === 'ua' ? 'uk-UA' : i18n.language === 'pl' ? 'pl-PL' : 'en-US',
    { month: 'long', year: 'numeric' },
  );

  // Don't allow stepping into the future.
  const isCurrentOrFuture =
    year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);

  return (
    <View className="gap-4">
      {/* Month stepper */}
      <View className="flex-row items-center justify-between rounded-2xl bg-white p-3">
        <Pressable onPress={() => step(-1)} hitSlop={8} className="p-1">
          <Ionicons name="chevron-back" size={22} color="#374151" />
        </Pressable>
        <Typography variant="body-base-bold" className="text-text-primary">
          {monthLabel}
        </Typography>
        <Pressable onPress={() => step(1)} hitSlop={8} className="p-1" disabled={isCurrentOrFuture}>
          <Ionicons name="chevron-forward" size={22} color={isCurrentOrFuture ? '#D1D5DB' : '#374151'} />
        </Pressable>
      </View>

      {/* Export PDF */}
      <Pressable
        onPress={exportPdf}
        disabled={exporting}
        className="flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
      >
        <Ionicons name="document-text-outline" size={18} color="#EC2828" />
        <Typography variant="body-small-bold" className="ml-2" style={{ color: '#EC2828' }}>
          {exporting ? t('Couriers.exporting') : t('Couriers.exportPdf')}
        </Typography>
      </Pressable>

      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#EC2828" />
        </View>
      ) : (
        <>
          {/* Aggregate */}
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
              <Typography variant="body-small-regular" className="text-gray-500">
                {t('Couriers.total')}
              </Typography>
              <Typography variant="heading-32-bold" style={{ color: '#EC2828' }}>
                {money(data?.totalAmount ?? 0)}
              </Typography>
            </View>
            <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
              <Typography variant="body-small-regular" className="text-gray-500">
                {t('Couriers.tabList')}
              </Typography>
              <Typography variant="heading-32-bold" className="text-text-primary">
                {t('Couriers.totalDeliveries', { count: data?.totalDeliveries ?? 0 })}
              </Typography>
            </View>
          </View>

          {/* Per-courier */}
          <Typography variant="body-small-bold" style={{ color: '#6B7280', letterSpacing: 1 }}>
            {t('Couriers.perCourier').toUpperCase()}
          </Typography>
          {!data || data.couriers.length === 0 ? (
            <View className="items-center px-8 py-10">
              <Ionicons name="wallet-outline" size={40} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
                {t('Couriers.noEarnings')}
              </Typography>
            </View>
          ) : (
            <View className="gap-2">
              {data.couriers.map((c) => (
                <View key={c.courierId} className="flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                  <View className="flex-1">
                    <Typography variant="body-base-semibold" className="text-text-primary">
                      {c.name}
                    </Typography>
                    <Typography variant="body-small-regular" className="text-gray-500">
                      {t('Couriers.deliveries', { count: c.deliveries })}
                    </Typography>
                  </View>
                  <Typography variant="body-base-bold" style={{ color: '#EC2828' }}>
                    {money(c.amount)}
                  </Typography>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}
