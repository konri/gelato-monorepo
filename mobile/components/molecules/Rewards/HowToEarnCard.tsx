import { COLORS, LText } from '@/components/molecules/Loyalty/ui';
import { pointsText } from '@/utils/formatPoints';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type BrandBonuses = { name: string; birthdayBonusPoints: number; referralBonusPoints: number };

/**
 * How points are collected (BRANDS_SPEC §5.5): show the card, order in the
 * app, exchange for a reward; then the birthday gift and the invitation
 * bonus, with the brand's own numbers when one brand is shown (A2: both sides
 * get the bonus after the friend's first purchase there). Never a hard-coded
 * amount.
 */
export function HowToEarnCard({ brand }: { brand?: BrandBonuses | null }) {
  const { t } = useTranslation();

  const birthday = brand
    ? brand.birthdayBonusPoints > 0
      ? t('Prizes.howBirthdayBrand', { brand: brand.name, pointsText: pointsText(t, brand.birthdayBonusPoints) })
      : null
    : t('Prizes.howBirthday');
  const referral = brand
    ? brand.referralBonusPoints > 0
      ? t('Prizes.howReferralBrand', { brand: brand.name, pointsText: pointsText(t, brand.referralBonusPoints) })
      : null
    : t('Prizes.howReferral');

  return (
    <View className="mx-4 mt-3 rounded-3xl border border-gray-200 bg-white p-4">
      <LText size={22} weight="700" accessibilityRole="header" max={1.4}>
        {t('Prizes.howTitle')}
      </LText>
      <Step n={1} icon="qr-code-outline" text={t('Prizes.howStepCard')} />
      <Step n={2} icon="bag-handle-outline" text={t('Prizes.howStepOrder')} />
      <Step n={3} icon="gift-outline" text={t('Prizes.howStepReward')} />
      {birthday || referral ? <View className="my-3 h-px bg-gray-200" /> : null}
      {birthday ? <Extra icon="balloon-outline" text={birthday} /> : null}
      {referral ? <Extra icon="people-outline" text={referral} /> : null}
    </View>
  );
}

function Step({ n, icon, text }: { n: number; icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View className="mt-3 flex-row items-start" accessible accessibilityLabel={`${n}. ${text}`}>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-red-50">
        <Ionicons name={icon} size={22} color={COLORS.red} />
      </View>
      <LText size={18} className="ml-3 flex-1" style={{ paddingTop: 7 }}>
        {text}
      </LText>
    </View>
  );
}

function Extra({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View className="mt-2 flex-row items-start">
      <Ionicons name={icon} size={22} color={COLORS.amber} style={{ marginTop: 1 }} />
      <LText size={18} className="ml-3 flex-1" color="#374151">
        {text}
      </LText>
    </View>
  );
}
