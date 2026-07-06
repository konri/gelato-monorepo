import Animated, {
    Extrapolation,
    interpolate,
    interpolateColor,
    useAnimatedStyle,
} from "react-native-reanimated";
import type { AnimatedDotProps } from "./types";

const DOT_SIZE = 8;
const ACTIVE_DOT_WIDTH = 24;

export const AnimatedDot = ({
    index,
    scrollX,
    itemWidth,
    activeColor,
    inactiveColor,
}: AnimatedDotProps) => {
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * itemWidth,
            index * itemWidth,
            (index + 1) * itemWidth,
        ];

        return {
            width: interpolate(
                scrollX.value,
                inputRange,
                [DOT_SIZE, ACTIVE_DOT_WIDTH, DOT_SIZE],
                Extrapolation.CLAMP
            ),
            backgroundColor: interpolateColor(
                scrollX.value,
                inputRange,
                [inactiveColor, activeColor, inactiveColor]
            ),
        };
    });

    return (
        <Animated.View
            style={[
                {
                    height: DOT_SIZE,
                    borderRadius: DOT_SIZE / 2,
                },
                animatedStyle,
            ]}
        />
    );
};
