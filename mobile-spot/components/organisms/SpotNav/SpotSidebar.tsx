import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Typography } from '@/components/atoms/Typography';
import { useRole } from '@/hooks/useRole';
import { visibleNavItems } from './navItems';

export const SIDEBAR_WIDTH = 240;

const BRAND = '#EC2828';

/**
 * Left sidebar navigation for tablet/web. Rendered as the Tabs `tabBar` when
 * the viewport is wide; role-filters items (admin-only entries hidden for
 * employees) and reflects/controls the active route via expo-router state.
 */
export function SpotSidebar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { isAdmin } = useRole();
  const items = visibleNavItems(isAdmin);

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      style={{
        width: SIDEBAR_WIDTH,
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
        backgroundColor: '#fff',
        paddingTop: 24,
        paddingHorizontal: 12,
      }}
    >
      {/* Brand */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 28 }}>
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
          <Ionicons name="ice-cream" size={20} color="#fff" />
        </View>
        <View style={{ marginLeft: 10 }}>
          <Typography variant="body-lg-bold" className="text-text-primary leading-5">
            Gelato
          </Typography>
          <Typography variant="body-very-small-medium" style={{ color: BRAND, letterSpacing: 2 }}>
            SPOT
          </Typography>
        </View>
      </View>

      {/* Nav items */}
      {items.map((item) => {
        const active = item.name === activeRouteName;
        return (
          <Pressable
            key={item.name}
            onPress={() => {
              if (!active) navigation.navigate(item.name);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 11,
              paddingHorizontal: 12,
              borderRadius: 12,
              marginBottom: 4,
              backgroundColor: active ? '#FEECEC' : 'transparent',
            }}
          >
            <Ionicons name={item.icon} size={20} color={active ? BRAND : '#6B7280'} />
            <Typography
              variant="body-base-semibold"
              style={{ color: active ? BRAND : '#374151' }}
            >
              {t(item.labelKey)}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}
