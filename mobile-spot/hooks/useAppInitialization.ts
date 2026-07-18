import { isLanguageSupported } from '@/constants/supportedLanguages'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import i18n from 'i18next'
import { useEffect, useState } from 'react'

export const useAppInitialization = () => {
  const [isLoading, setIsLoading] = useState(true)

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

      // The spot app has no onboarding flow; auth-based routing (tabs vs
      // login) is handled in app/index.tsx, so there's nothing to redirect
      // to here.

      setIsLoading(false)
    }

    init()
  }, [])

  return { isLoading }
}
