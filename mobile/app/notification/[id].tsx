import { CustomSafeAreaView } from '@/components/CustomSafeAreaView';
import { HeaderWithBackButton } from '@/components/HeaderWithBackButton';
import { Typography } from '@/components/atoms/Typography';
import { getNotification, type AppNotification } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { localizeNotification } from '@/utils/notificationDisplay';
import { CARD_EVENTS, routeFromNotification } from '@/utils/notificationRouting';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { THEME } from '@/constants/palette';

// Icon + tint per notification type (matches the notification center list).
function iconFor(type: string): { name: keyof typeof Ionicons.glyphMap; color: string; bg: string } {
  switch (type) {
    case 'order':
      return { name: 'receipt', color: THEME.primaryDark, bg: THEME.primaryPale };
    case 'NEWS':
      return { name: 'newspaper', color: '#2563EB', bg: '#DBEAFE' };
    case 'POINTS_EARNED':
      return { name: 'star', color: '#B45309', bg: '#FEF3C7' };
    case 'BIRTHDAY_BONUS':
      return { name: 'balloon', color: '#6D28D9', bg: '#EDE9FE' };
    case 'REFERRAL_BONUS':
      return { name: 'people', color: '#9D174D', bg: '#FCE7F3' };
    case 'REWARD_REFUNDED':
      return { name: 'arrow-undo', color: '#92400E', bg: '#FEF3C7' };
    case 'REWARD_EXPIRING':
      // Urgency stays a semantic red.
      return { name: 'alarm', color: '#B91C1C', bg: '#FEE2E2' };
    case 'REWARD_EXCHANGED':
      return { name: 'gift', color: THEME.primaryDark, bg: THEME.primaryPale };
    default:
      return { name: 'notifications', color: THEME.textTertiary, bg: THEME.neutralFill };
  }
}

export default function NotificationDetailScreen() {
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

  const orderId = item?.data?.orderId;
  const newsId = item?.data?.newsId;
  const messageId = item?.data?.messageId;
  // Order-message notifications deep-link into the chat scrolled to the message.
  const orderHref = orderId
    ? messageId
      ? `/order/track/${orderId}?messageId=${messageId}`
      : `/order/track/${orderId}`
    : null;
  const ic = iconFor(item?.type ?? '');
  const localized = item ? localizeNotification(t, item) : null;

  return (
    <CustomSafeAreaView>
      <HeaderWithBackButton title={t('Notifications.detailTitle')} variant="card" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color={THEME.primary} />
          </View>
        ) : !item || !localized ? (
          <View className="py-16 items-center">
            <Ionicons name="notifications-off-outline" size={40} color={THEME.placeholder} />
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

            <Typography variant="body-very-small-medium" className="mt-4 text-gray-500">
              {fmt(item.createdAt)}
            </Typography>

            {!!orderHref && (
              <Pressable
                onPress={() => router.push(orderHref as never)}
                className="mt-5 flex-row items-center justify-center rounded-xl py-3.5"
                style={{ backgroundColor: THEME.primary }}
              >
                <Ionicons name="receipt-outline" size={18} color="#fff" />
                <Typography variant="body-base-semibold" className="ml-2 text-white">
                  {t('Notifications.viewOrder')}
                </Typography>
              </Pressable>
            )}

            {!!newsId && (
              <Pressable
                onPress={() => router.push(`/news_comments/${newsId}` as never)}
                className="mt-5 flex-row items-center justify-center rounded-xl py-3.5"
                style={{ backgroundColor: '#2563EB' }}
              >
                <Ionicons name="newspaper-outline" size={18} color="#fff" />
                <Typography variant="body-base-semibold" className="ml-2 text-white">
                  {t('Notifications.viewNews')}
                </Typography>
              </Pressable>
            )}

            {CARD_EVENTS.has(item.type) && (
              <Pressable
                onPress={() => {
                  const target = routeFromNotification(item.type, item.data);
                  if (target) router.navigate(target as never);
                }}
                accessibilityRole="button"
                className="mt-5 flex-row items-center justify-center rounded-xl"
                style={{ backgroundColor: '#B45309', minHeight: 56 }}
              >
                <Ionicons name="star-outline" size={20} color="#fff" />
                <Typography variant="body-base-semibold" className="ml-2 text-white">
                  {t('Notifications.viewPoints')}
                </Typography>
              </Pressable>
            )}

            {item.type === 'REWARD_EXPIRING' && (
              <Pressable
                onPress={() => {
                  const target = routeFromNotification(item.type, item.data);
                  if (target) router.push(target as never);
                }}
                accessibilityRole="button"
                className="mt-5 flex-row items-center justify-center rounded-xl"
                style={{ backgroundColor: THEME.primaryDark, minHeight: 56 }}
              >
                <Ionicons name="gift-outline" size={20} color="#fff" />
                <Typography variant="body-base-semibold" className="ml-2 text-white">
                  {t('Notifications.viewReward')}
                </Typography>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </CustomSafeAreaView>
  );
}
