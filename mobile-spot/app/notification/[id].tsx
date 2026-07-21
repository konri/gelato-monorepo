import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { getMySpotNotifications, type SpotNotification } from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { localizeNotification, incidentLabel } from '@/utils/notificationDisplay';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';

// Icon + tint per notification type (matches the list).
function iconFor(type: string): { name: any; color: string; bg: string } {
  switch (type) {
    case 'DELIVERY_INCIDENT':
      return { name: 'alert-circle', color: '#DC2626', bg: '#FEE2E2' };
    case 'order':
      return { name: 'receipt', color: '#EC2828', bg: '#FEECEC' };
    default:
      return { name: 'notifications', color: '#6B7280', bg: '#F3F4F6' };
  }
}

export default function NotificationDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<SpotNotification | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getMySpotNotifications({ token });
    setItem((res.data ?? []).find((n) => n.id === id) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const fmt = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const orderId = item?.data?.orderId as string | undefined;
  const incidentType = item?.data?.incidentType as string | undefined;
  const note = (item?.data?.note as string | undefined)?.trim();
  const ic = iconFor(item?.type ?? '');
  const localized = item ? localizeNotification(t, item) : null;

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={t('SpotNotif.detailTitle')} backFallback="/notifications" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <ResponsiveContainer maxWidth={640}>
          {loading ? (
            <View className="py-10 items-center"><ActivityIndicator color="#EC2828" /></View>
          ) : !item || !localized ? (
            <View className="py-16 items-center">
              <Ionicons name="notifications-off-outline" size={40} color="#9CA3AF" />
              <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
                {t('Notifications.empty')}
              </Typography>
            </View>
          ) : (
            <View className="rounded-2xl bg-white p-5 shadow-sm">
              <View className="flex-row items-center">
                <View
                  className="h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: ic.bg }}
                >
                  <Ionicons name={ic.name} size={22} color={ic.color} />
                </View>
                <Typography variant="body-lg-bold" className="ml-3 flex-1 text-text-primary">
                  {localized.title}
                </Typography>
              </View>

              <Typography variant="body-base-regular" className="mt-4 text-gray-700">
                {localized.body}
              </Typography>

              {item.type === 'DELIVERY_INCIDENT' && !!incidentType && (
                <View className="mt-4 rounded-xl bg-red-50 p-3">
                  <Typography variant="body-small-semibold" style={{ color: '#DC2626' }}>
                    {incidentLabel(t, incidentType)}
                  </Typography>
                  {!!note && (
                    <Typography variant="body-small-regular" className="mt-1 text-gray-700">
                      {t('SpotNotif.note')}: {note}
                    </Typography>
                  )}
                </View>
              )}

              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 16 }}
                  resizeMode="cover"
                />
              ) : null}

              <Typography variant="body-very-small-medium" className="mt-4 text-gray-400">
                {t('SpotNotif.reportedAt')}: {fmt(item.createdAt)}
              </Typography>

              {!!orderId && (
                <Pressable
                  onPress={() => router.push(`/order/${orderId}` as never)}
                  className="mt-5 flex-row items-center justify-center rounded-xl py-3.5"
                  style={{ backgroundColor: '#EC2828' }}
                >
                  <Ionicons name="receipt-outline" size={18} color="#fff" />
                  <Typography variant="body-base-semibold" className="ml-2 text-white">
                    {t('SpotNotif.viewOrder')}
                  </Typography>
                </Pressable>
              )}
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}
