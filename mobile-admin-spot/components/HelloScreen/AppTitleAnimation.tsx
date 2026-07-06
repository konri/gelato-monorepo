import { Image } from 'expo-image'
import React, { useEffect, useState } from 'react'
import { Dimensions } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

const { height } = Dimensions.get('window')

const AppTitleAnimation = () => {
  const textOffset = useSharedValue(height * 1.5)
  const [showLoginAnimation, setShowLoginAnimation] = useState(true)

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    top: textOffset.value,
  }))

  useEffect(() => {
    // animate
    textOffset.value = withTiming(height * 0.5 - 36, {
      duration: 1000,
      easing: Easing.out(Easing.quad),
    })
    setTimeout(() => {
      setShowLoginAnimation(false)
    }, 2000)
  }, [])
  
  if (!showLoginAnimation) {
    return null
  }

  return (
    <SafeAreaView
      className="absolute flex-1 w-full h-full z-50 bg-gray-50-light"
    >
      <Animated.View
        className="absolute w-full text-center"
        style={{ top: height * 0.5 - 36 }}
      >
        <Image 
          source={require('@/assets/images/logo.svg')}
          className="w-88 h-88 mx-auto"
          contentFit="contain"
          resizeMode="contain"
        />
        <Image
            source={require('@/assets/images/bonapka.svg')}
            className="w-88 h-24 mx-auto"
            contentFit="contain"
            resizeMode="contain"
        />
      </Animated.View>
    </SafeAreaView>
  )
}

export default AppTitleAnimation
