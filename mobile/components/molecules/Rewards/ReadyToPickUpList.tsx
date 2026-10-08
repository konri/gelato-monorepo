import { BrandLogo } from '@/components/atoms/BrandLogo';
import { Image } from '@/components/atoms/Image';
import { COLORS, LText, PrimaryButton, SectionTitle } from '@/components/molecules/Loyalty/ui';
import type { ReadyToPickUpItem } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { localizedText } from '@/utils/localizedText';
import { isPickUpOpen, pickUpDaysLeft } from '@/utils/pickUp';
import { formatShortDate } from '@/utils/promotionFormat';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * "Pick it up today" / "… today or tomorrow" / "… by 14 Oct", from the date
 * itself (device calendar). Nothing once the deadline has passed: a stale
 * snapshot must never say "today" for a reward that already expired.
 */
export const pickUpDeadline = (
  t: TFunction,
  validUntil: string,
  lang: string,
  now: number = Date.now(),
): { text: string; urgent: boolean } => {
  const days = pickUpDaysLeft(validUntil, now);
  if (days == null) return { text: '', urgent: false };
  if (days === 0) return { text: t('Loyalty.useToday'), urgent: true };
  if (days === 1) return { text: t('Loyalty.useTomorrow'), urgent: true };
  return { text: t('Prizes.useBy', { date: formatShortDate(validUntil, lang) }), urgent: false };
};

/**
 * Rewards claimed in the app and waiting to be picked up, from EVERY brand,
 * each with its brand label (BRANDS_SPEC §5.3, §5.5). Shown above the brand
 * switcher in every mode.
 */
export function ReadyToPickUpList({ items }: { items: ReadyToPickUpItem[] }) {
  const { t, i18n } = useTranslation();
  const now = Date.now();
  const ready = items.filter((i) => isPickUpOpen(i, now));
  if (ready.length === 0) return null;

  return (
    <View>
      <SectionTitle text={t('Prizes.readyTitle')} />
      {ready.map((item) => {
        const title = localizedText(item.prize.titleLocal, i18n.language) || item.prize.title;
        const deadline = pickUpDeadline(t, item.validUntil, i18n.language, now);
        return (
          <View
            key={item.id}
            className="mx-4 mt-3 rounded-3xl border-2 border-green-200 bg-green-50 p-3"
          >
            <View
              className="flex-row items-center"
              accessible
              accessibilityLabel={[title, item.brand.name, deadline.text].filter(Boolean).join('. ')}
            >
              <Image
                url={item.prize.imageUrl ?? undefined}
                resizeMode="cover"
                style={{ width: 64, height: 64, borderRadius: 14 }}
                fallbackWidth={64}
                fallbackHeight={64}
                fallbackLogoSize={24}
              />
              <View className="ml-3 flex-1">
                <LText size={20} weight="700" color="#14532D" numberOfLines={3}>
                  {title}
                </LText>
                <View className="mt-1 flex-row items-center">
                  <BrandLogo brand={item.brand} size={24} />
                  <LText size={16} weight="600" color="#14532D" className="ml-2 flex-1" numberOfLines={2}>
                    {item.brand.name}
                  </LText>
                </View>
                {deadline.text ? (
                  <View className="mt-1 flex-row items-center">
                    <Ionicons
                      name={deadline.urgent ? 'alarm-outline' : 'calendar-outline'}
                      size={18}
                      color={deadline.urgent ? COLORS.danger : COLORS.secondary}
                    />
                    <LText
                      size={16}
                      weight={deadline.urgent ? '700' : '400'}
                      color={deadline.urgent ? COLORS.danger : COLORS.secondary}
                      className="ml-1"
                    >
                      {deadline.text}
                    </LText>
                  </View>
                ) : null}
              </View>
            </View>
            <View className="mt-3">
              <PrimaryButton
                label={t('Prizes.showCode')}
                icon="qr-code-outline"
                onPress={() => router.push(`/prize/mine/${item.id}` as never)}
              />
            </View>
          </View>
        );
      })}
      <View className="mx-4 mt-2 flex-row items-start">
        <Ionicons name="information-circle-outline" size={20} color={COLORS.secondary} style={{ marginTop: 2 }} />
        <LText size={16} color={COLORS.secondary} className="ml-2 flex-1">
          {t('Prizes.staffCanScan')}
        </LText>
      </View>
    </View>
  );
}
