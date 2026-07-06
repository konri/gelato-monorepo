import { Link, Stack } from 'expo-router'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

export default function NotFoundScreen() {
  const { t } = useTranslation()

  return (
    <>
      <Stack.Screen options={{ title: t('NotFound.title') }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text>{t('NotFound.message')}</Text>
        <Link href="/" className="mt-4 py-4">
          <Text>{t('NotFound.goHome')}</Text>
        </Link>
      </View>
    </>
  )
}
