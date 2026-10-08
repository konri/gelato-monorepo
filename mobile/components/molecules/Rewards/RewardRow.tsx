import { Image } from '@/components/atoms/Image';
import { Badge, COLORS, LText } from '@/components/molecules/Loyalty/ui';
import { useBrands } from '@/hooks/useBrands';
import type { BrandReward } from '@/shared/api-client/src/graphql/queries/loyalty/types';
import { pointsText } from '@/utils/formatPoints';
import { localizedText } from '@/utils/localizedText';
import { Ionicons } from '@expo/vector-icons';
import type { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

type RewardLike = Pick<
  BrandReward,
  'id' | 'brandId' | 'title' | 'titleLocal' | 'imageUrl' | 'pointsCost' | 'quantity' | 'claimed' | 'isActive' | 'archivedAt'
>;

export type RewardStatus =
  | { kind: 'unavailable' }
  | { kind: 'affordable' }
  | { kind: 'missing'; missing: number; progress: number };

/** Out of stock, disabled, archived, or the brand is paused. */
export const isRewardUnavailable = (reward: Partial<RewardLike>, brandPaused: boolean): boolean =>
  brandPaused ||
  reward.isActive === false ||
  !!reward.archivedAt ||
  (reward.quantity != null && (reward.claimed ?? 0) >= reward.quantity);

/** Status against the points of the reward's OWN brand (never the selection). */
export const rewardStatus = (
  reward: Partial<RewardLike> & { pointsCost: number },
  points: number,
  brandPaused: boolean,
): RewardStatus => {
  if (isRewardUnavailable(reward, brandPaused)) return { kind: 'unavailable' };
  if (points >= reward.pointsCost) return { kind: 'affordable' };
  return {
    kind: 'missing',
    missing: reward.pointsCost - points,
    progress: reward.pointsCost > 0 ? Math.max(0, Math.min(1, points / reward.pointsCost)) : 0,
  };
};

export const rewardStatusText = (t: TFunction, status: RewardStatus): string =>
  status.kind === 'unavailable'
    ? t('Prizes.notAvailableNow')
    : status.kind === 'affordable'
      ? t('Prizes.canGetNow')
      : t('Prizes.morePoints', { count: status.missing });

/**
 * One reward of a catalog (BRANDS_SPEC §5.5): 72px image, 20px title, cost
 * and a status computed against `walletFor(reward.brandId)`: "✓ You can get
 * this now", a progress bar with "{n} more points", or "Not available right now".
 */
export function RewardRow({ reward, onPress }: { reward: RewardLike; onPress: () => void }) {
  const { t, i18n } = useTranslation();
  const { walletFor } = useBrands();
  const wallet = walletFor(reward.brandId);
  const points = wallet?.availablePoints ?? 0;
  const status = rewardStatus(reward, points, !!wallet?.paused);
  const title = localizedText(reward.titleLocal, i18n.language) || reward.title;
  const cost = pointsText(t, reward.pointsCost);
  const statusText = rewardStatusText(t, status);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${cost}. ${statusText}`}
      className="mx-4 mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white p-3 active:opacity-80"
      style={{ minHeight: 96, opacity: status.kind === 'unavailable' ? 0.75 : 1 }}
    >
      <Image
        url={reward.imageUrl ?? undefined}
        resizeMode="cover"
        style={{ width: 72, height: 72, borderRadius: 14 }}
        fallbackWidth={72}
        fallbackHeight={72}
        fallbackLogoSize={28}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View className="ml-3 flex-1">
        <LText size={20} weight="700" numberOfLines={3} max={1.4}>
          {title}
        </LText>
        <LText size={18} weight="700" color={COLORS.brand} max={1.4}>
          {cost}
        </LText>
        <View className="mt-1">
          {status.kind === 'affordable' ? (
            <Badge tone="green" icon="checkmark-circle" text={statusText} />
          ) : status.kind === 'unavailable' ? (
            <Badge tone="grey" icon="remove-circle-outline" text={statusText} />
          ) : (
            <View>
              <View className="h-2.5 overflow-hidden rounded-full bg-gray-200">
                <View
                  className="h-2.5 rounded-full"
                  style={{ width: `${Math.round(status.progress * 100)}%`, backgroundColor: COLORS.accent }}
                />
              </View>
              <LText size={16} color={COLORS.secondary} className="mt-1" max={1.4}>
                {statusText}
              </LText>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}
