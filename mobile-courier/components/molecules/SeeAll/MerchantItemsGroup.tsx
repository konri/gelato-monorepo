import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import React, { useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface MerchantItemsGroupProps<T> {
  merchantName: string;
  merchantLogo?: string;
  items: T[];
  renderItem: (item: T) => React.ReactElement;
  itemWidth: number;
  fixedItemWidth?: boolean;
  bulletsColor?: string;
  keyExtractor: (item: T, index: number) => string;
}

export function MerchantItemsGroup<T>({
  merchantName,
  merchantLogo,
  items,
  renderItem,
  itemWidth,
  fixedItemWidth = true,
  bulletsColor = '#EA3A1D',
  keyExtractor,
}: MerchantItemsGroupProps<T>) {
  const [logoError, setLogoError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isSingle = items.length === 1;
  const effectiveItemWidth = isSingle ? screenWidth - 32 : itemWidth;
  const useFixedWidth = isSingle || fixedItemWidth;

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (effectiveItemWidth + 16));
    setCurrentIndex(index);
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center px-4 mb-3">
        {merchantLogo && !logoError && (
          <Image
            url={merchantLogo}
            fallbackWidth={40}
            fallbackHeight={40}
            fallbackLogoSize={8}
            rounded={true}
            className="w-10 h-10 mr-3 rounded-full"
            resizeMode="contain"
            onError={() => setLogoError(true)}
          />
        )}
        <Typography variant="body-lg-semibold" className="text-text-primary">
          {merchantName}
        </Typography>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={useFixedWidth ? effectiveItemWidth + 16 : undefined}
        decelerationRate={useFixedWidth ? 'fast' : 'normal'}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 16, gap: useFixedWidth ? 16 : undefined }}
      >
        {items.map((item, index) => (
          <View key={keyExtractor(item, index)} style={useFixedWidth ? { width: effectiveItemWidth } : undefined}>
            {renderItem(item)}
          </View>
        ))}
      </ScrollView>

      {items.length > 1 && (
        <View className="flex-row justify-center mt-3">
          {items.map((_, index) => (
            <View
              key={index}
              className="h-2 rounded-full mx-1"
              style={{
                width: index === currentIndex ? 32 : 8,
                backgroundColor: index === currentIndex ? bulletsColor : '#d1d5db',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
