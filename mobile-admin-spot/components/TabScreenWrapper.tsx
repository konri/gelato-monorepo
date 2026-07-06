import { CustomSafeAreaView } from "@/components/CustomSafeAreaView";
import { HeaderWithBackButton } from "@/components/HeaderWithBackButton";
import { SCREEN_PADDING_CLASS } from "@/constants/layout";
import { useTabBarInset } from "@/hooks/useTabBarInset";
import React from "react";
import { View, ViewProps } from "react-native";

type TabScreenWrapperProps = ViewProps & {
  showHeader?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  noPadding?: boolean;
  withTabBarInset?: boolean;
  omitSafeAreaBottom?: boolean;
  children: React.ReactNode;
};

export const TabScreenWrapper = ({
  showHeader = false,
  showBackButton = false,
  onBack,
  noPadding = false,
  withTabBarInset = true,
  omitSafeAreaBottom = false,
  children,
  className = "",
  style,
  ...props
}: TabScreenWrapperProps) => {
  const paddingClass = noPadding ? "" : SCREEN_PADDING_CLASS;
  const tabBarInset = useTabBarInset();

  const content = (
    <>
      {showHeader && (
        <HeaderWithBackButton
          showBackButton={showBackButton}
          onBack={onBack}
        />
      )}
      <View
        className={`flex-1 bg-gray-50-light ${paddingClass}`}
        style={[withTabBarInset ? { paddingBottom: tabBarInset } : undefined, style]}
        {...props}
      >
        {children}
      </View>
    </>
  );

  return (
    <CustomSafeAreaView
      className={`flex-1 bg-gray-50-light ${className}`}
      omitBottomInset={omitSafeAreaBottom}
    >
      {content}
    </CustomSafeAreaView>
  );
};
