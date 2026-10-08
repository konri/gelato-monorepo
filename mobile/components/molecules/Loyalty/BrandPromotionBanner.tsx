import type { BrandPromotion } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { localizedText } from '@/utils/localizedText';
import { formatLocalDate, formatWindows } from '@/utils/promotionFormat';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { promotionHeadline, promotionTiming } from './PromotionRibbon';
import { COLORS, LText } from './ui';
import { THEME } from '@/constants/palette';

type Props = {
  promotion: BrandPromotion;
  /** Hide the "where" line (e.g. on a location's own page). */
  hideScope?: boolean;
  /** No side margins (inside an already padded screen). */
  flush?: boolean;
  /** Name the brand on top (lists that mix brands). */
  showBrand?: boolean;
};

/**
 * The full promotion (BRANDS_SPEC §5.6): "Double points · Now, until 14:00"
 * (times in the promotion's own zone), the schedule as stored, where it
 * applies and to what. My card shows the compact `PromotionRibbon` instead.
 */
export function BrandPromotionBanner({ promotion, hideScope = false, flush = false, showBrand = false }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const headline = promotionHeadline(t, promotion.multiplierPercent);
  const timing = promotionTiming(t, promotion, lang);
  const title = localizedText(promotion.titleLocal, lang) || promotion.title;
  const description = localizedText(promotion.descriptionLocal, lang) || promotion.description || '';
  const schedule = formatWindows(promotion.windows, lang, t('Promo.everyDay'));

  const from = formatLocalDate(promotion.startsOn, lang);
  const until = formatLocalDate(promotion.endsOn, lang);
  const dates =
    from && until
      ? t('Promo.dates', { from, until })
      : until
        ? t('Promo.until', { date: until })
        : from
          ? t('Promo.from', { date: from })
          : null;

  const scope = promotion.spotNames.length
    ? t('Promo.atSpots', { spots: promotion.spotNames.join(', ') })
    : t('Promo.atAll', { brand: promotion.brandName });

  const appliesTo =
    promotion.appliesToOrders && promotion.appliesToTemplateAwards
      ? t('Promo.appliesBoth')
      : promotion.appliesToOrders
        ? t('Promo.appliesOrders')
        : t('Promo.appliesCounter');

  const lines = [title !== headline ? title : null, description || null].filter(Boolean) as string[];
  const a11y = [showBrand ? promotion.brandName : null, headline, timing, ...lines, ...schedule, dates, hideScope ? null : scope, appliesTo]
    .filter(Boolean)
    .join('. ');

  return (
    <View
      className={`${flush ? '' : 'mx-4 '}mt-3 rounded-3xl border border-amber-300 bg-amber-50 p-4`}
      accessible
      accessibilityLabel={a11y}
    >
      {showBrand ? (
        <LText size={18} weight="700" color={THEME.text} className="mb-2" numberOfLines={2}>
          {promotion.brandName}
        </LText>
      ) : null}
      <View className="flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-amber-100">
          <Ionicons name="sparkles" size={24} color={COLORS.amber} />
        </View>
        <View className="ml-3 flex-1">
          <LText size={20} weight="700" color={COLORS.amber}>
            {headline}
          </LText>
          {timing ? (
            <LText size={18} weight="600" color={COLORS.amber}>
              {timing}
            </LText>
          ) : null}
        </View>
      </View>

      {lines.map((line) => (
        <LText key={line} size={18} className="mt-2" color={THEME.text}>
          {line}
        </LText>
      ))}

      <View className="mt-2">
        {schedule.map((line) => (
          <Detail key={line} icon="time-outline" text={line} />
        ))}
        {dates ? <Detail icon="calendar-outline" text={dates} /> : null}
        {hideScope ? null : <Detail icon="location-outline" text={scope} />}
        <Detail icon="checkmark-circle-outline" text={appliesTo} />
      </View>
    </View>
  );
}

function Detail({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View className="mt-1 flex-row items-start">
      <Ionicons name={icon} size={20} color={THEME.text} style={{ marginTop: 2 }} />
      <LText size={16} color={THEME.text} className="ml-2 flex-1">
        {text}
      </LText>
    </View>
  );
}
