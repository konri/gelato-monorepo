import { BrandLogo } from '@/components/atoms/BrandLogo';
import type { LastGain } from '@/hooks/useBrands';
import type { LoyaltyCity, LoyaltyWallet } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { localizedCityName } from '@/utils/cityMatch';
import { formatNumber, pointsText } from '@/utils/formatPoints';
import type { LoyaltyMode } from '@/utils/loyaltyMode';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { THEME } from '@/constants/palette';

type Props = {
  mode: LoyaltyMode;
  wallet: LoyaltyWallet | null;
  /**
   * A paused brand's wallet with points, if any. In the "no points" modes it
   * replaces "No points yet": those saved points may be all the user has.
   */
  pausedWallet?: LoyaltyWallet | null;
  city: LoyaltyCity | null;
  /** "Updated 10:42" / offline line under the strip text. */
  statusLine?: string | null;
  lastGain?: LastGain | null;
  onChange: () => void;
  onInfo: (brandId: string) => void;
  onChooseCity: () => void;
  onDiscover: () => void;
  onRetry: () => void;
};

const GAIN_BADGE_MS = 5000;

/**
 * My card, top: ≤ 120dp (BRANDS_SPEC §5.3/§5.4). Logo, brand name, points and
 * "Change ⌄" (MULTI) or "Info ›"; the E = 0 modes show "No points yet" with
 * one next step. The whole strip is one big touch target.
 */
export function LoyaltyPointsStrip({
  mode,
  wallet,
  pausedWallet,
  city,
  statusLine,
  lastGain,
  onChange,
  onInfo,
  onChooseCity,
  onDiscover,
  onRetry,
}: Props) {
  const { t, i18n } = useTranslation();
  const cityName = city ? localizedCityName(city, i18n.language) : '';
  // "{brand}: 500 points saved · paused" instead of "No points yet" (A4: the
  // brand's own name, never inflected).
  const noPointsTitle =
    pausedWallet && pausedWallet.paused && pausedWallet.availablePoints > 0
      ? t('Loyalty.pausedSaved', {
          brand: pausedWallet.brand.name,
          pointsText: pointsText(t, pausedWallet.availablePoints),
        })
      : t('Loyalty.noPointsYet');

  // "+50" next to the number for a few seconds after a credit here.
  const [now, setNow] = useState(() => Date.now());
  const gainHere =
    lastGain && wallet && lastGain.brandId === wallet.brand.id && now - lastGain.at < GAIN_BADGE_MS
      ? lastGain.change
      : 0;
  useEffect(() => {
    if (!lastGain) return;
    setNow(Date.now());
    const left = GAIN_BADGE_MS - (Date.now() - lastGain.at);
    if (left <= 0) return;
    const id = setTimeout(() => setNow(Date.now()), left + 50);
    return () => clearTimeout(id);
  }, [lastGain]);

  if (mode.kind === 'LOADING') {
    return (
      <Shell>
        <View className="h-12 w-12 rounded-full bg-gray-200" />
        <View className="ml-3 flex-1">
          <View className="h-5 w-40 rounded bg-gray-200" />
          <View className="mt-2 h-5 w-24 rounded bg-gray-200" />
        </View>
        <ActivityIndicator color={THEME.primaryDark} />
      </Shell>
    );
  }

  if (mode.kind === 'ERROR') {
    return (
      <Shell onPress={onRetry} a11yLabel={`${t('Loyalty.loadFailed')} ${t('Loyalty.retry')}`}>
        <IconCircle name="cloud-offline-outline" />
        <TextColumn title={t('Loyalty.loadFailed')} subtitle={statusLine} />
        <Trailing label={t('Loyalty.retry')} icon="refresh" />
      </Shell>
    );
  }

  if (mode.kind === 'NO_CITY') {
    return (
      <Shell onPress={onChooseCity} a11yLabel={`${noPointsTitle}. ${t('Loyalty.chooseCityLink')}`}>
        <IconCircle name="location-outline" />
        <TextColumn title={noPointsTitle} subtitle={t('Loyalty.chooseCityLink')} link />
        <Ionicons name="chevron-forward" size={24} color={THEME.primaryDark} />
      </Shell>
    );
  }

  if (mode.kind === 'NO_BRANDS_IN_CITY') {
    return (
      <Shell a11yLabel={`${noPointsTitle}. ${t('Loyalty.noRewardsInCity', { city: cityName })}`}>
        <IconCircle name="star-outline" />
        <TextColumn
          title={noPointsTitle}
          subtitle={cityName ? t('Loyalty.noRewardsInCity', { city: cityName }) : statusLine}
        />
      </Shell>
    );
  }

  if (mode.kind === 'MANY_TO_DISCOVER') {
    const subtitle = cityName
      ? t('Loyalty.discoverInCity', { city: cityName })
      : t('Loyalty.discoverNoCity');
    return (
      <Shell onPress={onDiscover} a11yLabel={`${noPointsTitle}. ${subtitle}`}>
        <IconCircle name="star-outline" />
        <TextColumn title={noPointsTitle} subtitle={subtitle} link />
        <Ionicons name="chevron-forward" size={24} color={THEME.primaryDark} />
      </Shell>
    );
  }

  // SINGLE, MULTI, ONE_TO_DISCOVER: a brand.
  const brand = wallet?.brand;
  if (!brand) return null;
  const points = wallet?.availablePoints ?? 0;
  const ptsText = pointsText(t, points);
  const isMulti = mode.kind === 'MULTI';
  const a11yLabel = t(isMulti ? 'Loyalty.a11yChange' : 'Loyalty.a11yInfo', {
    brand: brand.name,
    points: ptsText,
  });

  return (
    <Shell onPress={isMulti ? onChange : () => onInfo(brand.id)} a11yLabel={a11yLabel}>
      <BrandLogo brand={brand} size={48} />
      <View className="ml-3 flex-1">
        <Text
          className="font-urbanist text-gray-900"
          style={{ fontSize: 18, lineHeight: 23, fontWeight: '700' }}
          numberOfLines={2}
          maxFontSizeMultiplier={1.4}
        >
          {brand.name}
        </Text>
        <View className="mt-0.5 flex-row flex-wrap items-baseline">
          <Text
            className="font-urbanist"
            style={{ fontSize: 20, lineHeight: 26, fontWeight: '700', color: THEME.primaryDark }}
            maxFontSizeMultiplier={1.4}
          >
            {ptsText}
          </Text>
          {gainHere > 0 ? (
            <Text
              className="ml-2 font-urbanist"
              style={{ fontSize: 18, fontWeight: '700', color: '#166534' }}
              maxFontSizeMultiplier={1.4}
            >
              +{formatNumber(gainHere)}
            </Text>
          ) : null}
        </View>
        {statusLine ? <StatusText text={statusLine} /> : null}
      </View>
      {isMulti ? (
        <Trailing label={t('Loyalty.change')} icon="chevron-down" />
      ) : (
        <Trailing label={t('Loyalty.info')} icon="chevron-forward" />
      )}
    </Shell>
  );
}

