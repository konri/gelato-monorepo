import { CustomSafeAreaView } from '@/components/CustomSafeAreaView';
import { HeaderWithBackButton } from '@/components/HeaderWithBackButton';
import { Typography } from '@/components/atoms/Typography';
import { getNotification, type AppNotification } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { localizeNotification } from '@/utils/notificationDisplay';
import { routeFromNotification } from '@/utils/notificationRouting';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';

function iconFor(type: string): { name: keyof typeof Ionicons.glyphMap; color: string; bg: string } {
  switch (type) {
    case 'COURIER_APPROVED':
      return { name: 'checkmark-circle', color: '#16A34A', bg: '#DCFCE7' };
    case 'COURIER_REJECTED':
      return { name: 'close-circle', color: '#DC2626', bg: '#FEE2E2' };
    case 'DELIVERY_BROADCAST':
      return { name: 'bicycle', color: '#EC2828', bg: '#FEECEC' };
    case 'order_message':
      return { name: 'chatbubble-ellipses', color: '#2563EB', bg: '#DBEAFE' };
    default:
      return { name: 'notifications', color: '#6B7280', bg: '#F3F4F6' };
  }
}

export default function CourierNotificationDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = (await safeGetItem('access_token')) ?? undefined;
    const res = await getNotification({ id: id as string, token });
    setItem(res.data ?? null);
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

  const ic = iconFor(item?.type ?? '');
  const localized = item ? localizeNotification(t, item) : null;
  const target = item ? routeFromNotification(item.type, item.data) : null;

  return (
    <CustomSafeAreaView>
      <HeaderWithBackButton title={t('Notifications.detailTitle')} variant="card" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color="#EC2828" />
          </View>
        ) : !item || !localized ? (
          <View className="py-16 items-center">
            <Ionicons name="notifications-off-outline" size={40} color="#9CA3AF" />
            <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
              {t('Notifications.empty')}
            </Typography>
          </View>
        ) : (
          <View className="rounded-2xl bg-white p-5">
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

            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 16 }}
                resizeMode="cover"
              />
            ) : null}

            <Typography variant="body-very-small-medium" className="mt-4 text-gray-400">
              {fmt(item.createdAt)}
            </Typography>

            {!!target && (
              <Pressable
                onPress={() => router.push(target as never)}
                className="mt-5 flex-row items-center justify-center rounded-xl py-3.5"
                style={{ backgroundColor: '#EC2828' }}
              >
                <Ionicons name="bicycle-outline" size={18} color="#fff" />
                <Typography variant="body-base-semibold" className="ml-2 text-white">
                  {t('Notifications.viewDelivery')}
                </Typography>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </CustomSafeAreaView>
  );
}
