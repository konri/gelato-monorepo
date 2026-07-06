import type { ComponentProps, ReactNode } from 'react';
import type { Typography } from '@/components/atoms/Typography';

export type GradientPillTypographyVariant = NonNullable<
  ComponentProps<typeof Typography>['variant']
>;

export type GradientPillButtonSize = 'default' | 'small';

export type GradientPillButtonProps = {
  title: string;
  onPress?: () => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: GradientPillButtonSize;
  textVariant?: GradientPillTypographyVariant;
  className?: string;
};
