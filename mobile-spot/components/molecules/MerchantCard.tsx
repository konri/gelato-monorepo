import type { Merchant } from '@repo/types/merchants';
import { Link } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

interface MerchantCardProps {
  merchant: Merchant;
  withoutImage?: boolean;
}

export const MerchantCard = ({ merchant, withoutImage }: MerchantCardProps) => {
  return (
    <Link href={`/merchants/${merchant.id}`} asChild>
      <Pressable className="w-full">
        <View className="bg-gray-100">
          {merchant.logoUrl && !withoutImage && (
            <View className="relative">
              <Image
                source={{ uri: merchant.logoUrl }}
                className="w-full h-[150px] object-cover"
                resizeMode="cover"
              />
              {merchant.iconUrl && (
                <View className="absolute left-2 bottom-2 bg-white rounded-full p-[1px]">
                  <Image
                    source={{ uri: merchant.iconUrl }}
                    className="w-6 h-6"
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          )}
          {(!merchant.logoUrl || withoutImage) && (
            <View className="relative bg-white flex items-center justify-center h-[100px]">
              {merchant.iconUrl && (
                <Image
                  source={{ uri: merchant.iconUrl }}
                  className="w-[60px] h-[60px]"
                  resizeMode="cover"
                />
              )}
            </View>
          )}
          <View className="flex flex-col gap-2 bg-white p-2">
            <Text className="urbanist-h4-semibold text-black">{merchant.name}</Text>
            <Text className="urbanist-body-small-medium text-primary">
              {merchant.category.name}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};
