import { useAppInitialization } from '@/hooks/useAppInitialization'
import { useFonts } from 'expo-font'
import { router, Stack } from 'expo-router'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { onSessionExpired } from '@/shared/api-client/src/session'
import { useAuthState } from '@/hooks/useAuthState'
import { OrderAlertProvider } from '@/components/organisms/OrderAlertProvider'
import { ToastProvider } from '@/components/organisms/ToastProvider'
import '../translations'
import './global.css'

export default function RootLayout() {
  useAppInitialization()
  const { isLoggedIn } = useAuthState()

  // When a request can't be authorized (token expired + refresh failed), the
  // session module clears storage and fires this — send the user to login.
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      router.replace('/login')
    })
    return unsubscribe
  }, [])

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Urbanist: require('../assets/fonts/urbanist/static/Urbanist-Bold.ttf'),
    'Urbanist-ExtraLight': require('../assets/fonts/urbanist/static/Urbanist-ExtraLight.ttf'),
    'Urbanist-Light': require('../assets/fonts/urbanist/static/Urbanist-Light.ttf')
  })

  if (!loaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
          {/* App-wide incoming-order alert (non-dismissable, audible). */}
          <OrderAlertProvider enabled={isLoggedIn} />
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
