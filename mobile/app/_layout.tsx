import { useAppInitialization } from '@/hooks/useAppInitialization'
import { useGoogleSignInConfig } from '@/hooks/useGoogleSignInConfig'
import { useFonts } from 'expo-font'
import { router, Stack } from 'expo-router'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StripeProvider } from '@stripe/stripe-react-native'
import { onSessionExpired } from '@/shared/api-client/src/session'
import { CartProvider } from '@/hooks/useCart'
import { ToastProvider } from '@/components/organisms/ToastProvider'
import { config } from '@/config'
import '../translations'
import './global.css'

export default function RootLayout() {
  useGoogleSignInConfig()
  useAppInitialization()

  // When a request can't be authorized (token expired + refresh failed), the
  // session module clears storage and fires this — send the user to login.
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      router.replace('/welcome')
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
        <StripeProvider
          publishableKey={config.STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.konradhopek.gelato.client"
        >
          <CartProvider>
          <ToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
            <Stack.Screen name="+not-found" options={{ headerShown: true }} />
          </Stack>
          </ToastProvider>
          </CartProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
