import { View, type ViewProps } from 'react-native';
import { useBreakpoint } from '@/hooks/useBreakpoint';

type Props = ViewProps & {
  /** Max content width on wide screens (default 720 — comfortable for forms/lists). */
  maxWidth?: number;
};

/**
 * Centers content and caps its width on tablet/web so it doesn't stretch
 * edge-to-edge. On phones it's a transparent passthrough (full-bleed).
 */
export function ResponsiveContainer({ maxWidth = 720, style, children, ...rest }: Props) {
  const { isWide } = useBreakpoint();

  if (!isWide) {
    return (
      <View style={style} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <View style={[{ width: '100%', alignItems: 'center' }, style]} {...rest}>
      <View style={{ width: '100%', maxWidth }}>{children}</View>
    </View>
  );
}
