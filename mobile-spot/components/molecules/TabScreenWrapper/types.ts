import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type TabScreenWrapperProps = ViewProps & {
  omitSafeAreaBottom?: boolean;
  children: ReactNode;
};
