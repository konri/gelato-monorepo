import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { getStoredSpotContext } from '@/hooks/useSpotOrders';
import {
  getSpotComplaints,
  resolveComplaint,
  type SpotComplaint,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Filter = 'open' | 'resolved';

export default function ComplaintsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [spotId, setSpotId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');
  const [complaints, setComplaints] = useState<SpotComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const ctx = await getStoredSpotContext();
    setSpotId(ctx.spotId);
    if (!ctx.spotId) {
      setLoading(false);
      return;
    }
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotComplaints(ctx.spotId, filter, { token });
    setComplaints(res.data ?? []);
    setLoading(false);
  }, [filter]);

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

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="pr-2">
          <Ionicons name="arrow-back" size={22} color="#212121" />
        </Pressable>
        <Typography variant="body-lg-bold" className="text-text-primary">
          {t('Complaints.title')}
        </Typography>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EC2828" colors={['#EC2828']} />
        }
      >
        <ResponsiveContainer maxWidth={680}>
          {/* Open / Resolved filter */}
          <View className="mb-4 flex-row rounded-2xl bg-gray-100 p-1">
            {(['open', 'resolved'] as Filter[]).map((fl) => (
              <Pressable
                key={fl}
                onPress={() => setFilter(fl)}
                className="flex-1 items-center rounded-xl py-2.5"
                style={{ backgroundColor: filter === fl ? '#fff' : 'transparent' }}
              >
                <Typography variant="body-small-bold" style={{ color: filter === fl ? '#EC2828' : '#6B7280' }}>
                  {t(fl === 'open' ? 'Complaints.open' : 'Complaints.resolved')}
                </Typography>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator color="#EC2828" />
            </View>
          ) : complaints.length === 0 ? (
            <View className="items-center px-8 py-16">
              <Ionicons name="chatbubble-ellipses-outline" size={44} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
                {t(filter === 'open' ? 'Complaints.noneOpen' : 'Complaints.noneResolved')}
              </Typography>
            </View>
          ) : (
            <View className="gap-3">
              {complaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} onResolved={load} />
              ))}
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

function ComplaintCard({
  complaint,
  onResolved,
}: {
  complaint: SpotComplaint;
  onResolved: () => void;
}) {
  const { t } = useTranslation();
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const isOpen = complaint.status === 'open';

  const submit = async () => {
    if (!resolution.trim()) return;
    setBusy(true);
    setError(false);
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await resolveComplaint(complaint.id, resolution.trim(), { token });
    setBusy(false);
    if (res.error) setError(true);
    else onResolved();
  };

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Typography variant="body-base-bold" className="text-text-primary">
            {complaint.subject}
          </Typography>
          <Typography variant="body-very-small-medium" className="mt-0.5 text-gray-400">
            {complaint.orderNumber ? t('Complaints.order', { number: complaint.orderNumber }) : ''}
            {complaint.customerName ? ` · ${t('Complaints.from', { name: complaint.customerName })}` : ''}
          </Typography>
        </View>
        {!isOpen && (
          <View className="rounded-full bg-green-50 px-2.5 py-1">
            <Typography variant="body-very-small-medium" style={{ color: '#15803D' }}>
              {t('Complaints.resolvedLabel')}
            </Typography>
          </View>
        )}
      </View>

      <Typography variant="body-small-regular" className="mt-2 text-gray-600">
        {complaint.message}
      </Typography>

      {isOpen ? (
        <View className="mt-3">
          {error && (
            <Typography variant="body-small-regular" className="mb-2" style={{ color: '#B91C1C' }}>
              {t('Complaints.error')}
            </Typography>
          )}
          <TextInput
            value={resolution}
            onChangeText={setResolution}
            placeholder={t('Complaints.resolvePlaceholder')}
            multiline
            className="rounded-xl border border-gray-300 px-4 py-3 text-base"
          />
          <Pressable
            onPress={submit}
            disabled={busy || !resolution.trim()}
            className="mt-2 items-center rounded-xl py-3"
            style={{ backgroundColor: busy || !resolution.trim() ? '#F4A3A3' : '#EC2828' }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Typography variant="body-small-bold" className="text-white">
                {t('Complaints.resolve')}
              </Typography>
            )}
          </Pressable>
        </View>
      ) : complaint.resolution ? (
        <View className="mt-3 rounded-xl bg-gray-50 p-3">
          <Typography variant="body-very-small-medium" className="text-gray-400">
            {t('Complaints.resolutionLabel')}
          </Typography>
          <Typography variant="body-small-regular" className="mt-0.5 text-gray-700">
            {complaint.resolution}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}
