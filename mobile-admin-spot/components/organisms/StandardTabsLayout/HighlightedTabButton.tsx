import React from "react";
import { GestureResponderEvent, TouchableOpacity, View } from "react-native";

type HighlightedTabButtonProps = {
    children: React.ReactNode;
    onPress: ((e: GestureResponderEvent) => void) | undefined;
    accessibilityState: { selected?: boolean } | undefined;
    enabled: boolean;
};

const BACKGROUND_SHADOW = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
} as const;

export const HighlightedTabButton = ({
    children,
    onPress,
    accessibilityState,
    enabled,
}: HighlightedTabButtonProps) => (
    <View className="flex-1 mt-0.5 h-16 min-h-16">
        <TouchableOpacity
            onPress={enabled ? onPress : undefined}
            accessibilityState={accessibilityState}
            disabled={!enabled}
            className={`bg-black/15 rounded-2xl h-16 w-full items-center justify-center overflow-hidden ${enabled ? "opacity-100" : "opacity-50"}`}
        >
            <View
                className="absolute top-1 right-0 left-0 h-14 bg-gray-lighter rounded-tl-2xl rounded-tr-2xl"
                style={BACKGROUND_SHADOW}
            />
            {children}
        </TouchableOpacity>
    </View>
);
