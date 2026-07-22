import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getStoredSpotContext } from '@/hooks/useSpotOrders';
import {
  getSpotDashboard,
  getSpotEmployees,
  type SpotDashboard,
  type SpotEmployee,
} from '@repo/api-client';
import { downloadReport } from '@/services/downloadReport';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

type Preset = 'today' | 'week' | 'month';

const money = (v: number) => `${v.toFixed(2)} zł`;

// Local YYYY-MM-DD (avoids UTC shift from toISOString).
const iso = (d: Date) =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;

function rangeFor(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const to = iso(now);
  if (preset === 'today') return { from: to, to };
  if (preset === 'week') {
    const d = new Date(now);
    d.setDate(now.getDate() - 6);
    return { from: iso(d), to };
  }
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to };
}

const empName = (e: SpotEmployee) =>
  e.name || [e.firstName, e.surname].filter(Boolean).join(' ') || e.email;

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const { isWide } = useBreakpoint();

  const [spotId, setSpotId] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('month');
  const [employees, setEmployees] = useState<SpotEmployee[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [data, setData] = useState<SpotDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => rangeFor(preset), [preset]);

  useEffect(() => {
    void getStoredSpotContext().then(async (ctx) => {
      setSpotId(ctx.spotId);
      if (ctx.spotId) {
        const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
        const emp = await getSpotEmployees(ctx.spotId, { token });
        setEmployees(emp.data ?? []);
      }
    });
  }, []);

  const [exporting, setExporting] = useState<null | 'orders' | 'points'>(null);

  const load = useCallback(async () => {
    if (!spotId) return;
    setLoading(true);
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotDashboard(spotId, range.from, range.to, employeeId, { token });
    setData(res.data ?? null);
    setLoading(false);
  }, [spotId, range.from, range.to, employeeId]);

  const exportOrders = async () => {
    if (!spotId) return;
    setExporting('orders');
    try {
      // Daily orders report is per-day — use the range end (today for presets).
      await downloadReport(`orders/${spotId}?date=${range.to}`, `orders-${range.to}.pdf`, i18n.language);
    } catch {
      /* no-op */
    } finally {
      setExporting(null);
    }
  };

  const exportPoints = async () => {
    if (!spotId) return;
    setExporting('points');
    try {
      await downloadReport(
        `points/${spotId}?from=${range.from}&to=${range.to}`,
        `points-${range.from}_${range.to}.pdf`,
        i18n.language,
      );
    } catch {
      /* no-op */
    } finally {
      setExporting(null);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={t('Dashboard.title')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <ResponsiveContainer maxWidth={720}>
          {/* Date range presets */}
          <View className="mb-4 flex-row rounded-2xl bg-gray-100 p-1">
            {(['today', 'week', 'month'] as Preset[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPreset(p)}
                className="flex-1 items-center rounded-xl py-2.5"
                style={{ backgroundColor: preset === p ? '#fff' : 'transparent' }}
              >
                <Typography variant="body-small-bold" style={{ color: preset === p ? '#EC2828' : '#6B7280' }}>
                  {t(`Dashboard.${p}`)}
                </Typography>
              </Pressable>
            ))}
          </View>

          {/* Employee filter */}
          {employees.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                <FilterChip active={employeeId === null} onPress={() => setEmployeeId(null)}>
                  {t('Dashboard.allEmployees')}
                </FilterChip>
                {employees.map((e) => (
                  <FilterChip key={e.id} active={employeeId === e.id} onPress={() => setEmployeeId(e.id)}>
                    {empName(e)}
                  </FilterChip>
                ))}
              </View>
            </ScrollView>
          )}

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator color="#EC2828" />
            </View>
          ) : (
            <>
              {/* Summary cards */}
              <View className="flex-row gap-3">
                <StatCard label={t('Dashboard.revenue')} value={money(data?.revenue ?? 0)} accent />
                <StatCard label={t('Dashboard.orders')} value={String(data?.orders ?? 0)} />
              </View>
              <View className="mt-3">
                <StatCard label={t('Dashboard.avgOrder')} value={money(data?.averageOrder ?? 0)} />
              </View>

              {/* PDF exports */}
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={exportOrders}
                  disabled={exporting !== null}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
                >
                  <Ionicons name="receipt-outline" size={16} color="#EC2828" />
                  <Typography variant="body-small-bold" className="ml-1.5" style={{ color: '#EC2828' }}>
                    {exporting === 'orders' ? t('Dashboard.exporting') : t('Dashboard.orders')}
                  </Typography>
                </Pressable>
                <Pressable
                  onPress={exportPoints}
                  disabled={exporting !== null}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
                >
                  <Ionicons name="star-outline" size={16} color="#EC2828" />
                  <Typography variant="body-small-bold" className="ml-1.5" style={{ color: '#EC2828' }}>
                    {exporting === 'points' ? t('Dashboard.exporting') : t('Dashboard.exportPdf')}
                  </Typography>
                </Pressable>
              </View>

              {(!data || data.orders === 0) && (
                <View className="mt-6 items-center px-8 py-10">
                  <Ionicons name="bar-chart-outline" size={44} color="#9CA3AF" />
                  <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
                    {t('Dashboard.noData')}
                  </Typography>
                </View>
              )}

              {/* Per-employee breakdown */}
              {data && data.byEmployee.length > 0 && (
                <View className="mt-6">
                  <Typography variant="body-small-bold" className="mb-2" style={{ color: '#6B7280', letterSpacing: 1 }}>
                    {t('Dashboard.byEmployee').toUpperCase()}
                  </Typography>
                  <View className="gap-2">
                    {data.byEmployee.map((e) => (
                      <View
                        key={e.preparedById ?? 'unassigned'}
                        className="flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                      >
                        <View className="flex-1">
                          <Typography variant="body-base-semibold" className="text-text-primary">
                            {e.name === 'Unassigned' ? t('Dashboard.unassigned') : e.name}
                          </Typography>
                          <Typography variant="body-small-regular" className="text-gray-500">
                            {t('Dashboard.orders')}: {e.orders}
                          </Typography>
                        </View>
                        <Typography variant="body-base-bold" style={{ color: '#EC2828' }}>
                          {money(e.revenue)}
                        </Typography>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Daily revenue bars */}
              {data && data.daily.length > 0 && (
                <View className="mt-6">
                  <Typography variant="body-small-bold" className="mb-2" style={{ color: '#6B7280', letterSpacing: 1 }}>
                    {t('Dashboard.daily').toUpperCase()}
                  </Typography>
                  <DailyBars daily={data.daily} />
                </View>
              )}
            </>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
      <Typography variant="body-small-regular" className="text-gray-500">
        {label}
      </Typography>
      <Typography variant="heading-32-bold" style={{ color: accent ? '#EC2828' : '#212121' }}>
        {value}
      </Typography>
    </View>
  );
}

function DailyBars({ daily }: { daily: { date: string; revenue: number; orders: number }[] }) {
  const max = Math.max(...daily.map((d) => d.revenue), 1);
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      {daily.map((d) => (
        <View key={d.date} className="mb-2 flex-row items-center">
          <Typography variant="body-very-small-medium" className="w-16 text-gray-500">
            {d.date.slice(5)}
          </Typography>
          <View className="mx-2 h-4 flex-1 overflow-hidden rounded-full bg-gray-100">
            <View
              className="h-4 rounded-full"
              style={{ width: `${Math.max(4, (d.revenue / max) * 100)}%`, backgroundColor: '#EC2828' }}
            />
          </View>
          <Typography variant="body-very-small-medium" className="w-20 text-right text-gray-700">
            {d.revenue.toFixed(0)} zł
          </Typography>
        </View>
      ))}
    </View>
  );
}

function FilterChip({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-4 py-2"
      style={{ borderColor: active ? '#EC2828' : '#D1D5DB', backgroundColor: active ? '#FEECEC' : '#fff' }}
    >
      <Typography variant="body-small-semibold" style={{ color: active ? '#EC2828' : '#374151' }}>
        {children}
      </Typography>
    </Pressable>
  );
}
