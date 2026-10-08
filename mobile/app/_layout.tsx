import { useAppInitialization } from '@/hooks/useAppInitialization'
import { useGoogleSignInConfig } from '@/hooks/useGoogleSignInConfig'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StripeProvider } from '@stripe/stripe-react-native'
import { onSessionExpired } from '@/shared/api-client/src/session'
import { leaveToWelcome } from '@/utils/sessionNavigation'
import { CartProvider } from '@/hooks/useCart'
import { ToastProvider } from '@/components/organisms/ToastProvider'
import { UpgradeRequiredGate } from '@/components/organisms/UpgradeRequiredGate'
import { NotificationBridge } from '@/components/NotificationBridge'
import { BrandProvider } from '@/hooks/useBrands'
import { config } from '@/config'
import { THEME } from '@/constants/palette'
import { DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native'
import '../translations'
import './global.css'

// Screens without their own background (auth stack, top tabs, …) get cream
// instead of React Navigation's default grey.
const NAV_THEME: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: THEME.primary,
    background: THEME.background,
    text: THEME.text,
    border: THEME.border,
  },
}

export default function RootLayout() {
  useGoogleSignInConfig()
  useAppInitialization()

  // When a request can't be authorized (token expired + refresh failed), the
  // session module clears storage and fires this — send the user to login,
  // unmounting the tabs (their socket and in-memory card go with them).
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      leaveToWelcome()
    })
    return unsubscribe
  }, [])

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Urbanist: require('../assets/fonts/urbanist/static/Urbanist-Bold.ttf'),
    'Urbanist-ExtraLight': require('../assets/fonts/urbanist/static/Urbanist-ExtraLight.ttf'),
    'Urbanist-Light': require('../assets/fonts/urbanist/static/Urbanist-Light.ttf'),
    'Urbanist-Medium': require('../assets/fonts/urbanist/static/Urbanist-Medium.ttf'),
    'Urbanist-SemiBold': require('../assets/fonts/urbanist/static/Urbanist-SemiBold.ttf')
  })

  if (!loaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider
          publishableKey={config.STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier={config.STRIPE_MERCHANT_IDENTIFIER}
          urlScheme={config.STRIPE_URL_SCHEME}
        >
          <CartProvider>
          <ToastProvider>
          {/* Root, not a tab layout: NativeTabs must stay mounted and root
              screens (prize/[id], orders, …) need the brands too. Always
              renders its children; loads lazily (BRANDS_SPEC §5.2). */}
          <BrandProvider>
          <UpgradeRequiredGate />
          <NotificationBridge />
          <ThemeProvider value={NAV_THEME}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="notification/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="merchant_store/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="spot/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="taste/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="order/cart" options={{ headerShown: false }} />
            <Stack.Screen name="order/address" options={{ headerShown: false }} />
            <Stack.Screen name="order/details" options={{ headerShown: false }} />
            <Stack.Screen name="order/payment" options={{ headerShown: false }} />
            <Stack.Screen name="order/success" options={{ headerShown: false }} />
            <Stack.Screen name="order/track/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="prize/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="prize/mine/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="brand/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="brands/index" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ headerShown: true }} />
          </Stack>
          </ThemeProvider>
          </BrandProvider>
          </ToastProvider>
          </CartProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
