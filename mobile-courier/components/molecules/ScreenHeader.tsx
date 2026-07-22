import { Typography } from '@/components/atoms/Typography';
import { goBackOr } from '@/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  /** Optional second line under the title (e.g. "Order #123"). */
  subtitle?: string;
  /** Route to fall back to when there's no history to pop. */
  backFallback?: string;
  /** Override the back action entirely (e.g. router.replace). */
  onBack?: () => void;
  /** Right-aligned action(s). */
  right?: ReactNode;
  /** Hide the back button (top-level screens). */
  showBack?: boolean;
};

/**
 * Floating rounded "pill" header, matching the Gelato client app. Sits over the
 * grey screen background with the status-bar inset baked in, a circular back
 * button on the left and a centered title (+ optional subtitle).
 */
export function ScreenHeader({
  title,
  subtitle,
  backFallback = '/(tabs)',
  onBack,
  right,
  showBack = true,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 8 }} className="px-4 pb-2">
      <View className="flex-row items-center rounded-[28px] bg-white px-3 py-2.5 shadow-sm">
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => goBackOr(backFallback))}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="chevron-back" size={20} color="#212121" />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
        <View className="flex-1 items-center">
          <Typography variant="body-lg-bold" className="text-center text-text-primary">
            {title}
          </Typography>
          {!!subtitle && (
            <Typography variant="body-small-regular" className="text-center text-gray-500">
              {subtitle}
            </Typography>
          )}
        </View>
        {right ? <View className="min-w-10 items-end">{right}</View> : <View className="w-10" />}
      </View>
    </View>
  );
}
