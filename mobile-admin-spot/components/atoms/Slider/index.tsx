import { Typography } from "@/components/atoms/Typography";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type GestureResponderEvent, type LayoutChangeEvent, View } from "react-native";
import type { SliderProps } from "./types";

export const Slider = ({
    value,
    max,
    min = 1,
    onValueChange,
}: SliderProps) => {
    const [sliderWidth, setSliderWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(value);
    const sliderRef = useRef<View>(null);
    const sliderLeftRef = useRef(0);

    useEffect(() => {
        if (!isDragging) {
            setDragValue(value);
        }
    }, [value, isDragging]);

    const measureSlider = useCallback(() => {
        sliderRef.current?.measureInWindow((x) => {
            sliderLeftRef.current = x;
        });
    }, []);

    const updateValue = useCallback(
        (pageX: number) => {
            if (sliderWidth <= 0) return;
            const currentLeft = sliderLeftRef.current;
            const relativeX = pageX - currentLeft;
            const ratio = Math.min(Math.max(relativeX / sliderWidth, 0), 1);
            const rawValue = Math.round(ratio * max);
            const newValue = Math.min(Math.max(rawValue, min), max);
            setDragValue(newValue);
            onValueChange(newValue);
        },
        [sliderWidth, max, min, onValueChange]
    );

    const handleResponderGrant = useCallback(
        (evt: GestureResponderEvent) => {
            setIsDragging(true);
            const pageX = evt.nativeEvent.pageX;
            sliderRef.current?.measureInWindow((x) => {
                sliderLeftRef.current = x;
                updateValue(pageX);
            });
        },
        [updateValue]
    );

    const handleResponderMove = useCallback(
        (evt: GestureResponderEvent) => {
            updateValue(evt.nativeEvent.pageX);
        },
        [updateValue]
    );

    const handleResponderRelease = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleResponderTerminate = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleLayout = useCallback(
        (e: LayoutChangeEvent) => {
            setSliderWidth(e.nativeEvent.layout.width);
            measureSlider();
        },
        [measureSlider]
    );

    const currentValue = isDragging ? dragValue : value;
    const percentage = useMemo(
        () => (max > 0 ? (currentValue / max) * 100 : 0),
        [currentValue, max]
    );

    return (
        <View className="gap-2">
            <View className="flex-row items-center justify-center">
                <Typography
                    variant="text-14-semibold"
                    className="text-blue-900"
                >
                    {value}/{max}
                </Typography>
            </View>
            <View
                ref={sliderRef}
                className="flex-row items-center"
                onLayout={handleLayout}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleResponderGrant}
                onResponderMove={handleResponderMove}
                onResponderRelease={handleResponderRelease}
                onResponderTerminate={handleResponderTerminate}
            >
                <View className="flex-1 flex-row items-center h-5 px-2.5">
                    <View className="flex-1 h-1.5 rounded-full bg-gray-200 flex-row items-center">
                        <View
                            className="h-1.5 rounded-full bg-blue-900 flex-row items-center"
                            style={{
                                width: `${percentage}%`,
                            }}
                        >
                            <View className="flex-1" />
                            <View className="w-5 h-5 rounded-full bg-gray-50-light border-2 border-blue-900 -ml-2.5" />
                        </View>
                        <View className="flex-1" />
                    </View>
                </View>
            </View>
        </View>
    );
};
