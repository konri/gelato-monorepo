import { CustomSafeAreaView } from '@/components/CustomSafeAreaView';
import React from 'react';
import { View } from 'react-native';
import type { TabScreenWrapperProps } from './types';

export const TabScreenWrapper = ({
  omitSafeAreaBottom = true,
  children,
  className = '',
  style,
  ...props
}: TabScreenWrapperProps) => {
  return (
    <CustomSafeAreaView
      className={`flex-1 bg-background-gray ${className}`}
      omitBottomInset={omitSafeAreaBottom}
    >
      <View
        className="flex-1 bg-background-gray"
        style={[style]}
        {...props}
      >
        {children}
      </View>
    </CustomSafeAreaView>
  );
};
