import { Text, View, Pressable, Image } from 'react-native';
import { config } from '@/config';
import { FallbackImage } from '@/components/atoms/FallbackImage/FallbackImage';

interface StoreCardProps {
  store: any;
  onPress: () => void;
}

export const StoreCard = ({ store, onPress }: StoreCardProps) => {
  const mainImage = store.images?.find((img: any) => img.type === 'main');

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl shadow-sm border border-gray-100"
      style={{ width: 240, height: 160 }}
    >
      <View className="flex-1">
        {mainImage ? (
          <Image
            source={{ uri: `${config.API_URL}${mainImage.url}` }}
            className="w-full h-32 rounded-t-2xl"
            resizeMode="cover"
          />
        ) : (
          <View className="rounded-t-2xl overflow-hidden">
            <FallbackImage width={240} height={112} logoSize={24} />
          </View>
        )}
        <View className="p-3 flex-1 justify-between">
          <Text 
            className="text-sm font-semibold text-gray-800" 
            style={{ fontFamily: 'Urbanist' }}
            numberOfLines={1}
          >
            {store.name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
