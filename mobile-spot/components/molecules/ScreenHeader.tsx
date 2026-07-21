import { Typography } from '@/components/atoms/Typography';
import { goBackOr } from '@/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  /** Route to fall back to when there's no history to pop. */
  backFallback?: string;
  /** Right-aligned action(s) (e.g. "Mark all read"). */
  right?: ReactNode;
  /** Hide the back button (top-level screens). */
  showBack?: boolean;
};

/**
 * Floating rounded "pill" header, matching the Gelato client app. Sits over the
 * grey screen background with the status-bar inset baked in, a circular back
 * button on the left and a centered title.
 */
export function ScreenHeader({ title, backFallback = '/(tabs)', right, showBack = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 8 }} className="px-4 pb-2">
      <View className="flex-row items-center rounded-[28px] bg-white px-3 py-2.5 shadow-sm">
        {showBack ? (
          <Pressable
            onPress={() => goBackOr(backFallback)}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="chevron-back" size={20} color="#212121" />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
        <Typography variant="body-lg-bold" className="flex-1 text-center text-text-primary">
          {title}
        </Typography>
        {right ? <View className="min-w-10 items-end">{right}</View> : <View className="w-10" />}
      </View>
    </View>
  );
}
