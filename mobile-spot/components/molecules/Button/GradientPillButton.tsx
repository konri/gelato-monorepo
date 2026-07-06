import { Typography } from '@/components/atoms/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import {
  GRADIENT_PILL_BORDER,
  GRADIENT_PILL_HEIGHT,
  GRADIENT_PILL_RADIUS,
} from './gradientPillLayout';
import type { GradientPillButtonProps } from './types';

const GRADIENT_COLORS = ['#FFAA88', '#BD0000'] as const;
const GRADIENT_PILL_SHADOW = {
  shadowColor: '#E52121',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 7.3,
  elevation: 6,
} as const;

export function GradientPillButton({
  title,
  onPress,
  leftIcon,
  rightIcon,
  size = 'default',
  textVariant,
  className,
}: GradientPillButtonProps) {
  const resolvedTextVariant =
    textVariant ?? (size === 'small' ? 'body-base-small' : 'body-small-bold');

  const outerHeight = GRADIENT_PILL_HEIGHT[size];
  const innerMinHeight = outerHeight - GRADIENT_PILL_BORDER * 2;

  const innerPadClass = size === 'small' ? 'px-2 gap-1' : 'px-3 gap-2';

  const innerClassName = twMerge(
    'flex-row items-center justify-center rounded-full-pill bg-background-gray',
    innerPadClass,
  );

  const gradientFrameStyle = {
    height: outerHeight,
    borderRadius: GRADIENT_PILL_RADIUS,
    padding: GRADIENT_PILL_BORDER,
  };

  const content = (
    <>
      {leftIcon != null ? <View className="shrink-0">{leftIcon}</View> : null}
      <Typography variant={resolvedTextVariant} className="text-center text-accent-dark">
        {title}
      </Typography>
      {rightIcon != null ? <View className="shrink-0">{rightIcon}</View> : null}
    </>
  );

  return (
    <View className={twMerge(className)} style={GRADIENT_PILL_SHADOW}>
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={gradientFrameStyle}
      >
        {onPress != null ? (
          <Pressable
            onPress={onPress}
            className={innerClassName}
            style={{ minHeight: innerMinHeight }}
          >
            {content}
          </Pressable>
        ) : (
          <View className={innerClassName} style={{ minHeight: innerMinHeight }}>
            {content}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
