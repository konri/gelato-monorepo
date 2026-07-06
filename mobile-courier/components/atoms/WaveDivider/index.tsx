import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface WaveDividerProps {
  width: number;
  color?: string;
  height?: number;
}

export function WaveDivider({ width, color = '#ffffff', height = 16 }: WaveDividerProps) {
  const w = width;
  const h = height;
  // One full wave: starts top-left, curves down then up
  const path = `M0,${h / 2} C${w * 0.25},${h * 1.5} ${w * 0.75},${-h * 0.5} ${w},${h / 2} L${w},0 L0,0 Z`;

  return (
    <Svg width={w} height={h} style={{ position: 'absolute', bottom: -h + 1, left: 0, zIndex: 1 }}>
      <Path d={path} fill={color} />
    </Svg>
  );
}
