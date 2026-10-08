import { BrandLogo } from '@/components/atoms/BrandLogo';
import { CodeFormatToggle } from '@/components/molecules/Loyalty/CodeFormatToggle';
import { LoyaltyCode, spelledCode, useBarcodeAvailable } from '@/components/molecules/Loyalty/LoyaltyCode';
import { LoyaltyCodeFullscreen } from '@/components/molecules/Loyalty/LoyaltyCodeFullscreen';
import { BackHeader, COLORS, EmptyState, LText, PrimaryButton } from '@/components/molecules/Loyalty/ui';
import { pickUpDeadline } from '@/components/molecules/Rewards/ReadyToPickUpList';
import { isPastPickUp } from '@/utils/pickUp';
import { useCodeFormat } from '@/hooks/useCodeFormat';
import { useMyReward } from '@/hooks/useRewards';
import { localizedText } from '@/utils/localizedText';
import { formatDateTime, formatShortDate } from '@/utils/promotionFormat';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ActivityIndicator, LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/palette';

const QR_SIZE = 220;

/**
 * My reward (BRANDS_SPEC §5.5): the `PR-` code as QR or Code 128 (same
 * format preference as the card), 28px code, "Bigger and brighter". Staff
 * can also hand it over by scanning the card; the screen refetches on focus,
 * on a push and every few seconds while waiting, and flips to "Used".
 */
