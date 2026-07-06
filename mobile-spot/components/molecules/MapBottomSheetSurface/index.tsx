import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { MAP_BOTTOM_SHEET_CARD_SHADOW } from './sheetShadowStyle';
import type { MapBottomSheetSurfaceProps } from './types';

export const MapBottomSheetSurface = ({
  translateY,
  panGesture,
  topAccessory,
  children,
  layoutMode = 'screen',
}: MapBottomSheetSurfaceProps) => {
  const containerHeight = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: Math.max(0, containerHeight.value - translateY.value),
  }));

  const handleRow = (
    <View className="w-full items-center px-2 py-2">
      <View className="w-12 h-1 bg-background-lightGray rounded-sm" />
    </View>
  );

  const cardScreenClassName = 'bg-white rounded-t-3xl flex-1';
  const cardIntrinsicClassName = 'bg-white rounded-t-3xl';
  const cardStyle = [
    MAP_BOTTOM_SHEET_CARD_SHADOW,
    Platform.OS === 'android' ? { overflow: 'hidden' as const } : undefined,
  ];

  if (layoutMode === 'intrinsic') {
    return (
      <View pointerEvents="box-none">
        {topAccessory}
        <View className={cardIntrinsicClassName} style={cardStyle}>
          {panGesture != null ? (
            <GestureDetector gesture={panGesture}>{handleRow}</GestureDetector>
          ) : (
            handleRow
          )}
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="box-none"
      onLayout={(e) => {
        containerHeight.value = e.nativeEvent.layout.height;
      }}
    >
      <Animated.View
        style={[
          { position: 'absolute', left: 0, right: 0, top: 0 },
          animatedStyle,
        ]}
      >
        {topAccessory}
        <View className={cardScreenClassName} style={cardStyle}>
          {panGesture != null ? (
            <GestureDetector gesture={panGesture}>{handleRow}</GestureDetector>
          ) : (
            handleRow
          )}
          {children}
        </View>
      </Animated.View>
    </View>
  );
};
