import { BonapkaImageFallback } from "@/components/atoms/BonapkaImageFallback";
import { remoteImageSource } from "@/utils/optionalImageUri";
import {
    Image as ExpoImage,
    ImageProps as ExpoImageProps,
    type ImageErrorEventData,
} from "expo-image";
import React, { useEffect, useState } from "react";
import { Image as RNImage, type ImageResizeMode } from "react-native";

type ImageProps = Omit<ExpoImageProps, "source"> & {
  source?: ExpoImageProps["source"] | null;
  uri?: string | null;
  fallbackLogoSize?: number;
};

const RESIZE_MODE: Record<
  NonNullable<ExpoImageProps["contentFit"]>,
  ImageResizeMode
> = {
  cover: "cover",
  contain: "contain",
  fill: "stretch",
  none: "center",
  "scale-down": "contain",
};

function extractUri(
  source: ExpoImageProps["source"] | null | undefined,
): string | null {
  if (source == null || typeof source === "number") return null;
  if (typeof source === "string") return source;
  const first = Array.isArray(source) ? source[0] : source;
  if (first == null || typeof first === "number" || typeof first === "string") {
    return typeof first === "string" ? first : null;
  }
  const uri = Reflect.get(first, "uri");
  return typeof uri === "string" ? uri : null;
}

const LOCAL_SCHEMES = ["file:", "content:", "ph:", "assets-library:"];
const isLocal = (uri: string) =>
  LOCAL_SCHEMES.some((s) => uri.toLowerCase().startsWith(s));

export const Image = ({
  source,
  uri,
  fallbackLogoSize = 48,
  onError,
  contentFit = "cover",
  style,
  className,
  testID,
  ...rest
}: ImageProps) => {
  const [hasError, setHasError] = useState(false);
  const effectiveSource = remoteImageSource(uri) ?? source;
  const resolvedUri = extractUri(effectiveSource);

  useEffect(() => setHasError(false), [resolvedUri]);

  if (effectiveSource == null || hasError) {
    return <BonapkaImageFallback logoSize={fallbackLogoSize} />;
  }

  if (resolvedUri && isLocal(resolvedUri)) {
    return (
      <RNImage
        key={resolvedUri}
        source={{ uri: resolvedUri }}
        resizeMode={RESIZE_MODE[contentFit] ?? "cover"}
        onError={() => {
          setHasError(true);
          onError?.({ error: "Failed to load local image" });
        }}
        style={style}
        className={className}
        testID={testID}
      />
    );
  }

  return (
    <ExpoImage
      source={effectiveSource}
      onError={(e: ImageErrorEventData) => {
        setHasError(true);
        onError?.(e);
      }}
      contentFit={contentFit}
      style={style}
      className={className}
      testID={testID}
      {...rest}
    />
  );
};
