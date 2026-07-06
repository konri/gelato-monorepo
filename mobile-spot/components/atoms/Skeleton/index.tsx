import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

// ─── Shimmer colours ────────────────────────────────────────────────────────
const SHIMMER_BASE = '#E0E0E0';
const SHIMMER_HIGHLIGHT = '#F5F5F5';
const SHIMMER_WIDTH_MULTIPLIER = 3; // gradient is 3× the element width

// ─── SkeletonShimmer ─────────────────────────────────────────────────────────
interface ShimmerProps {
  width: number;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonShimmer({ width, height, borderRadius = 8, style }: ShimmerProps) {
  const translateX = useSharedValue(-width * SHIMMER_WIDTH_MULTIPLIER);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width * SHIMMER_WIDTH_MULTIPLIER, {
        duration: 1400,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[{ width, height, borderRadius, overflow: 'hidden', backgroundColor: SHIMMER_BASE }, style]}
      accessible
      accessibilityLabel="Ładowanie zawartości..."
      aria-busy
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[SHIMMER_BASE, SHIMMER_HIGHLIGHT, SHIMMER_BASE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: width * SHIMMER_WIDTH_MULTIPLIER, height }}
        />
      </Animated.View>
    </View>
  );
}

// ─── Skeleton (wrapper) ───────────────────────────────────────────────────────
export interface SkeletonProps {
  isLoading: boolean;
  children: React.ReactElement;
  /** 'circle' forces borderRadius = half of measured size */
  shape?: 'circle' | 'rect';
  /** Manual border radius override (ignored when shape='circle') */
  radius?: number;
  style?: ViewStyle;
}

/**
 * Drop-in wrapper. When isLoading=true it renders a shimmer placeholder
 * that matches the measured dimensions of children.
 *
 * @example
 * <Skeleton isLoading={loading} shape="circle">
 *   <Image source={avatar} style={{ width: 48, height: 48, borderRadius: 24 }} />
 * </Skeleton>
 */
export function Skeleton({ isLoading, children, shape = 'rect', radius = 8, style }: SkeletonProps) {
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);

  const borderRadius = shape === 'circle' && size ? size.width / 2 : radius;

  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setSize({ width, height });
      }}
      style={style}
    >
      {/* Always render children so layout is measured and stable */}
      <View style={isLoading ? styles.hidden : undefined}>{children}</View>

      {isLoading && size && (
        <SkeletonShimmer
          width={size.width}
          height={size.height}
          borderRadius={borderRadius}
          style={StyleSheet.absoluteFillObject}
        />
      )}
    </View>
  );
}

// ─── Atomic primitives ────────────────────────────────────────────────────────

interface RectProps {
  width: number | string;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

/** Standalone rectangular skeleton block */
export function SkeletonRect({ width, height, radius = 8, style }: RectProps) {
  return (
    <SkeletonShimmer
      width={typeof width === 'number' ? width : 200}
      height={height}
      borderRadius={radius}
      style={style}
    />
  );
}

interface CircleProps {
  size: number;
  style?: ViewStyle;
}

/** Standalone circular skeleton block */
export function SkeletonCircle({ size, style }: CircleProps) {
  return (
    <SkeletonShimmer
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

interface TextProps {
  width?: number | string;
  lines?: number;
  lineHeight?: number;
  gap?: number;
  radius?: number;
  style?: ViewStyle;
}

/** Multi-line text skeleton. Last line is 60% width for a natural look. */
export function SkeletonText({
  width = 200,
  lines = 1,
  lineHeight = 16,
  gap = 8,
  radius = 4,
  style,
}: TextProps) {
  const w = typeof width === 'number' ? width : 200;
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonShimmer
          key={i}
          width={i === lines - 1 && lines > 1 ? w * 0.6 : w}
          height={lineHeight}
          borderRadius={radius}
        />
      ))}
    </View>
  );
}

// ─── SkeletonContainer ────────────────────────────────────────────────────────

interface ContainerProps {
  isLoading: boolean;
  children: React.ReactNode;
}

/**
 * Optional outer wrapper. Provides semantic context for a group of skeletons.
 * Individual <Skeleton> components manage their own animation independently.
 */
export function SkeletonContainer({ isLoading, children }: ContainerProps) {
  return (
    <View
      accessible
      accessibilityLabel={isLoading ? 'Ładowanie zawartości...' : undefined}
      aria-busy={isLoading}
    >
      {children}
    </View>
  );
}

// ─── LoadMoreSkeleton ─────────────────────────────────────────────────────────

/** Generic load-more footer skeleton: 2 full-width rows */
export function LoadMoreSkeleton() {
  return (
    <View className="px-4 pt-2 gap-3">
      {[1, 2].map((i) => (
        <SkeletonRect key={i} width="100%" height={80} radius={12} />
      ))}
    </View>
  );
}

// ─── useSkeleton hook ─────────────────────────────────────────────────────────

/**
 * Convenience hook for wrapping any component with skeleton behaviour.
 *
 * @example
 * const { wrap } = useSkeleton(isLoading);
 * return wrap(<Image source={src} style={styles.img} />, { shape: 'circle' });
 */
export function useSkeleton(isLoading: boolean) {
  function wrap(
    element: React.ReactElement,
    options?: Omit<SkeletonProps, 'isLoading' | 'children'>,
  ) {
    return (
      <Skeleton isLoading={isLoading} {...options}>
        {element}
      </Skeleton>
    );
  }
  return { wrap };
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
});
