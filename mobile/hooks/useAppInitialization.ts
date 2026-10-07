import { isLanguageSupported } from '@/constants/supportedLanguages'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import i18n from 'i18next'
import { useEffect, useState } from 'react'

// Routing (onboarding vs. welcome vs. tabs) lives entirely in app/index.tsx —
// this hook used to also redirect to /onboarding, which raced with index.tsx's
// own redirect and could get clobbered on a fresh install.
export const useAppInitialization = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const language = await AsyncStorage.getItem('language')
      if (language) {
        await i18n.changeLanguage(language.toLowerCase())
      } else {
        const deviceCode = getLocales()[0]?.languageCode?.toUpperCase() || 'EN'
        // A Ukrainian device reports `uk`; the app's code for Ukrainian is `ua`.
        const deviceLanguage = deviceCode === 'UK' ? 'UA' : deviceCode
        const languageToSet = isLanguageSupported(deviceLanguage) ? deviceLanguage : 'EN'
        await i18n.changeLanguage(languageToSet.toLowerCase())
      }

      setIsLoading(false)
    }

    init()
  }, [])

  return { isLoading }
}
