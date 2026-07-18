import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type SpotNavItem = {
  /** expo-router tab route name (must match a file in app/(tabs)/). */
  name: string;
  labelKey: string;
  icon: IoniconName;
  /** true = only visible to spot admins. */
  adminOnly?: boolean;
};

// Order/label match the existing tab config; extended as later phases add screens.
export const SPOT_NAV_ITEMS: SpotNavItem[] = [
  { name: 'index', labelKey: 'SpotTabs.orders', icon: 'receipt-outline' },
  { name: 'prepared', labelKey: 'SpotTabs.prepared', icon: 'checkmark-done-outline' },
  { name: 'scan', labelKey: 'SpotTabs.scan', icon: 'qr-code-outline' },
  { name: 'couriers', labelKey: 'SpotTabs.couriers', icon: 'bicycle-outline' },
  { name: 'menu', labelKey: 'SpotTabs.menu', icon: 'ice-cream-outline' },
  { name: 'profile', labelKey: 'SpotTabs.profile', icon: 'person-outline' },
];

export function visibleNavItems(isAdmin: boolean): SpotNavItem[] {
  return SPOT_NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);
}
