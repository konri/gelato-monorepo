import { Typography } from '@/components/atoms/Typography';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { Ionicons } from '@expo/vector-icons';
import { Image, View } from 'react-native';
import { SpotPill } from './SpotPill';

const BRAND = '#EC2828';

/**
 * Top of the tablet / web sidebar (BRANDS_SPEC §4.3): the brand's logo and
 * name with the "SPOT" caption, then the spot pill when the user can switch
 * (otherwise the spot's name as plain text).
 */
export function SidebarBrandBlock() {
  const { activeSpot, brandName, canSwitch } = useActiveSpot();
  const logo = activeSpot?.brandLogoUrl ?? null;

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 12 }}>
        {logo ? (
          <Image source={{ uri: logo }} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6' }} />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: BRAND,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="storefront" size={20} color="#fff" />
          </View>
        )}
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Typography variant="body-lg-bold" className="text-text-primary leading-5" numberOfLines={1}>
            {brandName ?? 'Loodly'}
          </Typography>
          <Typography variant="body-very-small-medium" style={{ color: BRAND, letterSpacing: 2, fontSize: 14 }}>
            SPOT
          </Typography>
        </View>
      </View>
      {canSwitch ? (
        <SpotPill variant="sidebar" />
      ) : activeSpot ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
          <Ionicons name="storefront-outline" size={18} color="#6B7280" />
          <Typography variant="body-base-semibold" className="ml-2 flex-1 text-text-primary" numberOfLines={1}>
            {activeSpot.name}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}
