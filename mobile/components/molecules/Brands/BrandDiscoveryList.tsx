import { BrandLogo } from '@/components/atoms/BrandLogo';
import { Badge, COLORS, LText, SectionTitle } from '@/components/molecules/Loyalty/ui';
import { useBrandsInCity } from '@/hooks/useRewards';
import type {
  BrandPromotion,
  LoyaltyWallet,
  WalletBrand,
} from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { formatNumber, pointsText } from '@/utils/formatPoints';
import { localizedText } from '@/utils/localizedText';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { THEME } from '@/constants/palette';

type Props = {
  cityId: string | null;
  cityName: string;
  /** The user's own wallets (not paused), listed first. */
  yours: LoyaltyWallet[];
  /** Overview wallets of the city, used when the city list cannot be loaded. */
  cityFallback?: LoyaltyWallet[];
};

/**
 * Where points can be collected (BRANDS_SPEC §5.5): the brands the user
 * already collects at, then every brand of the city with its locations,
 * rewards, birthday gift and a "×2 now" chip. A row opens the brand page.
 * A4: rows show the brand's own name only, never a generic noun.
 */
export function BrandDiscoveryList({ cityId, cityName, yours, cityFallback = [] }: Props) {
  const { t } = useTranslation();
  const { data, loading, error } = useBrandsInCity(cityId);
  const yourIds = new Set(yours.map((w) => w.brand.id));
  const byId = new Map((data ?? []).map((b) => [b.id, b]));

  const cityRows: RowData[] = data
    ? data
        .filter((b) => !yourIds.has(b.id))
        .map((b) => ({
          brand: b,
          spotCount: b.spotCount,
          promotion: b.activePromotions.find((p) => p.isActiveNow) ?? null,
        }))
    : error
      ? cityFallback
          .filter((w) => !yourIds.has(w.brand.id) && !w.paused)
          .map((w) => ({ brand: w.brand, promotion: activeNow(w.activePromotion) }))
      : [];

  return (
    <View>
      {yours.length > 0 ? (
        <>
          <SectionTitle text={t('Brand.yoursTitle')} />
          {yours.map((w) => (
            <DiscoveryRow
              key={w.brand.id}
              row={{
                brand: w.brand,
                spotCount: byId.get(w.brand.id)?.spotCount,
                promotion: activeNow(w.activePromotion),
                points: w.availablePoints,
              }}
            />
          ))}
        </>
      ) : null}

      {cityId ? (
        <>
          <SectionTitle text={cityName ? t('Brand.cityTitle', { city: cityName }) : t('Brand.discoverTitle')} />
          {loading && !data ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : cityRows.length === 0 ? (
            <View className="mx-4 mt-3 rounded-2xl border border-gray-200 bg-white p-4">
              <LText size={18} color={COLORS.secondary}>
                {yours.length > 0 ? t('Brand.noMoreInCity') : t('Brand.noneInCity')}
              </LText>
            </View>
          ) : (
            cityRows.map((row) => <DiscoveryRow key={row.brand.id} row={row} />)
          )}
        </>
      ) : null}
    </View>
  );
}

const activeNow = (p?: BrandPromotion | null) => (p && p.isActiveNow ? p : null);

type RowData = {
  brand: Pick<
    WalletBrand,
    'id' | 'name' | 'logoUrl' | 'description' | 'descriptionLocal' | 'rewardCount' | 'birthdayBonusPoints'
  >;
  spotCount?: number;
  promotion?: BrandPromotion | null;
  /** The user's points there (own wallets only). */
  points?: number;
};

export function DiscoveryRow({ row }: { row: RowData }) {
  const { t, i18n } = useTranslation();
  const { brand, spotCount, promotion, points } = row;
  const description = localizedText(brand.descriptionLocal, i18n.language) || brand.description || '';
  const meta = [
    spotCount != null ? t('Brand.locations', { count: spotCount }) : null,
    t('Brand.rewards', { count: brand.rewardCount }),
  ]
    .filter(Boolean)
    .join(' · ');
  const birthday = brand.birthdayBonusPoints > 0 ? t('Brand.birthdayChip') : null;
  const promo = promotion ? t('Promo.chipNow', { x: formatNumber(promotion.multiplierPercent / 100) }) : null;
  const pointsLine = points != null ? t('Brand.yourPointsHere', { pointsText: pointsText(t, points) }) : null;

  return (
    <Pressable
      onPress={() => router.push(`/brand/${brand.id}` as never)}
      accessibilityRole="button"
      accessibilityLabel={[brand.name, pointsLine, meta, promo, birthday, description].filter(Boolean).join('. ')}
      className="mx-4 mt-3 flex-row items-start rounded-2xl border border-gray-200 bg-white p-3 active:opacity-80"
      style={{ minHeight: 72 }}
    >
      <BrandLogo brand={brand} size={56} />
      <View className="ml-3 flex-1">
        <LText size={20} weight="700" numberOfLines={2} max={1.4}>
          {brand.name}
        </LText>
        {pointsLine ? (
          <LText size={16} weight="700" color={COLORS.brand}>
            {pointsLine}
          </LText>
        ) : null}
        {description ? (
          <LText size={16} color={COLORS.secondary} numberOfLines={2}>
            {description}
          </LText>
        ) : null}
        <LText size={16} color={THEME.text} className="mt-0.5">
          {meta}
        </LText>
        {promo || birthday ? (
          <View className="mt-1.5 flex-row flex-wrap" style={{ gap: 6 }}>
            {promo ? <Badge tone="amber" icon="sparkles" text={promo} /> : null}
            {birthday ? <Badge tone="grey" icon="balloon-outline" text={birthday} /> : null}
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} style={{ alignSelf: 'center', marginLeft: 4 }} />
    </Pressable>
  );
}

function SkeletonRow() {
  return (
    <View
      className="mx-4 mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white p-3"
      style={{ minHeight: 88 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View className="rounded-full bg-gray-200" style={{ width: 56, height: 56 }} />
      <View className="ml-3 flex-1">
        <View className="h-5 w-1/2 rounded bg-gray-200" />
        <View className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
      </View>
    </View>
  );
}
