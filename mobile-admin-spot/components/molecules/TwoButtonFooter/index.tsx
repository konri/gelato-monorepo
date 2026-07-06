import { Button } from "@/components/atoms/Button";
import React from "react";
import { View } from "react-native";
import type { TwoButtonFooterProps } from "./types";

export const TwoButtonFooter = ({
    leftButton,
    rightButton,
    containerClassName = "flex-row gap-4",
}: TwoButtonFooterProps) => {
    const hasBothButtons = Boolean(leftButton && rightButton);

    const leftWidth =
        leftButton?.width ?? (hasBothButtons ? "50%" : "100%");
    const rightWidth =
        rightButton?.width ?? (hasBothButtons ? "50%" : "100%");

    if (!leftButton && !rightButton) {
        return null;
    }

    return (
        <View className={containerClassName}>
            {leftButton && (
                <Button
                    title={leftButton.title}
                    onPress={leftButton.onPress}
                    variant={leftButton.variant ?? "outlineSecondary"}
                    size={leftButton.size ?? "sm"}
                    width={leftWidth}
                    disabled={leftButton.disabled ?? false}
                />
            )}
            {rightButton && (
                <Button
                    title={rightButton.title}
                    onPress={rightButton.onPress}
                    variant={rightButton.variant ?? "primary"}
                    size={rightButton.size ?? "sm"}
                    width={rightWidth}
                    disabled={rightButton.disabled ?? false}
                />
            )}
        </View>
    );
};

