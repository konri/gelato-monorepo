import { Typography } from '@/components/atoms/Typography';
import { formatMultiplier, formatShortDateTime, localText } from '@/utils/loyaltyDisplay';
import { getBrandPromotions, type BrandPromotion } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const REFRESH_MS = 5 * 60 * 1000;

function Banner({ text }: { text: string }) {
  return (
    <View
      className="flex-row items-center rounded-2xl px-4 py-3"
      style={{ backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74' }}
      accessibilityRole="text"
    >
      <Ionicons name="flash" size={20} color="#C2410C" />
      <Typography variant="body-base-semibold" className="ml-2 flex-1" style={{ color: '#7C2D12' }}>
        {text}
      </Typography>
    </View>
  );
}

/** Customer screen: the counter-award multiplier active right now (`activeMultiplierPercent`). */
export function PromotionBanner({ multiplierPercent }: { multiplierPercent: number | null | undefined }) {
  const { t, i18n } = useTranslation();
  if (!multiplierPercent || multiplierPercent <= 100) return null;
  return <Banner text={t('Scan.promoCustomer', { m: formatMultiplier(multiplierPercent, i18n.language) })} />;
}

/**
 * Idle Scan screen: "{title}: points ×{m} now · until {time}" for the
 * promotion running at this spot (brandPromotions, active ones first).
 * Refetched when the tab gains focus and every 5 minutes.
 */
export function IdlePromotionBanner({ brandId, spotId }: { brandId: string | null; spotId: string | null }) {
  const { t, i18n } = useTranslation();
  const [promo, setPromo] = useState<BrandPromotion | null>(null);
  const reqRef = useRef(0);

  const load = useCallback(async () => {
    if (!brandId || !spotId) return;
    const req = ++reqRef.current;
    const res = await getBrandPromotions(brandId, spotId, { silent: true });
    if (req !== reqRef.current || !res.data) return;
    const active = res.data.filter((p) => p.isActiveNow && p.multiplierPercent > 100);
    // A promotion that also covers counter awards matters most at the counter.
    setPromo(active.find((p) => p.appliesToTemplateAwards) ?? active[0] ?? null);
  }, [brandId, spotId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!promo) return null;
  const parts = [
    t('Scan.promoNow', {
      title: localText(promo.title, promo.titleLocal, i18n.language),
      m: formatMultiplier(promo.multiplierPercent, i18n.language),
    }),
  ];
  if (promo.activeUntil) parts.push(t('Scan.promoUntil', { time: formatShortDateTime(promo.activeUntil) }));
  if (!promo.appliesToTemplateAwards) parts.push(t('Scan.promoOrdersOnly'));
  return <Banner text={parts.join(' · ')} />;
}
