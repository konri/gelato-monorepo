import { SkeletonRect } from '@/components/atoms/Skeleton';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

const { width: screenWidth } = Dimensions.get('window');
const AUTO_SCROLL_INTERVAL = 5000;

interface AutoScrollCarouselProps<T> {
    data: T[] | undefined | null;
    isLoading: boolean;
    renderItem: (item: T) => React.ReactElement;
    keyExtractor: (item: T, index: number) => string;
    autoScroll?: boolean;
    showPagination?: boolean;
    bulletsColor?: string;
}

export function AutoScrollCarousel<T>({
    data,
    isLoading,
    renderItem,
    keyExtractor,
    autoScroll = false,
    showPagination = false,
    bulletsColor = 'bg-orange-400'
}: AutoScrollCarouselProps<T>) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!autoScroll || !data || data.length <= 1) return;

        const interval = setInterval(() => {
            setActiveIndex((current) => {
                const next = (current + 1) % data.length;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, AUTO_SCROLL_INTERVAL);

        return () => clearInterval(interval);
    }, [data, autoScroll]);

    if (isLoading) {
        return (
            <View className="px-4">
                <SkeletonRect width={screenWidth - 32} height={180} radius={16} />
            </View>
        );
    }

    if (!data || data.length === 0) {
        return null;
    }

    const handleScroll = (event: any) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / screenWidth);
        setActiveIndex(index);
    };

    return (
        <>
            <FlatList
                ref={flatListRef}
                data={data}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                snapToInterval={screenWidth}
                decelerationRate="fast"
                keyExtractor={keyExtractor}
                renderItem={({ item }) => renderItem(item)}
            />

            {showPagination && (
                <View className="flex-row justify-center mt-4">
                    {data.map((_, index) => {
                        return (
                            <View
                                key={index}
                                style={{
                                    height: 8,
                                    borderRadius: 9999,
                                    marginHorizontal: 4,
                                    width: index === activeIndex ? 32 : 8,
                                    backgroundColor: index === activeIndex ? bulletsColor : '#d1d5db'
                                }}
                            />
                        );
                    })}
                </View>
            )}
        </>
    );
}
