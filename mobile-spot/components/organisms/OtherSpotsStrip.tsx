import { Typography } from '@/components/atoms/Typography';
import { openSpotSwitcher } from '@/components/molecules/SpotSwitcher/SpotSwitcherSheet';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

/**
 * Orders tab (BRANDS_SPEC §4.3): an amber row with what is waiting at the
 * user's OTHER spots, e.g. "Mokotów: 2 waiting · Wola: 1 you claimed ›".
 * Tapping opens the switcher. Hidden when every count is 0 or the user has a
 * single spot. Counts come from myStaffSpots (polled every 30 s).
 */
export function OtherSpotsStrip() {
  const { t } = useTranslation();
  const { canSwitch, spots, activeSpotId } = useActiveSpot();
  if (!canSwitch) return null;

  const parts = spots
    .filter((s) => s.spotId !== activeSpotId && (s.pendingOrderCount > 0 || s.myOpenClaimedCount > 0))
    .sort((a, b) => b.pendingOrderCount - a.pendingOrderCount || a.name.localeCompare(b.name))
    .map((s) => {
      const counts = [
        s.pendingOrderCount > 0 ? t('OtherSpots.waiting', { count: s.pendingOrderCount }) : null,
        s.myOpenClaimedCount > 0 ? t('OtherSpots.youClaimed', { count: s.myOpenClaimedCount }) : null,
      ].filter(Boolean);
      return `${s.name}: ${counts.join(', ')}`;
    });
  if (parts.length === 0) return null;

  return (
    <Pressable
      onPress={openSpotSwitcher}
      accessibilityRole="button"
      accessibilityLabel={`${t('OtherSpots.a11y')} ${parts.join('. ')}`}
      className="mb-4 flex-row items-center rounded-2xl px-4 py-3"
      style={{ minHeight: 52, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D' }}
    >
      <Ionicons name="storefront-outline" size={20} color="#92400E" />
      <Typography variant="body-base-semibold" className="ml-2 flex-1" style={{ color: '#78350F' }} numberOfLines={2}>
        {parts.join(' · ')}
      </Typography>
      <Ionicons name="chevron-forward" size={20} color="#92400E" />
    </Pressable>
  );
}