function Shell({
  children,
  onPress,
  a11yLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  a11yLabel?: string;
}) {
  // ≤ 120dp at normal text size (2-line name + points + status); no hard cap
  // so large font sizes wrap instead of clipping.
  const style = { minHeight: 72 } as const;
  const className = 'mx-4 mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white px-3 py-2';
  if (!onPress) {
    return (
      <View className={className} style={style} accessible accessibilityLabel={a11yLabel}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      className={`${className} active:opacity-80`}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      {children}
    </Pressable>
  );
}

function IconCircle({ name }: { name: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-amber-100">
      <Ionicons name={name} size={26} color="#92400E" />
    </View>
  );
}

function TextColumn({
  title,
  subtitle,
  link = false,
}: {
  title: string;
  subtitle?: string | null;
  link?: boolean;
}) {
  return (
    <View className="ml-3 flex-1">
      <Text
        className="font-urbanist text-gray-900"
        style={{ fontSize: 18, lineHeight: 23, fontWeight: '700' }}
        numberOfLines={3}
        maxFontSizeMultiplier={1.4}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="mt-0.5 font-urbanist"
          style={{ fontSize: 16, lineHeight: 21, color: link ? THEME.primaryDark : THEME.textSecondary, fontWeight: link ? '700' : '500' }}
          numberOfLines={2}
          maxFontSizeMultiplier={1.4}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function StatusText({ text }: { text: string }) {
  return (
    <Text
      className="font-urbanist"
      style={{ fontSize: 16, lineHeight: 20, color: THEME.textSecondary }}
      numberOfLines={1}
      maxFontSizeMultiplier={1.3}
    >
      {text}
    </Text>
  );
}

function Trailing({
  label,
  icon,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View
      className="ml-2 flex-row items-center rounded-full bg-berry-wash px-3"
      style={{ minHeight: 48 }}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Text
        className="font-urbanist"
        style={{ fontSize: 17, fontWeight: '700', color: THEME.primaryDark }}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
      <Ionicons name={icon} size={18} color={THEME.primaryDark} style={{ marginLeft: 2 }} />
    </View>
  );
}
