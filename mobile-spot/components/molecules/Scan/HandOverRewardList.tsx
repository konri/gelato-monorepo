import { Typography } from '@/components/atoms/Typography';
import { formatDate, localText } from '@/utils/loyaltyDisplay';
import type { CustomerReward } from '@repo/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

/**
 * Rewards the customer already claimed in the app, ready to hand over here
 * after scanning their card (E10). Tapping "Hand over" asks to confirm first.
 */
export function HandOverRewardList({
  rewards,
  disabled,
  onHandOver,
}: {
  rewards: CustomerReward[];
  disabled?: boolean;
  onHandOver: (reward: CustomerReward) => void;
}) {
  const { t, i18n } = useTranslation();
  if (rewards.length === 0) return null;

  return (
    <View className="rounded-2xl border border-green-200 bg-white p-4">
      <View className="mb-2 flex-row items-center">
        <Ionicons name="gift" size={20} color="#15803D" />
        <Typography variant="body-base-bold" className="ml-2 flex-1 text-text-primary" accessibilityRole="header">
          {t('Scan.handOverTitle', { count: rewards.length })}
        </Typography>
      </View>
      <Typography variant="body-small-regular" className="mb-3 text-gray-600">
        {t('Scan.handOverHint')}
      </Typography>
      {rewards.map((reward) => {
        const title = localText(reward.prize.title, reward.prize.titleLocal, i18n.language);
        return (
          <View
            key={reward.id}
            className="mb-2 flex-row items-center rounded-xl bg-green-50 px-3"
            style={{ minHeight: 56 }}
          >
            <View className="flex-1 py-2 pr-2">
              <Typography variant="body-base-semibold" className="text-text-primary">
                {title}
              </Typography>
              <Typography variant="body-small-regular" className="text-gray-600">
                {t('Scan.validUntil', { date: formatDate(reward.validUntil) })}
              </Typography>
            </View>
            <Pressable
              onPress={() => onHandOver(reward)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={t('Scan.handOverA11y', { reward: title })}
              className="items-center justify-center rounded-xl px-4"
              style={{ minHeight: 48, backgroundColor: disabled ? '#86EFAC' : '#15803D' }}
            >
              <Typography variant="body-base-bold" className="text-white">
                {t('Scan.handOver')}
              </Typography>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
