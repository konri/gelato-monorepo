import React, { useState } from 'react';
import { Image as RNImage, ImageProps as RNImageProps, ImageSourcePropType } from 'react-native';
import { config } from '@/config';
import { FallbackImage } from '../FallbackImage/FallbackImage';

interface ImageProps extends Omit<RNImageProps, 'source'> {
  url?: string;
  source?: ImageSourcePropType;
  fallbackWidth?: number;
  fallbackHeight?: number;
  fallbackLogoSize?: number;
  rounded?: boolean;
}

export function Image({
  url,
  source,
  fallbackWidth,
  fallbackHeight,
  fallbackLogoSize = 64,
  rounded,
  ...props
}: ImageProps) {
  const [imageError, setImageError] = useState(false);

  if ((!url && !source) || imageError) {
    // Forward the caller's className/style so the placeholder fills the same
    // box as the real image would (e.g. `w-full h-32`). Only fall back to
    // explicit pixel dimensions when the caller passed them.
    return (
      <FallbackImage
        width={fallbackWidth}
        height={fallbackHeight}
        logoSize={fallbackLogoSize}
        rounded={rounded}
        className={props.className}
        style={props.style}
      />
    );
  }

  if (source) {
    return (
      <RNImage
        {...props}
        source={source}
        onError={() => setImageError(true)}
      />
    );
  }

  const fullUrl = url!.startsWith('http') ? url : `${config.API_URL}${url}`;

  return (
    <RNImage
      {...props}
      source={{ uri: fullUrl }}
      onError={() => setImageError(true)}
    />
  );
}