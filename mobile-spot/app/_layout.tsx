import { useAppInitialization } from '@/hooks/useAppInitialization'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SessionProvider } from '@/contexts/SessionProvider'
import { SpotContextProvider } from '@/contexts/SpotContextProvider'
import { OrderAlertProvider } from '@/components/organisms/OrderAlertProvider'
import { RealtimeProvider } from '@/components/organisms/RealtimeProvider'
import { ToastProvider } from '@/components/organisms/ToastProvider'
import { UpgradeRequiredOverlay } from '@/components/organisms/UpgradeRequiredOverlay'
import { NotificationBridge } from '@/components/NotificationBridge'
import '../translations'
import './global.css'

export default function RootLayout() {
  useAppInitialization()

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Urbanist: require('../assets/fonts/urbanist/static/Urbanist-Bold.ttf'),
    'Urbanist-ExtraLight': require('../assets/fonts/urbanist/static/Urbanist-ExtraLight.ttf'),
    'Urbanist-Light': require('../assets/fonts/urbanist/static/Urbanist-Light.ttf')
  })

  if (!loaded) {
    return null
  }

  // Session → spot context → one realtime socket. Session expiry (a request
  // that can't be authorized) is handled inside SessionProvider.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <SessionProvider>
            <SpotContextProvider>
              <RealtimeProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="login/index" options={{ headerShown: false }} />
                  <Stack.Screen name="choose-spot" options={{ headerShown: false, gestureEnabled: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="menu/index" options={{ headerShown: false }} />
                  <Stack.Screen name="spot-details/index" options={{ headerShown: false }} />
                  <Stack.Screen name="dashboard/index" options={{ headerShown: false }} />
                  <Stack.Screen name="complaints/index" options={{ headerShown: false }} />
                  <Stack.Screen name="news/index" options={{ headerShown: false }} />
                  <Stack.Screen name="news_comments/[postId]" options={{ headerShown: false }} />
                  <Stack.Screen name="staff/index" options={{ headerShown: false }} />
                  <Stack.Screen name="history/index" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
                  <Stack.Screen name="notification/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="canceled/index" options={{ headerShown: false }} />
                  <Stack.Screen name="courier/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="settings/edit-profile" options={{ headerShown: false }} />
                  <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" options={{ headerShown: true }} />
                </Stack>
                {/* App-wide incoming-order alert for the active spot (audible;
                    dismissable when several staff work there). */}
                <OrderAlertProvider />
                {/* Bridges push notifications → toast / deep-link. */}
                <NotificationBridge />
                <UpgradeRequiredOverlay />
              </RealtimeProvider>
            </SpotContextProvider>
          </SessionProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
