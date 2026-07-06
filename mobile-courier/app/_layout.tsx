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
          merchantIdentifier="merchant.com.konradhopek.gelato.courier"
        >
          <CartProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="apply-spot" options={{ headerShown: false }} />
            <Stack.Screen name="delivery" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ headerShown: true }} />
          </Stack>
          </CartProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
