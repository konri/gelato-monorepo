import { Typography } from '@/components/atoms/Typography';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { useRole } from '@/hooks/useRole';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Banner when the active spot is not active (a draft or a deactivated spot):
 * customers can't see it yet. Those who can set it up get where to do it;
 * an employee, who can't, gets what to expect instead.
 */
export function InactiveSpotBanner() {
  const { t } = useTranslation();
  const { activeSpot } = useActiveSpot();
  const canSetUp = useRole().can.editMenu;
  // The brand banner already explains a paused brand.
  if (!activeSpot || activeSpot.isActive || !activeSpot.brandActive) return null;
  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-start px-4 py-3"
      style={{ backgroundColor: '#EFF6FF', borderBottomWidth: 1, borderBottomColor: '#BFDBFE' }}
    >
      <Ionicons name="eye-off-outline" size={22} color="#1E40AF" style={{ marginTop: 1 }} />
      <View className="ml-2 flex-1">
        <Typography variant="body-base-semibold" style={{ color: '#1E3A8A' }}>
          {t('Brand.spotInactiveBanner')}
        </Typography>
        <Typography variant="body-base-regular" style={{ color: '#1E3A8A' }}>
          {canSetUp ? t('Brand.spotInactiveHint') : t('Brand.spotInactiveHintStaff')}
        </Typography>
      </View>
    </View>
  );
}
