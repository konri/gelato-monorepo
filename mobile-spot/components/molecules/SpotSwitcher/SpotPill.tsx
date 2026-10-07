import { Typography } from '@/components/atoms/Typography';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { openSpotSwitcher } from './SpotSwitcherSheet';

/**
 * The active spot as a big tappable pill that opens the switcher (BRANDS_SPEC
 * §4.3). `header`: full width, at least 52 high, 18px bold name (plus the city
 * when the brand has several). `sidebar`: two lines for the tablet / web
 * sidebar. Renders nothing without an active spot.
 */
export function SpotPill({ variant = 'header' }: { variant?: 'header' | 'sidebar' }) {
  const { t } = useTranslation();
  const { activeSpot, cityName, multiCity } = useActiveSpot();
  if (!activeSpot) return null;
  const a11y = t('SpotSwitcher.pillA11y', { name: activeSpot.name });

  if (variant === 'sidebar') {
    return (
      <Pressable
        onPress={openSpotSwitcher}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        className="flex-row items-center rounded-xl px-3 py-2"
        style={{ minHeight: 56, backgroundColor: '#FEECEC', borderWidth: 1.5, borderColor: '#EC2828' }}
      >
        <Ionicons name="storefront-outline" size={20} color="#EC2828" />
        <View className="ml-2 flex-1">
          <Typography variant="body-base-bold" className="text-text-primary" numberOfLines={1} style={{ fontSize: 16 }}>
            {activeSpot.name}
          </Typography>
          {!!cityName && (
            <Typography variant="body-small-regular" className="text-gray-600" numberOfLines={1}>
              {cityName}
            </Typography>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color="#212121" />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={openSpotSwitcher}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      hitSlop={4}
      className="flex-row items-center rounded-full px-4"
      style={{ minHeight: 52, backgroundColor: '#FEECEC', borderWidth: 1.5, borderColor: '#EC2828' }}
    >
      <Ionicons name="storefront-outline" size={22} color="#EC2828" />
      <View className="ml-2 flex-1 flex-row items-baseline">
        <Typography variant="body-lg-bold" className="flex-shrink text-text-primary" numberOfLines={1}>
          {activeSpot.name}
        </Typography>
        {multiCity && !!cityName && (
          <Typography variant="body-base-regular" className="ml-2 text-gray-600" numberOfLines={1}>
            {cityName}
          </Typography>
        )}
      </View>
      <Ionicons name="chevron-down" size={20} color="#212121" />
    </Pressable>
  );
}
