import type { Merchant } from '@repo/types/merchants';
import { Image, Text, View } from 'react-native';

interface MerchantHeaderProps {
  merchant: Merchant;
}

export const MerchantHeader = ({ merchant }: MerchantHeaderProps) => {
  return (
    <View className="p-4">
      {merchant.coverUrl && (
        <Image
          source={{ uri: merchant.coverUrl }}
          className="w-full h-48 rounded-2xl mb-4"
          resizeMode="cover"
        />
      )}

      <View className="flex-row items-center gap-3">
        {merchant.logoUrl && (
          <Image
            source={{ uri: merchant.logoUrl }}
            className="w-10 h-10 rounded-full"
            resizeMode="cover"
          />
        )}
        <View className="flex-1">
          <Text className="urbanist-h4-semibold text-black">{merchant.name}</Text>
          <Text className="urbanist-body-medium-regular text-primary">
            {merchant.category.name}
          </Text>
        </View>
      </View>
    </View>
  );
};
