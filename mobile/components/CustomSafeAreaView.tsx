import React from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {View} from 'react-native';
import { twMerge } from 'tailwind-merge';

export const CustomSafeAreaView = (props: any) => {
  const insets = useSafeAreaInsets();
  const { topOffset = 0, className = '', omitBottomInset = false, ...otherProps } = props;


    return (
    <View
      {...otherProps}
      className={twMerge('flex-1 bg-background-gray', className)}
      style={[
        props.style,
        {
          paddingTop: insets.top + topOffset,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: omitBottomInset ? 0 : insets.bottom,
        }
      ]}
    >
      {props.children}
    </View>
  );
};