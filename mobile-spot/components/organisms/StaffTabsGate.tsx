import { SpotSwitcherHost } from '@/components/molecules/SpotSwitcher/SpotSwitcherSheet';
import { InactiveBrandBanner } from '@/components/organisms/InactiveBrandBanner';
import { InactiveSpotBanner } from '@/components/organisms/InactiveSpotBanner';
import { useSession } from '@/contexts/SessionProvider';
import { useActiveSpot } from '@/hooks/useActiveSpot';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Wraps BOTH tab layouts (`_layout.tsx` and `_layout.ios.tsx`; live bug C6:
 * the iOS layout had no auth redirect and no push registration):
 *   - redirects to /login when signed out and to /choose-spot while the spot
 *     still has to be chosen (or there is none);
 *   - registers the device for pushes once a spot is active;
 *   - shows the inactive-brand / not-yet-visible-spot banners above the tabs;
 *   - hosts the spot switcher sheet.
 */
export function StaffTabsGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const { status, activeSpot } = useActiveSpot();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  usePushRegistration();

  if (session.status === 'loading' || status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#EC2828" />
      </View>
    );
  }

  if (session.status === 'signedOut' || status === 'signedOut') {
    return <Redirect href="/login" />;
  }

  if (status !== 'ready') {
    // needsChoice, noAccess or error: the choose screen handles all three.
    return <Redirect href="/choose-spot" />;
  }

  // The banner takes the status-bar inset; the tab screens below must not add
  // it again, so they see a top inset of 0. The tree stays the same with or
  // without a banner, so the tabs never remount because of it.
  const showBanner = !!activeSpot && (!activeSpot.brandActive || !activeSpot.isActive);
  const bannerInset = showBanner && !isWide ? insets.top : 0;
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingTop: bannerInset }}>
        <InactiveBrandBanner />
        <InactiveSpotBanner />
      </View>
      <SafeAreaInsetsContext.Provider value={bannerInset ? { ...insets, top: 0 } : insets}>
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaInsetsContext.Provider>
      <SpotSwitcherHost />
    </View>
  );
}
