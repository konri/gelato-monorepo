import type { ComponentProps, ReactNode } from 'react';
import type { GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

export type MapBottomSheetPanGesture = NonNullable<
  ComponentProps<typeof GestureDetector>['gesture']
>;

export type MapBottomSheetLayoutMode = 'screen' | 'intrinsic';

export type MapBottomSheetSurfaceProps = {
  translateY: SharedValue<number>;
  panGesture?: MapBottomSheetPanGesture;
  topAccessory?: ReactNode;
  children: ReactNode;
  layoutMode?: MapBottomSheetLayoutMode;
};
