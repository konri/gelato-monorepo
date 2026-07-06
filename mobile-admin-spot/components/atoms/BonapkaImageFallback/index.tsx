import BonapkaLogo from "@/assets/images/bonapka.svg";
import { CouponPattern } from "@/components/atoms/CouponPattern";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { LayoutChangeEvent, View } from "react-native";

export type BonapkaImageFallbackProps = {
  logoSize?: number;
};

export const BonapkaImageFallback = ({
  logoSize = 48,
}: BonapkaImageFallbackProps) => {
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  const handleLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => {
      if (prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  }, []);

  return (
    <View className="w-full h-full" onLayout={handleLayout}>
      <LinearGradient
        colors={["#EC2828", "#E8520D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="items-center justify-center relative overflow-hidden w-full h-full"
        style={{ flex: 1 }}
      >
        {size.width > 0 && size.height > 0 && (
          <View className="absolute inset-0 opacity-30">
            <CouponPattern width={size.width} height={size.height} />
          </View>
        )}

        <View className="absolute inset-0 items-center justify-center opacity-60">
          <BonapkaLogo width={logoSize} height={logoSize} fill="white" />
        </View>
      </LinearGradient>
    </View>
  );
};
