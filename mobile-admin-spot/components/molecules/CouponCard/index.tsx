import BonapkaLogo from "@/assets/images/bonapka.svg";
import BonapkaWithGap from "@/assets/images/bonapka_with_gap.svg";
import { Image } from "@/components/atoms/Image";
import { Typography } from "@/components/atoms/Typography";

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";
import { twMerge } from "tailwind-merge";

const couponThumbImageStyle = {
  width: "100%" as const,
  height: "100%" as const,
};

type CouponCardProps = {
  discountText: string;
  title?: string;
  imageUrl?: string;
  useGrayImagePlaceholder?: boolean;
  className?: string;
};

export const CouponCard = ({
  discountText,
  title,

  imageUrl,
  useGrayImagePlaceholder = false,

  className,
}: CouponCardProps) => {
  return (
    <View
      className={twMerge(
        "w-full h-40 rounded-14 overflow-hidden relative",
        className
      )}
    >
      <LinearGradient
        colors={["#EC2828", "#E8520D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <View className="flex-row h-full relative z-10">
        <View className="w-32 h-full overflow-hidden">
          {useGrayImagePlaceholder ? (
            <View className="w-full h-full bg-gray-300" />) : (
            <Image
              uri={imageUrl}
              className="w-full h-full"
              style={couponThumbImageStyle}
              contentFit="cover"
              fallbackLogoSize={24}
            />
          )}
        </View>

        <View className="flex-1 h-full relative py-3 pl-3 pr-3 gap-2.5">
          <View className="flex-row items-center">
            <BonapkaLogo width={24} height={22} />

            <View className="flex-1 h-6 opacity-30 overflow-hidden items-center">
              <Svg
                width="100%"
                height={18}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 1,
                }}
              >
                <Defs>
                  <Pattern
                    id="bonapkaPattern"
                    patternUnits="userSpaceOnUse"
                    width={30}
                    height={16}
                    x={0}
                    y={0}
                  >
                    <BonapkaWithGap width={41} height={20} />
                  </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#bonapkaPattern)" />
              </Svg>
            </View>
          </View>

          <View className="flex-1 justify-between">
            {discountText && (
              <Typography
                variant="text-42-regular"
                className="text-white"
                numberOfLines={1}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {discountText}
              </Typography>
            )}

            {title && (
              <Typography
                variant="text-15-regular"
                className="text-white"
                numberOfLines={2}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {title}
              </Typography>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
