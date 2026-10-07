import { Typography } from '@/components/atoms/Typography';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Amber banner when the active spot's brand is deactivated (E14): staff can
 * still sign in and work, but new orders, points and rewards are paused.
 */
export function InactiveBrandBanner() {
  const { t } = useTranslation();
  const { activeSpot } = useActiveSpot();
  if (!activeSpot || activeSpot.brandActive) return null;
  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-center px-4 py-3"
      style={{ backgroundColor: '#FEF3C7', borderBottomWidth: 1, borderBottomColor: '#FCD34D' }}
    >
      <Ionicons name="pause-circle" size={22} color="#92400E" />
      <Typography variant="body-base-semibold" className="ml-2 flex-1" style={{ color: '#78350F' }}>
        {t('Brand.inactiveBanner')}
      </Typography>
    </View>
  );
}
