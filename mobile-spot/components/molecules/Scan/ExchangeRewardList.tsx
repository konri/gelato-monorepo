import { Typography } from '@/components/atoms/Typography';
import { localText } from '@/utils/loyaltyDisplay';
import type { BrandReward } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

/**
 * A3 "Exchange points for a reward": this brand's rewards the customer's
 * points cover now (the server's `affordableRewards`). Tapping one opens the
 * confirm sheet; nothing is spent before [Confirm].
 */
export function ExchangeRewardList({
  rewards,
  disabled,
  onSelect,
}: {
  rewards: BrandReward[];
  disabled?: boolean;
  onSelect: (reward: BrandReward) => void;
}) {
  const { t, i18n } = useTranslation();
  if (rewards.length === 0) return null;

  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-4">
      <View className="mb-3 flex-row items-center">
        <Ionicons name="swap-horizontal" size={20} color="#EC2828" />
        <Typography variant="body-base-bold" className="ml-2 flex-1 text-text-primary" accessibilityRole="header">
          {t('Scan.exchangeTitle')}
        </Typography>
      </View>
      {rewards.map((reward) => {
        const title = localText(reward.title, reward.titleLocal, i18n.language);
        return (
          <Pressable
            key={reward.id}
            onPress={() => onSelect(reward)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t('Scan.exchangeA11y', { reward: title, count: reward.pointsCost })}
            className="mb-2 flex-row items-center rounded-xl border border-gray-200 px-3"
            style={{ minHeight: 56, opacity: disabled ? 0.5 : 1 }}
          >
            <View className="flex-1 py-2 pr-2">
              <Typography variant="body-base-semibold" className="text-text-primary">
                {title}
              </Typography>
              <Typography variant="body-base-regular" className="text-gray-600">
                {t('Scan.pointsCount', { count: reward.pointsCost })}
              </Typography>
            </View>
            <Typography variant="body-base-bold" style={{ color: '#EC2828' }}>
              {t('Scan.exchangeCta')}
            </Typography>
            <Ionicons name="chevron-forward" size={18} color="#EC2828" />
          </Pressable>
        );
      })}
    </View>
  );
}
