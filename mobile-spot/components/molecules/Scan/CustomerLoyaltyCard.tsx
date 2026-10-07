import { Typography } from '@/components/atoms/Typography';
import type { LoyaltyCard } from '@repo/api-client';
import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';

/**
 * Who is at the counter (BRANDS_SPEC §4.8): the customer's numbers at THIS
 * brand only (points from other brands are never shown or usable here).
 */
export function CustomerLoyaltyCard({
  card,
  brandName,
  brandLogoUrl,
}: {
  card: LoyaltyCard;
  brandName: string;
  brandLogoUrl?: string | null;
}) {
  const { t } = useTranslation();
  const name = card.name?.trim() || t('Scan.customer');
  const initial = name.charAt(0).toUpperCase();

  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-4">
      <View className="mb-3 flex-row items-center">
        {brandLogoUrl ? (
          <Image
            source={{ uri: brandLogoUrl }}
            style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6' }}
            accessibilityIgnoresInvertColors
          />
        ) : null}
        <Typography
          variant="body-base-semibold"
          className={brandLogoUrl ? 'ml-2 flex-1 text-gray-700' : 'flex-1 text-gray-700'}
          numberOfLines={1}
        >
          {t('Scan.pointsAtBrand', { brand: brandName })}
        </Typography>
      </View>

      <View className="flex-row items-center">
        {card.profilePicture ? (
          <Image
            source={{ uri: card.profilePicture }}
            style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#F3F4F6' }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="h-[52px] w-[52px] items-center justify-center rounded-full" style={{ backgroundColor: '#FEECEC' }}>
            <Typography variant="body-lg-bold" style={{ color: '#EC2828' }}>
              {initial}
            </Typography>
          </View>
        )}
        <View className="ml-3 flex-1">
          <Typography variant="body-lg-bold" className="text-text-primary" numberOfLines={1}>
            {name}
          </Typography>
          {!!card.loyaltyCode && (
            <Typography variant="body-base-regular" className="text-gray-600">
              {card.loyaltyCode}
            </Typography>
          )}
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View
          className="flex-1 items-center rounded-xl py-3"
          style={{ backgroundColor: '#FEECEC' }}
          accessible
          accessibilityLabel={`${t('Scan.availablePoints')}: ${card.availablePoints}`}
        >
          <Typography variant="heading-32-bold" style={{ color: '#B91C1C' }}>
            {String(card.availablePoints)}
          </Typography>
          <Typography variant="body-small-semibold" className="text-gray-700">
            {t('Scan.availablePoints')}
          </Typography>
        </View>
        <View
          className="flex-1 items-center rounded-xl bg-gray-50 py-3"
          accessible
          accessibilityLabel={`${t('Scan.readyRewards')}: ${card.readyToPickUpCount}`}
        >
          <Typography variant="heading-32-bold" className="text-text-primary">
            {String(card.readyToPickUpCount)}
          </Typography>
          <Typography variant="body-small-semibold" className="text-gray-700">
            {t('Scan.readyRewards')}
          </Typography>
        </View>
      </View>
    </View>
  );
}
