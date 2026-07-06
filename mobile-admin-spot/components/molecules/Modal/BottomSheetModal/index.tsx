import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import {
    BottomSheetBackdrop,
    BottomSheetModal as GorhomBottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModalProps } from "./types";

const BottomSheetModal = ({
    visible,
    onClose,
    children,
    title,
    snapPoints: customSnapPoints,
    enableDynamicSizing = false,
    enablePanDownToClose: enablePanDownToCloseProp = true,
    footerComponent,
    keyboardBehavior,
    keyboardBlurBehavior,
    androidKeyboardInputMode,
}: BottomSheetModalProps) => {
    const bottomSheetRef = useRef<GorhomBottomSheetModal>(null);
    const insets = useSafeAreaInsets();

    const snapPoints = useMemo(
        () => customSnapPoints ?? ["50%", "90%"],
        [customSnapPoints]
    );

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    const handleSheetChanges = useCallback(
        (index: number) => {
            if (index === -1) {
                onClose();
            }
        },
        [onClose]
    );

    const renderBackdrop = useCallback(
        (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.6}
            />
        ),
        []
    );

    return (
        <GorhomBottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={enableDynamicSizing ? undefined : snapPoints}
            enableDynamicSizing={enableDynamicSizing}
            onChange={handleSheetChanges}
            onDismiss={onClose}
            enablePanDownToClose={enablePanDownToCloseProp}
            backdropComponent={renderBackdrop}
            footerComponent={footerComponent}
            keyboardBehavior={keyboardBehavior}
            keyboardBlurBehavior={keyboardBlurBehavior}
            android_keyboardInputMode={androidKeyboardInputMode}
            handleIndicatorStyle={styles.handleIndicator}
            backgroundStyle={styles.background}
        >
            <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
                {title && (
                    <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
                        <View className="flex-1">
                            <Typography
                                variant="text-18-bold-tight"
                                className="text-black"
                                numberOfLines={2}
                            >
                                {title}
                            </Typography>
                        </View>
                        <Pressable
                            onPress={onClose}
                            className="w-10 h-10 rounded-full bg-white items-center justify-center"
                            hitSlop={8}
                        >
                            <Ionicons name="close" size={24} color="#374151" />
                        </Pressable>
                    </View>
                )}
                <View className="flex-1">{children}</View>
            </View>
        </GorhomBottomSheetModal>
    );
};

const styles = StyleSheet.create({
    handleIndicator: {
        backgroundColor: "#CBD5E1",
        width: 40,
    },
    background: {
        backgroundColor: "#F3F3F3",
    },
});

export { BottomSheetModal };
