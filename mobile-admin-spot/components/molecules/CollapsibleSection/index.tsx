import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import type { CollapsibleSectionProps } from "./types";

export const CollapsibleSection = ({
    title,
    children,
    defaultExpanded = true,
}: CollapsibleSectionProps) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const rotation = useSharedValue(defaultExpanded ? 0 : 180);

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const toggle = () => {
        setExpanded((prev) => !prev);
        rotation.value = withTiming(expanded ? 180 : 0, { duration: 250 });
    };

    return (
        <View className="bg-white rounded-2xl border border-accent py-4 gap-3">
            <Pressable
                onPress={toggle}
                className="flex-row items-center justify-between px-4"
                accessibilityRole="button"
            >
                <View className="flex-1">
                    <Typography
                        variant="text-16-bold"
                        className="text-center"
                    >
                        {title}
                    </Typography>
                </View>
                <Animated.View style={chevronStyle}>
                    <Ionicons name="chevron-up" size={20} color="#1A4196" />
                </Animated.View>
            </Pressable>
            {expanded && (
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
                    {children}
                </Animated.View>
            )}
        </View>
    );
};
