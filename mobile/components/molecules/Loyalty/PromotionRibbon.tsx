import type { BrandPromotion } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { formatDayTimeInZone, formatNumber, formatTimeInZone } from '@/utils/formatPoints';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import type { TFunction } from 'i18next';

/** "Double points" / "Triple points" / "Points ×1.5". */
export const promotionHeadline = (t: TFunction, multiplierPercent: number): string => {
  if (multiplierPercent === 200) return t('Loyalty.promoDouble');
  if (multiplierPercent === 300) return t('Loyalty.promoTriple');
  return t('Loyalty.promoTimes', { x: formatNumber(multiplierPercent / 100) });
};

/** "Now, until 14:00" / "Now" / "From Thu 10:00", in the promotion's time zone. */
export const promotionTiming = (
  t: TFunction,
  promotion: Pick<BrandPromotion, 'isActiveNow' | 'activeUntil' | 'nextStartsAt' | 'timezone'>,
  lang: string,
): string | null => {
  if (promotion.isActiveNow) {
    return promotion.activeUntil
      ? t('Loyalty.promoNowUntil', {
          time: formatTimeInZone(promotion.activeUntil, promotion.timezone, lang),
        })
      : t('Loyalty.promoNow');
  }
  if (promotion.nextStartsAt) {
    return t('Loyalty.promoFrom', {
      when: formatDayTimeInZone(promotion.nextStartsAt, promotion.timezone, lang),
    });
  }
  return null;
};

/** Compact promotion line on My card (the full banner lives on brand pages). */
export function PromotionRibbon({ promotion }: { promotion: BrandPromotion }) {
  const { t, i18n } = useTranslation();
  const headline = promotionHeadline(t, promotion.multiplierPercent);
  const timing = promotionTiming(t, promotion, i18n.language);
  return (
    <View
      className="mt-3 flex-row items-center rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2"
      style={{ minHeight: 56 }}
      accessible
      accessibilityLabel={timing ? `${headline}. ${timing}` : headline}
    >
      <Ionicons name="sparkles" size={22} color="#92400E" />
      <View className="ml-2 flex-1">
        <Text
          className="font-urbanist"
          style={{ fontSize: 18, lineHeight: 23, fontWeight: '700', color: '#92400E' }}
          maxFontSizeMultiplier={1.5}
        >
          {headline}
        </Text>
        {timing ? (
          <Text
            className="font-urbanist"
            style={{ fontSize: 16, lineHeight: 21, color: '#92400E' }}
            maxFontSizeMultiplier={1.5}
          >
            {timing}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
