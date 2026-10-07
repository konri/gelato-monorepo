import { Typography } from '@/components/atoms/Typography';
import { localText } from '@/utils/loyaltyDisplay';
import type { BrandReward } from '@repo/api-client';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const MAX_ROWS = 5;

const inStock = (r: BrandReward) => r.quantity == null || (r.claimed ?? 0) < r.quantity;

function isOffered(r: BrandReward, now: number): boolean {
  if (r.isActive === false) return false;
  if (r.validFrom && new Date(r.validFrom).getTime() > now) return false;
  if (r.validUntil && new Date(r.validUntil).getTime() < now) return false;
  return true;
}

/**
 * Informational (BRANDS_SPEC §4.8): the brand's other rewards with what is
 * missing, so staff can tell the customer how far they are. Rewards the
 * points already cover are listed under "Exchange points for a reward"
 * instead, so they are left out here.
 */
export function BrandRewardsList({
  rewards,
  availablePoints,
  excludeIds,
  brandName,
}: {
  rewards: BrandReward[];
  availablePoints: number;
  excludeIds: ReadonlySet<string>;
  brandName: string;
}) {
  const { t, i18n } = useTranslation();
  const now = Date.now();
  const rows = rewards
    .filter((r) => !excludeIds.has(r.id) && isOffered(r, now))
    .sort((a, b) => a.pointsCost - b.pointsCost)
    .slice(0, MAX_ROWS);
  if (rows.length === 0) return null;

  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-4">
      <Typography variant="body-base-bold" className="mb-3 text-text-primary" accessibilityRole="header">
        {t('Scan.brandRewardsTitle', { brand: brandName })}
      </Typography>
      {rows.map((r) => {
        const soldOut = !inStock(r);
        const missing = Math.max(0, r.pointsCost - availablePoints);
        const badge = soldOut
          ? { text: t('Scan.rewardOutOfStock'), bg: '#F3F4F6', fg: '#374151' }
          : missing > 0
            ? { text: t('Scan.rewardMissing', { count: missing }), bg: '#FEF3C7', fg: '#92400E' }
            : { text: t('Scan.rewardAffordable'), bg: '#DCFCE7', fg: '#15803D' };
        return (
          <View key={r.id} className="mb-2 flex-row items-center rounded-xl bg-gray-50 px-3 py-2.5">
            <View className="flex-1 pr-2">
              <Typography variant="body-base-semibold" className="text-text-primary">
                {localText(r.title, r.titleLocal, i18n.language)}
              </Typography>
              <Typography variant="body-small-regular" className="text-gray-600">
                {t('Scan.pointsCount', { count: r.pointsCost })}
              </Typography>
            </View>
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: badge.bg }}>
              <Typography variant="body-small-semibold" style={{ color: badge.fg }}>
                {badge.text}
              </Typography>
            </View>
          </View>
        );
      })}
    </View>
  );
}
