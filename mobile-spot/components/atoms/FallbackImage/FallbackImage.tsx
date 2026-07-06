import { BonapkaImageFallback } from '@/components/atoms/BonapkaImageFallback';
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

type StoreFallbackImageProps = {
  width?: number;
  height?: number;
  logoSize?: number;
  rounded?: boolean;
  borderRadius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export const FallbackImage = ({
  width,
  height,
  logoSize = 48,
  rounded = false,
  borderRadius,
  className,
  style,
}: StoreFallbackImageProps) => {
  const computedBorderRadius =
    borderRadius !== undefined ? borderRadius : rounded && width ? width / 2 : undefined;

  // Size priority: explicit pixel dimensions → the caller's className
  // (e.g. `w-full h-32`) → fill the parent. This keeps the placeholder the
  // same size as the real image so the centered logo stays visible.
  let sizeStyle: ViewStyle | null = null;
  if (width && height) {
    sizeStyle = { width, height };
  } else if (!className) {
    sizeStyle = { flex: 1, width: '100%', height: '100%' };
  }

  return (
    <View
      className={className}
      style={[
        { position: 'relative', overflow: 'hidden' },
        sizeStyle,
        computedBorderRadius !== undefined ? { borderRadius: computedBorderRadius } : null,
        style,
      ]}
    >
      <BonapkaImageFallback logoSize={logoSize} />
    </View>
  );
};
