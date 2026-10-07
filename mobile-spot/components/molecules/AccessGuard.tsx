import { Typography } from '@/components/atoms/Typography';
import { atLeast, type AccessLevel } from '@/auth/levels';
import { useSession } from '@/contexts/SessionProvider';
import { useRole } from '@/hooks/useRole';
import { goBackOr } from '@/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  /** Minimum level at the ACTIVE spot. */
  min: AccessLevel;
  /** Translation key of the lock message (e.g. 'Dashboard.adminOnly'). */
  messageKey: string;
  children: ReactNode;
};

/**
 * Lock screen for deep links and stale navigation (BRANDS_SPEC §4.5): renders
 * the screen only when the caller's level at the active spot is at least
 * `min`. UX only — the server enforces the same rule.
 */
export function AccessGuard({ min, messageKey, children }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { level, loading } = useRole();
  const session = useSession();

  // A deep link while signed out goes to the login screen.
  if (session.status === 'signedOut') return <Redirect href="/login" />;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#EC2828" />
      </View>
    );
  }

  if (!atLeast(level, min)) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8" style={{ paddingTop: insets.top }}>
        <Ionicons name="lock-closed-outline" size={40} color="#6B7280" />
        <Typography variant="body-base-regular" className="mt-3 text-center text-gray-600">
          {t(messageKey)}
        </Typography>
        <Pressable
          onPress={() => goBackOr()}
          accessibilityRole="button"
          className="mt-5 items-center justify-center rounded-xl px-6"
          style={{ backgroundColor: '#EC2828', minHeight: 48 }}
        >
          <Typography variant="body-base-bold" className="text-white">
            {t('Common.back')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}