export default function MyRewardScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { data: reward, loading, error, refetch } = useMyReward(id ?? null);
  const [format, setFormat] = useCodeFormat();
  const [fullscreen, setFullscreen] = useState(false);
  const [width, setWidth] = useState(0);

  const code = reward?.qrCode ?? null;
  const barcodeOk = useBarcodeAvailable(code, width);
  const shown = format === 'barcode' && (!code || (width > 0 && !barcodeOk)) ? 'qr' : format;

  // Announce the hand-over when it happens while the screen is open.
  const wasRedeemed = useRef<boolean | null>(null);
  useEffect(() => {
    if (!reward) return;
    if (wasRedeemed.current === false && reward.isRedeemed) {
      AccessibilityInfo.announceForAccessibility(t('Prizes.usedEnjoy'));
      setFullscreen(false);
    }
    wasRedeemed.current = reward.isRedeemed;
  }, [reward, t]);

  if (loading && !reward) {
    return (
      <View className="flex-1 bg-mainBg">
        <BackHeader topInset={insets.top} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  if (!reward) {
    return (
      <View className="flex-1 bg-gray-50">
        <BackHeader topInset={insets.top} />
        {error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t('Prizes.loadFailed')}
            action={{ label: t('Loyalty.retry'), onPress: () => void refetch(), secondary: true }}
          />
        ) : (
          <EmptyState icon="gift-outline" title={t('Prizes.noLongerAvailable')} />
        )}
      </View>
    );
  }

  const lang = i18n.language;
  const title = localizedText(reward.prize.titleLocal, lang) || reward.prize.title;
  const brandName = reward.brand.name;
  // The date too, not only the server flags (review #6).
  const expired = reward.isExpired || isPastPickUp(reward.validUntil);
  const usable = !reward.isRedeemed && reward.isRedeemableNow && !expired;
  const deadline = pickUpDeadline(t, reward.validUntil, lang);
  const codeLabel = t('Prizes.codeA11y', { spelled: spelledCode(reward.qrCode) });

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <BackHeader title={title} topInset={insets.top} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Pressable
          onPress={() => router.push(`/brand/${reward.brandId}` as never)}
          accessibilityRole="button"
          accessibilityLabel={brandName}
          className="mx-4 mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white px-3 active:opacity-80"
          style={{ minHeight: 64 }}
        >
          <BrandLogo brand={reward.brand} size={44} />
          <LText size={20} weight="700" numberOfLines={2} className="ml-3 flex-1">
            {brandName}
          </LText>
          <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} />
        </Pressable>

        {fresh === '1' && usable ? (
          <View
            className="mx-4 mt-3 flex-row items-start rounded-2xl border-2 border-green-300 bg-green-50 p-3"
            accessible
            accessibilityLiveRegion="polite"
          >
            <Ionicons name="checkmark-circle" size={28} color={COLORS.green} />
            <View className="ml-2 flex-1">
              <LText size={20} weight="700" color="#14532D">
                {t('Prizes.freshTitle')}
              </LText>
              <LText size={18} color="#14532D">
                {t('Prizes.freshBody', { brand: brandName, date: formatShortDate(reward.validUntil, lang) })}
              </LText>
            </View>
          </View>
        ) : null}

        {reward.isRedeemed ? (
          <View className="mx-4 mt-4 items-center rounded-3xl border border-gray-200 bg-white p-6" accessible>
            <View className="h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="checkmark-done" size={44} color={COLORS.green} />
            </View>
            <LText size={26} weight="700" className="mt-3 text-center">
              {t('Prizes.usedEnjoy')}
            </LText>
            {reward.redeemedAt ? (
              <LText size={18} color={COLORS.secondary} className="mt-2 text-center">
                {reward.redeemedAtSpot?.name
                  ? t('Prizes.pickedUpAt', { spot: reward.redeemedAtSpot.name, date: formatDateTime(reward.redeemedAt, lang) })
                  : t('Prizes.redeemedOn', { date: formatDateTime(reward.redeemedAt, lang) })}
              </LText>
            ) : null}
          </View>
        ) : !usable ? (
          <EmptyState
            icon="time-outline"
            title={expired ? t('Prizes.expiredTitle') : t('Prizes.notUsableNow')}
            body={expired ? null : t('Brand.pausedTitle', { brand: brandName })}
          />
        ) : (
          <>
            <View className="mx-4 mt-3 rounded-3xl border border-gray-200 bg-white p-3">
              <LText size={20} weight="700" accessibilityRole="header">
                {t('Prizes.codeTitle')}
              </LText>
              <View className="mt-2">
                <CodeFormatToggle
                  value={shown}
                  onChange={setFormat}
                  barcodeDisabled={!code || (width > 0 && !barcodeOk)}
                />
              </View>
              <View onLayout={onLayout} className="mt-3 items-center justify-center" style={{ minHeight: QR_SIZE }}>
                {width > 0 ? (
                  <LoyaltyCode
                    code={code}
                    format={format}
                    width={width}
                    qrSize={Math.min(QR_SIZE, width)}
                    barcodeHeight={160}
                    accessibilityLabel={codeLabel}
                  />
                ) : null}
              </View>
              <View className="mt-3 items-center" accessible accessibilityLabel={codeLabel}>
                <LText size={16} color={COLORS.secondary}>
                  {t('Prizes.claimCode')}
                </LText>
                <LText
                  selectable
                  size={28}
                  lineHeight={36}
                  color={COLORS.text}
                  max={1}
                  style={{ fontFamily: 'SpaceMono', letterSpacing: 0.5 }}
                >
                  {reward.qrCode}
                </LText>
              </View>
              <View className="mt-3">
                <PrimaryButton label={t('LoyaltyCode.bigger')} icon="sunny" onPress={() => setFullscreen(true)} />
              </View>
            </View>

            {deadline.text ? (
              <View className="mx-4 mt-3 flex-row items-center">
                <Ionicons
                  name={deadline.urgent ? 'alarm-outline' : 'calendar-outline'}
                  size={22}
                  color={deadline.urgent ? COLORS.danger : THEME.text}
                />
                <LText
                  size={18}
                  weight={deadline.urgent ? '700' : '400'}
                  color={deadline.urgent ? COLORS.danger : THEME.text}
                  className="ml-2 flex-1"
                >
                  {deadline.text}
                </LText>
              </View>
            ) : null}
            <LText size={18} color={THEME.text} className="mx-4 mt-2">
              {t('Prizes.showAtCounter', { brand: brandName })}
            </LText>
            <LText size={16} color={COLORS.secondary} className="mx-4 mt-2">
              {t('Prizes.staffCanScan')}
            </LText>
          </>
        )}
      </ScrollView>

      <LoyaltyCodeFullscreen
        visible={fullscreen && usable}
        onClose={() => setFullscreen(false)}
        code={reward.qrCode}
        codeLabel={codeLabel}
        isReward
      />
    </View>
  );
}
