import type { ReadyToPickUpItem } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { localizedText } from '@/utils/localizedText';
import { isPickUpOpen, pickUpDaysLeft } from '@/utils/pickUp';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

type Props = {
  items: ReadyToPickUpItem[];
  onOpenOne: (userPrizeId: string) => void;
  onOpenAll: () => void;
};

/**
 * "A reward is waiting: {reward} · {brand}" (BRANDS_SPEC §5.4): rewards from
 * every brand that were claimed in the app and not picked up yet.
 */
export function ReadyToPickUpBanner({ items, onOpenOne, onOpenAll }: Props) {
  const { t, i18n } = useTranslation();
  // Server flags AND the date: the overview can be an offline snapshot.
  const now = Date.now();
  const ready = items.filter((i) => isPickUpOpen(i, now));
  if (ready.length === 0) return null;

  const soonest = [...ready].sort(
    (a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime(),
  )[0];
  const first = ready[0];
  const title =
    ready.length === 1
      ? t('Loyalty.rewardWaiting', {
          reward: localizedText(first.prize.titleLocal, i18n.language) || first.prize.title,
          brand: first.brand.name,
        })
      : t('Loyalty.rewardsWaiting', { count: ready.length });
  const days = pickUpDaysLeft(soonest.validUntil, now);
  const urgency =
    days === 0 ? t('Loyalty.useToday') : days === 1 ? t('Loyalty.useTomorrow') : null;

  return (
    <Pressable
      onPress={() => (ready.length === 1 ? onOpenOne(first.id) : onOpenAll())}
      accessibilityRole="button"
      accessibilityLabel={urgency ? `${title}. ${urgency}` : title}
      className="mx-4 mt-3 flex-row items-center rounded-2xl border border-green-200 bg-green-50 px-3 py-3 active:opacity-80"
      style={{ minHeight: 72 }}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <Ionicons name="gift" size={26} color="#166534" />
      </View>
      <View className="ml-3 flex-1">
        <Text
          className="font-urbanist"
          style={{ fontSize: 18, lineHeight: 24, fontWeight: '700', color: '#14532D' }}
          numberOfLines={3}
          maxFontSizeMultiplier={1.5}
        >
          {title}
        </Text>
        {urgency ? (
          <Text
            className="mt-0.5 font-urbanist"
            style={{ fontSize: 16, lineHeight: 21, fontWeight: '700', color: '#B01E1E' }}
            maxFontSizeMultiplier={1.5}
          >
            {urgency}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#166534" />
    </Pressable>
  );
}
