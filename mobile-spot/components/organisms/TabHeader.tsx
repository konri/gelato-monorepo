import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { Typography } from '@/components/atoms/Typography';
import { SpotPill } from '@/components/molecules/SpotSwitcher/SpotPill';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  /** Replaces the title (e.g. the Loodly lockup on the Orders tab). */
  left?: ReactNode;
  right?: ReactNode;
  maxWidth?: number;
};

/**
 * White header of the tab screens. On phones, users with more than one spot
 * get the spot pill under the title on EVERY tab, so "which spot am I on?" is
 * always answered in the same place (BRANDS_SPEC §4.3). On tablet / web the
 * sidebar carries the pill instead.
 */
export function TabHeader({ title, left, right, maxWidth }: Props) {
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  const { canSwitch } = useActiveSpot();

  return (
    <View
      className="border-b border-gray-200 bg-white px-6 pb-4"
      style={{ paddingTop: (isWide ? 0 : insets.top) + 16 }}
    >
      <ResponsiveContainer maxWidth={maxWidth}>
        <View className="flex-row items-center justify-between">
          {left ?? (
            <Typography
              variant={isWide ? 'heading-32-bold' : 'body-lg-bold'}
              className="flex-1 text-text-primary"
              accessibilityRole="header"
            >
              {title}
            </Typography>
          )}
          {right}
        </View>
        {!isWide && canSwitch && (
          <View className="mt-3">
            <SpotPill />
          </View>
        )}
      </ResponsiveContainer>
    </View>
  );
}
