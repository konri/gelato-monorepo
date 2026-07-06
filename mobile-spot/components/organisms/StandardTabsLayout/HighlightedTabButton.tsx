import React from "react";
import {
    GestureResponderEvent,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

type HighlightedTabButtonProps = {
    children: React.ReactNode;
    onPress: ((e: GestureResponderEvent) => void) | undefined;
    accessibilityState: { selected?: boolean } | undefined;
    enabled: boolean;
};

export const HighlightedTabButton = ({
    children,
    onPress,
    accessibilityState,
    enabled,
}: HighlightedTabButtonProps) => (
    <View style={styles.wrapper}>
        <TouchableOpacity
            onPress={enabled ? onPress : undefined}
            accessibilityState={accessibilityState}
            disabled={!enabled}
            style={[styles.button, { opacity: enabled ? 1 : 0.5 }]}
        >
            <View style={styles.background} />
            {children}
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        marginTop: 0,
        height: 60,
        minHeight: 60,
    },
    button: {
        backgroundColor: "rgba(0, 0, 0, 0.15)",
        borderRadius: 20,
        height: 60,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    background: {
        position: "absolute",
        top: 4,
        right: 0,
        left: 0,
        height: 56,
        backgroundColor: "#efefef",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
    },
});
