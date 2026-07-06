import StampFilled from "@/assets/images/stamp_filled.svg";
import { shadows } from "@/constants/shadows";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SvgUri } from "react-native-svg";

type StampProps = {
  isFilled: boolean;
  iconUrl?: string;
};

const ROTATION_RANGE = 25;
const OFFSET_RANGE = 4;

export const Stamp = ({ isFilled, iconUrl }: StampProps) => {
  const { rotation, offset } = useMemo(() => {
    return {
      rotation: Math.round((Math.random() * 2 - 1) * 100) / 100 * ROTATION_RANGE,
      offset: {
        x: Math.round((Math.random() * 2 - 1) * 100) / 100 * OFFSET_RANGE,
        y: Math.round((Math.random() * 2 - 1) * 100) / 100 * OFFSET_RANGE,
      },
    };
  }, []);

  return (
    <View className="w-14 h-14">
      <View className="relative w-14 h-14 rounded-full border-2 border-dashed bg-accent/9 border-accent bg-stamp-empty" />
      {isFilled && (
        <View
          className="absolute w-14 h-14"
          style={[
            styles.filledStamp,
            {
              transform: [
                { translateX: offset.x },
                { translateY: offset.y },
                { rotate: `${rotation}deg` },
              ],
            },
          ]}
        >
          {iconUrl ? (
            <SvgUri uri={iconUrl} width={56} height={56} />
          ) : (
            <StampFilled width={56} height={56} />
          )}
        </View>
      )}
    </View>

  );
};

const styles = StyleSheet.create({
  filledStamp: {
    ...shadows.mediumDown,
  },
});
