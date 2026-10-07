import {
  barRuns,
  encodeCode128B,
  isCode128BEncodable,
  layoutCode128,
  QUIET_ZONE_MODULES,
} from '@/utils/barcode/code128';
import React, { useMemo } from 'react';
import { PixelRatio, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

type Props = {
  value: string;
  /** Available width in points; the symbol is snapped to whole device pixels. */
  maxWidth: number;
  height: number;
  accessibilityLabel?: string;
};

/** Pixel-snapped layout for `value`, or null when it cannot be drawn sharply. */
export function useCode128Layout(value: string, maxWidth: number) {
  return useMemo(() => {
    if (!isCode128BEncodable(value)) return null;
    const bits = encodeCode128B(value);
    const layout = layoutCode128(bits.length, maxWidth, PixelRatio.get());
    return layout ? { bits, layout } : null;
  }, [value, maxWidth]);
}

/**
 * Code 128B of a loyalty / reward code, drawn with react-native-svg
 * (BRANDS_SPEC §5.4): 10-module quiet zones, every module a whole number of
 * device pixels, black on white (never inverted in dark mode). Renders nothing
 * when a module would be under 2 px — the caller shows the QR code instead
 * (see `useCode128Layout`).
 */
export function Code128Barcode({ value, maxWidth, height, accessibilityLabel }: Props) {
  const encoded = useCode128Layout(value, maxWidth);

  const path = useMemo(() => {
    if (!encoded) return '';
    const { bits, layout } = encoded;
    const m = layout.modulePt;
    return barRuns(bits)
      .map(([start, width]) => {
        const x = (start + QUIET_ZONE_MODULES) * m;
        return `M${x} 0h${width * m}v${height}h${-width * m}Z`;
      })
      .join('');
  }, [encoded, height]);

  if (!encoded) return null;
  const { widthPt } = encoded.layout;

  return (
    <View
      style={{ width: widthPt, height, backgroundColor: '#FFFFFF' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={widthPt} height={height}>
        <Rect x={0} y={0} width={widthPt} height={height} fill="#FFFFFF" />
        <Path d={path} fill="#000000" />
      </Svg>
    </View>
  );
}
