import { isSvgUrl } from "@/utils/urlUtils";
import { Image } from "expo-image";
import React, { useState } from "react";
import { ActivityIndicator, View, ViewStyle } from "react-native";
import { SvgUri } from "react-native-svg";
import type { RemoteIconProps } from "./types";

export const RemoteIcon = ({
  url,
  width = 24,
  height = 24,
  className,
  style,
  fallback,
  onError,
  onLoad,
}: RemoteIconProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!url || error) {
    return fallback ? <>{fallback}</> : null;
  }

  if (isSvgUrl(url)) {
    return (
      <View className={className} style={style}>
        <SvgUri
          uri={url}
          width={typeof width === "number" ? width : undefined}
          height={typeof height === "number" ? height : undefined}
          onError={() => {
            setError(true);
            onError?.();
          }}
          onLoad={() => {
            onLoad?.();
          }}
        />
      </View>
    );
  }

  const handleImageLoad = () => {
    setImageLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageLoading(false);
    setError(true);
    onError?.();
  };

  const widthValue = typeof width === "number" ? width : undefined;
  const heightValue = typeof height === "number" ? height : undefined;

  const containerStyle: ViewStyle[] = [];
  if (widthValue !== undefined) {
    containerStyle.push({ width: widthValue });
  }
  if (heightValue !== undefined) {
    containerStyle.push({ height: heightValue });
  }
  if (style) {
    containerStyle.push(style);
  }

  return (
    <View
      className={className}
      style={containerStyle.length > 0 ? containerStyle : undefined}
    >
      {imageLoading && (
        <View className="absolute w-full h-full items-center justify-center">
          <ActivityIndicator size="small" />
        </View>
      )}
      <Image
        source={{ uri: url }}
        className="w-full h-full"
        contentFit="contain"
        onLoad={handleImageLoad}
        onError={handleImageError}
        transition={200}
      />
    </View>
  );
};
