import React from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CustomSafeAreaViewProps = ViewProps & {
  topOffset?: number;
  omitBottomInset?: boolean;
};

export const CustomSafeAreaView = ({
  topOffset = 0,
  omitBottomInset = false,
  style,
  ...props
}: CustomSafeAreaViewProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        style,
        {
          paddingTop: insets.top + topOffset,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: omitBottomInset ? 0 : insets.bottom,
        },
      ]}
      {...props}
    />
  );
};
