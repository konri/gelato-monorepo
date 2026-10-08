import { BrandLogo } from '@/components/atoms/BrandLogo';
import { BackHeader, COLORS, LText, PrimaryButton } from '@/components/molecules/Loyalty/ui';
import { useBrands } from '@/hooks/useBrands';
import { usePointTransactions } from '@/hooks/usePointTransactions';
import type { PointTransaction } from '@repo/api-client';
import { formatNumber } from '@/utils/formatPoints';
import { formatDateTime } from '@/utils/promotionFormat';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/palette';

type Icon = React.ComponentProps<typeof Ionicons>['name'];

const KNOWN_SOURCES = new Set([
  'ORDER',
  'ORDER_APOLOGY',
  'ORDER_REVERSAL',
  'STAFF_TEMPLATE',
  'STAFF_CUSTOM',
  'REFERRAL_REFERRER',
  'REFERRAL_REFEREE',
  'BIRTHDAY',
  'PRIZE_CLAIM',
  'PRIZE_REFUND',
  'ADMIN_ADJUSTMENT',
]);

const ICONS: Record<string, { name: Icon; color: string; bg: string }> = {
  ORDER: { name: 'bag-handle-outline', color: '#166534', bg: '#DCFCE7' },
  ORDER_APOLOGY: { name: 'heart-outline', color: '#9D174D', bg: '#FCE7F3' },
  ORDER_REVERSAL: { name: 'arrow-undo-outline', color: THEME.text, bg: THEME.neutralFill },
  STAFF_TEMPLATE: { name: 'qr-code-outline', color: '#1D4ED8', bg: '#DBEAFE' },
  STAFF_CUSTOM: { name: 'qr-code-outline', color: '#1D4ED8', bg: '#DBEAFE' },
  REFERRAL_REFERRER: { name: 'people-outline', color: '#9D174D', bg: '#FCE7F3' },
  REFERRAL_REFEREE: { name: 'people-outline', color: '#9D174D', bg: '#FCE7F3' },
  BIRTHDAY: { name: 'balloon-outline', color: '#6D28D9', bg: '#EDE9FE' },
  PRIZE_CLAIM: { name: 'gift-outline', color: COLORS.brand, bg: THEME.primaryPale },
  PRIZE_REFUND: { name: 'arrow-undo-outline', color: '#92400E', bg: '#FEF3C7' },
  ADMIN_ADJUSTMENT: { name: 'create-outline', color: THEME.text, bg: THEME.neutralFill },
};
const DEFAULT_ICON = { name: 'star-outline' as Icon, color: '#92400E', bg: '#FEF3C7' };

/** The row title comes from `source` (BRANDS_SPEC §5.6); `description` only when unknown. */
export const transactionTitle = (t: TFunction, tx: PointTransaction): string => {
  const source = tx.source ?? '';
  if (!KNOWN_SOURCES.has(source)) return tx.description;
  if (source === 'STAFF_TEMPLATE' || source === 'STAFF_CUSTOM') {
    return tx.spot?.name
      ? t('History.source.COUNTER', { spot: tx.spot.name })
      : t('History.source.COUNTER_BRAND', { brand: tx.brand.name });
  }
  return t(`History.source.${source}`, { brand: tx.brand.name });
};

/** The order a row belongs to (ORDER / ORDER_APOLOGY), for the tracking link. */
const orderIdOf = (tx: PointTransaction): string | null =>
  tx.referenceId && (tx.referenceType === 'order' || tx.referenceType === 'order_apology')
    ? tx.referenceId
    : null;

/**
 * Points history (BRANDS_SPEC §5.6): titles from the ledger source, a real
 * minus for spent points, the order link to /order/track/{id}, a "×2" chip
 * for promotions. In MULTI it shows the selected brand, with "All" as an
 * option.
 */
