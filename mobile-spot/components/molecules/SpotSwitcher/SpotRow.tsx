import { Typography } from '@/components/atoms/Typography';
import { spotCityName } from '@/hooks/useActiveSpot';
import type { StaffSpotVM } from '@/stores/spotStore';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, View } from 'react-native';

type Props = {
  spot: StaffSpotVM;
  active: boolean;
  /** Tag the row "Last used". */
  lastUsed?: boolean;
  /** Pre-highlighted (choose screen) without being the active spot. */
  highlighted?: boolean;
  onPress: (spot: StaffSpotVM) => void;
};

/**
 * One spot in the switcher sheet and on the choose screen (BRANDS_SPEC §4.3):
 * at least 72dp high; logo (spot, else brand, else an icon), 18px name, city
 * and address, a check mark on the active spot, a red "N waiting" badge, a
 * "you claimed N" chip and a "Last used" tag.
 */
export function SpotRow({ spot, active, lastUsed, highlighted, onPress }: Props) {
  const { t, i18n } = useTranslation();
  const city = spotCityName(spot, i18n.language);
  const secondLine = [city, spot.address].filter(Boolean).join(' · ');
  const logo = spot.logoUrl || spot.brandLogoUrl;
  const selected = active || !!highlighted;

  return (
    <Pressable
      onPress={() => onPress(spot)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={[spot.name, secondLine].filter(Boolean).join(', ')}
      className="flex-row items-center rounded-2xl px-3 py-3"
      style={{
        minHeight: 72,
        backgroundColor: selected ? '#FEECEC' : '#fff',
        borderWidth: 1.5,
        borderColor: selected ? '#EC2828' : '#E5E7EB',
      }}
    >
      <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
        {logo ? (
          <Image source={{ uri: logo }} style={{ width: 44, height: 44 }} resizeMode="cover" />
        ) : (
          <Ionicons name="storefront-outline" size={22} color="#6B7280" />
        )}
      </View>

      <View className="ml-3 flex-1">
        <Typography variant="body-lg-bold" className="text-text-primary" numberOfLines={1}>
          {spot.name}
        </Typography>
        {!!secondLine && (
          <Typography variant="body-base-regular" className="text-gray-600" numberOfLines={1}>
            {secondLine}
          </Typography>
        )}
        {(spot.pendingOrderCount > 0 || spot.myOpenClaimedCount > 0 || (lastUsed && !active)) && (
          <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
            {spot.pendingOrderCount > 0 && (
              <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: '#DC2626' }}>
                <Typography variant="body-base-semibold" className="text-white">
                  {t('OtherSpots.waiting', { count: spot.pendingOrderCount })}
                </Typography>
              </View>
            )}
            {spot.myOpenClaimedCount > 0 && (
              <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: '#FEF3C7' }}>
                <Typography variant="body-base-semibold" style={{ color: '#78350F' }}>
                  {t('OtherSpots.youClaimed', { count: spot.myOpenClaimedCount })}
                </Typography>
              </View>
            )}
            {lastUsed && !active && (
              <View className="rounded-full bg-gray-100 px-2.5 py-0.5">
                <Typography variant="body-base-semibold" style={{ color: '#374151' }}>
                  {t('SpotSwitcher.lastUsed')}
                </Typography>
              </View>
            )}
          </View>
        )}
      </View>

      {active ? (
        <Ionicons name="checkmark-circle" size={24} color="#EC2828" style={{ marginLeft: 8 }} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginLeft: 8 }} />
      )}
    </Pressable>
  );
}
