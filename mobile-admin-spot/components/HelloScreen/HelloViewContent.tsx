import { Link, useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, Pressable, View } from 'react-native'
import { Typography } from '@/components/atoms/Typography'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

const HelloViewContent = () => {
  const wrapperOffset = useSharedValue(width)
  const { t } = useTranslation()
  const slideInAnimation = useAnimatedStyle(() => ({
    left: wrapperOffset.value,
  }))
  const router = useRouter()

  useEffect(() => {
    wrapperOffset.value = withDelay(
      2000,
      withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      }),
    )
  }, [])
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
    <Animated.View
      style={[{
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8
      }, slideInAnimation]}
    >
        <View className="flex justify-center items-center">
          <Typography variant="text-24-bold" className="mb-2">
            {t('Hello.hello')}
          </Typography>
          <Typography variant="text-16-regular" className="text-gray-600">
            {t('Hello.signIn')}
          </Typography>
        </View>
       
    </Animated.View>
    </SafeAreaView>
  )
}

export default HelloViewContent
