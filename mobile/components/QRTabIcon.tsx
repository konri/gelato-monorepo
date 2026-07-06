import { Image } from 'expo-image';
import { View, Text } from 'react-native';
import { useActiveCoupons } from '@/hooks/useActiveCoupons';

interface QRTabIconProps {
  focused: boolean;
  iconUri: string;
  alwaysShowBackground?: boolean;
}

export const QRTabIcon = ({ focused, iconUri, alwaysShowBackground }: QRTabIconProps) => {
  const { coupons } = useActiveCoupons();
  const showBackground = alwaysShowBackground || focused;
  const backgroundColor = focused ? '#EC2828' : '#00000040';
  const activeCouponsCount = coupons?.length || 0;

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
        {activeCouponsCount > 0 && (
          <View 
            className="absolute -top-1 -right-1 bg-accent rounded-full min-w-[16px] h-4 items-center justify-center px-1"
            style={{ backgroundColor: '#EC2828' }}
          >
            <Text className="text-white text-xs font-bold" style={{ fontSize: 10 }}>
              {activeCouponsCount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};