export default function PointsHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { mode, selectedWallet } = useBrands();
  const [all, setAll] = useState(false);
  const filterBrand = mode.kind === 'MULTI' && selectedWallet && !all ? selectedWallet.brand : null;
  const { data: transactions, loading, refetch } = usePointTransactions(filterBrand?.id ?? null);

  const renderRow = ({ item: tx }: { item: PointTransaction }) => {
    const icon = ICONS[tx.source ?? ''] ?? DEFAULT_ICON;
    const title = transactionTitle(t, tx);
    const orderId = orderIdOf(tx);
    const spent = tx.amount < 0;
    const amount = `${spent ? '−' : '+'}${formatNumber(Math.abs(tx.amount), i18n.language)}`;
    const multiplied = tx.multiplierPercent > 100;
    const when = formatDateTime(tx.createdAt, i18n.language);
    const a11y = [
      title,
      t(spent ? 'History.a11ySpent' : 'History.a11yAdded', { count: Math.abs(tx.amount) }),
      multiplied ? t('History.a11yMultiplied', { x: formatNumber(tx.multiplierPercent / 100) }) : null,
      tx.brand.name,
      when,
    ]
      .filter(Boolean)
      .join('. ');

    const content = (
      <>
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: icon.bg }}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        <View className="flex-1">
          <LText size={18} weight="700" numberOfLines={3}>
            {title}
          </LText>
          <View className="mt-0.5 flex-row flex-wrap items-center">
            <BrandLogo brand={tx.brand} size={20} />
            <LText size={16} color={COLORS.secondary} className="ml-1.5" style={{ flexShrink: 1 }}>
              {`${tx.brand.name} · ${when}`}
            </LText>
          </View>
        </View>
        <View className="ml-2 items-end">
          <LText size={20} weight="700" color={spent ? COLORS.text : COLORS.green} max={1.3}>
            {amount}
          </LText>
          {multiplied ? (
            <View className="mt-1 flex-row items-center rounded-full bg-amber-100 px-2 py-0.5">
              <Ionicons name="sparkles" size={14} color={COLORS.amber} />
              <LText size={16} weight="700" color={COLORS.amber} className="ml-1" max={1.3}>
                {`×${formatNumber(tx.multiplierPercent / 100)}`}
              </LText>
            </View>
          ) : null}
        </View>
        {orderId ? <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} style={{ marginLeft: 6 }} /> : null}
      </>
    );

    const className = 'mx-4 mb-3 flex-row items-center rounded-2xl border border-gray-200 bg-white px-3 py-3';
    return orderId ? (
      <Pressable
        onPress={() => router.push(`/order/track/${orderId}` as never)}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        className={`${className} active:opacity-80`}
        style={{ minHeight: 72 }}
      >
        {content}
      </Pressable>
    ) : (
      <View className={className} style={{ minHeight: 72 }} accessible accessibilityLabel={a11y}>
        {content}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <BackHeader title={t('PointsHistory.title')} topInset={insets.top} />
      <FlatList
        data={transactions ?? []}
        renderItem={renderRow}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl refreshing={loading && !!transactions} onRefresh={refetch} tintColor={COLORS.accent} colors={[COLORS.accent]} />
        }
        ListHeaderComponent={
          <View className="mx-4 mb-3">
            <LText size={18} color={COLORS.secondary}>
              {t('PointsHistory.subtitle')}
            </LText>
            {mode.kind === 'MULTI' && selectedWallet ? (
              <View className="mt-3 flex-row" accessibilityRole="radiogroup" style={{ gap: 8 }}>
                <FilterChip
                  label={selectedWallet.brand.name}
                  selected={!all}
                  onPress={() => setAll(false)}
                  logo={selectedWallet.brand}
                />
                <FilterChip label={t('History.all')} selected={all} onPress={() => setAll(true)} />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View className="items-center px-8 py-16">
              <Ionicons name="star-outline" size={64} color={THEME.placeholder} />
              <LText size={20} weight="700" className="mt-4 text-center">
                {t('PointsHistory.emptyTitle')}
              </LText>
              <LText size={18} color={COLORS.secondary} className="mt-2 text-center">
                {t('PointsHistory.emptySubtitle')}
              </LText>
              <View className="mt-6 self-stretch">
                <PrimaryButton
                  label={t('PointsHistory.startOrdering')}
                  onPress={() => router.navigate('/(tabs)/ordering' as never)}
                />
              </View>
            </View>
          )
        }
      />
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
  logo,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  logo?: { id: string; name: string; logoUrl?: string | null };
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={label}
      className="flex-row items-center rounded-full px-3 active:opacity-80"
      style={{
        minHeight: 48,
        flexShrink: 1,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? COLORS.accent : COLORS.border,
        backgroundColor: selected ? '#FEF2F2' : '#FFFFFF',
      }}
    >
      {logo ? <BrandLogo brand={logo} size={24} /> : null}
      <LText size={17} weight={selected ? '700' : '500'} className={logo ? 'ml-2' : ''} numberOfLines={1} max={1.3}>
        {label}
      </LText>
    </Pressable>
  );
}
