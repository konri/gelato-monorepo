import { isLanguageSupported } from '@/constants/supportedLanguages'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import { router, useRootNavigationState } from 'expo-router'
import i18n from 'i18next'
import { useEffect, useRef, useState } from 'react'

export const useAppInitialization = () => {
  const [isLoading, setIsLoading] = useState(true)
  const navigationState = useRootNavigationState()
  const pendingRoute = useRef<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const language = await AsyncStorage.getItem('language')
      if (language) {
        await i18n.changeLanguage(language.toLowerCase())
      } else {
        const deviceLanguage = getLocales()[0].languageCode?.toUpperCase() || 'EN'
        const languageToSet = isLanguageSupported(deviceLanguage) ? deviceLanguage : 'EN'
        await i18n.changeLanguage(languageToSet.toLowerCase())
      }

      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding')
      if (!hasSeenOnboarding) {
        pendingRoute.current = '/onboarding'
      }
      // Remove the else block - auth check is now in app/index.tsx

      setIsLoading(false)
    }

    init()
  }, [])

  useEffect(() => {
    if (!navigationState?.key || !pendingRoute.current) return
    router.replace(pendingRoute.current as any)
    pendingRoute.current = null
  }, [navigationState?.key])

  return { isLoading }
}
