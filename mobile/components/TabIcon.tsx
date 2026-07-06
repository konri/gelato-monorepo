import { Image } from 'expo-image'
import { View } from 'react-native'

interface TabIconProps {
  focused: boolean
  iconUri: string
  alwaysShowBackground?: boolean
}

export const TabIcon = ({ focused, iconUri, alwaysShowBackground }: TabIconProps) => {
  const showBackground = alwaysShowBackground || focused
  const backgroundColor = focused ? '#EC2828' : '#00000040'

  return (
    <View className="items-center justify-center">
      {showBackground && (
        <View
          className="absolute mt-2.5 rounded-[15px] w-[58px] h-[58px]"
          style={{ backgroundColor }}
        />
      )}
      <View className="z-10">
        <Image
          source={{ uri: iconUri }}
          style={{ width: 24, height: 24 }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
    </View>
  )
}
