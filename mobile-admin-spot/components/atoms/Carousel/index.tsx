import React, { useCallback, useRef } from "react";
import { Dimensions, FlatList, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { AnimatedDot } from "./AnimatedDot";
import type { CarouselProps } from "./types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CAROUSEL_HORIZONTAL_PADDING = 16;
const ITEM_WIDTH = SCREEN_WIDTH - CAROUSEL_HORIZONTAL_PADDING * 2;

const DEFAULT_ACTIVE_COLOR = "#EC2828";
const DEFAULT_INACTIVE_COLOR = "#D1D5DB";

export { ITEM_WIDTH as CAROUSEL_ITEM_WIDTH };

export function Carousel<T>({
    data,
    keyExtractor,
    renderItem,
    activeDotColor = DEFAULT_ACTIVE_COLOR,
    inactiveDotColor = DEFAULT_INACTIVE_COLOR,
    showDotsForSingleItem = false,
}: CarouselProps<T>) {
    const scrollX = useSharedValue(0);

    const viewabilityConfig = useRef({
        viewAreaCoveragePercentThreshold: 50,
    }).current;

    const internalRenderItem = useCallback(
        ({ item, index }: { item: T; index: number }) => (
            <View style={{ width: ITEM_WIDTH }}>
                {renderItem(item, index)}
            </View>
        ),
        [renderItem]
    );

    if (data.length === 0) return null;

    const showDots = data.length > 1 || showDotsForSingleItem;

    return (
        <View className="gap-3">
            <FlatList
                data={data}
                renderItem={internalRenderItem}
                keyExtractor={keyExtractor}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_WIDTH}
                decelerationRate="fast"
                viewabilityConfig={viewabilityConfig}
                scrollEventThrottle={16}
                onScroll={(e) => {
                    scrollX.value = e.nativeEvent.contentOffset.x;
                }}
                getItemLayout={(_, index) => ({
                    length: ITEM_WIDTH,
                    offset: ITEM_WIDTH * index,
                    index,
                })}
            />

            {showDots && (
                <View className="flex-row justify-center gap-2">
                    {data.map((item, index) => (
                        <AnimatedDot
                            key={keyExtractor(item, index)}
                            index={index}
                            scrollX={scrollX}
                            itemWidth={ITEM_WIDTH}
                            activeColor={activeDotColor}
                            inactiveColor={inactiveDotColor}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
