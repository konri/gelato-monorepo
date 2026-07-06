import { Typography } from "@/components/atoms/Typography";
import React, { useState } from "react";
import { LayoutChangeEvent, Pressable, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

type FormSectionProps = {
  stepNumber: number;
  title: string;
  subtitle?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  isExpanded?: boolean;
  children: React.ReactNode;
  showConnector?: boolean;
  navigationButtons?: React.ReactNode;
  onTitlePress?: () => void;
};

export const FormSection = ({
  stepNumber,
  title,
  subtitle,
  isCompleted = false,
  isActive = false,
  isExpanded = false,
  children,
  showConnector = true,
  navigationButtons,
  onTitlePress,
}: FormSectionProps) => {
  const [sectionHeight, setSectionHeight] = useState(0);
  const shouldShowContent = isExpanded;

  const handleSectionLayout = (event: LayoutChangeEvent) => {
    const { height: measuredHeight } = event.nativeEvent.layout;
    if (measuredHeight > 0) {
      setSectionHeight(measuredHeight);
    }
  };

  return (
    <View className="w-full">
      <View
        className="flex-row items-start relative gap-3"
        onLayout={handleSectionLayout}
      >
        <View className="items-center relative">
          <View
            className={`items-center justify-center w-8 h-8 rounded-3xl  ${isCompleted ? "bg-blue-900" : "bg-gray-light"
              }`}
          >
            {isCompleted ? (
              <Typography variant="text-14-semibold" className="text-white">
                ✓
              </Typography>
            ) : (
              <Typography
                variant="text-14-semibold"
                className="text-gray-500"
              >
                {stepNumber}
              </Typography>
            )}
          </View>
          {showConnector && sectionHeight > 0 && (
            <View
              className="absolute w-0.5 bg-gray-300-medium"
              style={{
                left: 14,
                top: 40,
                height: Math.max(sectionHeight - 38, 0),
              }}
            />
          )}
        </View>

        <View className="flex-1 my-1 gap-2">
          <Pressable onPress={onTitlePress} disabled={!onTitlePress}>
            <View>
              <Typography variant="text-14-semibold" className="text-black">
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="text-12-regular"
                  className="text-gray-600"
                >
                  {subtitle}
                </Typography>
              )}
            </View>
          </Pressable>
          {shouldShowContent && (
            <Animated.View
              entering={FadeInDown.springify()
                .damping(15)
                .stiffness(150)
                .duration(300)}
              exiting={FadeOutUp.springify()
                .damping(15)
                .stiffness(150)
                .duration(250)}
              style={{ overflow: "hidden" }}
            >
              <View collapsable={false}>
                <View className="gap-2">
                  {children}
                  {navigationButtons && <View>{navigationButtons}</View>}
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
};
