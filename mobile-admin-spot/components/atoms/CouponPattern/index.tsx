import React from "react";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";

import { CouponPatternProps } from "./types";

export const CouponPattern = ({ width, height }: CouponPatternProps) => (
  <Svg width={width} height={height}>
    <Defs>
      <Pattern
        id="diagonalPattern"
        x="0"
        y="0"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <Path d="M0 20L20 0" stroke="white" strokeWidth={1} opacity={0.4} />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#diagonalPattern)" />
  </Svg>
);
