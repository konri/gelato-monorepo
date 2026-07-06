import type { ReactElement } from "react";
import type { SharedValue } from "react-native-reanimated";

export type CarouselProps<T> = {
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    renderItem: (item: T, index: number) => ReactElement;
    activeDotColor?: string;
    inactiveDotColor?: string;
    showDotsForSingleItem?: boolean;
};

export type AnimatedDotProps = {
    index: number;
    scrollX: SharedValue<number>;
    itemWidth: number;
    activeColor: string;
    inactiveColor: string;
};
